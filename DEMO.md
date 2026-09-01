# SpringAIS — demo runbooks

There are now **two** ways to demo SpringAIS, and they are different environments with
different data. Read the cluster section first if you are presenting; the original local
compose runbook follows below, unchanged.

---

# 1. Cluster demo (the platform deployment)

## The URL

**`https://springais.capstone.uamishub.com`** — no `.dev`, no `.staging`.

That is the **prod** environment and it is the only one a signed-out visitor can reach.
The tenant is provisioned with `publicDevIngress: false`, so the platform puts a Dex
single-sign-on gate in front of `springais.dev.…` and `springais.staging.…`. That gate
returns a 302 to the identity provider **before** the request is routed to the app at all,
so opening the dev host in front of an audience shows a login page for the *platform*, not
SpringAIS. Use the prod host.

## ⚠ Read before you present: 15 of the 16 postings are visible, not 16

The curated corpus is 16 EY postings. **15 of them can be returned by a match query.** The
one that cannot is the **Tampa "Service Delivery Center — AI Developer"** row.

It is excluded by a bug, not by anything about the posting. `matching_service.py` contains
**two** lists of US locations and they disagree: the Python constant `US_LOCATIONS`
includes `tampa`, while the SQL filter inside `_get_filtered_jobs` — the one that actually
runs — does not. Every other corpus city (New York, Chicago, Atlanta, Dallas, Seattle,
San Francisco) appears in both.

It was left unfixed on purpose: it is a one-line change, but it sits in the matching code
path, and changing scoring-adjacent code to recover a single row out of sixteen was not a
trade worth making the night before a presentation. It is filed for daylight.

**What this means for you:** nothing in the demo narrative depends on the Tampa posting.
The Data & AI story still has both of its rows — the New York "Data Engineer — Manager,
Consulting" (the intended hero row) and the Atlanta "Advanced Forward Engineering — Data
Engineer" one rung below it, which is the seniority-progression pair the corpus was built
around. Just do not count sixteen out loud.

## Demo path

1. Open the prod URL and **register an account**. Use a normal-looking email domain — the
   validator rejects reserved names like `.test` and `.local`.
2. **My Profile** → upload a resume, or paste a block of experience text. This is the step
   that calls OpenAI: it extracts your skills and, in the background, embeds them.
3. **Match Results** → scored matches against the corpus, with per-role skill overlap,
   gaps, and a generated explanation.

## If something looks wrong

- **A pod in `CreateContainerConfigError`** is the *intended* state when a secret has not
  synced yet, not a crash — it clears by itself. The app deliberately refuses to start
  without `DATABASE_URL`, `JWT_SECRET_KEY` or `OPENAI_API_KEY` rather than starting and
  failing at request time, where it would look healthy and 500 on every login.
- **A pod stuck in `Init`** means the migration initContainer failed, also deliberately: a
  failed migration must never produce a Ready pod.
  `kubectl logs -n springais-prod <pod> -c migrate` says why.
- **`/health` returning 200 proves very little.** It does not touch the database and never
  has. It is a liveness signal, not evidence that the app works.

## What runs where

| | |
|---|---|
| Environments | `springais-dev`, `springais-staging`, `springais-prod` |
| Database | per-environment PostgreSQL 17 on the shared tenant tier, pgvector 0.8.2 |
| Replicas | **1** per component in every environment, deliberately — the SQLAlchemy pool is 20+30 per replica against a shared 100-connection server. See `.devops/README.md`. |
| Deploys | push to `main` → dev; `git tag vX.Y.Z` → staging; the *promote-to-prod* workflow → prod |

---

# 2. Local demo runbook (docker compose)


Verified end to end on 2026-09-01 against a clean clone.
For the production droplet deploy, see `DEPLOY.md`; this file is the local path.

**Demo URL: `http://localhost:8088`**

---

## TL;DR

