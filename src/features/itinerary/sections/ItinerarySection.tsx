import { useMemo, useState } from 'react';
import { ItineraryDashboard } from '../components/ItineraryDashboard';
import { ItineraryFilters } from '../components/ItineraryFilters';
import { ItineraryForm } from '../components/ItineraryForm';
import { ItineraryDetailPanel, ItineraryViews, type ItineraryViewMode } from '../components/ItineraryViews';
import {
  activeTripItinerary,
  itineraryCountsByType,
  itinerarySearchResults,
  nextReservation,
  todaysEvents,
  upcomingEvents,
} from '../model/selectors';
import type { ItineraryItem } from '../model/types';
import { useItineraryFilters } from '../hooks/useItineraryFilters';
import { useTripStore } from '../../trip/hooks/useTripStore';

export function ItinerarySection() {
  const store = useTripStore();
  const [viewMode, setViewMode] = useState<ItineraryViewMode>('timeline');
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const filterControls = useItineraryFilters(store.filters, store.setFilters);

  const allItems = useMemo(() => activeTripItinerary(store.trip), [store.trip]);
  const filteredItems = useMemo(() => itinerarySearchResults(store.trip, store.filters), [store.trip, store.filters]);
  const upcoming = useMemo(() => upcomingEvents(store.trip), [store.trip]);
  const today = useMemo(() => todaysEvents(store.trip), [store.trip]);
  const next = useMemo(() => nextReservation(store.trip), [store.trip]);
  const counts = useMemo(() => itineraryCountsByType(store.trip), [store.trip]);

  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedItemId) ?? null,
    [filteredItems, selectedItemId],
  );

  const linkedVaultItems = useMemo(() => {
    if (!selectedItem) return [];
    const linkedIds = new Set(selectedItem.linkedVaultItemIds);
    return store.trip.travelVaultItems.filter((vaultItem) => linkedIds.has(vaultItem.id));
  }, [store.trip.travelVaultItems, selectedItem]);

  const itemActions = {
    onEdit: (item: ItineraryItem) => {
      setEditingItem(item);
      setSelectedItemId(item.id);
    },
    onDelete: (item: ItineraryItem) => {
      if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
      store.removeItineraryItem(item.id);
      if (selectedItemId === item.id) {
        setSelectedItemId(null);
      }
      if (editingItem?.id === item.id) {
        setEditingItem(null);
      }
    },
    onDuplicate: (item: ItineraryItem) => {
      store.duplicateItineraryItem(item.id);
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Trip dashboard</p>
            <h1 className="mt-2 text-3xl font-black">{store.trip.name}</h1>
            <p className="mt-1 text-sm text-slate-300">
              {store.trip.destination} • {store.trip.startDate} → {store.trip.endDate}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-right text-xs text-slate-300">
            <p>Total itinerary items: {allItems.length}</p>
            <p>Travel Vault docs: {store.trip.travelVaultItems.length}</p>
          </div>
        </header>

        <ItineraryDashboard upcomingCount={upcoming.length} todayCount={today.length} nextReservation={next} countsByType={counts} />

        <ItineraryForm
          mode={editingItem ? 'edit' : 'create'}
          item={editingItem}
          vaultOptions={store.trip.travelVaultItems.map((item) => ({ id: item.id, label: item.title }))}
          onCancelEdit={() => setEditingItem(null)}
          onSubmit={(values) => {
            if (editingItem) {
              store.updateItineraryItem({ id: editingItem.id, ...values });
              setEditingItem(null);
              return;
            }
            store.addItineraryItem({ tripId: store.trip.id, ...values });
          }}
        />

        <ItineraryFilters
          filters={store.filters}
          tagsText={filterControls.tagsText}
          onQueryChange={filterControls.setQuery}
          onTypeChange={filterControls.setType}
          onStatusChange={filterControls.setStatus}
          onDateChange={filterControls.setDate}
          onTagsChange={filterControls.setTags}
          onSortDirectionChange={filterControls.setSortDirection}
          onReset={filterControls.reset}
        />

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">Itinerary views</h3>
            <div className="flex gap-2">
              {(['timeline', 'agenda', 'daily'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-full px-3 py-1 text-xs ${viewMode === mode ? 'bg-sky-400 text-slate-950' : 'border border-white/20 text-slate-200'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <ItineraryViews
              viewMode={viewMode}
              items={filteredItems}
              selectedItemId={selectedItemId}
              onSelectItem={setSelectedItemId}
              actions={itemActions}
            />
            <ItineraryDetailPanel selectedItem={selectedItem} linkedVaultItems={linkedVaultItems} />
          </div>
        </section>
      </div>
    </div>
  );
}
