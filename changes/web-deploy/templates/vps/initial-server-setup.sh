#!/usr/bin/env bash
# initial-server-setup.sh — Setup one-time JP-WALLET en VPS (como root)
# Ejecutar DESPUÉS de setup-deploy-user.sh y con DNS wallet.lavalex.co propagado.

set -euo pipefail

WEB_ROOT="/var/www/jp-wallet"
NGINX_CONF="/etc/nginx/conf.d/wallet.lavalex.co.conf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Crear directorio web"
mkdir -p "$WEB_ROOT"
chown -R nginx:nginx "$WEB_ROOT"

echo "==> Instalar config Nginx"
if [[ -f "$SCRIPT_DIR/../nginx/wallet.lavalex.co.conf" ]]; then
  cp "$SCRIPT_DIR/../nginx/wallet.lavalex.co.conf" "$NGINX_CONF"
else
  echo "ERROR: No se encuentra wallet.lavalex.co.conf junto a este script."
  exit 1
fi

echo "==> Expandir certificado SSL"
certbot certonly --nginx \
  -d lavalex.co \
  -d www.lavalex.co \
  -d wallet.lavalex.co \
  --expand \
  --non-interactive \
  --agree-tos \
  -m "${CERTBOT_EMAIL:-admin@lavalex.co}" || {
    echo "WARN: certbot falló — ejecutar manualmente si es necesario."
  }

echo "==> Validar y recargar Nginx"
nginx -t
systemctl reload nginx

echo ""
echo "OK: VPS listo para recibir el primer rsync de dist/."
echo "  Placeholder opcional:"
echo "    echo '<h1>JP-WALLET — pending deploy</h1>' > $WEB_ROOT/index.html"
echo "    chown nginx:nginx $WEB_ROOT/index.html"
