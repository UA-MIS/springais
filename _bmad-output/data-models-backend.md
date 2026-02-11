# SpringAIS Database Schema Documentation

**Generated**: 2026-02-11
**Source**: `backend/app/models/` scan findings
**Database**: PostgreSQL 16 with pgvector extension
**ORM**: SQLAlchemy 2.0 (DeclarativeBase, MappedColumn)
**Migrations**: 26 Alembic versions (001-026)

---

## Schema Overview

16 tables across 5 functional domains:

| Domain | Tables |
|--------|--------|
| **User & Auth** | `user_profiles` |
| **Jobs & Matching** | `employees`, `job_postings`, `matches`, `skill_embeddings`, `skill_taxonomy` |
| **Skills & Learning** | `user_skills`, `skill_modules`, `user_module_progress`, `user_skill_recommendations` |
| **Career & Roadmap** | `career_paths`, `saved_roadmaps`, `roadmap_milestone_progress`, `roadmap_extras`, `roadmap_edits` |
| **Hiring Manager** | `hm_saved_jobs` |

---

## Base Model

All models inherit from `DeclarativeBase` with `TimestampMixin`:

| Column | Type | Default |
|--------|------|---------|
| `created_at` | DateTime | Server-side `now()` |
| `updated_at` | DateTime | Server-side `now()`, auto-updates on modify |

---

## 1. user_profiles

**File**: `backend/app/models/user_profile.py`
**Purpose**: User accounts with authentication, skills, and AI-extracted data.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | Auto-generated |
| `email` | String | Unique, Not Null | Login identifier |
| `hashed_password` | String | Not Null | bcrypt hash |
| `full_name` | String | Not Null | Display name |
| `current_role` | String | Nullable | Current job title |
| `years_experience` | Numeric | Nullable | |
| `target_service_line` | String | Nullable | Career goal |
| `skills` | JSONB | Nullable | Active skill list (synced from proficiency >= 3) |
| `employee_id` | String | FK(employees.id), Nullable | Optional link to employee record |
| `resume_text` | Text | Nullable | Parsed resume content |
| `resume_file_url` | String | Nullable | Original file path |
| `skill_assessment_scores` | JSONB | Nullable | |
| `onboarding_complete` | Boolean | Default false | Profile setup status |
| `account_type` | String(20) | Default "personal" | "personal" or "hiring_manager" |
| `last_login_at` | DateTime | Nullable | |
| `llm_listed_skills` | JSONB | Nullable | GPT-extracted from resume |
| `llm_inferred_skills` | JSONB | Nullable | GPT-inferred from resume |
| `skill_groupings` | JSONB | Nullable | AI-generated categories |
| `resume_embedding` | Vector(1536) | Nullable | For role fit scoring |

**Methods**: `verify_password(password)` - bcrypt comparison

**Relationships**:
- `matches` -> Match (one-to-many)
- `employee` -> Employee (many-to-one via `employee_id`)
- `career_path` -> CareerPath (one-to-one)
- `saved_roadmaps` -> SavedRoadmap (one-to-many)
- `hm_saved_jobs` -> HMSavedJob (one-to-many)

---

## 2. employees

**File**: `backend/app/models/employee.py`
**Purpose**: Employee records for matching and career pattern analysis.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | String | PK | Employee ID |
| `service_line` | String | | Advisory, Technology, etc. |
| `current_role` | String | | Current role title |
| `role_level` | Integer | | 1-9 hierarchy (Staff to Partner) |
| `years_experience` | Numeric | | |
| `skills` | JSONB | GIN indexed | Skill data |
| `performance_metrics` | JSONB | | Validated via Pydantic |
| `feedback_themes` | ARRAY(String) | | |
| `notable_achievement` | Text | | |
| `career_history` | JSONB | | For pattern analysis |

**Indexes** (from `docker/postgres-init/02_pattern_indexes.sql`):
- B-tree on `current_role`
- B-tree on `service_line`
- Compound B-tree on `(current_role, service_line)`
- GIN on `career_history`
- GIN on `skills`
- Partial index on `current_role` WHERE `career_history IS NOT NULL`

**Relationships**: `matches` -> Match (one-to-many)

---

## 3. job_postings

