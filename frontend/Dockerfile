# Pulled through the platform's Harbor Docker Hub pull-through cache
# (dockerhub-proxy), same as every other tenant's Dockerfile -- avoids Docker
# Hub rate limits (`toomanyrequests`) across the whole CI cohort, and avoids
# a slower/uncached direct pull inside Kaniko on the shared CI build pool.
# Same image, same tag, different registry host -- purely a pull-path
# change. Verified end-to-end through the proxy (see PR for the commands).
FROM harbor.capstone.uamishub.com/dockerhub-proxy/library/node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# ---------------------------------------------------------------------------
# VITE_API_URL is a BUILD-TIME substitution, not a runtime setting.
# ---------------------------------------------------------------------------
# Vite inlines import.meta.env.* into the bundle at build time, so this ARG is the ONLY
# place the value can be set. Putting it in the Deployment's env would do nothing while
# looking like configuration — which is why the chart deliberately sets no env on this
# component.
#
# ⚠ THE VALUE MUST BE `/`, NOT `/api`. The two API clients disagree about what they are
# given, and only `/` satisfies both:
#
#   src/services/api.ts          normalizeBaseUrl() strips trailing slashes, then appends
#                                "/api" ONLY IF the result does not already end in /api.
#                                  "/"    -> ""     -> "/api"   ✓
#                                  "/api" -> "/api" -> "/api"   ✓
#   src/services/authService.ts  unconditionally appends "/api" to the stripped value.
#                                  "/"    -> ""     -> "/api"   ✓
#                                  "/api" -> "/api" -> "/api/api" ✗  -> 404 on every
#                                                                       login/register
#
# So `/api` breaks all authentication while leaving the rest of the app working — the
# worst possible failure shape for a demo. `/` is also origin-relative, which means the
# browser calls the SAME host the SPA was served from, so the Ingress routes /api to the
# backend and CORS never enters the picture. That last part matters: backend/app/main.py
# hardcodes an allow_origins list (localhost:3000, myskillbridge.me, a DigitalOcean URL)
# that does NOT include the cluster hostname, so any cross-origin call would be blocked.
ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# The health-check target. Written HERE, in the build stage, immediately after a
# successful `npm run build`, and only if the build actually produced an index.html — so
# its presence in the final image is evidence the bundle exists. The nginx config serves
# it from an exact-match location with `=404`, which is what makes the readiness probe
# able to fail. See frontend/nginx.conf.
RUN test -f dist/index.html && echo "ok" > dist/healthz

# ---------------------------------------------------------------------------
# Runtime: nginx-unprivileged, NOT the stock nginx image.
# ---------------------------------------------------------------------------
# The pod runs with readOnlyRootFilesystem: true as UID 65532. The stock `nginx:alpine`
# image cannot start under those constraints: its nginx.conf writes /run/nginx.pid and its
# temp paths live under a root-owned /var/cache/nginx, so it fails on a read-only
# filesystem as a non-root user. nginxinc/nginx-unprivileged is built for exactly this —
# it already listens on 8080 as a non-root user and keeps its pid file and all temp paths
# under /tmp, which the chart provides as a single emptyDir.
#
# The alternative (keeping stock nginx and mounting emptyDirs over /var/cache/nginx and
# /run) works too, but it is more moving parts to get the same result and it leaves the
# image root-by-default everywhere else it might run.
#
# Pulled through dockerhub-proxy, same as the build stage above.
# nginxinc/nginx-unprivileged is NOT a Docker Official ("library/") image --
# its Docker Hub repo is under the "nginxinc" namespace, so the proxy path
# keeps that namespace segment (dockerhub-proxy/nginxinc/..., not
# dockerhub-proxy/library/nginxinc/...). This is NOT the same path shape as
# every other tenant Dockerfile's `library/...` images, so it was verified
# by execution before committing, not assumed: GET'ing the manifest through
# Harbor's registry API returned docker-content-digest
# sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0,
# identical to the digest Docker Hub returns directly for this tag, and a
# live pod pulled harbor.../dockerhub-proxy/nginxinc/nginx-unprivileged:1.27-alpine
# and ran `nginx -v` successfully (imageID matched the same digest). See PR
# for the exact commands.
FROM harbor.capstone.uamishub.com/dockerhub-proxy/nginxinc/nginx-unprivileged:1.27-alpine

# The base image's default site would otherwise shadow ours.
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 8080

# Inherited from the base image, restated so the run command is visible here.
CMD ["nginx", "-g", "daemon off;"]
