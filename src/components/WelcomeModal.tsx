import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="max-w-md w-full bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-3xl p-7 shadow-2xl space-y-5">
        <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-[#111111] dark:text-white">
            Welcome to FLOWSTATE, {firstName}.
          </h2>
          <p className="text-sm text-[#525252] dark:text-[#D4D4D4] leading-relaxed">
            Your workspace{workspaceName ? ` (${workspaceName})` : ''} is ready. It starts completely
            clean so every workflow, task, and document belongs to you. Let&apos;s take a quick look
            around.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onStartTour}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>Start Quick Tour</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-3 rounded-xl border border-[#E5E5E5] dark:border-[#333333] text-xs font-semibold text-[#525252] dark:text-[#D4D4D4] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
