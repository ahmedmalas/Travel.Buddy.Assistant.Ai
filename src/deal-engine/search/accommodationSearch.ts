import { searchProvidersConcurrently, type OrchestratedSearch } from '../adapters/searchOrchestrator';
import { rankOffers } from '../ranking/ranker';
import type { TravellerPreferenceProfile } from '../preferences/profiles';
import type { RankedOffer, ScoringWeights, UniversalOffer } from '../types';
import { DEFAULT_SCORING_WEIGHTS } from '../types';

export interface AccommodationSuperSearchInput {
  destination: string;
  checkIn: string;
  checkOut: string;
  travellers?: number;
  propertyTypes?: string[];
  currency?: string;
  weights?: Partial<ScoringWeights>;
  preferences?: TravellerPreferenceProfile | null;
  requireBreakfast?: boolean;
  requireAccessibility?: boolean;
  requireParking?: boolean;
}

export interface AccommodationSuperSearchResult {
  search: OrchestratedSearch;
  ranked: RankedOffer[];
  splitStayCandidates: UniversalOffer[];
  disclaimer: string;
}

export async function runAccommodationSuperSearch(
  input: AccommodationSuperSearchInput,
): Promise<AccommodationSuperSearchResult> {
  const search = await searchProvidersConcurrently({
    category: 'accommodation',
    destination: input.destination,
    departDate: input.checkIn,
    returnDate: input.checkOut,
    travellers: input.travellers,
    currency: input.currency,
    propertyTypes: input.propertyTypes,
  });

  let offers = search.offers;
  if (input.propertyTypes?.length) {
    offers = offers.filter((offer) =>
      input.propertyTypes!.includes(String(offer.details.propertyType ?? '')),
    );
  }
  if (input.requireBreakfast) {
    offers = offers.filter((offer) => offer.includedExtras.some((x) => /breakfast/i.test(x)));
  }
  if (input.requireAccessibility) {
    offers = offers.filter((offer) => Boolean(offer.details.accessibility));
  }
  if (input.requireParking) {
    offers = offers.filter((offer) => Boolean(offer.details.parking));
  }

  const splitStayCandidates = offers.filter((offer) => Boolean(offer.details.splitStayCandidate));
  const weights = { ...DEFAULT_SCORING_WEIGHTS, ...input.weights };
  const ranked = rankOffers(offers, weights, input.preferences);

  return {
    search: { ...search, offers },
    ranked,
    splitStayCandidates,
    disclaimer:
      'Stay totals include taxes, cleaning, and mandatory fees where simulated. Not a claim of global lowest price.',
  };
}
