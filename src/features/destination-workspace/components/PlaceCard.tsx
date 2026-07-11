import type { Place } from '../model/destinationWorkspace.types';
import { PlaceCardMeta } from './PlaceCardMeta';

type PlaceCardProps = {
  place: Place;
  selected: boolean;
  reminderState: 'none' | 'overdue' | 'today' | 'upcoming';
  mapReady: boolean;
  onSelect: () => void;
};

export function PlaceCard({ place, selected, reminderState, mapReady, onSelect }: PlaceCardProps) {
  return (
    <button
      className={`w-full rounded-3xl border p-5 text-left transition ${
        selected
          ? 'border-sky-300/60 bg-sky-500/10 shadow-xl shadow-sky-950/30'
          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
      }`}
      onClick={onSelect}
      type="button"
    >
      <h3 className="text-lg font-semibold text-white">{place.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-200">
        <span className="font-semibold text-sky-200">Why saved:</span>{' '}
        {place.whySaved || 'No reason captured yet. Add context to make this decision-ready.'}
      </p>

      <div className="mt-4">
        <PlaceCardMeta place={place} reminderState={reminderState} mapReady={mapReady} />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-900/70 p-3">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Latest note</p>
        <p className="mt-2 text-sm text-slate-200">{place.notes[0]?.content || 'No notes yet. Capture details you do not want to forget.'}</p>
      </div>
    </button>
  );
}
