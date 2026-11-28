import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';

export async function ensureWorkspaceSeeded(user: User): Promise<void> {
  const profileRef = doc(db, 'users', user.uid);
  let profileSnap;
  try {
    profileSnap = await getDoc(profileRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
  }

  if (profileSnap.exists()) {
    return;
  }

  const isBootstrappedAdmin =
    user.email?.toLowerCase() === 'pandyashweta.in@gmail.com' && user.emailVerified;
  const displayName = (user.displayName || user.email?.split('@')[0] || 'Operations Lead').slice(
    0,
    120
  );

  // Create profile & isolated private PII doc first
  try {
    await setDoc(profileRef, {
      uid: user.uid,
      displayName,
      role: isBootstrappedAdmin ? 'Admin' : 'Operator',
      department: 'Enterprise Operations',
      organizationName: 'Flowstate Enterprise HQ',
      voiceLanguage: 'en-US',
      autoSpeakResponses: true,
      requireApprovalForExternal: true,
      notifyApprovals: true,
      notifyFailures: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'users', user.uid, 'private', 'info'), {
      email: (user.email || 'user@flowstate.local').slice(0, 200),
      phone: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
  }

  const batch = writeBatch(db);
  const uid = user.uid;
  const uidPrefix = uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);

  // --- 1. Knowledge Base Documents (Real Enterprise Runbooks & Incident Logs for RAG) ---
  const docs = [
    {
      id: `kb-${uidPrefix}-auth-incidents`,
      title: 'Customer Login Failure & SSO Incident Playbook (2025-2026)',
      fileName: 'Customer_Login_Failure_Incident_Playbook.pdf',
      fileType: 'pdf',
      category: 'Customer Support',
      summary:
        'Historical post-mortems and troubleshooting procedures for customer authentication failures, expired OAuth refresh tokens, MFA lockout loops, and SAML IdP clock drift.',
      tags: ['login-failure', 'sso', 'mfa', 'incident-history', 'auth'],
      content: `ENTERPRISE INCIDENT HISTORY & TROUBLESHOOTING PLAYBOOK: CUSTOMER AUTHENTICATION & LOGIN FAILURES
Document Owner: Identity & Auth Engineering | Last Updated: 2026-10-14 | SLA Tier: P1 (15-min response)

PREVIOUS RECORDED INCIDENTS:
1. INC-2026-0412 - SSO SAML Assertion Rejection ("Invalid SAML Response" / HTTP 401):
   - Root Cause: Customer IdP (Okta / Entra ID) certificate rotation occurred without updating the SP metadata fingerprint in Flowstate Identity Gateway.
   - Resolution: Verify active X.509 thumbprint in Admin SSO Console, flush Redis session cache for tenant ID, and ask tenant admin to re-upload IdP metadata XML. Average time to resolve: 18 minutes.

2. INC-2026-0389 - Account Lockout Loop After Password Reset:
   - Root Cause: Rate-limiter stuck in Redis after 5 consecutive failed mobile app background token refreshes, locking the account for 60 minutes even after valid password reset.
   - Resolution: Check Auth Audit Stream for event AUTH_RATE_LIMIT_LOCK. Run internal command reset-auth-lockout --account-id <id>, revoke stale mobile refresh tokens, and send customer fresh magic login link.

3. INC-2026-0295 - MFA TOTP Code Rejected ("Invalid Verification Code"):
   - Root Cause: Client device clock drift exceeding +/- 90 seconds or stale backup MFA enrollment after device replacement.
   - Resolution: Verify user identity via secondary verified email or enterprise account manager, issue single-use MFA recovery bypass valid for 15 minutes, and guide user to re-enroll authenticator app.

ESCALATION & TICKETING POLICY:
- Tier 1 Support handles password resets and browser cookie/cache clearing.
- Identity & Auth Engineering (Primary Team) handles SAML/SSO certificate mismatches, Redis lockout overrides, and OAuth token revocations.
- All P1/P2 login failure tickets MUST be logged in Zendesk Support Desk with priority High or Critical, tagged with "auth-login-failure", and require Supervisor/Approver authorization before automated ticket assignment to Engineering.`,
    },
    {
      id: `kb-${uidPrefix}-sla-escalation`,
      title: 'Enterprise Support Escalation Matrix & SLA Guidelines',
      fileName: 'Support_Escalation_Matrix_SLA.docx',
      fileType: 'docx',
      category: 'Customer Support',
      summary:
        'Defines P1-P4 response SLAs, routing rules across Technical Support, Identity Engineering, Billing Ops, and Security Response teams.',
      tags: ['sla', 'escalation', 'routing', 'support-policy'],
      content: `ENTERPRISE SUPPORT ESCALATION MATRIX & SLA POLICY
1. Priority Definitions:
   - Critical (P1): Complete customer login outage, production workflow halt, or security incident. First response: 15 minutes. Escalate immediately to Identity & Auth Engineering or SRE On-Call.
   - High (P2): Single enterprise customer unable to access account, broken CRM/ERP sync, or payment failure. First response: 1 hour. Route to Tier 2 Technical Support or Identity & Auth Engineering.
   - Medium (P3): Non-blocking UI bug, report export delay, configuration question. First response: 4 business hours.
   - Low (P4): Feature enhancement request or documentation update.

2. Human-in-the-Loop Approval Gates:
   - Creating and assigning external support tickets to Engineering teams requires human approval unless pre-authorized under an active incident bridge.
   - Sending mass customer outage emails always requires Approver or Admin sign-off.
   - Refunds above $500 require Billing Operations Manager approval.`,
    },
    {
      id: `kb-${uidPrefix}-invoice-sop`,
      title: 'Automated Invoice Reconciliation & Billing Discrepancy SOP',
      fileName: 'Invoice_Reconciliation_SOP.txt',
      fileType: 'txt',
      category: 'Billing & Finance',
      summary:
        'Standard operating procedure for validating vendor invoices, flagging PO mismatches >2%, and routing payment approvals.',
      tags: ['billing', 'invoices', 'finance', 'reconciliation'],
      content: `FINANCE OPERATIONS SOP: INVOICE RECONCILIATION
1. Compare incoming PDF invoice line items against active Purchase Orders in NetSuite / ERP.
2. Variance Tolerance: Discrepancies under 2% or $100 may auto-reconcile. Discrepancies above 2% must enter Awaiting Approval status and route to Finance Controller (Maya Patel).
3. Duplicate invoice numbers or changed bank routing numbers must immediately set workflow status to Blocked and notify Security & Finance teams.`,
    },
    {
      id: `kb-${uidPrefix}-onboarding-sop`,
      title: 'Employee Onboarding IT Provisioning Checklist',
      fileName: 'Employee_Onboarding_IT_Checklist.md',
      fileType: 'md',
      category: 'HR Management',
      summary:
        'Step-by-step IT provisioning guide for Google Workspace, Slack channels, GitHub org seats, and role-based access assignments.',
      tags: ['hr', 'onboarding', 'it-ops', 'provisioning'],
      content: `HR & IT OPERATIONS: NEW HIRE PROVISIONING CHECKLIST
1. Verify signed offer letter in HRIS and confirm start date and department.
2. Create Google Workspace identity and assign SSO group matching department (Engineering, Support, Sales Ops, Finance).
3. Provision Slack workspace access, Jira/Zendesk seat if applicable, and assign mandatory security training due within 7 days.
4. Schedule 30-minute IT orientation call on Google Calendar.`,
    },
  ];

  for (const d of docs) {
    batch.set(doc(db, 'knowledgeDocs', d.id), {
      ownerId: uid,
      title: d.title,
      fileName: d.fileName,
      fileType: d.fileType,
      category: d.category,
      content: d.content,
      summary: d.summary,
      tags: d.tags,
      wordCount: d.content.split(/\s+/).filter(Boolean).length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // --- 2. Seed Workflows ---
  const wf1Id = `wf-${uidPrefix}-01`;
  const wf2Id = `wf-${uidPrefix}-02`;
  const wf3Id = `wf-${uidPrefix}-03`;
  const wf4Id = `wf-${uidPrefix}-04`;
  const wf5Id = `wf-${uidPrefix}-05`;

  const workflows = [
    {
      id: wf1Id,
      code: 'FLW-101',
      title: 'Enterprise SSO Token Refresh & Sync',
      description:
        'Automated validation of customer SAML metadata certificates and session cache synchronization across identity gateways.',
      category: 'IT Operations',
      status: 'completed',
      priority: 'high',
      recommendedTeam: 'Identity & Auth Engineering',
      triggerType: 'scheduled',
      sourcePrompt: 'Verify active SSO certificates and synchronize tenant identity caches.',
      troubleshootingSummary:
        'Checked 14 enterprise SAML configurations against Customer Login Failure & SSO Incident Playbook; refreshed 2 expiring tokens cleanly.',
      durationMs: 1420,
      steps: [
        'Scan enterprise SAML metadata endpoints',
        'Validate X.509 certificate expiration dates',
        'Refresh OAuth session cache',
        'Publish compliance confirmation to IT Ops',
      ],
      ragSources: ['Customer Login Failure & SSO Incident Playbook (2025-2026)'],
      dueDate: '2026-11-28',
    },
    {
      id: wf2Id,
      code: 'FLW-102',
      title: 'Q4 Enterprise Invoice Variance Approval',
      description:
        'Detects PO variance exceeding 2% on vendor invoice #INV-8821 and routes to Finance Controller for authorization.',
      category: 'Billing & Finance',
      status: 'awaiting_approval',
      priority: 'high',
      recommendedTeam: 'Billing & Finance Ops',
      triggerType: 'voice',
      sourcePrompt:
        'Review invoice INV-8821 for variance against our reconciliation SOP and route for controller approval.',
      troubleshootingSummary:
        'Per Invoice Reconciliation SOP, variance of 4.2% ($640) exceeds the 2% auto-reconcile threshold and requires Finance Controller sign-off.',
      durationMs: 2850,
      steps: [
        'Extract invoice line items and PO reference',
        'Compare against Invoice Reconciliation SOP threshold (2%)',
        'Queue Finance Controller approval request',
        'Release ERP payment upon approval',
      ],
      ragSources: ['Automated Invoice Reconciliation & Billing Discrepancy SOP'],
      dueDate: '2026-11-27',
    },
    {
      id: wf3Id,
      code: 'FLW-103',
      title: 'Tier 2 Customer MFA Lockout Triage',
      description:
        'Investigated enterprise login lockout for Acme Logistics, checked INC-2026-0389 playbook, and queued ticket assignment.',
      category: 'Customer Support',
      status: 'in_progress',
      priority: 'critical',
      recommendedTeam: 'Identity & Auth Engineering',
      triggerType: 'voice',
      sourcePrompt:
        'Investigate Acme Logistics login lockout, reference past incidents, and coordinate with Identity Engineering.',
      troubleshootingSummary:
        'Matches INC-2026-0389 (Redis rate-limit lock after mobile token refresh). Recommended reset-auth-lockout and magic login link.',
      durationMs: 1940,
      steps: [
        'Query Knowledge Base for login lockout post-mortems',
        'Draft troubleshooting summary citing INC-2026-0389',
        'Create Zendesk P1 ticket',
        'Assign to Identity & Auth Engineering',
      ],
      ragSources: [
        'Customer Login Failure & SSO Incident Playbook (2025-2026)',
        'Enterprise Support Escalation Matrix & SLA Guidelines',
      ],
      dueDate: '2026-11-26',
    },
    {
      id: wf4Id,
      code: 'FLW-104',
      title: 'New Hire IT & Workspace Provisioning',
      description:
        'Coordinates Google Workspace identity, Slack channels, and orientation calendar invite for incoming Senior SRE.',
      category: 'HR Management',
      status: 'completed',
      priority: 'medium',
      recommendedTeam: 'IT Operations',
      triggerType: 'manual',
      sourcePrompt: 'Provision new hire accounts following HR onboarding checklist.',
      troubleshootingSummary:
        'Followed Employee Onboarding IT Provisioning Checklist with zero policy exceptions.',
      durationMs: 3120,
      steps: [
        'Verify HRIS offer confirmation',
        'Provision Workspace SSO & Slack groups',
        'Book IT security orientation on Calendar',
      ],
      ragSources: ['Employee Onboarding IT Provisioning Checklist'],
      dueDate: '2026-11-25',
    },
    {
      id: wf5Id,
      code: 'FLW-105',
      title: 'CRM Pipeline Renewal Risk Alert',
      description:
        'Webhook sync failed on outdated CRM endpoint; flagged for integration verification and retry.',
      category: 'Sales Ops',
      status: 'failed',
      priority: 'medium',
      recommendedTeam: 'Revenue Operations',
      triggerType: 'webhook',
      sourcePrompt: 'Sync Q4 enterprise renewal accounts from CRM and alert account executives.',
      troubleshootingSummary:
        'Simulated CRM webhook returned timeout during renewal batch fetch. Requires endpoint check in Integrations.',
      durationMs: 4180,
      steps: [
        'Fetch accounts renewing within 30 days',
        'Score support ticket sentiment',
        'Notify Account Executives via Email',
      ],
      ragSources: [],
      dueDate: '2026-11-29',
    },
  ];

  for (const wf of workflows) {
    batch.set(doc(db, 'workflows', wf.id), {
      ownerId: uid,
      code: wf.code,
      title: wf.title,
      description: wf.description,
      category: wf.category,
      status: wf.status,
      priority: wf.priority,
      recommendedTeam: wf.recommendedTeam,
      triggerType: wf.triggerType,
      sourcePrompt: wf.sourcePrompt,
      troubleshootingSummary: wf.troubleshootingSummary,
      durationMs: wf.durationMs,
      steps: wf.steps,
      ragSources: wf.ragSources,
      dueDate: wf.dueDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // --- 3. Seed Tasks ---
  const tasks = [
    {
      id: `tsk-${uidPrefix}-01`,
      workflowId: wf3Id,
      code: 'TSK-201',
      title: 'Inspect Redis AUTH_RATE_LIMIT_LOCK for Acme Logistics',
      description:
        'Check auth audit stream for repeated mobile refresh failures matching INC-2026-0389.',
      assignee: 'Marcus Vance',
      department: 'Identity & Auth Engineering',
      priority: 'critical',
      status: 'in_progress',
      dueDate: '2026-11-26',
      dependencies: [],
      comments: ['Verified 5 failed refresh tokens in last 10 minutes. Preparing lockout reset.'],
      integrationAction: 'Internal Auth API [SIMULATED]',
      requiresApproval: false,
    },
    {
      id: `tsk-${uidPrefix}-02`,
      workflowId: wf3Id,
      code: 'TSK-202',
      title: 'Issue P1 Zendesk ticket & notify customer success lead',
      description:
        'Log incident ticket referencing INC-2026-0389 and send status update once lockout clears.',
      assignee: 'Elena Rostova',
      department: 'Customer Support',
      priority: 'high',
      status: 'todo',
      dueDate: '2026-11-26',
      dependencies: ['TSK-201'],
      comments: ['Draft ticket ready for engineering assignment.'],
      integrationAction: 'Zendesk Support Desk [SIMULATED]',
      requiresApproval: true,
    },
    {
      id: `tsk-${uidPrefix}-03`,
      workflowId: wf2Id,
      code: 'TSK-203',
      title: 'Review 4.2% vendor invoice variance on INV-8821',
      description:
        'Compare vendor line items with approved Q4 Purchase Order and authorize or reject adjustment.',
      assignee: 'Maya Patel',
      department: 'Billing & Finance',
      priority: 'high',
      status: 'blocked',
      dueDate: '2026-11-27',
      dependencies: [],
      comments: ['Waiting on human approval decision in Approvals Center.'],
      integrationAction: 'Email Notification [SIMULATED]',
      requiresApproval: true,
    },
    {
      id: `tsk-${uidPrefix}-04`,
      workflowId: wf1Id,
      code: 'TSK-204',
      title: 'Rotate expiring SAML SP metadata cache',
      description: 'Completed scheduled validation and refreshed tenant session cache.',
      assignee: 'Devon Brooks',
      department: 'IT Operations',
      priority: 'medium',
      status: 'completed',
      dueDate: '2026-11-25',
      dependencies: [],
      comments: ['All 14 tenants validated cleanly.'],
      integrationAction: 'Internal REST API [SIMULATED]',
      requiresApproval: false,
    },
    {
      id: `tsk-${uidPrefix}-05`,
      workflowId: wf5Id,
      code: 'TSK-205',
      title: 'Retry CRM renewal sync webhook after timeout',
      description:
        'Inspect simulated CRM connector settings and re-run renewal risk report for Sales Ops.',
      assignee: 'Chloe Lin',
      department: 'Sales Ops',
      priority: 'medium',
      status: 'backlog',
      dueDate: '2026-11-29',
      dependencies: [],
      comments: [],
      integrationAction: 'Salesforce CRM [SIMULATED]',
      requiresApproval: false,
    },
  ];

  for (const t of tasks) {
    batch.set(doc(db, 'tasks', t.id), {
      ownerId: uid,
      workflowId: t.workflowId,
      code: t.code,
      title: t.title,
      description: t.description,
      assignee: t.assignee,
      department: t.department,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate,
      dependencies: t.dependencies,
      comments: t.comments,
      integrationAction: t.integrationAction,
      requiresApproval: t.requiresApproval,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // --- 4. Seed Pending Approval ---
  batch.set(doc(db, 'approvals', `apr-${uidPrefix}-01`), {
    ownerId: uid,
    workflowId: wf2Id,
    workflowTitle: 'Q4 Enterprise Invoice Variance Approval',
    actionType: 'Approve Vendor Variance Payment',
    integrationTarget: 'Billing ERP & Email [SIMULATED]',
    isSimulated: true,
    riskLevel: 'high',
    reason:
      'Invoice INV-8821 exceeds the 2% auto-reconciliation limit defined in Invoice Reconciliation SOP (4.2% / $640 variance).',
    proposedPayload:
      'Invoice: INV-8821 | Vendor: CloudScale Hosting | Variance: +$640.00 (4.2%) | Action: Approve & notify Accounts Payable via simulated email',
    requestedBy: displayName,
    status: 'pending',
    reviewerNote: '',
    reviewedBy: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // --- 5. Seed Enterprise Integrations (Explicitly Labeled Simulated) ---
  const integrations = [
    {
      id: `int-${uidPrefix}-ticketing`,
      key: 'zendesk_ticketing',
      name: 'Ticket Management',
      category: 'ticketing',
      provider: 'Zendesk / Jira Service Desk',
      status: 'connected_simulated',
      isSimulated: true,
      endpointUrl: 'https://simulated.flowstate.internal/v1/tickets',
      description:
        'Creates structured support tickets, attaches RAG troubleshooting notes, and assigns engineering queues.',
      lastSyncAt: new Date().toISOString(),
      executionsCount: 14,
    },
    {
      id: `int-${uidPrefix}-email`,
      key: 'enterprise_email',
      name: 'Enterprise Email',
      category: 'email',
      provider: 'SMTP / Workspace Mail',
      status: 'connected_simulated',
      isSimulated: true,
      endpointUrl: 'https://simulated.flowstate.internal/v1/mail',
      description:
        'Sends workflow completion notifications, escalation alerts, and customer updates.',
      lastSyncAt: new Date().toISOString(),
      executionsCount: 22,
    },
    {
      id: `int-${uidPrefix}-crm`,
      key: 'salesforce_crm',
      name: 'CRM Platform',
      category: 'crm',
      provider: 'Salesforce / HubSpot',
      status: 'connected_simulated',
      isSimulated: true,
      endpointUrl: 'https://simulated.flowstate.internal/v1/crm',
      description:
        'Retrieves enterprise account tiers, renewal dates, and logs customer support escalations.',
      lastSyncAt: new Date().toISOString(),
      executionsCount: 9,
    },
    {
      id: `int-${uidPrefix}-pm`,
      key: 'project_mgmt',
      name: 'Project Management',
      category: 'project_management',
      provider: 'Linear / Asana',
      status: 'connected_simulated',
      isSimulated: true,
      endpointUrl: 'https://simulated.flowstate.internal/v1/projects',
      description:
        'Synchronizes workflow subtasks, priorities, owners, and sprint milestones.',
      lastSyncAt: new Date().toISOString(),
      executionsCount: 11,
    },
    {
      id: `int-${uidPrefix}-calendar`,
      key: 'enterprise_calendar',
      name: 'Calendar & Scheduling',
      category: 'calendar',
      provider: 'Google Calendar / Outlook',
      status: 'connected_simulated',
      isSimulated: true,
      endpointUrl: 'https://simulated.flowstate.internal/v1/calendar',
      description:
        'Books incident review bridges, onboarding orientations, and SLA follow-up reminders.',
      lastSyncAt: new Date().toISOString(),
      executionsCount: 6,
    },
    {
      id: `int-${uidPrefix}-rest`,
      key: 'internal_rest_api',
      name: 'Internal REST APIs',
      category: 'rest_api',
      provider: 'Custom Enterprise Webhooks',
      status: 'connected_simulated',
      isSimulated: true,
      endpointUrl: 'https://simulated.flowstate.internal/v1/hooks',
      description:
        'Triggers internal runbook webhooks such as Redis auth lockout resets and session cache invalidation.',
      lastSyncAt: new Date().toISOString(),
      executionsCount: 18,
    },
  ];

  for (const item of integrations) {
    batch.set(doc(db, 'integrations', item.id), {
      ownerId: uid,
      key: item.key,
      name: item.name,
      category: item.category,
      provider: item.provider,
      status: item.status,
      isSimulated: item.isSimulated,
      endpointUrl: item.endpointUrl,
      description: item.description,
      lastSyncAt: item.lastSyncAt,
      executionsCount: item.executionsCount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // --- 6. Seed Immutable Audit Logs ---
  const logs = [
    {
      id: `log-${uidPrefix}-01`,
      workflowId: wf1Id,
      workflowTitle: 'Enterprise SSO Token Refresh & Sync',
      eventType: 'workflow_completed',
      actor: 'FLOWSTATE Scheduler',
      summary: '[SIMULATED] Validated 14 enterprise SAML certificates and refreshed 2 tokens.',
      status: 'success',
      isSimulated: true,
      durationMs: 1420,
    },
    {
      id: `log-${uidPrefix}-02`,
      workflowId: wf2Id,
      workflowTitle: 'Q4 Enterprise Invoice Variance Approval',
      eventType: 'approval_requested',
      actor: displayName,
      summary: 'Paused execution pending Finance Controller sign-off on $640 variance.',
      status: 'pending',
      isSimulated: true,
      durationMs: 680,
    },
    {
      id: `log-${uidPrefix}-03`,
      workflowId: wf3Id,
      workflowTitle: 'Tier 2 Customer MFA Lockout Triage',
      eventType: 'rag_retrieval',
      actor: 'FLOWSTATE AI Engine',
      summary:
        'Retrieved INC-2026-0389 from Customer Login Failure & SSO Incident Playbook (94% relevance).',
      status: 'success',
      isSimulated: false,
      durationMs: 510,
    },
    {
      id: `log-${uidPrefix}-04`,
      workflowId: wf5Id,
      workflowTitle: 'CRM Pipeline Renewal Risk Alert',
      eventType: 'integration_error',
      actor: 'CRM Connector',
      summary: '[SIMULATED] CRM webhook timed out after 4180ms; workflow marked Failed.',
      status: 'failed',
      isSimulated: true,
      durationMs: 4180,
    },
  ];

  for (const l of logs) {
    batch.set(doc(db, 'auditLogs', l.id), {
      ownerId: uid,
      workflowId: l.workflowId,
      workflowTitle: l.workflowTitle,
      eventType: l.eventType,
      actor: l.actor,
      summary: l.summary,
      status: l.status,
      isSimulated: l.isSimulated,
      durationMs: l.durationMs,
      createdAt: serverTimestamp(),
    });
  }

  // --- 7. Seed Team Members ---
  const team = [
    {
      id: `tm-${uidPrefix}-01`,
      name: displayName,
      role: isBootstrappedAdmin ? 'Admin' : 'Operator',
      department: 'Enterprise Operations',
      status: 'active',
    },
    {
      id: `tm-${uidPrefix}-02`,
      name: 'Marcus Vance',
      role: 'Approver',
      department: 'Identity & Auth Engineering',
      status: 'active',
    },
    {
      id: `tm-${uidPrefix}-03`,
      name: 'Elena Rostova',
      role: 'Operator',
      department: 'Customer Support',
      status: 'active',
    },
    {
      id: `tm-${uidPrefix}-04`,
      name: 'Maya Patel',
      role: 'Approver',
      department: 'Billing & Finance',
      status: 'active',
    },
    {
      id: `tm-${uidPrefix}-05`,
      name: 'Devon Brooks',
      role: 'Operator',
      department: 'IT Operations',
      status: 'active',
    },
  ];

  for (const m of team) {
    batch.set(doc(db, 'teamMembers', m.id), {
      ownerId: uid,
      name: m.name,
      role: m.role,
      department: m.department,
      status: m.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'workspace-seed-batch');
  }
}
