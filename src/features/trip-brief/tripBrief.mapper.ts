import type { DraftPlan, TripBriefInput, TripPace } from '../../models/trip';

function toMidnightTime(dateIso: string): number {
  const date = new Date(`${dateIso}T00:00:00`);
  return date.getTime();
}

function getTripDurationDays(startDate: string, endDate: string): number {
  const startMs = toMidnightTime(startDate);
  const endMs = toMidnightTime(endDate);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((endMs - startMs) / dayMs) + 1;

  return Math.max(diffDays, 1);
}

function getTripPace(durationDays: number, interestsCount: number): TripPace {
  if (durationDays <= 3 || interestsCount >= 5) {
    return 'packed';
  }

  if (durationDays >= 9 && interestsCount <= 2) {
    return 'light';
  }

  return 'balanced';
}

function getPillars(input: TripBriefInput): string[] {
  const corePillars = input.interests.map((interest) => `${interest[0].toUpperCase()}${interest.slice(1)} focus`);

  return corePillars.slice(0, 4);
}

export function mapTripBriefToDraftPlan(input: TripBriefInput): DraftPlan {
  const durationDays = getTripDurationDays(input.startDate, input.endDate);
  const tripPace = getTripPace(durationDays, input.interests.length);
  const pillars = getPillars(input);

  return {
    title: `${durationDays}-day draft plan for ${input.destination}`,
    destination: input.destination.trim(),
    durationDays,
    travelers: input.travelers,
    budgetStyle: input.budgetStyle,
    tripPillars: pillars,
    dailyPace: tripPace,
    nextSteps: [
      'Compare flight windows and best arrival times.',
      'Shortlist neighbourhoods by budget style and trip interests.',
      'Draft a day-by-day itinerary with transport buffers.',
      'Estimate daily budget range for meals, activities, and local travel.',
    ],
    assumptions: [
      'This is an early draft plan based only on your brief.',
      'No live provider inventory or pricing is connected yet.',
      input.notes.trim() ? `Planner note captured: ${input.notes.trim()}` : 'No additional traveler notes were provided.',
    ],
  };
}
