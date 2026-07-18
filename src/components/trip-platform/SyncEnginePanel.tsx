import { useSharedTripStore } from '../../store/TripStoreContext';
import { EmptyState, Panel, PrimaryButton, SecondaryButton, StatusBanner } from './shared/ui';

export function SyncEnginePanel() {
  const { syncState, syncSummary, runSync, retrySyncFailures, setSyncNetwork, queueEntityChange, activeVaultTrip } =
    useSharedTripStore();

  return (
    <Panel
      title="Sync engine foundation"
      description="Local change queue, revisions, conflicts, and retry states. No remote provider is connected yet."
    >
      {syncState.lastSyncMessage ? <StatusBanner kind="info" message={syncState.lastSyncMessage} /> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-300">Network</p>
          <p className="mt-2 text-xl font-semibold text-white">{syncSummary.network}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-300">Pending</p>
          <p className="mt-2 text-xl font-semibold text-white">{syncSummary.pending}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-300">Conflicts</p>
          <p className="mt-2 text-xl font-semibold text-white">{syncSummary.conflicts}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-300">Synced</p>
          <p className="mt-2 text-xl font-semibold text-white">{syncSummary.synced}</p>
        </article>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <PrimaryButton type="button" onClick={() => runSync()}>
          Run manual sync
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => retrySyncFailures()}>
          Retry failed/conflicts
        </SecondaryButton>
        <SecondaryButton type="button" onClick={() => setSyncNetwork(syncSummary.network === 'online' ? 'offline' : 'online')}>
          Toggle {syncSummary.network === 'online' ? 'offline' : 'online'}
        </SecondaryButton>
        <SecondaryButton
          type="button"
          onClick={() =>
            queueEntityChange('trip', activeVaultTrip.id, { tripName: activeVaultTrip.tripName }, activeVaultTrip.id)
          }
        >
          Queue active trip change
        </SecondaryButton>
      </div>

      <div className="mt-6 space-y-2">
        <h4 className="font-medium text-white">Change queue</h4>
        {syncState.queue.length === 0 ? (
          <EmptyState title="Queue empty" body="Edits can enqueue stable entity IDs with revision tracking." />
        ) : (
          syncState.queue.slice(0, 12).map((change) => (
            <article key={change.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
              <p className="text-white">
                {change.entityType} · {change.entityId} · r{change.revision}
              </p>
              <p className="mt-1">
                {change.status} · attempts {change.attempts}
                {change.lastError ? ` · ${change.lastError}` : ''}
              </p>
            </article>
          ))
        )}
      </div>

      {syncState.conflicts.length > 0 ? (
        <div className="mt-6 space-y-2">
          <h4 className="font-medium text-white">Conflicts</h4>
          {syncState.conflicts.slice(0, 8).map((conflict) => (
            <StatusBanner key={conflict.id} kind="error" message={conflict.message} />
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