**File**: `backend/app/models/job_posting.py`
**Purpose**: Job postings from EY careers scraper with AI-enriched skill data and vector embeddings.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | String | PK | |
| `external_id` | String | Unique | From scraper (dedup key) |
| `title` | String | | Job title |
| `service_line` | String | | |
| `location` | String | | |
| `description` | Text | | Full job description |
| `required_skills` | JSONB | GIN indexed | Parsed from posting |
| `preferred_skills` | JSONB | GIN indexed | |
| `tags` | JSONB | GIN indexed | |
| `experience_years_min` | Integer | | |
| `experience_years_max` | Integer | | |
| `posting_url` | String | | Link to EY careers |
| `source_locale` | String | | |
| `posted_date` | Date | | |
| `scraped_at` | DateTime | | |
| `responsibilities_text` | Text | | Extracted section |
| `requirements_text` | Text | | Extracted section |
| `preferred_text` | Text | | Extracted section |
| `is_active` | Boolean | | Active/inactive flag |
| `search_vector` | TSVECTOR | GIN indexed | Full-text search |
| `llm_required_skills` | JSONB | | GPT-extracted |
| `llm_inferred_skills` | JSONB | | GPT-inferred |
| `llm_experience_years_min` | Integer | | GPT-estimated |
| `llm_experience_years_max` | Integer | | GPT-estimated |
| `llm_primary_domain` | String | | GPT-classified |
| `skill_extraction_hash` | String | | SHA256 of description |
| `skills_extracted_at` | DateTime | | |
| `description_embedding` | Vector(1536) | | PCA-reduced OpenAI embedding |
| `title_embedding` | Vector(1536) | | PCA-reduced OpenAI embedding |

**Indexes**:
- GIN on `required_skills`, `preferred_skills`, `tags`, `search_vector`
- BRIN on `created_at`
- B-tree compound on `(is_active, posted_date)`

**Relationships**: `matches` -> Match, `hm_saved_jobs` -> HMSavedJob

---

## 4. matches

**File**: `backend/app/models/match.py`
**Purpose**: Saved match results between users/employees and job postings.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | Auto-generated |
| `employee_id` | String | FK(employees.id), Nullable | Optional employee link |
| `job_posting_id` | String | FK(job_postings.id) | |
| `user_id` | UUID | FK(user_profiles.id) | Owning user |
| `match_mode` | String | | best_fit, growth_opportunity, all |
| `overall_score` | Numeric | | Weighted composite (80/10/10) |
| `skill_match_score` | Numeric | | 80% weight component |
| `experience_score` | Numeric | | 10% weight component |
| `growth_potential_score` | Numeric | | 10% weight component |
| `skill_gaps` | JSONB | | Missing skills list |
| `matched_skills` | JSONB | | Matched skills list |
| `explanation` | Text | | Human-readable match explanation |

---

## 5. skill_embeddings

**File**: `backend/app/models/skill_embedding.py`
**Purpose**: Vector embeddings for semantic skill matching via pgvector.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `skill_text` | String | | Original skill text |
| `normalized_text` | String | | Lowercased, trimmed |
| `embedding` | Vector(1536) | HNSW indexed | PCA-reduced from 3072 dims |
| `source_type` | String | | "user", "job_posting", etc. |
| `source_id` | String | | FK to source entity |
| `embedding_model` | String | | e.g., "text-embedding-3-large-pca" |
| `token_count` | Integer | | |

**Index**: HNSW on `embedding` with `vector_cosine_ops` (cosine distance)

**Methods**: `similarity_to(other_embedding)` - numpy cosine similarity calculation

---

## 6. skill_taxonomy

**File**: `backend/app/models/skill_taxonomy.py`
**Purpose**: Canonical skill definitions with aliases for normalization and matching.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | Integer | PK | |
| `canonical_name` | String | Unique | Canonical skill name |
| `category` | String | | Skill category |
| `aliases` | JSON | | List of alternative names |

**Seed Data**: `SEED_SKILLS` list with 120+ skills across categories: technical, soft, domain, certification, programming, cloud_infrastructure, data_analytics, leadership_management, tools, methodology.

**Methods**: `matches(skill_name)` - Checks if a skill name matches canonical or any alias.

---

## 7. user_skills

