"""
Skills API routes for skill extraction and management.

Endpoints:
- GET /api/skills/me - Get current user's saved skills
- GET /api/skills/me/progress - Get user's skills with module progress
- POST /api/skills/{skill_name}/start - Start learning a skill
- PATCH /api/skills/{skill_name}/modules/{module_id}/progress - Update module progress
- POST /api/skills/{skill_name}/modules/{module_id}/complete - Complete a module
- POST /api/skills/extract - Extract skills from text
- POST /api/skills/upload - Upload resume file and extract skills
- GET /api/skills/taxonomy - Get full skill taxonomy
- POST /api/skills/taxonomy/seed - Seed skill taxonomy database
- GET /api/skills/recommendations - Get skill recommendations
- PATCH /api/skills/recommendations/{skill_name}/status - Update status
"""

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.skill import (
    Skill,
    SkillExtractionRequest,
    SkillExtractionResponse,
    ResumeUploadResponse,
    SkillTaxonomyEntry,
    SkillTaxonomyResponse,
    SkillRecommendationsResponse,
    UserSkillsResponse,
)
from app.services.resume_parser import parse_resume, validate_file_type
from app.services.skill_extractor import extract_skills_from_text
from app.services.skill_normalizer import (
    normalize_and_deduplicate,
    categorize_skills,
    seed_skill_taxonomy,
    get_taxonomy_stats,
    get_normalizer_cache,
)
from app.models.skill_taxonomy import SkillTaxonomy
from app.models.skill_recommendation import UserSkillRecommendation
from app.services.recommendation_service import SkillRecommendationService
from app.services.embedding_integration import vectorize_user_skills_and_resume
from app.services.skill_progress_service import SkillProgressService
from app.utils.security import get_current_user_from_token
from app.schemas.skill_progress import UserSkillsWithProgressResponse
from app.utils.skill_categorizer import categorize_skill
from app.models.user_profile import UserProfile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/skills", tags=["skills"])


class RecommendationStatusUpdate(BaseModel):
    status: str = Field(..., description="New status: recommended, in_progress, dismissed")


# ============================================
# User Skills Endpoints
# ============================================

