import type { Trip } from '../../trip-command/model/trip.types';
import type { VaultFilters, VaultItem } from '../model/travelVault.types';
import {
  DEFAULT_VAULT_FILTERS,
  filterVaultItems,
  getVaultAllTags,
  getVaultExpiringSoonCount,
  sortVaultItems,
} from '../model/travelVault.utils';

export function getActiveTripVaultItems(trip: Trip | null): VaultItem[] {
  if (!trip) {
    return [];
  }
  return trip.vaultItems;
}

export function getVaultFilteredItems(vaultItems: VaultItem[], filters: VaultFilters = DEFAULT_VAULT_FILTERS) {
  const filtered = filterVaultItems(vaultItems, filters);
  return sortVaultItems(filtered, filters.sort);
}

export function getVaultTagOptions(vaultItems: VaultItem[]) {
  return getVaultAllTags(vaultItems);
}

export function getVaultExpiringSoon(vaultItems: VaultItem[]) {
  return getVaultExpiringSoonCount(vaultItems);
}
