#!/usr/bin/env bash
#
# Load the demo seed data. Run AFTER `alembic upgrade head` - several of these
# statements depend on the migrated schema.
#
#   bash scripts/load_demo_data.sh
#
set -uo pipefail

PG=${PG_CONTAINER:-springais-postgres}
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT" || exit 1

psql_file () {
  local label="$1" file="$2"
  if [ ! -f "$file" ]; then
    echo "  SKIP  $label - missing $file"
    return 1
  fi
  # A Git LFS pointer is a few hundred bytes and starts with a version line.
  if head -c 45 "$file" | grep -q 'git-lfs.github.com'; then
    echo "  FAIL  $label - $file is still a Git LFS pointer."
    echo "        Run: git lfs install && git lfs pull"
    return 1
  fi
  echo "  ...   $label"
  docker exec -i "$PG" psql -U postgres -d springais -v ON_ERROR_STOP=1 -q < "$file"
}

echo "Loading demo data into container '$PG'"

psql_file "employees (900)"    data/synthetic_employees_llm.sql
psql_file "job postings (10)"  docker/postgres-post-migrate/03_seed_job_postings.sql
psql_file "pattern indexes"    docker/postgres-post-migrate/02_pattern_indexes.sql

echo
echo "Row counts:"
docker exec "$PG" psql -U postgres -d springais -c "
  SELECT 'employees' AS table, count(*) FROM employees
  UNION ALL SELECT 'job_postings', count(*) FROM job_postings
  UNION ALL SELECT 'skill_embeddings', count(*) FROM skill_embeddings;"

echo
echo "skill_embeddings is expected to be 0 until you run:"
echo "  docker exec springais-backend python /app/scripts/embed_seed_skills.py"
echo "(requires OPENAI_API_KEY; see DEMO.md section 6)"
