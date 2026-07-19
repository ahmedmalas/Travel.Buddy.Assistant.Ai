import { useMemo } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { buildOpsDashboard } from '../../finalisation';
import { Panel, StatusBadge } from './shared/ui';

export function OpsDashboardPanel() {
  const { finalisationState, syncState } = useSharedTripStore();
  const model = useMemo(
    () =>
      buildOpsDashboard({
        offline: finalisationState.offline,
        syncState,
        analytics: finalisationState.analytics,
        featureFlags: finalisationState.featureFlags,
        importHistory: finalisationState.importHistory,
      }),
    [finalisationState, syncState],
  );

  return (
    <Panel
      title="Operations dashboard"
      description="Internal health, sync queue, imports, analytics, storage, and performance baselines."
      actions={
        <StatusBadge
          label={model.applicationHealth}
          tone={
            model.applicationHealth === 'healthy'
              ? 'info'
              : model.applicationHealth === 'degraded'
                ? 'warning'
                : 'danger'
          }
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-white/10 p-3 text-sm text-slate-300">
          <h4 className="font-medium text-white">Offline / network</h4>
          <p className="mt-1">{model.offline.message}</p>
          <p className="mt-1 text-xs text-slate-500">Mode: {model.offline.uiMode}</p>
        </section>
        <section className="rounded-xl border border-white/10 p-3 text-sm text-slate-300">
          <h4 className="font-medium text-white">Sync queue</h4>
          <p className="mt-1">
            Pending {model.sync.pending} · Failed {model.sync.failed} · Network {model.sync.network}
          </p>
          <p className="mt-1 text-xs text-slate-500">Last sync: {model.sync.lastSyncAt ?? 'never'}</p>
        </section>
        <section className="rounded-xl border border-white/10 p-3 text-sm text-slate-300">
          <h4 className="font-medium text-white">Storage</h4>
          <p className="mt-1">{model.storage.totalBytes.toLocaleString()} bytes across local keys</p>
          <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-400">
            {model.storage.items.slice(0, 8).map((item) => (
              <li key={item.key}>
                {item.category}: {item.key} ({item.bytes})
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-white/10 p-3 text-sm text-slate-300">
          <h4 className="font-medium text-white">Analytics (local)</h4>
          <p className="mt-1">{model.analytics.totalEvents} events tracked — no external service</p>
          <ul className="mt-2 text-xs text-slate-400">
            {Object.entries(model.analytics.byName).map(([name, count]) => (
              <li key={name}>
                {name}: {count}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-white/10 p-3 text-sm text-slate-300 md:col-span-2">
          <h4 className="font-medium text-white">Performance baseline</h4>
          <p className="mt-1">
            Pre-finalisation main chunk ~{model.performance.beforeMainChunkKb} KB. Techniques:{' '}
            {model.performance.techniques.join('; ')}.
          </p>
          <h4 className="mt-3 font-medium text-white">Diagnostics</h4>
          {model.diagnostics.length === 0 ? (
            <p className="mt-1 text-emerald-200">No active diagnostics.</p>
          ) : (
            <ul className="mt-1 list-disc pl-5">
              {model.diagnostics.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <h4 className="mt-3 font-medium text-white">Import history</h4>
          {model.importHistory.length === 0 ? (
            <p className="mt-1 text-slate-400">No imports yet.</p>
          ) : (
            <ul className="mt-1 text-xs text-slate-400">
              {model.importHistory.map((item) => (
                <li key={item.id}>
                  {item.fileName} · {item.entities} entities · {item.confidence}%
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Panel>
  );
}
