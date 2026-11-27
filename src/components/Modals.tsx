import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { apiPostJson } from '../lib/api';
import {
  AiModelMode,
  NavSection,
  OperationalInsight,
  PriorityLevel,
  ProposedWorkflowDraft,
  RagCitation,
} from '../types';

interface NewWorkflowModalProps {
  open: boolean;
  initialTab?: 'ai' | 'manual';
  onClose: () => void;
  workspaceId?: string;
  departments?: string[];
  domains?: string[];
  activeDomain?: string;
  modelMode?: AiModelMode;
  requireApproval?: boolean;
  voice?: {
    isListening: boolean;
    isTranscribing?: boolean;
    voiceError: string | null;
    startListening: (cb?: (text: string) => void) => void;
    stopListening: () => void;
    clearVoiceError: () => void;
  };
  onCreateManual: (input: {
    title: string;
    description: string;
    category: string;
    priority: PriorityLevel;
    recommendedTeam: string;
    dueDate: string;
    steps: string[];
  }) => Promise<string | undefined>;
  onCommitGeneratedWorkflow?: (
    draft: ProposedWorkflowDraft,
    opts: {
      sourcePrompt: string;
      triggerType: 'voice' | 'chat';
      ragSources: string[];
      submitForApproval: boolean;
    }
  ) => Promise<{ workflowId: string; approvalId?: string }>;
  onSwitchToVoice: () => void;
}

