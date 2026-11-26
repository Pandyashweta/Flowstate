import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowUpRight,
  Briefcase,
  Building2,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  X,
} from 'lucide-react';
import { CommandMessage, Workspace } from '../types';

interface AiAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  messages: CommandMessage[];
  isProcessing: boolean;
  onSendCommand: (prompt: string, inputMode: 'voice' | 'text') => Promise<void>;
  onOpenFullCommandCenter: () => void;
  isListening: boolean;
  onToggleVoice: () => void;
  activeWorkspace?: Workspace | null;
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
  activeWorkspace,
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

  const panelBody = (
    <div className="flex flex-col h-full bg-white dark:bg-[#111111]">
      {/* Header matching Plane AI right pane */}
      <div className="h-11 px-4 border-b border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#111111] dark:text-white" />
          <span className="font-display text-[13px] font-semibold text-[#111111] dark:text-white">
            FLOWSTATE AI
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F5F5F5] dark:bg-[#1F1F1F] text-[#737373]">
            Gemini Live
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenFullCommandCenter}
            title="Expand to AI Command Center"
            className="p-1.5 rounded-md text-[#737373] hover:text-[#111111] dark:hover:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI assistant"
            className="p-1.5 rounded-md text-[#737373] hover:text-[#111111] dark:hover:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.length === 0 ? (
          <div className="py-6 space-y-3">
            <p className="text-[#737373] leading-relaxed">
              Ask FLOWSTATE AI to inspect workflows, query your knowledge base, or create and assign automated tasks.
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() =>
                  void onSendCommand(
                    'Show workflows or tasks awaiting approval or attention.',
                    'text'
                  )
                }
                className="w-full text-left px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#262626] hover:border-[#A3A3A3] dark:hover:border-[#525252] bg-[#FAFAFA] dark:bg-[#161616] text-[#404040] dark:text-[#D4D4D4] transition-colors cursor-pointer"
              >
                Show workflows awaiting approval
              </button>
              <button
                type="button"
                onClick={() =>
                  void onSendCommand(
                    'Summarize my workspace tasks and open priorities.',
                    'text'
                  )
                }
                className="w-full text-left px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#262626] hover:border-[#A3A3A3] dark:hover:border-[#525252] bg-[#FAFAFA] dark:bg-[#161616] text-[#404040] dark:text-[#D4D4D4] transition-colors cursor-pointer"
              >
                Summarize open workspace tasks
              </button>
            </div>
          </div>
        ) : (
          messages.slice(-10).map((m) => (
            <div
              key={m.id}
              className={`leading-relaxed ${
                m.role === 'user'
                  ? 'ml-8 p-2.5 rounded-lg bg-[#F5F5F5] dark:bg-[#1C1C1C] text-[#111111] dark:text-white'
                  : 'text-[#262626] dark:text-[#E5E5E5] py-1'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.proposedWorkflow && (
                <button
                  type="button"
                  onClick={onOpenFullCommandCenter}
                  className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[11px] font-semibold text-[#111111] dark:text-white hover:bg-[#F0F0F0] dark:hover:bg-[#222222] cursor-pointer"
                >
                  <span>Review & Approve Workflow</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-[#737373] py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Bottom Plane-style Context Composer */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#E5E5E5] dark:border-[#262626]">
        <div className="rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] p-2.5 space-y-2 focus-within:border-[#111111] dark:focus-within:border-white transition-colors">
          {activeWorkspace && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-[#1F1F1F] border border-[#E5E5E5] dark:border-[#262626] text-[11px] font-medium text-[#111111] dark:text-white max-w-full">
              {activeWorkspace.logoUrl ? (
                <img
                  src={activeWorkspace.logoUrl}
                  alt={activeWorkspace.name}
                  className="w-3.5 h-3.5 rounded-xs object-cover shrink-0"
                />
              ) : activeWorkspace.type === 'personal' ? (
                <Briefcase className="w-3 h-3 text-[#737373] shrink-0" />
              ) : (
                <Building2 className="w-3 h-3 text-[#737373] shrink-0" />
              )}
              <span className="truncate">{activeWorkspace.name}</span>
            </div>
          )}

          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(e);
              }
            }}
            placeholder="Ask AI, @ for context, / for commands"
            className="w-full resize-none bg-transparent text-xs text-[#111111] dark:text-white placeholder:text-[#737373] focus:outline-none"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#1F1F1F] text-[11px] font-medium text-[#404040] dark:text-[#D4D4D4]">
              <Sparkles className="w-3 h-3" />
              <span>Ask</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleVoice}
                title={isListening ? 'Stop voice' : 'Voice input'}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white'
                    : 'text-[#737373] hover:text-[#111111] dark:hover:text-white hover:bg-[#EFEFEF] dark:hover:bg-[#262626]'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              <button
                type="submit"
                disabled={isProcessing || !text.trim()}
                aria-label="Send"
                className="w-7 h-7 rounded-md bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[340px] xl:w-[370px] shrink-0 h-full border-l border-[#E5E5E5] dark:border-[#262626]">
        {panelBody}
      </aside>
      <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <aside className="relative w-full max-w-sm h-full border-l border-[#E5E5E5] dark:border-[#262626] shadow-2xl">
          {panelBody}
        </aside>
      </div>
    </>
  );
};
