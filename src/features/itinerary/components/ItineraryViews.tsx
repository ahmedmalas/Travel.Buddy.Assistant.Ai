import type { TravelVaultItem } from '../../trip/model/trip';
import { itineraryTypeMeta, formatDateTime } from '../data/itineraryTypes';
import { groupItemsByDay } from '../model/selectors';
import type { ItineraryItem } from '../model/types';

export type ItineraryViewMode = 'timeline' | 'agenda' | 'daily';

type ItemActions = {
  onEdit: (item: ItineraryItem) => void;
  onDelete: (item: ItineraryItem) => void;
  onDuplicate: (item: ItineraryItem) => void;
};

type BaseViewProps = {
  items: ItineraryItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  actions: ItemActions;
};

type ItineraryViewsProps = BaseViewProps & {
  viewMode: ItineraryViewMode;
};

function ItemCard({
  item,
  selectedItemId,
  onSelectItem,
  actions,
}: {
  item: ItineraryItem;
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  actions: ItemActions;
}) {
  const typeMeta = itineraryTypeMeta[item.type];
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelectItem(item.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectItem(item.id);
        }
      }}
      className={`rounded-2xl border p-4 ${selectedItemId === item.id ? 'border-sky-300 bg-sky-400/10' : 'border-white/10 bg-slate-900/60'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-left">
          <p className="text-sm font-semibold text-white">
            <span className="mr-2" aria-hidden>
              {typeMeta.icon}
            </span>
            {item.title}
          </p>
          <p className="mt-1 text-xs text-slate-300">
            {formatDateTime(item.startDateTime, item.timezone)} → {formatDateTime(item.endDateTime, item.timezone)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs ${typeMeta.badgeClassName}`}>{typeMeta.label}</span>
      </div>
      <p className="mt-2 text-sm text-slate-300">{item.description || 'No description yet.'}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
        <span>{item.location || 'No location'}</span>
        <span>•</span>
        <span>{item.supplier || 'No supplier'}</span>
        <span>•</span>
        <span className="capitalize">{item.status}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200"
          onClick={(event) => {
            event.stopPropagation();
            actions.onEdit(item);
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200"
          onClick={(event) => {
            event.stopPropagation();
            actions.onDuplicate(item);
          }}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="rounded-full border border-red-300/40 px-3 py-1 text-xs text-red-200"
          onClick={(event) => {
            event.stopPropagation();
            actions.onDelete(item);
          }}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function TimelineView({ items, selectedItemId, onSelectItem, actions }: BaseViewProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="relative pl-6">
          <div className="absolute left-2 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-0 top-6 h-3 w-3 rounded-full bg-sky-300" />
          <ItemCard item={item} selectedItemId={selectedItemId} onSelectItem={onSelectItem} actions={actions} />
        </div>
      ))}
    </div>
  );
}

function AgendaView({ items, selectedItemId, onSelectItem, actions }: BaseViewProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} selectedItemId={selectedItemId} onSelectItem={onSelectItem} actions={actions} />
      ))}
    </div>
  );
}

function DailyView({ items, selectedItemId, onSelectItem, actions }: BaseViewProps) {
  const grouped = groupItemsByDay(items);
  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <section key={group.day}>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">{group.day}</h4>
          <div className="grid gap-3">
            {group.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selectedItemId={selectedItemId}
                onSelectItem={onSelectItem}
                actions={actions}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ItineraryViews({ viewMode, ...baseProps }: ItineraryViewsProps) {
  if (baseProps.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-sm text-slate-400">
        No itinerary items match the current search/filter criteria.
      </div>
    );
  }

  if (viewMode === 'timeline') {
    return <TimelineView {...baseProps} />;
  }
  if (viewMode === 'daily') {
    return <DailyView {...baseProps} />;
  }
  return <AgendaView {...baseProps} />;
}

type ItineraryDetailPanelProps = {
  selectedItem: ItineraryItem | null;
  linkedVaultItems: TravelVaultItem[];
};

export function ItineraryDetailPanel({ selectedItem, linkedVaultItems }: ItineraryDetailPanelProps) {
  if (!selectedItem) {
    return (
      <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-400">
        Select an itinerary item to inspect details and linked Travel Vault documents.
      </aside>
    );
  }

  return (
    <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
      <h3 className="text-base font-semibold text-white">{selectedItem.title}</h3>
      <p className="mt-2 text-sm text-slate-300">{selectedItem.description || 'No description yet.'}</p>
      <dl className="mt-4 grid gap-2 text-xs text-slate-300">
        <div>
          <dt className="font-semibold text-slate-200">When</dt>
          <dd>
            {formatDateTime(selectedItem.startDateTime, selectedItem.timezone)} →{' '}
            {formatDateTime(selectedItem.endDateTime, selectedItem.timezone)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-200">Location</dt>
          <dd>{selectedItem.location || 'N/A'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-200">Supplier / confirmation</dt>
          <dd>
            {selectedItem.supplier || 'N/A'} / {selectedItem.confirmationNumber || 'N/A'}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-200">Notes</dt>
          <dd>{selectedItem.notes || 'No notes.'}</dd>
        </div>
      </dl>

      <section className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Linked Travel Vault docs</h4>
        <ul className="mt-2 space-y-2">
          {linkedVaultItems.length === 0 ? (
            <li className="text-xs text-slate-400">No linked documents.</li>
          ) : (
            linkedVaultItems.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/10 p-3 text-xs text-slate-300">
                <p className="font-semibold text-slate-200">{item.title}</p>
                <p className="mt-1">{item.description}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </aside>
  );
}
