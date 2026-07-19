import { generateDeepLink } from '../affiliate/attribution';
import type { TripPackageDeal, UniversalOffer } from '../types';

export interface ShortlistItem {
  id: string;
  offerId: string;
  title: string;
  total: number;
  currency: string;
  providerId: string;
  savedAt: string;
  notes: string;
}

export interface BookingChecklistStep {
  order: number;
  offerId: string;
  providerName: string;
  title: string;
  deepLink: string;
  disclosureText: string;
  status: 'pending' | 'opened' | 'confirmed';
  confirmationReference: string | null;
}

export interface ComparisonRow {
  offerId: string;
  title: string;
  providerName: string;
  finalTotal: number;
  currency: string;
  freshness: string;
  confidence: string;
  refundability: string;
  warnings: string[];
  whyThisDeal: string;
  sponsored: boolean;
}

export function toComparisonRows(
  offers: Array<UniversalOffer & { whyThisDeal?: string }>,
): ComparisonRow[] {
  return offers.map((offer) => ({
    offerId: offer.id,
    title: offer.title,
    providerName: offer.providerName,
    finalTotal: offer.costs.finalEstimatedPayableTotal,
    currency: offer.costs.currency,
    freshness: offer.priceFreshness,
    confidence: offer.confidence,
    refundability: offer.cancellation.refundability,
    warnings: offer.warnings,
    whyThisDeal: offer.whyThisDeal ?? 'Compare total payable and risk factors.',
    sponsored: offer.affiliate.isSponsored,
  }));
}

export function createShortlistItem(offer: UniversalOffer, notes = ''): ShortlistItem {
  return {
    id: `sl-${offer.id}`,
    offerId: offer.id,
    title: offer.title,
    total: offer.costs.finalEstimatedPayableTotal,
    currency: offer.costs.currency,
    providerId: offer.providerId,
    savedAt: new Date().toISOString(),
    notes,
  };
}

export function buildBookingChecklist(components: UniversalOffer[]): BookingChecklistStep[] {
  return components.map((offer, index) => {
    const link = generateDeepLink({ partnerId: offer.providerId, offerId: offer.id });
    return {
      order: index + 1,
      offerId: offer.id,
      providerName: offer.providerName,
      title: offer.title,
      deepLink: link.deepLink,
      disclosureText: link.disclosureText,
      status: 'pending',
      confirmationReference: null,
    };
  });
}

export function buildPackageChecklist(pkg: TripPackageDeal): {
  checklist: BookingChecklistStep[];
  multiProviderWarning: string | null;
} {
  const checklist = buildBookingChecklist(pkg.components);
  const multiProviderWarning =
    pkg.bookingFragmentation > 1
      ? `This deal requires ${pkg.bookingFragmentation} separate provider bookings. Travel Buddy does not process payments.`
      : null;
  return { checklist, multiProviderWarning };
}

export function markChecklistOpened(
  steps: BookingChecklistStep[],
  offerId: string,
): BookingChecklistStep[] {
  return steps.map((step) =>
    step.offerId === offerId && step.status === 'pending' ? { ...step, status: 'opened' } : step,
  );
}

export function captureBookingConfirmation(
  steps: BookingChecklistStep[],
  offerId: string,
  confirmationReference: string,
): BookingChecklistStep[] {
  return steps.map((step) =>
    step.offerId === offerId
      ? { ...step, status: 'confirmed', confirmationReference: confirmationReference.trim() }
      : step,
  );
}

export function itineraryItemsFromConfirmations(steps: BookingChecklistStep[]): Array<{
  title: string;
  providerName: string;
  confirmationReference: string;
  source: 'deal-engine-handoff';
}> {
  return steps
    .filter((step) => step.status === 'confirmed' && step.confirmationReference)
    .map((step) => ({
      title: step.title,
      providerName: step.providerName,
      confirmationReference: step.confirmationReference!,
      source: 'deal-engine-handoff' as const,
    }));
}

export function shareDealPayload(input: {
  dealId: string;
  title: string;
  total: number;
  currency: string;
}): { path: string; text: string } {
  const path = `/share/deal/${encodeURIComponent(input.dealId)}`;
  return {
    path,
    text: `${input.title} — estimated total ${input.currency} ${input.total.toFixed(2)} (demo comparison; not a global cheapest claim).`,
  };
}
