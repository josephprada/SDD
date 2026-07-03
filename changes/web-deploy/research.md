# Research: Web Deploy — Auditoría VPS

**Fecha**: 2026-07-03
**Host**: `69.6.234.237` (Hostinger VPS OCI NVMe 2, Bogotá)
**Hostname**: `vps-1853639.vpsco-1853639.vpshostgator.com`

---

## Recursos

| Recurso | Valor |
|---------|-------|
| OS | AlmaLinux/RHEL 9 (`5.14.0-687.17.1.el9_8.x86_64`) |
| RAM | 1.7 GiB total (~1 GiB disponible tras boot) |
| Swap | 2 GiB |
| Disco | 49 GB (`/dev/sda3`), ~23 GB usados |
| SSH | Puerto **22022**, usuario **root** |

---

## Servicios activos

| Servicio | Estado | Notas |
|----------|--------|-------|
| `nginx.service` | running | Reverse proxy principal, puertos 80/443 |
| `docker.service` | running | Sin contenedores activos |
| OpenClaw/Jarvis | running | Node en `127.0.0.1:18789` |

**No hay Caddy** instalado en PATH. El `SPEC.md` §6 (Caddy) no refleja el estado real del servidor.

---

## Sitios web actuales

### `lavalex.co` + `www.lavalex.co`

- **Config**: `/etc/nginx/conf.d/lavalex.conf`
- **Root**: `/var/www/lavalex` (SPA estática, `try_files` → `index.html`)
- **TLS**: Let's Encrypt `/etc/letsencrypt/live/lavalex.co/`
- **Especial**: `location /googlechat` → proxy `127.0.0.1:18789/googlechat`

### `jarvis.lavalex.co`

- **Config**: `/etc/nginx/conf.d/jarvis.lavalex.co.conf`
- **Proxy**: `http://127.0.0.1:18789` (WebSocket upgrade)
- **TLS**: Mismo certificado `lavalex.co` (jarvis no listado explícitamente en `certbot certificates`; funciona con cert actual — validar SAN al expandir)

### Certbot

```
Certificate Name: lavalex.co
Domains: lavalex.co www.lavalex.co
Expiry: 2026-09-16 (VALID)
```

**Acción requerida**: expandir certificado para incluir `wallet.lavalex.co`.

---

## Docker / compose legacy

- `/opt/n8n-traefik.removed-/docker-compose.yml` — stack n8n+traefik **removido**, sin contenedores.

---

## Implicaciones para JP-WALLET

1. **Usar Nginx**, no Caddy ni Docker para el frontend.
2. **Subdominio** `wallet.lavalex.co` — no tocar virtual hosts existentes.
3. **Build en CI** — VPS con 1.7 GB RAM no debe compilar el monorepo.
4. **Patrón idéntico a lavalex.co**: estáticos en `/var/www/<app>` + `try_files` SPA.
5. **OpenClaw en 18789** — no reasignar ese puerto.
6. **Usuario deploy** recomendado para GitHub Actions (no root en CI).

---

## DNS requerido

```
wallet.lavalex.co  A  69.6.234.237
```

---

## Puertos en escucha (relevantes)

| Puerto | Proceso |
|--------|---------|
| 80, 443 | nginx |
| 18789 | node (OpenClaw, localhost) |
| 22022 | sshd |
