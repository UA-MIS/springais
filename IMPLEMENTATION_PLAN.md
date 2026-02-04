# SpringAIS Implementation Plan

---

# NEW: Skills System Bug Fixes (2026-02-02)

## Summary of New Issues

| # | Issue | Root Cause | Priority |
|---|-------|------------|----------|
| 1 | Modules show "0 of 4" on first load | Modules not created until user clicks "Start" | HIGH |
| 2 | Resume skills marked proficiency 0 | `start_skill()` returns early for existing skills | HIGH |
| 3 | Proficiency update doesn't visually update | Modal not refreshing parent state properly | MEDIUM |
| 4 | Start button does nothing | Modules don't exist in DB yet | HIGH |
| 5 | No submit button for tasks | Task tracking not implemented | MEDIUM |
| 6 | Learning plans disappear on page exit | Content saved but modules may not exist | HIGH |
| 7 | Plans should be shareable across accounts | Need to ensure content persists and is reused | MEDIUM |
| 8 | Module completion vs proficiency unclear | Need better UI feedback | LOW |

---

## Issue 1 & 4: Modules Not Created / Start Button Does Nothing

### Root Cause
When skills are created via resume upload, `UserSkill` records are created but `SkillModule` and `UserModuleProgress` records are NOT created until `start_skill()` is called AND only if the skill doesn't already exist.

The `start_skill()` method returns early if the skill exists:
```python
existing = self.db.query(UserSkill).filter(...).first()
if existing:
    return existing  # Returns WITHOUT creating modules!
```

### Solution
Modify `start_skill()` to ALWAYS ensure modules exist:

**File:** `backend/app/services/skill_progress_service.py`

```python
def start_skill(
    self,
    user_id: UUID,
    skill_name: str,
    source: str = "manual",
    initial_proficiency: int = 0,
    auto_commit: bool = True,
) -> UserSkill:
    existing = self.db.query(UserSkill).filter(
        UserSkill.user_id == user_id,
        UserSkill.skill_name == skill_name,
    ).first()

    if existing:
        # STILL ensure modules exist even for existing skills
        skill_type = self._determine_skill_type(skill_name)
        modules = self._ensure_modules_exist(skill_name, skill_type)

        # Create UserModuleProgress for any missing modules
        existing_module_ids = {p.module_id for p in self._get_module_progress(existing.id)}
        for module in modules:
            if module.id not in existing_module_ids:
                progress = UserModuleProgress(
                    user_skill_id=existing.id,
                    module_id=module.id,
                    status="not_started",
                )
                self.db.add(progress)

        if auto_commit:
            self.db.commit()
        return existing

    # ... rest of existing code for new skills
```

---

## Issue 2: Resume Skills Marked as Proficiency 0

### Root Cause
Two potential issues:
1. Skills may already exist from another code path with proficiency 0
2. The `start_skill()` method returns early for existing skills without updating proficiency

### Solution
Add ability to update proficiency for existing skills:

**File:** `backend/app/services/skill_progress_service.py`

```python
def start_skill(
    self,
    user_id: UUID,
    skill_name: str,
    source: str = "manual",
    initial_proficiency: int = 0,
    auto_commit: bool = True,
) -> UserSkill:
    existing = self.db.query(UserSkill).filter(
        UserSkill.user_id == user_id,
        UserSkill.skill_name == skill_name,
    ).first()

    if existing:
        # If new proficiency is higher (e.g., resume says proficient), update it
        if initial_proficiency > existing.proficiency_level:
            existing.proficiency_level = initial_proficiency
            existing.last_updated_at = datetime.now(timezone.utc)
            self._sync_skill_to_profile(user_id, skill_name, initial_proficiency)

        # Ensure modules exist (from Issue 1 fix)
        skill_type = self._determine_skill_type(skill_name)
        modules = self._ensure_modules_exist(skill_name, skill_type)
        # ... create missing progress records

        if auto_commit:
            self.db.commit()
        return existing
```

Also add debug logging to verify source parameter:

**File:** `backend/app/routes/skills.py`

```python
@router.post("/group")
async def group_skills(request: SkillGroupingRequest, ...):
    logger.info(f"GROUP SKILLS: source={request.source}, skills={request.skills[:3]}...")
    initial_proficiency = 3 if request.source == "resume" else 0
    logger.info(f"Setting initial_proficiency={initial_proficiency}")
    # ...
```

---

## Issue 3: Proficiency Update Doesn't Visually Update

### Root Cause
`handleProficiencyChange` calls `onRefresh?.()` but the local state (`proficiencyLevel`) is derived from the original `skill` prop, not from `editedSkill` or refreshed data.

### Solution
Update local state immediately and ensure proper refresh:

**File:** `frontend/src/components/skills/SkillDetailModal.jsx`

```javascript
const handleProficiencyChange = async (newLevel) => {
  setProficiencyUpdating(true);
  try {
    const result = await updateProficiency(skill.name, newLevel);
    // Update editedSkill state for immediate visual feedback
    setEditedSkill(prev => ({
      ...prev,
      proficiency_level: result.proficiency_level,
      proficiency_label: PROFICIENCY_LABELS[result.proficiency_level],
      counts_for_matching: result.counts_for_matching,
    }));
    // Refresh parent data
    onRefresh?.();
  } catch (error) {
    console.error('Failed to update proficiency:', error);
  } finally {
    setProficiencyUpdating(false);
  }
};

// Update proficiencyLevel to use editedSkill state
const proficiencyLevel = editedSkill.proficiency_level ?? skill.proficiency_level ?? 0;
```

