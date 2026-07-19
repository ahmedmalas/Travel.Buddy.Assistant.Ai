import type { UniversalOffer } from '../types';

export interface TrustPanel {
  providersSearched: string[];
  lastChecked: string;
  availabilityConfidence: UniversalOffer['confidence'];
  priceComposition: {
    basePrice: number;
    taxes: number;
    bookingFees: number;
    paymentFees: number;
    baggageCosts: number;
    seatCosts: number;
    resortOrDestinationFees: number;
    cleaningFees: number;
    otherMandatoryFees: number;
    finalEstimatedPayableTotal: number;
    currency: string;
  };
  potentialExtraFees: string[];
  selfTransferRisk: 'none' | 'possible' | 'likely';
  cancellationRestrictions: string;
  affiliateRelationship: string;
  sponsoredResult: boolean;
  dataSource: string;
  redirectDestination: string;
  priceFreshness: UniversalOffer['priceFreshness'];
  rankingIndependenceNote: string;
}

export function buildTrustPanel(offer: UniversalOffer, providersSearched?: string[]): TrustPanel {
  const selfTransfer = Boolean(offer.details.selfTransfer);
  const potentialExtraFees: string[] = [];
  if (offer.costs.baggageCosts === 0 && !offer.includedExtras.some((x) => /bag/i.test(x))) {
    potentialExtraFees.push('Checked baggage may not be included.');
  }
  if (offer.costs.seatCosts === 0) potentialExtraFees.push('Seat selection may cost extra at booking.');
  if (offer.costs.resortOrDestinationFees === 0 && offer.category === 'accommodation') {
    potentialExtraFees.push('Destination/resort fees may be collected at property.');
  }
  if (offer.costs.paymentFees === 0) potentialExtraFees.push('Some payment methods may add a fee.');

  return {
    providersSearched: providersSearched ?? offer.providersSearched,
    lastChecked: offer.priceTimestamp,
    availabilityConfidence: offer.confidence,
    priceComposition: {
      basePrice: offer.costs.basePrice,
      taxes: offer.costs.taxes,
      bookingFees: offer.costs.bookingFees,
      paymentFees: offer.costs.paymentFees,
      baggageCosts: offer.costs.baggageCosts,
      seatCosts: offer.costs.seatCosts,
      resortOrDestinationFees: offer.costs.resortOrDestinationFees,
      cleaningFees: offer.costs.cleaningFees,
      otherMandatoryFees: offer.costs.otherMandatoryFees,
      finalEstimatedPayableTotal: offer.costs.finalEstimatedPayableTotal,
      currency: offer.costs.currency,
    },
    potentialExtraFees,
    selfTransferRisk: selfTransfer ? 'likely' : offer.warnings.some((w) => /self-transfer/i.test(w))
      ? 'possible'
      : 'none',
    cancellationRestrictions: `${offer.cancellation.refundability}: ${offer.cancellation.notes}`,
    affiliateRelationship: offer.affiliate.disclosureText,
    sponsoredResult: offer.affiliate.isSponsored,
    dataSource: offer.legal.dataSource,
    redirectDestination: offer.deepLink,
    priceFreshness: offer.priceFreshness,
    rankingIndependenceNote:
      'Sponsored or commission-paying offers never receive hidden ranking advantages. Ranking uses total payable cost and traveller factors only.',
  };
}
