/**
 * Slice 92 — Performance helpers, virtualisation math, and benchmark utilities.
 */

export interface VirtualWindow {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
}

export function computeVirtualWindow(input: {
  scrollTop: number;
  viewportHeight: number;
  itemCount: number;
  itemHeight: number;
  overscan?: number;
}): VirtualWindow {
  const overscan = input.overscan ?? 5;
  const itemHeight = Math.max(1, input.itemHeight);
  const startIndex = Math.max(0, Math.floor(input.scrollTop / itemHeight) - overscan);
  const visible = Math.ceil(input.viewportHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(input.itemCount, startIndex + visible);
  return {
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
    totalHeight: input.itemCount * itemHeight,
  };
}

export interface PerfBenchmarkResult {
  label: string;
  iterations: number;
  totalMs: number;
  averageMs: number;
  opsPerSecond: number;
}

export function runBenchmark(label: string, iterations: number, fn: () => void): PerfBenchmarkResult {
  const started = performance.now();
  for (let i = 0; i < iterations; i += 1) fn();
  const totalMs = performance.now() - started;
  return {
    label,
    iterations,
    totalMs: Math.round(totalMs * 1000) / 1000,
    averageMs: Math.round((totalMs / iterations) * 10000) / 10000,
    opsPerSecond: totalMs === 0 ? iterations : Math.round((iterations / totalMs) * 1000),
  };
}

export interface BundleBenchmarkSnapshot {
  capturedAt: string;
  notes: string;
  beforeMainChunkKb: number;
  afterTargetMainChunkKb: number | null;
  techniques: string[];
}

/** Baseline captured from pre-finalisation production build (~528 KB main chunk). */
export const PERFORMANCE_BASELINE: BundleBenchmarkSnapshot = {
  capturedAt: '2026-07-19T00:00:00.000Z',
  notes: 'Pre-Slices-89 baseline from merged Slices 73–88 production build; after = Slices 89–100 split build.',
  beforeMainChunkKb: 528,
  afterTargetMainChunkKb: 148,
  techniques: [
    'Lazy-loaded trip-platform panels',
    'Manual vendor/react/supabase/deal-engine/finalisation chunks via Vite',
    'Virtualised large list windowing',
    'Debounced search helpers',
  ],
};

export function debounce<T extends (...args: never[]) => void>(fn: T, waitMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

export function filterLargeCollection<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  limit = 100,
): T[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return items.slice(0, limit);
  const out: T[] = [];
  for (const item of items) {
    const text = getText(item).toLowerCase();
    if (tokens.every((token) => text.includes(token))) {
      out.push(item);
      if (out.length >= limit) break;
    }
  }
  return out;
}