---

## Issue 5: No Submit Button for Tasks

### Current State
Modules have practice_exercises but no way to track individual task completion.

### Solution
Add task tracking with checkboxes:

**Database Migration:**
```python
# Add tasks_completed column to user_module_progress
op.add_column('user_module_progress',
    sa.Column('tasks_completed', postgresql.JSONB, server_default='[]')
)
```

**Backend Endpoint:**
```python
@router.patch("/{skill_name}/modules/{module_id}/tasks")
async def toggle_task(
    skill_name: str,
    module_id: str,
    task_index: int = Body(...),
    completed: bool = Body(...),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Toggle task completion within a module."""
    progress = get_module_progress(...)
    tasks = progress.tasks_completed or []

    if completed and task_index not in tasks:
        tasks.append(task_index)
    elif not completed and task_index in tasks:
        tasks.remove(task_index)

    progress.tasks_completed = tasks

    # Update progress_percentage based on tasks completed
    total_tasks = len(content.practice_exercises)  # Need to get from module
    progress.progress_percentage = int(len(tasks) / total_tasks * 100) if total_tasks else 0

    db.commit()
    return {"tasks_completed": tasks, "progress": progress.progress_percentage}
```

**Frontend UI:**
```jsx
{content.practice_exercises?.map((exercise, idx) => (
  <label key={idx} className="flex items-start gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={tasksCompleted.includes(idx)}
      onChange={() => handleToggleTask(module.id, idx)}
      className="mt-1 rounded"
    />
    <span className={tasksCompleted.includes(idx) ? 'line-through opacity-60' : ''}>
      {exercise}
    </span>
  </label>
))}
```

---

## Issue 6: Learning Plans Disappear on Page Exit

### Root Cause
Learning content IS saved to `SkillModule` table, but:
1. Modules may not exist when "Generate" is clicked
2. Frontend checks `module.learning_content` but modules array may be empty

### Solution

1. **Ensure modules exist before generating content:**
```python
@router.post("/{skill_name}/modules/{module_id}/generate-content")
async def generate_module_content(...):
    module = db.query(SkillModule).filter(SkillModule.id == UUID(module_id)).first()
    if not module:
        raise HTTPException(404, "Module not found. Please refresh the page.")

    # Return existing content if already generated
    if module.learning_content:
        return {
            "learning_guide": module.learning_content,
            "external_resources": module.external_resources or [],
            "ey_resources": module.ey_resources or [],
            "practice_exercises": [],
            "success_criteria": [],
        }

    # Generate new content and save SYNCHRONOUSLY (not background)
    content = await generate_module_learning_content(...)
    module.learning_content = content.get("learning_guide", "")
    module.external_resources = content.get("external_resources", [])
    module.ey_resources = content.get("ey_resources", [])
    db.commit()  # Synchronous commit

    return content
```

2. **Pre-load content from module data in frontend:**
```javascript
// In SkillDetailModal, initialize moduleContent from existing module data
useEffect(() => {
  const initialContent = {};
  (skill?.modules || []).forEach(module => {
    if (module.learning_content) {
      initialContent[module.id] = {
        learning_guide: module.learning_content,
        external_resources: module.external_resources || [],
        ey_resources: module.ey_resources || [],
      };
    }
  });
  setModuleContent(initialContent);
}, [skill]);
```

---

## Issue 7: Plans Should Be Shareable Across Accounts

### Current State
`SkillModule` is already shared across users (not user-specific). The `learning_content`, `external_resources`, and `ey_resources` are stored at the module level.

### Potential Issue
Module lookup might not be finding existing modules due to case sensitivity.

### Solution
Use case-insensitive lookup:

```python
def _get_skill_modules(self, skill_name: str) -> List[SkillModule]:
    return self.db.query(SkillModule).filter(
        func.lower(SkillModule.skill_name) == skill_name.lower()
    ).order_by(SkillModule.sequence_order).all()
```

---

## Issue 8: Module Completion vs Proficiency Correlation

### Current Logic
```
0-20% module avg = proficiency 1
20-40% = proficiency 2
40-60% = proficiency 3
60-80% = proficiency 4
80-100% = proficiency 5
```

### Solution
Add UI feedback showing impact:

```jsx
{module.status === 'in_progress' && (
  <p className="text-xs text-gray-500 mt-1">
    Completing this module will increase proficiency to Level {getPredictedProficiency()}
  </p>
)}
```

---

## Implementation Priority

### Phase 1 (Critical - Fix Core Bugs)
1. **Issue 1 + 4:** Module creation fix in `start_skill()`
2. **Issue 2:** Proficiency update for existing skills + logging
3. **Issue 6:** Synchronous content save + frontend pre-load

### Phase 2 (Important - UX)
4. **Issue 3:** Proficiency visual update fix
5. **Issue 7:** Case-insensitive module lookup

### Phase 3 (Enhancement)
6. **Issue 5:** Task tracking implementation
7. **Issue 8:** Proficiency prediction UI

---

## Files to Modify

### Backend
- `backend/app/services/skill_progress_service.py` - Module creation, proficiency update
- `backend/app/routes/skills.py` - Logging, sync content save, task endpoint
- `backend/app/models/skill_progress.py` - Add tasks_completed field

### Frontend
- `frontend/src/components/skills/SkillDetailModal.jsx` - Visual refresh, task UI, content preload

### Database Migration Needed
- Add `tasks_completed JSONB` column to `user_module_progress` table

---
---

