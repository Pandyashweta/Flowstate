import io
import json
import math
import os
import re
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from flask import Flask, jsonify, request
from PyPDF2 import PdfReader
from docx import Document as DocxDocument

try:
    import google.generativeai as genai
except ImportError:
    genai = None

app = Flask(__name__)

VALID_SECTIONS = {
    "command_center",
    "workflows",
    "tasks",
    "knowledge_base",
    "approvals",
    "analytics",
}

STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "this", "that", "these", "those", "it",
    "its", "as", "if", "into", "about", "what", "which", "who", "how", "when",
    "where", "why", "all", "any", "our", "your", "their", "my", "we", "you",
}


def get_gemini_api_key() -> Optional[str]:
    key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if not key or key == "MY_GEMINI_API_KEY":
        return None
    return key


def resolve_gemini_models(mode: str = "balanced") -> List[str]:
    env_model = (os.environ.get("GEMINI_MODEL") or "").strip()
    candidates: List[str] = []
    if env_model:
        candidates.append(env_model)
    if mode == "fast":
        candidates.extend(["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"])
    else:
        candidates.extend(["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"])
    seen = set()
    ordered: List[str] = []
    for m in candidates:
        if m and m not in seen:
            seen.add(m)
            ordered.append(m)
    return ordered


def call_gemini_text(
    prompt: str,
    system_instruction: Optional[str] = None,
    mode: str = "balanced",
    json_output: bool = False,
) -> Tuple[Optional[str], Optional[str]]:
    api_key = get_gemini_api_key()
    if not api_key or genai is None:
        return None, None

    genai.configure(api_key=api_key)
    for model_name in resolve_gemini_models(mode):
        try:
            gen_config: Dict[str, Any] = {"temperature": 0.3}
            if json_output:
                gen_config["response_mime_type"] = "application/json"
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction or None,
                generation_config=gen_config,
            )
            resp = model.generate_content(prompt)
            text = (getattr(resp, "text", None) or "").strip()
            if text:
                return text, model_name
        except Exception as exc:
            print(f"[python-backend] Gemini model {model_name} failed: {exc}", file=sys.stderr)
            continue
    return None, None


def tokenize(text: str) -> List[str]:
    tokens = re.findall(r"[a-z0-9]{2,}", (text or "").lower())
    return [t for t in tokens if t not in STOP_WORDS]


def chunk_text(text: str, chunk_size: int = 700, overlap: int = 120) -> List[str]:
    clean = re.sub(r"\s+", " ", (text or "").strip())
    if not clean:
        return []
    if len(clean) <= chunk_size:
        return [clean]
    chunks: List[str] = []
    start = 0
    while start < len(clean):
        end = min(len(clean), start + chunk_size)
        chunks.append(clean[start:end].strip())
        if end >= len(clean):
            break
        start = max(0, end - overlap)
    return chunks


def semantic_retrieve(query: str, documents: List[Dict[str, Any]], top_k: int = 4) -> List[Dict[str, Any]]:
    if not documents:
        return []
    q_tokens = tokenize(query)
    q_lower = (query or "").lower().strip()
    q_counts = Counter(q_tokens)

    all_chunks: List[Tuple[Dict[str, Any], str, List[str]]] = []
    doc_freq: Counter = Counter()

    for doc in documents:
        if not isinstance(doc, dict):
            continue
        content = str(doc.get("content") or doc.get("summary") or "")
        title = str(doc.get("title") or "Untitled Document")
        chunks = chunk_text(f"{title}. {content}")
        for ch in chunks:
            toks = tokenize(ch)
            all_chunks.append((doc, ch, toks))
            for t in set(toks):
                doc_freq[t] += 1

    if not all_chunks:
        return []

    total_chunks = len(all_chunks)
    scored: List[Tuple[float, Dict[str, Any], str]] = []

    for doc, ch, toks in all_chunks:
        if not toks:
            continue
        t_counts = Counter(toks)
        title = str(doc.get("title") or "Untitled Document")
        title_tokens = set(tokenize(title))

        score = 0.0
        for qt, qf in q_counts.items():
            tf = t_counts.get(qt, 0)
            if tf > 0:
                idf = math.log((total_chunks + 1) / (doc_freq.get(qt, 0) + 1)) + 1.0
                score += (1.0 + math.log(tf)) * idf * qf
            if qt in title_tokens:
                score += 1.5

        if q_lower and q_lower in ch.lower():
            score += 4.0

        # Normalize to [0.15, 0.99]
        if score > 0:
            norm_sim = min(0.99, round(0.35 + (1.0 - math.exp(-score / 6.0)) * 0.64, 3))
            scored.append((norm_sim, doc, ch))

    if not scored:
        # Return top document excerpts with baseline similarity when query has no keyword overlap
        fallback = []
        for doc in documents[:top_k]:
            if not isinstance(doc, dict):
                continue
            excerpt = str(doc.get("content") or doc.get("summary") or "")[:420].strip()
            if excerpt:
                fallback.append({
                    "docId": str(doc.get("id") or ""),
                    "docTitle": str(doc.get("title") or "Document"),
                    "category": str(doc.get("category") or "General"),
                    "similarity": 0.25,
                    "excerpt": excerpt,
                })
        return fallback

    scored.sort(key=lambda x: x[0], reverse=True)
    results: List[Dict[str, Any]] = []
    seen_docs = set()
    for sim, doc, ch in scored:
        doc_id = str(doc.get("id") or doc.get("title") or "")
        if doc_id in seen_docs and len(scored) > top_k:
            continue
        seen_docs.add(doc_id)
        results.append({
            "docId": str(doc.get("id") or ""),
            "docTitle": str(doc.get("title") or "Untitled Document"),
            "category": str(doc.get("category") or "General"),
            "similarity": sim,
            "excerpt": ch[:520],
        })
        if len(results) >= top_k:
            break
    return results


