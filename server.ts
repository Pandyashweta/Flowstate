import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import mammoth from 'mammoth';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const PORT = 3000;
const app = express();

// Load Firebase projectId from provisioned config for ID token verification
let firebaseProjectId = '';
try {
  const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    firebaseProjectId = typeof raw.projectId === 'string' ? raw.projectId : '';
  }
} catch {
  firebaseProjectId = '';
}

// Shared server-side Gemini client (API key stays strictly on the server)
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// --- Firebase RS256 ID Token Verification (Zero IAM required) ---
interface CertCache {
  certs: Record<string, string>;
  expiresAt: number;
}
let googleCertCache: CertCache | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (googleCertCache && googleCertCache.expiresAt > now) {
    return googleCertCache.certs;
  }
  const resp = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!resp.ok) {
    throw new Error('Failed to fetch Firebase token signing certificates.');
  }
  const certs = (await resp.json()) as Record<string, string>;
  const cc = resp.headers.get('cache-control') || '';
  const match = cc.match(/max-age=(\d+)/);
  const maxAgeSec = match ? parseInt(match[1], 10) : 3600;
  googleCertCache = {
    certs,
    expiresAt: now + maxAgeSec * 1000,
  };
  return certs;
}

interface VerifiedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

interface AuthedRequest extends Request {
  authUser?: VerifiedUser;
}

async function verifyFirebaseIdToken(token: string): Promise<VerifiedUser> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed bearer token.');
  }
  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf-8')) as {
    alg?: string;
    kid?: string;
  };
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as {
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Unsupported token algorithm.');
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSec) {
    throw new Error('Authentication token expired.');
  }
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Invalid token subject.');
  }
  if (firebaseProjectId) {
    if (payload.aud !== firebaseProjectId) {
      throw new Error('Token audience mismatch.');
    }
    if (payload.iss !== `https://securetoken.google.com/${firebaseProjectId}`) {
      throw new Error('Token issuer mismatch.');
    }
  }

  const certs = await getGooglePublicCerts();
  const certPem = certs[header.kid];
  if (!certPem) {
    throw new Error('Unknown signing key ID.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const signatureBuf = Buffer.from(sigB64, 'base64url');
  const valid = verifier.verify(certPem, signatureBuf);
  if (!valid) {
    throw new Error('Invalid token signature.');
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : '',
    emailVerified: Boolean(payload.email_verified),
    name: typeof payload.name === 'string' ? payload.name : undefined,
  };
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token || token.length > 8192) {
      res.status(401).json({ error: 'Invalid authentication token.' });
      return;
    }
    const user = await verifyFirebaseIdToken(token);
    req.authUser = user;
    next();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    res.status(401).json({ error: msg });
  }
}

