# Travel Buddy — Production launch report

**Baseline commit:** `5175d14`  
**Branch:** `cursor/production-launch-03b5`

## Verdict

**Not launch-ready** until production email delivery and Vercel authentication/deploy are completed. Supabase project, migrations, RLS isolation, OTA demo boundary, SPA/security headers, and ops runbooks are in place.

## Phase 1 — Supabase

| Field | Value |
|-------|--------|
| Organisation | The Peptides Guy (`axqrjaxwqjiqphdhzbcr`) |
| Project | `travel-buddy-production` |
| Ref | `farnjmgwcayvkzuaoifk` |
| Forbidden projects untouched | yes |

### Migrations applied (remote)

1. `travel_buddy_foundation`
2. `travel_buddy_storage`
3. `travel_buddy_security_hardening`
4. `travel_buddy_launch_grants`

Mirrored under `supabase/migrations/`.

### Advisors

- Security: WARN remains that authenticated can EXECUTE membership helpers used by RLS (expected for policy helpers; anon/public EXECUTE revoked).
- Performance: INFO unused indexes + Auth connection strategy note only.

### Isolation proof (SQL, 9/9 pass)

- Owner can select/update trip + documents
- Stranger cannot select/update/insert forged ownership
- Viewer collaborator can select, cannot update

Private bucket `travel-documents`: `public=false`, 10MB limit, allow-listed MIME types, member/editor storage policies.

## Phase 2 — Auth

App adapters for sign-up/in/out, forgot/reset, session persistence, visibility/errors exist. **Production SMTP not configured in this environment** (no SMTP/Resend credentials). Live email verification and reset flows remain blocked.

## Phase 3–4 — Cloud sync / documents

Adapters and RLS/storage policies ready. End-to-end cloud sync and signed document upload against production require env wiring + working auth email + deployed app.

## Phase 5 — Vercel

`vercel.json` adds SPA rewrites, security headers, HSTS, CSP. **Vercel MCP/CLI not authenticated in this agent environment** — production deploy and domain binding pending operator auth.

## Phase 6 — Monitoring / ops

See `docs/production-ops-runbook.md` (logs, rollback, backups, uptime, analytics).

## Phase 7 — OTA boundary

`getInventoryMode()` defaults to `demo-simulated`; live adapter registry empty; Deal Engine UI shows **LIVE PROVIDERS DISABLED** banner and explicit false claims.

## Phase 8 — Acceptance

Full production-domain acceptance test pending deploy + email.

## Gate results (this branch)

| Gate | Result |
|------|--------|
| `npm run typecheck` | pass |
| `npm test` | 154 passed |
| `npm run test:coverage` | statements 68.14% / branches 56.03% / functions 61.96% / lines 69.18% (thresholds unchanged) |
| `npm run build` | pass |
| `npm run validate` | pass |
| `npm audit` | 0 vulnerabilities |
