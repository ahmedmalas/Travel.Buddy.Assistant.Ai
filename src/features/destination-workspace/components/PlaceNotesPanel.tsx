import { useState, type FormEvent } from 'react';
import type { Place } from '../model/destinationWorkspace.types';

type PlaceNotesPanelProps = {
  place: Place | null;
  onAddNote: (payload: { placeId: string; content: string }) => void;
};

export function PlaceNotesPanel({ place, onAddNote }: PlaceNotesPanelProps) {
  const [noteInput, setNoteInput] = useState('');

  if (!place) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-lg font-semibold text-white">Place notes</h3>
        <p className="mt-2 text-sm text-slate-300">Select a place to capture notes and reminders that keep trip decisions sharp.</p>
      </div>
    );
  }

  const activePlace = place;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteInput.trim()) {
      return;
    }
    onAddNote({ placeId: activePlace.id, content: noteInput });
    setNoteInput('');
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Notes panel</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{activePlace.title}</h3>
        </div>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm text-slate-300" htmlFor="note-input">
          Add a note
        </label>
        <textarea
          className="h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 focus:ring"
          id="note-input"
          onChange={(event) => setNoteInput(event.target.value)}
          placeholder="Capture context, constraints, or local tips..."
          value={noteInput}
        />
        <button className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10" type="submit">
          Add note
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {activePlace.notes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm text-slate-300">
            No notes yet for this place.
          </p>
        ) : (
          activePlace.notes.map((note) => (
            <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-3" key={note.id}>
              <p className="text-sm leading-6 text-slate-200">{note.content}</p>
              <p className="mt-2 text-xs text-slate-400">Updated {new Date(note.updatedAt).toLocaleString()}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
