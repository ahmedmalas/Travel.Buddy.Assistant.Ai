/**
 * Slice 69 — Rule-based itinerary assistance (no external AI).
 * Fully deterministic and unit-testable.
 */
import type { Booking, TripData, TripStop } from './tripDomain';
import type { AccommodationStay, ChecklistItem, FlightSegment, GroundTransport } from './travelOpsDomain';

export type AssistanceSeverity = 'info' | 'warning' | 'critical';

export type AssistanceSuggestion = {
  id: string;
  kind:
    | 'excessive-travel'
    | 'overlapping-booking'
    | 'missing-accommodation'
    | 'departure-checkin-conflict'
    | 'free-time'
    | 'checklist-deadline'
    | 'schedule';
  severity: AssistanceSeverity;
  title: string;
  detail: string;
  relatedIds: string[];
};

const toDateTime = (date: string, time: string): number | null => {
  if (!date) return null;
  const iso = `${date}T${time && time.length === 5 ? time : '00:00'}:00`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
};

const dayMs = 24 * 60 * 60 * 1000;

const eachNight = (start: string, end: string): string[] => {
  if (!start || !end || end <= start) return [];
  const nights: string[] = [];
  let cursor = Date.parse(`${start}T00:00:00`);
  const last = Date.parse(`${end}T00:00:00`);
  if (Number.isNaN(cursor) || Number.isNaN(last)) return [];
  while (cursor < last) {
    nights.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += dayMs;
  }
  return nights;
};

const bookingWindow = (booking: Booking): { start: number; end: number } | null => {
  const start = toDateTime(booking.startDate, booking.startTime || '00:00');
  const end = toDateTime(booking.endDate || booking.startDate, booking.endTime || booking.startTime || '23:59');
  if (start === null || end === null) return null;
  return { start, end: Math.max(end, start) };
};

export const detectExcessiveTravel = (stops: TripStop[], thresholdMinutes = 180): AssistanceSuggestion[] => {
  const byDay = new Map<string, TripStop[]>();
  for (const stop of stops) {
    const key = stop.date || `day-${stop.day}`;
    const list = byDay.get(key) ?? [];
    list.push(stop);
    byDay.set(key, list);
  }
  const suggestions: AssistanceSuggestion[] = [];
  for (const [day, dayStops] of byDay) {
    const ordered = [...dayStops].sort((a, b) => a.order - b.order);
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1]!;
      const current = ordered[index]!;
      const prevMs = toDateTime(previous.date || '1970-01-01', previous.endTime || previous.startTime || '00:00');
      const nextMs = toDateTime(current.date || '1970-01-01', current.startTime || '00:00');
      if (prevMs === null || nextMs === null) continue;
      const gapMinutes = Math.round((nextMs - prevMs) / 60000);
      // Negative gap handled by overlap detector; large positive "travel" between far locations flagged via category travel
      if (current.category === 'travel' || previous.category === 'travel') {
        const duration =
          toDateTime(current.date || '1970-01-01', current.endTime || current.startTime || '00:00') !== null &&
          toDateTime(current.date || '1970-01-01', current.startTime || '00:00') !== null
            ? Math.round(
                ((toDateTime(current.date || '1970-01-01', current.endTime || current.startTime || '00:00') as number) -
                  (toDateTime(current.date || '1970-01-01', current.startTime || '00:00') as number)) /
                  60000,
              )
            : 0;
        if (duration >= thresholdMinutes) {
          suggestions.push({
            id: `excessive-${current.id}`,
            kind: 'excessive-travel',
            severity: 'warning',
            title: `Long travel block on ${day}`,
            detail: `"${current.title}" spans about ${duration} minutes (≥ ${thresholdMinutes}). Consider splitting or adding a rest stop.`,
            relatedIds: [current.id, previous.id],
          });
        }
      }
      if (gapMinutes > 0 && gapMinutes < 30 && (current.category === 'travel' || previous.category === 'travel')) {
        suggestions.push({
          id: `tight-transfer-${current.id}`,
          kind: 'excessive-travel',
          severity: 'info',
          title: `Tight transfer on ${day}`,
          detail: `Only ${gapMinutes} minutes between "${previous.title}" and "${current.title}".`,
          relatedIds: [previous.id, current.id],
        });
      }
    }
  }
  return suggestions;
};

