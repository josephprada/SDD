# Tasks: Web Deploy (MVP Producción)

**Input**: `changes/web-deploy/spec.md`, `design.md`, `research.md`, `quickstart.md`, `templates/*`

**Prerequisites**: `web-core` completado en `testing` ✅ · auditoría VPS ✅ · subdominio `wallet.lavalex.co` acordado ✅

**Rama**: `feat/web-deploy` → `testing` → `main` (activa auto-deploy)

**Tests**: Validación manual + smoke prod; `bun run build` en CI; `nginx -t` en VPS.

---

## Phase 1: Revisión y preparación (bloqueante)

**Purpose**: Cerrar decisiones abiertas y prerequisitos externos antes de tocar prod.

- [ ] T001 Revisar y aprobar `proposal.md`, `spec.md`, `design.md` con el usuario
- [ ] T002 Crear registro DNS `wallet.lavalex.co` → `69.6.234.237` (A record)
- [ ] T003 Crear deployment **production** en Convex; anotar URL prod en `quickstart.md`
- [ ] T004 Decidir OAuth: mismo Client ID dev/prod o cliente Google separado (documentar en `design.md`)
- [ ] T005 Rotar contraseña root VPS y configurar clave SSH personal (post-auditoría)
- [ ] T006 Generar par de claves ed25519 para GitHub Actions (`deploy` CI key)

**Checkpoint**: DNS resuelve; deployment Convex prod existe; decisiones P-04 cerradas.

---

## Phase 2: Convex producción

**Purpose**: Backend prod listo antes del primer frontend prod.

- [ ] T007 Configurar Convex prod env: `SITE_URL=https://wallet.lavalex.co`
- [ ] T008 Configurar `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` en Convex prod
- [ ] T009 Ejecutar `bun run convex:setup-jwt` contra deployment prod (`JWT_PRIVATE_KEY`, `JWKS`)
- [ ] T010 Añadir origins/redirect URIs de prod en Google Cloud Console
- [ ] T011 Generar `CONVEX_DEPLOY_KEY` prod → guardar en GitHub Secrets
- [ ] T012 Probar `bunx convex deploy --prod` manual desde máquina local (dry-run)

**Checkpoint**: Funciones Convex en prod; OAuth Google configurado (aún sin frontend).

---

## Phase 3: VPS — preparación servidor

**Purpose**: Infra Nginx lista sin afectar sitios existentes.

- [ ] T013 Ejecutar `templates/vps/setup-deploy-user.sh` en VPS (usuario `deploy`)
- [ ] T014 Crear `/var/www/jp-wallet` con permisos `nginx:nginx`
- [ ] T015 Copiar `templates/nginx/wallet.lavalex.co.conf` → `/etc/nginx/conf.d/`
- [ ] T016 Expandir certificado: `certbot --expand` con `wallet.lavalex.co`
- [ ] T017 `nginx -t && systemctl reload nginx`
- [ ] T018 Verificar `lavalex.co` y `jarvis.lavalex.co` sin regresión

**Checkpoint**: `https://wallet.lavalex.co` responde (404 o placeholder) con TLS válido.

---

## Phase 4: CI/CD — GitHub Actions

**Purpose**: Pipeline automático al push `main`.

- [ ] T019 Copiar `templates/github/deploy-production.yml` → `.github/workflows/deploy-production.yml`
- [ ] T020 Configurar GitHub Secrets: `CONVEX_DEPLOY_KEY`, `VITE_CONVEX_URL_PROD`, `VITE_GOOGLE_CLIENT_ID`, `VPS_*`
- [ ] T021 Probar workflow en branch `feat/web-deploy` con `workflow_dispatch` o push de prueba
- [ ] T022 Validar backup `dist.prev` y rollback manual documentado
- [ ] T023 Merge `feat/web-deploy` → `testing` → `main` (primer deploy real)

**Checkpoint**: Push a `main` despliega frontend + Convex sin intervención manual.

---

## Phase 5: Smoke producción y cierre

**Purpose**: Confirmar MVP usable y cerrar el change.

- [ ] T024 Ejecutar smoke test de `quickstart.md` §Producción en `wallet.lavalex.co`
- [ ] T025 Completar `checklists/pre-deploy.md` y archivar evidencia (capturas/logs)
- [ ] T026 Actualizar `SPEC.md` §6 si se adopta Nginx como fuente de verdad (nota de desviación Caddy)
- [ ] T027 Marcar `spec.md` Estado: Completada; nota de entrega en `tasks.md`

**Checkpoint**: Usuario usa JP-WALLET en prod para finanzas personales reales.

---

## Dependencias entre fases

```text
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
              ↘ T010 (Google) puede paralelizarse con T007-T009
```

---

## Implementación sugerida (commits)

1. `docs(web-deploy): add change spec, design and VPS audit`
2. `ci(web-deploy): add production deploy workflow`
3. `chore(web-deploy): add nginx and vps setup templates`
4. `docs(web-deploy): close change after prod smoke test`

---

## Notas

- No commitear secretos. Usar GitHub Secrets y `convex env set`.
- El workflow NO debe ejecutarse en `testing` salvo prueba explícita (`workflow_dispatch`).
- Mantener `lavalex.conf` y `jarvis.lavalex.co.conf` fuera del alcance de edits automáticos.
