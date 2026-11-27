import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Cpu,
  FileAudio,
  FileText,
  Globe,
  Loader2,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Users,
  Volume2,
  VolumeX,
  Workflow as WorkflowIcon,
  X,
} from 'lucide-react';
import {
  AiModelMode,
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
import {
  GEMINI_TTS_VOICES,
  GeminiTtsVoice,
  SUPPORTED_VOICE_LANGUAGES,
} from '../hooks/useVoice';

interface CommandCenterViewProps {
  messages: CommandMessage[];
  isProcessing: boolean;
  error: string | null;
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
    isSynthesizingSpeech?: boolean;
    isSpeaking: boolean;
    audioLevel?: number;
    recordingSeconds?: number;
    transcript: string;
    interimTranscript: string;
    voiceError: string | null;
    language: string;
    setLanguage: (lang: string) => void;
    ttsVoice?: GeminiTtsVoice;
    setTtsVoice?: (voice: GeminiTtsVoice) => void;
    isSttSupported: boolean;
    isTtsSupported: boolean;
    startListening: (cb?: (text: string) => void) => void;
    stopListening: () => void;
    cancelListening?: () => void;
    transcribeAudioFile?: (file: File, cb?: (text: string) => void) => Promise<string>;
    speak: (text: string) => void;
    stopSpeaking: () => void;
    clearVoiceError: () => void;
  };
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onNavigate: (section: NavSection) => void;
}

const QUICK_DOMAIN_PROMPTS: { label: string; domain: string; prompt: string; forceWorkflow: boolean }[] = [
  {
    label: 'Login Escalation Workflow',
    domain: 'Customer Support',
    prompt:
      'A customer cannot log into their enterprise account. Check our runbooks, diagnose likely causes, and generate a support escalation workflow with approval before creating an external ticket.',
    forceWorkflow: true,
  },
  {
    label: 'Invoice Variance Review',
    domain: 'Billing & Finance',
    prompt:
      'We received a vendor invoice 5% above the purchase order. Build a reconciliation workflow with Finance Controller approval before payment release.',
    forceWorkflow: true,
  },
  {
    label: 'New Engineer Onboarding',
    domain: 'IT Operations',
    prompt:
      'Generate an IT onboarding workflow for a Senior Engineer starting Monday covering identity, SSO groups, GitHub access, and hardware provisioning.',
    forceWorkflow: true,
  },
  {
    label: 'Workspace Status Brief',
    domain: 'General Operations',
    prompt:
      'Give me a concise status briefing on our current workflows, open tasks, and pending approvals.',
    forceWorkflow: false,
  },
];

