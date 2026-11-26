import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { AnalyticsView } from './components/AnalyticsView';
import { ApprovalsView } from './components/ApprovalsView';
import { AuthGate } from './components/AuthGate';
import { CommandCenterView } from './components/CommandCenterView';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { IntegrationsView } from './components/IntegrationsView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { InsightModal, NewWorkflowModal } from './components/Modals';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { TasksView } from './components/TasksView';
import { TopBar } from './components/TopBar';
import { WorkflowsView } from './components/WorkflowsView';
import { useFlowstateData } from './hooks/useFlowstateData';
import { useVoice } from './hooks/useVoice';
import { apiPostJson } from './lib/api';
import {
  AgentTraceStep,
  ApprovalItem,
  CommandMessage,
  NavSection,
  OperationalInsight,
  ProposedWorkflowDraft,
  RagCitation,
  Workflow,
} from './types';

function FlowstateApp() {
  const data = useFlowstateData();
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [newWorkflowModalOpen, setNewWorkflowModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // Operational AI Insight modal state
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightData, setInsightData] = useState<OperationalInsight | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  // Shared Conversational AI Command Center state
  const [messages, setMessages] = useState<CommandMessage[]>([]);
  const [isCommandProcessing, setIsCommandProcessing] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const voice = useVoice(data.profile?.voiceLanguage || 'en-US');

  // Sync user voice preferences when profile loads
  useEffect(() => {
    if (data.profile) {
      setAutoSpeak(data.profile.autoSpeakResponses ?? true);
      if (data.profile.voiceLanguage) {
        voice.setLanguage(data.profile.voiceLanguage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.profile?.voiceLanguage, data.profile?.autoSpeakResponses]);

  // Sync Tailwind v4 .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleNavigate = useCallback((section: NavSection, dept?: string) => {
    setActiveSection(section);
    if (dept) {
      setDepartmentFilter(dept);
    } else if (section !== 'workflows') {
      setDepartmentFilter('All');
    }
  }, []);

  const handleSendCommand = useCallback(
    async (prompt: string, inputMode: 'voice' | 'text') => {
      if (!prompt.trim() || isCommandProcessing) return;
      setCommandError(null);
      voice.stopSpeaking();

      const userMsg: CommandMessage = {
        id: `usr-${Date.now()}`,
        role: 'user',
        content: prompt.trim(),
        timestamp: Date.now(),
        inputMode,
      };

      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setIsCommandProcessing(true);

      try {
        const res = await apiPostJson<{
          assistantMessage: string;
          spokenResponse: string;
          needsClarification: boolean;
          clarifyingQuestions: string[];
          proposedWorkflow?: ProposedWorkflowDraft | null;
          ragCitations?: RagCitation[];
          trace?: AgentTraceStep[];
        }>('/api/ai/command', {
          prompt: prompt.trim(),
          conversationHistory: nextHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          knowledgeDocs: data.knowledgeDocs.map((d) => ({
            id: d.id,
            title: d.title,
            category: d.category,
            content: d.content,
          })),
          integrations: data.integrations.map((i) => ({
            name: i.name,
            provider: i.provider,
            category: i.category,
            status: i.status,
            isSimulated: i.isSimulated,
          })),
          teamMembers: data.teamMembers.map((t) => ({
            name: t.name,
            role: t.role,
            department: t.department,
          })),
          requireApproval: data.profile?.requireApprovalForExternal ?? true,
        });

        const assistantMsg: CommandMessage = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: res.assistantMessage || 'Workflow plan prepared for your review.',
          spokenText: res.spokenResponse || res.assistantMessage,
          timestamp: Date.now(),
          ragCitations: res.ragCitations || [],
          proposedWorkflow: res.proposedWorkflow ?? null,
          clarifyingQuestions: res.clarifyingQuestions || [],
          trace: res.trace || [],
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (autoSpeak && assistantMsg.spokenText && voice.isTtsSupported) {
          voice.speak(assistantMsg.spokenText);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to process AI command.';
        setCommandError(msg);
      } finally {
        setIsCommandProcessing(false);
      }
    },
    [
      isCommandProcessing,
      messages,
      data.knowledgeDocs,
      data.integrations,
      data.teamMembers,
      data.profile?.requireApprovalForExternal,
      autoSpeak,
      voice,
    ]
  );

  const handleLaunchFromHero = useCallback(
    (prompt: string, inputMode: 'voice' | 'text') => {
      setActiveSection('command_center');
      void handleSendCommand(prompt, inputMode);
    },
    [handleSendCommand]
  );

  const handleStartHeroVoice = useCallback(() => {
    voice.startListening((finalText) => {
      if (finalText.trim()) {
        setActiveSection('command_center');
        void handleSendCommand(finalText.trim(), 'voice');
      }
    });
  }, [voice, handleSendCommand]);

  const handleCommitWorkflow = useCallback(
    async (
      messageId: string,
      draft: ProposedWorkflowDraft,
      submitForApproval: boolean
    ) => {
      const targetMsg = messages.find((m) => m.id === messageId);
      const prevUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const ragSources = (targetMsg?.ragCitations || []).map((c) => c.docTitle);

      const created = await data.createWorkflowFromDraft(draft, {
        sourcePrompt: prevUserMsg?.content || draft.title,
        triggerType: prevUserMsg?.inputMode === 'voice' ? 'voice' : 'chat',
        ragSources,
        submitForApproval,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                createdWorkflowId: created.workflowId,
                approvalId: created.approvalId,
                trace: [
                  ...(m.trace || []),
                  {
                    stage: created.approvalId
                      ? 'Queued in Approvals Center'
                      : 'Workflow Dispatched',
                    status: 'completed',
                    detail: created.approvalId
                      ? 'Persisted to Firestore and awaiting human sign-off'
                      : 'Persisted to Firestore and active in Operations',
                  },
                ],
              }
            : m
        )
      );

      return created;
    },
    [messages, data]
  );

  const handleApproveInline = useCallback(
    async (approval: ApprovalItem) => {
      await data.resolveApproval(
        approval,
        'approved',
        'Approved directly from AI Command Center preview.'
      );
    },
    [data]
  );

  const handleRequestInsight = useCallback(async () => {
    setInsightLoading(true);
    setInsightError(null);
    try {
      const summaryStats = {
        totalWorkflows: data.workflows.length,
        completedWorkflows: data.workflows.filter((w) => w.status === 'completed').length,
        failedWorkflows: data.workflows.filter((w) => w.status === 'failed').length,
        pendingApprovals: data.approvals.filter((a) => a.status === 'pending').length,
        openTasks: data.tasks.filter((t) => t.status !== 'completed').length,
        knowledgeDocsCount: data.knowledgeDocs.length,
        recentFailures: data.workflows
          .filter((w) => w.status === 'failed')
          .map((w) => ({ code: w.code, title: w.title, category: w.category })),
        pendingApprovalTitles: data.approvals
          .filter((a) => a.status === 'pending')
          .map((a) => ({ title: a.workflowTitle, action: a.actionType, risk: a.riskLevel })),
      };
      const res = await apiPostJson<OperationalInsight>('/api/ai/insight', { summaryStats });
      setInsightData(res);
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : 'Unable to generate AI insight.');
    } finally {
      setInsightLoading(false);
    }
  }, [data.workflows, data.approvals, data.tasks, data.knowledgeDocs]);

  // Loading & Auth Gate
  if (!data.authReady || data.seeding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FC] dark:bg-[#0B1120] gap-3">
        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {data.seeding ? 'Initializing your FLOWSTATE workspace...' : 'Loading FLOWSTATE...'}
        </p>
      </div>
    );
  }

  if (!data.user) {
    return <AuthGate onSignIn={() => void data.signInWithGoogle()} error={data.authError} />;
  }

  const pendingApprovals = data.approvals.filter((a) => a.status === 'pending');
  const failedWorkflows = data.workflows.filter((w) => w.status === 'failed');

  return (
    <div className="min-h-screen flex bg-[#F4F7FC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F1F5F9]">
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        pendingApprovalsCount={pendingApprovals.length}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        profile={data.profile}
        userPhotoUrl={data.user.photoURL}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeSection={activeSection}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          onOpenNewWorkflow={() => setNewWorkflowModalOpen(true)}
          onRequestInsight={() => void handleRequestInsight()}
          insightLoading={insightLoading}
          aiDrawerOpen={aiDrawerOpen}
          onToggleAiDrawer={() => setAiDrawerOpen((v) => !v)}
          pendingApprovals={pendingApprovals}
          failedWorkflows={failedWorkflows}
          onNavigate={handleNavigate}
          profile={data.profile}
          userPhotoUrl={data.user.photoURL}
          onSignOut={() => void data.signOutUser()}
        />

        <div className="flex-1 flex min-w-0">
          <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-[1480px] mx-auto w-full">
            {activeSection === 'overview' && (
              <DashboardView
                profile={data.profile}
                workflows={data.workflows}
                tasks={data.tasks}
                approvals={data.approvals}
                auditLogs={data.auditLogs}
                onNavigate={handleNavigate}
                onLaunchCommand={handleLaunchFromHero}
                onSelectWorkflow={(wf) => {
                  setSelectedWorkflow(wf);
                  setActiveSection('workflows');
                }}
                onOpenNewWorkflow={() => setNewWorkflowModalOpen(true)}
                isVoiceListening={voice.isListening}
                onStartHeroVoice={handleStartHeroVoice}
                onStopHeroVoice={voice.stopListening}
              />
            )}

            {activeSection === 'command_center' && (
              <CommandCenterView
                messages={messages}
                isProcessing={isCommandProcessing}
                error={commandError}
                onSendCommand={handleSendCommand}
                onCommitWorkflow={handleCommitWorkflow}
                onApproveInline={handleApproveInline}
                approvals={data.approvals}
                knowledgeDocs={data.knowledgeDocs}
                integrations={data.integrations}
                teamMembers={data.teamMembers}
                profile={data.profile}
                voice={voice}
                autoSpeak={autoSpeak}
                onToggleAutoSpeak={() => setAutoSpeak((v) => !v)}
                onNavigate={handleNavigate}
              />
            )}

            {activeSection === 'workflows' && (
              <WorkflowsView
                workflows={data.workflows}
                tasks={data.tasks}
                auditLogs={data.auditLogs}
                initialDepartmentFilter={departmentFilter}
                searchQuery={searchQuery}
                selectedWorkflow={selectedWorkflow}
                onSelectWorkflow={setSelectedWorkflow}
                onUpdateStatus={data.updateWorkflowStatus}
                onDeleteWorkflow={data.deleteWorkflow}
                onOpenNewWorkflow={() => setNewWorkflowModalOpen(true)}
              />
            )}

            {activeSection === 'tasks' && (
              <TasksView
                tasks={data.tasks}
                workflows={data.workflows}
                searchQuery={searchQuery}
                onCreateTask={data.createTask}
                onUpdateTaskStatus={data.updateTaskStatus}
                onAddComment={data.addTaskComment}
                onDeleteTask={data.deleteTask}
              />
            )}

            {activeSection === 'knowledge_base' && (
              <KnowledgeBaseView
                docs={data.knowledgeDocs}
                onSaveDoc={data.saveKnowledgeDoc}
                onDeleteDoc={data.deleteKnowledgeDoc}
              />
            )}

            {activeSection === 'approvals' && (
              <ApprovalsView
                approvals={data.approvals}
                profile={data.profile}
                onResolveApproval={data.resolveApproval}
              />
            )}

            {activeSection === 'analytics' && (
              <AnalyticsView
                workflows={data.workflows}
                tasks={data.tasks}
                auditLogs={data.auditLogs}
              />
            )}

            {activeSection === 'integrations' && (
              <IntegrationsView
                integrations={data.integrations}
                onUpdateIntegration={data.updateIntegration}
                onLogTestRun={async (entry) => {
                  await data.appendAuditLog(entry);
                }}
              />
            )}

            {activeSection === 'settings' && (
              <SettingsView
                profile={data.profile}
                userEmail={data.user.email}
                teamMembers={data.teamMembers}
                auditLogs={data.auditLogs}
                onUpdateProfile={data.updateProfileSettings}
                onAddMember={data.addTeamMember}
                onUpdateMemberRole={data.updateTeamMemberRole}
                onRemoveMember={data.removeTeamMember}
              />
            )}
          </main>

          {/* Docked Right-Hand AI Assistant Panel (Screenshot 3) */}
          {activeSection !== 'command_center' && (
            <AiAssistantDrawer
              open={aiDrawerOpen}
              onClose={() => setAiDrawerOpen(false)}
              messages={messages}
              isProcessing={isCommandProcessing}
              onSendCommand={handleSendCommand}
              onOpenFullCommandCenter={() => {
                setAiDrawerOpen(false);
                setActiveSection('command_center');
              }}
              isListening={voice.isListening}
              onToggleVoice={() => {
                if (voice.isListening) {
                  voice.stopListening();
                } else {
                  voice.startListening((t) => {
                    if (t.trim()) void handleSendCommand(t.trim(), 'voice');
                  });
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <NewWorkflowModal
        open={newWorkflowModalOpen}
        onClose={() => setNewWorkflowModalOpen(false)}
        onCreateManual={data.createManualWorkflow}
        onSwitchToVoice={() => setActiveSection('command_center')}
      />

      <InsightModal
        insight={insightData}
        error={insightError}
        onClose={() => {
          setInsightData(null);
          setInsightError(null);
        }}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FlowstateApp />
    </ErrorBoundary>
  );
}
