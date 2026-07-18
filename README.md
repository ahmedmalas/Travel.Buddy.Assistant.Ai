# Travel Buddy Assistant AI

Travel Buddy Assistant AI is an AI-powered travel planning and concierge application designed to help users research, compare, plan, organise, and manage travel from one place.

The long-term product vision is not a simple itinerary builder. The goal is to build a travel super-assistant that acts as close to a human travel agent and concierge as possible, helping users with flights, hotels, destination research, neighbourhood recommendations, bookings, restaurants, sightseeing, activities, tours, taxis, private chauffeurs, cruises, and travel guidance before, during, and after a trip.

## Current verified baseline

`main` includes:

- **Slices 9–28** local-first backup/integrity platform (PR #7)
- **Slices 29–36** Trip Platform (PR #9)

Active development adds **Slices 37–44** Vault Platform capabilities:

- Multi-trip vault with favourites, archive, duplicate, search/filter/sort
- Trip templates (defaults + save/create/manage)
- Calendar planner (month/week/day, drag-and-drop, conflicts)
- Document metadata + expiry reminders (no file uploads)
- Global search across vault entities
- Collaboration foundation (local roles/permissions/audit; no backend sync)
- Vault/template import & migration (backup version **4**)
- Shared `useTripStore` persistence with compatibility for snapshots/diagnostics/integrity
- Vitest + Testing Library automation with `npm run validate`

See [`docs/completed-slices.md`](docs/completed-slices.md) for the full slice inventory and verification notes.

This baseline remains **local-first**. It does not claim live provider inventory, cloud sync, accounts, or booking execution.

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run validate
```

## Product modules

Current verified surfaces:

- Multi-trip vault and templates
- Trip itinerary + calendar planning (local)
- Bookings, budget, packing, travellers, documents (metadata)
- Backup / import / export / vault migration
- Snapshot history and restore
- Storage diagnostics and integrity audit/repair

Placeholder product areas still ahead of live integrations:

- Destination discovery with live inventory
- AI travel assistant with live supplier access
- Backend collaboration sync

## Integration direction

The app is intentionally structured so future phases can add integrations through approved APIs and provider relationships, including search providers, maps, flights, hotels, booking platforms, restaurants, tours, transfers, cruises, affiliate networks, and private travel suppliers.

The MVP must not pretend to have unlimited access. It should clearly separate planned capabilities from active integrations.