def extractive_summary_and_tags(text: str, ext: str) -> Tuple[str, List[str]]:
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text.strip()) if len(s.strip()) > 20]
    summary = " ".join(sentences[:2])[:500] if sentences else text.strip()[:260]
    counts = Counter(tokenize(text[:6000]))
    top_words = [w for w, _ in counts.most_common(5)]
    tags = list(dict.fromkeys([ext, *top_words]))[:6]
    return summary, tags


def sanitize_proposed_workflow(
    raw_wf: Any,
    default_domain: str,
    tomorrow_iso: str,
    require_approval: bool = True,
) -> Optional[Dict[str, Any]]:
    if not isinstance(raw_wf, dict):
        return None
    title = str(raw_wf.get("title") or "").strip()[:120]
    if not title:
        return None

    priority = str(raw_wf.get("priority") or "medium").lower()
    if priority not in {"low", "medium", "high", "critical"}:
        priority = "medium"

    raw_steps = raw_wf.get("steps") if isinstance(raw_wf.get("steps"), list) else []
    steps: List[Dict[str, Any]] = []
    for idx, st in enumerate(raw_steps[:8]):
        if not isinstance(st, dict):
            continue
        st_title = str(st.get("title") or f"Step {idx + 1}").strip()[:120]
        st_type = str(st.get("type") or "automated").lower()
        if st_type not in {"automated", "approval", "notification"}:
            st_type = "automated"
        steps.append({
            "title": st_title,
            "owner": str(st.get("owner") or f"{default_domain} Lead").strip()[:80],
            "type": st_type,
        })

    if not steps:
        steps = [
            {"title": "Intake & context validation", "owner": f"{default_domain} Lead", "type": "automated"},
            {"title": "Execute primary operational check", "owner": "Operations Specialist", "type": "automated"},
            {"title": "Human review & sign-off", "owner": "Operations Manager", "type": "approval"},
        ]

    raw_tasks = raw_wf.get("tasks") if isinstance(raw_wf.get("tasks"), list) else []
    tasks: List[Dict[str, Any]] = []
    for idx, tk in enumerate(raw_tasks[:8]):
        if not isinstance(tk, dict):
            continue
        tk_title = str(tk.get("title") or f"Action item {idx + 1}").strip()[:140]
        tk_prio = str(tk.get("priority") or priority).lower()
        if tk_prio not in {"low", "medium", "high", "critical"}:
            tk_prio = priority
        tasks.append({
            "title": tk_title,
            "assignee": str(tk.get("assignee") or f"{default_domain} Lead").strip()[:80],
            "priority": tk_prio,
            "dueDate": str(tk.get("dueDate") or tomorrow_iso)[:20],
        })

    if not tasks:
        tasks = [
            {
                "title": f"Review and initiate {title}",
                "assignee": f"{default_domain} Lead",
                "priority": priority,
                "dueDate": tomorrow_iso,
            }
        ]

    approval_req = raw_wf.get("approvalRequest")
    sanitized_approval = None
    if isinstance(approval_req, dict) and approval_req.get("actionType"):
        sanitized_approval = {
            "actionType": str(approval_req.get("actionType"))[:120],
            "targetSystem": str(approval_req.get("targetSystem") or "Flowstate Governance Gate")[:80],
            "payloadSummary": str(approval_req.get("payloadSummary") or f"Approve execution of {title}")[:300],
            "riskLevel": str(approval_req.get("riskLevel") or "medium").lower()
            if str(approval_req.get("riskLevel") or "").lower() in {"low", "medium", "high"}
            else "medium",
        }
    elif require_approval:
        sanitized_approval = {
            "actionType": f"Approve {title}",
            "targetSystem": "Flowstate Governance Gate",
            "payloadSummary": f"Human approval gate before executing {title} in {default_domain}.",
            "riskLevel": "high" if priority in {"high", "critical"} else "medium",
        }

    return {
        "title": title,
        "summary": str(raw_wf.get("summary") or f"Automated operational workflow for {default_domain}.")[:400],
        "category": str(raw_wf.get("category") or default_domain)[:80],
        "recommendedTeam": str(raw_wf.get("recommendedTeam") or default_domain)[:80],
        "priority": priority,
        "steps": steps,
        "tasks": tasks,
        **({"approvalRequest": sanitized_approval} if sanitized_approval else {}),
    }


