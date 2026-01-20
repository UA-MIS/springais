-- ============================================
-- Block F: Success Pattern Analysis Indexes
-- Task 3.2: Optimize transition query performance
-- ============================================

-- Index on current_role for transition queries
CREATE INDEX IF NOT EXISTS idx_employees_current_role 
ON employees(current_role);

-- Index on service_line for filtering
CREATE INDEX IF NOT EXISTS idx_employees_service_line 
ON employees(service_line);

-- Compound index for common query pattern (service_line + current_role)
CREATE INDEX IF NOT EXISTS idx_employees_service_role 
ON employees(service_line, current_role);

-- GIN index on career_history JSONB for fast JSON queries
-- This enables efficient queries like: career_history @> '[{"role": "Analyst"}]'
CREATE INDEX IF NOT EXISTS idx_employees_career_history 
ON employees USING GIN(career_history);

-- GIN index on skills JSONB for skill correlation queries
CREATE INDEX IF NOT EXISTS idx_employees_skills_gin 
ON employees USING GIN(skills);

-- Partial index for employees with career history (most pattern queries)
CREATE INDEX IF NOT EXISTS idx_employees_with_history 
ON employees(current_role, service_line) 
WHERE career_history IS NOT NULL;

-- ============================================
-- Performance Notes:
-- - GIN indexes are excellent for JSONB containment queries
-- - Pattern analysis should complete in <2 seconds for 900 employees
-- - Consider BRIN indexes if employees table grows very large (10K+)
-- ============================================

