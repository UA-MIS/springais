# BLOCK M: Core Integration - CONTEXT

**Block ID:** BLOCK-M-CORE-INTEGRATION
**Phase:** STEP-3-INTEGRATION
**Category:** #integration #backend #frontend
**Estimated Time:** 1-2 days
**Dependencies:** STEP-2: Block C (Database Models), Block H (Auth & Layout)

---

## AI Quick Start Prompt

```
You are working on BLOCK-M: Core Integration for SpringAIS.

Goal: Connect authentication to database and establish secure API foundation for all features.

Key constraints:
- MUST complete this block before N, O, P (they all depend on this)
- Replace mock auth with real database users
- Secure all API routes with JWT authentication
- Connect frontend auth pages to backend
- Establish API client pattern for all feature integrations

Read TASKS.md for implementation steps.
Read VERIFICATION.md for integration testing.
```

---

## Purpose

Establish the core authenticated connection between frontend and backend, providing the foundation for all feature integrations in Blocks N, O, P.

**Why this matters:**
- Blocks N, O, P all require authenticated API calls
- Without this integration, features work in isolation but can't communicate
- Establishes patterns (API client, auth flow, error handling) for all future integrations
- Validates that basic infrastructure (DB, backend, frontend) all connect properly

**Success outcome:**
- Users can register, login, logout via real database
- All API routes protected by JWT authentication
- Frontend can make authenticated requests to backend
- Clear API client pattern established for feature teams

---

## What This Block Integrates

### From Block C: Database Models

**What's already built:**
- SQLAlchemy models for all 6 tables (employees, users, roles, etc.)
- Database schema with relationships and constraints
- ORM setup with database connection

**What this block does:**
- Use User model for authentication
- Create real user records in database
- Connect auth middleware to User queries

### From Block H: Auth & Layout

**What's already built:**
- Login/Register pages (UI only, using mock data)
- Navigation and layout components
- Protected route wrapper (client-side only)

**What this block does:**
- Connect login form to backend `/auth/login` endpoint
- Connect register form to backend `/auth/register` endpoint
- Store JWT token in localStorage
- Add token to all API requests
- Handle auth errors (401 → redirect to login)

---

## Authentication Architecture

### Backend: JWT Token Flow

**Registration:**
```
POST /auth/register
Body: { "email": "user@example.com", "password": "...", "name": "John Doe" }

Backend:
1. Validate email format and password strength
2. Check if email already exists
3. Hash password (bcrypt)
4. Create User record in database
5. Generate JWT token (user_id + email, expires 7 days)
6. Return: { "token": "eyJ...", "user": { "id": 1, "email": "...", "name": "..." } }
```

**Login:**
```
POST /auth/login
Body: { "email": "user@example.com", "password": "..." }

Backend:
1. Query User by email
2. Compare password hash
3. If valid: Generate JWT token
4. Return: { "token": "eyJ...", "user": { ... } }
5. If invalid: Return 401 Unauthorized
```

**Protected Routes:**
```
GET /api/employees
Headers: { "Authorization": "Bearer eyJ..." }

Backend middleware:
1. Extract token from Authorization header
2. Verify JWT signature
3. Decode user_id from token
4. Query User by id (ensure still exists)
5. Attach user to request context
6. If invalid: Return 401 Unauthorized
```

### Frontend: Token Management

**After login:**
```javascript
// Login response
const { token, user } = await api.post('/auth/login', { email, password })

// Store token
localStorage.setItem('token', token)
localStorage.setItem('user', JSON.stringify(user))

// Redirect to dashboard
navigate('/dashboard')
```

**API Client:**
```javascript
// lib/api.ts
const api = {
  get: async (url) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }

    return response.json()
  },

  post: async (url, data) => { /* similar */ },
  // ... put, delete
}
```

**Protected Routes:**
```jsx
// components/ProtectedRoute.tsx
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" />
  }

  return children
}
```

---

## API Endpoints to Implement

### Auth Endpoints (Backend)

**File:** `backend/app/routes/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from ..utils.security import hash_password, verify_password, create_jwt_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        email=request.email,
        name=request.name,
        password_hash=hash_password(request.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_jwt_token({"user_id": user.id, "email": user.email})

    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "name": user.name}
    }

@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate token
    token = create_jwt_token({"user_id": user.id, "email": user.email})

    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "name": user.name}
    }

@router.get("/me")
def get_current_user(current_user: User = Depends(get_current_user_from_token)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name
    }
```

### Security Utilities

**File:** `backend/app/utils/security.py`

```python
import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User

# JWT config
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = verify_jwt_token(token)
    user_id = payload.get("user_id")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
```

