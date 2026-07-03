# Quickstart: Web Deploy (Producción)

## Resumen

| Item | Valor |
|------|-------|
| URL app | `https://wallet.lavalex.co` |
| Convex prod | `https://cheery-bass-870.convex.cloud` |
| Convex dashboard | https://dashboard.convex.dev/t/joseph-desarrollador/jp-wallet/cheery-bass-870 |
| VPS | `69.6.234.237:22022` |
| Web root | `/var/www/jp-wallet` |
| Backend | Convex Cloud **production** |
| Deploy | GitHub Actions → push `main` |

---

## Precondiciones

- [x] `web-core` mergeado en `testing` y listo para `main`
- [x] DNS `wallet.lavalex.co` → `69.6.234.237`
- [x] Deployment Convex prod creado
- [x] Google OAuth con URIs de prod
- [x] Usuario `deploy` en VPS
- [x] GitHub Secrets configurados (ver `GITHUB_SECRETS.md`)

---

## 1. Convex producción (una vez)

```bash
# Desde la raíz del monorepo, con CLI apuntando a prod
bunx convex deploy --prod

# Variables (reemplazar valores reales)
bunx convex env set SITE_URL "https://wallet.lavalex.co" --prod
bunx convex env set AUTH_GOOGLE_ID "<google-client-id>" --prod
bunx convex env set AUTH_GOOGLE_SECRET "<google-client-secret>" --prod

# JWT para @convex-dev/auth (prod)
# Asegúrate de que convex CLI usa prod antes de ejecutar:
bun run convex:setup-jwt
```

Anota la URL del deployment prod (ej. `https://happy-animal-123.convex.cloud`) → GitHub Secret `VITE_CONVEX_URL_PROD`.

En **Google Cloud Console** → OAuth client:
- **Authorized JavaScript origins**: `https://wallet.lavalex.co`
- **Authorized redirect URIs**: ver dashboard Convex Auth para el deployment prod

Genera **Deploy Key** en Convex → GitHub Secret `CONVEX_DEPLOY_KEY`.

---

## 2. VPS — setup inicial (una vez)

Conectar:
```bash
ssh -p 22022 root@69.6.234.237
```

Ejecutar plantillas del change (copiar al servidor o pegar contenido):

```bash
# Usuario deploy + directorio app
bash /path/to/setup-deploy-user.sh

mkdir -p /var/www/jp-wallet
chown -R nginx:nginx /var/www/jp-wallet

# Nginx virtual host
cp wallet.lavalex.co.conf /etc/nginx/conf.d/wallet.lavalex.co.conf

# TLS
certbot certonly --nginx \
  -d lavalex.co -d www.lavalex.co -d wallet.lavalex.co \
  --expand

nginx -t && systemctl reload nginx
```

Verificar sitios existentes:
```bash
curl -sI https://lavalex.co | head -3
curl -sI https://jarvis.lavalex.co | head -3
curl -sI https://wallet.lavalex.co | head -3
```

---

## 3. GitHub Secrets

| Secret | Valor |
|--------|-------|
| `CONVEX_DEPLOY_KEY` | Deploy key Convex prod |
| `VITE_CONVEX_URL_PROD` | URL HTTPS deployment prod |
| `VITE_GOOGLE_CLIENT_ID` | Client ID OAuth |
| `VPS_HOST` | `69.6.234.237` |
| `VPS_SSH_PORT` | `22022` |
| `VPS_SSH_USER` | `deploy` |
| `VPS_SSH_KEY` | Clave privada ed25519 (solo CI) |

---

## 4. Primer deploy

```bash
# Flujo normal del proyecto
git checkout testing
git pull
# ... merge a main vía PR ...
git checkout main
git merge testing
git push origin main
```

El workflow `.github/workflows/deploy-production.yml` debe:
1. Desplegar Convex prod
2. Compilar frontend
3. Rsync a `/var/www/jp-wallet`
4. Recargar Nginx

Monitorear en GitHub → Actions.

---

## 5. Smoke test producción

En `https://wallet.lavalex.co`:

1. **Login** — Continuar con Google → dashboard.
2. **Cuenta** — Crear `Efectivo` con `$ 100.000`.
3. **Gasto** — `$ 25.000`, categoría `Comida`.
4. **Verificar** — Saldo `$ 75.000` en cuenta y dashboard.
5. **Transferencia** — Crear `Banco`, transferir `$ 20.000`.
6. **Adjunto** — Subir JPEG a un movimiento; preview y delete.
7. **Logout** — Sidebar desktop o Ajustes móvil → `/login`.
8. **Regresión** — `https://lavalex.co` y `https://jarvis.lavalex.co` OK.

---

## 6. Rollback frontend (emergencia)

En el VPS:
```bash
ssh -p 22022 deploy@69.6.234.237
sudo rm -rf /var/www/jp-wallet/*
sudo cp -a /var/www/jp-wallet.prev/. /var/www/jp-wallet/
sudo nginx -t && sudo systemctl reload nginx
```

Rollback Convex: redeploy commit anterior con `convex deploy --prod` desde máquina local o re-run workflow en commit previo.

---

## 7. Desarrollo local (sin cambios)

```bash
bun install
bunx convex dev    # deployment dev
bun dev            # http://localhost:5173
```

Prod y dev permanecen **aislados**.

---

## Troubleshooting

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Google `redirect_uri_mismatch` | URI no registrada | Añadir URI exacta de Convex Auth en Google Console |
| Pantalla blanca post-login | `SITE_URL` incorrecta | `convex env set SITE_URL` en prod |
| 404 en rutas `/accounts` | Nginx sin `try_files` | Revisar `wallet.lavalex.co.conf` |
| Certificado inválido en wallet | SAN faltante | `certbot --expand` |
| Deploy CI falla SSH | Clave/usuario deploy | Revisar `VPS_SSH_*` secrets |
| Login móvil spinner infinito | Popup OAuth en touch | Redirect a `/login?code=` vía `signIn({ redirectTo })` |
| COOP bloquea popup desktop | Header / polling `popup.closed` | `same-origin-allow-popups` en Nginx + fix popup |

---

## Estado del change

**Completado** (2026-07-03). App en prod: `https://wallet.lavalex.co`.

**Siguiente paso git**: merge `feat/web-deploy` → `testing` → `main` para activar el primer deploy CI.
