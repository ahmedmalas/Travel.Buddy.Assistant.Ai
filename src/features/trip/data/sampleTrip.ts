import { buildItinerarySearchIndex } from '../../itinerary/adapters/search';
import { createItineraryItem } from '../../itinerary/model/itineraryItem';
import type { Trip } from '../model/trip';

const tripId = crypto.randomUUID();

const seededItems = [
  createItineraryItem({
    tripId,
    type: 'flight',
    title: 'JFK → HND',
    description: 'Overnight flight to Tokyo',
    startDateTime: '2026-09-14T13:30:00Z',
    endDateTime: '2026-09-15T03:40:00Z',
    timezone: 'Asia/Tokyo',
    location: 'Haneda Airport',
    supplier: 'Japan Airlines',
    confirmationNumber: 'JL2201',
    status: 'confirmed',
    notes: 'Window seat preferred.',
    linkedVaultItemIds: [],
    tags: ['arrival', 'international'],
  }),
  createItineraryItem({
    tripId,
    type: 'hotel',
    title: 'Shinjuku Grand Stay',
    description: 'Check-in and rest',
    startDateTime: '2026-09-15T06:00:00Z',
    endDateTime: '2026-09-18T02:00:00Z',
    timezone: 'Asia/Tokyo',
    location: 'Shinjuku, Tokyo',
    supplier: 'Grand Stay',
    confirmationNumber: 'H-93488',
    status: 'confirmed',
    notes: 'Late check-in approved.',
    linkedVaultItemIds: [],
    tags: ['hotel', 'check-in'],
  }),
  createItineraryItem({
    tripId,
    type: 'activity',
    title: 'Tsukiji Food Tour',
    description: 'Guided tasting tour',
    startDateTime: '2026-09-16T00:30:00Z',
    endDateTime: '2026-09-16T03:00:00Z',
    timezone: 'Asia/Tokyo',
    location: 'Tsukiji Outer Market',
    supplier: 'Tokyo Food Walks',
    confirmationNumber: 'TFW-402',
    status: 'planned',
    notes: 'Meet at main gate 10 minutes early.',
    linkedVaultItemIds: [],
    tags: ['food', 'tour'],
  }),
];

const createdAt = new Date().toISOString();

const travelVaultItems: Trip['travelVaultItems'] = [
  {
    id: crypto.randomUUID(),
    tripId,
    title: 'Passport Copy',
    category: 'passport',
    description: 'Scanned passport PDF',
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: crypto.randomUUID(),
    tripId,
    title: 'Hotel Confirmation PDF',
    category: 'booking',
    description: 'Booking receipt and cancellation policy',
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: crypto.randomUUID(),
    tripId,
    title: 'Travel Insurance Certificate',
    category: 'insurance',
    description: 'Policy and emergency numbers',
    createdAt,
    updatedAt: createdAt,
  },
];

const seededWithLinkedDocs = seededItems.map((item, index) => {
  if (index === 0) return { ...item, linkedVaultItemIds: [travelVaultItems[0].id] };
  if (index === 1) return { ...item, linkedVaultItemIds: [travelVaultItems[1].id, travelVaultItems[2].id] };
  return item;
});

const itinerarySearchIndex = Object.fromEntries(
  seededWithLinkedDocs.map((item) => [item.id, buildItinerarySearchIndex(item)]),
);

export const sampleTrip: Trip = {
  id: tripId,
  name: 'Tokyo Culinary Sprint',
  destination: 'Tokyo, Japan',
  timezone: 'Asia/Tokyo',
  startDate: '2026-09-14',
  endDate: '2026-09-20',
  itineraryItems: seededWithLinkedDocs,
  itinerarySearchIndex,
  travelVaultItems,
  createdAt,
  updatedAt: createdAt,
};
