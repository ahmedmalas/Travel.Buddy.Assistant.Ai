import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTripStore } from './useTripStore';

const TRIP_KEY = 'travel-buddy:trip-state:v1';
const SNAPSHOT_KEY = 'travel-buddy:trip-snapshots:v1';
const HISTORY_KEY = 'travel-buddy:integrity-history:v1';
const BASELINE_KEY = 'travel-buddy:integrity-history-baseline:v1';

const validFingerprint = 'active-trip|missing-date|stops[0].date|warning';

const makeRun = (
  overrides: Partial<{
    id: string;
    generatedAt: string;
    totalIssueCount: number;
    warningCount: number;
    repairableErrorCount: number;
    blockingErrorCount: number;
    repairableIssueCount: number;
    unresolvedIssueCount: number;
    issueFingerprints: string[];
  }> = {},
) => ({
  id: overrides.id ?? 'run-1',
  generatedAt: overrides.generatedAt ?? '2026-01-01T10:00:00.000Z',
  applicationVersion: '0.1.0',
  backupVersion: 2,
  snapshotHistoryVersion: 1,
  totalIssueCount: overrides.totalIssueCount ?? 1,
  warningCount: overrides.warningCount ?? 1,
  repairableErrorCount: overrides.repairableErrorCount ?? 0,
  blockingErrorCount: overrides.blockingErrorCount ?? 0,
  repairableIssueCount: overrides.repairableIssueCount ?? 0,
  unresolvedIssueCount: overrides.unresolvedIssueCount ?? 1,
  activeTripIssueCount: 1,
  snapshotHistoryIssueCount: 0,
  durationMs: 10,
  issueFingerprints: overrides.issueFingerprints ?? [validFingerprint],
  runType: 'manual-audit' as const,
});

const historyBackup = (runs: ReturnType<typeof makeRun>[], selectedBaselineRunId: string | null = null) =>
  JSON.stringify({
    schema: 'travel-buddy-integrity-history',
    integrityHistoryVersion: 1,
    exportedAt: '2026-01-01T10:00:00.000Z',
    selectedBaselineRunId,
    runs,
  });

