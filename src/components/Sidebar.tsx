import React from 'react';
import {
  BarChart3,
  BookOpen,
  CheckSquare,
  ChevronRight,
  GitBranch,
  Home,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { NavSection, UserProfile } from '../types';

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
}

const DEPARTMENTS = [
  { name: 'Customer Support', color: 'bg-blue-500' },
  { name: 'IT Operations', color: 'bg-indigo-500' },
  { name: 'Billing & Finance', color: 'bg-emerald-500' },
  { name: 'HR Management', color: 'bg-amber-500' },
  { name: 'Sales Ops', color: 'bg-sky-500' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onNavigate,
  pendingApprovalsCount,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  profile,
  userPhotoUrl,
  searchQuery,
  onSearchChange,
}) => {
  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'command_center', label: 'AI Command Center', icon: Mic },
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
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0F172A] border-r border-[#E6ECF5] dark:border-slate-800/90 select-none">
      {/* Brand Row */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#F0F3F9] dark:border-slate-800/80 shrink-0">
        <button
          type="button"
          onClick={() => {
            onNavigate('overview');
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xs shrink-0">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-white" fill="none">
              <path
                d="M12 3L19.5 7.5V16.5L12 21L4.5 16.5V7.5L12 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12 8V16M8.5 10L12 12L15.5 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-[17px] tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              FLOWSTATE
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sidebar Search */}
      {!collapsed && (
        <div className="px-3.5 pt-3.5 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-10 py-1.5 text-xs rounded-lg bg-[#F5F7FB] dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
              ⌘K
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-5">
        <div>
          {!collapsed && (
            <div className="px-2.5 mb-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wide">
              Workspace
            </div>
          )}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer relative ${
                    isActive
                      ? 'bg-[#EEF4FF] dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate whitespace-nowrap flex-1 text-left">{item.label}</span>
                  )}
                  {!collapsed && item.badge !== undefined && (
                    <span className="font-mono tabular-nums text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Departments / Projects section matching Screenshots 1 & 3 */}
        {!collapsed && (
          <div>
            <div className="px-2.5 mb-1.5 flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wide">
              <span>Departments</span>
            </div>
            <div className="space-y-0.5">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept.name}
                  type="button"
                  onClick={() => {
                    onNavigate('workflows', dept.name);
                    onCloseMobile();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12.5px] text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                >
                  <span className={`w-2 h-2 rounded-xs ${dept.color} shrink-0`} />
                  <span className="truncate flex-1 text-left">{dept.name}</span>
                  <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom AI Copilot Launcher Card (Screenshot 2) + Profile Footer (Screenshots 1 & 2) */}
      <div className="p-3 border-t border-[#F0F3F9] dark:border-slate-800/80 space-y-2.5 shrink-0">
        {!collapsed && (
          <div className="rounded-xl p-3 bg-gradient-to-br from-[#EEF4FF] to-[#F5F3FF] dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white mb-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Voice AI Copilot</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2.5">
              Speak or describe any business workflow to orchestrate tasks instantly.
            </p>
            <button
              type="button"
              onClick={() => {
                onNavigate('command_center');
                onCloseMobile();
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-slate-700 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Open Command Center →
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onNavigate('settings');
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
        >
          <img
            src={userPhotoUrl || '/src/assets/images/avatar_enterprise_lead_1795690516596.jpg'}
            alt={profile?.displayName || 'Workspace User'}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {profile?.displayName || 'Operations Lead'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {profile?.role || 'Operator'} · {profile?.organizationName || 'Flowstate HQ'}
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-[width] duration-200 ${
          collapsed ? 'w-[72px]' : 'w-[248px]'
        }`}
      >
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-[264px] max-w-[85vw] h-full shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
