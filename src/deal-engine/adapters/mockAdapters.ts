import { createSimulatedOffer } from './offerFactory';
import type {
  AdapterSearchQuery,
  AdapterSearchResult,
  ProviderHealth,
  TravelProviderAdapter,
} from './types';
import type {
  AffiliateMeta,
  AvailabilityStatus,
  InventoryCategory,
  LegalAttribution,
  PriceFreshness,
  UniversalOffer,
} from '../types';

const ALL_CATEGORIES: InventoryCategory[] = [
  'flight',
  'accommodation',
  'car_hire',
  'airport_transfer',
  'train',
  'bus',
  'ferry',
  'activity',
  'travel_insurance',
  'esim',
  'airport_parking',
];

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deterministicPrice(seed: string, base: number, spread: number): number {
  const n = hashSeed(seed) % 1000;
  return Math.round(base + (n / 1000) * spread);
}

function createMockAdapter(config: {
  providerId: string;
  displayName: string;
  categories: InventoryCategory[];
  reputation: number;
  latencyMs?: number;
  failRate?: number;
}): TravelProviderAdapter {
  const latencyMs = config.latencyMs ?? 40;
  const failRate = config.failRate ?? 0;

  const adapter: TravelProviderAdapter = {
    providerId: config.providerId,
    displayName: config.displayName,
    categories: config.categories,
    isLive: false,
    timeoutMs: 2500,
    maxRetries: 1,

    async getHealth(): Promise<ProviderHealth> {
      return {
        providerId: config.providerId,
        status: 'healthy',
        lastCheckedAt: new Date().toISOString(),
        latencyMs,
        message: 'Mock/demo adapter healthy.',
      };
    },

    getLegalAttribution(): LegalAttribution {
      return {
        providerDisplayName: config.displayName,
        dataSource: 'simulated-demo-catalog',
        termsUrl: null,
        privacyUrl: null,
        brandUsageNotes: 'Demo adapter — do not claim live partnership.',
      };
    },

    getAffiliateMeta(campaignId?: string | null): AffiliateMeta {
      return {
        partnerId: config.providerId,
        campaignId: campaignId ?? 'demo-campaign',
        clickId: null,
        attributionWindowHours: 24 * 30,
        commissionMetadata: {
          model: 'none',
          estimatedRateBps: null,
          notes: 'No live commission — demo metadata only.',
        },
        disclosureText:
          'Affiliate disclosure: Travel Buddy may earn a commission from approved partners. Deal ranking does not use commission.',
        isSponsored: false,
      };
    },

    buildDeepLink(offerId: string, affiliate?: Partial<AffiliateMeta>): string {
      const campaign = affiliate?.campaignId ?? 'demo-campaign';
      return `https://demo.travelbuddy.local/out/${config.providerId}?offer=${encodeURIComponent(offerId)}&campaign=${encodeURIComponent(campaign)}`;
    },

    normalizeOffer(raw: Record<string, unknown>): UniversalOffer {
      const category = (raw.category as InventoryCategory) ?? 'activity';
      return createSimulatedOffer({
        id: String(raw.id ?? `${config.providerId}-normalized`),
        category,
        providerId: config.providerId,
        providerName: config.displayName,
        title: String(raw.title ?? 'Normalised offer'),
        subtitle: String(raw.subtitle ?? ''),
        basePrice: Number(raw.basePrice ?? 0),
        providerReputation: config.reputation,
      });
    },

    async getAvailability(): Promise<AvailabilityStatus> {
      return 'available';
    },

    async getPriceFreshness(): Promise<PriceFreshness> {
      return 'simulated';
    },

    async search(query: AdapterSearchQuery): Promise<AdapterSearchResult> {
      const searchedAt = new Date().toISOString();
      const health = await this.getHealth();
      try {
        await sleep(latencyMs, query.signal);
      } catch {
        return {
          offers: [],
          providerId: config.providerId,
          searchedAt,
          timedOut: true,
          rateLimited: false,
          error: 'Search aborted or timed out.',
          health: { ...health, status: 'degraded', message: 'Timeout/abort' },
        };
      }

      if (failRate > 0 && hashSeed(`${config.providerId}:${query.destination}`) % 100 < failRate * 100) {
        return {
          offers: [],
          providerId: config.providerId,
          searchedAt,
          timedOut: false,
          rateLimited: true,
          error: 'Simulated rate limit.',
          health: { ...health, status: 'rate_limited', message: 'Rate limited (simulated)' },
        };
      }

      if (!config.categories.includes(query.category)) {
        return {
          offers: [],
          providerId: config.providerId,
          searchedAt,
          timedOut: false,
          rateLimited: false,
          error: null,
          health,
        };
      }

      const origin = (query.origin ?? 'LHR').toUpperCase();
      const destination = (query.destination ?? 'BCN').toUpperCase();
      const travellers = query.travellers ?? 1;
      const currency = query.currency ?? 'GBP';
      const seed = `${config.providerId}|${query.category}|${origin}|${destination}|${query.departDate ?? ''}`;

      const offers = buildCategoryOffers({
        adapter: config,
        query,
        seed,
        origin,
        destination,
        travellers,
        currency,
        searchedAt,
        affiliate: this.getAffiliateMeta(),
        legal: this.getLegalAttribution(),
      });

      return {
        offers,
        providerId: config.providerId,
        searchedAt,
        timedOut: false,
        rateLimited: false,
        error: null,
        health,
      };
    },
  };

  return adapter;
}

