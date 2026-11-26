import React from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Mic, ShieldCheck } from 'lucide-react';

interface AuthGateProps {
  onSignIn: () => void;
  error: string | null;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onSignIn, error }) => {
  return (
    <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#0B1120] flex flex-col justify-center items-center p-6">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Left Hero Visual Pane */}
        <div className="lg:col-span-7 p-8 sm:p-12 bg-gradient-to-br from-[#EEF2FF] via-[#F3E8FF]/70 to-[#E0F2FE] dark:from-[#151D35] dark:via-[#1C1B3A] dark:to-[#11223B] flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none">
                  <path
                    d="M12 3L19.5 7.5V16.5L12 21L4.5 16.5V7.5L12 3Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 8V16M8.5 10L12 12L15.5 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                FLOWSTATE
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight max-w-md mb-4">
              Voice-Driven Agentic{' '}
              <span className="text-blue-600 dark:text-blue-400">Workflow Automation</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md leading-relaxed mb-8">
              Turning everyday business instructions into structured, actionable workflows. One
              instruction. Connected processes. Work that moves forward.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-white/80 dark:border-slate-700/60 rounded-xl p-3.5">
              <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-2" />
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Voice Command Center
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live STT, multilingual & TTS
              </div>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-white/80 dark:border-slate-700/60 rounded-xl p-3.5">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-2" />
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Grounded RAG Docs
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                PDF, DOCX & TXT retrieval
              </div>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-white/80 dark:border-slate-700/60 rounded-xl p-3.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-2" />
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Human-in-the-Loop
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                RBAC & immutable audit trail
              </div>
            </div>
          </div>

          <img
            src="/src/assets/images/hero_prism_star_1795690515955.jpg"
            alt="Sculptural prism accent"
            referrerPolicy="no-referrer"
            className="hidden sm:block absolute -right-10 -top-10 w-56 h-56 object-cover rounded-full opacity-55 mix-blend-multiply dark:mix-blend-screen pointer-events-none select-none"
          />
        </div>

        {/* Right Sign-In Pane */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Sign in to workspace
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Authenticate with your enterprise Google account to access persistent Firestore
              workflows, knowledge documents, and approval queues.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={onSignIn}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            <span>Continue with Google</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Pre-loaded with Customer Support incident playbooks for live RAG demo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Role-based access control & verified Firebase security rules</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>All prototype external connectors clearly labeled as simulated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