describe('useTripStore slices 25-26 integrity QA gaps', () => {
  beforeEach(() => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
  });

  it('records Exact Match when simulate and apply use the same selection', () => {
    const { result } = renderHook(() => useTripStore());
    act(() => {
      result.current.runIntegrityAudit();
    });
    act(() => {
      result.current.simulateSelectedRepairs([]);
    });
    expect(result.current.lastIntegrityRepairSimulation).not.toBeNull();

    act(() => {
      result.current.applyIntegrityRepairs([]);
    });
    expect(result.current.lastIntegritySimulationAccuracy?.status).toBe('Exact Match');
  });

  it('records Diverged when apply selection differs from prior simulation', () => {
    localStorage.setItem(
      TRIP_KEY,
      JSON.stringify({
        tripName: 'Conflict Trip',
        stops: [
          { id: 'dup-stop', title: 'One', day: 1, order: 1, notes: '' },
          { id: 'dup-stop', title: 'Two', day: 1, order: 2, notes: '' },
        ],
      }),
    );
    const { result } = renderHook(() => useTripStore());
    act(() => {
      // Re-inject duplicate ids after hydration persistence so audit sees repairable duplicates.
      localStorage.setItem(
        TRIP_KEY,
        JSON.stringify({
          tripName: 'Conflict Trip',
          stops: [
            { id: 'dup-stop', title: 'One', day: 1, order: 1, notes: '' },
            { id: 'dup-stop', title: 'Two', day: 1, order: 2, notes: '' },
          ],
        }),
      );
      result.current.runIntegrityAudit();
    });
    const repairableIds = result.current.integrityAuditReport?.repairableIssueIds ?? [];
    expect(repairableIds.length).toBeGreaterThan(0);

    act(() => {
      result.current.simulateSelectedRepairs([]);
    });
    act(() => {
      result.current.applyIntegrityRepairs(repairableIds);
    });
    expect(result.current.lastIntegritySimulationAccuracy?.status).toBe('Diverged');
  });

  it('rejects integrity history imports with negative counts and keeps trip/snapshots untouched', () => {
    localStorage.setItem(TRIP_KEY, JSON.stringify({ tripName: 'Keep Me', stops: [] }));
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify([]));
    const { result } = renderHook(() => useTripStore());

    expect(() =>
      result.current.parseIntegrityHistoryBackup(
        historyBackup([
          makeRun({
            totalIssueCount: -1,
            warningCount: -1,
          }),
        ]),
      ),
    ).toThrow(/Negative issue counts: run-1/);

    const persistedTrip = JSON.parse(localStorage.getItem(TRIP_KEY) ?? '{}') as { tripName?: string };
    expect(persistedTrip.tripName).toBe('Keep Me');
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBe(JSON.stringify([]));
  });

  it('rejects integrity history imports with invalid timestamps', () => {
    const { result } = renderHook(() => useTripStore());
    expect(() =>
      result.current.parseIntegrityHistoryBackup(
        historyBackup([
          makeRun({
            generatedAt: 'not-a-timestamp',
          }),
        ]),
      ),
    ).toThrow(/Invalid run timestamp: run-1/);
  });

  it('rejects integrity history imports with malformed fingerprints', () => {
    const { result } = renderHook(() => useTripStore());
    expect(() =>
      result.current.parseIntegrityHistoryBackup(
        historyBackup([
          makeRun({
            issueFingerprints: ['bad-fingerprint'],
          }),
        ]),
      ),
    ).toThrow(/Malformed fingerprint format in run run-1/);
  });

  it('flags duplicate run IDs, negative counts, and malformed fingerprints in diagnostics', () => {
    const duplicate = makeRun({ id: 'dup-run', generatedAt: '2026-01-01T12:00:00.000Z' });
    const negative = makeRun({
      id: 'neg-run',
      generatedAt: '2026-01-01T11:00:00.000Z',
      totalIssueCount: -2,
      warningCount: -1,
      unresolvedIssueCount: -2,
    });
    const malformed = makeRun({
      id: 'bad-fp-run',
      generatedAt: '2026-01-01T10:00:00.000Z',
      issueFingerprints: ['not|valid|enough'],
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify([duplicate, duplicate, negative, malformed]));

    const { result } = renderHook(() => useTripStore());
    expect(result.current.integrityAuditRuns.length).toBeGreaterThan(0);

    let diagnostics: ReturnType<typeof result.current.runIntegrityDiagnostics>;
    act(() => {
      diagnostics = result.current.runIntegrityDiagnostics();
    });

    expect(diagnostics!.auditHistoryConsistency.findings).toEqual(
      expect.arrayContaining([
        'Duplicate run ID: dup-run',
        'Negative issue counts: neg-run',
      ]),
    );
    expect(diagnostics!.fingerprintConsistency.findings).toEqual(
      expect.arrayContaining(['Malformed fingerprint format in run bad-fp-run.']),
    );
    expect(diagnostics!.fingerprintConsistency.status).toBe('Fail');
    expect(diagnostics!.overallStatus).toBe('Critical');
  });

  it('flags invalid baseline references from raw storage in validation and diagnostics', () => {
    const run = makeRun({ id: 'run-present' });
    localStorage.setItem(HISTORY_KEY, JSON.stringify([run]));
    localStorage.setItem(BASELINE_KEY, JSON.stringify('run-missing'));

    const { result } = renderHook(() => useTripStore());
    expect(result.current.selectedIntegrityBaselineRunId).toBeNull();
    expect(result.current.integrityHistoryValidation.invalidBaselineReference).toBe(true);

    let diagnostics: ReturnType<typeof result.current.runIntegrityDiagnostics>;
    act(() => {
      diagnostics = result.current.runIntegrityDiagnostics();
    });
    expect(diagnostics!.baselineConsistency.findings).toEqual(
      expect.arrayContaining(['Invalid baseline reference: Yes']),
    );
    expect(diagnostics!.baselineConsistency.status).toBe('Warning');
    expect(diagnostics!.overallStatus).toBe('Attention Required');
  });

  it('flags invalid timestamps hydrated from local storage during diagnostics', () => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([
        makeRun({
          id: 'bad-time',
          generatedAt: 'definitely-not-valid',
        }),
      ]),
    );
    const { result } = renderHook(() => useTripStore());
    let diagnostics: ReturnType<typeof result.current.runIntegrityDiagnostics>;
    act(() => {
      diagnostics = result.current.runIntegrityDiagnostics();
    });
    expect(diagnostics!.auditHistoryConsistency.findings).toEqual(
      expect.arrayContaining(['Invalid run timestamp: bad-time']),
    );
    expect(diagnostics!.auditHistoryConsistency.status).toBe('Fail');
  });

  it('records matching-selection accuracy after applying the simulated repair set', () => {
    const { result } = renderHook(() => useTripStore());
    act(() => {
      localStorage.setItem(
        TRIP_KEY,
        JSON.stringify({
          tripName: 'Conflict Trip',
          stops: [
            { id: 'dup-stop', title: 'One', day: 1, order: 1, notes: '' },
            { id: 'dup-stop', title: 'Two', day: 1, order: 2, notes: '' },
          ],
        }),
      );
      result.current.runIntegrityAudit();
    });
    const repairableIds = result.current.integrityAuditReport?.repairableIssueIds ?? [];
    expect(repairableIds.length).toBeGreaterThan(0);

    act(() => {
      result.current.simulateSelectedRepairs(repairableIds);
    });
    act(() => {
      result.current.applyIntegrityRepairs(repairableIds);
    });
    expect(result.current.lastIntegritySimulationAccuracy).not.toBeNull();
    expect(['Exact Match', 'Partial Match', 'Diverged']).toContain(
      result.current.lastIntegritySimulationAccuracy?.status,
    );
  });
});
