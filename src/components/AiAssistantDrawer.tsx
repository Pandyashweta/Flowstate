import React, { useState } from 'react';
import { ArrowUpRight, Loader2, Mic, MicOff, Send, Sparkles, X } from 'lucide-react';
import { CommandMessage } from '../types';

interface AiAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  messages: CommandMessage[];
  isProcessing: boolean;
  onSendCommand: (prompt: string, inputMode: 'voice' | 'text') => Promise<void>;
  onOpenFullCommandCenter: () => void;
  isListening: boolean;
  onToggleVoice: () => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  open,
  onClose,
  messages,
  isProcessing,
  onSendCommand,
  onOpenFullCommandCenter,
  isListening,
  onToggleVoice,
}) => {
  const [text, setText] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;
    const value = text.trim();
    setText('');
    await onSendCommand(value, 'text');
  };

  return (
    <aside className="hidden lg:flex flex-col w-[360px] shrink-0 h-[calc(100vh-4rem)] sticky top-16 bg-white dark:bg-[#0F172A] border-l border-[#E6ECF5] dark:border-slate-800">
      <div className="px-4 py-3.5 border-b border-[#EEF2F7] dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
            FLOWSTATE AI
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenFullCommandCenter}
            title="Expand to AI Command Center"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI assistant"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.length === 0 ? (
          <div className="space-y-3 py-4">
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Ask FLOWSTATE to inspect workflows, query internal documentation, or orchestrate a
              new automated workflow.
            </p>
            <button
              type="button"
              onClick={() =>
                void onSendCommand(
                  'A customer cannot log into their account. Check previous incidents, identify possible solutions, create a support ticket and assign it to the appropriate team.',
                  'text'
                )
              }
              className="w-full text-left p-3 rounded-xl border border-[#E6ECF5] dark:border-slate-800 hover:border-blue-300 bg-[#F8FAFD] dark:bg-slate-900 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Run customer login incident workflow →
            </button>
          </div>
        ) : (
          messages.slice(-8).map((m) => (
            <div
              key={m.id}
              className={`p-3 rounded-xl leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#EEF4FF] dark:bg-blue-950/60 text-slate-900 dark:text-white ml-6'
                  : 'bg-[#F8FAFD] dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.proposedWorkflow && (
                <button
                  type="button"
                  onClick={onOpenFullCommandCenter}
                  className="mt-2 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  <span>Review & Approve Workflow</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-slate-500 p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Orchestrating...</span>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[#EEF2F7] dark:border-slate-800 bg-[#FAFBFD] dark:bg-slate-900/60"
      >
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-[#DDE4F2] dark:border-slate-700 rounded-xl p-1.5">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask AI or describe a workflow..."
            className="flex-1 min-w-0 px-2 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={onToggleVoice}
            className={`p-2 rounded-lg cursor-pointer ${
              isListening
                ? 'bg-red-600 text-white'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
          <button
            type="submit"
            disabled={isProcessing || !text.trim()}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
};
