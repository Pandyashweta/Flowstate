import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { ApprovalItem, UserProfile } from '../types';

interface ApprovalsViewProps {
  approvals: ApprovalItem[];
  profile: UserProfile | null;
  onResolveApproval: (
    approval: ApprovalItem,
    decision: 'approved' | 'rejected' | 'changes_requested',
    note: string
  ) => Promise<unknown>;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  approvals,
  profile,
  onResolveApproval,
}) => {
  const [filter, setFilter] = useState<'pending' | 'resolved'>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canAuthorize = profile?.role !== 'Viewer';

  const list = useMemo(() => {
    if (filter === 'pending') {
      return approvals.filter((a) => a.status === 'pending' || a.status === 'changes_requested');
    }
    return approvals.filter((a) => a.status === 'approved' || a.status === 'rejected');
  }, [approvals, filter]);

  const handleAction = async (
    apr: ApprovalItem,
    decision: 'approved' | 'rejected' | 'changes_requested'
  ) => {
    if (!canAuthorize || busyId) return;
    setBusyId(apr.id);
    setFeedback(null);
    try {
      await onResolveApproval(apr, decision, notes[apr.id] || '');
      setFeedback(
        decision === 'approved'
          ? `Authorized "${apr.actionType}" and executed via ${apr.integrationTarget}. Audit trail updated.`
          : decision === 'rejected'
          ? `Rejected "${apr.actionType}" and halted linked workflow.`
          : `Requested modifications on "${apr.actionType}" and paused linked workflow.`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Approval action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-display text-base font-bold text-[#111111] dark:text-white">
              Human-in-the-Loop Approvals Center
            </h2>
          </div>
          <p className="text-xs text-[#737373] dark:text-[#737373] mt-1">
            AI agents cannot execute sensitive external actions without explicit human review.
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-lg bg-[#F5F5F5] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626]">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
              filter === 'pending'
                ? 'bg-white dark:bg-[#202020] text-[#111111] dark:text-white shadow-xs'
                : 'text-[#737373]'
            }`}
          >
            Pending Review ({approvals.filter((a) => a.status === 'pending' || a.status === 'changes_requested').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
              filter === 'resolved'
                ? 'bg-white dark:bg-[#202020] text-[#111111] dark:text-white shadow-xs'
                : 'text-[#737373]'
            }`}
          >
            Decision History ({approvals.filter((a) => a.status === 'approved' || a.status === 'rejected').length})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
          {feedback}
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-12 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2.5" />
          <div className="text-sm font-semibold text-[#111111] dark:text-white">
            {filter === 'pending' ? 'No pending approval requests' : 'No completed decisions yet'}
          </div>
          <p className="text-xs text-[#737373] dark:text-[#737373] mt-1">
            Trigger a workflow in the AI Command Center to see approval gates appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((apr) => {
            const isBusy = busyId === apr.id;
            const isEditable = apr.status === 'pending' || apr.status === 'changes_requested';
            return (
              <div
                key={apr.id}
                className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-semibold uppercase text-[11px] ${
                          apr.riskLevel === 'high'
                            ? 'text-red-600 dark:text-red-400'
                            : apr.riskLevel === 'medium'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {apr.riskLevel} risk
                      </span>
                      <span className="text-slate-300 dark:text-[#404040]">·</span>
                      <span className="text-[#737373] dark:text-[#737373]">
                        Target: {apr.integrationTarget}
                      </span>
                      {apr.isSimulated && (
                        <>
                          <span className="text-slate-300 dark:text-[#404040]">·</span>
                          <span className="font-mono text-[11px] text-amber-700 dark:text-amber-300">
                            Simulated Integration
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-base font-bold text-[#111111] dark:text-white mt-1">
                      {apr.workflowTitle} — {apr.actionType}
                    </h3>
                    <div className="text-[11px] text-[#737373] dark:text-[#737373] mt-0.5">
                      Requested by {apr.requestedBy} ·{' '}
                      {new Date(apr.createdAtMs).toLocaleString()}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                      apr.status === 'approved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : apr.status === 'rejected'
                        ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                        : apr.status === 'changes_requested'
                        ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300'
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {apr.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Reason & Proposed Action Payload */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626]">
                    <div className="font-semibold text-[#262626] dark:text-[#E5E5E5] mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Reason for Human Authorization
                    </div>
                    <p className="text-[#525252] dark:text-[#D4D4D4] leading-relaxed">
                      {apr.reason}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626]">
                    <div className="font-semibold text-[#262626] dark:text-[#E5E5E5] mb-1">
                      Proposed Action Payload
                    </div>
                    <pre className="font-mono text-[11px] text-[#525252] dark:text-[#D4D4D4] whitespace-pre-wrap break-words">
                      {apr.proposedPayload}
                    </pre>
                  </div>
                </div>

                {isEditable ? (
                  <div className="space-y-3 pt-2 border-t border-[#E5E5E5] dark:border-[#262626]">
                    <input
                      type="text"
                      value={notes[apr.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [apr.id]: e.target.value })}
                      placeholder="Optional reviewer note or requested modification..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#161616] text-xs"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!canAuthorize || isBusy}
                        onClick={() => void handleAction(apr, 'approved')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Approve & Execute</span>
                      </button>

                      <button
                        type="button"
                        disabled={!canAuthorize || isBusy}
                        onClick={() => void handleAction(apr, 'changes_requested')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Request Modifications</span>
                      </button>

                      <button
                        type="button"
                        disabled={!canAuthorize || isBusy}
                        onClick={() => void handleAction(apr, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      {!canAuthorize && (
                        <span className="text-[11px] text-[#737373] ml-auto">
                          Viewer role cannot authorize workflow actions.
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#E5E5E5] dark:border-[#262626] text-xs text-[#737373] dark:text-[#737373]">
                    Reviewed by <span className="font-semibold text-[#262626] dark:text-[#E5E5E5]">{apr.reviewedBy || 'Approver'}</span>
                    {apr.reviewerNote ? ` — "${apr.reviewerNote}"` : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
