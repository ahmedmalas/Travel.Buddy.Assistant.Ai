import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTripStore, type BackupSnapshot, type ImportPreview, type TripData } from '../store/useTripStore';

type Feedback = {
  kind: 'success' | 'error';
  message: string;
};

type SnapshotSort = 'newest' | 'oldest' | 'trip-title' | 'item-count';
type SnapshotTimeFilter = 'all' | 'today' | 'week' | 'month';

const groupStopsByDay = (stops: ReturnType<typeof useTripStore>['sortedStops']) => {
  const grouped = new Map<number, typeof stops>();
  for (const stop of stops) {
    const existing = grouped.get(stop.day) ?? [];
    grouped.set(stop.day, [...existing, stop]);
  }
  return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
};

const formatSnapshotDate = (value: string): string => new Date(value).toLocaleString();

const isInSelectedTimeRange = (dateValue: string, range: SnapshotTimeFilter): boolean => {
  if (range === 'all') {
    return true;
  }
  const now = new Date();
  const target = new Date(dateValue);
  if (range === 'today') {
    return now.toDateString() === target.toDateString();
  }
  if (range === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return target >= weekAgo;
  }
  const monthAgo = new Date(now);
  monthAgo.setMonth(now.getMonth() - 1);
  return target >= monthAgo;
};

