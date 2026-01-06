# SpringAIS API Contracts

**Last Updated:** 2026-01-06
**Purpose:** Frontend-backend API contracts for integration blocks

---

## Overview

This document defines the **API contracts** between frontend and backend. These contracts must be agreed upon **before integration** begins (Step 3: Blocks M, N, O, P).

**Contract Definition:**
- Request format (URL, method, headers, body)
- Response format (status codes, JSON structure)
- Error handling (error codes, messages)
- Performance targets (latency, caching)

---

## Authentication Contract

### POST /api/auth/login

**Request:**
```typescript
POST /api/auth/login
Content-Type: application/json

{
  email: string;
  password: string;
}
```

**Response (200 OK):**
```typescript
{
  token: string;  // JWT token (7-day expiration)
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    department: string;
  };
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Missing email or password

**Frontend Usage:** Block M (Core Integration)
**Backend Implementation:** Block M (Core Integration)

---

## Skills Dashboard Contract

### GET /api/employees/{employee_id}

**Request:**
```typescript
GET /api/employees/1
Authorization: Bearer {token}
```

**Response (200 OK):**
```typescript
{
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  service_line: string;
  experience_years: number;
  skills: Array<{
    name: string;
    proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    years_experience?: number;
    source?: 'resume' | 'manual';
  }>;
  resume_uploaded: boolean;
}
```

**Errors:**
- `403 Forbidden` - Cannot view other employee's profile
- `404 Not Found` - Employee does not exist

**Performance:** <100ms

**Frontend Usage:** Block I (Skills Dashboard), Block N (Skills Integration)
**Backend Implementation:** Block C (Database Models), Block N (Skills Integration)

---

### POST /api/skill-extraction

**Request:**
```typescript
POST /api/skill-extraction
Authorization: Bearer {token}
Content-Type: multipart/form-data

employee_id: number
file: File (PDF or DOCX)
```

**Response (200 OK):**
```typescript
{
  employee_id: number;
  skills_extracted: Array<{
    name: string;
    proficiency: string;
    years_experience?: number;
    confidence: number;  // 0-1
  }>;
  embedding_created: boolean;
  processing_time_seconds: number;
}
```

**Errors:**
- `400 Bad Request` - Invalid file type
- `413 Payload Too Large` - File exceeds 10 MB
- `500 Internal Server Error` - GPT-5.2 Instant API failure

**Performance:** 10-15 seconds (GPT-5.2 Instant call)

**Frontend Usage:** Block I (Skills Dashboard), Block N (Skills Integration)
**Backend Implementation:** Block G (Skill Extraction), Block N (Skills Integration)

---

## Match Results Contract

### GET /api/matches/employee/{employee_id}

**Request:**
```typescript
GET /api/matches/employee/1?min_score=0.6&department=Technology&limit=10
Authorization: Bearer {token}

Query Parameters:
  min_score?: number (0-1, default 0.6)
  department?: string
  location?: string
  limit?: number (default 10)
```

**Response (200 OK):**
```typescript
{
  employee_id: number;
  employee_name: string;
  matches: Array<{
    job_id: number;
    title: string;
    department: string;
    location: string;
    similarity_score: number;  // 0-1
    composite_score: number;  // 0-1
    overlapping_skills: string[];
    missing_skills: string[];
    transferable_skills?: string[];
    gap_count: number;
  }>;
  total_count: number;
  cached: boolean;
}
```

**Errors:**
- `403 Forbidden` - Cannot view other employee's matches
- `404 Not Found` - Employee has no skills (profile incomplete)

**Performance:** <1 second (uncached), <100ms (cached)

**Caching:** Redis, 1-hour TTL, invalidated on skill update

**Frontend Usage:** Block J (Match Results), Block O (Matching Integration)
**Backend Implementation:** Block E (Matching Engine), Block O (Matching Integration)

---

## Career Path Contract

### GET /api/career-paths/employee/{employee_id}

**Request:**
```typescript
GET /api/career-paths/employee/1?depth=2
Authorization: Bearer {token}

Query Parameters:
  depth?: number (1-3, default 2)
