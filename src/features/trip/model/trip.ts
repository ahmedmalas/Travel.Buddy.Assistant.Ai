import type { ItineraryItem, ItineraryItemType, ItineraryStatus } from '../../itinerary/model/types';

export type TravelVaultItem = {
  id: string;
  tripId: string;
  title: string;
  category: 'passport' | 'visa' | 'insurance' | 'booking' | 'ticket' | 'custom';
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type Trip = {
  id: string;
  name: string;
  destination: string;
  timezone: string;
  startDate: string;
  endDate: string;
  itineraryItems: ItineraryItem[];
  itinerarySearchIndex: Record<string, string>;
  travelVaultItems: TravelVaultItem[];
  createdAt: string;
  updatedAt: string;
};

export type ItineraryFilterState = {
  query: string;
  type: ItineraryItemType | 'all';
  status: ItineraryStatus | 'all';
  date: string;
  tags: string[];
  sortDirection: 'asc' | 'desc';
};

export const defaultItineraryFilters: ItineraryFilterState = {
  query: '',
  type: 'all',
  status: 'all',
  date: '',
  tags: [],
  sortDirection: 'asc',
};