---

## Frontend Integration

### API Client Pattern

**File:** `frontend/src/lib/api.ts`

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class APIClient {
  private getToken(): string | null {
    return localStorage.getItem('token')
  }

  private async request(method: string, url: string, data?: any) {
    const token = this.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const options: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    }

    const response = await fetch(`${API_BASE}${url}`, options)

    if (response.status === 401) {
      // Unauthorized - clear token and redirect
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Request failed')
    }

    return response.json()
  }

  async get(url: string) {
    return this.request('GET', url)
  }

  async post(url: string, data: any) {
    return this.request('POST', url, data)
  }

  async put(url: string, data: any) {
    return this.request('PUT', url, data)
  }

  async delete(url: string) {
    return this.request('DELETE', url)
  }
}

export const api = new APIClient()
```

### Auth Context

**File:** `frontend/src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

interface User {
  id: number
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    setUser(response.user)
  }

  const register = async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name })
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    setUser(response.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### Update Login Page

**File:** `frontend/src/pages/LoginPage.tsx` (update existing)

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">Login to SpringAIS</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
```

---

## Environment Variables

### Backend (.env)

```bash
# Add to existing .env
JWT_SECRET_KEY=your-very-secret-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7
```

### Frontend (.env)

```bash
# Add to existing .env
VITE_API_URL=http://localhost:8000
```

---

## Testing Strategy

### Backend Tests

**File:** `backend/tests/test_auth.py`

```python
def test_register(client):
    response = client.post('/auth/register', json={
        'email': 'test@example.com',
        'password': 'SecurePass123',
        'name': 'Test User'
    })
    assert response.status_code == 200
    assert 'token' in response.json()
    assert 'user' in response.json()

def test_register_duplicate_email(client):
    # First registration
    client.post('/auth/register', json={
        'email': 'test@example.com',
        'password': 'SecurePass123',
        'name': 'Test User'
    })

    # Duplicate
    response = client.post('/auth/register', json={
        'email': 'test@example.com',
        'password': 'DifferentPass',
        'name': 'Another User'
    })
    assert response.status_code == 400
    assert 'already registered' in response.json()['detail']

def test_login_success(client, test_user):
    response = client.post('/auth/login', json={
        'email': 'test@example.com',
        'password': 'SecurePass123'
    })
    assert response.status_code == 200
    assert 'token' in response.json()

def test_login_invalid_credentials(client):
    response = client.post('/auth/login', json={
        'email': 'test@example.com',
        'password': 'WrongPassword'
    })
    assert response.status_code == 401

def test_protected_route_with_token(client, auth_token):
    response = client.get('/api/employees', headers={
        'Authorization': f'Bearer {auth_token}'
    })
    assert response.status_code == 200

def test_protected_route_without_token(client):
    response = client.get('/api/employees')
    assert response.status_code == 401
```

### Frontend Tests

**File:** `frontend/src/tests/auth.test.tsx`

```typescript
describe('Auth Flow', () => {
  it('redirects to login when not authenticated', () => {
    render(<ProtectedRoute><Dashboard /></ProtectedRoute>)
    expect(window.location.pathname).toBe('/login')
  })

  it('shows dashboard when authenticated', () => {
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))

    render(<ProtectedRoute><Dashboard /></ProtectedRoute>)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('clears token on 401 response', async () => {
    localStorage.setItem('token', 'expired-token')

    // Mock API call that returns 401
    const response = await api.get('/api/employees')

    expect(localStorage.getItem('token')).toBeNull()
  })
})
```

---

## What Blocks N, O, P Will Build On

This block establishes patterns that N, O, P will use:

### For Block N (Skills Dashboard Integration):
```typescript
// Skills dashboard can now make authenticated API calls
const { user } = useAuth()  // Current user
const skills = await api.get('/api/skills/extract')  // Protected route
const matches = await api.post('/api/matching/suggest', { user_id: user.id })
```

### For Block O (Matching Integration):
```typescript
// Matching engine connects to real user data
const matches = await api.get(`/api/matches/${user.id}`)
const jobPostings = await api.get('/api/jobs')  // Real scraped jobs
```

### For Block P (Visualization Integration):
```typescript
// Career viz fetches real success patterns
const patterns = await api.get(`/api/success-patterns/${roleId}`)
const employees = await api.get(`/api/employees?role=${roleName}`)
```

---

## Skill Recommendations Architecture (Hybrid Approach)

### Problem Statement

The Profile "My Skills" tab shows **role-agnostic** recommended skills ("skills to work towards"), but all existing backend recommendation logic is **role-specific**:

| Existing Source | What It Does | Limitation |
|-----------------|--------------|------------|
| `/api/matches/.../skill-gaps/{job_id}` | Skills missing for ONE specific job | Too narrow |
| `/api/patterns/.../recommendations` | Roles to pursue, with skill gaps per role | Still role-specific |
| `_get_recommended_skills()` | Hardcoded stub | Not real data |

**Solution:** Hybrid aggregation that combines multiple sources into unified recommendations.

### Data Sources for Recommendations

1. **Saved Matches** - Aggregate `skill_gaps` from all matches the user has saved
2. **Career Goal** - Skills needed for `career_path.target_position_node_id`
3. **LLM Bootstrap** - Cold start when user has no saved matches or career goal

### Implementation Files

#### 1. New Model: `backend/app/models/skill_recommendation.py`

```python
from __future__ import annotations
from uuid import UUID, uuid4
from sqlalchemy import ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text
from .base import Base, TimestampMixin

class UserSkillRecommendation(Base, TimestampMixin):
    __tablename__ = "user_skill_recommendations"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    skill_name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str | None] = mapped_column(String)  # cloud_infrastructure, leadership_management, etc.
    priority_score: Mapped[float] = mapped_column(Numeric, default=0.5)  # 0.0-1.0
    source: Mapped[str] = mapped_column(String)  # "career_goal", "saved_matches", "success_patterns", "llm_bootstrap"
    
    # Which roles need this skill (for explainability)
    related_job_ids: Mapped[list[str]] = mapped_column(JSONB, default=list)
    
    # User interaction
    status: Mapped[str] = mapped_column(String, default="recommended")  # recommended, in_progress, dismissed
    user_notes: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        Index("idx_skill_rec_user_id", "user_id"),
        Index("idx_skill_rec_priority", "user_id", "priority_score"),
    )
