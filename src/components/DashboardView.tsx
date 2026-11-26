import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  GitBranch,
  Mic,
  Plus,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ApprovalItem,
  AuditLogItem,
  NavSection,
  TaskItem,
  UserProfile,
  Workflow,
  Workspace,
} from '../types';

interface DashboardViewProps {
  profile: UserProfile | null;
  workspace?: Workspace | null;
  workflows: Workflow[];
  tasks: TaskItem[];
  approvals: ApprovalItem[];
  auditLogs: AuditLogItem[];
  onNavigate: (section: NavSection) => void;
  onLaunchCommand: (prompt: string, inputMode: 'voice' | 'text') => void;
  onSelectWorkflow: (wf: Workflow) => void;
  onOpenNewWorkflow: () => void;
  isVoiceListening: boolean;
  onStartHeroVoice: () => void;
  onStopHeroVoice: () => void;
}

const DEMO_PROMPT =
  'A customer cannot log into their account. Check previous incidents, identify possible solutions, create a support ticket and assign it to the appropriate team.';

const STATUS_META: Record<
  Workflow['status'],
  { label: string; textClass: string; bgClass: string }
> = {
  draft: {
    label: 'Draft',
    textClass: 'text-[#525252] dark:text-[#D4D4D4]',
    bgClass: 'bg-[#F2F2F2] dark:bg-[#202020]',
  },
  awaiting_approval: {
    label: 'Awaiting Approval',
    textClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-50 dark:bg-amber-950/50',
  },
  approved: {
    label: 'Approved',
    textClass: 'text-indigo-700 dark:text-indigo-300',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/50',
  },
  in_progress: {
    label: 'In Progress',
    textClass: 'text-blue-700 dark:text-blue-300',
    bgClass: 'bg-blue-50 dark:bg-blue-950/50',
  },
  blocked: {
    label: 'Blocked',
    textClass: 'text-orange-700 dark:text-orange-300',
    bgClass: 'bg-orange-50 dark:bg-orange-950/50',
  },
  completed: {
    label: 'Completed',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  failed: {
    label: 'Failed',
    textClass: 'text-red-700 dark:text-red-300',
    bgClass: 'bg-red-50 dark:bg-red-950/50',
  },
  paused: {
    label: 'Paused',
    textClass: 'text-purple-700 dark:text-purple-300',
    bgClass: 'bg-purple-50 dark:bg-purple-950/50',
  },
  cancelled: {
    label: 'Cancelled',
    textClass: 'text-[#737373] dark:text-[#737373]',
    bgClass: 'bg-[#F2F2F2] dark:bg-[#202020]',
  },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  workflows,
  tasks,
  approvals,
  auditLogs,
  onNavigate,
  onLaunchCommand,
  onSelectWorkflow,
  onOpenNewWorkflow,
  isVoiceListening,
  onStartHeroVoice,
  onStopHeroVoice,
}) => {
  const [heroPrompt, setHeroPrompt] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const metrics = useMemo(() => {
    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter((w) =>
      ['in_progress', 'approved', 'awaiting_approval'].includes(w.status)
    ).length;
    const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const failedWorkflows = workflows.filter((w) => w.status === 'failed').length;
    const completedWorkflows = workflows.filter((w) => w.status === 'completed').length;
    const successRate =
      totalWorkflows > 0 ? Math.round((completedWorkflows / totalWorkflows) * 100) : 0;

    return {
      totalWorkflows,
      activeWorkflows,
      pendingApprovals,
      completedTasks,
      failedWorkflows,
      completedWorkflows,
      successRate,
    };
  }, [workflows, tasks, approvals]);

  // Build real 7-day execution overview series from actual auditLogs & workflows
  const chartSeries = useMemo(() => {
    const days: { label: string; key: string; successful: number; pending: number; failed: number }[] =
      [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ label, key, successful: 0, pending: 0, failed: 0 });
    }

    const dayMap = new Map(days.map((d) => [d.key, d]));
    const fallbackDay = days[days.length - 1];

    auditLogs.forEach((log) => {
      const k = new Date(log.createdAtMs).toISOString().slice(0, 10);
      const bucket = dayMap.get(k) || fallbackDay;
      if (log.status === 'success') bucket.successful += 1;
      else if (log.status === 'pending' || log.status === 'warning') bucket.pending += 1;
      else if (log.status === 'failed') bucket.failed += 1;
    });

    return days;
  }, [auditLogs]);

  // Build real status distribution for Donut Chart (Screenshot 2)
  const donutData = useMemo(() => {
    const completed = workflows.filter((w) => w.status === 'completed').length;
    const active = workflows.filter((w) => w.status === 'in_progress' || w.status === 'approved').length;
    const review = workflows.filter((w) => w.status === 'awaiting_approval').length;
    const issues = workflows.filter(
      (w) => w.status === 'failed' || w.status === 'blocked' || w.status === 'draft'
    ).length;

    return [
      { name: 'Completed', value: completed, color: '#22C55E' },
      { name: 'In Progress', value: active, color: '#3B82F6' },
      { name: 'Awaiting Approval', value: review, color: '#F59E0B' },
      { name: 'Failed / Other', value: issues, color: '#EF4444' },
    ];
  }, [workflows]);

  const sparklineData = useMemo(() => {
    return chartSeries.map((pt, idx) => ({
      i: idx,
      total: pt.successful + pt.pending + pt.failed,
      ok: pt.successful,
      pend: pt.pending,
      fail: pt.failed,
    }));
  }, [chartSeries]);

  const pendingApprovalList = useMemo(
    () => approvals.filter((a) => a.status === 'pending'),
    [approvals]
  );

  const filteredWorkflows = useMemo(() => {
    if (statusFilter === 'all') return workflows;
    return workflows.filter((w) => w.status === statusFilter);
  }, [workflows, statusFilter]);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroPrompt.trim()) return;
    onLaunchCommand(heroPrompt.trim(), 'text');
    setHeroPrompt('');
  };

  const handleExportCsv = () => {
    const rows = [
      ['Code', 'Title', 'Category', 'Status', 'Priority', 'Trigger', 'DurationMs', 'Team'],
      ...filteredWorkflows.map((w) => [
        w.code,
        `"${w.title.replace(/"/g, '""')}"`,
        w.category,
        w.status,
        w.priority,
        w.triggerType,
        String(w.durationMs),
        `"${w.recommendedTeam.replace(/"/g, '""')}"`,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowstate-workflows-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const firstName = (profile?.displayName || 'Operations Lead').split(' ')[0];

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Plane-Style Monochrome Command Header */}
      <section className="rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#121212] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="max-w-xl">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#737373] mb-1">
              Welcome back, {firstName}
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#111111] dark:text-white">
              Describe the workflow you want to automate
            </h2>
            <p className="text-xs text-[#737373] mt-1">
              Use voice or text to create workflows, query your knowledge base, or coordinate team tasks.
            </p>
          </div>

          <form onSubmit={handleHeroSubmit} className="w-full lg:max-w-lg">
            <div className="flex items-center gap-2 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] px-3 py-1.5 focus-within:border-[#111111] dark:focus-within:border-white transition-colors">
              <Sparkles className="w-4 h-4 text-[#737373] shrink-0" />
              <input
                type="text"
                value={heroPrompt}
                onChange={(e) => setHeroPrompt(e.target.value)}
                placeholder="Ask AI or describe a workflow..."
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-[#111111] dark:text-white placeholder:text-[#737373] focus:outline-none py-1.5"
              />
              <button
                type="button"
                onClick={isVoiceListening ? onStopHeroVoice : onStartHeroVoice}
                title={isVoiceListening ? 'Stop voice capture' : 'Speak workflow command'}
                className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors cursor-pointer shrink-0 ${
                  isVoiceListening
                    ? 'bg-red-500 text-white'
                    : 'text-[#525252] dark:text-[#D4D4D4] hover:bg-[#EFEFEF] dark:hover:bg-[#262626]'
                }`}
              >
                {isVoiceListening ? (
                  <AudioLines className="w-4 h-4 animate-pulse" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
              <button
                type="submit"
                aria-label="Run AI workflow command"
                className="px-3 h-8 rounded-md bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-1 transition-opacity cursor-pointer shrink-0"
              >
                <span>Run</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 2. Get Started Quick Actions */}
      <section>
        <h3 className="font-display text-sm font-semibold text-[#111111] dark:text-white mb-3">
          Get Started
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={onOpenNewWorkflow}
            className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] hover:border-[#A3A3A3] dark:hover:border-[#525252] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] dark:bg-[#1F1F1F] text-[#111111] dark:text-white flex items-center justify-center shrink-0">
                <GitBranch className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#111111] dark:text-white truncate">
                  Workflow
                </div>
                <div className="text-xs text-[#737373] truncate">
                  Create from voice or blueprint
                </div>
              </div>
            </div>
            <Plus className="w-4 h-4 text-[#737373] shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('knowledge_base')}
            className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] hover:border-[#A3A3A3] dark:hover:border-[#525252] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] dark:bg-[#1F1F1F] text-[#111111] dark:text-white flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#111111] dark:text-white truncate">
                  Knowledge Base
                </div>
                <div className="text-xs text-[#737373] dark:text-[#737373] truncate">
                  Upload PDF, DOCX & TXT docs
                </div>
              </div>
            </div>
            <Plus className="w-4 h-4 text-[#737373] shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('approvals')}
            className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] hover:border-[#A3A3A3] dark:hover:border-[#525252] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] dark:bg-[#1F1F1F] text-[#111111] dark:text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#111111] dark:text-white truncate">
                  Approvals Queue
                </div>
                <div className="text-xs text-[#737373] truncate">
                  {metrics.pendingApprovals} pending authorization
                </div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#737373] shrink-0" />
          </button>
        </div>
      </section>

      {/* 3. Compact 5-Column Monochrome KPI Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          {
            label: 'Total Workflows',
            value: metrics.totalWorkflows,
            sub: `${metrics.successRate}% completion rate`,
            icon: GitBranch,
          },
          {
            label: 'Active Workflows',
            value: metrics.activeWorkflows,
            sub: 'In progress or review',
            icon: Activity,
          },
          {
            label: 'Pending Approvals',
            value: metrics.pendingApprovals,
            sub: 'Human-in-the-loop gate',
            icon: Clock,
          },
          {
            label: 'Completed Tasks',
            value: metrics.completedTasks,
            sub: `of ${tasks.length} total tasks`,
            icon: CheckCircle2,
          },
          {
            label: 'Failed Workflows',
            value: metrics.failedWorkflows,
            sub: metrics.failedWorkflows === 0 ? 'All runs nominal' : 'Requires review',
            icon: XCircle,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-medium text-[#737373] truncate">
                  {card.label}
                </span>
                <Icon className="w-3.5 h-3.5 text-[#737373] shrink-0" />
              </div>
              <div className="font-display text-xl font-bold text-[#111111] dark:text-white tabular-nums">
                {card.value}
              </div>
              <div className="text-[11px] text-[#737373] mt-0.5 truncate">
                {card.sub}
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. Execution Overview & Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 rounded-lg bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display text-sm font-semibold text-[#111111] dark:text-white">
                Workflow Execution Overview
              </h3>
              <div className="flex items-center gap-4 mt-1 text-[11px] text-[#737373]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-1 rounded-full bg-[#111111] dark:bg-white" />
                  Successful
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-1 rounded-full bg-[#737373]" />
                  Human Review
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-1 rounded-full bg-red-500" />
                  Failed
                </span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-[#737373] px-2.5 py-1 rounded-md border border-[#E5E5E5] dark:border-[#262626]">
              Last 7 Days
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSeries} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="execSuccessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#737373" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#737373" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="execFailGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#525252" strokeOpacity={0.2} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="successful"
                  name="Successful"
                  stroke="#3B82F6"
                  strokeWidth={2.2}
                  fill="url(#execSuccessGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  name="Human Review"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={0}
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  name="Failed"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#execFailGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity (Exact Screenshot 2 Right Card) */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-[#111111] dark:text-white">
              Recent Activity
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Audit Log
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-1">
            {auditLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 pb-3 border-b border-[#E5E5E5] dark:border-[#262626]/80 last:border-0 last:pb-0"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    log.status === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : log.status === 'failed'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {log.status === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : log.status === 'failed' ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#111111] dark:text-white truncate">
                    {log.workflowTitle}
                  </div>
                  <div className="text-[11px] text-[#737373] dark:text-[#737373] line-clamp-2 mt-0.5">
                    {log.summary}
                  </div>
                  <div className="text-[10px] font-mono text-[#737373] mt-1 tabular-nums">
                    {new Date(log.createdAtMs).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {log.isSimulated ? ' · Simulated' : ''}
                  </div>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-xs text-[#737373] dark:text-[#737373] py-8 text-center">
                No execution activity logged yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Bottom 3-Column Executive Cards (Screenshot 2) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Workflows */}
        <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-semibold text-[#111111] dark:text-white">
              Recent Workflows
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('workflows')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="space-y-2.5">
            {workflows.slice(0, 5).map((wf) => (
              <button
                key={wf.id}
                type="button"
                onClick={() => onSelectWorkflow(wf)}
                className="w-full flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F]/60 transition-colors text-left cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#111111] dark:text-white truncate">
                    {wf.title}
                  </div>
                  <div className="text-[11px] text-[#737373] dark:text-[#737373]">
                    {wf.category} · {wf.steps.length} steps
                  </div>
                </div>
                <span className="font-mono text-[11px] text-[#737373] dark:text-[#737373] tabular-nums shrink-0">
                  {wf.durationMs}ms
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Human Review Queue */}
        <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-semibold text-[#111111] dark:text-white">
              Human Review Queue
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('approvals')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {pendingApprovalList.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#737373] dark:text-[#737373]">
              No pending actions awaiting human authorization.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingApprovalList.slice(0, 4).map((apr, idx) => (
                <button
                  key={apr.id}
                  type="button"
                  onClick={() => onNavigate('approvals')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F]/60 transition-colors text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono text-xs font-semibold flex items-center justify-center shrink-0 tabular-nums">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#111111] dark:text-white truncate">
                      {apr.workflowTitle}
                    </div>
                    <div className="text-[11px] text-[#737373] dark:text-[#737373] truncate">
                      {apr.actionType} · {apr.riskLevel} risk
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Status Donut (Exact Screenshot 2 Bottom-Right Card) */}
        <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5 flex flex-col justify-between">
          <h3 className="font-display text-sm font-semibold text-[#111111] dark:text-white mb-2">
            Workflow Status Distribution
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    innerRadius={38}
                    outerRadius={54}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-display text-xl font-bold text-[#111111] dark:text-white tabular-nums">
                  {metrics.totalWorkflows}
                </span>
                <span className="text-[10px] text-[#737373]">Total</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs">
              {donutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[#525252] dark:text-[#D4D4D4] truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="font-mono font-semibold text-[#111111] dark:text-white tabular-nums">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('workflows')}
            className="mt-4 w-full py-2 rounded-xl bg-[#FAFAFA] dark:bg-[#202020]/80 hover:bg-blue-50 dark:hover:bg-[#1F1F1F] text-xs font-medium text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
          >
            Manage Workflows →
          </button>
        </div>
      </section>

      {/* 6. Executions Activity Table (Exact Screenshot 1 Bottom Section) */}
      <section className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#111111] dark:text-white">
              Executions Activity
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#737373]">
              Recent automation runs across workflows and connected systems
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#161616] text-[#404040] dark:text-[#E5E5E5]"
            >
              <option value="all">All Statuses</option>
              <option value="awaiting_approval">Awaiting Approval</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
            </select>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] text-[#404040] dark:text-[#E5E5E5] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E5] dark:border-[#262626] text-[11px] font-medium text-[#737373] dark:text-[#737373]">
                <th className="py-2.5 pr-4">Automation</th>
                <th className="py-2.5 px-4">Result</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Trigger</th>
                <th className="py-2.5 px-4">Updated</th>
                <th className="py-2.5 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5] dark:divide-slate-800/80 text-xs">
              {filteredWorkflows.map((wf) => {
                const st = STATUS_META[wf.status];
                return (
                  <tr
                    key={wf.id}
                    className="hover:bg-[#FAFAFA]/70 dark:hover:bg-[#1F1F1F]/40 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-[#111111] dark:text-white">
                        {wf.title}
                      </div>
                      <div className="text-[11px] text-[#737373] dark:text-[#737373] font-mono">
                        {wf.code} · {wf.category}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${st.bgClass} ${st.textClass}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#525252] dark:text-[#D4D4D4] tabular-nums whitespace-nowrap">
                      {wf.durationMs}ms
                    </td>
                    <td className="py-3 px-4 capitalize text-[#525252] dark:text-[#D4D4D4] whitespace-nowrap">
                      {wf.triggerType}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#737373] dark:text-[#737373] tabular-nums whitespace-nowrap">
                      {new Date(wf.updatedAtMs).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectWorkflow(wf)}
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredWorkflows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#737373] dark:text-[#737373]">
                    No workflows match the selected status filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
