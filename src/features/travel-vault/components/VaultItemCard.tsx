import type { VaultItem } from '../model/travelVault.types';
import { VaultCategoryBadge } from './VaultCategoryBadge';
import { VaultTagChip } from './VaultTagChip';

type VaultItemCardProps = {
  item: VaultItem;
  selected: boolean;
  onSelect: () => void;
};

function formatDate(value?: string) {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleDateString();
}

export function VaultItemCard({ item, selected, onSelect }: VaultItemCardProps) {
  return (
    <button
      className={`w-full rounded-3xl border p-4 text-left transition ${
        selected ? 'border-sky-300/60 bg-sky-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-base font-semibold text-white">{item.title}</h4>
        <VaultCategoryBadge category={item.category} />
      </div>
      <p className="mt-2 text-xs text-slate-300">
        {item.fileKind.toUpperCase()} · {item.fileName || 'Metadata-only item'}
      </p>
      {(item.vendor || item.confirmationCode) && (
        <p className="mt-1 text-xs text-slate-300">
          {item.vendor || 'Vendor N/A'}{item.confirmationCode ? ` · ${item.confirmationCode}` : ''}
        </p>
      )}
      <p className="mt-1 text-xs text-slate-400">Expiry: {formatDate(item.expiresAt)}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.tags.slice(0, 3).map((tag) => (
          <VaultTagChip key={tag} tag={tag} />
        ))}
      </div>
    </button>
  );
}
