# SpringAIS API Contracts

**Generated**: 2026-02-11
**Source**: `backend/app/routes/` and `backend/app/schemas/` scan findings

---

## Base Configuration

- **Base URL**: `http://localhost:8000`
- **Auth endpoints**: `/auth/*` (no prefix)
- **All other endpoints**: `/api/*`
- **Authentication**: JWT Bearer token in `Authorization` header
- **Content-Type**: `application/json` (except file uploads: `multipart/form-data`)
- **Compression**: GZip for responses > 500 bytes

---

## 1. Authentication (`/auth`)

**Router**: `backend/app/routes/auth.py`
**Auth Required**: No (public)

### POST /auth/register

Register a new user account.

**Request Body**:
```json
{
  "email": "string (valid email, required)",
  "password": "string (8-128 characters, required)",
  "full_name": "string (required)"
}
```

**Response** (`AuthResponse`):
```json
{
  "token": "string (JWT)",
  "user": {
    "id": "uuid",
    "email": "string",
    "full_name": "string",
    "current_role": "string | null",
    "years_experience": "number | null",
    "target_service_line": "string | null",
    "skills": "object | null",
    "onboarding_complete": "boolean",
    "account_type": "string ('personal' | 'hiring_manager')"
  }
}
```

### POST /auth/login

Authenticate and receive a JWT token.

**Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response**: Same `AuthResponse` as register.

### GET /auth/me

Get the current authenticated user's profile.

**Auth**: Required (Bearer token)

**Response**: `UserResponse` (same structure as `user` in `AuthResponse`).

---

## 2. Matches (`/api/matches`)

**Router**: `backend/app/routes/matches.py`
**Auth Required**: Yes (all endpoints)

### GET /api/matches/employee/{employee_id}

Get paginated job matches for an employee.

**Path Params**: `employee_id` (string)
**Query Params**:
- `limit` (int, default 20) - Results per page
- `offset` (int, default 0) - Pagination offset
- `mode` (string, optional) - Match mode: `best_fit`, `growth_opportunity`, `all`

**Response** (`MatchResult[]`):
```json
[
  {
    "job_id": "string",
    "job_title": "string",
    "service_line": "string",
    "department": "string",
    "location": "string",
    "scores": {
      "overall": "number (0-1)",
      "skill_match": "number (0-1, 80% weight)",
      "experience_match": "number (0-1, 10% weight)",
      "role_fit": "number (0-1, 10% weight)"
    },
    "matched_skills": ["string"],
    "transferable_skills": ["string"],
    "gap_skills": ["string"],
    "explanation": "string",
    "posting_url": "string | null",
    "posted_date": "string | null"
  }
]
```

**Caching**: Redis, 5-minute TTL with skill-version validation.

### GET /api/matches/employee/{employee_id}/job/{job_id}

Get detailed match result for a specific employee-job pair.

**Path Params**: `employee_id` (string), `job_id` (string)

**Response** (`MatchResultDetail`): Extended match data with full skill gap analysis.

### GET /api/matches/employee/{employee_id}/skill-gaps/{job_id}

Get skill gap analysis for a specific match.

**Path Params**: `employee_id` (string), `job_id` (string)

**Response** (`SkillGapAnalysis`):
```json
{
  "overlapping_skills": ["string"],
  "missing_skills": ["string"],
  "transferable_skills": ["string"],
  "match_percentage": "number (0-100)"
}
```

### POST /api/matches/save

Save a match result.

**Request Body**:
```json
{
  "job_posting_id": "string",
  "match_mode": "string",
  "overall_score": "number",
  "skill_match_score": "number",
  "experience_score": "number",
  "growth_potential_score": "number",
  "skill_gaps": "object",
  "matched_skills": "object",
  "explanation": "string"
}
```

**Response** (`SavedMatchResponse`): Saved match with generated UUID.

### GET /api/matches/saved

Get all saved matches for the current user.

**Response** (`SavedMatchesResponse`): Array of saved matches with job details.

### GET /api/matches/job/{job_id}/deep-analysis

Get GPT-5.2 deep analysis for a specific job match.

**Path Params**: `job_id` (string)

