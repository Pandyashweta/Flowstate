import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Globe,
  Lock,
  Mail,
  MessageSquare,
  Mic,
  Pause,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';

interface PublicWebsiteProps {
  onSignIn: () => void;
  onRegister: () => void;
  onInstallPwa: () => void;
  canInstall: boolean;
}

const WALKTHROUGH_CHAPTERS = [
  {
    id: 0,
    tag: '01 · Voice & Text Command',
    title: 'Speak naturally in the AI Command Center',
    caption:
      'Gemini Live captures multilingual voice or text instructions and parses multi-step operational intent in real time.',
    prompt:
      '"Audit Q4 access logs, create remediation tasks for Engineering, and route production changes for approval."',
    aiStatus: 'Parsing intent & identifying workspace entities',
    badge: 'Gemini Live Active',
    progress: 33,
    tasks: [
      { code: 'FLW-101', label: 'Parse spoken instruction', status: 'Done' },
      { code: 'FLW-102', label: 'Detect workspace context', status: 'Active' },
    ],
  },
  {
    id: 1,
    tag: '02 · Grounded RAG & Structuring',
    title: 'Retrieves your playbooks & drafts workflows',
    caption:
      'Queries uploaded PDF, DOCX, and TXT runbooks to construct ordered workflow steps and department assignments.',
    prompt:
      'Matched 2 internal runbooks · Drafted 3 ordered workflow steps & assigned owners.',
    aiStatus: 'Grounded in workspace Knowledge Base',
    badge: 'RAG Verified',
    progress: 66,
    tasks: [
      { code: 'KB-04', label: 'Security_Runbook_2026.pdf', status: 'Cited' },
      { code: 'TSK-18', label: 'Assign Engineering owner', status: 'Drafted' },
    ],
  },
  {
    id: 2,
    tag: '03 · Approval & Execution',
    title: 'Human-in-the-loop sign-off & immutable audit',
    caption:
      'Sensitive actions pause in the Approvals Queue for Owner/Admin authorization before executing with full audit export.',
    prompt:
      'Approval granted by Owner · Workflow executed · Audit log exported (CSV / JSON).',
    aiStatus: 'Executed & recorded to audit trail',
    badge: 'RBAC Enforced',
    progress: 100,
    tasks: [
      { code: 'APR-09', label: 'Owner sign-off verified', status: 'Approved' },
      { code: 'AUD-42', label: 'Immutable receipt logged', status: 'Exportable' },
    ],
  },
];

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  onSignIn,
  onRegister,
  onInstallPwa,
}) => {
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [spotlightTab, setSpotlightTab] = useState<'orchestration' | 'governance'>('orchestration');

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setChapter((prev) => (prev + 1) % WALKTHROUGH_CHAPTERS.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [playing]);

  const activeChapter = WALKTHROUGH_CHAPTERS[chapter];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-white selection:text-[#0A0A0A]">
      {/* Sticky Minimalist Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/icons/favicon_io/android-chrome-192x192.png"
              alt="FLOWSTATE"
              className="w-9 h-9 rounded-lg object-cover"
            />
            <span className="font-display font-bold text-base tracking-tight text-white">
              FLOWSTATE
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-[#A3A3A3]">
            <a href="#platform" className="hover:text-white transition-colors">
              Platform
            </a>
            <a href="#walkthrough" className="hover:text-white transition-colors">
              Walkthrough
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security
            </a>
            <a href="#integrations" className="hover:text-white transition-colors">
              Stack
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSignIn}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-[#D4D4D4] hover:text-white transition-colors cursor-pointer"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={onRegister}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white hover:bg-[#E5E5E5] text-[#0A0A0A] font-semibold text-xs transition-colors cursor-pointer"
          >
            <span>Get started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 1. Split Editorial Hero (50/50 Dark Monochrome) */}
      <section className="border-b border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Left Typography & CTA Column */}
          <div className="lg:col-span-6 px-6 sm:px-10 lg:px-12 py-14 sm:py-20 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-[11px] font-mono text-[#D4D4D4] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>Voice-Driven Workflow Automation</span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white leading-[1.08] mb-5">
                AI for enterprise operations, built to move at the speed of speech.
              </h1>

              <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-md leading-relaxed mb-8">
                Turn spoken instructions into clear workflows, route team approvals, and keep track of every action across Personal and Organization workspaces.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onRegister}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white hover:bg-[#E5E5E5] text-[#0A0A0A] font-semibold text-xs transition-colors cursor-pointer"
                >
                  <span>Create Free Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onInstallPwa}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              </div>
            </div>

            {/* Bottom-Left Walkthrough Trigger Thumbnail */}
            <a
              href="#walkthrough"
              className="mt-12 pt-6 border-t border-white/10 flex items-center gap-4 group"
            >
              <div className="w-16 h-11 rounded-md border border-white/15 bg-[#141414] flex items-center justify-center shrink-0 group-hover:border-white/40 transition-colors">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:underline">
                  Watch the 3-step product walkthrough
                </div>
                <div className="text-[11px] text-[#737373]">
                  Voice Command → Grounded RAG → RBAC Approval
                </div>
              </div>
            </a>
          </div>

          {/* Right Textured Stage with Floating Live Card */}
          <div className="lg:col-span-6 relative bg-[#121212] p-8 sm:p-12 lg:p-16 flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Floating Elevated Card */}
            <div className="relative z-10 w-full max-w-md rounded-xl border border-white/15 bg-[#0A0A0A] shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 font-semibold text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                  FLOWSTATE AI
                </span>
                <span className="font-mono text-[10px] text-[#A3A3A3] px-2 py-0.5 rounded bg-white/10">
                  Gemini Live
                </span>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[#141414] border border-white/10 text-[#E5E5E5] leading-relaxed">
                  “Create a vendor onboarding workflow, check our security policy doc, and assign Legal for approval.”
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/5">
                    <span className="text-[#D4D4D4]">1. Grounded policy check</span>
                    <span className="font-mono text-[10px] text-white">Verified</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/10 bg-white/5">
                    <span className="text-[#D4D4D4]">2. Legal &amp; Compliance sign-off</span>
                    <span className="font-mono text-[10px] text-white">Queued</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Capabilities Trust Bar */}
      <div className="border-b border-white/10 bg-[#0A0A0A] px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-[#737373]">
          <span>BUILT FOR MODERN OPERATIONS TEAMS</span>
          <div className="flex flex-wrap items-center gap-6 text-[#D4D4D4]">
            <span>GEMINI LIVE</span>
            <span>GROUNDED RAG</span>
            <span>MULTI-TENANT RBAC</span>
            <span>AUDIT EXPORTS</span>
            <span>PWA READY</span>
          </div>
        </div>
      </div>

      {/* 3. Asymmetric 3+2 Bento Grid ("The operating system for voice-driven workflows.") */}
      <section id="platform" className="py-16 sm:py-24 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              The operating system for voice-driven workflows.
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3]">
              Everything your workspace needs to capture intent, ground decisions, govern approvals, and audit execution.
            </p>
          </div>

          {/* Top 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            {/* Card 1 */}
            <div className="rounded-xl border border-white/10 bg-[#111111] p-5 flex flex-col justify-between">
              <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-4 mb-5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#A3A3A3]">
                  <span className="inline-flex items-center gap-1.5 text-white">
                    <Mic className="w-3.5 h-3.5" /> Voice Capture
                  </span>
                  <span>en-US</span>
                </div>
                <div className="p-2.5 rounded bg-white/5 border border-white/10 text-[11px] text-[#D4D4D4]">
                  “Escalate P1 outage and notify IT Ops.”
                </div>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white mb-1">
                  AI Command Center
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Speak or type operational instructions to generate structured workflows and tasks instantly.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-white/10 bg-[#111111] p-5 flex flex-col justify-between">
              <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-4 mb-5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#A3A3A3]">
                  <span className="inline-flex items-center gap-1.5 text-white">
                    <BookOpen className="w-3.5 h-3.5" /> Knowledge Base
                  </span>
                  <span>RAG</span>
                </div>
                <div className="flex items-center justify-between text-[11px] p-2 rounded bg-white/5 border border-white/10">
                  <span className="text-[#D4D4D4] truncate">Incident_Playbook.pdf</span>
                  <span className="font-mono text-[10px] text-white">Cited</span>
                </div>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white mb-1">
                  Grounded RAG Docs
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Upload PDF, DOCX, and TXT files so every AI workflow cites real company policies.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl border border-white/10 bg-[#111111] p-5 flex flex-col justify-between">
              <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-4 mb-5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#A3A3A3]">
                  <span className="inline-flex items-center gap-1.5 text-white">
                    <ShieldCheck className="w-3.5 h-3.5" /> Approvals Queue
                  </span>
                  <span>Owner Gate</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded bg-white text-[#0A0A0A] text-[10px] font-semibold">
                    Approve
                  </span>
                  <span className="px-2.5 py-1 rounded border border-white/15 text-[#A3A3A3] text-[10px]">
                    Reject
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white mb-1">
                  Human-in-the-Loop
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Pause high-impact workflow steps for explicit Owner, Admin, or Manager authorization.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom 2 Wide Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-white/10 bg-[#111111] p-6 flex flex-col justify-between">
              <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-4 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-white text-[#0A0A0A] flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Organization &amp; Personal</div>
                    <div className="text-[11px] text-[#737373]">Custom logos • User-created departments</div>
                  </div>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/15 text-[#D4D4D4]">
                  Isolated
                </span>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white mb-1">
                  Multi-Tenant Workspaces
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  One account across your private Personal Workspace and multiple Organization Workspaces with custom logos and team invitations.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#111111] p-6 flex flex-col justify-between">
              <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-4 mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/15 bg-white/5 text-xs font-mono text-white">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/15 bg-white/5 text-xs font-mono text-white">
                  <FileJson className="w-3.5 h-3.5" /> JSON
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/15 bg-white/5 text-xs font-mono text-white">
                  <FileText className="w-3.5 h-3.5" /> TXT
                </span>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white mb-1">
                  Exportable Audit Logs
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Download verified execution, approval, and permission records anytime in CSV, JSON, or plain text formats.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Product Walkthrough Player */}
      <section id="walkthrough" className="py-16 sm:py-24 px-4 sm:px-8 border-b border-white/10 bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#737373] mb-2">
                Software Walkthrough
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white">
                See how FLOWSTATE runs end to end.
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-[#0A0A0A] text-xs font-semibold cursor-pointer"
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{playing ? 'Pause' : 'Play'}</span>
              </button>
              {WALKTHROUGH_CHAPTERS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setChapter(ch.id);
                    setPlaying(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                    chapter === ch.id
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-white/5 text-[#737373] hover:text-white border border-white/10'
                  }`}
                >
                  0{ch.id + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-[#0A0A0A] overflow-hidden shadow-2xl">
            <div className="h-0.5 w-full bg-white/10">
              <div
                className="h-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${activeChapter.progress}%` }}
              />
            </div>

            <div className="h-10 px-4 border-b border-white/10 bg-[#111111] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold text-white">
                <img src="/icons/favicon_io/favicon-32x32.png" alt="" className="w-4 h-4 rounded-xs" />
                <span>Workspace</span>
              </div>
              <span className="font-mono text-[11px] text-[#737373]">{activeChapter.tag}</span>
              <span className="px-2 py-0.5 rounded border border-white/15 text-[11px] text-[#D4D4D4]">
                AI assistant
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[280px]">
              <div className="hidden md:block md:col-span-3 border-r border-white/10 bg-[#0E0E0E] p-3 space-y-1 text-xs">
                <div className="px-2.5 py-1.5 rounded bg-white/10 font-semibold text-white">Overview</div>
                <div className="px-2.5 py-1.5 text-[#737373]">AI Command Center</div>
                <div className="px-2.5 py-1.5 text-[#737373]">Workflows</div>
                <div className="px-2.5 py-1.5 text-[#737373]">Tasks</div>
                <div className="px-2.5 py-1.5 text-[#737373]">Knowledge Base</div>
                <div className="px-2.5 py-1.5 text-[#737373]">Approvals</div>
              </div>

              <div className="md:col-span-5 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white mb-3">
                    {activeChapter.badge}
                  </span>
                  <h3 className="font-display text-lg font-bold text-white mb-2">
                    {activeChapter.title}
                  </h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed">
                    {activeChapter.caption}
                  </p>
                </div>
                <div className="mt-5 p-3 rounded-lg bg-[#141414] border border-white/10 text-xs font-mono text-white">
                  {activeChapter.prompt}
                </div>
              </div>

              <div className="md:col-span-4 p-5 bg-[#0E0E0E] flex flex-col justify-between text-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-semibold inline-flex items-center gap-1.5 text-white">
                      <Sparkles className="w-3.5 h-3.5" />
                      FLOWSTATE AI
                    </span>
                    <span className="text-[10px] font-mono text-[#737373]">Gemini Live</span>
                  </div>
                  <div className="space-y-2">
                    {activeChapter.tasks.map((t) => (
                      <div
                        key={t.code}
                        className="p-2.5 rounded-lg bg-[#141414] border border-white/10 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] text-[#737373]">{t.code}</div>
                          <div className="text-[11px] font-medium text-white truncate">{t.label}</div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white shrink-0">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A3A3A3]">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    {activeChapter.aiStatus}
                  </span>
                  <button
                    type="button"
                    onClick={onRegister}
                    className="font-semibold text-white hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Try</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 2-Tab Interactive Feature Split */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-8">
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Catch every instruction, run every workflow, and verify every approval.
            </h2>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setSpotlightTab('orchestration')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                spotlightTab === 'orchestration'
                  ? 'bg-white text-[#0A0A0A]'
                  : 'bg-white/5 text-[#A3A3A3] border border-white/10 hover:text-white'
              }`}
            >
              Voice &amp; RAG Orchestration
            </button>
            <button
              type="button"
              onClick={() => setSpotlightTab('governance')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                spotlightTab === 'governance'
                  ? 'bg-white text-[#0A0A0A]'
                  : 'bg-white/5 text-[#A3A3A3] border border-white/10 hover:text-white'
              }`}
            >
              Governance &amp; Audit
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-xl border border-white/10 bg-[#111111] overflow-hidden">
            <div className="lg:col-span-6 p-6 sm:p-10 space-y-6 border-b lg:border-b-0 lg:border-r border-white/10">
              {spotlightTab === 'orchestration' ? (
                <>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white mb-2">
                      Natural speech to structured execution.
                    </h3>
                    <p className="text-xs text-[#A3A3A3] leading-relaxed">
                      Every command is grounded in your workspace documentation before drafting tasks.
                    </p>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-lg border border-white/10 bg-[#0A0A0A]">
                      <div className="font-semibold text-white">01 · Multilingual Voice Input</div>
                      <div className="text-[#737373] mt-0.5">Live transcription and optional spoken AI responses.</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-white/10 bg-[#0A0A0A]">
                      <div className="font-semibold text-white">02 · Document Retrieval</div>
                      <div className="text-[#737373] mt-0.5">Semantic search across your workspace Knowledge Base.</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-white/10 bg-[#0A0A0A]">
                      <div className="font-semibold text-white">03 · Custom Department Routing</div>
                      <div className="text-[#737373] mt-0.5">Assign tasks to departments you create for your organization.</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white mb-2">
                      Strict RBAC and verifiable auditability.
                    </h3>
                    <p className="text-xs text-[#A3A3A3] leading-relaxed">
                      Nothing executes silently—every action is permission-checked and exportable.
                    </p>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-lg border border-white/10 bg-[#0A0A0A]">
                      <div className="font-semibold text-white">01 · 5-Tier Role Isolation</div>
                      <div className="text-[#737373] mt-0.5">Owner, Admin, Manager, Member, and Viewer enforcement.</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-white/10 bg-[#0A0A0A]">
                      <div className="font-semibold text-white">02 · Human Approval Gates</div>
                      <div className="text-[#737373] mt-0.5">Approve or reject sensitive steps with full context.</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-white/10 bg-[#0A0A0A]">
                      <div className="font-semibold text-white">03 · One-Click Log Exports</div>
                      <div className="text-[#737373] mt-0.5">Download workspace audit trails in CSV, JSON, or TXT.</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="lg:col-span-6 p-6 sm:p-10 bg-[#141414] flex items-center justify-center">
              <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#0A0A0A] p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between text-[#737373] font-mono text-[11px]">
                  <span>{spotlightTab === 'orchestration' ? 'WORKFLOW DRAFT' : 'AUDIT EXPORT'}</span>
                  <span className="text-white">READY</span>
                </div>
                <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-white font-medium">
                  {spotlightTab === 'orchestration'
                    ? 'Customer Escalation → Policy Check → Task Assignment'
                    : 'flowstate-audit-logs-2026-11-26.csv / .json / .txt'}
                </div>
                <div className="text-[11px] text-[#A3A3A3]">
                  {spotlightTab === 'orchestration'
                    ? 'Awaiting user confirmation before workflow execution.'
                    : 'Includes timestamp, actor, event type, status, and duration.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Centered Editorial Statement */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 border-b border-white/10 bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-display text-xl sm:text-3xl font-medium tracking-tight text-white leading-snug">
            Today, teams lose hours translating spoken decisions into manual tickets.{' '}
            <span className="text-[#737373]">
              FLOWSTATE turns natural instructions into structured, governed execution.
            </span>
          </p>
        </div>
      </section>

      {/* 7. 4-Column Security & Governance Grid */}
      <section id="security" className="py-16 sm:py-24 px-4 sm:px-8 border-b border-white/10 bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
                Enterprise security, governed by you.
              </h2>
              <p className="text-xs sm:text-sm text-[#A3A3A3]">
                Strict workspace boundaries from authentication to execution.
              </p>
            </div>
            <button
              type="button"
              onClick={onRegister}
              className="px-4 py-2 rounded-md bg-white text-[#0A0A0A] text-xs font-semibold w-fit cursor-pointer"
            >
              Get started
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Lock,
                title: 'Tenant Isolation',
                desc: 'Every record is strictly scoped to its workspace ID.',
              },
              {
                icon: Users,
                title: '5-Tier RBAC',
                desc: 'Owner, Admin, Manager, Member, and Viewer permissions.',
              },
              {
                icon: ShieldCheck,
                title: 'Approval Gates',
                desc: 'Explicit human authorization before external writes.',
              },
              {
                icon: Zap,
                title: 'Safe Execution',
                desc: 'Verified workflow runs with downloadable CSV, JSON, and TXT logs.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-5 rounded-xl border border-white/10 bg-[#141414]"
                >
                  <Icon className="w-4 h-4 text-white mb-4" />
                  <h3 className="font-display text-sm font-bold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Stack Grid ("Runs on the stack you already use.") */}
      <section id="integrations" className="py-16 sm:py-24 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
            Runs on the stack you already use.
          </h2>
          <p className="text-xs sm:text-sm text-[#A3A3A3] mb-10">
            Connect email, messaging, calendars, databases, and internal REST endpoints.
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 max-w-2xl mx-auto">
            {[
              Mail,
              MessageSquare,
              Calendar,
              Database,
              Terminal,
              Globe,
              GitBranch,
              Smartphone,
            ].map((Icon, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl border border-white/10 bg-[#141414] flex items-center justify-center text-[#D4D4D4] hover:border-white/30 hover:text-white transition-colors"
              >
                <Icon className="w-5 h-5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8.5 FAQ Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 border-b border-white/10 bg-[#0E0E0E]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3]">
              Clear answers about workspaces, safety, and installing FLOWSTATE.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              {
                q: 'Can I use both Personal and Organization workspaces?',
                a: 'Yes. One account lets you keep a private Personal workspace and create or join multiple Organization workspaces with custom logos and departments.',
              },
              {
                q: 'Is installing the app safe and virus-free?',
                a: 'Yes. FLOWSTATE installs directly through your browser as a verified web app—no .exe or third-party installer download is ever required.',
              },
              {
                q: 'Do new workspaces come with fake demo data?',
                a: 'No. Every new workspace starts completely clean with zero pre-made workflows, tasks, or departments.',
              },
              {
                q: 'Can I export my workspace audit logs?',
                a: 'Yes. Under Settings → Audit Logs, you can download your logs in CSV, JSON, or TXT format anytime.',
              },
            ].map((item) => (
              <div key={item.q} className="p-5 rounded-xl border border-white/10 bg-[#141414] space-y-1.5">
                <div className="font-semibold text-white">{item.q}</div>
                <p className="text-[#A3A3A3] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Bottom CTA + Multi-Column Footer */}
      <footer className="bg-[#0A0A0A] px-4 sm:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-12 border-b border-white/10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Speak your workflow. Review what it executes.
              </h2>
              <p className="text-xs sm:text-sm text-[#A3A3A3] mt-1">
                Start with a clean Personal or Organization workspace in seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={onRegister}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white hover:bg-[#E5E5E5] text-[#0A0A0A] text-xs font-semibold w-fit cursor-pointer"
            >
              <span>Get started free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-xs">
            <div className="col-span-2 sm:col-span-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/favicon_io/android-chrome-192x192.png"
                  alt="FLOWSTATE"
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <span className="font-display font-bold text-sm text-white">FLOWSTATE</span>
              </div>
              <p className="text-[#737373] leading-relaxed">
                Voice-driven enterprise workflow automation.
              </p>
            </div>

            <div className="space-y-2 text-[#A3A3A3]">
              <div className="font-semibold text-white mb-2">Platform</div>
              <div><a href="#platform" className="hover:text-white">AI Command Center</a></div>
              <div><a href="#walkthrough" className="hover:text-white">Walkthrough</a></div>
              <div><a href="#integrations" className="hover:text-white">Integrations</a></div>
            </div>

            <div className="space-y-2 text-[#A3A3A3]">
              <div className="font-semibold text-white mb-2">Governance</div>
              <div><a href="#security" className="hover:text-white">Tenant Isolation</a></div>
              <div><a href="#security" className="hover:text-white">RBAC Roles</a></div>
              <div><a href="#security" className="hover:text-white">Audit Exports</a></div>
            </div>

            <div className="space-y-2 text-[#A3A3A3]">
              <div className="font-semibold text-white mb-2">Account</div>
              <div>
                <button type="button" onClick={onSignIn} className="hover:text-white cursor-pointer">
                  Sign in
                </button>
              </div>
              <div>
                <button type="button" onClick={onRegister} className="hover:text-white cursor-pointer">
                  Create workspace
                </button>
              </div>
              <div>
                <button type="button" onClick={onInstallPwa} className="hover:text-white cursor-pointer">
                  Install PWA
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
