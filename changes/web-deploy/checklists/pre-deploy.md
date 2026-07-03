# Checklist Pre-Deploy — Web Deploy

Usar antes del **primer** deploy a producción y antes de cada release mayor.

---

## DNS y dominio

- [ ] Registro `A` `wallet` → `69.6.234.237` propagado (`dig wallet.lavalex.co +short`)
- [ ] `lavalex.co` y `www` siguen apuntando al VPS
- [ ] No se modificó DNS del sitio raíz sin necesidad

## VPS — sitios existentes (baseline)

- [ ] `curl -sI https://lavalex.co` → 200/301 OK
- [ ] `curl -sI https://jarvis.lavalex.co` → respuesta esperada
- [ ] `/googlechat` en lavalex.co sigue operativo (si aplica)
- [ ] Backup de `/etc/nginx/conf.d/lavalex.conf` y `jarvis.lavalex.co.conf`

## VPS — JP-WALLET

- [ ] `/var/www/jp-wallet` existe, propietario `nginx`
- [ ] `/etc/nginx/conf.d/wallet.lavalex.co.conf` instalado
- [ ] `nginx -t` exitoso
- [ ] Certificado incluye `wallet.lavalex.co` (`certbot certificates`)
- [ ] Usuario `deploy` creado con clave CI
- [ ] `deploy` puede escribir en `/var/www/jp-wallet`
- [ ] `deploy` puede `sudo nginx -t` y `sudo systemctl reload nginx`

## Convex producción

- [ ] Deployment prod separado de dev
- [ ] `SITE_URL=https://wallet.lavalex.co`
- [ ] `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` en prod
- [ ] `JWT_PRIVATE_KEY` y `JWKS` configurados
- [ ] `bunx convex deploy --prod` exitoso manualmente

## Google OAuth

- [ ] Origin `https://wallet.lavalex.co` registrado
- [ ] Redirect URI de Convex Auth prod registrada
- [ ] Login probado en prod (smoke)

## GitHub

- [ ] Secrets configurados (ver `design.md`)
- [ ] Workflow solo en `main` (o `workflow_dispatch` para prueba)
- [ ] Clave SSH de CI **no** es la clave personal del desarrollador

## Seguridad

- [ ] Contraseña root rotada tras compartirla en chat
- [ ] Login SSH por contraseña deshabilitado (opcional post-setup)
- [ ] Ningún secreto en el repositorio git

## Post-deploy smoke

- [ ] Login / logout
- [ ] Crear cuenta + gasto + saldo correcto
- [ ] Transferencia entre cuentas
- [ ] Adjunto JPEG
- [ ] Regresión `lavalex.co` / `jarvis.lavalex.co`

---

**Aprobación**: _______________ **Fecha**: _______________
