# STEP 1: Project Setup - VERIFICATION

**Block:** STEP-1-SETUP
**Purpose:** Verify complete development environment is working

---

## Automated Verification Script

Run this script to verify setup:

**File:** `scripts/verify_setup.sh`

```bash
#!/bin/bash

echo "🔍 Verifying SpringAIS Setup..."
echo

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# Test 1: Docker Compose
echo "1. Checking Docker Compose..."
if docker-compose ps | grep -q "springais-postgres.*running"; then
    echo -e "${GREEN}✓${NC} PostgreSQL container running"
else
    echo -e "${RED}✗${NC} PostgreSQL container not running"
    FAILED=$((FAILED + 1))
fi

if docker-compose ps | grep -q "springais-redis.*running"; then
    echo -e "${GREEN}✓${NC} Redis container running"
else
    echo -e "${RED}✗${NC} Redis container not running"
    FAILED=$((FAILED + 1))
fi

# Test 2: Backend Health
echo
echo "2. Checking Backend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Backend responding on port 8000"
else
    echo -e "${RED}✗${NC} Backend not responding (HTTP $HTTP_CODE)"
    FAILED=$((FAILED + 1))
fi

# Test 3: Frontend
echo
echo "3. Checking Frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Frontend responding on port 3000"
else
    echo -e "${RED}✗${NC} Frontend not responding (HTTP $HTTP_CODE)"
    FAILED=$((FAILED + 1))
fi

# Test 4: Database Schema
echo
echo "4. Checking Database Schema..."
TABLE_COUNT=$(docker exec springais-postgres psql -U postgres springais -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
if [ "$TABLE_COUNT" -ge 6 ]; then
    echo -e "${GREEN}✓${NC} Database has $TABLE_COUNT tables (expected ≥6)"
else
    echo -e "${RED}✗${NC} Database has $TABLE_COUNT tables (expected ≥6)"
    FAILED=$((FAILED + 1))
fi

# Test 5: pgvector Extension
echo
echo "5. Checking pgvector..."
PGVECTOR=$(docker exec springais-postgres psql -U postgres springais -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector';")
if [ "$PGVECTOR" -eq 1 ]; then
    echo -e "${GREEN}✓${NC} pgvector extension enabled"
else
    echo -e "${RED}✗${NC} pgvector extension not found"
    FAILED=$((FAILED + 1))
fi

# Test 6: Redis
echo
echo "6. Checking Redis..."
REDIS_PING=$(docker exec springais-redis redis-cli ping)
if [ "$REDIS_PING" == "PONG" ]; then
    echo -e "${GREEN}✓${NC} Redis responding to PING"
else
    echo -e "${RED}✗${NC} Redis not responding"
    FAILED=$((FAILED + 1))
fi

# Summary
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo "Setup is complete and ready for Step 2."
    exit 0
else
    echo -e "${RED}❌ $FAILED check(s) failed${NC}"
    echo "Please fix the issues above before proceeding."
    exit 1
fi
```

**Run:** `bash scripts/verify_setup.sh`

---

## Manual Verification Steps

### 1. Docker Services Verification

```bash
# Check all services are running
docker-compose ps

# Expected output:
# NAME                  SERVICE    STATUS
# springais-backend     backend    running
# springais-frontend    frontend   running
# springais-postgres    postgres   running
# springais-redis       redis      running
```

**✅ Pass Criteria:** All 4 services show "running"

---

### 2. Backend API Verification

**Test health endpoint:**
```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{"status": "healthy"}
```

**Test root endpoint:**
```bash
curl http://localhost:8000/
```

**Expected response:**
```json
{
  "message": "SpringAIS API",
  "status": "running",
  "version": "1.0.0"
}
```

**Test API docs:**
Open browser: http://localhost:8000/docs

**✅ Pass Criteria:**
- Both endpoints return 200 OK
- API docs page loads with Swagger UI

---

### 3. Frontend Verification

**Open in browser:**
```
http://localhost:3000
```

**Expected:**
- Page loads without errors
- Displays "SpringAIS" heading
- Shows "AI-powered talent mobility platform" text
- No console errors in browser dev tools

**Test routing:**
```
http://localhost:3000/login
```

**Expected:**
- Page loads
- Displays "Login" heading

**✅ Pass Criteria:**
- Both routes render correctly
- No 404 errors
- React dev tools show components mounting

---

### 4. Database Schema Verification

**Connect to database:**
```bash
docker exec -it springais-postgres psql -U postgres springais
```

**Check tables:**
```sql
\dt

-- Expected output:
--  Schema |      Name        | Type  |  Owner
-- --------+------------------+-------+----------
--  public | employees        | table | postgres
--  public | job_postings     | table | postgres
--  public | matches          | table | postgres
--  public | roles            | table | postgres
--  public | skill_embeddings | table | postgres
--  public | users            | table | postgres
```

**Check indexes:**
```sql
\di

-- Should show indexes for:
-- - employees (service_line, role, service_role, skills GIN)
-- - skill_embeddings (vector HNSW)
-- - job_postings (service_line, posted_date, active, search GIN)
-- - matches (user, role)
```

**Check pgvector:**
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Expected: 1 row showing vector extension
```

**Test vector operations:**
```sql
-- Create test vector
SELECT '[1,2,3]'::vector(3);

