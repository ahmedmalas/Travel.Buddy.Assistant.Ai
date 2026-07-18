import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTripStore } from './useTripStore';

const TRIP_KEY = 'travel-buddy:trip-state:v1';
const SNAPSHOT_KEY = 'travel-buddy:trip-snapshots:v1';
const HISTORY_KEY = 'travel-buddy:integrity-history:v1';
const BASELINE_KEY = 'travel-buddy:integrity-history-baseline:v1';

const setDeterministicClock = () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
};

describe('useTripStore integrity-history hydration and regression coverage', () => {
  beforeEach(() => {
    setDeterministicClock();
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
  });

  it('hydrates safely when integrity history metadata is missing', () => {
    localStorage.removeItem(HISTORY_KEY);
    const { result } = renderHook(() => useTripStore());
    expect(result.current.integrityAuditRuns).toEqual([]);
  });

  it('hydrates correctly when integrity history metadata is valid', () => {
    const validRun = {
      id: 'run-1',
      generatedAt: '2026-01-01T10:00:00.000Z',
      applicationVersion: '0.1.0',
      backupVersion: 2,
      snapshotHistoryVersion: 1,
      totalIssueCount: 1,
      warningCount: 1,
      repairableErrorCount: 0,
      blockingErrorCount: 0,
      repairableIssueCount: 0,
      unresolvedIssueCount: 1,
      activeTripIssueCount: 1,
      snapshotHistoryIssueCount: 0,
      durationMs: 10,
      issueFingerprints: ['active-trip|missing-date|stops[0].date|warning'],
      runType: 'manual-audit',
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([validRun]));
    localStorage.setItem(BASELINE_KEY, JSON.stringify('run-1'));
    const { result } = renderHook(() => useTripStore());
    expect(result.current.integrityAuditRuns).toHaveLength(1);
    expect(result.current.selectedIntegrityBaselineRunId).toBe('run-1');
  });

  it('does not overwrite corrupted integrity history automatically on startup', () => {
    localStorage.setItem(HISTORY_KEY, '{corrupted-json');
    const original = localStorage.getItem(HISTORY_KEY);
    renderHook(() => useTripStore());
    expect(localStorage.getItem(HISTORY_KEY)).toBe(original);
  });

  it('restores valid history persistence after user-triggered audit write', () => {
    localStorage.setItem(HISTORY_KEY, '{corrupted-json');
    const { result } = renderHook(() => useTripStore());

    act(() => {
      result.current.runIntegrityAudit();
    });

    const persisted = localStorage.getItem(HISTORY_KEY);
    expect(persisted).not.toBeNull();
    expect(() => JSON.parse(persisted ?? '')).not.toThrow();
    expect(result.current.integrityAuditRuns.length).toBeGreaterThan(0);
  });

  it('restores valid history persistence after import and keeps trip/snapshot untouched', () => {
    localStorage.setItem(HISTORY_KEY, '{corrupted-json');
    localStorage.setItem(TRIP_KEY, JSON.stringify({ tripName: 'T', stops: [] }));
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify([]));

    const { result } = renderHook(() => useTripStore());
    const historyBackup = {
      schema: 'travel-buddy-integrity-history',
      integrityHistoryVersion: 1,
      exportedAt: '2026-01-01T10:00:00.000Z',
      selectedBaselineRunId: null,
      runs: [],
    };

    act(() => {
      const parsed = result.current.parseIntegrityHistoryBackup(JSON.stringify(historyBackup));
      result.current.importIntegrityHistory(parsed.runs, parsed.baselineRunId);
    });

    expect(() => JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '')).not.toThrow();
    const persistedTrip = JSON.parse(localStorage.getItem(TRIP_KEY) ?? '{}') as { tripName?: string; stops?: unknown[] };
    expect(persistedTrip.tripName).toBe('T');
    expect(persistedTrip.stops).toEqual([]);
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBe(JSON.stringify([]));
  });

  it('clear, delete and compaction persist valid results after corruption recovery', () => {
    localStorage.setItem(HISTORY_KEY, '{corrupted-json');
    const { result } = renderHook(() => useTripStore());

    act(() => {
      result.current.runIntegrityAudit();
      result.current.runIntegrityAudit();
    });
    const runId = result.current.integrityAuditRuns[0]?.id;
    expect(runId).toBeTruthy();

    act(() => {
      if (runId) {
        result.current.deleteIntegrityRun(runId);
      }
      result.current.compactIntegrityHistory();
      result.current.clearIntegrityHistory();
    });

    expect(() => JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '')).not.toThrow();
    expect(result.current.integrityAuditRuns).toEqual([]);
  });

  it('keeps simulation non-destructive for local storage state', () => {
    const { result } = renderHook(() => useTripStore());
    act(() => {
      result.current.runIntegrityAudit();
    });
    const beforeTrip = localStorage.getItem(TRIP_KEY);
    const beforeSnapshots = localStorage.getItem(SNAPSHOT_KEY);
    const beforeHistory = localStorage.getItem(HISTORY_KEY);
    const beforeBaseline = localStorage.getItem(BASELINE_KEY);

    act(() => {
      result.current.simulateSelectedRepairs([]);
      result.current.runIntegrityDiagnostics();
      result.current.toIntegrityReportJson({
        selectedTrendWindow: 'latest-5',
        repairImpactSummary: null,
        simulationSummary: null,
      });
    });

    expect(localStorage.getItem(TRIP_KEY)).toBe(beforeTrip);
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBe(beforeSnapshots);
    expect(localStorage.getItem(HISTORY_KEY)).toBe(beforeHistory);
    expect(localStorage.getItem(BASELINE_KEY)).toBe(beforeBaseline);
  });
});
