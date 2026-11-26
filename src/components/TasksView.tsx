import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Columns3,
  Link2,
  List,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { PriorityLevel, TaskItem, TaskStatus, Workflow } from '../types';

interface TasksViewProps {
  tasks: TaskItem[];
  workflows: Workflow[];
  searchQuery: string;
  onCreateTask: (input: {
    workflowId: string;
    title: string;
    description: string;
    assignee: string;
    department: string;
    priority: PriorityLevel;
    status: TaskStatus;
    dueDate: string;
    dependencies: string[];
    integrationAction?: string;
    requiresApproval?: boolean;
  }) => Promise<string | undefined>;
  onUpdateTaskStatus: (task: TaskItem, status: TaskStatus) => Promise<void>;
  onAddComment: (task: TaskItem, text: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const TASK_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'completed', label: 'Completed' },
];

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  workflows,
  searchQuery,
  onCreateTask,
  onUpdateTaskStatus,
  onAddComment,
  onDeleteTask,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWorkflowId, setNewWorkflowId] = useState(workflows[0]?.id || '');
  const [newAssignee, setNewAssignee] = useState('Marcus Vance');
  const [newDepartment, setNewDepartment] = useState('Customer Support');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [newDep, setNewDep] = useState('');

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetWfId = newWorkflowId || workflows[0]?.id;
    if (!targetWfId || !newTitle.trim()) return;
    await onCreateTask({
      workflowId: targetWfId,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Operational workflow task.',
      assignee: newAssignee.trim() || 'Unassigned',
      department: newDepartment.trim() || 'Operations',
      priority: newPriority,
      status: 'todo',
      dueDate: newDueDate,
      dependencies: newDep.trim() ? [newDep.trim()] : [],
      requiresApproval: false,
    });
    setNewTitle('');
    setNewDesc('');
    setNewDep('');
    setShowCreateModal(false);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !commentInput.trim()) return;
    await onAddComment(activeTask, commentInput.trim());
    setCommentInput('');
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header Toolbar matching Screenshot 3 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
            Work Items & Tasks
          </span>
          <span className="text-xs font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md tabular-nums">
            {filteredTasks.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-lg bg-[#F1F5F9] dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            type="button"
            disabled={workflows.length === 0}
            onClick={() => {
              setNewWorkflowId(workflows[0]?.id || '');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Work Item</span>
          </button>
        </div>
      </div>

      {/* Kanban Board (Exact Screenshot 3 Card Anatomy) */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-3">
          {TASK_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="w-[292px] shrink-0 rounded-2xl bg-[#F8FAFD] dark:bg-[#0F172A] border border-[#E6ECF5] dark:border-slate-800/90 p-3 flex flex-col max-h-[680px]"
              >
                <div className="flex items-center justify-between px-1 pb-2.5 mb-2.5 border-b border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {col.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                  {colTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className="w-full text-left p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400 mb-1.5">
                        <span>{task.code}</span>
                        <span
                          className={`capitalize font-sans font-medium ${
                            task.priority === 'critical'
                              ? 'text-red-600 dark:text-red-400'
                              : task.priority === 'high'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white leading-snug mb-2.5">
                        {task.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                          {task.assignee
                            .split(' ')
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                        <span className="truncate max-w-[100px]">{task.department}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Calendar className="w-3 h-3" />
                          {task.dueDate.slice(5)}
                        </span>
                        {task.comments.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 ml-auto font-mono">
                            <MessageSquare className="w-3 h-3" />
                            {task.comments.length}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      No tasks in {col.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400">
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredTasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>
                      <div className="text-[11px] font-mono text-slate-400">{t.code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{t.assignee}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{t.department}</td>
                    <td className="py-3 px-4 capitalize font-medium">{t.priority}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500">{t.dueDate}</td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.status}
                        onChange={(e) => void onUpdateTaskStatus(t, e.target.value as TaskStatus)}
                        className="text-xs px-2 py-1 rounded-md border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        {TASK_COLUMNS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Detail & Comments Drawer */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/35 backdrop-blur-xs"
            onClick={() => setSelectedTaskId(null)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111827] border-l border-[#E6ECF5] dark:border-slate-800 h-full overflow-y-auto p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-blue-600 dark:text-blue-400">
                  {activeTask.code} · {activeTask.department}
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {activeTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Status:</span>
                <select
                  value={activeTask.status}
                  onChange={(e) =>
                    void onUpdateTaskStatus(activeTask, e.target.value as TaskStatus)
                  }
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#E6ECF5] dark:border-slate-700 bg-[#F8FAFD] dark:bg-slate-900 font-medium"
                >
                  {TASK_COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteTask(activeTask.id);
                  setSelectedTaskId(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

            <div className="space-y-4 text-xs flex-1">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeTask.description}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800">
                <div>
                  <div className="text-[11px] text-slate-400">Assignee</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {activeTask.assignee}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Due Date</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                    {activeTask.dueDate}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Priority</div>
                  <div className="font-semibold capitalize text-slate-900 dark:text-white mt-0.5">
                    {activeTask.priority}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Integration</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                    {activeTask.integrationAction || 'Internal'}
                  </div>
                </div>
              </div>

              {activeTask.dependencies.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Link2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dependencies: {activeTask.dependencies.join(', ')}</span>
                </div>
              )}

              {/* Comments */}
              <div className="pt-2">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Activity & Comments ({activeTask.comments.length})
                </h4>
                <div className="space-y-2 mb-3">
                  {activeTask.comments.length === 0 ? (
                    <div className="text-slate-400">No comments yet.</div>
                  ) : (
                    activeTask.comments.map((c, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-[#FAFBFD] dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {c}
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Work Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setShowCreateModal(false)}
          />
          <form
            onSubmit={handleCreateSubmit}
            className="relative z-10 w-full max-w-md bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Add Work Item
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Parent Workflow
                </label>
                <select
                  value={newWorkflowId}
                  onChange={(e) => setNewWorkflowId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {workflows.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} — {w.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="e.g., Verify SSO metadata thumbprint"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Dependency (optional)
                </label>
                <input
                  type="text"
                  value={newDep}
                  onChange={(e) => setNewDep(e.target.value)}
                  placeholder="e.g., TSK-201"
                  className="w-full px-3 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
              >
                Save Work Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
