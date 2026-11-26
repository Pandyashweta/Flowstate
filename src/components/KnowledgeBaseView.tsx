import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  FileText,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { apiPostJson, apiUploadFile } from '../lib/api';
import { KnowledgeDoc, RagCitation } from '../types';

interface KnowledgeBaseViewProps {
  docs: KnowledgeDoc[];
  onSaveDoc: (input: {
    title: string;
    fileName: string;
    fileType: 'pdf' | 'docx' | 'txt' | 'md';
    category: string;
    content: string;
    summary: string;
    tags: string[];
    wordCount: number;
  }) => Promise<string | undefined>;
  onDeleteDoc: (docId: string) => Promise<void>;
}

const CATEGORIES = [
  'All',
  'Customer Support',
  'IT Operations',
  'Billing & Finance',
  'HR Management',
  'Sales Ops',
  'Security & Compliance',
];

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  docs,
  onSaveDoc,
  onDeleteDoc,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploadCategory, setUploadCategory] = useState('Customer Support');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual doc authoring
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState('Customer Support');
  const [manualContent, setManualContent] = useState('');

  // Semantic Search state
  const [semanticQuery, setSemanticQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RagCitation[] | null>(null);

  // Grounded RAG Q&A state
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [ragAnswer, setRagAnswer] = useState<{
    answer: string;
    grounded: boolean;
    citations: RagCitation[];
  } | null>(null);
  const [ragError, setRagError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredDocs = useMemo(() => {
    if (selectedCategory === 'All') return docs;
    return docs.filter((d) => d.category === selectedCategory);
  }, [docs, selectedCategory]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const extracted = await apiUploadFile<{
        fileName: string;
        fileType: 'pdf' | 'docx' | 'txt' | 'md';
        content: string;
        wordCount: number;
        summary: string;
        tags: string[];
      }>('/api/documents/extract', file);

      await onSaveDoc({
        title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
        fileName: extracted.fileName,
        fileType: extracted.fileType,
        category: uploadCategory,
        content: extracted.content,
        summary: extracted.summary,
        tags: extracted.tags,
        wordCount: extracted.wordCount,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Document upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) return;
    const words = manualContent.trim().split(/\s+/).filter(Boolean).length;
    await onSaveDoc({
      title: manualTitle.trim(),
      fileName: `${manualTitle.trim().toLowerCase().replace(/\s+/g, '_')}.txt`,
      fileType: 'txt',
      category: manualCategory,
      content: manualContent.trim(),
      summary: manualContent.trim().slice(0, 220),
      tags: [manualCategory.toLowerCase(), 'policy'],
      wordCount: words,
    });
    setManualTitle('');
    setManualContent('');
    setShowManualModal(false);
  };

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semanticQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    setRagError(null);
    try {
      const res = await apiPostJson<{ results: RagCitation[] }>('/api/rag/search', {
        query: semanticQuery.trim(),
        documents: docs.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          content: d.content,
        })),
      });
      setSearchResults(res.results);
    } catch (err) {
      setRagError(err instanceof Error ? err.message : 'Semantic search failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleAskRag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    setAsking(true);
    setRagError(null);
    try {
      const res = await apiPostJson<{
        answer: string;
        grounded: boolean;
        citations: RagCitation[];
      }>('/api/rag/ask', {
        question: question.trim(),
        documents: docs.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          content: d.content,
        })),
      });
      setRagAnswer(res);
    } catch (err) {
      setRagError(err instanceof Error ? err.message : 'RAG query failed.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 pb-8">
      {/* Left 7 Columns: Document Upload, Categories, Semantic Search & Library */}
      <div className="xl:col-span-7 space-y-5">
        {/* Upload & Authoring Bar */}
        <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#111111] dark:text-white">
                Enterprise Knowledge Library
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#737373]">
                Upload PDF, DOCX, or TXT runbooks for real Gemini semantic embeddings & RAG
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowManualModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#333333] text-xs font-medium text-[#404040] dark:text-[#E5E5E5] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Document</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-xl border border-dashed border-[#D4D4D4] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#161616]">
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616] text-[#404040] dark:text-[#E5E5E5]"
            >
              {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{uploading ? 'Extracting & Indexing...' : 'Upload PDF, DOCX, or TXT'}</span>
            </button>
          </div>

          {uploadError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              {uploadError}
            </div>
          )}
        </div>

        {/* Semantic Search Box */}
        <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5 space-y-4">
          <form onSubmit={handleSemanticSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                placeholder="Semantic vector search across internal docs (e.g., SAML certificate error)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#161616] text-xs text-[#111111] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 rounded-xl bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-medium cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {searching ? 'Searching...' : 'Semantic Search'}
            </button>
          </form>

          {searchResults && (
            <div className="space-y-2 pt-2 border-t border-[#E5E5E5] dark:border-[#262626]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#262626] dark:text-[#E5E5E5]">
                  Semantic Matches ({searchResults.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchResults(null);
                    setSemanticQuery('');
                  }}
                  className="text-[#111111] dark:text-white hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
              {searchResults.map((res, idx) => (
                <div
                  key={`${res.docId}-${idx}`}
                  className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-xs"
                >
                  <div className="flex items-center justify-between gap-2 font-semibold text-[#111111] dark:text-white">
                    <span>{res.docTitle}</span>
                    <span className="font-mono text-[#111111] dark:text-white tabular-nums">
                      {Math.round(res.similarity * 100)}% relevance
                    </span>
                  </div>
                  <p className="text-[#525252] dark:text-[#D4D4D4] mt-1 line-clamp-3">
                    {res.excerpt}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111]'
                    : 'bg-[#FAFAFA] dark:bg-[#161616] text-[#525252] dark:text-[#737373] hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Document Cards */}
          <div className="space-y-2.5">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] hover:border-[#A3A3A3] dark:hover:border-[#525252] transition-colors flex items-start justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  className="text-left flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#111111] dark:text-white shrink-0" />
                    <span className="text-sm font-semibold text-[#111111] dark:text-white truncate">
                      {doc.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#737373] dark:text-[#737373] mt-1 line-clamp-2">
                    {doc.summary}
                  </p>
                  <div className="mt-2 text-[11px] text-[#737373] font-mono">
                    {doc.category} · {doc.fileType.toUpperCase()} · {doc.wordCount} words
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void onDeleteDoc(doc.id)}
                  title="Delete document"
                  className="p-1.5 rounded-lg text-[#737373] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {filteredDocs.length === 0 && (
              <div className="py-10 text-center text-xs text-[#737373]">
                No documents in this category yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right 5 Columns: Grounded RAG Q&A Assistant */}
      <div className="xl:col-span-5 rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5 flex flex-col">
        <div className="pb-4 border-b border-[#E5E5E5] dark:border-[#262626] mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#111111] dark:text-white" />
            <h3 className="font-display text-base font-bold text-[#111111] dark:text-white">
              Grounded Knowledge Assistant (RAG)
            </h3>
          </div>
          <p className="text-xs text-[#737373] dark:text-[#737373] mt-1">
            Answers strictly from uploaded company documentation with inline source citations.
            Unsupported policies are never fabricated.
          </p>
        </div>

        <form onSubmit={handleAskRag} className="space-y-2.5 mb-4">
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about internal policies, past incidents, or SLAs..."
            className="w-full p-3 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#161616] text-xs text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {asking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Ask Knowledge Base</span>
            </button>
          </div>
        </form>

        {ragError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {ragError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4">
          {ragAnswer ? (
            <>
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  ragAnswer.grounded
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold mb-2 text-[#111111] dark:text-white">
                  {ragAnswer.grounded ? (
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  <span>
                    {ragAnswer.grounded
                      ? 'Grounded in Company Documents'
                      : 'Not Found in Uploaded Documentation'}
                  </span>
                </div>
                <p className="text-[#262626] dark:text-[#E5E5E5] whitespace-pre-wrap">
                  {ragAnswer.answer}
                </p>
              </div>

              {ragAnswer.citations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#262626] dark:text-[#E5E5E5]">
                    Source Excerpts ({ragAnswer.citations.length})
                  </div>
                  {ragAnswer.citations.map((cit, i) => (
                    <div
                      key={`${cit.docId}-${i}`}
                      className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 font-semibold text-[#111111] dark:text-white">
                        <span className="truncate">{cit.docTitle}</span>
                        <span className="font-mono text-[#111111] dark:text-white tabular-nums shrink-0">
                          {Math.round(cit.similarity * 100)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-[#737373] dark:text-[#737373] mt-1 whitespace-pre-wrap">
                        {cit.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-xs text-[#737373]">
              Submit a question above to query your enterprise knowledge base with Gemini semantic
              retrieval.
            </div>
          )}
        </div>
      </div>

      {/* Document Reader Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setSelectedDoc(null)}
          />
          <div className="relative z-10 w-full max-w-2xl max-h-[82vh] bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6 flex flex-col shadow-2xl">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5E5E5] dark:border-[#262626]">
              <div>
                <div className="text-xs font-mono text-[#111111] dark:text-white">
                  {selectedDoc.category} · {selectedDoc.fileName}
                </div>
                <h3 className="font-display text-base font-bold text-[#111111] dark:text-white mt-0.5">
                  {selectedDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="p-1 text-[#737373] hover:text-[#404040] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="mt-4 flex-1 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-[#404040] dark:text-[#D4D4D4] leading-relaxed bg-[#FAFAFA] dark:bg-[#161616] p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626]">
              {selectedDoc.content}
            </pre>
          </div>
        </div>
      )}

      {/* Manual Document Authoring Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setShowManualModal(false)}
          />
          <form
            onSubmit={handleSaveManual}
            className="relative z-10 w-full max-w-lg bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#111111] dark:text-white">
                Add Internal Policy or Runbook
              </h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-[#737373] hover:text-[#525252] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#525252] dark:text-[#D4D4D4] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g., API Rate Limit Escalation SOP"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#525252] dark:text-[#D4D4D4] mb-1">
                  Category
                </label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-[#525252] dark:text-[#D4D4D4] mb-1">
                  Document Content
                </label>
                <textarea
                  rows={8}
                  required
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste SOP steps, previous incident records, or SLA rules..."
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold cursor-pointer"
              >
                Save to Knowledge Base
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
