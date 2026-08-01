# Contract: Playwright E2E (Change 8)

**Change**: app-polish-fixes  
**Location**: `apps/web/e2e/` (+ `playwright.config.ts`)

## Commands

| Script | Acción |
|--------|--------|
| `bun run test:e2e` | Headless suite del change |
| `bun run test:e2e:ui` | UI mode Playwright (dev) |

## Projects

- Desktop (~1280×720)  
- Mobile (~390×844 o ≤430 width)

## Cobertura mínima (MUST)

| ID | Escenario | Asserciones clave |
|----|-----------|-------------------|
| E2E-01 | Proyección fijos | Texto/valor proyección = disponible − P; proyección más prominente que neto (rol/orden/clase primaria) |
| E2E-02 | Edit desde Home | Abrir reciente → modal visible; URL **no** es `/transactions` |
| E2E-03 | Autofocus edit | Tras open edit, `document.activeElement` ≠ input monto |
| E2E-04 | Adjuntos create | Open create → control adjuntar visible |
| E2E-05 | Scroll post-delete (si estable) | Tras delete en mobile project, scroll container no locked |

## Fuera de suite

- Entrega push real a bandeja OS  
- Tools MCP (probar vía gateway/curl o cliente MCP)  
- Google OAuth interactivo completo en CI sin secrets  

## Auth fixture

Documentar en `quickstart.md`: generar `e2e/.auth/user.json` (storageState) con vars `E2E_BASE_URL`, etc. Suite falla con mensaje claro si falta auth cuando el test lo requiere.
