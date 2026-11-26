import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { ensureWorkspaceSeeded } from '../lib/seedData';
import { apiPostJson } from '../lib/api';
import {
  ApprovalItem,
  AuditLogItem,
  IntegrationItem,
  KnowledgeDoc,
  PriorityLevel,
  ProposedWorkflowDraft,
  TaskItem,
  TaskStatus,
  TeamMember,
  TriggerType,
  UserProfile,
  UserRole,
  Workflow,
  WorkflowStatus,
} from '../types';

function tsToMs(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (val && typeof val === 'object' && 'seconds' in val) {
    const s = (val as { seconds: number }).seconds;
    return s * 1000;
  }
  return Date.now();
}

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}-${Date.now().toString(36)}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        setSeeding(true);
        try {
          await ensureWorkspaceSeeded(nextUser);
        } catch (err) {
          console.error('Seed error:', err);
        } finally {
          setSeeding(false);
        }
      } else {
        setProfile(null);
        setWorkflows([]);
        setTasks([]);
        setKnowledgeDocs([]);
        setApprovals([]);
        setIntegrations([]);
        setAuditLogs([]);
        setTeamMembers([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    const uid = user.uid;

    const unsubProfile = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const unsubWorkflows = onSnapshot(
      query(collection(db, 'workflows'), where('ownerId', '==', uid)),
      (snap) => {
        const list: Workflow[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              code: data.code,
              title: data.title,
              description: data.description,
              category: data.category,
              status: data.status,
              priority: data.priority,
              recommendedTeam: data.recommendedTeam,
              triggerType: data.triggerType,
              sourcePrompt: data.sourcePrompt || '',
              troubleshootingSummary: data.troubleshootingSummary || '',
              durationMs: Number(data.durationMs || 0),
              steps: Array.isArray(data.steps) ? data.steps : [],
              ragSources: Array.isArray(data.ragSources) ? data.ragSources : [],
              dueDate: data.dueDate || '',
              createdAtMs: tsToMs(data.createdAt),
              updatedAtMs: tsToMs(data.updatedAt),
            };
          })
          .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        setWorkflows(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'workflows')
    );

    const unsubTasks = onSnapshot(
      query(collection(db, 'tasks'), where('ownerId', '==', uid)),
      (snap) => {
        const list: TaskItem[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              workflowId: data.workflowId,
              code: data.code,
              title: data.title,
              description: data.description,
              assignee: data.assignee,
              department: data.department,
              priority: data.priority,
              status: data.status,
              dueDate: data.dueDate,
              dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
              comments: Array.isArray(data.comments) ? data.comments : [],
              integrationAction: data.integrationAction || '',
              requiresApproval: Boolean(data.requiresApproval),
              createdAtMs: tsToMs(data.createdAt),
              updatedAtMs: tsToMs(data.updatedAt),
            };
          })
          .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        setTasks(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tasks')
    );

    const unsubDocs = onSnapshot(
      query(collection(db, 'knowledgeDocs'), where('ownerId', '==', uid)),
      (snap) => {
        const list: KnowledgeDoc[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              title: data.title,
              fileName: data.fileName,
              fileType: data.fileType,
              category: data.category,
              content: data.content,
              summary: data.summary,
              tags: Array.isArray(data.tags) ? data.tags : [],
              wordCount: Number(data.wordCount || 0),
              createdAtMs: tsToMs(data.createdAt),
              updatedAtMs: tsToMs(data.updatedAt),
            };
          })
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        setKnowledgeDocs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'knowledgeDocs')
    );

    const unsubApprovals = onSnapshot(
      query(collection(db, 'approvals'), where('ownerId', '==', uid)),
      (snap) => {
        const list: ApprovalItem[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              workflowId: data.workflowId,
              workflowTitle: data.workflowTitle,
              actionType: data.actionType,
              integrationTarget: data.integrationTarget,
              isSimulated: Boolean(data.isSimulated),
              riskLevel: data.riskLevel,
              reason: data.reason,
              proposedPayload: data.proposedPayload,
              requestedBy: data.requestedBy,
              status: data.status,
              reviewerNote: data.reviewerNote || '',
              reviewedBy: data.reviewedBy || '',
              createdAtMs: tsToMs(data.createdAt),
              updatedAtMs: tsToMs(data.updatedAt),
            };
          })
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        setApprovals(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'approvals')
    );

    const unsubIntegrations = onSnapshot(
      query(collection(db, 'integrations'), where('ownerId', '==', uid)),
      (snap) => {
        const list: IntegrationItem[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              key: data.key,
              name: data.name,
              category: data.category,
              provider: data.provider,
              status: data.status,
              isSimulated: Boolean(data.isSimulated),
              endpointUrl: data.endpointUrl || '',
              description: data.description,
              lastSyncAt: data.lastSyncAt || '',
              executionsCount: Number(data.executionsCount || 0),
              createdAtMs: tsToMs(data.createdAt),
              updatedAtMs: tsToMs(data.updatedAt),
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        setIntegrations(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'integrations')
    );

    const unsubAuditLogs = onSnapshot(
      query(collection(db, 'auditLogs'), where('ownerId', '==', uid)),
      (snap) => {
        const list: AuditLogItem[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              workflowId: data.workflowId,
              workflowTitle: data.workflowTitle,
              eventType: data.eventType,
              actor: data.actor,
              summary: data.summary,
              status: data.status,
              isSimulated: Boolean(data.isSimulated),
              durationMs: Number(data.durationMs || 0),
              createdAtMs: tsToMs(data.createdAt),
            };
          })
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        setAuditLogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'auditLogs')
    );

    const unsubTeam = onSnapshot(
      query(collection(db, 'teamMembers'), where('ownerId', '==', uid)),
      (snap) => {
        const list: TeamMember[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              name: data.name,
              role: data.role,
              department: data.department,
              status: data.status,
              createdAtMs: tsToMs(data.createdAt),
              updatedAtMs: tsToMs(data.updatedAt),
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        setTeamMembers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'teamMembers')
    );

    return () => {
      unsubProfile();
      unsubWorkflows();
      unsubTasks();
      unsubDocs();
      unsubApprovals();
      unsubIntegrations();
      unsubAuditLogs();
      unsubTeam();
    };
  }, [authReady, user]);

  // --- Auth Actions ---
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  // --- Audit Helper ---
  const appendAuditLog = useCallback(
    async (entry: {
      workflowId: string;
      workflowTitle: string;
      eventType: string;
      actor?: string;
      summary: string;
      status: 'success' | 'pending' | 'failed' | 'warning';
      isSimulated?: boolean;
      durationMs?: number;
    }) => {
      if (!user) return;
      const logId = makeId('log');
      try {
        await setDoc(doc(db, 'auditLogs', logId), {
          ownerId: user.uid,
          workflowId: entry.workflowId.slice(0, 128),
          workflowTitle: entry.workflowTitle.slice(0, 200),
          eventType: entry.eventType.slice(0, 80),
          actor: (entry.actor || profile?.displayName || user.displayName || 'User').slice(0, 120),
          summary: entry.summary.slice(0, 1000),
          status: entry.status,
          isSimulated: Boolean(entry.isSimulated),
          durationMs: Math.max(0, Math.min(86400000, Math.round(entry.durationMs ?? 240))),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `auditLogs/${logId}`);
      }
    },
    [user, profile]
  );

  // --- Workflow Creation from AI Draft (Atomic Batch: Workflow + Tasks + Approval + Audit Log) ---
  const createWorkflowFromDraft = useCallback(
    async (
      draft: ProposedWorkflowDraft,
      opts: {
        sourcePrompt: string;
        triggerType: TriggerType;
        ragSources: string[];
        submitForApproval: boolean;
      }
    ): Promise<{ workflowId: string; approvalId?: string }> => {
      if (!user) throw new Error('Not authenticated');
      const startedAt = Date.now();
      const wfId = makeId('wf');
      const codeNum = 100 + workflows.length + 1;
      const wfCode = `FLW-${codeNum}`;
      const needsApproval = Boolean(opts.submitForApproval && draft.approvalRequest);
      const initialStatus: WorkflowStatus = needsApproval ? 'awaiting_approval' : 'in_progress';

      const batch = writeBatch(db);
      const cleanSteps = (draft.steps || []).slice(0, 25).map((s) => String(s).slice(0, 480));
      const cleanRagSources = (opts.ragSources || [])
        .slice(0, 10)
        .map((s) => String(s).slice(0, 480));

      batch.set(doc(db, 'workflows', wfId), {
        ownerId: user.uid,
        code: wfCode,
        title: draft.title.slice(0, 200),
        description: draft.description.slice(0, 4000),
        category: draft.category.slice(0, 80),
        status: initialStatus,
        priority: draft.priority,
        recommendedTeam: draft.recommendedTeam.slice(0, 120),
        triggerType: opts.triggerType,
        sourcePrompt: opts.sourcePrompt.slice(0, 2000),
        troubleshootingSummary: (draft.troubleshootingSummary || '').slice(0, 5000),
        durationMs: Math.max(320, Date.now() - startedAt + 420),
        steps: cleanSteps,
        ragSources: cleanRagSources,
        dueDate: (draft.dueDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10)).slice(
          0,
          40
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const taskList = (draft.tasks || []).slice(0, 12);
      taskList.forEach((t, idx) => {
        const tId = makeId(`tsk${idx}`);
        const tCode = `TSK-${200 + tasks.length + idx + 1}`;
        batch.set(doc(db, 'tasks', tId), {
          ownerId: user.uid,
          workflowId: wfId,
          code: tCode,
          title: t.title.slice(0, 200),
          description: t.description.slice(0, 4000),
          assignee: (t.assignee || draft.recommendedTeam || 'Unassigned').slice(0, 120),
          department: (t.department || draft.category || 'Operations').slice(0, 80),
          priority: t.priority || draft.priority,
          status: needsApproval && t.requiresApproval ? 'blocked' : idx === 0 ? 'in_progress' : 'todo',
          dueDate: (t.dueDate || draft.dueDate || new Date().toISOString().slice(0, 10)).slice(0, 40),
          dependencies: (t.dependencies || []).slice(0, 10).map((d) => String(d).slice(0, 480)),
          comments: [],
          integrationAction: (t.integrationAction || '').slice(0, 200),
          requiresApproval: Boolean(t.requiresApproval),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      let approvalId: string | undefined;
      if (needsApproval && draft.approvalRequest) {
        approvalId = makeId('apr');
        batch.set(doc(db, 'approvals', approvalId), {
          ownerId: user.uid,
          workflowId: wfId,
          workflowTitle: draft.title.slice(0, 200),
          actionType: draft.approvalRequest.actionType.slice(0, 100),
          integrationTarget: `${draft.approvalRequest.integrationTarget} [SIMULATED]`.slice(0, 100),
          isSimulated: true,
          riskLevel: draft.approvalRequest.riskLevel || 'medium',
          reason: draft.approvalRequest.reason.slice(0, 1000),
          proposedPayload: draft.approvalRequest.proposedPayload.slice(0, 4000),
          requestedBy: (profile?.displayName || user.displayName || 'User').slice(0, 120),
          status: 'pending',
          reviewerNote: '',
          reviewedBy: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const logId = makeId('log');
      batch.set(doc(db, 'auditLogs', logId), {
        ownerId: user.uid,
        workflowId: wfId,
        workflowTitle: draft.title.slice(0, 200),
        eventType: needsApproval ? 'workflow_queued_approval' : 'workflow_created',
        actor: (profile?.displayName || user.displayName || 'User').slice(0, 120),
        summary: needsApproval
          ? `Generated workflow ${wfCode} (${taskList.length} tasks) via ${opts.triggerType}. Queued for human approval before external action.`
          : `Generated and started workflow ${wfCode} (${taskList.length} tasks) via ${opts.triggerType}.`,
        status: needsApproval ? 'pending' : 'success',
        isSimulated: false,
        durationMs: Math.max(300, Date.now() - startedAt + 350),
        createdAt: serverTimestamp(),
      });

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `workflows/${wfId}`);
      }

      return { workflowId: wfId, approvalId };
    },
    [user, workflows.length, tasks.length, profile]
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
      if (!user) throw new Error('Not authenticated');
      const wfId = makeId('wf');
      const wfCode = `FLW-${100 + workflows.length + 1}`;
      try {
        await setDoc(doc(db, 'workflows', wfId), {
          ownerId: user.uid,
          code: wfCode,
          title: input.title.slice(0, 200),
          description: input.description.slice(0, 4000),
          category: input.category.slice(0, 80),
          status: 'draft',
          priority: input.priority,
          recommendedTeam: input.recommendedTeam.slice(0, 120),
          triggerType: 'manual',
          sourcePrompt: '',
          troubleshootingSummary: '',
          durationMs: 220,
          steps: input.steps.slice(0, 25).map((s) => s.slice(0, 480)),
          ragSources: [],
          dueDate: input.dueDate.slice(0, 40),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await appendAuditLog({
          workflowId: wfId,
          workflowTitle: input.title,
          eventType: 'workflow_created_manual',
          summary: `Created manual workflow ${wfCode} in ${input.category}.`,
          status: 'success',
          durationMs: 220,
        });
        return wfId;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `workflows/${wfId}`);
      }
    },
    [user, workflows.length, appendAuditLog]
  );

  // --- Update Workflow Status / Fields ---
  const updateWorkflowStatus = useCallback(
    async (workflow: Workflow, nextStatus: WorkflowStatus, note?: string) => {
      if (!user) return;
      try {
        await updateDoc(doc(db, 'workflows', workflow.id), {
          status: nextStatus,
          durationMs: workflow.durationMs + 180,
          updatedAt: serverTimestamp(),
        });
        await appendAuditLog({
          workflowId: workflow.id,
          workflowTitle: workflow.title,
          eventType: `workflow_${nextStatus}`,
          summary: note || `Workflow ${workflow.code} transitioned from ${workflow.status} to ${nextStatus}.`,
          status: nextStatus === 'failed' ? 'failed' : nextStatus === 'blocked' ? 'warning' : 'success',
          durationMs: 180,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workflows/${workflow.id}`);
      }
    },
    [user, appendAuditLog]
  );

  const deleteWorkflow = useCallback(
    async (workflow: Workflow) => {
      if (!user) return;
      try {
        await deleteDoc(doc(db, 'workflows', workflow.id));
        await appendAuditLog({
          workflowId: workflow.id,
          workflowTitle: workflow.title,
          eventType: 'workflow_deleted',
          summary: `Removed workflow ${workflow.code}.`,
          status: 'warning',
          durationMs: 120,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `workflows/${workflow.id}`);
      }
    },
    [user, appendAuditLog]
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
      if (!user) throw new Error('Not authenticated');
      const tId = makeId('tsk');
      const code = `TSK-${200 + tasks.length + 1}`;
      try {
        await setDoc(doc(db, 'tasks', tId), {
          ownerId: user.uid,
          workflowId: input.workflowId,
          code,
          title: input.title.slice(0, 200),
          description: input.description.slice(0, 4000),
          assignee: input.assignee.slice(0, 120),
          department: input.department.slice(0, 80),
          priority: input.priority,
          status: input.status,
          dueDate: input.dueDate.slice(0, 40),
          dependencies: input.dependencies.slice(0, 10).map((d) => d.slice(0, 480)),
          comments: [],
          integrationAction: (input.integrationAction || '').slice(0, 200),
          requiresApproval: Boolean(input.requiresApproval),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return tId;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tasks/${tId}`);
      }
    },
    [user, tasks.length]
  );

  const updateTaskStatus = useCallback(
    async (task: TaskItem, status: TaskStatus) => {
      if (!user) return;
      try {
        await updateDoc(doc(db, 'tasks', task.id), {
          status,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
      }
    },
    [user]
  );

  const addTaskComment = useCallback(
    async (task: TaskItem, commentText: string) => {
      if (!user || !commentText.trim()) return;
      const author = profile?.displayName || user.displayName || 'User';
      const entry = `${author}: ${commentText.trim()}`.slice(0, 480);
      const nextComments = [...task.comments, entry].slice(-30);
      try {
        await updateDoc(doc(db, 'tasks', task.id), {
          comments: nextComments,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
      }
    },
    [user, profile]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!user) return;
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
      }
    },
    [user]
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
      if (!user) throw new Error('Not authenticated');
      const docId = makeId('kb');
      try {
        await setDoc(doc(db, 'knowledgeDocs', docId), {
          ownerId: user.uid,
          title: input.title.slice(0, 200),
          fileName: input.fileName.slice(0, 200),
          fileType: input.fileType,
          category: input.category.slice(0, 80),
          content: input.content.slice(0, 75000),
          summary: input.summary.slice(0, 950),
          tags: input.tags.slice(0, 10).map((t) => t.slice(0, 60)),
          wordCount: Math.max(0, Math.min(500000, Math.round(input.wordCount))),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await appendAuditLog({
          workflowId: 'knowledge-base',
          workflowTitle: input.title,
          eventType: 'knowledge_doc_uploaded',
          summary: `Indexed "${input.fileName}" (${input.wordCount} words) into ${input.category} for RAG semantic retrieval.`,
          status: 'success',
          durationMs: 310,
        });
        return docId;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `knowledgeDocs/${docId}`);
      }
    },
    [user, appendAuditLog]
  );

  const deleteKnowledgeDoc = useCallback(
    async (docId: string) => {
      if (!user) return;
      try {
        await deleteDoc(doc(db, 'knowledgeDocs', docId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `knowledgeDocs/${docId}`);
      }
    },
    [user]
  );

  // --- Approval Decision & Approved Action Execution ---
  const resolveApproval = useCallback(
    async (
      approval: ApprovalItem,
      decision: 'approved' | 'rejected' | 'changes_requested',
      reviewerNote: string
    ) => {
      if (!user) throw new Error('Not authenticated');
      const reviewerName = (profile?.displayName || user.displayName || 'Approver').slice(0, 120);

      try {
        await updateDoc(doc(db, 'approvals', approval.id), {
          status: decision,
          reviewerNote: reviewerNote.slice(0, 1000),
          reviewedBy: reviewerName,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `approvals/${approval.id}`);
      }

      const parentWorkflow = workflows.find((w) => w.id === approval.workflowId);

      if (decision === 'approved') {
        // Execute the approved integration action via server endpoint (clearly marked simulated)
        const execResult = await apiPostJson<{
          success: boolean;
          isSimulated: boolean;
          referenceId: string;
          durationMs: number;
          receipt: string;
        }>('/api/integrations/execute', {
          integrationName: approval.integrationTarget,
          actionType: approval.actionType,
          payload: approval.proposedPayload,
          isSimulated: approval.isSimulated,
          approvalId: approval.id,
        });

        // Update workflow to completed / in_progress & unblock related tasks
        if (parentWorkflow && parentWorkflow.status !== 'completed') {
          try {
            await updateDoc(doc(db, 'workflows', parentWorkflow.id), {
              status: 'completed',
              durationMs: parentWorkflow.durationMs + execResult.durationMs,
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `workflows/${parentWorkflow.id}`);
          }
        }

        // Complete pending approval-gated tasks for this workflow
        const relatedTasks = tasks.filter((t) => t.workflowId === approval.workflowId);
        for (const t of relatedTasks) {
          if (t.status !== 'completed') {
            try {
              await updateDoc(doc(db, 'tasks', t.id), {
                status: 'completed',
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `tasks/${t.id}`);
            }
          }
        }

        // Increment matching integration execution counter
        const matchedInt = integrations.find(
          (i) =>
            approval.integrationTarget.toLowerCase().includes(i.name.toLowerCase()) ||
            approval.integrationTarget.toLowerCase().includes('ticket') && i.category === 'ticketing' ||
            approval.integrationTarget.toLowerCase().includes('email') && i.category === 'email'
        );
        if (matchedInt) {
          try {
            await updateDoc(doc(db, 'integrations', matchedInt.id), {
              executionsCount: matchedInt.executionsCount + 1,
              lastSyncAt: new Date().toISOString(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `integrations/${matchedInt.id}`);
          }
        }

        await appendAuditLog({
          workflowId: approval.workflowId,
          workflowTitle: approval.workflowTitle,
          eventType: 'approval_executed',
          actor: reviewerName,
          summary: `${execResult.receipt}${reviewerNote ? ` Note: ${reviewerNote}` : ''}`,
          status: 'success',
          isSimulated: execResult.isSimulated,
          durationMs: execResult.durationMs,
        });

        return execResult;
      } else {
        // Rejected or changes requested
        if (parentWorkflow && parentWorkflow.status !== 'completed') {
          const nextWfStatus: WorkflowStatus = decision === 'rejected' ? 'failed' : 'blocked';
          try {
            await updateDoc(doc(db, 'workflows', parentWorkflow.id), {
              status: nextWfStatus,
              durationMs: parentWorkflow.durationMs + 100,
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `workflows/${parentWorkflow.id}`);
          }
        }

        await appendAuditLog({
          workflowId: approval.workflowId,
          workflowTitle: approval.workflowTitle,
          eventType: decision === 'rejected' ? 'approval_rejected' : 'approval_changes_requested',
          actor: reviewerName,
          summary:
            decision === 'rejected'
              ? `Rejected "${approval.actionType}". Reason: ${reviewerNote || 'Declined by reviewer'}`
              : `Requested modifications for "${approval.actionType}": ${reviewerNote || 'Updates needed'}`,
          status: decision === 'rejected' ? 'failed' : 'warning',
          isSimulated: approval.isSimulated,
          durationMs: 100,
        });
        return null;
      }
    },
    [user, profile, workflows, tasks, integrations, appendAuditLog]
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
      if (!user) return;
      try {
        await updateDoc(doc(db, 'integrations', item.id), {
          status: patch.status ?? item.status,
          isSimulated: true, // Prototype connectors always explicitly remain labeled simulated
          endpointUrl: (patch.endpointUrl ?? item.endpointUrl ?? '').slice(0, 500),
          lastSyncAt: new Date().toISOString(),
          executionsCount: patch.executionsCount ?? item.executionsCount,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `integrations/${item.id}`);
      }
    },
    [user]
  );

  // --- Team Management ---
  const addTeamMember = useCallback(
    async (input: { name: string; role: UserRole; department: string }) => {
      if (!user) return;
      const memberId = makeId('tm');
      try {
        await setDoc(doc(db, 'teamMembers', memberId), {
          ownerId: user.uid,
          name: input.name.slice(0, 120),
          role: input.role,
          department: input.department.slice(0, 80),
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `teamMembers/${memberId}`);
      }
    },
    [user]
  );

  const updateTeamMemberRole = useCallback(
    async (member: TeamMember, role: UserRole) => {
      if (!user) return;
      try {
        await updateDoc(doc(db, 'teamMembers', member.id), {
          role,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `teamMembers/${member.id}`);
      }
    },
    [user]
  );

  const removeTeamMember = useCallback(
    async (memberId: string) => {
      if (!user) return;
      try {
        await deleteDoc(doc(db, 'teamMembers', memberId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `teamMembers/${memberId}`);
      }
    },
    [user]
  );

  // --- Profile & Settings Update ---
  const updateProfileSettings = useCallback(
    async (patch: Partial<Omit<UserProfile, 'uid' | 'role' | 'createdAt' | 'updatedAt'>>) => {
      if (!user) return;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          ...patch,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    },
    [user]
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
