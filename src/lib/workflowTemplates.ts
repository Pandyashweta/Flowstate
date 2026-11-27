import { PriorityLevel, ProposedWorkflowDraft } from '../types';

export interface WorkflowTemplate {
  id: string;
  name: string;
  summary: string;
  category: string;
  priority: PriorityLevel;
  recommendedTeam: string;
  estimatedSetup: string;
  requiresApprovalByDefault: boolean;
  steps: string[];
  tasks: {
    title: string;
    description: string;
    assignee: string;
    department: string;
    priority: PriorityLevel;
    dueDaysOffset: number;
    integrationAction: string;
    requiresApproval: boolean;
  }[];
  approvalRequest?: {
    actionType: string;
    integrationTarget: string;
    riskLevel: 'low' | 'medium' | 'high';
    reason: string;
    proposedPayload: string;
  };
  troubleshootingSummary: string;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tpl-expense-approval',
    name: 'Expense Approval',
    summary:
      'Validate submitted receipts against travel and spend policy, route over-threshold items for Finance sign-off, and queue reimbursement.',
    category: 'Billing & Finance',
    priority: 'medium',
    recommendedTeam: 'Finance & Accounting',
    estimatedSetup: '4 steps · ~2 min',
    requiresApprovalByDefault: true,
    steps: [
      'Verify itemized receipt, vendor name, currency, and cost center code.',
      'Check total amount against departmental spend policy and quarterly budget thresholds.',
      'Route expenses above policy limit to Finance Manager for explicit approval.',
      'Dispatch approved reimbursement batch to ERP payroll and archive audit receipt.',
    ],
    tasks: [
      {
        title: 'Audit receipt documentation & cost center',
        description: 'Confirm itemized invoice matches corporate card or out-of-pocket submission.',
        assignee: 'Finance Analyst',
        department: 'Billing & Finance',
        priority: 'medium',
        dueDaysOffset: 1,
        integrationAction: 'Verify expense ledger entry',
        requiresApproval: false,
      },
      {
        title: 'Authorize reimbursement payout',
        description: 'Approve final spend authorization before triggering ERP disbursement.',
        assignee: 'Finance Manager',
        department: 'Billing & Finance',
        priority: 'high',
        dueDaysOffset: 2,
        integrationAction: 'Trigger ERP reimbursement API',
        requiresApproval: true,
      },
    ],
    approvalRequest: {
      actionType: 'finance_expense_payout',
      integrationTarget: 'ERP Billing Ledger',
      riskLevel: 'medium',
      reason: 'External financial disbursement requires Manager or Finance Owner sign-off.',
      proposedPayload: JSON.stringify(
        {
          template: 'Expense Approval',
          policyCheck: 'Corporate Travel & Spend Policy',
          action: 'authorize_reimbursement',
        },
        null,
        2
      ),
    },
    troubleshootingSummary:
      'Standardized expense governance flow ensuring receipts, budget codes, and manager sign-off are logged before payout.',
  },
  {
    id: 'tpl-onboarding-sequence',
    name: 'Onboarding Sequence',
    summary:
      'Coordinate day-one SSO provisioning, hardware dispatch, security policy acknowledgement, and 30-day team ramp tasks for new hires.',
    category: 'HR & Onboarding',
    priority: 'high',
    recommendedTeam: 'People Ops & IT',
    estimatedSetup: '5 steps · ~3 min',
    requiresApprovalByDefault: true,
    steps: [
      'Create workspace identity, corporate email, and role-scoped SSO group memberships.',
      'Order and ship pre-configured workstation hardware with MDM enrollment enabled.',
      'Assign mandatory security awareness and acceptable-use runbook acknowledgements.',
      'Schedule department orientation, buddy pairing, and 30-60-90 day kickoff milestones.',
      'Verify day-one access readiness with Hiring Manager sign-off.',
    ],
    tasks: [
      {
        title: 'Provision SSO, email & workspace access',
        description: 'Create least-privilege account groups aligned to the hire’s department and role.',
        assignee: 'IT Administrator',
        department: 'IT Operations',
        priority: 'high',
        dueDaysOffset: 2,
        integrationAction: 'Provision identity provider user',
        requiresApproval: true,
      },
      {
        title: 'Ship laptop & verify MDM enrollment',
        description: 'Confirm shipping carrier tracking and pre-enrollment into device management.',
        assignee: 'Workplace Ops',
        department: 'HR & Onboarding',
        priority: 'medium',
        dueDaysOffset: 3,
        integrationAction: 'Update hardware asset register',
        requiresApproval: false,
      },
      {
        title: 'Schedule week-one orientation & role checklist',
        description: 'Send calendar invites for security briefing, team welcome, and manager check-in.',
        assignee: 'People Partner',
        department: 'HR & Onboarding',
        priority: 'medium',
        dueDaysOffset: 4,
        integrationAction: 'Create onboarding calendar series',
        requiresApproval: false,
      },
    ],
    approvalRequest: {
      actionType: 'identity_provisioning',
      integrationTarget: 'Corporate SSO & Directory',
      riskLevel: 'medium',
      reason: 'Creating new corporate directory accounts and role permissions requires Admin confirmation.',
      proposedPayload: JSON.stringify(
        {
          template: 'Onboarding Sequence',
          provisioningScope: ['SSO', 'Email', 'Workspace Role'],
          mdmRequired: true,
        },
        null,
        2
      ),
    },
    troubleshootingSummary:
      'Cross-functional HR and IT onboarding checklist eliminating day-one access delays and unverified permissions.',
  },
  {
    id: 'tpl-incident-escalation',
    name: 'P1 Incident Escalation',
    summary:
      'Triage production severity-one alerts, page on-call responders, gate public status advisories, and generate post-mortem actions.',
    category: 'IT Operations',
    priority: 'critical',
    recommendedTeam: 'Site Reliability & IT Ops',
    estimatedSetup: '5 steps · ~2 min',
    requiresApprovalByDefault: true,
    steps: [
      'Capture alert telemetry, affected customer regions, and blast radius assessment.',
      'Page primary and secondary on-call leads and open dedicated incident bridge.',
      'Draft customer-facing status page advisory and route to Incident Commander for approval.',
      'Execute mitigation playbook and monitor recovery metrics for 30 minutes.',
      'Archive incident timeline and open blameless post-mortem follow-up tasks.',
    ],
    tasks: [
      {
        title: 'Acknowledge alert & assign Incident Commander',
        description: 'Confirm severity classification and establish communication cadence.',
        assignee: 'On-Call SRE',
        department: 'IT Operations',
        priority: 'critical',
        dueDaysOffset: 0,
        integrationAction: 'Trigger incident paging bridge',
        requiresApproval: false,
      },
      {
        title: 'Approve & publish customer status advisory',
        description: 'Review external communication text before posting to public status page.',
        assignee: 'Engineering Manager',
        department: 'IT Operations',
        priority: 'critical',
        dueDaysOffset: 0,
        integrationAction: 'Publish status page update',
        requiresApproval: true,
      },
    ],
    approvalRequest: {
      actionType: 'public_status_advisory',
      integrationTarget: 'External Status Page',
      riskLevel: 'high',
      reason: 'External customer outage notifications require Incident Commander or Admin authorization.',
      proposedPayload: JSON.stringify(
        {
          template: 'P1 Incident Escalation',
          severity: 'SEV-1',
          channel: 'Public Status Page & Enterprise Notifier',
        },
        null,
        2
      ),
    },
    troubleshootingSummary:
      'Structured SEV-1 response playbook combining rapid internal triage with gated external status communication.',
  },
  {
    id: 'tpl-vendor-security-review',
    name: 'Vendor Security & Legal Review',
    summary:
      'Evaluate new SaaS vendors for SOC2 compliance, DPA terms, and data residency before granting procurement approval.',
    category: 'Legal & Compliance',
    priority: 'high',
    recommendedTeam: 'Security & Legal',
    estimatedSetup: '4 steps · ~3 min',
    requiresApprovalByDefault: true,
    steps: [
      'Collect vendor SOC2 Type II report, penetration test summary, and sub-processor list.',
      'Verify Data Processing Agreement (DPA) and regional data residency clauses.',
      'Route risk assessment memo to Legal and Security leads for approval sign-off.',
      'Activate vendor record in procurement portal and schedule annual reassessment.',
    ],
    tasks: [
      {
        title: 'Review SOC2 Type II & security questionnaire',
        description: 'Document encryption standards, SSO support, and audit logging capabilities.',
        assignee: 'Security Reviewer',
        department: 'Legal & Compliance',
        priority: 'high',
        dueDaysOffset: 3,
        integrationAction: 'Log vendor security assessment',
        requiresApproval: false,
      },
      {
        title: 'Approve MSA & Data Processing Agreement',
        description: 'Confirm liability caps, breach notification SLAs, and data deletion rights.',
        assignee: 'Legal Counsel',
        department: 'Legal & Compliance',
        priority: 'high',
        dueDaysOffset: 5,
        integrationAction: 'Approve procurement contract gate',
        requiresApproval: true,
      },
    ],
    approvalRequest: {
      actionType: 'vendor_contract_approval',
      integrationTarget: 'Procurement & Legal Register',
      riskLevel: 'high',
      reason: 'Authorizing third-party data processors requires Legal and Security sign-off.',
      proposedPayload: JSON.stringify(
        {
          template: 'Vendor Security & Legal Review',
          requiredDocs: ['SOC2 Type II', 'DPA', 'Sub-processor List'],
          annualReassessment: true,
        },
        null,
        2
      ),
    },
    troubleshootingSummary:
      'End-to-end vendor due diligence sequence protecting customer data and preserving compliance evidence.',
  },
  {
    id: 'tpl-production-release',
    name: 'Production Release Sign-Off',
    summary:
      'Verify CI checks, staging smoke tests, and rollback readiness before authorizing a controlled production deployment.',
    category: 'Engineering',
    priority: 'high',
    recommendedTeam: 'Release Engineering',
    estimatedSetup: '4 steps · ~2 min',
    requiresApprovalByDefault: true,
    steps: [
      'Confirm all automated unit, integration, and security scans passed on release candidate.',
      'Validate staging smoke tests and database migration rollback script.',
      'Pause production deployment in Approvals Queue for Release Manager authorization.',
      'Monitor error budgets post-deploy and record release audit log.',
    ],
    tasks: [
      {
        title: 'Verify staging smoke tests & migration safety',
        description: 'Confirm zero P1 regressions and verified rollback procedure in staging.',
        assignee: 'Release Engineer',
        department: 'Engineering',
        priority: 'high',
        dueDaysOffset: 1,
        integrationAction: 'Query CI/CD release pipeline',
        requiresApproval: false,
      },
      {
        title: 'Authorize production deployment window',
        description: 'Sign off on release cutover and notify support channel.',
        assignee: 'Engineering Lead',
        department: 'Engineering',
        priority: 'high',
        dueDaysOffset: 1,
        integrationAction: 'Trigger production deploy webhook',
        requiresApproval: true,
      },
    ],
    approvalRequest: {
      actionType: 'production_deploy_gate',
      integrationTarget: 'CI/CD Production Pipeline',
      riskLevel: 'high',
      reason: 'Production releases require explicit Release Manager or Owner authorization.',
      proposedPayload: JSON.stringify(
        {
          template: 'Production Release Sign-Off',
          environment: 'production',
          rollbackVerified: true,
        },
        null,
        2
      ),
    },
    troubleshootingSummary:
      'Disciplined change-management workflow ensuring every production push has verified tests and recorded human sign-off.',
  },
  {
    id: 'tpl-customer-escalation',
    name: 'Enterprise Customer Escalation',
    summary:
      'Coordinate high-priority account escalations across Support, Engineering, and Account Management with clear SLA tracking.',
    category: 'Customer Support',
    priority: 'high',
    recommendedTeam: 'Support & Success',
    estimatedSetup: '4 steps · ~2 min',
    requiresApprovalByDefault: false,
    steps: [
      'Retrieve account tier, active SLA obligations, and full ticket reproduction logs.',
      'Assign Engineering triage owner for root-cause investigation.',
      'Draft executive update and remediation timeline for Customer Success review.',
      'Confirm resolution with customer stakeholders and log closure summary.',
    ],
    tasks: [
      {
        title: 'Compile reproduction logs & SLA context',
        description: 'Bundle environment telemetry, request IDs, and customer impact summary.',
        assignee: 'Support Lead',
        department: 'Customer Support',
        priority: 'high',
        dueDaysOffset: 0,
        integrationAction: 'Sync CRM escalation ticket',
        requiresApproval: false,
      },
      {
        title: 'Deliver root-cause fix & customer brief',
        description: 'Validate fix with engineering and communicate timeline to customer.',
        assignee: 'Customer Success Manager',
        department: 'Customer Support',
        priority: 'high',
        dueDaysOffset: 1,
        integrationAction: 'Send executive status email',
        requiresApproval: false,
      },
    ],
    troubleshootingSummary:
      'Fast-track escalation workflow keeping Support, Engineering, and Account leads aligned under strict SLA timelines.',
  },
  {
    id: 'tpl-quarterly-iam-audit',
    name: 'Quarterly Access & IAM Audit',
    summary:
      'Review active workspace roles, flag dormant contractor credentials, gate access revocations, and export compliance bundles.',
    category: 'IT Operations',
    priority: 'medium',
    recommendedTeam: 'Security Operations',
    estimatedSetup: '4 steps · ~3 min',
    requiresApprovalByDefault: true,
    steps: [
      'Export active user roster and role assignments across production systems.',
      'Flag dormant accounts, departing contractors, and excessive admin privileges.',
      'Queue credential revocation batch in Approvals Queue for Owner sign-off.',
      'Download verified CSV and JSON audit logs for compliance archive.',
    ],
    tasks: [
      {
        title: 'Identify stale accounts & privilege drift',
        description: 'Compare active IAM directory against current HR roster and contractor dates.',
        assignee: 'Security Ops',
        department: 'IT Operations',
        priority: 'medium',
        dueDaysOffset: 2,
        integrationAction: 'Run IAM directory audit query',
        requiresApproval: false,
      },
      {
        title: 'Approve stale credential revocation',
        description: 'Authorize disabling dormant accounts and rotating shared service keys.',
        assignee: 'Workspace Owner',
        department: 'IT Operations',
        priority: 'high',
        dueDaysOffset: 3,
        integrationAction: 'Revoke flagged IAM sessions',
        requiresApproval: true,
      },
    ],
    approvalRequest: {
      actionType: 'iam_credential_revocation',
      integrationTarget: 'Identity & Access Directory',
      riskLevel: 'high',
      reason: 'Revoking active credentials or modifying admin roles requires Workspace Owner review.',
      proposedPayload: JSON.stringify(
        {
          template: 'Quarterly Access & IAM Audit',
          scope: 'Dormant & Contractor Accounts',
          exportFormats: ['CSV', 'JSON', 'TXT'],
        },
        null,
        2
      ),
    },
    troubleshootingSummary:
      'Repeatable quarterly access certification template aligned with SOC2 and ISO 27001 review cycles.',
  },
  {
    id: 'tpl-deal-desk-approval',
    name: 'Deal Desk & Contract Approval',
    summary:
      'Validate non-standard enterprise discounts, verify finance margin floors, and route multi-year quotes for executive sign-off.',
    category: 'Sales Ops',
    priority: 'medium',
    recommendedTeam: 'Revenue Operations',
    estimatedSetup: '4 steps · ~2 min',
    requiresApprovalByDefault: true,
    steps: [
      'Review requested seat volume, multi-year ramp schedule, and discount tier.',
      'Verify gross margin floor and billing payment terms with Finance.',
      'Route non-standard redlines or discounts over threshold for Executive approval.',
      'Release finalized order form to CRM and notify account executive.',
    ],
    tasks: [
      {
        title: 'Validate pricing sheet & margin floor',
        description: 'Confirm discount falls within approved enterprise pricing guardrails.',
        assignee: 'Deal Desk Analyst',
        department: 'Sales Ops',
        priority: 'medium',
        dueDaysOffset: 1,
        integrationAction: 'Sync quote metrics to CRM',
        requiresApproval: false,
      },
      {
        title: 'Authorize enterprise quote release',
        description: 'Approve final order form terms prior to sending for e-signature.',
        assignee: 'VP of Sales',
        department: 'Sales Ops',
        priority: 'high',
        dueDaysOffset: 2,
        integrationAction: 'Release CRM order form',
        requiresApproval: true,
      },
    ],
    approvalRequest: {
      actionType: 'deal_desk_quote_approval',
      integrationTarget: 'CRM & Billing Quote Engine',
      riskLevel: 'medium',
      reason: 'Custom commercial discounts and payment terms require Deal Desk or Finance sign-off.',
      proposedPayload: JSON.stringify(
        {
          template: 'Deal Desk & Contract Approval',
          reviewType: 'Enterprise Order Form',
          requiresMarginCheck: true,
        },
        null,
        2
      ),
    },
    troubleshootingSummary:
      'Accelerates complex enterprise deals while keeping discounting and payment terms governed and auditable.',
  },
];

