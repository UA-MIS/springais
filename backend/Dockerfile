FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# Note: Using --fix-missing to handle transient mirror issues
# gcc removed - psycopg2-binary doesn't need compilation
#
# ⚠ APT MUST GO OVER HTTPS. DO NOT REVERT THIS TO PLAIN http://.
# The platform's CI runners (ARC, namespace arc-runners) have a NetworkPolicy that permits
# external egress on TCP/443 and NOTHING ELSE -- deliberately, it is the tenant egress
# fence. The stock Debian sources point at http://deb.debian.org on port 80, so
# `apt-get update` inside a Kaniko build does not get refused, it gets a
# NETWORK UNREACHABLE and then apt exits 100:
#
#   W: Failed to fetch http://deb.debian.org/debian/dists/trixie/InRelease
#      Cannot initiate the connection to deb.debian.org:80 ... (101: Network is unreachable)
#   error building image: error building stage: failed to execute command:
#      waiting for process to exit: exit status 100
#
# It builds fine on a laptop and fails only in CI, which is the worst shape of failure to
# debug from the error text alone. Rewriting the sources to https:// fixes it: apt has
# spoken HTTPS natively since 1.5 (no apt-transport-https package needed) and
# python:3.11-slim already ships ca-certificates, since pip needs them.
#
# Both source formats are handled: trixie uses the deb822 .sources file, older releases
# use the flat sources.list. The `|| true` covers whichever of the two is absent.
RUN sed -i -e 's|http://deb.debian.org|https://deb.debian.org|g' \
           -e 's|http://security.debian.org|https://security.debian.org|g' \
           /etc/apt/sources.list /etc/apt/sources.list.d/*.sources 2>/dev/null || true; \
    grep -rhoE 'https?://(deb|security)\.debian\.org' /etc/apt/sources.list /etc/apt/sources.list.d/ 2>/dev/null | sort -u; \
    apt-get clean && \
    apt-get update && \
    apt-get install -y --fix-missing \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests.
#   requirements.txt      - human-maintained INTENT (loose >= ranges)
#   requirements.lock.txt - exact resolved pins, generated from requirements.txt
COPY requirements.txt requirements.lock.txt ./

# Install from the LOCK, not the range file, so the image is reproducible: a
# rebuild months from now installs the same versions the demo was verified
# against instead of silently picking up new majors. Regenerate the lock with:
#   docker run --rm -v "$PWD/backend":/b python:3.11-slim sh -c \
#     'pip install -q -r /b/requirements.txt && pip freeze' > backend/requirements.lock.txt
RUN pip install --no-cache-dir -r requirements.lock.txt

# Copy application code
COPY . .

# Create uploads directory. Kept for the docker-compose path, where ./uploads is
# bind-mounted here. NOTE: in Kubernetes this directory is NOT writable — the pod runs
# with readOnlyRootFilesystem: true. That is safe because no route writes to it (the
# resume upload path parses the uploaded file in memory and persists to Postgres); if a
# future feature does need to write, give it a volume rather than removing the hardening.
RUN mkdir -p /app/uploads

# ---------------------------------------------------------------------------
# Pre-warm the tiktoken BPE cache at BUILD time.
# ---------------------------------------------------------------------------
# app/utils/text_cleaner.py::count_tokens() calls tiktoken.encoding_for_model("gpt-4"),
# which resolves to the cl100k_base encoding, with a get_encoding("cl100k_base") fallback.
# tiktoken lazily DOWNLOADS that encoding over HTTPS on first use and caches it to disk.
#
# In the cluster the pod has a read-only root filesystem, so a cache miss at request time
# would mean a network round-trip on the hot path followed by a failed cache write. Baking
# it into the image makes the runtime path a local read with no network at all.
#
# TIKTOKEN_CACHE_DIR is set as a real ENV (not just for this RUN) so the runtime process
# reads the same baked directory — the chart also sets it explicitly, and the two must
# agree. If this download ever fails the BUILD fails here, loudly, instead of the failure
# surfacing later as a slow or broken request.
ENV TIKTOKEN_CACHE_DIR=/app/.tiktoken
RUN mkdir -p "$TIKTOKEN_CACHE_DIR" && \
    python -c "import tiktoken; tiktoken.encoding_for_model('gpt-4'); tiktoken.get_encoding('cl100k_base'); print('[OK] tiktoken cl100k_base pre-warmed')" && \
    chmod -R a+rX "$TIKTOKEN_CACHE_DIR"

# Make the application tree readable by the arbitrary non-root UID the pod runs as.
# COPY already produces world-readable modes, but the PCA model and the tiktoken cache are
# load-bearing enough to assert it rather than assume it.
RUN chmod -R a+rX /app

# ---------------------------------------------------------------------------
# Run as a non-root user.
# ---------------------------------------------------------------------------
# The Kubernetes pod spec already pins runAsUser: 65532 / runAsNonRoot: true, so this line
# does not change how the app runs in the cluster. It is here so the IMAGE is not
# root-by-default anywhere else it is run (compose, a developer's laptop, a future
# platform that does not set a securityContext) — defence in depth, not decoration.
# 65532 is the conventional "nonroot" UID and matches the chart, so file ownership
# assumptions cannot diverge between the two.
USER 65532

# ---------------------------------------------------------------------------
# CMD runs the SERVER ONLY. Migrations are NOT run here.
# ---------------------------------------------------------------------------
# This used to be:
#   sh -c "alembic upgrade head 2>&1 || echo 'Migration skipped (tables may already exist)'; uvicorn ..."
# Two things were wrong with that, and both produced a HEALTHY-LOOKING broken service:
#
#   1. `|| echo` swallowed the exit code. A migration that genuinely failed printed a
#      reassuring message and the server started anyway, against a half-built schema.
#   2. Running migrations from every replica's start-up races every other replica and
#      re-runs on every restart.
#
# Schema migration is now a deploy-time concern owned by the chart: .devops/chart/base/
# deployments.yaml runs a BARE `alembic upgrade head` in an initContainer, in this exact
# image, and the app container does not start unless it exited 0. See that file.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
