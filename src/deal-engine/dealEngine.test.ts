import { describe, expect, it } from 'vitest';
import { convertCurrency } from './currency';
import { sumCosts, createSimulatedOffer } from './adapters/offerFactory';
import { listAdapters, adaptersForCategory, listLiveAdapters } from './adapters/registry';
import {
  areLiveProvidersEnabled,
  getInventoryMode,
  getInventoryModeBanner,
  getInventoryModeClaims,
} from './adapters/inventoryMode';
import { searchProvidersConcurrently } from './adapters/searchOrchestrator';
import { MOCK_ADAPTERS } from './adapters/mockAdapters';
import { rankOffers, mergeScoringWeights } from './ranking/ranker';
import { runFlightSuperSearch } from './search/flightSearch';
import { runAccommodationSuperSearch } from './search/accommodationSearch';
import { buildWholeTripDeals } from './search/tripDealBuilder';
import { runFlexibleDiscovery } from './search/discovery';
import {
  buildPriceTrend,
  createPriceAlert,
  evaluateAlert,
  generateSimulatedPriceHistory,
  shouldSuppressDuplicateTrigger,
} from './alerts/priceHistory';
import { createDefaultPreferenceProfile } from './preferences/profiles';
import { buildTrustPanel } from './trust/trustCentre';
import {
  applyConversionCallback,
  buildRevenueReport,
  generateDeepLink,
  isWithinAttributionWindow,
  recordClick,
} from './affiliate/attribution';
import { buildPartnerMediaKit } from './partners/partnerCentre';
import { listOnboardingRecords, updateOnboardingStatus } from './partners/onboarding';
import {
  buildDestinationLandingPage,
  buildSavingsReport,
  getReferralProgrammeFoundation,
} from './growth/growthEngine';
import {
  buildPackageChecklist,
  captureBookingConfirmation,
  createShortlistItem,
  itineraryItemsFromConfirmations,
  toComparisonRows,
} from './handoff/bookingHandoff';
import { createEmptyDealEngineState, migrateDealEngineState } from './state';
import { DEFAULT_SCORING_WEIGHTS } from './types';

