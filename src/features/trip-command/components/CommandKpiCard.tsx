type CommandKpiCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function CommandKpiCard({ label, value, hint }: CommandKpiCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-300">{hint}</p>}
    </article>
  );
}
