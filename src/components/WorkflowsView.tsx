import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Columns3,
  List,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { AuditLogItem, PriorityLevel, TaskItem, Workflow, WorkflowStatus } from '../types';

interface WorkflowsViewProps {
  workflows: Workflow[];
  tasks: TaskItem[];
  auditLogs: AuditLogItem[];
  departments?: string[];
  initialDepartmentFilter: string;
  searchQuery: string;
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (wf: Workflow | null) => void;
  onUpdateStatus: (wf: Workflow, status: WorkflowStatus, note?: string) => Promise<void>;
  onDeleteWorkflow: (wf: Workflow) => Promise<void>;
  onOpenNewWorkflow: () => void;
}

const KANBAN_COLUMNS: { id: WorkflowStatus; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'awaiting_approval', label: 'Awaiting Approval' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
];

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: 'text-[#737373] dark:text-[#737373]',
  medium: 'text-blue-600 dark:text-blue-400',
  high: 'text-amber-600 dark:text-amber-400',
  critical: 'text-red-600 dark:text-red-400',
};

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({
  workflows,
  tasks,
  auditLogs,
  departments = [],
  initialDepartmentFilter,
  searchQuery,
  selectedWorkflow,
  onSelectWorkflow,
  onUpdateStatus,
  onDeleteWorkflow,
  onOpenNewWorkflow,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [departmentFilter, setDepartmentFilter] = useState<string>(initialDepartmentFilter || 'All');

  React.useEffect(() => {
    setDepartmentFilter(initialDepartmentFilter || 'All');
  }, [initialDepartmentFilter]);

  const categories = useMemo(() => {
    const set = new Set<string>(['All', ...departments.filter(Boolean)]);
    workflows.forEach((w) => {
      if (w.category) set.add(w.category);
    });
    return Array.from(set);
  }, [workflows, departments]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return workflows.filter((w) => {
      if (departmentFilter !== 'All' && w.category !== departmentFilter) return false;
      if (
        q &&
        !w.title.toLowerCase().includes(q) &&
        !w.code.toLowerCase().includes(q) &&
        !w.category.toLowerCase().includes(q) &&
        !w.recommendedTeam.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [workflows, departmentFilter, searchQuery]);

  const activeWf = selectedWorkflow
    ? workflows.find((w) => w.id === selectedWorkflow.id) || selectedWorkflow
    : null;

  const activeWfTasks = useMemo(
    () => (activeWf ? tasks.filter((t) => t.workflowId === activeWf.id) : []),
    [activeWf, tasks]
  );

  const activeWfLogs = useMemo(
    () => (activeWf ? auditLogs.filter((l) => l.workflowId === activeWf.id) : []),
    [activeWf, auditLogs]
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Toolbar matching Screenshot 3 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-sm font-bold text-[#111111] dark:text-white mr-2">
            Workflows
          </span>
          <span className="text-xs font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md tabular-nums">
            {filtered.length}
          </span>

          <div className="h-4 w-px bg-[#E5E5E5] dark:bg-[#202020] mx-1 hidden sm:block" />

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#404040] dark:text-[#E5E5E5]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Departments' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-lg bg-[#F5F5F5] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626]">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-[#202020] text-[#111111] dark:text-white shadow-xs'
                  : 'text-[#737373] dark:text-[#737373]'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#202020] text-[#111111] dark:text-white shadow-xs'
                  : 'text-[#737373] dark:text-[#737373]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenNewWorkflow}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Kanban View (Exact Screenshot 3 Card Rhythm) */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-3">
          {KANBAN_COLUMNS.map((col) => {
            const colItems = filtered.filter((w) => {
              if (col.id === 'in_progress') return w.status === 'in_progress' || w.status === 'approved';
              if (col.id === 'blocked') return w.status === 'blocked' || w.status === 'paused';
              if (col.id === 'failed') return w.status === 'failed' || w.status === 'cancelled';
              return w.status === col.id;
            });
            return (
              <div
                key={col.id}
                className="w-[290px] shrink-0 rounded-2xl bg-[#FAFAFA] dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#262626]/90 p-3 flex flex-col max-h-[680px]"
              >
                <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-[#E5E5E5]/60 dark:border-[#262626]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#262626] dark:text-[#F5F5F5]">
                      {col.label}
                    </span>
                    <span className="text-[11px] font-mono text-[#737373] tabular-nums">
                      {colItems.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                  {colItems.map((wf) => (
                    <button
                      key={wf.id}
                      type="button"
                      onClick={() => onSelectWorkflow(wf)}
                      className="w-full text-left p-3.5 rounded-xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#737373] mb-1.5">
                        <span>{wf.code}</span>
                        <span className={`capitalize font-sans font-medium ${PRIORITY_COLORS[wf.priority]}`}>
                          {wf.priority}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#111111] dark:text-white leading-snug mb-2">
                        {wf.title}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#737373] dark:text-[#737373] pt-2 border-t border-[#E5E5E5] dark:border-[#262626]">
                        <span className="truncate">{wf.category}</span>
                        <span className="font-mono tabular-nums shrink-0">
                          {wf.steps.length} steps
                        </span>
                      </div>
                    </button>
                  ))}

                  {colItems.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-[#737373]">
                      No workflows in {col.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] dark:border-[#262626] text-[11px] font-medium text-[#737373]">
                  <th className="py-3 px-4">Code & Workflow</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] dark:divide-slate-800 text-xs">
                {filtered.map((wf) => (
                  <tr
                    key={wf.id}
                    className="hover:bg-[#FAFAFA]/70 dark:hover:bg-[#1F1F1F]/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectWorkflow(wf)}
                        className="text-left cursor-pointer"
                      >
                        <div className="font-semibold text-[#111111] dark:text-white hover:text-blue-600">
                          {wf.title}
                        </div>
                        <div className="text-[11px] font-mono text-[#737373]">
                          {wf.code} · {wf.triggerType}
                        </div>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-[#525252] dark:text-[#D4D4D4]">{wf.category}</td>
                    <td className="py-3 px-4 text-[#525252] dark:text-[#D4D4D4]">
                      {wf.recommendedTeam}
                    </td>
                    <td className={`py-3 px-4 capitalize font-medium ${PRIORITY_COLORS[wf.priority]}`}>
                      {wf.priority}
                    </td>
                    <td className="py-3 px-4 capitalize text-[#404040] dark:text-[#E5E5E5]">
                      {wf.status.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectWorkflow(wf)}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Workflow Slide-Over Drawer */}
      {activeWf && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/35 backdrop-blur-xs"
            onClick={() => onSelectWorkflow(null)}
          />
          <div className="relative z-10 w-full max-w-xl bg-white dark:bg-[#121212] border-l border-[#E5E5E5] dark:border-[#262626] h-full overflow-y-auto p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-blue-600 dark:text-blue-400">
                  {activeWf.code} · {activeWf.category}
                </div>
                <h2 className="font-display text-lg font-bold text-[#111111] dark:text-white mt-0.5">
                  {activeWf.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectWorkflow(null)}
                className="p-1.5 rounded-lg text-[#737373] hover:bg-[#F2F2F2] dark:hover:bg-[#1F1F1F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Workflow Lifecycle Action Controls */}
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[#E5E5E5] dark:border-[#262626]">
              {activeWf.status !== 'in_progress' && activeWf.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => void onUpdateStatus(activeWf, 'in_progress')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-medium cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume / Start</span>
                </button>
              )}
              {activeWf.status === 'in_progress' && (
                <button
                  type="button"
                  onClick={() => void onUpdateStatus(activeWf, 'blocked', 'Paused manually by operator.')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              )}
              {activeWf.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => void onUpdateStatus(activeWf, 'completed', 'Completed manually via workflow detail.')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Completed</span>
                </button>
              )}
              {activeWf.status !== 'failed' && activeWf.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => void onUpdateStatus(activeWf, 'failed', 'Workflow cancelled by operator.')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-medium cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  await onDeleteWorkflow(activeWf);
                  onSelectWorkflow(null);
                }}
                className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#737373] hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-[#525252] dark:text-[#D4D4D4] leading-relaxed">
                {activeWf.description}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626]">
                <div>
                  <div className="text-[11px] text-[#737373]">Status</div>
                  <div className="font-semibold text-[#111111] dark:text-white capitalize mt-0.5">
                    {activeWf.status.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#737373]">Assigned Team</div>
                  <div className="font-semibold text-[#111111] dark:text-white mt-0.5">
                    {activeWf.recommendedTeam}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#737373]">Trigger</div>
                  <div className="font-semibold text-[#111111] dark:text-white capitalize mt-0.5">
                    {activeWf.triggerType}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#737373]">Execution Time</div>
                  <div className="font-mono font-semibold text-[#111111] dark:text-white tabular-nums mt-0.5">
                    {activeWf.durationMs}ms
                  </div>
                </div>
              </div>

              {activeWf.troubleshootingSummary && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
                  <div className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                    Grounded Knowledge Summary
                  </div>
                  <p className="text-[#404040] dark:text-[#D4D4D4] leading-relaxed">
                    {activeWf.troubleshootingSummary}
                  </p>
                  {activeWf.ragSources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-200/60 dark:border-blue-900 text-[11px] text-blue-700 dark:text-blue-300">
                      Sources: {activeWf.ragSources.join(' · ')}
                    </div>
                  )}
                </div>
              )}

              {/* Ordered Steps */}
              <div>
                <h4 className="font-semibold text-[#111111] dark:text-white mb-2">
                  Workflow Steps ({activeWf.steps.length})
                </h4>
                <ol className="space-y-1.5">
                  {activeWf.steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#FAFAFA] dark:bg-[#161616]/60 border border-[#E5E5E5] dark:border-[#262626]"
                    >
                      <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        0{i + 1}
                      </span>
                      <span className="text-[#404040] dark:text-[#E5E5E5]">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Linked Tasks */}
              <div>
                <h4 className="font-semibold text-[#111111] dark:text-white mb-2">
                  Linked Tasks ({activeWfTasks.length})
                </h4>
                {activeWfTasks.length === 0 ? (
                  <p className="text-[#737373]">No tasks linked yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activeWfTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-[#111111] dark:text-white truncate">
                            {t.code} · {t.title}
                          </div>
                          <div className="text-[11px] text-[#737373]">
                            {t.assignee} · Due {t.dueDate}
                          </div>
                        </div>
                        <span className="text-[11px] capitalize font-mono text-[#737373] shrink-0">
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Workflow Execution History */}
              <div>
                <h4 className="font-semibold text-[#111111] dark:text-white mb-2">
                  Execution History ({activeWfLogs.length})
                </h4>
                {activeWfLogs.length === 0 ? (
                  <p className="text-[#737373]">No audit entries recorded for this workflow yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activeWfLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-lg bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626]"
                      >
                        <div className="flex items-center justify-between text-[11px] text-[#737373] mb-0.5">
                          <span className="font-medium text-[#404040] dark:text-[#D4D4D4]">
                            {log.actor || 'System'} · {log.eventType}
                          </span>
                          <span className="font-mono tabular-nums inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Number.isFinite(log.createdAtMs)
                              ? new Date(log.createdAtMs).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                        </div>
                        <div className="text-[#525252] dark:text-[#D4D4D4]">{log.summary}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
