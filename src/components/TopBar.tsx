import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Download,
  Globe,
  Lightbulb,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import defaultAvatar from '../assets/images/avatar_enterprise_lead_1795690516596.jpg';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import {
  ApprovalItem,
  NavSection,
  NotificationItem,
  UserProfile,
  Workflow,
  Workspace,
} from '../types';

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
  notifications?: NotificationItem[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onArchiveNotification?: (id: string) => void;
  onNavigate: (section: NavSection) => void;
  profile: UserProfile | null;
  userPhotoUrl?: string | null;
  onSignOut: () => void;
  onInstallPwa?: () => void;
  onViewPublicWebsite?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  onSelectWorkspace?: (workspaceId: string) => void;
  onCreateNewOrg?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onOpenMobileMenu,
  darkMode,
  onToggleDarkMode,
  onRequestInsight,
  insightLoading,
  aiDrawerOpen,
  onToggleAiDrawer,
  pendingApprovals,
  failedWorkflows,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onArchiveNotification,
  onNavigate,
  profile,
  userPhotoUrl,
  onSignOut,
  onInstallPwa,
  onViewPublicWebsite,
  searchQuery = '',
  onSearchChange,
  workspaces = [],
  activeWorkspaceId = '',
  onSelectWorkspace,
  onCreateNewOrg,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const alertCount = pendingApprovals.length + failedWorkflows.length + unreadCount;
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'Escape') {
        setNotifOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-12 bg-[#FAFAFA] dark:bg-[#0E0E0E] border-b border-[#E5E5E5] dark:border-[#262626] px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-30">
      {/* Left: Mobile Menu + Top-Left Workspace Switcher (matching Plane) */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#161616] text-[#525252] dark:text-[#D4D4D4]"
        >
          <Menu className="w-4 h-4" />
        </button>

        {workspaces.length > 0 && onSelectWorkspace && onCreateNewOrg && (
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onSelectWorkspace={onSelectWorkspace}
            onCreateNewOrg={onCreateNewOrg}
            compactHeader
          />
        )}
      </div>

      {/* Center: Global Search Input */}
      <div className="hidden md:flex flex-1 max-w-md mx-auto">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={`Search ${activeWs?.name || 'workspace'}...`}
            className="w-full h-8 pl-8 pr-10 text-xs rounded-md bg-white dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-[#111111] dark:text-white placeholder:text-[#737373] focus:outline-none focus:border-[#111111] dark:focus:border-white transition-colors"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#737373]">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right: Minimal Utility Controls + AI Assistant Toggle + Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setMenuOpen(false);
            }}
            aria-label="Notifications"
            className="relative flex items-center justify-center w-8 h-8 rounded-md text-[#525252] dark:text-[#D4D4D4] hover:bg-[#EFEFEF] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[9px] font-mono font-semibold flex items-center justify-center tabular-nums">
                {alertCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-xl shadow-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
                <span className="text-xs font-semibold text-[#111111] dark:text-white">
                  Notifications
                </span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && onMarkAllNotificationsRead && (
                    <button
                      type="button"
                      onClick={onMarkAllNotificationsRead}
                      className="text-[11px] text-[#111111] dark:text-white hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <span className="text-[11px] font-mono text-[#737373] tabular-nums">
                    {alertCount}
                  </span>
                </div>
              </div>
              {alertCount === 0 && notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#737373]">
                  No notifications yet. Events from your workflows and team will appear here.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {notifications.map((ntf) => (
                    <div
                      key={ntf.id}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        ntf.read
                          ? 'border-transparent hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F]/60'
                          : 'border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onMarkNotificationRead?.(ntf.id);
                            if (ntf.linkSection) {
                              setNotifOpen(false);
                              onNavigate(ntf.linkSection);
                            }
                          }}
                          className="text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="text-xs font-semibold text-[#111111] dark:text-white truncate">
                            {ntf.title}
                          </div>
                          <div className="text-[11px] text-[#737373] line-clamp-2 mt-0.5">
                            {ntf.message}
                          </div>
                        </button>
                        {onArchiveNotification && (
                          <button
                            type="button"
                            onClick={() => onArchiveNotification(ntf.id)}
                            title="Archive notification"
                            className="text-[10px] text-[#737373] hover:text-[#111111] dark:hover:text-white px-1 cursor-pointer"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {pendingApprovals.map((apr) => (
                    <button
                      key={apr.id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        onNavigate('approvals');
                      }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F]/70 transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        Approval Required · {apr.riskLevel} risk
                      </div>
                      <div className="text-xs font-semibold text-[#111111] dark:text-white truncate mt-0.5">
                        {apr.workflowTitle}
                      </div>
                      <div className="text-[11px] text-[#737373] truncate">{apr.actionType}</div>
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
                      className="w-full text-left p-2.5 rounded-lg hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F]/70 transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-medium text-red-600 dark:text-red-400">
                        Workflow Failed · {wf.code}
                      </div>
                      <div className="text-xs font-semibold text-[#111111] dark:text-white truncate mt-0.5">
                        {wf.title}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              </div>
            </>
          )}
        </div>

        {/* Operational AI Insights Button */}
        <button
          type="button"
          onClick={onRequestInsight}
          disabled={insightLoading}
          title="Operational AI Insights"
          aria-label="Operational AI Insights"
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-md text-[#525252] dark:text-[#D4D4D4] hover:bg-[#EFEFEF] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer disabled:opacity-50"
        >
          {insightLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4" />
          )}
        </button>

        {/* PWA Install Button */}
        {onInstallPwa && (
          <button
            type="button"
            onClick={onInstallPwa}
            title="Install FLOWSTATE standalone app"
            aria-label="Install app"
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-md text-[#525252] dark:text-[#D4D4D4] hover:bg-[#EFEFEF] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Light / Dark Theme Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to Light theme' : 'Switch to Dark theme'}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-8 h-8 rounded-md text-[#525252] dark:text-[#D4D4D4] hover:bg-[#EFEFEF] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Docked AI Assistant Toggle (Plane Style) */}
        {activeSection !== 'command_center' && (
          <button
            type="button"
            onClick={onToggleAiDrawer}
            className={`inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              aiDrawerOpen
                ? 'border-[#D4D4D4] dark:border-[#333333] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-white'
                : 'border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#161616] text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white'
            }`}
          >
            {aiDrawerOpen ? <X className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>AI assistant</span>
          </button>
        )}

        {/* Account Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center p-0.5 rounded-full hover:bg-[#EFEFEF] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
          >
            <img
              src={userPhotoUrl || defaultAvatar}
              alt={profile?.displayName || 'User'}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-[#E5E5E5] dark:border-[#333333]"
            />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-xl shadow-lg p-2 z-50">
              <div className="px-2.5 py-2 border-b border-[#E5E5E5] dark:border-[#262626] mb-1">
                <div className="text-xs font-semibold text-[#111111] dark:text-white truncate">
                  {profile?.displayName || 'Operations Lead'}
                </div>
                <div className="text-[11px] text-[#737373]">
                  Role: {profile?.role || 'Operator'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate('settings');
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-[#404040] dark:text-[#D4D4D4] hover:bg-[#F2F2F2] dark:hover:bg-[#1F1F1F] cursor-pointer"
              >
                Workspace Settings
              </button>
              {onViewPublicWebsite && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onViewPublicWebsite();
                  }}
                  className="w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-lg text-xs text-[#404040] dark:text-[#D4D4D4] hover:bg-[#F2F2F2] dark:hover:bg-[#1F1F1F] cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public Website</span>
                </button>
              )}
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
            </>
          )}
        </div>
      </div>
    </header>
  );
};