# PREVIOUS: Original Implementation Plan

## Overview

This plan addresses three major issues identified in the system:
1. **Skill Matching Too Strict** - Users aren't matched with obviously relevant roles
2. **No Deep Analysis Feature** - Need comprehensive person-to-role analysis
3. **My Skills Page Broken** - Mock data, wrong categories, prepopulated skills persist

---

## Task Dependency Graph

```
[Task 1: Matching Thresholds] ──────────────────────────────┐
[Task 2: Deep Analysis GPT-5.2] ───────────────────────────┤
[Task 3: Skills State Management] ─────────────────────────┤──> Can run in parallel
[Task 4: Skill Categorization] ────────────────────────────┤
[Task 5: Module DB Schema] ────────────────────────────────┘
        │
        ▼
[Task 6: Module API Endpoints] (blocked by Task 5)
        │
        ▼
[Task 7: Frontend Module Tracking] (blocked by Tasks 5, 6)
```

**Parallelization Strategy:**
- Tasks 1, 2, 3, 4, 5 can all run in parallel
- Task 6 must wait for Task 5
- Task 7 must wait for Tasks 5 and 6

---

## Task 1: Fix Skill Matching Thresholds

### Problem
- BEST_FIT requires 90% skill match (too strict)
- Gap similarity threshold is 0.70 (misses related skills)
- "LLM integration" doesn't match "langchain"
- "vendor management" doesn't match "project management"

### Changes

#### 1.1 `backend/app/config/matching_config.py`

```python
# BEFORE (line 65-68)
MatchMode.BEST_FIT: SkillMatchThreshold(
    min_score=0.90,
    max_score=1.0,
)

# AFTER
MatchMode.BEST_FIT: SkillMatchThreshold(
    min_score=0.70,  # Lowered from 0.90
    max_score=1.0,
)

# Also adjust STRETCH (lines 69-72)
MatchMode.STRETCH: SkillMatchThreshold(
    min_score=0.55,  # Lowered from 0.70
    max_score=0.75,  # Lowered from 0.85
)

# And EXPLORATORY (lines 73-76)
MatchMode.EXPLORATORY: SkillMatchThreshold(
    min_score=0.0,
    max_score=0.55,  # Lowered from 0.70
)
```

#### 1.2 `backend/app/services/matching_service.py`

```python
# Line 509: Lower gap similarity threshold
# BEFORE
if similarity > 0.7 and emp_skill not in transferable:

# AFTER
if similarity > 0.55 and emp_skill not in transferable:

# Lines 321-322: Add fuzzy fallback
# BEFORE
if not employee_embeddings:
    return self._exact_skill_match_score(employee.skills, required_skills)

# AFTER
if not employee_embeddings:
    # Try token overlap matching first
    fuzzy_score = self._fuzzy_token_match_score(employee.skills, required_skills)
    if fuzzy_score > 0.3:
        return fuzzy_score
    return self._exact_skill_match_score(employee.skills, required_skills)

# Add new method after line 609:
def _fuzzy_token_match_score(self, employee_skills: List[str], job_skills: List[str]) -> float:
    """Token overlap matching for skills without embeddings."""
    if not job_skills:
        return 1.0

    scores = []
    for job_skill in job_skills:
        job_tokens = set(job_skill.lower().split())
        best_overlap = 0.0

        for emp_skill in employee_skills:
            emp_tokens = set(emp_skill.lower().split())
            if not job_tokens or not emp_tokens:
                continue
            intersection = job_tokens & emp_tokens
            union = job_tokens | emp_tokens
            jaccard = len(intersection) / len(union) if union else 0
            best_overlap = max(best_overlap, jaccard)

        scores.append(best_overlap)

    return sum(scores) / len(scores) if scores else 0.0
```

#### 1.3 `backend/app/models/skill_taxonomy.py`

Add comprehensive aliases to SEED_SKILLS:

```python
# Soft skill aliases
{"canonical_name": "Project Management", "category": "domain",
 "aliases": ["project management", "PM", "Project Manager",
             "vendor management", "stakeholder management",
             "program management", "program coordination",
             "project coordination", "initiative management"]},

{"canonical_name": "Communication", "category": "soft",
 "aliases": ["communication", "Communication Skills",
             "client engagement", "stakeholder engagement",
             "cross-functional collaboration", "interpersonal skills",
             "verbal communication", "written communication"]},

{"canonical_name": "Team Leadership", "category": "soft",
 "aliases": ["team leadership", "mentoring", "coaching",
             "people management", "team management", "leading teams"]},

# Technical aliases
{"canonical_name": "REST API", "category": "technical",
 "aliases": ["REST", "RESTful", "RESTful API", "REST APIs",
             "API Development", "Web APIs", "HTTP APIs"]},

{"canonical_name": "LLM Development", "category": "technical",
 "aliases": ["LLM", "LLM integration", "langchain", "LangChain",
             "large language models", "GPT integration", "AI integration",
             "prompt engineering", "RAG", "retrieval augmented generation"]},
```

---

## Task 2: Build Deep Analysis Service with GPT-5.2

### GPT-5.2 Details
- **Model ID:** `gpt-5.2`
- **Context:** 400,000 tokens
- **Max output:** 128,000 tokens
- **Key parameter:** `reasoning_effort` (none/low/medium/high/xhigh)
- **Pricing:** $1.75/1M input, $14/1M output

### Changes

#### 2.1 Create `backend/app/schemas/analysis.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class ImportanceLevel(str, Enum):
    CRITICAL = "critical"
    IMPORTANT = "important"
    NICE_TO_HAVE = "nice_to_have"

