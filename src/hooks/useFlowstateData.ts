import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  apiDeleteJson,
  apiGetJson,
  apiPatchJson,
  apiPostJson,
  getStoredSessionToken,
  setStoredSessionToken,
} from '../lib/api';
import {
  saveOrgOnboarding,
  savePersonalOnboarding,
  saveUserWorkspaces,
  setActiveWorkspaceId,
} from '../lib/workspaceStore';
import {
  ApprovalItem,
  AuditLogItem,
  IntegrationItem,
  KnowledgeDoc,
  NotificationItem,
  OrganizationOnboardingData,
  PersonalOnboardingData,
  PriorityLevel,
  ProposedWorkflowDraft,
  TaskItem,
  TaskStatus,
  TeamMember,
  UserProfile,
  UserRole,
  Workflow,
  WorkflowStatus,
  Workspace,
  WorkspaceRole,
} from '../types';

type BackendWorkspaceSummary = {
  workspace: {
    id: string;
    name: string;
    type: 'personal' | 'organization';
    ownerId: string;
    onboardingCompleted: boolean;
    createdAtMs: number;
    updatedAtMs: number;
  };
  role: WorkspaceRole;
  organization: {
    logoUrl?: string;
    industry?: string;
    website?: string;
    country?: string;
    size?: string;
  } | null;
  departments: { name: string }[];
};

type BackendWorkspaceDataResponse = {
  workflows: Workflow[];
  tasks: TaskItem[];
  documents: KnowledgeDoc[];
  approvals: ApprovalItem[];
  integrations: IntegrationItem[];
  auditLogs: (AuditLogItem & { actorName?: string })[];
  notifications: NotificationItem[];
  members: {
    id: string;
    userId: string;
    name: string;
    email?: string;
    roleId: WorkspaceRole;
    department: string;
    status: 'active' | 'suspended';
    joinedAtMs?: number;
    updatedAtMs?: number;
  }[];
};

function mapBackendMembers(
  workspaceId: string,
  members: BackendWorkspaceDataResponse['members'] = []
): TeamMember[] {
  return members.map((m) => ({
    id: m.id,
    ownerId: m.userId,
    workspaceId,
    name: m.name,
    role: m.roleId,
    department: m.department,
    status: m.status === 'active' ? 'active' : 'invited',
    createdAtMs: m.joinedAtMs || Date.now(),
    updatedAtMs: m.updatedAtMs || Date.now(),
  }));
}

function normalizeAuditLogs(
  logs: (AuditLogItem & { actorName?: string })[] = []
): AuditLogItem[] {
  return logs.map((l) => ({
    ...l,
    actor: l.actor || l.actorName || 'System',
  }));
}

