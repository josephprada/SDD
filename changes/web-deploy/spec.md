# Change — Web Deploy (MVP Producción)

**Versión**: 1.0.0
**Estado**: Borrador (revisión)
**Change**: web-deploy
**Creado**: 2026-07-03
**Rama de entrega prevista**: `main` (auto-deploy) desde merge `testing` → `main`

---

## Propuesta

### Intención

Desplegar JP-WALLET en **producción** para uso personal real: frontend en `wallet.lavalex.co`, backend en **Convex Cloud prod**, releases automatizados vía **GitHub Actions** al integrar en `main`.

### Alcance

Ver `proposal.md`.

---

## Dominio: Infraestructura

### Requisito: Subdominio aislado

El sistema DEBE servir JP-WALLET en `https://wallet.lavalex.co` sin modificar el comportamiento de `lavalex.co`, `www.lavalex.co` ni `jarvis.lavalex.co`.

**Escenario: Usuario abre lavalex.co**
- GIVEN el sitio corporativo/personal desplegado en `/var/www/lavalex`
- WHEN un usuario visita `https://lavalex.co`
- THEN DEBE responder el sitio existente sin regresiones

**Escenario: Usuario abre wallet**
- GIVEN el build de JP-WALLET en `/var/www/jp-wallet`
- WHEN un usuario visita `https://wallet.lavalex.co`
- THEN DEBE cargar la SPA de JP-WALLET con HTTPS válido

### Requisito: TLS

El sistema DEBE presentar certificado válido para `wallet.lavalex.co`.

**Escenario: Certificado**
- GIVEN Certbot/Let's Encrypt configurado en el VPS
- WHEN se accede a `https://wallet.lavalex.co`
- THEN el navegador DEBE mostrar conexión segura sin advertencias

### Requisito: SPA routing

El sistema DEBE soportar rutas del cliente (`/accounts`, `/transactions`, etc.) vía `try_files` a `index.html`.

**Escenario: Deep link**
- GIVEN usuario autenticado
- WHEN navega directamente a `https://wallet.lavalex.co/transactions`
- THEN DEBE cargar la app y la ruta correcta (no 404 de Nginx)

---

## Dominio: Convex Producción

### Requisito: Deployment aislado

El sistema DEBE usar un deployment Convex de **producción** separado del entorno de desarrollo local.

**Escenario: Datos de dev no en prod**
- GIVEN deployments dev y prod distintos
- WHEN un usuario usa la app en `wallet.lavalex.co`
- THEN los datos DEBEN persistir solo en el deployment prod

### Requisito: Variables de entorno prod

El sistema DEBE configurar en Convex prod al menos: `SITE_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `JWT_PRIVATE_KEY`, `JWKS`.

**Escenario: SITE_URL**
- GIVEN `SITE_URL=https://wallet.lavalex.co` en Convex prod
- WHEN el usuario completa OAuth
- THEN la sesión DEBE establecerse y redirigir a la app en ese origen

---

## Dominio: Autenticación

### Requisito: Google OAuth en producción

El sistema DEBE permitir login con Google en `wallet.lavalex.co`.

**Escenario: Login exitoso**
- GIVEN usuario sin sesión en prod
- WHEN hace click en "Continuar con Google" y autoriza
- THEN DEBE aterrizar en el dashboard (`/`) con sesión activa

**Escenario: OAuth mal configurado**
- GIVEN redirect URI u origin no registrados en Google
- WHEN intenta login
- THEN Google DEBE rechazar con error claro (no pantalla en blanco silenciosa)

---

## Dominio: CI/CD

### Requisito: Deploy automático en main

El sistema DEBE desplegar a producción cuando se hace push a la rama `main`.

**Escenario: Merge testing → main**
- GIVEN cambios validados en `testing`
- WHEN se mergea a `main`
- THEN el workflow DEBE: desplegar Convex prod, compilar frontend, sincronizar al VPS y recargar Nginx

**Escenario: Fallo en pipeline**
- GIVEN un paso del workflow falla (build, convex, ssh)
- WHEN el job termina
- THEN el deploy anterior en VPS DEBE permanecer servido (no publicar dist roto)

### Requisito: Build fuera del VPS

El sistema NO DEBE compilar el monorepo en el VPS durante el deploy rutinario.

**Escenario: CI build**
- GIVEN push a `main`
- WHEN corre el workflow
- THEN `bun run build` DEBE ejecutarse en GitHub Actions, no en el VPS

---

## Dominio: Seguridad operativa

### Requisito: Usuario deploy para CI

El sistema DEBE usar un usuario SSH dedicado (`deploy`) para GitHub Actions, no root.

**Escenario: Permisos mínimos**
- GIVEN usuario `deploy` configurado
- WHEN Actions sincroniza archivos
- THEN DEBE poder escribir en `/var/www/jp-wallet` y recargar Nginx vía sudo limitado

### Requisito: Secretos fuera del repo

El sistema NO DEBE commitear claves privadas, `AUTH_GOOGLE_SECRET`, ni `CONVEX_DEPLOY_KEY`.

---

## Dominio: Smoke funcional post-deploy

Tras el primer deploy, el sistema DEBE soportar el flujo mínimo de `web-core` en producción:

1. Login Google
2. Crear cuenta con saldo inicial
3. Registrar gasto
4. Ver saldo actualizado en dashboard
5. Cerrar sesión

*(Detalle paso a paso en `quickstart.md` §Smoke producción.)*

---

## Criterios de Éxito

- [ ] `https://wallet.lavalex.co` carga JP-WALLET con TLS válido
- [ ] `lavalex.co` y `jarvis.lavalex.co` sin regresiones
- [ ] Convex prod desplegado y separado de dev
- [ ] Login Google funcional en prod
- [ ] GitHub Action despliega en push a `main`
- [ ] Usuario `deploy` + secrets configurados (sin root en CI)
- [ ] Smoke test web-core completado en prod
- [ ] Documentación `quickstart.md` ejecutable de extremo a extremo
- [ ] Rollback documentado y probado al menos en frontend (`dist.prev`)

---

## Dependencias

- `web-foundation` + `web-core` en `testing` (✅)
- DNS `wallet` → `69.6.234.237`
- Acceso SSH VPS
- Proyecto Convex + Google OAuth

---

## Registro de decisiones

| Fecha | Decisión |
|-------|----------|
| 2026-07-03 | Subdominio `wallet.lavalex.co` confirmado por usuario |
| 2026-07-03 | Nginx (no Caddy) tras auditoría VPS — ver `research.md` |
| 2026-07-03 | Deploy trigger: push a `main` |
| 2026-07-03 | Convex Cloud prod (no self-host) |
