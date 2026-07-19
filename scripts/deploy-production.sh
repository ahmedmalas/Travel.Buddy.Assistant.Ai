#!/usr/bin/env bash
# Deploy Travel Buddy to Vercel project travel-buddy-assistant-ai (team ahmedmalas-projects).
# Requires: VERCEL_TOKEN. Optional: VERCEL_ORG_ID, VERCEL_PROJECT_ID.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Missing VERCEL_TOKEN. Authenticate Vercel MCP in Cursor desktop or export a token." >&2
  exit 1
fi

PUBLISHABLE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-${VITE_SUPABASE_ANON_KEY:-}}"
if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${PUBLISHABLE_KEY}" ]]; then
  echo "Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY" >&2
  exit 1
fi

if [[ "${VITE_SUPABASE_URL}" == *"farnjmgwcayvkzuaoifk"* ]]; then
  echo "Refusing deploy: retired project farnjmgwcayvkzuaoifk must not be used." >&2
  exit 1
fi

for forbidden in iwmloenntlzyzvguwfsn bmfpclozzmeekazmoaxw wrmwthsfbpkjsxsqigpw; do
  if [[ "${VITE_SUPABASE_URL}" == *"${forbidden}"* ]]; then
    echo "Refusing deploy: forbidden Supabase project ${forbidden}" >&2
    exit 1
  fi
done

PROJECT_NAME="${VERCEL_PROJECT_NAME:-travel-buddy-assistant-ai}"
SCOPE="${VERCEL_SCOPE:-ahmedmalas-projects}"

npx --yes vercel@39 pull --yes --environment=production --token "$VERCEL_TOKEN" --scope "$SCOPE" || true
npx --yes vercel@39 link --yes --project "$PROJECT_NAME" --token "$VERCEL_TOKEN" --scope "$SCOPE"

add_env() {
  local key="$1"
  local value="$2"
  printf '%s' "$value" | npx --yes vercel@39 env add "$key" production --token "$VERCEL_TOKEN" --scope "$SCOPE" 2>/dev/null || true
}

add_env VITE_SUPABASE_URL "$VITE_SUPABASE_URL"
add_env VITE_SUPABASE_PUBLISHABLE_KEY "$PUBLISHABLE_KEY"
add_env VITE_SUPABASE_ANON_KEY "$PUBLISHABLE_KEY"
if [[ -n "${VITE_SUPABASE_PROJECT_REF:-}" ]]; then
  add_env VITE_SUPABASE_PROJECT_REF "$VITE_SUPABASE_PROJECT_REF"
fi
if [[ -n "${VITE_APP_URL:-}" ]]; then
  add_env VITE_APP_URL "$VITE_APP_URL"
fi

npx --yes vercel@39 build --prod --token "$VERCEL_TOKEN" --scope "$SCOPE"
DEPLOY_URL=$(npx --yes vercel@39 deploy --prebuilt --prod --token "$VERCEL_TOKEN" --scope "$SCOPE")
echo "Production deploy URL: ${DEPLOY_URL}"
echo "Rollback: vercel rollback --token \$VERCEL_TOKEN --scope ${SCOPE}  OR promote previous deployment in Vercel UI"
