import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTripStore } from './useTripStore';

const TRIP_KEY = 'travel-buddy:trip-state:v1';
const SNAPSHOT_KEY = 'travel-buddy:trip-snapshots:v1';

describe('useTripStore workflow regression coverage', () => {
  beforeEach(() => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
  });

  it('supports trip CRUD operations and persistence hydration', () => {
    const { result, unmount } = renderHook(() => useTripStore());
    const initialCount = result.current.sortedStops.length;
    act(() => {
      result.current.addStop();
    });
    expect(result.current.sortedStops.length).toBe(initialCount + 1);

    const addedId = result.current.sortedStops.at(-1)?.id ?? '';
    act(() => {
      result.current.editStop(addedId, 'Changed', 'Updated');
      result.current.duplicateStop(addedId);
    });
    expect(result.current.sortedStops.some((stop) => stop.title.includes('Changed'))).toBe(true);

    act(() => {
      result.current.deleteStop(addedId);
    });
    expect(result.current.sortedStops.some((stop) => stop.id === addedId)).toBe(false);

    const persistedTrip = localStorage.getItem(TRIP_KEY);
    expect(persistedTrip).not.toBeNull();

    unmount();
    const rehydrated = renderHook(() => useTripStore());
    expect(rehydrated.result.current.trip.tripName.length).toBeGreaterThan(0);
  });

  it('exports/imports valid backup and rejects malformed/unsupported versions', () => {
    const { result } = renderHook(() => useTripStore());
    const backupJson = result.current.toBackupJson();
    const parsed = result.current.parseTripBackupPreview(backupJson);
    expect(parsed.trip.tripName).toBeTruthy();

    act(() => {
      result.current.importTrip(parsed.trip);
    });

    expect(() => result.current.parseTripBackupPreview('{bad')).toThrow('Backup file is not valid JSON.');

    const unsupportedBackup = {
      schema: 'travel-buddy-backup',
      backupVersion: 999,
      applicationVersion: '0.0.0',
      exportedAt: new Date().toISOString(),
      tripTitle: 'X',
      trip: parsed.trip,
    };
    expect(() => result.current.parseTripBackupPreview(JSON.stringify(unsupportedBackup))).toThrow(
      /not supported/i,
    );
  });

  it('handles snapshot lifecycle and retention cap for unpinned snapshots', () => {
    const { result } = renderHook(() => useTripStore());
    for (let index = 0; index < 14; index += 1) {
      act(() => {
        result.current.addStop();
      });
    }
    const unpinned = result.current.snapshots.filter((snapshot) => !snapshot.pinned).length;
    expect(unpinned).toBeLessThanOrEqual(result.current.unpinnedSnapshotLimit);
    expect(localStorage.getItem(SNAPSHOT_KEY)).not.toBeNull();
  });

  it('supports audit history retention and baseline replacement', () => {
    const { result } = renderHook(() => useTripStore());
    for (let index = 0; index < 24; index += 1) {
      act(() => {
        result.current.runIntegrityAudit();
      });
    }
    expect(result.current.integrityAuditRuns.length).toBeLessThanOrEqual(20);

    const first = result.current.integrityAuditRuns[0]?.id ?? '';
    const second = result.current.integrityAuditRuns[1]?.id ?? '';
    act(() => {
      result.current.setIntegrityBaselineRun(first);
    });
    expect(result.current.selectedIntegrityBaselineRunId).toBe(first);
    act(() => {
      result.current.setIntegrityBaselineRun(second);
    });
    expect(result.current.selectedIntegrityBaselineRunId).toBe(second);
  });

  it('keeps simulation non-destructive and compaction user-driven', () => {
    const { result } = renderHook(() => useTripStore());
    act(() => {
      result.current.runIntegrityAudit();
    });
    const beforeTrip = localStorage.getItem(TRIP_KEY);
    const beforeSnapshots = localStorage.getItem(SNAPSHOT_KEY);
    const beforeHistory = JSON.stringify(result.current.integrityAuditRuns);

    act(() => {
      result.current.simulateSelectedRepairs([]);
      result.current.getRepairImpactAnalysis([]);
      result.current.toIntegrityReportJson({
        selectedTrendWindow: 'latest-5',
        repairImpactSummary: null,
        simulationSummary: null,
      });
      result.current.runIntegrityDiagnostics();
    });

    expect(localStorage.getItem(TRIP_KEY)).toBe(beforeTrip);
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBe(beforeSnapshots);
    expect(JSON.stringify(result.current.integrityAuditRuns)).toBe(beforeHistory);

    act(() => {
      result.current.compactIntegrityHistory();
    });
    expect(result.current.integrityAuditRuns.length).toBeLessThanOrEqual(20);
  });

  it('round-trips snapshot history export/import and preserves pin state', () => {
    const { result } = renderHook(() => useTripStore());
    act(() => {
      result.current.addStop();
    });
    const snapshotId = result.current.snapshots[0]?.id;
    expect(snapshotId).toBeTruthy();

    act(() => {
      if (snapshotId) {
        result.current.updateSnapshotDetails(snapshotId, 'Pinned stop', 'Keep me');
        result.current.setSnapshotPinned(snapshotId, true);
      }
    });

    const exported = result.current.toSnapshotHistoryJson();
    const parsed = result.current.parseSnapshotHistoryBackup(exported);
    expect(parsed.snapshots.some((snapshot) => snapshot.pinned && snapshot.label === 'Pinned stop')).toBe(true);

    act(() => {
      result.current.importSnapshotHistory(parsed.snapshots);
    });
    expect(result.current.snapshots.some((snapshot) => snapshot.pinned && snapshot.label === 'Pinned stop')).toBe(
      true,
    );
  });

  it('rejects unsupported snapshot history versions without mutating snapshots', () => {
    const { result } = renderHook(() => useTripStore());
    act(() => {
      result.current.addStop();
    });
    const before = JSON.stringify(result.current.snapshots);
    const invalid = {
      schema: 'travel-buddy-snapshot-history',
      snapshotHistoryVersion: 999,
      exportedAt: new Date().toISOString(),
      snapshots: result.current.snapshots,
    };
    expect(() => result.current.parseSnapshotHistoryBackup(JSON.stringify(invalid))).toThrow(/not supported/i);
    expect(JSON.stringify(result.current.snapshots)).toBe(before);
  });
});
