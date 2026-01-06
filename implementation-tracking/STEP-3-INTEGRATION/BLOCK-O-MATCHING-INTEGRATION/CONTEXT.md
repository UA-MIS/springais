# BLOCK O: Matching Integration - CONTEXT

**Block ID:** BLOCK-O-MATCHING-INTEGRATION
**Phase:** STEP-3-INTEGRATION
**Category:** #integration #frontend #backend
**Estimated Time:** 1-2 days
**Dependencies:** STEP-2: Block E (Matching Engine), Block F (Success Patterns), Block J (Match Results UI); STEP-3: Block M (Core Integration)

---

## AI Quick Start Prompt

```
You are working on BLOCK-O: Matching Integration for SpringAIS.

Goal: Connect match results UI to matching engine API, displaying real job postings (PRIMARY) with success pattern augmentation (SECONDARY).

Key constraints:
- PRIMARY DATA SOURCE: Real job postings from scraped data (Block B)
- SECONDARY DATA SOURCE: Success patterns for augmentation/insight only (Block F)
- Replace mock matches with real matching algorithm results
- Enable real-time job matching with skill-based filters
- Track match history and application status
- All API calls must use authenticated endpoints (Block M)

CRITICAL: Job postings are the PRIMARY data source. Success patterns are AUGMENTATION.

Read TASKS.md for implementation steps.
Read VERIFICATION.md for integration testing.
```

---

## Purpose

Connect the match results frontend to the AI-powered matching engine backend, enabling users to see real job recommendations based on their skills, with success pattern insights augmenting the data.

**Why this matters:**
- Block J (Match Results UI) has components but uses mock data
- Block E (Matching Engine) has algorithm but no user interface
- Block F (Success Patterns) has insights but not integrated
- Users need to see real job recommendations, not fake matches
- Job matching requires skills from Block N integration

**Success outcome:**
- Users see real job postings matched to their skills
- Match scores calculated using real matching algorithm (Block E)
- Success patterns provide augmentation (salary ranges, progression insights)
- Real-time filtering by location, salary, match percentage
- Match history tracked (viewed, saved, applied)
- Application status tracking

---

## What This Block Integrates

### From Block E: Matching Engine

**What's already built:**
- AI-powered job matching algorithm
- Skill-based similarity scoring
- Location and salary filtering
- Match ranking and sorting
- Recommendation explanation system

**What this block does:**
- Call `/api/matching/recommend` to get job matches
- Display match scores (0-100%) for each job
- Show match explanation ("You have 8/10 required skills")
- Apply user filters (location, salary range, match threshold)
- Sort results by match score

### From Block F: Success Patterns

**What's already built:**
- Career progression analysis
- Salary trend data
- Success metrics for roles
- Career path recommendations

**What this block does:**
- AUGMENT job postings with success pattern insights
- Show average salary for role from success patterns
- Display career progression likelihood
- Show "People in this role typically progress to..."
- Provide context, NOT replace job postings

### From Block J: Match Results UI

**What's already built:**
- React components: JobCard, MatchScore, FilterPanel
- Job detail view with description and requirements
- Save/Apply buttons
- Filter controls (location, salary, match %)

**What this block does:**
- Replace mock data with real API calls
- Connect filters to backend API
- Display real job postings from database
- Show real-time match scores
- Handle save/apply actions
- Track match history

### From Block M: Core Integration

**What this block uses:**
- Authenticated API client (`api.get()`, `api.post()`)
- User context (`useAuth()` hook)
- JWT token in all requests
- Protected routes pattern

---

## Integration Architecture

### API Endpoints

**File:** `backend/app/routes/matching.py`

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.user import User
from ..utils.security import get_current_user_from_token
from ..services.matching_engine import calculate_job_matches
from ..services.success_patterns import get_role_insights

router = APIRouter(prefix="/api/matching", tags=["matching"])

