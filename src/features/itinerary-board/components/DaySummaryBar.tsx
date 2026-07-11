import type { DaySummaryMetrics } from '../model/itinerary.types';

type DaySummaryBarProps = {
  metrics: DaySummaryMetrics;
};

export function DaySummaryBar({ metrics }: DaySummaryBarProps) {
  return (
    <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Activities</p>
        <p className="mt-1 text-xl font-semibold text-white">{metrics.activityCount}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Planned time</p>
        <p className="mt-1 text-xl font-semibold text-white">{metrics.totalPlannedMinutes}m</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Buffer</p>
        <p className="mt-1 text-xl font-semibold text-white">{metrics.totalBufferMinutes}m</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Conflicts</p>
        <p className={`mt-1 text-xl font-semibold ${metrics.conflictCount > 0 ? 'text-amber-200' : 'text-emerald-200'}`}>
          {metrics.conflictCount}
        </p>
      </div>
    </div>
  );
}
