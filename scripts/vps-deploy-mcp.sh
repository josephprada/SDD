#!/usr/bin/env bash
# Deploy / update JP-WALLET MCP on the VPS (idempotent).
# Expected cwd layout after rsync: /opt/jp-wallet/mcp-server/{package.json,src/,bun.lock?}
set -euo pipefail

MCP_ROOT="${MCP_ROOT:-/opt/jp-wallet/mcp-server}"
CONVEX_SITE_URL="${CONVEX_SITE_URL:?CONVEX_SITE_URL is required}"
PORT="${PORT:-3100}"
SERVICE_NAME="jp-wallet-mcp"
NGINX_MCP_CONF="/etc/nginx/conf.d/mcp.wallet.lavalex.co.conf"
NGINX_WALLET_CONF="/etc/nginx/conf.d/wallet.lavalex.co.conf"
BUN_BIN="${BUN_BIN:-$(command -v bun || true)}"

if [[ -z "$BUN_BIN" ]]; then
	curl -fsSL https://bun.sh/install | bash
	# shellcheck disable=SC1091
	source "$HOME/.bun/bin/bun" 2>/dev/null || true
	export PATH="$HOME/.bun/bin:/usr/local/bin:$PATH"
	BUN_BIN="$(command -v bun)"
fi

echo "==> MCP root: $MCP_ROOT"
cd "$MCP_ROOT"
"$BUN_BIN" install --frozen-lockfile 2>/dev/null || "$BUN_BIN" install

RUN_USER="${MCP_RUN_USER:-$(id -un)}"
if id jpwallet &>/dev/null; then
	RUN_USER="jpwallet"
fi

chown -R "$RUN_USER:$RUN_USER" "$MCP_ROOT" || true

cat >/etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=JP-WALLET MCP server
After=network.target

[Service]
Type=simple
User=${RUN_USER}
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
systemctl enable --now "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl --no-pager --full status "$SERVICE_NAME" | head -20

# Dedicated vhost (DNS may still be pending)
if [[ -f "$MCP_ROOT/nginx/mcp.wallet.lavalex.co.conf" ]]; then
	cp "$MCP_ROOT/nginx/mcp.wallet.lavalex.co.conf" "$NGINX_MCP_CONF"
fi

# Fallback path on wallet.lavalex.co so MCP is reachable before DNS for mcp.wallet
if [[ -f "$NGINX_WALLET_CONF" ]] && ! grep -q 'location /mcp' "$NGINX_WALLET_CONF"; then
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
if "location /mcp" in text:
    print("wallet nginx already has /mcp")
else:
    if needle not in text:
        raise SystemExit("Could not find insertion point in wallet nginx conf")
    path.write_text(text.replace(needle, block + needle, 1))
    print("Inserted /mcp fallback into wallet nginx conf")
PY
fi

nginx -t
systemctl reload nginx

# Optional: issue cert when DNS already points here (non-fatal)
if getent hosts mcp.wallet.lavalex.co >/dev/null 2>&1; then
	certbot --nginx -d mcp.wallet.lavalex.co --non-interactive --agree-tos \
		-m "${CERTBOT_EMAIL:-admin@lavalex.co}" --redirect || \
		echo "WARN: certbot for mcp.wallet.lavalex.co failed (check DNS/SAN)"
else
	echo "WARN: mcp.wallet.lavalex.co DNS not resolved yet — use https://wallet.lavalex.co/mcp"
fi

curl -fsS "http://127.0.0.1:${PORT}/healthz"
echo
echo "Deploy MCP OK (local healthz)"