**Response** (`ComplexAnalysis`):
```json
{
  "skill_impacts": [
    {
      "skill": "string",
      "importance": "critical | high | medium | low",
      "gap_severity": "string",
      "recommendation": "string"
    }
  ],
  "success_factors": ["string"],
  "risk_factors": ["string"],
  "ramp_up_time": "string",
  "comparable_roles": ["string"],
  "learning_path": ["string"]
}
```

### DELETE /api/matches/saved/{match_id}

Delete a saved match.

**Path Params**: `match_id` (UUID)

**Response**: `204 No Content`

---

## 3. Skills (`/api/skills`)

**Router**: `backend/app/routes/skills.py` (~1800 lines)
**Auth Required**: Yes (all endpoints)

### GET /api/skills/me

Get current user's skills.

**Response**: User skills array with categories and proficiency levels.

### GET /api/skills/me/progress

Get skills with module progress details.

**Response** (`UserSkillsWithProgressResponse`):
```json
{
  "skills": [
    {
      "skill_name": "string",
      "category": "string",
      "status": "not_started | in_progress | completed",
      "proficiency_level": "integer (0-5)",
      "source": "resume | job_gap | manual | roadmap",
      "modules": [
        {
          "id": "uuid",
          "module_number": "integer",
          "title": "string",
          "description": "string",
          "estimated_hours": "integer",
          "skill_type": "technical | soft | tool",
          "learning_content": "object | null",
          "external_resources": "object | null",
          "ey_resources": "object | null",
          "progress": {
            "status": "string",
            "progress_percentage": "integer (0-100)",
            "tasks_completed": "object | null",
            "proof_description": "string | null",
            "proof_link": "string | null",
            "ai_feedback": "string | null"
          }
        }
      ]
    }
  ]
}
```

### POST /api/skills/{skill_name}/start

Start learning a skill. Auto-generates learning modules.

**Path Params**: `skill_name` (string)

**Response**: Created `UserSkill` with generated modules.

### PATCH /api/skills/{skill_name}/modules/{module_id}/progress

Update module progress.

**Path Params**: `skill_name` (string), `module_id` (UUID)

**Request Body**:
```json
{
  "progress_percentage": "integer (0-100)"
}
```

### POST /api/skills/{skill_name}/modules/{module_id}/complete

Mark a module as complete.

**Path Params**: `skill_name` (string), `module_id` (UUID)

### POST /api/skills/{skill_name}/complete

Mark an entire skill as complete.

**Path Params**: `skill_name` (string)

### PATCH /api/skills/{skill_name}/proficiency

Update skill proficiency level. Proficiency >= 3 syncs skill to user profile for matching.

**Path Params**: `skill_name` (string)

**Request Body**:
```json
{
  "proficiency_level": "integer (0-5)"
}
```

### POST /api/skills/{skill_name}/modules/{module_id}/complete-with-proof

Complete a module with proof of completion. Triggers AI review.

**Path Params**: `skill_name` (string), `module_id` (UUID)

**Request Body**:
```json
{
  "proof_description": "string",
  "proof_link": "string | null"
}
```

**Response**: Module progress with AI feedback.

### POST /api/skills/{skill_name}/modules/{module_id}/upload-proof

Upload proof file for a module.

**Path Params**: `skill_name` (string), `module_id` (UUID)
**Content-Type**: `multipart/form-data`
**File Limit**: 10MB max
**Supported Types**: PDF, DOCX, TXT, images

**Response**: Updated module progress with file metadata.

### GET /api/skills/{skill_name}/modules/{module_id}/proof-file

Download a proof file.

**Path Params**: `skill_name` (string), `module_id` (UUID)

**Response**: Binary file with appropriate Content-Type header.

### PATCH /api/skills/{skill_name}/modules/{module_id}/tasks

Update task checklist within a module.

**Path Params**: `skill_name` (string), `module_id` (UUID)

**Request Body**:
```json
{
  "tasks_completed": {"0": true, "1": false, "2": true}
}
```

### POST /api/skills/{skill_name}/modules/{module_id}/generate-content

Generate AI learning content for a module.

**Path Params**: `skill_name` (string), `module_id` (UUID)

**Response**: Module with generated `learning_content`, `external_resources`, and `ey_resources`.

### POST /api/skills/quick-add

Quick-add a skill to the user's portfolio.

**Request Body**:
```json
{
  "skill_name": "string",
  "category": "string (optional)"
}
```

### GET /api/skills/stale

Get skills that haven't been updated in 6+ months.