export function buildDraftFromTemplate(
  template: WorkflowTemplate,
  overrides?: {
    title?: string;
    category?: string;
    priority?: PriorityLevel;
    includeApproval?: boolean;
  }
): ProposedWorkflowDraft {
  const now = new Date();
  const formatOffsetDate = (days: number) => {
    const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  };

  const category = overrides?.category?.trim() || template.category;
  const priority = overrides?.priority || template.priority;
  const includeApproval =
    overrides?.includeApproval !== undefined
      ? overrides.includeApproval
      : template.requiresApprovalByDefault;

  return {
    title: overrides?.title?.trim() || template.name,
    description: template.summary,
    category,
    priority,
    recommendedTeam: template.recommendedTeam,
    dueDate: formatOffsetDate(5),
    troubleshootingSummary: template.troubleshootingSummary,
    steps: [...template.steps],
    tasks: template.tasks.map((t) => ({
      title: t.title,
      description: t.description,
      assignee: t.assignee,
      department: category || t.department,
      priority: t.priority,
      dueDate: formatOffsetDate(t.dueDaysOffset),
      dependencies: [],
      integrationAction: t.integrationAction,
      requiresApproval: includeApproval ? t.requiresApproval : false,
    })),
    approvalRequest:
      includeApproval && template.approvalRequest ? { ...template.approvalRequest } : null,
  };
}
