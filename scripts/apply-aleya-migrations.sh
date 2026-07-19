#!/usr/bin/env bash
# Apply Travel Buddy migrations to aleya travel assistant (jtktojbvbmiewpntpvhe) only.
# Requires: SUPABASE_ACCESS_TOKEN with access to organisation tasqkbrzxjralyelioyv.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="${SUPABASE_PROJECT_REF:-jtktojbvbmiewpntpvhe}"
API="${SUPABASE_MANAGEMENT_API:-https://api.supabase.com}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN. Create a personal access token with access to org tasqkbrzxjralyelioyv." >&2
  exit 1
fi

if [[ "${PROJECT_REF}" == "farnjmgwcayvkzuaoifk" ]]; then
  echo "Refusing: retired project farnjmgwcayvkzuaoifk must not be used." >&2
  exit 1
fi

if [[ "${PROJECT_REF}" != "jtktojbvbmiewpntpvhe" ]]; then
  echo "Refusing: only jtktojbvbmiewpntpvhe (aleya travel assistant) is allowed." >&2
  exit 1
fi

apply_sql() {
  local name="$1"
  local file="$2"
  echo "Applying ${name} from ${file}..."
  python3 - "$API" "$PROJECT_REF" "$SUPABASE_ACCESS_TOKEN" "$file" <<'PY'
import json, sys, urllib.request
api, ref, token, path = sys.argv[1:5]
sql = open(path, encoding='utf-8').read()
req = urllib.request.Request(
    f"{api}/v1/projects/{ref}/database/query",
    data=json.dumps({"query": sql}).encode(),
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    },
    method="POST",
)
with urllib.request.urlopen(req) as resp:
    body = resp.read().decode()
    print(body[:500] if body else "ok")
PY
}

apply_sql foundation "$ROOT/supabase/migrations/20260718120000_travel_buddy_foundation.sql"
apply_sql storage "$ROOT/supabase/migrations/20260718120100_travel_buddy_storage.sql"
apply_sql hardening "$ROOT/supabase/migrations/20260719120000_travel_buddy_security_hardening.sql"
apply_sql grants "$ROOT/supabase/migrations/20260719120100_travel_buddy_launch_grants.sql"

echo "Migrations applied to ${PROJECT_REF}."
