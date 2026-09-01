# `.devops/` — Platform-managed. Do not edit.

**This directory is owned by the platform team.** It is normally seeded by the Backstage
scaffolder from the platform template repo; editing it will be reverted.

SpringAIS is an exception worth knowing about: this repo was **hand-built in December**
with a `docker-compose.yml` and was never scaffolded, so this directory was written by
hand to match the template contract rather than generated from it. The files in `ci/` and
`.github/workflows/` are byte-identical copies of the platform template
(`platform-infra/platform-services/backstage/templates/_fragments/_contract/`). The chart
is not — it carries app-specific decisions that a generic scaffold could not know, and
each one is commented in place with the reason. The deliberate deviations are listed at
the bottom of this file.

If you think something here needs to change, open an issue with the platform team.

## What lives here

| Path | Purpose |
| --- | --- |
| `app-metadata.yaml` | The declarative inputs: `team`, `semester`, `app-name`, `port`, `database`. Must agree with `tenants/_claims/springais-springais.yaml` in platform-infra. |
| `components.yaml` | The component model: one entry per **buildable** component (`frontend`, `backend`). Redis is a workload but not a build, so it is deliberately absent. |
| `chart/base/` | Kustomize base: two Deployments + two Services (one per component), a Redis Deployment+Service, a shared ServiceAccount, and one path-routing Ingress. Environment-agnostic. |
| `chart/overlays/{dev,staging,prod,preview}/` | Per-environment diffs: image tag, ingress host, env labels, the per-namespace ESO `SecretStore`, the app-secret `ExternalSecret` and the auto-DB `DATABASE_URL` `ExternalSecret`. |
| `promotion.yaml` | The single source of truth for trigger → env → tag-convention → overlay → gate. Both the CI scripts and the platform's env ApplicationSet read **this file at HEAD**. |
| `ci/` | Platform CI seam, verbatim from the template: `resolve-image.sh`, `resolve-components.sh`, `build-and-push.sh`, `bump-image.sh`, `promote.sh`, `seed-initial-envs.sh` + their test suites. |
| `ci/RUNBOOK.md` | The build/deploy loop — **plus a repo-specific appendix on running the DB-backed test suite. Read it before trusting a green CI check.** |
| `secrets/README.md` | How secret values reach the app (Vault → ESO). No values, ever. |

## The URL that matters

**`https://springais.capstone.uamishub.com`** — the **prod** host, no `.dev` prefix.

The tenant claim sets `publicDevIngress: false`, so the platform's env ApplicationSet adds
a Dex forwardAuth middleware to the **dev and staging** Ingresses. That gate returns a 302
*before* Traefik routes to the app, so a signed-out visitor never reaches SpringAIS at all
on those hosts. **prod is public unconditionally** and is the only host to demo from.

## How a change reaches production

```
push to main ──► CI builds both images ──► bump dev overlay ──► ArgoCD syncs springais-dev
                                        └─► FIRST BUILD ONLY: seed-initial-envs.sh also
                                            points staging + prod at that same image,
                                            because both still carry the v0.0.0 sentinel
git tag vX.Y.Z ──► CI builds ──► bump staging overlay ──► ArgoCD syncs springais-staging
promote-to-prod.yaml (manual) ──► copies staging's LIVE tag into prod ──► ArgoCD syncs prod
```

The first-build seed is a one-time **initial condition**, not ongoing auto-promotion: once
an overlay holds a real tag it is never seeded again, and only the promote workflow moves
it.

## Deliberate deviations from the platform template

Each of these is a considered departure, not an oversight. The reasoning is written at the
point of use; this is the index.

1. **Probes point at `/health`, not `/healthz`** (backend). The app serves `/health`
   (`backend/app/main.py`) and 404s `/healthz`. Following the convention instead of the
   application would have produced a permanently-failing probe.

2. **The frontend serves a real `/healthz` file from an exact-match nginx location.** The
   previous config's single `try_files ... /index.html` fallback returned **200 for every
   unmatched path**, so a probe there could never fail and would report Ready over a
   broken bundle. Now an empty document root returns 404 — verified.

3. **`DATABASE_URL`, `JWT_SECRET_KEY` and `OPENAI_API_KEY` are REQUIRED secret refs**, not
   `optional: true`. The template's zero-config default suits a freshly-scaffolded app
   with nothing in Vault; it does not suit this one. `JWT_SECRET_KEY` is read with a `""`
   default and only checked at request time, so `optional` means a pod that passes every
   probe and then 500s on every login. Required turns that into a visible
   `CreateContainerConfigError` that self-heals the moment ESO syncs the Secret.

4. **The migration initContainer has no "DATABASE_URL unset → skip" guard, and the command
   is bare.** No `|| echo`, no `|| true`. A failed migration leaves the pod in `Init` and
   it never becomes Ready. The bounded 3×5s retry absorbs transient DB unavailability and
   the pgvector-Extension-vs-Database race on a brand-new env; it does not swallow a real
   failure.

5. **`replicas: 1` in EVERY environment, including prod, and no PodDisruptionBudget.**
   `backend/app/database.py` uses `pool_size=20 + max_overflow=30` — 50 connections per
   backend replica — against a **shared** `capstone-tenant-pg` (`max_connections=100`,
   ~35 already in use). A second replica could exhaust the tier and take other tenants
   down. A PDB over a 1-replica Deployment makes the pod undrainable, so it is omitted
   until the replica count can honestly rise.

6. **Redis is a chart workload but not a `components.yaml` entry**, with no PVC and
   persistence explicitly disabled (`--save "" --appendonly no`). Everything it holds is
   TTL'd and reconstructible. Persistence is turned off at the server rather than merely
   left unmounted, so a read-only root filesystem cannot produce a redis that believes it
   should snapshot and fails forever. Image comes from the platform's Harbor pull-through
   cache, matching what `ida-llm` already runs.

7. **No ingress body-size annotation.** Upload endpoints accept ~10MB. This platform's
   Traefik has no buffering/`maxRequestBodyBytes` middleware, so it streams with no cap
   (unlike nginx-ingress, which would 413 at 1MB). A Traefik `Middleware` could not be
   added here anyway — that kind is not in the tenant AppProject's
   `namespaceResourceWhitelist`.

8. **`ci/RUNBOOK.md` carries a repo-specific appendix.** Marked as such in the file. See
   it for why the CI test gate is 53 of 341 tests and how to run the other 288.
