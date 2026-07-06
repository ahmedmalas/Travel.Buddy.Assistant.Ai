import { formatVaultTypeLabel } from '../model/travelVault.utils';
import type { VaultItemType } from '../model/travelVault.types';

type VaultCategoryBadgeProps = {
  category: VaultItemType;
};

const CATEGORY_STYLE: Record<VaultItemType, string> = {
  flight: 'border-sky-300/50 bg-sky-500/10 text-sky-200',
  hotel: 'border-indigo-300/50 bg-indigo-500/10 text-indigo-200',
  insurance: 'border-emerald-300/50 bg-emerald-500/10 text-emerald-200',
  passport: 'border-amber-300/50 bg-amber-500/10 text-amber-200',
  visa: 'border-fuchsia-300/50 bg-fuchsia-500/10 text-fuchsia-200',
  ticket: 'border-cyan-300/50 bg-cyan-500/10 text-cyan-200',
  reservation: 'border-violet-300/50 bg-violet-500/10 text-violet-200',
  receipt: 'border-zinc-300/40 bg-zinc-500/10 text-zinc-200',
  invoice: 'border-rose-300/50 bg-rose-500/10 text-rose-200',
  pdf: 'border-red-300/50 bg-red-500/10 text-red-200',
  image: 'border-lime-300/50 bg-lime-500/10 text-lime-200',
  note: 'border-slate-300/40 bg-slate-500/10 text-slate-200',
  other: 'border-white/20 bg-white/[0.03] text-slate-200',
};

export function VaultCategoryBadge({ category }: VaultCategoryBadgeProps) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${CATEGORY_STYLE[category]}`}>{formatVaultTypeLabel(category)}</span>;
}
