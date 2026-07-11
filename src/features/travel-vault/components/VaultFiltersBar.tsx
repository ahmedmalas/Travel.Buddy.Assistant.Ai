import { VaultTagChip } from './VaultTagChip';
import { VAULT_FILE_KINDS, VAULT_ITEM_TYPES, type VaultFilters } from '../model/travelVault.types';
import { formatVaultTypeLabel } from '../model/travelVault.utils';

type VaultFiltersBarProps = {
  filters: VaultFilters;
  tags: string[];
  onUpdateFilters: (filters: Partial<VaultFilters>) => void;
  onResetFilters: () => void;
};

export function VaultFiltersBar({ filters, tags, onUpdateFilters, onResetFilters }: VaultFiltersBarProps) {
  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vault filters</p>
        <button className="text-xs text-slate-300 hover:text-white" onClick={onResetFilters} type="button">
          Clear
        </button>
      </div>

      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
        onChange={(event) => onUpdateFilters({ query: event.target.value })}
        placeholder="Search title, tags, notes, confirmation..."
        value={filters.query}
      />

      <div className="grid gap-2 md:grid-cols-4">
        <select
          className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-100"
          onChange={(event) => onUpdateFilters({ type: event.target.value as VaultFilters['type'] })}
          value={filters.type}
        >
          <option value="all">All types</option>
          {VAULT_ITEM_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatVaultTypeLabel(type)}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-100"
          onChange={(event) => onUpdateFilters({ fileKind: event.target.value as VaultFilters['fileKind'] })}
          value={filters.fileKind}
        >
          <option value="all">All file kinds</option>
          {VAULT_FILE_KINDS.map((fileKind) => (
            <option key={fileKind} value={fileKind}>
              {formatVaultTypeLabel(fileKind)}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-100"
          onChange={(event) =>
            onUpdateFilters({
              hasExpiry: event.target.value === 'all' ? 'all' : event.target.value === 'true',
            })
          }
          value={String(filters.hasExpiry)}
        >
          <option value="all">Any expiry</option>
          <option value="true">Has expiry</option>
          <option value="false">No expiry</option>
        </select>
        <select
          className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-100"
          onChange={(event) => onUpdateFilters({ sort: event.target.value as VaultFilters['sort'] })}
          value={filters.sort}
        >
          <option value="recent">Sort: Recent</option>
          <option value="expiry">Sort: Expiry</option>
          <option value="type">Sort: Type</option>
          <option value="title">Sort: Title</option>
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-400">Tags</p>
        <div className="flex flex-wrap gap-2">
          <VaultTagChip active={filters.tag === 'all'} onClick={() => onUpdateFilters({ tag: 'all' })} tag="all" />
          {tags.map((tag) => (
            <VaultTagChip active={filters.tag === tag} key={tag} onClick={() => onUpdateFilters({ tag })} tag={tag} />
          ))}
        </div>
      </div>
    </div>
  );
}
