import { useRef, useState, type ChangeEvent } from 'react';
import { useTripStore } from '../store/useTripStore';

type Feedback = {
  kind: 'success' | 'error';
  message: string;
};

const groupStopsByDay = (stops: ReturnType<typeof useTripStore>['sortedStops']) => {
  const grouped = new Map<number, typeof stops>();
  for (const stop of stops) {
    const existing = grouped.get(stop.day) ?? [];
    grouped.set(stop.day, [...existing, stop]);
  }
  return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
};

export function TripWorkspace() {
  const {
    trip,
    sortedStops,
    canUndo,
    canRedo,
    addStop,
    undo,
    redo,
    moveStop,
    searchStops,
    replaceTrip,
    parseTripBackup,
    toBackupJson,
    backupFileName,
    resetTrip,
    clearLocalData,
  } = useTripStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const matchedIds = new Set(searchStops(searchQuery));
  const days = groupStopsByDay(sortedStops);

  const handleExport = () => {
    const backupJson = toBackupJson();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = backupFileName();
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback({ kind: 'success', message: `Backup exported: ${anchor.download}` });
  };

  const handleImportClick = () => {
    inputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const importedTrip = parseTripBackup(content);
      const confirmed = window.confirm('This will replace your current trip data. Continue?');
      if (!confirmed) {
        setFeedback({ kind: 'success', message: 'Import cancelled.' });
        return;
      }
      replaceTrip(importedTrip);
      setFeedback({ kind: 'success', message: 'Backup restored successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Backup import failed.';
      setFeedback({ kind: 'error', message });
    }
  };

  const handleResetTrip = () => {
    const confirmed = window.confirm('Reset trip to the seeded demo and clear undo/redo history?');
    if (!confirmed) {
      return;
    }
    resetTrip();
    setFeedback({ kind: 'success', message: 'Trip reset to seeded demo data.' });
  };

  const handleClearLocalData = () => {
    const confirmed = window.confirm('Clear all locally stored trip data and restore seeded demo trip?');
    if (!confirmed) {
      return;
    }
    clearLocalData();
    setFeedback({ kind: 'success', message: 'Local trip data cleared and seeded trip restored.' });
  };

  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-300">Trip itinerary</p>
            <h3 className="mt-2 text-2xl font-semibold">{trip.tripName}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:border-sky-300"
            >
              Export backup
            </button>
            <button
              type="button"
              onClick={handleImportClick}
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:border-sky-300"
            >
              Import backup
            </button>
            <button
              type="button"
              onClick={handleResetTrip}
              className="rounded-full border border-amber-300/40 px-4 py-2 text-sm text-amber-100 transition hover:border-amber-300"
            >
              Reset trip
            </button>
            <button
              type="button"
              onClick={handleClearLocalData}
              className="rounded-full border border-rose-300/40 px-4 py-2 text-sm text-rose-100 transition hover:border-rose-300"
            >
              Clear local data
            </button>
            <input ref={inputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addStop}
            className="rounded-full bg-sky-400/15 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-400/25"
          >
            Add itinerary item
          </button>
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Redo
          </button>
          <label className="ml-auto flex min-w-64 items-center rounded-full border border-white/20 px-4 py-2 text-sm">
            <span className="mr-2 text-slate-400">Search</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-transparent text-slate-100 outline-none"
              placeholder="Try: kyoto"
            />
          </label>
        </div>

        {feedback ? (
          <p className={`mt-4 text-sm ${feedback.kind === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{feedback.message}</p>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {days.map(([day, dayStops]) => (
            <article key={day} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Day {day}</p>
              <ul className="mt-4 space-y-3">
                {dayStops.map((stop, index) => {
                  const isVisible = searchQuery.trim().length === 0 || matchedIds.has(stop.id);
                  if (!isVisible) {
                    return null;
                  }
                  return (
                    <li key={stop.id} className="rounded-xl border border-white/10 p-3">
                      <p className="font-medium text-slate-100">{stop.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{stop.notes}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => moveStop(stop.id, 'up')}
                          disabled={index === 0}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Move up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStop(stop.id, 'down')}
                          disabled={index === dayStops.length - 1}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Move down
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
