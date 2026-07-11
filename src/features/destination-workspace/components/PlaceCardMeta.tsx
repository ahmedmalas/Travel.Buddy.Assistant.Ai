import { formatCategoryLabel } from '../model/destinationWorkspace.utils';
import type { Place } from '../model/destinationWorkspace.types';
import { PriorityBadge } from './PriorityBadge';
import { ReminderPill } from './ReminderPill';
import { StatusBadge } from './StatusBadge';

type PlaceCardMetaProps = {
  place: Place;
  reminderState: 'none' | 'overdue' | 'today' | 'upcoming';
  mapReady: boolean;
};

function createAddressSummary(place: Place) {
  const parts = [place.addressLine1, place.city, place.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Address not added yet';
}

export function PlaceCardMeta({ place, reminderState, mapReady }: PlaceCardMetaProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex rounded-full border border-white/15 bg-white/[0.02] px-2.5 py-1 text-xs text-slate-200">
          {formatCategoryLabel(place.category)}
        </span>
        <PriorityBadge priority={place.priority} />
        <StatusBadge status={place.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        <ReminderPill reminderAt={place.reminderAt} reminderState={reminderState} />
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${
            mapReady ? 'border-emerald-300/50 bg-emerald-500/10 text-emerald-200' : 'border-slate-300/30 bg-slate-500/10 text-slate-300'
          }`}
        >
          {mapReady ? 'Map ready' : 'Address fallback ready'}
        </span>
      </div>

      <p className="text-xs leading-5 text-slate-300">{createAddressSummary(place)}</p>
    </div>
  );
}
