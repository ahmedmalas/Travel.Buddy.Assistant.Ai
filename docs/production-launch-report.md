# Travel Buddy — Production launch report

**Branch:** `cursor/production-launch-03b5`  
**PR:** https://github.com/ahmedmalas/Travel.Buddy.Assistant.Ai/pull/17 (draft)

## Verdict

**Not launch-ready — stopped on authentication blockers.**

## Approved infrastructure (declared)

| System | Target |
|--------|--------|
| Supabase organisation | `tasqkbrzxjralyelioyv` |
| Supabase project name | `aleya travel assistant` |
| Supabase project ref | **UNKNOWN — not visible to current MCP session** |
| Vercel team | `ahmedmalas-projects` |
| Vercel project | `travel-buddy-assistant-ai` |

Retired / forbidden: `farnjmgwcayvkzuaoifk`, ABoss, AI Invoicing, Aleya Logo Creator. No changes applied to those.

## Exact stop reason

1. **Supabase MCP** is authenticated only to org `axqrjaxwqjiqphdhzbcr` (“The Peptides Guy”).  
   - `get_organization(tasqkbrzxjralyelioyv)` → permission denied  
   - `list_organizations` does not include `tasqkbrzxjralyelioyv`  
   - Project **aleya travel assistant** therefore cannot be located; **project ref cannot be reported**  
   - Interactive `mcp_auth` for Supabase is **not available in this cloud-agent environment** (desktop IDE only)

2. **Vercel MCP** status `needsAuth`; interactive auth desktop-only; no `VERCEL_TOKEN` in environment → cannot link/deploy `travel-buddy-assistant-ai`

3. **Resend SMTP** still requires `RESEND_API_KEY` + verified sending domain + `SUPABASE_ACCESS_TOKEN` for Auth PATCH

## Required from operator (resume checklist)

1. In **Cursor desktop**, reauthenticate **Supabase MCP** and select organisation **`tasqkbrzxjralyelioyv`**
2. Confirm project **`aleya travel assistant`** appears; paste its **exact project ref** into the agent thread (or restart the cloud agent after MCP reauth)
3. Authenticate **Vercel MCP** in Cursor desktop (team `ahmedmalas-projects`) **or** provide `VERCEL_TOKEN`
4. Provide `RESEND_API_KEY` + verified domain when ready for SMTP

After that, the agent will: report ref → apply migrations/RLS/storage → configure Vercel env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_URL`) → deploy → set Auth site/redirect URLs → SMTP → acceptance.

## App changes prepared on this branch

- Env target no longer accepts/uses `farnjmgwcayvkzuaoifk`
- Accepts `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key still aliased)
- Deploy/SMTP scripts retargeted to Vercel `travel-buddy-assistant-ai` / org `tasqkbrzxjralyelioyv`
- Auth resend + delivery error mapping retained
