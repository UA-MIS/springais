"""
Career Roadmap API Routes.

Endpoints for roadmap generation and management:
- POST /api/roadmap/generate - Generate and save a new career roadmap
- GET /api/roadmap/saved - List all saved roadmaps for user
- GET /api/roadmap/saved/{roadmap_id} - Get a specific saved roadmap
- DELETE /api/roadmap/saved/{roadmap_id} - Delete a saved roadmap
- POST /api/roadmap/chat - Chat with AI about a roadmap
"""

import logging
import os
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from openai import OpenAI

from ..schemas.roadmap import (
    RoadmapGenerateRequest,
    RoadmapResponse,
    SavedRoadmapSummary,
    SavedRoadmapDetail,
    SavedRoadmapsListResponse,
    RoadmapEmphasis,
)
from ..services.roadmap_service import RoadmapService
from ..services.roadmap_progress_service import RoadmapProgressService
from ..utils.security import get_current_user_from_token
from ..database import get_db
from ..models.user_profile import UserProfile
from ..models.roadmap import SavedRoadmap

# OpenAI client for chat
_openai_client = None

def get_openai_client():
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _openai_client

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/roadmap",
    tags=["roadmap"],
    dependencies=[Depends(get_current_user_from_token)],
)


@router.post(
    "/generate",
    response_model=RoadmapResponse,
    summary="Generate and save a career roadmap",
    description="""
    Generate a personalized career roadmap using GPT-5.2 with reasoning.
    The roadmap is automatically saved for future viewing.

    **Required:**
    - At least 1 target role (from saved roles)

    **Optional Customization:**
    - auto_order: Let AI determine optimal role progression (default: true)
    - emphasis: technical, leadership, or balanced
    - custom_instructions: Free-form text for personalization
    - include_certifications: Whether to recommend certifications
    - timeline_preference: e.g., "aggressive", "2-3 years"

    **Returns:**
    - Executive summary of the journey
    - Phased milestones with actionable steps
    - Quick wins (start immediately)
    - Critical skills to develop
    - Potential blockers to be aware of

    Note: This endpoint uses GPT-5.2 with reasoning, which may take 1-2 minutes.
    """,
)
async def generate_roadmap(
    request: RoadmapGenerateRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Generate a personalized career roadmap and auto-save it.
    """
    try:
        logger.info(
            f"Generating roadmap for user {current_user.id} with "
            f"{len(request.target_roles)} target roles, emphasis={request.emphasis.value}"
        )

        service = RoadmapService(db)
        roadmap = await service.generate_roadmap(
            user=current_user,
            request=request,
        )

        # Auto-save the roadmap
        target_titles = [r.job_title for r in request.target_roles]
        title = f"Roadmap to {target_titles[-1]}" if target_titles else "Career Roadmap"

        saved_roadmap = SavedRoadmap(
            user_id=current_user.id,
            title=title,
            target_role_titles=target_titles,
            total_phases=len(roadmap.phases),
            total_milestones=sum(len(p.milestones) for p in roadmap.phases),
            total_estimated_months=roadmap.total_estimated_months,
            emphasis=roadmap.emphasis_applied.value,
            executive_summary=roadmap.executive_summary[:500] if roadmap.executive_summary else None,
            roadmap_data=roadmap.model_dump(mode="json"),
            generated_at=roadmap.generated_at,
        )
        db.add(saved_roadmap)
        db.commit()
        db.refresh(saved_roadmap)

        # Update the roadmap_id to be the saved ID for consistency
        roadmap.roadmap_id = str(saved_roadmap.id)

        logger.info(f"Roadmap generated and saved: {saved_roadmap.id}")
        return roadmap

    except ValueError as e:
        logger.warning(f"Roadmap generation failed - validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Roadmap generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Roadmap generation failed: {str(e)}"
        )


@router.get(
    "/saved",
    response_model=SavedRoadmapsListResponse,
    summary="List saved roadmaps",
    description="Get all saved roadmaps for the current user, ordered by creation date (newest first).",
)
async def list_saved_roadmaps(
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    List all saved roadmaps for the current user.
    """
    try:
        roadmaps = (
            db.query(SavedRoadmap)
            .filter(SavedRoadmap.user_id == current_user.id)
            .order_by(SavedRoadmap.created_at.desc())
            .all()
        )

        summaries = [
            SavedRoadmapSummary(
                id=str(r.id),
                title=r.title,
                target_role_titles=r.target_role_titles,
                total_phases=r.total_phases,
                total_milestones=r.total_milestones,
                total_estimated_months=r.total_estimated_months,
                emphasis=r.emphasis,
                executive_summary=r.executive_summary,
                generated_at=r.generated_at,
                created_at=r.created_at,
            )
            for r in roadmaps
        ]

        return SavedRoadmapsListResponse(
            roadmaps=summaries,
            total_count=len(summaries),
        )

    except Exception as e:
        logger.error(f"Failed to list saved roadmaps: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve saved roadmaps: {str(e)}"
        )


@router.get(
    "/saved/{roadmap_id}",
    response_model=SavedRoadmapDetail,
    summary="Get a saved roadmap",
    description="Get the full details of a specific saved roadmap.",
)
async def get_saved_roadmap(
    roadmap_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Get a specific saved roadmap by ID.
    """
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )

    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    # Reconstruct RoadmapResponse from stored data
    roadmap_data = roadmap.roadmap_data
    roadmap_response = RoadmapResponse(**roadmap_data)

    return SavedRoadmapDetail(
        id=str(roadmap.id),
        title=roadmap.title,
        roadmap=roadmap_response,
        created_at=roadmap.created_at,
    )


@router.delete(
    "/saved/{roadmap_id}",
    summary="Delete a saved roadmap",
    description="Delete a specific saved roadmap.",
)
async def delete_saved_roadmap(
    roadmap_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Delete a saved roadmap.
    """
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )

    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    db.delete(roadmap)
    db.commit()

    return {"deleted": True, "roadmap_id": roadmap_id}


# ============================================
# Roadmap Chat
# ============================================

class RoadmapChatRequest(BaseModel):
    roadmap_id: str = Field(..., description="ID of the roadmap to chat about")
    message: str = Field(..., description="User's question about the roadmap")
    context: str = Field(..., description="JSON string of the roadmap context")


# ============================================
# Progress Tracking Schemas
# ============================================

class MilestoneToggleRequest(BaseModel):
    phase_id: str = Field(..., description="ID of the phase containing the milestone")


class MilestoneNotesRequest(BaseModel):
    phase_id: str = Field(..., description="ID of the phase containing the milestone")
    notes: str = Field(..., description="Notes for the milestone")


class ExtraCreateRequest(BaseModel):
    phase_id: str = Field(..., description="ID of the phase to add the extra to")
    title: str = Field(..., max_length=255, description="Title of the extra achievement")
    description: str | None = Field(None, description="Description of the achievement")
    category: str = Field(..., description="Category: certification, skill, project, achievement")


class EditRecordRequest(BaseModel):
    edit_type: str = Field(..., description="Type of edit: ai_assisted or manual")
    description: str = Field(..., description="Description of the change")
    affected_elements: list[str] = Field(default=[], description="IDs of affected elements")
    original_values: dict = Field(default={}, description="Original values before edit")
    new_values: dict = Field(default={}, description="New values after edit")


class AIEditRequest(BaseModel):
    instructions: str = Field(..., description="Instructions for the AI edit")
    edit_type: str = Field(default="timeline", description="Type of edit: timeline, focus, split, reorder")


class ManualEditRequest(BaseModel):
    element_type: str = Field(..., description="Type: phase or milestone")
    element_id: str = Field(..., description="ID of the element being edited")
    action: str = Field(..., description="Action: update, delete, restore")
    changes: dict = Field(default={}, description="Changes to apply")


class EnhancedChatRequest(BaseModel):
    message: str = Field(..., description="User's message")
    use_deep_thinking: bool = Field(default=False, description="Use GPT-5.2 for complex edits")
    current_tab: str = Field(default="overview", description="Current tab the user is viewing")
    current_phase_id: str | None = Field(None, description="Current phase ID if on a phase tab")


class RoadmapChatResponse(BaseModel):
    response: str = Field(..., description="AI response to the question")


ROADMAP_CHAT_SYSTEM_PROMPT = """You are a helpful career coach assistant. The user has a personalized career roadmap and is asking questions about it.

Answer questions about:
- What steps to take for specific phases/milestones
- Recommended resources or approaches
- Time management suggestions
- Skill development strategies
- How to prioritize tasks
- How to overcome potential blockers

Be specific, actionable, and encouraging. Reference specific phases and milestones from their roadmap when relevant.
Keep responses concise but helpful (2-4 paragraphs max).
Use bullet points for lists of recommendations.
"""


@router.post(
    "/chat",
    response_model=RoadmapChatResponse,
    summary="Chat with AI about a roadmap",
    description="Ask questions about your career roadmap and get personalized advice.",
)
async def roadmap_chat(
    request: RoadmapChatRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """
    Chat with AI about a specific roadmap.
    Uses GPT-5.2-chat-latest for quick, contextual responses.
    """
    try:
        client = get_openai_client()

        response = client.chat.completions.create(
            model="gpt-5.2-chat-latest",
            messages=[
                {"role": "system", "content": ROADMAP_CHAT_SYSTEM_PROMPT},
                {"role": "user", "content": f"My roadmap context:\n{request.context}\n\nMy question: {request.message}"}
            ],
            max_completion_tokens=500,
        )

        return RoadmapChatResponse(
            response=response.choices[0].message.content
        )

    except Exception as e:
        logger.error(f"Roadmap chat failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat failed: {str(e)}"
        )


# ============================================
# Progress Tracking Endpoints
# ============================================

@router.get(
    "/saved/{roadmap_id}/progress",
    summary="Get roadmap progress",
    description="Get all progress data for a roadmap including milestone completion and extras.",
)
async def get_roadmap_progress(
    roadmap_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Get progress data for a saved roadmap."""
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    # Verify ownership
    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    service = RoadmapProgressService(db)
    return service.get_progress(roadmap_uuid)


@router.post(
    "/saved/{roadmap_id}/milestones/{milestone_id}/toggle",
    summary="Toggle milestone completion",
    description="Toggle the completion status of a milestone.",
)
async def toggle_milestone(
    roadmap_id: str,
    milestone_id: str,
    request: MilestoneToggleRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Toggle a milestone's completion status."""
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    # Verify ownership
    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    service = RoadmapProgressService(db)
    result = service.toggle_milestone(roadmap_uuid, milestone_id, request.phase_id)

    # Get updated overall progress
    progress = service.get_progress(roadmap_uuid)
    result["overall_progress"] = progress["overall_progress"]
    result["completed_count"] = progress["completed_count"]
    result["total_count"] = progress["total_count"]

    return result


@router.post(
    "/saved/{roadmap_id}/milestones/{milestone_id}/notes",
    summary="Update milestone notes",
    description="Update notes for a milestone.",
)
async def update_milestone_notes(
    roadmap_id: str,
    milestone_id: str,
    request: MilestoneNotesRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Update notes for a milestone."""
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    # Verify ownership
    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    service = RoadmapProgressService(db)
    return service.update_milestone_notes(roadmap_uuid, milestone_id, request.phase_id, request.notes)


@router.post(
    "/saved/{roadmap_id}/extras",
    summary="Add extra achievement",
    description="Add a user extra achievement beyond the roadmap.",
)
async def add_extra(
    roadmap_id: str,
    request: ExtraCreateRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Add a user extra achievement."""
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    # Verify ownership
    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    # Validate category
    valid_categories = ["certification", "skill", "project", "achievement"]
    if request.category not in valid_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )

    service = RoadmapProgressService(db)
    return service.add_extra(
        roadmap_uuid,
        request.phase_id,
        request.title,
        request.description,
        request.category,
    )


@router.delete(
    "/saved/{roadmap_id}/extras/{extra_id}",
    summary="Delete extra achievement",
    description="Delete a user extra achievement.",
)
async def delete_extra(
    roadmap_id: str,
    extra_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Delete an extra achievement."""
    try:
        roadmap_uuid = UUID(roadmap_id)
        extra_uuid = UUID(extra_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )

    # Verify ownership
    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    service = RoadmapProgressService(db)
    deleted = service.delete_extra(extra_uuid)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extra not found"
        )

    return {"deleted": True, "extra_id": extra_id}


# ============================================
# Edit Tracking Endpoints
# ============================================

@router.get(
    "/saved/{roadmap_id}/edits",
    summary="Get edit history",
    description="Get the edit history for a roadmap.",
)
async def get_edit_history(
    roadmap_id: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Get all edits for a roadmap."""
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    # Verify ownership
    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    service = RoadmapProgressService(db)
    return {
        "edits": service.get_edit_history(roadmap_uuid),
        "has_manual_edits": roadmap.has_manual_edits,
        "edit_mode": roadmap.edit_mode,
    }


@router.post(
    "/saved/{roadmap_id}/edits",
    summary="Record an edit",
    description="Record an edit to the roadmap for audit trail.",
)
async def record_edit(
    roadmap_id: str,
    request: EditRecordRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Record an edit to the roadmap."""
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    # Verify ownership
    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    service = RoadmapProgressService(db)
    return service.record_edit(
        roadmap_uuid,
        request.edit_type,
        request.description,
        request.affected_elements,
        request.original_values,
        request.new_values,
    )


@router.put(
    "/saved/{roadmap_id}/edit-mode",
    summary="Update edit mode",
    description="Update the edit mode for a roadmap.",
)
async def update_edit_mode(
    roadmap_id: str,
    edit_mode: str,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Update the edit mode for a roadmap."""
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    # Validate edit mode
    valid_modes = ["view", "ai_edit", "manual_edit"]
    if edit_mode not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid edit mode. Must be one of: {', '.join(valid_modes)}"
        )

    # Verify ownership
    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    service = RoadmapProgressService(db)
    return service.update_roadmap_edit_mode(roadmap_uuid, edit_mode)


# ============================================
# AI Edit Endpoints
# ============================================

AI_EDIT_SYSTEM_PROMPT = """You are a career development AI assistant helping to modify career roadmaps.
The user wants to make changes to their existing career roadmap while maintaining its integrity and alignment with their goals.

When making AI-assisted edits:
1. Maintain the overall structure and goals of the roadmap
2. Ensure changes are realistic and achievable
3. Keep milestones specific and actionable
4. Preserve critical skills and dependencies
5. Provide clear reasoning for any changes made

Return your response as JSON with the following structure:
{
    "summary": "Brief description of changes made",
    "changes": [
        {
            "type": "phase_modified|milestone_modified|milestone_added|milestone_removed|phase_split|timeline_adjusted",
            "element_id": "ID of affected element",
            "description": "What was changed",
            "old_value": "Previous value (if applicable)",
            "new_value": "New value"
        }
    ],
    "updated_roadmap": { ... complete updated roadmap data ... },
    "reasoning": "Explanation of why these changes were made"
}
"""


@router.post(
    "/saved/{roadmap_id}/edit/ai",
    summary="Request AI-assisted edit",
    description="Request an AI-assisted edit to the roadmap.",
)
async def request_ai_edit(
    roadmap_id: str,
    request: AIEditRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Request an AI-assisted edit to the roadmap."""
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    # Get the roadmap
    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    try:
        client = get_openai_client()

        # Build context
        roadmap_data = roadmap.roadmap_data
        user_context = f"""
User: {current_user.full_name}
Current Role: {current_user.current_role}
Target Roles: {', '.join(roadmap.target_role_titles)}
Timeline: {roadmap.total_estimated_months} months
Phases: {roadmap.total_phases}

Current Roadmap:
{roadmap_data}

Edit Instructions: {request.instructions}
Edit Type: {request.edit_type}
"""

        response = client.chat.completions.create(
            model="gpt-5.2",
            messages=[
                {"role": "system", "content": AI_EDIT_SYSTEM_PROMPT},
                {"role": "user", "content": user_context}
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=8000,
        )

        import json
        result = json.loads(response.choices[0].message.content)

        # Record the edit
        progress_service = RoadmapProgressService(db)
        progress_service.record_edit(
            roadmap_uuid,
            "ai_assisted",
            result.get("summary", request.instructions),
            [c.get("element_id", "") for c in result.get("changes", [])],
            {"roadmap_data": roadmap_data},
            {"roadmap_data": result.get("updated_roadmap", roadmap_data)},
        )

        return {
            "success": True,
            "summary": result.get("summary"),
            "changes": result.get("changes", []),
            "reasoning": result.get("reasoning"),
            "preview": result.get("updated_roadmap"),
        }

    except Exception as e:
        logger.error(f"AI edit failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI edit failed: {str(e)}"
        )


@router.post(
    "/saved/{roadmap_id}/edit/apply",
    summary="Apply AI edit",
    description="Apply a previewed AI edit to the roadmap.",
)
async def apply_ai_edit(
    roadmap_id: str,
    updated_roadmap: dict,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Apply a previewed AI edit to the roadmap."""
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    # Get the roadmap
    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    # Update the roadmap data
    roadmap.roadmap_data = updated_roadmap

    # Update summary stats
    phases = updated_roadmap.get("phases", [])
    roadmap.total_phases = len(phases)
    roadmap.total_milestones = sum(len(p.get("milestones", [])) for p in phases)
    roadmap.total_estimated_months = updated_roadmap.get("total_estimated_months", roadmap.total_estimated_months)

    db.commit()

    return {
        "success": True,
        "roadmap_id": roadmap_id,
        "total_phases": roadmap.total_phases,
        "total_milestones": roadmap.total_milestones,
    }


# ============================================
# Enhanced Chat Endpoint
# ============================================

ENHANCED_CHAT_SYSTEM_PROMPT = """You are the Roadmap Assistant - a helpful career coach and organizer for the user's career roadmap.
You have full context on their roadmap, target roles, and progress. You can:

1. Answer questions about the roadmap, phases, and milestones
2. Provide advice on how to approach specific milestones
3. Suggest resources and strategies
4. Help prioritize tasks
5. Explain the reasoning behind roadmap recommendations

When asked about editing the roadmap, guide users to use the appropriate edit mode:
- AI-Assisted Edit: For major changes while maintaining roadmap integrity
- Manual Edit: For custom tweaks (with warning about deviation from recommendations)

Be encouraging, specific, and actionable in your responses.
"""


@router.post(
    "/saved/{roadmap_id}/chat/enhanced",
    summary="Enhanced chat with roadmap context",
    description="Chat with full roadmap context and optional deep thinking.",
)
async def enhanced_roadmap_chat(
    roadmap_id: str,
    request: EnhancedChatRequest,
    current_user: UserProfile = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    """Enhanced chat with full roadmap context."""
    try:
        roadmap_uuid = UUID(roadmap_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format"
        )

    # Get the roadmap
    roadmap = (
        db.query(SavedRoadmap)
        .filter(SavedRoadmap.id == roadmap_uuid, SavedRoadmap.user_id == current_user.id)
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found"
        )

    # Get progress data
    progress_service = RoadmapProgressService(db)
    progress = progress_service.get_progress(roadmap_uuid)

    # Build full context
    roadmap_data = roadmap.roadmap_data
    context = f"""
## User Profile
Name: {current_user.full_name}
Current Role: {current_user.current_role}
Skills: {', '.join(current_user.skills or [])}

## Roadmap Overview
Title: {roadmap.title}
Target Roles: {', '.join(roadmap.target_role_titles)}
Total Duration: {roadmap.total_estimated_months} months
Phases: {roadmap.total_phases}
Milestones: {roadmap.total_milestones}

## Progress
Completed: {progress['completed_count']} / {progress['total_count']} milestones ({progress['overall_progress']}%)
Extra Achievements: {progress['extras_count']}

## Current View
Tab: {request.current_tab}
Phase: {request.current_phase_id or 'N/A'}

## Roadmap Details
Executive Summary: {roadmap_data.get('executive_summary', '')}

Quick Wins: {', '.join(roadmap_data.get('quick_wins', []))}

Critical Skills: {', '.join(roadmap_data.get('critical_skills_to_develop', []))}

Phases:
"""
    for phase in roadmap_data.get("phases", []):
        phase_progress = progress['milestones_by_phase'].get(phase['id'], [])
        completed_in_phase = sum(1 for m in phase_progress if m['status'] == 'completed')
        total_in_phase = len(phase.get('milestones', []))
        context += f"\n- {phase['name']} ({completed_in_phase}/{total_in_phase} complete): {phase.get('description', '')[:100]}..."

    try:
        client = get_openai_client()

        # Use gpt-5.2-instant for fast responses
        model = "gpt-5.2-instant"

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": ENHANCED_CHAT_SYSTEM_PROMPT + f"\n\n{context}"},
                {"role": "user", "content": request.message}
            ],
            max_completion_tokens=500,
        )

        content = response.choices[0].message.content
        if not content:
            content = "I apologize, but I wasn't able to generate a response. Please try rephrasing your question."

        return {
            "response": content,
            "model_used": model,
            "context_tab": request.current_tab,
        }

    except Exception as e:
        logger.error(f"Enhanced chat failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat failed: {str(e)}"
        )