export function useFlowstateData() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Multi-tenant workspace management
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string>('');
  const [needsWorkspaceSetup, setNeedsWorkspaceSetup] = useState<boolean>(false);
  const [onboardingNeeded, setOnboardingNeeded] = useState<boolean>(false);
  const [onboardingType, setOnboardingType] = useState<'personal' | 'organization' | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<
    { id: string; workspaceName: string; roleId: WorkspaceRole; department: string; invitedByName: string }[]
  >([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [welcomeSeen, setWelcomeSeen] = useState<boolean>(true);
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean>(true);
  const [tutorialStep, setTutorialStep] = useState<number>(1);

  const syncInFlightRef = useRef<Promise<void> | null>(null);

  const mapBackendWorkspaces = useCallback((rows: BackendWorkspaceSummary[]): Workspace[] => {
    return rows.map((r) => ({
      id: r.workspace.id,
      name: r.workspace.name,
      type: r.workspace.type,
      ownerId: r.workspace.ownerId,
      role: r.role,
      logoUrl: r.organization?.logoUrl,
      industry: r.organization?.industry,
      website: r.organization?.website,
      country: r.organization?.country,
      size: r.organization?.size,
      departments: r.departments.map((d) => d.name),
      members: [],
      onboardingCompleted: r.workspace.onboardingCompleted,
      createdAtMs: r.workspace.createdAtMs,
      updatedAtMs: r.workspace.updatedAtMs,
    }));
  }, []);

  const clearWorkspaceData = useCallback(() => {
    setWorkflows([]);
    setTasks([]);
    setKnowledgeDocs([]);
    setApprovals([]);
    setIntegrations([]);
    setAuditLogs([]);
    setNotifications([]);
    setTeamMembers([]);
  }, []);

  const hydrateWorkspaceData = useCallback(
    (workspaceId: string, wsData: BackendWorkspaceDataResponse) => {
      setWorkflows(wsData.workflows || []);
      setTasks(wsData.tasks || []);
      setKnowledgeDocs(wsData.documents || []);
      setApprovals(wsData.approvals || []);
      setIntegrations(wsData.integrations || []);
      setAuditLogs(normalizeAuditLogs(wsData.auditLogs));
      setNotifications(wsData.notifications || []);
      setTeamMembers(mapBackendMembers(workspaceId, wsData.members));
    },
    []
  );

  const refreshWorkspaceData = useCallback(
    async (workspaceId: string) => {
      if (!workspaceId) return;
      const wsData = await apiGetJson<BackendWorkspaceDataResponse>(
        `/api/workspaces/${workspaceId}/data`
      );
      hydrateWorkspaceData(workspaceId, wsData);
    },
    [hydrateWorkspaceData]
  );

  // Sync backend session (for email/password auth or Google OAuth)
  const syncBackendSession = useCallback(async () => {
    if (syncInFlightRef.current) {
      return syncInFlightRef.current;
    }

    const run = async () => {
      const token = getStoredSessionToken();
      if (!token && !auth.currentUser) {
        setAuthReady(true);
        return;
      }

      setSeeding(true);
      try {
        const me = await apiGetJson<{
          user: { uid: string; email: string; emailVerified: boolean; displayName: string };
          profile: UserProfile & { userId?: string; activeWorkspaceId?: string };
          workspaces: BackendWorkspaceSummary[];
          pendingInvitations: {
            id: string;
            workspaceName: string;
            roleId: WorkspaceRole;
            department: string;
            invitedByName: string;
          }[];
        }>('/api/auth/me');

        if (!auth.currentUser) {
          setUser({
            uid: me.user.uid,
            email: me.user.email,
            emailVerified: me.user.emailVerified,
            displayName: me.user.displayName,
            photoURL: null,
          } as unknown as User);
        }

        const mapped = mapBackendWorkspaces(me.workspaces || []);
        const targetWs =
          mapped.find((w) => w.id === me.profile.activeWorkspaceId) || mapped[0] || null;

        setProfile({
          ...me.profile,
          uid: me.user.uid,
          email: me.user.email,
          role: targetWs?.role || 'Owner',
          department: me.profile.department || 'Operations',
          organizationName: targetWs?.name || 'Personal Workspace',
        });
        setWelcomeSeen(Boolean(me.profile.welcomeSeen));
        setTutorialCompleted(Boolean(me.profile.tutorialCompleted));
        setTutorialStep(Number(me.profile.tutorialStep || 1));
        setPendingInvitations(me.pendingInvitations || []);

        if (mapped.length > 0 && targetWs) {
          setNeedsWorkspaceSetup(false);
          setWorkspaces(mapped);
          saveUserWorkspaces(me.user.uid, mapped);
          setActiveWorkspaceIdState(targetWs.id);
          setActiveWorkspaceId(me.user.uid, targetWs.id);
          try {
            await refreshWorkspaceData(targetWs.id);
          } catch (err) {
            console.error('Failed to load workspace data:', err);
          }
        } else {
          setWorkspaces([]);
          setActiveWorkspaceIdState('');
          clearWorkspaceData();
          setNeedsWorkspaceSetup(true);
        }
      } catch (err) {
        console.error('Session sync failed:', err);
        if (!auth.currentUser) {
          setStoredSessionToken(null);
          setUser(null);
          setProfile(null);
          setWorkspaces([]);
          setActiveWorkspaceIdState('');
          clearWorkspaceData();
        }
      } finally {
        setSeeding(false);
        setAuthReady(true);
      }
    };

    syncInFlightRef.current = run().finally(() => {
      syncInFlightRef.current = null;
    });
    return syncInFlightRef.current;
  }, [mapBackendWorkspaces, refreshWorkspaceData, clearWorkspaceData]);

  // Auth state lifecycle (handles both stored JWT and Firebase Auth cleanly with no flash)
  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      if (!active) return;

      if (getStoredSessionToken()) {
        await syncBackendSession();
        return;
      }

      if (nextUser) {
        setUser(nextUser);
        await syncBackendSession();
      } else {
        setUser(null);
        setProfile(null);
        setWorkspaces([]);
        setActiveWorkspaceIdState('');
        setPendingInvitations([]);
        setNeedsWorkspaceSetup(false);
        setOnboardingNeeded(false);
        clearWorkspaceData();
        setAuthReady(true);
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, [syncBackendSession, clearWorkspaceData]);

  const activeWorkspace = useMemo(() => {
    return workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;
  }, [workspaces, activeWorkspaceId]);

  const switchWorkspace = useCallback(
    async (id: string, workspaceListOverride?: Workspace[]) => {
      if (!user) return;
      setActiveWorkspaceIdState(id);
      setActiveWorkspaceId(user.uid, id);
      const list = workspaceListOverride || workspaces;
      const targetWs = list.find((w) => w.id === id);
      if (targetWs) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                role: targetWs.role,
                organizationName: targetWs.name,
              }
            : prev
        );
      }
      try {
        const switched = await apiPostJson<
          BackendWorkspaceDataResponse & {
            workspace?: { id: string; name: string };
            role?: WorkspaceRole;
          }
        >(`/api/workspaces/${id}/switch`, {});
        hydrateWorkspaceData(id, switched);
        if (switched.role || switched.workspace) {
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  role: switched.role || prev.role,
                  organizationName: switched.workspace?.name || prev.organizationName,
                }
              : prev
          );
        }
      } catch (err) {
        console.error('Workspace switch error:', err);
      }
    },
    [user, workspaces, hydrateWorkspaceData]
  );

  const createOrganizationWorkspace = useCallback(
    async (orgData: Partial<Workspace>) => {
      if (!user) throw new Error('Must be signed in to create workspace');
      const res = await apiPostJson<{
        workspace: { id: string; name: string; createdAtMs: number; updatedAtMs: number };
        workspaces: BackendWorkspaceSummary[];
      }>('/api/workspaces/organization', {
        organizationName: orgData.name || 'New Organization',
        logoUrl: orgData.logoUrl || '',
        industry: orgData.industry || 'Technology',
        website: orgData.website || '',
        country: orgData.country || 'United States',
        size: orgData.size || '1-10',
        departments: orgData.departments || [],
        onboardingCompleted: true,
      });

      const mapped = mapBackendWorkspaces(res.workspaces || []);
      setWorkspaces(mapped);
      saveUserWorkspaces(user.uid, mapped);
      setNeedsWorkspaceSetup(false);
      await switchWorkspace(res.workspace.id, mapped);
      return mapped.find((w) => w.id === res.workspace.id) || mapped[mapped.length - 1];
    },
    [user, mapBackendWorkspaces, switchWorkspace]
  );

  const updateWorkspaceDetails = useCallback(
    async (patch: {
      name?: string;
      logoUrl?: string;
      industry?: string;
      website?: string;
      country?: string;
      size?: string;
    }) => {
      if (!user || !activeWorkspace) return;
      await apiPatchJson(`/api/workspaces/${activeWorkspace.id}`, patch);
      setWorkspaces((prev) => {
        const next = prev.map((w) =>
          w.id === activeWorkspace.id
            ? {
                ...w,
                name: patch.name?.trim() || w.name,
                logoUrl: patch.logoUrl !== undefined ? patch.logoUrl : w.logoUrl,
                industry: patch.industry !== undefined ? patch.industry : w.industry,
                website: patch.website !== undefined ? patch.website : w.website,
                country: patch.country !== undefined ? patch.country : w.country,
                size: patch.size !== undefined ? patch.size : w.size,
                updatedAtMs: Date.now(),
              }
            : w
        );
        saveUserWorkspaces(user.uid, next);
        return next;
      });
      if (patch.name?.trim()) {
        setProfile((prev) =>
          prev ? { ...prev, organizationName: patch.name!.trim() } : prev
        );
      }
    },
    [user, activeWorkspace]
  );

  const createDepartment = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!user || !activeWorkspace || !trimmed) return;
      await apiPostJson(`/api/workspaces/${activeWorkspace.id}/departments`, {
        name: trimmed,
      });
      setWorkspaces((prev) => {
        const next = prev.map((w) => {
          if (w.id !== activeWorkspace.id) return w;
          const existing = w.departments || [];
          if (existing.some((d) => d.toLowerCase() === trimmed.toLowerCase())) return w;
          return { ...w, departments: [...existing, trimmed] };
        });
        saveUserWorkspaces(user.uid, next);
        return next;
      });
    },
    [user, activeWorkspace]
  );

  const inviteWorkspaceMember = useCallback(
    async (email: string, role: WorkspaceRole, dept: string) => {
      if (!user || !activeWorkspace) return;
      await apiPostJson(`/api/workspaces/${activeWorkspace.id}/invitations`, {
        email,
        role,
        department: dept,
      });
    },
    [user, activeWorkspace]
  );

  const respondToInvitation = useCallback(
    async (invitationId: string, action: 'accept' | 'reject') => {
      const res = await apiPostJson<{
        workspaces: BackendWorkspaceSummary[];
        pendingInvitations: typeof pendingInvitations;
      }>(`/api/invitations/${invitationId}/respond`, { action });
      setPendingInvitations(res.pendingInvitations || []);
      if (res.workspaces) {
        const mapped = mapBackendWorkspaces(res.workspaces);
        setWorkspaces(mapped);
        if (action === 'accept' && mapped.length > 0 && (!activeWorkspaceId || needsWorkspaceSetup)) {
          setNeedsWorkspaceSetup(false);
          await switchWorkspace(mapped[mapped.length - 1].id, mapped);
        }
      }
    },
    [mapBackendWorkspaces, activeWorkspaceId, needsWorkspaceSetup, switchWorkspace]
  );

  const startOnboarding = useCallback((type: 'personal' | 'organization') => {
    setOnboardingType(type);
    setOnboardingNeeded(true);
  }, []);

  const skipOnboarding = useCallback(() => {
    setOnboardingNeeded(false);
  }, []);

  const completePersonalOnboarding = useCallback(
    async (onboardingData: PersonalOnboardingData) => {
      if (!user) return;
      savePersonalOnboarding(user.uid, onboardingData);
      const profileRes = await apiPatchJson<{ profile: UserProfile }>('/api/profile', {
        displayName: onboardingData.fullName || user.displayName || 'Operations Lead',
        jobTitle: onboardingData.jobTitle,
        professionalBackground: onboardingData.professionalBackground,
        profession: onboardingData.profession,
        responsibilities: onboardingData.responsibilities,
        typeOfWork: onboardingData.typeOfWork,
        automationGoals: onboardingData.automationGoals,
        existingTools: onboardingData.existingTools,
        interactionPreference: onboardingData.interactionPreference,
        voiceLanguage: onboardingData.languagePreference,
        personalOnboardingCompleted: true,
      });
      if (profileRes.profile) {
        setProfile((prev) => (prev ? { ...prev, ...profileRes.profile } : profileRes.profile));
      }
      const wsRes = await apiPostJson<{
        workspace: { id: string };
        workspaces: BackendWorkspaceSummary[];
      }>('/api/workspaces/personal', {
        name: `${onboardingData.fullName?.trim() || 'Personal'}'s Workspace`,
        onboardingCompleted: true,
      });
      const mapped = mapBackendWorkspaces(wsRes.workspaces || []);
      setWorkspaces(mapped);
      saveUserWorkspaces(user.uid, mapped);
      setNeedsWorkspaceSetup(false);
      setOnboardingNeeded(false);
      await switchWorkspace(wsRes.workspace.id, mapped);
    },
    [user, mapBackendWorkspaces, switchWorkspace]
  );

  const completeOrgOnboarding = useCallback(
    async (onboardingData: OrganizationOnboardingData) => {
      if (!user) return;
      saveOrgOnboarding(user.uid, onboardingData);
      const res = await apiPostJson<{
        workspace: { id: string };
        workspaces: BackendWorkspaceSummary[];
      }>('/api/workspaces/organization', {
        organizationName: onboardingData.organizationName?.trim() || 'Organization Workspace',
        logoUrl: onboardingData.logoUrl || '',
        industry: onboardingData.industry,
        website: onboardingData.website,
        country: onboardingData.country,
        size: onboardingData.organizationSize,
        ownerRoleTitle: onboardingData.ownerRole,
        departments: onboardingData.departments,
        businessProcesses: onboardingData.businessProcesses,
        automationRequirements: onboardingData.automationRequirements,
        existingTools: onboardingData.existingSoftwareTools,
        teamInvitations: onboardingData.teamInvitations,
        onboardingCompleted: true,
      });
      const mapped = mapBackendWorkspaces(res.workspaces || []);
      setWorkspaces(mapped);
      saveUserWorkspaces(user.uid, mapped);
      setNeedsWorkspaceSetup(false);
      setOnboardingNeeded(false);
      await switchWorkspace(res.workspace.id, mapped);
    },
    [user, mapBackendWorkspaces, switchWorkspace]
  );

  // --- Auth Actions ---
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setAuthError(msg);
      throw err;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setStoredSessionToken(null);
    setUser(null);
    setProfile(null);
    setWorkspaces([]);
    setActiveWorkspaceIdState('');
    setPendingInvitations([]);
    setNeedsWorkspaceSetup(false);
    setOnboardingNeeded(false);
    clearWorkspaceData();
    try {
      await signOut(auth);
    } catch {
      // Ignore if backend-only session
    }
  }, [clearWorkspaceData]);

  // --- Helper: Append Audit Log ---
  const appendAuditLog = useCallback(
    async (entry: {
      workflowId: string;
      workflowTitle: string;
      eventType: string;
      summary: string;
      status: 'success' | 'pending' | 'failed' | 'warning';
      isSimulated?: boolean;
      durationMs?: number;
      actor?: string;
    }) => {
      if (!user || !activeWorkspace) return;
      try {
        const created = await apiPostJson<AuditLogItem>(
          `/api/workspaces/${activeWorkspace.id}/audit-logs`,
          {
            ...entry,
            actor: entry.actor || profile?.displayName || user.displayName || 'Operations Lead',
          }
        );
        setAuditLogs((prev) => [
          { ...created, actor: created.actor || entry.actor || profile?.displayName || 'System' },
          ...prev,
        ]);
      } catch (err) {
        console.error('Failed to record audit log:', err);
      }
    },
    [user, activeWorkspace, profile]
  );

  // --- Create Workflow + Tasks + Optional Approval from AI Proposal ---
  const createWorkflowFromDraft = useCallback(
    async (
      draft: ProposedWorkflowDraft,
      opts: {
        sourcePrompt: string;
        triggerType: 'voice' | 'chat';
        ragSources: string[];
        submitForApproval: boolean;
      }
    ): Promise<{ workflowId: string; approvalId?: string }> => {
      if (!user || !activeWorkspace) throw new Error('No active workspace selected.');
      const result = await apiPostJson<{
        workflow: Workflow;
        tasks: TaskItem[];
        approval: ApprovalItem | null;
      }>(`/api/workspaces/${activeWorkspace.id}/workflows/from-draft`, {
        draft,
        sourcePrompt: opts.sourcePrompt,
        triggerType: opts.triggerType,
        ragSources: opts.ragSources,
        requireApproval: opts.submitForApproval,
      });

      await refreshWorkspaceData(activeWorkspace.id);
      return {
        workflowId: result.workflow.id,
        approvalId: result.approval ? result.approval.id : undefined,
      };
    },
    [user, activeWorkspace, refreshWorkspaceData]
  );

  // --- Manual Workflow Creation ---
  const createManualWorkflow = useCallback(
    async (input: {
      title: string;
      description: string;
      category: string;
      priority: PriorityLevel;
      recommendedTeam: string;
      dueDate: string;
      steps: string[];
    }) => {
      if (!user || !activeWorkspace) throw new Error('No active workspace selected.');
      const created = await apiPostJson<Workflow>(
        `/api/workspaces/${activeWorkspace.id}/workflows`,
        { ...input, status: 'draft', triggerType: 'manual' }
      );
      setWorkflows((prev) => [{ ...created, ownerId: created.ownerId || user.uid }, ...prev]);
      await appendAuditLog({
        workflowId: created.id,
        workflowTitle: created.title,
        eventType: 'workflow_created_manual',
        summary: `Created manual workflow ${created.code} in ${input.category}.`,
        status: 'success',
        durationMs: 180,
      });
      return created.id;
    },
    [user, activeWorkspace, appendAuditLog]
  );

  // --- Update Workflow Status / Fields ---
  const updateWorkflowStatus = useCallback(
    async (workflow: Workflow, nextStatus: WorkflowStatus, note?: string) => {
      if (!user || !activeWorkspace) return;
      const updated = await apiPatchJson<Workflow>(
        `/api/workspaces/${activeWorkspace.id}/workflows/${workflow.id}`,
        { status: nextStatus, durationMs: (workflow.durationMs || 0) + 180 }
      );
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflow.id ? { ...updated, ownerId: updated.ownerId || w.ownerId } : w
        )
      );
      await appendAuditLog({
        workflowId: workflow.id,
        workflowTitle: workflow.title,
        eventType: `workflow_${nextStatus}`,
        summary:
          note || `Workflow ${workflow.code} transitioned from ${workflow.status} to ${nextStatus}.`,
        status: nextStatus === 'failed' ? 'failed' : nextStatus === 'blocked' ? 'warning' : 'success',
        durationMs: 180,
      });
    },
    [user, activeWorkspace, appendAuditLog]
  );

  const deleteWorkflow = useCallback(
    async (workflow: Workflow) => {
      if (!user || !activeWorkspace) return;
      await apiDeleteJson(`/api/workspaces/${activeWorkspace.id}/workflows/${workflow.id}`);
      setWorkflows((prev) => prev.filter((w) => w.id !== workflow.id));
      setTasks((prev) => prev.filter((t) => t.workflowId !== workflow.id));
      setApprovals((prev) => prev.filter((a) => a.workflowId !== workflow.id));
      await appendAuditLog({
        workflowId: workflow.id,
        workflowTitle: workflow.title,
        eventType: 'workflow_deleted',
        summary: `Removed workflow ${workflow.code}.`,
        status: 'warning',
        durationMs: 120,
      });
    },
    [user, activeWorkspace, appendAuditLog]
  );

  // --- Tasks CRUD ---
  const createTask = useCallback(
    async (input: {
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
    }) => {
      if (!user || !activeWorkspace) throw new Error('No active workspace selected.');
      const created = await apiPostJson<TaskItem>(
        `/api/workspaces/${activeWorkspace.id}/tasks`,
        input
      );
      setTasks((prev) => [{ ...created, ownerId: created.ownerId || user.uid }, ...prev]);
      return created.id;
    },
    [user, activeWorkspace]
  );

  const updateTaskStatus = useCallback(
    async (task: TaskItem, status: TaskStatus) => {
      if (!user || !activeWorkspace) return;
      const updated = await apiPatchJson<TaskItem>(
        `/api/workspaces/${activeWorkspace.id}/tasks/${task.id}`,
        { status }
      );
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...updated, ownerId: updated.ownerId || t.ownerId } : t))
      );
    },
    [user, activeWorkspace]
  );

  const addTaskComment = useCallback(
    async (task: TaskItem, commentText: string) => {
      if (!user || !activeWorkspace || !commentText.trim()) return;
      const author = profile?.displayName || user.displayName || 'User';
      const entry = `${author}: ${commentText.trim()}`.slice(0, 480);
      const nextComments = [...(task.comments || []), entry].slice(-30);
      const updated = await apiPatchJson<TaskItem>(
        `/api/workspaces/${activeWorkspace.id}/tasks/${task.id}`,
        { comments: nextComments }
      );
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...updated, ownerId: updated.ownerId || t.ownerId } : t))
      );
    },
    [user, activeWorkspace, profile]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!user || !activeWorkspace) return;
      await apiDeleteJson(`/api/workspaces/${activeWorkspace.id}/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
    [user, activeWorkspace]
  );

  // --- Knowledge Docs CRUD ---
  const saveKnowledgeDoc = useCallback(
    async (input: {
      title: string;
      fileName: string;
      fileType: 'pdf' | 'docx' | 'txt' | 'md';
      category: string;
      content: string;
      summary: string;
      tags: string[];
      wordCount: number;
    }) => {
      if (!user || !activeWorkspace) throw new Error('No active workspace selected.');
      const created = await apiPostJson<KnowledgeDoc>(
        `/api/workspaces/${activeWorkspace.id}/documents`,
        input
      );
      setKnowledgeDocs((prev) => [{ ...created, ownerId: created.ownerId || user.uid }, ...prev]);
      await appendAuditLog({
        workflowId: 'knowledge-base',
        workflowTitle: input.title,
        eventType: 'knowledge_doc_uploaded',
        summary: `Indexed "${input.fileName}" (${input.wordCount} words) into ${input.category} for RAG semantic retrieval.`,
        status: 'success',
        durationMs: 310,
      });
      return created.id;
    },
    [user, activeWorkspace, appendAuditLog]
  );

  const deleteKnowledgeDoc = useCallback(
    async (docId: string) => {
      if (!user || !activeWorkspace) return;
      await apiDeleteJson(`/api/workspaces/${activeWorkspace.id}/documents/${docId}`);
      setKnowledgeDocs((prev) => prev.filter((d) => d.id !== docId));
    },
    [user, activeWorkspace]
  );

  // --- Approval Decision & Approved Action Execution ---
  const resolveApproval = useCallback(
    async (
      approval: ApprovalItem,
      decision: 'approved' | 'rejected' | 'changes_requested',
      reviewerNote: string
    ) => {
      if (!user || !activeWorkspace) throw new Error('No active workspace selected.');
      await apiPostJson(`/api/workspaces/${activeWorkspace.id}/approvals/${approval.id}/resolve`, {
        decision,
        note: reviewerNote,
      });

      let execResult: {
        success: boolean;
        isSimulated: boolean;
        referenceId: string;
        durationMs: number;
        receipt: string;
      } | null = null;

      if (decision === 'approved') {
        execResult = await apiPostJson<{
          success: boolean;
          isSimulated: boolean;
          referenceId: string;
          durationMs: number;
          receipt: string;
        }>('/api/integrations/execute', {
          workspaceId: activeWorkspace.id,
          integrationName: approval.integrationTarget,
          actionType: approval.actionType,
          payload: approval.proposedPayload,
          isSimulated: approval.isSimulated,
          approvalId: approval.id,
        });
      }

      await refreshWorkspaceData(activeWorkspace.id);
      return execResult;
    },
    [user, activeWorkspace, refreshWorkspaceData]
  );

  // --- Integrations Update ---
  const updateIntegration = useCallback(
    async (
      item: IntegrationItem,
      patch: {
        status?: IntegrationItem['status'];
        endpointUrl?: string;
        executionsCount?: number;
      }
    ) => {
      if (!user || !activeWorkspace) return;
      const updated = await apiPatchJson<IntegrationItem>(
        `/api/workspaces/${activeWorkspace.id}/integrations/${item.id}`,
        {
          status: patch.status ?? item.status,
          endpointUrl: (patch.endpointUrl ?? item.endpointUrl ?? '').slice(0, 500),
          lastSyncAt: new Date().toISOString(),
          executionsCount: patch.executionsCount ?? item.executionsCount,
        }
      );
      setIntegrations((prev) =>
        prev.map((i) => (i.id === item.id ? { ...updated, ownerId: updated.ownerId || i.ownerId } : i))
      );
    },
    [user, activeWorkspace]
  );

  // --- Team Management ---
  const addTeamMember = useCallback(
    async (input: { name: string; role: UserRole; department: string }) => {
      if (!user || !activeWorkspace) return;
      const syntheticEmail = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@workspace.local`;
      await inviteWorkspaceMember(
        syntheticEmail,
        (['Owner', 'Admin', 'Manager', 'Member', 'Viewer'].includes(input.role)
          ? input.role
          : 'Member') as WorkspaceRole,
        input.department
      );
    },
    [user, activeWorkspace, inviteWorkspaceMember]
  );

  const updateTeamMemberRole = useCallback(
    async (member: TeamMember, role: WorkspaceRole) => {
      if (!user || !activeWorkspace) return;
      await apiPatchJson(
        `/api/workspaces/${activeWorkspace.id}/members/${member.id}/role`,
        { role }
      );
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role, updatedAtMs: Date.now() } : m))
      );
    },
    [user, activeWorkspace]
  );

  const removeTeamMember = useCallback(
    async (memberId: string) => {
      if (!user || !activeWorkspace) return;
      await apiDeleteJson(`/api/workspaces/${activeWorkspace.id}/members/${memberId}`);
      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    },
    [user, activeWorkspace]
  );

  // --- Profile & Settings Update ---
  const updateProfileSettings = useCallback(
    async (patch: Partial<Omit<UserProfile, 'uid' | 'role' | 'createdAt' | 'updatedAt'>>) => {
      if (!user) return;
      const res = await apiPatchJson<{ profile: UserProfile }>('/api/profile', patch);
      setProfile((prev) => (prev ? { ...prev, ...res.profile } : res.profile));
    },
    [user]
  );

  // --- Tutorial & Welcome Controls ---
  const completeWelcome = useCallback(async () => {
    setWelcomeSeen(true);
    try {
      await apiPatchJson('/api/profile', { welcomeSeen: true });
    } catch {
      // non-blocking
    }
  }, []);

  const updateTutorialStep = useCallback(async (step: number) => {
    setTutorialStep(step);
    try {
      await apiPatchJson('/api/profile', { tutorialStep: step });
    } catch {
      // non-blocking
    }
  }, []);

  const completeTutorial = useCallback(async () => {
    setTutorialCompleted(true);
    setWelcomeSeen(true);
    try {
      await apiPatchJson('/api/profile', {
        welcomeSeen: true,
        tutorialCompleted: true,
        tutorialStep: 8,
      });
    } catch {
      // non-blocking
    }
  }, []);

  const restartTutorial = useCallback(async () => {
    setWelcomeSeen(true);
    setTutorialCompleted(false);
    setTutorialStep(1);
    try {
      await apiPatchJson('/api/profile', { tutorialCompleted: false, tutorialStep: 1 });
    } catch {
      // non-blocking
    }
  }, []);

  // --- Notification Controls ---
  const markNotificationRead = useCallback(
    async (notifId: string) => {
      if (!activeWorkspace) return;
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
      await apiPatchJson(
        `/api/workspaces/${activeWorkspace.id}/notifications/${notifId}/read`,
        {}
      ).catch(() => {});
    },
    [activeWorkspace]
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!activeWorkspace) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await apiPostJson(
      `/api/workspaces/${activeWorkspace.id}/notifications/read-all`,
      {}
    ).catch(() => {});
  }, [activeWorkspace]);

  const archiveNotification = useCallback(
    async (notifId: string) => {
      if (!activeWorkspace) return;
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      await apiDeleteJson(`/api/workspaces/${activeWorkspace.id}/notifications/${notifId}`).catch(
        () => {}
      );
    },
    [activeWorkspace]
  );

  const executeWorkflow = useCallback(
    async (workflowId: string, idempotencyKey?: string) => {
      if (!activeWorkspace) throw new Error('No active workspace.');
      const res = await apiPostJson<{ workflow: Workflow; duplicate: boolean }>(
        `/api/workspaces/${activeWorkspace.id}/workflows/${workflowId}/execute`,
        { idempotencyKey: idempotencyKey || `exec-${workflowId}-${Date.now()}` }
      );
      await refreshWorkspaceData(activeWorkspace.id);
      return res;
    },
    [activeWorkspace, refreshWorkspaceData]
  );

  return {
    user,
    authReady,
    seeding,
    authError,
    profile,
    workflows,
    tasks,
    knowledgeDocs,
    approvals,
    integrations,
    auditLogs,
    teamMembers,
    notifications,
    welcomeSeen,
    tutorialCompleted,
    tutorialStep,
    completeWelcome,
    updateTutorialStep,
    completeTutorial,
    restartTutorial,
    markNotificationRead,
    markAllNotificationsRead,
    archiveNotification,
    executeWorkflow,
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    pendingInvitations,
    switchWorkspace,
    createOrganizationWorkspace,
    updateWorkspaceDetails,
    createDepartment,
    inviteWorkspaceMember,
    respondToInvitation,
    syncBackendSession,
    needsWorkspaceSetup,
    onboardingNeeded,
    onboardingType,
    startOnboarding,
    skipOnboarding,
    completePersonalOnboarding,
    completeOrgOnboarding,
    signInWithGoogle,
    signOutUser,
    createWorkflowFromDraft,
    createManualWorkflow,
    updateWorkflowStatus,
    deleteWorkflow,
    createTask,
    updateTaskStatus,
    addTaskComment,
    deleteTask,
    saveKnowledgeDoc,
    deleteKnowledgeDoc,
    resolveApproval,
    updateIntegration,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    updateProfileSettings,
    appendAuditLog,
  };
}
