import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CHECKLIST_TEMPLATES,
  applyChecklistTemplate,
  checklistProgress,
  createEmptyTravelOps,
  createLostPassportWorkflow,
  exportJournalSummary,
  migrateTravelOps,
  sanitizeFlight,
  sanitizeStay,
} from './travelOpsDomain';

describe('travelOpsDomain', () => {
  it('migrates missing collections to empty defaults', () => {
    const ops = migrateTravelOps(undefined);
    expect(ops.destinations).toEqual([]);
    expect(ops.emergency.contacts).toEqual([]);
    expect(createEmptyTravelOps().flights).toEqual([]);
  });

  it('sanitizes flights and stays', () => {
    const flight = sanitizeFlight({
      airline: 'ANA',
      flightNumber: 'NH001',
      departureAirport: 'nrt',
      arrivalAirport: 'hnd',
      layoverMinutes: -5,
      checkInStatus: 'checked-in',
    });
    expect(flight.departureAirport).toBe('NRT');
    expect(flight.layoverMinutes).toBe(0);
    expect(flight.checkInStatus).toBe('checked-in');

    const stay = sanitizeStay({ name: 'Park Hotel', type: 'hotel', paymentStatus: 'paid', cost: 220 });
    expect(stay.paymentStatus).toBe('paid');
    expect(stay.cost).toBe(220);
  });

  it('applies checklist templates and tracks progress', () => {
    const template = DEFAULT_CHECKLIST_TEMPLATES[0]!;
    const items = applyChecklistTemplate([], template, '2026-09-01');
    expect(items.length).toBe(template.items.length);
    items[0]!.completed = true;
    expect(checklistProgress(items).completed).toBe(1);
    expect(checklistProgress(items).percent).toBeGreaterThan(0);
  });

  it('exports journal summaries and creates emergency workflows', () => {
    const summary = exportJournalSummary('Japan', 'Tokyo', [
      {
        id: 'j1',
        date: '2026-09-02',
        title: 'Temple day',
        notes: 'Quiet morning',
        highlights: 'Senso-ji',
        rating: 5,
        locationName: 'Asakusa',
        latitude: '',
        longitude: '',
        photoAttachmentName: '',
        photoMimeType: '',
        favourite: true,
      },
    ]);
    expect(summary).toContain('Japan');
    expect(summary).toContain('Temple day');
    expect(createLostPassportWorkflow().kind).toBe('lost-passport');
  });
});