def synthesize_local_workflow(
    prompt: str,
    domain: str,
    tomorrow_iso: str,
    rag_citations: List[Dict[str, Any]],
    team_members: List[Dict[str, Any]],
    require_approval: bool = True,
) -> Dict[str, Any]:
    clean_prompt = prompt.strip()
    lower = clean_prompt.lower()

    lead_name = f"{domain} Lead"
    reviewer_name = "Operations Manager"
    if team_members:
        lead_name = str(team_members[0].get("name") or lead_name)
        if len(team_members) > 1:
            reviewer_name = str(team_members[1].get("name") or reviewer_name)

    priority = "high" if any(w in lower for w in ("urgent", "critical", "outage", "incident", "escalation", "down", "p1")) else "medium"

    if "invoice" in lower or "billing" in lower or "payment" in lower:
        title = "Invoice Variance & Reconciliation Workflow"
        steps = [
            {"title": "Compare invoice line items against PO", "owner": lead_name, "type": "automated"},
            {"title": "Flag variance threshold & attach audit note", "owner": lead_name, "type": "automated"},
            {"title": "Finance Controller approval gate", "owner": reviewer_name, "type": "approval"},
            {"title": "Release approved reconciliation update", "owner": lead_name, "type": "notification"},
        ]
        tasks = [
            {"title": "Verify PO vs. vendor invoice discrepancy", "assignee": lead_name, "priority": priority, "dueDate": tomorrow_iso},
            {"title": "Document variance justification for audit trail", "assignee": reviewer_name, "priority": "medium", "dueDate": tomorrow_iso},
        ]
    elif "onboard" in lower or "new hire" in lower or "engineer" in lower:
        title = f"{domain} Onboarding & Access Provisioning"
        steps = [
            {"title": "Collect role profile & department requirements", "owner": lead_name, "type": "automated"},
            {"title": "Provision workspace access & runbook pack", "owner": lead_name, "type": "automated"},
            {"title": "Security & manager access sign-off", "owner": reviewer_name, "type": "approval"},
            {"title": "Notify team and schedule 30-day check-in", "owner": lead_name, "type": "notification"},
        ]
        tasks = [
            {"title": "Prepare workspace credentials & role permissions", "assignee": lead_name, "priority": priority, "dueDate": tomorrow_iso},
            {"title": "Share department SOPs and onboarding checklist", "assignee": reviewer_name, "priority": "medium", "dueDate": tomorrow_iso},
        ]
    elif "login" in lower or "auth" in lower or "sso" in lower or "support" in lower or "ticket" in lower or "escalat" in lower:
        title = "Enterprise Access & Incident Escalation"
        steps = [
            {"title": "Diagnose session, SSO, and account status", "owner": lead_name, "type": "automated"},
            {"title": "Cross-check incident runbooks for remediation", "owner": lead_name, "type": "automated"},
            {"title": "Lead approval before external escalation", "owner": reviewer_name, "type": "approval"},
            {"title": "Send resolution summary to stakeholder", "owner": lead_name, "type": "notification"},
        ]
        tasks = [
            {"title": "Inspect account diagnostics and error logs", "assignee": lead_name, "priority": priority, "dueDate": tomorrow_iso},
            {"title": "Verify resolution and close escalation ticket", "assignee": reviewer_name, "priority": "medium", "dueDate": tomorrow_iso},
        ]
    else:
        short_subject = re.sub(r"^(create|build|make|draft|generate|set up|design)\s+(a|an|the)?\s*(workflow\s+(for|to)\s+)?", "", clean_prompt, flags=re.I)
        short_subject = re.sub(r"\s+workflow$", "", short_subject.strip().rstrip(".!?"), flags=re.I)[:52].strip()
        title = f"{short_subject[:48].title()} Workflow" if short_subject else f"{domain} Operational Workflow"
        steps = [
            {"title": "Intake directive & validate parameters", "owner": lead_name, "type": "automated"},
            {"title": f"Execute {domain} operational checklist", "owner": lead_name, "type": "automated"},
            {"title": "Human-in-the-loop approval review", "owner": reviewer_name, "type": "approval"},
            {"title": "Log audit trail & notify stakeholders", "owner": lead_name, "type": "notification"},
        ]
        tasks = [
            {"title": f"Execute primary steps for {title}", "assignee": lead_name, "priority": priority, "dueDate": tomorrow_iso},
            {"title": "Review output and complete sign-off", "assignee": reviewer_name, "priority": "medium", "dueDate": tomorrow_iso},
        ]

    doc_note = f" Grounded in '{rag_citations[0]['docTitle']}'." if rag_citations else ""
    summary = f"Structured {domain} workflow generated for: {clean_prompt[:140]}.{doc_note}"

    return sanitize_proposed_workflow(
        {
            "title": title,
            "summary": summary,
            "category": domain,
            "recommendedTeam": domain,
            "priority": priority,
            "steps": steps,
            "tasks": tasks,
        },
        domain,
        tomorrow_iso,
        require_approval=require_approval,
    )