class GapSeverity(str, Enum):
    NONE = "none"
    MINOR = "minor"
    MODERATE = "moderate"
    MAJOR = "major"

class SkillImpactAnalysis(BaseModel):
    skill_name: str
    importance_level: ImportanceLevel
    why_it_matters: str
    current_proficiency: Optional[str] = None
    required_proficiency: str
    gap_severity: GapSeverity
    learning_estimate: Optional[str] = None  # e.g., "2-4 weeks"

class ComplexAnalysis(BaseModel):
    # Narrative sections
    overall_fit_narrative: str = Field(..., description="2-3 paragraph analysis")
    growth_opportunity: str
    transition_reasoning: str

    # Structured analysis
    matched_skill_impacts: List[SkillImpactAnalysis]
    gap_impacts: List[SkillImpactAnalysis]

    # Actionable insights
    critical_success_factors: List[str] = Field(..., max_items=5)
    risk_factors: List[str] = Field(..., max_items=5)

    # Timeline and comparison
    estimated_ramp_up: str  # e.g., "3-6 months"
    comparable_roles: List[str]

    # Resources
    recommended_learning_path: List[str]
```

#### 2.2 Create `backend/app/services/analysis_service.py`

```python
import logging
from typing import Optional
from openai import AsyncOpenAI
from sqlalchemy.orm import Session

from app.config import get_openai_client
from app.models.user_profile import UserProfile
from app.models.job_posting import JobPosting
from app.schemas.analysis import ComplexAnalysis, SkillImpactAnalysis
from app.services.matching_service import MatchingService

logger = logging.getLogger(__name__)

ANALYSIS_PROMPT = """You are an expert career advisor analyzing job fit.

## Candidate Profile
- Current Role: {current_role}
- Years Experience: {years_experience}
- Skills: {user_skills}
- Resume Summary: {resume_excerpt}

## Target Role
- Title: {job_title}
- Department: {service_line}
- Required Skills: {required_skills}
- Preferred Skills: {preferred_skills}
- Job Description: {job_description}

## Match Scores
- Overall: {overall_score}%
- Skill Match: {skill_score}%
- Experience Match: {exp_score}%
- Growth Potential: {growth_score}%

## Skill Gap Analysis
- Matched Skills: {matched_skills}
- Missing Skills: {missing_skills}
- Transferable Skills: {transferable_skills}

---

Provide a comprehensive analysis in JSON format with these fields:
1. overall_fit_narrative: 2-3 paragraphs explaining the fit
2. growth_opportunity: Why this role helps career growth
3. transition_reasoning: Why now is a good time for this move
4. matched_skill_impacts: Array of {{skill_name, importance_level, why_it_matters, gap_severity}}
5. gap_impacts: Array of {{skill_name, importance_level, why_it_matters, gap_severity, learning_estimate}}
6. critical_success_factors: Top 3-5 things to focus on
7. risk_factors: Potential challenges (max 5)
8. estimated_ramp_up: Time to full productivity
9. comparable_roles: Similar positions to consider
10. recommended_learning_path: Ordered list of skills to develop

Be specific, actionable, and realistic. Consider the candidate's background when assessing gaps."""


class DeepAnalysisService:
    def __init__(self, db: Session):
        self.db = db
        self.openai = get_openai_client()

    async def analyze_candidate_job_fit(
        self,
        user: UserProfile,
        job_id: str,
    ) -> ComplexAnalysis:
        """Generate comprehensive analysis using GPT-5.2."""

        # Get job posting
        job = self.db.query(JobPosting).filter(JobPosting.id == job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} not found")

        # Get match details
        matching_service = MatchingService(
            db=self.db,
            user_profile=user,
        )
        match_detail = matching_service.get_detailed_match(
            employee_id=1,  # Will use user_profile
            job_id=job_id,
        )

        # Build prompt context
        prompt = ANALYSIS_PROMPT.format(
            current_role=user.current_role or "Not specified",
            years_experience=user.years_experience or "Not specified",
            user_skills=", ".join(user.skills or []),
            resume_excerpt=(user.resume_text or "")[:2000],
            job_title=job.title,
            service_line=job.service_line,
            required_skills=", ".join(match_detail.required_skills or []),
            preferred_skills=", ".join(match_detail.preferred_skills or []),
            job_description=(job.description or "")[:3000],
            overall_score=round(match_detail.scores.overall * 100),
            skill_score=round(match_detail.scores.skill_match * 100),
            exp_score=round(match_detail.scores.experience_match * 100),
            growth_score=round(match_detail.scores.growth_potential * 100),
            matched_skills=", ".join(match_detail.gap_analysis.overlapping_skills or []),
            missing_skills=", ".join(match_detail.gap_analysis.missing_skills or []),
            transferable_skills=", ".join(match_detail.gap_analysis.transferable_skills or []),
        )

        # Call GPT-5.2 with reasoning
        response = await self.openai.chat.completions.create(
            model="gpt-5.2",
            messages=[
                {"role": "system", "content": "You are a career advisor. Respond only in valid JSON."},
                {"role": "user", "content": prompt}
            ],
            reasoning_effort="medium",  # Use reasoning for complex analysis
            max_completion_tokens=4000,
            response_format={"type": "json_object"},
        )

        # Parse response
        import json
        analysis_data = json.loads(response.choices[0].message.content)

        return ComplexAnalysis(**analysis_data)
