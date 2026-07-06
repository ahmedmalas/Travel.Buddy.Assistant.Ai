import { seedPlaces } from '../../destination-workspace/data/seedPlaces';
import type { Trip } from '../model/trip.types';
import { buildTripDerivedFields } from '../model/trip.utils';

const now = new Date();

const baseTrip: Trip = {
  id: 'trip-japan-spring',
  name: 'Japan Spring Command Mission',
  status: 'planning',
  brief: {
    objective: 'Balance food, culture, and shopping while staying efficient on transfers.',
    travelStyle: 'Premium practical',
    party: '2 adults',
    dateWindow: {
      start: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date(now.getTime() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    },
    constraints: ['Avoid long transit chains after 9 PM', 'Keep one buffer block every day'],
    mustDo: ['Kyoto food crawl', 'Temple sunrise walk', 'One luxury ryokan night'],
    avoid: ['Back-to-back heavy museum blocks'],
    successCriteria: ['Low-friction logistics', 'Strong food discoveries', 'Good memory capture'],
  },
  destinations: [
    {
      id: 'destination-kyoto',
      tripId: 'trip-japan-spring',
      name: 'Kyoto',
      country: 'Japan',
      region: 'Kansai',
      summary: 'Core base for culture, food, and day planning.',
      order: 1,
    },
    {
      id: 'destination-osaka',
      tripId: 'trip-japan-spring',
      name: 'Osaka',
      country: 'Japan',
      region: 'Kansai',
      summary: 'Evening food and nightlife expansion node.',
      order: 2,
    },
  ],
  activeDestinationId: 'destination-kyoto',
  places: seedPlaces,
  reminders: [],
  notes: [
    {
      id: 'trip-note-1',
      tripId: 'trip-japan-spring',
      content: 'Use Kyoto as command base, then branch into Osaka late evenings.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ],
  itineraryDays: [
    {
      id: 'itinerary-day-1',
      tripId: 'trip-japan-spring',
      dayNumber: 1,
      summary: 'Arrival + low-friction orientation.',
    },
    {
      id: 'itinerary-day-2',
      tripId: 'trip-japan-spring',
      dayNumber: 2,
      summary: 'Food and culture heavy day.',
    },
  ],
  mapPoints: [],
  budget: {
    currency: 'USD',
    target: 4800,
    estimated: 4450,
    notes: 'Flights and accommodation rough estimates only.',
  },
  documents: [
    {
      id: 'document-flight-booking',
      tripId: 'trip-japan-spring',
      title: 'Flight booking placeholder',
      kind: 'transport',
      status: 'planned',
    },
  ],
  aiContext: {
    persona: 'Efficiency-first concierge',
    preferences: ['High food value density', 'Walkable clusters', 'Low transit friction'],
    constraints: ['No external API assumptions'],
    lastSummary: 'Keep all planning anchored to the active trip context.',
  },
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
};

export const seedTrips: Trip[] = [buildTripDerivedFields(baseTrip)];
