# BLOCK N: Skills Integration - CONTEXT

**Block ID:** BLOCK-N-SKILLS-INTEGRATION
**Phase:** STEP-3-INTEGRATION
**Category:** #integration #frontend #backend
**Estimated Time:** 1-2 days
**Dependencies:** STEP-2: Block D (Vector Embeddings), Block G (Skill Extraction), Block I (Skills Dashboard UI); STEP-3: Block M (Core Integration)

---

## AI Quick Start Prompt

```
You are working on BLOCK-N: Skills Integration for SpringAIS.

Goal: Connect skills dashboard UI to skill extraction pipeline and vector embeddings for real-time skill analysis and gap detection.

Key constraints:
- Replace mock skills data with real AI extraction from resumes
- Connect to vector embeddings for similarity search
- Enable real-time skill gap analysis
- Persist user skill profiles to database
- All API calls must use authenticated endpoints (Block M)

Read TASKS.md for implementation steps.
Read VERIFICATION.md for integration testing.
```

---

## Purpose

Connect the skills dashboard frontend to the AI-powered skill extraction backend, enabling users to extract skills from resumes, analyze skill gaps, and receive personalized skill recommendations.

## Auth Requirement (Block M)

- All endpoints in this block require JWT authentication.
- Frontend must use the shared API client (`frontend/src/services/api.ts`) which injects `Authorization: Bearer <token>`.
- Do not call `/api/skills/*` directly without the token.

**Why this matters:**
- Block I (Skills Dashboard) has UI components but uses mock data
- Block G (Skill Extraction) has AI pipeline but no user interface
- Block D (Vector Embeddings) has similarity engine but no integration
- Users need to see their actual extracted skills, not fake data
- Skill gap analysis requires real job market data

**Success outcome:**
- Users upload resume → AI extracts skills → displayed in dashboard
- Real-time skill gap analysis (user skills vs job requirements)
- Skill similarity search using vector embeddings
- User skill profiles persisted in database
- Skills update as user uploads new resumes

---

## What This Block Integrates

### From Block D: Vector Embeddings

**What's already built:**
- OpenAI `text-embedding-3-large` embeddings for skills (3072 dims)
- PCA dimensionality reduction (3072 → 1536) for pgvector compatibility
- Two-layer Redis caching (exact match + semantic text-proxy layer)
- Database persistence + pgvector similarity search are completed in Step 3 (Block R)

**What this block does:**
- Call `/api/embeddings/similarity` to find related skills
- Use embeddings for skill gap analysis (compare user skills to job requirements)
- Display skill clusters on dashboard (e.g., "Python → ML → TensorFlow")
- Show similarity scores for recommended skills

### From Block G: Skill Extraction

**What's already built:**
- GPT-5 nano skill extraction from resumes (PDF, DOCX, TXT)
- Skill categorization (technical, soft, domain)
- Proficiency level inference
- Years of experience extraction

**What this block does:**
- Connect UI to:
  - `POST /api/skills/upload` (file upload: PDF/DOCX/TXT)
  - `POST /api/skills/extract` (raw text input)
- Display extracted skills in dashboard cards
- Show skill categories (Technical, Soft, Domain)
- Display proficiency levels and experience

### From Block I: Skills Dashboard UI

**What's already built:**
- React components: SkillCard, SkillGapChart, RecommendationPanel
- Resume upload interface
- Skill filtering and search
- Responsive dashboard layout

**What this block does:**
- Replace mock data with real API calls
- Connect upload button to skill extraction API
- Display real-time extraction results
- Show loading states during processing
- Handle errors (invalid file, extraction failure)

### From Block M: Core Integration

**What this block uses:**
- Authenticated API client (`api.get()`, `api.post()`)
- User context (`useAuth()` hook)
- JWT token in all requests
- Protected routes pattern

---

## Integration Architecture

### API Endpoints

**File:** `backend/app/routes/skills.py`

> Note: The code blocks below are illustrative. The implemented Step 2 API already includes:
> - `POST /api/skills/extract` (raw text input)
> - `POST /api/skills/upload` (file upload)
> See the actual implementation in `backend/app/routes/skills.py`.

