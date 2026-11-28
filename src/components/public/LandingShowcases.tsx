import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpRight,
  Check,
  FileJson,
  FileSpreadsheet,
  FileText,
  Mic,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  ARIXO_EASE,
  ARIXO_SNAPPY_SPRING,
  CompactAudioVisualizer,
} from './MotionPrimitives';

/* ============================================================================
 * PROBLEM SECTION - 3 LIVING BENTO VISUALS
 * ========================================================================== */

const PROBLEM_TRANSCRIPT_LINES = [
  {
    time: 'AI',
    speaker: 'Command Center',
    text: 'Drafted Q4 Security Access Audit with 3 tasks & Owner gate.',
  },
  {
    time: 'RAG',
    speaker: 'Knowledge Base',
    text: 'Grounded in Security_Runbook_2026.pdf (Section 3.2 · 94%).',
  },
  {
    time: 'GATE',
    speaker: 'Approvals Queue',
    text: 'Assigned to Engineering · queued for Owner sign-off.',
  },
];

export const ProblemCardTranscript: React.FC = () => {
  const [activeLine, setActiveLine] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActiveLine((prev) => (prev + 1) % PROBLEM_TRANSCRIPT_LINES.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="h-[280px] rounded-2xl border border-black/[0.08] bg-[#F7F7F7] p-5 flex flex-col justify-between overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center shrink-0">
            <Mic className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-semibold text-black">AI Command Center</span>
        </div>
        <div className="flex items-center gap-2">
          <CompactAudioVisualizer bars={5} height={12} active={!paused} />
          <span className="text-[11px] font-mono font-medium text-neutral-600">Python AI</span>
        </div>
      </div>

      <div className="space-y-2 text-[12px]">
        {PROBLEM_TRANSCRIPT_LINES.map((item, idx) => {
          const isFocused = idx === activeLine;
          return (
            <motion.button
              key={item.time}
              type="button"
              layout
              onClick={() => setActiveLine(idx)}
              transition={ARIXO_SNAPPY_SPRING}
              className={`w-full text-left p-2.5 rounded-xl border flex gap-2.5 cursor-pointer transition-colors duration-200 ${
                isFocused
                  ? 'bg-black text-white border-black shadow-[0_6px_20px_rgba(0,0,0,0.12)]'
                  : 'bg-white text-neutral-600 border-black/[0.06] hover:border-black/20'
              }`}
            >
              <span className="font-mono text-[10px] tabular-nums shrink-0 mt-0.5 text-neutral-400">
                {item.time}
              </span>
              <span className="leading-snug">{item.text}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

const OWNERSHIP_ROWS = [
  { text: 'WF-104 · Q4 Security Access Audit', owner: 'Engineering' },
  { text: 'WF-103 · Vendor Onboarding Gate', owner: 'Security' },
  { text: 'WF-102 · P1 Incident Escalation', owner: 'Approvals' },
];

export const ProblemCardOwnership: React.FC = () => {
  const [checkedCount, setCheckedCount] = useState(2);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setCheckedCount((prev) => (prev >= OWNERSHIP_ROWS.length ? 1 : prev + 1));
    }, 2200);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="h-[280px] rounded-2xl border border-black/[0.08] bg-[#F7F7F7] p-5 flex flex-col justify-between overflow-hidden"
    >
      <div className="flex items-center justify-between text-[11px] text-neutral-500">
        <span className="font-semibold text-black">Workflows &amp; Tasks</span>
        <span className="font-mono font-medium text-black">RBAC · Active</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Active', val: '5' },
          { label: 'Open Tasks', val: '12' },
          { label: 'Approvals', val: '3' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white border border-black/[0.06] px-2.5 py-2">
            <div className="text-[10px] text-neutral-500">{stat.label}</div>
            <div className="font-display text-sm font-bold text-black tabular-nums">{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-[12px]">
        {OWNERSHIP_ROWS.map((row, idx) => {
          const done = idx < checkedCount;
          return (
            <motion.button
              key={row.text}
              type="button"
              onClick={() => setCheckedCount(idx + 1)}
              animate={{ opacity: done ? 1 : 0.62 }}
              transition={{ duration: 0.25 }}
              className="w-full text-left p-2.5 rounded-xl bg-white border border-black/[0.07] hover:border-black/25 flex items-center justify-between gap-2 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                    done
                      ? 'bg-black border-black text-white'
                      : 'bg-white border-neutral-300 text-transparent'
                  }`}
                >
                  <motion.span
                    initial={false}
                    animate={{ scale: done ? 1 : 0.4, opacity: done ? 1 : 0 }}
                    transition={ARIXO_SNAPPY_SPRING}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </motion.span>
                </span>
                <span className="text-black truncate font-medium">{row.text}</span>
              </div>
              <span className="font-mono text-[10px] text-neutral-500 shrink-0">
                {row.owner}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export const ProblemCardAsyncBrief: React.FC = () => {
  const [tab, setTab] = useState<'brief' | 'audit'>('brief');

  useEffect(() => {
    const id = window.setInterval(() => {
      setTab((prev) => (prev === 'brief' ? 'audit' : 'brief'));
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="h-[280px] rounded-2xl border border-black/[0.08] bg-[#F7F7F7] p-5 flex flex-col justify-between overflow-hidden">
      <div className="p-3.5 rounded-xl bg-white border border-black/[0.07] space-y-2.5 text-[12px]">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#F5F5F5]">
            {(['brief', 'audit'] as const).map((key) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`relative px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${
                    active ? 'text-white' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="problemBriefToggle"
                      transition={ARIXO_SNAPPY_SPRING}
                      className="absolute inset-0 bg-black rounded-md"
                    />
                  )}
                  <span className="relative z-10">
                    {key === 'brief' ? 'RAG Citation' : 'Audit Receipt'}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="font-mono text-[10px] text-neutral-500">Verified</span>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'brief' ? (
            <motion.ul
              key="brief"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: ARIXO_EASE }}
              className="space-y-1 text-neutral-600 text-[11px]"
            >
              <li>· Security_Runbook_2026.pdf · 94% match</li>
              <li>· 3 tasks assigned across Engineering &amp; IT</li>
              <li>· Owner approval logged · CSV ready</li>
            </motion.ul>
          ) : (
            <motion.ul
              key="audit"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: ARIXO_EASE }}
              className="space-y-1 font-mono text-neutral-600 text-[10.5px] tabular-nums"
            >
              <li>receipt_id: FS-2026-9042</li>
              <li>approver_role: OWNER · verified</li>
              <li>export_formats: CSV / JSON / TXT</li>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 rounded-xl bg-white border border-black/[0.07] flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-black shrink-0" />
          <span className="font-medium text-black truncate">
            Tenant-isolated audit trail &amp; exports
          </span>
        </div>
        <span className="font-mono text-[10px] text-neutral-500 shrink-0">CSV · JSON</span>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURES SECTION - 4 LIVING INTERACTIVE FEATURE STAGES
 * ========================================================================== */

const VOICE_PIPELINE_STEPS = [
  { num: 'STEP 01', label: 'Parse intent', detail: '3 actions extracted' },
  { num: 'STEP 02', label: 'Assign Engineering', detail: 'SLA · 24h window' },
  { num: 'STEP 03', label: 'Queue Owner gate', detail: 'Paused for sign-off' },
];

export const FeatureVisualVoice: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % VOICE_PIPELINE_STEPS.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="rounded-2xl border border-black/[0.08] bg-[#F7F7F7] p-6 sm:p-8 min-h-[340px] flex flex-col justify-between gap-6"
    >
      <div className="flex items-center justify-between text-xs pb-4 border-b border-black/[0.08]">
        <span className="inline-flex items-center gap-2 font-medium text-black">
          <Mic className="w-4 h-4" />
          AI Command Center
        </span>
        <div className="flex items-center gap-3">
          <CompactAudioVisualizer bars={12} height={16} active />
          <span className="font-mono text-[11px] text-neutral-500 hidden sm:inline">
            Voice &amp; text
          </span>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white border border-black/[0.07] space-y-3">
        <div className="flex items-center justify-between text-[11px] text-neutral-500">
          <span>Operational directive</span>
          <span className="font-mono tabular-nums text-black">IT Operations · Python AI</span>
        </div>
        <p className="text-sm sm:text-[15px] text-black leading-relaxed font-normal">
          “Audit Q4 access logs, create remediation tasks for Engineering, and pause production revocations for Owner approval.”
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {VOICE_PIPELINE_STEPS.map((step, idx) => {
          const isCurrent = idx === activeStep;
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`relative p-3.5 rounded-xl border text-left transition-colors cursor-pointer overflow-hidden ${
                isCurrent
                  ? 'border-black text-white'
                  : 'bg-white border-black/[0.07] text-black hover:border-black/25'
              }`}
            >
              {isCurrent && (
                <motion.span
                  layoutId="voiceStepActiveBg"
                  transition={ARIXO_SNAPPY_SPRING}
                  className="absolute inset-0 bg-black rounded-xl"
                />
              )}
              <div className="relative z-10">
                <div
                  className={`font-mono text-[10px] ${
                    isCurrent ? 'text-neutral-400' : 'text-neutral-400'
                  }`}
                >
                  {step.num}
                </div>
                <div className="font-medium mt-1">{step.label}</div>
                <div
                  className={`text-[11px] mt-1 ${
                    isCurrent ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {step.detail}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const RAG_DOCS = [
  {
    file: 'Security_Runbook_2026.pdf',
    section: 'Section 3.2 · Credential Rotation SLA',
    status: 'Cited',
    excerpt:
      'All inactive contractor IAM tokens older than 30 days require Engineering audit and explicit Workspace Owner sign-off prior to revocation.',
  },
  {
    file: 'Vendor_Procurement_SOP.docx',
    section: 'Section 1.4 · Legal DPA Verification',
    status: 'Cited',
    excerpt:
      'Every new infrastructure vendor must pass SOC2 Type II and Data Processing Addendum verification before Finance activates billing.',
  },
  {
    file: 'Incident_Response_Playbook.txt',
    section: 'Section 4.0 · Escalation Roster',
    status: 'Indexed',
    excerpt:
      'P1 webhook latency above 800ms triggers immediate IT Operations paging and requires Manager sign-off before external status updates.',
  },
];

export const FeatureVisualRag: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setSelectedIdx((prev) => (prev + 1) % RAG_DOCS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [paused]);

  const activeDoc = RAG_DOCS[selectedIdx];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="rounded-2xl border border-black/[0.08] bg-[#F7F7F7] p-6 sm:p-8 min-h-[340px] flex flex-col justify-between gap-5"
    >
      <div className="flex items-center justify-between text-xs pb-4 border-b border-black/[0.08]">
        <span className="font-medium text-black">Knowledge Base · Grounded RAG</span>
        <span className="font-mono text-[11px] text-neutral-500">PDF · DOCX · TXT</span>
      </div>

      <div className="space-y-2 text-xs">
        {RAG_DOCS.map((doc, idx) => {
          const active = idx === selectedIdx;
          return (
            <button
              key={doc.file}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 ${
                active
                  ? 'bg-white border-black shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
                  : 'bg-white/75 border-black/[0.06] hover:bg-white hover:border-black/20'
              }`}
            >
              <div className="min-w-0">
                <div className="font-medium text-black truncate">{doc.file}</div>
                <div className="text-neutral-500 text-[11px] mt-0.5 truncate">
                  {doc.section}
                </div>
              </div>
              <span
                className={`font-mono text-[11px] font-medium shrink-0 ${
                  active ? 'text-black' : 'text-neutral-400'
                }`}
              >
                {doc.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Animated Retrieved Citation Passage */}
      <div className="p-4 rounded-xl bg-black text-white min-h-[78px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDoc.file}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: ARIXO_EASE }}
            className="space-y-1"
          >
            <div className="font-mono text-[10px] text-neutral-400">
              RETRIEVED PASSAGE · {activeDoc.file}
            </div>
            <p className="text-[12px] text-neutral-100 leading-relaxed">
              “{activeDoc.excerpt}”
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

interface FeatureVisualApprovalsProps {
  onRegister: () => void;
}

export const FeatureVisualApprovals: React.FC<FeatureVisualApprovalsProps> = ({
  onRegister,
}) => {
  const [decision, setDecision] = useState<'pending' | 'approved' | 'rejected'>('pending');

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-[#F7F7F7] p-6 sm:p-8 min-h-[340px] flex flex-col justify-between gap-6">
      <div className="flex items-center justify-between text-xs pb-4 border-b border-black/[0.08]">
        <span className="inline-flex items-center gap-2 font-medium text-black">
          <ShieldCheck className="w-4 h-4" />
          Approvals Queue
        </span>
        <span className="font-mono text-[11px] text-neutral-500">5-Tier RBAC</span>
      </div>

      <div className="p-5 rounded-xl bg-white border border-black/[0.08] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-black">
              Revoke 4 stale contractor IAM keys
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Requested by Engineering · Grounded in Security_Runbook_2026.pdf
            </div>
          </div>
          <span className="font-mono text-[11px] text-black shrink-0">Owner Gate</span>
        </div>

        <AnimatePresence mode="wait">
          {decision === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: ARIXO_EASE }}
              className="flex flex-wrap items-center gap-2.5 pt-1"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDecision('approved')}
                className="px-4 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Approve &amp; Execute
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDecision('rejected')}
                className="px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-black text-xs font-medium transition-colors cursor-pointer"
              >
                Reject
              </motion.button>
              <span className="text-[11px] text-neutral-400 ml-auto hidden sm:inline">
                Try clicking Approve
              </span>
            </motion.div>
          )}

          {decision === 'approved' && (
            <motion.div
              key="approved"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={ARIXO_SNAPPY_SPRING}
              className="p-3.5 rounded-xl bg-black text-white flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 text-xs">
                <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
                <div>
                  <div className="font-medium">Approved by Owner · Executed</div>
                  <div className="font-mono text-[10px] text-neutral-400 tabular-nums">
                    Audit receipt #FS-9042 saved
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDecision('pending')}
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={onRegister}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-white underline underline-offset-4 cursor-pointer"
                >
                  <span>Try live</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}

          {decision === 'rejected' && (
            <motion.div
              key="rejected"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={ARIXO_SNAPPY_SPRING}
              className="p-3.5 rounded-xl bg-[#F5F5F5] border border-black/15 text-black flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 text-xs">
                <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                  <X className="w-3 h-3" />
                </span>
                <div>
                  <div className="font-medium">Rejected · Action blocked</div>
                  <div className="font-mono text-[10px] text-neutral-500">
                    Zero external mutations executed
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDecision('pending')}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-black hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset preview</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-[11px] text-neutral-500">
        Roles enforced: Owner · Admin · Manager · Member · Viewer
      </div>
    </div>
  );
};

const EXPORT_FORMATS = [
  {
    key: 'csv' as const,
    icon: FileSpreadsheet,
    fmt: '.csv',
    desc: 'Spreadsheet & BI audits',
    preview:
      'timestamp,workspace_id,workflow,approver_role,status\n2026-11-27T09:14Z,org_meridian,Q4_IAM_Audit,OWNER,APPROVED',
  },
  {
    key: 'json' as const,
    icon: FileJson,
    fmt: '.json',
    desc: 'SIEM & API ingestion',
    preview:
      '{\n  "receipt_id": "FS-9042",\n  "cited_doc": "Security_Runbook_2026.pdf",\n  "rbac_gate": "OWNER_APPROVED"\n}',
  },
  {
    key: 'txt' as const,
    icon: FileText,
    fmt: '.txt',
    desc: 'Archival review logs',
    preview:
      '[09:14:02 UTC] WORKFLOW LOCKED · Q4 Security Access Audit\n[09:14:19 UTC] OWNER SIGN-OFF VERIFIED · 3 TASKS DISPATCHED',
  },
];

export const FeatureVisualExports: React.FC = () => {
  const [activeFmt, setActiveFmt] = useState<'csv' | 'json' | 'txt'>('json');
  const current = EXPORT_FORMATS.find((f) => f.key === activeFmt) || EXPORT_FORMATS[1];

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-[#F7F7F7] p-6 sm:p-8 min-h-[340px] flex flex-col justify-between gap-5">
      <div className="flex items-center justify-between text-xs pb-4 border-b border-black/[0.08]">
        <span className="font-medium text-black">
          Audit Trail Exports &amp; Multi-Tenant Workspaces
        </span>
        <span className="font-mono text-[11px] text-neutral-500">Open formats</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {EXPORT_FORMATS.map((exp) => {
          const Icon = exp.icon;
          const active = exp.key === activeFmt;
          return (
            <button
              key={exp.key}
              type="button"
              onClick={() => setActiveFmt(exp.key)}
              className={`relative p-4 rounded-xl border text-left space-y-2 cursor-pointer transition-colors overflow-hidden ${
                active
                  ? 'border-black text-white'
                  : 'bg-white border-black/[0.07] text-black hover:border-black/25'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="exportFormatActive"
                  transition={ARIXO_SNAPPY_SPRING}
                  className="absolute inset-0 bg-black rounded-xl"
                />
              )}
              <div className="relative z-10 space-y-2">
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-black'}`} />
                <div className="font-mono text-sm font-semibold">{exp.fmt}</div>
                <div
                  className={`text-[11px] ${
                    active ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {exp.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-white border border-black/[0.07] min-h-[82px] overflow-x-auto">
        <AnimatePresence mode="wait">
          <motion.pre
            key={current.key}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: ARIXO_EASE }}
            className="font-mono text-[11px] leading-relaxed text-neutral-700 whitespace-pre"
          >
            {current.preview}
          </motion.pre>
        </AnimatePresence>
      </div>
    </div>
  );
};
