import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Briefcase, Building2, Loader2 } from 'lucide-react';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { AnalyticsView } from './components/AnalyticsView';
import { ApprovalsView } from './components/ApprovalsView';
import { AuthView } from './components/auth/AuthView';
import { CommandCenterView } from './components/CommandCenterView';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InstallPromptModal } from './components/InstallPromptModal';
import { IntegrationsView } from './components/IntegrationsView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { InsightModal, NewWorkflowModal } from './components/Modals';
import { OrganizationOnboardingView } from './components/onboarding/OrganizationOnboardingView';
import { PersonalOnboardingView } from './components/onboarding/PersonalOnboardingView';
import { PublicWebsite } from './components/public/PublicWebsite';
import { WaitlistPage } from './components/public/WaitlistPage';
import { ProductTour } from './components/ProductTour';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { TasksView } from './components/TasksView';
import { TopBar } from './components/TopBar';
import { WelcomeModal } from './components/WelcomeModal';
import { WorkflowsView } from './components/WorkflowsView';
import { useFlowstateData } from './hooks/useFlowstateData';
import { useVoice } from './hooks/useVoice';
import { apiPostJson } from './lib/api';
import {
  AgentTraceStep,
  AiModelMode,
  ApprovalItem,
  CommandMessage,
  NavSection,
  OperationalInsight,
  ProposedWorkflowDraft,
  RagCitation,
  Workflow,
  WorkspaceType,
} from './types';

const DEFAULT_OPERATIONAL_DOMAINS = [
  'General Operations',
  'Customer Support',
  'IT Operations',
  'Engineering',
  'Billing & Finance',
  'Sales Ops',
  'HR & Onboarding',
  'Legal & Compliance',
];

