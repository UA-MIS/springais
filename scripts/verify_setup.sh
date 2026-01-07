#!/bin/bash
# SpringAIS Setup Verification Script
# This script verifies that all components of STEP-1-SETUP are correctly installed

set -e

echo "========================================="
echo "SpringAIS Setup Verification"
echo "========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Function to check command
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        FAILED=1
    fi
}

# Function to check service
check_service() {
    if docker ps --format '{{.Names}}' | grep -q "$1"; then
        echo -e "${GREEN}✓${NC} $1 service is running"
    else
        echo -e "${RED}✗${NC} $1 service is not running"
        FAILED=1
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    if curl -s -o /dev/null -w "%{http_code}" "$1" | grep -q "200"; then
        echo -e "${GREEN}✓${NC} $2 is responding (200 OK)"
    else
        echo -e "${YELLOW}⚠${NC} $2 may not be responding correctly"
        FAILED=1
    fi
}

echo "1. Checking prerequisites..."
echo "----------------------------"
check_command "docker"
check_command "docker-compose"
check_command "git"
echo ""

echo "2. Checking Docker services..."
echo "-------------------------------"
check_service "springais-postgres"
check_service "springais-redis"
check_service "springais-backend"
check_service "springais-frontend"
echo ""

echo "3. Checking backend endpoints..."
echo "---------------------------------"
check_endpoint "http://localhost:8000/health" "Backend health endpoint"
check_endpoint "http://localhost:8000/" "Backend root endpoint"
echo ""

echo "4. Checking frontend..."
echo "-----------------------"
check_endpoint "http://localhost:3000" "Frontend"
echo ""

echo "5. Checking database..."
echo "-----------------------"
# Check if database tables exist
TABLE_COUNT=$(docker exec springais-postgres psql -U postgres springais -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
if [ "$TABLE_COUNT" -eq 6 ]; then
    echo -e "${GREEN}✓${NC} Database has 6 tables"
else
    echo -e "${RED}✗${NC} Database has $TABLE_COUNT tables (expected 6)"
    FAILED=1
fi

# Check if pgvector extension is enabled
PGVECTOR=$(docker exec springais-postgres psql -U postgres springais -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector';")
if [ "$PGVECTOR" -eq 1 ]; then
    echo -e "${GREEN}✓${NC} pgvector extension is enabled"
else
    echo -e "${RED}✗${NC} pgvector extension is not enabled"
    FAILED=1
fi
echo ""

echo "6. Checking Redis..."
echo "--------------------"
if docker exec springais-redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✓${NC} Redis is responding"
else
    echo -e "${RED}✗${NC} Redis is not responding"
    FAILED=1
fi
echo ""

echo "7. Checking project structure..."
echo "---------------------------------"
# Check for critical directories
DIRS=("backend/app/models" "backend/app/routes" "backend/app/services" "backend/app/utils" "frontend/src/pages" "frontend/src/components" "frontend/src/lib" "data" "scripts")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir exists"
    else
        echo -e "${RED}✗${NC} $dir is missing"
        FAILED=1
    fi
done
echo ""

echo "8. Checking configuration files..."
echo "-----------------------------------"
FILES=(".env.example" ".gitignore" "docker-compose.yml" "README.md" "backend/Dockerfile" "backend/requirements.txt" "frontend/Dockerfile" "frontend/package.json")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file is missing"
        FAILED=1
    fi
done
echo ""

echo "9. Checking Git branches..."
echo "----------------------------"
if git show-ref --verify --quiet refs/heads/data-dumps; then
    echo -e "${GREEN}✓${NC} data-dumps branch exists locally"
else
    echo -e "${YELLOW}⚠${NC} data-dumps branch does not exist locally"
fi

if git ls-remote --heads origin data-dumps | grep -q "data-dumps"; then
    echo -e "${GREEN}✓${NC} data-dumps branch exists on remote"
else
    echo -e "${YELLOW}⚠${NC} data-dumps branch does not exist on remote"
fi
echo ""

echo "========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo "Setup is complete and verified."
    exit 0
else
    echo -e "${RED}✗ Some checks failed.${NC}"
    echo "Please review the errors above and fix them."
    exit 1
fi
