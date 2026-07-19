# Travel Buddy Assistant AI

Travel Buddy Assistant AI is an AI-powered travel planning and concierge application designed to help users research, compare, plan, organise, and manage travel from one place.

## Current verified baseline

`main` includes Slices **9–72**. Active feature work adds **Slices 73–88 — Super Deal Engine & Partner Platform**:

- Provider-neutral mock adapters across flights, stays, ground, activities, insurance, eSIM, parking
- Universal fee-inclusive offer model + explainable ranking (commission-independent)
- Flight/stay super-search, whole-trip deal builder, flexible discovery
- Comparison/handoff checklist (no in-app payments)
- Price alerts (simulated), preference profiles, trust centre
- Affiliate attribution + partner centre + onboarding framework
- Growth foundations (landings, referrals, savings reports) without fabricated metrics

Local/demo mode remains the default. Cloud mode stays inactive unless a verified Travel Buddy Supabase project is linked.

Backup schema version: **6** (imports v2–v6).

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

## Still required before real deal searching

1. Approved commercial partnerships + sandbox/production credentials (server-side / env only)
2. Live adapters registered behind the existing adapter contract
3. Legal review of affiliate disclosures and brand usage
4. Verified Travel Buddy Supabase project + apply in-repo migrations/RLS/storage (for cloud)
5. Production deploy + monitoring

## Integration direction

Future phases add approved APIs for search, maps, flights, hotels, booking platforms, restaurants, tours, transfers, cruises, and AI assistance. The product must not pretend those integrations exist until they are implemented and verified.
