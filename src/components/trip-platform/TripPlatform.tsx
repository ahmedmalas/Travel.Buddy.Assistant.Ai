import { Suspense, lazy, useEffect, useMemo, useState, type ComponentType } from 'react';
import { TripStoreProvider, useSharedTripStore } from '../../store/TripStoreContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { StatusBadge } from './shared/ui';

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
const DestinationsPanel = lazy(() =>
  import('./DestinationsPanel').then((module) => ({ default: module.DestinationsPanel })),
);
const FlightsPanel = lazy(() =>
  import('./FlightsPanel').then((module) => ({ default: module.FlightsPanel })),
);
const StaysPanel = lazy(() =>
  import('./StaysPanel').then((module) => ({ default: module.StaysPanel })),
);
const GroundTransportPanel = lazy(() =>
  import('./GroundTransportPanel').then((module) => ({ default: module.GroundTransportPanel })),
);
const MapsRoutesPanel = lazy(() =>
  import('./MapsRoutesPanel').then((module) => ({ default: module.MapsRoutesPanel })),
);
const ChecklistCentrePanel = lazy(() =>
  import('./ChecklistCentrePanel').then((module) => ({ default: module.ChecklistCentrePanel })),
);
const EmergencyCentrePanel = lazy(() =>
  import('./EmergencyCentrePanel').then((module) => ({ default: module.EmergencyCentrePanel })),
);
const JournalPanel = lazy(() =>
  import('./JournalPanel').then((module) => ({ default: module.JournalPanel })),
);
const AssistancePanel = lazy(() =>
  import('./AssistancePanel').then((module) => ({ default: module.AssistancePanel })),
);
const OnboardingPanel = lazy(() =>
  import('./OnboardingPanel').then((module) => ({ default: module.OnboardingPanel })),
);

const NAV_GROUPS = [
  {
    id: 'home',
    label: 'Home',
    tabs: [
      { id: 'command', label: 'Command centre' },
      { id: 'onboarding', label: 'Onboarding' },
      { id: 'assistance', label: 'Assistance' },
      { id: 'notifications', label: 'Notifications' },
    ],
  },
  {
    id: 'trip',
    label: 'Trip',
    tabs: [
      { id: 'vault', label: 'Vault' },
      { id: 'setup', label: 'Trip setup' },
      { id: 'overview', label: 'Overview' },
      { id: 'itinerary', label: 'Itinerary' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'destinations', label: 'Destinations' },
    ],
  },
  {
    id: 'logistics',
    label: 'Logistics',
    tabs: [
      { id: 'flights', label: 'Flights' },
      { id: 'stays', label: 'Stays' },
      { id: 'transport', label: 'Transport' },
      { id: 'maps', label: 'Maps & routes' },
      { id: 'bookings', label: 'Bookings' },
      { id: 'budget', label: 'Budget' },
    ],
  },
  {
    id: 'prep',
    label: 'Prep & safety',
    tabs: [
      { id: 'checklist', label: 'Checklist' },
      { id: 'packing', label: 'Packing' },
      { id: 'travellers', label: 'Travellers' },
      { id: 'documents', label: 'Documents' },
      { id: 'emergency', label: 'Emergency' },
      { id: 'journal', label: 'Journal' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    tabs: [
      { id: 'templates', label: 'Templates' },
      { id: 'search', label: 'Search' },
      { id: 'collaboration', label: 'Collaboration' },
      { id: 'auth', label: 'Auth' },
      { id: 'sync', label: 'Sync' },
      { id: 'account', label: 'Account' },
      { id: 'import', label: 'Import' },
      { id: 'system', label: 'Backup & integrity' },
    ],
  },
] as const;

type TabId = (typeof NAV_GROUPS)[number]['tabs'][number]['id'];
type NavTab = { id: TabId; label: string };

const ALL_TABS: NavTab[] = NAV_GROUPS.flatMap((group) => [...group.tabs] as NavTab[]);

function PanelFallback() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-sm text-slate-300" role="status">
      Loading panel…
    </div>
  );
}

