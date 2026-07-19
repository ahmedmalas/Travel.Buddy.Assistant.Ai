/**
 * Slice 74 — Universal offer model.
 * Ranking must use final estimated payable total, never headline price alone.
 */

export type InventoryCategory =
  | 'flight'
  | 'accommodation'
  | 'car_hire'
  | 'airport_transfer'
  | 'train'
  | 'bus'
  | 'ferry'
  | 'activity'
  | 'travel_insurance'
  | 'esim'
  | 'airport_parking';

export type PriceFreshness = 'live' | 'cached' | 'estimated' | 'simulated';
export type AvailabilityStatus = 'available' | 'limited' | 'unavailable' | 'unknown';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type Refundability = 'refundable' | 'partially_refundable' | 'non_refundable' | 'unknown';

export interface MoneyAmount {
  amount: number;
  currency: string;
}

export interface CostBreakdown {
  basePrice: number;
  taxes: number;
  bookingFees: number;
  paymentFees: number;
  baggageCosts: number;
  seatCosts: number;
  resortOrDestinationFees: number;
  cleaningFees: number;
  otherMandatoryFees: number;
  currency: string;
  exchangeRateTimestamp: string | null;
  /** Sum of all components above — never rank on basePrice alone. */
  finalEstimatedPayableTotal: number;
}

export interface CancellationTerms {
  refundability: Refundability;
  freeCancellationUntil: string | null;
  notes: string;
}

export interface AffiliateMeta {
  partnerId: string;
  campaignId: string | null;
  clickId: string | null;
  attributionWindowHours: number;
  commissionMetadata: {
    model: 'cpc' | 'cpa' | 'revshare' | 'none';
    estimatedRateBps: number | null;
    notes: string;
  };
  disclosureText: string;
  isSponsored: boolean;
}

export interface LegalAttribution {
  providerDisplayName: string;
  dataSource: string;
  termsUrl: string | null;
  privacyUrl: string | null;
  brandUsageNotes: string;
}

export interface UniversalOffer {
  id: string;
  category: InventoryCategory;
  providerId: string;
  providerName: string;
  title: string;
  subtitle: string;
  costs: CostBreakdown;
  availability: AvailabilityStatus;
  priceFreshness: PriceFreshness;
  priceTimestamp: string;
  confidence: ConfidenceLevel;
  cancellation: CancellationTerms;
  loyaltyBenefits: string[];
  includedExtras: string[];
  providerReputation: number; // 0–100
  deepLink: string;
  affiliate: AffiliateMeta;
  legal: LegalAttribution;
  warnings: string[];
  /** Category-specific payload (flight legs, stay nights, etc.). */
  details: Record<string, unknown>;
  searchedAt: string;
  providersSearched: string[];
}

export interface RankedOffer extends UniversalOffer {
  rankScore: number;
  rankReasons: string[];
  whyThisDeal: string;
  scoringBreakdown: Record<string, number>;
}

export interface ScoringWeights {
  totalCost: number;
  travelDuration: number;
  stops: number;
  departureTimes: number;
  arrivalTimes: number;
  selfTransferRisk: number;
  cancellationFlexibility: number;
  providerQuality: number;
  baggageInclusion: number;
  accommodationLocation: number;
  travellerPreferences: number;
  accessibility: number;
  bookingFragmentation: number;
  priceConfidence: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  totalCost: 30,
  travelDuration: 10,
  stops: 8,
  departureTimes: 5,
  arrivalTimes: 5,
  selfTransferRisk: 10,
  cancellationFlexibility: 8,
  providerQuality: 6,
  baggageInclusion: 5,
  accommodationLocation: 5,
  travellerPreferences: 4,
  accessibility: 2,
  bookingFragmentation: 1,
  priceConfidence: 1,
};

export type TripDealProfile =
  | 'cheapest_sensible'
  | 'best_value'
  | 'most_convenient'
  | 'most_flexible'
  | 'premium_value'
  | 'family_friendly'
  | 'lowest_risk'
  | 'lowest_environmental_impact';

export interface TripPackageDeal {
  id: string;
  profile: TripDealProfile;
  title: string;
  components: UniversalOffer[];
  totalEstimatedPayable: number;
  currency: string;
  bookingFragmentation: number;
  whyThisDeal: string;
  warnings: string[];
  environmentalImpactPlaceholder: string;
}
