/**
 * Slice 99 — Broad regression anchors across major platform capabilities.
 */
import { describe, expect, it } from 'vitest';
import { rankOffers, runFlightSuperSearch, listAdapters } from '../deal-engine';
import { createEmptyTrip, migrateTrip, sanitizeTrip } from '../store/tripDomain';
import { migrateVaultState, createVaultTrip } from '../store/vaultDomain';
import { calculateBudgetSummary, detectItineraryConflicts } from '../store/platformCalculations';
import { buildSmartAssistance } from '../store/smartAssistance';
import { createEmptySyncState, enqueueChange, syncQueueSummary } from '../store/sync/syncEngine';
import { BACKUP_VERSION, MIN_SUPPORTED_BACKUP_VERSION, STORAGE_KEYS } from '../store/storeConstants';
import {
  auditTripHealth,
  buildOpsDashboard,
  createOfflineState,
  parseImportContent,
  validateBackupIntegrity,
  buildCompatibilityReport,
  createAnalyticsState,
  loadFeatureFlags,
} from './index';

describe('slice 99 regression anchors (9–99)', () => {
  it('keeps core trip/vault/budget/integrity invariants', () => {
    const trip = sanitizeTrip(
      migrateTrip({
        ...createEmptyTrip(),
        tripName: 'Regression',
        destination: 'Lisbon',
        departureDate: '2026-10-01',
        returnDate: '2026-10-05',
        budget: 1000,
      }),
    );
    expect(trip.tripName).toBe('Regression');
    const vault = migrateVaultState(null, trip);
    expect(vault.trips.length).toBeGreaterThan(0);
    const second = createVaultTrip({ tripName: 'Second', destination: 'Porto' });
    expect(second.tripName).toBe('Second');
    expect(calculateBudgetSummary(trip).plannedBudget).toBe(1000);
    expect(detectItineraryConflicts(trip.stops)).toEqual([]);
    expect(buildSmartAssistance(trip).length).toBeGreaterThanOrEqual(0);
    expect(BACKUP_VERSION).toBeGreaterThanOrEqual(7);
    expect(MIN_SUPPORTED_BACKUP_VERSION).toBe(2);
    expect(STORAGE_KEYS.dealEngine).toContain('deal-engine');
    expect(STORAGE_KEYS.finalisation).toContain('finalisation');
  });

  it('keeps sync, import, health, deal engine, and ops surfaces functional', async () => {
    let sync = createEmptySyncState();
    sync = enqueueChange(sync, {
      entityType: 'trip',
      entityId: 't1',
      tripId: 't1',
      revision: 1,
      payload: { ok: true },
    });
    expect(syncQueueSummary(sync).pending).toBeGreaterThan(0);

    const imported = parseImportContent({
      fileName: 'x.ics',
      content: 'BEGIN:VEVENT\nSUMMARY:Train\nDTSTART:20261001T100000\nEND:VEVENT',
    });
    expect(imported.entities.length).toBeGreaterThan(0);
    expect(validateBackupIntegrity('{"schema":"travel-buddy-backup","backupVersion":7}').ok).toBe(true);

    const health = auditTripHealth(createEmptyTrip());
    expect(health.score).toBeLessThanOrEqual(100);

    expect(listAdapters().length).toBeGreaterThan(0);
    const flights = await runFlightSuperSearch({
      mode: 'one_way',
      origin: 'LHR',
      destination: 'LIS',
      departDate: '2026-10-01',
    });
    expect(rankOffers(flights.search.offers).length).toBe(flights.ranked.length);

    const ops = buildOpsDashboard({
      offline: createOfflineState('online'),
      syncState: sync,
      analytics: createAnalyticsState(),
      featureFlags: loadFeatureFlags(),
      importHistory: [imported],
    });
    expect(ops.importHistory[0]?.fileName).toBe('x.ics');
    expect(buildCompatibilityReport().liveProvidersEnabled).toBe(false);
  });
});
