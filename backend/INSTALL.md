# Backend Installation Guide

This guide helps you install the SpringAIS backend dependencies on **any platform** (Windows, Mac, Linux).

## Prerequisites

- Python 3.10 or higher
- pip (comes with Python)

## Installation Steps

### 1. Navigate to backend directory

```bash
cd backend
```

### 2. (Optional but Recommended) Create a virtual environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

This will install all required packages with pre-built wheels (no build tools required).

### 4. Verify installation

```bash
cd ..
cd test_scripts/block_d_vector_embeddings
python test_phase1_setup.py
```

## What Changed?

We updated `requirements.txt` to use modern packages with universal wheel support:

- ✅ **psycopg3** (instead of psycopg2-binary) - Better Windows support
- ✅ **scikit-learn 1.4.0+** - Pre-built wheels for all platforms
- ✅ **numpy 1.26.0+** - Modern version with Python 3.10+ support
- ✅ Flexible versioning (`>=` instead of `==`) for better compatibility

## Troubleshooting

### If you still get build errors:

1. **Upgrade pip:**
   ```bash
   pip install --upgrade pip setuptools wheel
   ```

2. **Try installing individually:**
   ```bash
   pip install fastapi uvicorn sqlalchemy psycopg[binary] pgvector redis python-dotenv pydantic openai scikit-learn numpy joblib beautifulsoup4 requests
   ```

3. **Check Python version:**
   ```bash
   python --version  # Should be 3.10 or higher
   ```

### Still having issues?

Open an issue with:
- Your Python version (`python --version`)
- Your OS (Windows/Mac/Linux)
- Full error message

## Next Steps

After successful installation:

1. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

2. Set your API keys in `.env`:
   - `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
   - `DATABASE_URL` - Update if using different database settings
   - `REDIS_URL` - Update if using different Redis settings

3. Run the Phase 1 test:
   ```bash
   cd ../test_scripts/block_d_vector_embeddings
   python test_phase1_setup.py
   ```
