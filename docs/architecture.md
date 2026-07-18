# Architecture

Travel Buddy Assistant AI is a React, Vite, TypeScript, and Tailwind frontend with a local-first trip data platform.

## Verified baseline architecture (Slices 9–52)

- `src/main.ts` mounts the React application.
- `src/App.tsx` renders the top-level app shell.
- `src/components/AppShell.tsx` hosts marketing placeholders and mounts `TripPlatform`.
- `src/components/trip-platform/` contains Slices 29–52 user-facing modules; heavy panels are lazy-loaded.
- `src/components/TripWorkspace.tsx` remains the Slices 9–28 backup/snapshot/integrity UI (Backup & integrity tab).
- `src/store/TripStoreContext.tsx` provides one shared `useTripStore` instance to all platform panels.
- `src/store/storeConstants.ts` centralises storage keys and backup/version constants.
- `src/store/modules/` indexes extracted domain modules for Slice 45 decomposition.
- `src/store/tripDomain.ts` owns trip domain types, validation, and trip-level migration.
- `src/store/vaultDomain.ts` owns multi-trip vault, templates, documents, and collaboration types/migrations.
- `src/store/repositories/` defines cloud-ready repository interfaces with a localStorage provider (Supabase planned, not connected).
- `src/store/auth/`, `sync/`, `notifications/`, `commandCentre/`, `collaboration/` hold foundation modules for Slices 47–51.
- `src/store/platformCalculations.ts` owns deterministic budget/packing/itinerary/overview math.
- `src/store/vaultCalculations.ts` owns vault filter/sort, global search, calendar helpers, expiry reminders, permissions.
- `src/store/useTripStore.ts` orchestrates persistence, undo/redo, backup/snapshots, integrity, vault, and foundation APIs.
- `src/store/integrityCalculations.ts` holds deterministic integrity scoring/trend/accuracy helpers.
- `docs` records product scope, architecture, and completed-slice verification.

## Persistence model

All trip, vault, template, snapshot, and integrity history state persists in browser `localStorage` keys managed by `useTripStore`. There is no backend database in this baseline.

Key localStorage keys:

- `travel-buddy:trip-state:v1` — active trip
- `travel-buddy:trip-vault:v1` — multi-trip vault
- `travel-buddy:trip-templates:v1` — trip templates
- `travel-buddy:trip-snapshots:v1` — snapshot history
- integrity history / baseline / repair backup keys (Slices 9–28)

Key local-first capabilities:

- Trip backup schema validation and import preview (backup version **4**, supports v2+)
- Vault backup schema `travel-buddy-vault-backup`
- Automatic snapshot history with retention and pin protection
- Integrity audit history, baselines, analytics, and diagnostics
- Repair simulation with accuracy classification (`Exact Match`, `Partial Match`, `Diverged`)

## Validation architecture

- Vitest + Testing Library (`npm test`, `npm run test:coverage`)
- Release gate: `npm run validate` (`typecheck` + `test` + `build`)
- Coverage thresholds enforce a minimum automated safety net for the backup/integrity/vault platform

## Long-term architecture direction

The product should be built for future integrations rather than hardcoded fake access.

Planned integration categories include:

- AI assistant and itinerary generation
- Search and discovery providers
- Maps and location intelligence
- Flight providers and fare comparison APIs
- Hotels and accommodation providers
- Booking agents and affiliate providers
- Restaurants and local experience providers
- Tours, activities, cruises, transfers, taxis, and chauffeur services
- User account, saved trip, booking, and document storage
- Backend collaboration sync

## Principle

The MVP should clearly separate available functionality from future planned integrations. Do not claim live provider access until integrations are actually implemented and verified.
