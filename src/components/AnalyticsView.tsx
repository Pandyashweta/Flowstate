import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AuditLogItem, TaskItem, Workflow } from '../types';

interface AnalyticsViewProps {
  workflows: Workflow[];
  tasks: TaskItem[];
  auditLogs: AuditLogItem[];
}

const CHART_COLORS = ['#2563EB', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  workflows,
  tasks,
  auditLogs,
}) => {
  const stats = useMemo(() => {
    const totalWf = workflows.length;
    const completedWf = workflows.filter((w) => w.status === 'completed').length;
    const completionRate = totalWf > 0 ? Math.round((completedWf / totalWf) * 100) : 0;

    const avgExecMs =
      totalWf > 0
        ? Math.round(workflows.reduce((sum, w) => sum + (w.durationMs || 0), 0) / totalWf)
        : 0;

    const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;
    const failedActions = auditLogs.filter((l) => l.status === 'failed').length;

    return { completionRate, avgExecMs, pendingTasks, failedActions, totalWf, completedWf };
  }, [workflows, tasks, auditLogs]);

  // Real department activity bar chart data
  const departmentData = useMemo(() => {
    const map = new Map<string, { department: string; workflows: number; tasks: number }>();
    workflows.forEach((w) => {
      const curr = map.get(w.category) || { department: w.category, workflows: 0, tasks: 0 };
      curr.workflows += 1;
      map.set(w.category, curr);
    });
    tasks.forEach((t) => {
      const curr = map.get(t.department) || { department: t.department, workflows: 0, tasks: 0 };
      curr.tasks += 1;
      map.set(t.department, curr);
    });
    return Array.from(map.values()).sort((a, b) => b.workflows + b.tasks - (a.workflows + a.tasks));
  }, [workflows, tasks]);

  // Real workflow execution trends across days from actual auditLogs
  const trendData = useMemo(() => {
    const days: { day: string; key: string; executions: number; failures: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        key: d.toISOString().slice(0, 10),
        executions: 0,
        failures: 0,
      });
    }
    const map = new Map(days.map((d) => [d.key, d]));
    const fallback = days[days.length - 1];
    auditLogs.forEach((log) => {
      const k = new Date(log.createdAtMs).toISOString().slice(0, 10);
      const bucket = map.get(k) || fallback;
      bucket.executions += 1;
      if (log.status === 'failed') bucket.failures += 1;
    });
    return days;
  }, [auditLogs]);

  // Real trigger breakdown
  const triggerData = useMemo(() => {
    const counts = new Map<string, number>();
    workflows.forEach((w) => {
      counts.set(w.triggerType, (counts.get(w.triggerType) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [workflows]);

  return (
    <div className="space-y-6 pb-8">
      {/* Live KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Workflow Completion Rate',
            value: `${stats.completionRate}%`,
            sub: `${stats.completedWf} of ${stats.totalWf} workflows completed`,
          },
          {
            label: 'Average Execution Time',
            value: `${(stats.avgExecMs / 1000).toFixed(2)}s`,
            sub: `${stats.avgExecMs}ms mean across recorded runs`,
          },
          {
            label: 'Pending Tasks',
            value: String(stats.pendingTasks),
            sub: `${tasks.length - stats.pendingTasks} completed out of ${tasks.length}`,
          },
          {
            label: 'Failed Actions',
            value: String(stats.failedActions),
            sub: `Out of ${auditLogs.length} total audit log events`,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5"
          >
            <div className="text-xs font-medium text-[#737373] dark:text-[#737373]">
              {kpi.label}
            </div>
            <div className="font-display text-3xl font-bold text-[#111111] dark:text-white tabular-nums mt-2">
              {kpi.value}
            </div>
            <div className="text-[11px] text-[#737373] dark:text-[#737373] mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5">
          <h3 className="font-display text-sm font-bold text-[#111111] dark:text-white mb-1">
            Department Activity (Live Workflows & Tasks)
          </h3>
          <p className="text-xs text-[#737373] dark:text-[#737373] mb-4">
            Computed directly from active Firestore workflows and assigned tasks
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
                <XAxis
                  dataKey="department"
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
                <Tooltip />
                <Bar dataKey="workflows" name="Workflows" fill="#2563EB" radius={[6, 6, 0, 0]} />
                <Bar dataKey="tasks" name="Tasks" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5">
          <h3 className="font-display text-sm font-bold text-[#111111] dark:text-white mb-1">
            Workflow Trigger Distribution
          </h3>
          <p className="text-xs text-[#737373] dark:text-[#737373] mb-4">
            Breakdown of Voice, Chat, Manual, Scheduled, and Webhook runs
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={triggerData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={82}
                  paddingAngle={3}
                  stroke="none"
                >
                  {triggerData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs mt-2">
            {triggerData.map((t, idx) => (
              <span key={t.name} className="inline-flex items-center gap-1.5 text-[#525252] dark:text-[#D4D4D4]">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span>{t.name}:</span>
                <span className="font-mono font-semibold tabular-nums">{t.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 7-Day Execution Trend */}
      <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5">
        <h3 className="font-display text-sm font-bold text-[#111111] dark:text-white mb-1">
          7-Day Execution & Failure Trend
        </h3>
        <p className="text-xs text-[#737373] dark:text-[#737373] mb-4">
          Derived from immutable Firestore audit log timestamps
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
              <XAxis
                dataKey="day"
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
              <Tooltip />
              <Area
                type="monotone"
                dataKey="executions"
                name="Total Events"
                stroke="#2563EB"
                strokeWidth={2.2}
                fill="url(#trendBlue)"
              />
              <Area
                type="monotone"
                dataKey="failures"
                name="Failed Events"
                stroke="#EF4444"
                strokeWidth={2}
                fillOpacity={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