function buildCategoryOffers(args: {
  adapter: { providerId: string; displayName: string; reputation: number };
  query: AdapterSearchQuery;
  seed: string;
  origin: string;
  destination: string;
  travellers: number;
  currency: string;
  searchedAt: string;
  affiliate: AffiliateMeta;
  legal: LegalAttribution;
}): UniversalOffer[] {
  const { adapter, query, seed, origin, destination, travellers, currency, searchedAt, affiliate, legal } =
    args;
  const category = query.category;
  const bags = query.bags ?? 0;

  if (category === 'flight') {
    const base = deterministicPrice(seed, 95, 220);
    const stops = hashSeed(seed) % 3;
    const duration = 120 + stops * 95 + (hashSeed(`${seed}:d`) % 90);
    const selfTransfer = stops > 1 && hashSeed(`${seed}:st`) % 5 === 0;
    const overnight = duration > 480 && hashSeed(`${seed}:on`) % 3 === 0;
    const airportChange = stops > 0 && hashSeed(`${seed}:ac`) % 7 === 0;
    const warnings = [
      ...(selfTransfer ? ['Self-transfer: separate tickets — missed connection risk.'] : []),
      ...(overnight ? ['Overnight connection warning.'] : []),
      ...(airportChange ? ['Airport-change connection warning.'] : []),
      'Visa/transit requirements not verified — placeholder only.',
    ];
    const baggageCosts = bags > 0 ? bags * 35 : hashSeed(`${seed}:bag`) % 2 === 0 ? 0 : 45;
    return [
      createSimulatedOffer({
        id: `${adapter.providerId}-flt-${hashSeed(seed).toString(16)}`,
        category: 'flight',
        providerId: adapter.providerId,
        providerName: adapter.displayName,
        title: `${origin} → ${destination}`,
        subtitle: `${query.cabinClass ?? 'economy'} · ${stops} stop(s) · ${duration} min`,
        basePrice: base * travellers,
        baggageCosts: baggageCosts * travellers,
        seatCosts: query.cabinClass === 'business' ? 0 : 18 * travellers,
        taxes: Math.round(base * travellers * 0.15),
        bookingFees: 8,
        currency,
        providerReputation: adapter.reputation,
        refundability: stops === 0 ? 'refundable' : 'partially_refundable',
        includedExtras: baggageCosts === 0 ? ['1× cabin bag', '1× checked bag'] : ['1× cabin bag'],
        warnings,
        details: {
          tripType: query.returnDate ? 'return' : 'one_way',
          stops,
          durationMinutes: duration,
          selfTransfer,
          overnightConnection: overnight,
          airportChange,
          airlines: [`${adapter.providerId.slice(0, 2).toUpperCase()} Air`],
          nearbyDeparture: Boolean(query.nearbyAirports) && hashSeed(`${seed}:nd`) % 2 === 0,
          nearbyArrival: Boolean(query.nearbyAirports) && hashSeed(`${seed}:na`) % 3 === 0,
          flexibleDateShiftDays: query.flexibleDates ? (hashSeed(`${seed}:fd`) % 3) - 1 : 0,
        },
        affiliate,
        legal,
        now: searchedAt,
        providersSearched: [adapter.providerId],
        deepLink: `https://demo.travelbuddy.local/out/${adapter.providerId}?offer=flight&o=${origin}&d=${destination}`,
      }),
      createSimulatedOffer({
        id: `${adapter.providerId}-flt-ow-${hashSeed(`${seed}:ow`).toString(16)}`,
        category: 'flight',
        providerId: adapter.providerId,
        providerName: adapter.displayName,
        title: `${origin} → ${destination} (separate one-ways)`,
        subtitle: 'Mixed-airline style one-way combo · demo',
        basePrice: Math.round(base * travellers * 0.92),
        baggageCosts: 55 * travellers,
        taxes: Math.round(base * travellers * 0.14),
        bookingFees: 12,
        currency,
        providerReputation: adapter.reputation - 4,
        warnings: ['Separate one-way tickets may require self-transfer.', ...warnings],
        details: {
          tripType: 'separate_one_ways',
          stops: stops + 1,
          durationMinutes: duration + 40,
          selfTransfer: true,
          mixedAirlines: true,
        },
        affiliate,
        legal,
        now: searchedAt,
        providersSearched: [adapter.providerId],
      }),
    ];
  }

  if (category === 'accommodation') {
    const nights = 4;
    const nightly = deterministicPrice(seed, 70, 160);
    const cleaning = hashSeed(`${seed}:cl`) % 2 === 0 ? 45 : 0;
    const resort = hashSeed(`${seed}:rf`) % 3 === 0 ? 25 * nights : 0;
    const propertyTypes = ['hotel', 'apartment', 'hostel', 'resort', 'holiday_home', 'serviced_apartment'] as const;
    const propertyType = propertyTypes[hashSeed(seed) % propertyTypes.length]!;
    return [
      createSimulatedOffer({
        id: `${adapter.providerId}-stay-${hashSeed(seed).toString(16)}`,
        category: 'accommodation',
        providerId: adapter.providerId,
        providerName: adapter.displayName,
        title: `${destination} ${propertyType.replace('_', ' ')}`,
        subtitle: `${nights} nights · guest rating ${(7 + (hashSeed(seed) % 25) / 10).toFixed(1)}`,
        basePrice: nightly * nights,
        taxes: Math.round(nightly * nights * 0.1),
        cleaningFees: cleaning,
        resortOrDestinationFees: resort,
        bookingFees: 6,
        currency,
        providerReputation: adapter.reputation,
        refundability: cleaning === 0 ? 'refundable' : 'non_refundable',
        includedExtras: hashSeed(`${seed}:bf`) % 2 === 0 ? ['Breakfast'] : [],
        warnings: cleaning > 0 ? ['Cleaning fee applies at property.'] : [],
        details: {
          propertyType,
          nights,
          payLater: hashSeed(`${seed}:pl`) % 2 === 0,
          locationScore: 60 + (hashSeed(`${seed}:loc`) % 40),
          guestRating: 7 + (hashSeed(seed) % 25) / 10,
          roomType: 'standard',
          bedConfiguration: '1 double or 2 twins',
          accessibility: hashSeed(`${seed}:acc`) % 2 === 0,
          parking: hashSeed(`${seed}:pk`) % 2 === 0,
          depositRequired: cleaning > 0,
          splitStayCandidate: false,
        },
        affiliate,
        legal,
        now: searchedAt,
        providersSearched: [adapter.providerId],
      }),
      createSimulatedOffer({
        id: `${adapter.providerId}-stay-split-${hashSeed(`${seed}:split`).toString(16)}`,
        category: 'accommodation',
        providerId: adapter.providerId,
        providerName: adapter.displayName,
        title: `${destination} split-stay (2 properties)`,
        subtitle: 'Meaningful savings vs single property · demo',
        basePrice: Math.round(nightly * nights * 0.78),
        taxes: Math.round(nightly * nights * 0.08),
        cleaningFees: cleaning + 20,
        resortOrDestinationFees: 0,
        currency,
        providerReputation: adapter.reputation - 6,
        warnings: ['Split stay: two check-ins — extra inconvenience.', 'Book each property separately.'],
        details: {
          propertyType: 'apartment',
          nights,
          splitStayCandidate: true,
          splitProperties: 2,
          locationScore: 55,
          guestRating: 7.2,
          payLater: false,
        },
        affiliate,
        legal,
        now: searchedAt,
        providersSearched: [adapter.providerId],
      }),
    ];
  }

  const catalog: Record<
    Exclude<InventoryCategory, 'flight' | 'accommodation'>,
    { title: string; base: number; spread: number; extras: string[] }
  > = {
    car_hire: { title: `Car hire in ${destination}`, base: 90, spread: 80, extras: ['Unlimited mileage'] },
    airport_transfer: {
      title: `${destination} airport transfer`,
      base: 35,
      spread: 40,
      extras: ['Meet & greet'],
    },
    train: { title: `${origin}–${destination} train`, base: 45, spread: 70, extras: ['Seat reservation'] },
    bus: { title: `${origin}–${destination} bus`, base: 18, spread: 30, extras: ['1× cabin bag'] },
    ferry: { title: `${origin}–${destination} ferry`, base: 55, spread: 50, extras: ['Foot passenger'] },
    activity: { title: `${destination} city activity`, base: 40, spread: 60, extras: ['Skip-the-line'] },
    travel_insurance: {
      title: 'Travel insurance (demo quote)',
      base: 28 * travellers,
      spread: 40,
      extras: ['Medical cover placeholder'],
    },
    esim: { title: `${destination} eSIM data pack`, base: 12, spread: 20, extras: ['5GB / 7 days'] },
    airport_parking: {
      title: `${origin} airport parking`,
      base: 48,
      spread: 35,
      extras: ['Meet & greet parking'],
    },
  };

  const entry = catalog[category as Exclude<InventoryCategory, 'flight' | 'accommodation'>];
  if (!entry) return [];

  return [
    createSimulatedOffer({
      id: `${adapter.providerId}-${category}-${hashSeed(seed).toString(16)}`,
      category,
      providerId: adapter.providerId,
      providerName: adapter.displayName,
      title: entry.title,
      subtitle: 'Simulated demo offer',
      basePrice: deterministicPrice(seed, entry.base, entry.spread),
      taxes: 5,
      bookingFees: 2,
      currency,
      providerReputation: adapter.reputation,
      includedExtras: entry.extras,
      details: { category },
      affiliate,
      legal,
      now: searchedAt,
      providersSearched: [adapter.providerId],
    }),
  ];
}

