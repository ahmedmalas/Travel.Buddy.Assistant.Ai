export const itineraryItemTypes = [
  'flight',
  'hotel',
  'transport',
  'activity',
  'restaurant',
  'tour',
  'meeting',
  'custom',
] as const;

export type ItineraryItemType = (typeof itineraryItemTypes)[number];

export const itineraryStatuses = ['planned', 'confirmed', 'completed', 'cancelled'] as const;

export type ItineraryStatus = (typeof itineraryStatuses)[number];

export type ItineraryItem = {
  id: string;
  tripId: string;
  type: ItineraryItemType;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  location: string;
  supplier: string;
  confirmationNumber: string;
  status: ItineraryStatus;
  notes: string;
  linkedVaultItemIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateItineraryItemInput = Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateItineraryItemInput = Partial<Omit<ItineraryItem, 'id' | 'tripId' | 'createdAt'>> & { id: string };
