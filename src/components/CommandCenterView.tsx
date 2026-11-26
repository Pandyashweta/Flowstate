import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Loader2,
  Mic,
  MicOff,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ApprovalItem,
  CommandMessage,
  IntegrationItem,
  KnowledgeDoc,
  NavSection,
  PriorityLevel,
  ProposedWorkflowDraft,
  TeamMember,
  UserProfile,
  Workspace,
} from '../types';
import { SUPPORTED_VOICE_LANGUAGES } from '../hooks/useVoice';

interface CommandCenterViewProps {
  messages: CommandMessage[];
  isProcessing: boolean;
  error: string | null;
  onSendCommand: (prompt: string, inputMode: 'voice' | 'text') => Promise<void>;
  onCommitWorkflow: (
    messageId: string,
    draft: ProposedWorkflowDraft,
    submitForApproval: boolean
  ) => Promise<{ workflowId: string; approvalId?: string }>;
  onApproveInline: (approval: ApprovalItem) => Promise<void>;
  approvals: ApprovalItem[];
  knowledgeDocs: KnowledgeDoc[];
  integrations: IntegrationItem[];
  teamMembers: TeamMember[];
  profile: UserProfile | null;
  workspace?: Workspace | null;
  voice: {
    isListening: boolean;
    isTranscribing?: boolean;
    isSpeaking: boolean;
    transcript: string;
    interimTranscript: string;
    voiceError: string | null;
    language: string;
    setLanguage: (lang: string) => void;
    isSttSupported: boolean;
    isTtsSupported: boolean;
    startListening: (cb?: (text: string) => void) => void;
    stopListening: () => void;
    speak: (text: string) => void;
    stopSpeaking: () => void;
    clearVoiceError: () => void;
  };
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onNavigate: (section: NavSection) => void;
}