export const detectOverlappingBookings = (bookings: Booking[]): AssistanceSuggestion[] => {
  const windows = bookings
    .map((booking) => ({ booking, window: bookingWindow(booking) }))
    .filter((entry): entry is { booking: Booking; window: { start: number; end: number } } => entry.window !== null)
    .sort((a, b) => a.window.start - b.window.start);

  const suggestions: AssistanceSuggestion[] = [];
  for (let i = 0; i < windows.length; i += 1) {
    for (let j = i + 1; j < windows.length; j += 1) {
      const a = windows[i]!;
      const b = windows[j]!;
      if (b.window.start >= a.window.end) break;
      suggestions.push({
        id: `overlap-${a.booking.id}-${b.booking.id}`,
        kind: 'overlapping-booking',
        severity: 'critical',
        title: 'Overlapping bookings',
        detail: `"${a.booking.title}" overlaps "${b.booking.title}".`,
        relatedIds: [a.booking.id, b.booking.id],
      });
    }
  }
  return suggestions;
};

export const detectMissingAccommodationNights = (
  departureDate: string,
  returnDate: string,
  stays: AccommodationStay[],
): AssistanceSuggestion[] => {
  const nights = eachNight(departureDate, returnDate);
  if (nights.length === 0) return [];
  const covered = new Set<string>();
  for (const stay of stays) {
    for (const night of eachNight(stay.checkInDate, stay.checkOutDate || stay.checkInDate)) {
      covered.add(night);
    }
  }
  const missing = nights.filter((night) => !covered.has(night));
  if (missing.length === 0) return [];
  return [
    {
      id: 'missing-accommodation',
      kind: 'missing-accommodation',
      severity: missing.length >= 2 ? 'critical' : 'warning',
      title: 'Missing accommodation nights',
      detail: `${missing.length} night(s) without a stay: ${missing.slice(0, 5).join(', ')}${
        missing.length > 5 ? '…' : ''
      }.`,
      relatedIds: stays.map((stay) => stay.id),
    },
  ];
};

export const detectDepartureCheckInConflicts = (
  flights: FlightSegment[],
  stays: AccommodationStay[],
  ground: GroundTransport[],
): AssistanceSuggestion[] => {
  const suggestions: AssistanceSuggestion[] = [];
  for (const flight of flights) {
    const depart = toDateTime(flight.departureDate, flight.departureTime || '00:00');
    if (depart === null) continue;
    for (const stay of stays) {
      const checkOut = toDateTime(stay.checkOutDate || stay.checkInDate, stay.checkOutTime || '11:00');
      if (checkOut === null) continue;
      const minutes = Math.round((depart - checkOut) / 60000);
      if (minutes >= 0 && minutes < 90) {
        suggestions.push({
          id: `checkout-flight-${stay.id}-${flight.id}`,
          kind: 'departure-checkin-conflict',
          severity: 'warning',
          title: 'Tight hotel check-out before flight',
          detail: `Only ${minutes} minutes between check-out at "${stay.name}" and flight ${flight.flightNumber || flight.id}.`,
          relatedIds: [stay.id, flight.id],
        });
      }
      if (minutes < 0 && minutes > -360) {
        suggestions.push({
          id: `checkout-after-flight-${stay.id}-${flight.id}`,
          kind: 'departure-checkin-conflict',
          severity: 'critical',
          title: 'Flight before hotel check-out',
          detail: `Flight ${flight.flightNumber || flight.id} departs before check-out at "${stay.name}".`,
          relatedIds: [stay.id, flight.id],
        });
      }
    }
    for (const transfer of ground) {
      const pickup = toDateTime(transfer.pickupDate, transfer.pickupTime || '00:00');
      if (pickup === null) continue;
      const delta = Math.round((depart - pickup) / 60000);
      if (Math.abs(delta) < 45) {
        suggestions.push({
          id: `transfer-flight-${transfer.id}-${flight.id}`,
          kind: 'departure-checkin-conflict',
          severity: 'info',
          title: 'Transfer near flight time',
          detail: `Ground transport "${transfer.provider || transfer.mode}" is within 45 minutes of flight ${
            flight.flightNumber || flight.id
          }.`,
          relatedIds: [transfer.id, flight.id],
        });
      }
    }
  }
  return suggestions;
};

