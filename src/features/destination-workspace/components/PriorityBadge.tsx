import { formatPriorityLabel } from '../model/destinationWorkspace.utils';
import type { PlacePriority } from '../model/destinationWorkspace.types';

type PriorityBadgeProps = {
  priority: PlacePriority;
};

const PRIORITY_STYLE: Record<PlacePriority, string> = {
  critical: 'border-fuchsia-300/60 bg-fuchsia-500/10 text-fuchsia-200',
  high: 'border-rose-300/50 bg-rose-500/10 text-rose-200',
  medium: 'border-sky-300/60 bg-sky-500/10 text-sky-200',
  low: 'border-white/15 bg-white/[0.02] text-slate-300',
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${PRIORITY_STYLE[priority]}`}>
      {formatPriorityLabel(priority)}
    </span>
  );
}
