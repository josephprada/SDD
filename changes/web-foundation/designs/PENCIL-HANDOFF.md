# Hand-off: Crear .pen para web-foundation

**Para**: Cursor (o cualquier agente con acceso al filesystem + auth de modelos)
**Desde**: opencode orchestrator (sdd/web-foundation)
**Branch**: `feat/web-foundation`
**Fecha**: 2026-06-21

---

## Contexto rápido

JP-WALLET (Vite + React 19 + Convex) está arrancando el change `web-foundation` (Google OAuth + app shell + JP-DS + theme toggle). El flujo SDD ya está completo (proposal/spec/design/design-brief en commits previos). Falta la fase visual de Pencil antes de sdd-tasks.

El orquestador opencode no pudo crear los `.pen` porque `pencil --agent claude` requiere `ANTHROPIC_API_KEY` (no `PENCIL_CLI_KEY` que ya está seteada). Vos en Cursor tenés auth de modelos, así que podés continuar.

---

## Paths clave

| Recurso | Path |
|---------|------|
| Brief | `changes/web-foundation/designs/design-brief.md` |
| Prompts preparados | `/tmp/opencode/pencil-prompts/0{1..4}-*.txt` |
| Skill Pencil | `/home/jp/.config/opencode/skills/pencil-design/SKILL.md` |
| Skill Frontend | `/home/jp/.config/opencode/skills/frontend-design/SKILL.md` (cargar ANTES per Rule 6) |
| CLI Pencil | `pencil` (en PATH, ya autenticado a nivel CLI) |

---

## Lo que hay que hacer

### 1. Cargar skills (en orden)

1. `frontend-design/SKILL.md` — para dirección estética
2. `pencil-design/SKILL.md` — para reglas de Pencil

### 2. Leer brief completo

`changes/web-foundation/designs/design-brief.md` — contiene variables JP-DS y frames por capability. Los prompts en `/tmp/opencode/pencil-prompts/` ya referencian esto.

### 3. Crear los 4 archivos .pen

Por cada prompt, ejecutar (desde la raíz del repo `/home/jp/SDD`):

```bash
pencil --out changes/web-foundation/designs/app-shell.pen \
       --prompt-file /tmp/opencode/pencil-prompts/01-app-shell.txt \
       --agent claude

pencil --out changes/web-foundation/designs/auth-google-oauth.pen \
       --prompt-file /tmp/opencode/pencil-prompts/02-auth-google-oauth.txt \
       --agent claude

pencil --out changes/web-foundation/designs/design-system.pen \
       --prompt-file /tmp/opencode/pencil-prompts/03-design-system.txt \
       --agent claude

pencil --out changes/web-foundation/designs/theme-toggle.pen \
       --prompt-file /tmp/opencode/pencil-prompts/04-theme-toggle.txt \
       --agent claude
```

**Importante**:
- Cada .pen debe incluir artboards **mobile (375×812) Y desktop (1440×900)** — el usuario lo pidió explícito.
- Si algún agent falla, probá con otro (`--agent gemini` o `--agent codex`).
- Si todos fallan, exportar la imagen final con `--export <path>.png` para verificar visualmente.

### 4. Verificar y commitear

Por cada .pen exitoso:

```bash
# Visual check
pencil_get_screenshot <node-id>   # o usar preview
pencil_snapshot_layout --problems-only

# Commit (uno por .pen, work unit)
git add changes/web-foundation/designs/<name>.pen
git commit -m "design(change): add <name> [change:web-foundation]" \
           -m "<breve descripción>"
```

Convention matchea con `origin/feat/auth-vault-core` que tiene commits del tipo `design(change): add Pencil design files for auth-vault-core [change:auth-vault-core]`.

### 5. Hand-off de vuelta

Cuando termines, decime:
- 4 paths de .pen creados (tamaños)
- 4 SHAs de commit
- Cualquier frame que se simplificó o skipeó (con razón)
- Cualquier issue de calidad no resuelto

---

## Si querés usar Engram MCP desde Cursor

```bash
engram mcp --tools=agent
```

Arranca un MCP server stdio. Cursor lo puede conectar y usar `mem_search("pencil handoff web-foundation")` para recuperar este contexto completo en futuras sesiones.

---

## Estado del repo al momento del hand-off

```
feat/web-foundation
├── 93055a6 design(change): add Pencil design brief for web-foundation
├── 4314d3c chore(sdd): add web-foundation design
├── 25930eb chore(sdd): add web-foundation spec
├── c810171 chore(sdd): add web-foundation proposal
└── (base) d99011a feat: initialize jp-wallet project with essential files
```

No hay .pen todavía. Después de este hand-off deberían aparecer los 4 archivos bajo `changes/web-foundation/designs/`.

---

## Próximo paso en SDD (después de los .pen)

`sdd-tasks` para descomponer el change en tareas implementables. Las tasks referenciarán los frames del brief + los `.pen` por nombre. Cuando vuelvas con los .pen listos, el orquestador puede retomar.

---

*Este hand-off queda en Engram (topic_key `infra/pencil-handoff-web-foundation`) y en este archivo. Si retomás desde otra sesión, `mem_search("pencil web-foundation")` debería traerte todo.*