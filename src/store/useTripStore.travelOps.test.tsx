import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTripStore } from './useTripStore';

describe('useTripStore travel ops slices 61-72', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists destinations, flights, stays and checklist templates', () => {
    const { result } = renderHook(() => useTripStore());
    act(() => {
      result.current.upsertDestination({
        id: 'd1',
        name: 'Tokyo',
        country: 'Japan',
        city: 'Tokyo',
        region: 'Kanto',
        language: 'Japanese',
        currency: 'JPY',
        timezone: 'Asia/Tokyo',
        entryRequirements: 'Passport',
        safetyNotes: 'Safe',
        emergencyInfo: '110/119',
        customsNotes: 'Remove shoes indoors',
        practicalNotes: 'IC card handy',
        savedOffline: true,
      });
      result.current.upsertFlight({
        id: 'f1',
        airline: 'ANA',
        flightNumber: 'NH001',
        bookingReference: 'ABC123',
        departureAirport: 'NRT',
        arrivalAirport: 'HND',
        departureTerminal: '1',
        arrivalTerminal: '2',
        departureGate: 'A1',
        arrivalGate: 'B2',
        departureDate: '2026-09-01',
        departureTime: '10:00',
        arrivalDate: '2026-09-01',
        arrivalTime: '11:00',
        layoverMinutes: 0,
        cabin: 'Economy',
        seat: '12A',
        baggageAllowance: '2x23kg',
        checkInStatus: 'open',
        statusNotes: '',
        travellerIds: [],
        cost: 200,
        currency: 'USD',
        notes: '',
      });
      result.current.upsertStay({
        id: 'h1',
        type: 'hotel',
        name: 'Park Hotel',
        address: 'Shiodome',
        contactPhone: '',
        contactEmail: '',
        checkInDate: '2026-09-01',
        checkInTime: '15:00',
        checkOutDate: '2026-09-03',
        checkOutTime: '11:00',
        roomInfo: 'Twin',
        confirmationNumber: 'HTL1',
        cost: 400,
        currency: 'USD',
        paymentStatus: 'paid',
        amenities: 'Wifi',
        notes: '',
        itineraryStopId: null,
        travellerIds: [],
      });
      result.current.applyPreDepartureChecklistTemplate();
    });

    expect(result.current.activeVaultTrip.destinations?.some((item) => item.name === 'Tokyo')).toBe(true);
    expect(result.current.activeVaultTrip.flights?.[0]?.flightNumber).toBe('NH001');
    expect(result.current.activeVaultTrip.stays?.[0]?.name).toBe('Park Hotel');
    expect((result.current.activeVaultTrip.checklistItems ?? []).length).toBeGreaterThan(0);
    expect(result.current.smartAssistance.length).toBeGreaterThanOrEqual(0);
  });

  it('supports emergency workflows, journal export and onboarding', () => {
    const { result } = renderHook(() => useTripStore());
    act(() => {
      result.current.startLostPassportWorkflow();
      result.current.upsertJournalEntry({
        id: 'j1',
        date: '2026-09-02',
        title: 'Day one',
        notes: 'Great food',
        highlights: 'Ramen',
        rating: 5,
        locationName: 'Shibuya',
        latitude: '',
        longitude: '',
        photoAttachmentName: 'ramen.jpg',
        photoMimeType: 'image/jpeg',
        favourite: true,
      });
      result.current.completeOnboardingStep('welcome');
    });
    expect(result.current.activeVaultTrip.emergency?.workflows[0]?.kind).toBe('lost-passport');
    expect(result.current.exportTripJournalSummary()).toContain('Day one');
    expect(result.current.onboardingState.completedSteps).toContain('welcome');
    expect(result.current.onboardingProgress.completed).toBeGreaterThan(0);
  });

  it('exports backup version 7 with travel ops collections', () => {
    const { result } = renderHook(() => useTripStore());
    act(() => {
      result.current.upsertGroundTransport({
        id: 'g1',
        mode: 'train',
        provider: 'JR',
        reference: 'T1',
        pickupLocation: 'Tokyo',
        dropoffLocation: 'Kyoto',
        pickupDate: '2026-09-02',
        pickupTime: '08:00',
        dropoffDate: '2026-09-02',
        dropoffTime: '10:30',
        cost: 120,
        currency: 'USD',
        status: 'confirmed',
        notes: '',
        travellerIds: [],
      });
    });
    const backup = result.current.toBackupJson();
    expect(backup).toContain('"backupVersion": 7');
    expect(backup).toContain('groundTransport');
  });
});
