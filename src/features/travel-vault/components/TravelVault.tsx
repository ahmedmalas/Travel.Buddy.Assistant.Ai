import { VaultEmptyState } from './VaultEmptyState';
import { VaultFiltersBar } from './VaultFiltersBar';
import { VaultGrid } from './VaultGrid';
import { VaultHeader } from './VaultHeader';
import { VaultItemDetailPanel } from './VaultItemDetailPanel';
import { VaultUploadPanel } from './VaultUploadPanel';
import { useTravelVault } from '../hooks/useTravelVault';

export function TravelVault() {
  const vault = useTravelVault();

  if (!vault.activeTrip) {
    return (
      <VaultEmptyState
        title="No active trip selected"
        description="Choose an active trip in the command centre before organizing travel documents."
      />
    );
  }

  return (
    <div className="space-y-5">
      <VaultHeader countsByType={vault.vaultCountsByType} expiringSoonCount={vault.vaultExpiringSoonCount} totalItems={vault.vaultItems.length} />

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5">
          <VaultUploadPanel onCreateItem={vault.createVaultItem} />
          <VaultFiltersBar
            filters={vault.filters}
            onResetFilters={vault.resetFilters}
            onUpdateFilters={vault.updateFilters}
            tags={vault.tagOptions}
          />
          <VaultGrid items={vault.filteredItems} onSelectItem={vault.setSelectedItemId} selectedItemId={vault.selectedItemId} />
        </div>

        <div>
          <VaultItemDetailPanel
            item={vault.selectedItem}
            onRemoveItem={vault.deleteVaultItem}
            onUpdateItem={vault.editVaultItem}
          />
        </div>
      </div>
    </div>
  );
}