```

#### 2.3 Add endpoint to `backend/app/routes/matches.py`

```python
from app.services.analysis_service import DeepAnalysisService
from app.schemas.analysis import ComplexAnalysis

@router.get(
    "/job/{job_id}/deep-analysis",
    response_model=ComplexAnalysis,
    summary="Generate deep analysis of job fit",
)
async def get_deep_analysis(
    job_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Generate comprehensive GPT-5.2 powered analysis of candidate-job fit.

    Analyzes skill importance, gap severity, growth potential,
    risk factors, and provides actionable recommendations.
    """
    service = DeepAnalysisService(db=db)
    return await service.analyze_candidate_job_fit(
        user=current_user,
        job_id=job_id,
    )
```

#### 2.4 Frontend: Create `DeepAnalysisModal.tsx`

Location: `frontend/src/components/role-detail/DeepAnalysisModal.tsx`

Key features:
- Loading state with "Analyzing with AI..." message
- Collapsible sections for each analysis area
- Color-coded importance levels (critical=red, important=orange, nice-to-have=green)
- Timeline visualization for ramp-up estimate
- "Save Analysis" button to persist results

#### 2.5 Add button to `RoleOverview.tsx`

```tsx
// Add after the score display
<Button
  onClick={() => setShowDeepAnalysis(true)}
  variant="outline"
  className="ml-4"
>
  🔍 Deep Analysis
</Button>

<DeepAnalysisModal
  isOpen={showDeepAnalysis}
  onClose={() => setShowDeepAnalysis(false)}
  jobId={jobId}
/>
```

---

## Task 3: Fix Skills State Management

### Problem
Skills are appended instead of replaced on resume upload.

### Changes

#### 3.1 `frontend/src/hooks/useSkills.js`

```javascript
// Add clearSkills function
const clearSkills = useCallback(() => {
  setSkills([]);
  setUserSkillsLoaded(false);
}, []);

// Modify fetchUserSkills to REPLACE not append
const fetchUserSkills = useCallback(async () => {
  try {
    const response = await fetch('/api/skills/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    // REPLACE skills, don't append
    const userSkills = data.skills.map(skill => ({
      ...skill,
      source: 'profile',
      // ... other mappings
    }));

    setSkills(userSkills);  // Replace, not merge
    setUserSkillsLoaded(true);
  } catch (error) {
    console.error('Failed to fetch user skills:', error);
  }
}, [token]);

// Export clearSkills
return {
  skills,
  clearSkills,  // Add this
  // ... other exports
};
```

#### 3.2 `frontend/src/components/skills/ResumeUpload.jsx`

```javascript
// In handleConfirmSkills, clear before adding
const handleConfirmSkills = async () => {
  // Clear existing skills first
  if (clearSkills) {
    clearSkills();
  }

  // Then add extracted skills
  onSkillsExtracted(selectedSkills);
};
```

---

## Task 4: Fix Skill Categorization

### Problem
"Marketing", "Audit", "Teamwork" all categorized as "Programming & Development"

### Changes

#### 4.1 Create `backend/app/utils/skill_categorizer.py`

```python
"""Shared skill categorization logic."""

CATEGORY_KEYWORDS = {
    "programming": [
        "python", "java", "javascript", "typescript", "c#", "c++",
        "go", "rust", "ruby", "php", "swift", "kotlin", "scala",
        "react", "angular", "vue", "node", "django", "flask", "spring",
        "html", "css", "sql", "nosql", "mongodb", "postgresql"
    ],
    "cloud_infrastructure": [
        "aws", "azure", "gcp", "cloud", "terraform", "devops",
        "ci/cd", "jenkins", "docker", "kubernetes", "k8s"
    ],
    "data_analytics": [
        "data", "analytics", "machine learning", "ml", "ai",
        "statistics", "etl", "spark", "hadoop", "tableau",
        "power bi", "visualization", "pandas", "numpy"
    ],
    "leadership_management": [
        "leadership", "management", "team lead", "director",
        "mentoring", "coaching", "supervision", "people management"
    ],
    "soft": [
        "communication", "teamwork", "collaboration", "presentation",
        "negotiation", "problem solving", "critical thinking",
        "interpersonal", "public speaking"
    ],
    "business_acumen": [
        "marketing", "branding", "content creation", "seo",
        "advertising", "campaign", "sales", "business development",
        "strategy", "planning", "budgeting", "forecasting"
    ],
    "domain": [
        "audit", "tax", "advisory", "consulting", "financial",
        "compliance", "regulatory", "accounting", "risk", "legal",
        "procurement", "vendor", "supply chain"
    ],
    "tools": [
        "excel", "powerpoint", "word", "google suite", "jira",
        "confluence", "git", "github", "slack", "teams",
        "salesforce", "sap", "oracle"
    ],
    "research": [
        "research", "surveys", "analysis", "studies", "methodology",
        "qualitative", "quantitative", "user research", "market research"
    ],
    "certification": [
        "certified", "certification", "cpa", "cfa", "pmp",
        "cissp", "aws certified", "azure certified", "scrum master"
    ],
}

def categorize_skill(skill_name: str) -> str:
    """Categorize a skill based on keywords."""
    value = skill_name.lower()

    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in value for kw in keywords):
            return category

    # Smart fallback: check word patterns
    if any(word in value for word in ["manage", "lead", "direct", "head"]):
        return "leadership_management"
    if any(word in value for word in ["develop", "engineer", "code", "program"]):
        return "programming"
    if any(word in value for word in ["analyze", "report", "insight"]):
        return "data_analytics"

    return "business_acumen"  # Better default than "programming"
```

#### 4.2 Update `backend/app/routes/skills.py`

```python
from app.utils.skill_categorizer import categorize_skill

# Replace _infer_skill_category with import
# Line 82-83: Use shared function
category = categorize_skill(skill_name)
```

#### 4.3 Update `frontend/src/hooks/useSkills.js`

```javascript
// Expanded getFallbackCategory
const CATEGORY_KEYWORDS = {
  programming: ['python', 'java', 'javascript', 'react', 'node', 'sql', 'html', 'css', 'c#', 'c++'],
  cloud_infrastructure: ['aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'devops'],
  data_analytics: ['data', 'analytics', 'ml', 'ai', 'statistics', 'tableau', 'power bi'],
  leadership_management: ['leadership', 'management', 'mentoring', 'coaching', 'team lead'],
  soft: ['communication', 'teamwork', 'presentation', 'negotiation', 'collaboration'],
  business_acumen: ['marketing', 'branding', 'sales', 'strategy', 'business'],
  domain: ['audit', 'tax', 'consulting', 'financial', 'compliance', 'accounting'],
  research: ['research', 'surveys', 'analysis', 'studies'],
};

function getFallbackCategory(skillName) {
  const lower = skillName.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }

  return 'business_acumen';  // Better default
}
```

---

## Task 5: Module Tracking Database Schema

### New Tables

#### 5.1 Create `backend/app/models/skill_progress.py`

```python
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4

from sqlalchemy import String, Integer, Text, ForeignKey, Index, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text, func

from .base import Base, TimestampMixin


class UserSkill(Base, TimestampMixin):
    """Tracks a user's relationship with a skill."""
    __tablename__ = "user_skills"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False
    )
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)

    # Progress tracking
    status: Mapped[str] = mapped_column(
        String(20), default="not_started"
    )  # not_started, in_progress, completed
    proficiency_level: Mapped[int] = mapped_column(Integer, default=0)  # 0-100

    # Timestamps
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    module_progress: Mapped[List["UserModuleProgress"]] = relationship(
        "UserModuleProgress", back_populates="user_skill", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_user_skill_user_id", "user_id"),
        Index("idx_user_skill_name", "user_id", "skill_name", unique=True),
    )


