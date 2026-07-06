type VaultEmptyStateProps = {
  title: string;
  description: string;
};

export function VaultEmptyState({ title, description }: VaultEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  );
}
