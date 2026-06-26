# Quickstart: Web Core

## Precondiciones

- Rama activa: `feat/web-core`
- Change 1 `web-foundation` disponible en la rama base
- Convex dev corriendo
- `.env.local` raíz configurado

## Comandos

```bash
bun install
bunx convex dev
bun dev
```

La app corre en `http://localhost:5173`.

## QA Manual Mínimo

1. Login con Google.
2. Abrir dashboard (`/`) sin datos.
3. Crear cuenta `Efectivo` con `$ 100.000`.
4. Crear gasto de `$ 25.000` en `Efectivo`, categoría `Comida`.
5. Verificar:
   - saldo cuenta: `$ 75.000`
   - dashboard balance total: `$ 75.000`
   - resumen mensual gastos: `$ 25.000`
   - transacción aparece en recientes y lista.
6. Editar gasto a `$ 40.000`.
7. Verificar saldo: `$ 60.000`.
8. Crear cuenta `Banco` con `$ 0`.
9. Transferir `$ 20.000` de `Efectivo` a `Banco`.
10. Verificar:
    - `Efectivo`: `$ 40.000`
    - `Banco`: `$ 20.000`
    - balance total se mantiene `$ 60.000`
11. Adjuntar una imagen JPEG válida a una transacción.
12. Ver preview, descargar, eliminar adjunto.
13. Archivar categoría editable y validar que no aparece en nuevos formularios.
14. Intentar editar/archivar `Transferencia` y validar bloqueo.

## Checks

```bash
bun run build
bun run lint
```

## Siguiente Paso

Tras validar este plan, ejecutar generación de tareas (`/speckit-tasks`) para producir `changes/web-core/tasks.md`.
