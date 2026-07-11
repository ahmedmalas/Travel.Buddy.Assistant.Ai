import { useMemo, useState, type FormEvent } from 'react';
import {
  PLACE_CATEGORIES,
  PLACE_PRIORITIES,
  PLACE_STATUSES,
  type PlaceDraft,
} from '../model/destinationWorkspace.types';
import { formatCategoryLabel, formatPriorityLabel, formatStatusLabel } from '../model/destinationWorkspace.utils';

type PlaceComposerProps = {
  onCreatePlace: (draft: PlaceDraft) => void;
};

const INITIAL_DRAFT: PlaceDraft = {
  title: '',
  whySaved: '',
  category: 'attraction',
  reminderAt: '',
  priority: 'medium',
  status: 'idea',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  country: '',
  postalCode: '',
};

export function PlaceComposer({ onCreatePlace }: PlaceComposerProps) {
  const [draft, setDraft] = useState<PlaceDraft>(INITIAL_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => draft.title.trim().length > 1, [draft.title]);

  function updateDraft(nextDraft: Partial<PlaceDraft>) {
    setDraft((currentDraft) => ({ ...currentDraft, ...nextDraft }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError('Place name must be at least 2 characters.');
      return;
    }

    if ((draft.lat && !draft.lng) || (!draft.lat && draft.lng)) {
      setError('Latitude and longitude should be set together.');
      return;
    }

    setError(null);
    onCreatePlace({
      ...draft,
      lat: typeof draft.lat === 'number' ? draft.lat : undefined,
      lng: typeof draft.lng === 'number' ? draft.lng : undefined,
    });
    setDraft(INITIAL_DRAFT);
  }

  return (
    <form className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Save a place</h3>
        <span className="rounded-full border border-sky-300/40 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-200">Command input</span>
      </div>

      <div className="grid gap-3">
        <input
          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
          onChange={(event) => updateDraft({ title: event.target.value })}
          placeholder="Place name"
          value={draft.title}
        />
        <textarea
          className="h-20 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
          onChange={(event) => updateDraft({ whySaved: event.target.value })}
          placeholder="Why did you save this place?"
          value={draft.whySaved}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <select
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 focus:ring"
          onChange={(event) => updateDraft({ category: event.target.value as PlaceDraft['category'] })}
          value={draft.category}
        >
          {PLACE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {formatCategoryLabel(category)}
            </option>
          ))}
        </select>
        <select
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 focus:ring"
          onChange={(event) => updateDraft({ priority: event.target.value as PlaceDraft['priority'] })}
          value={draft.priority}
        >
          {PLACE_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {formatPriorityLabel(priority)}
            </option>
          ))}
        </select>
        <select
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 focus:ring"
          onChange={(event) => updateDraft({ status: event.target.value as PlaceDraft['status'] })}
          value={draft.status}
        >
          {PLACE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
          onChange={(event) => updateDraft({ addressLine1: event.target.value })}
          placeholder="Address line 1"
          value={draft.addressLine1}
        />
        <input
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
          onChange={(event) => updateDraft({ city: event.target.value })}
          placeholder="City"
          value={draft.city}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
          onChange={(event) => updateDraft({ reminderAt: event.target.value })}
          type="datetime-local"
          value={draft.reminderAt}
        />
        <input
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
          onChange={(event) => updateDraft({ lat: event.target.value ? Number(event.target.value) : undefined })}
          placeholder="Latitude (optional)"
          step="any"
          type="number"
          value={draft.lat ?? ''}
        />
        <input
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
          onChange={(event) => updateDraft({ lng: event.target.value ? Number(event.target.value) : undefined })}
          placeholder="Longitude (optional)"
          step="any"
          type="number"
          value={draft.lng ?? ''}
        />
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      <button
        className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canSubmit}
        type="submit"
      >
        Save place to workspace
      </button>
    </form>
  );
}
