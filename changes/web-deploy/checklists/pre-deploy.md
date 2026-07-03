# Checklist Pre-Deploy — Web Deploy

Usar antes del **primer** deploy a producción y antes de cada release mayor.

**Última validación**: 2026-07-03 — primer deploy MVP completado.

---

## DNS y dominio

- [x] Registro `A` `wallet` → `69.6.234.237` propagado (`dig wallet.lavalex.co +short`)
- [x] `lavalex.co` y `www` siguen apuntando al VPS
- [x] No se modificó DNS del sitio raíz sin necesidad

## VPS — sitios existentes (baseline)

- [x] `curl -sI https://lavalex.co` → 200/301 OK
- [x] `curl -sI https://jarvis.lavalex.co` → respuesta esperada
- [x] `/googlechat` en lavalex.co sigue operativo (si aplica)
- [x] Backup de `/etc/nginx/conf.d/lavalex.conf` y `jarvis.lavalex.co.conf`

## VPS — JP-WALLET

- [x] `/var/www/jp-wallet` existe, propietario `nginx`
- [x] `/etc/nginx/conf.d/wallet.lavalex.co.conf` instalado
- [x] `nginx -t` exitoso
- [x] Certificado incluye `wallet.lavalex.co` (`certbot certificates`)
- [x] Usuario `deploy` creado con clave CI
- [x] `deploy` puede escribir en `/var/www/jp-wallet`
- [x] `deploy` puede `sudo nginx -t` y `sudo systemctl reload nginx`

## Convex producción

- [x] Deployment prod separado de dev
- [x] `SITE_URL=https://wallet.lavalex.co`
- [x] `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` en prod
- [x] `JWT_PRIVATE_KEY` y `JWKS` configurados
- [x] `bunx convex deploy --prod` exitoso manualmente

## Google OAuth

- [x] Origin `https://wallet.lavalex.co` registrado
- [x] Redirect URI de Convex Auth prod registrada
- [x] Login probado en prod (desktop + móvil)

## GitHub

- [x] Secrets configurados (ver `GITHUB_SECRETS.md`)
- [x] Workflow solo en `main` (o `workflow_dispatch` para prueba)
- [x] Clave SSH de CI **no** es la clave personal del desarrollador

## Seguridad

- [ ] Contraseña root rotada tras compartirla en chat — *pendiente*
- [ ] Login SSH por contraseña deshabilitado (opcional post-setup)
- [x] Ningún secreto en el repositorio git

## Post-deploy smoke

- [x] Login / logout (desktop y móvil)
- [x] Datos migrados desde dev verificados en prod
- [x] Dashboard con saldo y transacciones
- [ ] Transferencia entre cuentas — *no verificado explícitamente en smoke final*
- [ ] Adjunto JPEG — *no verificado explícitamente en smoke final*
- [x] Regresión `lavalex.co` / `jarvis.lavalex.co`

---

**Aprobación**: usuario (smoke OK) **Fecha**: 2026-07-03
