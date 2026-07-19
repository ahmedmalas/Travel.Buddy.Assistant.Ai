import type { ReactNode } from 'react';

export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-slate-950/20 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm text-slate-200">
      <span className="mb-1.5 block font-medium text-slate-100">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-300" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export const inputClassName =
  'w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none ring-sky-300/40 focus:ring-2';

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full bg-sky-400/20 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-400/30 disabled:cursor-not-allowed disabled:opacity-40 ${props.className ?? ''}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-40 ${props.className ?? ''}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/30 px-4 py-8 text-center">
      <p className="font-medium text-slate-100">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}

export function StatusBanner({
  kind,
  message,
}: {
  kind: 'success' | 'error' | 'info';
  message: string;
}) {
  const styles =
    kind === 'success'
      ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100'
      : kind === 'error'
        ? 'border-rose-300/30 bg-rose-500/10 text-rose-100'
        : 'border-sky-300/30 bg-sky-500/10 text-sky-100';
  return (
    <p className={`rounded-xl border px-3 py-2 text-sm ${styles}`} role="status">
      {message}
    </p>
  );
}

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const styles =
    tone === 'success'
      ? 'bg-emerald-400/15 text-emerald-100'
      : tone === 'warning'
        ? 'bg-amber-400/15 text-amber-100'
        : tone === 'danger'
          ? 'bg-rose-400/15 text-rose-100'
          : tone === 'info'
            ? 'bg-sky-400/15 text-sky-100'
            : 'bg-white/10 text-slate-200';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-[0.14em] ${styles}`}>
      {label}
    </span>
  );
}

export function Modal({
  title,
  children,
  onClose,
  open,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close dialog overlay" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <SecondaryButton type="button" onClick={onClose}>
            Close
          </SecondaryButton>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: ReactNode[][];
  empty?: ReactNode;
}) {
  if (rows.length === 0) return <>{empty ?? null}</>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.16em] text-slate-400">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-white/10">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

