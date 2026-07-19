# Travel Buddy Assistant AI

Travel Buddy Assistant AI is an AI-powered travel planning and concierge application designed to help users research, compare, plan, organise, and manage travel from one place.

## Current verified baseline

`main` includes Slices **9–88**. Active finalisation work completes **Slices 89–100**:

- Universal import (ICS/CSV/email/PDF-text/backups) with confidence review
- Trip Health Score audits
- Offline indicators + degraded mode helpers
- Performance (code splitting, virtual lists, search helpers)
- Accessibility + security hardening checklists
- Local privacy-respecting analytics
- Release centre (flags, notes, compatibility)
- Operations dashboard
- Developer platform docs + launch readiness reports

Local/demo mode remains the default. Cloud mode stays inactive unless a verified Travel Buddy Supabase project is linked. Live commercial providers and payments remain disabled.

Backup schema version: **7** (imports v2–v7).

See [`docs/completed-slices.md`](docs/completed-slices.md) and [`docs/launch-readiness-report.md`](docs/launch-readiness-report.md).

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

## Still required before commercial launch

1. Verified Travel Buddy Supabase project + migrations
2. Approved live provider credentials + adapters
3. Legal disclosure/brand review for live redirects
4. Production deploy + monitoring

Do not fabricate partnerships, conversions, or traffic metrics.
