import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Globe,
  Mail,
  Plus,
  Save,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  loadOrgOnboarding,
  saveOrgOnboarding,
} from '../../lib/workspaceStore';
import { OrganizationOnboardingData, WorkspaceRole } from '../../types';

interface OrganizationOnboardingViewProps {
  initialOwnerName?: string;
  onComplete: (data: OrganizationOnboardingData) => void;
  onSkipToDashboard?: () => void;
  uid: string;
}

const DEFAULT_DEPARTMENTS = [
  'Customer Support',
  'IT Operations',
  'Billing & Finance',
  'HR Management',
  'Sales Ops',
  'Engineering',
];

const INDUSTRIES = [
  'Software & SaaS',
  'Financial Services & Fintech',
  'Healthcare & Life Sciences',
  'E-Commerce & Retail',
  'Telecommunications',
  'Professional Services',
  'Manufacturing & Logistics',
];

const SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-250 employees',
  '251-1000 employees',
  '1000+ enterprise',
];

const BUSINESS_PROCESS_OPTIONS = [
  'Customer Authentication & Account Recovery',
  'Vendor Invoicing & Purchase Order Matching',
  'New Hire IT Provisioning & Identity Management',
  'Infrastructure Outage Escalation & Bridge Management',
  'Customer Support Ticket Triage & Routing',
  'Quarterly Compliance & Audit Review',
];

const STEPS = [
  { number: 1, title: 'Organization Profile', desc: 'Company details' },
  { number: 2, title: 'Owner & Leadership', desc: 'Account authority' },
  { number: 3, title: 'Departments & Teams', desc: 'Routing structure' },
  { number: 4, title: 'Automation Processes', desc: 'Target business flows' },
  { number: 5, title: 'Team Invitations', desc: 'Collaborator invites' },
  { number: 6, title: 'Launch Organization', desc: 'Confirm & start' },
];

