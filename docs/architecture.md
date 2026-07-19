# Architecture

Travel Buddy Assistant AI is a React, Vite, TypeScript, and Tailwind frontend with a local-first trip data platform, optional Supabase cloud adapters (Slices 53–60), and a frontend-complete logistics/prep surface (Slices 61–72).

## Verified baseline architecture (Slices 9–72)

- `src/main.ts` mounts the React application.
- `src/App.tsx` renders the top-level app shell.
- `src/components/AppShell.tsx` hosts marketing placeholders and mounts `TripPlatform`.
- `src/components/ErrorBoundary.tsx` provides panel/app failure recovery UI.
- `src/components/trip-platform/` contains Slices 29–72 user-facing modules; heavy panels are lazy-loaded.
- Navigation is grouped (Home / Trip / Logistics / Prep & safety / System) with a mobile section selector to reduce crowded tab bars.
- `src/components/TripWorkspace.tsx` remains the Slices 9–28 backup/snapshot/integrity UI (Backup & integrity tab).
- `src/store/TripStoreContext.tsx` provides one shared `useTripStore` instance to all platform panels.
- `src/store/storeConstants.ts` centralises storage keys and backup/version constants (`BACKUP_VERSION = 5`).
- `src/store/tripDomain.ts` owns core trip types/migration and embeds travel-ops collections.
- `src/store/travelOpsDomain.ts` owns destinations, flights, stays, transport, maps, checklists, emergency, journal.
- `src/store/smartAssistance.ts` owns deterministic rule-based suggestions (no external AI).
- `src/store/onboarding.ts` owns dismissible product onboarding progress.
- `src/store/vaultDomain.ts` owns multi-trip vault, templates, documents, and collaboration types/migrations.
- `src/store/repositories/` defines repository interfaces with localStorage + Supabase providers.
- `src/lib/supabase/` owns env validation and the Supabase client factory.
- `supabase/migrations/` holds schema, RLS, and private storage SQL (apply only to a verified Travel Buddy project).
- `src/store/useTripStore.ts` orchestrates persistence, undo/redo, backup/snapshots, integrity, vault, cloud, and travel-ops APIs.

## Persistence model

### Local-first (default)

All trip, vault, template, snapshot, travel-ops, and integrity history state persists in browser `localStorage`. Local/demo mode remains fully functional without Supabase env vars.

Trip backups use schema version **5** and remain import-compatible with versions **2–5**.

### Optional Supabase cloud

When `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are present **and** a Travel Buddy project target is verified, the app can authenticate, persist, sync, and store private documents. Until then, cloud mode stays disabled/fallback-local.

## Validation architecture

- Vitest + Testing Library (`npm test`, `npm run test:coverage`)
- Release gate: `npm run validate` (`typecheck` + `test` + `build`)

## Explicit non-goals (still)

- Live flight/hotel/map/AI provider APIs
- Paid third-party services
- Auto-deploy / auto-merge of divergent older PRs (#1, #3, #6)