```python
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..utils.security import get_current_user_from_token
from ..services.skill_extraction import extract_skills_from_resume
from ..services.embeddings import find_similar_skills, calculate_skill_gap

router = APIRouter(prefix="/api/skills", tags=["skills"])

@router.post("/extract")
async def extract_skills(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Extract skills from uploaded resume (PDF, DOCX, TXT).
    Calls GPT-4 for extraction, stores in database.
    """
    # Read file content
    content = await file.read()

    # Extract skills using GPT-4 (from Block G)
    extracted = await extract_skills_from_resume(content, file.filename)

    # Store user skills in database
    user_skills = UserSkills(
        user_id=current_user.id,
        skills=extracted['skills'],
        technical_skills=extracted['technical'],
        soft_skills=extracted['soft'],
        domain_skills=extracted['domain'],
        extracted_at=datetime.utcnow()
    )
    db.add(user_skills)
    db.commit()

    return {
        "skills": extracted['skills'],
        "categories": {
            "technical": extracted['technical'],
            "soft": extracted['soft'],
            "domain": extracted['domain']
        },
        "total_count": len(extracted['skills'])
    }

@router.get("/")
def get_user_skills(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Get current user's extracted skills.
    """
    user_skills = db.query(UserSkills)\
        .filter(UserSkills.user_id == current_user.id)\
        .order_by(UserSkills.extracted_at.desc())\
        .first()

    if not user_skills:
        return {"skills": [], "categories": {}}

    return {
        "skills": user_skills.skills,
        "categories": {
            "technical": user_skills.technical_skills,
            "soft": user_skills.soft_skills,
            "domain": user_skills.domain_skills
        },
        "extracted_at": user_skills.extracted_at
    }

@router.get("/gap-analysis")
def analyze_skill_gaps(
    job_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Compare user skills to job requirements, identify gaps.
    """
    # Get user skills
    user_skills = db.query(UserSkills)\
        .filter(UserSkills.user_id == current_user.id)\
        .first()

    # Get job requirements
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job or not user_skills:
        return {"error": "Job or user skills not found"}

    # Calculate gap using vector embeddings (Block D)
    gap_analysis = calculate_skill_gap(
        user_skills.skills,
        job.required_skills
    )

    return {
        "matching_skills": gap_analysis['matches'],
        "missing_skills": gap_analysis['gaps'],
        "match_percentage": gap_analysis['score'],
        "recommendations": gap_analysis['recommended_skills']
    }

@router.get("/similar")
def find_similar_skills_api(
    skill: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Find similar skills using vector embeddings.
    """
    similar = find_similar_skills(skill, limit=limit, db=db)

    return {
        "query_skill": skill,
        "similar_skills": [
            {
                "skill": s['skill'],
                "similarity_score": s['score'],
                "category": s['category']
            }
            for s in similar
        ]
    }
```

---

## Data Flow

### Resume Upload → Skill Extraction

```
User Action:
1. User clicks "Upload Resume" in Skills Dashboard
2. Selects PDF/DOCX file
3. Clicks "Extract Skills"

Frontend (Skills Dashboard):
1. ResumeUpload component captures file
2. Shows loading spinner
3. Calls: await api.post('/api/skills/extract', formData)

Backend:
1. Receives file upload
2. Parses resume (PDF/DOCX → text)
3. Calls GPT-5 nano: "Extract skills from this resume: {text}"
4. GPT-5 nano returns structured JSON skills list (validated + normalized)
5. Stores in UserSkills table
6. Returns extracted skills

Frontend:
1. Receives skills JSON
2. Updates dashboard state
3. Renders SkillCard components for each skill
4. Shows skill categories (Technical, Soft, Domain)
5. Displays proficiency levels
```

### Skill Gap Analysis

