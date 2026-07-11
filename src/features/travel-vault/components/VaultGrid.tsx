import type { VaultItem } from '../model/travelVault.types';
import { VaultEmptyState } from './VaultEmptyState';
import { VaultItemCard } from './VaultItemCard';

type VaultGridProps = {
  items: VaultItem[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
};

export function VaultGrid({ items, selectedItemId, onSelectItem }: VaultGridProps) {
  if (items.length === 0) {
    return (
      <VaultEmptyState
        title="No vault items in this view"
        description="Try clearing filters or add a new travel document record."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <VaultItemCard item={item} key={item.id} onSelect={() => onSelectItem(item.id)} selected={selectedItemId === item.id} />
      ))}
    </div>
  );
}