**Response**: Array of stale skills with last update timestamps.

### POST /api/skills/extract

Extract skills from raw text.

**Request Body**:
```json
{
  "text": "string"
}
```

**Response** (`SkillExtractionResponse`):
```json
{
  "listed_skills": [{"name": "string", "category": "string", "confidence": "number"}],
  "inferred_skills": [{"name": "string", "category": "string", "confidence": "number"}]
}
```

### POST /api/skills/upload

Upload a resume file and extract skills.

**Content-Type**: `multipart/form-data`
**File Field**: `file`
**Supported Types**: PDF, DOCX, TXT (max 10MB)

**Response** (`ResumeUploadResponse`): Extracted skills with listed and inferred categorization.

**Side Effects**: Triggers background vectorization of user skills and resume.

### GET /api/skills/taxonomy

Get the skill taxonomy tree.

**Response**: Full taxonomy with canonical names, categories, and aliases.

### POST /api/skills/taxonomy/seed

Seed the skill taxonomy database with 120+ predefined skills.

### GET /api/skills/taxonomy/search

Search the skill taxonomy.

**Query Params**: `q` (string) - Search query

**Response**: Matching taxonomy entries.

### GET /api/skills/recommendations

Get skill recommendations for the current user.

**Response**: Array of `UserSkillRecommendation` with priority scores and sources.

### PATCH /api/skills/recommendations/{skill_name}/status

Update recommendation status.

**Path Params**: `skill_name` (string)

**Request Body**:
```json
{
  "status": "recommended | in_progress | completed | dismissed"
}
```

### POST /api/skills/plan/{job_id}

Generate an upskilling plan for a target job.

**Path Params**: `job_id` (string)

**Response**: Skill plan tree structure (ReactFlow-compatible nodes and edges).

### POST /api/skills/normalize

Normalize skill names to canonical forms.

**Request Body**:
```json
{
  "skills": ["string"]
}
```

**Response**: Mapping of input names to canonical names.

### GET /api/skills/stats

Get skill statistics for the current user.

**Response**: Aggregate stats (total, by status, by category).

### POST /api/skills/group

AI-powered skill grouping.

**Request Body**:
```json
{
  "skills": ["string"],
  "context": "string (optional)"
}
```

**Response**: Grouped skills with categories and learning modules.

### POST /api/skills/enhance

Enhance existing skill groupings with new skills.

**Request Body**:
```json
{
  "existing_groupings": "object",
  "new_skills": ["string"]
}
```

### GET /api/skills/groupings

Get saved skill groupings for the current user.

**Response**: User's AI-generated skill groupings.

### POST /api/skills/recategorize

Recategorize skills using AI.

### GET /api/skills/debug/modules/{skill_name}

Debug endpoint for module data inspection.

**Path Params**: `skill_name` (string)

---

## 4. Career Patterns (`/api/patterns`)

**Router**: `backend/app/routes/patterns.py`
**Auth Required**: Mixed (some endpoints public)

### POST /api/patterns/career-goal

Set a career goal for the current user.

**Auth**: Required

**Request Body**:
```json
{
  "target_role": "string",
  "target_service_line": "string (optional)"
}
```

### GET /api/patterns/role/{role_name}

Get career patterns for a specific role.

**Path Params**: `role_name` (string)

**Response**: Role patterns with transition data, success rates, and common skills.

### POST /api/patterns/role-skills

Get role skill requirements using skill-based pattern analysis.

**Request Body**:
```json
{
  "role_title": "string",
  "service_line": "string (optional)"
}
```

**Response** (`SkillBasedPatternsResponse`):
```json
{
  "metrics": {"transitions": "int", "avg_time": "number", "success_rate": "number", "sample_size": "int"},
  "transitions": [{"source_role": "string", "target_role": "string", "success_rate": "number", "avg_time": "number", "sample_size": "int", "common_skills": ["string"]}],
  "time_to_promotion": {"department": [{"stage": "string", "avg_years": "number"}]},
  "skill_frequency": [{"skill": "string", "frequency": "number"}],
  "department_distribution": [{"department": "string", "count": "int", "percentage": "number"}]
}
```

### GET /api/patterns/transition/{source_role}/{target_role}

Get details for a specific role transition.

**Path Params**: `source_role` (string), `target_role` (string)

