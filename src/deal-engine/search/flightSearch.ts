import { searchProvidersConcurrently, type OrchestratedSearch } from '../adapters/searchOrchestrator';
import { rankOffers } from '../ranking/ranker';
import type { TravellerPreferenceProfile } from '../preferences/profiles';
import type { RankedOffer, ScoringWeights } from '../types';
import { DEFAULT_SCORING_WEIGHTS } from '../types';

export type FlightTripMode = 'return' | 'one_way' | 'multi_city';

export interface FlightSuperSearchInput {
  mode: FlightTripMode;
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  multiCityLegs?: Array<{ origin: string; destination: string; date: string }>;
  flexibleDates?: boolean;
  nearbyAirports?: boolean;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  bags?: number;
  travellers?: number;
  maxStops?: number;
  maxJourneyMinutes?: number;
  preferredAirlines?: string[];
  excludedAirlines?: string[];
  currency?: string;
  weights?: Partial<ScoringWeights>;
  preferences?: TravellerPreferenceProfile | null;
}

export interface FlightSuperSearchResult {
  search: OrchestratedSearch;
  ranked: RankedOffer[];
  comparisons: {
    standardReturns: number;
    separateOneWays: number;
    mixedAirlineStyle: number;
    nearbyAirportVariants: number;
    dateShiftVariants: number;
    baggageInclusive: number;
  };
  disclaimer: string;
}

export async function runFlightSuperSearch(input: FlightSuperSearchInput): Promise<FlightSuperSearchResult> {
  const search = await searchProvidersConcurrently({
    category: 'flight',
    origin: input.origin,
    destination: input.destination,
    departDate: input.departDate,
    returnDate: input.mode === 'return' ? input.returnDate : undefined,
    travellers: input.travellers,
    currency: input.currency,
    cabinClass: input.cabinClass,
    maxStops: input.maxStops,
    maxJourneyMinutes: input.maxJourneyMinutes,
    preferredAirlines: input.preferredAirlines,
    excludedAirlines: input.excludedAirlines,
    bags: input.bags,
    nearbyAirports: input.nearbyAirports,
    flexibleDates: input.flexibleDates,
  });

  let offers = search.offers;
  if (input.maxStops != null) {
    offers = offers.filter((offer) => Number(offer.details.stops ?? 0) <= input.maxStops!);
  }
  if (input.maxJourneyMinutes != null) {
    offers = offers.filter(
      (offer) => Number(offer.details.durationMinutes ?? 0) <= input.maxJourneyMinutes!,
    );
  }
  if (input.excludedAirlines?.length) {
    offers = offers.filter((offer) => {
      const airlines = (offer.details.airlines as string[] | undefined) ?? [];
      return !airlines.some((airline) => input.excludedAirlines!.includes(airline));
    });
  }

  const weights = { ...DEFAULT_SCORING_WEIGHTS, ...input.weights };
  const ranked = rankOffers(offers, weights, input.preferences);

  return {
    search: { ...search, offers },
    ranked,
    comparisons: {
      standardReturns: offers.filter((o) => o.details.tripType === 'return' || input.mode === 'return').length,
      separateOneWays: offers.filter((o) => o.details.tripType === 'separate_one_ways').length,
      mixedAirlineStyle: offers.filter((o) => Boolean(o.details.mixedAirlines)).length,
      nearbyAirportVariants: offers.filter(
        (o) => Boolean(o.details.nearbyDeparture) || Boolean(o.details.nearbyArrival),
      ).length,
      dateShiftVariants: offers.filter((o) => Number(o.details.flexibleDateShiftDays ?? 0) !== 0).length,
      baggageInclusive: offers.filter((o) => o.costs.baggageCosts === 0).length,
    },
    disclaimer:
      'Travel Buddy compares simulated demo inventory only. Results are not a claim that any fare is the cheapest available everywhere.',
  };
}