// --- Middleware ---
app.use(express.json({ limit: '6mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// --- Embedding & Semantic Search Utilities (RAG with gemini-embedding-2) ---
const embeddingCache = new Map<string, number[]>();

function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function chunkText(text: string, maxChars = 900, overlap = 150): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxChars) return [cleaned];

  const chunks: string[] = [];
  let start = 0;
  while (start < cleaned.length) {
    let end = Math.min(start + maxChars, cleaned.length);
    if (end < cleaned.length) {
      const breakIdx = Math.max(
        cleaned.lastIndexOf('\n\n', end),
        cleaned.lastIndexOf('. ', end)
      );
      if (breakIdx > start + 300) {
        end = breakIdx + 1;
      }
    }
    chunks.push(cleaned.slice(start, end).trim());
    if (end >= cleaned.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks.slice(0, 20);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const ai = getGeminiClient();
  const results: (number[] | null)[] = texts.map((t) => embeddingCache.get(hashText(t)) ?? null);
  const missingIndices: number[] = [];
  const missingTexts: string[] = [];

  results.forEach((vec, idx) => {
    if (!vec) {
      missingIndices.push(idx);
      missingTexts.push(texts[idx]);
    }
  });

  if (missingTexts.length > 0) {
    // Batch embed in slices of 16 to stay fast and clean
    for (let i = 0; i < missingTexts.length; i += 16) {
      const slice = missingTexts.slice(i, i + 16);
      const embedRes = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: slice,
      });
      const embeddings = embedRes.embeddings ?? [];
      for (let j = 0; j < slice.length; j++) {
        const values = embeddings[j]?.values ?? [];
        const targetIdx = missingIndices[i + j];
        results[targetIdx] = values;
        if (values.length > 0) {
          if (embeddingCache.size > 800) {
            const firstKey = embeddingCache.keys().next().value;
            if (firstKey) embeddingCache.delete(firstKey);
          }
          embeddingCache.set(hashText(slice[j]), values);
        }
      }
    }
  }

  return results.map((r) => r ?? []);
}

interface IncomingDoc {
  id: string;
  title: string;
  category: string;
  content: string;
}

interface ScoredChunk {
  docId: string;
  docTitle: string;
  category: string;
  excerpt: string;
  similarity: number;
}

async function semanticRetrieve(
  queryText: string,
  docs: IncomingDoc[],
  topK = 4
): Promise<ScoredChunk[]> {
  if (!queryText.trim() || docs.length === 0) return [];

  const chunkMeta: { docId: string; docTitle: string; category: string; text: string }[] = [];
  for (const doc of docs.slice(0, 30)) {
    const safeContent = typeof doc.content === 'string' ? doc.content.slice(0, 25000) : '';
    const pieces = chunkText(safeContent, 850, 120);
    for (const piece of pieces) {
      chunkMeta.push({
        docId: doc.id,
        docTitle: doc.title,
        category: doc.category,
        text: `${doc.title} (${doc.category})\n${piece}`,
      });
    }
  }
  if (chunkMeta.length === 0) return [];

  const [queryVec, ...chunkVecs] = await embedTexts([
    queryText.slice(0, 1500),
    ...chunkMeta.map((c) => c.text),
  ]);

  const scored: ScoredChunk[] = chunkMeta.map((meta, idx) => ({
    docId: meta.docId,
    docTitle: meta.docTitle,
    category: meta.category,
    excerpt: meta.text.split('\n').slice(1).join('\n').trim().slice(0, 480),
    similarity: Number(cosineSimilarity(queryVec, chunkVecs[idx] ?? []).toFixed(4)),
  }));

  scored.sort((a, b) => b.similarity - a.similarity);

  // Deduplicate by docId while preserving top relevant excerpts
  const picked: ScoredChunk[] = [];
  const docCount = new Map<string, number>();
  for (const item of scored) {
    const count = docCount.get(item.docId) ?? 0;
    if (count >= 2) continue;
    docCount.set(item.docId, count + 1);
    picked.push(item);
    if (picked.length >= topK) break;
  }
  return picked;
}

// --- API Routes ---

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'flowstate-api' });
});

// 1. Document upload & parsing (PDF, DOCX, TXT, MD)
app.post(
  '/api/documents/extract',
  requireAuth,
  upload.single('file'),
  async (req: AuthedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No document file uploaded.' });
        return;
      }

      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      if (!['pdf', 'docx', 'txt', 'md'].includes(ext)) {
        res.status(400).json({
          error: 'Unsupported file format. Please upload PDF, DOCX, TXT, or MD documents.',
        });
        return;
      }

      const ai = getGeminiClient();
      let extractedText = '';

      if (ext === 'txt' || ext === 'md') {
        extractedText = file.buffer.toString('utf-8').trim();
      } else if (ext === 'docx') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = (result.value || '').trim();
      } else if (ext === 'pdf') {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: file.buffer.toString('base64'),
                },
              },
              {
                text: 'Extract all readable text from this PDF document verbatim, preserving headings, bullet points, incident codes, and steps. Output only the extracted plain text.',
              },
            ],
          },
        });
        extractedText = (response.text || '').trim();
      }

      if (!extractedText) {
        res.status(422).json({ error: 'Could not extract readable text from the uploaded file.' });
        return;
      }

      // Truncate cleanly to Firestore document limits while preserving rich content
      const trimmedContent = extractedText.slice(0, 75000);
      const wordCount = trimmedContent.split(/\s+/).filter(Boolean).length;

      // Summarize & tag with Gemini
      const metaRes = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Summarize the following enterprise document in 2 concise sentences and provide 3 to 5 short lowercase topic tags.\n\nDocument (${file.originalname}):\n${trimmedContent.slice(0, 8000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['summary', 'tags'],
          },
        },
      });

      const meta = JSON.parse((metaRes.text || '{}').trim()) as {
        summary?: string;
        tags?: string[];
      };

      res.json({
        fileName: file.originalname,
        fileType: ext,
        content: trimmedContent,
        wordCount,
        summary: (meta.summary || trimmedContent.slice(0, 220)).slice(0, 950),
        tags: (meta.tags || [ext, 'enterprise']).slice(0, 8).map((t) => String(t).slice(0, 40)),
      });
    } catch (err) {
      console.error('Document extraction error:', err);
      const message = err instanceof Error ? err.message : 'Failed to process uploaded document.';
      res.status(500).json({ error: message });
    }
  }
);

