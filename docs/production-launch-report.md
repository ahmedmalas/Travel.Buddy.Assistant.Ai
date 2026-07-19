# Travel Buddy — Production launch report

**Baseline commit:** `5175d14`  
**Branch:** `cursor/production-launch-03b5`  
**PR:** https://github.com/ahmedmalas/Travel.Buddy.Assistant.Ai/pull/17

## Verdict

**Not launch-ready.**

Hard blockers remain: production SMTP credentials and Vercel authentication are unavailable in this cloud-agent environment, so live email, production deploy, domain bind, and full domain acceptance could not be completed.

## Supabase (complete)

| Field | Value |
|-------|--------|
| Organisation | The Peptides Guy (`axqrjaxwqjiqphdhzbcr`) |
| Project | `travel-buddy-production` |
| Ref | `farnjmgwcayvkzuaoifk` |
| Forbidden projects untouched | yes |

Migrations applied: foundation, storage, security hardening, launch grants.  
RLS isolation proof: **9/9 pass**.  
Private bucket `travel-documents` verified.

## SMTP / Auth email

| Item | Status |
|------|--------|
| Approved provider profile | **Resend** (`smtp.resend.com:587`) documented in-app + `scripts/configure-production-smtp.sh` |
| Sender name | Travel Buddy |
| From / reply-to (intended) | `noreply@mail.travelbuddy.app` / `support@travelbuddy.app` |
| Custom SMTP applied on project | **No** — missing `SUPABASE_ACCESS_TOKEN` + `RESEND_API_KEY` |
| Sign-up / verify / forgot / reset / resend verified live | **Blocked** |
| App support | Resend verification button, delivery error mapping, `emailRedirectTo` / reset redirects via `VITE_APP_URL` |
| Templates | `supabase/templates/confirmation.html`, `recovery.html` |

## Vercel

| Item | Status |
|------|--------|
| MCP / CLI auth | **Unauthenticated** (desktop MCP auth required; no `VERCEL_TOKEN`) |
| Project / production URL | **Not created/deployed** |
| Bound domain | **None** |
| Env vars on Vercel | **Not set** |
| Deployment ID | **None** |
| Prepared artifacts | `vercel.json`, `scripts/deploy-production.sh`, `.github/workflows/deploy-vercel.yml`, rollback docs |

## Acceptance tests (production domain)

Not run — no production URL. Prior SQL isolation remains **pass**. OTA mock inventory remains clearly disabled in UI.

## Gate results (latest branch revision)

| Gate | Result |
|------|--------|
| `npm run typecheck` | pass |
| `npm test` | **159** passed |
| `npm run test:coverage` | statements 68.11% / branches 56.18% / functions 61.94% / lines 69.16% |
| `npm run build` | pass |
| `npm run validate` | pass |
| `npm audit` | 0 vulnerabilities |

## Operator next steps

1. Authenticate Vercel in Cursor desktop (MCP) **or** export `VERCEL_TOKEN`
2. Export `SUPABASE_ACCESS_TOKEN` + `RESEND_API_KEY` and run `scripts/configure-production-smtp.sh`
3. Run `scripts/deploy-production.sh`, bind domain, set `VITE_APP_URL`
4. Execute Phase 8 acceptance on the live domain
