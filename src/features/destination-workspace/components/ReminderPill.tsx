import { formatReminderLabel } from '../model/destinationWorkspace.utils';
import type { PlaceReminderState } from '../model/destinationWorkspace.types';

type ReminderPillProps = {
  reminderAt?: string;
  reminderState: PlaceReminderState;
};

const REMINDER_STYLE: Record<PlaceReminderState, string> = {
  none: 'border-white/15 bg-white/[0.02] text-slate-300',
  overdue: 'border-rose-300/50 bg-rose-500/10 text-rose-200',
  today: 'border-amber-300/50 bg-amber-500/10 text-amber-200',
  upcoming: 'border-emerald-300/40 bg-emerald-500/10 text-emerald-200',
};

const REMINDER_LABEL: Record<PlaceReminderState, string> = {
  none: 'No reminder',
  overdue: 'Overdue',
  today: 'Today',
  upcoming: 'Upcoming',
};

export function ReminderPill({ reminderAt, reminderState }: ReminderPillProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${REMINDER_STYLE[reminderState]}`}>
      <span>{REMINDER_LABEL[reminderState]}</span>
      {reminderAt && <span className="opacity-80">· {formatReminderLabel(reminderAt)}</span>}
    </span>
  );
}
