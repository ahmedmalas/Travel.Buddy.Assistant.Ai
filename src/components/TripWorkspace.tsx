import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  useTripStore,
  type BackupSnapshot,
  type IntegrityHistoryImportPreview,
  type ImportPreview,
  type SnapshotCleanupMode,
  type SnapshotHistoryImportPreview,
  type TripData,
} from '../store/useTripStore';

type Feedback = {
  kind: 'success' | 'error';
  message: string;
};

type SnapshotSort = 'newest' | 'oldest' | 'trip-title' | 'item-count';
type SnapshotTimeFilter = 'all' | 'today' | 'week' | 'month';
type SnapshotPinnedFilter = 'all' | 'pinned' | 'unpinned';

type ComparisonItem = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  linkedReferences: string;
};

type ModifiedFieldDiff = {
  fieldLabel: string;
  valueA: string;
  valueB: string;
};

type ModifiedItemDiff = {
  id: string;
  itemA: ComparisonItem;
  itemB: ComparisonItem;
  fieldDiffs: ModifiedFieldDiff[];
};

type DeepComparisonResult = {
  added: ComparisonItem[];
  removed: ComparisonItem[];
  modified: ModifiedItemDiff[];
  unchanged: ComparisonItem[];
};

const groupStopsByDay = (stops: ReturnType<typeof useTripStore>['sortedStops']) => {
  const grouped = new Map<number, typeof stops>();
  for (const stop of stops) {
    const existing = grouped.get(stop.day) ?? [];
    grouped.set(stop.day, [...existing, stop]);
  }
  return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
};

const formatSnapshotDate = (value: string): string => new Date(value).toLocaleString();

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

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

const normalizeText = (value: unknown, fallback = 'Not provided'): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
};

const getLinkedReferenceSummary = (stop: Record<string, unknown>): string => {
  const linkedValues: string[] = [];
  const candidates: unknown[] = [
    stop.linkedReferences,
    stop.linkedReferenceIds,
    stop.linkedDocs,
    stop.linkedDocuments,
    stop.vaultReferences,
    stop.linkedVault,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      if (candidate.length === 0) {
        continue;
      }
      linkedValues.push(candidate.map((entry) => normalizeText(entry)).join(', '));
      continue;
    }
    if (candidate && typeof candidate === 'object') {
      const keys = Object.keys(candidate);
      if (keys.length > 0) {
        linkedValues.push(keys.join(', '));
      }
    }
  }

  if (linkedValues.length === 0) {
    return 'Not provided';
  }
  return linkedValues.join(' | ');
};

const toComparisonItem = (stop: Record<string, unknown>): ComparisonItem => {
  const dayValue = typeof stop.day === 'number' ? `Day ${stop.day}` : 'Not provided';
  return {
    id: normalizeText(stop.id, crypto.randomUUID()),
    title: normalizeText(stop.title),
    date: normalizeText(stop.date, dayValue),
    startTime: normalizeText(stop.startTime),
    endTime: normalizeText(stop.endTime),
    location: normalizeText(stop.location),
    notes: normalizeText(stop.notes, normalizeText(stop.description)),
    linkedReferences: getLinkedReferenceSummary(stop),
  };
};

const compareField = (fieldLabel: string, valueA: string, valueB: string): ModifiedFieldDiff | null => {
  if (valueA === valueB) {
    return null;
  }
  return { fieldLabel, valueA, valueB };
};

