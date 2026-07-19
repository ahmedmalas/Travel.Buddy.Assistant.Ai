# Travel Buddy Assistant AI

Travel Buddy Assistant AI is an AI-powered travel planning and concierge application designed to help users research, compare, plan, organise, and manage travel from one place.

## Current verified baseline

`main` @ `5175d14` includes Slices **9–100**. Production activation work lives on `cursor/production-launch-03b5`.

- Local/demo mode remains the default until `VITE_SUPABASE_*` points at the verified Travel Buddy project
- Cloud target: **travel-buddy-production** (`farnjmgwcayvkzuaoifk`)
- Live commercial providers and payments remain disabled
- Backup schema version: **7** (imports v2–v7)

See [`docs/completed-slices.md`](docs/completed-slices.md), [`docs/production-ops-runbook.md`](docs/production-ops-runbook.md), and [`docs/production-launch-report.md`](docs/production-launch-report.md).

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run validate
npm audit
```

## Production activation checklist

1. Custom SMTP / production Auth email on Travel Buddy Supabase
2. Vercel project env vars (Production vs Preview separation)
3. Deploy + HTTPS domain (do not reuse another product’s domain)
4. Run full acceptance test on the production URL

Do not fabricate partnerships, conversions, or traffic metrics.
