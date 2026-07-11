type VaultTagChipProps = {
  tag: string;
  active?: boolean;
  onClick?: () => void;
};

export function VaultTagChip({ tag, active = false, onClick }: VaultTagChipProps) {
  if (!onClick) {
    return <span className="inline-flex rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-200">#{tag}</span>;
  }

  return (
    <button
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs transition ${
        active ? 'border-sky-300/60 bg-sky-500/10 text-sky-100' : 'border-white/15 bg-white/[0.02] text-slate-200 hover:bg-white/[0.06]'
      }`}
      onClick={onClick}
      type="button"
    >
      #{tag}
    </button>
  );
}
