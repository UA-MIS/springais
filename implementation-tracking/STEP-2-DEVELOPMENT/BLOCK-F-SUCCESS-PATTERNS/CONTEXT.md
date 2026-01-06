# BLOCK F: Success Pattern Analysis - CONTEXT

**Block ID:** BLOCK-F-SUCCESS-PATTERNS
**Phase:** STEP-2-DEVELOPMENT
**Category:** #backend #data #sql
**Estimated Time:** 2 days
**Dependencies:** None (requires STEP-1-SETUP complete)

---

## Purpose

Analyze historical employee data to identify patterns of successful role transitions. This block builds the analytical engine that discovers:
- Common career paths (e.g., Analyst → Senior Analyst → Manager)
- Skills associated with successful transitions
- Time-to-promotion patterns
- Success metrics by role and department

These insights power the career path visualization (Block K) and inform match recommendations (Block E).

---

## What This Block Delivers

1. **Success Pattern Service** - SQL-based analysis engine
2. **Career Path Discovery** - Identify common promotion paths
3. **Transition Metrics** - Calculate success rates and time-to-promotion
4. **Skill Correlation Analysis** - Find skills associated with successful moves
5. **API Endpoints** - Expose pattern insights to frontend

---

## Key Concepts

### Success Pattern Definition
A "success pattern" is a recurring career trajectory with:
- **Source Role** → **Target Role** (e.g., Consultant → Senior Consultant)
- **Success Rate:** % of employees who made this transition
- **Avg Time:** Median years between transitions
- **Common Skills:** Skills that 70%+ of successful transitioners had
- **Sample Size:** Number of employees who made this transition

### Pattern Types
1. **Promotion Patterns:** Same department, higher level (Analyst → Senior Analyst)
2. **Lateral Moves:** Different department, same level (Marketing Analyst → Sales Analyst)
3. **Career Pivots:** Different department AND level (Engineer → Product Manager)

---

## Technical Approach

### Data Source
Uses synthetic employee data (Block A) stored in `employees` table:
- `employee_id`, `name`, `current_role`, `department`
- `years_in_role`, `years_at_company`, `previous_roles` (JSON array)
- `skills` (JSON array), `performance_rating`

### Analysis Methods
1. **SQL Queries:** Aggregate employee transitions from `previous_roles` field
2. **Pattern Mining:** Find transitions with sample_size >= 5
3. **Skill Correlation:** Identify skills present in 70%+ of successful transitions
4. **Visualization Data:** Format for React Flow (Block K) and charts (Block L)

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Success Pattern Service                │
│  (backend/app/services/pattern_service) │
└─────────────────┬───────────────────────┘
                  │
                  ├─> analyze_transitions() ─> SQL: GROUP BY previous_role, current_role
                  ├─> find_common_paths() ──> Identify high-frequency transitions
                  ├─> calculate_success_rate() ─> % who got promoted
                  └─> skill_correlation() ──> Find skills in successful transitions
                  │
                  v
        ┌──────────────────────┐
        │   Pattern Repository │
        │   (Cached Results)   │
        └──────────────────────┘
                  │
                  v
        ┌──────────────────────┐
        │   API Endpoints      │
        │   /api/patterns/...  │
        └──────────────────────┘
```

---

## Database Schema (Reference)

Uses existing `employees` table from Block C:

```sql
-- employees table
id SERIAL PRIMARY KEY
name VARCHAR(255)
current_role VARCHAR(255)
department VARCHAR(255)
years_in_role DECIMAL
years_at_company DECIMAL
previous_roles JSONB  -- [{"role": "Analyst", "years": 2}, ...]
skills JSONB          -- ["Python", "SQL", "Leadership"]
performance_rating DECIMAL
```

---

## Example Success Pattern Output

```json
{
  "pattern_id": "consultant_to_senior_consultant",
  "source_role": "Consultant",
  "target_role": "Senior Consultant",
  "success_rate": 0.68,
  "avg_time_to_promotion_years": 2.5,
  "sample_size": 47,
  "common_skills": ["Client Management", "Problem Solving", "Excel", "PowerPoint"],
  "department": "Advisory",
  "recommended_skills_to_develop": ["Leadership", "Project Management"]
}
```

---

## Integration Points

**Feeds Into:**
- **Block K (Career Visualization):** Provides nodes/edges for React Flow graph
- **Block L (Success Pattern UI):** Provides metrics for charts
- **Block E (Matching Engine):** Informs "success pattern score" in match ranking
- **Block P (Visualization Integration):** Connects patterns to frontend

**Depends On:**
- **Block A (Synthetic Data):** Must have employees with `previous_roles` populated
- **Block C (Database Models):** Employee model must exist

---

## Mock Data for Testing

Since this block is independent, it can use mock employee data for unit tests:

```python
# Mock employee records for testing
mock_employees = [
    {"id": 1, "current_role": "Senior Analyst", "previous_roles": [{"role": "Analyst", "years": 2}], "skills": ["Excel", "SQL"]},
    {"id": 2, "current_role": "Senior Analyst", "previous_roles": [{"role": "Analyst", "years": 3}], "skills": ["Excel", "Python"]},
    # ... more records
]
```

---

## API Endpoints to Build

1. **GET /api/patterns/role/{role_name}**
   - Returns: All common career paths from given role

2. **GET /api/patterns/transition/{source_role}/{target_role}**
   - Returns: Detailed success pattern for specific transition

3. **GET /api/patterns/employee/{employee_id}/recommendations**
   - Returns: Suggested next roles based on employee's current role and skills

---

## Success Criteria

✅ Block F is complete when:
1. Service can analyze transitions from employee history data
2. API returns common career paths sorted by success rate
3. Skill correlation identifies skills associated with successful transitions
4. Pattern data is formatted for React Flow visualization
5. Results are cached to avoid re-running expensive queries
6. Unit tests verify pattern detection logic

---

## References

- **Synthetic Data:** `backend/data/employees.sql` (from Block A)
- **Database Models:** `backend/app/models/employee.py` (from Block C)
- **UX Design:** Career path visualization in `ux-unified-dashboard-v2-with-enhanced-roadmap.html`

---

## Notes

- Start with simple transition analysis, add sophistication later
- Cache pattern results (they change infrequently)
- For demo, focus on 3-5 common paths with good sample sizes
- Skill correlation should be configurable (default: 70% threshold)
- Consider adding performance_rating as a success indicator

---

**Next Steps:** See `TASKS.md` for implementation tasks