```
User Action:
1. User views job posting in Match Results
2. Clicks "Analyze Skill Gap" button

Frontend:
1. Calls: await api.get(`/api/skills/gap-analysis?job_id=${jobId}`)

Backend:
1. Fetch user skills from UserSkills table
2. Fetch job requirements from Job table
3. Generate embeddings for both skill sets (Block D)
4. Calculate cosine similarity
5. Identify matching skills (similarity > 0.8)
6. Identify missing skills (required but user doesn't have)
7. Recommend learning resources

Frontend:
1. Receives gap analysis JSON
2. Renders SkillGapChart component
3. Shows matching skills (green)
4. Shows missing skills (red)
5. Displays match percentage
6. Shows recommendations panel
```

### Skill Similarity Search

```
User Action:
1. User clicks on a skill (e.g., "Python")
2. Dashboard shows "Related Skills" panel

Frontend:
1. Calls: await api.get(`/api/skills/similar?skill=Python&limit=10`)

Backend:
1. Get embedding for "Python" (Block D)
2. Query vector database for similar embeddings
3. Return top 10 similar skills with scores

Frontend:
1. Displays related skills as clickable tags
2. Shows similarity scores (e.g., "TensorFlow - 92% similar")
3. User can add related skills to profile
```

---

## Frontend Integration

### Update Skills Dashboard Page

**File:** `frontend/src/pages/SkillsDashboard.tsx`

```typescript
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { SkillCard } from '../components/skills/SkillCard'
import { SkillGapChart } from '../components/skills/SkillGapChart'
import { ResumeUpload } from '../components/skills/ResumeUpload'

interface UserSkills {
  skills: string[]
  categories: {
    technical: string[]
    soft: string[]
    domain: string[]
  }
  extracted_at?: string
}

export const SkillsDashboard = () => {
  const { user } = useAuth()
  const [skills, setSkills] = useState<UserSkills | null>(null)
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUserSkills()
  }, [])

  const loadUserSkills = async () => {
    try {
      const data = await api.get('/api/skills/')
      setSkills(data)
    } catch (err) {
      setError('Failed to load skills')
    } finally {
      setLoading(false)
    }
  }

  const handleResumeUpload = async (file: File) => {
    setExtracting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/api/skills/extract', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Extraction failed')
      }

      const data = await response.json()
      setSkills(data)
    } catch (err) {
      setError('Failed to extract skills from resume')
    } finally {
      setExtracting(false)
    }
  }

  if (loading) return <div>Loading skills...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Skills</h1>

      {/* Resume Upload Section */}
      <div className="mb-8">
        <ResumeUpload
          onUpload={handleResumeUpload}
          loading={extracting}
        />
        {extracting && (
          <div className="mt-4 text-blue-600">
            Extracting skills from your resume...
          </div>
        )}
        {error && (
          <div className="mt-4 text-red-600">{error}</div>
        )}
      </div>

      {/* Skills Display */}
      {skills && skills.skills.length > 0 ? (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Technical Skills ({skills.categories.technical.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {skills.categories.technical.map((skill, idx) => (
                <SkillCard key={idx} skill={skill} category="technical" />
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Soft Skills ({skills.categories.soft.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {skills.categories.soft.map((skill, idx) => (
                <SkillCard key={idx} skill={skill} category="soft" />
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Domain Skills ({skills.categories.domain.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {skills.categories.domain.map((skill, idx) => (
                <SkillCard key={idx} skill={skill} category="domain" />
              ))}
            </div>
          </div>

          {skills.extracted_at && (
            <p className="text-sm text-gray-500">
              Last updated: {new Date(skills.extracted_at).toLocaleDateString()}
            </p>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-lg text-gray-600 mb-4">
            No skills extracted yet
          </p>
          <p className="text-gray-500">
            Upload your resume to get started!
          </p>
        </div>
      )}
    </div>
  )
}
```

### Update Resume Upload Component

**File:** `frontend/src/components/skills/ResumeUpload.tsx`

