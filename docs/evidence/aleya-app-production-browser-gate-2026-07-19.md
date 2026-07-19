# Aleya app production — browser + storage + isolation gate (sanitized)

**Branch:** `cursor/aleya-app-production-e69b` (PR #20)  
**UTC:** 2026-07-19  
**PR #19 integration:** tip merged into this branch (`c1db270`); no migrations re-applied; remote schema untouched in this run.

**Supabase target (only):** `jtktojbvbmiewpntpvhe` (`https://jtktojbvbmiewpntpvhe.supabase.co`)  
**Forbidden refs:** only present in client denylist strings (not used as active URL).

No access tokens, service-role keys, publishable keys, JWTs, or passwords are included below.

## 1. Preview deployment

| Check | Result |
|-------|--------|
| GitHub→Vercel preview for PR #20 SHA | **FAIL** — `build-rate-limit` / `upgradeToPro` ("retry in 24 hours") |
| Vercel CLI deploy | **BLOCKED** — no CLI credentials in this environment |
| Local preview of PR #20 build vs production Supabase | **PASS** — `http://127.0.0.1:4173/` serving current `dist` |
| Production URL | `https://travel-buddy-assistant-ai.vercel.app` (main / #18) — Auth to Aleya works |

**Outstanding blocker for undraft:** PR #20 Vercel preview remains rate-limited. Local preview was used for full browser gates against the live Aleya project.

## 2. Automated gates (this branch)

| Check | Result |
|-------|--------|
| Playwright smoke (`e2e/smoke.spec.ts`) | **PASS** — 3/3 (shell, trip brief draft plan, auth panel) |
| Unit tests | See `unit-tests.log` artifact |

## 3. Account A — browser (local PR #20 preview → Aleya)

| Step | Result |
|------|--------|
| Sign in (not demo) | **PASS** — email verified; Cloud signed in |
| Trip creation ("Aleya Gate Tokyo") | **PASS** |
| Trip Brief generate draft plan | **PASS** — Lisbon 4-day draft |
| Save | **PASS** |
| Hard refresh persistence | **PASS** — hydrated trips from cloud |
| Upload document | **PASS** |
| Open signed URL | **PASS** |
| Delete document | **PASS** |
| Sign out / sign back in | **PASS** — trip still present |
| Production Auth session | **PASS** — Account A restored on production URL |

Screenshots under `/opt/cursor/artifacts/screenshots/` (computer-use capture set).

## 4. Account B — isolation (browser + API)

| Step | Result |
|------|--------|
| Sign up + email confirm | **PASS** (after email rate-limit cooldown) |
| B cannot see A trips | **PASS** (browser vault + API list/fetch) |
| B create own trip + refresh | **PASS** |
| A cannot see B trip | **PASS** |
| B PATCH A trip | **PASS** — empty update; A name unchanged |
| Anon trips | **401** (RLS helper EXECUTE revoked for anon) |

## 5. Storage (production bucket `travel-documents`)

| Step | Result |
|------|--------|
| Upload (authenticated) | **PASS** — HTTP 200 |
| Signed URL create + download | **PASS** — HTTP 200, expected bytes |
| Delete object | **PASS** — HTTP 200; subsequent GET not found |
| `document_objects` insert/delete (correct columns) | **PASS** — 201 / 204 |

Orphan cleanup: app delete path removes storage object + metadata row in UI flow (browser delete verified). No separate sweeper job exercised.

## 6. Security

| Check | Result |
|-------|--------|
| RLS enforced on trips / documents | **PASS** (A/B isolation + anon 401) |
| Auth working (email/password) | **PASS** |
| Demo mode used to fake success | **NO** — cloud env configured; real Auth |
| Security bypass / fake users / disabled policies | **NO** — not introduced |
| Migrations duplicated / schema corrupted | **NO** — no apply in this run |

## 7. Persistence

| Check | Result |
|-------|--------|
| Refresh hydrate | **PASS** |
| Logout / login | **PASS** |
| Session restore on production | **PASS** |
| Browser restart | Not separately automated; session restore after navigation/reload covered |

## 8. Gates vs undraft criteria

| Criterion | Status |
|-----------|--------|
| Production browser validation | **PASS** (local PR20 preview + prod Auth) |
| Account A verified | **PASS** |
| Account B verified | **PASS** |
| Storage verified | **PASS** |
| Persistence verified | **PASS** |
| Security verified | **PASS** |
| Preview deployment healthy | **FAIL** — Vercel `build-rate-limit` (24h) |
| No outstanding production blockers | **BLOCKED** by preview rate limit (+ confirm email `redirect_to` still defaults to `http://localhost:3000`) |

**PR #20 remains draft** until Vercel preview for this branch is healthy.