**Response**: Transition details with success rate, avg time, sample size, common skills.

### GET /api/patterns/graph

Get full career graph data (ReactFlow compatible).

**Response** (`CareerGraphData`):
```json
{
  "nodes": [
    {"id": "string", "label": "string", "department": "string", "employee_count": "int", "avg_years": "number"}
  ],
  "edges": [
    {"source": "string", "target": "string", "success_rate": "number", "avg_time": "number", "sample_size": "int"}
  ]
}
```

### GET /api/patterns/transitions

Get all career transitions.

**Response**: Array of `TransitionPattern` objects.

### GET /api/patterns/employee/{employee_id}/recommendations

Get next role recommendations for an employee.

**Path Params**: `employee_id` (string)

**Response**: Array of `RoleRecommendation` with scores and reasoning.

### GET /api/patterns/employee/{employee_id}/trajectory

Get career trajectory metrics for an employee.

**Path Params**: `employee_id` (string)

**Response** (`TrajectoryMetrics`): Career trajectory analysis.

### POST /api/patterns/cache/invalidate

Invalidate the pattern cache (Redis + local).

### GET /api/patterns/skills/{source_role}/{target_role}

Get skill-based patterns between two roles.

**Path Params**: `source_role` (string), `target_role` (string)

---

## 5. Roadmap (`/api/roadmap`)

**Router**: `backend/app/routes/roadmap.py` (~1150 lines)
**Auth Required**: Yes (all endpoints)

### POST /api/roadmap/generate

Generate an AI-powered career roadmap.

**Request Body** (`RoadmapGenerateRequest`):
```json
{
  "target_roles": [
    {"job_id": "string", "job_title": "string", "service_line": "string", "order": "int (optional)"}
  ],
  "emphasis": "technical | leadership | balanced",
  "custom_instructions": "string (optional)",
  "include_certifications": "boolean (default true)",
  "timeline_preference": "string (optional)",
  "auto_order": "boolean (default true)"
}
```

**Response**: Full roadmap with phases, milestones, executive summary, quick wins, and blockers.

**AI Model**: GPT-5.2 with `reasoning_effort="medium"`, max 12000 tokens.

### GET /api/roadmap/saved

List all saved roadmaps for the current user.

**Response**: Array of saved roadmap summaries.

### GET /api/roadmap/saved/{roadmap_id}

Get a specific saved roadmap with full data.

**Path Params**: `roadmap_id` (UUID)

### DELETE /api/roadmap/saved/{roadmap_id}

Delete a saved roadmap.

**Path Params**: `roadmap_id` (UUID)

### POST /api/roadmap/chat

Chat about career development.

**Request Body**:
```json
{
  "message": "string",
  "roadmap_id": "uuid (optional)"
}
```

**Response**: AI chat response (GPT-5.2-chat).

### GET /api/roadmap/saved/{roadmap_id}/progress

Get progress for a saved roadmap (milestones, extras).

**Path Params**: `roadmap_id` (UUID)

### POST /api/roadmap/saved/{roadmap_id}/milestones/{milestone_id}/toggle

Toggle milestone completion status.

**Path Params**: `roadmap_id` (UUID), `milestone_id` (string)

### POST /api/roadmap/saved/{roadmap_id}/milestones/{milestone_id}/complete-with-skills

Complete a milestone and boost related skill proficiencies.

**Path Params**: `roadmap_id` (UUID), `milestone_id` (string)

### POST /api/roadmap/saved/{roadmap_id}/milestones/{milestone_id}/notes

Update notes for a milestone.

**Path Params**: `roadmap_id` (UUID), `milestone_id` (string)

**Request Body**:
```json
{
  "notes": "string"
}
```

### POST /api/roadmap/saved/{roadmap_id}/extras

Add a user-defined extra achievement.

**Path Params**: `roadmap_id` (UUID)

**Request Body**:
```json
{
  "title": "string",
  "description": "string (optional)",
  "category": "certification | skill | project | achievement"
}
```

### DELETE /api/roadmap/saved/{roadmap_id}/extras/{extra_id}

Delete an extra achievement.

**Path Params**: `roadmap_id` (UUID), `extra_id` (UUID)

### GET /api/roadmap/saved/{roadmap_id}/edits

Get edit history for a roadmap.

**Path Params**: `roadmap_id` (UUID)

