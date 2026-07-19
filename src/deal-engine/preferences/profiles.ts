export type ComfortLevel = 'budget' | 'balanced' | 'comfort' | 'premium';
export type RiskTolerance = 'low' | 'medium' | 'high';

export interface TravellerPreferenceProfile {
  id: string;
  name: string;
  budgetMax: number | null;
  comfortLevel: ComfortLevel;
  preferredAirlines: string[];
  excludedAirlines: string[];
  hotelStandardMin: number; // 1–5
  loyaltyMemberships: string[];
  baggageIncludedPreferred: boolean;
  seatPreference: string;
  dietaryRequirements: string[];
  accessibilityNeeds: string[];
  maxStops: number | null;
  maxWalkingDistanceMeters: number | null;
  preferredBookingProviders: string[];
  riskTolerance: RiskTolerance;
  refundabilityPreference: 'refundable' | 'any';
  createdAt: string;
  updatedAt: string;
}

export function createDefaultPreferenceProfile(
  overrides?: Partial<TravellerPreferenceProfile>,
): TravellerPreferenceProfile {
  const now = new Date().toISOString();
  return {
    id: overrides?.id ?? `pref-${now}`,
    name: overrides?.name ?? 'Default traveller',
    budgetMax: overrides?.budgetMax ?? null,
    comfortLevel: overrides?.comfortLevel ?? 'balanced',
    preferredAirlines: overrides?.preferredAirlines ?? [],
    excludedAirlines: overrides?.excludedAirlines ?? [],
    hotelStandardMin: overrides?.hotelStandardMin ?? 3,
    loyaltyMemberships: overrides?.loyaltyMemberships ?? [],
    baggageIncludedPreferred: overrides?.baggageIncludedPreferred ?? true,
    seatPreference: overrides?.seatPreference ?? 'any',
    dietaryRequirements: overrides?.dietaryRequirements ?? [],
    accessibilityNeeds: overrides?.accessibilityNeeds ?? [],
    maxStops: overrides?.maxStops ?? 1,
    maxWalkingDistanceMeters: overrides?.maxWalkingDistanceMeters ?? 800,
    preferredBookingProviders: overrides?.preferredBookingProviders ?? [],
    riskTolerance: overrides?.riskTolerance ?? 'medium',
    refundabilityPreference: overrides?.refundabilityPreference ?? 'any',
    createdAt: overrides?.createdAt ?? now,
    updatedAt: overrides?.updatedAt ?? now,
  };
}

export function applyPreferenceOverrides(
  profile: TravellerPreferenceProfile,
  overrides: Partial<TravellerPreferenceProfile>,
): TravellerPreferenceProfile {
  return {
    ...profile,
    ...overrides,
    id: profile.id,
    createdAt: profile.createdAt,
    updatedAt: new Date().toISOString(),
  };
}
