import { EmptyState } from '../../../shared/components/EmptyState';
import { getTimelineHourMarks } from '../adapters/itineraryBoard.adapter';
import { formatMinutesToTime } from '../model/itinerary.utils';
import type { TimelineBlock } from '../model/itinerary.types';
import { TimelineActivityCard } from './TimelineActivityCard';

type DayTimelineProps = {
  blocks: TimelineBlock[];
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string) => void;
};

export function DayTimeline({ blocks, selectedActivityId, onSelectActivity }: DayTimelineProps) {
  if (blocks.length === 0) {
    return (
      <EmptyState
        title="No activities scheduled for this day"
        description="Add a saved place from the right panel to start building a premium daily plan."
      />
    );
  }

  const hourMarks = getTimelineHourMarks();

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Timeline window 06:00 - 23:00</p>
      <div className="mt-3 grid gap-4 lg:grid-cols-[100px_1fr]">
        <div className="space-y-2">
          {hourMarks.map((minuteMark) => (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-slate-300" key={minuteMark}>
              {formatMinutesToTime(minuteMark)}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {blocks.map((block) => (
            <TimelineActivityCard
              block={block}
              key={block.activityId}
              onSelect={() => onSelectActivity(block.activityId)}
              selected={selectedActivityId === block.activityId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