```bash
git clone https://github.com/ccsmith33/SpringAIS.git
cd SpringAIS
git lfs install && git lfs pull        # REQUIRED - the seed data is in LFS
cp .env.example .env                   # then edit: JWT_SECRET_KEY, OPENAI_API_KEY

C="docker compose -f docker-compose.yml -f docker-compose.local.yml"

$C up -d --build postgres redis                                  # data tier only
$C run --rm --no-deps --entrypoint alembic backend upgrade head   # migrate FIRST
bash scripts/load_demo_data.sh
$C up -d                                                          # now the app
```

The order matters — see §4. Starting the backend before migrations lets it
create the schema itself and permanently wedges Alembic.

Open `http://localhost:8088`, register an account, go to **My Profile**, upload
`frontend/public/demo-assets/sample-resume.docx`, then open **Match Results**.

First run takes roughly **12–15 minutes**, almost all of it image build. Do this
before anyone is watching.

---

## 1. The seed data is in Git LFS

`data/*.sql` are Git LFS pointers. A plain `git clone` gives you 130-byte stubs,
not data. `git lfs pull` fetches the real files — they are all still in GitHub's
LFS storage and download fine.

If `git lfs` is not installed and you cannot `sudo apt install git-lfs`:

```bash
curl -sSL -o git-lfs.tar.gz \
  https://github.com/git-lfs/git-lfs/releases/download/v3.5.1/git-lfs-linux-amd64-v3.5.1.tar.gz
tar xzf git-lfs.tar.gz
export PATH="$PWD/git-lfs-3.5.1:$PATH"
git lfs install --local && git lfs pull
```

After a successful pull, `data/synthetic_employees_llm.sql` should be ~551 KB.

---

## 2. Environment

`cp .env.example .env` and set:

| Variable | Required? | Notes |
|---|---|---|
| `JWT_SECRET_KEY` | **Yes** | `openssl rand -hex 32`. Auth 500s without it. |
| `VITE_API_URL` | **Yes** | `http://localhost:8088` locally. Baked in at **build** time — change it and you must rebuild the frontend. |
| `OPENAI_API_KEY` | Optional | See §6. Matching works without it; resume upload does not. |
| `OPENAI_CHAT_MODEL` | Optional | Defaults to `gpt-5.4`. Change if OpenAI deprecates it. |
| `DATABASE_URL`, `REDIS_URL` | Yes | Leave at defaults; they use compose hostnames. |
| `ONET_API_KEY` | No | Dead. Referenced by zero source files. |

`chmod 600 .env`. It is gitignored; keep it that way.

---

## 3. Why the extra compose file

`docker-compose.local.yml` overlays the production compose file so that:

- Caddy serves plain HTTP on host **:8088** using `Caddyfile.local`. The
  production `Caddyfile` is scoped to `myskillbridge.me`, so on a laptop Caddy
  would try to get a Let's Encrypt certificate for a domain the host does not
  control, and requests to `localhost` would miss the site block entirely.
- `backend` (:8080) and `postgres` (:5432) are published for debugging.
- The frontend is deliberately **not** published — Caddy is the single
  entrypoint, matching production.

Everything goes through `http://localhost:8088`. `/api/*` reaches the backend,
everything else the SPA.

---

## 4. Migrations must run BEFORE the app starts

This is the sharpest edge in the whole setup.

`app/main.py` calls `Base.metadata.create_all()` on startup. If the backend
boots against an empty database it creates the tables **from the SQLAlchemy
models**, which is not the same schema the 33 migrations produce — the models do
not carry the HNSW vector indexes, among other things. `alembic_version` is
never stamped, so the next `alembic upgrade head` dies with
`relation "employees" already exists`.

The image `CMD` hides this:

```
alembic upgrade head 2>&1 || echo 'Migration skipped (tables may already exist)'
```

A failed migration prints a reassuring message and starts the app anyway. The
container looks healthy while the schema is quietly wrong. (`docker-compose.yml`
overrides that CMD with a bare `uvicorn`, so in compose migrations never run at
all.)

**So: start the data tier, migrate, and only then start the backend.** Running
`up -d` for everything and migrating afterwards is a race — the backend may win
and call `create_all()` before Alembic connects.

```bash
C="docker compose -f docker-compose.yml -f docker-compose.local.yml"
$C up -d postgres redis
$C run --rm --no-deps --entrypoint alembic backend upgrade head
$C up -d
```

