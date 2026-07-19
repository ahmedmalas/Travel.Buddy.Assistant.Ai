/**
 * Slice 85 — OTA partner readiness centre.
 * Metrics are labelled as platform instrumentation placeholders — never fabricate endorsements.
 */

export interface PartnerCentreMetrics {
  monthlySearches: number | null;
  qualifiedRedirects: number | null;
  conversionRate: number | null;
  bookingValue: number | null;
  cancellationRate: number | null;
  deviceMix: { mobile: number | null; desktop: number | null; tablet: number | null };
  apiReliability: number | null;
  note: string;
}

export interface PartnerMediaKit {
  productOverview: string;
  consumerValueProposition: string;
  audienceProfile: string;
  geographicCoverage: string;
  securitySummary: string;
  technicalIntegrationOverview: string;
  metrics: PartnerCentreMetrics;
  contactWorkflow: string[];
}

export function getPartnerCentreMetrics(observed?: Partial<PartnerCentreMetrics>): PartnerCentreMetrics {
  return {
    monthlySearches: observed?.monthlySearches ?? null,
    qualifiedRedirects: observed?.qualifiedRedirects ?? null,
    conversionRate: observed?.conversionRate ?? null,
    bookingValue: observed?.bookingValue ?? null,
    cancellationRate: observed?.cancellationRate ?? null,
    deviceMix: {
      mobile: observed?.deviceMix?.mobile ?? null,
      desktop: observed?.deviceMix?.desktop ?? null,
      tablet: observed?.deviceMix?.tablet ?? null,
    },
    apiReliability: observed?.apiReliability ?? null,
    note:
      'Null metrics mean no live production telemetry yet. Do not publish as traffic/conversion claims.',
  };
}

export function buildPartnerMediaKit(metrics?: Partial<PartnerCentreMetrics>): PartnerMediaKit {
  return {
    productOverview:
      'Travel Buddy is a provider-neutral travel shopping engine that compares estimated total journey cost and hands travellers to approved booking partners.',
    consumerValueProposition:
      'Transparent totals (taxes/fees/bags), explainable ranking, trust panels, and multi-provider booking checklists — without claiming global cheapest.',
    audienceProfile:
      'Planners researching multi-component trips (flights, stays, ground, protect/connect) who value clarity over opaque headline fares.',
    geographicCoverage:
      'Demo catalog covers sample European and nearby international routes; live coverage depends on approved partner inventory.',
    securitySummary:
      'No private API credentials in the frontend. Local/demo mode default. Cloud optional via verified Supabase project. No payment processing in-app yet.',
    technicalIntegrationOverview:
      'Partners integrate via replaceable adapters (search, normalise, availability, deep link, attribution). Concurrent search with bounded timeouts; ranking independent of commission.',
    metrics: getPartnerCentreMetrics(metrics),
    contactWorkflow: [
      'Partner submits interest via Partner Centre contact form (local draft until CRM wired).',
      'Travel Buddy reviews eligibility, commercial terms, and compliance notes.',
      'Sandbox credentials issued only after approval — never scrape or bypass access controls.',
      'Adapter implemented behind registry; live flag enabled only with credentials + approval.',
      'Disclosure copy and attribution windows configured before public redirects.',
    ],
  };
}