```

Register in `backend/app/models/__init__.py`.

#### 2. New Service: `backend/app/services/recommendation_service.py`

```python
from collections import Counter
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user_profile import UserProfile
from app.models.match import Match
from app.models.skill_recommendation import UserSkillRecommendation

class SkillRecommendationService:
    def __init__(self, db: Session):
        self.db = db
    
    async def compute_recommendations(self, user_id: UUID) -> list[UserSkillRecommendation]:
        """Main entry point - aggregates from all sources."""
        user = self.db.query(UserProfile).filter_by(id=user_id).first()
        if not user:
            return []
        
        current_skills = set(user.skills or [])
        recommendations = {}
        
        # Source 1: Aggregate from saved matches (skill_gaps field)
        matches = self.db.query(Match).filter_by(user_id=user_id).all()
        for match in matches:
            for skill in (match.skill_gaps or []):
                if skill not in current_skills:
                    if skill not in recommendations:
                        recommendations[skill] = {"count": 0, "job_ids": [], "source": "saved_matches"}
                    recommendations[skill]["count"] += 1
                    recommendations[skill]["job_ids"].append(str(match.job_posting_id))
        
        # Source 2: Career goal (if set)
        career_path = user.career_path
        if career_path and career_path.target_position_node_id:
            goal_skills = await self._get_skills_for_role(career_path.target_position_node_id)
            for skill in goal_skills:
                if skill not in current_skills:
                    if skill not in recommendations:
                        recommendations[skill] = {"count": 0, "job_ids": [], "source": "career_goal"}
                    recommendations[skill]["count"] += 2  # Weight career goal higher
        
        # Source 3: LLM bootstrap (if no matches and no career goal)
        if not recommendations and not matches:
            recommendations = await self._llm_bootstrap(user)
        
        # Convert to priority scores and persist
        return self._persist_recommendations(user_id, recommendations, len(matches))
    
    async def _get_skills_for_role(self, role_id: str) -> list[str]:
        """Get required skills for a target role."""
        # Query job_postings or role definitions for required skills
        # Implementation depends on your data model
        return []
    
    async def _llm_bootstrap(self, user: UserProfile) -> dict:
        """Cold start: use LLM to suggest skills based on current role/skills."""
        from app.services.skill_extractor import get_openai_client
        
        client = get_openai_client()
        prompt = f"""
        User's current role: {user.current_role or 'Not specified'}
        User's current skills: {user.skills or []}
        Target service line: {user.target_service_line or 'Not specified'}
        
        Suggest 5-10 skills they should develop next for career growth.
        Return as JSON object where keys are skill names and values are categories.
        
        Categories (use exactly these): cloud_infrastructure, leadership_management, 
        data_analytics, consulting_excellence, programming, security, business_acumen
        
        Example: {{"Python": "programming", "AWS": "cloud_infrastructure"}}
        """
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        
        import json
        skills_dict = json.loads(response.choices[0].message.content)
        
        return {
            skill: {"count": 1, "job_ids": [], "source": "llm_bootstrap", "category": category}
            for skill, category in skills_dict.items()
        }
    
    def _persist_recommendations(
        self, 
        user_id: UUID, 
        recommendations: dict, 
        total_matches: int
    ) -> list[UserSkillRecommendation]:
        """Save to DB, calculate priority scores."""
        # Delete old recommendations for this user (except user-modified ones)
        self.db.query(UserSkillRecommendation)\
            .filter_by(user_id=user_id)\
            .filter(UserSkillRecommendation.status == "recommended")\
            .delete()
        
        results = []
        for skill, data in recommendations.items():
            # Priority: normalize by match count, cap at 1.0
            priority = data["count"] / max(total_matches, 1) if total_matches else 0.5
            
            rec = UserSkillRecommendation(
                user_id=user_id,
                skill_name=skill,
                category=data.get("category"),
                priority_score=min(priority, 1.0),
                source=data["source"],
                related_job_ids=data["job_ids"],
            )
            self.db.add(rec)
            results.append(rec)
        
        self.db.commit()
        return results
