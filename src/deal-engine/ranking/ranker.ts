import {
  DEFAULT_SCORING_WEIGHTS,
  type RankedOffer,
  type ScoringWeights,
  type UniversalOffer,
} from '../types';
import type { TravellerPreferenceProfile } from '../preferences/profiles';

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeWeights(weights: ScoringWeights): ScoringWeights {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
  const scale = 100 / total;
  return {
    totalCost: weights.totalCost * scale,
    travelDuration: weights.travelDuration * scale,
    stops: weights.stops * scale,
    departureTimes: weights.departureTimes * scale,
    arrivalTimes: weights.arrivalTimes * scale,
    selfTransferRisk: weights.selfTransferRisk * scale,
    cancellationFlexibility: weights.cancellationFlexibility * scale,
    providerQuality: weights.providerQuality * scale,
    baggageInclusion: weights.baggageInclusion * scale,
    accommodationLocation: weights.accommodationLocation * scale,
    travellerPreferences: weights.travellerPreferences * scale,
    accessibility: weights.accessibility * scale,
    bookingFragmentation: weights.bookingFragmentation * scale,
    priceConfidence: weights.priceConfidence * scale,
  };
}

function scoreOffer(
  offer: UniversalOffer,
  weights: ScoringWeights,
  prefs?: TravellerPreferenceProfile | null,
  peerMaxCost?: number,
): { score: number; breakdown: Record<string, number>; reasons: string[] } {
  const w = normalizeWeights(weights);
  const cost = offer.costs.finalEstimatedPayableTotal;
  const maxCost = peerMaxCost && peerMaxCost > 0 ? peerMaxCost : cost;
  const costScore = clamp(100 - (cost / maxCost) * 100);

  const stops = Number(offer.details.stops ?? 0);
  const duration = Number(offer.details.durationMinutes ?? 180);
  const selfTransfer = Boolean(offer.details.selfTransfer);
  const locationScore = Number(offer.details.locationScore ?? 70);
  const accessible = Boolean(offer.details.accessibility ?? prefs?.accessibilityNeeds.length);

  const durationScore = clamp(100 - duration / 12);
  const stopsScore = clamp(100 - stops * 28);
  const departureScore = 70; // placeholder — no live schedule preference engine yet
  const arrivalScore = 70;
  const selfTransferScore = selfTransfer ? 20 : 95;
  const cancelScore =
    offer.cancellation.refundability === 'refundable'
      ? 100
      : offer.cancellation.refundability === 'partially_refundable'
        ? 65
        : offer.cancellation.refundability === 'non_refundable'
          ? 25
          : 50;
  const providerScore = clamp(offer.providerReputation);
  const baggageScore = offer.costs.baggageCosts === 0 || offer.includedExtras.some((x) => /bag/i.test(x))
    ? 90
    : 45;
  const locationComponent = offer.category === 'accommodation' ? locationScore : 70;
  const preferenceScore = scorePreferences(offer, prefs);
  const accessibilityScore = prefs?.accessibilityNeeds.length
    ? accessible
      ? 95
      : 30
    : 70;
  const fragmentationScore = offer.details.splitStayCandidate || offer.details.mixedAirlines ? 40 : 85;
  const confidenceScore =
    offer.confidence === 'high' ? 95 : offer.confidence === 'medium' ? 70 : 40;

  // Commission / sponsored status MUST NOT contribute to score.
  void offer.affiliate.isSponsored;
  void offer.affiliate.commissionMetadata;

  const breakdown: Record<string, number> = {
    totalCost: costScore * (w.totalCost / 100),
    travelDuration: durationScore * (w.travelDuration / 100),
    stops: stopsScore * (w.stops / 100),
    departureTimes: departureScore * (w.departureTimes / 100),
    arrivalTimes: arrivalScore * (w.arrivalTimes / 100),
    selfTransferRisk: selfTransferScore * (w.selfTransferRisk / 100),
    cancellationFlexibility: cancelScore * (w.cancellationFlexibility / 100),
    providerQuality: providerScore * (w.providerQuality / 100),
    baggageInclusion: baggageScore * (w.baggageInclusion / 100),
    accommodationLocation: locationComponent * (w.accommodationLocation / 100),
    travellerPreferences: preferenceScore * (w.travellerPreferences / 100),
    accessibility: accessibilityScore * (w.accessibility / 100),
    bookingFragmentation: fragmentationScore * (w.bookingFragmentation / 100),
    priceConfidence: confidenceScore * (w.priceConfidence / 100),
  };

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const reasons = buildReasons(offer, {
    costScore,
    stopsScore,
    selfTransferScore,
    cancelScore,
    baggageScore,
    locationComponent,
    preferenceScore,
  });

  return { score: Math.round(score * 100) / 100, breakdown, reasons };
}

