# Playwright E2E (Change 8)

## Commands

From repo root:

```bash
bun run test:e2e
bun run test:e2e:ui
```

From `apps/web`:

```bash
bunx playwright test
bunx playwright test --ui
```

## Auth fixture

Authenticated specs need:

```text
apps/web/e2e/.auth/user.json
```

Generate once (logged-in browser):

```bash
cd apps/web
bunx playwright codegen --save-storage=e2e/.auth/user.json http://127.0.0.1:5173
```

Or copy a storageState exported from a manual login session.

Without this file, specs that call `requireAuth` skip with a clear message.

## Env

| Variable | Default | Notes |
|----------|---------|-------|
| `E2E_BASE_URL` | `http://127.0.0.1:5173` | App under test |
| `E2E_SKIP_WEBSERVER` | unset | Set to skip auto `bun run dev` |
