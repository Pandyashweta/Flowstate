import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { NavSection, WorkspaceRole } from '../types';

export interface TourStepDef {
  stepNumber: number;
  targetAttr: string;
  title: string;
  description: string;
  bullets: string[];
  navSection?: NavSection;
  requiresWrite?: boolean;
}

const ALL_TOUR_STEPS: TourStepDef[] = [
  {
    stepNumber: 1,
    targetAttr: 'nav',
    title: 'Workspace Navigation',
    description: 'Move seamlessly between your operational modules and switch workspaces anytime.',
    bullets: [
      'Overview Dashboard & AI Command Center',
      'Workflows, Tasks & Knowledge Base',
      'Approvals, Analytics, Integrations & Settings',
    ],
    navSection: 'overview',
  },
  {
    stepNumber: 2,
    targetAttr: 'nav-command_center',
    title: 'AI Command Center (Voice & Text)',
    description:
      'Interact naturally with Gemini Live when you choose to start a conversation.',
    bullets: [
      'Click the microphone to start voice input or type a text request',
      'Stop listening or interrupt AI speech at any moment',
      'Ask questions about your workspace or request new workflow drafts',
    ],
    navSection: 'command_center',
  },
  {
    stepNumber: 3,
    targetAttr: 'create-workflow',
    title: 'Workflow Creation',
    description:
      'Build workflows manually with structured steps or describe a process in natural language.',
    bullets: [
      'AI-assisted drafts always show a preview for your confirmation first',
      'Manual builder lets you configure triggers, steps, and approvals',
    ],
    requiresWrite: true,
  },
  {
    stepNumber: 4,
    targetAttr: 'nav-tasks',
    title: 'Task Management',
    description: 'Create, assign, and track tasks linked to your workflows or standalone work.',
    bullets: [
      'Organize tasks across Backlog, To Do, In Progress, and Completed',
      'Track assignees, priorities, due dates, and dependencies',
    ],
  },
  {
    stepNumber: 5,
    targetAttr: 'nav-knowledge_base',
    title: 'Knowledge Base',
    description:
      'Upload PDF, DOCX, TXT, or Markdown playbooks to ground AI responses in your own docs.',
    bullets: [
      'Documents are strictly isolated to the active workspace',
      'Semantic retrieval surfaces only authorized excerpts',
    ],
  },
  {
    stepNumber: 6,
    targetAttr: 'nav-approvals',
    title: 'Human-in-the-Loop Approvals',
    description:
      'Sensitive external actions pause for explicit human review before execution.',
    bullets: [
      'Review proposed payloads, risk levels, and integration targets',
      'Approve, reject, or request changes with full audit logging',
    ],
  },
  {
    stepNumber: 7,
    targetAttr: 'nav-settings',
    title: 'Account & Workspace Settings',
    description:
      'Manage your profile, security, theme, voice preferences, team roles, and notifications.',
    bullets: [
      'Control password, active sessions, and notification preferences',
      'Manage organization members, departments, and granular permissions',
    ],
  },
  {
    stepNumber: 8,
    targetAttr: 'finish',
    title: "You're ready to use FLOWSTATE.",
    description:
      'Your clean workspace is ready. You can replay this tour anytime from Settings.',
    bullets: [
      'Create your first workflow manually or via the AI Command Center',
      'Invite teammates or upload your first runbook when ready',
    ],
  },
];

interface ProductTourProps {
  open: boolean;
  currentStep: number;
  role?: WorkspaceRole;
  onStepChange: (step: number) => void;
  onFinish: () => void;
  onClose: () => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({
  open,
  currentStep,
  role = 'Owner',
  onStepChange,
  onFinish,
  onClose,
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const steps = ALL_TOUR_STEPS.filter((s) => !(s.requiresWrite && role === 'Viewer'));
  const activeIdx = Math.min(Math.max(0, currentStep - 1), steps.length - 1);
  const step = steps[activeIdx];

  useEffect(() => {
    if (!open || !step) return;
    if (step.targetAttr === 'finish') {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(`[data-tour="${step.targetAttr}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          setRect(r);
          return;
        }
      }
      setRect(null);
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [open, step]);

  if (!open || !step) return null;

  const isLast = activeIdx === steps.length - 1;
  const isFirst = activeIdx === 0;

  // Position tooltip near highlighted element on desktop, or centered on mobile/fallback
  const tooltipStyle: React.CSSProperties = rect
    ? {
        position: 'fixed',
        top: Math.min(window.innerHeight - 310, Math.max(16, rect.bottom + 12)),
        left: Math.min(window.innerWidth - 360, Math.max(16, rect.left)),
        zIndex: 70,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 70,
      };

  return (
    <div className="fixed inset-0 z-60 pointer-events-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]" onClick={onClose} />

      {/* Highlight Ring around target element */}
      {rect && (
        <div
          style={{
            position: 'fixed',
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            zIndex: 65,
          }}
          className="rounded-xl ring-2 ring-blue-500 bg-blue-500/10 pointer-events-none transition-all duration-200"
        />
      )}

      {/* Tooltip Card */}
      <div
        style={tooltipStyle}
        className="w-[340px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#333333] rounded-2xl p-5 shadow-2xl space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
            Step {activeIdx + 1} of {steps.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tutorial"
            className="p-1 rounded-lg text-[#737373] hover:text-[#404040] dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="font-display text-base font-bold text-[#111111] dark:text-white flex items-center gap-2">
            {isLast && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            <span>{step.title}</span>
          </h3>
          <p className="text-xs text-[#525252] dark:text-[#D4D4D4] mt-1 leading-relaxed">
            {step.description}
          </p>
        </div>

        <ul className="space-y-1.5 text-[11px] text-[#737373] dark:text-[#737373]">
          {step.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="pt-3 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onFinish}
            className="text-[11px] font-medium text-[#737373] hover:text-[#404040] dark:hover:text-slate-200 cursor-pointer"
          >
            Skip tutorial
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => onStepChange(activeIdx)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#333333] text-xs font-semibold text-[#404040] dark:text-[#E5E5E5] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={onFinish}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                <span>Finish Tutorial</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStepChange(activeIdx + 2)}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
