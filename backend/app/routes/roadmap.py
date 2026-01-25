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
