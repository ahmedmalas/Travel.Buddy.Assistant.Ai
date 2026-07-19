/**
 * Slice 87 — Growth and recommendation foundations.
 * Do not fabricate savings, testimonials, traffic, or partner endorsements.
 */

export interface DestinationLandingPage {
  slug: string;
  destinationCode: string;
  title: string;
  summary: string;
  liveDealPagePath: string;
  partnerBranded: boolean;
  partnerId: string | null;
}

export interface ReferralProgrammeFoundation {
  enabled: boolean;
  codePrefix: string;
  notes: string;
}

export interface SavingsReport {
  generatedAt: string;
  comparedAgainst: string;
  estimatedSavings: number | null;
  currency: string;
  methodology: string;
  fabricated: false;
}

export interface DemandInsight {
  routeOrDestination: string;
  searches: number | null;
  note: string;
}

export function buildDestinationLandingPage(input: {
  destinationCode: string;
  partnerId?: string | null;
}): DestinationLandingPage {
  const code = input.destinationCode.toUpperCase();
  return {
    slug: `dest-${code.toLowerCase()}`,
    destinationCode: code,
    title: `${code} trip deals`,
    summary:
      'Provider-neutral comparison of simulated complete-trip cost. Live partner inventory appears only after approval.',
    liveDealPagePath: `/deals/${code.toLowerCase()}`,
    partnerBranded: Boolean(input.partnerId),
    partnerId: input.partnerId ?? null,
  };
}

export function getReferralProgrammeFoundation(): ReferralProgrammeFoundation {
  return {
    enabled: false,
    codePrefix: 'TBREF',
    notes: 'Foundation only — referral rewards not active until compliance/finance approval.',
  };
}

export function buildSavingsReport(input: {
  chosenTotal: number;
  alternativeTotal: number;
  currency: string;
}): SavingsReport {
  const estimatedSavings =
    input.alternativeTotal > input.chosenTotal
      ? Math.round((input.alternativeTotal - input.chosenTotal) * 100) / 100
      : null;
  return {
    generatedAt: new Date().toISOString(),
    comparedAgainst: 'User-selected alternative package in-session',
    estimatedSavings,
    currency: input.currency,
    methodology:
      'Savings equal alternative package total minus chosen package total using the same fee-inclusive model. Null when not cheaper.',
    fabricated: false,
  };
}

export function listAnonymousDemandInsights(observed?: DemandInsight[]): DemandInsight[] {
  if (observed?.length) return observed;
  return [
    {
      routeOrDestination: '(no live telemetry)',
      searches: null,
      note: 'Aggregated demand insights remain empty until production search telemetry exists.',
    },
  ];
}

export function shareableLiveDealPath(dealId: string): string {
  return `/share/deal/${encodeURIComponent(dealId)}`;
}
