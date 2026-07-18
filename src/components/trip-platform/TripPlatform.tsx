import { useEffect, useState } from 'react';
import { TripStoreProvider } from '../../store/TripStoreContext';
import { TripWorkspace } from '../TripWorkspace';
import { BookingsManager } from './BookingsManager';
import { BudgetTracker } from './BudgetTracker';
import { DailyItineraryBoard } from './DailyItineraryBoard';
import { PackingListsPanel } from './PackingListsPanel';
import { TravellerProfilesPanel } from './TravellerProfilesPanel';
import { TripOverviewDashboard } from './TripOverviewDashboard';
import { TripSetupForm } from './TripSetupForm';

const TABS = [
  { id: 'setup', label: 'Trip setup' },
  { id: 'overview', label: 'Overview' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'budget', label: 'Budget' },
  { id: 'packing', label: 'Packing' },
  { id: 'travellers', label: 'Travellers' },
  { id: 'system', label: 'Backup & integrity' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function TripPlatformInner() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [focusTabId, setFocusTabId] = useState<TabId | null>(null);

  useEffect(() => {
    if (!focusTabId) return;
    document.getElementById(`trip-platform-tab-${focusTabId}`)?.focus();
    setFocusTabId(null);
  }, [activeTab, focusTabId]);

  const activateTab = (tabId: TabId, moveFocus = false) => {
    setActiveTab(tabId);
    if (moveFocus) {
      setFocusTabId(tabId);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-6 pb-16" aria-label="Trip platform">
      <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950/40 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-300">Travel Buddy</p>
        <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">Trip platform</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Slices 29–36: create trips, plan days, manage bookings, budgets, packing, and travellers — all on the verified local-first store.
        </p>
        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Trip platform sections" role="tablist">
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`trip-platform-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`trip-platform-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => activateTab(tab.id)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
                    return;
                  }
                  event.preventDefault();
                  const currentIndex = TABS.findIndex((entry) => entry.id === activeTab);
                  let nextIndex = currentIndex;
                  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TABS.length;
                  if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
                  if (event.key === 'Home') nextIndex = 0;
                  if (event.key === 'End') nextIndex = TABS.length - 1;
                  const nextTab = TABS[nextIndex];
                  if (!nextTab) return;
                  activateTab(nextTab.id, true);
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
                  selected
                    ? 'bg-sky-400/20 text-sky-100'
                    : 'border border-white/15 text-slate-300 hover:border-sky-300/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        className="space-y-6"
        role="tabpanel"
        id={`trip-platform-panel-${activeTab}`}
        aria-labelledby={`trip-platform-tab-${activeTab}`}
      >
        {activeTab === 'setup' ? <TripSetupForm /> : null}
        {activeTab === 'overview' ? <TripOverviewDashboard /> : null}
        {activeTab === 'itinerary' ? <DailyItineraryBoard /> : null}
        {activeTab === 'bookings' ? <BookingsManager /> : null}
        {activeTab === 'budget' ? <BudgetTracker /> : null}
        {activeTab === 'packing' ? <PackingListsPanel /> : null}
        {activeTab === 'travellers' ? <TravellerProfilesPanel /> : null}
        {activeTab === 'system' ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-2 md:p-4">
            <p className="mb-3 px-2 text-sm text-slate-300">
              Existing Slices 9–28 backup, snapshot, diagnostics, and integrity tools remain available here.
            </p>
            <TripWorkspace />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function TripPlatform() {
  return (
    <TripStoreProvider>
      <TripPlatformInner />
    </TripStoreProvider>
  );
}
