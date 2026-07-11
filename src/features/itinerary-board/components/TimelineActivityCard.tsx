import { PriorityBadge } from '../../destination-workspace/components/PriorityBadge';
import { ReminderPill } from '../../destination-workspace/components/ReminderPill';
import { StatusBadge } from '../../destination-workspace/components/StatusBadge';
import { formatMinutesToTime } from '../model/itinerary.utils';
import type { TimelineBlock } from '../model/itinerary.types';

type TimelineActivityCardProps = {
  block: TimelineBlock;
  selected: boolean;
  onSelect: () => void;
};

function formatActivityStatus(status: TimelineBlock['activityStatus']) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function TimelineActivityCard({ block, selected, onSelect }: TimelineActivityCardProps) {
  const hasConflict = block.conflictFlags.overlap || block.conflictFlags.tightBuffer || block.conflictFlags.outsideDayWindow;

  return (
    <button
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected
          ? 'border-sky-300/60 bg-sky-500/10'
          : hasConflict
            ? 'border-amber-300/50 bg-amber-500/10 hover:bg-amber-500/15'
            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06]'
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-white">{block.label}</h4>
        <span className="rounded-full border border-white/15 px-2 py-1 text-xs text-slate-200">{formatActivityStatus(block.activityStatus)}</span>
      </div>

      <p className="mt-2 text-sm text-slate-300">
        {formatMinutesToTime(block.startMinutes)} - {formatMinutesToTime(block.endMinutes)} · {block.durationMinutes}m
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <ReminderPill reminderAt={undefined} reminderState={block.reminderState} />
        <PriorityBadge priority={block.priority} />
        <StatusBadge status={block.placeStatus} />
      </div>

      <p className="mt-2 text-xs text-slate-300">Buffer after: {block.bufferAfterMinutes}m</p>
      {block.notes && <p className="mt-2 text-sm text-slate-200">{block.notes}</p>}

      {hasConflict && (
        <p className="mt-2 text-xs text-amber-200">
          {block.conflictFlags.overlap && 'Overlap detected. '}
          {block.conflictFlags.tightBuffer && 'Buffer is tight. '}
          {block.conflictFlags.outsideDayWindow && 'Outside day window.'}
        </p>
      )}
    </button>
  );
}
