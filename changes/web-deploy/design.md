# Design: Web Deploy

**Change**: web-deploy
**Spec**: `changes/web-deploy/spec.md`
**Rama**: `feat/web-deploy`

---

## Enfoque Técnico

Despliegue **frontend-only** en VPS Hostinger existente. Backend permanece en **Convex Cloud** (deployment de producción). El pipeline vive en **GitHub Actions**; el VPS solo recibe artefactos estáticos y recarga Nginx.

La decisión central es **no reestructurar la infra del VPS** (Nginx + Certbot ya operativos con `lavalex.co` y `jarvis.lavalex.co`), sino añadir un virtual host aislado para JP-WALLET.

---

## Decisiones de Arquitectura

| # | Pregunta | Decisión | Tradeoff |
|---|----------|----------|----------|
| D-01 | Reverse proxy | **Nginx** existente | Desvía de SPEC §6 (Caddy); menor riesgo en VPS ya en prod |
| D-02 | URL producción | `https://wallet.lavalex.co` | `lavalex.co` raíz intacto |
| D-03 | Backend | **Convex Cloud prod** (deployment separado) | No self-host; coste cloud vs simplicidad |
| D-04 | Trigger CI/CD | Push a **`main`** | Repo usa `main`; flujo `testing` → PR → `main` |
| D-05 | Build | **GitHub Actions** (ubuntu-latest + Bun) | VPS 1.7 GB no compila |
| D-06 | Entrega al VPS | **rsync/scp** de `apps/web/dist/` | Simple; sin registry Docker |
| D-07 | Usuario SSH CI | **`deploy`** + sudoers para nginx reload | No usar root en Actions |
| D-08 | Contenedor frontend | **Ninguno** | Mismo patrón que `/var/www/lavalex` |
| D-09 | Backup pre-deploy | Copia `dist` → `dist.prev` en VPS | Rollback manual rápido |
| D-10 | Rama de integración | `testing` acumula; `main` despliega | Alineado a workflow actual del proyecto |

---

## Arquitectura de Red

```text
                    ┌─────────────────────────────────────┐
                    │           GitHub Actions            │
                    │  convex deploy --prod │ bun build     │
                    │  rsync dist → VPS    │ nginx reload │
                    └──────────────┬──────────────────────┘
                                   │ SSH :22022
                                   ▼
┌──────────────────────────────────────────────────────────────┐
│ VPS 69.6.234.237 (Nginx :443)                                │
│  lavalex.co      → /var/www/lavalex        (sin cambios)     │
│  jarvis.lavalex  → 127.0.0.1:18789         (sin cambios)     │
│  wallet.lavalex  → /var/www/jp-wallet      (NUEVO)         │
└──────────────────────────────────────────────────────────────┘
                                   │
                                   │ HTTPS (cliente)
                                   ▼
┌──────────────────────────────────────────────────────────────┐
│ Convex Cloud (production deployment)                         │
│  Auth (@convex-dev/auth) │ DB │ File storage │ Functions      │
└──────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                          Google OAuth 2.0
```

---

## Flujo de Release

```text
Developer merge PR: testing → main
  → workflow deploy-production.yml
    1. checkout + bun install
    2. CONVEX_DEPLOY_KEY → bunx convex deploy --prod
    3. VITE_CONVEX_URL_PROD + VITE_GOOGLE_CLIENT_ID → bun run build
    4. ssh: mv jp-wallet → jp-wallet.prev (backup)
    5. rsync apps/web/dist/ → /var/www/jp-wallet/
    6. chown nginx:nginx
    7. sudo nginx -t && sudo systemctl reload nginx
```

---

## Convex Producción

### Crear deployment

1. Dashboard Convex → proyecto → **Create production deployment** (o `convex deploy --prod` tras configurar prod).
2. Generar **Deploy Key** → GitHub Secret `CONVEX_DEPLOY_KEY`.

### Variables de entorno (Convex prod)

| Variable | Ejemplo | Dónde |
|----------|---------|-------|
| `SITE_URL` | `https://wallet.lavalex.co` | Convex |
| `AUTH_GOOGLE_ID` | `*.apps.googleusercontent.com` | Convex |
| `AUTH_GOOGLE_SECRET` | *(secret)* | Convex |
| `JWT_PRIVATE_KEY` | *(RS256)* | Convex — `bun run convex:setup-jwt` contra prod |
| `JWKS` | *(JSON)* | Convex — mismo script |

### Variables build (GitHub Secrets → Vite)

