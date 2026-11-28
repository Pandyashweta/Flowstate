import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Database,
  Kanban,
  Loader2,
  Mail,
  Play,
  Plug,
  Ticket,
  Webhook,
} from 'lucide-react';
import { apiPostJson } from '../lib/api';
import { IntegrationCategory, IntegrationItem } from '../types';

interface IntegrationsViewProps {
  integrations: IntegrationItem[];
  onUpdateIntegration: (
    item: IntegrationItem,
    patch: { status?: IntegrationItem['status']; endpointUrl?: string; executionsCount?: number }
  ) => Promise<void>;
  onLogTestRun: (entry: {
    workflowId: string;
    workflowTitle: string;
    eventType: string;
    summary: string;
    status: 'success' | 'failed';
    isSimulated: boolean;
    durationMs: number;
  }) => Promise<void>;
}

const CATEGORY_ICON: Record<IntegrationCategory, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  crm: Database,
  ticketing: Ticket,
  project_management: Kanban,
  calendar: Calendar,
  rest_api: Webhook,
};

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  integrations,
  onUpdateIntegration,
  onLogTestRun,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const [editingEndpoint, setEditingEndpoint] = useState<Record<string, string>>({});

  const handleTestConnector = async (item: IntegrationItem) => {
    setTestingId(item.id);
    setLastReceipt(null);
    try {
      const res = await apiPostJson<{
        success: boolean;
        isSimulated: boolean;
        referenceId: string;
        durationMs: number;
        receipt: string;
      }>('/api/integrations/execute', {
        integrationName: `${item.name} (${item.provider})`,
        actionType: 'Connector Health & Payload Test',
        payload: `Endpoint: ${item.endpointUrl || 'simulated'}`,
        isSimulated: true,
      });

      await onUpdateIntegration(item, {
        status: 'connected_simulated',
        executionsCount: item.executionsCount + 1,
      });
      await onLogTestRun({
        workflowId: `integration-${item.key}`,
        workflowTitle: item.name,
        eventType: 'integration_test_simulated',
        summary: res.receipt,
        status: 'success',
        isSimulated: true,
        durationMs: res.durationMs,
      });
      setLastReceipt(res.receipt);
    } catch (err) {
      setLastReceipt(err instanceof Error ? err.message : 'Test failed.');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Transparent Prototype Disclosure Banner */}
      <div className="rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
          <span className="font-semibold">Prototype Mode - Simulated External Integrations:</span>{' '}
          All enterprise connectors below run in clearly labeled{' '}
          <span className="font-mono font-semibold">Simulated Mode</span> when external OAuth/API
          credentials are not connected. Every simulated action produces a verifiable{' '}
          <span className="font-mono">[SIMULATED]</span> audit receipt and is never presented as a
          live third-party write.
        </div>
      </div>

      {lastReceipt && (
        <div className="rounded-xl bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] p-3.5 text-xs font-mono text-[#111111] dark:text-white">
          {lastReceipt}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {integrations.map((item) => {
          const Icon = CATEGORY_ICON[item.category] || Plug;
          const isEnabled = item.status !== 'disconnected';
          const endpointValue = editingEndpoint[item.id] ?? item.endpointUrl ?? '';

          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] dark:bg-[#1A1A1A] text-[#111111] dark:text-white flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-[#111111] dark:text-white">
                        {item.name}
                      </h3>
                      <div className="text-[11px] text-[#737373] dark:text-[#737373]">
                        {item.provider}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${
                      isEnabled
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-[#F2F2F2] dark:bg-[#202020] text-[#737373]'
                    }`}
                  >
                    {isEnabled ? 'Simulated' : 'Disabled'}
                  </span>
                </div>

                <p className="text-xs text-[#525252] dark:text-[#D4D4D4] leading-relaxed mb-3">
                  {item.description}
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[#737373]">
                    Connector Endpoint (Simulated Target)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={endpointValue}
                      onChange={(e) =>
                        setEditingEndpoint({ ...editingEndpoint, [item.id]: e.target.value })
                      }
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] font-mono text-[11px] text-[#404040] dark:text-[#D4D4D4]"
                    />
                    {editingEndpoint[item.id] !== undefined &&
                      editingEndpoint[item.id] !== item.endpointUrl && (
                        <button
                          type="button"
                          onClick={async () => {
                            await onUpdateIntegration(item, { endpointUrl: endpointValue });
                            setEditingEndpoint((prev) => {
                              const next = { ...prev };
                              delete next[item.id];
                              return next;
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[11px] font-medium cursor-pointer"
                        >
                          Save
                        </button>
                      )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-2">
                <div className="text-[11px] text-[#737373] dark:text-[#737373] font-mono tabular-nums">
                  {item.executionsCount} runs
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void onUpdateIntegration(item, {
                        status: isEnabled ? 'disconnected' : 'connected_simulated',
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#333333] text-xs font-medium text-[#404040] dark:text-[#E5E5E5] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] cursor-pointer"
                  >
                    {isEnabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    disabled={!isEnabled || testingId === item.id}
                    onClick={() => void handleTestConnector(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    {testingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>Test Run</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification Footer */}
      <div className="rounded-2xl bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] p-4 flex items-center gap-2.5 text-xs text-[#525252] dark:text-[#D4D4D4]">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Integration architecture supports Email, CRM, Ticketing, Project Management, Calendar, and
          Internal REST APIs with approval-gated dispatch.
        </span>
      </div>
    </div>
  );
};
