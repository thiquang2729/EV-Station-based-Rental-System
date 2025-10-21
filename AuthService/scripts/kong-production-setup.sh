#!/usr/bin/env bash
# Apply the declarative configuration to Kong once the Admin API is ready.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KONG_CONFIG_FILE="${KONG_CONFIG_FILE:-$ROOT_DIR/kong/kong.yml}"
KONG_ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"

if [[ ! -f "$KONG_CONFIG_FILE" ]]; then
  echo "[kong-setup] Missing Kong config file at $KONG_CONFIG_FILE" >&2
  exit 1
fi

echo "[kong-setup] Waiting for Kong Admin API at $KONG_ADMIN_URL ..."
until curl --silent --fail "$KONG_ADMIN_URL/status" >/dev/null; do
  sleep 2
done

echo "[kong-setup] Admin API is reachable. Pushing config..."
curl --silent --fail --show-error \
  --request POST \
  --header "Content-Type: application/yaml" \
  --data-binary @"$KONG_CONFIG_FILE" \
  "$KONG_ADMIN_URL/config"

echo "[kong-setup] Configuration uploaded successfully."
