import {
  createDefaultPreferenceProfile,
  type TravellerPreferenceProfile,
} from './preferences/profiles';
import type { PriceAlert, PriceSnapshot } from './alerts/priceHistory';
import type { AttributionEvent } from './affiliate/attribution';
import type { ScoringWeights } from './types';
import { DEFAULT_SCORING_WEIGHTS } from './types';
import type { BookingChecklistStep, ShortlistItem } from './handoff/bookingHandoff';
import type { ProviderOnboardingRecord } from './partners/onboarding';
import { listOnboardingRecords } from './partners/onboarding';

export interface DealEngineState {
  preferenceProfiles: TravellerPreferenceProfile[];
  activePreferenceProfileId: string | null;
  scoringWeights: ScoringWeights;
  shortlist: ShortlistItem[];
  priceAlerts: PriceAlert[];
  priceSnapshots: PriceSnapshot[];
  attributionEvents: AttributionEvent[];
  bookingChecklist: BookingChecklistStep[];
  onboardingRecords: ProviderOnboardingRecord[];
  lastSearchMeta: {
    providersSearched: string[];
    searchedAt: string | null;
    durationMs: number | null;
    partial: boolean;
  };
}

export function createEmptyDealEngineState(): DealEngineState {
  const defaultProfile = createDefaultPreferenceProfile({ id: 'pref-default', name: 'Default traveller' });
  return {
    preferenceProfiles: [defaultProfile],
    activePreferenceProfileId: defaultProfile.id,
    scoringWeights: { ...DEFAULT_SCORING_WEIGHTS },
    shortlist: [],
    priceAlerts: [],
    priceSnapshots: [],
    attributionEvents: [],
    bookingChecklist: [],
    onboardingRecords: listOnboardingRecords(),
    lastSearchMeta: {
      providersSearched: [],
      searchedAt: null,
      durationMs: null,
      partial: false,
    },
  };
}

export function migrateDealEngineState(raw: unknown): DealEngineState {
  const empty = createEmptyDealEngineState();
  if (!raw || typeof raw !== 'object') return empty;
  const value = raw as Partial<DealEngineState>;
  return {
    preferenceProfiles: Array.isArray(value.preferenceProfiles)
      ? value.preferenceProfiles
      : empty.preferenceProfiles,
    activePreferenceProfileId:
      typeof value.activePreferenceProfileId === 'string'
        ? value.activePreferenceProfileId
        : empty.activePreferenceProfileId,
    scoringWeights: { ...DEFAULT_SCORING_WEIGHTS, ...(value.scoringWeights ?? {}) },
    shortlist: Array.isArray(value.shortlist) ? value.shortlist : [],
    priceAlerts: Array.isArray(value.priceAlerts) ? value.priceAlerts : [],
    priceSnapshots: Array.isArray(value.priceSnapshots) ? value.priceSnapshots : [],
    attributionEvents: Array.isArray(value.attributionEvents) ? value.attributionEvents : [],
    bookingChecklist: Array.isArray(value.bookingChecklist) ? value.bookingChecklist : [],
    onboardingRecords: Array.isArray(value.onboardingRecords)
      ? value.onboardingRecords
      : empty.onboardingRecords,
    lastSearchMeta: {
      providersSearched: value.lastSearchMeta?.providersSearched ?? [],
      searchedAt: value.lastSearchMeta?.searchedAt ?? null,
      durationMs: value.lastSearchMeta?.durationMs ?? null,
      partial: Boolean(value.lastSearchMeta?.partial),
    },
  };
}