function formatTimer(seconds = 0): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  messages,
  isProcessing,
  error,
  activeDomain,
  domains,
  onChangeDomain,
  modelMode,
  onChangeModelMode,
  onClearConversation,
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
  const [forceWorkflowMode, setForceWorkflowMode] = useState(false);
  const [selectedDraftMsgId, setSelectedDraftMsgId] = useState<string | null>(null);
  const [editableDraft, setEditableDraft] = useState<ProposedWorkflowDraft | null>(null);
  const [committing, setCommitting] = useState(false);
  const [approvingInline, setApprovingInline] = useState(false);
  const [commitFeedback, setCommitFeedback] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const lastAutoSelectedMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (messages.length === 0) {
      lastAutoSelectedMsgIdRef.current = null;
      setSelectedDraftMsgId(null);
      setEditableDraft(null);
      setCommitFeedback(null);
      return;
    }
    const latestWithWorkflow = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.proposedWorkflow);
    if (latestWithWorkflow && latestWithWorkflow.id !== lastAutoSelectedMsgIdRef.current) {
      lastAutoSelectedMsgIdRef.current = latestWithWorkflow.id;
      setSelectedDraftMsgId(latestWithWorkflow.id);
      setEditableDraft(latestWithWorkflow.proposedWorkflow ?? null);
      setCommitFeedback(null);
    }
  }, [messages]);

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
          void onSendCommand(finalText.trim(), 'voice', { forceWorkflow: forceWorkflowMode });
        }
      });
    }
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !voice.transcribeAudioFile) return;
    await voice.transcribeAudioFile(file, (finalText) => {
      if (finalText.trim()) {
        void onSendCommand(finalText.trim(), 'voice', { forceWorkflow: forceWorkflowMode });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    const text = inputText.trim();
    setInputText('');
    await onSendCommand(text, 'text', { forceWorkflow: forceWorkflowMode });
  };

  const handleCommit = async (submitForApproval: boolean) => {
    if (!activeMessage || !editableDraft || committing) return;
    setCommitting(true);
    setCommitFeedback(null);
    try {
      const res = await onCommitWorkflow(activeMessage.id, editableDraft, submitForApproval);
      setCommitFeedback(
        res.approvalId
          ? 'Workflow saved & queued in Approvals Center for human authorization.'
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
        'Approved and executed via integration gateway! Workflow marked Completed and logged in Audit Trail.'
      );
    } catch (err) {
      setCommitFeedback(err instanceof Error ? err.message : 'Approval execution failed.');
    } finally {
      setApprovingInline(false);
    }
  };

  const level = voice.audioLevel ?? 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-[calc(100vh-7.5rem)] min-h-[620px]">
      {/* Left 7 Columns: Voice + Domain-Aware Multi-Turn Gemini Chatbot */}
      <div className="xl:col-span-7 flex flex-col rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] overflow-hidden">
        {/* Top Command Header with Domain Role, Free Gemini Model & Audio Controls */}
        <div className="px-5 py-3.5 border-b border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-[#111111] dark:text-white shrink-0" />
              <h2 className="font-display text-sm sm:text-base font-bold text-[#111111] dark:text-white truncate">
                AI Command Center
              </h2>
              {workspace && (
                <span className="text-[11px] font-mono text-[#737373] truncate hidden sm:inline">
                  · {workspace.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={onClearConversation}
                  title="Start a new conversation"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#333333] text-xs font-medium text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              )}

              {/* Auto-TTS Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (voice.isSpeaking || voice.isSynthesizingSpeech) voice.stopSpeaking();
                  onToggleAutoSpeak();
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  autoSpeak
                    ? 'bg-[#111111] dark:bg-white border-[#111111] dark:border-white text-white dark:text-[#111111]'
                    : 'bg-white dark:bg-[#161616] border-[#E5E5E5] dark:border-[#333333] text-[#525252] dark:text-[#A3A3A3]'
                }`}
              >
                {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{autoSpeak ? 'Voice On' : 'Voice Off'}</span>
              </button>

              {(voice.isSpeaking || voice.isSynthesizingSpeech) && (
                <button
                  type="button"
                  onClick={voice.stopSpeaking}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              )}
            </div>
          </div>

          {/* Domain Role + Free Gemini Model + Language/Voice Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#333333]">
              <Briefcase className="w-3.5 h-3.5 text-[#737373] shrink-0" />
              <select
                value={activeDomain}
                onChange={(e) => onChangeDomain(e.target.value)}
                aria-label="Operational Domain Role"
                className="text-xs font-medium bg-transparent text-[#111111] dark:text-white focus:outline-none cursor-pointer"
              >
                {domains.map((dom) => (
                  <option key={dom} value={dom} className="dark:bg-[#161616]">
                    {dom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#333333]">
              <Cpu className="w-3.5 h-3.5 text-[#737373] shrink-0" />
              <select
                value={modelMode}
                onChange={(e) => onChangeModelMode(e.target.value as AiModelMode)}
                aria-label="Gemini Free Model Mode"
                className="text-xs font-medium bg-transparent text-[#111111] dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="balanced" className="dark:bg-[#161616]">
                  Hydrogen (Balanced · Free)
                </option>
                <option value="fast" className="dark:bg-[#161616]">
                  Flash-Lite (Fast · Free)
                </option>
                <option value="deep" className="dark:bg-[#161616]">
                  Hydrogen Deep (XHigh · Free)
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#333333]">
              <Globe className="w-3.5 h-3.5 text-[#737373] shrink-0" />
              <select
                value={voice.language}
                onChange={(e) => voice.setLanguage(e.target.value)}
                aria-label="Audio transcription language"
                className="text-xs bg-transparent text-[#404040] dark:text-[#E5E5E5] focus:outline-none cursor-pointer"
              >
                {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="dark:bg-[#161616]">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {voice.ttsVoice && voice.setTtsVoice && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#333333]">
                <Volume2 className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                <select
                  value={voice.ttsVoice}
                  onChange={(e) => voice.setTtsVoice?.(e.target.value as GeminiTtsVoice)}
                  aria-label="Gemini TTS Voice"
                  className="text-xs bg-transparent text-[#404040] dark:text-[#E5E5E5] focus:outline-none cursor-pointer"
                >
                  {GEMINI_TTS_VOICES.map((v) => (
                    <option key={v.id} value={v.id} className="dark:bg-[#161616]">
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <span className="ml-auto text-[11px] text-[#737373] hidden sm:inline">
              {knowledgeDocs.length} runbook{knowledgeDocs.length === 1 ? '' : 's'} indexed
            </span>
          </div>
        </div>

        {/* Conversation Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-4">
              {/* Large Voice Recording Orb with Live Audio Meter */}
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={Boolean(voice.isTranscribing) || isProcessing}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer mb-4 disabled:opacity-60 ${
                  voice.isListening
                    ? 'bg-red-600 text-white scale-105 ring-8 ring-red-500/20'
                    : 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] hover:scale-105 ring-8 ring-black/5 dark:ring-white/10'
                }`}
              >
                {voice.isTranscribing ? (
                  <Loader2 className="w-9 h-9 animate-spin" />
                ) : voice.isListening ? (
                  <div className="flex items-center gap-1 h-9">
                    {[0.55, 0.85, 1, 0.75, 0.5].map((weight, i) => {
                      const heightPct = Math.max(22, Math.min(100, Math.round((0.25 + level * weight) * 100)));
                      return (
                        <span
                          key={i}
                          style={{ height: `${heightPct}%` }}
                          className="w-1.5 rounded-full bg-white transition-all duration-75"
                        />
                      );
                    })}
                  </div>
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>

              <h3 className="font-display text-lg font-bold text-[#111111] dark:text-white">
                {voice.isTranscribing
                  ? 'Transcribing with Gemini 3.5 Transcribe...'
                  : voice.isListening
                  ? `Recording (${formatTimer(voice.recordingSeconds)}) · Click mic to transcribe & send`
                  : `${activeDomain} Voice & Chat Assistant`}
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#A3A3A3] mt-1.5 leading-relaxed">
                Speak into your microphone, upload a voice memo, or type below. Powered by free-tier
                Gemini 4 Hydrogen, Gemini 3.5 Transcribe, and Gemini 3.8 TTS.
              </p>

              {voice.isListening && voice.cancelListening && (
                <button
                  type="button"
                  onClick={voice.cancelListening}
                  className="mt-3 text-xs font-medium text-[#737373] hover:text-red-600 underline cursor-pointer"
                >
                  Cancel recording
                </button>
              )}

              {(voice.transcript || voice.interimTranscript) && (
                <div className="mt-4 w-full p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-xs text-[#111111] dark:text-white">
                  {voice.transcript || voice.interimTranscript}
                </div>
              )}

              {/* Quick Start Domain Prompts */}
              <div className="mt-6 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {QUICK_DOMAIN_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      onChangeDomain(item.domain);
                      void onSendCommand(item.prompt, 'text', {
                        forceWorkflow: item.forceWorkflow,
                      });
                    }}
                    className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] hover:border-[#111111] dark:hover:border-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <div className="text-xs font-semibold text-[#111111] dark:text-white">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-[#737373] mt-0.5 truncate">{item.domain}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#F5F5F5] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#F5F5F5] border border-[#E5E5E5] dark:border-[#262626]'
                      : 'bg-[#FAFAFA] dark:bg-[#161616]/80 text-[#262626] dark:text-[#E5E5E5] border border-[#E5E5E5] dark:border-[#262626]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-[11px] text-[#737373]">
                    <span className="font-semibold text-[#525252] dark:text-[#D4D4D4]">
                      {msg.role === 'user'
                        ? msg.inputMode === 'voice'
                          ? 'You · Voice Transcript'
                          : 'You'
                        : `FLOWSTATE · ${msg.domain || activeDomain}`}
                    </span>
                    <div className="flex items-center gap-2">
                      {msg.role === 'assistant' && msg.modelUsed && (
                        <span className="font-mono text-[10px] text-[#737373]">
                          {msg.modelUsed}
                        </span>
                      )}
                      {msg.role === 'assistant' && (msg.spokenText || msg.content) && voice.isTtsSupported && (
                        <button
                          type="button"
                          onClick={() => voice.speak(msg.spokenText || msg.content)}
                          title="Speak with Gemini TTS"
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

                  {/* Execution Pipeline Trace */}
                  {msg.trace && msg.trace.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-[#E5E5E5]/70 dark:border-[#262626] space-y-2">
                      <div className="text-[11px] font-semibold text-[#737373]">
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
                              <div className="text-[#737373] truncate">{step.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RAG Source Citations */}
                  {msg.ragCitations && msg.ragCitations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E5E5E5]/70 dark:border-[#262626]">
                      <div className="text-[11px] font-semibold text-[#737373] mb-1.5 flex items-center gap-1.5">
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
                            <p className="text-[#737373] mt-1 line-clamp-2">{cit.excerpt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clarifying Questions */}
                  {msg.clarifyingQuestions && msg.clarifyingQuestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E5E5E5]/70 dark:border-[#262626] space-y-1.5">
                      <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        Follow-up Suggestions
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

                  {/* Focus workflow in preview pane */}
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
                Running Gemini ({modelMode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen'}) in{' '}
                <strong>{activeDomain}</strong> context...
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

        {/* Bottom Prompt, Voice & Audio Upload Composer */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616]/70 space-y-2.5"
        >
          {voice.isTranscribing && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] text-xs text-[#111111] dark:text-white">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Transcribing audio with Gemini 3.5 Transcribe...</span>
            </div>
          )}

          {voice.isSynthesizingSpeech && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] text-xs text-[#525252] dark:text-[#D4D4D4]">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Synthesizing neural voice reply...</span>
            </div>
          )}

          {voice.isListening && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                <span className="font-mono tabular-nums font-semibold">
                  {formatTimer(voice.recordingSeconds)}
                </span>
                <div className="flex items-center gap-0.5 h-4">
                  {[0.4, 0.7, 1, 0.8, 0.5].map((w, i) => (
                    <span
                      key={i}
                      style={{ height: `${Math.max(25, Math.min(100, Math.round((0.2 + level * w) * 100)))}%` }}
                      className="w-1 rounded-full bg-red-500 transition-all duration-75"
                    />
                  ))}
                </div>
                <span className="truncate">Recording microphone...</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {voice.cancelListening && (
                  <button
                    type="button"
                    onClick={voice.cancelListening}
                    className="inline-flex items-center gap-1 text-[#737373] hover:text-red-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={voice.stopListening}
                  className="font-semibold underline cursor-pointer"
                >
                  Stop &amp; Transcribe
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Hidden audio file uploader */}
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={isProcessing || Boolean(voice.isTranscribing)}
              title={voice.isListening ? 'Stop recording & transcribe' : 'Record voice command (Gemini 3.5 Transcribe)'}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all shrink-0 cursor-pointer disabled:opacity-50 ${
                voice.isListening
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] shadow-xs'
              }`}
            >
              {voice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {voice.transcribeAudioFile && (
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                disabled={isProcessing || voice.isListening || Boolean(voice.isTranscribing)}
                title="Upload an audio clip to transcribe & process"
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616] text-[#525252] dark:text-[#D4D4D4] hover:border-[#111111] dark:hover:border-white transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                <FileAudio className="w-4 h-4" />
              </button>
            )}

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isProcessing}
              placeholder={
                forceWorkflowMode
                  ? `Describe a ${activeDomain} workflow to generate...`
                  : `Ask ${activeDomain} AI, refine a workflow, or tap the mic...`
              }
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#333333] text-sm text-[#111111] dark:text-white placeholder:text-[#737373] focus:outline-none focus:border-[#111111] dark:focus:border-white"
            />

            <button
              type="button"
              onClick={() => setForceWorkflowMode((v) => !v)}
              title="Toggle forced workflow generation"
              className={`inline-flex items-center gap-1.5 px-3 h-10 rounded-xl border text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                forceWorkflowMode
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-[#161616] border-[#E5E5E5] dark:border-[#333333] text-[#404040] dark:text-[#D4D4D4] hover:border-[#111111] dark:hover:border-white'
              }`}
            >
              <WorkflowIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Draft Workflow</span>
            </button>

            <button
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shrink-0"
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
            <p className="text-[11px] text-[#737373]">
              Review, edit, and save AI-generated workflows into your workspace
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
              <p className="text-xs text-[#737373] mt-1 max-w-xs leading-relaxed">
                Speak, upload audio, or toggle <strong>Draft Workflow</strong> on the left. Gemini
                will construct an editable workflow plan with steps, tasks, and approval gates here.
              </p>
            </div>
          ) : (
            <>
              {/* Editable Core Workflow Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">
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
                    <label className="block text-[11px] font-medium text-[#737373] mb-1">
                      Domain / Category
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
                    <label className="block text-[11px] font-medium text-[#737373] mb-1">
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
                  <span className="inline-flex items-center gap-1.5 text-[#737373]">
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
                    Grounded Analysis & Summary
                  </div>
                  <p className="text-xs text-[#404040] dark:text-[#D4D4D4] leading-relaxed whitespace-pre-wrap">
                    {editableDraft.troubleshootingSummary}
                  </p>
                </div>
              )}

              {/* Ordered Workflow Steps */}
              {editableDraft.steps && editableDraft.steps.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#111111] dark:text-white mb-2">
                    Workflow Steps ({editableDraft.steps.length})
                  </div>
                  <ol className="space-y-1.5">
                    {editableDraft.steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 p-2.5 rounded-lg bg-[#FAFAFA] dark:bg-[#161616]/60 border border-[#E5E5E5] dark:border-[#262626] text-xs"
                      >
                        <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          0{i + 1}
                        </span>
                        <span className="text-[#404040] dark:text-[#E5E5E5]">{step}</span>
                      </li>
                    ))}
                  </ol>
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
                        <span className="text-[10px] font-mono uppercase text-[#737373] shrink-0">
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#737373] mt-1">{task.description}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[11px] text-[#737373]">
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
                      {editableDraft.approvalRequest.riskLevel} risk
                    </span>
                  </div>
                  <div className="text-xs font-medium text-[#111111] dark:text-white">
                    {editableDraft.approvalRequest.actionType} →{' '}
                    {editableDraft.approvalRequest.integrationTarget}
                  </div>
                  <p className="text-[11px] text-[#525252] dark:text-[#D4D4D4]">
                    {editableDraft.approvalRequest.reason}
                  </p>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-[#0A0A0A]/60 font-mono text-[10px] text-[#525252] dark:text-[#A3A3A3] break-words">
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
                    <span>Create &amp; Request Approval</span>
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
                  <span>{editableDraft.approvalRequest ? 'Create Without Gate' : 'Save & Start Workflow'}</span>
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
                  <span>Approve &amp; Execute</span>
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
                <span>Workflow active &amp; tracked in Operations</span>
                <button
                  type="button"
                  onClick={() => onNavigate('workflows')}
                  className="underline cursor-pointer"
                >
                  View Workflows →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
