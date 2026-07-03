# Propuesta: Change — Web Deploy (MVP Producción)

**Versión**: 1.0.0
**Estado**: Borrador (revisión)
**Change**: web-deploy
**Creado**: 2026-07-03
**Rama prevista**: `feat/web-deploy` → `testing` → `main`

---

## Intención

Poner **JP-WALLET** en producción como primer alcance usable: desplegar el frontend en el VPS existente (`wallet.lavalex.co`), conectar un **deployment Convex de producción** y automatizar el release con **GitHub Actions** cada vez que `main` reciba el merge desde `testing`.

El usuario debe poder registrar gastos, ingresos, transferencias y adjuntos en el dominio real, sin afectar los sitios ya desplegados en el mismo servidor.

## Alcance

### Dentro del Scope

- **Subdominio dedicado**: `wallet.lavalex.co` (SPA estática Vite/React).
- **Preservar sitios existentes** en el VPS:
  - `lavalex.co` / `www.lavalex.co` → `/var/www/lavalex`
  - `jarvis.lavalex.co` → proxy OpenClaw `127.0.0.1:18789`
  - Ruta `/googlechat` en `lavalex.co` sin cambios.
- **Convex Cloud producción**: deployment separado de dev; variables `SITE_URL`, OAuth Google, JWT auth.
- **CI/CD**: workflow en GitHub que en push a `main`:
  1. Despliega funciones Convex a prod.
  2. Compila frontend con variables de prod.
  3. Sincroniza `apps/web/dist/` al VPS.
  4. Recarga Nginx.
- **Infra en VPS**: Nginx + Certbot (alineado a la auditoría real del servidor; no introducir Caddy si no es necesario).
- **Usuario `deploy`** en VPS para CI (SSH por clave, permisos mínimos sobre `/var/www/jp-wallet`).
- **Documentación**: spec, design, tasks, quickstart, plantillas en `changes/web-deploy/templates/`.
- **Checklist pre-deploy** y smoke tests de producción.

### Fuera del Scope

- Staging separado (`staging.wallet.lavalex.co`) — fase 2 opcional.
- Self-host de Convex en el VPS.
- Docker para el frontend (el patrón actual del VPS es Nginx sirviendo estáticos).
- Blue/green, canary o rollback automático en CI.
- Monitoreo/alerting (Sentry, Uptime Kuma, etc.) — change posterior.
- Multi-usuario / invitaciones / registro abierto.
- Cambios de producto (Change 3 configuración, reportes, etc.).

## Capabilities

### Capabilities Nuevas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `production-hosting` | NUEVA | Servir build estático de JP-WALLET en `wallet.lavalex.co` vía Nginx |
| `convex-production` | NUEVA | Deployment Convex prod aislado de dev con secrets y OAuth prod |
| `release-automation` | NUEVA | Pipeline GitHub Actions: Convex deploy + build + rsync + nginx reload |

### Capabilities Modificadas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `auth-google-oauth` | MODIFICADA | Orígenes y redirect URIs de producción en Google Cloud + `SITE_URL` prod |

## Enfoque

### Arquitectura (resumen)

```
GitHub (push main)
  → Actions: convex deploy --prod
  → Actions: bun run build (VITE_* prod)
  → Actions: rsync → VPS:/var/www/jp-wallet
  → Actions: ssh nginx -t && reload

Usuario → https://wallet.lavalex.co (Nginx)
       → https://<prod>.convex.cloud (Convex)
       → Google OAuth
```

### Desviación respecto a SPEC.md §6

`SPEC.md` menciona Docker Compose + Caddy. La **auditoría del VPS** (2026-07-03) confirma **Nginx 1.20.1 + Certbot** ya operativos con sitios en producción. Este change **adapta el diseño a Nginx** para minimizar riesgo y no tocar `lavalex.co` / `jarvis.lavalex.co`.

## Áreas Afectadas

| Área | Impacto |
|------|---------|
| `.github/workflows/deploy-production.yml` | Nuevo (copiado desde plantilla del change) |
| `changes/web-deploy/*` | Nuevo — documentación y templates |
| VPS `/etc/nginx/conf.d/wallet.lavalex.co.conf` | Nuevo |
| VPS `/var/www/jp-wallet/` | Nuevo |
| Convex dashboard (prod) | Env vars, deploy key |
| Google Cloud Console | OAuth origins/redirects prod |
| GitHub repo secrets | Convex + VPS + Vite |
| `SPEC.md` §10 | Roadmap: añadir Change deploy |
| `AGENTS.md` | Change activo |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Romper `lavalex.co` o `jarvis` al editar Nginx | Media | Config en archivo nuevo; `nginx -t` antes de reload; no tocar `lavalex.conf` |
| Certificado SSL sin SAN `wallet.lavalex.co` | Media | `certbot --expand` antes del go-live |
| OAuth falla en prod por URIs incorrectas | Alta | Checklist Google + `SITE_URL` en Convex; smoke test login |
| Secretos filtrados en repo | Media | Solo GitHub Secrets; `.env.production` en `.gitignore` |
| VPS con poca RAM (1.7 GB) | Baja | Build solo en CI, no en servidor |
| Deploy con root en CI | Media | Usuario `deploy` + sudoers limitado |
| Datos dev mezclados con prod | Media | Deployment Convex separado; nunca apuntar prod a dev URL |

## Plan de Rollback

1. **Frontend**: restaurar snapshot anterior de `/var/www/jp-wallet` (backup previo al rsync en workflow).
2. **Convex**: redeploy commit anterior con `convex deploy --prod` desde tag/commit previo.
3. **Nginx**: eliminar `wallet.lavalex.co.conf` y `reload` si se revierte por completo el subdominio.

## Dependencias

- `web-foundation` y `web-core` completados y mergeados en `testing` (✅).
- Dominio `lavalex.co` gestionado por el usuario.
- Acceso SSH al VPS (`69.6.234.237:22022`).
- Cuenta Convex con permiso para crear deployment de producción.
- Proyecto Google OAuth existente (mismo Client ID que dev o cliente prod dedicado).

## Criterios de Éxito

Ver `spec.md` §Criterios de Éxito.

## Preguntas abiertas (refinar antes de implementar)

1. ¿Mismo Google OAuth Client ID para dev y prod, o cliente separado?
2. ¿Quién más tendrá acceso (solo tu cuenta Google)?
3. ¿Nombre final del directorio en VPS: `/var/www/jp-wallet` vs `/var/www/wallet`?
4. ¿Backup automático de `dist` en cada deploy (recomendado: sí)?