@router.get("/recommend")
def get_job_recommendations(
    location: Optional[str] = None,
    min_salary: Optional[int] = None,
    max_salary: Optional[int] = None,
    min_match: Optional[float] = 0.0,
    limit: int = 20,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Get personalized job recommendations.
    PRIMARY: Real job postings from scraped data.
    SECONDARY: Augment with success pattern insights.
    """
    # Get user skills (from Block N)
    user_skills = db.query(UserSkills)\
        .filter(UserSkills.user_id == current_user.id)\
        .first()

    if not user_skills:
        return {
            "matches": [],
            "message": "Please upload your resume to get recommendations"
        }

    # Get all active job postings (PRIMARY DATA SOURCE)
    jobs = db.query(Job)\
        .filter(Job.is_active == True)\
        .all()

    # Apply filters
    if location:
        jobs = [j for j in jobs if location.lower() in j.location.lower()]
    if min_salary:
        jobs = [j for j in jobs if j.salary_min and j.salary_min >= min_salary]
    if max_salary:
        jobs = [j for j in jobs if j.salary_max and j.salary_max <= max_salary]

    # Calculate match scores for each job (Block E)
    matches = []
    for job in jobs:
        match_data = calculate_job_matches(
            user_skills=user_skills.skills,
            job_requirements=job.required_skills,
            user_location=current_user.location,
            job_location=job.location
        )

        # Filter by minimum match threshold
        if match_data['score'] < min_match:
            continue

        # AUGMENT with success pattern insights (Block F)
        role_insights = get_role_insights(job.title, db)

        matches.append({
            "job_id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "salary_range": f"${job.salary_min}-${job.salary_max}",
            "match_score": match_data['score'],
            "matching_skills": match_data['matching_skills'],
            "missing_skills": match_data['missing_skills'],
            "explanation": match_data['explanation'],
            # SUCCESS PATTERN AUGMENTATION (SECONDARY)
            "insights": {
                "avg_salary": role_insights.get('avg_salary'),
                "progression_rate": role_insights.get('progression_rate'),
                "next_roles": role_insights.get('next_roles', [])
            } if role_insights else None
        })

    # Sort by match score (descending)
    matches.sort(key=lambda x: x['match_score'], reverse=True)

    # Limit results
    matches = matches[:limit]

    return {
        "matches": matches,
        "total_count": len(matches),
        "user_skills_count": len(user_skills.skills)
    }

@router.get("/jobs/{job_id}")
def get_job_details(
    job_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific job posting.
    """
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        return {"error": "Job not found"}

    # Get user skills for match calculation
    user_skills = db.query(UserSkills)\
        .filter(UserSkills.user_id == current_user.id)\
        .first()

    if user_skills:
        match_data = calculate_job_matches(
            user_skills=user_skills.skills,
            job_requirements=job.required_skills
        )
    else:
        match_data = {"score": 0, "matching_skills": [], "missing_skills": job.required_skills}

    # Get success pattern insights
    role_insights = get_role_insights(job.title, db)

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "description": job.description,
        "required_skills": job.required_skills,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "posted_date": job.posted_date,
        "source_url": job.source_url,
        "match_score": match_data['score'],
        "matching_skills": match_data['matching_skills'],
        "missing_skills": match_data['missing_skills'],
        "insights": role_insights
    }

