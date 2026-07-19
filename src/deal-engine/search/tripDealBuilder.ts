import { searchProvidersConcurrently } from '../adapters/searchOrchestrator';
import type { TravellerPreferenceProfile } from '../preferences/profiles';
import type { InventoryCategory, TripDealProfile, TripPackageDeal, UniversalOffer } from '../types';

export interface WholeTripSearchInput {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  travellers?: number;
  currency?: string;
  includeCategories?: InventoryCategory[];
  preferences?: TravellerPreferenceProfile | null;
}

const DEFAULT_CATEGORIES: InventoryCategory[] = [
  'flight',
  'accommodation',
  'airport_transfer',
  'car_hire',
  'activity',
  'travel_insurance',
  'esim',
  'airport_parking',
];

function pickCheapest(offers: UniversalOffer[]): UniversalOffer | null {
  if (!offers.length) return null;
  return [...offers].sort(
    (a, b) => a.costs.finalEstimatedPayableTotal - b.costs.finalEstimatedPayableTotal,
  )[0]!;
}

function pickByScore(
  offers: UniversalOffer[],
  scorer: (offer: UniversalOffer) => number,
): UniversalOffer | null {
  if (!offers.length) return null;
  return [...offers].sort((a, b) => scorer(b) - scorer(a))[0]!;
}

function packageFrom(
  profile: TripDealProfile,
  title: string,
  components: Array<UniversalOffer | null>,
  why: string,
): TripPackageDeal | null {
  const present = components.filter((c): c is UniversalOffer => Boolean(c));
  if (!present.length) return null;
  const currency = present[0]!.costs.currency;
  const totalEstimatedPayable = present.reduce(
    (sum, offer) => sum + offer.costs.finalEstimatedPayableTotal,
    0,
  );
  const bookingFragmentation = new Set(present.map((offer) => offer.providerId)).size;
  const warnings = [
    ...present.flatMap((offer) => offer.warnings),
    ...(bookingFragmentation > 1
      ? [`${bookingFragmentation} providers must be booked separately — Travel Buddy does not process payment.`]
      : []),
  ];

  return {
    id: `pkg-${profile}-${present.map((o) => o.id).join('-').slice(0, 48)}`,
    profile,
    title,
    components: present,
    totalEstimatedPayable,
    currency,
    bookingFragmentation,
    whyThisDeal: why,
    warnings,
    environmentalImpactPlaceholder:
      'Environmental impact ranking is a placeholder until verified emissions data is available.',
  };
}

export async function buildWholeTripDeals(input: WholeTripSearchInput): Promise<{
  packages: TripPackageDeal[];
  byCategory: Partial<Record<InventoryCategory, UniversalOffer[]>>;
  searchedAt: string;
  providersSearched: string[];
  disclaimer: string;
}> {
  const categories = input.includeCategories ?? DEFAULT_CATEGORIES;
  const byCategory: Partial<Record<InventoryCategory, UniversalOffer[]>> = {};
  const providers = new Set<string>();
  let searchedAt = new Date().toISOString();

  await Promise.all(
    categories.map(async (category) => {
      const result = await searchProvidersConcurrently({
        category,
        origin: input.origin,
        destination: input.destination,
        departDate: input.departDate,
        returnDate: input.returnDate,
        travellers: input.travellers,
        currency: input.currency,
      });
      byCategory[category] = result.offers;
      result.providersSearched.forEach((id) => providers.add(id));
      searchedAt = result.searchedAt;
    }),
  );

  const flights = byCategory.flight ?? [];
  const stays = byCategory.accommodation ?? [];
  const transfer = byCategory.airport_transfer ?? [];
  const car = byCategory.car_hire ?? [];
  const activity = byCategory.activity ?? [];
  const insurance = byCategory.travel_insurance ?? [];
  const esim = byCategory.esim ?? [];
  const parking = byCategory.airport_parking ?? [];

  const cheapestFlight = pickCheapest(flights);
  const cheapestStay = pickCheapest(stays);
  const flexibleStay = pickByScore(stays, (o) =>
    o.cancellation.refundability === 'refundable' ? 100 : 40,
  );
  const convenientFlight = pickByScore(flights, (o) => {
    const stops = Number(o.details.stops ?? 0);
    const duration = Number(o.details.durationMinutes ?? 999);
    return 100 - stops * 20 - duration / 20 - (o.details.selfTransfer ? 40 : 0);
  });
  const premiumFlight = pickByScore(flights, (o) => o.providerReputation + (o.costs.baggageCosts === 0 ? 10 : 0));
  const familyStay = pickByScore(stays, (o) => Number(o.details.guestRating ?? 0) * 10 + Number(o.details.locationScore ?? 0));
  const lowRiskFlight = pickByScore(flights, (o) => (o.details.selfTransfer ? 0 : 50) + (o.cancellation.refundability === 'refundable' ? 40 : 10));

  const packages = [
    packageFrom(
      'cheapest_sensible',
      'Cheapest sensible trip',
      [cheapestFlight, cheapestStay, pickCheapest(transfer), pickCheapest(esim)],
      'Minimises total journey cost across flight + stay + essential ground/connect while avoiding empty packages.',
    ),
    packageFrom(
      'best_value',
      'Best overall value',
      [convenientFlight, familyStay, pickCheapest(activity), pickCheapest(insurance)],
      'Balances total payable cost with convenience, stay quality, and protective extras.',
    ),
    packageFrom(
      'most_convenient',
      'Most convenient',
      [convenientFlight, familyStay, pickCheapest(transfer), pickCheapest(parking)],
      'Prioritises fewer stops, transfers, and parking over raw headline savings.',
    ),
    packageFrom(
      'most_flexible',
      'Most flexible',
      [lowRiskFlight, flexibleStay, pickCheapest(insurance)],
      'Favours refundable components and lower booking risk.',
    ),
    packageFrom(
      'premium_value',
      'Premium value',
      [premiumFlight, familyStay, pickCheapest(car), pickCheapest(activity)],
      'Higher provider reputation and included extras relative to total payable.',
    ),
    packageFrom(
      'family_friendly',
      'Family-friendly',
      [convenientFlight, familyStay, pickCheapest(transfer), pickCheapest(activity)],
      'Emphasises location/rating and simpler connections for family travel.',
    ),
    packageFrom(
      'lowest_risk',
      'Lowest-risk booking',
      [lowRiskFlight, flexibleStay, pickCheapest(insurance)],
      'Reduces self-transfer and non-refundable exposure; still a multi-provider handoff when needed.',
    ),
    packageFrom(
      'lowest_environmental_impact',
      'Lowest environmental impact (placeholder)',
      [pickByScore(flights, (o) => 100 - Number(o.details.durationMinutes ?? 300) / 10), cheapestStay],
      'Placeholder ranking using shorter journey duration until verified emissions data exists.',
    ),
  ].filter((pkg): pkg is TripPackageDeal => Boolean(pkg));

  return {
    packages,
    byCategory,
    searchedAt,
    providersSearched: [...providers],
    disclaimer:
      'Whole-trip totals are estimated from simulated component offers. Travel Buddy never claims a package is the cheapest available everywhere.',
  };
}
