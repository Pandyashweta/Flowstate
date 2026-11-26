import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Plus,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { Workspace, WorkspaceRole, WorkspaceType } from '../types';

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateNewOrg: () => void;
  collapsed?: boolean;
  compactHeader?: boolean;
}

const ROLE_BADGE_STYLES: Record<WorkspaceRole, { bg: string; text: string }> = {
  Owner: { bg: 'bg-[#EFEFEF] dark:bg-[#262626]', text: 'text-[#111111] dark:text-white' },
  Admin: { bg: 'bg-[#EFEFEF] dark:bg-[#262626]', text: 'text-[#111111] dark:text-white' },
  Manager: { bg: 'bg-[#F5F5F5] dark:bg-[#202020]', text: 'text-[#404040] dark:text-[#D4D4D4]' },
  Member: { bg: 'bg-[#F5F5F5] dark:bg-[#202020]', text: 'text-[#525252] dark:text-[#A3A3A3]' },
  Viewer: { bg: 'bg-[#F5F5F5] dark:bg-[#202020]', text: 'text-[#737373]' },
};

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateNewOrg,
  collapsed = false,
  compactHeader = false,
}) => {
  const [open, setOpen] = useState(false);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;

  if (!activeWorkspace) return null;

  const roleStyle = ROLE_BADGE_STYLES[activeWorkspace.role] || ROLE_BADGE_STYLES.Member;

  return (
    <div className={compactHeader || collapsed ? 'relative' : 'relative w-full'}>
      {collapsed ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title={activeWorkspace.name}
          className="w-10 h-10 rounded-xl bg-[#F2F2F2] dark:bg-[#202020] flex items-center justify-center text-[#111111] dark:text-white hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] transition-colors mx-auto cursor-pointer"
        >
          {activeWorkspace.logoUrl ? (
            <img
              src={activeWorkspace.logoUrl}
              alt={activeWorkspace.name}
              className="w-6 h-6 rounded-md object-cover"
            />
          ) : activeWorkspace.type === 'personal' ? (
            <Briefcase className="w-4 h-4" />
          ) : (
            <Building2 className="w-4 h-4" />
          )}
        </button>
      ) : compactHeader ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer max-w-[220px]"
        >
          {activeWorkspace.logoUrl ? (
            <img
              src={activeWorkspace.logoUrl}
              alt={activeWorkspace.name}
              className="w-5 h-5 rounded-md object-cover shrink-0 border border-[#E5E5E5] dark:border-[#262626]"
            />
          ) : (
            <div className="w-5 h-5 rounded-md bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center shrink-0">
              {activeWorkspace.type === 'personal' ? (
                <Briefcase className="w-3 h-3" />
              ) : (
                <Building2 className="w-3 h-3" />
              )}
            </div>
          )}
          <span className="font-semibold text-[13px] text-[#111111] dark:text-white truncate">
            {activeWorkspace.name}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#737373] shrink-0" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full p-2 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] hover:bg-[#F2F2F2] dark:hover:bg-[#1F1F1F]/80 transition-all flex items-center justify-between gap-2.5 cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {activeWorkspace.logoUrl ? (
              <img
                src={activeWorkspace.logoUrl}
                alt={activeWorkspace.name}
                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[#E5E5E5] dark:border-[#262626]"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#111111] dark:bg-white text-white dark:text-[#111111]">
                {activeWorkspace.type === 'personal' ? (
                  <Briefcase className="w-4 h-4" />
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-[#111111] dark:text-white truncate">
                  {activeWorkspace.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${roleStyle.bg} ${roleStyle.text}`}
                >
                  {activeWorkspace.role}
                </span>
                <span className="text-[10px] text-[#737373] capitalize">
                  • {activeWorkspace.type}
                </span>
              </div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#737373] shrink-0" />
        </button>
      )}

      {/* Dropdown Menu */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-xl shadow-xl p-2 z-40 space-y-1 ${
              collapsed
                ? 'left-full top-0 ml-2 w-64'
                : compactHeader
                ? 'left-0 top-full mt-2 w-64'
                : 'left-0 right-0 top-full mt-2'
            }`}
          >
            <div className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[#737373] font-semibold">
              Workspaces ({workspaces.length})
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                const rStyle = ROLE_BADGE_STYLES[ws.role] || ROLE_BADGE_STYLES.Member;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      onSelectWorkspace(ws.id);
                      setOpen(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#F5F5F5] dark:bg-[#1F1F1F] text-[#111111] dark:text-white font-semibold'
                        : 'hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] text-[#404040] dark:text-[#D4D4D4]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {ws.logoUrl ? (
                        <img
                          src={ws.logoUrl}
                          alt={ws.name}
                          className="w-7 h-7 rounded-md object-cover shrink-0 border border-[#E5E5E5] dark:border-[#262626]"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-[#EFEFEF] dark:bg-[#262626] text-[#111111] dark:text-white">
                          {ws.type === 'personal' ? (
                            <Briefcase className="w-3.5 h-3.5" />
                          ) : (
                            <Building2 className="w-3.5 h-3.5" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#111111] dark:text-white truncate">{ws.name}</div>
                        <div className="text-[10px] text-[#737373] flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-medium text-[9px] ${rStyle.bg} ${rStyle.text}`}>
                            {ws.role}
                          </span>
                          <span className="capitalize">{ws.type}</span>
                        </div>
                      </div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-[#111111] dark:text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-[#E5E5E5] dark:border-[#262626]">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onCreateNewOrg();
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-[#111111] dark:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#737373]" />
                <span>Create New Organization</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
