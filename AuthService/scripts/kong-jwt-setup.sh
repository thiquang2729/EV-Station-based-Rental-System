#!/usr/bin/env bash
# Ensure the Kong consumer for the auth-service has the expected JWT secret.

set -euo pipefail

KONG_ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"
KONG_CONSUMER="${KONG_CONSUMER:-auth-service}"
KONG_JWT_KEY="${KONG_JWT_KEY:-auth-service}"
KONG_JWT_SECRET="${KONG_JWT_SECRET:?Set KONG_JWT_SECRET to the HS256 secret used by Auth Service}"

echo "[kong-jwt] Waiting for Kong Admin API at $KONG_ADMIN_URL ..."
until curl --silent --fail "$KONG_ADMIN_URL/status" >/dev/null; do
  sleep 2
done

echo "[kong-jwt] Upserting consumer $KONG_CONSUMER ..."
curl --silent --fail --show-error \
  --request PUT \
  --data "username=$KONG_CONSUMER" \
  --data "custom_id=$KONG_CONSUMER" \
  "$KONG_ADMIN_URL/consumers/$KONG_CONSUMER" >/dev/null

echo "[kong-jwt] Removing existing JWT credentials for $KONG_CONSUMER ..."
existing_credentials="$(curl --silent --fail "$KONG_ADMIN_URL/consumers/$KONG_CONSUMER/jwt" | tr -d '\r')"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN=python
else
  echo "[kong-jwt] Python is required to parse existing credentials." >&2
  exit 1
fi

credential_ids=$("$PYTHON_BIN" - "$existing_credentials" <<'PYTHON'
import json, sys
payload = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
for item in payload.get("data", []):
    print(item["id"])
PYTHON
)

for credential_id in $credential_ids; do
  curl --silent --fail --show-error \
    --request DELETE \
    "$KONG_ADMIN_URL/consumers/$KONG_CONSUMER/jwt/$credential_id" >/dev/null
done

echo "[kong-jwt] Creating JWT credential..."
curl --silent --fail --show-error \
  --request POST \
  --data "key=$KONG_JWT_KEY" \
  --data "secret=$KONG_JWT_SECRET" \
  --data "algorithm=HS256" \
  "$KONG_ADMIN_URL/consumers/$KONG_CONSUMER/jwt" >/dev/null

echo "[kong-jwt] Done."
