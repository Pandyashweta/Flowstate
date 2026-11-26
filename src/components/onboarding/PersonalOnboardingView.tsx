import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Briefcase,
  Check,
  CheckCircle2,
  FileText,
  Globe,
  Headphones,
  Laptop,
  Mic,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  Wand2,
} from 'lucide-react';
import {
  loadPersonalOnboarding,
  savePersonalOnboarding,
} from '../../lib/workspaceStore';
import { PersonalOnboardingData } from '../../types';

interface PersonalOnboardingViewProps {
  initialName?: string;
  onComplete: (data: PersonalOnboardingData) => void;
  onSkipToDashboard?: () => void;
  uid: string;
}

const AUTOMATION_GOAL_OPTIONS = [
  { id: 'task_management', label: 'Task Management & Follow-ups' },
  { id: 'customer_support', label: 'Customer Support & Escalations' },
  { id: 'incident_management', label: 'Incident Management & Triage' },
  { id: 'doc_processing', label: 'Document & SOP Processing' },
  { id: 'research', label: 'Operational Research & Summaries' },
  { id: 'reporting', label: 'Executive Reporting & Metrics' },
  { id: 'coordination', label: 'Cross-Team Project Coordination' },
  { id: 'repetitive_tasks', label: 'Repetitive Task Automation' },
  { id: 'custom_workflows', label: 'Custom Agentic Workflows' },
];

const TOOL_OPTIONS = [
  'Gmail / Outlook Email',
  'Zendesk / Freshdesk',
  'Jira / Linear / Asana',
  'Salesforce / HubSpot CRM',
  'PostgreSQL / BigQuery / Snowflake',
  'Slack / Teams',
  'Notion / Confluence Docs',
  'Stripe / NetSuite Finance',
];

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'ja-JP', label: '日本語' },
];

const STEPS = [
  { number: 1, title: 'Personal Info', desc: 'Identity & background' },
  { number: 2, title: 'Work Profile', desc: 'Role & responsibilities' },
  { number: 3, title: 'Automation Goals', desc: 'Target workflows' },
  { number: 4, title: 'Existing Tools', desc: 'Connected ecosystem' },
  { number: 5, title: 'Voice & AI Mode', desc: 'Interaction preferences' },
  { number: 6, title: 'Review & Launch', desc: 'Finalize workspace' },
];