class SkillModule(Base, TimestampMixin):
    """Defines modules within a skill (shared across users)."""
    __tablename__ = "skill_modules"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    module_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_hours: Mapped[Optional[int]] = mapped_column(Integer)

    # Learning resources
    resources: Mapped[dict] = mapped_column(JSONB, default=list)

    __table_args__ = (
        Index("idx_skill_module_name", "skill_name"),
        Index("idx_skill_module_order", "skill_name", "sequence_order", unique=True),
    )


class UserModuleProgress(Base, TimestampMixin):
    """Tracks a user's progress on a specific module."""
    __tablename__ = "user_module_progress"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True,
        default=uuid4, server_default=text("gen_random_uuid()")
    )
    user_skill_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_skills.id", ondelete="CASCADE"),
        nullable=False
    )
    module_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("skill_modules.id", ondelete="CASCADE"),
        nullable=False
    )

    # Progress
    status: Mapped[str] = mapped_column(
        String(20), default="not_started"
    )  # not_started, in_progress, completed
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Notes and metadata
    notes: Mapped[Optional[str]] = mapped_column(Text)
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Relationships
    user_skill: Mapped["UserSkill"] = relationship("UserSkill", back_populates="module_progress")
    module: Mapped["SkillModule"] = relationship("SkillModule")

    __table_args__ = (
        Index("idx_user_module_skill", "user_skill_id"),
        Index("idx_user_module_unique", "user_skill_id", "module_id", unique=True),
    )
