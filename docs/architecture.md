# Architecture

Travel Buddy Assistant AI is a React, Vite, TypeScript, and Tailwind frontend with a local-first trip data platform and optional Supabase cloud adapters (Slices 53–60).

## Verified baseline architecture (Slices 9–60)

- `src/main.ts` mounts the React application.
- `src/App.tsx` renders the top-level app shell.
- `src/components/AppShell.tsx` hosts marketing placeholders and mounts `TripPlatform`.
- `src/components/trip-platform/` contains Slices 29–60 user-facing modules; heavy panels are lazy-loaded.
- `src/components/TripWorkspace.tsx` remains the Slices 9–28 backup/snapshot/integrity UI (Backup & integrity tab).
- `src/store/TripStoreContext.tsx` provides one shared `useTripStore` instance to all platform panels.
- `src/store/storeConstants.ts` centralises storage keys and backup/version constants.
- `src/store/modules/` indexes extracted domain modules for Slice 45 decomposition.
- `src/store/tripDomain.ts` owns trip domain types, validation, and trip-level migration.
- `src/store/vaultDomain.ts` owns multi-trip vault, templates, documents, and collaboration types/migrations.
- `src/store/repositories/` defines repository interfaces with localStorage + Supabase providers.
- `src/lib/supabase/` owns env validation and the typed Supabase client factory.
- `supabase/migrations/` holds schema, RLS, and private storage SQL (apply only to a verified Travel Buddy project).
- `src/store/auth/`, `sync/`, `notifications/`, `commandCentre/`, `collaboration/`, `documents/`, `settings/` hold Slices 47–60 modules.
- `src/store/useTripStore.ts` orchestrates persistence, undo/redo, backup/snapshots, integrity, vault, and cloud APIs.
- `docs` records product scope, architecture, and completed-slice verification.

## Persistence model

### Local-first (default)

All trip, vault, template, snapshot, and integrity history state persists in browser `localStorage` keys managed by `useTripStore`. Local/demo mode remains fully functional without Supabase env vars.

### Optional Supabase cloud

When `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are present, the app can:

- Authenticate via Supabase Auth (with local fallback)
- Persist vault trips/templates through `createSupabaseDataRepositories`
- Push/pull sync revisions
- Store private document binaries in the `travel-documents` bucket (signed URLs)
- Sync account/profile preferences to `profiles`

**Important:** During Slices 53–60 delivery, no approved Travel Buddy Supabase project was verified among accessible organisations/projects. Remote migrations were therefore **not** applied. SQL is versioned in-repo for a future verified target.

## Security model

- Only publishable anon keys belong in the Vite client (see `.env.example`).
- Service-role keys must never be shipped to the browser.
- RLS policies in migrations enforce owner/editor/viewer access for trips, collaborators, documents, and storage objects.
- Document uploads validate MIME type and 10MB size limits before storage operations.
- Account deletion requires explicit confirmation and blocks when trips/sync queues remain.

## Validation architecture

- Vitest + Testing Library (`npm test`, `npm run test:coverage`)
- Release gate: `npm run validate` (`typecheck` + `test` + `build`)
- Coverage thresholds enforce a minimum automated safety net for the backup/integrity/vault/cloud foundation

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

## Principle

The MVP should clearly separate available functionality from future planned integrations. Do not claim live provider access until integrations are actually implemented and verified against an approved project.