```

#### 3. New Endpoint: `backend/app/routes/skills.py` (add to existing)

```python
from uuid import UUID
from app.services.recommendation_service import SkillRecommendationService
from app.models.skill_recommendation import UserSkillRecommendation

@router.get(
    "/recommendations",
    summary="Get personalized skill recommendations",
    description="Get aggregated skill recommendations based on saved roles, career goals, and success patterns."
)
async def get_skill_recommendations(
    refresh: bool = False,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Get aggregated skill recommendations for the current user's profile.
    
    - **refresh**: If True, recompute from all sources. Otherwise return cached.
    """
    service = SkillRecommendationService(db)
    
    if refresh:
        recommendations = await service.compute_recommendations(current_user.id)
    else:
        recommendations = db.query(UserSkillRecommendation)\
            .filter_by(user_id=current_user.id)\
            .filter(UserSkillRecommendation.status != "dismissed")\
            .order_by(UserSkillRecommendation.priority_score.desc())\
            .all()
        
        # If none exist, compute fresh
        if not recommendations:
            recommendations = await service.compute_recommendations(current_user.id)
    
    return {
        "recommendations": [
            {
                "skill": r.skill_name,
                "category": r.category,
                "priority": float(r.priority_score),
                "source": r.source,
                "related_roles": r.related_job_ids,
                "status": r.status,
            }
            for r in recommendations
        ]
    }

@router.patch(
    "/recommendations/{skill_name}/status",
    summary="Update recommendation status",
)
async def update_recommendation_status(
    skill_name: str,
    status: str,  # "in_progress", "dismissed", "recommended"
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """User marks a recommendation as in-progress or dismisses it."""
    rec = db.query(UserSkillRecommendation)\
        .filter_by(user_id=current_user.id, skill_name=skill_name)\
        .first()
    
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    if status not in ["in_progress", "dismissed", "recommended"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    rec.status = status
    db.commit()
    
    return {"skill": skill_name, "status": status}
```

#### 4. Frontend Hook Update: `frontend/src/hooks/useSkills.js`

```javascript
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { MOCK_SKILLS } from '../mocks/mockSkills';  // Fallback

export function useSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // ... existing state
  
  useEffect(() => {
    async function fetchSkills() {
      try {
        // Fetch user's current skills + recommendations in parallel
        const [currentRes, recsRes] = await Promise.all([
          api.get('/api/skills/'),
          api.get('/api/skills/recommendations'),
        ]);
        
        // Map current skills
        const currentSkills = (currentRes.skills || []).map(s => ({
          ...s,
          status: s.proficiency >= 80 ? 'complete' : 'active',
        }));
        
        // Map recommendations
        const recommendedSkills = (recsRes.recommendations || []).map(r => ({
          id: `rec-${r.skill}`,
          name: r.skill,
          category: r.category,
          proficiency: 0,
          status: r.status === 'in_progress' ? 'active' : 'recommended',
          priority: r.priority,
          source: r.source,
          relatedRoles: r.related_roles,
          progress: { current: 0, total: 4, unit: 'modules' },
        }));
        
        setSkills([...currentSkills, ...recommendedSkills]);
      } catch (err) {
        console.error('Failed to fetch skills, using mock data', err);
        setError(err);
        setSkills(MOCK_SKILLS);  // Fallback for dev
      } finally {
        setLoading(false);
      }
    }
    
    fetchSkills();
  }, []);
  
  // Update recommendation status
  const updateRecommendationStatus = async (skillName, newStatus) => {
    try {
      await api.patch(`/api/skills/recommendations/${encodeURIComponent(skillName)}/status`, {
        status: newStatus,
      });
      
      setSkills(skills.map(s => 
        s.name === skillName ? { ...s, status: newStatus } : s
      ));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };
  
  // Refresh recommendations (after saving a new match, etc.)
  const refreshRecommendations = async () => {
    try {
      const recsRes = await api.get('/api/skills/recommendations?refresh=true');
      // Merge with existing skills...
    } catch (err) {
      console.error('Failed to refresh recommendations', err);
    }
  };
  
  return {
    skills,
    loading,
    error,
    // ... existing returns
    updateRecommendationStatus,
    refreshRecommendations,
  };
}
```

#### 5. Triggers for Recomputation

Call `service.compute_recommendations(user_id)` when:

| Trigger Location | Event |
|------------------|-------|
| `routes/skills.py` - after `/upload` | User uploads new resume (new current skills) |
| `routes/matches.py` - after save match | User saves a match (new skill gaps to aggregate) |
| `routes/patterns.py` - after set career goal | User updates career target |

Example in matches.py:
```python
@router.post("/save")
async def save_match(match_id: UUID, ...):
    # ... save match logic ...
    
    # Trigger recommendation refresh
    rec_service = SkillRecommendationService(db)
    await rec_service.compute_recommendations(current_user.id)
    
    return {"saved": True}
```

### Skill Categories

The mock data uses these EY-specific categories (keep for consistency):

- `cloud_infrastructure` - AWS, Azure, Kubernetes, etc.
- `leadership_management` - Team Leadership, Mentorship, etc.
- `data_analytics` - Python, SQL, ML, Tableau, etc.
- `consulting_excellence` - Client Presentations, Stakeholder Management, etc.
- `programming` - JavaScript, React, Node.js, etc.
- `security` - Security Best Practices, OWASP, etc.
- `business_acumen` - Financial Analysis, Agile, etc.

LLM bootstrap prompt includes these exact categories to ensure consistency.

### Migration Required

Create Alembic migration for `user_skill_recommendations` table:

```bash
cd backend
alembic revision --autogenerate -m "add_user_skill_recommendations"
alembic upgrade head
```

---

## References

**Related Step 2 Blocks:**
- `BLOCK-C-DATABASE-MODELS/CONTEXT.md` - User model structure
- `BLOCK-H-AUTH-LAYOUT/CONTEXT.md` - Frontend auth components

**Related Documentation:**
- `_bmad-output/tech-stack.md` - Architecture overview
- `implementation-tracking/STEP-1-SETUP/CONTEXT.md` - Database setup

**Technology Docs:**
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- JWT: https://jwt.io/introduction
- React Context: https://react.dev/reference/react/useContext

---

## Success Criteria

**This block is complete when:**

1. ✅ Users can register via frontend form → database record created
2. ✅ Users can login via frontend form → JWT token received
3. ✅ Token stored in localStorage
4. ✅ API client adds token to all requests
5. ✅ Backend validates token on protected routes
6. ✅ 401 responses redirect to login
7. ✅ All tests pass (backend + frontend auth tests)
8. ✅ Documentation updated for Blocks N, O, P

**Integration Checklist:**
- [ ] Frontend login page calls backend `/auth/login`
- [ ] Frontend register page calls backend `/auth/register`
- [ ] JWT token stored and retrieved correctly
- [ ] Protected routes require authentication
- [ ] Token expiration handled gracefully
- [ ] Error messages clear and helpful
- [ ] API client pattern documented for other blocks

---

## AI Auto-Update Instructions

When you complete a task in TASKS.md:

1. **Update the task checkbox:**
   ```markdown
   - [x] Task 1: Implement JWT security utilities
   ```

2. **Update PROJECT-STATUS.md:**
   ```markdown
   | **M** | Core Integration | 🔄 In Progress | [Your name] | 3/10 tasks | 1-2 days |
   ```

3. **When this block completes:**
   - Update Blocks N, O, P CONTEXT.md files with integration patterns
   - Document API client usage
   - Note authentication requirement

4. **When block complete:**
   - Change status to ✅ Completed in PROJECT-STATUS.md
   - Update "Overall Progress" section
   - Add note: "Block M complete - Core auth integration ready, N/O/P unblocked"

---

**Last Updated:** 2026-01-20
**Status:** Ready for development
**Blocking:** Blocks N, O, P (all depend on this)
**Blocked by:** Block C (Database Models), Block H (Auth & Layout)