Verify rather than assume:

```bash
# must print "033 (head)"
docker compose -f docker-compose.yml -f docker-compose.local.yml \
  run --rm --no-deps --entrypoint alembic backend current

# must list 4 hnsw indexes
docker exec springais-postgres psql -U postgres -d springais -c \
  "SELECT indexname, tablename FROM pg_indexes WHERE indexdef ILIKE '%hnsw%';"

# must list the vector extension
docker exec springais-postgres psql -U postgres -d springais -c \
  "SELECT extname, extversion FROM pg_extension;"
```

If you ever need to start over:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down
docker volume rm springais_postgres_data
```

---

## 5. Load the seed data

```bash
bash scripts/load_demo_data.sh
```

Expected: **900 employees** (300 Assurance / 300 Consulting / 300 Tax) and
**10 job postings**.

Note `docker/postgres-init/` only holds `01_extensions.sql`. The pattern-index
script was moved to `docker/postgres-post-migrate/` because scripts in
`docker-entrypoint-initdb.d` run on a fresh volume *before* any table exists —
it was aborting Postgres startup with `relation "employees" does not exist`.

---

## 6. What works without an OpenAI key

Measured, not assumed.

**Works with no key at all:**

- Register / login / JWT auth
- Job matching, including scores, skill-gap analysis and written explanations
- Patterns, progression, skills taxonomy, badges, store, achievements
- The whole frontend

Matching has no OpenAI call in its request path. It scores through the skill
taxonomy, then exact matches, then stored embeddings if present, then fuzzy
token overlap. With `skill_embeddings` empty it simply uses the earlier legs.

**Needs a key:**

| Feature | Without a key |
|---|---|
| Resume upload / skill extraction | 500. **This is the normal way to get skills onto a profile.** |
| Career roadmap generation | fails |
| Learning content generation | fails |
| `/api/matches/job/{id}/deep-analysis` | 404 with a clear message |

So the honest position: **matching works keyless, but the demo's on-ramp
(upload a resume) does not.** Without a key you must add skills another way
(`POST /api/skills/quick-add`) before the Match Results screen shows anything —
it renders "Upload Your Resume to Get Started" until the profile has skills.

**Embeddings are not in the seed data.** No dump contains a single vector, so
"pre-computed embeddings" are not a fallback. To turn the semantic leg on:

```bash
docker exec springais-backend python /app/scripts/embed_seed_skills.py
```

203 distinct skills, ~15 seconds, cents. Measured effect on the same query —
every score rises and previously-zero matches become meaningful:

| Job | before | after |
|---|---|---|
| Senior Analyst - Assurance | 0.7142 | 0.7734 |
| Senior - Audit | 0.6625 | 0.7415 |
| Senior Associate - International Tax | 0.1142 | 0.4058 |
| Manager - Technology Consulting | 0.0542 | 0.2010 |

Ranking improves too: *Senior - Audit* correctly overtakes *Manager - Financial
Reporting* for an audit-skilled profile.

---

## 7. Demo script

1. `http://localhost:8088` → **Create an account**.
2. **My Profile** → upload `frontend/public/demo-assets/sample-resume.docx`
   (linked from the login page). **Takes ~16 seconds** — do it before you are
   in front of anyone.
3. **Match Results** → ranked job cards with match percentage, matched skills,
   skill gaps and a written rationale.

Match queries return in **~60–90 ms** warm.

A profile with no skills silently binds to the first employee in the table
(`EMP-ASR-0001`, an Assurance Staff) and **persists** that choice. With skills,
it binds to the employee with the largest skill overlap. That binding is how the
demo persona is chosen — the `{employee_id}` in the match URL is ignored for
logged-in users, and the frontend hardcodes `1`.

---

## 8. Health checks

```bash
curl http://localhost:8088/            # SPA
curl http://localhost:8080/health      # {"status":"healthy"}
```

`/health` is **not** under `/api`, so `DEPLOY.md`'s documented
`curl https://myskillbridge.me/api/health` smoke test returns 404. Only `/` and
`/health` sit outside `/api`; the other 98 routes are under it.
