import { describe, expect, it } from 'vitest';
import {
  cloneTrip,
  createEmptyTrip,
  createSeededTrip,
  migrateTrip,
  sanitizeTrip,
  validateTripSetup,
} from './tripDomain';

describe('tripDomain', () => {
  it('validates trip setup fields', () => {
    const errors = validateTripSetup({
      tripName: '',
      destination: '',
      departureDate: 'bad',
      returnDate: '2026-01-01',
      travellerCount: 0,
      purpose: 'leisure',
      budget: -10,
      currency: '',
      notes: '',
    });
    expect(errors.tripName).toBeTruthy();
    expect(errors.destination).toBeTruthy();
    expect(errors.departureDate).toBeTruthy();
    expect(errors.travellerCount).toBeTruthy();
    expect(errors.budget).toBeTruthy();
    expect(errors.currency).toBeTruthy();
  });

  it('accepts a valid trip setup payload', () => {
    const errors = validateTripSetup({
      tripName: 'Summer Escape',
      destination: 'Lisbon',
      departureDate: '2026-07-01',
      returnDate: '2026-07-10',
      travellerCount: 2,
      purpose: 'leisure',
      budget: 2000,
      currency: 'EUR',
      notes: 'Beach and food',
    });
    expect(errors).toEqual({});
  });

  it('migrates legacy tripName/stops backups into the extended model', () => {
    const migrated = migrateTrip({
      tripName: 'Legacy Trip',
      stops: [{ id: '1', title: 'Walk', day: 1, order: 1, notes: 'old' }],
    });
    expect(migrated.tripName).toBe('Legacy Trip');
    expect(migrated.stops).toHaveLength(1);
    expect(migrated.stops[0]?.location).toBe('');
    expect(migrated.bookings).toEqual([]);
    expect(migrated.packingLists.length).toBeGreaterThan(0);
    expect(migrated.currency).toBe('USD');
  });

  it('sanitizes and clones trip graphs without sharing references', () => {
    const seeded = createSeededTrip();
    const cloned = cloneTrip(seeded);
    cloned.stops[0]!.title = 'Changed';
    expect(seeded.stops[0]?.title).not.toBe('Changed');
    expect(sanitizeTrip(createEmptyTrip()).tripName).toBe('Untitled Trip');
  });
});
