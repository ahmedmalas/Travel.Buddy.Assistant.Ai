# Travel Buddy Assistant AI

Travel Buddy Assistant AI is an AI-powered travel planning and concierge application designed to help users research, compare, plan, organise, and manage travel from one place.

## Current verified baseline

`main` includes Slices **9–60**. Active feature work completes the frontend product with Slices **61–72**:

- Destination intelligence, flights, stays, ground transport
- Maps/routes shell (manual estimates — no paid maps provider)
- Checklist centre, emergency centre, travel journal
- Rule-based smart assistance (no external AI)
- Grouped navigation + design-system polish
- Product onboarding
- Error boundaries, regression coverage, docs

Local/demo mode remains the default. Cloud mode stays inactive unless a verified Travel Buddy Supabase project is linked.

Backup schema version: **5** (imports v2–v5).

See [`docs/completed-slices.md`](docs/completed-slices.md) for the full inventory.

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

## Still required before calling Travel Buddy “fully complete” (beyond this frontend batch)

1. Verified Travel Buddy Supabase project + apply in-repo migrations/RLS/storage
2. Live auth/email delivery verification in that project
3. End-to-end cloud sync against the real project
4. Optional paid maps provider (if product requires live maps)
5. Live flight/hotel APIs (explicitly out of scope here)
6. AI concierge / generation features (explicitly out of scope here)
7. Production deploy + monitoring

## Integration direction

Future phases can add approved APIs for search, maps, flights, hotels, booking platforms, restaurants, tours, transfers, cruises, and AI assistance. The MVP must not pretend those integrations exist until they are implemented and verified.
