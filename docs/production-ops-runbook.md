# Travel Buddy — Production operations runbook

## Verified infrastructure

| Item | Value |
|------|--------|
| Supabase organisation | The Peptides Guy (`axqrjaxwqjiqphdhzbcr`) |
| Supabase project | `travel-buddy-production` |
| Project ref | `farnjmgwcayvkzuaoifk` |
| API URL | `https://farnjmgwcayvkzuaoifk.supabase.co` |
| Region | `ap-southeast-2` |
| Forbidden projects | `aboss-production`, `ai-invoicing-app-production`, `aleya-logo-creator` |

Never apply Travel Buddy migrations to forbidden projects.

## Environment variables

### Production (Vercel Production)

```
VITE_SUPABASE_URL=https://farnjmgwcayvkzuaoifk.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable or legacy anon key>
VITE_SUPABASE_PROJECT_REF=farnjmgwcayvkzuaoifk
```

### Preview

Use the same Travel Buddy project **only** if preview traffic is trusted, or leave unset so preview stays local/demo. Do **not** point preview/production at ABoss, Invoicing, or Logo Creator projects.

Never set service-role keys in Vite/`VITE_*` variables.

## Authentication email (required for launch)

Configure **custom SMTP** (or an approved production email provider) on the Travel Buddy Supabase Auth settings. Do not rely on Supabase’s built-in development mailer for launch.

Verify:

1. Sign-up confirmation email delivery
2. Forgot-password email delivery
3. Correct Site URL + redirect URLs for the production domain

## Monitoring (no extra paid services)

| Signal | Where |
|--------|--------|
| Runtime UI errors | In-app `ErrorBoundary` + browser console; Ops dashboard panel |
| Auth failures | Supabase Dashboard → Logs → Auth; Auth shell error banners |
| Sync failures | Sync engine panel + sync queue state |
| Deployment logs | Vercel project → Deployments → Build/Runtime logs |
| DB advisors | Supabase MCP/`get_advisors` or Dashboard advisors |
| Product analytics | Local privacy-respecting analytics (`src/finalisation/analytics`) — no third-party tracker required |
| Uptime | Vercel deployment availability + optional free external ping to the production URL `/` |

## Database backups

On Supabase Pro, confirm automatic backups are enabled for `travel-buddy-production` in Dashboard → Database → Backups. After major schema changes, take a manual backup/PITR check.

## Incident response

1. Identify blast radius (auth, sync, storage, UI).
2. If auth/email is broken: disable new sign-ups temporarily in Supabase Auth if needed; keep local/demo usable.
3. If data isolation is suspected: pause writes, run RLS isolation SQL checks, review Auth + Postgres logs.
4. Communicate status in the support channel with time, impact, and next update.

## Rollback procedure

1. In Vercel, open the last known-good Production deployment → **Promote to Production**.
2. Do **not** roll back database migrations unless a forward fix is unsafe; prefer additive fixes.
3. If a bad env var was introduced, revert Production env and redeploy.
4. Confirm `/` loads, auth still works, and sync queue drains for a test account.

## Support checklist

- Confirm user email + approximate time (UTC)
- Auth screen / error text
- Trip id (if relevant) — never ask for full document contents
- Online/offline state
- Browser + device

## OTA / deals boundary

Production inventory mode is **demo-simulated** until approved live adapters are registered. Do not claim live prices, live availability, OTA partnerships, guaranteed cheapest deals, or real in-app booking.
