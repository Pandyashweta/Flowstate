import React, { useState } from 'react';
import {
  Bell,
  Bot,
  LogOut,
  Menu,
  Moon,
  Plus,
  Sparkles,
  Sun,
} from 'lucide-react';
import { ApprovalItem, NavSection, UserProfile, Workflow } from '../types';

interface TopBarProps {
  activeSection: NavSection;
  onOpenMobileMenu: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenNewWorkflow: () => void;
  onRequestInsight: () => void;
  insightLoading: boolean;
  aiDrawerOpen: boolean;
  onToggleAiDrawer: () => void;
  pendingApprovals: ApprovalItem[];
  failedWorkflows: Workflow[];
  onNavigate: (section: NavSection) => void;
  profile: UserProfile | null;
  userPhotoUrl?: string | null;
  onSignOut: () => void;
}

const SECTION_LABELS: Record<NavSection, { group: string; title: string }> = {
  overview: { group: 'Overview', title: 'Dashboard' },
  command_center: { group: 'Overview', title: 'AI Command Center' },
  workflows: { group: 'Operations', title: 'Workflows' },
  tasks: { group: 'Operations', title: 'Tasks' },
  knowledge_base: { group: 'Intelligence', title: 'Knowledge Base' },
  approvals: { group: 'Governance', title: 'Approvals Center' },
  analytics: { group: 'Intelligence', title: 'Analytics' },
  integrations: { group: 'Platform', title: 'Integrations' },
  settings: { group: 'Platform', title: 'Settings' },
};

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onOpenMobileMenu,
  darkMode,
  onToggleDarkMode,
  onOpenNewWorkflow,
  onRequestInsight,
  insightLoading,
  aiDrawerOpen,
  onToggleAiDrawer,
  pendingApprovals,
  failedWorkflows,
  onNavigate,
  profile,
  userPhotoUrl,
  onSignOut,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const crumb = SECTION_LABELS[activeSection];
  const alertCount = pendingApprovals.length + failedWorkflows.length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-[#E6ECF5] dark:border-slate-800/90 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile toggle + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline whitespace-nowrap">
            {crumb.group}
          </span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
          <h1 className="font-display font-semibold text-slate-900 dark:text-white truncate">
            {crumb.title}
          </h1>
        </div>
      </div>

      {/* Right: Functional Enterprise Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setMenuOpen(false);
            }}
            aria-label="Notifications"
            className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-[#E6ECF5] dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
                {alertCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 rounded-xl shadow-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Actionable Notifications
                </span>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {alertCount} items
                </span>
              </div>
              {alertCount === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  All approvals and workflow runs are clear.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {pendingApprovals.map((apr) => (
                    <button
                      key={apr.id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        onNavigate('approvals');
                      }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        Approval Required · {apr.riskLevel} risk
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                        {apr.workflowTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {apr.actionType}
                      </div>
                    </button>
                  ))}
                  {failedWorkflows.map((wf) => (
                    <button
                      key={wf.id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        onNavigate('workflows');
                      }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-medium text-red-600 dark:text-red-400">
                        Workflow Failed · {wf.code}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                        {wf.title}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Light / Dark Theme Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to Light theme' : 'Switch to Dark theme'}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#E6ECF5] dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Get AI Insight button (Screenshot 1) */}
        <button
          type="button"
          onClick={onRequestInsight}
          disabled={insightLoading}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200/80 dark:border-indigo-900/70 bg-gradient-to-r from-[#F5F3FF] to-[#EEF4FF] dark:from-indigo-950/60 dark:to-blue-950/60 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:brightness-95 transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
        >
          <span>{insightLoading ? 'Analyzing...' : 'Get AI Insight'}</span>
          <Sparkles className="w-3.5 h-3.5" />
        </button>

        {/* Docked AI Assistant Toggle (Screenshot 3) */}
        {activeSection !== 'command_center' && (
          <button
            type="button"
            onClick={onToggleAiDrawer}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              aiDrawerOpen
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                : 'border-[#E6ECF5] dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>
        )}

        {/* Primary CTA (Screenshot 2 & 3) */}
        <button
          type="button"
          onClick={onOpenNewWorkflow}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workflow</span>
        </button>

        {/* Account Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <img
              src={userPhotoUrl || '/src/assets/images/avatar_enterprise_lead_1795690516596.jpg'}
              alt={profile?.displayName || 'User'}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 rounded-xl shadow-lg p-2 z-50">
              <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {profile?.displayName || 'Operations Lead'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Role: {profile?.role || 'Operator'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate('settings');
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Workspace Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-lg text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
