import { formatStatusLabel } from '../model/destinationWorkspace.utils';
import type { PlaceStatus } from '../model/destinationWorkspace.types';

type StatusBadgeProps = {
  status: PlaceStatus;
};

const STATUS_STYLE: Record<PlaceStatus, string> = {
  idea: 'border-slate-300/30 bg-slate-500/10 text-slate-200',
  shortlisted: 'border-sky-300/60 bg-sky-500/10 text-sky-200',
  booked: 'border-indigo-300/60 bg-indigo-500/10 text-indigo-200',
  visited: 'border-emerald-300/60 bg-emerald-500/10 text-emerald-200',
  skipped: 'border-zinc-300/40 bg-zinc-600/20 text-zinc-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${STATUS_STYLE[status]}`}>{formatStatusLabel(status)}</span>
  );
}
