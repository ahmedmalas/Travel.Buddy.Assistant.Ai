import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { type JournalEntry } from '../../store/travelOpsDomain';
import {
  EmptyState,
  Field,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBanner,
  StatusBadge,
  inputClassName,
} from './shared/ui';

const createJournalEntry = (): JournalEntry => ({
  id: crypto.randomUUID(),
  date: '',
  title: '',
  notes: '',
  highlights: '',
  rating: 0,
  locationName: '',
  latitude: '',
  longitude: '',
  photoAttachmentName: '',
  photoMimeType: '',
  favourite: false,
});

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function JournalPanel() {
  const { activeVaultTrip, upsertJournalEntry, deleteJournalEntry, exportTripJournalSummary, canEditTrip } =
    useSharedTripStore();
  const entries = activeVaultTrip.journalEntries ?? [];
  const [draft, setDraft] = useState<JournalEntry>(createJournalEntry());
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSave = () => {
    if (!draft.title.trim()) {
      setFeedback('Journal title is required.');
      return;
    }
    upsertJournalEntry({
      ...draft,
      rating: Math.min(5, Math.max(0, Math.round(draft.rating))),
    });
    setDraft(createJournalEntry());
    setFeedback('Journal entry saved.');
  };

  const handleExport = () => {
    const summary = exportTripJournalSummary();
    const safeName = activeVaultTrip.tripName.replace(/[^\w\-]+/g, '-').toLowerCase() || 'trip';
    downloadTextFile(`${safeName}-journal.txt`, summary);
    setFeedback('Journal summary downloaded.');
  };

  return (
    <Panel
      title="Travel journal"
      description="Capture daily highlights, ratings, and photo metadata. Export a plain-text summary for sharing or backup."
      actions={
        <SecondaryButton type="button" onClick={handleExport}>
          Export summary
        </SecondaryButton>
      }
    >
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Date" htmlFor="journal-date">
          <input id="journal-date" type="date" className={inputClassName} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        </Field>
        <Field label="Title" htmlFor="journal-title">
          <input id="journal-title" className={inputClassName} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>
        <Field label="Rating (0–5)" htmlFor="journal-rating">
          <input
            id="journal-rating"
            type="number"
            min={0}
            max={5}
            className={inputClassName}
            value={draft.rating}
            onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}
          />
        </Field>
        <Field label="Location name" htmlFor="journal-location">
          <input id="journal-location" className={inputClassName} value={draft.locationName} onChange={(e) => setDraft({ ...draft, locationName: e.target.value })} />
        </Field>
        <Field label="Latitude" htmlFor="journal-lat">
          <input id="journal-lat" className={inputClassName} value={draft.latitude} onChange={(e) => setDraft({ ...draft, latitude: e.target.value })} />
        </Field>
        <Field label="Longitude" htmlFor="journal-lng">
          <input id="journal-lng" className={inputClassName} value={draft.longitude} onChange={(e) => setDraft({ ...draft, longitude: e.target.value })} />
        </Field>
        <Field label="Photo file name" htmlFor="journal-photo-name">
          <input
            id="journal-photo-name"
            className={inputClassName}
            value={draft.photoAttachmentName}
            onChange={(e) => setDraft({ ...draft, photoAttachmentName: e.target.value })}
          />
        </Field>
        <Field label="Photo MIME type" htmlFor="journal-photo-mime">
          <input
            id="journal-photo-mime"
            className={inputClassName}
            value={draft.photoMimeType}
            onChange={(e) => setDraft({ ...draft, photoMimeType: e.target.value })}
          />
        </Field>
        <Field label="Favourite" htmlFor="journal-favourite">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              id="journal-favourite"
              type="checkbox"
              checked={draft.favourite}
              onChange={(e) => setDraft({ ...draft, favourite: e.target.checked })}
            />
            Mark as favourite
          </label>
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Highlights" htmlFor="journal-highlights">
            <textarea id="journal-highlights" rows={2} className={inputClassName} value={draft.highlights} onChange={(e) => setDraft({ ...draft, highlights: e.target.value })} />
          </Field>
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Notes" htmlFor="journal-notes">
            <textarea id="journal-notes" rows={3} className={inputClassName} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <PrimaryButton type="button" disabled={!canEditTrip} onClick={handleSave}>
          Save entry
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => setDraft(createJournalEntry())}>
          Reset form
        </SecondaryButton>
      </div>

      <div className="mt-6 space-y-3">
        {entries.length === 0 ? (
          <EmptyState title="No journal entries" body="Record memorable days with ratings, highlights, and optional photo metadata." />
        ) : (
          entries.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">
                    {entry.title}
                    {entry.favourite ? ' ★' : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {entry.date || 'Undated'} · {entry.locationName || 'No location'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge label={`${entry.rating}/5`} tone={entry.rating >= 4 ? 'success' : 'neutral'} />
                    {entry.photoAttachmentName ? (
                      <StatusBadge label={entry.photoAttachmentName} tone="info" />
                    ) : null}
                  </div>
                  {entry.highlights ? <p className="mt-2 text-sm text-sky-200">{entry.highlights}</p> : null}
                  {entry.notes ? <p className="mt-2 text-sm text-slate-300">{entry.notes}</p> : null}
                </div>
                <div className="flex gap-2">
                  <SecondaryButton type="button" onClick={() => setDraft(entry)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton type="button" disabled={!canEditTrip} onClick={() => deleteJournalEntry(entry.id)}>
                    Delete
                  </SecondaryButton>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </Panel>
  );
}
