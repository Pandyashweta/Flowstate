import React from 'react';
import { X } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  userName?: string;
  workspaceName?: string;
  onStartTour: () => void;
  onSkip: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  open,
  userName,
  workspaceName,
  onStartTour,
  onSkip,
}) => {
  if (!open) return null;

  const firstName = (userName || 'there').split(' ')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="max-w-sm w-full bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <img
            src="/icons/favicon_io/apple-touch-icon.png"
            alt="FLOWSTATE"
            className="w-7 h-7 rounded-md object-cover"
          />
          <button
            type="button"
            onClick={onSkip}
            aria-label="Close"
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#737373] hover:text-[#111111] dark:hover:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold text-[#111111] dark:text-white">
            Welcome, {firstName}
          </h2>
          <p className="text-xs text-[#737373] leading-relaxed">
            {workspaceName ? `${workspaceName} is ready.` : 'Your workspace is ready.'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onStartTour}
            className="px-3.5 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333333] text-xs font-medium text-[#525252] dark:text-[#D4D4D4] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
          >
            Quick tour
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold transition-colors cursor-pointer"
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  );
};
