"""
Roadmap progress tracking service.

Handles milestone completion, extras, and edit history.
"""

import logging
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.roadmap import SavedRoadmap
from app.models.roadmap_progress import (
    RoadmapMilestoneProgress,
    RoadmapExtra,
    RoadmapEdit,
)

logger = logging.getLogger(__name__)


class RoadmapProgressService:
    """Service for managing roadmap progress, extras, and edits."""

    def __init__(self, db: Session):
        self.db = db

    def get_progress(self, roadmap_id: UUID) -> dict:
        """Get all progress data for a roadmap."""
        milestones = (
            self.db.query(RoadmapMilestoneProgress)
            .filter(RoadmapMilestoneProgress.roadmap_id == roadmap_id)
            .all()
        )
        extras = (
            self.db.query(RoadmapExtra)
            .filter(RoadmapExtra.roadmap_id == roadmap_id)
            .order_by(RoadmapExtra.created_at.desc())
            .all()
        )

        # Calculate overall progress
        roadmap = self.db.query(SavedRoadmap).filter(SavedRoadmap.id == roadmap_id).first()
        total_milestones = roadmap.total_milestones if roadmap else 0
        completed = sum(1 for m in milestones if m.status == "completed")

        # Group milestones by phase
        milestones_by_phase: dict[str, list] = {}
        for m in milestones:
            if m.phase_id not in milestones_by_phase:
                milestones_by_phase[m.phase_id] = []
            milestones_by_phase[m.phase_id].append({
                "milestone_id": m.milestone_id,
                "status": m.status,
                "completed_at": m.completed_at.isoformat() if m.completed_at else None,
                "notes": m.notes,
            })

        # Group extras by phase
        extras_by_phase: dict[str, list] = {}
        for e in extras:
            if e.phase_id not in extras_by_phase:
                extras_by_phase[e.phase_id] = []
            extras_by_phase[e.phase_id].append({
                "id": str(e.id),
                "title": e.title,
                "description": e.description,
                "category": e.category,
                "completed_at": e.completed_at.isoformat(),
            })

        return {
            "milestones": {m.milestone_id: {
                "status": m.status,
                "completed_at": m.completed_at.isoformat() if m.completed_at else None,
                "notes": m.notes,
                "phase_id": m.phase_id,
            } for m in milestones},
            "milestones_by_phase": milestones_by_phase,
            "extras": [{
                "id": str(e.id),
                "phase_id": e.phase_id,
                "title": e.title,
                "description": e.description,
                "category": e.category,
                "completed_at": e.completed_at.isoformat(),
            } for e in extras],
            "extras_by_phase": extras_by_phase,
            "overall_progress": round((completed / total_milestones * 100), 1) if total_milestones > 0 else 0,
            "completed_count": completed,
            "total_count": total_milestones,
            "extras_count": len(extras),
        }

    def toggle_milestone(
        self,
        roadmap_id: UUID,
        milestone_id: str,
        phase_id: str,
    ) -> dict:
        """Toggle a milestone's completion status."""
        progress = (
            self.db.query(RoadmapMilestoneProgress)
            .filter(
                RoadmapMilestoneProgress.roadmap_id == roadmap_id,
                RoadmapMilestoneProgress.milestone_id == milestone_id,
            )
            .first()
        )

        if not progress:
            # Create new progress record, mark as completed
            progress = RoadmapMilestoneProgress(
                roadmap_id=roadmap_id,
                milestone_id=milestone_id,
                phase_id=phase_id,
                status="completed",
                completed_at=datetime.utcnow(),
            )
            self.db.add(progress)
        else:
            # Toggle status
            if progress.status == "completed":
                progress.status = "not_started"
                progress.completed_at = None
            else:
                progress.status = "completed"
                progress.completed_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(progress)

        # Return updated progress summary
        return {
            "milestone_id": progress.milestone_id,
            "phase_id": progress.phase_id,
            "status": progress.status,
            "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
        }

    def update_milestone_notes(
        self,
        roadmap_id: UUID,
        milestone_id: str,
        phase_id: str,
        notes: str,
    ) -> dict:
        """Update notes for a milestone."""
        progress = (
            self.db.query(RoadmapMilestoneProgress)
            .filter(
                RoadmapMilestoneProgress.roadmap_id == roadmap_id,
                RoadmapMilestoneProgress.milestone_id == milestone_id,
            )
            .first()
        )

        if not progress:
            progress = RoadmapMilestoneProgress(
                roadmap_id=roadmap_id,
                milestone_id=milestone_id,
                phase_id=phase_id,
                status="not_started",
                notes=notes,
            )
            self.db.add(progress)
        else:
            progress.notes = notes

        self.db.commit()
        self.db.refresh(progress)

        return {
            "milestone_id": progress.milestone_id,
            "notes": progress.notes,
        }

    def add_extra(
        self,
        roadmap_id: UUID,
        phase_id: str,
        title: str,
        description: Optional[str],
        category: str,
    ) -> dict:
        """Add a user extra achievement."""
        extra = RoadmapExtra(
            roadmap_id=roadmap_id,
            phase_id=phase_id,
            title=title,
            description=description,
            category=category,
            completed_at=datetime.utcnow(),
        )
        self.db.add(extra)
        self.db.commit()
        self.db.refresh(extra)

        return {
            "id": str(extra.id),
            "phase_id": extra.phase_id,
            "title": extra.title,
            "description": extra.description,
            "category": extra.category,
            "completed_at": extra.completed_at.isoformat(),
        }

    def delete_extra(self, extra_id: UUID) -> bool:
        """Delete an extra achievement."""
        extra = self.db.query(RoadmapExtra).filter(RoadmapExtra.id == extra_id).first()
        if extra:
            self.db.delete(extra)
            self.db.commit()
            return True
        return False

    def record_edit(
        self,
        roadmap_id: UUID,
        edit_type: str,
        description: str,
        affected_elements: List[str],
        original_values: dict,
        new_values: dict,
    ) -> dict:
        """Record an edit to the roadmap for audit trail."""
        edit = RoadmapEdit(
            roadmap_id=roadmap_id,
            edit_type=edit_type,
            change_description=description,
            affected_elements=affected_elements,
            original_values=original_values,
            new_values=new_values,
        )
        self.db.add(edit)

        # Update roadmap's has_manual_edits flag if needed
        if edit_type == "manual":
            roadmap = self.db.query(SavedRoadmap).filter(SavedRoadmap.id == roadmap_id).first()
            if roadmap:
                roadmap.has_manual_edits = True

        self.db.commit()
        self.db.refresh(edit)

        return {
            "id": str(edit.id),
            "edit_type": edit.edit_type,
            "description": edit.change_description,
            "affected_elements": edit.affected_elements,
            "created_at": edit.created_at.isoformat(),
        }

    def get_edit_history(self, roadmap_id: UUID) -> List[dict]:
        """Get all edits for a roadmap."""
        edits = (
            self.db.query(RoadmapEdit)
            .filter(RoadmapEdit.roadmap_id == roadmap_id)
            .order_by(RoadmapEdit.created_at.desc())
            .all()
        )
        return [{
            "id": str(e.id),
            "edit_type": e.edit_type,
            "description": e.change_description,
            "affected_elements": e.affected_elements,
            "original_values": e.original_values,
            "new_values": e.new_values,
            "created_at": e.created_at.isoformat(),
        } for e in edits]

    def update_roadmap_edit_mode(
        self,
        roadmap_id: UUID,
        edit_mode: str,
    ) -> dict:
        """Update the edit mode for a roadmap."""
        roadmap = self.db.query(SavedRoadmap).filter(SavedRoadmap.id == roadmap_id).first()
        if not roadmap:
            raise ValueError("Roadmap not found")

        roadmap.edit_mode = edit_mode
        self.db.commit()

        return {
            "roadmap_id": str(roadmap_id),
            "edit_mode": edit_mode,
        }

    def update_current_phase(
        self,
        roadmap_id: UUID,
        phase_id: str,
    ) -> dict:
        """Update the current phase for a roadmap."""
        roadmap = self.db.query(SavedRoadmap).filter(SavedRoadmap.id == roadmap_id).first()
        if not roadmap:
            raise ValueError("Roadmap not found")

        roadmap.current_phase_id = phase_id
        self.db.commit()

        return {
            "roadmap_id": str(roadmap_id),
            "current_phase_id": phase_id,
        }
