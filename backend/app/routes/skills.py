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

Performance optimizations:
- Background tasks for vectorization (non-blocking responses)
- Async LLM calls
"""

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, Body, BackgroundTasks
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


class ProficiencyUpdate(BaseModel):
    """Request model for updating skill proficiency."""
    proficiency: int = Field(..., ge=0, le=5, description="Proficiency level 0-5")


class ModuleCompletionWithProof(BaseModel):
    """Request model for completing a module with optional proof."""
    completion_type: str = Field(default="self_reported", description="self_reported or with_proof")
    proof_description: Optional[str] = Field(None, description="Description of what was learned/built")
    proof_link: Optional[str] = Field(None, description="Link to project, certificate, etc.")
    request_ai_review: bool = Field(default=False, description="Request AI feedback on submission")


class QuickAddSkillRequest(BaseModel):
    """Request model for quickly adding a skill from job gaps."""
    skill_name: str = Field(..., description="Name of the skill to add")
    source: str = Field(default="job_gap", description="Source: job_gap, manual")


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
# Proficiency Management Endpoints
# ============================================

@router.patch("/{skill_name}/proficiency")
async def update_skill_proficiency(
    skill_name: str,
    payload: ProficiencyUpdate,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Update proficiency level for a skill (0-5 scale).

    - 0 = None
    - 1 = Beginner
    - 2 = Elementary
    - 3 = Intermediate (counts toward job matches)
    - 4 = Advanced
    - 5 = Expert

    User can change this anytime without proof required.
    Skills at proficiency 3+ are synced to the user's profile for job matching.
    """
    service = SkillProgressService(db, user_profile=current_user)
    try:
        result = service.update_proficiency(current_user.id, skill_name, payload.proficiency)
        return {
            "skill_name": result.skill_name,
            "proficiency_level": result.proficiency_level,
            "counts_for_matching": result.proficiency_level >= 3,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{skill_name}/modules/{module_id}/complete-with-proof")
async def complete_module_with_proof(
    skill_name: str,
    module_id: str,
    payload: ModuleCompletionWithProof,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Complete a module with optional proof of completion.

    Proof can include:
    - Description of what was learned/built
    - Link to project, certification, etc.
    - Optional AI review of submission for feedback
    """
    from app.models.skill_progress import UserModuleProgress, UserSkill, SkillModule
    from app.services.learning_content_service import review_proof_submission
    from datetime import datetime, timezone

    # Find the user skill and module progress
    user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_name == skill_name,
    ).first()

    if not user_skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    progress = db.query(UserModuleProgress).filter(
        UserModuleProgress.user_skill_id == user_skill.id,
        UserModuleProgress.module_id == UUID(module_id),
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Module progress not found")

    now = datetime.now(timezone.utc)

    # Update progress with proof
    progress.status = "completed"
    progress.progress_percentage = 100
    progress.completed_at = now
    progress.completion_type = payload.completion_type
    progress.proof_description = payload.proof_description
    progress.proof_link = payload.proof_link

    # Get AI feedback if requested
    ai_feedback = None
    if payload.request_ai_review and payload.proof_description:
        module = db.query(SkillModule).filter(SkillModule.id == UUID(module_id)).first()
        module_title = module.title if module else "Module"
        ai_feedback = await review_proof_submission(
            skill_name=skill_name,
            module_title=module_title,
            proof_description=payload.proof_description,
            proof_link=payload.proof_link,
        )
        progress.ai_feedback = ai_feedback

    # Update skill proficiency and check completion
    service = SkillProgressService(db, user_profile=current_user)
    service._update_skill_proficiency(user_skill)
    service._check_skill_completion(user_skill)

    db.commit()

    return {
        "status": "completed",
        "completed_at": progress.completed_at.isoformat(),
        "completion_type": progress.completion_type,
        "ai_feedback": ai_feedback,
    }


@router.post("/{skill_name}/modules/{module_id}/upload-proof")
async def upload_module_proof(
    skill_name: str,
    module_id: str,
    file: UploadFile = File(..., description="Proof file (PDF, image, etc.)"),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Upload a file as proof of module completion.
    File is stored in the database (PostgreSQL BYTEA).

    Supported formats: PDF, PNG, JPG, JPEG, GIF, DOC, DOCX, TXT
    Max size: 10MB
    """
    from app.models.skill_progress import UserModuleProgress, UserSkill

    # Allowed extensions
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'txt'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

    # Validate file extension
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type .{ext} not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # Find module progress
    user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_name == skill_name,
    ).first()

    if not user_skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    progress = db.query(UserModuleProgress).filter(
        UserModuleProgress.user_skill_id == user_skill.id,
        UserModuleProgress.module_id == UUID(module_id),
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Module progress not found")

    # Store file in database
    progress.proof_file_data = content
    progress.proof_file_name = file.filename
    progress.proof_file_type = file.content_type
    progress.completion_type = "with_proof"

    db.commit()

    return {
        "filename": file.filename,
        "size": len(content),
        "content_type": file.content_type,
    }


@router.get("/{skill_name}/modules/{module_id}/proof-file")
async def get_module_proof_file(
    skill_name: str,
    module_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Download proof file for a module.
    """
    from app.models.skill_progress import UserModuleProgress, UserSkill
    from fastapi.responses import Response

    user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_name == skill_name,
    ).first()

    if not user_skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    progress = db.query(UserModuleProgress).filter(
        UserModuleProgress.user_skill_id == user_skill.id,
        UserModuleProgress.module_id == UUID(module_id),
    ).first()

    if not progress or not progress.proof_file_data:
        raise HTTPException(status_code=404, detail="No proof file found")

    return Response(
        content=progress.proof_file_data,
        media_type=progress.proof_file_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{progress.proof_file_name or "proof"}"'
        }
    )


@router.patch("/{skill_name}/modules/{module_id}/tasks")
async def toggle_module_task(
    skill_name: str,
    module_id: str,
    task_index: int = Body(..., ge=0, description="Index of the task to toggle"),
    completed: bool = Body(..., description="Whether the task is completed"),
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Toggle completion status of a task within a module.

    Tasks are tracked by their index in the practice_exercises array.
    Progress percentage is updated based on completed tasks.
    """
    from app.models.skill_progress import UserModuleProgress, UserSkill, SkillModule

    # Find the user skill and module progress
    user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_name == skill_name,
    ).first()

    if not user_skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    progress = db.query(UserModuleProgress).filter(
        UserModuleProgress.user_skill_id == user_skill.id,
        UserModuleProgress.module_id == UUID(module_id),
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Module progress not found")

    # Get or initialize tasks_completed array
    tasks = list(progress.tasks_completed or [])

    # Toggle task completion
    if completed and task_index not in tasks:
        tasks.append(task_index)
    elif not completed and task_index in tasks:
        tasks.remove(task_index)

    progress.tasks_completed = tasks

    # Update progress percentage if we know total tasks
    # Get module to check if it has learning content with practice exercises
    module = db.query(SkillModule).filter(SkillModule.id == UUID(module_id)).first()

    # If module has started, update status
    if len(tasks) > 0 and progress.status == "not_started":
        progress.status = "in_progress"
        from datetime import datetime, timezone
        progress.started_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "tasks_completed": tasks,
        "task_count": len(tasks),
        "status": progress.status,
    }


@router.post("/{skill_name}/modules/{module_id}/generate-content")
async def generate_module_content(
    skill_name: str,
    module_id: str,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Generate AI-powered learning content for a module.

    Returns personalized learning guide, external resources, and EY resources.
    Content is saved to the database SYNCHRONOUSLY to ensure persistence.
    If content already exists, returns it without regenerating.
    """
    from app.models.skill_progress import SkillModule, UserSkill
    from app.services.learning_content_service import generate_module_learning_content
    from sqlalchemy import func

    # Get module details (case-insensitive)
    module = db.query(SkillModule).filter(SkillModule.id == UUID(module_id)).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found. Please refresh the page.")

    # FIX: Return existing content if already generated (avoids duplicate API calls)
    if module.learning_content:
        logger.info(f"Returning cached learning content for {skill_name} - {module.title}")
        return {
            "learning_guide": module.learning_content,
            "external_resources": module.external_resources or [],
            "ey_resources": module.ey_resources or [],
            "practice_exercises": [],  # Not stored separately
            "success_criteria": [],
        }

    # Get total modules for this skill (case-insensitive)
    total_modules = db.query(SkillModule).filter(
        func.lower(SkillModule.skill_name) == skill_name.lower()
    ).count()

    # Get user's current proficiency
    user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_name == skill_name,
    ).first()
    current_proficiency = user_skill.proficiency_level if user_skill else 0

    # Generate content
    content = await generate_module_learning_content(
        skill_name=skill_name,
        module_number=module.module_number,
        total_modules=total_modules,
        module_title=module.title,
        module_description=module.description or "",
        skill_type=module.skill_type,
        current_proficiency=current_proficiency,
    )

    # FIX: Save content SYNCHRONOUSLY (not in background) to ensure it persists
    module.learning_content = content.get("learning_guide", "")
    module.external_resources = content.get("external_resources", [])
    module.ey_resources = content.get("ey_resources", [])
    db.commit()
    logger.info(f"Saved learning content for {skill_name} - {module.title}")

    return content


@router.post("/quick-add")
async def quick_add_skill(
    payload: QuickAddSkillRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Quick-add a skill from job gaps to user's profile.

    Skills added this way start at proficiency 0 and don't count
    toward job matching until the user reaches proficiency 3.
    """
    service = SkillProgressService(db, user_profile=current_user)

    user_skill = service.start_skill(
        user_id=current_user.id,
        skill_name=payload.skill_name,
        source=payload.source,
        initial_proficiency=0,  # Job gap skills start at 0
    )

    return {
        "skill_id": str(user_skill.id),
        "skill_name": user_skill.skill_name,
        "proficiency": user_skill.proficiency_level,
        "source": user_skill.source,
        "counts_for_matching": False,  # Starts at 0, needs to reach 3
    }


@router.get("/stale")
async def get_stale_skills(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Get skills that haven't been updated in 6+ months.

    These skills may need refreshing or validation to ensure
    they still reflect the user's current abilities.
    """
    service = SkillProgressService(db, user_profile=current_user)
    stale_skills = service.get_skills_needing_update(current_user.id)

    return {
        "stale_skills": stale_skills,
        "count": len(stale_skills),
    }


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
    background_tasks: BackgroundTasks,
    _current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Extract skills from text using LLM.

    - **text**: Resume text or profile description (10-50000 characters)

    Returns structured skills with categories and proficiency levels.
    Vectorization and recommendation refresh happen in background (non-blocking).
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

        # IMPORTANT: Vectorize in background instead of blocking response
        skill_names = [skill.name for skill in normalized_skills]
        background_tasks.add_task(
            vectorize_skills_background,
            user_id=str(_current_user.id),
            skills=skill_names,
            resume_text=request.text,
        )

        # Refresh recommendations in background
        background_tasks.add_task(
            refresh_recommendations_background,
            user_id=str(_current_user.id),
        )

        # Invalidate match cache since skills changed
        background_tasks.add_task(
            invalidate_match_cache_background,
            user_id=str(_current_user.id),
        )

        logger.info(f"Extracted {len(normalized_skills)} skills, vectorization scheduled in background")

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


async def vectorize_skills_background(
    user_id: str,
    skills: List[str],
    resume_text: str
) -> None:
    """Background task to vectorize skills without blocking response."""
    from app.database import SessionLocal

    try:
        # Create a new database session for background task
        db = SessionLocal()
        try:
            user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
            if user:
                result = await vectorize_user_skills_and_resume(
                    db=db,
                    user=user,
                    skills=skills,
                    resume_text=resume_text,
                )
                logger.info(f"Background vectorization complete for user {user_id}: {result}")
            else:
                logger.warning(f"User {user_id} not found for background vectorization")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Background vectorization failed: {e}")


async def refresh_recommendations_background(
    user_id: str
) -> None:
    """Background task to refresh recommendations."""
    from app.database import SessionLocal

    try:
        # Create a new database session for background task
        db = SessionLocal()
        try:
            service = SkillRecommendationService(db)
            await service.compute_recommendations(user_id)
            logger.info(f"Background recommendations refresh complete for user {user_id}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Background recommendations refresh failed: {e}")


async def invalidate_match_cache_background(user_id: str) -> None:
    """Background task to invalidate match cache when skills change."""
    try:
        from app.services.match_cache_service import get_match_cache
        from app.services.matching_service import invalidate_embedding_cache

        # Invalidate user's match cache
        cache_service = get_match_cache()
        await cache_service.invalidate_user_cache(user_id)

        # Also invalidate embedding cache to ensure fresh embeddings are used
        invalidate_embedding_cache()

        logger.info(f"Match cache invalidated for user {user_id}")
    except Exception as e:
        logger.error(f"Match cache invalidation failed: {e}")


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    summary="Upload resume and extract skills",
    description="Upload a PDF, DOCX, or TXT resume file and extract skills."
)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Resume file (PDF, DOCX, or TXT)"),
    _current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Upload resume file and extract skills.

    - **file**: Resume file (PDF, DOCX, or TXT, max 10MB)

    Parses the file, extracts text, and returns structured skills.
    Vectorization and recommendation refresh happen in background (non-blocking).
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

        # IMPORTANT: Vectorize in background instead of blocking response
        skill_names = [skill.name for skill in normalized_skills]
        background_tasks.add_task(
            vectorize_skills_background,
            user_id=str(_current_user.id),
            skills=skill_names,
            resume_text=text,
        )

        # Refresh recommendations in background
        background_tasks.add_task(
            refresh_recommendations_background,
            user_id=str(_current_user.id),
        )

        # Invalidate match cache since skills changed
        background_tasks.add_task(
            invalidate_match_cache_background,
            user_id=str(_current_user.id),
        )

        logger.info(f"Uploaded resume, extracted {len(normalized_skills)} skills, vectorization scheduled in background")

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
                    "category": category,
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
    source: str = Field(default="manual", description="Source of skills: resume, manual, job_gap")


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

    # DEBUG: Log incoming source parameter
    logger.info(f"GROUP_SKILLS: source='{request.source}', skills={request.skills[:5]}...")

    result = await generate_skill_groupings(
        skills=request.skills,
        context=request.career_context
    )

    # Save groupings to user profile for persistence
    current_user.skill_groupings = result
    db.add(current_user)
    db.flush()  # Flush so skill_groupings is available for progress service

    # Create UserSkill tracking records for all skills using AI-generated modules
    # Resume skills start at proficiency 3 (assumed proficient), others start at 0
    # Use auto_commit=False to batch all operations into a single transaction
    initial_proficiency = 3 if request.source == "resume" else 0
    logger.info(f"GROUP_SKILLS: Setting initial_proficiency={initial_proficiency} for source='{request.source}'")

    service = SkillProgressService(db, user_profile=current_user)
    for skill_name in request.skills:
        try:
            service.start_skill(
                current_user.id,
                skill_name,
                source=request.source,
                initial_proficiency=initial_proficiency,
                auto_commit=False,  # Batch - commit once at the end
            )
        except Exception as e:
            logger.warning(f"Skill tracking for {skill_name} failed: {e}")

    db.commit()  # Single commit for all skills
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
        # Use auto_commit=False to batch all operations into a single transaction
        db.add(current_user)
        db.flush()  # Flush so user_profile.skill_groupings is available

        service = SkillProgressService(db, user_profile=current_user)
        for skill_name in new_skills_to_add:
            try:
                service.start_skill(
                    current_user.id,
                    skill_name,
                    source="job_gap",
                    initial_proficiency=0,  # Job gap skills start at 0
                    auto_commit=False,  # Batch - commit once at the end
                )
                logger.info(f"Created progress tracking for skill: {skill_name}")
            except Exception as e:
                logger.warning(f"Could not create tracking for {skill_name}: {e}")

    db.commit()  # Single commit for all changes

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


# ============================================
# Skill Maintenance Endpoints
# ============================================

@router.get(
    "/debug/modules/{skill_name}",
    summary="Debug: Get module content status",
    description="Check if modules have learning content in database."
)
async def debug_module_content(
    skill_name: str,
    db: Session = Depends(get_db),
):
    """Debug endpoint to check module content directly from database."""
    from app.models.skill_progress import SkillModule
    from sqlalchemy import func

    modules = db.query(SkillModule).filter(
        func.lower(SkillModule.skill_name) == skill_name.lower()
    ).order_by(SkillModule.sequence_order).all()

    return {
        "skill_name": skill_name,
        "modules": [
            {
                "id": str(m.id),
                "title": m.title,
                "has_content": bool(m.learning_content),
                "content_length": len(m.learning_content) if m.learning_content else 0,
                "content_preview": m.learning_content[:100] if m.learning_content else None,
            }
            for m in modules
        ]
    }


@router.post(
    "/recategorize",
    summary="Recategorize all user skills",
    description="Re-run skill categorization with updated keyword matching for all user skills."
)
async def recategorize_skills(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Recategorize all skills for the current user using the updated categorizer.

    This is useful after the categorizer keywords have been expanded to
    fix skills that were incorrectly categorized as 'business_acumen' or 'other'.
    """
    from app.models.skill_progress import UserSkill

    user_skills = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id
    ).all()

    updated_count = 0
    changes = []

    for skill in user_skills:
        old_category = skill.category
        new_category = categorize_skill(skill.skill_name)

        if old_category != new_category:
            skill.category = new_category
            changes.append({
                "skill": skill.skill_name,
                "old_category": old_category,
                "new_category": new_category,
            })
            updated_count += 1

    db.commit()

    logger.info(f"Recategorized {updated_count} skills for user {current_user.id}")

    return {
        "updated_count": updated_count,
        "total_skills": len(user_skills),
        "changes": changes,
    }
