# SpringAIS Synthetic Data

This directory contains synthetic employee data for SpringAIS development and testing.

## Files

| File | Description | Size |
|------|-------------|------|
| `synthetic_employees.sql` | PostgreSQL dump (900 employees) | ~541 KB |
| `synthetic_employees.json` | JSON format (for validation/testing) | ~897 KB |
| `validation_report.txt` | 5-layer validation report | ~8 KB |

## Loading Data

### From Docker (Recommended)

```bash
# Load into PostgreSQL
docker exec springais-backend cat /app/data/synthetic_employees.sql | \
  docker exec -i springais-postgres psql -U postgres -d springais

# Verify
docker exec -i springais-postgres psql -U postgres -d springais \
  -c "SELECT service_line, COUNT(*) FROM employees GROUP BY service_line;"
```

### From Local Machine

```bash
# If you have psql installed locally
psql -h localhost -p 5432 -U postgres -d springais < data/synthetic_employees.sql
```

## Data Distribution

| Service Line | Employees | Percentage |
|--------------|-----------|------------|
| Assurance | 300 | 33.3% |
| Tax | 300 | 33.3% |
| Consulting | 300 | 33.3% |

### Role Distribution

**Assurance (5 levels):**
- Staff: 90, Senior: 75, Manager: 60, Senior Manager: 45, Partner: 30

**Tax (5 levels):**
- Staff: 90, Senior: 75, Manager: 60, Senior Manager: 45, Partner: 30

**Consulting (9 levels):**
- Analyst: 45, Associate: 42, Sr Associate: 39, Consultant: 36, Sr Consultant: 33
- Manager: 30, Sr Manager: 27, Director: 24, Partner: 24

## Regenerating Data

To regenerate the synthetic data:

```bash
# Generate with mock data (no API cost, instant)
docker exec springais-backend python /app/scripts/generate_synthetic_data.py \
  --output /app/data/synthetic_employees.sql \
  --count 900 --mock --seed 42 --json

# Generate with live LLM (requires OPENAI_API_KEY, ~$2 cost)
docker exec springais-backend python /app/scripts/generate_synthetic_data.py \
  --output /app/data/synthetic_employees.sql \
  --count 900 --json

# Run validation
docker exec springais-backend python /app/scripts/validators.py \
  --json /app/data/synthetic_employees.json \
  --output /app/data/validation_report.txt --count 900
```

## Validation

All data passes 5-layer validation:

1. **Distribution**: Correct counts per service line and role
2. **Correlation**: Metrics increase with role level (within each service line)
3. **Progression**: Experience aligns with role level
4. **Boundary**: All values within realistic ranges
5. **Semantic**: Skills match service line and focus area

## Team Workflow

### Getting Latest Data

```bash
# Pull latest from data-dumps branch
git checkout data-dumps
git pull origin data-dumps

# Load into your local database
docker exec springais-backend cat /app/data/synthetic_employees.sql | \
  docker exec -i springais-postgres psql -U postgres -d springais

# Return to your working branch
git checkout main
```

### Updating Data (Data Generator Only)

```bash
# Generate new data
docker exec springais-backend python /app/scripts/generate_synthetic_data.py \
  --output /app/data/synthetic_employees.sql --count 900 --mock --seed 42 --json

# Run validation
docker exec springais-backend python /app/scripts/validators.py \
  --json /app/data/synthetic_employees.json \
  --output /app/data/validation_report.txt --count 900

# Copy files from container to host
docker cp springais-backend:/app/data/synthetic_employees.sql data/
docker cp springais-backend:/app/data/synthetic_employees.json data/
docker cp springais-backend:/app/data/validation_report.txt data/

# Commit to data-dumps branch
git checkout data-dumps
git add data/synthetic_employees.sql data/synthetic_employees.json data/validation_report.txt
git commit -m "Update synthetic data - $(date +%Y-%m-%d)"
git push origin data-dumps

# Return to main
git checkout main
```

## Last Generated

- **Date**: 2026-01-19
- **Seed**: 42 (for reproducibility)
- **Mode**: Mock (no LLM API calls)
- **Validation**: ✅ 46/46 checks passed

