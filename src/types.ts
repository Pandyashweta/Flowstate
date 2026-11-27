export type WorkspaceRole = 'Owner' | 'Admin' | 'Manager' | 'Member' | 'Viewer';

export type UserRole = WorkspaceRole | 'Approver' | 'Operator';

export type WorkspaceType = 'personal' | 'organization';

export type WorkflowStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'approved'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

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

export interface WorkspaceMember {
  id: string;
  uid?: string;
  email: string;
  name: string;
  role: WorkspaceRole;
  department: string;
  avatarUrl?: string;
  status: 'active' | 'invited';
  joinedAtMs?: number;
}

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  role: WorkspaceRole;
  logoUrl?: string;
  industry?: string;
  website?: string;
  country?: string;
  size?: string;
  departments: string[];
  members: WorkspaceMember[];
  onboardingCompleted: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface PersonalOnboardingData {
  fullName: string;
  profileImage?: string;
  jobTitle: string;
  professionalBackground: string;
  profession: string;
  responsibilities: string;
  typeOfWork: string;
  mainActivities: string;
  automationGoals: string[];
  existingTools: string[];
  interactionPreference: 'voice' | 'text' | 'both';
  languagePreference: string;
  notificationPreferences: {
    emailApprovals: boolean;
    emailFailures: boolean;
    browserPush: boolean;
  };
}

export interface OrganizationOnboardingData {
  organizationName: string;
  logoUrl?: string;
  industry: string;
  website: string;
  country: string;
  organizationSize: string;
  ownerName: string;
  ownerRole: string;
  departments: string[];
  businessProcesses: string[];
  automationRequirements: string[];
  existingSoftwareTools: string[];
  teamInvitations: {
    email: string;
    role: WorkspaceRole;
    department: string;
  }[];
}

export interface NotificationItem {
  id: string;
  workspaceId: string;
  userId: string;
  type:
    | 'task_assigned'
    | 'workflow_completed'
    | 'workflow_failed'
    | 'approval_request'
    | 'approval_result'
    | 'invitation'
    | 'role_changed'
    | 'system';
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  linkSection?: NavSection;
  createdAtMs: number;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName: string;
  jobTitle?: string;
  professionalBackground?: string;
  role: WorkspaceRole;
  department: string;
  organizationName: string;
  voiceLanguage: string;
  autoSpeakResponses: boolean;
  requireApprovalForExternal: boolean;
  notifyApprovals: boolean;
  notifyFailures: boolean;
  activeWorkspaceId?: string;
  onboardingCompleted?: boolean;
  onboardingType?: WorkspaceType;
  welcomeSeen?: boolean;
  tutorialCompleted?: boolean;
  tutorialStep?: number;
  themePreference?: 'light' | 'dark' | 'system';
  timezone?: string;
  dateFormat?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Workflow {
  id: string;
  ownerId: string;
  workspaceId?: string;
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
  workspaceId?: string;
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
  workspaceId?: string;
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
  workspaceId?: string;
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
  workspaceId?: string;
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
  workspaceId?: string;
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
  workspaceId?: string;
  name: string;
  role: WorkspaceRole;
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

export type AiModelMode = 'balanced' | 'fast' | 'deep';

export interface CommandMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  spokenText?: string;
  timestamp: number;
  inputMode?: 'voice' | 'text';
  modelUsed?: string;
  domain?: string;
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
