# SpringAIS Backend Service Patterns

**Last Updated:** 2026-01-06
**Framework:** FastAPI + SQLAlchemy 2.0
**Architecture:** Service Layer Pattern

---

## Overview

SpringAIS backend follows a **layered architecture** with clear separation of concerns:

1. **API Layer** - FastAPI routes, request/response models (Pydantic)
2. **Service Layer** - Business logic, orchestration
3. **Data Layer** - SQLAlchemy models, database queries
4. **External Services** - OpenAI API, Redis cache

This document defines patterns and best practices for each layer.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  API Layer (FastAPI Routes)                             │
│  • Request validation (Pydantic)                        │
│  • Authentication middleware (JWT)                      │
│  • Response serialization                               │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│  Service Layer (Business Logic)                         │
│  • MatchingService                                      │
│  • SkillExtractionService                               │
│  • SuccessPatternService                                │
│  • EmbeddingService                                     │
│  • CareerPathService                                    │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│  Data Layer (SQLAlchemy ORM)                            │
│  • Employee, JobPosting, Role models                    │
│  • Database queries, transactions                       │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL + Redis + OpenAI                            │
└─────────────────────────────────────────────────────────┘
```

---

## API Layer Patterns

### Route Structure

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
    """
    Get job matches for employee.

    Args:
        employee_id: Employee ID
        min_score: Minimum composite score (0-1)
        department: Filter by department (optional)
        current_user: Authenticated user from JWT

    Returns:
        {matches: [...], total_count: int}

    Raises:
        403: User not authorized to view this employee's matches
    """
    # Authorization check
    if current_user["id"] != employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Call service layer
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

### Request/Response Models (Pydantic)

```python
# backend/app/schemas/match_schemas.py
from pydantic import BaseModel, Field
from typing import List

class SkillGapResponse(BaseModel):
    """
    Skill gap analysis for a job match.
    """
    name: str
    employee_proficiency: str | None = None
    required_proficiency: str
    match_type: str  # "overlapping", "missing", "transferable"

class JobMatchResponse(BaseModel):
    """
    Single job match result.
    """
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
    """
    List of job matches.
    """
    employee_id: int
    employee_name: str
    matches: List[JobMatchResponse]
    total_count: int
    cached: bool = False
