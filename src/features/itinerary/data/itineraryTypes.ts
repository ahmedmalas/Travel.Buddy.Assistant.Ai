import type { ItineraryItemType } from '../model/types';

type TypeMeta = {
  icon: string;
  label: string;
  badgeClassName: string;
};

export const itineraryTypeMeta: Record<ItineraryItemType, TypeMeta> = {
  flight: { icon: '✈️', label: 'Flight', badgeClassName: 'bg-sky-500/20 text-sky-200' },
  hotel: { icon: '🏨', label: 'Hotel', badgeClassName: 'bg-indigo-500/20 text-indigo-200' },
  transport: { icon: '🚆', label: 'Transport', badgeClassName: 'bg-cyan-500/20 text-cyan-200' },
  activity: { icon: '🎯', label: 'Activity', badgeClassName: 'bg-emerald-500/20 text-emerald-200' },
  restaurant: { icon: '🍽️', label: 'Restaurant', badgeClassName: 'bg-amber-500/20 text-amber-200' },
  tour: { icon: '🗺️', label: 'Tour', badgeClassName: 'bg-purple-500/20 text-purple-200' },
  meeting: { icon: '🤝', label: 'Meeting', badgeClassName: 'bg-rose-500/20 text-rose-200' },
  custom: { icon: '🧩', label: 'Custom', badgeClassName: 'bg-slate-500/20 text-slate-200' },
};

export function formatDateTime(value: string, timezone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
