import {
  PersonalOnboardingData,
  OrganizationOnboardingData,
  Workspace,
  WorkspaceRole,
  WorkspaceType,
} from '../types';

const STORAGE_KEYS = {
  ACTIVE_WORKSPACE: 'flowstate_active_workspace_id',
  WORKSPACES: 'flowstate_workspaces',
  PERSONAL_ONBOARDING: 'flowstate_personal_onboarding_',
  ORG_ONBOARDING: 'flowstate_org_onboarding_',
  LOCAL_COLLECTIONS: 'flowstate_local_collections_',
};

export const ROLE_PERMISSIONS = {
  Owner: {
    canDeleteWorkspace: true,
    canManageMembers: true,
    canInviteMembers: true,
    canManageSettings: true,
    canCreateWorkflows: true,
    canEditWorkflows: true,
    canDeleteWorkflows: true,
    canExecuteWorkflows: true,
    canAuthorizeApprovals: true,
    canUploadDocuments: true,
    canDeleteDocuments: true,
    canManageIntegrations: true,
  },
  Admin: {
    canDeleteWorkspace: false,
    canManageMembers: true,
    canInviteMembers: true,
    canManageSettings: true,
    canCreateWorkflows: true,
    canEditWorkflows: true,
    canDeleteWorkflows: true,
    canExecuteWorkflows: true,
    canAuthorizeApprovals: true,
    canUploadDocuments: true,
    canDeleteDocuments: true,
    canManageIntegrations: true,
  },
  Manager: {
    canDeleteWorkspace: false,
    canManageMembers: false,
    canInviteMembers: true,
    canManageSettings: false,
    canCreateWorkflows: true,
    canEditWorkflows: true,
    canDeleteWorkflows: false,
    canExecuteWorkflows: true,
    canAuthorizeApprovals: true,
    canUploadDocuments: true,
    canDeleteDocuments: false,
    canManageIntegrations: false,
  },
  Member: {
    canDeleteWorkspace: false,
    canManageMembers: false,
    canInviteMembers: false,
    canManageSettings: false,
    canCreateWorkflows: true,
    canEditWorkflows: true,
    canDeleteWorkflows: false,
    canExecuteWorkflows: true,
    canAuthorizeApprovals: false,
    canUploadDocuments: true,
    canDeleteDocuments: false,
    canManageIntegrations: false,
  },
  Viewer: {
    canDeleteWorkspace: false,
    canManageMembers: false,
    canInviteMembers: false,
    canManageSettings: false,
    canCreateWorkflows: false,
    canEditWorkflows: false,
    canDeleteWorkflows: false,
    canExecuteWorkflows: false,
    canAuthorizeApprovals: false,
    canUploadDocuments: false,
    canDeleteDocuments: false,
    canManageIntegrations: false,
  },
};

export function hasPermission(
  role: WorkspaceRole,
  permission: keyof (typeof ROLE_PERMISSIONS)['Owner']
): boolean {
  return Boolean(ROLE_PERMISSIONS[role]?.[permission]);
}

export function createDefaultPersonalWorkspace(uid: string, name: string): Workspace {
  return {
    id: `ws-personal-${uid}`,
    name: `${name}'s Private Workspace`,
    type: 'personal',
    ownerId: uid,
    role: 'Owner',
    departments: ['General', 'Personal Productivity', 'Automations'],
    members: [
      {
        id: `m-${uid}`,
        uid,
        email: '',
        name,
        role: 'Owner',
        department: 'General',
        status: 'active',
      },
    ],
    onboardingCompleted: false,
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
  };
}

export function createDefaultOrgWorkspace(uid: string, name: string, orgName: string): Workspace {
  return {
    id: `ws-org-flowstate-hq`,
    name: orgName || 'Flowstate Enterprise HQ',
    type: 'organization',
    ownerId: uid,
    role: 'Owner',
    industry: 'Software & Technology',
    website: 'https://flowstate.ai',
    country: 'United States',
    size: '50-250 employees',
    departments: [
      'Customer Support',
      'IT Operations',
      'Billing & Finance',
      'HR Management',
      'Sales Ops',
      'Identity & Auth Engineering',
    ],
    members: [
      {
        id: `m-${uid}`,
        uid,
        email: '',
        name,
        role: 'Owner',
        department: 'Identity & Auth Engineering',
        status: 'active',
      },
      {
        id: 'm-sarah',
        email: 'sarah.jenkins@flowstate.ai',
        name: 'Sarah Jenkins',
        role: 'Admin',
        department: 'Customer Support',
        status: 'active',
      },
      {
        id: 'm-marcus',
        email: 'marcus.vance@flowstate.ai',
        name: 'Marcus Vance',
        role: 'Manager',
        department: 'Customer Support',
        status: 'active',
      },
      {
        id: 'm-maya',
        email: 'maya.patel@flowstate.ai',
        name: 'Maya Patel',
        role: 'Manager',
        department: 'Billing & Finance',
        status: 'active',
      },
      {
        id: 'm-elena',
        email: 'elena.rostova@flowstate.ai',
        name: 'Elena Rostova',
        role: 'Member',
        department: 'IT Operations',
        status: 'active',
      },
    ],
    onboardingCompleted: true,
    createdAtMs: Date.now() - 14 * 86400000,
    updatedAtMs: Date.now(),
  };
}

export function loadUserWorkspaces(uid: string, _userName = 'Operations Lead'): Workspace[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.WORKSPACES}_${uid}`);
    if (raw) {
      const list = JSON.parse(raw) as Workspace[];
      if (Array.isArray(list)) return list;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveUserWorkspaces(uid: string, workspaces: Workspace[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.WORKSPACES}_${uid}`, JSON.stringify(workspaces));
  } catch {
    // ignore
  }
}

export function getActiveWorkspaceId(uid: string): string {
  if (typeof window === 'undefined') return `ws-personal-${uid}`;
  const saved = localStorage.getItem(`${STORAGE_KEYS.ACTIVE_WORKSPACE}_${uid}`);
  return saved || `ws-personal-${uid}`;
}

export function setActiveWorkspaceId(uid: string, workspaceId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEYS.ACTIVE_WORKSPACE}_${uid}`, workspaceId);
}

// Onboarding Persistence
export function loadPersonalOnboarding(uid: string): Partial<PersonalOnboardingData> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.PERSONAL_ONBOARDING}${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePersonalOnboarding(
  uid: string,
  data: Partial<PersonalOnboardingData>
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.PERSONAL_ONBOARDING}${uid}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadOrgOnboarding(uid: string): Partial<OrganizationOnboardingData> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.ORG_ONBOARDING}${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveOrgOnboarding(
  uid: string,
  data: Partial<OrganizationOnboardingData>
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.ORG_ONBOARDING}${uid}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}