```

**Key Patterns:**
1. **Explicit schemas** - Define request/response models with Pydantic
2. **Validation** - Use Field() for constraints (min/max, regex, etc.)
3. **Optional fields** - Use `| None` for nullable fields
4. **Nested models** - Compose complex responses from smaller models

---

### Authentication Middleware

```python
# backend/app/middleware/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import os

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Extract and validate JWT token from Authorization header.

    Returns:
        dict: {id: int, email: str, name: str, role: str}

    Raises:
        401: Invalid or expired token
    """
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
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        return user

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
```

**Usage:**
```python
@router.get("/protected-route")
async def protected_route(current_user: dict = Depends(get_current_user)):
    # current_user is available here
    return {"user_id": current_user["id"]}
```

**Implemented In:** Block M (Core Integration)

---

## Service Layer Patterns

### Service Class Structure

```python
# backend/app/services/matching_service.py
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Employee, JobPosting, EmployeeEmbedding, JobPostingEmbedding
from app.services.embedding_service import EmbeddingService
from app.services.success_pattern_service import SuccessPatternService
import redis

class MatchingService:
    """
    Service for matching employees to job postings.

    Responsibilities:
    - Vector similarity search
    - Skill gap analysis
    - Composite scoring (skill + experience + success pattern)
    - Caching results
    """

    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.embedding_service = EmbeddingService(db)
        self.success_pattern_service = SuccessPatternService(db)

    def get_matches(
        self,
        employee_id: int,
        min_score: float = 0.6,
        department: str | None = None,
        limit: int = 10
    ) -> list[dict]:
        """
        Get job matches for employee.

        1. Check Redis cache
        2. If cache miss, compute matches:
           a. Vector similarity search
           b. Skill gap analysis
           c. Success pattern scoring
           d. Composite scoring
        3. Cache result
        4. Return top N matches

        Args:
            employee_id: Employee ID
            min_score: Minimum composite score
            department: Filter by department
            limit: Max results

        Returns:
            List of match dicts
        """
        # Check cache
        cache_key = f"matches:employee:{employee_id}:{min_score}:{department}"
        cached = self.redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

        # Get employee embedding
        employee_embedding = self.db.query(EmployeeEmbedding).filter_by(
            employee_id=employee_id
        ).first()

        if not employee_embedding:
            raise ValueError(f"Employee {employee_id} has no embedding")

        # Vector similarity search
        raw_matches = self._vector_similarity_search(
            employee_embedding.embedding_vector,
            min_similarity=min_score,
            department=department
        )

        # Enrich with skill gaps
        enriched_matches = []
        for match in raw_matches:
            skill_gap = self._analyze_skill_gap(employee_id, match["job_id"])
            success_pattern = self.success_pattern_service.get_pattern_score(
                employee_id,
                match["job_id"]
            )

            composite_score = self._calculate_composite_score(
                match["similarity_score"],
                skill_gap["experience_match"],
                success_pattern
            )

            enriched_matches.append({
                **match,
                **skill_gap,
                "success_pattern_score": success_pattern,
                "composite_score": composite_score
            })

        # Sort by composite score
        enriched_matches.sort(key=lambda x: x["composite_score"], reverse=True)

        # Take top N
        top_matches = enriched_matches[:limit]

        # Cache for 1 hour
        self.redis_client.setex(cache_key, 3600, json.dumps(top_matches))

        return top_matches

    def _vector_similarity_search(
        self,
        employee_vector: list[float],
        min_similarity: float,
        department: str | None
    ) -> list[dict]:
        """
        Query pgvector for similar job postings.
        """
        query = self.db.query(
            JobPosting.id,
            JobPosting.title,
            JobPosting.department,
            JobPosting.location,
            (1 - JobPostingEmbedding.embedding_vector.cosine_distance(employee_vector)).label("similarity_score")
        ).join(JobPostingEmbedding).filter(
            JobPosting.is_active == True
        )

        if department:
            query = query.filter(JobPosting.department == department)

        query = query.filter(
            (1 - JobPostingEmbedding.embedding_vector.cosine_distance(employee_vector)) > min_similarity
        ).order_by(
            (1 - JobPostingEmbedding.embedding_vector.cosine_distance(employee_vector)).desc()
        ).limit(50)

        return [
            {
                "job_id": row.id,
                "title": row.title,
                "department": row.department,
                "location": row.location,
                "similarity_score": float(row.similarity_score)
            }
            for row in query.all()
        ]

    def _analyze_skill_gap(self, employee_id: int, job_id: int) -> dict:
        """
        Compare employee skills to job requirements.
        """
        # Get employee skills
        employee_skills = set(
            self.db.query(EmployeeSkill.skill_name)
            .filter_by(employee_id=employee_id)
            .all()
        )

        # Get job required skills
        job_skills = set(
            self.db.query(JobPostingSkill.skill_name)
            .filter_by(job_posting_id=job_id)
            .all()
        )

        overlapping = employee_skills & job_skills
        missing = job_skills - employee_skills

        return {
            "overlapping_skills": list(overlapping),
            "missing_skills": list(missing),
            "gap_count": len(missing),
            "experience_match": len(overlapping) / len(job_skills) if job_skills else 0
        }

    def _calculate_composite_score(
        self,
        similarity: float,
        experience_match: float,
        success_pattern: float
    ) -> float:
        """
        Weighted composite score.

        Weights:
        - Skill similarity: 50%
        - Experience match: 25%
        - Success pattern: 25%
        """
        return (
            0.50 * similarity +
            0.25 * experience_match +
            0.25 * success_pattern
        )
```

**Key Patterns:**
1. **Single Responsibility** - Each service handles one domain (matching, extraction, patterns)
2. **Dependency Injection** - Services receive DB session via constructor
3. **Service Composition** - MatchingService uses EmbeddingService and SuccessPatternService
4. **Caching** - Services manage their own cache keys and TTLs
5. **Private Methods** - Use `_method_name` for internal helpers

**Implemented In:** Block E (Matching Engine)

---

## Data Layer Patterns

### SQLAlchemy 2.0 Models

```python
# backend/app/models/employee.py
from sqlalchemy import Column, Integer, String, Date, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    department = Column(String(100), index=True)
    service_line = Column(String(100), index=True)
    location = Column(String(100))
    experience_years = Column(Integer)
    hire_date = Column(Date)
    phone = Column(String(50))
    resume_uploaded = Column(Boolean, default=False)
    resume_parsed_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    role = relationship("Role", back_populates="employees")
    skills = relationship("EmployeeSkill", back_populates="employee", cascade="all, delete-orphan")
    embedding = relationship("EmployeeEmbedding", back_populates="employee", uselist=False)
    applications = relationship("JobApplication", back_populates="employee")

    def __repr__(self):
        return f"<Employee(id={self.id}, name={self.name}, email={self.email})>"
```

**Key Patterns:**
1. **Base class** - All models inherit from `Base`
2. **Type hints** - Use Column types (Integer, String, etc.)
3. **Indexes** - Add `index=True` for frequently queried columns
4. **Relationships** - Define relationships for ORM navigation
5. **Cascades** - Use `cascade="all, delete-orphan"` for dependent data
6. **Timestamps** - Track created_at, updated_at with auto-update

**Implemented In:** Block C (Database Models)

---

### Database Queries

**Simple Query:**
```python
# Get employee by ID
employee = db.query(Employee).filter(Employee.id == 1).first()
```

**Join Query:**
```python
# Get employee with skills
employee = db.query(Employee).join(EmployeeSkill).filter(
    Employee.id == 1
).first()

skills = employee.skills  # ORM relationship
```

**Aggregation Query:**
```python
# Count employees per department
from sqlalchemy import func

department_counts = db.query(
    Employee.department,
    func.count(Employee.id).label("count")
).group_by(Employee.department).all()
```

**Vector Query (pgvector):**
```python
# Find similar employees
from sqlalchemy import func

similar_employees = db.query(
    Employee.id,
    Employee.name,
    (1 - EmployeeEmbedding.embedding_vector.cosine_distance(target_vector)).label("similarity")
).join(EmployeeEmbedding).filter(
    (1 - EmployeeEmbedding.embedding_vector.cosine_distance(target_vector)) > 0.7
).order_by("similarity DESC").limit(10).all()
```

---

## Database Session Management

### FastAPI Dependency

```python
# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://springais:password@localhost:5432/springais")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Dependency for database sessions.
    Automatically closes session after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Usage in Routes:**
```python
from app.database import get_db
from fastapi import Depends

@router.get("/employees/{employee_id}")
async def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee
```

**Key Patterns:**
1. **Session per request** - Each API call gets a new DB session
2. **Auto-close** - Session closed in `finally` block (no leaks)
3. **Dependency injection** - Use `Depends(get_db)` to inject session

---

## Caching Patterns

### Redis Cache Helper

```python
# backend/app/utils/cache.py
import redis
import json
from typing import Callable, Any
import hashlib

redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def cache_result(key_prefix: str, ttl: int = 3600):
    """
    Decorator to cache function results in Redis.

    Args:
        key_prefix: Prefix for cache key
        ttl: Time to live in seconds

    Usage:
        @cache_result("matches", ttl=3600)
        def get_matches(employee_id: int):
            ...
    """
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            # Generate cache key from function name + args
            key_parts = [key_prefix, func.__name__]
            key_parts.extend([str(arg) for arg in args])
            key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
            cache_key = ":".join(key_parts)

            # Check cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)

            # Cache miss - call function
            result = func(*args, **kwargs)

            # Store in cache
            redis_client.setex(cache_key, ttl, json.dumps(result))

            return result

        return wrapper
    return decorator
```

**Usage:**
```python
@cache_result("employee_skills", ttl=3600)
def get_employee_skills(employee_id: int) -> list[dict]:
    skills = db.query(EmployeeSkill).filter_by(employee_id=employee_id).all()
    return [{"name": s.skill_name, "proficiency": s.proficiency} for s in skills]
```

### Cache Invalidation

```python
# backend/app/utils/cache.py
def invalidate_cache(pattern: str):
    """
    Delete all keys matching pattern.

    Args:
        pattern: Redis key pattern (e.g., "matches:employee:1:*")

    Usage:
        invalidate_cache("matches:employee:1:*")  # Delete all matches for employee 1
    """
    keys = redis_client.keys(pattern)
    if keys:
        redis_client.delete(*keys)
```

**Usage After Data Update:**
```python
@router.put("/employees/{employee_id}/skills")
async def update_skills(employee_id: int, skills: list[SkillInput]):
    # Update skills in DB
    update_employee_skills(employee_id, skills)

    # Invalidate caches
    invalidate_cache(f"employee_skills:get_employee_skills:{employee_id}")
    invalidate_cache(f"matches:*:{employee_id}:*")  # All match caches for this employee

    return {"status": "updated"}
```

---

## Error Handling Patterns

### Custom Exceptions

```python
# backend/app/exceptions.py
class SpringAISException(Exception):
    """Base exception for SpringAIS"""
    pass

class EmployeeNotFoundException(SpringAISException):
    """Employee not found in database"""
    pass

class SkillExtractionException(SpringAISException):
    """Skill extraction failed"""
    pass

class OpenAIAPIException(SpringAISException):
    """OpenAI API call failed"""
    pass
```

### Exception Handler

```python
# backend/app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.exceptions import SpringAISException, EmployeeNotFoundException

app = FastAPI()

@app.exception_handler(EmployeeNotFoundException)
async def employee_not_found_handler(request: Request, exc: EmployeeNotFoundException):
    return JSONResponse(
        status_code=404,
        content={"error": "Employee not found", "detail": str(exc)}
    )

@app.exception_handler(SpringAISException)
async def springais_exception_handler(request: Request, exc: SpringAISException):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )
```

### Service Layer Error Handling

```python
# backend/app/services/matching_service.py
class MatchingService:
    def get_matches(self, employee_id: int) -> list[dict]:
        try:
            employee = self.db.query(Employee).filter_by(id=employee_id).first()
            if not employee:
                raise EmployeeNotFoundException(f"Employee {employee_id} not found")

            # Business logic...
            return matches

        except EmployeeNotFoundException:
            # Re-raise domain exceptions
            raise

        except Exception as e:
            # Wrap unexpected errors
            logger.exception(f"Unexpected error in get_matches: {e}")
            raise SpringAISException("Failed to get matches") from e
```

---

## Logging Patterns

### Structured Logging

```python
# backend/app/utils/logging.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """
    Format logs as JSON for easier parsing.
    """
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)

# Configure logger
logger = logging.getLogger("springais")
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)
```

**Usage:**
```python
from app.utils.logging import logger

logger.info("Employee matches computed", extra={
    "employee_id": 1,
    "match_count": 10,
    "duration_ms": 850
})
```

---

## Testing Patterns

### Service Layer Unit Tests

```python
# backend/tests/test_matching_service.py
import pytest
from unittest.mock import MagicMock
from app.services.matching_service import MatchingService

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def matching_service(mock_db):
    return MatchingService(db=mock_db)

def test_get_matches(matching_service, mock_db):
    # Mock database query
    mock_db.query.return_value.filter_by.return_value.first.return_value = MagicMock(
        id=1,
        embedding_vector=[0.1, 0.2, 0.3]
    )

    # Call service
    matches = matching_service.get_matches(employee_id=1)

    # Assert
    assert len(matches) > 0
    assert matches[0]["composite_score"] >= 0.6
```

### Integration Tests

```python
# backend/tests/integration/test_api_integration.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_employee_matches():
    # Login to get token
    login_response = client.post("/api/auth/login", json={
        "email": "test@ey.com",
        "password": "password"
    })
    token = login_response.json()["token"]

    # Get matches
    response = client.get(
        "/api/matches/employee/1",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert "matches" in response.json()
```

---

## Related Documentation

**Backend:**
- `reference-docs/backend/api-reference.md` - All API endpoints
- `reference-docs/backend/database-schema.md` - Database models
- `reference-docs/backend/llm-integration.md` - OpenAI integration

**Architecture:**
- `reference-docs/architecture/system-overview.md` - High-level architecture
- `reference-docs/architecture/data-flow.md` - Request/response flows

**Implementation:**
- `implementation-tracking/STEP-2-DEVELOPMENT/BLOCK-E-MATCHING-ENGINE/` - Matching service
- `implementation-tracking/STEP-2-DEVELOPMENT/BLOCK-G-SKILL-EXTRACTION/` - Extraction service

---

**Document Purpose:** Backend service layer patterns and best practices
**Audience:** Backend developers
**Last Updated:** 2026-01-06
