import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTripStore } from './useTripStore';

describe('useTripStore travel ops CRUD coverage', () => {
  beforeEach(() => localStorage.clear());

  it('covers maps, transport, emergency updates and deletions', () => {
    const { result } = renderHook(() => useTripStore());

    act(() => {
      result.current.upsertSavedPlace({
        id: 'p1',
        name: 'Temple',
        address: 'Kyoto',
        latitude: '35',
        longitude: '135',
        category: 'sight',
        notes: '',
        link: 'https://example.com',
      });
      result.current.upsertDailyRoute({
        id: 'r1',
        date: '2026-09-02',
        title: 'Temple loop',
        notes: '',
        stops: [
          {
            id: 'rs1',
            placeId: 'p1',
            label: 'Start',
            order: 0,
            travelMinutesFromPrevious: 0,
            distanceKmFromPrevious: 0,
            notes: '',
          },
          {
            id: 'rs2',
            placeId: null,
            label: 'End',
            order: 1,
            travelMinutesFromPrevious: 25,
            distanceKmFromPrevious: 2,
            notes: '',
          },
        ],
      });
      result.current.upsertGroundTransport({
        id: 'g1',
        mode: 'taxi',
        provider: 'Go',
        reference: 'X1',
        pickupLocation: 'Hotel',
        dropoffLocation: 'Station',
        pickupDate: '2026-09-02',
        pickupTime: '09:00',
        dropoffDate: '2026-09-02',
        dropoffTime: '09:30',
        cost: 20,
        currency: 'USD',
        status: 'planned',
        notes: '',
        travellerIds: [],
      });
      result.current.updateEmergencyCentre({
        contacts: [
          {
            id: 'c1',
            name: 'Alex',
            relationship: 'Partner',
            phone: '111',
            email: 'a@example.com',
            notes: '',
          },
        ],
        embassies: [],
        insurance: [],
        medical: { bloodType: 'O+', allergies: '', medications: '', conditions: '', notes: '' },
        workflows: [],
        notes: 'Keep offline',
      });
      result.current.startLostLuggageWorkflow();
      result.current.upsertChecklistItem({
        id: 'cl1',
        title: 'Buy yen',
        category: 'currency',
        deadline: '2026-08-20',
        ownerName: 'Sam',
        completed: false,
        notes: '',
      });
    });

    expect(result.current.activeVaultTrip.savedPlaces?.[0]?.name).toBe('Temple');
    expect(result.current.activeVaultTrip.dailyRoutes?.[0]?.stops).toHaveLength(2);
    expect(result.current.activeVaultTrip.groundTransport?.[0]?.mode).toBe('taxi');
    expect(result.current.activeVaultTrip.emergency?.contacts[0]?.name).toBe('Alex');
    expect(result.current.activeVaultTrip.emergency?.workflows.some((item) => item.kind === 'lost-luggage')).toBe(true);

    act(() => {
      result.current.deleteSavedPlace('p1');
      result.current.deleteDailyRoute('r1');
      result.current.deleteGroundTransport('g1');
      result.current.deleteChecklistItem('cl1');
      result.current.deleteDestination('missing');
      result.current.deleteFlight('missing');
      result.current.deleteStay('missing');
      result.current.deleteJournalEntry('missing');
      result.current.dismissOnboarding();
      result.current.resetOnboarding();
    });

    expect(result.current.activeVaultTrip.savedPlaces ?? []).toHaveLength(0);
    expect(result.current.activeVaultTrip.dailyRoutes ?? []).toHaveLength(0);
    expect(result.current.onboardingState.dismissed).toBe(false);
  });
});