**Response**: Array of edit records with type, description, timestamps, and original/new values.

### POST /api/roadmap/saved/{roadmap_id}/edits

Record a manual edit.

**Path Params**: `roadmap_id` (UUID)

**Request Body**:
```json
{
  "edit_type": "string",
  "change_description": "string",
  "affected_elements": "object",
  "original_values": "object",
  "new_values": "object"
}
```

### PUT /api/roadmap/saved/{roadmap_id}/edit-mode

Set the edit mode for a roadmap.

**Path Params**: `roadmap_id` (UUID)

**Request Body**:
```json
{
  "edit_mode": "view | suggest | edit"
}
```

### POST /api/roadmap/saved/{roadmap_id}/edit/ai

Generate AI-suggested edits for a roadmap.

**Path Params**: `roadmap_id` (UUID)

**Request Body**:
```json
{
  "instructions": "string"
}
```

**Response**: Suggested edits preview.

### POST /api/roadmap/saved/{roadmap_id}/edit/apply

Apply previously generated AI edits.

**Path Params**: `roadmap_id` (UUID)

### POST /api/roadmap/saved/{roadmap_id}/chat/enhanced

Enhanced context-aware chat about a specific roadmap.

**Path Params**: `roadmap_id` (UUID)

**Request Body**:
```json
{
  "message": "string"
}
```

---

## 6. Hiring Manager (`/api/hm`)

**Router**: `backend/app/routes/hiring_manager.py`
**Auth Required**: Yes (account_type must be "hiring_manager")

### GET /api/hm/jobs

Browse all active job postings (paginated, filterable).

**Query Params**:
- `page` (int, default 1)
- `per_page` (int, default 20)
- `search` (string, optional)
- `service_line` (string, optional)
- `location` (string, optional)

**Response** (`JobBrowseResponse`):
```json
{
  "jobs": [
    {
      "id": "string",
      "title": "string",
      "service_line": "string",
      "location": "string",
      "posted_date": "date",
      "required_skills": ["string"],
      "is_saved": "boolean"
    }
  ],
  "total": "integer",
  "page": "integer",
  "per_page": "integer"
}
```

### POST /api/hm/my-jobs

Save a job to "My Jobs" list.

**Request Body**:
```json
{
  "job_posting_id": "string"
}
```

### GET /api/hm/my-jobs

Get hiring manager's saved jobs.

**Response**: Array of saved jobs with notes.

### DELETE /api/hm/my-jobs/{saved_job_id}

Remove a saved job.

**Path Params**: `saved_job_id` (UUID)

### PATCH /api/hm/my-jobs/{saved_job_id}/notes

Update notes for a saved job.

**Path Params**: `saved_job_id` (UUID)

**Request Body**:
```json
{
  "notes": "string"
}
```

### GET /api/hm/my-jobs/{job_id}/interest

Get anonymized candidate interest data for a job posting. **No PII is exposed.**

**Path Params**: `job_id` (string)

**Response** (`CandidateInterestResponse`):
```json
{
  "total_interested": "integer",
  "fit_distribution": {
    "strong_fit": "integer (score >= 0.8)",
    "good_fit": "integer (score >= 0.65)",
    "moderate_fit": "integer (score >= 0.5)",
    "developing": "integer (score < 0.5)"
  },
  "averages": {
    "overall_score": "number",
    "skill_match": "number",
    "experience_match": "number"
  },
  "common_gaps": ["string"],
  "candidates": [
    {
      "candidate_label": "string ('Candidate A', 'Candidate B', ...)",
      "scores": {
        "overall": "number",
        "skill_match": "number",
        "experience_match": "number"
      },
      "matched_skills": ["string"],
      "transferable_skills": ["string"],
      "gap_skills": ["string"],
      "fit_level": "strong_fit | good_fit | moderate_fit | developing"
    }
  ]
}
```

---

## 7. Root Endpoint

### GET /

Health check endpoint.

**Auth**: None

**Response**:
```json
{
  "status": "running",
  "version": "1.0.0"
}
```

---

## Endpoint Count Summary

| Router | Endpoints |
|--------|-----------|
| Auth | 3 |
| Matches | 7 |
| Skills | 25+ |
| Patterns | 10 |
| Roadmap | 16 |
| Hiring Manager | 6 |
| Root | 1 |
| **Total** | **68+** |
