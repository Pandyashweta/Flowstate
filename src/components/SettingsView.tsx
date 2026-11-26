import React, { useState } from 'react';
import { CheckCircle2, Plus, Shield, Trash2, Users } from 'lucide-react';
import { SUPPORTED_VOICE_LANGUAGES } from '../hooks/useVoice';
import { AuditLogItem, TeamMember, UserProfile, UserRole } from '../types';

interface SettingsViewProps {
  profile: UserProfile | null;
  userEmail?: string | null;
  teamMembers: TeamMember[];
  auditLogs: AuditLogItem[];
  onUpdateProfile: (
    patch: Partial<Omit<UserProfile, 'uid' | 'role' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  onAddMember: (input: { name: string; role: UserRole; department: string }) => Promise<void>;
  onUpdateMemberRole: (member: TeamMember, role: UserRole) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
}

const ROLES: UserRole[] = ['Admin', 'Approver', 'Operator', 'Viewer'];

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  userEmail,
  teamMembers,
  auditLogs,
  onUpdateProfile,
  onAddMember,
  onUpdateMemberRole,
  onRemoveMember,
}) => {
  const [tab, setTab] = useState<'profile' | 'team' | 'ai' | 'audit'>('profile');

  // Profile & org form
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [orgName, setOrgName] = useState(profile?.organizationName || '');
  const [voiceLang, setVoiceLang] = useState(profile?.voiceLanguage || 'en-US');
  const [autoSpeak, setAutoSpeak] = useState(profile?.autoSpeakResponses ?? true);
  const [requireApproval, setRequireApproval] = useState(
    profile?.requireApprovalForExternal ?? true
  );
  const [notifyApprovals, setNotifyApprovals] = useState(profile?.notifyApprovals ?? true);
  const [notifyFailures, setNotifyFailures] = useState(profile?.notifyFailures ?? true);
  const [savedBanner, setSavedBanner] = useState(false);

  // Team member form
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState<UserRole>('Operator');
  const [memberDept, setMemberDept] = useState('Customer Support');

  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setDepartment(profile.department);
      setOrgName(profile.organizationName);
      setVoiceLang(profile.voiceLanguage || 'en-US');
      setAutoSpeak(profile.autoSpeakResponses ?? true);
      setRequireApproval(profile.requireApprovalForExternal ?? true);
      setNotifyApprovals(profile.notifyApprovals ?? true);
      setNotifyFailures(profile.notifyFailures ?? true);
    }
  }, [profile]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile({
      displayName: displayName.trim() || 'Operations Lead',
      department: department.trim() || 'Enterprise Operations',
      organizationName: orgName.trim() || 'Flowstate Enterprise HQ',
      voiceLanguage: voiceLang,
      autoSpeakResponses: autoSpeak,
      requireApprovalForExternal: requireApproval,
      notifyApprovals,
      notifyFailures,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    await onAddMember({
      name: memberName.trim(),
      role: memberRole,
      department: memberDept.trim() || 'Operations',
    });
    setMemberName('');
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Segmented Settings Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 w-fit">
        {[
          { id: 'profile', label: 'Profile & Organization' },
          { id: 'team', label: 'Team & RBAC' },
          { id: 'ai', label: 'AI & Notifications' },
          { id: 'audit', label: `Audit Logs (${auditLogs.length})` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as typeof tab)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              tab === item.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {savedBanner && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Workspace settings saved to Firestore.</span>
        </div>
      )}

      {/* Profile & Organization */}
      {tab === 'profile' && (
        <form
          onSubmit={handleSaveSettings}
          className="max-w-2xl rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 p-6 space-y-4 text-xs"
        >
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            User Profile & Organization
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Verified Account Email (Private)
              </label>
              <input
                type="text"
                disabled
                value={userEmail || 'Authenticated via Google'}
                className="w-full px-3 py-2 rounded-lg border border-[#E6ECF5] dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  Assigned Access Role: {profile?.role || 'Operator'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Enforced via server-verified Firebase ID tokens and Firestore security rules
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
          >
            Save Changes
          </button>
        </form>
      )}

      {/* Team & RBAC */}
      {tab === 'team' && (
        <div className="space-y-4">
          <form
            onSubmit={handleAddTeam}
            className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 p-5 flex flex-wrap items-end gap-3 text-xs"
          >
            <div className="flex-1 min-w-[180px]">
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Team Member Name
              </label>
              <input
                type="text"
                required
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="e.g., Jordan Alvarez"
                className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="w-44">
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={memberDept}
                onChange={(e) => setMemberDept(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="w-36">
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                RBAC Role
              </label>
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </form>

          <div className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Organization Directory ({teamMembers.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {teamMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {m.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {m.department}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={m.role}
                          onChange={(e) => void onUpdateMemberRole(m, e.target.value as UserRole)}
                          className="px-2.5 py-1 rounded-md border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => void onRemoveMember(m.id)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI & Notification Preferences */}
      {tab === 'ai' && (
        <form
          onSubmit={handleSaveSettings}
          className="max-w-2xl rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 p-6 space-y-5 text-xs"
        >
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            AI Voice, Governance & Notification Preferences
          </h3>

          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
              Default Speech Recognition & TTS Language
            </label>
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              className="w-full max-w-xs px-3 py-2 rounded-lg border border-[#DDE4F2] dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              {SUPPORTED_VOICE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {[
              {
                label: 'Auto-speak AI Command Center responses (Text-to-Speech)',
                checked: autoSpeak,
                onChange: setAutoSpeak,
              },
              {
                label: 'Require human approval before executing external integration actions',
                checked: requireApproval,
                onChange: setRequireApproval,
              },
              {
                label: 'Notify me when new approval requests enter the review queue',
                checked: notifyApprovals,
                onChange: setNotifyApprovals,
              },
              {
                label: 'Notify me immediately on failed workflows or integration timeouts',
                checked: notifyFailures,
                onChange: setNotifyFailures,
              },
            ].map((toggle) => (
              <label
                key={toggle.label}
                className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 cursor-pointer"
              >
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  {toggle.label}
                </span>
                <input
                  type="checkbox"
                  checked={toggle.checked}
                  onChange={(e) => toggle.onChange(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
          >
            Save Preferences
          </button>
        </form>
      )}

      {/* Immutable Audit Log Viewer */}
      {tab === 'audit' && (
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E6ECF5] dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Immutable Execution & Security Audit Trail
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Append-only records protected against client modification or deletion by Firestore
              security rules.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Workflow / Event</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap tabular-nums">
                      {new Date(log.createdAtMs).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {log.actor}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {log.workflowTitle}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">{log.eventType}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                      {log.summary}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                      {log.isSimulated ? 'Simulated' : 'Live DB'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