export const OrganizationOnboardingView: React.FC<OrganizationOnboardingViewProps> = ({
  initialOwnerName = '',
  onComplete,
  onSkipToDashboard,
  uid,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [data, setData] = useState<OrganizationOnboardingData>({
    organizationName: '',
    industry: 'Software & SaaS',
    website: '',
    country: 'United States',
    organizationSize: '11-50 employees',
    ownerName: initialOwnerName || '',
    ownerRole: '',
    departments: [],
    businessProcesses: [
      'Customer Authentication & Account Recovery',
      'Vendor Invoicing & Purchase Order Matching',
      'New Hire IT Provisioning & Identity Management',
    ],
    automationRequirements: ['Voice ticket triage', 'RAG playbook grounding', 'Approval audit trails'],
    existingSoftwareTools: ['Zendesk', 'Jira', 'Slack', 'Google Workspace'],
    teamInvitations: [],
  });

  const [newDeptInput, setNewDeptInput] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('Member');
  const [inviteDept, setInviteDept] = useState('General');

  useEffect(() => {
    const saved = loadOrgOnboarding(uid);
    if (saved) {
      setData((prev) => ({
        ...prev,
        ...saved,
        ownerName: saved.ownerName || initialOwnerName || prev.ownerName,
      }));
    }
  }, [uid, initialOwnerName]);

  useEffect(() => {
    if (data.departments.length > 0) {
      if (!data.departments.includes(inviteDept)) {
        setInviteDept(data.departments[0]);
      }
    } else if (inviteDept !== 'General') {
      setInviteDept('General');
    }
  }, [data.departments, inviteDept]);

  const updateField = <K extends keyof OrganizationOnboardingData>(
    key: K,
    val: OrganizationOnboardingData[K]
  ) => {
    setStepError(null);
    setData((prev) => {
      const next = { ...prev, [key]: val };
      saveOrgOnboarding(uid, next);
      return next;
    });
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDeptInput.trim();
    if (!trimmed || data.departments.includes(trimmed)) return;
    updateField('departments', [...data.departments, trimmed]);
    setNewDeptInput('');
  };

  const handleRemoveDept = (dept: string) => {
    updateField(
      'departments',
      data.departments.filter((d) => d !== dept)
    );
  };

  const handleAddInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = inviteEmail.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) return;
    if (data.teamInvitations.some((inv) => inv.email.toLowerCase() === normalized)) {
      setStepError(`${normalized} is already in your invitation queue.`);
      return;
    }
    setStepError(null);
    updateField('teamInvitations', [
      ...data.teamInvitations,
      {
        email: normalized,
        role: inviteRole,
        department: inviteDept || 'General',
      },
    ]);
    setInviteEmail('');
  };

  const handleRemoveInvite = (idx: number) => {
    updateField(
      'teamInvitations',
      data.teamInvitations.filter((_, i) => i !== idx)
    );
  };

  const toggleProcess = (proc: string) => {
    const next = data.businessProcesses.includes(proc)
      ? data.businessProcesses.filter((p) => p !== proc)
      : [...data.businessProcesses, proc];
    updateField('businessProcesses', next);
  };

  const handleNext = () => {
    if (currentStep === 1 && !data.organizationName.trim()) {
      setStepError('Please enter an organization name to continue.');
      return;
    }
    if (currentStep === 2 && !data.ownerName.trim()) {
      setStepError('Please enter the workspace owner name to continue.');
      return;
    }
    setStepError(null);
    saveOrgOnboarding(uid, data);
    if (currentStep < 6) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete({
        ...data,
        organizationName: data.organizationName.trim(),
        ownerName: data.ownerName.trim() || initialOwnerName || 'Owner',
      });
    }
  };

  const handleBack = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] flex flex-col justify-center items-center p-4 sm:p-6 transition-colors">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-3xl overflow-hidden shadow-xl">
        {/* Left Stepper Column */}
        <div className="lg:col-span-4 p-6 sm:p-8 bg-gradient-to-b from-[#F8FAFD] to-[#EEF2FF] dark:from-[#0F172A] dark:to-[#111827] border-r border-[#E5E5E5] dark:border-[#262626]/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-base text-[#111111] dark:text-white">
                FLOWSTATE
              </span>
            </div>

            <div className="mb-6">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#111111] dark:text-white font-semibold">
                Organization Onboarding
              </span>
              <h2 className="font-display text-xl font-bold text-[#111111] dark:text-white mt-1">
                Configure team workspace
              </h2>
            </div>

            <div className="space-y-4">
              {STEPS.map((s) => {
                const isCurrent = currentStep === s.number;
                const isPassed = currentStep > s.number;
                return (
                  <div key={s.number} className="flex items-start gap-3 select-none">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-sm'
                          : 'bg-[#E5E5E5] dark:bg-[#202020] text-[#737373]'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : s.number}
                    </div>
                    <div>
                      <div
                        className={`text-xs font-semibold ${
                          isCurrent
                            ? 'text-[#111111] dark:text-white'
                            : isPassed
                            ? 'text-[#262626] dark:text-[#E5E5E5]'
                            : 'text-[#737373]'
                        }`}
                      >
                        {s.title}
                      </div>
                      <div className="text-[11px] text-[#737373] mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between text-xs text-[#737373] dark:text-[#737373]">
            <span className="inline-flex items-center gap-1">
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              <span>Draft auto-saved</span>
            </span>
            {onSkipToDashboard && (
              <button
                type="button"
                onClick={onSkipToDashboard}
                className="text-[#737373] hover:text-[#404040] dark:hover:text-[#E5E5E5] underline cursor-pointer"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>

        {/* Right Interactive Form Pane */}
        <div className="lg:col-span-8 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {stepError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                {stepError}
              </div>
            )}
            {/* Step 1: Organization Profile */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    Organization Details
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    Set up your enterprise profile and organizational parameters.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Organization Logo / Image (Optional)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] flex items-center justify-center overflow-hidden shrink-0">
                        {data.logoUrl ? (
                          <img
                            src={data.logoUrl}
                            alt="Organization logo preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-[#737373]" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#1A1A1A] text-xs font-medium text-[#111111] dark:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{data.logoUrl ? 'Change Image' : 'Upload Logo'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 1024 * 1024) {
                                setStepError('Organization logo must be smaller than 1 MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  updateField('logoUrl', reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        {data.logoUrl && (
                          <button
                            type="button"
                            onClick={() => updateField('logoUrl', '')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#737373] hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                        <span className="text-[11px] text-[#737373] w-full">
                          PNG, JPG, SVG or WebP up to 1MB. Displayed in workspace switcher.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={data.organizationName}
                      onChange={(e) => updateField('organizationName', e.target.value)}
                      placeholder="e.g. Acme Corporation"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Industry
                    </label>
                    <select
                      value={data.industry}
                      onChange={(e) => updateField('industry', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Organization Size
                    </label>
                    <select
                      value={data.organizationSize}
                      onChange={(e) => updateField('organizationSize', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                    >
                      {SIZES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Company Website
                    </label>
                    <input
                      type="url"
                      value={data.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://company.com"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      value={data.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      placeholder="United States"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Owner Leadership */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    Workspace Owner & Role
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    Identify the primary administrator responsible for governance and authorization.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Owner Full Name *
                    </label>
                    <input
                      type="text"
                      value={data.ownerName}
                      onChange={(e) => updateField('ownerName', e.target.value)}
                      placeholder="Alex Chen"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Executive / Leadership Title *
                    </label>
                    <input
                      type="text"
                      value={data.ownerRole}
                      onChange={(e) => updateField('ownerRole', e.target.value)}
                      placeholder="e.g. VP of Operations / Head of IT"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Departments */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    Configure Organization Departments
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    Workflows and incident tickets will automatically route to these functional groups.
                  </p>
                </div>

                {/* Add Dept Form */}
                <form onSubmit={handleAddDept} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newDeptInput}
                    onChange={(e) => setNewDeptInput(e.target.value)}
                    placeholder="Add department (e.g. Security Response, Legal, QA)..."
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 pt-2">
                  {data.departments.map((dept) => (
                    <div
                      key={dept}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#161616] text-xs font-medium text-[#262626] dark:text-[#E5E5E5]"
                    >
                      <span>{dept}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDept(dept)}
                        className="text-[#737373] hover:text-red-500 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Business Processes */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    Select Target Business Processes
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    Choose standard operational flows you want automated via voice and Gemini.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {BUSINESS_PROCESS_OPTIONS.map((proc) => {
                    const active = data.businessProcesses.includes(proc);
                    return (
                      <button
                        type="button"
                        key={proc}
                        onClick={() => toggleProcess(proc)}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          active
                            ? 'border-[#111111] dark:border-white bg-[#F5F5F5] dark:bg-[#1F1F1F] text-[#111111] dark:text-white'
                            : 'border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#404040] dark:text-[#D4D4D4]'
                        }`}
                      >
                        <span>{proc}</span>
                        {active && <Check className="w-4 h-4 text-[#111111] dark:text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Team Invitations */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    Invite Team Members (Optional)
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    You can invite collaborators now or complete team onboarding anytime from Settings.
                  </p>
                </div>

                {/* Invite Form */}
                <form onSubmit={handleAddInvite} className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="sm:col-span-5 px-3.5 py-2.5 text-xs rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                    className="sm:col-span-3 px-3.5 py-2.5 text-xs rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Member">Member</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <select
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                    className="sm:col-span-3 px-3.5 py-2.5 text-xs rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                  >
                    {(data.departments.length > 0 ? data.departments : ['General']).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="sm:col-span-1 flex items-center justify-center p-2.5 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                {/* Invitations List */}
                <div className="space-y-2 pt-2">
                  {data.teamInvitations.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-[#D4D4D4] dark:border-[#262626] text-center text-xs text-[#737373]">
                      No invitations queued yet. You can skip this step and invite teammates later.
                    </div>
                  ) : (
                    data.teamInvitations.map((inv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#111111] dark:text-white mr-2">
                            {inv.email}
                          </span>
                          <span className="text-[11px] text-[#111111] dark:text-white bg-[#F5F5F5] dark:bg-[#262626] px-2 py-0.5 rounded">
                            {inv.role}
                          </span>
                          <span className="text-[#737373] ml-2">({inv.department})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveInvite(idx)}
                          className="text-[#737373] hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Review & Launch */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    Review and launch organization workspace
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    Your multi-tenant enterprise workspace is ready to launch.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616]/60 border border-[#E5E5E5] dark:border-[#262626] space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
                    <span className="text-[#737373]">Organization:</span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {data.organizationName} ({data.industry})
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
                    <span className="text-[#737373]">Owner & Role:</span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {data.ownerName || 'Owner'}
                      {data.ownerRole ? ` (${data.ownerRole})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
                    <span className="text-[#737373]">Departments:</span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {data.departments.length} configured
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
                    <span className="text-[#737373]">Team Invites:</span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {data.teamInvitations.length} queued
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Navigation Bar */}
          <div className="mt-8 pt-5 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] text-xs font-semibold text-[#404040] dark:text-[#E5E5E5] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-semibold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
            >
              <span>{currentStep === 6 ? 'Launch Organization Workspace' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
