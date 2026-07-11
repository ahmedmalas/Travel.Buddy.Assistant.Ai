import { getDayLabel } from '../model/itinerary.utils';
import type { ItineraryDay } from '../model/itinerary.types';

type DayRailProps = {
  days: ItineraryDay[];
  activeDayId?: string;
  onSelectDay: (dayId: string) => void;
};

export function DayRail({ days, activeDayId, onSelectDay }: DayRailProps) {
  return (
    <aside className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Trip days</p>
      {days.map((day) => {
        const isActive = day.id === activeDayId;
        return (
          <button
            className={`w-full rounded-2xl border p-3 text-left transition ${
              isActive
                ? 'border-sky-300/60 bg-sky-500/10 text-sky-100'
                : 'border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.06]'
            }`}
            key={day.id}
            onClick={() => onSelectDay(day.id)}
            type="button"
          >
            <p className="font-semibold">{getDayLabel(day)}</p>
            <p className="mt-1 text-xs opacity-80">{day.activities.length} activity slot(s)</p>
            {day.title && <p className="mt-1 text-xs opacity-70">{day.title}</p>}
          </button>
        );
      })}
    </aside>
  );
}