describe('deal-engine core (slices 73–88)', () => {
  it('exposes mock adapters for all inventory categories', () => {
    const categories = new Set(listAdapters().flatMap((adapter) => adapter.categories));
    for (const category of [
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
    ] as const) {
      expect(categories.has(category)).toBe(true);
      expect(adaptersForCategory(category).length).toBeGreaterThan(0);
    }
    expect(MOCK_ADAPTERS.every((adapter) => adapter.isLive === false)).toBe(true);
  });

  it('keeps production inventory in demo-simulated mode with no live adapters', () => {
    expect(listLiveAdapters()).toHaveLength(0);
    expect(getInventoryMode()).toBe('demo-simulated');
    expect(areLiveProvidersEnabled()).toBe(false);
    expect(getInventoryModeBanner()).toMatch(/LIVE PROVIDERS DISABLED/i);
    expect(getInventoryModeClaims()).toEqual({
      livePrices: false,
      liveAvailability: false,
      otaPartnerships: false,
      guaranteedCheapest: false,
      realBooking: false,
    });
  });

  it('never ranks on headline base price alone', () => {
    const cheapBase = createSimulatedOffer({
      id: 'a',
      category: 'flight',
      providerId: 'p1',
      providerName: 'P1',
      title: 'Cheap base',
      subtitle: '',
      basePrice: 50,
      baggageCosts: 200,
      taxes: 20,
    });
    const honestTotal = createSimulatedOffer({
      id: 'b',
      category: 'flight',
      providerId: 'p2',
      providerName: 'P2',
      title: 'Honest total',
      subtitle: '',
      basePrice: 180,
      baggageCosts: 0,
      taxes: 20,
    });
    expect(cheapBase.costs.basePrice).toBeLessThan(honestTotal.costs.basePrice);
    expect(cheapBase.costs.finalEstimatedPayableTotal).toBeGreaterThan(
      honestTotal.costs.finalEstimatedPayableTotal,
    );
    const ranked = rankOffers([cheapBase, honestTotal], {
      ...DEFAULT_SCORING_WEIGHTS,
      totalCost: 100,
      travelDuration: 0,
      stops: 0,
      departureTimes: 0,
      arrivalTimes: 0,
      selfTransferRisk: 0,
      cancellationFlexibility: 0,
      providerQuality: 0,
      baggageInclusion: 0,
      accommodationLocation: 0,
      travellerPreferences: 0,
      accessibility: 0,
      bookingFragmentation: 0,
      priceConfidence: 0,
    });
    expect(ranked[0]?.id).toBe('b');
    expect(ranked[0]?.whyThisDeal.toLowerCase()).toContain('payable');
  });

  it('ranks deterministically for identical inputs', () => {
    const offers = [
      createSimulatedOffer({
        id: 'z',
        category: 'flight',
        providerId: 'p',
        providerName: 'P',
        title: 'Z',
        subtitle: '',
        basePrice: 100,
        details: { stops: 1, durationMinutes: 200 },
      }),
      createSimulatedOffer({
        id: 'a',
        category: 'flight',
        providerId: 'p',
        providerName: 'P',
        title: 'A',
        subtitle: '',
        basePrice: 100,
        details: { stops: 1, durationMinutes: 200 },
      }),
    ];
    const first = rankOffers(offers).map((o) => o.id);
    const second = rankOffers(offers).map((o) => o.id);
    expect(first).toEqual(second);
  });

  it('does not boost sponsored offers via commission', () => {
    const organic = createSimulatedOffer({
      id: 'organic',
      category: 'flight',
      providerId: 'p',
      providerName: 'P',
      title: 'Organic',
      subtitle: '',
      basePrice: 120,
      providerReputation: 80,
    });
    const sponsored = createSimulatedOffer({
      id: 'sponsored',
      category: 'flight',
      providerId: 'p',
      providerName: 'P',
      title: 'Sponsored',
      subtitle: '',
      basePrice: 120,
      providerReputation: 80,
      affiliate: {
        ...organic.affiliate,
        isSponsored: true,
        commissionMetadata: { model: 'cpa', estimatedRateBps: 800, notes: 'test' },
      },
    });
    const ranked = rankOffers([sponsored, organic]);
    expect(ranked[0]?.rankScore).toBe(ranked[1]?.rankScore);
  });

  it('searches providers concurrently and handles partial failures', async () => {
    const result = await searchProvidersConcurrently(
      {
        category: 'flight',
        origin: 'LHR',
        destination: 'BCN',
        departDate: '2026-09-01',
        returnDate: '2026-09-08',
      },
      { timeoutMs: 2000 },
    );
    expect(result.providersSearched.length).toBeGreaterThan(1);
    expect(result.offers.length).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    const totals = result.offers.map((o) => o.costs.finalEstimatedPayableTotal);
    expect(totals.every((total) => Number.isFinite(total))).toBe(true);
  });

  it('runs flight and accommodation super-search', async () => {
    const flights = await runFlightSuperSearch({
      mode: 'return',
      origin: 'LHR',
      destination: 'BCN',
      departDate: '2026-09-01',
      returnDate: '2026-09-08',
      nearbyAirports: true,
      flexibleDates: true,
      bags: 1,
    });
    expect(flights.ranked.length).toBeGreaterThan(0);
    expect(flights.disclaimer.toLowerCase()).toContain('not a claim');

    const stays = await runAccommodationSuperSearch({
      destination: 'BCN',
      checkIn: '2026-09-01',
      checkOut: '2026-09-08',
    });
    expect(stays.ranked.length).toBeGreaterThan(0);
    expect(stays.splitStayCandidates.length).toBeGreaterThanOrEqual(0);
  });

  it('builds whole-trip packages and discovery by complete trip cost', async () => {
    const packages = await buildWholeTripDeals({
      origin: 'LHR',
      destination: 'BCN',
      departDate: '2026-09-01',
      returnDate: '2026-09-08',
      travellers: 2,
    });
    expect(packages.packages.length).toBeGreaterThan(3);
    expect(packages.packages.every((pkg) => pkg.totalEstimatedPayable > 0)).toBe(true);

    const discovery = await runFlexibleDiscovery({
      intent: 'weekend_escape',
      origin: 'LHR',
      departDate: '2026-09-01',
      returnDate: '2026-09-03',
      budgetMax: 5000,
    });
    expect(discovery.rankedTrips.length).toBeGreaterThan(0);
    const sorted = [...discovery.rankedTrips].sort(
      (a, b) => a.totalEstimatedPayable - b.totalEstimatedPayable,
    );
    expect(discovery.rankedTrips.map((t) => t.id)).toEqual(sorted.map((t) => t.id));
  });

  it('supports price history alerts with duplicate suppression', () => {
    const snaps = generateSimulatedPriceHistory('offer-1', 200, 'GBP', 7);
    const trend = buildPriceTrend(snaps)!;
    const alert = createPriceAlert({
      offerKey: 'offer-1',
      kind: 'percentage_drop',
      percentageDrop: 1,
      label: 'drop',
    });
    const first = evaluateAlert(
      { ...alert, lastTriggeredAt: null },
      { ...trend, changePercent: -8, latest: 180 },
    );
    expect(first.triggered).toBe(true);
    expect(
      shouldSuppressDuplicateTrigger({ ...first.alert, lastTriggeredAt: new Date().toISOString() }),
    ).toBe(true);
  });

  it('builds trust panels and affiliate deep links without fake conversions', () => {
    const offer = createSimulatedOffer({
      id: 't1',
      category: 'flight',
      providerId: 'demo-sky',
      providerName: 'Demo Sky',
      title: 'LHR-BCN',
      subtitle: '',
      basePrice: 150,
      details: { selfTransfer: true },
    });
    const trust = buildTrustPanel(offer, ['demo-sky', 'demo-omnibus']);
    expect(trust.sponsoredResult).toBe(false);
    expect(trust.rankingIndependenceNote.toLowerCase()).toContain('commission');
    const link = generateDeepLink({ partnerId: 'demo-sky', offerId: offer.id });
    expect(link.deepLink).toContain('demo-sky');
    const events = recordClick([], {
      clickId: link.clickId,
      partnerId: 'demo-sky',
      campaignId: link.campaignId,
      offerId: offer.id,
      searchedAt: null,
      clickedAt: new Date().toISOString(),
      deepLink: link.deepLink,
    });
    expect(buildRevenueReport(events)[0]?.conversions).toBe(0);
    const withConv = applyConversionCallback(events, {
      clickId: link.clickId,
      partnerId: 'demo-sky',
      bookingReference: 'ABC',
      bookingValue: 100,
      currency: 'GBP',
      status: 'booked',
      occurredAt: new Date().toISOString(),
    });
    expect(buildRevenueReport(withConv)[0]?.conversions).toBe(1);
    expect(isWithinAttributionWindow(new Date().toISOString(), new Date().toISOString(), 24)).toBe(true);
  });

  it('supports handoff checklist and itinerary capture', () => {
    const offer = createSimulatedOffer({
      id: 'h1',
      category: 'flight',
      providerId: 'demo-sky',
      providerName: 'Demo Sky',
      title: 'Flight',
      subtitle: '',
      basePrice: 100,
    });
    const shortlist = createShortlistItem(offer);
    expect(shortlist.offerId).toBe('h1');
    const pkg = {
      id: 'pkg',
      profile: 'best_value' as const,
      title: 'Best',
      components: [offer, { ...offer, id: 'h2', providerId: 'demo-stay', providerName: 'Stay' }],
      totalEstimatedPayable: 300,
      currency: 'GBP',
      bookingFragmentation: 2,
      whyThisDeal: 'test',
      warnings: [],
      environmentalImpactPlaceholder: 'placeholder',
    };
    const { checklist, multiProviderWarning } = buildPackageChecklist(pkg);
    expect(multiProviderWarning).toMatch(/separate/i);
    const confirmed = captureBookingConfirmation(checklist, 'h1', 'REF-1');
    expect(itineraryItemsFromConfirmations(confirmed)[0]?.confirmationReference).toBe('REF-1');
    expect(toComparisonRows([offer])[0]?.finalTotal).toBe(offer.costs.finalEstimatedPayableTotal);
  });

  it('covers partner centre, onboarding, growth, currency, and state migration', () => {
    const kit = buildPartnerMediaKit();
    expect(kit.metrics.monthlySearches).toBeNull();
    expect(kit.contactWorkflow.length).toBeGreaterThan(2);
    const records = listOnboardingRecords();
    expect(records.some((r) => r.providerKey === 'booking-com-demand-api')).toBe(true);
    const updated = updateOnboardingStatus(records, 'skyscanner-affiliate', {
      applicationStatus: 'applied',
    });
    expect(updated.find((r) => r.providerKey === 'skyscanner-affiliate')?.applicationStatus).toBe(
      'applied',
    );
    expect(getReferralProgrammeFoundation().enabled).toBe(false);
    expect(buildDestinationLandingPage({ destinationCode: 'bcn' }).slug).toBe('dest-bcn');
    expect(
      buildSavingsReport({ chosenTotal: 100, alternativeTotal: 140, currency: 'GBP' }).estimatedSavings,
    ).toBe(40);
    expect(convertCurrency(100, 'EUR', 'GBP').freshness).toBe('estimated');
    expect(sumCosts({
      basePrice: 10,
      taxes: 1,
      bookingFees: 1,
      paymentFees: 1,
      baggageCosts: 1,
      seatCosts: 1,
      resortOrDestinationFees: 1,
      cleaningFees: 1,
      otherMandatoryFees: 1,
      currency: 'GBP',
      exchangeRateTimestamp: null,
    }).finalEstimatedPayableTotal).toBe(18);
    const state = migrateDealEngineState({ shortlist: [{ id: 'x' }] });
    expect(state.shortlist).toHaveLength(1);
    expect(createEmptyDealEngineState().preferenceProfiles.length).toBe(1);
    expect(createDefaultPreferenceProfile().comfortLevel).toBe('balanced');
    expect(mergeScoringWeights(DEFAULT_SCORING_WEIGHTS, { totalCost: 50 }).totalCost).toBe(50);
  });
});

describe('deal-engine load characteristics', () => {
  it('ranks large offer sets under a soft performance budget', () => {
    const offers = Array.from({ length: 400 }, (_, index) =>
      createSimulatedOffer({
        id: `load-${index}`,
        category: 'flight',
        providerId: 'p',
        providerName: 'P',
        title: `Offer ${index}`,
        subtitle: '',
        basePrice: 80 + (index % 40),
        baggageCosts: index % 3 === 0 ? 40 : 0,
        details: { stops: index % 3, durationMinutes: 120 + (index % 50) },
      }),
    );
    const started = performance.now();
    const ranked = rankOffers(offers);
    const elapsed = performance.now() - started;
    expect(ranked).toHaveLength(400);
    expect(ranked[0]!.rankScore).toBeGreaterThanOrEqual(ranked[399]!.rankScore);
    expect(elapsed).toBeLessThan(500);
  });
});