def classify_intent(prompt: str, force_workflow: bool) -> str:
    if force_workflow:
        return "create"
    lower = (prompt or "").strip().lower()
    create_triggers = (
        "create a ", "build a ", "make a ", "draft a ", "generate a ",
        "set up a ", "design a ", "workflow for ", "playbook for ",
        "sop for ", "checklist for ",
    )
    if any(t in lower for t in create_triggers):
        return "create"
    question_starts = (
        "what ", "which ", "who ", "how ", "when ", "where ", "why ",
        "list ", "show ", "check ", "do i ", "do we ", "are there ", "summarize",
    )
    if lower.endswith("?") or lower.startswith(question_starts):
        return "question"
    return "discussion"


@app.get("/api/py/health")
@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "flowstate-python-backend",
        "pythonVersion": sys.version.split()[0],
        "geminiConfigured": bool(get_gemini_api_key()),
        "capabilities": [
            "pdf_extract",
            "docx_extract",
            "rag_search",
            "rag_ask",
            "ai_command",
            "ai_generate_workflow",
            "ai_insight",
        ],
    })


@app.post("/api/py/documents/extract")
def extract_document():
    uploaded = request.files.get("file")
    if not uploaded or not uploaded.filename:
        return jsonify({"error": "No document file uploaded."}), 400

    filename = uploaded.filename
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in {"pdf", "docx", "txt", "md", "csv", "json"}:
        return jsonify({"error": "Unsupported file format. Please upload PDF, DOCX, TXT, MD, CSV, or JSON."}), 400

    raw_bytes = uploaded.read()
    extracted_text = ""

    if ext in {"txt", "md", "csv", "json"}:
        extracted_text = raw_bytes.decode("utf-8", errors="replace").strip()
    elif ext == "docx":
        try:
            doc = DocxDocument(io.BytesIO(raw_bytes))
            parts = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_vals = [cell.text.strip() for cell in row.cells if cell.text and cell.text.strip()]
                    if row_vals:
                        parts.append(" | ".join(row_vals))
            extracted_text = "\n".join(parts).strip()
        except Exception as exc:
            return jsonify({"error": f"Failed to parse DOCX: {exc}"}), 422
    elif ext == "pdf":
        try:
            reader = PdfReader(io.BytesIO(raw_bytes))
            pages = [(page.extract_text() or "").strip() for page in reader.pages]
            extracted_text = "\n\n".join(p for p in pages if p).strip()
        except Exception as exc:
            print(f"[python-backend] PyPDF2 extraction warning: {exc}", file=sys.stderr)
        if not extracted_text:
            extracted_text = (
                f"[PDF Document: {filename}]\n"
                f"Uploaded PDF ({len(raw_bytes) / 1024:.1f} KB). No embedded text layer detected."
            )

    if not extracted_text:
        return jsonify({"error": "Could not extract readable text from the uploaded file."}), 422

    trimmed = extracted_text[:75000]
    word_count = len(trimmed.split())
    summary, tags = extractive_summary_and_tags(trimmed, ext)

    # Optionally enhance summary/tags with Gemini if configured
    ai_meta_raw, _ = call_gemini_text(
        f'Summarize this enterprise document in 2 concise sentences and return JSON {{"summary": "...", "tags": ["tag1", "tag2", "tag3"]}}.\n\nDocument ({filename}):\n{trimmed[:8000]}',
        mode="fast",
        json_output=True,
    )
    if ai_meta_raw:
        try:
            meta = json.loads(ai_meta_raw)
            if isinstance(meta.get("summary"), str) and meta["summary"].strip():
                summary = meta["summary"].strip()
            if isinstance(meta.get("tags"), list) and meta["tags"]:
                tags = [str(t).strip()[:40] for t in meta["tags"][:8] if str(t).strip()]
        except Exception:
            pass

    return jsonify({
        "fileName": filename,
        "fileType": ext,
        "content": trimmed,
        "wordCount": word_count,
        "summary": summary[:950],
        "tags": tags[:8],
    })


