import { adaptersForCategory } from './registry';
import type { AdapterSearchQuery, AdapterSearchResult, TravelProviderAdapter } from './types';
import type { UniversalOffer } from '../types';

export interface OrchestratedSearch {
  category: AdapterSearchQuery['category'];
  offers: UniversalOffer[];
  providerResults: AdapterSearchResult[];
  providersSearched: string[];
  searchedAt: string;
  partial: boolean;
  timedOutProviders: string[];
  rateLimitedProviders: string[];
  failedProviders: string[];
  durationMs: number;
}

async function searchWithTimeout(
  adapter: TravelProviderAdapter,
  query: AdapterSearchQuery,
  timeoutMs: number,
): Promise<AdapterSearchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onOuterAbort = () => controller.abort();
  query.signal?.addEventListener('abort', onOuterAbort, { once: true });

  let attempt = 0;
  let lastError: string | null = null;

  while (attempt <= adapter.maxRetries) {
    attempt += 1;
    try {
      const result = await adapter.search({ ...query, signal: controller.signal });
      clearTimeout(timer);
      query.signal?.removeEventListener('abort', onOuterAbort);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown adapter error';
      if (controller.signal.aborted) break;
    }
  }

  clearTimeout(timer);
  query.signal?.removeEventListener('abort', onOuterAbort);
  const health = await adapter.getHealth().catch(() => ({
    providerId: adapter.providerId,
    status: 'down' as const,
    lastCheckedAt: new Date().toISOString(),
    latencyMs: null,
    message: lastError ?? 'Adapter failure',
  }));

  return {
    offers: [],
    providerId: adapter.providerId,
    searchedAt: new Date().toISOString(),
    timedOut: controller.signal.aborted,
    rateLimited: false,
    error: lastError ?? 'Adapter failure',
    health,
  };
}

function dedupeOffers(offers: UniversalOffer[]): UniversalOffer[] {
  const seen = new Map<string, UniversalOffer>();
  for (const offer of offers) {
    const key = [
      offer.category,
      offer.providerId,
      offer.title,
      offer.subtitle,
      offer.costs.finalEstimatedPayableTotal,
      offer.costs.currency,
    ].join('|');
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, offer);
      continue;
    }
    // Prefer fresher / higher confidence when duplicates collide.
    const prefer =
      offer.priceTimestamp > existing.priceTimestamp ||
      (offer.confidence === 'high' && existing.confidence !== 'high');
    if (prefer) seen.set(key, offer);
  }
  return [...seen.values()];
}

export async function searchProvidersConcurrently(
  query: AdapterSearchQuery,
  options?: { timeoutMs?: number; adapters?: TravelProviderAdapter[] },
): Promise<OrchestratedSearch> {
  const started = performance.now();
  const searchedAt = new Date().toISOString();
  const adapters = options?.adapters ?? adaptersForCategory(query.category);
  const timeoutMs = options?.timeoutMs ?? Math.min(...adapters.map((a) => a.timeoutMs), 2500);

  const providerResults = await Promise.all(
    adapters.map((adapter) => searchWithTimeout(adapter, query, timeoutMs)),
  );

  const offers = dedupeOffers(
    providerResults.flatMap((result) =>
      result.offers.map((offer) => ({
        ...offer,
        providersSearched: adapters.map((adapter) => adapter.providerId),
        searchedAt,
      })),
    ),
  );

  const timedOutProviders = providerResults.filter((r) => r.timedOut).map((r) => r.providerId);
  const rateLimitedProviders = providerResults.filter((r) => r.rateLimited).map((r) => r.providerId);
  const failedProviders = providerResults
    .filter((r) => Boolean(r.error) && !r.timedOut && !r.rateLimited)
    .map((r) => r.providerId);

  return {
    category: query.category,
    offers,
    providerResults,
    providersSearched: adapters.map((adapter) => adapter.providerId),
    searchedAt,
    partial: timedOutProviders.length + rateLimitedProviders.length + failedProviders.length > 0,
    timedOutProviders,
    rateLimitedProviders,
    failedProviders,
    durationMs: Math.round(performance.now() - started),
  };
}