function LazyPanel({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary title="Panel failed to load">
      <Suspense fallback={<PanelFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function TripPlatformInner() {
  const [activeTab, setActiveTab] = useState<TabId>('command');
  const [activeGroup, setActiveGroup] = useState<(typeof NAV_GROUPS)[number]['id']>('home');
  const [focusTabId, setFocusTabId] = useState<TabId | null>(null);
  const { onboardingState, smartAssistance, unreadNotifications } = useSharedTripStore();

  useEffect(() => {
    if (!focusTabId) return;
    document.getElementById(`trip-platform-tab-${focusTabId}`)?.focus();
    setFocusTabId(null);
  }, [activeTab, focusTabId]);

  const groupTabs = useMemo<NavTab[]>(
    () => [...(NAV_GROUPS.find((group) => group.id === activeGroup)?.tabs ?? NAV_GROUPS[0]!.tabs)] as NavTab[],
    [activeGroup],
  );

  const activateTab = (tabId: TabId, moveFocus = false) => {
    const group = NAV_GROUPS.find((entry) => entry.tabs.some((tab) => tab.id === tabId));
    if (group) setActiveGroup(group.id);
    setActiveTab(tabId);
    if (moveFocus) setFocusTabId(tabId);
  };

  const panels: Record<TabId, ComponentType<{ onNavigate?: (tab: string) => void }> | ComponentType> = {
    command: CommandCentreDashboard,
    onboarding: OnboardingPanel,
    assistance: AssistancePanel,
    vault: TripVaultPanel,
    setup: TripSetupForm,
    overview: TripOverviewDashboard,
    itinerary: DailyItineraryBoard,
    calendar: CalendarPlanner,
    destinations: DestinationsPanel,
    flights: FlightsPanel,
    stays: StaysPanel,
    transport: GroundTransportPanel,
    maps: MapsRoutesPanel,
    bookings: BookingsManager,
    budget: BudgetTracker,
    checklist: ChecklistCentrePanel,
    packing: PackingListsPanel,
    travellers: TravellerProfilesPanel,
    documents: DocumentsPanel,
    emergency: EmergencyCentrePanel,
    journal: JournalPanel,
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
    <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6" aria-label="Trip platform">
      <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950/40 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-300">Travel Buddy</p>
            <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">Trip platform</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Slices 9–72 frontend-complete: logistics, prep, emergency, journal, rule-based assistance, and polished
              navigation — local/demo by default, optional cloud when verified.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!onboardingState.dismissed ? <StatusBadge label="Onboarding" tone="info" /> : null}
            {smartAssistance.length > 0 ? (
              <StatusBadge label={`${smartAssistance.length} tips`} tone="warning" />
            ) : null}
            {unreadNotifications > 0 ? (
              <StatusBadge label={`${unreadNotifications} alerts`} tone="danger" />
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Platform sections" role="tablist">
            {NAV_GROUPS.map((group) => {
              const selected = activeGroup === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveGroup(group.id);
                    const first = group.tabs[0];
                    if (first) activateTab(first.id);
                  }}
                  className={`whitespace-nowrap rounded-2xl px-4 py-2.5 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
                    selected
                      ? 'bg-sky-400/20 text-sky-100'
                      : 'border border-white/15 text-slate-300 hover:border-sky-300/50'
                  }`}
                >
                  {group.label}
                </button>
              );
            })}
          </nav>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400 md:hidden" htmlFor="trip-platform-mobile-nav">
              Section screen
            </label>
            <select
              id="trip-platform-mobile-nav"
              className="mb-3 w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white md:hidden"
              value={activeTab}
              onChange={(event) => activateTab(event.target.value as TabId)}
            >
              {ALL_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>

            <nav className="hidden flex-wrap gap-2 md:flex" aria-label={`${activeGroup} screens`} role="tablist">
              {groupTabs.map((tab) => {
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
                      const currentIndex = groupTabs.findIndex((entry) => entry.id === activeTab);
                      let nextIndex = currentIndex;
                      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % groupTabs.length;
                      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + groupTabs.length) % groupTabs.length;
                      if (event.key === 'Home') nextIndex = 0;
                      if (event.key === 'End') nextIndex = groupTabs.length - 1;
                      const nextTab = groupTabs[nextIndex];
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
        </div>
      </div>

      <div
        className="space-y-6"
        role="tabpanel"
        id={`trip-platform-panel-${activeTab}`}
        aria-labelledby={`trip-platform-tab-${activeTab}`}
      >
        <LazyPanel>
          {activeTab === 'command' || activeTab === 'onboarding' ? (
            activeTab === 'command' ? (
              <CommandCentreDashboard
                onNavigate={(tab) => {
                  if (ALL_TABS.some((entry) => entry.id === tab)) {
                    activateTab(tab as TabId);
                  }
                }}
              />
            ) : (
              <OnboardingPanel
                onNavigate={(tab) => {
                  if (ALL_TABS.some((entry) => entry.id === tab)) {
                    activateTab(tab as TabId);
                  }
                }}
              />
            )
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
      <ErrorBoundary title="Trip platform crashed">
        <TripPlatformInner />
      </ErrorBoundary>
    </TripStoreProvider>
  );
}
