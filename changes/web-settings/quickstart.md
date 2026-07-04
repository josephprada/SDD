# Quickstart: Web Settings

## Precondiciones

- Rama activa: `feat/web-settings`
- `web-core` y `web-deploy` disponibles en la base (`testing`)
- Convex dev corriendo
- `.env.local` configurado

## Comandos

```bash
bun install
bunx convex dev
bun dev
```

App en `http://localhost:5173`.

### Migración usuarios existentes (una vez)

En dashboard Convex, ejecutar `migrations.backfillUserPreferences` si ya tenías usuarios con solo `theme` en preferencias.

## QA Manual — Apariencia

1. Login con Google → `/settings`.
2. Verificar sección **Perfil**: editar nombre → guardar → sidebar/dashboard actualizados.
3. Subir avatar JPEG < 2 MB → visible en shell y dashboard.
4. "Usar foto de Google" → vuelve foto OAuth.
5. Intentar PDF como avatar → error.
6. **Modo**: cambiar a Claro → UI light instantánea; recargar → persiste.
4. **Acento**: elegir "Cian neón" → botones primarios, focus y glow cian; logo sigue verde original.
5. **Errores**: elegir "Naranja alerta" → crear gasto sin monto → mensaje naranja.
6. **Tipografía**: elegir "DM Sans" → textos body cambian; monto en dashboard mantiene mono tabular.
7. **Reset**: pulsar "Restaurar apariencia por defecto" → confirmar → vuelve dark + Green Bolt + Rojo clásico + Inter.
8. Con defaults activos, botón reset deshabilitado o sin efecto.

## QA Manual — Preferencias producto

9. **Agrupación**: Trimestre → dashboard muestra rango trimestre actual (ej. Abr–Jun).
10. Navegar ‹ › en dashboard → avanza trimestre, no mes.
11. **Notificaciones**: desactivar toggle → recargar → sigue off (sin prompt push).
12. **Idioma**: fila muestra Español; English deshabilitado / próximamente.
13. **Categorías**: fila navega a `/categories` sin regresión CRUD.

## QA Manual — Persistencia

14. Cambiar acento + tipografía → cerrar sesión → login → preferencias reconciliadas.
15. Abrir segunda pestaña → cambiar acento → ambas pestañas reflejan tras foco/reconcile.

## Checks

```bash
bun run build
bun run lint
```

Probar viewports 375 px y 1280 px en `/settings`.

## Siguiente paso

Ejecutar `/speckit-implement` siguiendo `tasks.md`.