const buildDeepComparison = (snapshotA: BackupSnapshot, snapshotB: BackupSnapshot): DeepComparisonResult => {
  const itemsA = new Map(snapshotA.trip.stops.map((stop) => {
    const item = toComparisonItem(stop as unknown as Record<string, unknown>);
    return [item.id, item];
  }));
  const itemsB = new Map(snapshotB.trip.stops.map((stop) => {
    const item = toComparisonItem(stop as unknown as Record<string, unknown>);
    return [item.id, item];
  }));

  const allIds = Array.from(new Set([...itemsA.keys(), ...itemsB.keys()]));
  const added: ComparisonItem[] = [];
  const removed: ComparisonItem[] = [];
  const modified: ModifiedItemDiff[] = [];
  const unchanged: ComparisonItem[] = [];

  for (const id of allIds) {
    const itemA = itemsA.get(id);
    const itemB = itemsB.get(id);

    if (!itemA && itemB) {
      added.push(itemB);
      continue;
    }
    if (itemA && !itemB) {
      removed.push(itemA);
      continue;
    }
    if (!itemA || !itemB) {
      continue;
    }

    const fieldDiffs = [
      compareField('Title', itemA.title, itemB.title),
      compareField('Date', itemA.date, itemB.date),
      compareField('Start time', itemA.startTime, itemB.startTime),
      compareField('End time', itemA.endTime, itemB.endTime),
      compareField('Location', itemA.location, itemB.location),
      compareField('Notes / description', itemA.notes, itemB.notes),
      compareField('Linked vault/document references', itemA.linkedReferences, itemB.linkedReferences),
    ].filter((diff): diff is ModifiedFieldDiff => diff !== null);

    if (fieldDiffs.length === 0) {
      unchanged.push(itemB);
      continue;
    }

    modified.push({
      id,
      itemA,
      itemB,
      fieldDiffs,
    });
  }

  return { added, removed, modified, unchanged };
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
    toSnapshotHistoryJson,
    snapshotHistoryFileName,
    parseSnapshotHistoryBackup,
    snapshots,
    restoreSnapshot,
    deleteSnapshot,
    importSnapshotHistory,
    updateSnapshotDetails,
    snapshotLabelLimit,
    snapshotNotesLimit,
    setSnapshotPinned,
    unpinnedSnapshotLimit,
    getCleanupPreviewCount,
    cleanupSnapshots,
    retryPersistActiveTrip,
    retryPersistSnapshotHistory,
    retryPersistAll,
    retryParseActiveTripStorage,
    retryParseSnapshotHistoryStorage,
    resetCorruptedActiveTrip,
    clearCorruptedSnapshotHistory,
    activeTripCorruption,
    snapshotHistoryCorruption,
    storageDiagnostics,
    toDiagnosticsJson,
    diagnosticsFileName,
    buildCorruptedRawPayloadExport,
    corruptedRawPayloadFileName,
    integrityAuditReport,
    integrityAuditRuns,
    selectedIntegrityBaselineRunId,
    latestVsBaselineChangeSummary,
    runIntegrityAudit,
    applyIntegrityRepairs,
    clearIntegrityAudit,
    toIntegrityAuditJson,
    integrityAuditFileName,
    toIntegrityHistoryJson,
    integrityHistoryFileName,
    parseIntegrityHistoryBackup,
    importIntegrityHistory,
    setIntegrityBaselineRun,
    clearIntegrityBaselineRun,
    deleteIntegrityRun,
    clearIntegrityHistory,
    storageHealth,
    storageKeys,
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
  const [snapshotPinnedFilter, setSnapshotPinnedFilter] = useState<SnapshotPinnedFilter>('all');
  const [comparisonSnapshotIds, setComparisonSnapshotIds] = useState<string[]>([]);
  const [pendingComparisonRestore, setPendingComparisonRestore] = useState<{ snapshot: BackupSnapshot; label: 'A' | 'B' } | null>(null);
  const [modifiedSectionCollapsed, setModifiedSectionCollapsed] = useState(false);
  const [expandedModifiedIds, setExpandedModifiedIds] = useState<string[]>([]);
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [draftSnapshotLabel, setDraftSnapshotLabel] = useState('');
  const [draftSnapshotNotes, setDraftSnapshotNotes] = useState('');
  const [pendingSnapshotHistoryImport, setPendingSnapshotHistoryImport] = useState<{
    preview: SnapshotHistoryImportPreview;
    snapshots: BackupSnapshot[];
    fileName: string;
  } | null>(null);
  const [pendingCleanup, setPendingCleanup] = useState<{ mode: SnapshotCleanupMode; count: number } | null>(null);
  const [pendingRecoveryAction, setPendingRecoveryAction] = useState<'active-trip' | 'snapshot-history' | null>(null);
  const [selectedRepairIssueIds, setSelectedRepairIssueIds] = useState<string[]>([]);
  const [pendingRepairConfirmation, setPendingRepairConfirmation] = useState(false);
  const [pendingAuditHistoryImport, setPendingAuditHistoryImport] = useState<{
    preview: IntegrityHistoryImportPreview;
    runs: ReturnType<typeof useTripStore>['integrityAuditRuns'];
    baselineRunId: string | null;
    fileName: string;
  } | null>(null);
  const [pendingClearAuditHistory, setPendingClearAuditHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const snapshotHistoryInputRef = useRef<HTMLInputElement>(null);
  const auditHistoryInputRef = useRef<HTMLInputElement>(null);
  const addedSectionRef = useRef<HTMLDivElement>(null);
  const removedSectionRef = useRef<HTMLDivElement>(null);
  const modifiedSectionRef = useRef<HTMLDivElement>(null);
  const unchangedSectionRef = useRef<HTMLDivElement>(null);
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
        snapshot.label,
        snapshot.notes,
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
      const pinnedMatch =
        snapshotPinnedFilter === 'all' ||
        (snapshotPinnedFilter === 'pinned' ? snapshot.pinned : !snapshot.pinned);
      return backupVersionMatch && applicationVersionMatch && timeRangeMatch && pinnedMatch;
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
    snapshotPinnedFilter,
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
  const deepComparison = useMemo(
    () => (comparisonLeft && comparisonRight ? buildDeepComparison(comparisonLeft, comparisonRight) : null),
    [comparisonLeft, comparisonRight],
  );
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

  const handleExportSnapshotHistory = () => {
    const historyJson = toSnapshotHistoryJson();
    const blob = new Blob([historyJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = snapshotHistoryFileName();
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback({ kind: 'success', message: `Snapshot history exported: ${anchor.download}` });
  };

  const handleImportClick = () => {
    setPendingImport(null);
    inputRef.current?.click();
  };

  const handleImportSnapshotHistoryClick = () => {
    setPendingSnapshotHistoryImport(null);
    snapshotHistoryInputRef.current?.click();
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

  const handleImportSnapshotHistoryFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const parsed = parseSnapshotHistoryBackup(content);
      setPendingSnapshotHistoryImport({
        ...parsed,
        fileName: file.name,
      });
      setFeedback(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Snapshot history import failed.';
      setFeedback({ kind: 'error', message });
      setPendingSnapshotHistoryImport(null);
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

  const handleConfirmSnapshotHistoryImport = () => {
    if (!pendingSnapshotHistoryImport) {
      return;
    }
    importSnapshotHistory(pendingSnapshotHistoryImport.snapshots);
    setFeedback({ kind: 'success', message: 'Snapshot history imported successfully.' });
    setPendingSnapshotHistoryImport(null);
  };

  const handleCancelSnapshotHistoryImport = () => {
    setPendingSnapshotHistoryImport(null);
    setFeedback({ kind: 'success', message: 'Snapshot history import cancelled.' });
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

  const handleStartSnapshotEdit = (snapshot: BackupSnapshot) => {
    setEditingSnapshotId(snapshot.id);
    setDraftSnapshotLabel(snapshot.label);
    setDraftSnapshotNotes(snapshot.notes);
  };

  const handleCancelSnapshotEdit = () => {
    setEditingSnapshotId(null);
    setDraftSnapshotLabel('');
    setDraftSnapshotNotes('');
  };

  const handleSaveSnapshotEdit = () => {
    if (!editingSnapshotId) {
      return;
    }
    updateSnapshotDetails(editingSnapshotId, draftSnapshotLabel, draftSnapshotNotes);
    setFeedback({ kind: 'success', message: 'Snapshot label/notes updated.' });
    handleCancelSnapshotEdit();
  };

  const handleSetSnapshotPinned = (snapshot: BackupSnapshot, pinned: boolean) => {
    setSnapshotPinned(snapshot.id, pinned);
    setFeedback({ kind: 'success', message: pinned ? 'Snapshot pinned.' : 'Snapshot unpinned.' });
  };

  const cleanupLabelByMode: Record<SnapshotCleanupMode, string> = {
    'all-unpinned': 'Delete all unpinned snapshots',
    'older-than-7': 'Delete unpinned snapshots older than 7 days',
    'older-than-30': 'Delete unpinned snapshots older than 30 days',
    'older-than-90': 'Delete unpinned snapshots older than 90 days',
  };

  const handleRequestCleanup = (mode: SnapshotCleanupMode) => {
    const count = getCleanupPreviewCount(mode);
    setPendingCleanup({ mode, count });
  };

  const handleConfirmCleanup = () => {
    if (!pendingCleanup) {
      return;
    }
    const deletedCount = cleanupSnapshots(pendingCleanup.mode);
    setPendingCleanup(null);
    setFeedback({
      kind: 'success',
      message:
        deletedCount === 0
          ? 'No matching unpinned snapshots to delete.'
          : `${deletedCount} unpinned snapshot${deletedCount === 1 ? '' : 's'} deleted.`,
    });
  };

  const handleRetryPersistence = (target: 'active-trip' | 'snapshot-history' | 'both') => {
    const success =
      target === 'active-trip'
        ? retryPersistActiveTrip()
        : target === 'snapshot-history'
          ? retryPersistSnapshotHistory()
          : retryPersistAll();
    if (success) {
      setFeedback({
        kind: 'success',
        message:
          target === 'active-trip'
            ? 'Active trip persistence retry succeeded.'
            : target === 'snapshot-history'
              ? 'Snapshot history persistence retry succeeded.'
              : 'Trip and snapshot persistence retry succeeded.',
      });
      return;
    }
    setFeedback({
      kind: 'error',
      message:
        target === 'active-trip'
          ? 'Active trip persistence retry failed.'
          : target === 'snapshot-history'
            ? 'Snapshot history persistence retry failed.'
            : 'Persistence retry failed for one or more storage targets.',
    });
  };

  const exportJsonFile = (jsonContent: string, fileName: string) => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDiagnostics = () => {
    const diagnosticsJson = toDiagnosticsJson();
    const fileName = diagnosticsFileName();
    exportJsonFile(diagnosticsJson, fileName);
    setFeedback({ kind: 'success', message: `Diagnostics exported: ${fileName}` });
  };

  const handleExportCorruptedRawPayload = (target: 'active-trip' | 'snapshot-history') => {
    try {
      const rawJson = buildCorruptedRawPayloadExport(target);
      const fileName = corruptedRawPayloadFileName(target);
      exportJsonFile(rawJson, fileName);
      setFeedback({ kind: 'success', message: `Raw corrupted payload exported: ${fileName}` });
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Raw payload export failed.' });
    }
  };

  const handleRetryParse = (target: 'active-trip' | 'snapshot-history') => {
    const result = target === 'active-trip' ? retryParseActiveTripStorage() : retryParseSnapshotHistoryStorage();
    setFeedback({ kind: result.ok ? 'success' : 'error', message: result.message });
  };

  const handleConfirmRecoveryAction = () => {
    if (!pendingRecoveryAction) {
      return;
    }
    const result =
      pendingRecoveryAction === 'active-trip' ? resetCorruptedActiveTrip() : clearCorruptedSnapshotHistory();
    setPendingRecoveryAction(null);
    setFeedback({ kind: result.ok ? 'success' : 'error', message: result.message });
  };

  const handleRunIntegrityAudit = () => {
    const report = runIntegrityAudit();
    setSelectedRepairIssueIds(report.repairableIssueIds);
    setPendingRepairConfirmation(false);
    setFeedback({
      kind: 'success',
      message:
        report.issueCount === 0
          ? 'Integrity audit completed with no issues.'
          : `Integrity audit completed: ${report.issueCount} issue${report.issueCount === 1 ? '' : 's'} found.`,
    });
  };

  const handleToggleRepairIssue = (issueId: string) => {
    setSelectedRepairIssueIds((currentSelection) =>
      currentSelection.includes(issueId)
        ? currentSelection.filter((currentId) => currentId !== issueId)
        : [...currentSelection, issueId],
    );
  };

  const handleExportIntegrityAudit = () => {
    try {
      const auditJson = toIntegrityAuditJson();
      const fileName = integrityAuditFileName();
      exportJsonFile(auditJson, fileName);
      setFeedback({ kind: 'success', message: `Integrity audit report exported: ${fileName}` });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Integrity audit report export failed.',
      });
    }
  };

  const handleConfirmApplyRepairs = () => {
    const result = applyIntegrityRepairs(selectedRepairIssueIds);
    setPendingRepairConfirmation(false);
    setFeedback({ kind: result.ok ? 'success' : 'error', message: result.message });
  };

  const handleExportIntegrityHistory = () => {
    try {
      const historyJson = toIntegrityHistoryJson();
      const fileName = integrityHistoryFileName();
      exportJsonFile(historyJson, fileName);
      setFeedback({ kind: 'success', message: `Integrity history exported: ${fileName}` });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Integrity history export failed.',
      });
    }
  };

  const handleImportIntegrityHistoryClick = () => {
    auditHistoryInputRef.current?.click();
  };

  const handleImportIntegrityHistoryFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      const rawValue = await file.text();
      const parsed = parseIntegrityHistoryBackup(rawValue);
      setPendingAuditHistoryImport({
        preview: parsed.preview,
        runs: parsed.runs,
        baselineRunId: parsed.baselineRunId,
        fileName: file.name,
      });
      setFeedback({
        kind: 'success',
        message: `Integrity history preview ready (${parsed.preview.importedRunCount} run${
          parsed.preview.importedRunCount === 1 ? '' : 's'
        }).`,
      });
    } catch (error) {
      setPendingAuditHistoryImport(null);
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Integrity history import parse failed.',
      });
    }
  };

  const handleConfirmImportIntegrityHistory = () => {
    if (!pendingAuditHistoryImport) {
      return;
    }
    importIntegrityHistory(pendingAuditHistoryImport.runs, pendingAuditHistoryImport.baselineRunId);
    setPendingAuditHistoryImport(null);
    setFeedback({ kind: 'success', message: 'Integrity history imported successfully.' });
  };

  const handleDeleteIntegrityRun = (runId: string) => {
    deleteIntegrityRun(runId);
    setFeedback({ kind: 'success', message: 'Audit run deleted.' });
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
    setPendingComparisonRestore({ snapshot, label });
  };

  const handleConfirmComparisonRestore = () => {
    if (!pendingComparisonRestore) {
      return;
    }
    restoreSnapshot(pendingComparisonRestore.snapshot.id);
    setFeedback({ kind: 'success', message: `Snapshot ${pendingComparisonRestore.label} restored successfully.` });
    setComparisonSnapshotIds([]);
    setPendingComparisonRestore(null);
  };

  const handleJumpToSection = (section: 'added' | 'removed' | 'modified' | 'unchanged') => {
    const target =
      section === 'added'
        ? addedSectionRef.current
        : section === 'removed'
          ? removedSectionRef.current
          : section === 'modified'
            ? modifiedSectionRef.current
            : unchangedSectionRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleModifiedItemExpansion = (itemId: string) => {
    setExpandedModifiedIds((currentExpanded) =>
      currentExpanded.includes(itemId)
        ? currentExpanded.filter((currentId) => currentId !== itemId)
        : [...currentExpanded, itemId],
    );
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
            <input
              ref={auditHistoryInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportIntegrityHistoryFile}
            />
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
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-slate-400">
                {snapshots.filter((snapshot) => !snapshot.pinned).length} / {unpinnedSnapshotLimit} unpinned •{' '}
                {snapshots.filter((snapshot) => snapshot.pinned).length} pinned
              </p>
              <button
                type="button"
                onClick={handleExportSnapshotHistory}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
              >
                Export Snapshot History
              </button>
              <button
                type="button"
                onClick={handleImportSnapshotHistoryClick}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
              >
                Import Snapshot History
              </button>
            </div>
          </div>
          <input
            ref={snapshotHistoryInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportSnapshotHistoryFile}
          />

          {pendingSnapshotHistoryImport ? (
            <div className="mt-3 rounded-xl border border-sky-300/30 bg-sky-500/10 p-3">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Snapshot history import preview</p>
              <p className="mt-1 text-xs text-slate-300">File: {pendingSnapshotHistoryImport.fileName}</p>
              <dl className="mt-2 grid gap-2 text-xs text-slate-200 md:grid-cols-2">
                <div>
                  <dt className="text-slate-400">History version</dt>
                  <dd>{pendingSnapshotHistoryImport.preview.historyVersion}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Application version</dt>
                  <dd>{pendingSnapshotHistoryImport.preview.applicationVersion}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Exported timestamp</dt>
                  <dd>{pendingSnapshotHistoryImport.preview.exportedAt}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Total snapshot count</dt>
                  <dd>
                    {pendingSnapshotHistoryImport.preview.totalSnapshotCount} (importing{' '}
                    {pendingSnapshotHistoryImport.snapshots.length})
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmSnapshotHistoryImport}
                  className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs text-emerald-100"
                >
                  Confirm import
                </button>
                <button
                  type="button"
                  onClick={handleCancelSnapshotHistoryImport}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Storage health</p>
            <dl className="mt-3 grid gap-2 text-xs text-slate-200 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <dt className="text-slate-400">Active trip storage status</dt>
                <dd className={storageHealth.activeTripStorageStatus === 'healthy' ? 'text-emerald-300' : 'text-rose-300'}>
                  {storageHealth.activeTripStorageStatus === 'healthy' ? 'Healthy' : 'Error'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Snapshot history storage status</dt>
                <dd className={storageHealth.snapshotHistoryStorageStatus === 'healthy' ? 'text-emerald-300' : 'text-rose-300'}>
                  {storageHealth.snapshotHistoryStorageStatus === 'healthy' ? 'Healthy' : 'Error'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Estimated stored data size</dt>
                <dd>{formatBytes(storageHealth.estimatedStoredBytes)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Total snapshots</dt>
                <dd>{storageHealth.totalSnapshotCount}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Pinned snapshots</dt>
                <dd>{storageHealth.pinnedSnapshotCount}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Unpinned snapshots</dt>
                <dd>{storageHealth.unpinnedSnapshotCount}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Last successful persistence</dt>
                <dd>{storageHealth.lastSuccessfulPersistenceAt ? formatSnapshotDate(storageHealth.lastSuccessfulPersistenceAt) : 'Not yet recorded'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Active trip storage key</dt>
                <dd className="break-all">{storageKeys.activeTrip}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Snapshot storage key</dt>
                <dd className="break-all">{storageKeys.snapshotHistory}</dd>
              </div>
            </dl>

            {storageHealth.mostRecentPersistenceError ? (
              <div className="mt-3 rounded-lg border border-rose-300/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                <p className="font-medium">Most recent persistence error</p>
                <p className="mt-1">
                  [{storageHealth.mostRecentPersistenceError.target}] {storageHealth.mostRecentPersistenceError.message}
                </p>
                <p className="mt-1 text-rose-300">
                  {formatSnapshotDate(storageHealth.mostRecentPersistenceError.occurredAt)}
                </p>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRetryPersistence('active-trip')}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
              >
                Retry active trip save
              </button>
              <button
                type="button"
                onClick={() => handleRetryPersistence('snapshot-history')}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
              >
                Retry snapshot save
              </button>
              <button
                type="button"
                onClick={() => handleRetryPersistence('both')}
                className="rounded-full border border-sky-300/40 px-3 py-1 text-xs text-sky-100"
              >
                Retry both saves
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRequestCleanup('all-unpinned')}
                className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100"
              >
                Delete all unpinned
              </button>
              <button
                type="button"
                onClick={() => handleRequestCleanup('older-than-7')}
                className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100"
              >
                Delete older than 7 days
              </button>
              <button
                type="button"
                onClick={() => handleRequestCleanup('older-than-30')}
                className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100"
              >
                Delete older than 30 days
              </button>
              <button
                type="button"
                onClick={() => handleRequestCleanup('older-than-90')}
                className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100"
              >
                Delete older than 90 days
              </button>
            </div>

            {pendingCleanup ? (
              <div className="mt-3 rounded-lg border border-amber-300/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                <p className="font-medium">{cleanupLabelByMode[pendingCleanup.mode]}</p>
                <p className="mt-1">
                  This will delete {pendingCleanup.count} unpinned snapshot{pendingCleanup.count === 1 ? '' : 's'}.
                  Pinned snapshots are protected.
                </p>
                <p className="mt-1 text-amber-200">Active trip data will remain unchanged.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportSnapshotHistory}
                    className="rounded-full border border-sky-300/40 px-3 py-1 text-xs text-sky-100"
                  >
                    Export Snapshot History
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCleanup}
                    className="rounded-full border border-amber-300/50 px-3 py-1 text-xs text-amber-100"
                  >
                    Continue cleanup
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingCleanup(null)}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                  >
                    Cancel cleanup
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Diagnostics &amp; Recovery</p>
              <button
                type="button"
                onClick={handleExportDiagnostics}
                className="rounded-full border border-sky-300/40 px-3 py-1 text-xs text-sky-100"
              >
                Export Diagnostics
              </button>
            </div>

            <dl className="mt-3 grid gap-2 text-xs text-slate-200 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <dt className="text-slate-400">Application version</dt>
                <dd>{storageDiagnostics.applicationVersion}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Backup version</dt>
                <dd>{storageDiagnostics.backupVersion}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Snapshot-history version</dt>
                <dd>{storageDiagnostics.snapshotHistoryVersion}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Active-trip raw payload size</dt>
                <dd>{formatBytes(storageDiagnostics.activeTripRawPayloadSize)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Snapshot-history raw payload size</dt>
                <dd>{formatBytes(storageDiagnostics.snapshotHistoryRawPayloadSize)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Total estimated stored size</dt>
                <dd>{formatBytes(storageDiagnostics.totalEstimatedStoredSize)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Active-trip parse status</dt>
                <dd>{storageDiagnostics.activeTripParseStatus}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Snapshot-history parse status</dt>
                <dd>{storageDiagnostics.snapshotHistoryParseStatus}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Browser timestamp</dt>
                <dd>{formatSnapshotDate(storageDiagnostics.browserTimestamp)}</dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <article className="rounded-lg border border-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Active trip target</p>
                <p className="mt-1 text-xs text-slate-400">Storage key: {storageDiagnostics.activeTripStorageKey}</p>
                {activeTripCorruption ? (
                  <div className="mt-2 rounded-md border border-rose-300/40 bg-rose-500/10 p-2 text-xs text-rose-200">
                    <p className="font-medium">Corruption detected</p>
                    <p className="mt-1">{activeTripCorruption.message}</p>
                    <p className="mt-1 text-rose-300">Detected: {formatSnapshotDate(activeTripCorruption.detectedAt)}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-emerald-300">No active-trip corruption detected.</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRetryParse('active-trip')}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                  >
                    Retry Active Trip Parse
                  </button>
                  {activeTripCorruption ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleExportCorruptedRawPayload('active-trip')}
                        className="rounded-full border border-sky-300/40 px-3 py-1 text-xs text-sky-100"
                      >
                        Export Raw Active Trip Payload
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingRecoveryAction('active-trip')}
                        className="rounded-full border border-rose-300/40 px-3 py-1 text-xs text-rose-100"
                      >
                        Reset Corrupted Active Trip
                      </button>
                    </>
                  ) : null}
                </div>
              </article>

              <article className="rounded-lg border border-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Snapshot history target</p>
                <p className="mt-1 text-xs text-slate-400">Storage key: {storageDiagnostics.snapshotHistoryStorageKey}</p>
                {snapshotHistoryCorruption ? (
                  <div className="mt-2 rounded-md border border-rose-300/40 bg-rose-500/10 p-2 text-xs text-rose-200">
                    <p className="font-medium">Corruption detected</p>
                    <p className="mt-1">{snapshotHistoryCorruption.message}</p>
                    <p className="mt-1 text-rose-300">
                      Detected: {formatSnapshotDate(snapshotHistoryCorruption.detectedAt)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-emerald-300">No snapshot-history corruption detected.</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRetryParse('snapshot-history')}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                  >
                    Retry Snapshot History Parse
                  </button>
                  {snapshotHistoryCorruption ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleExportCorruptedRawPayload('snapshot-history')}
                        className="rounded-full border border-sky-300/40 px-3 py-1 text-xs text-sky-100"
                      >
                        Export Raw Snapshot History Payload
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingRecoveryAction('snapshot-history')}
                        className="rounded-full border border-rose-300/40 px-3 py-1 text-xs text-rose-100"
                      >
                        Clear Corrupted Snapshot History
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            </div>

            {pendingRecoveryAction ? (
              <div className="mt-3 rounded-lg border border-rose-300/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                <p className="font-medium">
                  {pendingRecoveryAction === 'active-trip'
                    ? 'Reset corrupted active trip to seeded demo trip?'
                    : 'Clear corrupted snapshot history?'}
                </p>
                <p className="mt-1">
                  {pendingRecoveryAction === 'active-trip'
                    ? 'Snapshot history remains unchanged.'
                    : 'Active trip remains unchanged.'}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmRecoveryAction}
                    className="rounded-full border border-rose-300/50 px-3 py-1 text-xs text-rose-100"
                  >
                    Confirm recovery
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingRecoveryAction(null)}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Integrity Audit</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRunIntegrityAudit}
                  className="rounded-full border border-sky-300/40 px-3 py-1 text-xs text-sky-100"
                >
                  Run Integrity Audit
                </button>
                <button
                  type="button"
                  onClick={handleExportIntegrityAudit}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                >
                  Export Audit Report
                </button>
              </div>
            </div>

            {integrityAuditReport ? (
              <>
                <div className="mt-3 grid gap-2 text-xs text-slate-200 md:grid-cols-2 xl:grid-cols-5">
                  <p>Total issues: {integrityAuditReport.issueCount}</p>
                  <p>Warnings: {integrityAuditReport.warningCount}</p>
                  <p>Repairable errors: {integrityAuditReport.repairableErrorCount}</p>
                  <p>Blocking errors: {integrityAuditReport.blockingErrorCount}</p>
                  <p>Generated: {formatSnapshotDate(integrityAuditReport.generatedAt)}</p>
                </div>

                <div className="mt-3 space-y-2">
                  {integrityAuditReport.issues.length === 0 ? (
                    <p className="text-xs text-emerald-300">No integrity issues detected.</p>
                  ) : (
                    integrityAuditReport.issues.map((issue) => {
                      const selectable = issue.automaticRepairAvailable;
                      const isSelected = selectedRepairIssueIds.includes(issue.id);
                      return (
                        <article key={issue.id} className="rounded-lg border border-white/10 p-3 text-xs text-slate-200">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">
                                [{issue.target}] {issue.issueType}
                              </p>
                              <p className="text-slate-400">Record: {issue.affectedRecord}</p>
                              <p className="mt-1">{issue.description}</p>
                              <p className="mt-1 text-slate-300">Proposed repair: {issue.proposedRepair}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${
                                  issue.severity === 'warning'
                                    ? 'border border-amber-300/50 text-amber-200'
                                    : issue.severity === 'repairable-error'
                                      ? 'border border-sky-300/50 text-sky-200'
                                      : 'border border-rose-300/50 text-rose-200'
                                }`}
                              >
                                {issue.severity}
                              </span>
                              {selectable ? (
                                <label className="flex items-center gap-1 text-[11px] text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleRepairIssue(issue.id)}
                                  />
                                  Apply repair
                                </label>
                              ) : (
                                <span className="text-[11px] text-slate-400">Automatic repair unavailable</span>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>

                <div className="mt-3 rounded-lg border border-white/10 p-3 text-xs text-slate-200">
                  <p className="font-medium text-slate-100">Repair preview</p>
                  <p className="mt-1">Repairable issues detected: {integrityAuditReport.repairableIssueIds.length}</p>
                  <p>Selected repairs: {selectedRepairIssueIds.length}</p>
                  <p>
                    Unresolved after selected apply:{' '}
                    {integrityAuditReport.issueCount - selectedRepairIssueIds.length}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingRepairConfirmation(true)}
                      className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs text-emerald-100"
                    >
                      Apply Selected Repairs
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRepairIssueIds(integrityAuditReport.repairableIssueIds);
                        setPendingRepairConfirmation(false);
                      }}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                    >
                      Reset selection
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearIntegrityAudit();
                        setSelectedRepairIssueIds([]);
                        setPendingRepairConfirmation(false);
                      }}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {pendingRepairConfirmation ? (
                  <div className="mt-3 rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                    <p className="font-medium">Apply selected integrity repairs?</p>
                    <p className="mt-1">
                      Selected repairs: {selectedRepairIssueIds.length}. Unselected and unresolved issues remain listed.
                    </p>
                    <p className="mt-1">
                      Pre-repair protection is created automatically for active-trip repairs and internal snapshot backups.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmApplyRepairs}
                        className="rounded-full border border-emerald-300/50 px-3 py-1 text-xs text-emerald-100"
                      >
                        Confirm apply
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingRepairConfirmation(false)}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-xs text-slate-400">No audit has been run yet.</p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Audit History</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportIntegrityHistory}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                >
                  Export Audit History
                </button>
                <button
                  type="button"
                  onClick={handleImportIntegrityHistoryClick}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                >
                  Import Audit History
                </button>
                <button
                  type="button"
                  onClick={clearIntegrityBaselineRun}
                  disabled={!selectedIntegrityBaselineRunId}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear Baseline
                </button>
                <button
                  type="button"
                  onClick={() => setPendingClearAuditHistory(true)}
                  disabled={integrityAuditRuns.length === 0}
                  className="rounded-full border border-rose-300/40 px-3 py-1 text-xs text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear Audit History
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-300">
              <p>Total runs retained: {integrityAuditRuns.length} / 20</p>
              <p>
                Selected baseline:{' '}
                {selectedIntegrityBaselineRunId ? `${selectedIntegrityBaselineRunId.slice(0, 8)}...` : 'None'}
              </p>
            </div>

            {latestVsBaselineChangeSummary ? (
              <div className="mt-3 rounded-lg border border-white/10 p-3 text-xs text-slate-200">
                <p className="font-medium text-slate-100">
                  Latest vs baseline result: {latestVsBaselineChangeSummary.result}
                </p>
                <div className="mt-2 grid gap-1 md:grid-cols-2">
                  <p>Total issue delta: {latestVsBaselineChangeSummary.totalIssueDelta}</p>
                  <p>Warning delta: {latestVsBaselineChangeSummary.warningDelta}</p>
                  <p>Repairable-error delta: {latestVsBaselineChangeSummary.repairableErrorDelta}</p>
                  <p>Blocking-error delta: {latestVsBaselineChangeSummary.blockingErrorDelta}</p>
                  <p>Active-trip issue delta: {latestVsBaselineChangeSummary.activeTripIssueDelta}</p>
                  <p>Snapshot-history issue delta: {latestVsBaselineChangeSummary.snapshotHistoryIssueDelta}</p>
                </div>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  <div>
                    <p className="text-slate-400">Newly introduced</p>
                    <p className="mt-1 max-h-20 overflow-auto break-all text-[11px]">
                      {latestVsBaselineChangeSummary.newlyIntroducedFingerprints.join(', ') || 'None'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Resolved</p>
                    <p className="mt-1 max-h-20 overflow-auto break-all text-[11px]">
                      {latestVsBaselineChangeSummary.resolvedFingerprints.join(', ') || 'None'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Unchanged</p>
                    <p className="mt-1 max-h-20 overflow-auto break-all text-[11px]">
                      {latestVsBaselineChangeSummary.unchangedFingerprints.join(', ') || 'None'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-400">Set a baseline to enable latest-vs-baseline comparison.</p>
            )}

            <div className="mt-3 space-y-2">
              {integrityAuditRuns.length === 0 ? (
                <p className="text-xs text-slate-400">No integrity history runs recorded yet.</p>
              ) : (
                integrityAuditRuns.map((run, index) => (
                  <article key={run.id} className="rounded-lg border border-white/10 p-3 text-xs text-slate-200">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-100">
                          Run #{integrityAuditRuns.length - index} • {formatSnapshotDate(run.generatedAt)}
                        </p>
                        <p className="text-slate-400">
                          Type: {run.runType} • Duration: {run.durationMs} ms • Total: {run.totalIssueCount}
                        </p>
                        <p className="text-slate-400">
                          W:{run.warningCount} • R:{run.repairableErrorCount} • B:{run.blockingErrorCount} •
                          Active:{run.activeTripIssueCount} • Snapshot:{run.snapshotHistoryIssueCount}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedIntegrityBaselineRunId === run.id ? (
                          <span className="rounded-full border border-emerald-300/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-emerald-200">
                            Baseline
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setIntegrityBaselineRun(run.id)}
                          className="rounded-full border border-white/20 px-2 py-1 text-[11px] text-slate-100"
                        >
                          Set as Baseline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteIntegrityRun(run.id)}
                          className="rounded-full border border-rose-300/40 px-2 py-1 text-[11px] text-rose-100"
                        >
                          Delete Run
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {pendingAuditHistoryImport ? (
              <div className="mt-3 rounded-lg border border-sky-300/30 bg-sky-500/10 p-3 text-xs text-slate-200">
                <p className="font-medium text-sky-200">Audit history import preview</p>
                <p className="mt-1 text-slate-300">File: {pendingAuditHistoryImport.fileName}</p>
                <div className="mt-2 grid gap-1 md:grid-cols-2">
                  <p>History version: {pendingAuditHistoryImport.preview.historyVersion}</p>
                  <p>Exported at: {pendingAuditHistoryImport.preview.exportedAt}</p>
                  <p>Total runs in file: {pendingAuditHistoryImport.preview.totalRunCount}</p>
                  <p>Runs to import: {pendingAuditHistoryImport.preview.importedRunCount}</p>
                  <p>
                    Baseline in import:{' '}
                    {pendingAuditHistoryImport.preview.baselineRunId
                      ? `${pendingAuditHistoryImport.preview.baselineRunId.slice(0, 8)}...`
                      : 'None'}
                  </p>
                </div>
                <p className="mt-2 text-slate-300">
                  Import replaces audit history metadata only. Active trip and snapshot history remain unchanged.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmImportIntegrityHistory}
                    className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs text-emerald-100"
                  >
                    Confirm import
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAuditHistoryImport(null)}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {pendingClearAuditHistory ? (
              <div className="mt-3 rounded-lg border border-rose-300/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                <p className="font-medium">Clear all retained audit history?</p>
                <p className="mt-1 text-rose-100">
                  This clears audit-history metadata only. Active trip, snapshots, backups, diagnostics, and recovery
                  data remain unchanged.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearIntegrityHistory();
                      setPendingClearAuditHistory(false);
                      setFeedback({ kind: 'success', message: 'Audit history cleared.' });
                    }}
                    className="rounded-full border border-rose-300/50 px-3 py-1 text-xs text-rose-100"
                  >
                    Confirm clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingClearAuditHistory(false)}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
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
            <label className="rounded-xl border border-white/10 px-3 py-2 text-xs">
              <span className="text-slate-400">Pinned filter</span>
              <select
                value={snapshotPinnedFilter}
                onChange={(event) => setSnapshotPinnedFilter(event.target.value as SnapshotPinnedFilter)}
                className="mt-1 w-full bg-transparent text-sm text-slate-100 outline-none"
              >
                <option value="all" className="bg-slate-900">
                  All snapshots
                </option>
                <option value="pinned" className="bg-slate-900">
                  Pinned only
                </option>
                <option value="unpinned" className="bg-slate-900">
                  Unpinned only
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
                      <p className="flex flex-wrap items-center gap-2">
                        <span>{snapshot.label.trim().length > 0 ? snapshot.label : snapshot.tripTitle}</span>
                        {snapshot.pinned ? (
                          <span className="rounded-full border border-amber-300/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-amber-200">
                            Pinned
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatSnapshotDate(snapshot.createdAt)} • {snapshot.itineraryItemCount} items • backup v
                        {snapshot.backupVersion} • app v{snapshot.applicationVersion}
                      </p>
                      {snapshot.notes.trim().length > 0 ? <p className="mt-1 text-xs text-slate-300">{snapshot.notes}</p> : null}
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
                        onClick={() => handleSetSnapshotPinned(snapshot, !snapshot.pinned)}
                        className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100"
                      >
                        {snapshot.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartSnapshotEdit(snapshot)}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                      >
                        Edit label/notes
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
                  {editingSnapshotId === snapshot.id ? (
                    <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/40 p-3">
                      <label className="block text-xs text-slate-300">
                        Label (optional)
                        <input
                          value={draftSnapshotLabel}
                          maxLength={snapshotLabelLimit}
                          onChange={(event) => setDraftSnapshotLabel(event.target.value)}
                          className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-2 py-1 text-sm text-slate-100 outline-none"
                          placeholder="Important checkpoint"
                        />
                        <span className="mt-1 block text-[11px] text-slate-400">
                          {draftSnapshotLabel.length}/{snapshotLabelLimit}
                        </span>
                      </label>
                      <label className="mt-2 block text-xs text-slate-300">
                        Notes (optional)
                        <textarea
                          value={draftSnapshotNotes}
                          maxLength={snapshotNotesLimit}
                          onChange={(event) => setDraftSnapshotNotes(event.target.value)}
                          className="mt-1 min-h-20 w-full rounded-md border border-white/10 bg-transparent px-2 py-1 text-sm text-slate-100 outline-none"
                          placeholder="Why this snapshot matters"
                        />
                        <span className="mt-1 block text-[11px] text-slate-400">
                          {draftSnapshotNotes.length}/{snapshotNotesLimit}
                        </span>
                      </label>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveSnapshotEdit}
                          className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs text-emerald-100"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelSnapshotEdit}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
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
                  <p className="mt-1 text-xs text-slate-400">
                    {comparisonLeft.label.trim().length > 0 ? comparisonLeft.label : comparisonLeft.tripTitle}
                  </p>
                  <p className="text-xs text-slate-400">{formatSnapshotDate(comparisonLeft.createdAt)}</p>
                  <p className="text-xs text-slate-400">{comparisonLeft.itineraryItemCount} items</p>
                  <p className="text-xs text-slate-400">Backup v{comparisonLeft.backupVersion}</p>
                  <p className="text-xs text-slate-400">App v{comparisonLeft.applicationVersion}</p>
                  <p className="text-xs text-slate-400">Linked records: {comparisonLeft.linkedRecordCount ?? 'Not provided'}</p>
                  <p className="text-xs text-slate-400">Notes: {comparisonLeft.notes.trim().length > 0 ? comparisonLeft.notes : 'Not provided'}</p>
                </article>
                <article className="rounded-xl border border-white/10 p-3">
                  <p className="text-sm font-medium text-slate-100">Snapshot B</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {comparisonRight.label.trim().length > 0 ? comparisonRight.label : comparisonRight.tripTitle}
                  </p>
                  <p className="text-xs text-slate-400">{formatSnapshotDate(comparisonRight.createdAt)}</p>
                  <p className="text-xs text-slate-400">{comparisonRight.itineraryItemCount} items</p>
                  <p className="text-xs text-slate-400">Backup v{comparisonRight.backupVersion}</p>
                  <p className="text-xs text-slate-400">App v{comparisonRight.applicationVersion}</p>
                  <p className="text-xs text-slate-400">Linked records: {comparisonRight.linkedRecordCount ?? 'Not provided'}</p>
                  <p className="text-xs text-slate-400">Notes: {comparisonRight.notes.trim().length > 0 ? comparisonRight.notes : 'Not provided'}</p>
                </article>
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-300">
                <li>Trip title: {comparisonLeft.tripTitle === comparisonRight.tripTitle ? 'same' : 'different'}</li>
                <li>
                  Snapshot label:{' '}
                  {comparisonLeft.label.trim() === comparisonRight.label.trim() ? 'same' : 'different'}
                </li>
                <li>
                  Snapshot notes:{' '}
                  {comparisonLeft.notes.trim() === comparisonRight.notes.trim() ? 'same' : 'different'}
                </li>
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

              {deepComparison ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Deep itinerary comparison (read-only)</p>
                  <div className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-3">
                    <p>Total added: {deepComparison.added.length}</p>
                    <p>Total removed: {deepComparison.removed.length}</p>
                    <p>Total modified: {deepComparison.modified.length}</p>
                    <p>Total unchanged: {deepComparison.unchanged.length}</p>
                    <p>Total items in Snapshot A: {comparisonLeft.trip.stops.length}</p>
                    <p>Total items in Snapshot B: {comparisonRight.trip.stops.length}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleJumpToSection('added')}
                      className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs text-emerald-100"
                    >
                      Jump to Added
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJumpToSection('removed')}
                      className="rounded-full border border-rose-300/40 px-3 py-1 text-xs text-rose-100"
                    >
                      Jump to Removed
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJumpToSection('modified')}
                      className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100"
                    >
                      Jump to Modified
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJumpToSection('unchanged')}
                      className="rounded-full border border-slate-300/40 px-3 py-1 text-xs text-slate-100"
                    >
                      Jump to Unchanged
                    </button>
                  </div>

                  <div ref={addedSectionRef} className="mt-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Added ({deepComparison.added.length})</p>
                    {deepComparison.added.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-400">No added items.</p>
                    ) : (
                      <ul className="mt-2 space-y-2 text-xs text-slate-200">
                        {deepComparison.added.map((item) => (
                          <li key={item.id} className="rounded-lg border border-emerald-300/30 p-2">
                            <p>{item.title}</p>
                            <p className="text-slate-400">{item.date} • {item.location}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div ref={removedSectionRef} className="mt-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-rose-300">Removed ({deepComparison.removed.length})</p>
                    {deepComparison.removed.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-400">No removed items.</p>
                    ) : (
                      <ul className="mt-2 space-y-2 text-xs text-slate-200">
                        {deepComparison.removed.map((item) => (
                          <li key={item.id} className="rounded-lg border border-rose-300/30 p-2">
                            <p>{item.title}</p>
                            <p className="text-slate-400">{item.date} • {item.location}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div ref={modifiedSectionRef} className="mt-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Modified ({deepComparison.modified.length})</p>
                      <button
                        type="button"
                        onClick={() => setModifiedSectionCollapsed((currentValue) => !currentValue)}
                        className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100"
                      >
                        {modifiedSectionCollapsed ? 'Expand modified section' : 'Collapse modified section'}
                      </button>
                    </div>
                    {modifiedSectionCollapsed ? (
                      <p className="mt-2 text-xs text-slate-400">Modified section is collapsed.</p>
                    ) : deepComparison.modified.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-400">No modified items.</p>
                    ) : (
                      <ul className="mt-2 space-y-2 text-xs text-slate-200">
                        {deepComparison.modified.map((item) => {
                          const isExpanded = expandedModifiedIds.includes(item.id);
                          return (
                            <li key={item.id} className="rounded-lg border border-amber-300/30 p-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p>{item.itemB.title}</p>
                                <button
                                  type="button"
                                  onClick={() => toggleModifiedItemExpansion(item.id)}
                                  className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-100"
                                >
                                  {isExpanded ? 'Collapse details' : 'Expand details'}
                                </button>
                              </div>
                              {isExpanded ? (
                                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                                  {item.fieldDiffs.map((diff) => (
                                    <li key={`${item.id}-${diff.fieldLabel}`}>
                                      <span className="text-slate-100">{diff.fieldLabel}:</span> A="{diff.valueA}" vs B="{diff.valueB}"
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div ref={unchangedSectionRef} className="mt-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Unchanged ({deepComparison.unchanged.length})</p>
                    {deepComparison.unchanged.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-400">No unchanged items.</p>
                    ) : (
                      <ul className="mt-2 space-y-2 text-xs text-slate-200">
                        {deepComparison.unchanged.map((item) => (
                          <li key={item.id} className="rounded-lg border border-slate-300/30 p-2">
                            <p>{item.title}</p>
                            <p className="text-slate-400">{item.date} • {item.location}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}

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

              {pendingComparisonRestore ? (
                <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-3">
                  <p className="text-xs text-slate-200">
                    Restore Snapshot {pendingComparisonRestore.label} ({pendingComparisonRestore.snapshot.tripTitle})?
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmComparisonRestore}
                      className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs text-emerald-100"
                    >
                      Confirm restore
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingComparisonRestore(null)}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {pendingSnapshotRestore ? (
            <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Snapshot preview</p>
              <p className="mt-2 text-sm text-slate-200">
                {pendingSnapshotRestore.label.trim().length > 0 ? pendingSnapshotRestore.label : pendingSnapshotRestore.tripTitle}
              </p>
              <p className="text-xs text-slate-400">
                {snapshotPreviewDate} • {pendingSnapshotRestore.itineraryItemCount} items • backup v
                {pendingSnapshotRestore.backupVersion} • app v{pendingSnapshotRestore.applicationVersion}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Notes: {pendingSnapshotRestore.notes.trim().length > 0 ? pendingSnapshotRestore.notes : 'Not provided'}
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
