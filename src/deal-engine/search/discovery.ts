import { buildWholeTripDeals } from './tripDealBuilder';
import type { TripPackageDeal } from '../types';

export type DiscoveryIntent =
  | 'anywhere_within_budget'
  | 'warm_destination'
  | 'beach_holiday'
  | 'family_holiday'
  | 'weekend_escape'
  | 'food_destination'
  | 'luxury_under_budget'
  | 'cheapest_international'
  | 'visa_friendly'
  | 'short_flight'
  | 'school_holiday_deal'
  | 'accessible_destination';

export interface DiscoveryQuery {
  intent: DiscoveryIntent;
  origin: string;
  budgetMax?: number;
  travellers?: number;
  currency?: string;
  departDate: string;
  returnDate: string;
}

const INTENT_DESTINATIONS: Record<DiscoveryIntent, string[]> = {
  anywhere_within_budget: ['BCN', 'LIS', 'AMS', 'PRG'],
  warm_destination: ['BCN', 'FAO', 'AGA', 'TFS'],
  beach_holiday: ['PMI', 'ACE', 'HER', 'FAO'],
  family_holiday: ['CDG', 'AMS', 'BCN', 'EDI'],
  weekend_escape: ['AMS', 'CDG', 'DUB', 'BRU'],
  food_destination: ['FCO', 'BCN', 'LIS', 'NRT'],
  luxury_under_budget: ['MXP', 'GVA', 'VCE', 'NCE'],
  cheapest_international: ['WRO', 'BUD', 'OTP', 'SOF'],
  visa_friendly: ['DUB', 'AMS', 'CDG', 'BER'],
  short_flight: ['AMS', 'CDG', 'DUB', 'BRU'],
  school_holiday_deal: ['PMI', 'FAO', 'BCN', 'AGP'],
  accessible_destination: ['AMS', 'CDG', 'ZRH', 'CPH'],
};

export interface DiscoveryResult {
  intent: DiscoveryIntent;
  destinationsConsidered: string[];
  rankedTrips: Array<TripPackageDeal & { destination: string }>;
  disclaimer: string;
}

export async function runFlexibleDiscovery(query: DiscoveryQuery): Promise<DiscoveryResult> {
  const destinations = INTENT_DESTINATIONS[query.intent];
  const packages: Array<TripPackageDeal & { destination: string }> = [];

  for (const destination of destinations) {
    const built = await buildWholeTripDeals({
      origin: query.origin,
      destination,
      departDate: query.departDate,
      returnDate: query.returnDate,
      travellers: query.travellers,
      currency: query.currency,
    });
    const best = built.packages.find((pkg) => pkg.profile === 'best_value') ?? built.packages[0];
    if (!best) continue;
    if (query.budgetMax != null && best.totalEstimatedPayable > query.budgetMax) continue;
    packages.push({ ...best, destination });
  }

  packages.sort((a, b) => a.totalEstimatedPayable - b.totalEstimatedPayable);

  return {
    intent: query.intent,
    destinationsConsidered: destinations,
    rankedTrips: packages,
    disclaimer:
      'Flexible discovery ranks complete simulated trip cost, not airfare alone. Destinations are demo heuristics, not live inventory claims.',
  };
}