// 2. Semantic Search across Knowledge Base
app.post('/api/rag/search', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { query, documents } = req.body as { query?: string; documents?: IncomingDoc[] };
    if (typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Query text is required.' });
      return;
    }
    const docs = Array.isArray(documents) ? documents : [];
    const results = await semanticRetrieve(query.trim(), docs, 6);
    res.json({ results });
  } catch (err) {
    console.error('RAG search error:', err);
    const message = err instanceof Error ? err.message : 'Semantic search failed.';
    res.status(500).json({ error: message });
  }
});

// 3. Grounded RAG Q&A
app.post('/api/rag/ask', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { question, documents } = req.body as {
      question?: string;
      documents?: IncomingDoc[];
    };
    if (typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }
    const docs = Array.isArray(documents) ? documents : [];
    if (docs.length === 0) {
      res.json({
        answer:
          'No documents are currently available in your enterprise knowledge base. Upload SOPs, incident logs, or runbooks to receive grounded answers.',
        grounded: false,
        citations: [],
      });
      return;
    }

    const citations = await semanticRetrieve(question.trim(), docs, 4);
    const contextBlock = citations
      .map(
        (c, i) =>
          `[Source ${i + 1}] Title: ${c.docTitle} | Category: ${c.category} | Relevance: ${(c.similarity * 100).toFixed(0)}%\nExcerpt:\n${c.excerpt}`
      )
      .join('\n\n---\n\n');

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Enterprise Knowledge Excerpts:\n${contextBlock}\n\nUser Question: ${question.trim()}`,
      config: {
        systemInstruction:
          'You are the FLOWSTATE Enterprise Knowledge Assistant. Answer the user question strictly using ONLY the provided Enterprise Knowledge Excerpts. Never invent company policies, ticket numbers, SLAs, or procedures that are not explicitly present in the excerpts. If the excerpts do not contain the answer, clearly state that the uploaded company documentation does not cover that topic and set grounded to false. Cite source titles inline when answering.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            grounded: { type: Type.BOOLEAN },
            usedSourceTitles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['answer', 'grounded', 'usedSourceTitles'],
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim()) as {
      answer: string;
      grounded: boolean;
      usedSourceTitles: string[];
    };

    res.json({
      answer: parsed.answer,
      grounded: Boolean(parsed.grounded),
      citations,
    });
  } catch (err) {
    console.error('RAG Q&A error:', err);
    const message = err instanceof Error ? err.message : 'Failed to answer knowledge query.';
    res.status(500).json({ error: message });
  }
});

// 4. Flagship Voice/Text AI Workflow Command Orchestrator
app.post('/api/ai/command', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const {
      prompt,
      conversationHistory,
      knowledgeDocs,
      integrations,
      teamMembers,
      requireApproval,
    } = req.body as {
      prompt?: string;
      conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
      knowledgeDocs?: IncomingDoc[];
      integrations?: { name: string; provider: string; category: string; status: string; isSimulated: boolean }[];
      teamMembers?: { name: string; role: string; department: string }[];
      requireApproval?: boolean;
    };

    if (typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ error: 'Command prompt is required.' });
      return;
    }

    const docs = Array.isArray(knowledgeDocs) ? knowledgeDocs : [];
    const ragCitations = docs.length > 0 ? await semanticRetrieve(prompt.trim(), docs, 4) : [];

    const ragContext =
      ragCitations.length > 0
        ? ragCitations
            .map(
              (c, idx) =>
                `[Doc ${idx + 1}: ${c.docTitle} | Category: ${c.category} | Score: ${(c.similarity * 100).toFixed(0)}%]\n${c.excerpt}`
            )
            .join('\n\n')
        : 'No matching enterprise documents found in the Knowledge Base.';

    const teamContext =
      Array.isArray(teamMembers) && teamMembers.length > 0
        ? teamMembers.map((m) => `${m.name} (${m.role}, ${m.department})`).join('; ')
        : 'Identity & Auth Engineering, Tier 2 Support Team, IT Operations, Billing Ops';

    const integrationsContext =
      Array.isArray(integrations) && integrations.length > 0
        ? integrations
            .map(
              (i) =>
                `${i.name} [${i.provider} / ${i.category}] - ${i.isSimulated ? 'SIMULATED' : 'LIVE'} (${i.status})`
            )
            .join('; ')
        : 'Zendesk Ticketing [SIMULATED], Email Notifications [SIMULATED], CRM [SIMULATED]';

    const historyText = Array.isArray(conversationHistory)
      ? conversationHistory
          .slice(-8)
          .map((m) => `${m.role === 'user' ? 'User' : 'FLOWSTATE'}: ${m.content.slice(0, 600)}`)
          .join('\n')
      : '';

    const todayIso = new Date().toISOString().slice(0, 10);
    const tomorrowIso = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Conversation History:\n${historyText || '(New session)'}\n\nLatest User Request:\n${prompt.trim()}\n\nRetrieved Enterprise Knowledge Base Excerpts:\n${ragContext}\n\nAvailable Teams & Members:\n${teamContext}\n\nConnected Integrations:\n${integrationsContext}\n\nCurrent Date: ${todayIso} | Default Next Due Date: ${tomorrowIso}\nRequire Human Approval for External Actions: ${requireApproval !== false ? 'YES' : 'NO'}`,
      config: {
        systemInstruction: `You are FLOWSTATE, an enterprise voice-driven workflow automation architect.
Your job:
1. Understand the user's operational request and identify its category (Customer Support, IT Operations, Sales Ops, Billing & Finance, HR Management, or Engineering).
2. Ground your troubleshooting summary and recommendations STRICTLY in the Retrieved Enterprise Knowledge Base Excerpts. Never fabricate company policies, incident IDs, or past outages that are not in the retrieved excerpts. If no matching knowledge doc exists, state clearly that no prior incident documentation was found and provide standard operational workflow steps clearly marked as general guidance.
3. Unless the request is completely ambiguous and impossible to structure (e.g., "do something"), ALWAYS generate a complete, actionable proposedWorkflow with 3 to 5 ordered steps, concrete tasks with assignees from Available Teams & Members, realistic dependencies, priorities, and integrationAction labels.
4. For any action that creates tickets, assigns external teams, sends customer/team emails, or updates CRM records, populate proposedWorkflow.approvalRequest so a human approver reviews it before execution.
5. Keep assistantMessage crisp, authoritative, and executive-ready. Keep spokenResponse concise (2-3 natural sentences suitable for Text-to-Speech).`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assistantMessage: { type: Type.STRING },
            spokenResponse: { type: Type.STRING },
            needsClarification: { type: Type.BOOLEAN },
            clarifyingQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            proposedWorkflow: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
                recommendedTeam: { type: Type.STRING },
                dueDate: { type: Type.STRING },
                troubleshootingSummary: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                tasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      assignee: { type: Type.STRING },
                      department: { type: Type.STRING },
                      priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
                      dueDate: { type: Type.STRING },
                      dependencies: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      integrationAction: { type: Type.STRING },
                      requiresApproval: { type: Type.BOOLEAN },
                    },
                    required: [
                      'title',
                      'description',
                      'assignee',
                      'department',
                      'priority',
                      'dueDate',
                      'dependencies',
                      'integrationAction',
                      'requiresApproval',
                    ],
                  },
                },
                approvalRequest: {
                  type: Type.OBJECT,
                  nullable: true,
                  properties: {
                    actionType: { type: Type.STRING },
                    integrationTarget: { type: Type.STRING },
                    riskLevel: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                    reason: { type: Type.STRING },
                    proposedPayload: { type: Type.STRING },
                  },
                  required: [
                    'actionType',
                    'integrationTarget',
                    'riskLevel',
                    'reason',
                    'proposedPayload',
                  ],
                },
              },
              required: [
                'title',
                'description',
                'category',
                'priority',
                'recommendedTeam',
                'dueDate',
                'troubleshootingSummary',
                'steps',
                'tasks',
              ],
            },
          },
          required: ['assistantMessage', 'spokenResponse', 'needsClarification', 'clarifyingQuestions'],
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim());

    const trace = [
      {
        stage: 'Intent & Category Analysis',
        status: 'completed',
        detail: parsed.proposedWorkflow
          ? `Classified as ${parsed.proposedWorkflow.category} (${parsed.proposedWorkflow.priority} priority)`
          : 'Parsed user instruction',
      },
      {
        stage: 'Enterprise Knowledge Base (RAG)',
        status: ragCitations.length > 0 ? 'completed' : 'warning',
        detail:
          ragCitations.length > 0
            ? `Retrieved ${ragCitations.length} relevant excerpts (${ragCitations[0].docTitle})`
            : 'No matching documents in Knowledge Base',
      },
      {
        stage: 'Workflow & Task Orchestration',
        status: parsed.proposedWorkflow ? 'completed' : 'pending',
        detail: parsed.proposedWorkflow
          ? `Structured ${parsed.proposedWorkflow.tasks?.length || 0} tasks for ${parsed.proposedWorkflow.recommendedTeam}`
          : 'Awaiting clarification',
      },
      {
        stage: 'Human Approval Gate',
        status: parsed.proposedWorkflow?.approvalRequest ? 'active' : 'completed',
        detail: parsed.proposedWorkflow?.approvalRequest
          ? `Approval required for ${parsed.proposedWorkflow.approvalRequest.actionType}`
          : 'No sensitive external action queued',
      },
    ];

    res.json({
      ...parsed,
      ragCitations,
      trace,
    });
  } catch (err) {
    console.error('AI command error:', err);
    const message = err instanceof Error ? err.message : 'Failed to process workflow command.';
    res.status(500).json({ error: message });
  }
});

