# Travel Buddy — Production operations runbook

## Verified infrastructure

| Item | Value |
|------|--------|
| Supabase organisation | Aleya (`tasqkbrzxjralyelioyv`) |
| Supabase project | `aleya travel assistant` |
| Project ref | `jtktojbvbmiewpntpvhe` |
| API URL | `https://jtktojbvbmiewpntpvhe.supabase.co` |
| Vercel team | `ahmedmalas-projects` |
| Vercel project | `travel-buddy-assistant-ai` |
| Production URL | `https://travel-buddy-assistant-ai.vercel.app` |
| Forbidden / retired | `farnjmgwcayvkzuaoifk`, ABoss, AI Invoicing, Aleya Logo Creator |

Never apply Travel Buddy migrations to forbidden projects.

## Environment variables

### Production / Preview / Development (Vercel)

```
VITE_SUPABASE_URL=https://jtktojbvbmiewpntpvhe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
VITE_SUPABASE_ANON_KEY=<same publishable key — required for older main builds>
VITE_SUPABASE_PROJECT_REF=jtktojbvbmiewpntpvhe
VITE_APP_URL=https://travel-buddy-assistant-ai.vercel.app
```

**Important:** Production builds from older `main` only read `VITE_SUPABASE_ANON_KEY`. Current app code prefers `VITE_SUPABASE_PUBLISHABLE_KEY` and accepts `VITE_SUPABASE_ANON_KEY` as an alias. Set both to the same value on Vercel.

Never set service-role keys in Vite/`VITE_*` variables.

## Schema migrations

```bash
export SUPABASE_ACCESS_TOKEN=...   # PAT with access to org tasqkbrzxjralyelioyv
bash scripts/apply-aleya-migrations.sh
```

Or apply the four SQL files under `supabase/migrations/` via Supabase MCP `apply_migration` / SQL editor on project `jtktojbvbmiewpntpvhe` only.

## Authentication email (required for launch)

Approved provider profile: **Resend** (`smtp.resend.com:587`), sender **Travel Buddy**.

```bash
export SUPABASE_ACCESS_TOKEN=...
export RESEND_API_KEY=...
bash scripts/configure-production-smtp.sh
```

## Deploy

```bash
export VERCEL_TOKEN=...
export VITE_SUPABASE_URL=https://jtktojbvbmiewpntpvhe.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=...
export VITE_SUPABASE_PROJECT_REF=jtktojbvbmiewpntpvhe
export VITE_APP_URL=https://travel-buddy-assistant-ai.vercel.app
bash scripts/deploy-production.sh
```
