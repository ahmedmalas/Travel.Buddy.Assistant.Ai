import type {
  AffiliateMeta,
  AvailabilityStatus,
  InventoryCategory,
  LegalAttribution,
  PriceFreshness,
  UniversalOffer,
} from '../types';

export interface ProviderHealth {
  providerId: string;
  status: 'healthy' | 'degraded' | 'down' | 'rate_limited';
  lastCheckedAt: string;
  latencyMs: number | null;
  message: string;
}

export interface AdapterSearchQuery {
  category: InventoryCategory;
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  travellers?: number;
  currency?: string;
  cabinClass?: string;
  maxStops?: number;
  maxJourneyMinutes?: number;
  preferredAirlines?: string[];
  excludedAirlines?: string[];
  bags?: number;
  nearbyAirports?: boolean;
  flexibleDates?: boolean;
  propertyTypes?: string[];
  budgetMax?: number;
  signal?: AbortSignal;
}

export interface AdapterSearchResult {
  offers: UniversalOffer[];
  providerId: string;
  searchedAt: string;
  timedOut: boolean;
  rateLimited: boolean;
  error: string | null;
  health: ProviderHealth;
}

export interface TravelProviderAdapter {
  readonly providerId: string;
  readonly displayName: string;
  readonly categories: InventoryCategory[];
  readonly isLive: boolean;
  search(query: AdapterSearchQuery): Promise<AdapterSearchResult>;
  normalizeOffer(raw: Record<string, unknown>): UniversalOffer;
  getAvailability(offerId: string): Promise<AvailabilityStatus>;
  getPriceFreshness(offerId: string): Promise<PriceFreshness>;
  buildDeepLink(offerId: string, affiliate?: Partial<AffiliateMeta>): string;
  getAffiliateMeta(campaignId?: string | null): AffiliateMeta;
  getLegalAttribution(): LegalAttribution;
  getHealth(): Promise<ProviderHealth>;
  /** Rate-limit / retry knobs exposed for orchestrator. */
  readonly timeoutMs: number;
  readonly maxRetries: number;
}
