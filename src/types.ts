export type UserRole = 'Admin' | 'Approver' | 'Operator' | 'Viewer';

export type WorkflowStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'approved'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'failed';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'completed';

export type TriggerType = 'voice' | 'chat' | 'manual' | 'scheduled' | 'webhook';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export type IntegrationCategory =
  | 'email'
  | 'crm'
  | 'ticketing'
  | 'project_management'
  | 'calendar'
  | 'rest_api';

export type IntegrationStatus =
  | 'connected_simulated'
  | 'connected_live'
  | 'disconnected'
  | 'error';

export type NavSection =
  | 'overview'
  | 'command_center'
  | 'workflows'
  | 'tasks'
  | 'knowledge_base'
  | 'approvals'
  | 'analytics'
  | 'integrations'
  | 'settings';

export interface UserProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  department: string;
  organizationName: string;
  voiceLanguage: string;
  autoSpeakResponses: boolean;
  requireApprovalForExternal: boolean;
  notifyApprovals: boolean;
  notifyFailures: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Workflow {
  id: string;
  ownerId: string;
  code: string;
  title: string;
  description: string;
  category: string;
  status: WorkflowStatus;
  priority: PriorityLevel;
  recommendedTeam: string;
  triggerType: TriggerType;
  sourcePrompt?: string;
  troubleshootingSummary?: string;
  durationMs: number;
  steps: string[];
  ragSources: string[];
  dueDate?: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface TaskItem {
  id: string;
  ownerId: string;
  workflowId: string;
  code: string;
  title: string;
  description: string;
  assignee: string;
  department: string;
  priority: PriorityLevel;
  status: TaskStatus;
  dueDate: string;
  dependencies: string[];
  comments: string[];
  integrationAction?: string;
  requiresApproval: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface KnowledgeDoc {
  id: string;
  ownerId: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md';
  category: string;
  content: string;
  summary: string;
  tags: string[];
  wordCount: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ApprovalItem {
  id: string;
  ownerId: string;
  workflowId: string;
  workflowTitle: string;
  actionType: string;
  integrationTarget: string;
  isSimulated: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
  proposedPayload: string;
  requestedBy: string;
  status: ApprovalStatus;
  reviewerNote?: string;
  reviewedBy?: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface IntegrationItem {
  id: string;
  ownerId: string;
  key: string;
  name: string;
  category: IntegrationCategory;
  provider: string;
  status: IntegrationStatus;
  isSimulated: boolean;
  endpointUrl?: string;
  description: string;
  lastSyncAt?: string;
  executionsCount: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface AuditLogItem {
  id: string;
  ownerId: string;
  workflowId: string;
  workflowTitle: string;
  eventType: string;
  actor: string;
  summary: string;
  status: 'success' | 'pending' | 'failed' | 'warning';
  isSimulated: boolean;
  durationMs: number;
  createdAtMs: number;
}

export interface TeamMember {
  id: string;
  ownerId: string;
  name: string;
  role: UserRole;
  department: string;
  status: 'active' | 'invited';
  createdAtMs: number;
  updatedAtMs: number;
}

export interface RagCitation {
  docId: string;
  docTitle: string;
  category: string;
  excerpt: string;
  similarity: number;
}

export interface ProposedTaskDraft {
  title: string;
  description: string;
  assignee: string;
  department: string;
  priority: PriorityLevel;
  dueDate: string;
  dependencies: string[];
  integrationAction: string;
  requiresApproval: boolean;
}

export interface ProposedApprovalDraft {
  actionType: string;
  integrationTarget: string;
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
  proposedPayload: string;
}

export interface ProposedWorkflowDraft {
  title: string;
  description: string;
  category: string;
  priority: PriorityLevel;
  recommendedTeam: string;
  dueDate: string;
  troubleshootingSummary: string;
  steps: string[];
  tasks: ProposedTaskDraft[];
  approvalRequest?: ProposedApprovalDraft | null;
}

export interface AgentTraceStep {
  stage: string;
  status: 'completed' | 'active' | 'pending' | 'warning';
  detail: string;
}

export interface CommandMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  spokenText?: string;
  timestamp: number;
  inputMode?: 'voice' | 'text';
  ragCitations?: RagCitation[];
  proposedWorkflow?: ProposedWorkflowDraft | null;
  clarifyingQuestions?: string[];
  trace?: AgentTraceStep[];
  createdWorkflowId?: string;
  approvalId?: string;
}

export interface OperationalInsight {
  headline: string;
  summary: string;
  recommendations: {
    title: string;
    impact: string;
    actionLabel: string;
    targetSection: NavSection;
  }[];
}
