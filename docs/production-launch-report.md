# Travel Buddy — Production launch report

**Branch:** `cursor/production-launch-03b5`  
**PR:** https://github.com/ahmedmalas/Travel.Buddy.Assistant.Ai/pull/17 (draft)

## Root cause (demo-local in production)

Production (`main` @ `5175d14`) reads only `VITE_SUPABASE_ANON_KEY`.
Vercel has `VITE_SUPABASE_PUBLISHABLE_KEY` (and URL + APP_URL) baked into the bundle, but **not** `VITE_SUPABASE_ANON_KEY`.
Env validation therefore fails → no Supabase client → auth shell stays `demo-local`.

Secondary gates on this branch (now fixed):

1. `SUPABASE_TARGET_VERIFICATION.verified` was `false` → `activeProvider` stayed `local-storage`
2. `hydrateAuthFromSession` preserved `demo-local` when cloud had no session

## Approved targets

| System | Target |
|--------|--------|
| Supabase organisation | `tasqkbrzxjralyelioyv` |
| Supabase project | `aleya travel assistant` |
| Supabase project ref | `jtktojbvbmiewpntpvhe` |
| Supabase URL | `https://jtktojbvbmiewpntpvhe.supabase.co` |
| Vercel team | `ahmedmalas-projects` |
| Vercel project | `travel-buddy-assistant-ai` |
| Production URL | `https://travel-buddy-assistant-ai.vercel.app` |

Forbidden: `farnjmgwcayvkzuaoifk`, ABoss, AI Invoicing, Aleya Logo Creator.

## Fix shipped on this branch

- Accept `VITE_SUPABASE_PUBLISHABLE_KEY` (alias `VITE_SUPABASE_ANON_KEY`)
- Lock verified target to `jtktojbvbmiewpntpvhe`
- Leave `demo-local` when Supabase client is configured
- Adapter plan `connected`
- Migration script `scripts/apply-aleya-migrations.sh`

## Remaining operators

1. Apply migrations on `jtktojbvbmiewpntpvhe` (Supabase MCP must include org `tasqkbrzxjralyelioyv`, or run `apply-aleya-migrations.sh` with a PAT)
2. Set `VITE_SUPABASE_ANON_KEY` = publishable key on Vercel (back-compat) **and** deploy this branch to Production
3. Optional: Resend SMTP