export const suggestFreeTimeBlocks = (stops: TripStop[]): AssistanceSuggestion[] => {
  const byDay = new Map<string, TripStop[]>();
  for (const stop of stops) {
    const key = stop.date || `day-${stop.day}`;
    const list = byDay.get(key) ?? [];
    list.push(stop);
    byDay.set(key, list);
  }
  const suggestions: AssistanceSuggestion[] = [];
  for (const [day, dayStops] of byDay) {
    const ordered = [...dayStops].sort((a, b) => a.order - b.order);
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1]!;
      const current = ordered[index]!;
      const prevEnd = toDateTime(previous.date || '1970-01-01', previous.endTime || previous.startTime || '00:00');
      const nextStart = toDateTime(current.date || '1970-01-01', current.startTime || '00:00');
      if (prevEnd === null || nextStart === null) continue;
      const gap = Math.round((nextStart - prevEnd) / 60000);
      if (gap >= 120) {
        suggestions.push({
          id: `free-${previous.id}-${current.id}`,
          kind: 'free-time',
          severity: 'info',
          title: `Free time on ${day}`,
          detail: `${gap} minutes open between "${previous.title}" and "${current.title}". Good slot for rest or a short activity.`,
          relatedIds: [previous.id, current.id],
        });
      }
    }
    if (ordered.length === 0) {
      suggestions.push({
        id: `empty-day-${day}`,
        kind: 'schedule',
        severity: 'info',
        title: `Empty day ${day}`,
        detail: 'No itinerary stops yet — consider adding a highlight or free-time block.',
        relatedIds: [],
      });
    }
  }
  return suggestions;
};

export const suggestChecklistDeadlines = (
  departureDate: string,
  items: ChecklistItem[],
  today = new Date().toISOString().slice(0, 10),
): AssistanceSuggestion[] => {
  const suggestions: AssistanceSuggestion[] = [];
  if (departureDate && !items.some((item) => item.category === 'passport' && item.completed)) {
    suggestions.push({
      id: 'checklist-passport',
      kind: 'checklist-deadline',
      severity: 'warning',
      title: 'Passport checklist incomplete',
      detail: `Complete passport checks before departure (${departureDate}).`,
      relatedIds: items.filter((item) => item.category === 'passport').map((item) => item.id),
    });
  }
  for (const item of items) {
    if (item.completed || !item.deadline) continue;
    if (item.deadline < today) {
      suggestions.push({
        id: `checklist-overdue-${item.id}`,
        kind: 'checklist-deadline',
        severity: 'critical',
        title: 'Overdue checklist item',
        detail: `"${item.title}" was due ${item.deadline}.`,
        relatedIds: [item.id],
      });
    } else if (item.deadline <= departureDate) {
      suggestions.push({
        id: `checklist-due-${item.id}`,
        kind: 'checklist-deadline',
        severity: 'info',
        title: 'Checklist deadline approaching',
        detail: `"${item.title}" is due ${item.deadline}.`,
        relatedIds: [item.id],
      });
    }
  }
  return suggestions;
};

export const buildSmartAssistance = (trip: TripData, today?: string): AssistanceSuggestion[] => {
  const flights = trip.flights ?? [];
  const stays = trip.stays ?? [];
  const ground = trip.groundTransport ?? [];
  const checklist = trip.checklistItems ?? [];
  return [
    ...detectExcessiveTravel(trip.stops),
    ...detectOverlappingBookings(trip.bookings),
    ...detectMissingAccommodationNights(trip.departureDate, trip.returnDate, stays),
    ...detectDepartureCheckInConflicts(flights, stays, ground),
    ...suggestFreeTimeBlocks(trip.stops),
    ...suggestChecklistDeadlines(trip.departureDate, checklist, today),
  ];
};