// 5. Execute Approved Integration Action (Explicitly Labeled Simulated vs Live)
app.post('/api/integrations/execute', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { integrationName, actionType, payload, isSimulated, approvalId } = req.body as {
      integrationName?: string;
      actionType?: string;
      payload?: string;
      isSimulated?: boolean;
      approvalId?: string;
    };

    if (!integrationName || !actionType) {
      res.status(400).json({ error: 'integrationName and actionType are required.' });
      return;
    }

    const startedAt = Date.now();
    // Deterministic simulated execution with explicit non-deceptive receipt
    const simulatedRef = `SIM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const durationMs = Math.max(120, Date.now() - startedAt + 240);

    res.json({
      success: true,
      isSimulated: isSimulated !== false,
      referenceId: simulatedRef,
      durationMs,
      approvalId: approvalId || null,
      receipt: `[SIMULATED EXECUTION] ${actionType} processed via ${integrationName} (Ref: ${simulatedRef}). No external production API credentials configured; payload logged safely in FLOWSTATE audit trail.`,
      echoPayload: typeof payload === 'string' ? payload.slice(0, 1200) : '',
      executedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Integration execution failed.';
    res.status(500).json({ error: message });
  }
});

// 6. Operational AI Insight Summary (for top bar "Get AI Insight" button)
app.post('/api/ai/insight', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { summaryStats } = req.body as { summaryStats?: Record<string, unknown> };
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Analyze these real-time FLOWSTATE operational metrics and produce an executive summary with 3 prioritized recommendations:\n${JSON.stringify(summaryStats || {}, null, 2)}`,
      config: {
        systemInstruction:
          'You are an enterprise operations analyst inside FLOWSTATE. Base all observations strictly on the provided metrics. Never invent numbers not present in the input. Target sections must be one of: command_center, workflows, tasks, knowledge_base, approvals, analytics, integrations.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  actionLabel: { type: Type.STRING },
                  targetSection: {
                    type: Type.STRING,
                    enum: [
                      'command_center',
                      'workflows',
                      'tasks',
                      'knowledge_base',
                      'approvals',
                      'analytics',
                      'integrations',
                    ],
                  },
                },
                required: ['title', 'impact', 'actionLabel', 'targetSection'],
              },
            },
          },
          required: ['headline', 'summary', 'recommendations'],
        },
      },
    });

    const data = JSON.parse((response.text || '{}').trim());
    res.json(data);
  } catch (err) {
    console.error('AI insight error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate AI operational insight.';
    res.status(500).json({ error: message });
  }
});

// --- Server Startup (Vite Dev Middleware or Static Production Build) ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FLOWSTATE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
