export type AlertKind =
  | 'target_price'
  | 'percentage_drop'
  | 'travel_date_flexibility'
  | 'alternative_airport'
  | 'better_package';

export interface PriceSnapshot {
  id: string;
  offerKey: string;
  amount: number;
  currency: string;
  capturedAt: string;
  freshness: 'simulated' | 'cached' | 'live' | 'estimated';
}

export interface PriceAlert {
  id: string;
  offerKey: string;
  kind: AlertKind;
  targetPrice?: number;
  percentageDrop?: number;
  createdAt: string;
  expiresAt: string;
  lastTriggeredAt: string | null;
  active: boolean;
  label: string;
}

export interface PriceTrend {
  offerKey: string;
  snapshots: PriceSnapshot[];
  lowestObserved: number;
  latest: number;
  changeAmount: number;
  changePercent: number;
  currency: string;
}

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Simulated historical points until live provider access exists. */
export function generateSimulatedPriceHistory(
  offerKey: string,
  currentPrice: number,
  currency: string,
  days = 14,
): PriceSnapshot[] {
  const snapshots: PriceSnapshot[] = [];
  const now = Date.now();
  for (let i = days; i >= 0; i -= 1) {
    const wobble = ((hash(`${offerKey}:${i}`) % 21) - 10) / 100;
    const amount = Math.max(1, Math.round(currentPrice * (1 + wobble)));
    snapshots.push({
      id: `${offerKey}-snap-${i}`,
      offerKey,
      amount,
      currency,
      capturedAt: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
      freshness: 'simulated',
    });
  }
  return snapshots;
}

export function buildPriceTrend(snapshots: PriceSnapshot[]): PriceTrend | null {
  if (!snapshots.length) return null;
  const sorted = [...snapshots].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const latest = sorted[sorted.length - 1]!;
  const lowestObserved = Math.min(...sorted.map((s) => s.amount));
  const first = sorted[0]!;
  const changeAmount = latest.amount - first.amount;
  const changePercent = first.amount === 0 ? 0 : (changeAmount / first.amount) * 100;
  return {
    offerKey: latest.offerKey,
    snapshots: sorted,
    lowestObserved,
    latest: latest.amount,
    changeAmount,
    changePercent: Math.round(changePercent * 100) / 100,
    currency: latest.currency,
  };
}

export function createPriceAlert(input: {
  offerKey: string;
  kind: AlertKind;
  targetPrice?: number;
  percentageDrop?: number;
  label: string;
  ttlHours?: number;
}): PriceAlert {
  const now = Date.now();
  return {
    id: `alert-${input.offerKey}-${input.kind}-${now}`,
    offerKey: input.offerKey,
    kind: input.kind,
    targetPrice: input.targetPrice,
    percentageDrop: input.percentageDrop,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + (input.ttlHours ?? 24 * 14) * 60 * 60 * 1000).toISOString(),
    lastTriggeredAt: null,
    active: true,
    label: input.label,
  };
}

export function isAlertExpired(alert: PriceAlert, now = new Date()): boolean {
  return now.toISOString() > alert.expiresAt;
}

export function shouldSuppressDuplicateTrigger(
  alert: PriceAlert,
  now = new Date(),
  cooldownHours = 12,
): boolean {
  if (!alert.lastTriggeredAt) return false;
  const last = new Date(alert.lastTriggeredAt).getTime();
  return now.getTime() - last < cooldownHours * 60 * 60 * 1000;
}

export function evaluateAlert(
  alert: PriceAlert,
  trend: PriceTrend,
  now = new Date(),
): { triggered: boolean; reason: string | null; alert: PriceAlert } {
  if (!alert.active || isAlertExpired(alert, now) || shouldSuppressDuplicateTrigger(alert, now)) {
    return { triggered: false, reason: null, alert };
  }

  let triggered = false;
  let reason: string | null = null;

  if (alert.kind === 'target_price' && alert.targetPrice != null && trend.latest <= alert.targetPrice) {
    triggered = true;
    reason = `Price reached target ${trend.currency} ${alert.targetPrice}.`;
  }
  if (
    alert.kind === 'percentage_drop' &&
    alert.percentageDrop != null &&
    trend.changePercent <= -Math.abs(alert.percentageDrop)
  ) {
    triggered = true;
    reason = `Price dropped ${Math.abs(trend.changePercent)}% (threshold ${alert.percentageDrop}%).`;
  }
  if (alert.kind === 'travel_date_flexibility' && trend.lowestObserved < trend.latest * 0.95) {
    triggered = true;
    reason = 'Flexible dates show a meaningfully lower observed price in history.';
  }
  if (alert.kind === 'alternative_airport' && trend.changePercent < -3) {
    triggered = true;
    reason = 'Alternative-airport style savings detected in simulated trend.';
  }
  if (alert.kind === 'better_package' && trend.latest <= trend.lowestObserved * 1.02) {
    triggered = true;
    reason = 'Current package price near lowest observed — consider booking handoff.';
  }

  if (!triggered) return { triggered: false, reason: null, alert };

  return {
    triggered: true,
    reason,
    alert: { ...alert, lastTriggeredAt: now.toISOString() },
  };
}
