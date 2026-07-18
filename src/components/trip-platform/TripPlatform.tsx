import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react';
import { TripStoreProvider } from '../../store/TripStoreContext';

const TripWorkspace = lazy(() =>
  import('../TripWorkspace').then((module) => ({ default: module.TripWorkspace })),
);
const BookingsManager = lazy(() =>
  import('./BookingsManager').then((module) => ({ default: module.BookingsManager })),
);
const BudgetTracker = lazy(() =>
  import('./BudgetTracker').then((module) => ({ default: module.BudgetTracker })),
);
const CalendarPlanner = lazy(() =>
  import('./CalendarPlanner').then((module) => ({ default: module.CalendarPlanner })),
);
const CollaborationPanel = lazy(() =>
  import('./CollaborationPanel').then((module) => ({ default: module.CollaborationPanel })),
);
const DailyItineraryBoard = lazy(() =>
  import('./DailyItineraryBoard').then((module) => ({ default: module.DailyItineraryBoard })),
);
const DocumentsPanel = lazy(() =>
  import('./DocumentsPanel').then((module) => ({ default: module.DocumentsPanel })),
);
const GlobalSearchPanel = lazy(() =>
  import('./GlobalSearchPanel').then((module) => ({ default: module.GlobalSearchPanel })),
);
const ImportMigrationPanel = lazy(() =>
  import('./ImportMigrationPanel').then((module) => ({ default: module.ImportMigrationPanel })),
);
const PackingListsPanel = lazy(() =>
  import('./PackingListsPanel').then((module) => ({ default: module.PackingListsPanel })),
);
const TravellerProfilesPanel = lazy(() =>
  import('./TravellerProfilesPanel').then((module) => ({ default: module.TravellerProfilesPanel })),
);
const TripOverviewDashboard = lazy(() =>
  import('./TripOverviewDashboard').then((module) => ({ default: module.TripOverviewDashboard })),
);
const TripSetupForm = lazy(() =>
  import('./TripSetupForm').then((module) => ({ default: module.TripSetupForm })),
);
const TripTemplatesPanel = lazy(() =>
  import('./TripTemplatesPanel').then((module) => ({ default: module.TripTemplatesPanel })),
);
const TripVaultPanel = lazy(() =>
  import('./TripVaultPanel').then((module) => ({ default: module.TripVaultPanel })),
);
const AuthShellPanel = lazy(() =>
  import('./AuthShellPanel').then((module) => ({ default: module.AuthShellPanel })),
);
const SyncEnginePanel = lazy(() =>
  import('./SyncEnginePanel').then((module) => ({ default: module.SyncEnginePanel })),
);
const NotificationCentrePanel = lazy(() =>
  import('./NotificationCentrePanel').then((module) => ({ default: module.NotificationCentrePanel })),
);
const CommandCentreDashboard = lazy(() =>
  import('./CommandCentreDashboard').then((module) => ({ default: module.CommandCentreDashboard })),
);
const AccountSettingsPanel = lazy(() =>
  import('./AccountSettingsPanel').then((module) => ({ default: module.AccountSettingsPanel })),
);

const TABS = [
  { id: 'command', label: 'Command centre' },
  { id: 'vault', label: 'Vault' },
  { id: 'setup', label: 'Trip setup' },
  { id: 'overview', label: 'Overview' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'budget', label: 'Budget' },
  { id: 'packing', label: 'Packing' },
  { id: 'travellers', label: 'Travellers' },
  { id: 'documents', label: 'Documents' },
  { id: 'templates', label: 'Templates' },
  { id: 'search', label: 'Search' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'auth', label: 'Auth' },
  { id: 'sync', label: 'Sync' },
  { id: 'account', label: 'Account' },
  { id: 'import', label: 'Import' },
  { id: 'system', label: 'Backup & integrity' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function PanelFallback() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-sm text-slate-300" role="status">
      Loading panel…
    </div>
  );
}

function LazyPanel({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PanelFallback />}>{children}</Suspense>;
}

function TripPlatformInner() {
  const [activeTab, setActiveTab] = useState<TabId>('command');
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

  const panels: Record<TabId, ComponentType<{ onNavigate?: (tab: string) => void }> | ComponentType> = {
    command: CommandCentreDashboard,
    vault: TripVaultPanel,
    setup: TripSetupForm,
    overview: TripOverviewDashboard,
    itinerary: DailyItineraryBoard,
    calendar: CalendarPlanner,
    bookings: BookingsManager,
    budget: BudgetTracker,
    packing: PackingListsPanel,
    travellers: TravellerProfilesPanel,
    documents: DocumentsPanel,
    templates: TripTemplatesPanel,
    search: GlobalSearchPanel,
    notifications: NotificationCentrePanel,
    collaboration: CollaborationPanel,
    auth: AuthShellPanel,
    sync: SyncEnginePanel,
    account: AccountSettingsPanel,
    import: ImportMigrationPanel,
    system: () => (
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-2 md:p-4">
        <p className="mb-3 px-2 text-sm text-slate-300">
          Existing Slices 9–28 backup, snapshot, diagnostics, and integrity tools remain available here.
        </p>
        <TripWorkspace />
      </div>
    ),
  };

  const ActivePanel = panels[activeTab];

  return (
    <section className="mx-auto max-w-7xl px-6 pb-16" aria-label="Trip platform">
      <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950/40 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-300">Travel Buddy</p>
        <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">Trip platform</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Slices 9–60: local-first platform with optional Supabase cloud adapters (auth, persistence, sync, collaboration,
          secure documents, account settings). Local/demo mode remains the default until a verified Travel Buddy project is linked.
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
        <LazyPanel>
          {activeTab === 'command' ? (
            <CommandCentreDashboard
              onNavigate={(tab) => {
                if (TABS.some((entry) => entry.id === tab)) {
                  activateTab(tab as TabId);
                }
              }}
            />
          ) : (
            <ActivePanel />
          )}
        </LazyPanel>
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