```typescript
import { useState } from 'react'

interface ResumeUploadProps {
  onUpload: (file: File) => void
  loading: boolean
}

export const ResumeUpload = ({ onUpload, loading }: ResumeUploadProps) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isValidFileType(file)) {
        setSelectedFile(file)
        onUpload(file)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isValidFileType(file)) {
        setSelectedFile(file)
        onUpload(file)
      }
    }
  }

  const isValidFileType = (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    return validTypes.includes(file.type)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="resume-upload"
        accept=".pdf,.docx,.txt"
        onChange={handleChange}
        className="hidden"
        disabled={loading}
      />

      <label htmlFor="resume-upload" className="cursor-pointer">
        <div className="text-4xl mb-4">📄</div>
        <p className="text-lg font-semibold mb-2">
          {selectedFile ? selectedFile.name : 'Upload Resume'}
        </p>
        <p className="text-sm text-gray-600">
          Drag and drop or click to browse
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Supports PDF, DOCX, TXT
        </p>
      </label>
    </div>
  )
}
```

---

## Database Schema Updates

**File:** `backend/app/models/user_skills.py`

```python
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class UserSkills(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    skills = Column(JSON, nullable=False)  # All skills as array
    technical_skills = Column(JSON, nullable=False)  # Technical skills
    soft_skills = Column(JSON, nullable=False)  # Soft skills
    domain_skills = Column(JSON, nullable=False)  # Domain skills
    extracted_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="skills")
```

---

## Testing Strategy

### Backend Tests

**File:** `backend/tests/test_skills_integration.py`

```python
def test_extract_skills_from_resume(client, auth_token, sample_resume_pdf):
    response = client.post(
        '/api/skills/extract',
        files={'file': ('resume.pdf', sample_resume_pdf, 'application/pdf')},
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = response.json()
    assert 'skills' in data
    assert 'categories' in data
    assert len(data['skills']) > 0

def test_get_user_skills(client, auth_token, user_with_skills):
    response = client.get(
        '/api/skills/',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = response.json()
    assert 'skills' in data
    assert 'categories' in data

def test_skill_gap_analysis(client, auth_token, user_with_skills, test_job):
    response = client.get(
        f'/api/skills/gap-analysis?job_id={test_job.id}',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = response.json()
    assert 'matching_skills' in data
    assert 'missing_skills' in data
    assert 'match_percentage' in data

def test_find_similar_skills(client, auth_token):
    response = client.get(
        '/api/skills/similar?skill=Python&limit=5',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    data = response.json()
    assert 'similar_skills' in data
    assert len(data['similar_skills']) <= 5
```

---

## Success Criteria

**This block is complete when:**

1. ✅ Users can upload resume (PDF/DOCX/TXT) via dashboard
2. ✅ Skills extracted using GPT-5 nano (Block G) and displayed
3. ✅ Skills categorized into Technical, Soft, Domain
4. ✅ User skills persisted in database (UserSkills table)
5. ✅ Skill gap analysis works for job postings
6. ✅ Vector similarity search returns related skills
7. ✅ All API endpoints require authentication (Block M)
8. ✅ Loading states during extraction
9. ✅ Error handling for invalid files
10. ✅ All tests pass (backend + frontend)

**Integration Checklist:**
- [ ] Skills Dashboard calls `/api/skills/extract` with real files
- [ ] Extracted skills saved to database and displayed
- [ ] Skill gap analysis compares user skills to job requirements
- [ ] Vector embeddings used for similarity search
- [ ] Authentication required for all skill endpoints
- [ ] Resume upload supports PDF, DOCX, TXT formats
- [ ] Skills update when new resume uploaded

---

## References

**Related Step 2 Blocks:**
- `BLOCK-D-VECTOR-EMBEDDINGS/CONTEXT.md` - Similarity search
- `BLOCK-G-SKILL-EXTRACTION/CONTEXT.md` - GPT-5 nano extraction
- `BLOCK-I-SKILLS-DASHBOARD/CONTEXT.md` - Frontend UI

**Related Step 3 Blocks:**
- `BLOCK-M-CORE-INTEGRATION/CONTEXT.md` - Authentication pattern

**Technology Docs:**
- FastAPI File Uploads: https://fastapi.tiangolo.com/tutorial/request-files/
- OpenAI embeddings: https://platform.openai.com/docs/guides/embeddings
- React File Upload: https://developer.mozilla.org/en-US/docs/Web/API/File_API

---

**Last Updated:** 2026-01-06
**Status:** Ready for development
**Blocking:** Block Q (E2E Testing)
**Blocked by:** Block M (Core Integration)
