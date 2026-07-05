# GitHub Secrets — configuración manual

Configurar en: **GitHub → josephprada/SDD → Settings → Secrets and variables → Actions**

Crear environment **`production`** (opcional pero recomendado) y añadir:

| Secret | Valor |
|--------|-------|
| `CONVEX_DEPLOY_KEY` | Dashboard Convex → jp-wallet → **Production** → Settings → **Generate Deploy Key** |
| `VITE_CONVEX_URL_PROD` | `https://cheery-bass-870.convex.cloud` |
| `VITE_GOOGLE_CLIENT_ID` | Mismo que `VITE_GOOGLE_CLIENT_ID` en `.env.local` |
| `VITE_VAPID_PUBLIC_KEY` | Misma clave pública que `VAPID_PUBLIC_KEY` en Convex prod (Web Push) |
| `VPS_HOST` | `69.6.234.237` |
| `VPS_SSH_PORT` | `22022` |
| `VPS_SSH_USER` | `deploy` |
| `VPS_SSH_KEY` | Contenido de `deploy-keys/github-actions` (clave **privada**, generada localmente) |

## Clave SSH para CI

La clave privada está en (no commitear):

```
deploy-keys/github-actions
```

La pública ya está en el VPS (`deploy` user).

## Google Cloud Console

En el OAuth client existente, añadir:

**Authorized JavaScript origins**
```
https://wallet.lavalex.co
```

**Authorized redirect URIs**
```
https://cheery-bass-870.convex.site/api/auth/callback/google
```

## DNS (bloqueante para TLS)

En Hostinger → DNS de `lavalex.co`:

```
Tipo: A
Nombre: wallet
Valor: 69.6.234.237
TTL: 3600 (o default)
```

Tras propagar (5–30 min), en el VPS:

```bash
certbot certonly --nginx -d lavalex.co -d www.lavalex.co -d wallet.lavalex.co --expand
nginx -t && systemctl reload nginx
```
