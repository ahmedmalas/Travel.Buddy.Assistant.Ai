import { TagChip } from '../../../shared/components/TagChip';
import type { PlaceReminderCounts } from '../model/destinationWorkspace.types';

type WorkspaceHeaderProps = {
  destinationName: string;
  placesCount: number;
  mapReadyCount: number;
  reminderCounts: PlaceReminderCounts;
  mapPointsCount: number;
};

export function WorkspaceHeader({
  destinationName,
  placesCount,
  mapReadyCount,
  reminderCounts,
  mapPointsCount,
}: WorkspaceHeaderProps) {
  const remindersDue = reminderCounts.overdue + reminderCounts.today;

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-indigo-500/5 p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-sky-200">Destination command centre</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{destinationName}</h3>
          <p className="mt-2 text-sm text-slate-300">Keep decisions, memory, timing, and map readiness together in one premium workspace.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <TagChip label={`${placesCount} saved places`} />
        <TagChip label={`${remindersDue} reminders due`} />
        <TagChip label={`${mapReadyCount} map-ready points`} />
        <TagChip label={`${mapPointsCount} map adapter records`} />
      </div>
    </div>
  );
}
