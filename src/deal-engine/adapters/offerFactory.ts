import type {
  AffiliateMeta,
  CostBreakdown,
  InventoryCategory,
  LegalAttribution,
  PriceFreshness,
  UniversalOffer,
} from '../types';

export function sumCosts(partial: Omit<CostBreakdown, 'finalEstimatedPayableTotal'>): CostBreakdown {
  const finalEstimatedPayableTotal =
    partial.basePrice +
    partial.taxes +
    partial.bookingFees +
    partial.paymentFees +
    partial.baggageCosts +
    partial.seatCosts +
    partial.resortOrDestinationFees +
    partial.cleaningFees +
    partial.otherMandatoryFees;
  return { ...partial, finalEstimatedPayableTotal };
}

export function createSimulatedOffer(input: {
  id: string;
  category: InventoryCategory;
  providerId: string;
  providerName: string;
  title: string;
  subtitle: string;
  basePrice: number;
  taxes?: number;
  bookingFees?: number;
  paymentFees?: number;
  baggageCosts?: number;
  seatCosts?: number;
  resortOrDestinationFees?: number;
  cleaningFees?: number;
  otherMandatoryFees?: number;
  currency?: string;
  priceFreshness?: PriceFreshness;
  confidence?: UniversalOffer['confidence'];
  refundability?: UniversalOffer['cancellation']['refundability'];
  loyaltyBenefits?: string[];
  includedExtras?: string[];
  providerReputation?: number;
  warnings?: string[];
  details?: Record<string, unknown>;
  providersSearched?: string[];
  affiliate?: AffiliateMeta;
  legal?: LegalAttribution;
  deepLink?: string;
  now?: string;
}): UniversalOffer {
  const now = input.now ?? new Date().toISOString();
  const currency = input.currency ?? 'GBP';
  const costs = sumCosts({
    basePrice: input.basePrice,
    taxes: input.taxes ?? Math.round(input.basePrice * 0.12),
    bookingFees: input.bookingFees ?? 0,
    paymentFees: input.paymentFees ?? 0,
    baggageCosts: input.baggageCosts ?? 0,
    seatCosts: input.seatCosts ?? 0,
    resortOrDestinationFees: input.resortOrDestinationFees ?? 0,
    cleaningFees: input.cleaningFees ?? 0,
    otherMandatoryFees: input.otherMandatoryFees ?? 0,
    currency,
    exchangeRateTimestamp: now,
  });

  const affiliate: AffiliateMeta = input.affiliate ?? {
    partnerId: input.providerId,
    campaignId: 'demo-campaign',
    clickId: null,
    attributionWindowHours: 24 * 30,
    commissionMetadata: {
      model: 'none',
      estimatedRateBps: null,
      notes: 'Simulated demo adapter — no live partnership.',
    },
    disclosureText:
      'Demo affiliate disclosure: Travel Buddy may earn a commission if you book via a partner link. Ranking is independent of commission.',
    isSponsored: false,
  };

  const legal: LegalAttribution = input.legal ?? {
    providerDisplayName: input.providerName,
    dataSource: 'simulated-demo-catalog',
    termsUrl: null,
    privacyUrl: null,
    brandUsageNotes: 'Demo only — not an approved live partnership.',
  };

  return {
    id: input.id,
    category: input.category,
    providerId: input.providerId,
    providerName: input.providerName,
    title: input.title,
    subtitle: input.subtitle,
    costs,
    availability: 'available',
    priceFreshness: input.priceFreshness ?? 'simulated',
    priceTimestamp: now,
    confidence: input.confidence ?? 'medium',
    cancellation: {
      refundability: input.refundability ?? 'partially_refundable',
      freeCancellationUntil: null,
      notes: 'Simulated cancellation terms for demo ranking.',
    },
    loyaltyBenefits: input.loyaltyBenefits ?? [],
    includedExtras: input.includedExtras ?? [],
    providerReputation: input.providerReputation ?? 72,
    deepLink: input.deepLink ?? `https://demo.travelbuddy.local/book/${input.providerId}/${input.id}`,
    affiliate,
    legal,
    warnings: input.warnings ?? [],
    details: input.details ?? {},
    searchedAt: now,
    providersSearched: input.providersSearched ?? [input.providerId],
  };
}
