-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Employees table (synthetic data from Block A)
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(20) PRIMARY KEY,
    service_line VARCHAR(50) NOT NULL,
    "current_role" VARCHAR(100) NOT NULL,
    role_level INTEGER NOT NULL,
    years_experience NUMERIC(4, 2) NOT NULL,
    skills JSONB NOT NULL,
    performance_metrics JSONB NOT NULL,
    career_history JSONB,
    feedback_themes TEXT[],
    notable_achievement TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employees_service_line ON employees(service_line);
CREATE INDEX idx_employees_role ON employees("current_role");
CREATE INDEX idx_employees_service_role ON employees(service_line, "current_role");
CREATE INDEX idx_employees_skills ON employees USING GIN(skills);

-- Roles table (role definitions)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    service_line VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_level INTEGER NOT NULL,
    core_skills JSONB NOT NULL,
    common_skills JSONB NOT NULL,
    min_years_experience INTEGER,
    max_years_experience INTEGER,
    focus_areas TEXT[],
    UNIQUE(service_line, role_name)
);

-- Job postings table (scraped from EY careers)
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    service_line VARCHAR(50),
    location VARCHAR(255),
    posted_date DATE NOT NULL,
    closed_date DATE,
    scraped_at TIMESTAMP DEFAULT NOW(),
    required_skills TEXT[],
    preferred_skills TEXT[],
    description TEXT,
    years_experience VARCHAR(50),
    posting_url TEXT,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
    ) STORED
);

CREATE INDEX idx_job_postings_service_line ON job_postings(service_line);
CREATE INDEX idx_job_postings_posted_date ON job_postings(posted_date);
CREATE INDEX idx_job_postings_active ON job_postings(closed_date) WHERE closed_date IS NULL;
CREATE INDEX idx_job_postings_search ON job_postings USING GIN(search_vector);

-- Skill embeddings table (cached vectors)
CREATE TABLE IF NOT EXISTS skill_embeddings (
    skill_name VARCHAR(255) PRIMARY KEY,
    embedding vector(3072),  -- text-embedding-3-large dimension
    created_at TIMESTAMP DEFAULT NOW()
);

-- Note: pgvector indexes support max 2000 dimensions
-- For 3072-dim vectors, we'll use sequential scan or consider dimensionality reduction

-- User profiles table (demo users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    service_line VARCHAR(50),
    "current_role" VARCHAR(100),
    extracted_skills JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Matches table (user → role matches)
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    role_id INTEGER REFERENCES roles(id),
    job_posting_id UUID REFERENCES job_postings(id),
    similarity_score NUMERIC(3, 2),
    matched_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_matches_user ON matches(user_id);
CREATE INDEX idx_matches_role ON matches(role_id);
