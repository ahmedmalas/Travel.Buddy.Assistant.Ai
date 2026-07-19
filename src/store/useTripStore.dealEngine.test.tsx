import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSimulatedOffer } from '../deal-engine';
import { useTripStore } from './useTripStore';

describe('useTripStore deal engine wiring', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists shortlist, preferences, and includes dealEngine in backups', () => {
    const { result } = renderHook(() => useTripStore());
    const offer = createSimulatedOffer({
      id: 'store-offer-1',
      category: 'flight',
      providerId: 'demo-sky',
      providerName: 'Demo Sky',
      title: 'LHR-BCN',
      subtitle: '',
      basePrice: 120,
    });

    act(() => {
      result.current.addDealShortlistItem(offer);
      result.current.createDealPreferenceProfile('Family');
      result.current.setDealScoringWeights({ totalCost: 40 });
    });

    expect(result.current.dealEngineState.shortlist).toHaveLength(1);
    expect(result.current.dealEngineState.scoringWeights.totalCost).toBe(40);
    expect(result.current.dealEngineState.preferenceProfiles.some((p) => p.name === 'Family')).toBe(
      true,
    );

    const backup = result.current.toBackupJson();
    expect(backup).toContain('"backupVersion": 6');
    expect(backup).toContain('dealEngine');
    expect(backup).toContain('store-offer-1');

    act(() => {
      result.current.resetDealEngineState();
    });
    expect(result.current.dealEngineState.shortlist).toHaveLength(0);
  });
});
