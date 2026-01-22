"""
Skills API routes for skill extraction and management.

Endpoints:
- POST /api/skills/extract - Extract skills from text
- POST /api/skills/upload - Upload resume file and extract skills
- GET /api/skills/taxonomy - Get full skill taxonomy
- POST /api/skills/taxonomy/seed - Seed skill taxonomy database
- GET /api/skills/recommendations - Get skill recommendations
- PATCH /api/skills/recommendations/{skill_name}/status - Update status
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
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
from app.utils.security import get_current_user_from_token
from app.models.user_profile import UserProfile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/skills", tags=["skills"])


class RecommendationStatusUpdate(BaseModel):
    status: str = Field(..., description="New status: recommended, in_progress, dismissed")


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
        skills, usage = await extract_skills_from_text(request.text)

        # Normalize and deduplicate
        normalized_skills = normalize_and_deduplicate(skills, db)

        # Categorize
        categories = categorize_skills(normalized_skills)

        # Persist extracted skills to user profile
        _current_user.skills = [skill.name for skill in normalized_skills]
        db.commit()

        # Refresh recommendations after skill update
        service = SkillRecommendationService(db)
        await service.compute_recommendations(_current_user.id)

        return SkillExtractionResponse(
            skills=normalized_skills,
            total_count=len(normalized_skills),
            categories=categories,
            tokens_used=usage.get("total_tokens"),
            cost_usd=usage.get("cost_usd")
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
        skills, usage = await extract_skills_from_text(text)

        # Normalize and deduplicate
        normalized_skills = normalize_and_deduplicate(skills, db)

        # Categorize
        categories = categorize_skills(normalized_skills)

        # Persist extracted skills to user profile
        _current_user.skills = [skill.name for skill in normalized_skills]
        db.commit()

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
