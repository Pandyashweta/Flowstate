import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Columns3,
  List,
  Loader2,
  Pause,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  AuditLogItem,
  PriorityLevel,
  ProposedWorkflowDraft,
  TaskItem,
  Workflow,
  WorkflowStatus,
} from '../types';
import {
  buildDraftFromTemplate,
  WORKFLOW_TEMPLATES,
  WorkflowTemplate,
} from '../lib/workflowTemplates';

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
  onExecuteWorkflow?: (workflowId: string) => Promise<{ workflow: Workflow; duplicate: boolean }>;
  onDeleteWorkflow: (wf: Workflow) => Promise<void>;
  onCreateFromTemplate?: (
    draft: ProposedWorkflowDraft,
    opts: {
      sourcePrompt: string;
      triggerType: 'voice' | 'chat';
      ragSources: string[];
      submitForApproval: boolean;
    }
  ) => Promise<{ workflowId: string; approvalId?: string }>;
  onOpenNewWorkflow: () => void;
  onOpenAiGenerate?: () => void;
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
  low: 'text-[#737373] dark:text-[#A3A3A3]',
  medium: 'text-blue-600 dark:text-blue-400',
  high: 'text-amber-600 dark:text-amber-400',
  critical: 'text-red-600 dark:text-red-400',
};

