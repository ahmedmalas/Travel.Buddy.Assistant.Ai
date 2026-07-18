# Travel Buddy Assistant AI

Travel Buddy Assistant AI is an AI-powered travel planning and concierge application designed to help users research, compare, plan, organise, and manage travel from one place.

The long-term product vision is not a simple itinerary builder. The goal is to build a travel super-assistant that acts as close to a human travel agent and concierge as possible, helping users with flights, hotels, destination research, neighbourhood recommendations, bookings, restaurants, sightseeing, activities, tours, taxis, private chauffeurs, cruises, and travel guidance before, during, and after a trip.

## Current verified baseline

`main` includes:

- **Slices 9–28** local-first backup/integrity platform (PR #7)
- **Slices 29–36** Trip Platform (PR #9)
- **Slices 37–44** Vault Platform (PR #10)
- **Slices 45–52** Platform Foundation (PR #12, merge `eb081af`)

Active development adds **Slices 53–60** Supabase cloud foundation:

- Supabase client/env validation + in-repo migrations/RLS (remote apply blocked until Travel Buddy project verified)
- Live auth adapters with local/demo fallback
- Cloud trip persistence + local→cloud migration + offline fallback
- Real push/pull sync with deterministic conflict resolution
- Collaboration cloud hooks + permission enforcement
- Secure document storage helpers (private bucket, signed URLs)
- Account/workspace settings + export + deletion safeguards

Local/demo mode remains the default and preserves all Slices 9–52 behaviour.

See [`docs/completed-slices.md`](docs/completed-slices.md) for the full slice inventory and verification notes.

## Supabase configuration

Copy `.env.example` to `.env.local` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (publishable/anon only — never service role)
- optional `VITE_SUPABASE_PROJECT_REF`

SQL migrations live in `supabase/migrations/`. Do not apply them to unrelated projects.

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
- Bookings, budget, packing, travellers, documents
- Command centre, notifications, auth, sync, account settings
- Backup / import / export / vault migration
- Snapshot history and restore
- Storage diagnostics and integrity audit/repair

Placeholder product areas still ahead of live integrations:

- Destination discovery with live inventory
- AI travel assistant with live supplier access
- Verified remote Supabase project linkage for production cloud mode

## Integration direction

The app is intentionally structured so future phases can add integrations through approved APIs and provider relationships, including search providers, maps, flights, hotels, booking platforms, restaurants, tours, transfers, cruises, affiliate networks, and private travel suppliers.

The MVP must not pretend to have unlimited access. It should clearly separate planned capabilities from active integrations.
