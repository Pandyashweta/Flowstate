import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  ArrowUpRight,
  Briefcase,
  Building2,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  Workflow as WorkflowIcon,
  X,
} from 'lucide-react';
import { AiModelMode, CommandMessage, Workspace } from '../types';

interface AiAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  messages: CommandMessage[];
  isProcessing: boolean;
  error?: string | null;
  voiceError?: string | null;
  onClearVoiceError?: () => void;
  activeDomain: string;
  domains: string[];
  onChangeDomain: (domain: string) => void;
  modelMode: AiModelMode;
  onChangeModelMode: (mode: AiModelMode) => void;
  onClearConversation: () => void;
  onSendCommand: (
    prompt: string,
    inputMode: 'voice' | 'text',
    options?: { forceWorkflow?: boolean }
  ) => Promise<void>;
  onOpenFullCommandCenter: () => void;
  isListening: boolean;
  isTranscribing?: boolean;
  isSpeaking?: boolean;
  recordingSeconds?: number;
  onToggleVoice: () => void;
  onCancelVoice?: () => void;
  onSpeak?: (text: string) => void;
  onStopSpeaking?: () => void;
  activeWorkspace?: Workspace | null;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  open,
  onClose,
  messages,
  isProcessing,
  error,
  voiceError,
  onClearVoiceError,
  activeDomain,
  domains,
  onChangeDomain,
  modelMode,
  onChangeModelMode,
  onClearConversation,
  onSendCommand,
  onOpenFullCommandCenter,
  isListening,
  isTranscribing,
  isSpeaking,
  recordingSeconds = 0,
  onToggleVoice,
  onCancelVoice,
  onSpeak,
  onStopSpeaking,
  activeWorkspace,
}) => {
  const [text, setText] = useState('');
  const [forceWorkflow, setForceWorkflow] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;
    const value = text.trim();
    setText('');
    await onSendCommand(value, 'text', { forceWorkflow });
  };

  const panelBody = (
    <div className="flex flex-col h-full bg-white dark:bg-[#111111]">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[#E5E5E5] dark:border-[#262626] space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#111111] dark:text-white" />
            <span className="font-display text-[13px] font-semibold text-[#111111] dark:text-white">
              FLOWSTATE AI
            </span>
            <span className="text-[10px] font-mono text-[#737373]">
              {modelMode === 'fast' ? 'Flash-Lite' : 'Hydrogen'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isSpeaking && onStopSpeaking && (
              <button
                type="button"
                onClick={onStopSpeaking}
                title="Stop voice playback"
                className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearConversation}
                title="New chat"
                className="p-1.5 rounded-md text-[#737373] hover:text-[#111111] dark:hover:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
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

        {/* Compact Domain + Model Switcher */}
        <div className="flex items-center gap-1.5">
          <select
            value={activeDomain}
            onChange={(e) => onChangeDomain(e.target.value)}
            aria-label="Chatbot Domain Role"
            className="flex-1 min-w-0 px-2 py-1 rounded-md border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[11px] font-medium text-[#111111] dark:text-white focus:outline-none cursor-pointer"
          >
            {domains.map((dom) => (
              <option key={dom} value={dom} className="dark:bg-[#161616]">
                {dom}
              </option>
            ))}
          </select>
          <select
            value={modelMode}
            onChange={(e) => onChangeModelMode(e.target.value as AiModelMode)}
            aria-label="Gemini Free Mode"
            className="px-2 py-1 rounded-md border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[11px] text-[#525252] dark:text-[#D4D4D4] focus:outline-none cursor-pointer"
          >
            <option value="balanced" className="dark:bg-[#161616]">
              Balanced
            </option>
            <option value="fast" className="dark:bg-[#161616]">
              Fast
            </option>
            <option value="deep" className="dark:bg-[#161616]">
              Deep
            </option>
          </select>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.length === 0 ? (
          <div className="py-5 space-y-3">
            <p className="text-[#737373] leading-relaxed">
              Multi-turn Gemini assistant scoped to <strong>{activeDomain}</strong>. Ask questions,
              record voice commands, or draft executable workflows.
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  void onSendCommand(
                    `Create an operational workflow for ${activeDomain} with clear steps and team tasks.`,
                    'text',
                    { forceWorkflow: true }
                  )
                }
                className="w-full text-left px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#262626] hover:border-[#A3A3A3] dark:hover:border-[#525252] bg-[#FAFAFA] dark:bg-[#161616] text-[#404040] dark:text-[#D4D4D4] transition-colors cursor-pointer disabled:opacity-50"
              >
                Generate a {activeDomain} workflow
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  void onSendCommand(
                    'Summarize my workspace workflows, open tasks, and pending approvals.',
                    'text'
                  )
                }
                className="w-full text-left px-3 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#262626] hover:border-[#A3A3A3] dark:hover:border-[#525252] bg-[#FAFAFA] dark:bg-[#161616] text-[#404040] dark:text-[#D4D4D4] transition-colors cursor-pointer disabled:opacity-50"
              >
                Summarize workspace status
              </button>
            </div>
          </div>
        ) : (
          messages.slice(-14).map((m) => (
            <div
              key={m.id}
              className={`leading-relaxed ${
                m.role === 'user'
                  ? 'ml-8 p-2.5 rounded-lg bg-[#F5F5F5] dark:bg-[#1C1C1C] text-[#111111] dark:text-white'
                  : 'text-[#262626] dark:text-[#E5E5E5] py-1'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {m.role === 'assistant' && onSpeak && (
                  <button
                    type="button"
                    onClick={() => onSpeak(m.spokenText || m.content)}
                    className="inline-flex items-center gap-1 text-[10px] text-[#737373] hover:text-[#111111] dark:hover:text-white cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Speak</span>
                  </button>
                )}
                {m.proposedWorkflow && (
                  <button
                    type="button"
                    onClick={onOpenFullCommandCenter}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[11px] font-semibold text-[#111111] dark:text-white hover:bg-[#F0F0F0] dark:hover:bg-[#222222] cursor-pointer"
                  >
                    <span>Review &amp; Save Workflow</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-[#737373] py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Thinking with Gemini...</span>
          </div>
        )}
      </div>

      {/* Error & Audio Status Banner */}
      {(error || voiceError) && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[11px] text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
          <span className="break-words">{voiceError || error}</span>
          {voiceError && onClearVoiceError && (
            <button
              type="button"
              onClick={onClearVoiceError}
              className="underline font-medium shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {isTranscribing && (
        <div className="mx-3 mb-2 px-3 py-1.5 rounded-lg bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] text-[11px] text-[#111111] dark:text-white flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Transcribing voice audio...</span>
        </div>
      )}

      {isListening && (
        <div className="mx-3 mb-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-[11px] text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            Rec {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
            {String(recordingSeconds % 60).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-2">
            {onCancelVoice && (
              <button type="button" onClick={onCancelVoice} className="underline cursor-pointer">
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={onToggleVoice}
              className="font-semibold underline cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Bottom Composer */}
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
            placeholder={
              forceWorkflow
                ? `Describe a ${activeDomain} workflow to generate...`
                : `Ask ${activeDomain} AI or tap mic to speak...`
            }
            className="w-full resize-none bg-transparent text-xs text-[#111111] dark:text-white placeholder:text-[#737373] focus:outline-none"
          />

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setForceWorkflow((v) => !v)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
                forceWorkflow
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#1F1F1F] text-[#404040] dark:text-[#D4D4D4]'
              }`}
            >
              <WorkflowIcon className="w-3 h-3" />
              <span>{forceWorkflow ? 'Workflow Mode' : 'Ask / Chat'}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleVoice}
                disabled={isProcessing || Boolean(isTranscribing)}
                title={isListening ? 'Stop recording & transcribe' : 'Record voice command'}
                className={`p-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
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
