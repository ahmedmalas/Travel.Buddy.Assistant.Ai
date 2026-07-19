/**
 * Slice 90 — Intelligent trip validation / Trip Health Score.
 */
import type { TripData } from '../store/tripDomain';
import { calculateBudgetSummary, detectItineraryConflicts } from '../store/platformCalculations';

export type TripHealthFindingKind =
  | 'missing_accommodation_nights'
  | 'impossible_transfer'
  | 'overlapping_bookings'
  | 'missing_passport_visa'
  | 'budget_overrun'
  | 'unscheduled_travel_days'
  | 'duplicate_reservations'
  | 'timezone_inconsistency'
  | 'missing_return_journey'
  | 'packing_gaps';

export type TripHealthSeverity = 'info' | 'warning' | 'critical';

export interface TripHealthFinding {
  id: string;
  kind: TripHealthFindingKind;
  severity: TripHealthSeverity;
  title: string;
  explanation: string;
  relatedIds: string[];
  scoreImpact: number;
}

export interface TripHealthReport {
  tripId: string;
  tripName: string;
  generatedAt: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  findings: TripHealthFinding[];
  summary: string;
}

const dayMs = 24 * 60 * 60 * 1000;

function eachDate(start: string, end: string): string[] {
  if (!start || !end) return [];
  const out: string[] = [];
  let cursor = Date.parse(`${start}T00:00:00`);
  const last = Date.parse(`${end}T00:00:00`);
  if (Number.isNaN(cursor) || Number.isNaN(last) || last < cursor) return [];
  while (cursor <= last) {
    out.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += dayMs;
  }
  return out;
}

function nightsBetween(start: string, end: string): string[] {
  const days = eachDate(start, end);
  return days.slice(0, Math.max(0, days.length - 1));
}

function toMs(date: string, time?: string): number | null {
  if (!date) return null;
  const ms = Date.parse(`${date}T${time && time.length >= 4 ? time : '00:00'}:00`);
  return Number.isNaN(ms) ? null : ms;
}

