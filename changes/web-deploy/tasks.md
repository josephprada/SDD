# Tasks: Web Deploy (MVP Producción)

**Input**: `changes/web-deploy/spec.md`, `design.md`, `research.md`, `quickstart.md`, `templates/*`

**Prerequisites**: `web-core` completado en `testing` ✅ · auditoría VPS ✅ · subdominio `wallet.lavalex.co` acordado ✅

**Rama**: `feat/web-deploy` → `testing` → `main` (activa auto-deploy)

**Estado**: **Completada** (2026-07-03)

**Tests**: Validación manual + smoke prod; `bun run build` en CI; `nginx -t` en VPS.

---

## Phase 1: Revisión y preparación (bloqueante)

**Purpose**: Cerrar decisiones abiertas y prerequisitos externos antes de tocar prod.

- [X] T001 Revisar y aprobar `proposal.md`, `spec.md`, `design.md` con el usuario
- [X] T002 DNS `wallet.lavalex.co` → `69.6.234.237`
- [X] T003 Crear deployment **production** en Convex; URL: `https://cheery-bass-870.convex.cloud`
- [X] T004 OAuth: mismo Client ID dev/prod (documentado en `design.md`)
- [ ] T005 Rotar contraseña root VPS y configurar clave SSH personal (post-auditoría) — *pendiente hardening, no bloqueante MVP*
- [X] T006 Generar par de claves ed25519 para GitHub Actions (`deploy-keys/github-actions`)

**Checkpoint**: DNS resuelve; deployment Convex prod existe; decisiones P-04 cerradas. ✅

---

## Phase 2: Convex producción

**Purpose**: Backend prod listo antes del primer frontend prod.

- [X] T007 Configurar Convex prod env: `SITE_URL=https://wallet.lavalex.co`
- [X] T008 Configurar `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` en Convex prod
- [X] T009 Ejecutar JWT setup en prod (`JWT_PRIVATE_KEY`, `JWKS`)
- [X] T010 Origins/redirect URIs de prod en Google Cloud Console
- [X] T011 `CONVEX_DEPLOY_KEY` y secrets GitHub configurados (usuario)
- [X] T012 `bunx convex deploy -y` a prod exitoso

**Checkpoint**: Funciones Convex en prod; OAuth Google configurado. ✅

---

## Phase 3: VPS — preparación servidor

**Purpose**: Infra Nginx lista sin afectar sitios existentes.

- [X] T013 Usuario `deploy` creado en VPS con clave CI
- [X] T014 `/var/www/jp-wallet` creado con permisos nginx
- [X] T015 `wallet.lavalex.co.conf` en `/etc/nginx/conf.d/`
- [X] T016 Certificado SSL incluye `wallet.lavalex.co` (expira 2026-10-01)
- [X] T017 `nginx -t && reload` OK
- [X] T018 `lavalex.co` responde 200 (sin regresión)

**Checkpoint**: `https://wallet.lavalex.co` responde con TLS válido. ✅

---

## Phase 4: CI/CD — GitHub Actions

**Purpose**: Pipeline automático al push `main`.

- [X] T019 `.github/workflows/deploy-production.yml` creado
- [X] T020 GitHub Secrets configurados
- [ ] T021 Probar workflow vía push a `main` — *pendiente primer merge; deploys manuales/rsync validados*
- [X] T022 Backup `dist.prev` en workflow; rollback en `quickstart.md`
- [ ] T023 Merge `feat/web-deploy` → `testing` → `main` — *siguiente paso git; no bloqueante cierre MVP*

**Checkpoint**: Workflow listo; deploy manual en prod operativo. ✅

---

## Phase 5: Smoke producción y cierre

**Purpose**: Confirmar MVP usable y cerrar el change.

- [X] T024 Smoke test en `wallet.lavalex.co` (login desktop/móvil, datos migrados)
- [X] T025 Completar `checklists/pre-deploy.md`
- [X] T026 Actualizar `SPEC.md` §6 (Nginx en prod)
- [X] T027 Cerrar change tras smoke OK

**Checkpoint**: Usuario usa JP-WALLET en prod para finanzas personales reales. ✅

---

## Dependencias entre fases

```text
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
              ↘ T010 (Google) puede paralelizarse con T007-T009
```

---

## Seguimiento post-cierre (opcional)

1. Merge `feat/web-deploy` → `testing` → `main` y validar T021 (primer CI deploy).
2. T005 — rotar contraseña root VPS.
3. Añadir header COOP en Nginx prod (`same-origin-allow-popups`) como root — ver template actualizado.

---

## Notas

- No commitear secretos. Usar GitHub Secrets y `convex env set`.
- El workflow NO debe ejecutarse en `testing` salvo prueba explícita (`workflow_dispatch`).
- Mantener `lavalex.conf` y `jarvis.lavalex.co.conf` fuera del alcance de edits automáticos.
