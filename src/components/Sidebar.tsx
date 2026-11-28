import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CheckSquare,
  ChevronDown,
  Download,
  Folder,
  GitBranch,
  Home,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Plus,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { NavSection, UserProfile, Workspace } from '../types';

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection, departmentFilter?: string) => void;
  pendingApprovalsCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  profile: UserProfile | null;
  userPhotoUrl?: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateNewOrg: () => void;
  onCreateDepartment?: (name: string) => void;
  onInstallPwa?: () => void;
  onOpenNewWorkflow?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onNavigate,
  pendingApprovalsCount,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateNewOrg,
  onCreateDepartment,
  onInstallPwa,
  onOpenNewWorkflow,
}) => {
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const departments = activeWs?.departments || [];
  const [addingDept, setAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [wsSwitcherOpen, setWsSwitcherOpen] = useState(false);

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDeptName.trim();
    if (!trimmed || !onCreateDepartment) return;
    onCreateDepartment(trimmed);
    setNewDeptName('');
    setAddingDept(false);
  };

  const mainNav: {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Home', icon: Home },
    { id: 'workflows', label: 'Workflows', icon: GitBranch },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'knowledge_base', label: 'Knowledge Base', icon: BookOpen },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const bottomNav: {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (isMobile = false) => (
    <div
      className={`flex flex-col h-full bg-[#FAFAFA] dark:bg-[#111111] border-r border-[#E5E5E5] dark:border-[#1F1F1F] select-none transition-all duration-200 ${
        collapsed && !isMobile ? 'w-14' : 'w-60'
      }`}
    >
      {/* ── Header: Workspace Switcher ── */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#1F1F1F] shrink-0">
        {collapsed && !isMobile ? (
          /* Collapsed: just the logo + expand button */
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="w-full flex items-center justify-center cursor-pointer"
          >
            <img
              src="/icons/favicon_io/apple-touch-icon.png"
              alt="FLOWSTATE"
              className="w-7 h-7 rounded-lg object-cover"
            />
          </button>
        ) : (
          <>
            {/* Workspace Name + chevron */}
            <div className="relative flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setWsSwitcherOpen((v) => !v)}
                className="w-full flex items-center gap-2 group cursor-pointer"
              >
                <img
                  src="/icons/favicon_io/apple-touch-icon.png"
                  alt="FLOWSTATE"
                  className="w-7 h-7 rounded-lg object-cover shrink-0"
                />
                <span className="font-display font-semibold text-[13px] text-[#111111] dark:text-white truncate flex-1 text-left">
                  {activeWs?.name || 'Workspace'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#737373] shrink-0 transition-transform ${wsSwitcherOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Workspace dropdown */}
              {wsSwitcherOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setWsSwitcherOpen(false)} />
                  <div className="absolute left-0 top-full mt-1.5 w-52 bg-white dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        onSelectWorkspace(ws.id);
                        setWsSwitcherOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                        ws.id === activeWorkspaceId
                          ? 'bg-[#F2F2F2] dark:bg-[#262626] text-[#111111] dark:text-white font-semibold'
                          : 'text-[#525252] dark:text-[#A3A3A3] hover:bg-[#F5F5F5] dark:hover:bg-[#222222]'
                      }`}
                    >
                      <span className="w-5 h-5 rounded bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[10px] font-bold flex items-center justify-center shrink-0 uppercase">
                        {ws.name.charAt(0)}
                      </span>
                      <span className="truncate">{ws.name}</span>
                    </button>
                  ))}
                  <div className="border-t border-[#E5E5E5] dark:border-[#262626] mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onCreateNewOrg();
                        setWsSwitcherOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#737373] hover:text-[#111111] dark:hover:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#222222] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New organization</span>
                    </button>
                  </div>
                  </div>
                </>
              )}
            </div>

            {/* Collapse / Close button */}
            {!isMobile ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                className="ml-1 w-6 h-6 flex items-center justify-center rounded text-[#737373] hover:text-[#111111] dark:hover:text-white hover:bg-[#EFEFEF] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer shrink-0"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onCloseMobile}
                className="ml-1 w-7 h-7 flex items-center justify-center rounded text-[#737373] hover:bg-[#EFEFEF] dark:hover:bg-[#1F1F1F] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto py-2 space-y-4">

        {/* + New workflow button */}
        {onOpenNewWorkflow && (
          <div className={`${collapsed && !isMobile ? 'px-1.5' : 'px-3'} pt-1`}>
            <button
              type="button"
              onClick={() => { onOpenNewWorkflow(); if (isMobile) onCloseMobile(); }}
              title="New workflow"
              className={`w-full flex items-center gap-2 rounded-md border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#161616] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-[#111111] dark:text-white text-xs font-medium transition-colors cursor-pointer ${
                collapsed && !isMobile ? 'justify-center py-2' : 'px-3 py-2'
              }`}
            >
              <Plus className="w-3.5 h-3.5 shrink-0 text-[#525252] dark:text-[#A3A3A3]" />
              {(!collapsed || isMobile) && <span>New workflow</span>}
            </button>
          </div>
        )}

        {/* Main navigation */}
        <nav data-tour="nav" className={`${collapsed && !isMobile ? 'px-1.5' : 'px-2'} space-y-0.5`}>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                data-tour={`nav-${item.id}`}
                type="button"
                onClick={() => { onNavigate(item.id); if (isMobile) onCloseMobile(); }}
                title={collapsed && !isMobile ? item.label : undefined}
                className={`relative w-full flex items-center rounded-md text-[13px] transition-colors cursor-pointer ${
                  collapsed && !isMobile ? 'justify-center gap-0 py-2.5' : 'gap-2.5 px-2.5 py-1.5'
                } ${
                  isActive
                    ? 'bg-[#ECECEC] dark:bg-[#1F1F1F] text-[#111111] dark:text-white font-semibold'
                    : 'text-[#525252] dark:text-[#A3A3A3] hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A] hover:text-[#111111] dark:hover:text-white font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#111111] dark:text-white' : 'text-[#737373]'
                  }`}
                />
                {(!collapsed || isMobile) && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-[#111111] text-white dark:bg-white dark:text-[#111111] tabular-nums font-semibold leading-none">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && !isMobile && item.badge !== undefined && (
                  <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-[#111111] dark:bg-white" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Departments */}
        {(!collapsed || isMobile) && (
          <div className="px-2">
            <div className="px-2 mb-1 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#A3A3A3] dark:text-[#737373] uppercase tracking-wider">
                Departments
              </span>
              {onCreateDepartment && (
                <button
                  type="button"
                  onClick={() => setAddingDept((v) => !v)}
                  title="Add department"
                  className="w-5 h-5 rounded flex items-center justify-center text-[#737373] hover:text-[#111111] dark:hover:text-white hover:bg-[#EFEFEF] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {addingDept && onCreateDepartment && (
              <form onSubmit={handleAddDepartment} className="px-1 mb-2 flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Department name..."
                  className="flex-1 min-w-0 px-2 py-1 text-xs rounded-md border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                />
                <button
                  type="submit"
                  disabled={!newDeptName.trim()}
                  className="px-2 py-1 rounded-md bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[11px] font-medium disabled:opacity-40 cursor-pointer"
                >
                  Add
                </button>
              </form>
            )}

            {departments.length === 0 ? (
              !addingDept && onCreateDepartment && (
                <button
                  type="button"
                  onClick={() => setAddingDept(true)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer text-left"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Create department</span>
                </button>
              )
            ) : (
              <div className="space-y-0.5">
                {departments.map((deptName) => (
                  <button
                    key={deptName}
                    type="button"
                    onClick={() => { onNavigate('workflows', deptName); if (isMobile) onCloseMobile(); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-[#525252] dark:text-[#A3A3A3] hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <Folder className="w-4 h-4 shrink-0 text-[#737373]" />
                    <span className="truncate">{deptName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom nav (Integrations + Settings) ── */}
      <div className={`border-t border-[#E5E5E5] dark:border-[#1F1F1F] pb-2 pt-1 ${collapsed && !isMobile ? 'px-1.5' : 'px-2'}`}>
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              data-tour={`nav-${item.id}`}
              type="button"
              onClick={() => { onNavigate(item.id); if (isMobile) onCloseMobile(); }}
              title={collapsed && !isMobile ? item.label : undefined}
              className={`w-full flex items-center rounded-md text-[13px] transition-colors cursor-pointer mt-0.5 ${
                collapsed && !isMobile ? 'justify-center py-2.5' : 'gap-2.5 px-2.5 py-1.5'
              } ${
                isActive
                  ? 'bg-[#ECECEC] dark:bg-[#1F1F1F] text-[#111111] dark:text-white font-semibold'
                  : 'text-[#525252] dark:text-[#A3A3A3] hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A] hover:text-[#111111] dark:hover:text-white font-medium'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#111111] dark:text-white' : 'text-[#737373]'
                }`}
              />
              {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Footer: role pill ── */}
      {(!collapsed || isMobile) && (
        <div className="px-3 pb-3 pt-1 border-t border-[#E5E5E5] dark:border-[#1F1F1F] flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F2F2F2] dark:bg-[#1A1A1A] text-[11px] font-medium text-[#525252] dark:text-[#A3A3A3] truncate">
            <span className="capitalize">{activeWs?.type === 'organization' ? 'Business' : 'Personal'}</span>
            <span className="text-[#A3A3A3] dark:text-[#737373]">· {activeWs?.role || 'Owner'}</span>
          </span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop single sidebar */}
      <aside className="hidden lg:flex h-full shrink-0 z-20">
        {sidebarContent(false)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <aside className="relative h-full shadow-2xl">
            {sidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
