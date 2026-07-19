import {
  createAnalyticsState,
  loadAnalyticsState,
  persistAnalyticsState,
  type AnalyticsState,
} from './analytics';
import { createOfflineState, type OfflineState } from './offline';
import {
  loadFeatureFlags,
  persistFeatureFlags,
  type FeatureFlag,
} from './release';
import type { ImportReviewDraft } from './importEngine';
import type { TripHealthReport } from './tripHealth';

export const FINALISATION_STORAGE_KEY = 'travel-buddy:finalisation:v1';

export interface FinalisationState {
  offline: OfflineState;
  analytics: AnalyticsState;
  featureFlags: FeatureFlag[];
  importHistory: ImportReviewDraft[];
  lastTripHealth: TripHealthReport | null;
  pendingImportReview: ImportReviewDraft | null;
}

export function createEmptyFinalisationState(): FinalisationState {
  const network =
    typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'online';
  return {
    offline: createOfflineState(network),
    analytics: createAnalyticsState(),
    featureFlags: loadFeatureFlags(),
    importHistory: [],
    lastTripHealth: null,
    pendingImportReview: null,
  };
}

export function loadFinalisationState(): FinalisationState {
  try {
    const raw = window.localStorage.getItem(FINALISATION_STORAGE_KEY);
    const base = createEmptyFinalisationState();
    if (!raw) {
      return {
        ...base,
        analytics: loadAnalyticsState(),
        featureFlags: loadFeatureFlags(),
      };
    }
    const parsed = JSON.parse(raw) as Partial<FinalisationState>;
    return {
      offline: parsed.offline ?? base.offline,
      analytics: parsed.analytics ?? loadAnalyticsState(),
      featureFlags: Array.isArray(parsed.featureFlags) ? parsed.featureFlags : loadFeatureFlags(),
      importHistory: Array.isArray(parsed.importHistory) ? parsed.importHistory.slice(-50) : [],
      lastTripHealth: parsed.lastTripHealth ?? null,
      pendingImportReview: parsed.pendingImportReview ?? null,
    };
  } catch {
    return createEmptyFinalisationState();
  }
}

export function persistFinalisationState(state: FinalisationState): void {
  try {
    window.localStorage.setItem(FINALISATION_STORAGE_KEY, JSON.stringify(state));
    persistAnalyticsState(state.analytics);
    persistFeatureFlags(state.featureFlags);
  } catch {
    // ignore quota
  }
}