@app.post("/api/py/rag/search")
def rag_search():
    body = request.get_json(silent=True) or {}
    query = str(body.get("query") or "").strip()
    if not query:
        return jsonify({"error": "Query text is required."}), 400
    docs = body.get("documents") if isinstance(body.get("documents"), list) else []
    top_k = int(body.get("topK") or 6)
    results = semantic_retrieve(query, docs, top_k=max(1, min(top_k, 12)))
    return jsonify({"results": results})


@app.post("/api/py/rag/ask")
def rag_ask():
    body = request.get_json(silent=True) or {}
    question = str(body.get("question") or "").strip()
    if not question:
        return jsonify({"error": "Question is required."}), 400
    docs = body.get("documents") if isinstance(body.get("documents"), list) else []
    if not docs:
        return jsonify({
            "answer": "No documents are currently available in your workspace knowledge base. Upload SOPs, incident logs, or runbooks to receive grounded answers.",
            "grounded": False,
            "citations": [],
        })

    citations = semantic_retrieve(question, docs, top_k=4)
    context_block = "\n\n---\n\n".join(
        f"[Source {i + 1}] Title: {c['docTitle']} | Category: {c['category']} | Relevance: {int(c['similarity'] * 100)}%\nExcerpt:\n{c['excerpt']}"
        for i, c in enumerate(citations)
    )

    ai_raw, _ = call_gemini_text(
        f'Enterprise Knowledge Excerpts:\n{context_block}\n\nUser Question: {question}\n\nReturn JSON: {{"answer": "...", "grounded": true, "usedSourceTitles": ["..."]}}',
        system_instruction="You are the FLOWSTATE Enterprise Knowledge Assistant. Answer strictly using ONLY the provided Enterprise Knowledge Excerpts. Cite source titles inline.",
        mode="balanced",
        json_output=True,
    )
    if ai_raw:
        try:
            parsed = json.loads(ai_raw)
            if isinstance(parsed.get("answer"), str) and parsed["answer"].strip():
                return jsonify({
                    "answer": parsed["answer"].strip(),
                    "grounded": bool(parsed.get("grounded", True)),
                    "citations": citations,
                })
        except Exception:
            pass

    # Grounded Python synthesis fallback
    top = citations[0]
    other_titles = [c["docTitle"] for c in citations[1:3] if c["docTitle"] != top["docTitle"]]
    extra_ref = f" Additional context is available in {', '.join(other_titles)}." if other_titles else ""
    answer = (
        f"Based on **{top['docTitle']}** ({int(top['similarity'] * 100)}% match): "
        f"{top['excerpt']}{extra_ref}"
    )
    return jsonify({
        "answer": answer,
        "grounded": True,
        "citations": citations,
    })


