#!/usr/bin/env bash
# Bootstrap ONE-SHOT como root en el VPS (Hostinger console / ssh root).
# Instala Bun si falta, MCP en /opt/jp-wallet/mcp-server, systemd, Nginx
# (vhost mcp.wallet + fallback /mcp en wallet) y amplía sudoers del usuario deploy.
#
# Repo privado: exporta GIT_TOKEN (PAT read-only) o deja el código ya en MCP_ROOT.
#
# Uso:
#   export CONVEX_SITE_URL="https://YOUR_DEPLOYMENT.convex.site"
#   export GIT_TOKEN="ghp_…"   # solo si clonas el repo privado
#   bash vps-bootstrap-mcp-root.sh
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
	echo "ERROR: ejecutar como root" >&2
	exit 1
fi

: "${CONVEX_SITE_URL:?Define CONVEX_SITE_URL=https://….convex.site}"

DEPLOY_USER="${DEPLOY_USER:-deploy}"
MCP_ROOT="/opt/jp-wallet/mcp-server"
PORT="${PORT:-3100}"
REPO_URL="${REPO_URL:-https://github.com/josephprada/SDD.git}"
BRANCH="${BRANCH:-main}"
WORKDIR="${WORKDIR:-/tmp/jp-wallet-mcp-bootstrap}"

echo "==> CONVEX_SITE_URL=$CONVEX_SITE_URL"

if ! command -v bun >/dev/null 2>&1; then
	curl -fsSL https://bun.sh/install | bash
	export PATH="/root/.bun/bin:/usr/local/bin:$PATH"
	ln -sfn /root/.bun/bin/bun /usr/local/bin/bun
fi
BUN_BIN="$(command -v bun)"

if [[ -f "$MCP_ROOT/package.json" && -d "$MCP_ROOT/src" ]]; then
	echo "==> Usando código ya presente en $MCP_ROOT"
else
	rm -rf "$WORKDIR"
	clone_url="$REPO_URL"
	if [[ -n "${GIT_TOKEN:-}" ]]; then
		clone_url="https://${GIT_TOKEN}@github.com/josephprada/SDD.git"
	fi
	if ! git clone --depth 1 --branch "$BRANCH" "$clone_url" "$WORKDIR"; then
		echo "ERROR: no se pudo clonar $REPO_URL (repo privado → export GIT_TOKEN=…)" >&2
		echo "  Alternativa: copia apps/mcp-server a $MCP_ROOT y reintenta." >&2
		exit 1
	fi
	mkdir -p "$MCP_ROOT/nginx"
	rsync -a --delete "$WORKDIR/apps/mcp-server/" "$MCP_ROOT/"
	cp "$WORKDIR/scripts/vps-deploy-mcp.sh" "$MCP_ROOT/vps-deploy-mcp.sh"
	cp "$WORKDIR/changes/web-deploy/templates/nginx/mcp.wallet.lavalex.co.conf" \
		"$MCP_ROOT/nginx/mcp.wallet.lavalex.co.conf"
	chmod +x "$MCP_ROOT/vps-deploy-mcp.sh"
	rm -rf "$WORKDIR"
fi

# Usuario de servicio
if ! id jpwallet &>/dev/null; then
	useradd -r -m -s /usr/sbin/nologin jpwallet 2>/dev/null || useradd -r -m jpwallet
fi
chown -R jpwallet:jpwallet "$MCP_ROOT"
if id "$DEPLOY_USER" &>/dev/null; then
	usermod -aG jpwallet "$DEPLOY_USER" || true
	chmod -R g+w "$MCP_ROOT"
	setfacl -R -m u:${DEPLOY_USER}:rwX "$MCP_ROOT" 2>/dev/null || \
		chown -R ${DEPLOY_USER}:jpwallet "$MCP_ROOT"
fi

cd "$MCP_ROOT"
if id jpwallet &>/dev/null; then
	sudo -u jpwallet -H env HOME="$(getent passwd jpwallet | cut -d: -f6)" PATH="$PATH" \
		"$BUN_BIN" install || "$BUN_BIN" install
else
	"$BUN_BIN" install
fi

cat >/etc/systemd/system/jp-wallet-mcp.service <<EOF
[Unit]
Description=JP-WALLET MCP server
After=network.target

[Service]
Type=simple
User=jpwallet
WorkingDirectory=${MCP_ROOT}
ExecStart=${BUN_BIN} run src/index.ts --http --port ${PORT}
Environment=CONVEX_SITE_URL=${CONVEX_SITE_URL}
Environment=PORT=${PORT}
Restart=always
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now jp-wallet-mcp
systemctl restart jp-wallet-mcp

if [[ -f "$MCP_ROOT/nginx/mcp.wallet.lavalex.co.conf" ]]; then
	cp "$MCP_ROOT/nginx/mcp.wallet.lavalex.co.conf" /etc/nginx/conf.d/mcp.wallet.lavalex.co.conf
fi

WALLET_CONF="/etc/nginx/conf.d/wallet.lavalex.co.conf"
if [[ -f "$WALLET_CONF" ]] && ! grep -q 'location /mcp' "$WALLET_CONF"; then
	python3 - <<'PY'
from pathlib import Path
path = Path("/etc/nginx/conf.d/wallet.lavalex.co.conf")
text = path.read_text()
needle = "    location / {\n"
block = """    # MCP fallback (until mcp.wallet.lavalex.co DNS/TLS is ready)
    location = /mcp-healthz {
        proxy_pass http://127.0.0.1:3100/healthz;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /mcp {
        proxy_pass http://127.0.0.1:3100/mcp;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Authorization $http_authorization;
        proxy_buffering off;
        proxy_read_timeout 300s;
    }

"""
if "location /mcp" not in text:
    if needle not in text:
        raise SystemExit("insertion point missing in wallet nginx conf")
    path.write_text(text.replace(needle, block + needle, 1))
PY
fi

nginx -t
systemctl reload nginx

SUDOERS_FILE="/etc/sudoers.d/jp-wallet-deploy"
cat >"$SUDOERS_FILE" <<EOF
# JP-WALLET deploy — web + MCP
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/rm -rf /var/www/jp-wallet.prev
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/cp -a /var/www/jp-wallet /var/www/jp-wallet.prev
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/cp -a /var/www/jp-wallet.prev/. /var/www/jp-wallet/
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/rm -rf /var/www/jp-wallet/*
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/chown -R nginx\:nginx /var/www/jp-wallet
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl daemon-reload
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart jp-wallet-mcp
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl start jp-wallet-mcp
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl enable jp-wallet-mcp
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl status jp-wallet-mcp
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/cp /opt/jp-wallet/mcp-server/nginx/mcp.wallet.lavalex.co.conf /etc/nginx/conf.d/mcp.wallet.lavalex.co.conf
EOF
chmod 440 "$SUDOERS_FILE"
visudo -c -f "$SUDOERS_FILE"

curl -fsS "http://127.0.0.1:${PORT}/healthz"
echo
echo "OK bootstrap MCP."
echo "  Local:    http://127.0.0.1:${PORT}/healthz"
echo "  Fallback: https://wallet.lavalex.co/mcp"
echo "  DNS: A record  mcp.wallet → 69.6.234.237  luego: certbot --nginx -d mcp.wallet.lavalex.co"
