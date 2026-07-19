/**
 * Slice 86 — OTA/supplier onboarding framework.
 * Documentation + status tracking only. No scraping / no bypass of access restrictions.
 */

export type ApplicationStatus =
  | 'not_started'
  | 'researching'
  | 'applied'
  | 'sandbox_access'
  | 'approved'
  | 'blocked'
  | 'rejected';

export type CredentialsStatus = 'none' | 'requested' | 'sandbox' | 'production' | 'revoked';

export interface ProviderOnboardingRecord {
  providerKey: string;
  displayName: string;
  programme: string;
  eligibility: string;
  applicationStatus: ApplicationStatus;
  credentialsStatus: CredentialsStatus;
  sandboxAvailable: boolean | null;
  supportedInventory: string[];
  commercialTerms: string;
  attributionRequirements: string;
  brandingRequirements: string;
  technicalBlockers: string[];
  complianceNotes: string;
  docsUrl: string | null;
}

export const PROVIDER_ONBOARDING_CATALOG: ProviderOnboardingRecord[] = [
  {
    providerKey: 'booking-com-demand-api',
    displayName: 'Booking.com Demand API',
    programme: 'Demand API / affiliate',
    eligibility: 'Requires approved commercial partnership; not available via scraping.',
    applicationStatus: 'not_started',
    credentialsStatus: 'none',
    sandboxAvailable: null,
    supportedInventory: ['accommodation'],
    commercialTerms: 'TBD after approval — do not invent rates.',
    attributionRequirements: 'Partner-specific click tracking and disclosure.',
    brandingRequirements: 'Follow Booking.com brand guidelines when approved.',
    technicalBlockers: ['No credentials', 'No approved partnership'],
    complianceNotes: 'Must not scrape Booking.com. Adapter only after sandbox access.',
    docsUrl: null,
  },
  {
    providerKey: 'expedia-rapid',
    displayName: 'Expedia Rapid',
    programme: 'Rapid API',
    eligibility: 'Partner application + contract.',
    applicationStatus: 'not_started',
    credentialsStatus: 'none',
    sandboxAvailable: null,
    supportedInventory: ['accommodation', 'car_hire', 'activity'],
    commercialTerms: 'TBD after approval.',
    attributionRequirements: 'Rapid affiliate / CID parameters when issued.',
    brandingRequirements: 'Expedia Group brand rules when live.',
    technicalBlockers: ['No credentials', 'No approved partnership'],
    complianceNotes: 'No unauthorised inventory access.',
    docsUrl: null,
  },
  {
    providerKey: 'skyscanner-affiliate',
    displayName: 'Skyscanner affiliate / partner products',
    programme: 'Affiliate + partner APIs',
    eligibility: 'Affiliate account / partner agreement.',
    applicationStatus: 'researching',
    credentialsStatus: 'none',
    sandboxAvailable: null,
    supportedInventory: ['flight', 'car_hire', 'hotel_redirects'],
    commercialTerms: 'TBD after approval.',
    attributionRequirements: 'Campaign / click IDs per programme docs.',
    brandingRequirements: 'Skyscanner brand usage only when permitted.',
    technicalBlockers: ['No credentials'],
    complianceNotes: 'Use official partner channels only.',
    docsUrl: null,
  },
  {
    providerKey: 'airline-direct',
    displayName: 'Airline direct programmes',
    programme: 'NDC / airline affiliate',
    eligibility: 'Per-airline commercial agreements.',
    applicationStatus: 'not_started',
    credentialsStatus: 'none',
    sandboxAvailable: null,
    supportedInventory: ['flight'],
    commercialTerms: 'Per airline.',
    attributionRequirements: 'Airline-specific.',
    brandingRequirements: 'Airline brand guidelines.',
    technicalBlockers: ['Fragmented programme access', 'No credentials'],
    complianceNotes: 'No GDS credential sharing in frontend.',
    docsUrl: null,
  },
  {
    providerKey: 'hotel-groups',
    displayName: 'Hotel groups',
    programme: 'Direct hotel APIs / affiliates',
    eligibility: 'Per group.',
    applicationStatus: 'not_started',
    credentialsStatus: 'none',
    sandboxAvailable: null,
    supportedInventory: ['accommodation'],
    commercialTerms: 'TBD.',
    attributionRequirements: 'Per group.',
    brandingRequirements: 'Per group.',
    technicalBlockers: ['No credentials'],
    complianceNotes: 'Official APIs only.',
    docsUrl: null,
  },
  {
    providerKey: 'car-hire',
    displayName: 'Car-hire providers',
    programme: 'Affiliate / API',
    eligibility: 'Provider application.',
    applicationStatus: 'not_started',
    credentialsStatus: 'none',
    sandboxAvailable: null,
    supportedInventory: ['car_hire'],
    commercialTerms: 'TBD.',
    attributionRequirements: 'Provider click params.',
    brandingRequirements: 'Provider brand rules.',
    technicalBlockers: ['No credentials'],
    complianceNotes: 'No scraping of OTA car results.',
    docsUrl: null,
  },
  {
    providerKey: 'activity-marketplaces',
    displayName: 'Activity marketplaces',
    programme: 'Affiliate / API',
    eligibility: 'Marketplace partner programme.',
    applicationStatus: 'not_started',
    credentialsStatus: 'none',
    sandboxAvailable: null,
    supportedInventory: ['activity'],
    commercialTerms: 'TBD.',
    attributionRequirements: 'Marketplace tags.',
    brandingRequirements: 'Marketplace brand rules.',
    technicalBlockers: ['No credentials'],
    complianceNotes: 'Official partner APIs only.',
    docsUrl: null,
  },
  {
    providerKey: 'insurance-affiliates',
    displayName: 'Insurance affiliates',
    programme: 'Affiliate',
    eligibility: 'Regulated distribution rules may apply.',
    applicationStatus: 'not_started',
    credentialsStatus: 'none',
    sandboxAvailable: null,
    supportedInventory: ['travel_insurance'],
    commercialTerms: 'TBD.',
    attributionRequirements: 'Affiliate IDs.',
    brandingRequirements: 'Insurer disclosure rules.',
    technicalBlockers: ['Regulatory review pending', 'No credentials'],
    complianceNotes: 'Quotes are demo placeholders until licensed distribution is approved.',
    docsUrl: null,
  },
  {
    providerKey: 'esim-partners',
    displayName: 'eSIM partners',
    programme: 'Affiliate / API',
    eligibility: 'Partner application.',
    applicationStatus: 'not_started',
    credentialsStatus: 'none',
    sandboxAvailable: null,
    supportedInventory: ['esim'],
    commercialTerms: 'TBD.',
    attributionRequirements: 'Partner click IDs.',
    brandingRequirements: 'Partner brand rules.',
    technicalBlockers: ['No credentials'],
    complianceNotes: 'Official partner channels only.',
    docsUrl: null,
  },
];

export function listOnboardingRecords(): ProviderOnboardingRecord[] {
  return PROVIDER_ONBOARDING_CATALOG.map((record) => ({ ...record }));
}

export function updateOnboardingStatus(
  records: ProviderOnboardingRecord[],
  providerKey: string,
  patch: Partial<Pick<ProviderOnboardingRecord, 'applicationStatus' | 'credentialsStatus' | 'technicalBlockers'>>,
): ProviderOnboardingRecord[] {
  return records.map((record) =>
    record.providerKey === providerKey
      ? {
          ...record,
          ...patch,
          technicalBlockers: patch.technicalBlockers ?? record.technicalBlockers,
        }
      : record,
  );
}
