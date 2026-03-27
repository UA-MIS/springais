# SpringAIS Master Document - Part 3: Implementation Details

**Compiled**: 2026-02-16
**Scope**: Backend technical reference, frontend technical reference, data and integration patterns, database and deployment

---

## Table of Contents - Part 3

- [Section 11: Backend Technical Reference](#section-11-backend-technical-reference)
  - [11.1 API Reference (Design)](#111-api-reference-design)
  - [11.2 Database Schema (Design)](#112-database-schema-design)
  - [11.3 LLM Integration Guide](#113-llm-integration-guide)
  - [11.4 Service Patterns](#114-service-patterns)
  - [11.5 API Contracts (Implemented)](#115-api-contracts-implemented)
  - [11.6 Data Models (Implemented)](#116-data-models-implemented)
  - [11.7 Backend Scan Findings](#117-backend-scan-findings)
  - [11.8 Backend Development Guide](#118-backend-development-guide)
- [Section 12: Frontend Technical Reference](#section-12-frontend-technical-reference)
  - [12.1 Component Library (Design)](#121-component-library-design)
  - [12.2 Routing Structure](#122-routing-structure)
  - [12.3 State Management](#123-state-management)
  - [12.4 Styling Guide](#124-styling-guide)
  - [12.5 Component Inventory (Implemented)](#125-component-inventory-implemented)
  - [12.6 Frontend Development Guide](#126-frontend-development-guide)
  - [12.7 Frontend Scan Findings](#127-frontend-scan-findings)
- [Section 13: Data and Integration](#section-13-data-and-integration)
  - [13.1 API Contracts (Frontend-Backend)](#131-api-contracts-frontend-backend)
  - [13.2 Testing Strategy](#132-testing-strategy)
  - [13.3 Integration Patterns](#133-integration-patterns)
  - [13.4 Scraping Guide](#134-scraping-guide)
  - [13.5 Scraping Notes](#135-scraping-notes)
  - [13.6 Mock Data Formats](#136-mock-data-formats)
  - [13.7 Seed Scripts](#137-seed-scripts)
  - [13.8 Synthetic Data Generation](#138-synthetic-data-generation)
  - [13.9 Data Generation Plan](#139-data-generation-plan)
  - [13.10 Integration Scan Findings](#1310-integration-scan-findings)
- [Section 14: Database and Deployment](#section-14-database-and-deployment)
  - [14.1 Database Setup Guide](#141-database-setup-guide)
  - [14.2 Deployment Guide](#142-deployment-guide)

---

# Section 11: Backend Technical Reference

---

## 11.1 API Reference (Design)

> Source: `reference-docs/backend/api-reference.md`

# SpringAIS API Reference

**Last Updated:** 2026-01-06
**Base URL:** `http://localhost:8000/api`
**Auth:** JWT Bearer tokens (except /auth endpoints)

---

### Overview

All API endpoints follow RESTful conventions. Authenticated endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format:** All responses are JSON
**Error Format:** `{ "error": "Error message", "detail": {...} }`

---

### Authentication Endpoints

#### POST /api/auth/login

Authenticate user and receive JWT token.

**Request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@ey.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john.doe@ey.com",
    "name": "John Doe",
    "role": "Senior Consultant",
    "department": "Advisory",
    "service_line": "Consulting"
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Missing email or password

**Implemented In:** Block M (Core Integration)

---

#### GET /api/auth/me

Get current user info from JWT token.

**Request:**
```
GET /api/auth/me
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "john.doe@ey.com",
  "name": "John Doe",
  "role": "Senior Consultant",
  "department": "Advisory",
  "service_line": "Consulting",
  "experience_years": 5
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired token

**Implemented In:** Block M (Core Integration)

---

#### POST /api/auth/logout

Invalidate JWT token (optional - client-side only in MVP).

**Request:**
```
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Implemented In:** Block M (Core Integration)

---

### Employee Endpoints

#### GET /api/employees/{employee_id}

Get employee profile including skills and experience.

**Request:**
```
GET /api/employees/1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@ey.com",
  "role": "Senior Consultant",
  "department": "Advisory",
  "service_line": "Consulting",
  "experience_years": 5,
  "skills": [
    {
      "name": "Python",
      "proficiency": "Expert",
      "years_experience": 5
    },
    {
      "name": "Data Analysis",
      "proficiency": "Advanced",
      "years_experience": 4
    }
  ],
  "resume_uploaded": true,
  "resume_parsed_at": "2026-01-05T10:30:00Z"
}
```

**Errors:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - Cannot view other employee's profile
- `404 Not Found` - Employee does not exist

**Authorization:** User can only view their own profile (employee_id must match token)

**Implemented In:** Block M (Core Integration)

---

#### PUT /api/employees/{employee_id}

Update employee profile (name, department, etc.).

**Request:**
```json
PUT /api/employees/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "department": "Technology",
  "phone": "+1-555-123-4567"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@ey.com",
  "department": "Technology",
  "phone": "+1-555-123-4567",
  "updated_at": "2026-01-06T14:22:00Z"
}
```

**Errors:**
- `403 Forbidden` - Cannot update other employee's profile
- `400 Bad Request` - Invalid field values

**Implemented In:** Block M (Core Integration)

---

### Skill Extraction Endpoints

#### POST /api/skill-extraction

Extract skills from uploaded resume (PDF or DOCX).

**Request:**
```
POST /api/skill-extraction
Authorization: Bearer {token}
Content-Type: multipart/form-data

employee_id: 1
file: resume.pdf (binary)
```

**Response (200 OK):**
```json
{
  "employee_id": 1,
  "skills_extracted": [
    {
      "name": "Python",
      "proficiency": "Expert",
      "source": "resume",
      "confidence": 0.95
    },
    {
      "name": "Machine Learning",
      "proficiency": "Advanced",
      "source": "resume",
      "confidence": 0.88
    }
  ],
  "embedding_created": true,
  "processing_time_seconds": 12.4
}
```

**Errors:**
- `400 Bad Request` - Invalid file type (only PDF, DOCX allowed)
- `413 Payload Too Large` - File exceeds 10 MB limit
- `500 Internal Server Error` - GPT-5.2 Instant API failure

**File Limits:**
- Max size: 10 MB
- Max pages: 50
- Formats: PDF, DOCX

**Processing Time:**
- Typical: 10-15 seconds (GPT-5.2 Instant call)
- Cached (exact duplicate): 2-3 seconds

**Implemented In:** Block G (Skill Extraction), Block N (Skills Integration)

---

#### GET /api/skill-extraction/status/{job_id}

Check status of skill extraction job (if async).

**Request:**
```
GET /api/skill-extraction/status/abc-123-def
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "job_id": "abc-123-def",
  "status": "completed",
  "skills_extracted": [...],
  "created_at": "2026-01-06T14:00:00Z",
  "completed_at": "2026-01-06T14:00:12Z"
}
```

**Status Values:**
- `pending` - Job queued
- `processing` - GPT-5.2 Instant call in progress
- `completed` - Success
- `failed` - Error occurred

**Implemented In:** Block G (Skill Extraction)

---

### Matching Endpoints

#### GET /api/matches/employee/{employee_id}

Get job matches for employee, ranked by similarity + success pattern score.

**Request:**
```
GET /api/matches/employee/1?min_score=0.6&department=Technology&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**
- `min_score` (optional, default 0.6) - Minimum composite score (0-1)
- `department` (optional) - Filter by department
- `location` (optional) - Filter by location
- `limit` (optional, default 10) - Max results to return

**Response (200 OK):**
```json
{
  "employee_id": 1,
  "employee_name": "John Doe",
  "matches": [
    {
      "job_id": 42,
      "title": "Senior AI Engineer",
      "department": "Technology",
      "location": "New York",
      "posted_date": "2026-01-01",
      "similarity_score": 0.87,
      "experience_match": 0.92,
      "success_pattern_score": 0.72,
      "composite_score": 0.82,
      "overlapping_skills": [
        "Python",
        "Machine Learning",
        "TensorFlow"
      ],
      "missing_skills": [
        "Kubernetes",
        "Distributed Systems"
      ],
      "transferable_skills": [
        "Problem Solving",
        "Team Collaboration"
      ],
      "gap_count": 2
    }
  ],
  "total_count": 23,
  "cached": true,
  "cache_expires_at": "2026-01-06T15:30:00Z"
}
```

**Errors:**
- `403 Forbidden` - Cannot view other employee's matches
- `404 Not Found` - Employee has no skills (profile incomplete)

**Caching:**
- TTL: 1 hour
- Invalidated when: Employee skills updated, new jobs posted

**Performance:**
- Cold (uncached): ~800ms
- Warm (cached): ~50ms

**Implemented In:** Block E (Matching Engine), Block O (Matching Integration)

---

#### GET /api/matches/employee/{employee_id}/job/{job_id}

Get detailed skill gap analysis for a specific job match.

**Request:**
```
GET /api/matches/employee/1/job/42
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "employee_id": 1,
  "job_id": 42,
  "job_title": "Senior AI Engineer",
  "similarity_score": 0.87,
  "composite_score": 0.82,
  "skill_analysis": {
    "overlapping_skills": [
      {
        "name": "Python",
        "employee_proficiency": "Expert",
        "required_proficiency": "Advanced",
        "match": "exceeds"
      },
      {
        "name": "Machine Learning",
        "employee_proficiency": "Advanced",
        "required_proficiency": "Advanced",
        "match": "exact"
      }
    ],
    "missing_skills": [
      {
        "name": "Kubernetes",
        "required_proficiency": "Intermediate",
        "transferable_from": ["Docker", "Cloud Platforms"]
      }
    ],
    "transferable_skills": [
      {
        "name": "Problem Solving",
        "similarity_to_required": 0.75
      }
    ]
  },
  "success_pattern": {
    "success_rate": 0.68,
    "avg_time_to_transition_months": 18,
    "sample_size": 12
  }
}
```

**Implemented In:** Block E (Matching Engine), Block O (Matching Integration)

---

### Career Path Endpoints

#### GET /api/career-paths/employee/{employee_id}

Get career progression graph for employee.

**Request:**
```
GET /api/career-paths/employee/1?depth=2
Authorization: Bearer {token}
```

**Query Parameters:**
- `depth` (optional, default 2) - Graph depth (1-3 hops)

**Response (200 OK):**
```json
{
  "employee_id": 1,
  "current_role": {
    "id": 5,
    "title": "Senior Consultant",
    "level": 4
  },
  "graph": {
    "nodes": [
      {
        "id": 5,
        "title": "Senior Consultant",
        "level": 4,
        "is_current": true
      },
      {
        "id": 8,
        "title": "Manager",
        "level": 5,
        "is_current": false
      },
      {
        "id": 12,
        "title": "Senior Manager",
        "level": 6,
        "is_current": false
      }
    ],
    "edges": [
      {
        "from": 5,
        "to": 8,
        "transition_count": 45,
        "avg_time_months": 18,
        "success_rate": 0.72
      },
      {
        "from": 8,
        "to": 12,
        "transition_count": 32,
        "avg_time_months": 24,
        "success_rate": 0.68
      }
    ]
  },
  "cached": true
}
```

**Errors:**
- `403 Forbidden` - Cannot view other employee's career path
- `404 Not Found` - Employee role not found

**Caching:**
- TTL: 1 hour
- Invalidated when: New career transitions added

**Implemented In:** Block F (Success Patterns), Block P (Viz Integration)

---

### Success Pattern Endpoints

#### GET /api/success-patterns

Get success metrics for a specific career transition.

**Request:**
```
GET /api/success-patterns?from_role=5&to_role=8
Authorization: Bearer {token}
```

**Query Parameters:**
- `from_role` (required) - Source role ID
- `to_role` (required) - Target role ID

**Response (200 OK):**
```json
{
  "from_role": {
    "id": 5,
    "title": "Senior Consultant"
  },
  "to_role": {
    "id": 8,
    "title": "Manager"
  },
  "metrics": {
    "total_transitions": 45,
    "successful_transitions": 32,
    "success_rate": 0.71,
    "avg_time_months": 18.3,
    "median_time_months": 16,
    "avg_performance_score": 3.8
  },
  "top_skills": [
    {
      "name": "Python",
      "frequency": 0.92,
      "avg_proficiency": "Expert"
    },
    {
      "name": "Leadership",
      "frequency": 0.88,
      "avg_proficiency": "Advanced"
    }
  ],
  "comparison": {
    "successful_avg_time_months": 16.2,
    "unsuccessful_avg_time_months": 24.8,
    "time_difference_months": 8.6
  }
}
```

**Errors:**
- `400 Bad Request` - Missing from_role or to_role
- `404 Not Found` - No transitions found for role pair

**Caching:**
- TTL: 24 hours (patterns are stable)

**Implemented In:** Block F (Success Patterns), Block P (Viz Integration)

---

#### GET /api/success-patterns/timeline

Get historical success rate over time.

**Request:**
```
GET /api/success-patterns/timeline?from_role=5&to_role=8&start_year=2020&end_year=2025
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "from_role_id": 5,
  "to_role_id": 8,
  "timeline": [
    {
      "year": 2020,
      "success_rate": 0.65,
      "transition_count": 8
    },
    {
      "year": 2021,
      "success_rate": 0.72,
      "transition_count": 12
    },
    {
      "year": 2022,
      "success_rate": 0.68,
      "transition_count": 10
    }
  ]
}
```

**Implemented In:** Block F (Success Patterns)

---

### Job Posting Endpoints

#### GET /api/jobs

Get all job postings with optional filters.

**Request:**
```
GET /api/jobs?department=Technology&location=New York&page=1&limit=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `department` (optional) - Filter by department
- `location` (optional) - Filter by location
- `page` (optional, default 1) - Page number
- `limit` (optional, default 20) - Results per page

**Response (200 OK):**
```json
{
  "jobs": [
    {
      "id": 42,
      "title": "Senior AI Engineer",
      "department": "Technology",
      "location": "New York",
      "description": "We are seeking...",
      "required_skills": ["Python", "Machine Learning", "TensorFlow"],
      "experience_years_min": 5,
      "experience_years_max": 8,
      "posted_date": "2026-01-01",
      "expires_date": "2026-02-01"
    }
  ],
  "total_count": 47,
  "page": 1,
  "pages": 3
}
```

**Implemented In:** Block B (Job Scraper)

---

#### GET /api/jobs/{job_id}

Get detailed job posting.

**Request:**
```
GET /api/jobs/42
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": 42,
  "title": "Senior AI Engineer",
  "department": "Technology",
  "location": "New York",
  "description": "We are seeking a Senior AI Engineer...",
  "required_skills": [
    {
      "name": "Python",
      "proficiency": "Advanced",
      "required": true
    },
    {
      "name": "Machine Learning",
      "proficiency": "Advanced",
      "required": true
    }
  ],
  "experience_years_min": 5,
  "experience_years_max": 8,
  "salary_range": "$120,000 - $160,000",
  "posted_date": "2026-01-01",
  "expires_date": "2026-02-01",
  "embedding_created": true
}
```

**Implemented In:** Block B (Job Scraper)

---

### Health Check Endpoints

#### GET /api/health

System health check.

**Request:**
```
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-06T14:30:00Z",
  "services": {
    "database": "up",
    "redis": "up",
    "openai": "up"
  },
  "version": "1.0.0"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-06T14:30:00Z",
  "services": {
    "database": "up",
    "redis": "down",
    "openai": "up"
  },
  "error": "Redis connection failed"
}
```

**Implemented In:** STEP-1-SETUP

---

### Error Responses

#### Standard Error Format

All errors return this format:

```json
{
  "error": "Brief error message",
  "detail": "Detailed explanation or validation errors",
  "status_code": 400,
  "timestamp": "2026-01-06T14:30:00Z"
}
```

#### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | User not authorized for resource |
| 404 | Not Found | Resource does not exist |
| 413 | Payload Too Large | File exceeds size limit |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | OpenAI API down |

---

### Rate Limiting

**Current MVP:** No rate limiting (local development)

**Future Production:**
- 100 requests per minute per user
- 429 status code when exceeded
- Response header: `X-RateLimit-Remaining: 87`

---

### API Versioning

**Current:** No versioning (v1 assumed)

**Future:** Version in URL path:
- `/api/v1/matches/employee/1`
- `/api/v2/matches/employee/1`

---

**Document Purpose:** Complete API reference for frontend developers
**Audience:** Frontend developers, integration testers
**Last Updated:** 2026-01-06

---

## 11.2 Database Schema (Design)

> Source: `reference-docs/backend/database-schema.md`

# SpringAIS Database Schema

**Last Updated:** 2026-01-06
**Database:** PostgreSQL 16 with pgvector 0.5.1
**ORM:** SQLAlchemy 2.0

---

### Overview

The SpringAIS database consists of **12 core tables** organized into 4 functional areas:

1. **Core Entities** (3 tables)
   - employees
   - job_postings
   - roles

2. **Skills & Embeddings** (4 tables)
   - employee_skills
   - job_posting_skills
   - employee_embeddings
   - job_posting_embeddings

3. **Career Data** (2 tables)
   - career_transitions
   - performance_reviews

4. **Application Tracking** (3 tables)
   - job_applications
   - saved_matches
   - user_auth

---

### Entity Relationship Diagram

```
+-----------------+         +-----------------+
|   employees     |<--------|  user_auth      |
|  (Core profile) |         |  (JWT tokens)   |
+--------+--------+         +-----------------+
         |
         | 1:N
         v
+---------------------+     +----------------------+
|  employee_skills    |     | employee_embeddings  |
|  (Skills list)      |     |  (Vector: 3072-D)    |
+---------------------+     +----------------------+
         |
         | M:N (via matching)
         v
+---------------------+     +----------------------+
|  job_postings       |<----|job_posting_embeddings|
|  (Open positions)   |     |  (Vector: 3072-D)    |
+--------+------------+     +----------------------+
         |
         | 1:N
         v
+---------------------+
| job_posting_skills  |
|  (Required skills)  |
+---------------------+
         |
         | M:N (employee -> job_posting)
         v
+----------------------+    +----------------------+
|  job_applications    |    |  saved_matches       |
|  (Apply tracking)    |    |  (Bookmarked jobs)   |
+----------------------+    +----------------------+

+---------------------+
|  roles              |
|  (Role hierarchy)   |
+--------+------------+
         |
         | 1:N (from_role, to_role)
         v
+----------------------+
| career_transitions   |
|  (Role changes)      |
+----------------------+
         |
         | 1:N
         v
+----------------------+
| performance_reviews  |
|  (Annual reviews)    |
+----------------------+
```

---

### Core Entities

#### employees

**Purpose:** Store employee profile information

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt hashed
    name VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    department VARCHAR(100),  -- Advisory, Technology, etc.
    service_line VARCHAR(100),  -- Assurance, Tax, Consulting
    location VARCHAR(100),  -- New York, London, etc.
    experience_years INTEGER,
    hire_date DATE,
    phone VARCHAR(50),
    resume_uploaded BOOLEAN DEFAULT FALSE,
    resume_parsed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_role_id ON employees(role_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_service_line ON employees(service_line);
```

**Implemented In:** Block C (Database Models)

---

#### job_postings

**Purpose:** Store job postings scraped from EY careers site

```sql
CREATE TABLE job_postings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    service_line VARCHAR(100),
    location VARCHAR(100),
    role_id INTEGER REFERENCES roles(id),
    experience_years_min INTEGER,
    experience_years_max INTEGER,
    salary_range VARCHAR(100),
    posted_date DATE NOT NULL,
    expires_date DATE,
    source_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_postings_department ON job_postings(department);
CREATE INDEX idx_job_postings_role_id ON job_postings(role_id);
CREATE INDEX idx_job_postings_posted_date ON job_postings(posted_date DESC);
CREATE INDEX idx_job_postings_is_active ON job_postings(is_active) WHERE is_active = TRUE;
```

**Implemented In:** Block B (Job Scraper)

---

#### roles

**Purpose:** Define role hierarchy and career levels

```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) UNIQUE NOT NULL,
    service_line VARCHAR(100),  -- Assurance, Tax, Consulting
    level INTEGER NOT NULL,  -- 1 = entry, 9 = partner
    description TEXT,
    avg_salary_min INTEGER,
    avg_salary_max INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_service_line ON roles(service_line);
CREATE INDEX idx_roles_level ON roles(level);
```

**Sample Data:**
```sql
-- Consulting roles (9 levels)
INSERT INTO roles (title, service_line, level, description) VALUES
('Analyst', 'Consulting', 1, 'Entry-level consultant role'),
('Associate', 'Consulting', 2, 'Junior consultant with 1-2 years experience'),
('Senior Associate', 'Consulting', 3, '3-4 years experience'),
('Consultant', 'Consulting', 4, '5-6 years experience'),
('Senior Consultant', 'Consulting', 5, '7-8 years experience, lead small projects'),
('Manager', 'Consulting', 6, '9-11 years, manage teams'),
('Senior Manager', 'Consulting', 7, '12+ years, lead large engagements'),
('Director', 'Consulting', 8, '15+ years, strategic leadership'),
('Partner', 'Consulting', 9, 'Top-level, business development and client relationships');
```

**Implemented In:** Block A (Synthetic Data)

---

### Skills & Embeddings

#### employee_skills

**Purpose:** Store employee skills and proficiency levels

```sql
CREATE TABLE employee_skills (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    proficiency VARCHAR(50),  -- Beginner, Intermediate, Advanced, Expert
    years_experience INTEGER,
    source VARCHAR(50),  -- resume, manual, inferred
    confidence DECIMAL(3, 2),  -- 0.00 to 1.00 (for AI-extracted skills)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_skills_employee_id ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill_name ON employee_skills(skill_name);
CREATE INDEX idx_employee_skills_proficiency ON employee_skills(proficiency);
```

**Implemented In:** Block G (Skill Extraction)

---

#### employee_embeddings

**Purpose:** Store 3072-D vector embeddings for semantic matching

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE employee_embeddings (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    embedding_vector vector(3072),  -- pgvector type
    model_version VARCHAR(50) DEFAULT 'text-embedding-3-large',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HNSW index for fast similarity search
CREATE INDEX idx_employee_embeddings_vector ON employee_embeddings
    USING hnsw (embedding_vector vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_employee_embeddings_employee_id ON employee_embeddings(employee_id);
```

**Vector Operations:**
```sql
-- Find similar employees (cosine similarity)
SELECT employee_id, 1 - (embedding_vector <=> $1) AS similarity
FROM employee_embeddings
WHERE 1 - (embedding_vector <=> $1) > 0.7
ORDER BY similarity DESC
LIMIT 10;
```

**Implemented In:** Block D (Vector Embeddings)

---

#### job_posting_embeddings

**Purpose:** Store 3072-D vector embeddings for job postings

```sql
CREATE TABLE job_posting_embeddings (
    id SERIAL PRIMARY KEY,
    job_posting_id INTEGER UNIQUE NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    embedding_vector vector(3072),
    model_version VARCHAR(50) DEFAULT 'text-embedding-3-large',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HNSW index for fast similarity search
CREATE INDEX idx_job_posting_embeddings_vector ON job_posting_embeddings
    USING hnsw (embedding_vector vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_job_posting_embeddings_job_id ON job_posting_embeddings(job_posting_id);
```

**Implemented In:** Block D (Vector Embeddings)

---

### Career Data

#### career_transitions

**Purpose:** Track employee role changes for success pattern analysis

```sql
CREATE TABLE career_transitions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    from_role_id INTEGER NOT NULL REFERENCES roles(id),
    to_role_id INTEGER NOT NULL REFERENCES roles(id),
    transition_date DATE NOT NULL,
    months_to_transition INTEGER,
    was_promoted BOOLEAN DEFAULT TRUE,
    performance_score DECIMAL(3, 2),  -- 1.00-5.00
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_career_transitions_employee_id ON career_transitions(employee_id);
CREATE INDEX idx_career_transitions_from_to ON career_transitions(from_role_id, to_role_id);
CREATE INDEX idx_career_transitions_date ON career_transitions(transition_date DESC);
```

**Aggregation Query (Success Patterns):**
```sql
SELECT
    COUNT(*) AS total_transitions,
    COUNT(*) FILTER (WHERE was_promoted = TRUE) AS promoted,
    AVG(months_to_transition) AS avg_months,
    AVG(performance_score) AS avg_performance
FROM career_transitions
WHERE from_role_id = 4 AND to_role_id = 5;
```

**Implemented In:** Block F (Success Patterns)

---

#### performance_reviews

**Purpose:** Store annual performance review data

```sql
CREATE TABLE performance_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    review_year INTEGER NOT NULL,
    score DECIMAL(3, 2),  -- 1.00 to 5.00
    feedback_summary TEXT,
    strengths TEXT,
    development_areas TEXT,
    reviewer_role VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_performance_reviews_employee_id ON performance_reviews(employee_id);
CREATE INDEX idx_performance_reviews_year ON performance_reviews(review_year);
CREATE UNIQUE INDEX idx_performance_reviews_employee_year ON performance_reviews(employee_id, review_year);
```

**Implemented In:** Block A (Synthetic Data)

---

### Application Tracking

#### job_applications

**Purpose:** Track employee applications to internal job postings

```sql
CREATE TABLE job_applications (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    job_posting_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'applied',
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_applications_employee_id ON job_applications(employee_id);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_posting_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE UNIQUE INDEX idx_job_applications_employee_job ON job_applications(employee_id, job_posting_id);
```

**Implemented In:** Block O (Matching Integration)

---

#### saved_matches

**Purpose:** Track bookmarked/saved job matches

```sql
CREATE TABLE saved_matches (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    job_posting_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    saved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_saved_matches_employee_id ON saved_matches(employee_id);
CREATE UNIQUE INDEX idx_saved_matches_employee_job ON saved_matches(employee_id, job_posting_id);
```

**Implemented In:** Block O (Matching Integration)

---

#### user_auth

**Purpose:** Store JWT refresh tokens (optional for MVP)

```sql
CREATE TABLE user_auth (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500),
    refresh_token_expires_at TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_auth_employee_id ON user_auth(employee_id);
```

**Note:** For MVP, JWT tokens are stateless (no DB storage). This table is for future enhancement.

**Implemented In:** Block M (Core Integration)

---

### Database Indexes Summary

**Vector Similarity (HNSW):**
- `idx_employee_embeddings_vector` - Enable fast cosine similarity search (<100ms for 10K vectors)
- `idx_job_posting_embeddings_vector` - Enable fast job matching

**Career Transition Queries:**
- `idx_career_transitions_from_to` - Composite index for success pattern analysis (<50ms)

**Employee Skill Lookup:**
- `idx_employee_skills_employee_id` - Enable fast skill retrieval (<10ms)

**Job Posting Filters:**
- `idx_job_postings_department` - Department filter
- `idx_job_postings_is_active` - Partial index for active jobs only

---

### Materialized Views (Future Enhancement)

#### mv_employee_match_scores

**Purpose:** Pre-compute top matches for all employees (refresh nightly)

```sql
CREATE MATERIALIZED VIEW mv_employee_match_scores AS
SELECT
    e.id AS employee_id,
    jp.id AS job_posting_id,
    1 - (ee.embedding_vector <=> jpe.embedding_vector) AS similarity_score
FROM employees e
JOIN employee_embeddings ee ON e.id = ee.employee_id
CROSS JOIN job_postings jp
JOIN job_posting_embeddings jpe ON jp.id = jpe.job_posting_id
WHERE jp.is_active = TRUE
    AND 1 - (ee.embedding_vector <=> jpe.embedding_vector) > 0.6
ORDER BY employee_id, similarity_score DESC;

CREATE UNIQUE INDEX idx_mv_match_scores ON mv_employee_match_scores(employee_id, job_posting_id);
```

**Benefits:**
- Match query drops from 800ms to 50ms
- No real-time vector computation needed

**Trade-offs:**
- Stale data (up to 24 hours old)
- Increased storage (~500 MB for 900 employees x 50 jobs)

---

### Data Volume Estimates

#### 8-Week MVP

| Table | Rows | Size |
|-------|------|------|
| employees | 900 | 500 KB |
| employee_skills | 10,800 (12 per employee) | 1.5 MB |
| employee_embeddings | 900 | 12 MB (3072-D vectors) |
| job_postings | 50 | 200 KB |
| job_posting_embeddings | 50 | 700 KB |
| career_transitions | 5,000 | 1 MB |
| performance_reviews | 4,500 (5 years x 900) | 5 MB |
| **Total** | **~22K rows** | **~21 MB** |

#### Future Production (10,000 employees)

| Table | Rows | Size |
|-------|------|------|
| employees | 10,000 | 5 MB |
| employee_skills | 120,000 | 15 MB |
| employee_embeddings | 10,000 | 135 MB |
| job_postings | 500 | 2 MB |
| job_posting_embeddings | 500 | 7 MB |
| **Total** | **~140K rows** | **~165 MB** |

**Conclusion:** Database will fit comfortably in memory (PostgreSQL shared_buffers = 256 MB)

---

**Document Purpose:** Complete database schema reference
**Audience:** Backend developers, database administrators
**Last Updated:** 2026-01-06

---

## 11.3 LLM Integration Guide

> Source: `reference-docs/backend/llm-integration.md`

# SpringAIS LLM Integration Guide

**Last Updated:** 2026-01-06
**Provider:** OpenAI
**Models Used:** GPT-5.2 Instant (skill extraction), text-embedding-3-large (semantic matching)

---

### Overview

SpringAIS uses OpenAI's API for two critical functions:

1. **Skill Extraction** - GPT-5.2 Instant parses resumes and extracts structured skill data
2. **Semantic Matching** - text-embedding-3-large creates 3072-D vectors for similarity search

---

### OpenAI API Setup

#### API Key Configuration

```python
# backend/.env
OPENAI_API_KEY=sk-proj-...your-key-here...
OPENAI_ORG_ID=org-...your-org... (optional)
```

#### SDK Initialization

```python
# backend/app/services/openai_client.py
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    organization=os.getenv("OPENAI_ORG_ID"),  # Optional
    timeout=30.0,  # 30 second timeout
    max_retries=3  # Retry on transient errors
)
```

**Implemented In:** Block D (Vector Embeddings), Block G (Skill Extraction)

---

### Skill Extraction with GPT-5.2

#### Use Case

Extract structured skills from unstructured resume text (PDF/DOCX).

**Input:** Raw resume text (2-10 pages)
**Output:** JSON array of skills with proficiency levels

#### System Prompt

```python
SKILL_EXTRACTION_SYSTEM_PROMPT = """
You are an expert HR skills analyst. Your job is to extract technical and soft skills from resumes.

Instructions:
1. Extract ALL skills mentioned in the resume (technical, soft, domain-specific)
2. Assign proficiency level based on context clues:
   - Beginner: "Familiar with", "Basic knowledge", <1 year experience
   - Intermediate: "Proficient in", "Working knowledge", 1-3 years
   - Advanced: "Expert in", "Strong skills in", 3-5 years
   - Expert: "Deep expertise", "Led projects using", 5+ years
3. Normalize skill names:
   - "Python programming" -> "Python"
   - "ML/AI" -> "Machine Learning"
   - "JavaScript (React)" -> "JavaScript" and "React" (separate skills)
4. Return ONLY valid JSON. No markdown, no explanations.

Output format:
{
  "skills": [
    {
      "name": "Python",
      "proficiency": "Expert",
      "years_experience": 5,
      "confidence": 0.95
    }
  ]
}
"""
```

#### API Call

```python
# backend/app/services/skill_extraction_service.py
from app.services.openai_client import client

def extract_skills_from_resume(resume_text: str) -> list[dict]:
    try:
        response = client.chat.completions.create(
            model="gpt-5.2-chat-latest",
            messages=[
                {"role": "system", "content": SKILL_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Extract skills from this resume:\n\n{resume_text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=2000,
            timeout=30.0
        )

        result = json.loads(response.choices[0].message.content)
        skills = result.get("skills", [])

        validated_skills = []
        for skill in skills:
            if "name" in skill and "proficiency" in skill:
                validated_skills.append({
                    "name": skill["name"],
                    "proficiency": skill["proficiency"],
                    "years_experience": skill.get("years_experience", 0),
                    "confidence": skill.get("confidence", 0.8)
                })

        return validated_skills

    except Exception as e:
        logger.error(f"Skill extraction failed: {e}")
        raise
```

#### Cost Optimization

**Cost Per Resume (GPT-5.2 Instant):**
- Input: 2,500 tokens x $3.00 / 1M = $0.0075
- Output: 800 tokens x $15.00 / 1M = $0.012
- **Total: ~$0.02 per resume**

**For 900 employees:** 900 x $0.02 = **$18 total**

#### Caching Strategy

**Redis Cache:**
- Key: `skill_extraction:{sha256_hash_of_resume_text}`
- TTL: 24 hours
- Cache hit rate: ~60% (employees re-upload same resume)

**Savings:**
- First upload: $0.02 (API call)
- Subsequent uploads: $0 (cache hit)
- **Effective cost: ~$0.008 per resume**

```python
import hashlib
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def extract_skills_with_cache(resume_text: str) -> list[dict]:
    text_hash = hashlib.sha256(resume_text.encode()).hexdigest()
    cache_key = f"skill_extraction:{text_hash}"

    cached_result = redis_client.get(cache_key)
    if cached_result:
        return json.loads(cached_result)

    skills = extract_skills_from_resume(resume_text)
    redis_client.setex(cache_key, 86400, json.dumps(skills))

    return skills
```

**Implemented In:** Block G (Skill Extraction)

---

### Vector Embeddings with text-embedding-3-large

#### Use Case

Generate 3072-D vector representations of skills for semantic matching.

**Input:** Concatenated skill string
**Output:** 3072-D float vector

#### API Call

```python
def generate_embedding(text: str) -> list[float]:
    try:
        response = client.embeddings.create(
            model="text-embedding-3-large",
            input=text,
            encoding_format="float"
        )

        embedding = response.data[0].embedding
        assert len(embedding) == 3072, f"Expected 3072-D, got {len(embedding)}"
        return embedding

    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise
```

#### Cost Optimization

**Cost Per Embedding (text-embedding-3-large):**
- Input: ~100 tokens (skill list)
- Cost: 100 tokens x $0.13 / 1M = **$0.000013 per embedding**

**For 900 employees:** $0.012 total
**For 50 job postings:** $0.0007 total
**Total embedding cost: ~$0.02** (negligible)

#### Batch Processing

```python
def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model="text-embedding-3-large",
        input=texts,
        encoding_format="float"
    )
    embeddings = [data.embedding for data in response.data]
    return embeddings
```

**Implemented In:** Block D (Vector Embeddings)

---

### Error Handling - Retry Logic with Exponential Backoff

```python
from openai import OpenAI, OpenAIError, RateLimitError, APITimeoutError

def call_openai_with_retry(api_call_func, max_retries=5, initial_delay=1.0):
    for attempt in range(max_retries):
        try:
            return api_call_func()
        except RateLimitError as e:
            delay = initial_delay * (2 ** attempt)
            logger.warning(f"Rate limit hit. Retrying in {delay}s (attempt {attempt + 1}/{max_retries})")
            time.sleep(delay)
        except APITimeoutError as e:
            logger.warning(f"API timeout. Retrying (attempt {attempt + 1}/{max_retries})")
            time.sleep(initial_delay)
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    raise OpenAIError("Max retries exceeded")
```

---

### Cost Tracking Summary - 8-Week MVP

| Operation | Count | Cost Per | Total |
|-----------|-------|----------|-------|
| Skill extraction (initial) | 900 resumes | $0.02 | $18.00 |
| Skill extraction (testing) | 50 resumes | $0.02 | $1.00 |
| Employee embeddings | 900 | $0.00001 | $0.01 |
| Job posting embeddings | 50 | $0.00001 | $0.0005 |
| **Total** | | | **~$19** |

**With caching (60% hit rate):** Total with caching: ~$8

---

**Document Purpose:** OpenAI API integration patterns and best practices
**Audience:** Backend developers working on LLM features
**Last Updated:** 2026-01-06

---

## 11.4 Service Patterns

> Source: `reference-docs/backend/service-patterns.md`

# SpringAIS Backend Service Patterns

**Last Updated:** 2026-01-06
**Framework:** FastAPI + SQLAlchemy 2.0
**Architecture:** Service Layer Pattern

---

### Overview

SpringAIS backend follows a **layered architecture** with clear separation of concerns:

1. **API Layer** - FastAPI routes, request/response models (Pydantic)
2. **Service Layer** - Business logic, orchestration
3. **Data Layer** - SQLAlchemy models, database queries
4. **External Services** - OpenAI API, Redis cache

---

### Architecture Diagram

```
+-----------------------------------------------------------+
|  API Layer (FastAPI Routes)                                |
|  - Request validation (Pydantic)                           |
|  - Authentication middleware (JWT)                         |
|  - Response serialization                                  |
+--------------------------+--------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|  Service Layer (Business Logic)                            |
|  - MatchingService                                         |
|  - SkillExtractionService                                  |
|  - SuccessPatternService                                   |
|  - EmbeddingService                                        |
|  - CareerPathService                                       |
+--------------------------+--------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|  Data Layer (SQLAlchemy ORM)                               |
|  - Employee, JobPosting, Role models                       |
|  - Database queries, transactions                          |
+--------------------------+--------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|  PostgreSQL + Redis + OpenAI                               |
+-----------------------------------------------------------+
```

---

### API Layer Patterns

#### Route Structure

```python
# backend/app/api/routes/matches.py
from fastapi import APIRouter, Depends, HTTPException
from app.services.matching_service import MatchingService
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/matches", tags=["matches"])

@router.get("/employee/{employee_id}")
async def get_employee_matches(
    employee_id: int,
    min_score: float = 0.6,
    department: str | None = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["id"] != employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    service = MatchingService()
    matches = service.get_matches(
        employee_id=employee_id,
        min_score=min_score,
        department=department
    )

    return {
        "employee_id": employee_id,
        "matches": matches,
        "total_count": len(matches)
    }
```

**Key Patterns:**
1. **Route prefix** - Group related endpoints (`/matches`, `/employees`, etc.)
2. **Dependency injection** - Use `Depends()` for auth, DB sessions
3. **Authorization** - Check user permissions in route handler
4. **Delegation** - Route calls service, service handles business logic
5. **Error handling** - Raise HTTPException for API errors

---

#### Request/Response Models (Pydantic)

```python
from pydantic import BaseModel, Field
from typing import List

class SkillGapResponse(BaseModel):
    name: str
    employee_proficiency: str | None = None
    required_proficiency: str
    match_type: str  # "overlapping", "missing", "transferable"

class JobMatchResponse(BaseModel):
    job_id: int
    title: str
    department: str
    location: str
    similarity_score: float = Field(ge=0.0, le=1.0)
    composite_score: float = Field(ge=0.0, le=1.0)
    overlapping_skills: List[str]
    missing_skills: List[str]
    gap_count: int

class MatchesResponse(BaseModel):
    employee_id: int
    employee_name: str
    matches: List[JobMatchResponse]
    total_count: int
    cached: bool = False
```

---

#### Authentication Middleware

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import os

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            os.getenv("JWT_SECRET"),
            algorithms=["HS256"]
        )
        user = {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "role": payload.get("role")
        }
        if not user["id"]:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
```

**Implemented In:** Block M (Core Integration)

---

### Service Layer Patterns

#### MatchingService Example

```python
class MatchingService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.embedding_service = EmbeddingService(db)
        self.success_pattern_service = SuccessPatternService(db)

    def get_matches(self, employee_id: int, min_score: float = 0.6,
                    department: str | None = None, limit: int = 10) -> list[dict]:
        # 1. Check cache
        cache_key = f"matches:employee:{employee_id}:{min_score}:{department}"
        cached = self.redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

        # 2. Vector similarity search
        employee_embedding = self.db.query(EmployeeEmbedding).filter_by(employee_id=employee_id).first()
        raw_matches = self._vector_similarity_search(employee_embedding.embedding_vector, min_score, department)

        # 3. Enrich with skill gaps + success patterns
        enriched_matches = []
        for match in raw_matches:
            skill_gap = self._analyze_skill_gap(employee_id, match["job_id"])
            success_pattern = self.success_pattern_service.get_pattern_score(employee_id, match["job_id"])
            composite_score = self._calculate_composite_score(
                match["similarity_score"], skill_gap["experience_match"], success_pattern
            )
            enriched_matches.append({**match, **skill_gap, "success_pattern_score": success_pattern, "composite_score": composite_score})

        # 4. Sort and cache
        enriched_matches.sort(key=lambda x: x["composite_score"], reverse=True)
        top_matches = enriched_matches[:limit]
        self.redis_client.setex(cache_key, 3600, json.dumps(top_matches))
        return top_matches

    def _calculate_composite_score(self, similarity, experience_match, success_pattern):
        return 0.50 * similarity + 0.25 * experience_match + 0.25 * success_pattern
```

**Key Patterns:**
1. **Single Responsibility** - Each service handles one domain
2. **Dependency Injection** - Services receive DB session via constructor
3. **Service Composition** - MatchingService uses EmbeddingService and SuccessPatternService
4. **Caching** - Services manage their own cache keys and TTLs
5. **Private Methods** - Use `_method_name` for internal helpers

**Implemented In:** Block E (Matching Engine)

---

### Error Handling Patterns

#### Custom Exceptions

```python
class SpringAISException(Exception):
    """Base exception for SpringAIS"""
    pass

class EmployeeNotFoundException(SpringAISException):
    pass

class SkillExtractionException(SpringAISException):
    pass

class OpenAIAPIException(SpringAISException):
    pass
```

---

### Caching Patterns

#### Redis Cache Helper

```python
def cache_result(key_prefix: str, ttl: int = 3600):
    def decorator(func):
        def wrapper(*args, **kwargs):
            key_parts = [key_prefix, func.__name__]
            key_parts.extend([str(arg) for arg in args])
            key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
            cache_key = ":".join(key_parts)

            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)

            result = func(*args, **kwargs)
            redis_client.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator
```

#### Cache Invalidation

```python
def invalidate_cache(pattern: str):
    keys = redis_client.keys(pattern)
    if keys:
        redis_client.delete(*keys)
```

---

**Document Purpose:** Backend service layer patterns and best practices
**Audience:** Backend developers
**Last Updated:** 2026-01-06

---

## 11.5 API Contracts (Implemented)

> Source: `_bmad-output/api-contracts-backend.md`
> Full content of 68+ implemented API endpoints across 7 routers.
> See source file for complete request/response schemas.

This section documents all implemented API contracts as discovered through codebase scanning. For the complete request/response schemas, refer to Section 11.7 (Backend Scan Findings) which contains the full endpoint listings.

**Base Configuration:**
- Base URL: `http://localhost:8000`
- Auth endpoints: `/auth/*` (no prefix)
- All other endpoints: `/api/*`
- Authentication: JWT Bearer token in `Authorization` header
- Content-Type: `application/json` (except file uploads: `multipart/form-data`)
- Compression: GZip for responses > 500 bytes

**Endpoint Count Summary:**

| Router | Endpoints |
|--------|-----------|
| Auth (`/auth`) | 3 (register, login, me) |
| Matches (`/api/matches`) | 7 (list, detail, skill-gaps, save, saved, deep-analysis, delete) |
| Skills (`/api/skills`) | 25+ (progress, modules, proficiency, proof, content, taxonomy, recommendations, plans, groupings) |
| Patterns (`/api/patterns`) | 10 (career-goal, role, role-skills, transition, graph, transitions, recommendations, trajectory, cache, skills) |
| Roadmap (`/api/roadmap`) | 16 (generate, saved CRUD, chat, progress, milestones, extras, edits, AI edit, apply, enhanced chat) |
| Hiring Manager (`/api/hm`) | 6 (jobs, my-jobs CRUD, notes, interest) |
| Root (`/`) | 1 (health check) |
| **Total** | **68+** |

**Key API Contracts:**

1. **Authentication** (`/auth`): POST register/login return `AuthResponse` with JWT token and `UserResponse`. GET `/auth/me` returns current user profile.

2. **Matches** (`/api/matches`): GET `employee/{id}` returns paginated `MatchResult[]` with 80/10/10 weighted scores. GET `job/{id}/deep-analysis` returns GPT-5.2 `ComplexAnalysis` with skill impacts, success/risk factors.

3. **Skills** (`/api/skills`): GET `me/progress` returns `UserSkillsWithProgressResponse` with modules, tasks, and proof data. POST `{name}/start` auto-generates learning modules. Proficiency >= 3 syncs to matching.

4. **Patterns** (`/api/patterns`): POST `role-skills` returns `SkillBasedPatternsResponse` with metrics, transitions, skill frequency, department distribution. GET `graph` returns ReactFlow-compatible career graph.

5. **Roadmap** (`/api/roadmap`): POST `generate` uses GPT-5.2 with reasoning to create phased roadmaps. Supports AI-assisted editing, enhanced chat, milestone tracking, and extras.

6. **Hiring Manager** (`/api/hm`): GET `my-jobs/{id}/interest` returns `CandidateInterestResponse` with anonymized candidates (no PII). Fit levels: strong (>=0.8), good (>=0.65), moderate (>=0.5), developing (<0.5).

---

## 11.6 Data Models (Implemented)

> Source: `_bmad-output/data-models-backend.md`
> 16 tables across 5 functional domains, 26 Alembic migrations.

### Schema Overview

16 tables across 5 functional domains:

| Domain | Tables |
|--------|--------|
| **User & Auth** | `user_profiles` |
| **Jobs & Matching** | `employees`, `job_postings`, `matches`, `skill_embeddings`, `skill_taxonomy` |
| **Skills & Learning** | `user_skills`, `skill_modules`, `user_module_progress`, `user_skill_recommendations` |
| **Career & Roadmap** | `career_paths`, `saved_roadmaps`, `roadmap_milestone_progress`, `roadmap_extras`, `roadmap_edits` |
| **Hiring Manager** | `hm_saved_jobs` |

All models inherit from `DeclarativeBase` with `TimestampMixin` (`created_at`, `updated_at` with server defaults).

### Table Details

**1. user_profiles** - User accounts with authentication, skills, and AI-extracted data. Key columns: UUID PK, email (unique), hashed_password (bcrypt), skills (JSONB), resume_embedding Vector(1536), account_type ("personal"/"hiring_manager"), llm_listed_skills/llm_inferred_skills (JSONB), skill_groupings (JSONB).

**2. employees** - Employee records for matching and career pattern analysis. Key columns: String PK, service_line, current_role, role_level (1-9), skills (JSONB, GIN indexed), career_history (JSONB). 6 performance indexes including GIN on skills/career_history.

**3. job_postings** - Job postings with AI-enriched data and embeddings. Key columns: external_id (unique dedup key), required/preferred_skills (JSONB, GIN), search_vector (TSVECTOR, GIN), llm_required_skills/llm_inferred_skills (JSONB), description_embedding/title_embedding Vector(1536), skill_extraction_hash (SHA256).

**4. matches** - Saved match results. Key columns: overall_score (weighted 80/10/10), skill_match_score, experience_score, growth_potential_score, skill_gaps/matched_skills (JSONB), explanation (Text).

**5. skill_embeddings** - Vector embeddings for semantic matching. Key columns: embedding Vector(1536) with HNSW index (vector_cosine_ops), normalized_text, source_type, embedding_model.

**6. skill_taxonomy** - Canonical skill definitions. Key columns: canonical_name (unique), category, aliases (JSON). Seed data: 120+ skills.

**7. user_skills** - Individual skill tracking. Proficiency 0-5 (None to Expert). Level >= 3 syncs to user_profiles.skills for matching.

**8. skill_modules** - Learning modules with AI-generated content. Key columns: learning_content (JSONB), external_resources (JSONB), ey_resources (JSONB).

**9. user_module_progress** - Per-user module progress with proof. Key columns: progress_percentage (0-100), tasks_completed (JSONB checklist), proof_file_data (LargeBinary/BYTEA), ai_feedback (Text).

**10. user_skill_recommendations** - AI-generated recommendations. Sources: saved_matches, career_goal, llm_bootstrap. Status: recommended/in_progress/completed/dismissed.

**11. career_paths** - ReactFlow graph data. One per user (user_id unique).

**12. saved_roadmaps** - AI-generated roadmaps. Key columns: roadmap_data (JSONB), edit_mode (view/suggest/edit), emphasis (technical/leadership/balanced).

**13-15. roadmap_milestone_progress, roadmap_extras, roadmap_edits** - Progress tracking, user achievements, and edit audit trail.

**16. hm_saved_jobs** - Hiring manager bookmarks.

### pgvector Columns

| Table | Column | Dimensions | Index Type | Distance Metric |
|-------|--------|------------|------------|-----------------|
| `user_profiles` | `resume_embedding` | 1536 | None (query-only) | Cosine |
| `job_postings` | `description_embedding` | 1536 | None (query-only) | Cosine |
| `job_postings` | `title_embedding` | 1536 | None (query-only) | Cosine |
| `skill_embeddings` | `embedding` | 1536 | HNSW (`vector_cosine_ops`) | Cosine (`<=>`) |

All vectors are 1536 dimensions (PCA-reduced from OpenAI's native 3072-dimension output).

### Entity Relationships

```
user_profiles (1) ---- (N) matches
user_profiles (1) ---- (N) user_skills
user_profiles (1) ---- (N) user_skill_recommendations
user_profiles (1) ---- (1) career_paths
user_profiles (1) ---- (N) saved_roadmaps
user_profiles (1) ---- (N) hm_saved_jobs
user_profiles (N) ---- (1) employees  [via employee_id FK]

employees (1) ---- (N) matches
job_postings (1) ---- (N) matches
job_postings (1) ---- (N) hm_saved_jobs

user_skills (1) ---- (N) user_module_progress
skill_modules (1) ---- (N) user_module_progress

saved_roadmaps (1) ---- (N) roadmap_milestone_progress
saved_roadmaps (1) ---- (N) roadmap_extras
saved_roadmaps (1) ---- (N) roadmap_edits
```

### Migration History (26 versions)

| Version | Description |
|---------|-------------|
| 001 | Initial schema: employees, job_postings, matches, user_profiles, career_paths |
| 002-003 | Add indexes and relationships |
| 004-006 | Job posting status, search, tags, sections, search vector |
| 007 | User skill recommendations table |
| 008-009 | User-employee mapping, job posting external_id |
| 010-013 | Backfill, timestamps, type normalization |
| 014-015 | Employee updated_at, remove seed jobs |
| 016 | LLM skill columns (llm_required_skills, llm_inferred_skills, etc.) |
| 017 | Skill embeddings table + pgvector extension |
| 018 | Skill progress tables (user_skills, skill_modules, user_module_progress) |
| 019 | Make match employee_id nullable |
| 020 | Saved roadmaps table |
| 021 | Skill groupings column on user_profiles |
| 022 | Roadmap progress tables (milestone_progress, extras, edits) |
| 023-025 | Performance indexes, proficiency/proof fields, tasks completed |
| 026 | Hiring manager tables (hm_saved_jobs) |

---

## 11.7 Backend Scan Findings

> Source: `_bmad-output/backend-scan-findings.md`
> Exhaustive scan of ~90 Python files.

### Technology Stack

**Core**: FastAPI (>=0.109.0), Uvicorn (>=0.27.0), Python 3.11

**Database**: PostgreSQL + pgvector, SQLAlchemy 2.0 (>=2.0.25), psycopg3 (>=3.1.0), Alembic (>=1.13.1). Connection pooling: QueuePool(pool_size=20, max_overflow=30, pool_recycle=1800, pool_pre_ping=True).

**Caching**: Redis (>=5.0.1) - Async connection pool (max_connections=20). Match results (5 min TTL), Embeddings (7-day TTL), Patterns (24h TTL), Job skills (30-day TTL).

**AI/ML**: OpenAI via AsyncOpenAI singleton. Models: text-embedding-3-large (3072 dims + PCA to 1536), gpt-5.2 (reasoning, deep analysis, roadmap), gpt-5.2-chat-latest (extraction, grouping, content, chat), gpt-5-nano (recommendations). scikit-learn for PCA, numpy for vectors, tiktoken for token counting.

**Security**: bcrypt (>=4.1.0), PyJWT (>=2.9.0) with HS256 and 7-day expiry.

**File Processing**: pypdf (>=5.0.0), python-docx (>=1.1.0), python-multipart (>=0.0.6).

**Web Scraping**: beautifulsoup4, requests, lxml, tqdm.

**Total packages**: 30+ in requirements.txt.

### Services Layer (20 files)

1. **matching_service.py** (~1420 lines) - Core matching engine. Three-tier skill matching (80% weight): taxonomy, exact string, pgvector HNSW, fuzzy Jaccard. Thresholds: semantic >= 0.65, transferable >= 0.50. Global thread-locked embedding cache.

2. **embedding_service.py** - text-embedding-3-large (3072 dims) with PCA to 1536. Two-layer Redis cache (7-day TTL). Batch processing up to 100 skills per API call.

3. **analysis_service.py** - GPT-5.2 with reasoning_effort="medium" for deep analysis. Structured JSON output.

4. **skill_extractor.py** - GPT-5.2-chat-latest. 16 skill categories. Chunking for resumes > 3500 tokens. PII stripping before LLM.

5. **skill_normalizer.py** - Global in-memory cache (alias to canonical). Deduplication keeping highest proficiency.

6. **skill_taxonomy.py** (service) - Singleton. 50+ SkillRelationship entries. Coverage: 1.0 (direct), 0.85 (implied), 0.80 (parent), 0.70 (related). LRU cache max 1000 entries.

7. **pattern_service.py** (~1377 lines) - Career transition analysis. Mock data with 22 employees. Redis 24h TTL. Fuzzy role matching (SequenceMatcher >= 0.65). ReactFlow-compatible graph output.

8. **recommendation_service.py** - ThreadPoolExecutor (4 workers). Sources: match gaps, career goals, LLM bootstrap (gpt-5-nano). 8 default fallback skills.

9. **skill_grouping_service.py** - GPT-5.2-chat-latest for AI categorization with fallback keyword-based grouping.

10. **skill_progress_service.py** (~709 lines) - Proficiency 0-5. Match threshold: >= 3. Skill decay warning after 6 months. Module creation priority: DB > AI groupings > dynamic fallback.

11. **job_skill_extractor.py** - GPT-5.2-chat-latest. Redis 30-day TTL (SHA256 hash). Batch processing.

12. **match_cache_service.py** - Singleton. 5-min match TTL, 1-hour skill version TTL. Per-user invalidation with version bump.

13. **incremental_match_service.py** - Only recalculates affected jobs after skill changes.

14. **learning_content_service.py** - GPT-5.2-chat-latest. Generates guides, exercises, EY resources (Credly, Virtual Academy, Tech MBA). AI proof review.

15. **hiring_manager_service.py** - Never exposes PII. Semantic matching via pgvector HNSW. Fit levels: strong (>=0.8), good (>=0.65), moderate (>=0.5), developing (<0.5).

16. **roadmap_service.py** - GPT-5.2 with reasoning, max 12000 tokens. Phases with milestones, executive summary, quick wins, blockers.

17-20. **roadmap_progress_service.py**, **resume_parser.py**, **embedding_integration.py**, **job_import_service.py** - Supporting services.

### Utils (6 files)

- **security.py**: bcrypt hashing, JWT creation/verification (HS256, 7-day expiry), FastAPI auth dependency
- **pca_loader.py**: PCA model management with metadata
- **text.py**: Skill text normalization, cosine similarity
- **text_cleaner.py**: PII stripping (emails, phones, URLs, addresses, names), resume text cleaning, token-aware chunking
- **skill_categorizer.py**: Keyword-based categorization for 9 categories

### Tests (12 files)

Models (5), Auth (1), Patterns (1), Recommendations (2), Security (1). Major gaps: matching_service, embedding_service, skill_extractor, skill_progress, roadmap, hiring_manager, most routes.

### Scripts (13 files)

Job scraping, skill extraction, embedding generation, synthetic data generation, PCA training, validation, SQL export.

### Architecture Patterns

- **Matching**: 80/10/10 weighted (skill/experience/role_fit) with four-tier skill matching
- **Embedding Pipeline**: OpenAI 3072 dims -> PCA 1536 -> pgvector HNSW
- **PII/Bias Mitigation**: PII stripping before LLM, anonymous HM view
- **Background Processing**: FastAPI BackgroundTasks for vectorization, recommendations, cache invalidation
- **Singleton Services**: OpenAI, Redis, Taxonomy, Normalizer, MatchCache
- **4 AI Models**: gpt-5.2 (reasoning), gpt-5.2-chat-latest (extraction), gpt-5-nano (bootstrap), text-embedding-3-large (embeddings)

---

## 11.8 Backend Development Guide

> Source: `_bmad-output/development-guide-backend.md`

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.11 | Specified in Dockerfile |
| PostgreSQL | 16 | With pgvector extension |
| Redis | 7+ | For caching layer |
| Docker | Latest | For containerized development |
| Docker Compose | v2+ | Multi-service orchestration |
| OpenAI API key | N/A | Required for AI features |

### Project Setup

**Docker (Recommended):**
```bash
docker compose up              # All services
docker compose up backend postgres redis  # Backend + deps only
```
Backend available at `http://localhost:8000`.

**Local Development:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | None | PostgreSQL connection string (psycopg3 dialect) |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection URL |
| `OPENAI_API_KEY` | Yes | None | OpenAI API key for AI features |
| `JWT_SECRET_KEY` | Yes | `""` (errors if empty) | JWT token signing secret |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_DAYS` | No | `7` | JWT token expiry in days |

Auto-converts `postgresql://` to `postgresql+psycopg://` for psycopg3 compatibility.

### Development Commands

| Command | Description |
|---------|-------------|
| `uvicorn app.main:app --reload` | Start dev server with hot reload |
| `pytest` | Run test suite |
| `alembic upgrade head` | Apply all migrations |
| `alembic revision --autogenerate -m "description"` | Generate new migration |
| `alembic downgrade -1` | Rollback last migration |

### Project Structure

```
backend/
  app/
    main.py              # FastAPI entry point (lifespan, middleware, routers)
    config.py             # Client factories (OpenAI, Redis singletons)
    database.py           # SQLAlchemy engine, session, get_db()
    config/
      matching_config.py  # Scoring weights (80/10/10), match modes, role hierarchy
    models/               # SQLAlchemy ORM models (15 files, 16 tables)
    routes/               # API route handlers (7 files)
    schemas/              # Pydantic request/response schemas (9 files)
    services/             # Business logic layer (20 files)
    utils/                # Security, text processing, PCA, categorization (6 files)
  tests/                  # pytest test suite (12 files)
  alembic/                # Database migrations (26 versions)
  backend/models/pca/     # Pre-trained PCA model (pca_v1.pkl)
```

### Architecture: Routes -> Services -> Models

- **Routes**: Request validation, auth checks, response formatting
- **Services**: Core business logic, AI pipeline, caching
- **Models**: SQLAlchemy ORM definitions
- **Schemas**: Pydantic request/response types

### Adding a New Endpoint

1. Define Pydantic schemas in `app/schemas/`
2. Create or extend a service in `app/services/`
3. Add the route in `app/routes/`
4. Mount the router in `app/main.py` (if new router file)

### Adding a New Model

1. Define the model in `app/models/`
2. Import it in `app/models/__init__.py`
3. Generate migration: `alembic revision --autogenerate -m "add new_table"`
4. Apply migration: `alembic upgrade head`

### Caching

**Redis Cache Layers:**

| Cache | TTL | Purpose |
|-------|-----|---------|
| Match results | 5 min | Avoid re-running matching algorithm |
| Skill versions | 1 hour | Match cache invalidation trigger |
| Embeddings | 7 days | Avoid duplicate OpenAI API calls |
| Career patterns | 24 hours | Transition analysis results |
| Job skills | 30 days | LLM-extracted skills |

**In-Memory Caches:**

| Cache | TTL | Max Size |
|-------|-----|----------|
| Global embedding cache | 5 min | Unbounded (thread-locked) |
| Skill taxonomy LRU | None | 1000 entries |
| Skill normalizer | None | Unbounded |

### Security

- bcrypt password hashing
- JWT tokens with HS256 algorithm, 7-day expiry
- `get_current_user_from_token()` FastAPI dependency for route protection
- PII stripping from resume text before LLM processing
- Hiring manager endpoints return only anonymized data

### Data Pipeline Scripts

```bash
docker compose --profile scraper up ey_scraper       # Scrape jobs
python scripts/extract_all_job_skills.py              # Extract skills (LLM)
python scripts/generate_all_embeddings.py             # Generate embeddings
python scripts/train_pca_model.py                     # Train PCA model
python scripts/generate_synthetic_data.py             # Generate synthetic data
```

### API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

---

# 12. Frontend Technical Reference

## 12.1. Component Library (Design Reference)

**Source**: `reference-docs/frontend/component-library.md`
**Last Updated**: 2026-01-06
**Framework**: React 18 + TypeScript
**UI Library**: shadcn/ui + Tailwind CSS

### Design Principles

1. **Composition over inheritance** - Build complex UIs from small, focused components
2. **Props for configuration** - Use props to customize behavior, not hardcoded values
3. **TypeScript for safety** - All components are fully typed
4. **Accessible by default** - Use semantic HTML and ARIA attributes
5. **shadcn/ui foundation** - Build on top of shadcn/ui primitives

### Component Categories

**Layout Components**: MainLayout, Header, Sidebar, ContentArea
**Auth Components**: LoginPage, ProtectedRoute, LogoutButton
**Skill Components**: SkillCard, SkillBadge, SkillList, SkillTree, ResumeUpload
**Match Components**: MatchCard, MatchList, SkillGapDisplay, MatchFilters
**Career Viz Components**: CareerGraph, CareerNode, CareerEdge, GraphControls
**Success Pattern Components**: SuccessMetricsCard, SuccessRateChart, SkillFrequencyChart, TimelineChart
**Common Components**: Button, Card, Input, Select, LoadingSpinner, ErrorMessage

### Layout Component Implementations

**MainLayout** (`frontend/src/components/layout/MainLayout.tsx`):
```tsx
export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200"><Sidebar /></aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  );
}
```

**Header** (`frontend/src/components/layout/Header.tsx`): Logo with "SpringAIS" branding + "by EY" yellow accent. User info (name + role) + LogoutButton.

**Sidebar** (`frontend/src/components/layout/Sidebar.tsx`): Navigation items (Skills Dashboard, Match Results, Career Path, Success Patterns) with active route highlighting (yellow-400). Icons from lucide-react.

### Skill Component Implementations

**SkillCard** (`frontend/src/components/skills/SkillCard.tsx`): Props: `{name, proficiency: 'Beginner'|'Intermediate'|'Advanced'|'Expert', yearsExperience?, source?, onRemove?}`. Shows resume extraction source badge and optional remove button.

**SkillBadge** (`frontend/src/components/skills/SkillBadge.tsx`): Color mapping -- Beginner=gray, Intermediate=blue, Advanced=purple, Expert=green. Rounded-full pill with border.

**ResumeUpload** (`frontend/src/components/skills/ResumeUpload.tsx`): react-dropzone for drag-and-drop. Accepts PDF/DOCX (max 10MB). Progress simulation. "Processing resume with AI (~15 seconds)" message.

### Match Component Implementations

**MatchCard** (`frontend/src/components/matches/MatchCard.tsx`): Props: `{jobId, title, department, location, compositeScore, overlappingSkills, missingSkills, onSave?, onApply?, onDismiss?}`. Score displayed as percentage. Embedded SkillGapDisplay. Actions: Save (Bookmark), Apply (Send, yellow-400), Not Interested (X, ghost).

**SkillGapDisplay** (`frontend/src/components/matches/SkillGapDisplay.tsx`): Three categories -- overlapping (green, check icon), missing (red, X icon), transferable (yellow, arrow icon). Flex-wrap badges with counts.

### Common Component Implementations

**LoadingSpinner**: Sizes sm (16px), md (32px), lg (48px). Yellow-400 animated spin with optional message.

**ErrorMessage**: AlertCircle icon (red-500), error text, optional retry button.

### TypeScript Patterns

Component Props: `interface MyComponentProps { title: string; count: number; description?: string; variant?: 'primary' | 'secondary'; children?: React.ReactNode; className?: string; }`

Generic Components: `interface ListProps<T> { items: T[]; renderItem: (item: T) => React.ReactNode; keyExtractor: (item: T) => string | number; }`

---

## 12.2. Routing Structure

**Source**: `reference-docs/frontend/routing-structure.md`
**Last Updated**: 2026-01-06
**Library**: React Router v6

### Route Tree

```
/
+-- /login (public)
+-- / (protected - redirects to /dashboard)
+-- /dashboard (protected - Skills Dashboard)
+-- /matches (protected - Match Results)
+-- /career-path (protected - Career Visualization)
+-- /success-patterns (protected - Success Metrics)
```

### App.tsx Configuration

```tsx
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<SkillsDashboard />} />
            <Route path="/matches" element={<MatchResults />} />
            <Route path="/career-path" element={<CareerVisualization />} />
            <Route path="/success-patterns" element={<SuccessPatterns />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### ProtectedRoute Component

Checks `useAuth().token`. Shows loading spinner during auth check. Redirects to `/login` if no token.

### Navigation Helpers

- **useNavigate**: Programmatic navigation
- **Link**: Declarative navigation
- **NavLink**: Active link styling with `isActive` callback
- **useSearchParams**: Query parameter management for filters (`?department=Technology&min_score=0.7`)

---

## 12.3. State Management

**Source**: `reference-docs/frontend/state-management.md`
**Last Updated**: 2026-01-06
**Tools**: React Query (TanStack Query) + Context API

### Strategy

- **Server State**: React Query (90% of state)
- **Client State**: Context API for auth, theme
- No Redux/Zustand needed

### React Query Setup

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      cacheTime: 1000 * 60 * 10,  // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});
```

### Custom Hooks Pattern

**useMatches**: `useQuery` with key `['matches', employeeId, minScore, department]`, enabled when `!!employeeId`.

**useUploadResume**: `useMutation` that invalidates `['employee', 'skills']` and `['matches']` on success.

**useEmployeeSkills**: Combines React Query with AuthContext (`enabled: !!user`).

### Auth Context

Interface: `{user, token, login, logout, loading}`. JWT stored in localStorage. Token validation on mount via `/auth/me`. Auto-clear on invalid token.

### Cache Invalidation Strategies

- **Manual**: `queryClient.invalidateQueries()` after mutations
- **Automatic**: `onSuccess` mutation callbacks
- **Time-Based**: `refetchInterval` for periodic refresh
- **Optimistic Updates**: `onMutate` for immediate UI with rollback on error

### Loading States

- Skeleton loading patterns for match cards
- Suspense-ready (future enhancement)

---

## 12.4. Styling Guide

**Source**: `reference-docs/frontend/styling-guide.md`
**Last Updated**: 2026-01-06
**CSS Framework**: Tailwind CSS 3.3
**Component Library**: shadcn/ui

### EY Color Palette

```css
--color-primary: #FFE600;      /* EY Yellow */
--color-primary-dark: #E6CF00; /* Hover state */
--color-dark: #2E2E38;         /* Header, dark text */
--color-success: #10B981;      /* Green */
--color-error: #EF4444;        /* Red */
--color-warning: #F59E0B;      /* Orange */
--color-info: #3B82F6;         /* Blue */
```

### Typography

H1: `text-4xl font-bold text-gray-900`, H2: `text-3xl font-semibold`, H3: `text-2xl font-medium`, Body: `text-base text-gray-700`, Secondary: `text-sm text-gray-600`, Caption: `text-xs text-gray-500`.

### Spacing System

Tailwind's 4px increments: `p-4` (16px), `p-6` (24px), `p-8` (32px). `space-y-4` for vertical gaps. `gap-6` for flexbox/grid.

### Layout Patterns

- **Card**: shadcn/ui Card with `hover:shadow-lg transition-shadow`
- **Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **Flexbox**: `flex items-center justify-between`
- **Responsive**: Mobile-first (`w-full md:w-1/2 lg:w-1/3`)

### Button Styles

- Primary: `bg-yellow-400 hover:bg-yellow-500 text-gray-900`
- Secondary: `variant="outline"`
- Danger: `variant="destructive"`

### Custom cn() Utility

```tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

### shadcn/ui Components

Available: Button, Card, Input, Select, Checkbox, Radio, Dialog, Dropdown, Popover, Tooltip, Table, Tabs, Accordion, Progress, Spinner, Badge.

---

## 12.5. Component Inventory (Implemented)

**Source**: `_bmad-output/component-inventory-frontend.md`
**Generated**: 2026-02-11

85 components across 11 categories.

### Authentication (4 files)

LoginPage (email/password, EY branding, glassmorphism), RegisterPage (min 8 char password), ForgotPasswordPage (placeholder, demo credentials), LogoutButton (theme-aware).

### Common/Shared (2 files)

ProgressRing (SVG circular, animated, EY yellow), SkillTag (pill badge: green/blue/orange variants).

### Career Visualization (10 files)

CareerVisualization (ReactFlow, department filter, BFS goal path), GraphControls (search, department, success rate slider), NodeDetailsPanel (420px side panel), RoleNode (custom node: current/goal/next states), RoleRequirementTree (radial layout, skill plan), SkillNode (role/path/skill variants), SkillPlanEdge (bundled/straight/bezier), TransitionEdge (color-coded by success rate), graphLayoutUtils (dagre-based), graphTransformUtils (CareerGraphData to ReactFlow).

### Gamification (8 files)

AdventureHUD (fixed HUD: level, XP, gold, achievements, streak), AchievementsPanel (14 achievements grid), CoinFlipGame (bet 10-100 gold, 50/50 odds), GameButton (variants with Framer Motion, Cinzel font), GameCard (highlight/glow with Spectral font), GameProgressBar (xp/gold/success variants, shimmer), NotificationToasts (bottom-right stack for events), ThemeSwitcher (Light/Dark/Medieval + Adventure toggle).

### Layout (8 files)

MainLayout (personal, sidebar + content + AdventureHUD), HMLayout (hiring manager), Sidebar (personal nav), HMSidebar (HM nav), Header (greeting + notifications + ThemeSwitcher), ProtectedRoute (auth guard), AccountTypeRoute (personal vs HM guard), index.ts (barrel exports).

### Matches (9 files)

MatchResultsPage (resume gate, progressive loading BATCH_SIZE=20, virtual scrolling at 50+), MatchCard (title, ProgressRing, SkillGapDisplay, save toggle), MatchDetailsModal (full-screen, 80/10/10 breakdown, deep analysis), MatchFilters (Department/Location/Experience + US Only), MatchModeToggle (Best Fit/Stretch/Exploratory), MatchSortDropdown (score/date asc/desc), SkillGapDisplay (matched/transferable/gap tags), VirtualMatchList (@tanstack/react-virtual, overscan 5), EmptyMatchState.

### Roadmap (11 files)

RoadmapViewer (main container with tabs, chat, edit mode), GlobalProgressBar (sticky SVG, milestone counts, celebration), RoadmapTabNav (scrollable: Overview/Insights/Phase tabs), OverviewTab (hero stats, timeline), InsightsTab (quick wins, critical skills, challenges), PhaseTab (progress ring, milestone list, extras), MilestoneCard (checkbox, category icons S/E/C/L/N, priority), ExtrasSection (user achievements), AddExtraModal, EditModeToggle (View/AI-Assisted/Manual), RoadmapAssistant (floating chat 384px).

### Role Detail (5 files)

RoleOverview (ProgressRing, scores, deep analysis), RoleSkillsGap (stat cards, matched/gap tags), RolePathTo (300px sidebar + ReactFlow canvas), RoleSuccessPatterns (dnd-kit drag-reorder widgets), NetworkSidebar (paths, filters, skill detail).

### Skills (11 files, JSX)

SkillsDashboard (progress ring, stat cards, Add Skill), SkillsPortfolio (grid by category), SkillCategory (CRUD, modules panel), SkillCard (SkillProgressRing, status badge), SkillDetailModal (~1080 lines: proficiency, modules, proof, AI content), SkillSearchBar (tabs + debounced search 300ms), SkillExtractionPreview (toggle selection, inline edit), SkillProgressRing (SVG green gradient), ResumeUpload (react-dropzone), AddSkillModal (react-hook-form), ThemeSwitcher (DARK_THEME/LIGHT_THEME exports).

### Success Patterns (8 files)

SuccessPatternPage (dnd-kit widget reorder, localStorage), MetricCards (4-card grid), SuccessRateChart (vertical BarChart), TimeToPromotionChart (multi-line per department), SkillFrequencyChart (horizontal top 10), DepartmentDistributionChart (donut with click-to-filter), FilterControls (Department/Role Level/Time Period), SortableWidget (dnd-kit wrapper).

### Pages (9 files)

DashboardPage, MatchesPage, MatchDetailPage, RoleDetailPage (tabbed), SkillsPage, CareerPathPage, RoadmapPage, SuccessPatternsPage, HMDashboardPage.

---

## 12.6. Frontend Development Guide

**Source**: `_bmad-output/development-guide-frontend.md`
**Generated**: 2026-02-11

### Prerequisites

Node.js 18+, npm 9+, Docker + Docker Compose v2+.

### Setup

Docker: `docker compose up frontend` (port 3000, hot reload via bind mount).
Local: `cd frontend && npm install && npm run dev`.

### Environment

`VITE_API_URL` (default `http://localhost:8000`).

### Commands

`npm run dev` (Vite HMR), `npm run build` (production), `npm run lint` (ESLint), `npm test` (Vitest).

### Build Configuration

- Vite: `@` alias -> `./src`, port 3000, host `0.0.0.0`
- TypeScript: strict mode, `@/*` -> `./src/*`, ES2020+
- PostCSS: `@tailwindcss/postcss` (v4)
- TailwindCSS v4: `@theme` directive, EY brand colors

### Project Structure

```
frontend/src/
+-- main.tsx, App.tsx, index.css
+-- components/ (76 components, 10 subdirectories)
+-- context/ (9 providers)
+-- services/ (9 API service files)
+-- hooks/ (useDebounce, useLocalStorage)
+-- lib/ (Axios API client)
+-- pages/ (9 pages)
+-- data/ (achievements, game themes)
+-- mocks/ (skill categories)
```

### API Client Architecture

Main client (`services/api.ts`): Axios with Bearer token interceptor, base URL `${VITE_API_URL}/api`, auto-logout on 401.
Auth service (`services/authService.ts`): Separate Axios instance, base URL without `/api` suffix (auth routes at `/auth/*`).

### Context Provider Hierarchy

`QueryClientProvider -> AuthProvider -> ThemeProvider -> AdventureProvider -> MatchesProvider -> SkillsProvider -> NotificationProvider -> Router`

### Routing

All routes lazy-loaded with Suspense. Guards: ProtectedRoute (auth), AccountTypeRoute (personal vs HM).

### Three Themes

Light (white cards), Dark (glassmorphism), Game (medieval fantasy: Cinzel/Spectral/MedievalSharp fonts).

### Known Technical Debt

1. Mixed JSX/TSX (skills predate TS migration)
2. SkillDetailModal.jsx ~1080 lines
3. MatchFilters uses MOCK_FILTER_OPTIONS
4. ForgotPasswordPage is placeholder
5. No React error boundaries
6. window.confirm/alert in skills components
7. Debug console.log in SkillDetailModal

---

## 12.7. Frontend Scan Findings

**Source**: `_bmad-output/frontend-scan-findings.md`
**Generated**: 2026-02-11

### Actual Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | React | 18.2.0 |
| Language | TypeScript (strict) + JSX | ~5.x |
| Build | Vite | 5.0.8 |
| CSS | TailwindCSS v4 | 4.1.18 |
| Router | React Router DOM | 6.30.2 |
| Server State | TanStack React Query | 5.90.16 |
| HTTP | Axios | 1.13.2 |
| Graphs | ReactFlow | 11.11.4 |
| Charts | Recharts | 3.6.0 |
| Animation | Framer Motion | 11.18.2 |
| DnD | dnd-kit | core 6.3.1 / sortable 10.0.0 |
| Forms | react-hook-form | 7.71.1 |
| Upload | react-dropzone | 14.3.8 |
| Virtual | @tanstack/react-virtual | 3.13.18 |
| Layout | dagre | 0.8.5 |

### Context Providers (9)

AuthContext (`{user, token, isAuthenticated}`, login/register/logout), ThemeContext (`{theme, isDark, isGame}`), AdventureContext (XP, gold, level, achievements, streak), MatchesContext (progressive loading BATCH_SIZE=20), SkillsContext (skills, categories, groupings), RoadmapContext (useReducer with 17 action types), CareerPathContext, HMContext, NotificationContext.

### Services (9)

api.ts (base client), authService.ts, matchService.ts, skillService.ts, skillProgressService.ts, careerGraphService.ts, roadmapService.ts, successPatternService.ts, hmService.ts.

### Custom Hooks (2)

useDebounce (generic debounce), useLocalStorage (localStorage persistence).

### Data Files

achievements.ts (14 achievements), gameThemes.ts (medieval theme config, level titles: Squire through King), mockSkills.js (7 categories: programming, cloud, data, security, leadership, domain, tools).

### File Count: ~117 total files

76 components, 9 contexts, 9 services, 9 pages, 2 hooks, various config.

### Notable Technical Debt

1. Mixed JSX/TSX
2. ForgotPasswordPage placeholder
3. Direct DOM manipulation in AddSkillModal
4. SkillDetailModal ~1080 lines
5. MOCK_FILTER_OPTIONS in MatchFilters
6. Inline styles in skills (inconsistent with Tailwind)
7. Debug console.log statements
8. No error boundaries
9. window.confirm/alert usage
10. Duplicate theme logic (ThemeContext + local ThemeSwitcher objects)


---

# 13. Data and Integration

## 13.1. API Contracts (Design Reference)

**Source**: `reference-docs/integration/api-contracts.md`
**Last Updated**: 2026-01-06
**Purpose**: Frontend-backend API contracts for integration blocks

### Contract Definition

Each contract specifies: request format (URL, method, headers, body), response format (status codes, JSON structure), error handling (error codes, messages), and performance targets (latency, caching).

### Authentication Contract

**POST /api/auth/login**
- Request: `{email: string, password: string}`
- Response (200): `{token: string, user: {id, email, name, role, department}}`
- Errors: 401 (invalid credentials), 400 (missing fields)

### Skills Dashboard Contract

**GET /api/employees/{employee_id}**
- Response (200): Employee object with skills array `[{name, proficiency, years_experience?, source?}]`
- Performance: <100ms

**POST /api/skill-extraction**
- Request: multipart/form-data with employee_id and file (PDF/DOCX)
- Response (200): `{employee_id, skills_extracted: [{name, proficiency, years_experience?, confidence}], embedding_created, processing_time_seconds}`
- Performance: 10-15 seconds (GPT-5.2 Instant call)
- Max file size: 10 MB

### Match Results Contract

**GET /api/matches/employee/{employee_id}**
- Query params: `min_score?`, `department?`, `location?`, `limit?`
- Response (200): `{employee_id, employee_name, matches: [{job_id, title, department, location, similarity_score, composite_score, overlapping_skills, missing_skills, transferable_skills?, gap_count}], total_count, cached}`
- Performance: <1 second (uncached), <100ms (cached)
- Caching: Redis, 1-hour TTL, invalidated on skill update

### Career Path Contract

**GET /api/career-paths/employee/{employee_id}**
- Query params: `depth?` (1-3, default 2)
- Response (200): `{employee_id, current_role, graph: {nodes: [{id, title, level, is_current}], edges: [{from, to, transition_count, avg_time_months, success_rate}]}, cached}`
- Performance: <300ms
- Caching: Redis, 1-hour TTL

### Success Patterns Contract

**GET /api/success-patterns**
- Query params: `from_role` (required), `to_role` (required)
- Response (200): `{from_role, to_role, metrics: {total_transitions, successful_transitions, success_rate, avg_time_months, median_time_months, avg_performance_score}, top_skills: [{name, frequency, avg_proficiency}]}`
- Performance: <200ms
- Caching: Redis, 24-hour TTL

### Error Response Format

```typescript
{
  error: string;
  detail?: string | object;
  status_code: number;
  timestamp: string;  // ISO 8601
}
```

### Contract Testing

Frontend: Vitest contract tests with mock backend (check response shape).
Backend: pytest contract tests with FastAPI TestClient (check status codes and field presence).

### Versioning Strategy

Current: No versioning (MVP). Future: URL versioning (`/api/v1/...`), 6-month deprecation period.

---

## 13.2. Testing Strategy

**Source**: `reference-docs/integration/testing-strategy.md`
**Last Updated**: 2026-01-06

### Testing Pyramid

- **Unit Tests (60%)**: pytest (backend), Vitest (frontend) -- Blocks A-L
- **Integration Tests (30%)**: FastAPI TestClient, React Testing Library -- Blocks M-P
- **E2E Tests (10%)**: Playwright -- Block Q

### Backend Unit Tests (pytest)

```python
def test_calculate_composite_score():
    service = MatchingService()
    score = service._calculate_composite_score(similarity=0.8, experience_match=0.9, success_pattern=0.7)
    expected = 0.50 * 0.8 + 0.25 * 0.9 + 0.25 * 0.7
    assert score == pytest.approx(expected, rel=0.01)
```

### Frontend Unit Tests (Vitest)

```typescript
describe('SkillCard', () => {
  it('renders skill name and proficiency', () => {
    render(<SkillCard name="Python" proficiency="Expert" />);
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });
});
```

### Backend Integration Tests

Login + authenticated request patterns. Check: 200 with matches, 401 without token, 403 for unauthorized access.

### Frontend Integration Tests

React Testing Library with mocked API (vi.spyOn). QueryClientProvider wrapper. Wait for async data with `waitFor()`.

### E2E Tests (Playwright)

Full user journeys: login -> navigate to matches -> view match card -> apply. Graceful handling of missing skills state.

### Performance Testing (Locust)

100 concurrent users target. Match query <1 second (p95). API errors <1%.

### Security Testing

OWASP ZAP automated scan for SQL injection, XSS, missing security headers, JWT validation.

### Lighthouse Audit Targets

Performance >85, Accessibility >90, Best Practices >90.

### Test Coverage Targets

Backend services >80%, frontend components >70%, integration tests for all critical paths, E2E for all user journeys.

### CI/CD Pipeline (Future)

GitHub Actions with backend-tests, frontend-tests, and e2e-tests jobs.

---

## 13.3. Integration Patterns

**Source**: `docs/integration_patterns.md`

### Authenticated API Calls

Frontend uses shared API client that injects JWT token into every request:
```ts
import api from '../services/api';
const response = await api.get('/skills/recommendations');
```

### Auth Lifecycle

1. Login/register returns `{token, user}`
2. Store token in `localStorage`
3. API client injects `Authorization: Bearer <token>`
4. 401 responses clear token and redirect to `/login`

### Skill Recommendations (Hybrid)

- `GET /api/skills/recommendations` for profile "My Skills" view
- `PATCH /api/skills/recommendations/{skill}/status` to update status

### Save Match Trigger

`await api.post('/matches/save', payload)` -- Backend refreshes recommendations automatically.

### Troubleshooting

- **401 on every request**: Verify `Authorization: Bearer <token>` is set and `JWT_SECRET_KEY` matches backend config
- **CORS errors**: Ensure backend allows frontend origin and `Authorization` header
- **User logged out unexpectedly**: Check token expiration and system clock skew

---

## 13.4. EY Job Scraper Guide

**Source**: `docs/scraping_guide.md`

### Overview

`scripts/scrape_ey_jobs.py` scrapes job listings from `careers.ey.com` and upserts into `job_postings` table.

### Prerequisites

Docker stack with PostgreSQL running, backend deps installed (requests, beautifulsoup4, lxml, tqdm, sqlalchemy, psycopg).

### Usage

```bash
python scripts/scrape_ey_jobs.py --limit 25
```

**Flags**: `--dry-run` (no DB writes), `--limit N` (cap postings), `--locationsearch "United States"`, `--service-line Tax|Assurance|Consulting`, `--use-cache` (cached HTML).

### Scheduling

- Windows Task Scheduler or Linux cron (`0 2 * * *`)
- Docker: `docker compose --profile scraper run --rm ey_scraper --limit 25`

### Logs

`logs/scraper.log` and `logs/scraper_errors.log`.

### Quick DB Checks

```sql
SELECT COUNT(*) FROM job_postings;
SELECT COUNT(*) FILTER (WHERE is_active = TRUE) AS active, COUNT(*) FILTER (WHERE is_active = FALSE) AS archived FROM job_postings;
```

---

## 13.5. Scraping Notes

**Source**: `docs/scraping_notes.md`

### Key Findings

- `ey.com/en_us/careers` is marketing page only (no job links in HTML)
- **Actual job listings**: `https://careers.ey.com/ey/search/` (server-rendered HTML, no Selenium needed)
- ~50 job links per page, pagination via `startrow=25` query parameter
- Individual job URL pattern: `/ey/job/<slug>/<job_id>/` (numeric tail is stable `external_id`)

### HTML Selectors

**Search results**: `a.jobTitle-link[href]` (de-dupe by external_id due to responsive duplicates)

**Job detail page**: `h1` (title), `[data-careersite-propertyid=description]` (description), `.joblayouttoken-label + <span>` (Location, Date, Requisition ID)

### robots.txt

`ey.com/robots.txt` is broadly permissive. Use 1-2s delays and reasonable crawl rate.

---

## 13.6. Mock Data Formats

**Source**: `reference-docs/data/mock-data-formats.md`
**Last Updated**: 2026-01-06

### Purpose

Standard mock data structures for frontend development before backend integration (Blocks H-L). Replace with real API calls in Blocks M-P.

### Data Types

**Employee**: `{id, email, name, role, department, service_line, location, experience_years, hire_date}`

**Skill**: `{name, proficiency: 'Beginner'|'Intermediate'|'Advanced'|'Expert', years_experience?, source?}`

**JobMatch**: `{job_id, title, department, location, similarity_score, composite_score, overlapping_skills, missing_skills, transferable_skills?, gap_count}`

**CareerGraph**: `{nodes: [{id, title, level, is_current}], edges: [{from, to, transition_count, avg_time_months, success_rate}]}`

**SuccessPattern**: `{from_role, to_role, metrics: {total_transitions, successful_transitions, success_rate, avg_time_months, median_time_months, avg_performance_score}, top_skills: [{name, frequency, avg_proficiency}]}`

**LoginResponse**: `{token: string, user: {id, email, name, role, department}}`

**SkillExtractionResponse**: `{employee_id, skills_extracted: [{name, proficiency, years_experience?, confidence}], embedding_created, processing_time_seconds}`

### Mock API Service Pattern

```typescript
const MOCK_DELAY = 500;
export const mockApi = {
  getMatches: async (employeeId: number): Promise<JobMatch[]> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return mockMatches;
  },
};
```

### Switching Mock/Real API

```typescript
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const api = USE_MOCK ? mockApi : realApi;
```

---

## 13.7. Database Seeding

**Source**: `reference-docs/data/seed-scripts.md`
**Last Updated**: 2026-01-06

### Seeding Overview

1. **Role hierarchy**: 25 roles across Assurance, Tax, Consulting
2. **Synthetic employees**: 900 employees
3. **Job postings**: 30-50 scraped jobs
4. **Skills and embeddings**: For matching
5. **Career transitions**: 5,000 transitions for success patterns

### Quick Start

```bash
cd backend
python scripts/seed_database.py
# Or individually:
python scripts/seed_roles.py
python scripts/generate_synthetic_employees.py
python scripts/scrape_job_postings.py
python scripts/generate_embeddings.py
```

### Seed Scripts

**seed_roles.py**: Creates 25 roles (Consulting: 9 levels Analyst->Partner, Assurance: 5 levels Staff->Partner, Tax: 5 levels Staff->Partner).

**generate_synthetic_employees.py**: 900 employees (300 per service line). Template-based skills by role. Cost ~$2 (GPT for variation).

**scrape_job_postings.py**: EY careers site scraper. Extracts job details and required skills.

**generate_embeddings.py**: text-embedding-3-large for employee skill text and job descriptions. Cost ~$0.02.

### Team Data Sharing (Git-Based)

One person generates, pg_dump to SQL, commit to `data-dumps` branch. Teammates pull and load. Benefits: only one person pays API costs, consistent data, version controlled.

### Minimal Seed (Testing)

1 role, 10 employees, 5 jobs -- no AI costs needed.

---

## 13.8. Synthetic Data Generation

**Source**: `reference-docs/data/synthetic-data-generation.md`
**Last Updated**: 2026-01-06

### Hybrid Approach

- **Hard-coded templates** for structure and baseline quality ($0)
- **LLM generation** for realistic variation (~$2 total)
- Cost: ~$2 for 900 employees. Time: ~2 minutes.

### Data Volume

| Data Type | Count | Method | Cost |
|-----------|-------|--------|------|
| Roles | 25 | Hard-coded | $0 |
| Employees | 900 | Template + LLM | $2 |
| Skills/employee | 12 avg | Template + O*NET | $0 |
| Job postings | 30-50 | Scraped + manual | $0 |
| Career transitions | 5,000 | Simulated | $0 |
| Performance reviews | 4,500 | LLM variation | $1.50 |
| **Total** | **~20K rows** | | **~$2** |

### Employee Generation

Hard-coded: SERVICE_LINE_DISTRIBUTION (33/33/34%), LEVEL_DISTRIBUTION (pyramid: 25% entry to <1% partners), LOCATIONS (6 cities), DEPARTMENTS by service line.

Skills templates: required (95-100%), common (60-80%), rare (30% chance) per role.

### LLM-Enhanced Realism

**GPT-5-Nano** ($0.04): Individual performance metric variation within ranges.
**GPT-5.2-Instant** ($1.50): Realistic peer feedback themes (2-3 snippets per employee).

### Career Transition Simulation

Probabilistic based on EY promotion rates: Analyst->Associate 85%, Consultant->Sr. Consultant 72%, Sr. Consultant->Manager 68%, Manager->Sr. Manager 55%, Sr. Manager->Director 40%, Director->Partner 25%.

### Data Quality Checks

Role distribution validation (pyramid structure, +/-10% tolerance), performance metric correlation (higher roles -> better performance), career progression realism (no level skips, min 12 months per role), skill distribution (core skills in 90%+ of role holders), no impossible patterns (junior roles capped experience, mentees <= years).

---

## 13.9. Data Generation Plan

**Source**: `_bmad-output/data-generation-plan.md`
**Created**: 2026-01-02
**Status**: Implementation Ready

### Purpose

Synthetic employees are the foundation of success pattern analysis. When a user asks "What does it take to become a Senior Analyst?", the system analyzes synthetic employees to show common skills, performance metrics, career paths, and feedback themes.

### EY Organizational Structure

**Assurance** (300 employees): Staff(60) -> Senior(90) -> Manager(80) -> Sr. Manager(50) -> Partner(20). Core skills: Accounting, Audit, GAAP, Financial Reporting, Risk Assessment.

**Tax** (300 employees): Staff(60) -> Senior(90) -> Manager(80) -> Sr. Manager(50) -> Partner(20). Core skills: Tax Law, Tax Planning, Tax Compliance, Tax Research, Excel.

**Consulting** (300 employees): Analyst(40) -> Associate(45) -> Sr. Associate(50) -> Consultant(50) -> Sr. Consultant(45) -> Manager(40) -> Sr. Manager(20) -> Director(7) -> Partner(3). Core skills: Strategy, Client Management, Project Management, Stakeholder Management.

### Focus Areas (30% of employees)

**Assurance**: Audit, Financial Reporting, Risk & Compliance, SEC Reporting, Internal Controls, Fraud Investigation.

**Tax**: Corporate Tax, International Tax, Transfer Pricing, M&A Tax, Tax Technology, SALT, Estate Planning.

**Consulting Technology**: Cloud & Infrastructure, Data & Analytics, Cybersecurity, AI & Machine Learning.

**Consulting Business**: Strategy, Operations, Finance Transformation, Supply Chain, HR & Workforce, Customer Experience.

### Role Template Structure

Each template defines: role_name, service_line, level, core_skills, common_skills, years_experience_range, performance_ranges (utilization, client_satisfaction, mentees, certifications), focus_areas, count.

### LLM Prompt Templates

**GPT-5 Nano (metrics)**: Generate `{count}` employees with exact years, performance metrics (financial, compliance, quality, development, people), soft skills (3-6 from pool), additional skills (2-4 from common), career history (no level skips, 18-36 months per role), optional focus area (30%).

**GPT-5.2 Instant (feedback)**: 2-3 authentic peer feedback snippets per employee reflecting performance level. Natural language, 15-30 words each, include strengths and development areas.

### Multi-Layer Validation

5 validation checks: role distribution, performance correlation, career progression, skill distribution, no impossible patterns. Regenerate problematic employees if validation fails.

### Cost Breakdown

GPT-5-Nano (metrics): ~$0.04 (15 batches of 60).
GPT-5.2-Instant (feedback): ~$1.50 (15 batches).
Total: ~$1.54 (budgeted $2 with buffer).

### Implementation Steps

1. Define role templates (manual, 1-2 hours)
2. Scrape EY job postings (optional)
3. Generate synthetic employees (~2 minutes, ~$2)
4. Save to database + create SQL dump
5. Git-based team sharing via data-dumps branch

---

## 13.10. Integration Scan Findings

**Source**: `_bmad-output/integration-scan-findings.md`
**Generated**: 2026-02-11

### Frontend-Backend Communication

HTTP REST API only (no WebSocket, SSE, or GraphQL). Axios-based APIClient with JWT Bearer token interceptor. Separate auth service instance (no `/api` prefix for auth routes).

### CORS Configuration

Backend allows `http://localhost:3000` only. No production origins configured.

### API Path Mapping

Auth endpoints: `http://localhost:8000/auth/*` (no `/api` prefix).
All other endpoints: `http://localhost:8000/api/*`.

### Shared Types

No shared type system. Frontend TypeScript interfaces defined independently from backend Pydantic schemas. Manual mapping functions transform responses. Key discrepancies: Match.id conflated with job_id, nested score objects, PROFICIENCY_LABELS duplicated.

### Authentication Flow

Login -> bcrypt verify -> JWT (HS256, 7-day expiry, payload: user_id, email, exp) -> localStorage -> Bearer token on all requests -> PyJWT verify on backend.

### Docker Compose (4 core + 1 on-demand)

- **postgres** (pgvector/pgvector:pg16): Port 5432, persistent volume, init scripts (extensions + indexes), health check
- **redis** (redis:7-alpine): Port 6380->6379, no auth, health check
- **backend** (Python 3.11-slim): Port 8000, uvicorn --reload, depends on postgres+redis
- **frontend** (Node 18-alpine): Port 3000, Vite dev server, no health check
- **ey_scraper** (profile: scraper): On-demand, same backend Dockerfile

### Database Integration

SQLAlchemy 2.0 with psycopg3 dialect. QueuePool(pool_size=20, max_overflow=30). 16 tables, 26 Alembic migrations. pgvector HNSW index on skill_embeddings (cosine distance, 1536 dims).

### Redis Caching

| Cache | TTL | Purpose |
|-------|-----|---------|
| Match results | 5 min | Avoid re-running matching |
| Skill versions | 1 hour | Invalidation trigger |
| Embeddings (L1) | 7 days | Avoid duplicate OpenAI calls |
| Pattern cache | 24 hours | Transition analysis |
| Job skill extraction | 30 days | LLM-extracted skills |

In-memory caches: global embedding cache (5 min), skill taxonomy LRU (1000 entries), skill normalizer (unbounded).

### AI/ML Pipeline

Full flow: User uploads resume -> text extraction -> PII stripping -> GPT-5.2-chat-latest skill extraction -> text-embedding-3-large (3072 dims) -> PCA reduction (1536) -> pgvector storage -> matching algorithm (80/10/10 weighted: taxonomy + exact + HNSW + Jaccard) -> Redis cache -> progressive frontend loading.

### Data Pipeline

Scrape (careers.ey.com, BeautifulSoup) -> Enrich (LLM skill extraction, Redis 30-day cache) -> Vectorize (embeddings + PCA) -> Synthetic data (GPT + templates + validation) -> PCA model training (200+ skills, 1600 variations).

### Testing Infrastructure

Backend: pytest + pytest-asyncio, 12 test files, fakeredis for cache testing. Major gaps in matching/embedding/skill_progress/roadmap tests.
Frontend: Vitest + React Testing Library, minimal test files found.
E2E: Playwright dependency listed but no test files found.

### Notable Integration Issues

1. No API proxy in Docker (browser makes CORS requests)
2. Hardcoded CORS origin (localhost:3000 only)
3. No rate limiting
4. No shared type contract
5. Auth service uses separate Axios instance
6. Dev-only frontend Dockerfile
7. No frontend health check
8. Redis port confusion (6380 host, 6379 container)
9. Match/Job ID conflation
10. No WebSocket/SSE for long-running operations

---

# 14. Database and Deployment

## 14.1. Database Setup Guide

**Source**: `_bmad-output/database-setup-guide.md`
**Last Updated**: 2026-01-02

### Quick Start (Teammates Loading Data)

```bash
docker-compose up postgres -d
git fetch origin && git checkout data-dumps && git pull
psql -h localhost -U postgres springais < data/synthetic_employees.sql
git checkout main
```

### Initial Setup (One-Time)

1. Clone repository
2. Copy `.env.example` to `.env`, set `OPENAI_API_KEY` and `ONET_API_KEY`
3. `docker-compose up -d`
4. Create database and enable pgvector:
   ```bash
   docker exec -it springais-postgres psql -U postgres
   CREATE DATABASE springais;
   \c springais
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
5. Create `data-dumps` branch for SQL dumps
6. Run `python scripts/init_database.py`

### Team Collaboration: Git-Based Data Sharing

One designated "data owner" generates data (~$2) and dumps to SQL. Committed to `data-dumps` branch (never merged to main). Teammates pull and load with `psql < data/synthetic_employees.sql`. Everyone verifies: `SELECT COUNT(*) FROM employees;` should show 900.

### Core Database Schema

**employees**: String PK (EMP-XXXXXX), service_line, current_role, role_level, years_experience, skills (JSONB, GIN indexed), performance_metrics (JSONB), career_history (JSONB), feedback_themes (TEXT[]), notable_achievement (TEXT). Indexes: service_line, role, role_level, service_line+role (compound), GIN on skills.

**roles**: service_line, role_name, role_level, core_skills (JSONB), common_skills (JSONB), min/max years, focus_areas (TEXT[]). Unique on (service_line, role_name).

**job_postings**: UUID PK, title, service_line, location, posted/closed dates, required/preferred skills (TEXT[]), description (TEXT), posting_url, search_vector (TSVECTOR). Indexes: service_line, posted_date, active filter, GIN search.

**skill_embeddings**: skill_name PK, embedding vector(3072), HNSW index (vector_cosine_ops).

### Common Operations

Success pattern queries: employees by service_line and role, average performance metrics, most common skills with percentages.

Vector similarity search: `1 - (embedding <=> user_embedding) AS similarity ORDER BY embedding <=> user_embedding LIMIT 10`.

### Troubleshooting

- `psql: command not found`: Install PostgreSQL client tools
- pg_dump version mismatch: Upgrade or use Docker version
- Database doesn't exist: `CREATE DATABASE springais;`
- pgvector not installed: `CREATE EXTENSION vector;`
- Team data mismatch: Verify same git commit on data-dumps branch
- Large dump files: Check for unnecessary test data

### Best Practices

- Test locally before pushing generated data
- Include date and count in commit messages
- Don't regenerate frivolously ($2 each time)
- Pull before working, verify after loading
- Keep dumps under 50MB, use gzip if needed

---

## 14.2. Deployment Guide

**Source**: `_bmad-output/deployment-guide.md`
**Generated**: 2026-02-11

### Docker Compose Overview

4 core services + 1 on-demand:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| postgres | pgvector/pgvector:pg16 | 5432 | Database with vector search |
| redis | redis:7-alpine | 6380->6379 | Caching layer |
| backend | Python 3.11-slim | 8000 | FastAPI + Uvicorn |
| frontend | Node 18-alpine | 3000 | Vite dev server |
| ey_scraper | Python 3.11-slim | N/A | On-demand job scraper |

### Quick Start

```bash
git clone <repository-url> && cd SpringAIS
cp .env.example .env  # Set OPENAI_API_KEY, JWT_SECRET_KEY
docker compose up -d
```

Access: Frontend http://localhost:3000, Backend http://localhost:8000, Swagger http://localhost:8000/docs.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | N/A | OpenAI API key |
| `JWT_SECRET_KEY` | Yes | N/A | JWT signing secret |
| `DATABASE_URL` | Yes | N/A | PostgreSQL connection |
| `REDIS_URL` | No | redis://localhost:6380 | Redis URL |
| `JWT_ALGORITHM` | No | HS256 | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_DAYS` | No | 7 | Token expiry |
| `VITE_API_URL` | No | http://localhost:8000 | Backend URL |
| `ONET_API_KEY` | No | N/A | For scraper only |

Docker Compose overrides: DATABASE_URL uses `postgresql+psycopg://` (psycopg3), REDIS_URL uses `redis://redis:6379/0` (container networking).

### Service Configuration Details

**PostgreSQL**: pgvector:pg16, persistent volume, init scripts (01_extensions.sql: vector+pgcrypto, 02_pattern_indexes.sql: 6 indexes), health check (pg_isready), resources 1.0 CPU / 512M.

**Redis**: 7-alpine, host port 6380, no authentication, health check (redis-cli ping), resources 0.5 CPU / 256M.

**Backend**: Python 3.11-slim, uvicorn --reload, bind mounts (backend, uploads, scripts, data), depends on postgres+redis healthy, resources 2.0 CPU / 1G.

**Frontend**: Node 18-alpine, Vite dev server, bind mount + isolated node_modules volume, no health check, resources 1.0 CPU / 512M.

**EY Scraper**: Profile "scraper" (on-demand only), same backend Dockerfile, mounts entire project root, depends on postgres.

### Named Volumes

postgres_data (PostgreSQL persistence), redis_data (Redis persistence), frontend_node_modules (isolated from host).

### Network

Default Docker Compose bridge. Services reference by name. Frontend connects via browser (localhost:8000), not container networking.

### Database Initialization

1. Start services
2. Init scripts run automatically (extensions, indexes)
3. FastAPI creates tables on startup (`Base.metadata.create_all`)
4. Run Alembic migrations: `docker compose exec backend alembic upgrade head`
5. Seed data from `/data/*.sql`

### Data Pipeline (Full Enrichment)

```bash
docker compose --profile scraper up ey_scraper             # Scrape jobs
docker compose exec backend python /app/scripts/extract_all_job_skills.py  # Extract skills
docker compose exec backend python /app/scripts/generate_all_embeddings.py # Generate embeddings
```

### Health Checks

| Service | Check | Interval | Retries |
|---------|-------|----------|---------|
| PostgreSQL | pg_isready | 10s | 5 |
| Redis | redis-cli ping | 10s | 3 |
| Backend | GET / (manual) | N/A | N/A |
| Frontend | None | N/A | N/A |

### Resource Allocation

| Service | CPU Limit | Memory Limit |
|---------|-----------|-------------|
| PostgreSQL | 1.0 | 512M |
| Redis | 0.5 | 256M |
| Backend | 2.0 | 1G |
| Frontend | 1.0 | 512M |
| **Total** | **4.5** | **2.25G** |

### Common Operations

```bash
docker compose up -d            # Start all
docker compose down             # Stop all
docker compose down -v          # Stop + delete volumes (destructive)
docker compose restart backend  # Restart service
docker compose logs -f backend  # View logs
docker compose exec backend bash              # Shell access
docker compose exec postgres psql -U postgres # Database CLI
docker compose exec backend alembic upgrade head  # Run migrations
docker compose exec postgres pg_dump -U postgres springais > backup.sql  # Backup
```

### Production Considerations

1. **Frontend**: Replace Vite dev server with nginx (production build)
2. **CORS**: Update allow_origins to production domain(s)
3. **JWT Secret**: Use strong random secret (not `i-am-dev`)
4. **Redis**: Configure `requirepass`
5. **Database**: Non-default credentials + PgBouncer
6. **Rate Limiting**: Add API rate limiting middleware
7. **HTTPS**: TLS termination via nginx or load balancer
8. **Health Checks**: Add frontend container health check
9. **Logging**: Structured logging (replace default uvicorn)
10. **Monitoring**: Prometheus, DataDog, etc.
11. **Secrets**: Use secrets manager instead of .env files
12. **Scaling**: Backend is stateless, scalable behind load balancer

---

*End of Part 3: Implementation Details*

