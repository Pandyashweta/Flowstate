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
} from '../types';

interface DashboardViewProps {
  profile: UserProfile | null;
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
    textClass: 'text-slate-600 dark:text-slate-300',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
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
      {/* 1. Hero Prompt & Voice Banner (Exact Screenshot 1 Design) */}
      <section className="relative overflow-hidden rounded-2xl border border-[#E2E8F5] dark:border-slate-800 bg-gradient-to-r from-[#F4F6FD] via-[#F2ECFD] to-[#E6ECFA] dark:from-[#121A2F] dark:via-[#1B1837] dark:to-[#13223D] p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
            Welcome back, {firstName}
          </p>
          <h2 className="font-display text-2xl sm:text-[32px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.18] mb-5">
            Describe the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400">
              Automation
            </span>
            <br />
            You Want to Create
          </h2>

          {/* Embedded Voice & Text Prompt Bar */}
          <form
            onSubmit={handleHeroSubmit}
            className="flex items-center gap-2 bg-white dark:bg-slate-900/95 border border-[#DDE4F2] dark:border-slate-700 rounded-full p-1.5 pl-4 shadow-xs focus-within:ring-2 focus-within:ring-blue-500/30"
          >
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <input
              type="text"
              value={heroPrompt}
              onChange={(e) => setHeroPrompt(e.target.value)}
              placeholder="Example: A customer cannot log into their account. Check incidents and create a ticket..."
              className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={isVoiceListening ? onStopHeroVoice : onStartHeroVoice}
              title={isVoiceListening ? 'Stop voice capture' : 'Speak workflow command'}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors cursor-pointer shrink-0 ${
                isVoiceListening
                  ? 'bg-red-500 text-white'
                  : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* One-Click Real-World Customer Support Demo Trigger */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Live demo scenario:</span>
            <button
              type="button"
              onClick={() => onLaunchCommand(DEMO_PROMPT, 'voice')}
              className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300 hover:underline font-medium cursor-pointer text-left"
            >
              <span>“Customer login failure → RAG check → ticket & approval”</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Sculptural 3D Star Visual from Screenshot 1 */}
        <img
          src="/src/assets/images/hero_prism_star_1795690515955.jpg"
          alt="Flowstate Automation Star"
          referrerPolicy="no-referrer"
          className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 w-52 h-52 lg:w-60 lg:h-60 object-cover rounded-2xl mix-blend-multiply dark:mix-blend-screen opacity-90 pointer-events-none select-none"
        />
      </section>

      {/* 2. Get Started Quick Actions (Screenshot 1) */}
      <section>
        <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Get Started
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={onOpenNewWorkflow}
            className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <GitBranch className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  Workflow
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Create from voice or blueprint
                </div>
              </div>
            </div>
            <Plus className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('knowledge_base')}
            className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  Knowledge Base
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Upload PDF, DOCX & TXT docs
                </div>
              </div>
            </div>
            <Plus className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('approvals')}
            className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  Approvals Queue
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {metrics.pendingApprovals} pending authorization
                </div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </section>

      {/* 3. 5-Column KPI Sparkline Cards (Exact Screenshot 2 Design — 100% Real Firestore Data) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          {
            label: 'Total Workflows',
            value: metrics.totalWorkflows,
            sub: `${metrics.successRate}% completion rate`,
            icon: GitBranch,
            iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
            stroke: '#3B82F6',
            dataKey: 'total',
          },
          {
            label: 'Active Workflows',
            value: metrics.activeWorkflows,
            sub: 'In progress or review',
            icon: Activity,
            iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
            stroke: '#6366F1',
            dataKey: 'ok',
          },
          {
            label: 'Pending Approvals',
            value: metrics.pendingApprovals,
            sub: 'Human-in-the-loop gate',
            icon: Clock,
            iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
            stroke: '#F59E0B',
            dataKey: 'pend',
          },
          {
            label: 'Completed Tasks',
            value: metrics.completedTasks,
            sub: `of ${tasks.length} total tasks`,
            icon: CheckCircle2,
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
            stroke: '#10B981',
            dataKey: 'ok',
          },
          {
            label: 'Failed Workflows',
            value: metrics.failedWorkflows,
            sub: metrics.failedWorkflows === 0 ? 'All runs nominal' : 'Requires review',
            icon: XCircle,
            iconBg: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400',
            stroke: '#EF4444',
            dataKey: 'fail',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                    {card.label}
                  </span>
                </div>
                <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {card.sub}
                </div>
              </div>
              <div className="h-10 mt-3 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <defs>
                      <linearGradient id={`grad-${card.label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.stroke} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={card.stroke} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey={card.dataKey}
                      stroke={card.stroke}
                      strokeWidth={2}
                      fill={`url(#grad-${card.label.replace(/\s/g, '')})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. Main Charts & Recent Activity (Exact Screenshot 2 Middle Row) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Workflow Execution Overview
              </h3>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-1 rounded-full bg-blue-500" />
                  Successful
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-1 rounded-full bg-amber-500" />
                  Human Review
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-1 rounded-full bg-red-500" />
                  Failed
                </span>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg border border-[#E6ECF5] dark:border-slate-800">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSeries} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="execSuccessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="execFailGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
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
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
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
                className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80 last:border-0 last:pb-0"
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
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {log.workflowTitle}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {log.summary}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 tabular-nums">
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
              <div className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                No execution activity logged yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Bottom 3-Column Executive Cards (Screenshot 2) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Workflows */}
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
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
                className="w-full flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {wf.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {wf.category} · {wf.steps.length} steps
                  </div>
                </div>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                  {wf.durationMs}ms
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Human Review Queue */}
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
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
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              No pending actions awaiting human authorization.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingApprovalList.slice(0, 4).map((apr, idx) => (
                <button
                  key={apr.id}
                  type="button"
                  onClick={() => onNavigate('approvals')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono text-xs font-semibold flex items-center justify-center shrink-0 tabular-nums">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {apr.workflowTitle}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {apr.actionType} · {apr.riskLevel} risk
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Status Donut (Exact Screenshot 2 Bottom-Right Card) */}
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 p-5 flex flex-col justify-between">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-2">
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
                <span className="font-display text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {metrics.totalWorkflows}
                </span>
                <span className="text-[10px] text-slate-400">Total</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs">
              {donutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('workflows')}
            className="mt-4 w-full py-2 rounded-xl bg-[#F4F7FC] dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-800 text-xs font-medium text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
          >
            Manage Workflows →
          </button>
        </div>
      </section>

      {/* 6. Executions Activity Table (Exact Screenshot 1 Bottom Section) */}
      <section className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Executions Activity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recent automation runs across workflows and connected systems
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#E6ECF5] dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
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
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6ECF5] dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                <th className="py-2.5 pr-4">Automation</th>
                <th className="py-2.5 px-4">Result</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Trigger</th>
                <th className="py-2.5 px-4">Updated</th>
                <th className="py-2.5 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filteredWorkflows.map((wf) => {
                const st = STATUS_META[wf.status];
                return (
                  <tr
                    key={wf.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {wf.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
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
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                      {wf.durationMs}ms
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {wf.triggerType}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
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
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
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
