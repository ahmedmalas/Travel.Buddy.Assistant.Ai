import { useSharedTripStore } from '../../store/TripStoreContext';
import type { AssistanceSeverity } from '../../store/smartAssistance';
import { EmptyState, Panel, StatusBadge } from './shared/ui';

const severityTone = (severity: AssistanceSeverity): 'info' | 'warning' | 'danger' => {
  if (severity === 'critical') return 'danger';
  if (severity === 'warning') return 'warning';
  return 'info';
};

export function AssistancePanel() {
  const { smartAssistance } = useSharedTripStore();
  const suggestions = smartAssistance ?? [];

  return (
    <Panel
      title="Smart assistance"
      description="Rule-based itinerary tips — overlapping bookings, missing accommodation, excessive travel, and checklist deadlines. No external AI."
    >
      <div className="mt-2 space-y-3">
        {suggestions.length === 0 ? (
          <EmptyState title="No suggestions" body="Assistance appears when the active trip has schedule gaps, conflicts, or upcoming checklist deadlines." />
        ) : (
          suggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={suggestion.severity} tone={severityTone(suggestion.severity)} />
                    <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{suggestion.kind}</span>
                  </div>
                  <p className="mt-2 font-medium text-white">{suggestion.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{suggestion.detail}</p>
                  {suggestion.relatedIds.length > 0 ? (
                    <p className="mt-2 text-xs text-slate-500">Related: {suggestion.relatedIds.join(', ')}</p>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </Panel>
  );
}
