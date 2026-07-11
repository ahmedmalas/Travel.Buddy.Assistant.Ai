import { TagChip } from '../../../shared/components/TagChip';
import { PLACE_CATEGORIES, PLACE_PRIORITIES, PLACE_STATUSES, type PlaceFilters } from '../model/destinationWorkspace.types';
import { formatCategoryLabel, formatPriorityLabel, formatStatusLabel } from '../model/destinationWorkspace.utils';

type PlaceFiltersBarProps = {
  filters: PlaceFilters;
  onUpdateFilters: (filters: Partial<PlaceFilters>) => void;
  onResetFilters: () => void;
};

export function PlaceFiltersBar({ filters, onUpdateFilters, onResetFilters }: PlaceFiltersBarProps) {
  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Filter scope</p>
        <button className="text-xs text-slate-300 transition hover:text-white" onClick={onResetFilters} type="button">
          Clear
        </button>
      </div>

      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
        onChange={(event) => onUpdateFilters({ query: event.target.value })}
        placeholder="Search places, reasons, notes..."
        value={filters.query}
      />

      <div className="space-y-2">
        <p className="text-xs text-slate-400">Category</p>
        <div className="flex flex-wrap gap-2">
          <TagChip active={filters.category === 'all'} label="All" onClick={() => onUpdateFilters({ category: 'all' })} />
          {PLACE_CATEGORIES.map((category) => (
            <TagChip
              active={filters.category === category}
              key={category}
              label={formatCategoryLabel(category)}
              onClick={() => onUpdateFilters({ category })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-400">Status</p>
        <div className="flex flex-wrap gap-2">
          <TagChip active={filters.status === 'all'} label="All" onClick={() => onUpdateFilters({ status: 'all' })} />
          {PLACE_STATUSES.map((status) => (
            <TagChip active={filters.status === status} key={status} label={formatStatusLabel(status)} onClick={() => onUpdateFilters({ status })} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-400">Priority</p>
        <div className="flex flex-wrap gap-2">
          <TagChip active={filters.priority === 'all'} label="All" onClick={() => onUpdateFilters({ priority: 'all' })} />
          {PLACE_PRIORITIES.map((priority) => (
            <TagChip
              active={filters.priority === priority}
              key={priority}
              label={formatPriorityLabel(priority)}
              onClick={() => onUpdateFilters({ priority })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-400">Reminder</p>
        <div className="flex flex-wrap gap-2">
          <TagChip active={filters.reminderState === 'all'} label="All" onClick={() => onUpdateFilters({ reminderState: 'all' })} />
          <TagChip
            active={filters.reminderState === 'overdue'}
            label="Overdue"
            onClick={() => onUpdateFilters({ reminderState: 'overdue' })}
          />
          <TagChip active={filters.reminderState === 'today'} label="Today" onClick={() => onUpdateFilters({ reminderState: 'today' })} />
          <TagChip
            active={filters.reminderState === 'upcoming'}
            label="Upcoming"
            onClick={() => onUpdateFilters({ reminderState: 'upcoming' })}
          />
        </div>
      </div>
    </div>
  );
}
