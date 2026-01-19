"""
Skills API routes for skill extraction and management.

Endpoints:
- POST /api/skills/extract - Extract skills from text
- POST /api/skills/upload - Upload resume file and extract skills
- GET /api/skills/taxonomy - Get full skill taxonomy
- POST /api/skills/taxonomy/seed - Seed skill taxonomy database
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.skill import (
    Skill,
    SkillExtractionRequest,
    SkillExtractionResponse,
    ResumeUploadResponse,
    SkillTaxonomyEntry,
    SkillTaxonomyResponse,
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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/skills", tags=["skills"])


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
# Utility Endpoints
# ============================================

@router.post(
    "/normalize",
    summary="Normalize skill names",
    description="Normalize a list of skill names to their canonical forms."
)
async def normalize_skills(
    skills: List[str],
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