@router.get(
    "/me",
    response_model=UserSkillsResponse,
    summary="Get current user's saved skills",
    description="Returns the skills saved in the user's profile.",
)
async def get_user_skills(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Get the current user's saved skills.

    Returns skills that have been extracted from resume or manually added.
    """
    user_skills = current_user.skills or []

    # Convert string skill names to Skill objects with category inference
    skills = []
    for skill_name in user_skills:
        if not skill_name:
            continue
        # Infer category from skill name
        category = _infer_skill_category(skill_name)
        skills.append(Skill(
            name=skill_name,
            category=category,
            proficiency="intermediate",  # Default proficiency
        ))

    return UserSkillsResponse(
        skills=skills,
        total_count=len(skills),
    )


def _infer_skill_category(skill_name: str) -> str:
    """Infer skill category from skill name. Delegates to shared categorize_skill."""
    return categorize_skill(skill_name)


# ============================================
# Module Tracking Endpoints
# ============================================

@router.get("/me/progress", response_model=UserSkillsWithProgressResponse)
async def get_user_skills_with_progress(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Get user's skills with real module progress tracking."""
    # Pass user_profile so service can access AI skill_groupings for module counts
    service = SkillProgressService(db, user_profile=current_user)
    skills = service.get_user_skills_with_progress(current_user.id)
    return UserSkillsWithProgressResponse(skills=skills, total_count=len(skills))


@router.post("/{skill_name}/start")
async def start_skill(
    skill_name: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Start learning a skill - initializes modules from AI groupings or defaults."""
    service = SkillProgressService(db, user_profile=current_user)
    user_skill = service.start_skill(current_user.id, skill_name)
    return {"status": "started", "skill_id": str(user_skill.id)}


@router.patch("/{skill_name}/modules/{module_id}/progress")
async def update_module_progress(
    skill_name: str,
    module_id: str,
    progress: int = Body(..., ge=0, le=100, embed=True),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Update progress percentage on a module."""
    service = SkillProgressService(db, user_profile=current_user)
    try:
        result = service.update_module_progress(
            current_user.id, skill_name, UUID(module_id), progress
        )
        return {"status": result.status, "progress": result.progress_percentage}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{skill_name}/modules/{module_id}/complete")
async def complete_module(
    skill_name: str,
    module_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Mark a module as complete."""
    service = SkillProgressService(db, user_profile=current_user)
    try:
        result = service.complete_module(current_user.id, skill_name, UUID(module_id))
        return {"status": "completed", "completed_at": result.completed_at.isoformat()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{skill_name}/complete")
async def complete_skill(
    skill_name: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Mark an entire skill as complete (all modules)."""
    service = SkillProgressService(db, user_profile=current_user)
    try:
        result = service.complete_skill(current_user.id, skill_name)
        return {"status": "completed", "completed_at": result.completed_at.isoformat()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================
# Skill Extraction Endpoints
# ============================================

@router.post(
    "/extract",
    response_model=SkillExtractionResponse,
    summary="Extract skills from text",
    description="Extract structured skills from resume text or profile description using GPT-5 nano."
)
async def extract_skills(
    request: SkillExtractionRequest,
    _current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Extract skills from text using LLM.

    - **text**: Resume text or profile description (10-50000 characters)

    Returns structured skills with categories and proficiency levels.
    """
    try:
        # Extract skills using LLM
        result = await extract_skills_from_text(request.text)

        # Combine listed and inferred skills
        all_skills = result.listed_skills + result.inferred_skills

        # Normalize and deduplicate
        normalized_skills = normalize_and_deduplicate(all_skills, db)

        # Categorize
        categories = categorize_skills(normalized_skills)

        # Persist extracted skills to user profile
        _current_user.skills = [skill.name for skill in normalized_skills]
        db.commit()

        # Vectorize skills for semantic matching
        skill_names = [skill.name for skill in normalized_skills]
        embedding_result = await vectorize_user_skills_and_resume(
            db=db,
            user=_current_user,
            skills=skill_names,
            resume_text=request.text,  # Also vectorize the input text
        )
        logger.info(f"Embedding result: {embedding_result}")

        # Refresh recommendations after skill update
        service = SkillRecommendationService(db)
        await service.compute_recommendations(_current_user.id)

        return SkillExtractionResponse(
            skills=normalized_skills,
            total_count=len(normalized_skills),
            categories=categories,
            tokens_used=result.tokens_used,
            cost_usd=result.cost_usd
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Skill extraction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Skill extraction failed: {str(e)}"
        )


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    summary="Upload resume and extract skills",
    description="Upload a PDF, DOCX, or TXT resume file and extract skills."
)
async def upload_resume(
    file: UploadFile = File(..., description="Resume file (PDF, DOCX, or TXT)"),
    _current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Upload resume file and extract skills.

    - **file**: Resume file (PDF, DOCX, or TXT, max 10MB)

    Parses the file, extracts text, and returns structured skills.
    """
    # Validate file type
    if not validate_file_type(file.filename, file.content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported: PDF, DOCX, TXT"
        )

    try:
        # Read file content
        content = await file.read()

        # Parse resume
        text, file_type = parse_resume(content, file.filename, file.content_type)

        # Extract skills
        result = await extract_skills_from_text(text)

        # Combine listed and inferred skills
        all_skills = result.listed_skills + result.inferred_skills

        # Normalize and deduplicate
        normalized_skills = normalize_and_deduplicate(all_skills, db)

        # Categorize
        categories = categorize_skills(normalized_skills)

        # Persist extracted skills to user profile
        _current_user.skills = [skill.name for skill in normalized_skills]
        db.commit()

        # Vectorize skills and resume for semantic matching
        skill_names = [skill.name for skill in normalized_skills]
        embedding_result = await vectorize_user_skills_and_resume(
            db=db,
            user=_current_user,
            skills=skill_names,
            resume_text=text,  # Vectorize the full resume text
        )
        logger.info(f"Resume embedding result: {embedding_result}")

        # Refresh recommendations after skill update
        service = SkillRecommendationService(db)
        await service.compute_recommendations(_current_user.id)

        return ResumeUploadResponse(
            filename=file.filename,
            file_type=file_type,
            text_length=len(text),
            skills=normalized_skills,
            total_count=len(normalized_skills),
            categories=categories
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Resume upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume processing failed: {str(e)}"
        )


# ============================================
# Skill Taxonomy Endpoints
# ============================================

@router.get(
    "/taxonomy",
    response_model=SkillTaxonomyResponse,
    summary="Get skill taxonomy",
    description="Get the full skill taxonomy for autocomplete and validation."
)
async def get_taxonomy(
    category: str = None,
    _current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Get skill taxonomy entries.

    - **category**: Optional filter by category (technical, soft, domain, certification)

    Returns list of canonical skill names with aliases.
    """
    query = db.query(SkillTaxonomy)

    if category:
        query = query.filter(SkillTaxonomy.category == category)

    taxonomies = query.order_by(SkillTaxonomy.canonical_name).all()

    # If database is empty, return from seed data
    if not taxonomies:
        from app.models.skill_taxonomy import SEED_SKILLS
        skills = []
        for skill in SEED_SKILLS:
            if category and skill["category"] != category:
                continue
            skills.append(SkillTaxonomyEntry(
                canonical_name=skill["canonical_name"],
                category=skill["category"],
                aliases=skill.get("aliases", [])
            ))

        categories_count = {}
        for skill in skills:
            cat = skill.category
            categories_count[cat] = categories_count.get(cat, 0) + 1

        return SkillTaxonomyResponse(
            skills=skills,
            total_count=len(skills),
            categories=categories_count
        )

    # Convert to response model
    skills = [
        SkillTaxonomyEntry(
            canonical_name=t.canonical_name,
            category=t.category,
            aliases=t.aliases or []
        )
        for t in taxonomies
    ]

    # Get category counts
    stats = get_taxonomy_stats(db)

    return SkillTaxonomyResponse(
        skills=skills,
        total_count=len(skills),
        categories=stats["categories"]
    )


@router.post(
    "/taxonomy/seed",
    summary="Seed skill taxonomy",
    description="Seed the skill taxonomy database with initial data."
)
async def seed_taxonomy(
    _current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Seed the skill taxonomy database.

    Populates the skill_taxonomy table with 200+ common skills
    including aliases for normalization.
    """
    try:
        count = seed_skill_taxonomy(db)
        stats = get_taxonomy_stats(db)

        return {
            "message": f"Seeded {count} new skills",
            "total_skills": stats["total_skills"],
            "categories": stats["categories"]
        }

    except Exception as e:
        logger.error(f"Taxonomy seeding failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Taxonomy seeding failed: {str(e)}"
        )


@router.get(
    "/taxonomy/search",
    summary="Search skill taxonomy",
    description="Search for skills by name (supports autocomplete)."
)
async def search_taxonomy(
    q: str,
    limit: int = 10,
    _current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Search skill taxonomy by name.

    - **q**: Search query (minimum 2 characters)
    - **limit**: Maximum results (default 10)

    Returns matching skills for autocomplete.
    """
    if len(q) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 2 characters"
        )

    # Search canonical names
    taxonomies = db.query(SkillTaxonomy).filter(
        SkillTaxonomy.canonical_name.ilike(f"%{q}%")
    ).limit(limit).all()

    results = [
        {
            "name": t.canonical_name,
            "category": t.category
        }
        for t in taxonomies
    ]

    # If no database results, search seed data
    if not results:
        from app.models.skill_taxonomy import SEED_SKILLS
        for skill in SEED_SKILLS:
            if q.lower() in skill["canonical_name"].lower():
                results.append({
                    "name": skill["canonical_name"],
                    "category": skill["category"]
                })
                if len(results) >= limit:
                    break

    return {
        "query": q,
        "results": results,
        "count": len(results)
    }


# ============================================
# Skill Recommendation Endpoints
# ============================================

@router.get(
    "/recommendations",
    response_model=SkillRecommendationsResponse,
    summary="Get personalized skill recommendations",
    description="Aggregate recommendations from saved matches, career goals, and LLM bootstrap.",
)
async def get_skill_recommendations(
    refresh: bool = False,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Get aggregated skill recommendations.

    - **user_id**: Optional UUID (required when auth is not wired)
    - **refresh**: Recompute recommendations if true
    """
    service = SkillRecommendationService(db)

    if refresh:
        recommendations = await service.compute_recommendations(current_user.id)
    else:
        recommendations = (
            db.query(UserSkillRecommendation)
            .filter(UserSkillRecommendation.user_id == current_user.id)
            .filter(UserSkillRecommendation.status != "dismissed")
            .order_by(UserSkillRecommendation.priority_score.desc())
            .all()
        )

        if not recommendations:
            recommendations = await service.compute_recommendations(current_user.id)

    return SkillRecommendationsResponse(
        recommendations=[
            {
                "skill": rec.skill_name,
                "category": rec.category,
                "priority": float(rec.priority_score),
                "source": rec.source,
                "related_roles": rec.related_job_ids,
                "status": rec.status,
            }
            for rec in recommendations
        ]
    )


@router.patch(
    "/recommendations/{skill_name}/status",
    summary="Update recommendation status",
    description="Update recommendation status: recommended, in_progress, dismissed.",
)
async def update_recommendation_status(
    skill_name: str,
    payload: RecommendationStatusUpdate,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Update recommendation status for a user.

    - **user_id**: Optional UUID (required when auth is not wired)
    """
    status_value = payload.status.strip()
    if status_value not in {"recommended", "in_progress", "dismissed"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    rec = (
        db.query(UserSkillRecommendation)
        .filter(UserSkillRecommendation.user_id == current_user.id)
        .filter(UserSkillRecommendation.skill_name.ilike(skill_name))
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = status_value
    db.commit()

    return {"skill": rec.skill_name, "status": rec.status}


# ============================================
# Skill Plan Generation
# ============================================

class SkillPlanNode(BaseModel):
    id: str
    type: str = "skillNode"
    position: dict = {"x": 0, "y": 0}
    data: dict


class SkillPlanEdge(BaseModel):
    id: str
    source: str
    target: str
    markerEnd: dict = {"type": "arrowclosed", "width": 16, "height": 16}
    style: dict = {"stroke": "rgba(255,255,255,0.55)", "strokeWidth": 3}


class SkillPlanResponse(BaseModel):
    job_id: str
    job_title: str
    nodes: List[SkillPlanNode]
    edges: List[SkillPlanEdge]
    summary: dict


@router.post(
    "/plan/{job_id}",
    response_model=SkillPlanResponse,
    summary="Generate personalized skill plan for a job",
    description="Generate a skill tree showing what the user needs to learn for a specific role."
)
async def generate_skill_plan(
    job_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Generate a personalized skill development plan for a specific job.

    Returns a skill tree structure compatible with React Flow visualization.
    Skills are grouped by category and marked as 'have' or 'need'.
    """
    from app.models.job_posting import JobPosting
    from app.services.recommendation_service import SkillRecommendationService

    # Get the job posting
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Get user's current skills (lowercase for comparison)
    user_skills_lower = {s.lower() for s in (current_user.skills or [])}

    # Get job's required and preferred skills
    required_skills = []
    if job.llm_required_skills:
        required_skills = [s["name"] for s in job.llm_required_skills if isinstance(s, dict) and s.get("name")]
    elif job.required_skills:
        required_skills = job.required_skills or []

    preferred_skills = []
    if job.llm_inferred_skills:
        preferred_skills = [s["name"] for s in job.llm_inferred_skills if isinstance(s, dict) and s.get("name")]
    elif job.preferred_skills:
        preferred_skills = job.preferred_skills or []

    # Categorize skills
    skill_categories = {
        "Technical": [],
        "Leadership": [],
        "Domain": [],
        "Tools": [],
    }

    def categorize_skill(skill_name: str) -> str:
        """Simple skill categorization based on keywords."""
        lower = skill_name.lower()
        leadership_keywords = ["leadership", "management", "communication", "team", "stakeholder", "mentor", "coaching", "strategy", "negotiation"]
        domain_keywords = ["audit", "tax", "advisory", "consulting", "financial", "compliance", "regulatory", "accounting", "risk"]
        tool_keywords = ["excel", "python", "sql", "tableau", "power bi", "sap", "oracle", "salesforce", "aws", "azure", "gcp", "jira", "confluence"]

        for kw in leadership_keywords:
            if kw in lower:
                return "Leadership"
        for kw in domain_keywords:
            if kw in lower:
                return "Domain"
        for kw in tool_keywords:
            if kw in lower:
                return "Tools"
        return "Technical"

    # Process required skills
    all_skills = [(s, True) for s in required_skills] + [(s, False) for s in preferred_skills]
    skills_have = []
    skills_need = []

    for skill_name, is_required in all_skills:
        has_skill = skill_name.lower() in user_skills_lower
        category = categorize_skill(skill_name)

        skill_info = {
            "name": skill_name,
            "required": is_required,
            "has": has_skill,
        }

        if has_skill:
            skills_have.append(skill_info)
        else:
            skills_need.append(skill_info)

        skill_categories[category].append(skill_info)

    # Build React Flow nodes and edges
    nodes = []
    edges = []

    # Root node (the role)
    nodes.append(SkillPlanNode(
        id="role",
        data={"label": job.title, "kind": "role", "emphasis": "goal"}
    ))

    # Category nodes and skill nodes
    for cat_idx, (category, skills) in enumerate(skill_categories.items()):
        if not skills:
            continue

        cat_id = f"cat-{cat_idx}"
        nodes.append(SkillPlanNode(
            id=cat_id,
            data={"label": category, "kind": "path"}
        ))

        # Edge from role to category (accent style)
        edges.append(SkillPlanEdge(
            id=f"role__{cat_id}",
            source="role",
            target=cat_id,
            style={"stroke": "rgba(255,230,0,0.70)", "strokeWidth": 3.5}
        ))

        # Skill nodes within this category
        for skill_idx, skill_info in enumerate(skills):
            skill_id = f"{cat_id}-skill-{skill_idx}"
            nodes.append(SkillPlanNode(
                id=skill_id,
                data={
                    "label": skill_info["name"],
                    "kind": "skill",
                    "has": skill_info["has"],
                    "required": skill_info["required"],
                }
            ))

            # Edge from category to skill (green if user has it, default otherwise)
            edge_style = (
                {"stroke": "rgba(34, 197, 94, 0.7)", "strokeWidth": 3}
                if skill_info["has"]
                else {"stroke": "rgba(255,255,255,0.55)", "strokeWidth": 3}
            )
            edges.append(SkillPlanEdge(
                id=f"{cat_id}__{skill_id}",
                source=cat_id,
                target=skill_id,
                style=edge_style
            ))

    # Summary stats
    total_skills = len(skills_have) + len(skills_need)
    summary = {
        "total_skills": total_skills,
        "skills_have": len(skills_have),
        "skills_need": len(skills_need),
        "match_percent": round(len(skills_have) / total_skills * 100) if total_skills > 0 else 0,
        "skills_have_list": [s["name"] for s in skills_have],
        "skills_need_list": [s["name"] for s in skills_need],
    }

    return SkillPlanResponse(
        job_id=str(job.id),
        job_title=job.title,
        nodes=nodes,
        edges=edges,
        summary=summary,
    )


# ============================================
# Utility Endpoints
# ============================================

@router.post(
    "/normalize",
    summary="Normalize skill names",
    description="Normalize a list of skill names to their canonical forms."
)
async def normalize_skills(
    skills: List[str],
    _current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Normalize skill names to canonical forms.

    - **skills**: List of skill names to normalize

    Returns mapping of original → canonical names.
    """
    from app.services.skill_normalizer import normalize_skill

    results = {}
    for skill in skills:
        normalized = normalize_skill(skill, db)
        results[skill] = normalized

    return {
        "normalized": results,
        "count": len(results)
    }


@router.get(
    "/stats",
    summary="Get skill extraction stats",
    description="Get statistics about skill extraction and taxonomy."
)
async def get_stats(
    _current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Get skill extraction statistics.

    Returns taxonomy stats and cache info.
    """
    cache = get_normalizer_cache()
    taxonomy_stats = get_taxonomy_stats(db)

    return {
        "taxonomy": taxonomy_stats,
        "cache": {
            "initialized": cache.is_initialized,
            "entries": len(cache._cache) if cache.is_initialized else 0
        }
    }


# ============================================
# AI Skill Grouping Endpoints
# ============================================

class SkillGroupingRequest(BaseModel):
    skills: List[str] = Field(..., description="List of skill names to group")
    career_context: Optional[str] = Field(None, description="Optional career goals context")


class SkillEnhanceRequest(BaseModel):
    existing_groupings: dict = Field(..., description="Current skill groupings structure")
    new_skills: List[str] = Field(..., description="New skills to integrate")


@router.post(
    "/group",
    summary="Generate AI-powered skill groupings",
    description="Group extracted skills into categories with learning modules using GPT-5.2."
)
async def group_skills(
    request: SkillGroupingRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Generate AI-powered skill groupings with learning modules.

    Sends extracted skills to GPT-5.2-chat-latest for intelligent categorization.
    Results are saved to user profile for persistence.
    Also creates/updates progress tracking for all skills.
    """
    from app.services.skill_grouping_service import generate_skill_groupings

    result = await generate_skill_groupings(
        skills=request.skills,
        context=request.career_context
    )

    # Save groupings to user profile for persistence
    current_user.skill_groupings = result
    db.add(current_user)
    db.flush()  # Flush so skill_groupings is available for progress service

    # Create UserSkill tracking records for all skills using AI-generated modules
    service = SkillProgressService(db, user_profile=current_user)
    for skill_name in request.skills:
        try:
            service.start_skill(current_user.id, skill_name)
        except Exception as e:
            logger.debug(f"Skill tracking for {skill_name}: {e}")

    db.commit()
    logger.info(f"Generated groupings with {len(result.get('categories', []))} categories and created tracking")

    return result


@router.post(
    "/enhance",
    summary="Enhance skill groupings with new skills",
    description="Intelligently merge new skills from saved roles into existing groupings."
)
async def enhance_skills(
    request: SkillEnhanceRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Enhance existing skill groupings with new skills from saved roles.

    Uses GPT-5.2-chat-latest to intelligently merge new skills into
    existing categories or create new ones as needed.
    Also adds new skills to user's skill list and creates progress tracking.
    """
    from app.services.skill_grouping_service import enhance_skill_groupings

    result = await enhance_skill_groupings(
        existing_groupings=request.existing_groupings,
        new_skills=request.new_skills
    )

    # Save updated groupings to user profile
    current_user.skill_groupings = result

    # Also add new skills to user's main skills list (avoid duplicates)
    existing_skills = set(s.lower() for s in (current_user.skills or []))
    new_skills_to_add = [s for s in request.new_skills if s.lower() not in existing_skills]

    if new_skills_to_add:
        current_user.skills = (current_user.skills or []) + new_skills_to_add
        logger.info(f"Added {len(new_skills_to_add)} new skills to user profile: {new_skills_to_add}")

        # Create UserSkill tracking records for new skills
        # Pass the updated user_profile so service can access new groupings
        db.add(current_user)
        db.flush()  # Flush so user_profile.skill_groupings is available

        service = SkillProgressService(db, user_profile=current_user)
        for skill_name in new_skills_to_add:
            try:
                service.start_skill(current_user.id, skill_name)
                logger.info(f"Created progress tracking for skill: {skill_name}")
            except Exception as e:
                logger.warning(f"Could not create tracking for {skill_name}: {e}")

    db.commit()

    return result


@router.get(
    "/groupings",
    summary="Get user's skill groupings",
    description="Get the user's saved AI-generated skill groupings."
)
async def get_skill_groupings(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Get the user's saved skill groupings.

    Returns the AI-generated skill categories and modules.
    """
    groupings = current_user.skill_groupings or {"categories": []}
    return groupings


# ============================================
# CRUD for Skill Categories and Modules
# ============================================

class CategoryCreateRequest(BaseModel):
    name: str = Field(..., description="Category name")
    emoji: str = Field(default="star", description="Emoji for the category")
    description: Optional[str] = Field(None, description="Category description")
    skills: List[str] = Field(default_factory=list, description="Skills in this category")


class CategoryUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, description="New category name")
    emoji: Optional[str] = Field(None, description="New emoji")
    description: Optional[str] = Field(None, description="New description")


class ModuleCreateRequest(BaseModel):
    name: str = Field(..., description="Module name")
    description: str = Field(default="", description="Module description")


class ModuleUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, description="New module name")
    description: Optional[str] = Field(None, description="New description")


@router.post(
    "/groupings/categories",
    summary="Create a new skill category",
    description="Add a new skill category with optional skills and modules."
)
async def create_category(
    request: CategoryCreateRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Create a new skill category."""
    import uuid

    groupings = current_user.skill_groupings or {"categories": []}
    categories = groupings.get("categories", [])

    # Generate unique ID
    cat_id = f"cat_{uuid.uuid4().hex[:8]}"

    new_category = {
        "id": cat_id,
        "name": request.name,
        "emoji": request.emoji,
        "description": request.description or f"Skills related to {request.name}",
        "skills": request.skills,
        "modules": [
            {"id": f"{cat_id}_mod_1", "name": "Fundamentals", "description": "Core concepts", "order": 1},
            {"id": f"{cat_id}_mod_2", "name": "Intermediate", "description": "Building expertise", "order": 2},
            {"id": f"{cat_id}_mod_3", "name": "Advanced", "description": "Advanced level", "order": 3},
            {"id": f"{cat_id}_mod_4", "name": "Mastery", "description": "Expert level", "order": 4},
        ]
    }

    categories.append(new_category)
    groupings["categories"] = categories
    current_user.skill_groupings = groupings
    db.add(current_user)
    db.commit()

    return {"created": True, "category": new_category}


@router.put(
    "/groupings/categories/{category_id}",
    summary="Update a skill category",
    description="Update category name, emoji, or description."
)
async def update_category(
    category_id: str,
    request: CategoryUpdateRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Update an existing skill category."""
    groupings = current_user.skill_groupings or {"categories": []}
    categories = groupings.get("categories", [])

    cat_idx = next((i for i, c in enumerate(categories) if c.get("id") == category_id), None)
    if cat_idx is None:
        raise HTTPException(status_code=404, detail="Category not found")

    if request.name is not None:
        categories[cat_idx]["name"] = request.name
    if request.emoji is not None:
        categories[cat_idx]["emoji"] = request.emoji
    if request.description is not None:
        categories[cat_idx]["description"] = request.description

    groupings["categories"] = categories
    current_user.skill_groupings = groupings
    db.add(current_user)
    db.commit()

    return {"updated": True, "category": categories[cat_idx]}


@router.delete(
    "/groupings/categories/{category_id}",
    summary="Delete a skill category",
    description="Remove a skill category and all its modules."
)
async def delete_category(
    category_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Delete a skill category."""
    groupings = current_user.skill_groupings or {"categories": []}
    categories = groupings.get("categories", [])

    cat_idx = next((i for i, c in enumerate(categories) if c.get("id") == category_id), None)
    if cat_idx is None:
        raise HTTPException(status_code=404, detail="Category not found")

    deleted_cat = categories.pop(cat_idx)
    groupings["categories"] = categories
    current_user.skill_groupings = groupings
    db.add(current_user)
    db.commit()

    return {"deleted": True, "category_id": category_id}


@router.post(
    "/groupings/categories/{category_id}/modules",
    summary="Add a module to a category",
    description="Create a new learning module within a skill category."
)
async def create_module(
    category_id: str,
    request: ModuleCreateRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Add a new module to a category."""
    import uuid

    groupings = current_user.skill_groupings or {"categories": []}
    categories = groupings.get("categories", [])

    cat_idx = next((i for i, c in enumerate(categories) if c.get("id") == category_id), None)
    if cat_idx is None:
        raise HTTPException(status_code=404, detail="Category not found")

    modules = categories[cat_idx].get("modules", [])
    max_order = max([m.get("order", 0) for m in modules], default=0)

    new_module = {
        "id": f"{category_id}_mod_{uuid.uuid4().hex[:6]}",
        "name": request.name,
        "description": request.description,
        "order": max_order + 1,
    }

    modules.append(new_module)
    categories[cat_idx]["modules"] = modules
    groupings["categories"] = categories
    current_user.skill_groupings = groupings
    db.add(current_user)
    db.commit()

    return {"created": True, "module": new_module}


@router.put(
    "/groupings/categories/{category_id}/modules/{module_id}",
    summary="Update a module",
    description="Update module name or description."
)
async def update_module(
    category_id: str,
    module_id: str,
    request: ModuleUpdateRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Update an existing module."""
    groupings = current_user.skill_groupings or {"categories": []}
    categories = groupings.get("categories", [])

    cat_idx = next((i for i, c in enumerate(categories) if c.get("id") == category_id), None)
    if cat_idx is None:
        raise HTTPException(status_code=404, detail="Category not found")

    modules = categories[cat_idx].get("modules", [])
    mod_idx = next((i for i, m in enumerate(modules) if m.get("id") == module_id), None)
    if mod_idx is None:
        raise HTTPException(status_code=404, detail="Module not found")

    if request.name is not None:
        modules[mod_idx]["name"] = request.name
    if request.description is not None:
        modules[mod_idx]["description"] = request.description

    categories[cat_idx]["modules"] = modules
    groupings["categories"] = categories
    current_user.skill_groupings = groupings
    db.add(current_user)
    db.commit()

    return {"updated": True, "module": modules[mod_idx]}


@router.delete(
    "/groupings/categories/{category_id}/modules/{module_id}",
    summary="Delete a module",
    description="Remove a learning module from a category."
)
async def delete_module(
    category_id: str,
    module_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Delete a module from a category."""
    groupings = current_user.skill_groupings or {"categories": []}
    categories = groupings.get("categories", [])

    cat_idx = next((i for i, c in enumerate(categories) if c.get("id") == category_id), None)
    if cat_idx is None:
        raise HTTPException(status_code=404, detail="Category not found")

    modules = categories[cat_idx].get("modules", [])
    mod_idx = next((i for i, m in enumerate(modules) if m.get("id") == module_id), None)
    if mod_idx is None:
        raise HTTPException(status_code=404, detail="Module not found")

    modules.pop(mod_idx)
    categories[cat_idx]["modules"] = modules
    groupings["categories"] = categories
    current_user.skill_groupings = groupings
    db.add(current_user)
    db.commit()

    return {"deleted": True, "module_id": module_id}
