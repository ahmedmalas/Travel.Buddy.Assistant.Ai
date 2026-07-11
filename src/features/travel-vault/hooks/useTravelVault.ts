import { useMemo, useState } from 'react';
import { getActiveTripVaultItems, getVaultFilteredItems, getVaultTagOptions } from '../adapters/travelVault.adapter';
import { DEFAULT_VAULT_FILTERS } from '../model/travelVault.utils';
import type { VaultFilters, VaultItemDraft, VaultItemUpdate } from '../model/travelVault.types';
import { useTripCommand } from '../../trip-command/state/useTripCommand';

export function useTravelVault() {
  const {
    activeTrip,
    activeTripVaultItems,
    vaultCountsByType,
    vaultExpiringSoonCount,
    addVaultItem,
    updateVaultItem,
    removeVaultItem,
    setVaultSearchQuery,
  } = useTripCommand();
  const [filters, setFilters] = useState<VaultFilters>(DEFAULT_VAULT_FILTERS);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const vaultItems = useMemo(() => getActiveTripVaultItems(activeTrip), [activeTrip]);
  const filteredItems = useMemo(() => getVaultFilteredItems(vaultItems, filters), [vaultItems, filters]);
  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? null,
    [filteredItems, selectedItemId],
  );
  const tagOptions = useMemo(() => getVaultTagOptions(vaultItems), [vaultItems]);

  function updateFilters(nextFilters: Partial<VaultFilters>) {
    setFilters((currentFilters) => {
      const updated = { ...currentFilters, ...nextFilters };
      setVaultSearchQuery(updated.query);
      return updated;
    });
  }

  function resetFilters() {
    setFilters(DEFAULT_VAULT_FILTERS);
    setVaultSearchQuery('');
  }

  function createVaultItem(draft: VaultItemDraft) {
    const nextItemId = addVaultItem(draft);
    if (nextItemId) {
      setSelectedItemId(nextItemId);
    }
  }

  function editVaultItem(itemId: string, updates: VaultItemUpdate) {
    updateVaultItem({ itemId, updates });
  }

  function deleteVaultItem(itemId: string) {
    removeVaultItem({ itemId });
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
  }

  return {
    activeTrip,
    vaultItems,
    filteredItems,
    selectedItem,
    selectedItemId,
    setSelectedItemId,
    filters,
    updateFilters,
    resetFilters,
    tagOptions,
    vaultCountsByType,
    vaultExpiringSoonCount,
    createVaultItem,
    editVaultItem,
    deleteVaultItem,
  };
}
