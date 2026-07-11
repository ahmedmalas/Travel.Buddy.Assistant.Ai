import { useMemo, useState, type FormEvent } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import type { Place } from '../../destination-workspace/model/destinationWorkspace.types';
import { ITINERARY_DEFAULTS } from '../model/itinerary.utils';
import type { AddActivityDraft } from '../model/itinerary.types';

type AddActivityFromPlacesPanelProps = {
  eligiblePlaces: Place[];
  onAddActivity: (draft: AddActivityDraft) => void;
};

export function AddActivityFromPlacesPanel({ eligiblePlaces, onAddActivity }: AddActivityFromPlacesPanelProps) {
  const defaultPlaceId = eligiblePlaces[0]?.id ?? '';
  const [placeId, setPlaceId] = useState(defaultPlaceId);
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(ITINERARY_DEFAULTS.defaultDurationMinutes);
  const [bufferAfterMinutes, setBufferAfterMinutes] = useState(ITINERARY_DEFAULTS.defaultBufferMinutes);
  const [notes, setNotes] = useState('');

  const hasPlaces = eligiblePlaces.length > 0;
  const canSubmit = useMemo(() => hasPlaces && Boolean(placeId), [hasPlaces, placeId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onAddActivity({
      placeId,
      startTime,
      durationMinutes,
      bufferAfterMinutes,
      notes,
    });
    setNotes('');
  }

  if (!hasPlaces) {
    return (
      <EmptyState
        title="No eligible saved places"
        description="Switch destination or add places in Destination Workspace before planning this day."
      />
    );
  }

  return (
    <form className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4" onSubmit={handleSubmit}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Add from saved places</p>
      <select
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 focus:ring"
        onChange={(event) => setPlaceId(event.target.value)}
        value={placeId}
      >
        {eligiblePlaces.map((place) => (
          <option key={place.id} value={place.id}>
            {place.title}
          </option>
        ))}
      </select>

      <div className="grid gap-2 md:grid-cols-3">
        <label className="text-xs text-slate-300">
          Start time
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
        placeholder="Activity note (optional)"
        value={notes}
      />

      <button
        className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/20 disabled:opacity-50"
        disabled={!canSubmit}
        type="submit"
      >
        Add activity to day
      </button>
    </form>
  );
}
