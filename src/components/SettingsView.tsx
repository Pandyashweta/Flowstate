import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Monitor,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Sun,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
import { SUPPORTED_VOICE_LANGUAGES } from '../hooks/useVoice';
import { apiDeleteJson, apiPatchJson, apiPostJson } from '../lib/api';
import {
  AuditLogItem,
  TeamMember,
  UserProfile,
  Workspace,
  WorkspaceRole,
} from '../types';

interface SettingsViewProps {
  profile: UserProfile | null;
  userEmail?: string | null;
  workspace?: Workspace | null;
  teamMembers: TeamMember[];
  auditLogs: AuditLogItem[];
  themePreference?: 'light' | 'dark' | 'system';
  onChangeTheme?: (theme: 'light' | 'dark' | 'system') => void;
  onUpdateProfile: (
    patch: Partial<Omit<UserProfile, 'uid' | 'role' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  onAddMember: (input: { name: string; role: WorkspaceRole; department: string }) => Promise<void>;
  onInviteMember?: (email: string, role: WorkspaceRole, department: string) => Promise<void>;
  onUpdateMemberRole: (member: TeamMember, role: WorkspaceRole) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onReplayTutorial?: () => void;
  onInstallPwa?: () => void;
  onSignedOut?: () => void;
}

const ORG_ROLES: WorkspaceRole[] = ['Owner', 'Admin', 'Manager', 'Member', 'Viewer'];

const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string[]> = {
  Owner: ['Full organization control', 'Transfer ownership & delete workspace', 'Manage admins, roles & security'],
  Admin: ['Manage members & invitations', 'Manage departments & integrations', 'Create/execute workflows & audit logs'],
  Manager: ['Manage assigned department ops', 'Invite members & assign tasks', 'Review & approve team requests'],
  Member: ['Create & execute permitted workflows', 'Create & update tasks', 'Upload & read documents'],
  Viewer: ['Read-only access to permitted items', 'Cannot create, execute, or modify records'],
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  userEmail,
  workspace,
  teamMembers,
  auditLogs,
  themePreference = 'system',
  onChangeTheme,
  onUpdateProfile,
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
  onReplayTutorial,
  onInstallPwa,
  onSignedOut,
}) => {
  const [tab, setTab] = useState<'profile' | 'security' | 'preferences' | 'team' | 'audit' | 'install'>('profile');

  // Personal & Org profile fields
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle || '');
  const [bio, setBio] = useState(profile?.professionalBackground || '');
  const [wsName, setWsName] = useState(workspace?.name || profile?.organizationName || '');
  const [orgLogoUrl, setOrgLogoUrl] = useState(workspace?.logoUrl || '');
  const [orgIndustry, setOrgIndustry] = useState(workspace?.industry || 'Software & Technology');
  const [orgWebsite, setOrgWebsite] = useState(workspace?.website || '');

  // Preferences
  const [voiceLang, setVoiceLang] = useState(profile?.voiceLanguage || 'en-US');
  const [autoSpeak, setAutoSpeak] = useState(profile?.autoSpeakResponses ?? true);
  const [requireApproval, setRequireApproval] = useState(profile?.requireApprovalForExternal ?? true);
  const [notifyApprovals, setNotifyApprovals] = useState(profile?.notifyApprovals ?? true);
  const [notifyFailures, setNotifyFailures] = useState(profile?.notifyFailures ?? true);
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
  const [dateFormat, setDateFormat] = useState(profile?.dateFormat || 'MMM d, yyyy');

  // Security: Change password & Delete account
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Team & RBAC filters + invite
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('Member');
  const [inviteDept, setInviteDept] = useState(workspace?.departments?.[0] || 'General');
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const isOrg = workspace?.type === 'organization';
  const canManageOrg = workspace?.role === 'Owner' || workspace?.role === 'Admin';

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setJobTitle(profile.jobTitle || '');
      setBio(profile.professionalBackground || '');
      setVoiceLang(profile.voiceLanguage || 'en-US');
      setAutoSpeak(profile.autoSpeakResponses ?? true);
      setRequireApproval(profile.requireApprovalForExternal ?? true);
      setNotifyApprovals(profile.notifyApprovals ?? true);
      setNotifyFailures(profile.notifyFailures ?? true);
      setTimezone(profile.timezone || 'UTC');
      setDateFormat(profile.dateFormat || 'MMM d, yyyy');
    }
    if (workspace) {
      setWsName(workspace.name);
      setOrgLogoUrl(workspace.logoUrl || '');
      setOrgIndustry(workspace.industry || 'Software & Technology');
      setOrgWebsite(workspace.website || '');
    }
  }, [profile, workspace]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const downloadAuditLogs = (format: 'csv' | 'json' | 'txt') => {
    if (auditLogs.length === 0) return;
    const wsSlug = (workspace?.name || 'workspace')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `flowstate-audit-logs-${wsSlug}-${dateStamp}.${format}`;

    let content = '';
    let mimeType = 'text/plain;charset=utf-8';

    if (format === 'csv') {
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = ['id', 'timestamp_iso', 'actor', 'event_type', 'workflow_title', 'status', 'duration_ms', 'summary'].join(',');
      const rows = auditLogs.map((log) =>
        [
          esc(log.id),
          esc(new Date(log.createdAtMs).toISOString()),
          esc(log.actor),
          esc(log.eventType),
          esc(log.workflowTitle),
          esc(log.status),
          esc(log.durationMs),
          esc(log.summary),
        ].join(',')
      );
      content = [header, ...rows].join('\n');
      mimeType = 'text/csv;charset=utf-8';
    } else if (format === 'json') {
      content = JSON.stringify(
        {
          workspaceId: workspace?.id || null,
          workspaceName: workspace?.name || 'Workspace',
          exportedAt: new Date().toISOString(),
          count: auditLogs.length,
          logs: auditLogs.map((log) => ({
            ...log,
            timestampIso: new Date(log.createdAtMs).toISOString(),
          })),
        },
        null,
        2
      );
      mimeType = 'application/json;charset=utf-8';
    } else {
      const lines = [
        `FLOWSTATE AUDIT LOG EXPORT`,
        `Workspace: ${workspace?.name || 'Workspace'} (${workspace?.id || 'local'})`,
        `Exported: ${new Date().toISOString()}`,
        `Total Events: ${auditLogs.length}`,
        '--------------------------------------------------------------------------------',
        ...auditLogs.map(
          (log) =>
            `[${new Date(log.createdAtMs).toISOString()}] [${log.status.toUpperCase()}] ${log.actor} | ${log.eventType} | ${log.workflowTitle} — ${log.summary}`
        ),
      ];
      content = lines.join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', `Downloaded ${auditLogs.length} audit log events as ${format.toUpperCase()}.`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPatchJson('/api/profile', {
        displayName: displayName.trim() || 'User',
        jobTitle: jobTitle.trim(),
        professionalBackground: bio.trim(),
      });
      await onUpdateProfile({
        displayName: displayName.trim() || 'User',
        jobTitle: jobTitle.trim(),
        professionalBackground: bio.trim(),
        organizationName: wsName.trim(),
      });
      if (workspace && canManageOrg && wsName.trim()) {
        await apiPatchJson(`/api/workspaces/${workspace.id}`, {
          name: wsName.trim(),
          logoUrl: orgLogoUrl,
          industry: orgIndustry,
          website: orgWebsite,
        }).catch(() => {});
      }
      showToast('success', 'Profile and workspace settings saved.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save profile.');
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPatchJson('/api/profile', {
        voiceLanguage: voiceLang,
        autoSpeakResponses: autoSpeak,
        requireApprovalForExternal: requireApproval,
        notifyApprovals,
        notifyFailures,
        themePreference,
        timezone,
        dateFormat,
      });
      await onUpdateProfile({
        voiceLanguage: voiceLang,
        autoSpeakResponses: autoSpeak,
        requireApprovalForExternal: requireApproval,
        notifyApprovals,
        notifyFailures,
        themePreference,
        timezone,
        dateFormat,
      });
      showToast('success', 'Preferences synchronized to your account.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save preferences.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('error', 'New password must be at least 6 characters.');
      return;
    }
    try {
      await apiPostJson('/api/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      showToast('success', 'Password updated securely.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Password update failed.');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'DELETE') return;
    try {
      await apiDeleteJson('/api/auth/account');
      onSignedOut?.();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Could not delete account.');
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return;
    try {
      if (onInviteMember) {
        await onInviteMember(inviteEmail.trim(), inviteRole, inviteDept);
      }
      setInviteEmail('');
      showToast('success', `Invitation sent to ${inviteEmail.trim()} as ${inviteRole}.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to send invitation.');
    }
  };

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      if (roleFilter !== 'All' && m.role !== roleFilter) return false;
      if (deptFilter !== 'All' && m.department !== deptFilter) return false;
      if (memberSearch.trim()) {
        const q = memberSearch.toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.department.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [teamMembers, roleFilter, deptFilter, memberSearch]);

  const tabs = [
    { id: 'profile', label: isOrg ? 'Profile & Organization' : 'Profile & Workspace', icon: User },
    { id: 'security', label: 'Password & Security', icon: KeyRound },
    { id: 'preferences', label: 'Preferences & Voice', icon: Monitor },
    ...(isOrg ? [{ id: 'team', label: 'Members & Permissions', icon: Users }] : []),
    { id: 'audit', label: `Audit Logs (${auditLogs.length})`, icon: Shield },
    { id: 'install', label: 'Install App (PWA)', icon: Building2 },
  ] as const;

  return (
    <div className="space-y-5 pb-10">
      {/* Segmented Settings Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] w-fit">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as typeof tab)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                tab === item.id
                  ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111]'
                  : 'text-[#525252] dark:text-[#D4D4D4] hover:bg-[#F2F2F2] dark:hover:bg-[#1F1F1F]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* 1. Profile & Workspace / Organization */}
      {tab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="max-w-3xl rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-6 space-y-5 text-xs"
        >
          <div>
            <h3 className="font-display text-base font-bold text-[#111111] dark:text-white">
              Personal Profile
            </h3>
            <p className="text-[#737373] dark:text-[#737373] mt-0.5">
              Your identity is shared across your Personal Workspace and all Organizations you join.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                Account Email
              </label>
              <input
                type="text"
                disabled
                value={userEmail || profile?.email || ''}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616]/60 text-[#737373]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Operations Lead"
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                Active Workspace Name
              </label>
              <input
                type="text"
                disabled={!canManageOrg && isOrg}
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616] disabled:opacity-60"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                Professional Background
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Your responsibilities and domain context..."
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
              />
            </div>
          </div>

          {isOrg && canManageOrg && (
            <div className="pt-4 border-t border-[#E5E5E5] dark:border-[#262626] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                  Organization Logo / Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] flex items-center justify-center overflow-hidden shrink-0">
                    {orgLogoUrl ? (
                      <img src={orgLogoUrl} alt={wsName} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-[#737373]" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#1A1A1A] text-xs font-medium text-[#111111] dark:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{orgLogoUrl ? 'Change Image' : 'Upload Logo'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file || file.size > 1024 * 1024) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setOrgLogoUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {orgLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setOrgLogoUrl('')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#737373] hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={orgIndustry}
                  onChange={(e) => setOrgIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                  Organization Website
                </label>
                <input
                  type="url"
                  value={orgWebsite}
                  onChange={(e) => setOrgWebsite(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {onReplayTutorial && (
              <button
                type="button"
                onClick={onReplayTutorial}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] text-[#404040] dark:text-[#E5E5E5] font-semibold hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Product Tutorial</span>
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-semibold cursor-pointer ml-auto"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* 2. Password & Security */}
      {tab === 'security' && (
        <div className="max-w-2xl space-y-5 text-xs">
          <form
            onSubmit={handleChangePassword}
            className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-6 space-y-4"
          >
            <h3 className="font-display text-base font-bold text-[#111111] dark:text-white">
              Change Password
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-semibold cursor-pointer"
            >
              Update Password
            </button>
          </form>

          <div className="rounded-2xl bg-white dark:bg-[#121212] border border-red-200 dark:border-red-900/60 p-6 space-y-3">
            <h3 className="font-display text-base font-bold text-red-700 dark:text-red-400">
              Delete Account
            </h3>
            <p className="text-[#525252] dark:text-[#737373] leading-relaxed">
              Permanently delete your account and personal workspace. Organization ownership must be transferred first if other members are active.
            </p>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                Delete My Account...
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="text"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="px-3 py-2 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-[#161616]"
                />
                <button
                  type="button"
                  disabled={confirmDeleteText !== 'DELETE'}
                  onClick={() => void handleDeleteAccount()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold cursor-pointer"
                >
                  Confirm Permanent Deletion
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] text-[#525252] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Preferences & Voice */}
      {tab === 'preferences' && (
        <form
          onSubmit={handleSavePreferences}
          className="max-w-2xl rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-6 space-y-5 text-xs"
        >
          <h3 className="font-display text-base font-bold text-[#111111] dark:text-white">
            Appearance, Regional & Voice Preferences
          </h3>

          <div>
            <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-2">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Monitor },
              ].map((t) => {
                const Icon = t.icon;
                const active = themePreference === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChangeTheme?.(t.id as 'light' | 'dark' | 'system')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold cursor-pointer ${
                      active
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-[#E5E5E5] dark:border-[#262626] text-[#525252] dark:text-[#737373]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                Voice Language
              </label>
              <select
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
              >
                {SUPPORTED_VOICE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1">
                Date Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
              >
                <option value="MMM d, yyyy">Nov 26, 2026</option>
                <option value="yyyy-MM-dd">2026-11-26</option>
                <option value="dd/MM/yyyy">26/11/2026</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Speak AI responses automatically when using voice</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Require human approval before external workflow actions</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyApprovals}
                onChange={(e) => setNotifyApprovals(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Notify me when approval requests arrive</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyFailures}
                onChange={(e) => setNotifyFailures(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Notify me if a workflow execution fails</span>
            </label>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-semibold cursor-pointer"
          >
            Save Preferences
          </button>
        </form>
      )}

      {/* 4. Organization Members & Granular Permission Management UI */}
      {tab === 'team' && isOrg && (
        <div className="space-y-5 text-xs">
          {/* Invite Bar (Only visible if user can invite) */}
          {canManageOrg && (
            <form
              onSubmit={handleInviteSubmit}
              className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5 space-y-3"
            >
              <h3 className="font-display text-sm font-bold text-[#111111] dark:text-white">
                Invite Organization Member
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="sm:col-span-5 px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                  className="sm:col-span-3 px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                >
                  {ORG_ROLES.filter((r) => r !== 'Owner').map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value)}
                  placeholder="Department"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
              </div>
            </form>
          )}

          {/* Member Directory with Search & Filters */}
          <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-sm font-bold text-[#111111] dark:text-white">
                Members & Roles ({filteredMembers.length})
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#737373] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#161616]"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#161616]"
                >
                  <option value="All">All Roles</option>
                  {ORG_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#161616]"
                >
                  <option value="All">All Departments</option>
                  {(workspace?.departments || []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="py-8 text-center text-[#737373]">
                No members match your current filters.
              </div>
            ) : (
              <div className="divide-y divide-[#E5E5E5] dark:divide-slate-800">
                {filteredMembers.map((m) => (
                  <div key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[#111111] dark:text-white">{m.name}</div>
                      <div className="text-[11px] text-[#737373]">
                        {m.department} • <span className="capitalize">{m.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageOrg && m.role !== 'Owner' ? (
                        <>
                          <select
                            value={m.role}
                            onChange={(e) => void onUpdateMemberRole(m, e.target.value as WorkspaceRole)}
                            className="px-2.5 py-1 rounded-lg border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616]"
                          >
                            {ORG_ROLES.filter((r) => r !== 'Owner').map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          {confirmRemoveId === m.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  void onRemoveMember(m.id);
                                  setConfirmRemoveId(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-red-600 text-white font-semibold cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveId(null)}
                                className="px-2 py-1 rounded-lg border border-[#E5E5E5] dark:border-[#333333] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveId(m.id)}
                              className="p-1.5 rounded-lg text-[#737373] hover:text-red-600 cursor-pointer"
                              title="Remove member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-[#F2F2F2] dark:bg-[#202020] font-mono text-[11px]">
                          {m.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Granular Role Permissions Reference */}
          <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5 space-y-3">
            <h4 className="font-display text-sm font-bold text-[#111111] dark:text-white">
              Role Permission Matrix (Enforced Server-Side)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {ORG_ROLES.map((r) => (
                <div
                  key={r}
                  className="p-3 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616]/60 space-y-1.5"
                >
                  <div className="font-bold text-[#111111] dark:text-white">{r}</div>
                  <ul className="space-y-1 text-[11px] text-[#737373] dark:text-[#737373]">
                    {ROLE_DESCRIPTIONS[r].map((desc, idx) => (
                      <li key={idx}>• {desc}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Audit Logs (Download / Export Only) */}
      {tab === 'audit' && (
        <div className="max-w-3xl rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-6 space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#E5E5E5] dark:border-[#262626]">
            <div>
              <h3 className="font-display text-base font-bold text-[#111111] dark:text-white">
                Download Workspace Audit Logs
              </h3>
              <p className="text-xs text-[#737373] mt-1">
                Export append-only records of verified executions, approvals, and permission updates in your preferred format.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] font-mono text-[11px] text-[#404040] dark:text-[#D4D4D4] shrink-0 w-fit">
              {auditLogs.length} {auditLogs.length === 1 ? 'event' : 'events'} available
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-10 text-center rounded-xl border border-dashed border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616]">
              <Shield className="w-6 h-6 text-[#737373] mx-auto mb-2" />
              <div className="text-sm font-semibold text-[#111111] dark:text-white">
                No audit events recorded yet
              </div>
              <p className="text-xs text-[#737373] mt-1">
                Audit exports will become available as workflows, approvals, and permission changes occur.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => downloadAuditLogs('csv')}
                className="group p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] hover:border-[#111111] dark:hover:border-white transition-all text-left flex flex-col justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#111111] dark:text-white">
                      CSV (.csv)
                    </div>
                    <p className="text-[11px] text-[#737373] mt-0.5 leading-relaxed">
                      Spreadsheet-ready table for Excel, Google Sheets, and compliance reviews.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111111] dark:text-white">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => downloadAuditLogs('json')}
                className="group p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] hover:border-[#111111] dark:hover:border-white transition-all text-left flex flex-col justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#111111] dark:text-white">
                      JSON (.json)
                    </div>
                    <p className="text-[11px] text-[#737373] mt-0.5 leading-relaxed">
                      Structured payload with full metadata for SIEM ingestion and developer tooling.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111111] dark:text-white">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => downloadAuditLogs('txt')}
                className="group p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] hover:border-[#111111] dark:hover:border-white transition-all text-left flex flex-col justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#111111] dark:text-white">
                      Plain Text (.txt)
                    </div>
                    <p className="text-[11px] text-[#737373] mt-0.5 leading-relaxed">
                      Chronological line-by-line log file for quick archival and reading.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111111] dark:text-white">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download TXT</span>
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. Install PWA */}
      {tab === 'install' && (
        <div className="max-w-3xl rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-6 space-y-6 text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5] dark:border-[#262626]">
            <div>
              <h3 className="font-display text-base font-bold text-[#111111] dark:text-white">
                Download & Install FLOWSTATE
              </h3>
              <p className="text-xs text-[#737373] dark:text-[#737373] mt-1">
                Install as a standalone progressive web application for desktop, tablet, and mobile.
              </p>
            </div>
            {onInstallPwa && (
              <button
                type="button"
                onClick={onInstallPwa}
                className="px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-semibold cursor-pointer text-xs"
              >
                Launch Install Prompt
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] space-y-2">
              <div className="font-semibold text-[#111111] dark:text-white">Desktop (Chrome / Edge)</div>
              <p className="text-[11px] text-[#737373] dark:text-[#737373]">
                Click the Install icon in the address bar or select &apos;Install FLOWSTATE&apos; from the browser menu.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] space-y-2">
              <div className="font-semibold text-[#111111] dark:text-white">Android</div>
              <p className="text-[11px] text-[#737373] dark:text-[#737373]">
                Open in Chrome, tap the menu (⋮), and choose &apos;Install app&apos; or &apos;Add to Home screen&apos;.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] space-y-2">
              <div className="font-semibold text-[#111111] dark:text-white">iOS / Safari</div>
              <p className="text-[11px] text-[#737373] dark:text-[#737373]">
                Tap Share in Safari toolbar, scroll down, and tap &apos;Add to Home Screen&apos;.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
