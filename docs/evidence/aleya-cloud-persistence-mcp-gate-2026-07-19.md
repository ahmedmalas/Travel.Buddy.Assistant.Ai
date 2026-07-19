# Aleya cloud persistence — MCP gate evidence (sanitized)

**Run:** `bc-a4c38c54-e7a4-4c26-ba49-4c620a1e9687`  
**Branch:** `cursor/aleya-cloud-persistence-03b5` @ `d44f08a`  
**UTC:** 2026-07-19  
**Source:** Cursor Desktop → cloud agent (`source: desktop`)  
**Target org:** `tasqkbrzxjralyelioyv`  
**Target project:** `jtktojbvbmiewpntpvhe`  

No secrets, tokens, or publishable keys are included below.

## 1. MCP access confirmation (required first)

| Check | Result |
|-------|--------|
| Supabase MCP `serverStatus` | `ready` |
| `list_organizations` | Only **The Peptides Guy** (`axqrjaxwqjiqphdhzbcr`) |
| Expected org `tasqkbrzxjralyelioyv` | **Not in list** |
| `get_organization(tasqkbrzxjralyelioyv)` | Permission error `-32600` |
| `get_project(jtktojbvbmiewpntpvhe)` | Permission error `-32600` |
| `list_tables(jtktojbvbmiewpntpvhe)` | Permission error `-32600` |
| `execute_sql(jtktojbvbmiewpntpvhe)` | Permission error `-32600` |
| `list_migrations(jtktojbvbmiewpntpvhe)` | Permission error `-32600` |

Visible projects under the authenticated MCP identity (names/refs only; **not used**):

- `aboss-production` (`iwmloenntlzyzvguwfsn`)
- `travel-buddy-production` (`farnjmgwcayvkzuaoifk`)
- `ai-invoicing-app-production` (`bmfpclozzmeekazmoaxw`)
- `aleya-logo-creator` (`wrmwthsfbpkjsxsqigpw`)

**Verdict:** MCP is authenticated to the wrong Supabase account/org. Aleya target is unreachable. Per policy, no SQL was applied to any other project. `SUPABASE_ACCESS_TOKEN` was not requested.

## 2. Gates

| # | Gate | Status |
|---|------|--------|
| 1 | MCP org/project confirmation | **FAIL** (wrong identity) |
| 2 | Apply four migrations | **BLOCKED** |
| 3 | Tables + private `travel-documents` bucket | **BLOCKED** |
| 4 | RLS, grants, Data API | **BLOCKED** |
| 5 | Security + performance advisors | **BLOCKED** |
| 6 | `profiles` / `trips` non-404 | **BLOCKED** |
| 7 | Account A persistence | **BLOCKED** |
| 8 | Account B isolation | **BLOCKED** |
| 9 | Repository validate / tests / build / audit | **PASS** (local only) |

## 3. Local repository validation (gate 9)

```
npm run validate → exit 0
  typecheck: ok
  vitest: 42 files, 156 tests passed
  vite build: ok
npm audit --omit=dev → 0 vulnerabilities
```

Auth code paths were not modified. Migrations on the branch remain unapplied to Aleya.

## 4. Unblock

Re-authenticate Supabase MCP in Cursor Desktop to an account that can see:

- Organisation `tasqkbrzxjralyelioyv`
- Project `jtktojbvbmiewpntpvhe` (aleya travel assistant)

Confirm with `list_organizations` before any `apply_migration` / `execute_sql`. Then re-run gates 2–8.

## 5. Retry (same run, ~07:12 UTC)

Re-checked after user “try again”:

- `list_organizations` → still only `axqrjaxwqjiqphdhzbcr` (The Peptides Guy)
- `get_organization(tasqkbrzxjralyelioyv)` → `-32600`
- `get_project(jtktojbvbmiewpntpvhe)` → `-32600`
- `list_migrations(jtktojbvbmiewpntpvhe)` → `-32600`
- Supabase MCP `serverStatus` → `ready` (authenticated, wrong account)

Still blocked. No SQL applied. No other projects touched.
