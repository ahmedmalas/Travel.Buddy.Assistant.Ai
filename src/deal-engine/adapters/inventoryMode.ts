import { listAdapters } from './registry';

export type InventoryMode = 'demo-simulated' | 'live-providers-enabled';

/**
 * Production-safe inventory mode.
 * Live prices/availability/booking must not be claimed until approved credentials register live adapters.
 */
export function getInventoryMode(): InventoryMode {
  const hasLive = listAdapters({ includeLive: true }).some((adapter) => adapter.isLive);
  return hasLive ? 'live-providers-enabled' : 'demo-simulated';
}

export function areLiveProvidersEnabled(): boolean {
  return getInventoryMode() === 'live-providers-enabled';
}

export function getInventoryModeBanner(): string {
  if (areLiveProvidersEnabled()) {
    return 'Live provider adapters are registered. Results still require explicit partner disclosure and legal review before commercial claims.';
  }
  return 'LIVE PROVIDERS DISABLED — results are simulated demonstrations only. Not live prices, not live availability, not an OTA partnership, and not a bookable checkout.';
}

export function getInventoryModeClaims(): {
  livePrices: boolean;
  liveAvailability: boolean;
  otaPartnerships: boolean;
  guaranteedCheapest: boolean;
  realBooking: boolean;
} {
  return {
    livePrices: false,
    liveAvailability: false,
    otaPartnerships: false,
    guaranteedCheapest: false,
    realBooking: false,
  };
}
