# Production email + Vercel deploy (operator runbook)

This agent environment does **not** hold `SUPABASE_ACCESS_TOKEN`, Resend/`SMTP_PASS`, or `VERCEL_TOKEN`. Interactive Vercel MCP auth is desktop-only. Use this checklist on an authenticated machine.

## 1) Approved SMTP (Resend)

| Setting | Value |
|---------|--------|
| Provider | Resend |
| SMTP host | `smtp.resend.com` |
| Port | `587` |
| Username | `resend` |
| Password | Resend API key |
| Sender name | `Travel Buddy` |
| From | `noreply@mail.travelbuddy.app` (must be verified in Resend) |
| Reply-To | `support@travelbuddy.app` |
| Project | `travel-buddy-production` (`farnjmgwcayvkzuaoifk`) only |

```bash
export SUPABASE_ACCESS_TOKEN=...   # owner/admin PAT
export RESEND_API_KEY=re_...
export VITE_APP_URL=https://YOUR_TRAVEL_BUDDY_DOMAIN
bash scripts/configure-production-smtp.sh
```

Verify:

1. Sign-up confirmation email
2. Resend verification
3. Forgot password email
4. Reset password link lands on production URL
5. Delivery failure surfaces a clear Auth error (rate-limit / SMTP)

Do **not** leave Auth on Supabase’s development mailer.

## 2) Vercel deploy

Create/confirm a dedicated project named `travel-buddy-production` (or similar). Production env only:

```
VITE_SUPABASE_URL=https://farnjmgwcayvkzuaoifk.supabase.co
VITE_SUPABASE_ANON_KEY=<Travel Buddy publishable/anon key>
VITE_SUPABASE_PROJECT_REF=farnjmgwcayvkzuaoifk
VITE_APP_URL=https://YOUR_TRAVEL_BUDDY_DOMAIN
```

Never point at ABoss / TPG / Aleya Invoicing / Aleya Logo Creator projects.

```bash
export VERCEL_TOKEN=...
export VITE_SUPABASE_URL=https://farnjmgwcayvkzuaoifk.supabase.co
export VITE_SUPABASE_ANON_KEY=...
export VITE_SUPABASE_PROJECT_REF=farnjmgwcayvkzuaoifk
export VITE_APP_URL=https://YOUR_TRAVEL_BUDDY_DOMAIN
bash scripts/deploy-production.sh
```

Then:

- Bind the approved Travel Buddy domain
- Confirm HTTPS
- Confirm SPA deep links (e.g. `/` refresh) and security headers from `vercel.json`
- Document prior deployment id for rollback (`vercel rollback` or Promote in UI)

## 3) Acceptance

Run the Phase 8 checklist on the production domain after email + deploy succeed. See `docs/production-launch-report.md`.
