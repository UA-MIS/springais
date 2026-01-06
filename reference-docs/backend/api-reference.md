# SpringAIS API Reference

**Last Updated:** 2026-01-06
**Base URL:** `http://localhost:8000/api`
**Auth:** JWT Bearer tokens (except /auth endpoints)

---

## Overview

All API endpoints follow RESTful conventions. Authenticated endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format:** All responses are JSON
**Error Format:** `{ "error": "Error message", "detail": {...} }`

---

## Authentication Endpoints

### POST /api/auth/login

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

### GET /api/auth/me

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

### POST /api/auth/logout

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

## Employee Endpoints

### GET /api/employees/{employee_id}

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

### PUT /api/employees/{employee_id}

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

## Skill Extraction Endpoints

### POST /api/skill-extraction

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

### GET /api/skill-extraction/status/{job_id}

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

## Matching Endpoints

### GET /api/matches/employee/{employee_id}

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

### GET /api/matches/employee/{employee_id}/job/{job_id}

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

## Career Path Endpoints

### GET /api/career-paths/employee/{employee_id}

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

## Success Pattern Endpoints

### GET /api/success-patterns

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

### GET /api/success-patterns/timeline

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

## Job Posting Endpoints

### GET /api/jobs

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

### GET /api/jobs/{job_id}

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

## Health Check Endpoints

### GET /api/health

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

## Error Responses

### Standard Error Format

All errors return this format:

```json
{
  "error": "Brief error message",
  "detail": "Detailed explanation or validation errors",
  "status_code": 400,
  "timestamp": "2026-01-06T14:30:00Z"
}
```

### HTTP Status Codes

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

## Rate Limiting

**Current MVP:** No rate limiting (local development)

**Future Production:**
- 100 requests per minute per user
- 429 status code when exceeded
- Response header: `X-RateLimit-Remaining: 87`

---

## API Versioning

**Current:** No versioning (v1 assumed)

**Future:** Version in URL path:
- `/api/v1/matches/employee/1`
- `/api/v2/matches/employee/1`

---

## Related Documentation

**Backend:**
- `reference-docs/backend/database-schema.md` - Database structure
- `reference-docs/backend/llm-integration.md` - OpenAI API patterns
- `reference-docs/backend/service-patterns.md` - Service layer architecture

**Integration:**
- `reference-docs/integration/api-contracts.md` - Frontend-backend contracts

**Implementation:**
- `implementation-tracking/STEP-2-DEVELOPMENT/BLOCK-E-MATCHING-ENGINE/` - Matching logic
- `implementation-tracking/STEP-2-DEVELOPMENT/BLOCK-G-SKILL-EXTRACTION/` - Skill extraction
- `implementation-tracking/STEP-3-INTEGRATION/BLOCK-M-CORE-INTEGRATION/` - Auth endpoints

---

**Document Purpose:** Complete API reference for frontend developers
**Audience:** Frontend developers, integration testers
**Last Updated:** 2026-01-06