export const MOCK_ADAPTERS: TravelProviderAdapter[] = [
  createMockAdapter({
    providerId: 'demo-sky',
    displayName: 'Demo Sky Search',
    categories: ['flight', 'train', 'bus'],
    reputation: 78,
    latencyMs: 35,
  }),
  createMockAdapter({
    providerId: 'demo-stay',
    displayName: 'Demo Stay Market',
    categories: ['accommodation', 'activity'],
    reputation: 81,
    latencyMs: 45,
  }),
  createMockAdapter({
    providerId: 'demo-ground',
    displayName: 'Demo Ground Hub',
    categories: ['car_hire', 'airport_transfer', 'ferry', 'airport_parking'],
    reputation: 74,
    latencyMs: 30,
  }),
  createMockAdapter({
    providerId: 'demo-protect',
    displayName: 'Demo Protect & Connect',
    categories: ['travel_insurance', 'esim'],
    reputation: 70,
    latencyMs: 25,
  }),
  createMockAdapter({
    providerId: 'demo-omnibus',
    displayName: 'Demo Omnibus',
    categories: ALL_CATEGORIES,
    reputation: 69,
    latencyMs: 55,
    failRate: 0.05,
  }),
];

export function getMockAdapter(providerId: string): TravelProviderAdapter | undefined {
  return MOCK_ADAPTERS.find((adapter) => adapter.providerId === providerId);
}