| Variable | Secret GitHub |
|----------|---------------|
| `VITE_CONVEX_URL` | `VITE_CONVEX_URL_PROD` |
| `VITE_GOOGLE_CLIENT_ID` | `VITE_GOOGLE_CLIENT_ID` |

`VITE_CONVEX_SITE_URL` — verificar si la app la requiere en prod; si no se usa en runtime, omitir.

---

## Google OAuth (producción)

En [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth 2.0 Client:

**Authorized JavaScript origins**
```
https://wallet.lavalex.co
```

**Authorized redirect URIs** (confirmar en dashboard Convex Auth tras primer deploy):
```
https://<deployment-name>.convex.site/api/auth/callback/google
```
*(La URI exacta depende del deployment prod — documentar en quickstart tras crear prod.)*

---

## VPS — Nginx

Plantilla: `changes/web-deploy/templates/nginx/wallet.lavalex.co.conf`

- Archivo nuevo en `/etc/nginx/conf.d/` — **no editar** `lavalex.conf` ni `jarvis.lavalex.co.conf`.
- SPA: `try_files $uri $uri/ /index.html`.
- Cache largo para assets hasheados (`js`, `css`, imágenes, fuentes).
- TLS: certificado Let's Encrypt expandido.

### Certbot

```bash
certbot certonly --nginx \
  -d lavalex.co -d www.lavalex.co -d wallet.lavalex.co \
  --expand
nginx -t && systemctl reload nginx
```

---

## VPS — Usuario deploy

Script plantilla: `changes/web-deploy/templates/vps/setup-deploy-user.sh`

```text
deploy
├── ~/.ssh/authorized_keys   ← clave pública GitHub Actions
└── escribe en /var/www/jp-wallet (grupo www o ACL)
└── sudo nginx -t && sudo systemctl reload nginx (sudoers)
```

---

## Estructura de Archivos (change + implementación)

| Path | Acción |
|------|--------|
| `changes/web-deploy/proposal.md` | Crear |
| `changes/web-deploy/spec.md` | Crear |
| `changes/web-deploy/design.md` | Crear |
| `changes/web-deploy/tasks.md` | Crear |
| `changes/web-deploy/quickstart.md` | Crear |
| `changes/web-deploy/research.md` | Crear |
| `changes/web-deploy/checklists/pre-deploy.md` | Crear |
| `changes/web-deploy/templates/nginx/wallet.lavalex.co.conf` | Crear |
| `changes/web-deploy/templates/github/deploy-production.yml` | Crear |
| `changes/web-deploy/templates/env.production.example` | Crear |
| `changes/web-deploy/templates/vps/setup-deploy-user.sh` | Crear |
| `changes/web-deploy/templates/vps/initial-server-setup.sh` | Crear |
| `.github/workflows/deploy-production.yml` | Copiar desde template (fase implementación) |
| `.env.production.example` | Opcional en raíz (copia del template) |

---

## GitHub Secrets (inventario)

| Secret | Descripción |
|--------|-------------|
| `CONVEX_DEPLOY_KEY` | Deploy key prod Convex |
| `VITE_CONVEX_URL_PROD` | URL HTTPS del deployment prod |
| `VITE_GOOGLE_CLIENT_ID` | Client ID OAuth |
| `VPS_HOST` | `69.6.234.237` |
| `VPS_SSH_PORT` | `22022` |
| `VPS_SSH_USER` | `deploy` |
| `VPS_SSH_KEY` | Clave privada ed25519 (solo CI) |

---

## Estrategia de Testing

| Capa | Qué | Cómo |
|------|-----|------|
| Pre-deploy | DNS, cert, nginx -t | Checklist manual |
| Post-deploy | Login Google | Smoke en `wallet.lavalex.co` |
| Post-deploy | CRUD mínimo | quickstart web-core adaptado a prod |
| CI | Build + convex deploy dry-run | Workflow en branch antes de activar en main |

---

## Decisiones Cerradas (pendiente revisión usuario)

| ID | Decisión | Estado |
|----|----------|--------|
| P-01 | Subdominio `wallet.lavalex.co` | ✅ Confirmado |
| P-02 | Trigger deploy en `main` | ✅ Confirmado |
| P-03 | Convex cloud prod | ✅ Confirmado |
| P-04 | Mismo vs separado OAuth client dev/prod | ⏳ Abrir |
| P-05 | Backup `dist.prev` en cada deploy | ✅ Recomendado |
