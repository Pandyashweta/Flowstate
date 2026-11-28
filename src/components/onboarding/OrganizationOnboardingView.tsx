import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { OrganizationOnboardingData } from '../../types';

interface OrganizationOnboardingViewProps {
  initialOwnerName?: string;
  onComplete: (data: OrganizationOnboardingData) => void;
  onSkipToDashboard?: () => void;
  uid: string;
}

export const OrganizationOnboardingView: React.FC<OrganizationOnboardingViewProps> = ({
  onSkipToDashboard,
}) => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] flex flex-col justify-center items-center px-4 py-10">
      <div className="max-w-md w-full bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-8 text-center space-y-4 shadow-sm">
        <div className="font-mono text-4xl font-bold text-[#111111] dark:text-white">404</div>
        <h1 className="font-display text-lg font-bold text-[#111111] dark:text-white">
          Organization Workspace Unavailable
        </h1>
        <p className="text-xs text-[#737373] leading-relaxed">
          Organization onboarding is disabled for now. Use your Personal &amp; Professional workspace to manage tasks, workflows, and documents.
        </p>
        {onSkipToDashboard && (
          <button
            type="button"
            onClick={onSkipToDashboard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workspace</span>
          </button>
        )}
      </div>
    </div>
  );
};
