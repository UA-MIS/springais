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

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
