FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# Note: Using --fix-missing to handle transient mirror issues
# gcc removed - psycopg2-binary doesn't need compilation
RUN apt-get clean && \
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

# Create uploads directory
RUN mkdir -p /app/uploads

CMD ["sh", "-c", "alembic upgrade head 2>&1 || echo 'Migration skipped (tables may already exist)'; uvicorn app.main:app --host 0.0.0.0 --port 8080"]