-- Should return: [1,2,3]
```

**Exit:**
```sql
\q
```

**✅ Pass Criteria:**
- All 6 tables exist
- All indexes created
- pgvector extension enabled
- Vector operations work

---

### 5. Redis Verification

**Test connection:**
```bash
docker exec -it springais-redis redis-cli
```

**Test commands:**
```redis
PING
# Expected: PONG

SET test "hello"
# Expected: OK

GET test
# Expected: "hello"

DEL test
# Expected: (integer) 1

EXIT
```

**✅ Pass Criteria:**
- Redis responds to PING
- Can set/get/delete keys

---

### 6. Environment Configuration Verification

**Check .env exists:**
```bash
ls -la .env
```

**Check required variables:**
```bash
grep -E "DATABASE_URL|REDIS_URL|OPENAI_API_KEY" .env
```

**Expected:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/springais
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-... (your key)
```

**✅ Pass Criteria:**
- `.env` file exists
- All required variables present
- `.env` is in `.gitignore`

---

### 7. Git Configuration Verification

**Check data-dumps branch exists:**
```bash
git branch -a | grep data-dumps
```

**Expected:**
```
  remotes/origin/data-dumps
```

**Switch to branch:**
```bash
git checkout data-dumps
ls -la
```

**Expected:**
- Branch exists
- README explains purpose

**Return to main:**
```bash
git checkout main
```

**✅ Pass Criteria:**
- data-dumps branch exists remotely
- Branch is separate from main
- No merge commits between branches

---

### 8. Team Setup Verification

**Simulate new team member setup:**

```bash
# In a new directory
git clone <repo-url> springais-test
cd springais-test

# Copy environment
cp .env.example .env
# (Edit with real API keys)

# Start services
docker-compose up -d

# Wait 30 seconds
sleep 30

# Test
curl http://localhost:8000/health
curl http://localhost:3000
```

**Time this process:** Should complete in <5 minutes

**✅ Pass Criteria:**
- Clone → setup → running in <5 minutes
- No errors during setup
- All services start successfully

---

### 9. Cross-Service Communication

**Test backend → database:**
```bash
curl http://localhost:8000/health
```

**Test frontend → backend:**
Open browser console:
```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** `{status: "healthy"}` logged

**✅ Pass Criteria:**
- Backend can connect to PostgreSQL
- Backend can connect to Redis
- Frontend can make CORS requests to backend

---

### 10. Development Workflow Verification

**Hot reload test (backend):**

1. Edit `backend/app/main.py` - change version to "1.0.1"
2. Save file
3. Wait 2-3 seconds
4. `curl http://localhost:8000/` should show new version

**Hot reload test (frontend):**

1. Edit `frontend/src/App.tsx` - change heading text
2. Save file
3. Browser should auto-refresh with new text

**✅ Pass Criteria:**
- Backend hot reloads within 5 seconds
- Frontend hot reloads within 3 seconds

---

## Troubleshooting Common Issues

### Issue: "Port already in use"

**Symptom:** Docker fails to start with "port 5432 already in use"

**Solution:**
```bash
# Find process using port
lsof -i :5432  # or 6379, 8000, 3000

# Kill process or change port in docker-compose.yml
```

---

### Issue: "Permission denied" on volumes

**Symptom:** Postgres fails to start with permission error

**Solution:**
```bash
# Fix permissions
sudo chown -R $USER:$USER postgres_data redis_data

# Or remove volumes and restart
docker-compose down -v
docker-compose up -d
```

---

### Issue: "Module not found" in backend

**Symptom:** Backend crashes with ImportError

**Solution:**
```bash
# Rebuild backend
docker-compose build backend
docker-compose up -d backend
```

---

### Issue: Frontend blank page

**Symptom:** localhost:3000 shows white screen

**Solution:**
1. Check browser console for errors
2. Check `docker-compose logs frontend`
3. Rebuild: `docker-compose build frontend && docker-compose up -d frontend`

---

### Issue: Database connection refused

**Symptom:** Backend can't connect to postgres

**Solution:**
```bash
# Wait for postgres to be ready
docker-compose up postgres
# Wait for "database system is ready to accept connections"

# Then start backend
docker-compose up backend
```

---

## Final Checklist

Before marking STEP-1-SETUP as complete:

- [ ] All automated tests pass (`bash scripts/verify_setup.sh` exits 0)
- [ ] Manual verification steps all pass
- [ ] Team member successfully clones and sets up in <5 minutes
- [ ] Hot reload works for backend and frontend
- [ ] All services can be stopped and restarted without issues
- [ ] `.env.example` is documented with all variables
- [ ] `README.md` has setup instructions
- [ ] Git data-dumps branch exists and is documented

---

## Success Criteria Met

If all above checks pass:

1. ✅ Update `TASKS.md` - all boxes checked
2. ✅ Update `PROJECT-STATUS.md`:
   - Status: ⏸️ → ✅
   - Progress: 15/15 tasks
   - Update completion percentage
3. ✅ Commit changes:
   ```bash
   git add .
   git commit -m "✅ Complete STEP-1-SETUP - Foundation ready for Step 2"
   git push
   ```
4. ✅ Notify team: "🎉 Setup complete! All Step 2 blocks are now unblocked."

---

**Last Updated:** 2026-01-02
**Status:** Ready for verification
