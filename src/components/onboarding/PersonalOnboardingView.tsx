import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
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
  { id: 'task_management', label: 'Task Management' },
  { id: 'customer_support', label: 'Customer Support' },
  { id: 'incident_management', label: 'Incident Triage' },
  { id: 'doc_processing', label: 'Document & SOPs' },
  { id: 'research', label: 'Research & Summaries' },
  { id: 'reporting', label: 'Reporting & Metrics' },
  { id: 'coordination', label: 'Team Coordination' },
  { id: 'custom_workflows', label: 'Custom Workflows' },
];

const TOTAL_STEPS = 3;

export const PersonalOnboardingView: React.FC<PersonalOnboardingViewProps> = ({
  initialName = '',
  onComplete,
  onSkipToDashboard,
  uid,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [data, setData] = useState<PersonalOnboardingData>({
    fullName: initialName,
    jobTitle: '',
    professionalBackground: '',
    profession: '',
    responsibilities: '',
    typeOfWork: 'Operations & Incident Management',
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

  useEffect(() => {
    const saved = loadPersonalOnboarding(uid);
    if (saved) {
      setData((prev) => ({ ...prev, ...saved }));
    }
  }, [uid]);

  const updateField = <K extends keyof PersonalOnboardingData>(
    key: K,
    val: PersonalOnboardingData[K]
  ) => {
    setStepError(null);
    setData((prev) => {
      const next = { ...prev, [key]: val };
      savePersonalOnboarding(uid, next);
      return next;
    });
  };

  const toggleGoal = (goalId: string) => {
    setStepError(null);
    const current = data.automationGoals;
    const next = current.includes(goalId)
      ? current.filter((x) => x !== goalId)
      : [...current, goalId];
    updateField('automationGoals', next);
  };

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (!data.fullName.trim() || data.fullName.trim().length < 2) {
        return 'Please enter your name.';
      }
      if (!data.jobTitle.trim()) {
        return 'Please enter your role or job title.';
      }
    }
    if (step === 2) {
      if (!data.profession.trim()) {
        return 'Please enter your team or domain.';
      }
      if (!data.responsibilities.trim()) {
        return 'Please add a short note on what you work on.';
      }
    }
    if (step === 3) {
      if (data.automationGoals.length === 0) {
        return 'Pick at least one area to continue.';
      }
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setStepError(err);
      return;
    }

    if (currentStep === TOTAL_STEPS) {
      for (const s of [1, 2, 3]) {
        const checkErr = validateStep(s);
        if (checkErr) {
          setCurrentStep(s);
          setStepError(checkErr);
          return;
        }
      }
      savePersonalOnboarding(uid, data);
      onComplete(data);
      return;
    }

    setStepError(null);
    savePersonalOnboarding(uid, data);
    setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] flex flex-col justify-center items-center px-4 py-10 transition-colors">
      <div className="w-full max-w-lg space-y-6">
        {/* Minimal Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/icons/favicon_io/apple-touch-icon.png"
              alt="FLOWSTATE"
              className="w-7 h-7 rounded-md object-cover"
            />
            <span className="font-display font-semibold text-sm text-[#111111] dark:text-white">
              Flowstate
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#737373]">
            <span className="font-mono">
              {currentStep} / {TOTAL_STEPS}
            </span>
            {onSkipToDashboard && (
              <button
                type="button"
                onClick={onSkipToDashboard}
                className="hover:text-[#111111] dark:hover:text-white cursor-pointer"
              >
                Skip
              </button>
            )}
          </div>
        </div>

        {/* Thin Progress Bar */}
        <div className="h-1 w-full rounded-full bg-[#E5E5E5] dark:bg-[#222222] overflow-hidden">
          <div
            className="h-full bg-[#111111] dark:bg-white transition-all duration-300"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6 sm:p-8 shadow-sm">
          {stepError && (
            <div
              role="alert"
              className="mb-5 px-3.5 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-lg font-bold text-[#111111] dark:text-white">
                  About you
                </h1>
                <p className="text-xs text-[#737373] mt-1">
                  Used for your workspace profile and task assignments.
                </p>
              </div>

              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-medium text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={data.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                    Role
                  </label>
                  <input
                    type="text"
                    required
                    value={data.jobTitle}
                    onChange={(e) => updateField('jobTitle', e.target.value)}
                    placeholder="Operations Lead"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                    Background <span className="text-[#737373] font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={data.professionalBackground}
                    onChange={(e) => updateField('professionalBackground', e.target.value)}
                    placeholder="Brief note about your background..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-lg font-bold text-[#111111] dark:text-white">
                  Your work
                </h1>
                <p className="text-xs text-[#737373] mt-1">
                  Helps tailor workflows and priorities to your team.
                </p>
              </div>

              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-medium text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                    Team or domain
                  </label>
                  <input
                    type="text"
                    required
                    value={data.profession}
                    onChange={(e) => updateField('profession', e.target.value)}
                    placeholder="IT Operations"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                    Category
                  </label>
                  <select
                    value={data.typeOfWork}
                    onChange={(e) => updateField('typeOfWork', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                  >
                    <option>Operations & Incident Management</option>
                    <option>Customer Support & Escalations</option>
                    <option>IT Systems & Infrastructure</option>
                    <option>Finance & Invoicing</option>
                    <option>Software Engineering</option>
                    <option>Executive Leadership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                    What do you handle day-to-day?
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={data.responsibilities}
                    onChange={(e) => updateField('responsibilities', e.target.value)}
                    placeholder="e.g. Incident triage, access reviews, vendor onboarding"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-lg font-bold text-[#111111] dark:text-white">
                  What do you want to automate?
                </h1>
                <p className="text-xs text-[#737373] mt-1">
                  Pick one or more areas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {AUTOMATION_GOAL_OPTIONS.map((g) => {
                  const active = data.automationGoals.includes(g.id);
                  return (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={`px-3.5 py-2.5 rounded-lg border text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'border-[#111111] dark:border-white bg-[#F5F5F5] dark:bg-[#1F1F1F] text-[#111111] dark:text-white'
                          : 'border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#161616] text-[#525252] dark:text-[#D4D4D4] hover:border-[#A3A3A3]'
                      }`}
                    >
                      <span>{g.label}</span>
                      {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-6 pt-5 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] text-xs font-medium text-[#525252] dark:text-[#D4D4D4] hover:bg-[#FAFAFA] dark:hover:bg-[#1A1A1A] cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>{currentStep === TOTAL_STEPS ? 'Finish setup' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
