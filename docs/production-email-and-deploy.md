# Production email + Vercel deploy (operator runbook)

## Approved targets

| Item | Value |
|------|--------|
| Supabase org | `tasqkbrzxjralyelioyv` |
| Supabase project | `aleya travel assistant` |
| Project ref | **must be confirmed after Supabase MCP reauth** |
| Vercel team | `ahmedmalas-projects` |
| Vercel project | `travel-buddy-assistant-ai` |
| Forbidden | `farnjmgwcayvkzuaoifk`, ABoss, AI Invoicing, Aleya Logo Creator |

## Auth blockers in cloud agents

Interactive MCP authentication (`mcp_auth`) only works in **Cursor desktop**. Cloud agents cannot reauthenticate Supabase/Vercel MCP sessions.

## 1) Supabase MCP reauth

1. Open Cursor desktop → MCP settings → Supabase → Authenticate / Reauthenticate
2. Select organisation **`tasqkbrzxjralyelioyv`**
3. Restart or continue the cloud agent so `list_organizations` includes that org and `aleya travel assistant` appears in `list_projects`
4. Record the **exact project ref** before any migrations

## 2) Resend SMTP

```bash
export SUPABASE_ACCESS_TOKEN=...
export RESEND_API_KEY=re_...
export PROJECT_REF=<aleya-travel-assistant-ref>
export VITE_APP_URL=https://YOUR_PRODUCTION_DOMAIN
bash scripts/configure-production-smtp.sh
```

## 3) Vercel

Authenticate Vercel MCP in Cursor desktop **or** export `VERCEL_TOKEN`, then:

```bash
export VERCEL_TOKEN=...
export VERCEL_SCOPE=ahmedmalas-projects
export VERCEL_PROJECT_NAME=travel-buddy-assistant-ai
export VITE_SUPABASE_URL=https://<ref>.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
export VITE_SUPABASE_PROJECT_REF=<ref>
export VITE_APP_URL=https://YOUR_PRODUCTION_DOMAIN
bash scripts/deploy-production.sh
```

Then set Auth site URL + redirect allow-list to `VITE_APP_URL`.
