import { EmptyState } from '../../../shared/components/EmptyState';
import { PlaceFiltersBar } from './PlaceFiltersBar';
import { PlaceCard } from './PlaceCard';
import { PlaceComposer } from './PlaceComposer';
import { PlaceNotesPanel } from './PlaceNotesPanel';
import { WorkspaceHeader } from './WorkspaceHeader';
import { useDestinationWorkspace } from '../hooks/useDestinationWorkspace';
import { useTripCommand } from '../../trip-command/state/useTripCommand';

export function DestinationWorkspace() {
  const workspace = useDestinationWorkspace();
  const { activeDestination } = useTripCommand();
  const mapReadyCount = workspace.places.filter((place) => workspace.isMapReady(place)).length;

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        destinationName={activeDestination ? `${activeDestination.name}, ${activeDestination.country}` : 'No active destination'}
        mapPointsCount={workspace.mapPoints.length}
        mapReadyCount={mapReadyCount}
        placesCount={workspace.places.length}
        reminderCounts={workspace.reminderCounts}
      />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <PlaceComposer onCreatePlace={workspace.addPlace} />
          <PlaceFiltersBar filters={workspace.filters} onResetFilters={workspace.resetFilters} onUpdateFilters={workspace.updateFilters} />

          {workspace.filteredPlaces.length === 0 ? (
            <EmptyState
              actionLabel="Clear filters"
              description="No place matches this scope yet. Expand filters or add a new destination checkpoint."
              onAction={workspace.resetFilters}
              title="No places in this command view"
            />
          ) : (
            <div className="space-y-3">
              {workspace.filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  mapReady={workspace.isMapReady(place)}
                  onSelect={() => workspace.setSelectedPlaceId(place.id)}
                  place={place}
                  reminderState={workspace.getReminderState(place)}
                  selected={workspace.selectedPlaceId === place.id}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <PlaceNotesPanel onAddNote={workspace.addNote} place={workspace.selectedPlace} />
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Map integration status</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Live map deferred by design</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Places already expose coordinates and fallback address structure for future map rendering. No external map provider is enabled in this slice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
