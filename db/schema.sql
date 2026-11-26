-- FLOWSTATE Multi-Tenant PostgreSQL Schema
-- Supports Personal & Organization Workspaces, RBAC, Invitations, Workflows, Tasks, RAG Documents & Conversations

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Roles (Canonical RBAC definitions)
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  scope VARCHAR(32) NOT NULL CHECK (scope IN ('personal', 'organization', 'both')),
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (id, name, scope, permissions) VALUES
  ('Owner', 'Owner', 'both', '{"canDeleteWorkspace":true,"canManageMembers":true,"canInviteMembers":true,"canManageSettings":true,"canCreateWorkflows":true,"canEditWorkflows":true,"canDeleteWorkflows":true,"canExecuteWorkflows":true,"canAuthorizeApprovals":true,"canUploadDocuments":true,"canDeleteDocuments":true,"canManageIntegrations":true}'),
  ('Admin', 'Admin', 'organization', '{"canDeleteWorkspace":false,"canManageMembers":true,"canInviteMembers":true,"canManageSettings":true,"canCreateWorkflows":true,"canEditWorkflows":true,"canDeleteWorkflows":true,"canExecuteWorkflows":true,"canAuthorizeApprovals":true,"canUploadDocuments":true,"canDeleteDocuments":true,"canManageIntegrations":true}'),
  ('Manager', 'Manager', 'organization', '{"canDeleteWorkspace":false,"canManageMembers":false,"canInviteMembers":true,"canManageSettings":false,"canCreateWorkflows":true,"canEditWorkflows":true,"canDeleteWorkflows":false,"canExecuteWorkflows":true,"canAuthorizeApprovals":true,"canUploadDocuments":true,"canDeleteDocuments":false,"canManageIntegrations":false}'),
  ('Member', 'Member', 'organization', '{"canDeleteWorkspace":false,"canManageMembers":false,"canInviteMembers":false,"canManageSettings":false,"canCreateWorkflows":true,"canEditWorkflows":true,"canDeleteWorkflows":false,"canExecuteWorkflows":true,"canAuthorizeApprovals":false,"canUploadDocuments":true,"canDeleteDocuments":false,"canManageIntegrations":false}'),
  ('Viewer', 'Viewer', 'organization', '{"canDeleteWorkspace":false,"canManageMembers":false,"canInviteMembers":false,"canManageSettings":false,"canCreateWorkflows":false,"canEditWorkflows":false,"canDeleteWorkflows":false,"canExecuteWorkflows":false,"canAuthorizeApprovals":false,"canUploadDocuments":false,"canDeleteDocuments":false,"canManageIntegrations":false}')