export function TripWorkspace() {
  const {
    trip,
    sortedStops,
    canUndo,
    canRedo,
    addStop,
    editStop,
    deleteStop,
    duplicateStop,
    undo,
    redo,
    moveStop,
    searchStops,
    parseTripBackupPreview,
    toBackupJson,
    backupFileName,
    resetTrip,
    clearLocalData,
    importTrip,
    snapshots,
    restoreSnapshot,
    deleteSnapshot,
  } = useTripStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingImport, setPendingImport] = useState<{ trip: TripData; preview: ImportPreview; fileName: string } | null>(null);
  const [pendingSnapshotRestore, setPendingSnapshotRestore] = useState<BackupSnapshot | null>(null);
  const [snapshotSearchQuery, setSnapshotSearchQuery] = useState('');
  const [snapshotSort, setSnapshotSort] = useState<SnapshotSort>('newest');
  const [snapshotBackupVersionFilter, setSnapshotBackupVersionFilter] = useState<string>('all');
  const [snapshotApplicationVersionFilter, setSnapshotApplicationVersionFilter] = useState<string>('all');
  const [snapshotTimeFilter, setSnapshotTimeFilter] = useState<SnapshotTimeFilter>('all');
  const [comparisonSnapshotIds, setComparisonSnapshotIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const matchedIds = new Set(searchStops(searchQuery));
  const days = groupStopsByDay(sortedStops);
  const snapshotPreviewDate = useMemo(
    () => (pendingSnapshotRestore ? new Date(pendingSnapshotRestore.createdAt).toLocaleString() : ''),
    [pendingSnapshotRestore],
  );
  const availableBackupVersions = useMemo(
    () => [...new Set(snapshots.map((snapshot) => String(snapshot.backupVersion)))],
    [snapshots],
  );
  const availableApplicationVersions = useMemo(
    () => [...new Set(snapshots.map((snapshot) => snapshot.applicationVersion))],
    [snapshots],
  );
  const filteredSnapshots = useMemo(() => {
    const query = snapshotSearchQuery.trim().toLowerCase();
    const searchMatched = snapshots.filter((snapshot) => {
      if (query.length === 0) {
        return true;
      }
      const formattedDate = formatSnapshotDate(snapshot.createdAt).toLowerCase();
      const haystack = [
        snapshot.tripTitle,
        String(snapshot.backupVersion),
        snapshot.applicationVersion,
        snapshot.createdAt,
        formattedDate,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    const filtered = searchMatched.filter((snapshot) => {
      const backupVersionMatch =
        snapshotBackupVersionFilter === 'all' || String(snapshot.backupVersion) === snapshotBackupVersionFilter;
      const applicationVersionMatch =
        snapshotApplicationVersionFilter === 'all' || snapshot.applicationVersion === snapshotApplicationVersionFilter;
      const timeRangeMatch = isInSelectedTimeRange(snapshot.createdAt, snapshotTimeFilter);
      return backupVersionMatch && applicationVersionMatch && timeRangeMatch;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (snapshotSort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (snapshotSort === 'trip-title') {
        return a.tripTitle.localeCompare(b.tripTitle);
      }
      if (snapshotSort === 'item-count') {
        return b.itineraryItemCount - a.itineraryItemCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted;
  }, [
    snapshots,
    snapshotSearchQuery,
    snapshotBackupVersionFilter,
    snapshotApplicationVersionFilter,
    snapshotTimeFilter,
    snapshotSort,
  ]);
  const comparisonSnapshots = useMemo(
    () =>
      comparisonSnapshotIds
        .map((snapshotId) => snapshots.find((snapshot) => snapshot.id === snapshotId))
        .filter((snapshot): snapshot is BackupSnapshot => snapshot !== undefined),
    [comparisonSnapshotIds, snapshots],
  );
  const comparisonLeft = comparisonSnapshots[0] ?? null;
  const comparisonRight = comparisonSnapshots[1] ?? null;
  const getComparisonLabel = (snapshotId: string): 'A' | 'B' | null => {
    const index = comparisonSnapshotIds.findIndex((id) => id === snapshotId);
    if (index === 0) {
      return 'A';
    }
    if (index === 1) {
      return 'B';
    }
    return null;
  };

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
    setPendingImport(null);
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
      const parsed = parseTripBackupPreview(content);
      setPendingImport({ ...parsed, fileName: file.name });
      setFeedback(null);
    } catch (error) {
      setPendingImport(null);
      const message = error instanceof Error ? error.message : 'Backup import failed.';
      setFeedback({ kind: 'error', message });
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) {
      return;
    }
    importTrip(pendingImport.trip, pendingImport.preview.linkedRecordCount);
    setPendingImport(null);
    setFeedback({ kind: 'success', message: 'Backup restored successfully.' });
  };

  const handleCancelImport = () => {
    setPendingImport(null);
    setFeedback({ kind: 'success', message: 'Import cancelled. Current trip unchanged.' });
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

  const handleEditStop = (stopId: string, currentTitle: string, currentNotes: string) => {
    const nextTitle = window.prompt('Edit itinerary item title', currentTitle);
    if (nextTitle === null) {
      return;
    }
    const nextNotes = window.prompt('Edit itinerary item notes', currentNotes);
    if (nextNotes === null) {
      return;
    }
    editStop(stopId, nextTitle, nextNotes);
    setFeedback({ kind: 'success', message: 'Itinerary item updated and snapshot saved.' });
  };

  const handleDeleteStop = (stopId: string) => {
    const confirmed = window.confirm('Delete this itinerary item?');
    if (!confirmed) {
      return;
    }
    deleteStop(stopId);
    setFeedback({ kind: 'success', message: 'Itinerary item deleted and snapshot saved.' });
  };

  const handleDuplicateStop = (stopId: string) => {
    duplicateStop(stopId);
    setFeedback({ kind: 'success', message: 'Itinerary item duplicated and snapshot saved.' });
  };

  const handleRequestRestoreSnapshot = (snapshot: BackupSnapshot) => {
    setPendingSnapshotRestore(snapshot);
  };

  const handleConfirmRestoreSnapshot = () => {
    if (!pendingSnapshotRestore) {
      return;
    }
    restoreSnapshot(pendingSnapshotRestore.id);
    setPendingSnapshotRestore(null);
    setFeedback({ kind: 'success', message: 'Snapshot restored successfully.' });
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    const confirmed = window.confirm('Delete this snapshot from history?');
    if (!confirmed) {
      return;
    }
    deleteSnapshot(snapshotId);
    if (pendingSnapshotRestore?.id === snapshotId) {
      setPendingSnapshotRestore(null);
    }
    setComparisonSnapshotIds((currentSelection) => currentSelection.filter((selectedId) => selectedId !== snapshotId));
    setFeedback({ kind: 'success', message: 'Snapshot deleted.' });
  };

  const handleToggleComparisonSnapshot = (snapshotId: string) => {
    setComparisonSnapshotIds((currentSelection) => {
      if (currentSelection.includes(snapshotId)) {
        return currentSelection.filter((selectedId) => selectedId !== snapshotId);
      }
      return [...currentSelection, snapshotId].slice(-2);
    });
  };

  const handleRestoreFromComparison = (snapshot: BackupSnapshot, label: 'A' | 'B') => {
    const confirmed = window.confirm(`Restore Snapshot ${label} (${snapshot.tripTitle})?`);
    if (!confirmed) {
      return;
    }
    restoreSnapshot(snapshot.id);
    setFeedback({ kind: 'success', message: `Snapshot ${label} restored successfully.` });
    setComparisonSnapshotIds([]);
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

        {pendingImport ? (
          <div className="mt-4 rounded-2xl border border-sky-300/30 bg-sky-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Import preview</p>
            <p className="mt-2 text-sm text-slate-300">File: {pendingImport.fileName}</p>
            <dl className="mt-3 grid gap-2 text-sm text-slate-200 md:grid-cols-2">
              <div>
                <dt className="text-slate-400">Backup version</dt>
                <dd>{pendingImport.preview.backupVersion}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Application version</dt>
                <dd>{pendingImport.preview.applicationVersion}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Exported timestamp</dt>
                <dd>{pendingImport.preview.exportedAt}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Trip title</dt>
                <dd>{pendingImport.preview.tripTitle}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Itinerary items</dt>
                <dd>{pendingImport.preview.itineraryItemCount}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Linked vault/doc records</dt>
                <dd>{pendingImport.preview.linkedRecordCount ?? 'Not provided'}</dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleConfirmImport}
                className="rounded-full border border-emerald-300/40 px-4 py-2 text-sm text-emerald-100 transition hover:border-emerald-300"
              >
                Confirm import
              </button>
              <button
                type="button"
                onClick={handleCancelImport}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:border-white/40"
              >
                Cancel
              </button>
            </div>
          </div>
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
                        <button
                          type="button"
                          onClick={() => handleEditStop(stop.id, stop.title, stop.notes)}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateStop(stop.id)}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStop(stop.id)}
                          className="rounded-full border border-rose-300/40 px-3 py-1 text-xs text-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Backup history</p>
            <p className="text-xs text-slate-400">{snapshots.length} / 10 snapshots</p>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            <label className="rounded-xl border border-white/10 px-3 py-2 text-xs">
              <span className="text-slate-400">Search snapshots</span>
              <input
                value={snapshotSearchQuery}
                onChange={(event) => setSnapshotSearchQuery(event.target.value)}
                placeholder="title, version, date"
                className="mt-1 w-full bg-transparent text-sm text-slate-100 outline-none"
              />
            </label>
            <label className="rounded-xl border border-white/10 px-3 py-2 text-xs">
              <span className="text-slate-400">Sort</span>
              <select
                value={snapshotSort}
                onChange={(event) => setSnapshotSort(event.target.value as SnapshotSort)}
                className="mt-1 w-full bg-transparent text-sm text-slate-100 outline-none"
              >
                <option value="newest" className="bg-slate-900">
                  Newest first
                </option>
                <option value="oldest" className="bg-slate-900">
                  Oldest first
                </option>
                <option value="trip-title" className="bg-slate-900">
                  Trip title (A-Z)
                </option>
                <option value="item-count" className="bg-slate-900">
                  Itinerary item count
                </option>
              </select>
            </label>
            <label className="rounded-xl border border-white/10 px-3 py-2 text-xs">
              <span className="text-slate-400">Backup version</span>
              <select
                value={snapshotBackupVersionFilter}
                onChange={(event) => setSnapshotBackupVersionFilter(event.target.value)}
                className="mt-1 w-full bg-transparent text-sm text-slate-100 outline-none"
              >
                <option value="all" className="bg-slate-900">
                  All
                </option>
                {availableBackupVersions.map((version) => (
                  <option key={version} value={version} className="bg-slate-900">
                    {version}
                  </option>
                ))}
              </select>
            </label>
            <label className="rounded-xl border border-white/10 px-3 py-2 text-xs">
              <span className="text-slate-400">Application version</span>
              <select
                value={snapshotApplicationVersionFilter}
                onChange={(event) => setSnapshotApplicationVersionFilter(event.target.value)}
                className="mt-1 w-full bg-transparent text-sm text-slate-100 outline-none"
              >
                <option value="all" className="bg-slate-900">
                  All
                </option>
                {availableApplicationVersions.map((version) => (
                  <option key={version} value={version} className="bg-slate-900">
                    {version}
                  </option>
                ))}
              </select>
            </label>
            <label className="rounded-xl border border-white/10 px-3 py-2 text-xs">
              <span className="text-slate-400">Date filter</span>
              <select
                value={snapshotTimeFilter}
                onChange={(event) => setSnapshotTimeFilter(event.target.value as SnapshotTimeFilter)}
                className="mt-1 w-full bg-transparent text-sm text-slate-100 outline-none"
              >
                <option value="all" className="bg-slate-900">
                  All time
                </option>
                <option value="today" className="bg-slate-900">
                  Created today
                </option>
                <option value="week" className="bg-slate-900">
                  Created this week
                </option>
                <option value="month" className="bg-slate-900">
                  Created this month
                </option>
              </select>
            </label>
          </div>

          {filteredSnapshots.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No automatic snapshots yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {filteredSnapshots.map((snapshot) => {
                const comparisonLabel = getComparisonLabel(snapshot.id);
                return (
                <li key={snapshot.id} className="rounded-xl border border-white/10 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-200">
                      <p>{snapshot.tripTitle}</p>
                      <p className="text-xs text-slate-400">
                        {formatSnapshotDate(snapshot.createdAt)} • {snapshot.itineraryItemCount} items • backup v
                        {snapshot.backupVersion} • app v{snapshot.applicationVersion}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleComparisonSnapshot(snapshot.id)}
                        className="rounded-full border border-sky-300/40 px-3 py-1 text-xs text-sky-100"
                      >
                        {comparisonLabel ? `Selected ${comparisonLabel}` : 'Compare'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestRestoreSnapshot(snapshot)}
                        className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs text-emerald-100"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSnapshot(snapshot.id)}
                        className="rounded-full border border-rose-300/40 px-3 py-1 text-xs text-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
              })}
            </ul>
          )}

          {comparisonLeft && comparisonRight ? (
            <div className="mt-4 rounded-xl border border-sky-300/30 bg-sky-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Snapshot comparison</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <article className="rounded-xl border border-white/10 p-3">
                  <p className="text-sm font-medium text-slate-100">Snapshot A</p>
                  <p className="mt-1 text-xs text-slate-400">{comparisonLeft.tripTitle}</p>
                  <p className="text-xs text-slate-400">{formatSnapshotDate(comparisonLeft.createdAt)}</p>
                  <p className="text-xs text-slate-400">{comparisonLeft.itineraryItemCount} items</p>
                  <p className="text-xs text-slate-400">Backup v{comparisonLeft.backupVersion}</p>
                  <p className="text-xs text-slate-400">App v{comparisonLeft.applicationVersion}</p>
                  <p className="text-xs text-slate-400">Linked records: {comparisonLeft.linkedRecordCount ?? 'Not provided'}</p>
                </article>
                <article className="rounded-xl border border-white/10 p-3">
                  <p className="text-sm font-medium text-slate-100">Snapshot B</p>
                  <p className="mt-1 text-xs text-slate-400">{comparisonRight.tripTitle}</p>
                  <p className="text-xs text-slate-400">{formatSnapshotDate(comparisonRight.createdAt)}</p>
                  <p className="text-xs text-slate-400">{comparisonRight.itineraryItemCount} items</p>
                  <p className="text-xs text-slate-400">Backup v{comparisonRight.backupVersion}</p>
                  <p className="text-xs text-slate-400">App v{comparisonRight.applicationVersion}</p>
                  <p className="text-xs text-slate-400">Linked records: {comparisonRight.linkedRecordCount ?? 'Not provided'}</p>
                </article>
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-300">
                <li>Trip title: {comparisonLeft.tripTitle === comparisonRight.tripTitle ? 'same' : 'different'}</li>
                <li>Created date: {comparisonLeft.createdAt === comparisonRight.createdAt ? 'same' : 'different'}</li>
                <li>
                  Itinerary item count:{' '}
                  {comparisonLeft.itineraryItemCount === comparisonRight.itineraryItemCount ? 'same' : 'different'}
                </li>
                <li>
                  Backup version: {comparisonLeft.backupVersion === comparisonRight.backupVersion ? 'same' : 'different'}
                </li>
                <li>
                  Application version:{' '}
                  {comparisonLeft.applicationVersion === comparisonRight.applicationVersion ? 'same' : 'different'}
                </li>
                <li>
                  Linked record count:{' '}
                  {comparisonLeft.linkedRecordCount === comparisonRight.linkedRecordCount ? 'same' : 'different'}
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleRestoreFromComparison(comparisonLeft, 'A')}
                  className="rounded-full border border-emerald-300/40 px-4 py-2 text-sm text-emerald-100"
                >
                  Restore Snapshot A
                </button>
                <button
                  type="button"
                  onClick={() => handleRestoreFromComparison(comparisonRight, 'B')}
                  className="rounded-full border border-emerald-300/40 px-4 py-2 text-sm text-emerald-100"
                >
                  Restore Snapshot B
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonSnapshotIds([])}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {pendingSnapshotRestore ? (
            <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Snapshot preview</p>
              <p className="mt-2 text-sm text-slate-200">{pendingSnapshotRestore.tripTitle}</p>
              <p className="text-xs text-slate-400">
                {snapshotPreviewDate} • {pendingSnapshotRestore.itineraryItemCount} items • backup v
                {pendingSnapshotRestore.backupVersion} • app v{pendingSnapshotRestore.applicationVersion}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmRestoreSnapshot}
                  className="rounded-full border border-emerald-300/40 px-4 py-2 text-sm text-emerald-100"
                >
                  Confirm restore
                </button>
                <button
                  type="button"
                  onClick={() => setPendingSnapshotRestore(null)}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
