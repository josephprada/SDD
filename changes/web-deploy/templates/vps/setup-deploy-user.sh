#!/usr/bin/env bash
# setup-deploy-user.sh — Crear usuario deploy para GitHub Actions
# Ejecutar como root en el VPS.
# Uso: DEPLOY_PUBKEY="$(cat deploy_ci.pub)" bash setup-deploy-user.sh

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
WEB_ROOT="${WEB_ROOT:-/var/www/jp-wallet}"

if [[ -z "${DEPLOY_PUBKEY:-}" ]]; then
  echo "ERROR: Define DEPLOY_PUBKEY con la clave pública ed25519 de GitHub Actions."
  echo "  DEPLOY_PUBKEY=\"\$(cat deploy_ci.pub)\" bash $0"
  exit 1
fi

if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  echo "Usuario $DEPLOY_USER creado."
fi

install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
AUTH_KEYS="/home/$DEPLOY_USER/.ssh/authorized_keys"
touch "$AUTH_KEYS"
chmod 600 "$AUTH_KEYS"
chown "$DEPLOY_USER:$DEPLOY_USER" "$AUTH_KEYS"

if ! grep -qF "$DEPLOY_PUBKEY" "$AUTH_KEYS" 2>/dev/null; then
  echo "$DEPLOY_PUBKEY" >> "$AUTH_KEYS"
  echo "Clave pública añadida a authorized_keys."
fi

mkdir -p "$WEB_ROOT"
chown -R nginx:nginx "$WEB_ROOT"
chmod 775 "$WEB_ROOT"

# deploy puede escribir vía grupo (ajustar según política del servidor)
usermod -aG nginx "$DEPLOY_USER" 2>/dev/null || true

SUDOERS_FILE="/etc/sudoers.d/jp-wallet-deploy"
cat > "$SUDOERS_FILE" <<EOF
# JP-WALLET deploy — permisos mínimos para CI
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/cp -a ${WEB_ROOT}.prev/. ${WEB_ROOT}/
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/rm -rf ${WEB_ROOT}/*
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/chown -R nginx\:nginx ${WEB_ROOT}
EOF
chmod 440 "$SUDOERS_FILE"
visudo -c -f "$SUDOERS_FILE"

echo ""
echo "OK: usuario $DEPLOY_USER listo."
echo "  Web root: $WEB_ROOT"
echo "  Probar: ssh -p 22022 $DEPLOY_USER@69.6.234.237"