```

#### 5.2 Create migration `backend/alembic/versions/018_add_skill_progress_tables.py`

```python
"""Add skill progress tracking tables.

Revision ID: 018
Create Date: 2024-01-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '018'
down_revision = '017'
branch_labels = None
depends_on = None


def upgrade():
    # User skills table
    op.create_table(
        'user_skills',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('skill_name', sa.String(255), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('status', sa.String(20), server_default='not_started'),
        sa.Column('proficiency_level', sa.Integer, server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('idx_user_skill_user_id', 'user_skills', ['user_id'])
    op.create_index('idx_user_skill_name', 'user_skills', ['user_id', 'skill_name'], unique=True)

    # Skill modules table (shared definitions)
    op.create_table(
        'skill_modules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column('skill_name', sa.String(255), nullable=False),
        sa.Column('module_number', sa.Integer, nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('sequence_order', sa.Integer, nullable=False),
        sa.Column('estimated_hours', sa.Integer),
        sa.Column('resources', postgresql.JSONB, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('idx_skill_module_name', 'skill_modules', ['skill_name'])
    op.create_index('idx_skill_module_order', 'skill_modules', ['skill_name', 'sequence_order'], unique=True)

    # User module progress table
    op.create_table(
        'user_module_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column('user_skill_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('user_skills.id', ondelete='CASCADE'), nullable=False),
        sa.Column('module_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('skill_modules.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), server_default='not_started'),
        sa.Column('progress_percentage', sa.Integer, server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('notes', sa.Text),
        sa.Column('metadata', postgresql.JSONB, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('idx_user_module_skill', 'user_module_progress', ['user_skill_id'])
    op.create_index('idx_user_module_unique', 'user_module_progress',
                    ['user_skill_id', 'module_id'], unique=True)


def downgrade():
    op.drop_table('user_module_progress')
    op.drop_table('skill_modules')
    op.drop_table('user_skills')
```

---

## Task 6: Module Tracking API Endpoints

### New Service and Routes

#### 6.1 Create `backend/app/services/skill_progress_service.py`

```python
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.skill_progress import UserSkill, SkillModule, UserModuleProgress
from app.utils.skill_categorizer import categorize_skill


DEFAULT_MODULES = [
    {"number": 1, "title": "Fundamentals", "description": "Core concepts and basics", "hours": 10},
    {"number": 2, "title": "Intermediate", "description": "Building on fundamentals", "hours": 15},
    {"number": 3, "title": "Advanced", "description": "Complex scenarios and patterns", "hours": 20},
    {"number": 4, "title": "Practical Application", "description": "Real-world projects", "hours": 25},
]


class SkillProgressService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_skills_with_progress(self, user_id: UUID) -> List[dict]:
        """Get all user skills with module progress."""
        user_skills = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id
        ).all()

        result = []
        for skill in user_skills:
            modules = self._get_skill_modules(skill.skill_name)
            progress = self._get_module_progress(skill.id)

            completed = sum(1 for p in progress if p.status == "completed")
            total = len(modules)

            result.append({
                "id": str(skill.id),
                "name": skill.skill_name,
                "category": skill.category,
                "status": skill.status,
                "proficiency": skill.proficiency_level,
                "progress": {
                    "current": completed,
                    "total": total,
                    "unit": "modules",
                    "percentage": round(completed / total * 100) if total > 0 else 0,
                },
                "modules": [
                    {
                        "id": str(m.id),
                        "number": m.module_number,
                        "title": m.title,
                        "status": self._get_progress_status(progress, m.id),
                        "progress": self._get_progress_percent(progress, m.id),
                    }
                    for m in modules
                ],
                "started_at": skill.started_at.isoformat() if skill.started_at else None,
                "completed_at": skill.completed_at.isoformat() if skill.completed_at else None,
            })

        return result

    def start_skill(self, user_id: UUID, skill_name: str) -> UserSkill:
        """Initialize skill learning with default modules."""
        # Check if already exists
        existing = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_name == skill_name,
        ).first()

        if existing:
            return existing

        # Create user skill
        category = categorize_skill(skill_name)
        user_skill = UserSkill(
            user_id=user_id,
            skill_name=skill_name,
            category=category,
            status="in_progress",
            started_at=datetime.utcnow(),
        )
        self.db.add(user_skill)
        self.db.flush()

        # Ensure modules exist for this skill
        modules = self._ensure_modules_exist(skill_name)

        # Create progress records for each module
        for module in modules:
            progress = UserModuleProgress(
                user_skill_id=user_skill.id,
                module_id=module.id,
                status="not_started",
            )
            self.db.add(progress)

        self.db.commit()
        return user_skill

    def update_module_progress(
        self,
        user_id: UUID,
        skill_name: str,
        module_id: UUID,
        progress_percentage: int,
    ) -> UserModuleProgress:
        """Update progress on a specific module."""
        user_skill = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_name == skill_name,
        ).first()

        if not user_skill:
            raise ValueError(f"User skill {skill_name} not found")

        progress = self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_skill_id == user_skill.id,
            UserModuleProgress.module_id == module_id,
        ).first()

        if not progress:
            raise ValueError(f"Module progress not found")

        progress.progress_percentage = progress_percentage
        if progress_percentage > 0 and progress.status == "not_started":
            progress.status = "in_progress"
            progress.started_at = datetime.utcnow()

        self._update_skill_proficiency(user_skill)
        self.db.commit()
        return progress

    def complete_module(
        self,
        user_id: UUID,
        skill_name: str,
        module_id: UUID,
    ) -> UserModuleProgress:
        """Mark a module as complete."""
        user_skill = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_name == skill_name,
        ).first()

        if not user_skill:
            raise ValueError(f"User skill {skill_name} not found")

        progress = self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_skill_id == user_skill.id,
            UserModuleProgress.module_id == module_id,
        ).first()

        if not progress:
            raise ValueError(f"Module progress not found")

        progress.status = "completed"
        progress.progress_percentage = 100
        progress.completed_at = datetime.utcnow()

        self._update_skill_proficiency(user_skill)
        self._check_skill_completion(user_skill)
        self.db.commit()
        return progress

    def _ensure_modules_exist(self, skill_name: str) -> List[SkillModule]:
        """Ensure modules exist for a skill, create defaults if not."""
        modules = self.db.query(SkillModule).filter(
            SkillModule.skill_name == skill_name
        ).order_by(SkillModule.sequence_order).all()

        if modules:
            return modules

        # Create default modules
        for i, mod in enumerate(DEFAULT_MODULES):
            module = SkillModule(
                skill_name=skill_name,
                module_number=mod["number"],
                title=f"{skill_name} - {mod['title']}",
                description=mod["description"],
                sequence_order=i + 1,
                estimated_hours=mod["hours"],
            )
            self.db.add(module)
            modules.append(module)

        self.db.flush()
        return modules

    def _update_skill_proficiency(self, user_skill: UserSkill):
        """Recalculate skill proficiency based on module progress."""
        progress_records = self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_skill_id == user_skill.id
        ).all()

        if not progress_records:
            return

        total_progress = sum(p.progress_percentage for p in progress_records)
        avg_progress = total_progress / len(progress_records)
        user_skill.proficiency_level = round(avg_progress)

    def _check_skill_completion(self, user_skill: UserSkill):
        """Check if all modules complete and mark skill as completed."""
        all_complete = self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_skill_id == user_skill.id,
            UserModuleProgress.status != "completed"
        ).count() == 0

        if all_complete:
            user_skill.status = "completed"
            user_skill.completed_at = datetime.utcnow()
            user_skill.proficiency_level = 100
```

#### 6.2 Add routes to `backend/app/routes/skills.py`

```python
from app.services.skill_progress_service import SkillProgressService

# Update GET /skills/me to return real progress
@router.get("/me", response_model=UserSkillsResponse)
async def get_user_skills(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    service = SkillProgressService(db)
    skills_with_progress = service.get_user_skills_with_progress(current_user.id)

    # Also return skills from profile that don't have progress tracking yet
    # ... merge logic ...

    return UserSkillsResponse(skills=skills_with_progress, total_count=len(skills_with_progress))


@router.post("/{skill_name}/start")
async def start_skill(
    skill_name: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Start learning a skill - initializes modules."""
    service = SkillProgressService(db)
    user_skill = service.start_skill(current_user.id, skill_name)
    return {"status": "started", "skill_id": str(user_skill.id)}


