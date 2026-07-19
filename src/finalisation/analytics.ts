/**
 * Slice 95 — Privacy-respecting local analytics foundation (no external service).
 */

export type AnalyticsEventName =
  | 'search'
  | 'trip_saved'
  | 'import_completed'
  | 'backup_exported'
  | 'backup_imported'
  | 'feature_opened'
  | 'error'
  | 'perf_mark'
  | 'funnel_step';

export interface AnalyticsEvent {
  id: string;
  name: AnalyticsEventName;
  feature?: string;
  metadata?: Record<string, string | number | boolean | null>;
  at: string;
}

export interface AnalyticsState {
  enabled: boolean;
  events: AnalyticsEvent[];
  funnels: Record<string, number>;
}

export const ANALYTICS_STORAGE_KEY = 'travel-buddy:analytics:v1';
const MAX_EVENTS = 500;

export function createAnalyticsState(): AnalyticsState {
  return { enabled: true, events: [], funnels: {} };
}

export function loadAnalyticsState(): AnalyticsState {
  try {
    const raw = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return createAnalyticsState();
    const parsed = JSON.parse(raw) as Partial<AnalyticsState>;
    return {
      enabled: parsed.enabled !== false,
      events: Array.isArray(parsed.events) ? parsed.events.slice(-MAX_EVENTS) : [],
      funnels: parsed.funnels && typeof parsed.funnels === 'object' ? parsed.funnels : {},
    };
  } catch {
    return createAnalyticsState();
  }
}

export function persistAnalyticsState(state: AnalyticsState): void {
  try {
    window.localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota
  }
}

export function trackEvent(
  state: AnalyticsState,
  name: AnalyticsEventName,
  metadata?: AnalyticsEvent['metadata'],
  feature?: string,
): AnalyticsState {
  if (!state.enabled) return state;
  const event: AnalyticsEvent = {
    id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    feature,
    metadata,
    at: new Date().toISOString(),
  };
  const funnels = { ...state.funnels };
  if (name === 'funnel_step' && typeof metadata?.step === 'string') {
    funnels[metadata.step] = (funnels[metadata.step] ?? 0) + 1;
  }
  return {
    ...state,
    events: [...state.events, event].slice(-MAX_EVENTS),
    funnels,
  };
}

export function summarizeAnalytics(state: AnalyticsState): {
  totalEvents: number;
  byName: Record<string, number>;
  topFeatures: Array<{ feature: string; count: number }>;
  funnels: Record<string, number>;
} {
  const byName: Record<string, number> = {};
  const featureCounts = new Map<string, number>();
  for (const event of state.events) {
    byName[event.name] = (byName[event.name] ?? 0) + 1;
    if (event.feature) featureCounts.set(event.feature, (featureCounts.get(event.feature) ?? 0) + 1);
  }
  const topFeatures = [...featureCounts.entries()]
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return { totalEvents: state.events.length, byName, topFeatures, funnels: state.funnels };
}
