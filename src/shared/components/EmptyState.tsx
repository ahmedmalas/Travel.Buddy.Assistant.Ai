type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
      {actionLabel && onAction && (
        <button
          className="mt-5 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