@router.patch("/{skill_name}/modules/{module_id}/progress")
async def update_module_progress(
    skill_name: str,
    module_id: str,
    progress: int = Body(..., ge=0, le=100),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Update progress percentage on a module."""
    service = SkillProgressService(db)
    result = service.update_module_progress(
        current_user.id, skill_name, UUID(module_id), progress
    )
    return {"status": result.status, "progress": result.progress_percentage}


@router.post("/{skill_name}/modules/{module_id}/complete")
async def complete_module(
    skill_name: str,
    module_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Mark a module as complete."""
    service = SkillProgressService(db)
    result = service.complete_module(current_user.id, skill_name, UUID(module_id))
    return {"status": "completed", "completed_at": result.completed_at.isoformat()}
```

---

## Task 7: Frontend Module Tracking

### Updates

#### 7.1 Create `frontend/src/services/skillProgressService.ts`

```typescript
import api from './api';

export interface Module {
  id: string;
  number: number;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
}

export interface SkillWithProgress {
  id: string;
  name: string;
  category: string;
  status: string;
  proficiency: number;
  progress: {
    current: number;
    total: number;
    unit: string;
    percentage: number;
  };
  modules: Module[];
  started_at: string | null;
  completed_at: string | null;
}

export async function startSkill(skillName: string): Promise<void> {
  await api.post(`/skills/${encodeURIComponent(skillName)}/start`);
}

export async function updateModuleProgress(
  skillName: string,
  moduleId: string,
  progress: number
): Promise<void> {
  await api.patch(
    `/skills/${encodeURIComponent(skillName)}/modules/${moduleId}/progress`,
    { progress }
  );
}

export async function completeModule(
  skillName: string,
  moduleId: string
): Promise<void> {
  await api.post(
    `/skills/${encodeURIComponent(skillName)}/modules/${moduleId}/complete`
  );
}
```

#### 7.2 Update `SkillDetailModal.jsx`

Remove mock data usage and use real module data:

```jsx
// Remove generateDefaultTimeline import
// Instead, get modules from skill prop

const SkillDetailModal = ({ skill, isOpen, onClose }) => {
  const [modules, setModules] = useState(skill?.modules || []);

  const handleCompleteModule = async (moduleId) => {
    await completeModule(skill.name, moduleId);
    // Refresh skill data
    onSkillUpdated();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>{skill.name}</h2>
      <ProgressBar value={skill.progress.percentage} />

      <h3>Modules</h3>
      {modules.map(module => (
        <ModuleCard
          key={module.id}
          module={module}
          onComplete={() => handleCompleteModule(module.id)}
        />
      ))}
    </Modal>
  );
};
```

---

## Execution Order

### Phase 1: Parallel Tasks (Can run simultaneously)
- **Task 1:** Fix matching thresholds (Backend only)
- **Task 2:** Build deep analysis service (Backend + Frontend)
- **Task 3:** Fix skills state management (Frontend only)
- **Task 4:** Fix skill categorization (Backend + Frontend)
- **Task 5:** Create module tracking schema (Backend only)

### Phase 2: Sequential Tasks
- **Task 6:** Build module API (requires Task 5)
- **Task 7:** Frontend module tracking (requires Tasks 5, 6)

### Testing After Each Phase
1. After Phase 1: Test matching improvements, categorization, state clearing
2. After Phase 2: Test full module tracking flow

---

## Files Modified/Created Summary

### New Files
- `backend/app/schemas/analysis.py`
- `backend/app/services/analysis_service.py`
- `backend/app/utils/skill_categorizer.py`
- `backend/app/models/skill_progress.py`
- `backend/app/services/skill_progress_service.py`
- `backend/alembic/versions/018_add_skill_progress_tables.py`
- `frontend/src/services/skillProgressService.ts`
- `frontend/src/components/role-detail/DeepAnalysisModal.tsx`

### Modified Files
- `backend/app/config/matching_config.py`
- `backend/app/services/matching_service.py`
- `backend/app/models/skill_taxonomy.py`
- `backend/app/routes/skills.py`
- `backend/app/routes/matches.py`
- `frontend/src/hooks/useSkills.js`
- `frontend/src/components/skills/ResumeUpload.jsx`
- `frontend/src/components/skills/SkillDetailModal.jsx`
- `frontend/src/components/skills/SkillsDashboard.jsx`
- `frontend/src/components/role-detail/RoleOverview.tsx`
