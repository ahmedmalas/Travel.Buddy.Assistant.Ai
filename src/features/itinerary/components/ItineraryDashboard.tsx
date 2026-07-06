import { itineraryTypeMeta } from '../data/itineraryTypes';
import type { ItineraryItem } from '../model/types';

type ItineraryDashboardProps = {
  upcomingCount: number;
  todayCount: number;
  nextReservation: ItineraryItem | null;
  countsByType: Record<ItineraryItem['type'], number>;
};

export function ItineraryDashboard({ upcomingCount, todayCount, nextReservation, countsByType }: ItineraryDashboardProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Upcoming events</p>
        <p className="mt-2 text-3xl font-bold text-white">{upcomingCount}</p>
      </article>
      <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Today's schedule</p>
        <p className="mt-2 text-3xl font-bold text-white">{todayCount}</p>
      </article>
      <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:col-span-2">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Next reservation</p>
        <p className="mt-2 text-base font-semibold text-white">{nextReservation?.title ?? 'No upcoming reservation'}</p>
        <p className="mt-1 text-xs text-slate-300">
          {nextReservation ? `${nextReservation.location || 'Location TBD'} • ${nextReservation.status}` : 'Create an event to get started.'}
        </p>
      </article>
      <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:col-span-2 xl:col-span-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Event counts by type</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(countsByType).map(([type, count]) => {
            const typedKey = type as ItineraryItem['type'];
            const meta = itineraryTypeMeta[typedKey];
            return (
              <span key={type} className={`rounded-full px-3 py-1 text-xs ${meta.badgeClassName}`}>
                {meta.icon} {meta.label}: {count}
              </span>
            );
          })}
        </div>
      </article>
    </section>
  );
}
