import React, { useState } from 'react';
import { ArrowRight, Mic, Sparkles, X } from 'lucide-react';
import { NavSection, OperationalInsight, PriorityLevel } from '../types';

interface NewWorkflowModalProps {
  open: boolean;
  onClose: () => void;
  onCreateManual: (input: {
    title: string;
    description: string;
    category: string;
    priority: PriorityLevel;
    recommendedTeam: string;
    dueDate: string;
    steps: string[];
  }) => Promise<string | undefined>;
  onSwitchToVoice: () => void;
}

export const NewWorkflowModal: React.FC<NewWorkflowModalProps> = ({
  open,
  onClose,
  onCreateManual,
  onSwitchToVoice,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Customer Support');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [team, setTeam] = useState('Identity & Auth Engineering');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [stepsRaw, setStepsRaw] = useState(
    'Search enterprise incident history\nDraft structured support ticket\nRoute for team approval'
  );
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
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
        recommendedTeam: team.trim() || 'Operations',
        dueDate,
        steps: steps.length > 0 ? steps : ['Review workflow specification'],
      });
      setTitle('');
      setDescription('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Create New Workflow
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onSwitchToVoice();
          }}
          className="w-full p-3.5 rounded-xl bg-gradient-to-r from-[#EEF4FF] to-[#F3E8FF] dark:from-blue-950/60 dark:to-indigo-950/60 border border-blue-200/80 dark:border-blue-900 flex items-center justify-between text-left cursor-pointer hover:brightness-95"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Generate via Voice & AI Command Center
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Auto-search RAG docs, draft tasks, and queue approvals
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-600" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
              Workflow Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Enterprise Login Incident Escalation"
              className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
              Objective / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow automates..."
              className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="Customer Support">Customer Support</option>
                <option value="IT Operations">IT Operations</option>
                <option value="Billing & Finance">Billing & Finance</option>
                <option value="HR Management">HR Management</option>
                <option value="Sales Ops">Sales Ops</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
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
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Assigned Team
              </label>
              <input
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
              Ordered Steps (one per line)
            </label>
            <textarea
              rows={3}
              value={stepsRaw}
              onChange={(e) => setStepsRaw(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-700 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        </form>
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
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              FLOWSTATE Operational AI Insight
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
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
              <div className="font-display text-sm font-bold text-slate-900 dark:text-white mb-1">
                {insight.headline}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {insight.summary}
              </p>
            </div>

            <div className="space-y-2.5">
              {insight.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-[#E6ECF5] dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{rec.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {rec.impact}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate(rec.targetSection);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold whitespace-nowrap cursor-pointer shrink-0"
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