**File**: `backend/app/models/skill_progress.py`
**Purpose**: Individual skill tracking with proficiency levels and learning status.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK(user_profiles.id) | |
| `skill_name` | String | | |
| `category` | String | | Skill category |
| `status` | String | | not_started, in_progress, completed |
| `proficiency_level` | Integer | | 0-5 scale (None to Expert) |
| `source` | String | | resume, job_gap, manual, roadmap |
| `started_at` | DateTime | Nullable | |
| `completed_at` | DateTime | Nullable | |
| `last_updated_at` | DateTime | | |

**Proficiency Scale**: 0=None, 1=Beginner, 2=Elementary, 3=Intermediate, 4=Advanced, 5=Expert. Level >= 3 syncs to `user_profiles.skills` for matching.

---

## 8. skill_modules

**File**: `backend/app/models/skill_progress.py`
**Purpose**: Learning modules within a skill, with AI-generated content.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `skill_name` | String | | Parent skill |
| `module_number` | Integer | | Sequence within skill |
| `title` | String | | Module title |
| `description` | Text | | Module description |
| `sequence_order` | Integer | | Display order |
| `estimated_hours` | Integer | | Time estimate |
| `skill_type` | String | | technical, soft, tool |
| `learning_content` | JSONB | | AI-generated (guides, exercises, criteria) |
| `external_resources` | JSONB | | External learning links |
| `ey_resources` | JSONB | | EY-specific resources (Credly, Virtual Academy, Tech MBA) |

---

## 9. user_module_progress

**File**: `backend/app/models/skill_progress.py`
**Purpose**: Per-user progress tracking for each learning module, including proof of completion.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_skill_id` | UUID | FK(user_skills.id) | |
| `module_id` | UUID | FK(skill_modules.id) | |
| `status` | String | | not_started, in_progress, completed |
| `progress_percentage` | Integer | | 0-100 |
| `started_at` | DateTime | Nullable | |
| `completed_at` | DateTime | Nullable | |
| `tasks_completed` | JSONB | | Checklist state {"0": true, "1": false} |
| `proof_description` | Text | Nullable | Completion proof text |
| `proof_link` | String | Nullable | External proof URL |
| `proof_file_data` | LargeBinary | Nullable | BYTEA in PostgreSQL (file upload) |
| `proof_file_name` | String | Nullable | Original filename |
| `proof_file_type` | String | Nullable | MIME type |
| `ai_feedback` | Text | Nullable | AI review of proof submission |

---

## 10. user_skill_recommendations

**File**: `backend/app/models/skill_recommendation.py`
**Purpose**: AI-generated skill recommendations from multiple sources.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK(user_profiles.id) | |
| `skill_name` | String | | Recommended skill |
| `category` | String | | Skill category |
| `priority_score` | Numeric | | 0-1 priority ranking |
| `source` | String | | saved_matches, career_goal, llm_bootstrap |
| `related_job_ids` | JSONB | | Jobs that need this skill |
| `status` | String | | recommended, in_progress, completed, dismissed |
| `user_notes` | Text | Nullable | User's notes |

---

## 11. career_paths

**File**: `backend/app/models/career_path.py`
**Purpose**: User's career path visualization data in ReactFlow format.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK(user_profiles.id), Unique | One per user |
| `current_position_node_id` | String | | Current node in graph |
| `target_position_node_id` | String | | Target node in graph |
| `graph_data` | JSONB | | ReactFlow format (nodes, edges) |
| `progression_status` | JSONB | | Current progression state |
| `last_updated_at` | DateTime | | |

---

## 12. saved_roadmaps

**File**: `backend/app/models/roadmap.py`
**Purpose**: AI-generated career roadmaps with phases and milestones.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK(user_profiles.id) | |
| `title` | String | | Roadmap title |
| `target_role_titles` | JSONB | | Target roles list |
| `total_phases` | Integer | | Number of phases |
| `total_milestones` | Integer | | Total milestones across phases |
| `estimated_months` | Integer | | Time estimate |
| `emphasis` | String | | technical, leadership, balanced |
| `executive_summary` | Text | | AI-generated summary |
| `roadmap_data` | JSONB | | Full roadmap JSON (phases, milestones, resources) |
| `edit_mode` | String | | view, suggest, edit |
| `has_manual_edits` | Boolean | | Whether user has edited |
| `current_phase_id` | String | | Active phase identifier |

---

## 13. roadmap_milestone_progress

**File**: `backend/app/models/roadmap_progress.py`
**Purpose**: Completion tracking for individual milestones within roadmaps.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `roadmap_id` | UUID | FK(saved_roadmaps.id) | |
| `milestone_id` | String | | Milestone identifier |
| `phase_id` | String | | Parent phase identifier |
| `status` | String | | pending, completed |
| `completed_at` | DateTime | Nullable | |
| `notes` | Text | Nullable | User notes |

---

## 14. roadmap_extras

**File**: `backend/app/models/roadmap_progress.py`
**Purpose**: User-added achievements not in the original AI-generated roadmap.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `roadmap_id` | UUID | FK(saved_roadmaps.id) | |
| `title` | String | | Achievement title |
| `description` | Text | Nullable | |
| `category` | String | | certification, skill, project, achievement |

---

## 15. roadmap_edits

**File**: `backend/app/models/roadmap_progress.py`
**Purpose**: Audit trail for all roadmap modifications (AI-assisted and manual).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `roadmap_id` | UUID | FK(saved_roadmaps.id) | |
| `edit_type` | String | | Type of modification |
| `change_description` | String | | Human-readable description |
| `affected_elements` | JSONB | | Which roadmap parts changed |
| `original_values` | JSONB | | Pre-edit state |
| `new_values` | JSONB | | Post-edit state |

---

## 16. hm_saved_jobs

**File**: `backend/app/models/hm_saved_job.py`
**Purpose**: Hiring manager's bookmarked job postings with notes.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `hm_user_id` | UUID | FK(user_profiles.id) | Hiring manager user |
| `job_posting_id` | String | FK(job_postings.id) | |
| `notes` | Text | Nullable | HM notes |

---

## Entity Relationship Diagram (Textual)

```
user_profiles (1) ──── (N) matches
user_profiles (1) ──── (N) user_skills
user_profiles (1) ──── (N) user_skill_recommendations
user_profiles (1) ──── (1) career_paths
user_profiles (1) ──── (N) saved_roadmaps
user_profiles (1) ──── (N) hm_saved_jobs
user_profiles (N) ──── (1) employees  [via employee_id FK]

