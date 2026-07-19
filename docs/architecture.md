# Architecture

Travel Buddy Assistant AI is a React, Vite, TypeScript, and Tailwind frontend with a local-first trip data platform, optional Supabase cloud adapters, a provider-neutral Super Deal Engine (mock adapters), and finalisation tooling (Slices 89–100).

## Verified baseline architecture (Slices 9–100)

- `src/components/trip-platform/` — lazy-loaded product surfaces with grouped navigation (Home / Trip / Deals / Logistics / Prep & safety / System)
- `src/deal-engine/` — adapters, offers, ranking, search, alerts, affiliate/partner/growth
- `src/finalisation/` — universal import, trip health, offline, performance, a11y/security helpers, analytics, release, ops dashboard
- `src/store/useTripStore.ts` — orchestration + persistence for trip/vault/cloud/deal/finalisation state
- `BACKUP_VERSION = 7` (imports v2–v7)

See also [`docs/developer-platform.md`](developer-platform.md) for diagrams and contribution guidance.

## Persistence

Local-first `localStorage` by default. Optional Supabase when a verified Travel Buddy project is configured. Deal-engine and finalisation states use dedicated keys and participate in backup/clear flows.

## Performance

Vite `manualChunks` split vendor, deal-engine, and finalisation modules. Panels remain lazy-loaded. Virtual list helper supports large collections.

## Explicit non-goals

- Live commercial inventory without credentials + approval
- Payments / automatic booking
- Scraping
- Deploy / auto-merge of divergent older PRs (#1, #3, #6)
