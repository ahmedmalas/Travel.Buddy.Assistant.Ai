# Travel Buddy Assistant AI

Travel Buddy Assistant AI is an AI-powered travel planning and concierge application designed to help users research, compare, plan, organise, and manage travel from one place.

The long-term product vision is not a simple itinerary builder. The goal is to build a travel super-assistant that acts as close to a human travel agent and concierge as possible, helping users with flights, hotels, destination research, neighbourhood recommendations, bookings, restaurants, sightseeing, activities, tours, taxis, private chauffeurs, cruises, and travel guidance before, during, and after a trip.

## Current verified baseline

`main` includes the completed **Slices 9–28** local-first backup/integrity platform (PR #7).

Active development adds **Slices 29–36** Trip Platform capabilities on top of the same store:

- React + Vite + TypeScript + Tailwind CSS
- Trip setup, overview dashboard, day-by-day itinerary
- Bookings, budget tracker, packing lists, traveller profiles
- Shared `useTripStore` persistence + backup version 3 migration
- Backup/snapshot/integrity tooling preserved under Backup & integrity
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

- Trip itinerary planning (local)
- Backup / import / export
- Snapshot history and restore
- Storage diagnostics and integrity audit/repair

Placeholder product areas still ahead of live integrations:

- Destination discovery
- Budget and cost estimation
- Booking organisation across providers
- AI travel assistant with live supplier access

## Integration direction

The app is intentionally structured so future phases can add integrations through approved APIs and provider relationships, including search providers, maps, flights, hotels, booking platforms, restaurants, tours, transfers, cruises, affiliate networks, and private travel suppliers.

The MVP must not pretend to have unlimited access. It should clearly separate planned capabilities from active integrations.
