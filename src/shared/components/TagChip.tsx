import type { ReactNode } from 'react';

type TagChipProps = {
  label: string;
  active?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
};

export function TagChip({ label, active = false, icon, onClick }: TagChipProps) {
  const interactive = typeof onClick === 'function';

  if (!interactive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-slate-200">
        {icon}
        {label}
      </span>
    );
  }

  return (
    <button
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
        active
          ? 'border-sky-300/60 bg-sky-400/10 text-sky-100'
          : 'border-white/15 bg-white/[0.02] text-slate-200 hover:bg-white/[0.06]'
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}
