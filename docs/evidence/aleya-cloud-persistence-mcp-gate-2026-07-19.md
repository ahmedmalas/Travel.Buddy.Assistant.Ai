# Aleya cloud persistence — MCP gate evidence (sanitized)

**Run:** `bc-b8f78f60-e9a1-4214-9de0-336f452f7fcc`  
**Branch:** `cursor/aleya-cloud-persistence-03b5` @ `d44f08a` (migrations unchanged; evidence tip ahead of prior gate notes)  
**UTC:** 2026-07-19  
**Source:** Cursor Desktop → cloud agent (`source: desktop`)  
**Target org name:** ALEYA TRAVEL ASSISTANT  
**Target project (only):** `jtktojbvbmiewpntpvhe`  

No secrets, tokens, or publishable keys are included below.  
`list_organizations` was **not** called (per this run’s instructions).  
`SUPABASE_ACCESS_TOKEN` was **not** requested.  
No other Supabase project was queried for schema/SQL after identity mismatch.

## 1. Read-only checks against `jtktojbvbmiewpntpvhe`

| Check | Result |
|-------|--------|
| Supabase MCP `serverStatus` | `ready` |
| Tools present: `execute_sql` | **Available** in MCP schema |
| Tools present: `apply_migration` | **Available** in MCP schema |
| `get_project(jtktojbvbmiewpntpvhe)` | Permission error `-32600` |
| `execute_sql` → list schemas | Permission error `-32600` |
| `list_tables(public)` on target | Permission error `-32600` |
| `get_project_url(jtktojbvbmiewpntpvhe)` | Permission error `-32600` |

### Project ref actually used / resolved by the tool

`list_projects` (used only to identify which identity the MCP session holds) returned **only** these refs — **none** is the target:

| name | ref | organization_id |
|------|-----|-----------------|
| aboss-production | `iwmloenntlzyzvguwfsn` | `axqrjaxwqjiqphdhzbcr` |
| travel-buddy-production | `farnjmgwcayvkzuaoifk` | `axqrjaxwqjiqphdhzbcr` |
| ai-invoicing-app-production | `bmfpclozzmeekazmoaxw` | `axqrjaxwqjiqphdhzbcr` |
| aleya-logo-creator | `wrmwthsfbpkjsxsqigpw` | `axqrjaxwqjiqphdhzbcr` |

**Target `jtktojbvbmiewpntpvhe`:** not in `list_projects`; direct calls → `-32600`.

**Hard stop:** Per policy, because the session does not resolve to `jtktojbvbmiewpntpvhe`, no migrations, advisors, or Account A/B tests were run. Visible non-target projects were **not** used.

## 2. Gates

| # | Gate | Status |
|---|------|--------|
| 1 | MCP project confirmation (`jtktojbvbmiewpntpvhe`) | **FAIL** (session resolves to other refs under `axqrjaxwqjiqphdhzbcr`) |
| 2 | Apply four migrations | **BLOCKED** |
| 3 | Tables + private `travel-documents` bucket | **BLOCKED** |
| 4 | RLS, grants, Data API | **BLOCKED** |
| 5 | Security + performance advisors | **BLOCKED** |
| 6 | `profiles` / `trips` non-404 | **BLOCKED** |
| 7 | Account A persistence | **BLOCKED** |
| 8 | Account B isolation | **BLOCKED** |
| 9 | Repository validate / tests / build / audit | PASS (prior tip on this branch; not re-run this turn) |

## 3. Prior notes on this branch (superseded for MCP identity)

Earlier Desktop runs (`bc-a4c38c54-…`, `bc-55988788-…`) recorded the same wrong-identity failure. This run intentionally does **not** continue those agents; it re-checked MCP from a fresh run and stopped on mismatch.

## 4. Unblock

In **Cursor Desktop → Settings → MCP → Supabase**, disconnect and reconnect OAuth with the Supabase login that owns organisation **ALEYA TRAVEL ASSISTANT** and project **`jtktojbvbmiewpntpvhe`**.

After reconnect, a fresh agent must see `jtktojbvbmiewpntpvhe` via project tools (not only via another org’s project list) before any `apply_migration` / `execute_sql`. Keep PR draft until every gate passes.