function scorePreferences(offer: UniversalOffer, prefs?: TravellerPreferenceProfile | null): number {
  if (!prefs) return 70;
  let score = 70;
  if (prefs.maxStops != null && Number(offer.details.stops ?? 0) > prefs.maxStops) score -= 25;
  if (prefs.refundabilityPreference === 'refundable' && offer.cancellation.refundability !== 'refundable') {
    score -= 20;
  }
  if (prefs.preferredAirlines.length) {
    const airlines = (offer.details.airlines as string[] | undefined) ?? [];
    if (airlines.some((airline) => prefs.preferredAirlines.includes(airline))) score += 15;
  }
  if (prefs.excludedAirlines.length) {
    const airlines = (offer.details.airlines as string[] | undefined) ?? [];
    if (airlines.some((airline) => prefs.excludedAirlines.includes(airline))) score -= 40;
  }
  if (prefs.baggageIncludedPreferred && offer.costs.baggageCosts > 0) score -= 10;
  if (prefs.budgetMax != null && offer.costs.finalEstimatedPayableTotal > prefs.budgetMax) score -= 30;
  return clamp(score);
}

function buildReasons(
  offer: UniversalOffer,
  scores: {
    costScore: number;
    stopsScore: number;
    selfTransferScore: number;
    cancelScore: number;
    baggageScore: number;
    locationComponent: number;
    preferenceScore: number;
  },
): string[] {
  const reasons: string[] = [];
  reasons.push(
    `Total estimated payable ${offer.costs.currency} ${offer.costs.finalEstimatedPayableTotal.toFixed(2)} (not headline base ${offer.costs.basePrice.toFixed(2)}).`,
  );
  if (scores.costScore >= 75) reasons.push('Strong total-cost position among compared offers.');
  if (scores.stopsScore >= 80) reasons.push('Fewer stops / simpler journey.');
  if (scores.selfTransferScore < 50) reasons.push('Penalised for self-transfer risk.');
  if (scores.cancelScore >= 80) reasons.push('Flexible cancellation terms.');
  if (scores.baggageScore >= 80) reasons.push('Baggage-inclusive or low baggage add-on cost.');
  if (offer.category === 'accommodation' && scores.locationComponent >= 80) {
    reasons.push('Strong accommodation location score.');
  }
  if (scores.preferenceScore >= 80) reasons.push('Aligns with saved traveller preferences.');
  if (offer.affiliate.isSponsored) {
    reasons.push('Sponsored label shown — commission did not affect rank score.');
  }
  reasons.push(`Price freshness: ${offer.priceFreshness}; confidence: ${offer.confidence}.`);
  return reasons;
}

/**
 * Deterministic ranking: stable sort by score desc, then payable total asc, then id.
 * Commission never influences score.
 */
export function rankOffers(
  offers: UniversalOffer[],
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  prefs?: TravellerPreferenceProfile | null,
): RankedOffer[] {
  const maxCost = Math.max(...offers.map((o) => o.costs.finalEstimatedPayableTotal), 1);
  const scored = offers.map((offer) => {
    const { score, breakdown, reasons } = scoreOffer(offer, weights, prefs, maxCost);
    return {
      ...offer,
      rankScore: score,
      rankReasons: reasons,
      whyThisDeal: reasons.slice(0, 3).join(' '),
      scoringBreakdown: breakdown,
    } satisfies RankedOffer;
  });

  return scored.sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    if (a.costs.finalEstimatedPayableTotal !== b.costs.finalEstimatedPayableTotal) {
      return a.costs.finalEstimatedPayableTotal - b.costs.finalEstimatedPayableTotal;
    }
    return a.id.localeCompare(b.id);
  });
}

export function mergeScoringWeights(
  base: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  overrides?: Partial<ScoringWeights>,
): ScoringWeights {
  return { ...base, ...overrides };
}