function FlowstateApp() {
  const data = useFlowstateData();
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('light');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (themePreference === 'dark') {
      setDarkMode(true);
      return;
    }
    if (themePreference === 'light') {
      setDarkMode(false);
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkMode(media.matches);
      const onChange = (e: MediaQueryListEvent) => setDarkMode(e.matches);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }
  }, [themePreference]);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [newWorkflowModalOpen, setNewWorkflowModalOpen] = useState(false);
  const [newWorkflowInitialTab, setNewWorkflowInitialTab] = useState<'ai' | 'manual'>('ai');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // Public website & Auth state
  const [publicMode, setPublicMode] = useState<'landing' | 'login' | 'register' | 'waitlist'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/waitlist' || window.location.hash === '#waitlist') {
        return 'waitlist';
      }
    }
    return 'landing';
  });
  const [viewPublicSite, setViewPublicSite] = useState(false);
  const [previewWaitlist, setPreviewWaitlist] = useState(false);

  const navigatePublicMode = useCallback((mode: 'landing' | 'login' | 'register' | 'waitlist') => {
    setPublicMode(mode);
    if (typeof window !== 'undefined') {
      const targetPath = mode === 'waitlist' ? '/waitlist' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ publicMode: mode }, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname === '/waitlist' || window.location.hash === '#waitlist') {
        setPublicMode('waitlist');
      } else {
        setPublicMode('landing');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  // Operational AI Insight modal state
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightData, setInsightData] = useState<OperationalInsight | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  // Shared Conversational AI Command Center state
  const [messages, setMessages] = useState<CommandMessage[]>([]);
  const [isCommandProcessing, setIsCommandProcessing] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [activeDomain, setActiveDomain] = useState<string>('General Operations');
  const [modelMode, setModelMode] = useState<AiModelMode>('balanced');

  const availableDomains = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_OPERATIONAL_DOMAINS,
          ...(data.activeWorkspace?.departments || []).filter(Boolean),
        ])
      ),
    [data.activeWorkspace?.departments]
  );

  const voice = useVoice(data.profile?.voiceLanguage || 'en-US');

  // Capture PWA beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Sync user voice & theme preferences when profile loads
  useEffect(() => {
    if (data.profile) {
      setAutoSpeak(data.profile.autoSpeakResponses ?? true);
      if (data.profile.voiceLanguage) {
        voice.setLanguage(data.profile.voiceLanguage);
      }
      if (
        data.profile.themePreference === 'light' ||
        data.profile.themePreference === 'dark' ||
        data.profile.themePreference === 'system'
      ) {
        setThemePreference(data.profile.themePreference);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data.profile?.voiceLanguage,
    data.profile?.autoSpeakResponses,
    data.profile?.themePreference,
  ]);

  // Clear ephemeral workspace UI state when switching workspaces or signing out
  useEffect(() => {
    setMessages([]);
    setCommandError(null);
    setSelectedWorkflow(null);
    setInsightData(null);
    setInsightError(null);
    setDepartmentFilter('All');
  }, [data.activeWorkspaceId, data.user?.uid]);

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

  const handleClearConversation = useCallback(() => {
    voice.stopSpeaking();
    setMessages([]);
    setCommandError(null);
  }, [voice]);

  const handleSendCommand = useCallback(
    async (
      prompt: string,
      inputMode: 'voice' | 'text',
      options?: { forceWorkflow?: boolean }
    ) => {
      if (!prompt.trim() || isCommandProcessing) return;
      setCommandError(null);
      voice.stopSpeaking();

      const userMsg: CommandMessage = {
        id: `usr-${Date.now()}`,
        role: 'user',
        content: prompt.trim(),
        timestamp: Date.now(),
        inputMode,
        domain: activeDomain,
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
          modelUsed?: string;
          domain?: string;
          ragCitations?: RagCitation[];
          trace?: AgentTraceStep[];
        }>('/api/ai/command', {
          workspaceId: data.activeWorkspace?.id,
          inputMode,
          prompt: prompt.trim(),
          domain: activeDomain,
          modelMode,
          forceWorkflow: Boolean(options?.forceWorkflow),
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
          content: res.assistantMessage || 'Response ready.',
          spokenText: res.spokenResponse || res.assistantMessage,
          timestamp: Date.now(),
          modelUsed: res.modelUsed,
          domain: res.domain || activeDomain,
          ragCitations: res.ragCitations || [],
          proposedWorkflow: res.proposedWorkflow ?? null,
          clarifyingQuestions: res.clarifyingQuestions || [],
          trace: res.trace || [],
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (autoSpeak && assistantMsg.spokenText && voice.isTtsSupported) {
          void voice.speak(assistantMsg.spokenText);
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
      activeDomain,
      modelMode,
      data.activeWorkspace?.id,
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
                      ? 'Saved to workspace and awaiting human sign-off'
                      : 'Saved to workspace and active in Operations',
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
      };
      const res = await apiPostJson<OperationalInsight>('/api/ai/insight', { summaryStats });
      setInsightData(res);
    } catch (err) {
      setInsightError(
        err instanceof Error ? err.message : 'Failed to retrieve operational AI insight.'
      );
    } finally {
      setInsightLoading(false);
    }
  }, [data.workflows, data.approvals, data.tasks]);

  // Loading state while auth is initializing
  if (!data.authReady) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-[#525252] dark:text-[#D4D4D4]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <span className="font-display font-medium text-sm">Initializing FLOWSTATE...</span>
      </div>
    );
  }

  // If user is NOT authenticated: show Public Website, Waitlist Page, or Auth Form
  if (!data.user) {
    if (publicMode === 'login' || publicMode === 'register') {
      return (
        <AuthView
          initialMode={publicMode}
          onAuthSessionEstablished={data.syncBackendSession}
          onSuccess={(type?: WorkspaceType) => {
            if (type) {
              data.startOnboarding(type);
            }
          }}
          onNavigatePublic={() => navigatePublicMode('landing')}
        />
      );
    }

    if (publicMode === 'waitlist') {
      return (
        <WaitlistPage
          onBackToHome={() => navigatePublicMode('landing')}
          onSignIn={() => navigatePublicMode('login')}
          onRegister={() => navigatePublicMode('register')}
        />
      );
    }

    return (
      <>
        <PublicWebsite
          onSignIn={() => navigatePublicMode('login')}
          onRegister={() => navigatePublicMode('register')}
          onOpenWaitlist={() => navigatePublicMode('waitlist')}
          onInstallPwa={() => setInstallModalOpen(true)}
          canInstall={Boolean(deferredPrompt)}
        />
        <InstallPromptModal
          isOpen={installModalOpen}
          onClose={() => setInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
        />
      </>
    );
  }

  // If user is authenticated but chose to preview public website
  if (viewPublicSite) {
    return (
      <div className="relative">
        <div className="bg-blue-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between z-50 sticky top-0 shadow-sm">
          <span>
            Viewing FLOWSTATE {previewWaitlist ? 'Waitlist' : 'Public Overview'} as{' '}
            {data.profile?.displayName || 'User'}
          </span>
          <button
            type="button"
            onClick={() => {
              setPreviewWaitlist(false);
              setViewPublicSite(false);
            }}
            className="px-3 py-1 rounded-lg bg-white text-blue-600 hover:bg-blue-50 font-bold cursor-pointer"
          >
            Return to Workspace Dashboard
          </button>
        </div>
        {previewWaitlist ? (
          <WaitlistPage
            onBackToHome={() => setPreviewWaitlist(false)}
            onSignIn={() => {
              setPreviewWaitlist(false);
              setViewPublicSite(false);
            }}
            onRegister={() => {
              setPreviewWaitlist(false);
              setViewPublicSite(false);
            }}
          />
        ) : (
          <PublicWebsite
            onSignIn={() => setViewPublicSite(false)}
            onRegister={() => setViewPublicSite(false)}
            onOpenWaitlist={() => {
              setPreviewWaitlist(true);
              window.scrollTo({ top: 0, behavior: 'auto' });
            }}
            onInstallPwa={() => setInstallModalOpen(true)}
            canInstall={Boolean(deferredPrompt)}
          />
        )}
        <InstallPromptModal
          isOpen={installModalOpen}
          onClose={() => setInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
        />
      </div>
    );
  }

  // Loading state while syncing workspaces for signed-in user
  if (data.seeding && data.workspaces.length === 0 && !data.onboardingNeeded) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-[#525252] dark:text-[#D4D4D4]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <span className="font-display font-medium text-sm">Loading your workspaces...</span>
      </div>
    );
  }

  // First-time Workspace Selection (when user has no workspaces yet)
  if ((data.needsWorkspaceSetup || data.workspaces.length === 0) && !data.onboardingNeeded) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#111111] dark:text-[#F5F5F5] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6 sm:p-10 space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#737373] mb-1">
                Workspace Setup
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] dark:text-white">
                Choose how you want to start
              </h1>
              <p className="text-sm text-[#737373] mt-1.5">
                Start with a private Personal Workspace or set up a multi-department Organization Workspace. You can add more anytime.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => data.startOnboarding('personal')}
              className="group text-left p-6 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] hover:border-[#111111] dark:hover:border-white transition-all cursor-pointer flex flex-col justify-between gap-6"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-[#111111] dark:text-white">
                    Personal Workspace
                  </h2>
                  <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                    Private environment for individual productivity, voice-driven workflows, and personal knowledge base.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111111] dark:text-white group-hover:translate-x-0.5 transition-transform">
                <span>Set up Personal Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => data.startOnboarding('organization')}
              className="group text-left p-6 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] hover:border-[#111111] dark:hover:border-white transition-all cursor-pointer flex flex-col justify-between gap-6"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-[#111111] dark:text-white">
                    Organization Workspace
                  </h2>
                  <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                    Shared company workspace with custom organization logo, departments, role-based permissions, and team invitations.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111111] dark:text-white group-hover:translate-x-0.5 transition-transform">
                <span>Create Organization</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Multi-step Onboarding Flows
  if (data.onboardingNeeded) {
    if (data.onboardingType === 'personal') {
      return (
        <PersonalOnboardingView
          uid={data.user.uid}
          initialName={data.profile?.displayName || data.user.displayName || ''}
          onComplete={(onboardingData) => void data.completePersonalOnboarding(onboardingData)}
          onSkipToDashboard={data.skipOnboarding}
        />
      );
    }

    if (data.onboardingType === 'organization') {
      return (
        <OrganizationOnboardingView
          uid={data.user.uid}
          initialOwnerName={data.profile?.displayName || data.user.displayName || ''}
          onComplete={(onboardingData) => void data.completeOrgOnboarding(onboardingData)}
          onSkipToDashboard={data.skipOnboarding}
        />
      );
    }
  }

  // Full Authenticated Dashboard Application
  const pendingApprovals = data.approvals.filter((a) => a.status === 'pending');
  const failedWorkflows = data.workflows.filter((w) => w.status === 'failed');

  return (
    <div className="h-screen bg-white dark:bg-[#0A0A0A] text-[#111111] dark:text-[#F5F5F5] flex flex-col font-sans transition-colors overflow-hidden">
      <TopBar
        activeSection={activeSection}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setThemePreference(darkMode ? 'light' : 'dark')}
        onOpenNewWorkflow={() => setNewWorkflowModalOpen(true)}
        onRequestInsight={() => void handleRequestInsight()}
        insightLoading={insightLoading}
        aiDrawerOpen={aiDrawerOpen}
        onToggleAiDrawer={() => setAiDrawerOpen((v) => !v)}
        pendingApprovals={pendingApprovals}
        failedWorkflows={failedWorkflows}
        notifications={data.notifications}
        onMarkNotificationRead={(id) => void data.markNotificationRead(id)}
        onMarkAllNotificationsRead={() => void data.markAllNotificationsRead()}
        onArchiveNotification={(id) => void data.archiveNotification(id)}
        onNavigate={handleNavigate}
        profile={data.profile}
        userPhotoUrl={data.user.photoURL}
        onSignOut={() => void data.signOutUser()}
        onInstallPwa={() => setInstallModalOpen(true)}
        onViewPublicWebsite={() => setViewPublicSite(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        workspaces={data.workspaces}
        activeWorkspaceId={data.activeWorkspaceId}
        onSelectWorkspace={data.switchWorkspace}
        onCreateNewOrg={() => data.startOnboarding('organization')}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
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
          workspaces={data.workspaces}
          activeWorkspaceId={data.activeWorkspaceId}
          onSelectWorkspace={data.switchWorkspace}
          onCreateNewOrg={() => data.startOnboarding('organization')}
          onCreateDepartment={(name) => void data.createDepartment(name)}
          onInstallPwa={() => setInstallModalOpen(true)}
          onOpenNewWorkflow={() => setNewWorkflowModalOpen(true)}
        />

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white dark:bg-[#0A0A0A]">
          {/* Plane-Style View Sub-Header Bar — only for primary workspace sections */}
          {(['overview', 'workflows', 'tasks', 'knowledge_base', 'approvals', 'analytics'] as const).includes(activeSection as 'overview' | 'workflows' | 'tasks' | 'knowledge_base' | 'approvals' | 'analytics') && (
          <div className="h-11 px-4 sm:px-5 border-b border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-[#0E0E0E]">
            <div className="flex items-center gap-5 min-w-0 overflow-x-auto no-scrollbar">
              <span className="font-display text-[13px] font-semibold text-[#111111] dark:text-white whitespace-nowrap shrink-0">
                {data.activeWorkspace?.name || 'Workspace'}
              </span>
              <div className="flex items-center gap-1 h-11">
                {(
                  [
                    { id: 'overview', label: 'Overview' },
                    { id: 'workflows', label: 'Workflows' },
                    { id: 'tasks', label: 'Tasks' },
                    { id: 'knowledge_base', label: 'Knowledge' },
                    { id: 'approvals', label: 'Approvals' },
                    { id: 'analytics', label: 'Analytics' },
                  ] as const
                ).map((tabItem) => {
                  const active = activeSection === tabItem.id;
                  return (
                    <button
                      key={tabItem.id}
                      type="button"
                      onClick={() => handleNavigate(tabItem.id)}
                      className={`h-full px-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                        active
                          ? 'border-[#111111] dark:border-white text-[#111111] dark:text-white font-semibold'
                          : 'border-transparent text-[#737373] hover:text-[#111111] dark:hover:text-white'
                      }`}
                    >
                      {tabItem.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              data-tour="create-workflow"
              type="button"
              onClick={() => setNewWorkflowModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>+ New workflow</span>
            </button>
          </div>
          )}

          <main className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="max-w-[1440px] mx-auto w-full">
            {data.pendingInvitations.length > 0 && (
              <div className="mb-5 space-y-2">
                {data.pendingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-blue-950 dark:text-blue-100">
                        Workspace Invitation:
                      </span>{' '}
                      <span className="text-blue-800 dark:text-blue-200">
                        {inv.invitedByName} invited you to join <strong>{inv.workspaceName}</strong> as{' '}
                        <span className="font-mono font-semibold">{inv.roleId}</span> ({inv.department}).
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void data.respondToInvitation(inv.id, 'accept')}
                        className="px-3 py-1.5 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-semibold cursor-pointer"
                      >
                        Accept & Join
                      </button>
                      <button
                        type="button"
                        onClick={() => void data.respondToInvitation(inv.id, 'reject')}
                        className="px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'overview' && (
              <DashboardView
                profile={data.profile}
                workspace={data.activeWorkspace}
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
                activeDomain={activeDomain}
                domains={availableDomains}
                onChangeDomain={setActiveDomain}
                modelMode={modelMode}
                onChangeModelMode={setModelMode}
                onClearConversation={handleClearConversation}
                onSendCommand={handleSendCommand}
                onCommitWorkflow={handleCommitWorkflow}
                onApproveInline={handleApproveInline}
                approvals={data.approvals}
                knowledgeDocs={data.knowledgeDocs}
                integrations={data.integrations}
                teamMembers={data.teamMembers}
                profile={data.profile}
                workspace={data.activeWorkspace}
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
                departments={data.activeWorkspace?.departments}
                initialDepartmentFilter={departmentFilter}
                searchQuery={searchQuery}
                selectedWorkflow={selectedWorkflow}
                onSelectWorkflow={setSelectedWorkflow}
                onUpdateStatus={data.updateWorkflowStatus}
                onExecuteWorkflow={data.executeWorkflow}
                onDeleteWorkflow={data.deleteWorkflow}
                onCreateFromTemplate={data.createWorkflowFromDraft}
                onOpenNewWorkflow={() => {
                  setNewWorkflowInitialTab('manual');
                  setNewWorkflowModalOpen(true);
                }}
                onOpenAiGenerate={() => {
                  setNewWorkflowInitialTab('ai');
                  setNewWorkflowModalOpen(true);
                }}
              />
            )}

            {activeSection === 'tasks' && (
              <TasksView
                tasks={data.tasks}
                workflows={data.workflows}
                workspace={data.activeWorkspace}
                profile={data.profile}
                teamMembers={data.teamMembers}
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
                onLogTestRun={data.appendAuditLog}
              />
            )}

            {activeSection === 'settings' && (
              <SettingsView
                profile={data.profile}
                userEmail={data.user.email}
                workspace={data.activeWorkspace}
                teamMembers={data.teamMembers}
                auditLogs={data.auditLogs}
                themePreference={themePreference}
                onChangeTheme={(t) => setThemePreference(t)}
                onUpdateProfile={data.updateProfileSettings}
                onUpdateWorkspace={data.updateWorkspaceDetails}
                onAddMember={data.addTeamMember}
                onInviteMember={data.inviteWorkspaceMember}
                onUpdateMemberRole={data.updateTeamMemberRole}
                onRemoveMember={data.removeTeamMember}
                onReplayTutorial={() => {
                  setActiveSection('overview');
                  void data.restartTutorial();
                }}
                onInstallPwa={() => setInstallModalOpen(true)}
                onSignedOut={() => void data.signOutUser()}
              />
            )}
            </div>
          </main>
        </div>

        {/* Collapsible Docked AI Drawer */}
        {aiDrawerOpen && activeSection !== 'command_center' && (
          <AiAssistantDrawer
            open={aiDrawerOpen}
            onClose={() => setAiDrawerOpen(false)}
            messages={messages}
            isProcessing={isCommandProcessing}
            error={commandError}
            voiceError={voice.voiceError}
            onClearVoiceError={voice.clearVoiceError}
            activeDomain={activeDomain}
            domains={availableDomains}
            onChangeDomain={setActiveDomain}
            modelMode={modelMode}
            onChangeModelMode={setModelMode}
            onClearConversation={handleClearConversation}
            onSendCommand={handleSendCommand}
            onOpenFullCommandCenter={() => {
              setAiDrawerOpen(false);
              setActiveSection('command_center');
            }}
            isListening={voice.isListening}
            isTranscribing={voice.isTranscribing}
            isSpeaking={voice.isSpeaking}
            recordingSeconds={voice.recordingSeconds}
            onToggleVoice={() => {
              if (voice.isListening) voice.stopListening();
              else {
                void voice.startListening((text: string) => {
                  if (text.trim()) void handleSendCommand(text.trim(), 'voice');
                });
              }
            }}
            onCancelVoice={voice.cancelListening}
            onSpeak={(spoken) => void voice.speak(spoken)}
            onStopSpeaking={voice.stopSpeaking}
            activeWorkspace={data.activeWorkspace}
          />
        )}
      </div>

      {/* Modals */}
      <NewWorkflowModal
        open={newWorkflowModalOpen}
        initialTab={newWorkflowInitialTab}
        onClose={() => setNewWorkflowModalOpen(false)}
        workspaceId={data.activeWorkspace?.id}
        departments={data.activeWorkspace?.departments}
        domains={availableDomains}
        activeDomain={activeDomain}
        modelMode={modelMode}
        requireApproval={data.profile?.requireApprovalForExternal ?? true}
        voice={voice}
        onCreateManual={data.createManualWorkflow}
        onCommitGeneratedWorkflow={data.createWorkflowFromDraft}
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

      <InstallPromptModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />

      <WelcomeModal
        open={!data.welcomeSeen && !data.onboardingNeeded}
        userName={data.profile?.displayName || data.user.displayName || undefined}
        workspaceName={data.activeWorkspace?.name}
        onStartTour={() => {
          void data.completeWelcome();
        }}
        onSkip={() => {
          void data.completeTutorial();
        }}
      />

      <ProductTour
        open={data.welcomeSeen && !data.tutorialCompleted && !data.onboardingNeeded}
        currentStep={data.tutorialStep}
        role={data.activeWorkspace?.role}
        onStepChange={(step) => void data.updateTutorialStep(step)}
        onFinish={() => void data.completeTutorial()}
        onClose={() => void data.completeTutorial()}
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
