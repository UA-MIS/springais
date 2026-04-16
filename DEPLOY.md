# SpringAis — Droplet Demo Deploy

Paste-and-go runbook for the `myskillbridge.me` demo droplet.

- **Droplet**: DigitalOcean, 2 vCPU / 4 GB, Docker marketplace image
- **Public IP**: `137.184.148.33`
- **Domain**: `myskillbridge.me` (registrar: Namecheap)
- **Public entrypoint**: Caddy (:80 / :443), auto Let's Encrypt TLS
- **Internal services**: backend :8080, frontend :8080, postgres :5432, redis :6379 (none exposed to the host)

Destroy the droplet when the demo is over. This is demo infra, not production.

---

## 1. DNS — Namecheap A records

In Namecheap → Domain List → **Manage** on `myskillbridge.me` → **Advanced DNS**.

Delete any existing `@` / `www` records that point elsewhere, then add:

| Type     | Host | Value            | TTL       |
| -------- | ---- | ---------------- | --------- |
| A Record | `@`  | `137.184.148.33` | Automatic |
| A Record | `www`| `137.184.148.33` | Automatic |

Save. Namecheap propagation is usually a few minutes; can take up to 30.

Verify from your laptop before SSHing in:

```bash
dig myskillbridge.me +short
dig www.myskillbridge.me +short
# both should return 137.184.148.33
```

Do not run `docker compose up` until DNS resolves — Caddy will fail the ACME HTTP-01 challenge and hit the Let's Encrypt rate limit.

---

## 2. SSH to the droplet

```bash
ssh root@137.184.148.33
```

The Docker marketplace image ships with Docker + Compose preinstalled. Sanity check:

```bash
docker --version
docker compose version
```

---

## 3. Firewall (UFW)

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

Only 22, 80, 443 should be open. Postgres (5432) and Redis (6379) must stay closed — they are internal-only on the compose network.

---

## 4. Clone the repo

```bash
cd /opt
git clone https://github.com/ccsmith33/SpringAIS.git
cd SpringAIS
```

(Use the actual repo URL; adjust path to taste.)

---

## 5. Create `.env`

```bash
cp .env.example .env
nano .env
```

Fill in:

- `OPENAI_API_KEY` — from https://platform.openai.com/api-keys
- `ONET_API_KEY` — from https://services.onetcenter.org/reference
- `JWT_SECRET_KEY` — generate a fresh one on the droplet:

  ```bash
  openssl rand -hex 32
  ```

  Paste that value. **Do not reuse `i-am-dev`** or any local dev value.
- `VITE_API_URL` — leave as `https://myskillbridge.me`.
- Leave `DATABASE_URL` and `REDIS_URL` at their defaults (they use compose hostnames).

Lock it down:

```bash
chmod 600 .env
```

---

## 6. Confirm DNS has propagated

```bash
dig myskillbridge.me +short
dig www.myskillbridge.me +short
```

Both must return `137.184.148.33`. If not, wait and retry. Do not proceed until they resolve — Caddy will burn ACME attempts otherwise.

---

## 7. Build and start the stack

```bash
docker compose up -d --build
```

Initial build takes a few minutes (backend + frontend images).

Check everything is up:

```bash
docker compose ps
```

All services should be `running` / `healthy`. Redis and postgres may take a few seconds to go healthy; backend waits on them.

---

## 8. Watch Caddy issue certs

```bash
docker compose logs -f caddy
```

You want to see lines like:

```
certificate obtained successfully
serving initial configuration
```

for both `myskillbridge.me` and `www.myskillbridge.me`. Ctrl+C to detach from the log stream (doesn't stop Caddy).

If you see repeated ACME failures, the most common cause is DNS not propagated yet, or UFW blocking :80 (ACME HTTP-01 challenge lives there).

---

## 9. Smoke test

From your laptop:

```bash
curl -I https://myskillbridge.me
curl -I https://www.myskillbridge.me
curl -sS https://myskillbridge.me/api/health   # or any known GET endpoint
```

Expect `HTTP/2 200` (or a redirect to the SPA) and a valid Let's Encrypt cert. Open `https://myskillbridge.me` in a browser and walk through the golden path.

---

## 10. Useful ops commands

```bash
docker compose logs -f backend         # tail backend
docker compose logs -f frontend        # tail frontend (nginx)
docker compose restart backend         # restart one service
docker compose down                    # stop everything (volumes persist)
docker compose down -v                 # stop + nuke postgres/redis/caddy data
```

Caddy's issued certs live in the `caddy_data` named volume. Don't `down -v` casually — you'll re-request certs from Let's Encrypt on next boot.

---

## 11. Tear down after the demo

```bash
docker compose down -v
```

Then, in the DigitalOcean dashboard, **destroy the droplet** and remove the Namecheap A records if you're done with the domain. Demo infra shouldn't linger.

---

## Notes / caveats

- `docker-compose.yml` runs the backend with `uvicorn --reload` and volume-mounts `./backend` into the container. That's a dev-mode setup carried over from local; it works for a demo but is not a production pattern. If the demo needs to harden later, drop `--reload` and bake the code into the image instead of mounting it.
- No DB migrations run automatically beyond `docker/postgres-init/*.sql`. If the app expects additional migrations, run them manually after `docker compose up -d`.
- The `ey_scraper` service is gated behind `profiles: ["scraper"]` and will not start with a plain `docker compose up`.
