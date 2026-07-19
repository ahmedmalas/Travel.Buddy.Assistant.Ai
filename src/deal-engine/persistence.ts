import { createEmptyDealEngineState, migrateDealEngineState, type DealEngineState } from './state';

export const DEAL_ENGINE_STORAGE_KEY = 'travel-buddy:deal-engine:v1';

export function loadDealEngineState(): DealEngineState {
  try {
    const raw = window.localStorage.getItem(DEAL_ENGINE_STORAGE_KEY);
    if (!raw) return createEmptyDealEngineState();
    return migrateDealEngineState(JSON.parse(raw));
  } catch {
    return createEmptyDealEngineState();
  }
}

export function persistDealEngineState(state: DealEngineState): void {
  try {
    window.localStorage.setItem(DEAL_ENGINE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota failures leave in-memory state intact.
  }
}
