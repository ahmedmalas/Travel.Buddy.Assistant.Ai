import { useEffect, useState } from 'react';
import type { TimelineBlock, UpdateActivityDraft } from '../model/itinerary.types';

type ActivityEditorSheetProps = {
  block: TimelineBlock | null;
  onUpdateActivity: (activityId: string, updates: UpdateActivityDraft) => void;
  onRemoveActivity: (activityId: string) => void;
};

export function ActivityEditorSheet({ block, onUpdateActivity, onRemoveActivity }: ActivityEditorSheetProps) {
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [bufferAfterMinutes, setBufferAfterMinutes] = useState(30);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!block) {
      return;
    }
    const hours = Math.floor(block.startMinutes / 60)
      .toString()
      .padStart(2, '0');
    const minutes = (block.startMinutes % 60).toString().padStart(2, '0');
    setStartTime(`${hours}:${minutes}`);
    setDurationMinutes(block.durationMinutes);
    setBufferAfterMinutes(block.bufferAfterMinutes);
    setNotes(block.notes ?? '');
  }, [block]);

  if (!block) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Activity editor</p>
        <p className="mt-2 text-sm text-slate-300">Select an activity in the timeline to edit timing, buffer, notes, or remove it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Activity editor</p>
      <h4 className="text-base font-semibold text-white">{block.label}</h4>

      <div className="grid gap-2 md:grid-cols-3">
        <label className="text-xs text-slate-300">
          Start
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1 text-sm text-slate-100 outline-none ring-sky-300/40 focus:ring"
            onChange={(event) => setStartTime(event.target.value)}
            type="time"
            value={startTime}
          />
        </label>
        <label className="text-xs text-slate-300">
          Duration (m)
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1 text-sm text-slate-100 outline-none ring-sky-300/40 focus:ring"
            min={15}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            step={15}
            type="number"
            value={durationMinutes}
          />
        </label>
        <label className="text-xs text-slate-300">
          Buffer (m)
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1 text-sm text-slate-100 outline-none ring-sky-300/40 focus:ring"
            min={0}
            onChange={(event) => setBufferAfterMinutes(Number(event.target.value))}
            step={5}
            type="number"
            value={bufferAfterMinutes}
          />
        </label>
      </div>

      <textarea
        className="h-20 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Activity note"
        value={notes}
      />

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/20"
          onClick={() =>
            onUpdateActivity(block.activityId, {
              startTime,
              durationMinutes,
              bufferAfterMinutes,
              notes,
            })
          }
          type="button"
        >
          Save activity changes
        </button>
        <button
          className="rounded-full border border-rose-300/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20"
          onClick={() => onRemoveActivity(block.activityId)}
          type="button"
        >
          Remove activity
        </button>
      </div>
    </div>
  );
}