employees (1) ──── (N) matches

job_postings (1) ──── (N) matches
job_postings (1) ──── (N) hm_saved_jobs

user_skills (1) ──── (N) user_module_progress
skill_modules (1) ──── (N) user_module_progress

saved_roadmaps (1) ──── (N) roadmap_milestone_progress
saved_roadmaps (1) ──── (N) roadmap_extras
saved_roadmaps (1) ──── (N) roadmap_edits
```

---

## pgvector Columns

| Table | Column | Dimensions | Index Type | Distance Metric |
|-------|--------|------------|------------|-----------------|
| `user_profiles` | `resume_embedding` | 1536 | None (query-only) | Cosine |
| `job_postings` | `description_embedding` | 1536 | None (query-only) | Cosine |
| `job_postings` | `title_embedding` | 1536 | None (query-only) | Cosine |
| `skill_embeddings` | `embedding` | 1536 | HNSW (`vector_cosine_ops`) | Cosine (`<=>`) |

All vectors are 1536 dimensions (PCA-reduced from OpenAI's native 3072-dimension `text-embedding-3-large` output).

---

## Migration History

| Version | Description |
|---------|-------------|
| 001 | Initial schema: employees, job_postings, matches, user_profiles, career_paths |
| 002 | Add indexes |
| 003 | Add relationships |
| 004 | Job posting status and search |
| 005 | Job posting tags and sections |
| 006 | Search vector include sections |
| 007 | User skill recommendations table |
| 008 | User-employee mapping (employee_id FK) |
| 009 | Job posting external_id |
| 010-011 | Backfill job posting columns |
| 012 | Job posting timestamps |
| 013 | Normalize job posting types |
| 014 | Employee updated_at |
| 015 | Remove seed jobs |
| 016 | LLM skill columns (llm_required_skills, llm_inferred_skills, etc.) |
| 017 | Skill embeddings table + pgvector extension |
| 018 | Skill progress tables (user_skills, skill_modules, user_module_progress) |
| 019 | Make match employee_id nullable |
| 020 | Saved roadmaps table |
| 021 | Skill groupings column on user_profiles |
| 022 | Roadmap progress tables (milestone_progress, extras, edits) |
| 023 | Performance indexes |
| 024 | Proficiency and proof fields |
| 025 | Tasks completed field |
| 026 | Hiring manager tables (hm_saved_jobs) |