const TEMPLATE_CATEGORIES = [
  'All',
  ...Array.from(new Set(WORKFLOW_TEMPLATES.map((t) => t.category))),
];

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
  onExecuteWorkflow,
  onDeleteWorkflow,
  onCreateFromTemplate,
  onOpenNewWorkflow,
  onOpenAiGenerate,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'library'>('kanban');
  const [departmentFilter, setDepartmentFilter] = useState<string>(initialDepartmentFilter || 'All');
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [execFeedback, setExecFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Workflow Library state
  const [libraryExpanded, setLibraryExpanded] = useState<boolean>(workflows.length === 0);
  const [templateCategory, setTemplateCategory] = useState<string>('All');
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [customPriority, setCustomPriority] = useState<PriorityLevel>('medium');
  const [customRequireApproval, setCustomRequireApproval] = useState<boolean>(true);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [templateBanner, setTemplateBanner] = useState<{
    type: 'success' | 'error';
    text: string;
    workflowId?: string;
  } | null>(null);

  React.useEffect(() => {
    setDepartmentFilter(initialDepartmentFilter || 'All');
  }, [initialDepartmentFilter]);

  React.useEffect(() => {
    setExecFeedback(null);
  }, [selectedWorkflow?.id]);

  React.useEffect(() => {
    if (workflows.length === 0) {
      setLibraryExpanded(true);
    }
  }, [workflows.length]);

  const openTemplatePreview = (tpl: WorkflowTemplate) => {
    setPreviewTemplate(tpl);
    setCustomTitle(tpl.name);
    setCustomCategory(tpl.category);
    setCustomPriority(tpl.priority);
    setCustomRequireApproval(tpl.requiresApprovalByDefault);
  };

  const handleUseTemplate = async (
    tpl: WorkflowTemplate,
    overrides?: {
      title?: string;
      category?: string;
      priority?: PriorityLevel;
      includeApproval?: boolean;
    }
  ) => {
    if (!onCreateFromTemplate || creatingTemplateId) return;
    setCreatingTemplateId(tpl.id);
    setTemplateBanner(null);

    try {
      const draft = buildDraftFromTemplate(tpl, overrides);
      const includeApproval =
        overrides?.includeApproval !== undefined
          ? overrides.includeApproval
          : tpl.requiresApprovalByDefault;

      const created = await onCreateFromTemplate(draft, {
        sourcePrompt: `Created from Workflow Library template: ${tpl.name}`,
        triggerType: 'chat',
        ragSources: [`Template: ${tpl.name}`],
        submitForApproval: includeApproval && Boolean(draft.approvalRequest),
      });

      setPreviewTemplate(null);
      if (viewMode === 'library') {
        setViewMode('kanban');
      }
      setTemplateBanner({
        type: 'success',
        text: created.approvalId
          ? `Launched "${draft.title}" with ${draft.steps.length} steps, ${draft.tasks.length} tasks, and a pending approval gate.`
          : `Launched "${draft.title}" with ${draft.steps.length} steps and ${draft.tasks.length} tasks.`,
        workflowId: created.workflowId,
      });
    } catch (err) {
      setTemplateBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to create workflow from template.',
      });
    } finally {
      setCreatingTemplateId(null);
    }
  };

  const handleRunExecute = async (wf: Workflow) => {
    if (!onExecuteWorkflow || executingId) return;
    setExecutingId(wf.id);
    setExecFeedback(null);
    try {
      const res = await onExecuteWorkflow(wf.id);
      setExecFeedback({
        type: 'success',
        text: res.duplicate
          ? `Workflow ${wf.code} was already executed.`
          : `Executed ${wf.code} successfully (${res.workflow.steps.length} steps verified and logged).`,
      });
    } catch (err) {
      setExecFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to execute workflow.',
      });
    } finally {
      setExecutingId(null);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>(['All', ...departments.filter(Boolean)]);
    workflows.forEach((w) => {
      if (w.category) set.add(w.category);
    });
    return Array.from(set);
  }, [workflows, departments]);

  const availableDepartmentOptions = useMemo(() => {
    const set = new Set<string>([
      ...departments.filter(Boolean),
      ...WORKFLOW_TEMPLATES.map((t) => t.category),
    ]);
    return Array.from(set);
  }, [departments]);

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

  const filteredTemplates = useMemo(() => {
    const q = (templateSearch || searchQuery).trim().toLowerCase();
    return WORKFLOW_TEMPLATES.filter((tpl) => {
      if (templateCategory !== 'All' && tpl.category !== templateCategory) return false;
      if (
        q &&
        !tpl.name.toLowerCase().includes(q) &&
        !tpl.summary.toLowerCase().includes(q) &&
        !tpl.category.toLowerCase().includes(q) &&
        !tpl.steps.some((s) => s.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [templateCategory, templateSearch, searchQuery]);

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

  const featuredTemplates = WORKFLOW_TEMPLATES.slice(0, 4);

  return (
    <div className="space-y-5 pb-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-sm font-bold text-[#111111] dark:text-white mr-1">
            Workflows
          </span>
          <span className="text-xs font-mono text-[#525252] dark:text-[#A3A3A3] tabular-nums">
            {viewMode === 'library'
              ? `${filteredTemplates.length} templates`
              : `${filtered.length} active`}
          </span>

          {viewMode !== 'library' && (
            <>
              <div className="h-4 w-px bg-[#E5E5E5] dark:bg-[#262626] mx-1 hidden sm:block" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                aria-label="Filter workflows by department"
                className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#404040] dark:text-[#E5E5E5]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Departments' : cat}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Workflows view mode"
            className="inline-flex items-center p-1 rounded-lg bg-[#F5F5F5] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'kanban'}
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-[#242424] text-[#111111] dark:text-white shadow-xs'
                  : 'text-[#737373] hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#242424] text-[#111111] dark:text-white shadow-xs'
                  : 'text-[#737373] hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'library'}
              onClick={() => setViewMode('library')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'library'
                  ? 'bg-white dark:bg-[#242424] text-[#111111] dark:text-white shadow-xs'
                  : 'text-[#737373] hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Library</span>
            </button>
          </div>

          {onOpenAiGenerate && (
            <button
              type="button"
              onClick={onOpenAiGenerate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Generate</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewWorkflow}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Template Launch Feedback Banner */}
      {templateBanner && (
        <div
          role="status"
          className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs ${
            templateBanner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {templateBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{templateBanner.text}</span>
          </div>
          <div className="flex items-center gap-3">
            {templateBanner.workflowId && (
              <button
                type="button"
                onClick={() => {
                  const created = workflows.find((w) => w.id === templateBanner.workflowId);
                  if (created) onSelectWorkflow(created);
                }}
                className="font-semibold underline underline-offset-2 cursor-pointer whitespace-nowrap"
              >
                Inspect Workflow
              </button>
            )}
            <button
              type="button"
              onClick={() => setTemplateBanner(null)}
              aria-label="Dismiss notification"
              className="opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* FULL WORKFLOW LIBRARY CATALOG VIEW */}
      {viewMode === 'library' ? (
        <section
          aria-label="Workflow Library"
          className="space-y-5"
        >
          {/* Header & Filter Bar */}
          <div className="bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-bold text-[#111111] dark:text-white">
                  Workflow Library
                </h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Browse pre-built enterprise workflow templates with ordered steps, assigned tasks, and approval gates to get started in one click.
                </p>
              </div>

              <div className="relative w-full md:w-72 shrink-0">
                <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  aria-label="Search workflow templates"
                  placeholder="Search templates or steps..."
                  className="w-full h-9 pl-8.5 pr-3 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-xs text-[#111111] dark:text-white placeholder:text-[#737373] focus:outline-none focus:border-[#111111] dark:focus:border-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E5E5E5] dark:border-[#262626]">
              {TEMPLATE_CATEGORIES.map((cat) => {
                const active = templateCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTemplateCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111]'
                        : 'bg-[#F5F5F5] dark:bg-[#1A1A1A] text-[#525252] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Cards Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-12 text-center space-y-3">
              <p className="text-sm font-semibold text-[#111111] dark:text-white">
                No matching templates found
              </p>
              <p className="text-xs text-[#737373]">
                Try clearing your search filter or create a custom workflow from scratch.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTemplateSearch('');
                  setTemplateCategory('All');
                }}
                className="px-4 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#262626] text-xs font-medium text-[#111111] dark:text-white hover:bg-[#FAFAFA] dark:hover:bg-[#1A1A1A] cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTemplates.map((tpl) => {
                const isCreating = creatingTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] hover:border-[#111111] dark:hover:border-neutral-500 transition-colors p-5 flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-3">
                      {/* Unboxed clean metadata line (Zero-pill discipline) */}
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#737373]">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span className="font-medium text-[#111111] dark:text-[#E5E5E5] truncate">
                            {tpl.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums shrink-0">
                            {tpl.steps.length} steps
                          </span>
                          {tpl.requiresApprovalByDefault && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="shrink-0">Approval gate</span>
                            </>
                          )}
                        </div>
                        <span className={`capitalize font-medium shrink-0 ${PRIORITY_COLORS[tpl.priority]}`}>
                          {tpl.priority}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display text-sm font-bold text-[#111111] dark:text-white leading-snug">
                          {tpl.name}
                        </h3>
                        <p className="text-xs text-[#525252] dark:text-[#A3A3A3] leading-relaxed mt-1.5">
                          {tpl.summary}
                        </p>
                      </div>

                      {/* Ordered step preview */}
                      <ol className="space-y-1.5 pt-3 border-t border-[#E5E5E5] dark:border-[#262626] text-[11px] text-[#525252] dark:text-[#A3A3A3]">
                        {tpl.steps.slice(0, 2).map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="font-mono text-[#737373] tabular-nums shrink-0">
                              0{idx + 1}
                            </span>
                            <span className="line-clamp-1">{step}</span>
                          </li>
                        ))}
                        {tpl.steps.length > 2 && (
                          <li className="text-[11px] text-[#737373] pl-5 tabular-nums">
                            +{tpl.steps.length - 2} more steps &amp; {tpl.tasks.length} linked tasks
                          </li>
                        )}
                      </ol>
                    </div>

                    <div className="pt-3 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openTemplatePreview(tpl)}
                        className="text-xs font-medium text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Preview &amp; Customize
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(creatingTemplateId) || !onCreateFromTemplate}
                        onClick={() => void handleUseTemplate(tpl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <span>Use Template</span>
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Embedded Quick-Start Workflow Library Section (always accessible from Kanban/List) */}
          <section
            aria-label="Workflow Library Quick Start"
            className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] overflow-hidden"
          >
            <div className="px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setLibraryExpanded((v) => !v)}
                className="flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <BookOpen className="w-4 h-4 text-[#111111] dark:text-white shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-bold text-[#111111] dark:text-white">
                      Workflow Library
                    </span>
                    <span className="text-[11px] text-[#737373] tabular-nums">
                      {WORKFLOW_TEMPLATES.length} enterprise templates
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737373] hidden sm:block">
                    Launch pre-built sequences like Expense Approval or Onboarding Sequence with tasks and approval gates included.
                  </p>
                </div>
                {libraryExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#737373] group-hover:text-[#111111] dark:group-hover:text-white ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#737373] group-hover:text-[#111111] dark:group-hover:text-white ml-1" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewMode('library')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#111111] dark:text-white hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Browse all {WORKFLOW_TEMPLATES.length} templates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {libraryExpanded && (
              <div className="px-4 pb-4 pt-3 border-t border-[#E5E5E5] dark:border-[#262626] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {featuredTemplates.map((tpl) => {
                  const isCreating = creatingTemplateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      className="rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] hover:border-[#111111] dark:hover:border-neutral-500 transition-colors p-3.5 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#737373] truncate">
                          <span className="font-medium text-[#404040] dark:text-[#D4D4D4] truncate">
                            {tpl.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums shrink-0">
                            {tpl.steps.length} steps
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openTemplatePreview(tpl)}
                          className="text-left font-display text-xs font-bold text-[#111111] dark:text-white hover:underline cursor-pointer"
                        >
                          {tpl.name}
                        </button>
                        <p className="text-[11px] text-[#737373] line-clamp-2 leading-relaxed">
                          {tpl.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E5E5] dark:border-[#262626]">
                        <button
                          type="button"
                          onClick={() => openTemplatePreview(tpl)}
                          className="text-[11px] font-medium text-[#525252] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white cursor-pointer"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(creatingTemplateId) || !onCreateFromTemplate}
                          onClick={() => void handleUseTemplate(tpl)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                        >
                          {isCreating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          <span>{isCreating ? 'Adding...' : 'Use'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Kanban View */}
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
                          <div className="flex items-center justify-between gap-2 text-[11px] text-[#737373] pt-2 border-t border-[#E5E5E5] dark:border-[#262626]">
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
                      <th className="py-3 px-4">Code &amp; Workflow</th>
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
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 px-4 text-center text-xs text-[#737373]">
                          No workflows yet. Select a template from the Workflow Library above or create one manually.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Template Preview & Customize Slide-Over Drawer */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/35 backdrop-blur-xs"
            onClick={() => setPreviewTemplate(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-preview-title"
            className="relative z-10 w-full max-w-xl bg-white dark:bg-[#121212] border-l border-[#E5E5E5] dark:border-[#262626] h-full overflow-y-auto p-6 flex flex-col gap-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E5E5E5] dark:border-[#262626]">
              <div>
                <div className="text-xs text-[#737373] flex items-center gap-1.5">
                  <span>Workflow Library</span>
                  <span aria-hidden="true">·</span>
                  <span>{previewTemplate.estimatedSetup}</span>
                </div>
                <h2
                  id="template-preview-title"
                  className="font-display text-lg font-bold text-[#111111] dark:text-white mt-0.5"
                >
                  {previewTemplate.name}
                </h2>
                <p className="text-xs text-[#525252] dark:text-[#A3A3A3] mt-1 leading-relaxed">
                  {previewTemplate.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                aria-label="Close template preview"
                className="p-1.5 rounded-lg text-[#737373] hover:bg-[#F2F2F2] dark:hover:bg-[#1F1F1F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customize Parameters */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label
                  htmlFor="tpl-custom-title"
                  className="block font-semibold text-[#111111] dark:text-white"
                >
                  Workflow Title
                </label>
                <input
                  id="tpl-custom-title"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="tpl-custom-dept"
                    className="block font-semibold text-[#111111] dark:text-white"
                  >
                    Department
                  </label>
                  <select
                    id="tpl-custom-dept"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                  >
                    {availableDepartmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="tpl-custom-priority"
                    className="block font-semibold text-[#111111] dark:text-white"
                  >
                    Priority
                  </label>
                  <select
                    id="tpl-custom-priority"
                    value={customPriority}
                    onChange={(e) => setCustomPriority(e.target.value as PriorityLevel)}
                    className="w-full h-9 px-3 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white capitalize"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {previewTemplate.approvalRequest && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customRequireApproval}
                    onChange={(e) => setCustomRequireApproval(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-300 text-black focus:ring-black"
                  />
                  <div>
                    <div className="font-semibold text-[#111111] dark:text-white inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Route through Approvals Queue</span>
                    </div>
                    <p className="text-[11px] text-[#737373] mt-0.5 leading-relaxed">
                      {previewTemplate.approvalRequest.reason}
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Included Steps */}
            <div className="space-y-2 text-xs">
              <h3 className="font-semibold text-[#111111] dark:text-white">
                Included Steps ({previewTemplate.steps.length})
              </h3>
              <ol className="space-y-1.5">
                {previewTemplate.steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626]"
                  >
                    <span className="font-mono text-[11px] font-semibold text-[#737373] tabular-nums">
                      0{i + 1}
                    </span>
                    <span className="text-[#404040] dark:text-[#E5E5E5]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Included Tasks */}
            <div className="space-y-2 text-xs">
              <h3 className="font-semibold text-[#111111] dark:text-white">
                Pre-Configured Tasks ({previewTemplate.tasks.length})
              </h3>
              <div className="space-y-2">
                {previewTemplate.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-[#E5E5E5] dark:border-[#262626] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#111111] dark:text-white">
                        {task.title}
                      </span>
                      <span className="text-[11px] text-[#737373] shrink-0">
                        {task.assignee}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#737373] leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="mt-auto pt-4 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#262626] text-xs font-medium text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(creatingTemplateId) || !onCreateFromTemplate}
                onClick={() =>
                  void handleUseTemplate(previewTemplate, {
                    title: customTitle,
                    category: customCategory,
                    priority: customPriority,
                    includeApproval: customRequireApproval,
                  })
                }
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {creatingTemplateId === previewTemplate.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Launching...</span>
                  </>
                ) : (
                  <>
                    <span>Launch Workflow</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
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
              {onExecuteWorkflow && activeWf.status !== 'completed' && (
                <button
                  type="button"
                  disabled={executingId === activeWf.id}
                  onClick={() => void handleRunExecute(activeWf)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {executingId === activeWf.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>{executingId === activeWf.id ? 'Executing...' : 'Execute Workflow'}</span>
                </button>
              )}
              {activeWf.status !== 'in_progress' && activeWf.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => void onUpdateStatus(activeWf, 'in_progress')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-medium cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start</span>
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

            {execFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  execFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                }`}
              >
                {execFeedback.text}
              </div>
            )}

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
