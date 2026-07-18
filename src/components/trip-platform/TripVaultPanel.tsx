import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import type { VaultFilterKey, VaultSortKey } from '../../store/vaultDomain';
import { EmptyState, Field, Panel, PrimaryButton, SecondaryButton, StatusBanner, inputClassName } from './shared/ui';

export function TripVaultPanel() {
  const {
    vault,
    vaultTrips,
    vaultQuery,
    setVaultQuery,
    vaultFilter,
    setVaultFilter,
    vaultSort,
    setVaultSort,
    openVaultTrip,
    createVaultTripEntry,
    archiveVaultTrip,
    duplicateVaultTrip,
    deleteVaultTrip,
    toggleVaultFavourite,
    activeVaultTrip,
  } = useSharedTripStore();
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <Panel
      title="Trip vault"
      description="Manage multiple trips locally — open, favourite, archive, duplicate, or delete."
      actions={
        <PrimaryButton
          type="button"
          onClick={() => {
            createVaultTripEntry({ tripName: 'New vault trip', status: 'draft' });
            setFeedback('Created a new draft trip in the vault.');
          }}
        >
          New trip
        </PrimaryButton>
      }
    >
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Field label="Search vault" htmlFor="vault-query">
          <input
            id="vault-query"
            className={inputClassName}
            value={vaultQuery}
            onChange={(event) => setVaultQuery(event.target.value)}
            placeholder="Name, destination, notes…"
          />
        </Field>
        <Field label="Filter" htmlFor="vault-filter">
          <select
            id="vault-filter"
            className={inputClassName}
            value={vaultFilter}
            onChange={(event) => setVaultFilter(event.target.value as VaultFilterKey)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
            <option value="favourites">Favourites</option>
          </select>
        </Field>
        <Field label="Sort" htmlFor="vault-sort">
          <select
            id="vault-sort"
            className={inputClassName}
            value={vaultSort}
            onChange={(event) => setVaultSort(event.target.value as VaultSortKey)}
          >
            <option value="lastOpened">Last opened</option>
            <option value="name">Name</option>
            <option value="departure">Departure</option>
            <option value="updated">Updated</option>
            <option value="favourite">Favourites first</option>
          </select>
        </Field>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        {vault.trips.length} trip(s) in vault · Active: {activeVaultTrip.tripName}
      </p>

      <div className="mt-4 space-y-3">
        {vaultTrips.length === 0 ? (
          <EmptyState title="No trips match" body="Adjust search or filter, or create a new trip." />
        ) : (
          vaultTrips.map((trip) => {
            const active = trip.id === vault.activeTripId;
            return (
              <article
                key={trip.id}
                className={`rounded-2xl border px-4 py-3 ${
                  active ? 'border-sky-300/40 bg-sky-500/10' : 'border-white/10 bg-slate-950/40'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-medium text-white">
                      {trip.favourite ? '★ ' : ''}
                      {trip.tripName}
                      {active ? ' · open' : ''}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {trip.destination || 'No destination'} · {trip.status} · {trip.departureDate || 'No dates'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last opened {new Date(trip.lastOpenedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        const result = openVaultTrip(trip.id);
                        setFeedback(result.message);
                      }}
                    >
                      Open
                    </SecondaryButton>
                    <SecondaryButton type="button" onClick={() => toggleVaultFavourite(trip.id)}>
                      {trip.favourite ? 'Unfavourite' : 'Favourite'}
                    </SecondaryButton>
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        archiveVaultTrip(trip.id);
                        setFeedback('Trip archived.');
                      }}
                    >
                      Archive
                    </SecondaryButton>
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        const result = duplicateVaultTrip(trip.id);
                        setFeedback(result.message);
                      }}
                    >
                      Duplicate
                    </SecondaryButton>
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        const result = deleteVaultTrip(trip.id);
                        setFeedback(result.message);
                      }}
                    >
                      Delete
                    </SecondaryButton>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </Panel>
  );
}