ON CONFLICT (id) DO NOTHING;

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(128) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token VARCHAR(128),
  reset_token VARCHAR(128),
  reset_token_expires_at TIMESTAMPTZ,
  auth_provider VARCHAR(32) NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id VARCHAR(128) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(120) NOT NULL,
  avatar_url TEXT,
  job_title VARCHAR(120),
  professional_background TEXT,
  profession VARCHAR(120),
  responsibilities TEXT,
  type_of_work VARCHAR(120),
  automation_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  existing_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  interaction_preference VARCHAR(20) NOT NULL DEFAULT 'both',
  voice_language VARCHAR(20) NOT NULL DEFAULT 'en-US',
  auto_speak_responses BOOLEAN NOT NULL DEFAULT TRUE,
  require_approval_for_external BOOLEAN NOT NULL DEFAULT TRUE,
  notify_approvals BOOLEAN NOT NULL DEFAULT TRUE,
  notify_failures BOOLEAN NOT NULL DEFAULT TRUE,
  active_workspace_id VARCHAR(128),
  personal_onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  personal_onboarding_step INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  industry VARCHAR(120),
  website VARCHAR(255),
  country VARCHAR(100),
  size VARCHAR(64),
  owner_user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_role_title VARCHAR(120),
  business_processes JSONB NOT NULL DEFAULT '[]'::jsonb,
  automation_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  existing_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  type VARCHAR(24) NOT NULL CHECK (type IN ('personal', 'organization')),
  owner_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id VARCHAR(128) REFERENCES organizations(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_org ON workspaces(organization_id);

-- 6. Departments
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id VARCHAR(128) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_workspace ON departments(workspace_id);

-- 7. Workspace Members
CREATE TABLE IF NOT EXISTS workspace_members (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id VARCHAR(128) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id VARCHAR(32) NOT NULL REFERENCES roles(id),
  department VARCHAR(120) NOT NULL DEFAULT 'General',
  status VARCHAR(24) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ws_members_ws ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ws_members_user ON workspace_members(user_id);

-- 8. Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id VARCHAR(128) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role_id VARCHAR(32) NOT NULL REFERENCES roles(id),
  department VARCHAR(120) NOT NULL DEFAULT 'General',
  invited_by_user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_ws ON invitations(workspace_id);

-- 9. Workflows (Tenant-isolated by workspace_id)
CREATE TABLE IF NOT EXISTS workflows (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id VARCHAR(128) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by_user_id VARCHAR(128) NOT NULL REFERENCES users(id),
  code VARCHAR(32) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  status VARCHAR(32) NOT NULL,
  priority VARCHAR(24) NOT NULL,
  recommended_team VARCHAR(120) NOT NULL,
  trigger_type VARCHAR(32) NOT NULL,
  source_prompt TEXT,
  troubleshooting_summary TEXT,
  duration_ms INT NOT NULL DEFAULT 0,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  rag_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_date VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_ws ON workflows(workspace_id);

-- 10. Tasks (Tenant-isolated by workspace_id)
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id VARCHAR(128) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workflow_id VARCHAR(128) REFERENCES workflows(id) ON DELETE CASCADE,
  created_by_user_id VARCHAR(128) NOT NULL REFERENCES users(id),
  code VARCHAR(32) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  assignee VARCHAR(120) NOT NULL,
  department VARCHAR(80) NOT NULL,
  priority VARCHAR(24) NOT NULL,
  status VARCHAR(32) NOT NULL,
  due_date VARCHAR(40),
  dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  integration_action VARCHAR(200),
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_ws ON tasks(workspace_id);

-- 11. Conversations (Tenant-isolated by workspace_id & user_id)
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id VARCHAR(128) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_ws_user ON conversations(workspace_id, user_id);

-- 12. Messages
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(128) PRIMARY KEY,
  conversation_id VARCHAR(128) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  workspace_id VARCHAR(128) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  spoken_text TEXT,
  input_mode VARCHAR(16),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);

-- 13. Documents (Knowledge Base, tenant-isolated)
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id VARCHAR(128) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by_user_id VARCHAR(128) NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  file_name VARCHAR(200) NOT NULL,
  file_type VARCHAR(16) NOT NULL,
  category VARCHAR(80) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  word_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_ws ON documents(workspace_id);

-- 14. Approvals (Tenant-isolated)
CREATE TABLE IF NOT EXISTS approvals (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id VARCHAR(128) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workflow_id VARCHAR(128) REFERENCES workflows(id) ON DELETE CASCADE,
  workflow_title VARCHAR(200) NOT NULL,
  action_type VARCHAR(120) NOT NULL,
  integration_target VARCHAR(120) NOT NULL,
  is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
  risk_level VARCHAR(20) NOT NULL,
  reason TEXT NOT NULL,
  proposed_payload TEXT NOT NULL,
  requested_by VARCHAR(120) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  reviewer_note TEXT,
  reviewed_by VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_ws ON approvals(workspace_id);

-- 15. Integrations (Tenant-isolated)
CREATE TABLE IF NOT EXISTS integrations (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id VARCHAR(128) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  status VARCHAR(32) NOT NULL,
  is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
  endpoint_url TEXT,
  description TEXT,
  last_sync_at TIMESTAMPTZ,
  executions_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_ws ON integrations(workspace_id);

-- 16. Audit Logs (Append-only, tenant-isolated)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(128) PRIMARY KEY,
  workspace_id VARCHAR(128) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id VARCHAR(128) NOT NULL,
  actor_name VARCHAR(120) NOT NULL,
  workflow_id VARCHAR(128),
  workflow_title VARCHAR(200),
  event_type VARCHAR(80) NOT NULL,
  summary TEXT NOT NULL,
  status VARCHAR(24) NOT NULL,
  is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
  duration_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ws ON audit_logs(workspace_id);