export const PersonalOnboardingView: React.FC<PersonalOnboardingViewProps> = ({
  initialName = '',
  onComplete,
  onSkipToDashboard,
  uid,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<PersonalOnboardingData>({
    fullName: initialName,
    jobTitle: '',
    professionalBackground: '',
    profession: '',
    responsibilities: '',
    typeOfWork: 'Operations & Project Management',
    mainActivities: '',
    automationGoals: [],
    existingTools: [],
    interactionPreference: 'both',
    languagePreference: 'en-US',
    notificationPreferences: {
      emailApprovals: true,
      emailFailures: true,
      browserPush: false,
    },
  });

  // Load saved draft progress on mount
  useEffect(() => {
    const saved = loadPersonalOnboarding(uid);
    if (saved) {
      setData((prev) => ({ ...prev, ...saved }));
    }
  }, [uid]);

  // Auto-save on every change
  const updateField = <K extends keyof PersonalOnboardingData>(
    key: K,
    val: PersonalOnboardingData[K]
  ) => {
    setData((prev) => {
      const next = { ...prev, [key]: val };
      savePersonalOnboarding(uid, next);
      return next;
    });
  };

  const toggleArrayItem = (key: 'automationGoals' | 'existingTools', item: string) => {
    const current = data[key] as string[];
    const next = current.includes(item)
      ? current.filter((x) => x !== item)
      : [...current, item];
    updateField(key, next as any);
  };

  const handleNext = () => {
    savePersonalOnboarding(uid, data);
    if (currentStep < 6) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] flex flex-col justify-center items-center p-4 sm:p-6 transition-colors">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-3xl overflow-hidden shadow-xl">
        {/* Left Stepper Column (Houdiny AI Aesthetic) */}
        <div className="lg:col-span-4 p-6 sm:p-8 bg-[#FAFAFA] dark:bg-[#161616] border-r border-[#E5E5E5] dark:border-[#262626] flex flex-col justify-between">
          <div>
            {/* Header Brand */}
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/icons/favicon_io/android-chrome-192x192.png"
                alt="FLOWSTATE"
                className="w-10 h-10 rounded-lg object-cover"
              />
              <span className="font-display font-bold text-lg text-[#111111] dark:text-white">
                FLOWSTATE
              </span>
            </div>

            <div className="mb-6">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#111111] dark:text-white font-semibold">
                Personal Workspace Setup
              </span>
              <h2 className="font-display text-xl font-bold text-[#111111] dark:text-white mt-1">
                Customize your AI assistant
              </h2>
            </div>

            {/* Stepper */}
            <div className="space-y-4">
              {STEPS.map((s) => {
                const isCurrent = currentStep === s.number;
                const isPassed = currentStep > s.number;
                return (
                  <div
                    key={s.number}
                    className="flex items-start gap-3 select-none"
                  >
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
                      <div className="text-[11px] text-[#737373] mt-0.5">
                        {s.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer note */}
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
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    Tell us about yourself
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    Your personal information shapes how your AI assistant speaks and addresses you.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={data.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      placeholder="Alex Chen"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={data.jobTitle}
                      onChange={(e) => updateField('jobTitle', e.target.value)}
                      placeholder="Senior Operations Lead"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                    Professional Background (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={data.professionalBackground}
                    onChange={(e) => updateField('professionalBackground', e.target.value)}
                    placeholder="Briefly describe your experience (e.g. 8 years leading tech ops, customer support, and system integrations)..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Work Profile */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    What does your workday look like?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    FLOWSTATE uses this context to automatically prioritize tasks and determine who should handle them.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Profession / Domain
                    </label>
                    <input
                      type="text"
                      value={data.profession}
                      onChange={(e) => updateField('profession', e.target.value)}
                      placeholder="e.g. Technical Support & Operations"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Type of Work
                    </label>
                    <select
                      value={data.typeOfWork}
                      onChange={(e) => updateField('typeOfWork', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                    >
                      <option>Operations & Incident Management</option>
                      <option>Customer Support & Escalations</option>
                      <option>IT Systems & Infrastructure</option>
                      <option>Finance & Invoicing</option>
                      <option>Software Engineering</option>
                      <option>Executive Leadership</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                    Core Responsibilities & Activities
                  </label>
                  <textarea
                    rows={3}
                    value={data.responsibilities}
                    onChange={(e) => updateField('responsibilities', e.target.value)}
                    placeholder="List main activities (e.g. triage customer login issues, verify supplier bills, coordinate team tasks)..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Automation Goals */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    What would you like to automate?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    Select the key workflows you want your voice assistant to execute.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {AUTOMATION_GOAL_OPTIONS.map((g) => {
                    const active = data.automationGoals.includes(g.id);
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => toggleArrayItem('automationGoals', g.id)}
                        className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          active
                            ? 'border-[#111111] dark:border-white bg-[#F5F5F5] dark:bg-[#1F1F1F] text-[#111111] dark:text-white'
                            : 'border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#404040] dark:text-[#D4D4D4] hover:border-[#A3A3A3] dark:hover:border-[#525252]'
                        }`}
                      >
                        <span>{g.label}</span>
                        {active && <Check className="w-4 h-4 text-[#111111] dark:text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Existing Tools */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    What tools do you currently use?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    FLOWSTATE can simulate or link integration endpoints for these categories.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {TOOL_OPTIONS.map((tool) => {
                    const active = data.existingTools.includes(tool);
                    return (
                      <button
                        type="button"
                        key={tool}
                        onClick={() => toggleArrayItem('existingTools', tool)}
                        className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          active
                            ? 'border-[#111111] dark:border-white bg-[#F5F5F5] dark:bg-[#1F1F1F] text-[#111111] dark:text-white'
                            : 'border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#404040] dark:text-[#D4D4D4] hover:border-[#A3A3A3] dark:hover:border-[#525252]'
                        }`}
                      >
                        <span>{tool}</span>
                        {active && <Check className="w-4 h-4 text-[#111111] dark:text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Interaction Preferences */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    Interaction & Voice Preferences
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    Configure real-time voice, language, and notification alerts.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-2">
                    Primary Interaction Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'voice', label: 'Voice Only', icon: Mic },
                      { id: 'text', label: 'Text Only', icon: FileText },
                      { id: 'both', label: 'Voice & Text', icon: Sparkles },
                    ].map((m) => {
                      const active = data.interactionPreference === m.id;
                      const Icon = m.icon;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => updateField('interactionPreference', m.id as any)}
                          className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                            active
                              ? 'border-[#111111] dark:border-white bg-[#F5F5F5] dark:bg-[#1F1F1F] text-[#111111] dark:text-white'
                              : 'border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#404040] dark:text-[#D4D4D4]'
                          }`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1.5" />
                          <div className="text-xs font-semibold">{m.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                    Voice & Speech Recognition Language
                  </label>
                  <select
                    value={data.languagePreference}
                    onChange={(e) => updateField('languagePreference', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4]">
                    Governance Notifications
                  </span>
                  <label className="flex items-center gap-2.5 text-xs text-[#404040] dark:text-[#D4D4D4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.notificationPreferences.emailApprovals}
                      onChange={(e) =>
                        updateField('notificationPreferences', {
                          ...data.notificationPreferences,
                          emailApprovals: e.target.checked,
                        })
                      }
                      className="rounded text-[#111111] dark:text-white"
                    />
                    <span>Notify me via email when an action requires human approval</span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 6: Review & Finish */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111111] dark:text-white">
                    Review and launch your workspace
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                    Everything looks ready. You can adjust these settings anytime from the Settings pane.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616]/60 border border-[#E5E5E5] dark:border-[#262626] space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
                    <span className="text-[#737373]">Name & Role:</span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {data.fullName || 'User'} ({data.jobTitle})
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
                    <span className="text-[#737373]">Domain / Type:</span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {data.typeOfWork}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
                    <span className="text-[#737373]">Active Automation Goals:</span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {data.automationGoals.length} goals selected
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
                    <span className="text-[#737373]">Interaction Mode:</span>
                    <span className="font-semibold text-[#111111] dark:text-white capitalize">
                      {data.interactionPreference} ({data.languagePreference})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-xs text-[#404040] dark:text-[#D4D4D4] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#111111] dark:text-white shrink-0" />
                  <span>
                    Pre-loaded with sample incident playbooks and voice models for instant testing.
                  </span>
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
              <span>{currentStep === 6 ? 'Launch Personal Workspace' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
