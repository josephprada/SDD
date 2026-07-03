#!/usr/bin/env bash
# Manual production deploy (same steps as GitHub Actions)
# Usage: ./scripts/deploy-production.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROD_URL="${VITE_CONVEX_URL_PROD:-https://cheery-bass-870.convex.cloud}"
GOOGLE_ID="${VITE_GOOGLE_CLIENT_ID:-}"

if [[ -z "$GOOGLE_ID" && -f .env.local ]]; then
  GOOGLE_ID="$(grep '^VITE_GOOGLE_CLIENT_ID=' .env.local | cut -d= -f2-)"
fi

if [[ -z "$GOOGLE_ID" ]]; then
  echo "ERROR: Set VITE_GOOGLE_CLIENT_ID or define it in .env.local"
  exit 1
fi

SSH_KEY="${DEPLOY_SSH_KEY:-$ROOT/deploy-keys/github-actions}"
VPS_HOST="${VPS_HOST:-69.6.234.237}"
VPS_PORT="${VPS_SSH_PORT:-22022}"
VPS_USER="${VPS_SSH_USER:-deploy}"
WEB_ROOT="/var/www/jp-wallet"

echo "==> Deploy Convex prod"
env -u CONVEX_DEPLOYMENT bunx convex deploy -y

echo "==> Build frontend"
env -u CONVEX_DEPLOYMENT \
  VITE_CONVEX_URL="$PROD_URL" \
  VITE_GOOGLE_CLIENT_ID="$GOOGLE_ID" \
  bun run build

echo "==> Backup on VPS"
ssh -p "$VPS_PORT" -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new \
  "$VPS_USER@$VPS_HOST" \
  "if [ -d '$WEB_ROOT' ] && [ \"\$(ls -A $WEB_ROOT 2>/dev/null)\" ]; then rm -rf ${WEB_ROOT}.prev && cp -a $WEB_ROOT ${WEB_ROOT}.prev; fi"

echo "==> Rsync dist"
rsync -avz --no-owner --no-group --delete \
  -e "ssh -p $VPS_PORT -i $SSH_KEY -o StrictHostKeyChecking=accept-new" \
  apps/web/dist/ "$VPS_USER@$VPS_HOST:$WEB_ROOT/" || true

echo "==> Permissions + nginx reload"
ssh -p "$VPS_PORT" -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" \
  "sudo chown -R nginx:nginx $WEB_ROOT && sudo nginx -t && sudo systemctl reload nginx"

echo "OK: https://wallet.lavalex.co (requires DNS + TLS)"