export const NewWorkflowModal: React.FC<NewWorkflowModalProps> = ({
  open,
  initialTab = 'ai',
  onClose,
  workspaceId,
  departments = [],
  domains = [],
  activeDomain = 'General Operations',
  modelMode = 'balanced',
  requireApproval = true,
  voice,
  onCreateManual,
  onCommitGeneratedWorkflow,
  onSwitchToVoice,
}) => {
  const [tab, setTab] = useState<'ai' | 'manual'>(initialTab);

  // Manual form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(departments[0] || activeDomain || 'General Operations');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [team, setTeam] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [stepsRaw, setStepsRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // AI generation state
  const [aiDomain, setAiDomain] = useState(activeDomain || 'General Operations');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTriggerMode, setAiTriggerMode] = useState<'voice' | 'chat'>('chat');
  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<ProposedWorkflowDraft | null>(null);
  const [generatedCitations, setGeneratedCitations] = useState<RagCitation[]>([]);
  const [generatedSummary, setGeneratedSummary] = useState<string>('');
  const [generatedModel, setGeneratedModel] = useState<string>('');
  const [committingAi, setCommittingAi] = useState(false);

  const uniqueDomains = useMemo(
    () =>
      Array.from(
        new Set([
          'General Operations',
          ...domains.filter(Boolean),
          ...departments.filter(Boolean),
        ])
      ),
    [domains, departments]
  );

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setCategory(departments[0] || activeDomain || 'General Operations');
      setAiDomain(activeDomain || departments[0] || 'General Operations');
      setSubmitError(null);
    }
  }, [open, initialTab, departments, activeDomain]);

  if (!open) return null;

  const handleGenerateAiWorkflow = async (e?: React.FormEvent, promptOverride?: string) => {
    if (e) e.preventDefault();
    const promptToUse = (promptOverride ?? aiPrompt).trim();
    if (!promptToUse || generating) return;

    setGenerating(true);
    setSubmitError(null);
    setGeneratedDraft(null);
    try {
      const res = await apiPostJson<{
        assistantMessage: string;
        proposedWorkflow: ProposedWorkflowDraft;
        ragCitations?: RagCitation[];
        modelUsed?: string;
      }>('/api/ai/generate-workflow', {
        workspaceId,
        prompt: promptToUse,
        domain: aiDomain,
        modelMode,
        requireApproval,
      });

      setGeneratedDraft(res.proposedWorkflow);
      setGeneratedCitations(res.ragCitations || []);
      setGeneratedSummary(res.assistantMessage || '');
      setGeneratedModel(res.modelUsed || 'gemini-4-hydrogen');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to generate workflow with AI.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCommitAiDraft = async (submitForApproval: boolean) => {
    if (!generatedDraft || !onCommitGeneratedWorkflow || committingAi) return;
    setCommittingAi(true);
    setSubmitError(null);
    try {
      await onCommitGeneratedWorkflow(generatedDraft, {
        sourcePrompt: aiPrompt.trim() || generatedDraft.title,
        triggerType: aiTriggerMode,
        ragSources: generatedCitations.map((c) => c.docTitle),
        submitForApproval,
      });
      setAiPrompt('');
      setGeneratedDraft(null);
      setGeneratedSummary('');
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save generated workflow.');
    } finally {
      setCommittingAi(false);
    }
  };

  const handleVoiceDictate = () => {
    if (!voice) return;
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening((transcribed) => {
        if (transcribed.trim()) {
          setAiTriggerMode('voice');
          setAiPrompt(transcribed.trim());
          void handleGenerateAiWorkflow(undefined, transcribed.trim());
        }
      });
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      const steps = stepsRaw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      await onCreateManual({
        title: title.trim(),
        description: description.trim() || 'Enterprise operational workflow.',
        category,
        priority,
        recommendedTeam: team.trim() || category || 'Operations',
        dueDate,
        steps: steps.length > 0 ? steps : ['Review workflow specification'],
      });
      setTitle('');
      setDescription('');
      setTeam('');
      setDueDate('');
      setStepsRaw('');
      setSubmitError(null);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create workflow.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#111111] dark:text-white" />
            <h3 className="font-display text-base font-bold text-[#111111] dark:text-white">
              Create Workflow
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#111111] dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: AI Generate vs Manual */}
        <div className="inline-flex items-center p-1 rounded-xl bg-[#F5F5F5] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] w-full">
          <button
            type="button"
            onClick={() => {
              setTab('ai');
              setSubmitError(null);
            }}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'ai'
                ? 'bg-white dark:bg-[#222222] text-[#111111] dark:text-white shadow-xs'
                : 'text-[#737373]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with Gemini AI</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('manual');
              setSubmitError(null);
            }}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'manual'
                ? 'bg-white dark:bg-[#222222] text-[#111111] dark:text-white shadow-xs'
                : 'text-[#737373]'
            }`}
          >
            <span>Manual Specification</span>
          </button>
        </div>

        {(submitError || voice?.voiceError) && (
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
            <span>{submitError || voice?.voiceError}</span>
            {voice?.voiceError && (
              <button
                type="button"
                onClick={voice.clearVoiceError}
                className="underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {tab === 'ai' ? (
          <div className="space-y-4 text-xs">
            <form onSubmit={(e) => void handleGenerateAiWorkflow(e)} className="space-y-3">
              <div>
                <label className="block font-medium text-[#525252] dark:text-[#D4D4D4] mb-1">
                  Target Domain / Department
                </label>
                <select
                  value={aiDomain}
                  onChange={(e) => setAiDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616] text-[#111111] dark:text-white"
                >
                  {uniqueDomains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-[#525252] dark:text-[#D4D4D4]">
                    Describe the workflow or incident (text or voice)
                  </label>
                  {voice && (
                    <button
                      type="button"
                      onClick={handleVoiceDictate}
                      disabled={generating || Boolean(voice.isTranscribing)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                        voice.isListening
                          ? 'bg-red-600 text-white'
                          : 'bg-[#F5F5F5] dark:bg-[#1F1F1F] text-[#111111] dark:text-white hover:bg-[#EAEAEA] dark:hover:bg-[#2A2A2A]'
                      }`}
                    >
                      {voice.isTranscribing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : voice.isListening ? (
                        <MicOff className="w-3 h-3" />
                      ) : (
                        <Mic className="w-3 h-3" />
                      )}
                      <span>
                        {voice.isTranscribing
                          ? 'Transcribing...'
                          : voice.isListening
                          ? 'Stop & Generate'
                          : 'Speak Prompt'}
                      </span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => {
                    setAiTriggerMode('chat');
                    setAiPrompt(e.target.value);
                  }}
                  placeholder="e.g., Automate quarterly customer security review: inspect uploaded compliance SOPs, assign IT audit tasks, and require Legal sign-off before sending report..."
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616] text-[#111111] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToVoice();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#737373] hover:text-[#111111] dark:hover:text-white cursor-pointer"
                >
                  <span>Open full Voice Command Center</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="submit"
                  disabled={generating || !aiPrompt.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-semibold cursor-pointer disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{generating ? 'Generating Workflow...' : 'Generate with Gemini'}</span>
                </button>
              </div>
            </form>

            {/* Generated Workflow Preview */}
            {generatedDraft && (
              <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                      {generatedDraft.category} · {generatedDraft.priority.toUpperCase()} · {generatedModel}
                    </div>
                    <h4 className="font-display text-sm font-bold text-[#111111] dark:text-white mt-0.5">
                      {generatedDraft.title}
                    </h4>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                </div>

                {generatedSummary && (
                  <p className="text-[#525252] dark:text-[#D4D4D4] leading-relaxed">
                    {generatedSummary}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#737373]">
                  <div>
                    Team: <strong className="text-[#111111] dark:text-white">{generatedDraft.recommendedTeam}</strong>
                  </div>
                  <div>
                    Due: <strong className="text-[#111111] dark:text-white">{generatedDraft.dueDate}</strong>
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-[#111111] dark:text-white mb-1">
                    Ordered Steps ({generatedDraft.steps.length})
                  </div>
                  <ol className="space-y-1 text-[11px] text-[#525252] dark:text-[#D4D4D4]">
                    {generatedDraft.steps.map((s, idx) => (
                      <li key={idx}>
                        <span className="font-mono text-blue-600 dark:text-blue-400 mr-1.5">
                          0{idx + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <div className="font-semibold text-[#111111] dark:text-white mb-1">
                    Linked Tasks ({generatedDraft.tasks.length})
                  </div>
                  <div className="space-y-1">
                    {generatedDraft.tasks.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-2 text-[11px]"
                      >
                        <span className="font-medium text-[#111111] dark:text-white truncate">
                          {t.title}
                        </span>
                        <span className="text-[#737373] shrink-0">{t.assignee}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {generatedDraft.approvalRequest && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200">
                    <strong>Approval Gate:</strong> {generatedDraft.approvalRequest.actionType} (
                    {generatedDraft.approvalRequest.integrationTarget})
                  </div>
                )}

                {onCommitGeneratedWorkflow && (
                  <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#E5E5E5] dark:border-[#262626]">
                    {generatedDraft.approvalRequest && (
                      <button
                        type="button"
                        disabled={committingAi}
                        onClick={() => void handleCommitAiDraft(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {committingAi ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>Save &amp; Queue Approval</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={committingAi}
                      onClick={() => void handleCommitAiDraft(false)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold cursor-pointer disabled:opacity-50 ${
                        generatedDraft.approvalRequest
                          ? 'border border-[#E5E5E5] dark:border-[#333333] text-[#404040] dark:text-[#E5E5E5]'
                          : 'bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111]'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{generatedDraft.approvalRequest ? 'Save Without Gate' : 'Save & Start Workflow'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitManual} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-[#525252] dark:text-[#D4D4D4] mb-1">
                Workflow Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Enterprise Login Incident Escalation"
                className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#525252] dark:text-[#D4D4D4] mb-1">
                Objective / Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this workflow automates..."
                className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#525252] dark:text-[#D4D4D4] mb-1">
                  Domain / Department
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                >
                  {uniqueDomains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-[#525252] dark:text-[#D4D4D4] mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#525252] dark:text-[#D4D4D4] mb-1">
                  Assigned Team
                </label>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="e.g., Operations"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#525252] dark:text-[#D4D4D4] mb-1">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium text-[#525252] dark:text-[#D4D4D4] mb-1">
                Ordered Steps (one per line)
              </label>
              <textarea
                rows={3}
                value={stepsRaw}
                onChange={(e) => setStepsRaw(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616] font-mono text-[11px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-semibold cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Workflow'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

interface InsightModalProps {
  insight: OperationalInsight | null;
  error: string | null;
  onClose: () => void;
  onNavigate: (section: NavSection) => void;
}

export const InsightModal: React.FC<InsightModalProps> = ({
  insight,
  error,
  onClose,
  onNavigate,
}) => {
  if (!insight && !error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-display text-base font-bold text-[#111111] dark:text-white">
              FLOWSTATE Operational AI Insight
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#525252] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error ? (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : insight ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#F4F6FD] to-[#EEF4FF] dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <div className="font-display text-sm font-bold text-[#111111] dark:text-white mb-1">
                {insight.headline}
              </div>
              <p className="text-[#525252] dark:text-[#D4D4D4] leading-relaxed">
                {insight.summary}
              </p>
            </div>

            <div className="space-y-2.5">
              {insight.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-[#111111] dark:text-white">{rec.title}</div>
                    <div className="text-[11px] text-[#737373] mt-0.5">{rec.impact}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate(rec.targetSection);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-[11px] font-semibold whitespace-nowrap cursor-pointer shrink-0"
                  >
                    {rec.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
