import { itineraryItemTypes, itineraryStatuses } from '../model/types';
import type { ItineraryFilterState } from '../../trip/model/trip';

type ItineraryFiltersProps = {
  filters: ItineraryFilterState;
  tagsText: string;
  onQueryChange: (value: string) => void;
  onTypeChange: (value: ItineraryFilterState['type']) => void;
  onStatusChange: (value: ItineraryFilterState['status']) => void;
  onDateChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onSortDirectionChange: (value: 'asc' | 'desc') => void;
  onReset: () => void;
};

export function ItineraryFilters({
  filters,
  tagsText,
  onQueryChange,
  onTypeChange,
  onStatusChange,
  onDateChange,
  onTagsChange,
  onSortDirectionChange,
  onReset,
}: ItineraryFiltersProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">Search & filters</h3>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200"
        >
          Reset
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-slate-300">
          Query
          <input
            value={filters.query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="title, notes, supplier..."
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-slate-300">
          Type
          <select
            value={filters.type}
            onChange={(event) => onTypeChange(event.target.value as ItineraryFilterState['type'])}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="all">All types</option>
            {itineraryItemTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-300">
          Status
          <select
            value={filters.status}
            onChange={(event) => onStatusChange(event.target.value as ItineraryFilterState['status'])}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="all">All status</option>
            {itineraryStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-300">
          Date
          <input
            type="date"
            value={filters.date}
            onChange={(event) => onDateChange(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-slate-300 md:col-span-2">
          Tags (comma-separated)
          <input
            value={tagsText}
            onChange={(event) => onTagsChange(event.target.value)}
            placeholder="arrival, business, dinner"
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-slate-300">
          Sort
          <select
            value={filters.sortDirection}
            onChange={(event) => onSortDirectionChange(event.target.value as 'asc' | 'desc')}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="asc">Earliest first</option>
            <option value="desc">Latest first</option>
          </select>
        </label>
      </div>
    </section>
  );
}