const DEMO_SCENARIOS = [
  {
    label: 'Customer Login Failure Incident (Full Demo)',
    prompt:
      'A customer cannot log into their account. Check previous incidents, identify possible solutions, create a support ticket and assign it to the appropriate team.',
  },
  {
    label: 'Invoice Variance Escalation',
    prompt:
      'We received a vendor invoice with a 5% discrepancy above the purchase order. Check our billing reconciliation SOP, create a review workflow, and request finance approval.',
  },
  {
    label: 'New Employee IT Onboarding',
    prompt:
      'Prepare an onboarding workflow for a new Senior Engineer starting Monday using our IT provisioning checklist and assign tasks to IT Operations.',
  },
];

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  messages,
  isProcessing,
  error,
  onSendCommand,
  onCommitWorkflow,
  onApproveInline,
  approvals,
  knowledgeDocs,
  workspace,
  voice,
  autoSpeak,
  onToggleAutoSpeak,
  onNavigate,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedDraftMsgId, setSelectedDraftMsgId] = useState<string | null>(null);
  const [editableDraft, setEditableDraft] = useState<ProposedWorkflowDraft | null>(null);
  const [committing, setCommitting] = useState(false);
  const [approvingInline, setApprovingInline] = useState(false);
  const [commitFeedback, setCommitFeedback] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Sync latest proposed workflow into right-hand preview pane automatically
  useEffect(() => {
    const latestWithWorkflow = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.proposedWorkflow);
    if (latestWithWorkflow && latestWithWorkflow.id !== selectedDraftMsgId) {
      setSelectedDraftMsgId(latestWithWorkflow.id);
      setEditableDraft(latestWithWorkflow.proposedWorkflow ?? null);
      setCommitFeedback(null);
    }
  }, [messages, selectedDraftMsgId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const activeMessage = messages.find((m) => m.id === selectedDraftMsgId) || null;
  const linkedApproval = activeMessage?.approvalId
    ? approvals.find((a) => a.id === activeMessage.approvalId) || null
    : null;

  const handleVoiceToggle = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening((finalText) => {
        if (finalText.trim()) {
          void onSendCommand(finalText.trim(), 'voice');
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    const text = inputText.trim();
    setInputText('');
    await onSendCommand(text, 'text');
  };

  const handleCommit = async (submitForApproval: boolean) => {
    if (!activeMessage || !editableDraft || committing) return;
    setCommitting(true);
    setCommitFeedback(null);
    try {
      const res = await onCommitWorkflow(activeMessage.id, editableDraft, submitForApproval);
      setCommitFeedback(
        res.approvalId
          ? 'Workflow saved to Firestore & queued in Approvals Center for human authorization.'
          : 'Workflow and tasks created and started in Operations.'
      );
    } catch (err) {
      setCommitFeedback(err instanceof Error ? err.message : 'Failed to create workflow.');
    } finally {
      setCommitting(false);
    }
  };

  const handleInlineApprove = async () => {
    if (!linkedApproval || approvingInline) return;
    setApprovingInline(true);
    try {
      await onApproveInline(linkedApproval);
      setCommitFeedback(
        'Approved and executed via simulated integration! Workflow marked Completed and logged in Audit Trail.'
      );
    } catch (err) {
      setCommitFeedback(err instanceof Error ? err.message : 'Approval execution failed.');
    } finally {
      setApprovingInline(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-[calc(100vh-7.5rem)] min-h-[620px]">
      {/* Left 7 Columns: Voice Orb + Conversational Orchestrator */}
      <div className="xl:col-span-7 flex flex-col rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] overflow-hidden">
        {/* Top Command Header with Voice Controls */}
        <div className="px-5 py-4 border-b border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#111111] dark:text-white" />
              <h2 className="font-display text-base font-bold text-[#111111] dark:text-white">
                AI Command Center
              </h2>
              {workspace && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F5F5F5] dark:bg-[#1A1A1A] text-[#111111] dark:text-white border border-[#E5E5E5] dark:border-[#262626] font-semibold">
                  {workspace.name} ({workspace.type})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#737373] dark:text-[#737373] mt-0.5">
              <span>Grounded in {knowledgeDocs.length} runbooks</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini Live Voice Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Multilingual Voice Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#333333]">
              <Globe className="w-3.5 h-3.5 text-[#737373]" />
              <select
                value={voice.language}
                onChange={(e) => voice.setLanguage(e.target.value)}
                aria-label="Voice input language"
                className="text-xs bg-transparent text-[#404040] dark:text-[#E5E5E5] focus:outline-none cursor-pointer"
              >
                {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="dark:bg-[#161616]">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-TTS Toggle */}
            <button
              type="button"
              onClick={() => {
                if (voice.isSpeaking) voice.stopSpeaking();
                onToggleAutoSpeak();
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                autoSpeak
                  ? 'bg-[#F5F5F5] dark:bg-[#1A1A1A] border-[#D4D4D4] dark:border-[#404040] text-[#111111] dark:text-white'
                  : 'bg-white dark:bg-[#161616] border-[#E5E5E5] dark:border-[#333333] text-[#525252] dark:text-[#737373]'
              }`}
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{autoSpeak ? 'TTS On' : 'TTS Off'}</span>
            </button>

            {voice.isSpeaking && (
              <button
                type="button"
                onClick={voice.stopSpeaking}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Interrupt</span>
              </button>
            )}
          </div>
        </div>

        {/* Conversation Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-4">
              {/* Large Prominent Voice Recording Button */}
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={Boolean(voice.isTranscribing)}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer mb-5 disabled:opacity-60 ${
                  voice.isListening
                    ? 'bg-red-600 text-white scale-105 ring-8 ring-red-500/20'
                    : 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] hover:scale-105 ring-8 ring-black/5 dark:ring-white/10'
                }`}
              >
                {voice.isTranscribing ? (
                  <Loader2 className="w-9 h-9 animate-spin" />
                ) : voice.isListening ? (
                  <div className="flex items-center gap-1 h-8">
                    {[0.1, 0.25, 0.4, 0.2, 0.35].map((delay, i) => (
                      <span
                        key={i}
                        style={{ animationDelay: `${delay}s` }}
                        className="w-1.5 h-full rounded-full bg-white animate-voice-bar"
                      />
                    ))}
                  </div>
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>

              <h3 className="font-display text-lg font-bold text-[#111111] dark:text-white">
                {voice.isTranscribing
                  ? 'Transcribing your voice command...'
                  : voice.isListening
                  ? 'Listening... tap mic again to send'
                  : 'Tap the microphone or type a workflow command'}
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#737373] mt-1.5 leading-relaxed">
                FLOWSTATE transcribes speech, searches your uploaded runbooks using semantic RAG,
                generates structured tasks, and queues human approvals automatically.
              </p>

              {(voice.transcript || voice.interimTranscript) && (
                <div className="mt-4 w-full p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-xs text-[#111111] dark:text-white">
                  “{voice.transcript} {voice.interimTranscript}”
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#F5F5F5] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#F5F5F5] border border-[#E5E5E5] dark:border-[#262626]'
                      : 'bg-[#FAFAFA] dark:bg-[#161616]/80 text-[#262626] dark:text-[#E5E5E5] border border-[#E5E5E5] dark:border-[#262626]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px] text-[#737373]">
                    <span className="font-semibold text-[#525252] dark:text-[#D4D4D4]">
                      {msg.role === 'user'
                        ? msg.inputMode === 'voice'
                          ? 'You · Voice Transcript'
                          : 'You'
                        : 'FLOWSTATE Orchestrator'}
                    </span>
                    <div className="flex items-center gap-2">
                      {msg.role === 'assistant' && msg.spokenText && voice.isTtsSupported && (
                        <button
                          type="button"
                          onClick={() => voice.speak(msg.spokenText || msg.content)}
                          title="Read aloud"
                          className="text-[#111111] dark:text-white hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Speak</span>
                        </button>
                      )}
                      <span className="font-mono tabular-nums">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Visible Stage-by-Stage Execution Pipeline */}
                  {msg.trace && msg.trace.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-[#E5E5E5]/70 dark:border-[#262626] space-y-2">
                      <div className="text-[11px] font-semibold text-[#737373] dark:text-[#737373]">
                        Execution Pipeline Trace
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.trace.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-[#0A0A0A]/60 border border-[#E5E5E5]/70 dark:border-[#262626] text-[11px]"
                          >
                            {step.status === 'completed' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            ) : step.status === 'warning' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-[#111111] dark:text-white shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-[#262626] dark:text-[#E5E5E5]">
                                {step.stage}
                              </div>
                              <div className="text-[#737373] dark:text-[#737373] truncate">
                                {step.detail}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RAG Source Citations */}
                  {msg.ragCitations && msg.ragCitations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E5E5E5]/70 dark:border-[#262626]">
                      <div className="text-[11px] font-semibold text-[#737373] dark:text-[#737373] mb-1.5 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#111111] dark:text-white" />
                        <span>Retrieved Knowledge Base Sources</span>
                      </div>
                      <div className="space-y-1.5">
                        {msg.ragCitations.slice(0, 2).map((cit, i) => (
                          <div
                            key={`${cit.docId}-${i}`}
                            className="p-2.5 rounded-lg bg-white dark:bg-[#0A0A0A]/60 border border-[#E5E5E5]/70 dark:border-[#262626] text-[11px]"
                          >
                            <div className="flex items-center justify-between gap-2 font-semibold text-[#262626] dark:text-[#E5E5E5]">
                              <span className="truncate">{cit.docTitle}</span>
                              <span className="font-mono text-[#111111] dark:text-white tabular-nums shrink-0">
                                {Math.round(cit.similarity * 100)}% match
                              </span>
                            </div>
                            <p className="text-[#737373] dark:text-[#737373] mt-1 line-clamp-2">
                              {cit.excerpt}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clarifying Questions if AI needs more info */}
                  {msg.clarifyingQuestions && msg.clarifyingQuestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E5E5E5]/70 dark:border-[#262626] space-y-1.5">
                      <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        Clarification Questions
                      </div>
                      {msg.clarifyingQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInputText(q)}
                          className="block w-full text-left px-2.5 py-1.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 text-[11px] text-amber-900 dark:text-amber-200 hover:bg-amber-100/70 cursor-pointer"
                        >
                          • {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick button to focus this message's workflow in right preview pane */}
                  {msg.proposedWorkflow && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDraftMsgId(msg.id);
                          setEditableDraft(msg.proposedWorkflow ?? null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-medium cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          {msg.createdWorkflowId ? 'View Created Workflow' : 'Review Proposed Workflow'}
                        </span>
                      </button>
                      {msg.createdWorkflowId && (
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          Saved to Workspace
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isProcessing && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-xs text-[#525252] dark:text-[#D4D4D4]">
              <Loader2 className="w-4 h-4 text-[#111111] dark:text-white animate-spin shrink-0" />
              <span>
                Searching enterprise Knowledge Base via semantic embeddings & orchestrating
                workflow...
              </span>
            </div>
          )}
        </div>

        {/* Voice / API Error Banner */}
        {(voice.voiceError || error) && (
          <div className="mx-5 mb-2 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
            <span>{voice.voiceError || error}</span>
            {voice.voiceError && (
              <button
                type="button"
                onClick={voice.clearVoiceError}
                className="underline font-medium shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Bottom Prompt & Voice Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616]/70"
        >
          {voice.isTranscribing && (
            <div className="mb-2.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] text-xs text-[#111111] dark:text-white">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Transcribing voice audio...</span>
            </div>
          )}

          {voice.isListening && (
            <div className="mb-2.5 flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                <span className="truncate">
                  {voice.transcript || voice.interimTranscript || 'Listening to microphone...'}
                </span>
              </div>
              <button
                type="button"
                onClick={voice.stopListening}
                className="font-semibold underline ml-2 shrink-0 cursor-pointer"
              >
                Stop &amp; Send
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={isProcessing || Boolean(voice.isTranscribing)}
              title={voice.isListening ? 'Stop recording & send' : 'Start voice command'}
              className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all shrink-0 cursor-pointer disabled:opacity-50 ${
                voice.isListening
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] shadow-xs'
              }`}
            >
              {voice.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing}
              placeholder="Describe a task, ask to modify the draft workflow, or click the mic to speak..."
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#333333] text-sm text-[#111111] dark:text-white placeholder:text-[#737373] focus:outline-none focus:border-[#111111] dark:focus:border-white"
            />

            <button
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 h-11 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right 5 Columns: Structured Workflow Preview, RAG Troubleshooting & Approval Controls */}
      <div className="xl:col-span-5 flex flex-col rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-bold text-[#111111] dark:text-white">
              Workflow & Approval Preview
            </h3>
            <p className="text-[11px] text-[#737373] dark:text-[#737373]">
              Review, edit, and authorize before execution
            </p>
          </div>
          {activeMessage?.createdWorkflowId && (
            <button
              type="button"
              onClick={() => onNavigate('workflows')}
              className="text-xs font-medium text-[#111111] dark:text-white hover:underline cursor-pointer"
            >
              Open in Workflows →
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!editableDraft ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F5F5] dark:bg-[#1A1A1A] text-[#111111] dark:text-white flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-display text-sm font-semibold text-[#111111] dark:text-white">
                No Active Workflow Draft
              </h4>
              <p className="text-xs text-[#737373] dark:text-[#737373] mt-1 max-w-xs leading-relaxed">
                Speak or submit a business request on the left. FLOWSTATE will inspect your
                Knowledge Base and construct an editable workflow plan here.
              </p>
            </div>
          ) : (
            <>
              {/* Editable Core Workflow Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] dark:text-[#737373] mb-1">
                    Workflow Title
                  </label>
                  <input
                    type="text"
                    value={editableDraft.title}
                    disabled={Boolean(activeMessage?.createdWorkflowId)}
                    onChange={(e) =>
                      setEditableDraft({ ...editableDraft, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-xs font-semibold text-[#111111] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-75"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-[#737373] dark:text-[#737373] mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={editableDraft.category}
                      disabled={Boolean(activeMessage?.createdWorkflowId)}
                      onChange={(e) =>
                        setEditableDraft({ ...editableDraft, category: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-xs text-[#262626] dark:text-[#E5E5E5] disabled:opacity-75"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#737373] dark:text-[#737373] mb-1">
                      Priority
                    </label>
                    <select
                      value={editableDraft.priority}
                      disabled={Boolean(activeMessage?.createdWorkflowId)}
                      onChange={(e) =>
                        setEditableDraft({
                          ...editableDraft,
                          priority: e.target.value as PriorityLevel,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-xs text-[#262626] dark:text-[#E5E5E5] disabled:opacity-75"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-xs">
                  <span className="inline-flex items-center gap-1.5 text-[#737373] dark:text-[#737373]">
                    <Users className="w-3.5 h-3.5 text-[#111111] dark:text-white" />
                    Recommended Team
                  </span>
                  <span className="font-semibold text-[#111111] dark:text-white">
                    {editableDraft.recommendedTeam}
                  </span>
                </div>
              </div>

              {/* Grounded RAG Troubleshooting Summary */}
              {editableDraft.troubleshootingSummary && (
                <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626]">
                  <div className="text-[11px] font-semibold text-[#111111] dark:text-white mb-1">
                    Grounded Troubleshooting & Incident Summary
                  </div>
                  <p className="text-xs text-[#404040] dark:text-[#D4D4D4] leading-relaxed whitespace-pre-wrap">
                    {editableDraft.troubleshootingSummary}
                  </p>
                </div>
              )}

              {/* Generated Structured Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#111111] dark:text-white">
                    Orchestrated Tasks ({editableDraft.tasks.length})
                  </span>
                  <span className="text-[11px] font-mono text-[#737373]">
                    Due {editableDraft.dueDate}
                  </span>
                </div>
                <div className="space-y-2">
                  {editableDraft.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616]/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-semibold text-[#111111] dark:text-white">
                          {idx + 1}. {task.title}
                        </div>
                        <span className="text-[10px] font-mono uppercase text-[#737373] dark:text-[#737373] shrink-0">
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#737373] dark:text-[#737373] mt-1">
                        {task.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[11px] text-[#737373] dark:text-[#737373]">
                        <span>Owner: {task.assignee}</span>
                        <span>·</span>
                        <span>{task.department}</span>
                        {task.integrationAction && (
                          <>
                            <span>·</span>
                            <span className="text-[#111111] dark:text-white">
                              {task.integrationAction}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposed Human Approval Action */}
              {editableDraft.approvalRequest && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/70 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Approval Gate Required
                    </span>
                    <span className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400">
                      Simulated Connector
                    </span>
                  </div>
                  <div className="text-xs font-medium text-[#111111] dark:text-white">
                    {editableDraft.approvalRequest.actionType} →{' '}
                    {editableDraft.approvalRequest.integrationTarget}
                  </div>
                  <p className="text-[11px] text-[#525252] dark:text-[#D4D4D4]">
                    {editableDraft.approvalRequest.reason}
                  </p>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-[#0A0A0A]/60 font-mono text-[10px] text-[#525252] dark:text-[#737373] break-words">
                    {editableDraft.approvalRequest.proposedPayload}
                  </div>
                </div>
              )}

              {commitFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                  {commitFeedback}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Action Footer */}
        {editableDraft && (
          <div className="p-4 border-t border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616]/70 space-y-2">
            {!activeMessage?.createdWorkflowId ? (
              <div className="flex flex-col sm:flex-row gap-2">
                {editableDraft.approvalRequest ? (
                  <button
                    type="button"
                    disabled={committing}
                    onClick={() => void handleCommit(true)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {committing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Create & Request Approval</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={committing}
                  onClick={() => void handleCommit(false)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
                    editableDraft.approvalRequest
                      ? 'border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616] text-[#404040] dark:text-[#E5E5E5] hover:bg-[#FAFAFA]'
                      : 'bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111]'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Create Without Gate</span>
                </button>
              </div>
            ) : linkedApproval && linkedApproval.status === 'pending' ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={approvingInline}
                  onClick={() => void handleInlineApprove()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {approvingInline ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Approve & Execute (Simulated)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('approvals')}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616] text-xs font-medium text-[#404040] dark:text-[#E5E5E5] cursor-pointer"
                >
                  Open Approvals Queue
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium px-1">
                <span>Workflow active & tracked in Dashboard</span>
                <button
                  type="button"
                  onClick={() => onNavigate('overview')}
                  className="underline cursor-pointer"
                >
                  View Dashboard →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