@app.post("/api/py/ai/command")
def ai_command():
    body = request.get_json(silent=True) or {}
    prompt = str(body.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": "Command prompt is required."}), 400

    domain = str(body.get("domain") or "General Operations").strip()[:80]
    model_mode = str(body.get("modelMode") or "balanced")
    force_workflow = bool(body.get("forceWorkflow"))
    require_approval = body.get("requireApproval", True) is not False
    docs = body.get("knowledgeDocs") if isinstance(body.get("knowledgeDocs"), list) else []
    team_members = body.get("teamMembers") if isinstance(body.get("teamMembers"), list) else []
    history = body.get("conversationHistory") if isinstance(body.get("conversationHistory"), list) else []
    ws_state = body.get("workspaceState") if isinstance(body.get("workspaceState"), dict) else {}

    tomorrow_iso = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    rag_citations = semantic_retrieve(prompt, docs, top_k=4) if docs else []

    rag_context = (
        "\n\n".join(f"[{c['docTitle']} | {int(c['similarity'] * 100)}%]\n{c['excerpt']}" for c in rag_citations)
        if rag_citations
        else "No matching documents in Knowledge Base."
    )
    wf_list = ws_state.get("workflows") or []
    task_list = ws_state.get("tasks") or []
    pending_approvals = int(ws_state.get("pendingApprovalsCount") or 0)
    ws_summary = (
        f"Workflows ({len(wf_list)}): " + (", ".join(f"{w.get('code', '')} {w.get('title', '')} [{w.get('status', '')}]" for w in wf_list[:8]) or "None") + "\n"
        f"Tasks ({len(task_list)}): " + (", ".join(f"{t.get('code', '')} {t.get('title', '')} [{t.get('status', '')}]" for t in task_list[:8]) or "None") + "\n"
        f"Pending Approvals: {pending_approvals}"
    )

    history_text = "\n".join(
        f"{m.get('role', 'user').upper()}: {str(m.get('content') or '')[:300]}"
        for m in history[-6:]
        if isinstance(m, dict)
    )

    gemini_prompt = (
        f"Domain: {domain}\n"
        f"Force Workflow Draft: {force_workflow}\n"
        f"Require Approval Gate: {require_approval}\n"
        f"Tomorrow ISO Date: {tomorrow_iso}\n\n"
        f"Workspace State:\n{ws_summary}\n\n"
        f"Knowledge Base Excerpts:\n{rag_context}\n\n"
        f"Recent Conversation:\n{history_text or 'None'}\n\n"
        f"User Directive: {prompt}\n\n"
        'Respond strictly in JSON with keys: "assistantMessage" (string), "spokenResponse" (string), '
        '"needsClarification" (boolean), "clarifyingQuestions" (array of strings), '
        '"hasWorkflow" (boolean), "proposedWorkflow" (object or null with title, summary, category, recommendedTeam, priority, steps, tasks, approvalRequest).'
    )

    raw_ai, used_model = call_gemini_text(
        gemini_prompt,
        system_instruction=f"You are FLOWSTATE AI, an enterprise operations assistant specializing in {domain}. Be concise, accurate, and grounded in the workspace state and knowledge excerpts.",
        mode=model_mode,
        json_output=True,
    )

    parsed: Optional[Dict[str, Any]] = None
    if raw_ai:
        try:
            parsed = json.loads(raw_ai)
        except Exception:
            parsed = {
                "assistantMessage": raw_ai,
                "spokenResponse": raw_ai[:240],
                "needsClarification": False,
                "clarifyingQuestions": [],
                "hasWorkflow": False,
            }

    if parsed:
        intent = classify_intent(prompt, force_workflow)
        sanitized_wf = (
            sanitize_proposed_workflow(parsed.get("proposedWorkflow"), domain, tomorrow_iso, require_approval)
            if (intent == "create" or (parsed.get("hasWorkflow") and intent != "question"))
            else None
        )
        if force_workflow and not sanitized_wf:
            sanitized_wf = synthesize_local_workflow(prompt, domain, tomorrow_iso, rag_citations, team_members, require_approval)
        assistant_msg = str(parsed.get("assistantMessage") or "Response ready.")
        spoken_msg = str(parsed.get("spokenResponse") or assistant_msg)[:500]
        clarifying = [str(q).strip() for q in (parsed.get("clarifyingQuestions") or []) if str(q).strip()]
        needs_clarification = bool(parsed.get("needsClarification"))
        model_label = used_model or "gemini-2.5-flash"
    else:
        # Local Python Operational AI Engine (works 100% offline / without API key)
        model_label = "flowstate-python-engine"
        needs_clarification = False
        clarifying = []
        intent = classify_intent(prompt, force_workflow)
        if intent == "create":
            sanitized_wf = synthesize_local_workflow(
                prompt, domain, tomorrow_iso, rag_citations, team_members, require_approval
            )
            doc_ref = f" Grounded in **{rag_citations[0]['docTitle']}**." if rag_citations else ""
            assistant_msg = (
                f"Prepared the **{sanitized_wf['title']}** workflow for **{sanitized_wf['recommendedTeam']}** "
                f"with {len(sanitized_wf['steps'])} steps and {len(sanitized_wf['tasks'])} tasks.{doc_ref} "
                "Review the draft below and click **Create Workflow** to commit it."
            )
            spoken_msg = f"Prepared {sanitized_wf['title']} with {len(sanitized_wf['steps'])} steps for {sanitized_wf['recommendedTeam']}."
        else:
            sanitized_wf = None
            open_tasks = [t for t in task_list if t.get("status") != "completed"]
            if rag_citations and any(w in prompt.lower() for w in ("doc", "runbook", "sop", "policy", "how", "what", "why", "check")):
                top = rag_citations[0]
                assistant_msg = (
                    f"From **{top['docTitle']}** ({int(top['similarity'] * 100)}% relevance):\n\n"
                    f"{top['excerpt']}\n\n"
                    f"Workspace context: {len(wf_list)} workflow(s), {len(open_tasks)} open task(s), and {pending_approvals} pending approval(s)."
                )
            elif intent == "discussion":
                assistant_msg = (
                    f"Got it - we can design a {domain} automation for that. "
                    "Would you like me to draft a structured workflow with approval gates, or first check your Knowledge Base runbooks? "
                    "You can also click **Generate Workflow** anytime to create the draft."
                )
            else:
                assistant_msg = (
                    f"**{domain} Status Summary:** You currently have **{len(wf_list)}** workflow(s), "
                    f"**{len(open_tasks)}** open task(s), and **{pending_approvals}** pending approval(s)."
                    + (f"\n\nRelevant Knowledge Base match: **{rag_citations[0]['docTitle']}** - {rag_citations[0]['excerpt'][:220]}" if rag_citations else "")
                    + "\n\nAsk me to draft a workflow, summarize a runbook, or inspect operational bottlenecks."
                )
            spoken_msg = assistant_msg.replace("*", "")[:320]

    trace = [
        {
            "stage": f"Python AI Engine ({model_label})",
            "status": "completed",
            "detail": f"Domain: {domain} · {len(history)} prior turn(s)",
        },
        {
            "stage": "Enterprise Knowledge Base (RAG)",
            "status": "completed" if rag_citations else "warning",
            "detail": (
                f"Grounded in {len(rag_citations)} excerpt(s) ({rag_citations[0]['docTitle']})"
                if rag_citations
                else "No matching documents in Knowledge Base"
            ),
        },
        {
            "stage": "Workflow & Task Orchestration",
            "status": "completed" if sanitized_wf else "pending",
            "detail": (
                f"Structured {len(sanitized_wf['tasks'])} task(s) & {len(sanitized_wf['steps'])} step(s) for {sanitized_wf['recommendedTeam']}"
                if sanitized_wf
                else "Conversational response (no workflow drafted)"
            ),
        },
        {
            "stage": "Human Approval Gate",
            "status": "active" if (sanitized_wf and sanitized_wf.get("approvalRequest")) else "completed",
            "detail": (
                f"Approval required for {sanitized_wf['approvalRequest']['actionType']}"
                if (sanitized_wf and sanitized_wf.get("approvalRequest"))
                else "No external approval gate needed"
            ),
        },
    ]

    return jsonify({
        "intent": intent,
        "assistantMessage": assistant_msg,
        "spokenResponse": spoken_msg,
        "needsClarification": needs_clarification,
        "clarifyingQuestions": clarifying,
        "proposedWorkflow": sanitized_wf,
        "modelUsed": model_label,
        "domain": domain,
        "ragCitations": rag_citations,
        "trace": trace,
    })


@app.post("/api/py/ai/generate-workflow")
def ai_generate_workflow():
    body = request.get_json(silent=True) or {}
    prompt = str(body.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": "Please describe the workflow you want to generate."}), 400

    domain = str(body.get("domain") or "General Operations").strip()[:80]
    model_mode = str(body.get("modelMode") or "balanced")
    require_approval = body.get("requireApproval", True) is not False
    docs = body.get("knowledgeDocs") if isinstance(body.get("knowledgeDocs"), list) else []
    team_members = body.get("teamMembers") if isinstance(body.get("teamMembers"), list) else []

    tomorrow_iso = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    rag_citations = semantic_retrieve(prompt, docs, top_k=3) if docs else []

    raw_ai, used_model = call_gemini_text(
        f"Generate a complete operational workflow in JSON for domain '{domain}': {prompt}\n"
        f"Tomorrow ISO: {tomorrow_iso}\nRequire approval: {require_approval}\n"
        'Return JSON with keys: "assistantMessage", "spokenResponse", "proposedWorkflow".',
        system_instruction="You are the FLOWSTATE Workflow Architect. Return valid JSON only.",
        mode=model_mode,
        json_output=True,
    )

    proposed_wf = None
    assistant_msg = ""
    spoken_msg = ""
    model_label = used_model or "flowstate-python-engine"

    if raw_ai:
        try:
            parsed = json.loads(raw_ai)
            proposed_wf = sanitize_proposed_workflow(parsed.get("proposedWorkflow"), domain, tomorrow_iso, require_approval)
            assistant_msg = str(parsed.get("assistantMessage") or "")
            spoken_msg = str(parsed.get("spokenResponse") or "")
        except Exception:
            proposed_wf = None

    if not proposed_wf:
        model_label = "flowstate-python-engine"
        proposed_wf = synthesize_local_workflow(prompt, domain, tomorrow_iso, rag_citations, team_members, require_approval)
        assistant_msg = f'Generated workflow "{proposed_wf["title"]}" for {domain}.'
        spoken_msg = f'Workflow {proposed_wf["title"]} is ready to review.'

    return jsonify({
        "assistantMessage": assistant_msg or f'Generated workflow "{proposed_wf["title"]}".',
        "spokenResponse": spoken_msg or f'Workflow {proposed_wf["title"]} is ready to review.',
        "proposedWorkflow": proposed_wf,
        "ragCitations": rag_citations,
        "modelUsed": model_label,
        "domain": domain,
    })


@app.post("/api/py/ai/insight")
def ai_insight():
    body = request.get_json(silent=True) or {}
    stats = body.get("summaryStats") if isinstance(body.get("summaryStats"), dict) else {}

    raw_ai, _ = call_gemini_text(
        f"Analyze these FLOWSTATE operational metrics and produce JSON with headline, summary, and 3 recommendations (each with title, impact, actionLabel, targetSection in {sorted(VALID_SECTIONS)}):\n{json.dumps(stats, indent=2)}",
        system_instruction="You are an enterprise operations analyst inside FLOWSTATE. Base all observations strictly on the provided metrics.",
        mode="balanced",
        json_output=True,
    )

    if raw_ai:
        try:
            parsed = json.loads(raw_ai)
            recs = []
            for r in (parsed.get("recommendations") or [])[:4]:
                if not isinstance(r, dict):
                    continue
                sec = str(r.get("targetSection") or "overview")
                if sec not in VALID_SECTIONS:
                    sec = "workflows"
                recs.append({
                    "title": str(r.get("title") or "Review Operations"),
                    "impact": str(r.get("impact") or ""),
                    "actionLabel": str(r.get("actionLabel") or "Open"),
                    "targetSection": sec,
                })
            if parsed.get("headline") and parsed.get("summary") and recs:
                return jsonify({
                    "headline": str(parsed["headline"]),
                    "summary": str(parsed["summary"]),
                    "recommendations": recs,
                })
        except Exception:
            pass

    # Deterministic Python operational insight analyzer
    total_wf = int(stats.get("totalWorkflows") or 0)
    active_wf = int(stats.get("activeWorkflows") or 0)
    open_tasks = int(stats.get("openTasks") or 0)
    completed_tasks = int(stats.get("completedTasks") or 0)
    pending_approvals = int(stats.get("pendingApprovals") or 0)
    total_docs = int(stats.get("knowledgeDocs") or stats.get("documentsCount") or 0)

    headline = (
        f"{pending_approvals} Approval Gate(s) Pending Review"
        if pending_approvals > 0
        else f"{active_wf} Active Workflow(s) Running Across Operations"
        if active_wf > 0
        else "Workspace Ready for AI Workflow Orchestration"
    )
    summary = (
        f"Your workspace currently tracks {total_wf} workflow(s) ({active_wf} active), "
        f"{open_tasks} open task(s) ({completed_tasks} completed), {pending_approvals} pending approval(s), "
        f"and {total_docs} knowledge document(s)."
    )

    recommendations = [
        {
            "title": "Resolve Pending Approvals" if pending_approvals > 0 else "Launch AI Command Center",
            "impact": (
                f"{pending_approvals} queued item(s) require human sign-off before execution."
                if pending_approvals > 0
                else "Use natural language or voice to draft and route your next operational workflow."
            ),
            "actionLabel": "Review Approvals" if pending_approvals > 0 else "Open Command Center",
            "targetSection": "approvals" if pending_approvals > 0 else "command_center",
        },
        {
            "title": "Prioritize Open Tasks" if open_tasks > 0 else "Create Operational Workflow",
            "impact": (
                f"{open_tasks} open task(s) are awaiting completion across active queues."
                if open_tasks > 0
                else "Structure repeatable steps and owners for your team."
            ),
            "actionLabel": "View Tasks" if open_tasks > 0 else "Open Workflows",
            "targetSection": "tasks" if open_tasks > 0 else "workflows",
        },
        {
            "title": "Expand Grounded Knowledge Base" if total_docs < 2 else "Inspect Operational Analytics",
            "impact": (
                "Upload PDF, DOCX, or Markdown runbooks so AI responses cite your exact SOPs."
                if total_docs < 2
                else "Review throughput, completion rates, and audit logs."
            ),
            "actionLabel": "Upload Runbooks" if total_docs < 2 else "View Analytics",
            "targetSection": "knowledge_base" if total_docs < 2 else "analytics",
        },
    ]

    return jsonify({
        "headline": headline,
        "summary": summary,
        "recommendations": recommendations,
    })


if __name__ == "__main__":
    port = int(os.environ.get("PYTHON_BACKEND_PORT", "5001"))
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False)
