# Architecture

Travel Buddy Assistant AI is a React, Vite, TypeScript, and Tailwind frontend with a local-first trip data platform.

## Verified baseline architecture (Slices 9–28)

- `src/main.ts` mounts the React application.
- `src/App.tsx` renders the top-level app shell.
- `src/components/AppShell.tsx` hosts marketing placeholders and mounts `TripWorkspace`.
- `src/components/TripWorkspace.tsx` is the primary trip/backup/integrity UI surface.
- `src/components/trip-workspace/comparisonUtils.ts` holds pure snapshot comparison helpers.
- `src/store/useTripStore.ts` owns trip state, undo/redo, backup/snapshot persistence, storage health, and integrity workflows.
- `src/store/integrityCalculations.ts` holds deterministic integrity scoring/trend/accuracy helpers.
- `src/data` contains early static product/module definitions.
- `docs` records product scope, architecture, and completed-slice verification.

## Persistence model

All trip, snapshot, and integrity history state persists in browser `localStorage` keys managed by `useTripStore`. There is no backend database in this baseline.

Key local-first capabilities:

- Trip backup schema validation and import preview
- Automatic snapshot history with retention and pin protection
- Integrity audit history, baselines, analytics, and diagnostics
- Repair simulation with accuracy classification (`Exact Match`, `Partial Match`, `Diverged`)

## Validation architecture

- Vitest + Testing Library (`npm test`, `npm run test:coverage`)
- Release gate: `npm run validate` (`typecheck` + `test` + `build`)
- Coverage thresholds enforce a minimum automated safety net for the backup/integrity platform

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

## Principle

The MVP should clearly separate available functionality from future planned integrations. Do not claim live provider access until integrations are actually implemented and verified.