```

**Response (200 OK):**
```typescript
{
  employee_id: number;
  current_role: {
    id: number;
    title: string;
    level: number;
  };
  graph: {
    nodes: Array<{
      id: number;
      title: string;
      level: number;
      is_current: boolean;
    }>;
    edges: Array<{
      from: number;
      to: number;
      transition_count: number;
      avg_time_months: number;
      success_rate: number;  // 0-1
    }>;
  };
  cached: boolean;
}
```

**Errors:**
- `403 Forbidden` - Cannot view other employee's career path
- `404 Not Found` - Employee role not found

**Performance:** <300ms

**Caching:** Redis, 1-hour TTL

**Frontend Usage:** Block K (Career Visualization), Block P (Viz Integration)
**Backend Implementation:** Block F (Success Patterns), Block P (Viz Integration)

---

## Success Patterns Contract

### GET /api/success-patterns

**Request:**
```typescript
GET /api/success-patterns?from_role=5&to_role=6
Authorization: Bearer {token}

Query Parameters:
  from_role: number (required)
  to_role: number (required)
```

**Response (200 OK):**
```typescript
{
  from_role: {
    id: number;
    title: string;
  };
  to_role: {
    id: number;
    title: string;
  };
  metrics: {
    total_transitions: number;
    successful_transitions: number;
    success_rate: number;  // 0-1
    avg_time_months: number;
    median_time_months: number;
    avg_performance_score: number;  // 1-5
  };
  top_skills: Array<{
    name: string;
    frequency: number;  // 0-1
    avg_proficiency: string;
  }>;
}
```

**Errors:**
- `400 Bad Request` - Missing from_role or to_role
- `404 Not Found` - No transitions found for role pair

**Performance:** <200ms

**Caching:** Redis, 24-hour TTL (patterns are stable)

**Frontend Usage:** Block L (Success Pattern UI), Block P (Viz Integration)
**Backend Implementation:** Block F (Success Patterns), Block P (Viz Integration)

---

## Error Response Format

**Standard Error:**
```typescript
{
  error: string;  // Brief message
  detail?: string | object;  // Detailed error or validation errors
  status_code: number;
  timestamp: string;  // ISO 8601
}
```

**Example:**
```json
{
  "error": "Validation failed",
  "detail": {
    "email": ["Email is required"],
    "password": ["Password must be at least 8 characters"]
  },
  "status_code": 422,
  "timestamp": "2026-01-06T14:30:00Z"
}
```

---

## Contract Testing

### Frontend Contract Tests (Mock Backend)

```typescript
// frontend/tests/contracts/matchesContract.test.ts
import { describe, it, expect } from 'vitest';

describe('Matches API Contract', () => {
  it('should match expected response shape', async () => {
    const response = await api.get('/matches/employee/1');

    expect(response.data).toMatchObject({
      employee_id: expect.any(Number),
      matches: expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.any(Number),
          title: expect.any(String),
          composite_score: expect.any(Number)
        })
      ])
    });
  });

  it('should return 403 for unauthorized access', async () => {
    await expect(api.get('/matches/employee/999')).rejects.toThrow('403');
  });
});
```

### Backend Contract Tests

```python
# backend/tests/test_contracts.py
def test_matches_contract(client, auth_headers):
    response = client.get('/api/matches/employee/1', headers=auth_headers)

    assert response.status_code == 200
    assert 'employee_id' in response.json()
    assert 'matches' in response.json()
    assert all(key in response.json()['matches'][0] for key in [
        'job_id', 'title', 'composite_score'
    ])
```

---

## Versioning Strategy (Future)

**Current:** No versioning (MVP)

**Future Production:**
- Version in URL: `/api/v1/matches/employee/{id}`
- Breaking changes require new version: `/api/v2/matches/employee/{id}`
- Maintain v1 for 6 months after v2 release

---

## Related Documentation

- `reference-docs/backend/api-reference.md` - Complete API documentation
- `reference-docs/frontend/state-management.md` - React Query integration
- `reference-docs/integration/testing-strategy.md` - Integration testing

**Implemented In:** All integration blocks (M, N, O, P)
