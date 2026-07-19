import { useSharedTripStore } from '../../store/TripStoreContext';
import { Panel, PrimaryButton, StatusBadge } from './shared/ui';

export function TripHealthPanel() {
  const { runTripHealthAudit, finalisationState, trackAnalyticsEvent } = useSharedTripStore();
  const report = finalisationState.lastTripHealth;

  return (
    <Panel
      title="Trip Health Score"
      description="Full audit for missing nights, overlaps, budget, documents, packing, and return journey gaps."
      actions={
        <PrimaryButton
          onClick={() => {
            runTripHealthAudit();
            trackAnalyticsEvent('feature_opened', { panel: 'trip-health' }, 'trip-health');
          }}
        >
          Run full audit
        </PrimaryButton>
      }
    >
      {!report ? (
        <p className="text-sm text-slate-400">No audit yet. Run a full trip validation to generate a score.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-3xl font-semibold text-white">
              {report.score}
              <span className="text-base text-slate-400">/100</span>
            </p>
            <StatusBadge
              label={`Grade ${report.grade}`}
              tone={report.grade === 'A' || report.grade === 'B' ? 'info' : report.grade === 'C' ? 'warning' : 'danger'}
            />
          </div>
          <p className="text-sm text-slate-300">{report.summary}</p>
          <ul className="space-y-2">
            {report.findings.map((finding) => (
              <li key={finding.id} className="rounded-xl border border-white/10 p-3 text-sm">
                <p className="font-medium text-white">
                  {finding.title}{' '}
                  <span className="text-xs uppercase tracking-wide text-slate-400">{finding.severity}</span>
                </p>
                <p className="mt-1 text-slate-300">{finding.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