function gradeFromScore(score: number): TripHealthReport['grade'] {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function auditTripHealth(trip: TripData): TripHealthReport {
  const findings: TripHealthFinding[] = [];
  const stays = trip.stays ?? [];
  const flights = trip.flights ?? [];
  const bookings = trip.bookings ?? [];
  const documents = trip.documents ?? [];
  const packingLists = trip.packingLists ?? [];

  // Missing accommodation nights
  const covered = new Set<string>();
  for (const stay of stays) {
    for (const night of nightsBetween(stay.checkInDate, stay.checkOutDate)) covered.add(night);
  }
  for (const booking of bookings.filter((b) => b.type === 'hotel')) {
    for (const night of nightsBetween(booking.startDate, booking.endDate || booking.startDate)) {
      covered.add(night);
    }
  }
  const tripNights = nightsBetween(trip.departureDate, trip.returnDate);
  const missingNights = tripNights.filter((night) => !covered.has(night));
  if (trip.departureDate && trip.returnDate && missingNights.length) {
    findings.push({
      id: 'missing-nights',
      kind: 'missing_accommodation_nights',
      severity: missingNights.length > 2 ? 'critical' : 'warning',
      title: 'Missing accommodation nights',
      explanation: `${missingNights.length} night(s) between ${trip.departureDate} and ${trip.returnDate} have no stay/hotel booking: ${missingNights.slice(0, 5).join(', ')}${missingNights.length > 5 ? '…' : ''}.`,
      relatedIds: stays.map((s) => s.id),
      scoreImpact: Math.min(25, missingNights.length * 5),
    });
  }

  // Impossible transfers / overlapping itinerary
  const conflicts = detectItineraryConflicts(trip.stops);
  for (const conflict of conflicts) {
    findings.push({
      id: `overlap-stop-${conflict.leftId}-${conflict.rightId}`,
      kind: 'impossible_transfer',
      severity: 'critical',
      title: 'Impossible or overlapping schedule',
      explanation: conflict.message,
      relatedIds: [conflict.leftId, conflict.rightId],
      scoreImpact: 12,
    });
  }

  // Overlapping bookings
  for (let i = 0; i < bookings.length; i += 1) {
    for (let j = i + 1; j < bookings.length; j += 1) {
      const a = bookings[i]!;
      const b = bookings[j]!;
      if (a.status === 'cancelled' || b.status === 'cancelled') continue;
      const aStart = toMs(a.startDate, a.startTime);
      const aEnd = toMs(a.endDate || a.startDate, a.endTime || a.startTime || '23:59');
      const bStart = toMs(b.startDate, b.startTime);
      const bEnd = toMs(b.endDate || b.startDate, b.endTime || b.startTime || '23:59');
      if (aStart == null || aEnd == null || bStart == null || bEnd == null) continue;
      if (aStart < bEnd && bStart < aEnd && a.type === b.type) {
        findings.push({
          id: `booking-overlap-${a.id}-${b.id}`,
          kind: 'overlapping_bookings',
          severity: 'warning',
          title: 'Overlapping bookings',
          explanation: `"${a.title}" overlaps "${b.title}" (${a.type}).`,
          relatedIds: [a.id, b.id],
          scoreImpact: 8,
        });
      }
    }
  }

  // Passport / visa placeholders
  const hasPassport = documents.some(
    (doc) => doc.type === 'passport' || doc.type === 'visa' || /passport|visa/i.test(doc.title || ''),
  );
  const internationalHint = Boolean(trip.destination && trip.destination.length >= 2);
  if (internationalHint && !hasPassport) {
    findings.push({
      id: 'missing-passport',
      kind: 'missing_passport_visa',
      severity: 'warning',
      title: 'Missing passport/visa placeholders',
      explanation: 'No passport/visa document metadata found. Add placeholders before travel.',
      relatedIds: [],
      scoreImpact: 6,
    });
  }

  // Budget overruns
  const budget = calculateBudgetSummary(trip);
  if (budget.overBudget) {
    findings.push({
      id: 'budget-over',
      kind: 'budget_overrun',
      severity: 'critical',
      title: 'Budget overrun',
      explanation: `Planned spend exceeds budget by ${trip.currency} ${Math.abs(budget.remainingBalance).toFixed(2)}.`,
      relatedIds: [],
      scoreImpact: 15,
    });
  }

  // Unscheduled travel days
  const scheduledDays = new Set(
    trip.stops.map((stop) => stop.date).filter(Boolean),
  );
  const unscheduled = eachDate(trip.departureDate, trip.returnDate).filter((day) => !scheduledDays.has(day));
  if (unscheduled.length) {
    findings.push({
      id: 'unscheduled-days',
      kind: 'unscheduled_travel_days',
      severity: 'info',
      title: 'Unscheduled travel days',
      explanation: `${unscheduled.length} day(s) have no itinerary items.`,
      relatedIds: [],
      scoreImpact: Math.min(10, unscheduled.length * 2),
    });
  }

  // Duplicate reservations
  const confMap = new Map<string, string[]>();
  for (const booking of bookings) {
    const key = (booking.confirmationNumber || '').trim().toUpperCase();
    if (!key) continue;
    const list = confMap.get(key) ?? [];
    list.push(booking.id);
    confMap.set(key, list);
  }
  for (const [conf, ids] of confMap) {
    if (ids.length > 1) {
      findings.push({
        id: `dup-${conf}`,
        kind: 'duplicate_reservations',
        severity: 'warning',
        title: 'Duplicate reservation reference',
        explanation: `Confirmation ${conf} appears on ${ids.length} bookings.`,
        relatedIds: ids,
        scoreImpact: 7,
      });
    }
  }

  // Time-zone inconsistencies (heuristic: destination timezone notes vs stop times spanning >20h same day)
  const longSameDay = trip.stops.filter((stop) => {
    if (!stop.startTime || !stop.endTime) return false;
    const start = toMs(stop.date || '1970-01-01', stop.startTime);
    const end = toMs(stop.date || '1970-01-01', stop.endTime);
    return start != null && end != null && end - start > 20 * 60 * 60 * 1000;
  });
  if (longSameDay.length) {
    findings.push({
      id: 'tz-heuristic',
      kind: 'timezone_inconsistency',
      severity: 'info',
      title: 'Possible time-zone inconsistency',
      explanation: `${longSameDay.length} itinerary item(s) span over 20 hours on a single local date — verify time zones.`,
      relatedIds: longSameDay.map((s) => s.id),
      scoreImpact: 4,
    });
  }

  // Missing return journey
  const hasReturnFlight = flights.some(
    (flight) =>
      Boolean(flight.arrivalDate || flight.departureDate) &&
      (flight.departureDate === trip.returnDate ||
        flight.arrivalDate === trip.returnDate ||
        /return/i.test(flight.flightNumber || '') ||
        /return/i.test(flight.notes || '')),
  );
  const hasReturnBooking = bookings.some(
    (booking) => booking.type === 'flight' && booking.endDate === trip.returnDate,
  );
  if (trip.returnDate && !hasReturnFlight && !hasReturnBooking) {
    findings.push({
      id: 'missing-return',
      kind: 'missing_return_journey',
      severity: 'warning',
      title: 'Missing return journey',
      explanation: `No flight/booking clearly covers return date ${trip.returnDate}.`,
      relatedIds: flights.map((f) => f.id),
      scoreImpact: 10,
    });
  }

  // Packing gaps
  const totalPacking = packingLists.reduce((sum, list) => sum + list.items.length, 0);
  const packed = packingLists.reduce(
    (sum, list) => sum + list.items.filter((item) => item.packed).length,
    0,
  );
  if (totalPacking === 0) {
    findings.push({
      id: 'packing-empty',
      kind: 'packing_gaps',
      severity: 'info',
      title: 'Packing list empty',
      explanation: 'No packing items yet — consider generating a template before departure.',
      relatedIds: [],
      scoreImpact: 3,
    });
  } else if (packed / totalPacking < 0.5) {
    findings.push({
      id: 'packing-gaps',
      kind: 'packing_gaps',
      severity: 'warning',
      title: 'Packing gaps',
      explanation: `Only ${packed}/${totalPacking} packing items marked packed.`,
      relatedIds: packingLists.map((list) => list.id),
      scoreImpact: 5,
    });
  }

  const penalty = findings.reduce((sum, finding) => sum + finding.scoreImpact, 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const critical = findings.filter((f) => f.severity === 'critical').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;

  return {
    tripId: trip.id ?? 'active-trip',
    tripName: trip.tripName,
    generatedAt: new Date().toISOString(),
    score,
    grade: gradeFromScore(score),
    findings,
    summary: `Trip Health ${score}/100 (grade ${gradeFromScore(score)}): ${critical} critical, ${warnings} warning, ${findings.length} total findings.`,
  };
}