@router.post("/save")
def save_job(
    job_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Save a job to user's saved list.
    """
    saved = SavedJob(
        user_id=current_user.id,
        job_id=job_id,
        saved_at=datetime.utcnow()
    )
    db.add(saved)
    db.commit()

    return {"message": "Job saved successfully"}

@router.post("/apply")
def mark_applied(
    job_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Mark a job as applied.
    """
    application = JobApplication(
        user_id=current_user.id,
        job_id=job_id,
        applied_at=datetime.utcnow(),
        status="applied"
    )
    db.add(application)
    db.commit()

    return {"message": "Application recorded"}

@router.get("/history")
def get_match_history(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Get user's saved jobs and applications.
    """
    saved = db.query(SavedJob)\
        .filter(SavedJob.user_id == current_user.id)\
        .order_by(SavedJob.saved_at.desc())\
        .all()

    applications = db.query(JobApplication)\
        .filter(JobApplication.user_id == current_user.id)\
        .order_by(JobApplication.applied_at.desc())\
        .all()

    return {
        "saved_jobs": [{"job_id": s.job_id, "saved_at": s.saved_at} for s in saved],
        "applications": [{"job_id": a.job_id, "applied_at": a.applied_at, "status": a.status} for a in applications]
    }
```

---

## Data Flow

### Job Matching Flow

```
User Action:
1. User navigates to "Find Jobs" page
2. Optionally sets filters (location, salary, match %)

Frontend (Match Results Page):
1. Load user context (already authenticated)
2. Call: await api.get('/api/matching/recommend', { params: filters })
3. Show loading spinner

Backend:
1. Authenticate user (Block M)
2. Get user skills (Block N - UserSkills table)
3. Query active job postings (Block B - Jobs table) [PRIMARY]
4. Apply filters (location, salary)
5. For each job:
   a. Calculate match score using matching engine (Block E)
   b. Get success pattern insights (Block F) [AUGMENTATION]
6. Sort by match score
7. Return top 20 results

Frontend:
1. Receive matches array
2. Render JobCard components for each match
3. Display match scores (0-100%)
4. Show matching/missing skills
5. Display success pattern insights (if available)
```

### Job Detail View Flow

```
User Action:
1. Click on job card in match results
2. Job detail modal/page opens

Frontend:
1. Call: await api.get(\`/api/matching/jobs/\${jobId}\`)
2. Show loading state

Backend:
1. Fetch job from database
2. Calculate match with user skills
3. Get success pattern insights for role
4. Return detailed job info + match + insights

Frontend:
1. Display full job description
2. Show required skills (highlight matching/missing)
3. Display match explanation
4. Show success pattern insights panel:
   - Average salary for role
   - Career progression likelihood
   - "People in this role typically progress to..."
5. Show Save/Apply buttons
```

### Save/Apply Flow

```
User Action:
1. Click "Save Job" button

Frontend:
1. Call: await api.post('/api/matching/save', { job_id })
2. Show success toast
3. Update button to "Saved ✓"

Backend:
1. Create SavedJob record in database
2. Link to user and job
3. Timestamp

User Action:
1. Click "Apply" button

Frontend:
1. Call: await api.post('/api/matching/apply', { job_id })
2. Show success toast
3. Update button to "Applied ✓"
4. Optionally open job source_url in new tab

Backend:
1. Create JobApplication record
2. Set status to "applied"
3. Timestamp
```

---

## Frontend Integration

### Update Match Results Page

**File:** `frontend/src/pages/MatchResults.tsx`

```typescript
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { JobCard } from '../components/matching/JobCard'
import { FilterPanel } from '../components/matching/FilterPanel'
import { JobDetailModal } from '../components/matching/JobDetailModal'

interface JobMatch {
  job_id: number
  title: string
  company: string
  location: string
  salary_range: string
  match_score: number
  matching_skills: string[]
  missing_skills: string[]
  explanation: string
  insights?: {
    avg_salary: number
    progression_rate: number
    next_roles: string[]
  }
}

export const MatchResults = () => {
  const { user } = useAuth()
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    location: '',
    min_salary: 0,
    max_salary: 500000,
    min_match: 0
  })
  const [selectedJob, setSelectedJob] = useState<number | null>(null)

  useEffect(() => {
    loadMatches()
  }, [filters])

  const loadMatches = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.location) params.append('location', filters.location)
      if (filters.min_salary) params.append('min_salary', filters.min_salary.toString())
      if (filters.max_salary) params.append('max_salary', filters.max_salary.toString())
      if (filters.min_match) params.append('min_match', filters.min_match.toString())

      const data = await api.get(`/api/matching/recommend?${params}`)
      setMatches(data.matches)
    } catch (err) {
      console.error('Failed to load matches:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveJob = async (jobId: number) => {
    try {
      await api.post('/api/matching/save', { job_id: jobId })
      // Show success toast
    } catch (err) {
      console.error('Failed to save job:', err)
    }
  }

  const handleApply = async (jobId: number) => {
    try {
      await api.post('/api/matching/apply', { job_id: jobId })
      // Show success toast
    } catch (err) {
      console.error('Failed to record application:', err)
    }
  }

  if (loading) return <div>Loading job matches...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Job Matches</h1>

      <div className="grid grid-cols-12 gap-8">
        {/* Filters Sidebar */}
        <div className="col-span-3">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>

        {/* Match Results */}
        <div className="col-span-9">
          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match) => (
                <JobCard
                  key={match.job_id}
                  match={match}
                  onViewDetails={() => setSelectedJob(match.job_id)}
                  onSave={() => handleSaveJob(match.job_id)}
                  onApply={() => handleApply(match.job_id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-600 mb-4">
                No matches found
              </p>
              <p className="text-gray-500">
                Try adjusting your filters or update your skills
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          jobId={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSave={handleSaveJob}
          onApply={handleApply}
        />
      )}
    </div>
  )
}
```

---

## Database Schema Updates

**File:** `backend/app/models/saved_job.py`

```python
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    job_id = Column(Integer, ForeignKey('jobs.id'), nullable=False)
    saved_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_jobs")
    job = relationship("Job")

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    job_id = Column(Integer, ForeignKey('jobs.id'), nullable=False)
    applied_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="applied")  # applied, interviewing, offered, rejected

    user = relationship("User", back_populates="applications")
    job = relationship("Job")
```

---

## Testing Strategy

### Backend Tests

**File:** `backend/tests/test_matching_integration.py`

```python
def test_get_recommendations(client, auth_token, user_with_skills, test_jobs):
    response = client.get(
        '/api/matching/recommend',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = response.json()
    assert 'matches' in data
    assert len(data['matches']) > 0
    assert data['matches'][0]['match_score'] >= 0

def test_recommendations_with_filters(client, auth_token):
    response = client.get(
        '/api/matching/recommend?location=New York&min_salary=100000&min_match=0.7',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = response.json()
    for match in data['matches']:
        assert 'New York' in match['location']
        assert match['match_score'] >= 0.7

def test_job_details(client, auth_token, test_job):
    response = client.get(
        f'/api/matching/jobs/{test_job.id}',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = response.json()
    assert data['title'] == test_job.title
    assert 'match_score' in data

def test_save_job(client, auth_token, test_job):
    response = client.post(
        '/api/matching/save',
        json={'job_id': test_job.id},
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
```

---

## Success Criteria

**This block is complete when:**

1. ✅ Users see real job recommendations (from scraped data)
2. ✅ Match scores calculated using matching engine (Block E)
3. ✅ Success patterns augment job data (Block F)
4. ✅ Filters work (location, salary, match %)
5. ✅ Job detail view shows full information
6. ✅ Save/Apply actions work and persist
7. ✅ Match history tracked
8. ✅ All API endpoints require authentication
9. ✅ Loading and error states handled
10. ✅ All tests pass

**Integration Checklist:**
- [ ] Match Results page calls `/api/matching/recommend`
- [ ] Real job postings displayed (not mocks)
- [ ] Match scores accurate and explained
- [ ] Filters update results in real-time
- [ ] Job detail modal shows full information
- [ ] Save/Apply buttons work and update UI
- [ ] Success patterns provide insights (not replace jobs)

---

## References

**Reference Docs:**
- `reference-docs/integration/api-contracts.md` - Matches API contract specification
- `reference-docs/backend/api-reference.md` - Complete matches API endpoint documentation
- `reference-docs/architecture/data-flow.md` - Job matching flow diagram
- `reference-docs/frontend/state-management.md` - React Query patterns for matches

**Related Step 2 Blocks:**
- `BLOCK-E-MATCHING-ENGINE/CONTEXT.md` - Matching algorithm
- `BLOCK-F-SUCCESS-PATTERNS/CONTEXT.md` - Career insights
- `BLOCK-J-MATCH-RESULTS/CONTEXT.md` - Frontend UI

**Related Step 3 Blocks:**
- `BLOCK-M-CORE-INTEGRATION/CONTEXT.md` - Authentication
- `BLOCK-N-SKILLS-INTEGRATION/CONTEXT.md` - User skills

---

**Last Updated:** 2026-01-06
**Status:** Ready for development
**Blocking:** Block Q (E2E Testing)
**Blocked by:** Block M (Core Integration)
