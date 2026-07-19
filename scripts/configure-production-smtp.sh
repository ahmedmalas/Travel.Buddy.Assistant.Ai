#!/usr/bin/env bash
# Configure custom SMTP on the verified aleya travel assistant project via Management API.
# Requires: SUPABASE_ACCESS_TOKEN, RESEND_API_KEY (or SMTP_PASS), PROJECT_REF, VITE_APP_URL/SITE_URL.
# Do not use retired ref farnjmgwcayvkzuaoifk.
set -euo pipefail

PROJECT_REF="${PROJECT_REF:-${VITE_SUPABASE_PROJECT_REF:-}}"
SMTP_HOST="${SMTP_HOST:-smtp.resend.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-resend}"
SMTP_PASS="${SMTP_PASS:-${RESEND_API_KEY:-}}"
SMTP_ADMIN_EMAIL="${SMTP_ADMIN_EMAIL:-noreply@mail.travelbuddy.app}"
SMTP_SENDER_NAME="${SMTP_SENDER_NAME:-Travel Buddy}"
SITE_URL="${SITE_URL:-${VITE_APP_URL:-}}"
URI_ALLOW_LIST="${URI_ALLOW_LIST:-}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)" >&2
  exit 1
fi
if [[ -z "${PROJECT_REF}" ]]; then
  echo "Missing PROJECT_REF for aleya travel assistant (org tasqkbrzxjralyelioyv)" >&2
  exit 1
fi
if [[ "${PROJECT_REF}" == "farnjmgwcayvkzuaoifk" ]]; then
  echo "Refusing: retired project farnjmgwcayvkzuaoifk must not be used." >&2
  exit 1
fi
if [[ -z "${SMTP_PASS}" ]]; then
  echo "Missing RESEND_API_KEY or SMTP_PASS for Resend SMTP" >&2
  exit 1
fi
if [[ -z "${SITE_URL}" ]]; then
  echo "Missing SITE_URL or VITE_APP_URL for Auth site URL / redirects" >&2
  exit 1
fi

SITE_URL="${SITE_URL%/}"
if [[ -z "${URI_ALLOW_LIST}" ]]; then
  URI_ALLOW_LIST="${SITE_URL},${SITE_URL}/"
fi

BODY=$(cat <<JSON
{
  "external_email_enabled": true,
  "mailer_secure_email_change_enabled": true,
  "mailer_autoconfirm": false,
  "smtp_admin_email": "${SMTP_ADMIN_EMAIL}",
  "smtp_host": "${SMTP_HOST}",
  "smtp_port": ${SMTP_PORT},
  "smtp_user": "${SMTP_USER}",
  "smtp_pass": "${SMTP_PASS}",
  "smtp_sender_name": "${SMTP_SENDER_NAME}",
  "site_url": "${SITE_URL}",
  "uri_allow_list": "${URI_ALLOW_LIST}"
}
JSON
)

echo "Patching Auth config for ${PROJECT_REF} (provider=${SMTP_HOST})..."
curl -sS -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${BODY}" | python3 -c 'import json,sys; d=json.load(sys.stdin); print({k:d.get(k) for k in ["smtp_host","smtp_port","smtp_admin_email","smtp_sender_name","site_url","mailer_autoconfirm"] if isinstance(d,dict)}); print("ok") if isinstance(d,dict) else sys.exit(1)'

echo "SMTP configuration request completed."
