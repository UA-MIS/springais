"""Quest Service -- Side quest management: catalog, start, progress, completion.

References: FR-019, D-MM-9
Architecture Section 4.6
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.progression import GamificationEvent
from app.models.quest import SideQuestCatalog, UserQuestProgress
from app.services.progression_service import (
    ProgressionService,
    progression_service as _default_progression_service,
)

logger = logging.getLogger(__name__)


@dataclass
class QuestProgressUpdate:
    """Describes an update to a quest's progress."""

    quest_id: UUID
    quest_name: str
    status: str
    completed: bool = False
    requirements_updated: list[dict] = field(default_factory=list)


@dataclass
class QuestCompletionResult:
    """Result of completing a quest."""

    quest_id: UUID
    quest_name: str
    xp_awarded: int = 0
    coins_awarded: int = 0
    cosmetic_reward_id: UUID | None = None


class QuestService:
    """Side quest management: catalog, start, progress, completion."""

    def __init__(self, progression_service: ProgressionService | None = None):
        self.progression = progression_service or _default_progression_service

    def get_available_quests(
        self, db: Session, user_id: UUID, user_level: int
    ) -> list[dict]:
        """Return quests user has unlocked (level >= required), with progress."""
        quests = (
            db.query(SideQuestCatalog)
            .filter(
                SideQuestCatalog.is_active.is_(True),
                SideQuestCatalog.level_required <= user_level,
            )
            .order_by(SideQuestCatalog.sort_order)
            .all()
        )

        # Get user's progress for these quests
        quest_ids = [q.id for q in quests]
        progress_rows = (
            db.query(UserQuestProgress)
            .filter(
                UserQuestProgress.user_id == user_id,
                UserQuestProgress.quest_id.in_(quest_ids),
            )
            .all()
        ) if quest_ids else []

        progress_map = {p.quest_id: p for p in progress_rows}

        result = []
        for quest in quests:
            prog = progress_map.get(quest.id)
            quest_data = self._quest_to_dict(quest, prog, db, user_id)
            result.append(quest_data)

        return result

    def get_active_quests(self, db: Session, user_id: UUID) -> list[dict]:
        """Return in-progress quests with current progress."""
        progress_rows = (
            db.query(UserQuestProgress)
            .filter(
                UserQuestProgress.user_id == user_id,
                UserQuestProgress.status == "in_progress",
            )
            .all()
        )

        result = []
        for prog in progress_rows:
            quest = db.query(SideQuestCatalog).filter(
                SideQuestCatalog.id == prog.quest_id
            ).first()
            if quest:
                result.append(self._quest_to_dict(quest, prog, db, user_id))

        return result

    def get_completed_quests(self, db: Session, user_id: UUID) -> list[dict]:
        """Return completed quests."""
        progress_rows = (
            db.query(UserQuestProgress)
            .filter(
                UserQuestProgress.user_id == user_id,
                UserQuestProgress.status == "completed",
            )
            .all()
        )

        result = []
        for prog in progress_rows:
            quest = db.query(SideQuestCatalog).filter(
                SideQuestCatalog.id == prog.quest_id
            ).first()
            if quest:
                result.append(self._quest_to_dict(quest, prog, db, user_id))

        return result

    def start_quest(
        self,
        db: Session,
        user_id: UUID,
        quest_id: UUID,
        user_level: int,
    ) -> UserQuestProgress:
        """Start a quest.

        Validates: quest exists and active, user level >= required, not already started.
        """
        quest = (
            db.query(SideQuestCatalog)
            .filter(SideQuestCatalog.id == quest_id, SideQuestCatalog.is_active.is_(True))
            .first()
        )
        if quest is None:
            raise ValueError("quest_not_found")

        if user_level < quest.level_required:
            raise PermissionError(
                f"level_too_low:{quest.level_required}:{user_level}"
            )

        # Check if already started or completed
        existing = (
            db.query(UserQuestProgress)
            .filter(
                UserQuestProgress.user_id == user_id,
                UserQuestProgress.quest_id == quest_id,
            )
            .first()
        )
        if existing is not None:
            if existing.status == "completed":
                raise ValueError("quest_already_completed")
            raise ValueError("quest_already_started")

        # Initialize progress JSON from quest requirements
        requirements = quest.requirements or []
        progress_data = {
            "requirements": [
                {
                    "index": i,
                    "completed": False,
                    "current_count": 0,
                    "required_count": req.get("count", 1),
                }
                for i, req in enumerate(requirements)
            ]
        }

        now = datetime.now(timezone.utc)
        quest_progress = UserQuestProgress(
            user_id=user_id,
            quest_id=quest_id,
            status="in_progress",
            progress=progress_data,
            started_at=now,
        )
        db.add(quest_progress)
        db.flush()

        return quest_progress

    def evaluate_quest_progress(
        self,
        db: Session,
        user_id: UUID,
        event_type: str,
        event_key: str | None = None,
    ) -> list[QuestProgressUpdate]:
        """Check all in-progress quests and update progress.

        Called by reward_hook_service.process_action() after other reward processing.
        """
        # Get all in-progress quests for this user
        in_progress = (
            db.query(UserQuestProgress)
            .filter(
                UserQuestProgress.user_id == user_id,
                UserQuestProgress.status == "in_progress",
            )
            .all()
        )

        if not in_progress:
            return []

        updates = []

        for quest_progress in in_progress:
            quest = (
                db.query(SideQuestCatalog)
                .filter(SideQuestCatalog.id == quest_progress.quest_id)
                .first()
            )
            if quest is None:
                continue

            requirements = quest.requirements or []
            progress_data = quest_progress.progress or {"requirements": []}
            progress_reqs = progress_data.get("requirements", [])
            updated = False

            for i, req in enumerate(requirements):
                if req.get("type") != event_type:
                    continue

                # Count matching events for this user
                count = (
                    db.query(func.count(GamificationEvent.id))
                    .filter(
                        GamificationEvent.user_id == user_id,
                        GamificationEvent.event_type == event_type,
                    )
                    .scalar()
                ) or 0

                required_count = req.get("count", 1)

                # Find the progress entry for this requirement
                if i < len(progress_reqs):
                    prog_entry = progress_reqs[i]
                    old_count = prog_entry.get("current_count", 0)
                    prog_entry["current_count"] = min(count, required_count)
                    prog_entry["completed"] = count >= required_count

                    if prog_entry["current_count"] != old_count:
                        updated = True

            if updated:
                quest_progress.progress = progress_data
                db.flush()

                # Check if all requirements are now met
                all_completed = all(
                    r.get("completed", False) for r in progress_reqs
                )
                if all_completed:
                    completion = self.complete_quest(db, user_id, quest_progress)
                    updates.append(
                        QuestProgressUpdate(
                            quest_id=quest.id,
                            quest_name=quest.name,
                            status="completed",
                            completed=True,
                        )
                    )
                else:
                    updates.append(
                        QuestProgressUpdate(
                            quest_id=quest.id,
                            quest_name=quest.name,
                            status="in_progress",
                        )
                    )

        return updates

    def complete_quest(
        self,
        db: Session,
        user_id: UUID,
        quest_progress: UserQuestProgress,
    ) -> QuestCompletionResult:
        """Award quest rewards and mark as completed."""
        quest = (
            db.query(SideQuestCatalog)
            .filter(SideQuestCatalog.id == quest_progress.quest_id)
            .first()
        )
        if quest is None:
            raise ValueError("quest_not_found")

        result = QuestCompletionResult(
            quest_id=quest.id,
            quest_name=quest.name,
        )

        # Award XP
        if quest.xp_reward > 0:
            xp_result = self.progression.award_xp(
                db, user_id, quest.xp_reward, "side_quest_completed",
                event_key=f"quest:{quest.id}"
            )
            result.xp_awarded = xp_result.xp_awarded

        # Award Coins
        if quest.coin_reward > 0:
            coins_result = self.progression.award_coins(
                db, user_id, quest.coin_reward, "side_quest_completed"
            )
            result.coins_awarded = coins_result.coins_awarded

        # Deliver cosmetic reward if quest has one
        if quest.cosmetic_reward_id:
            from app.models.cosmetic import UserInventory
            inventory_item = UserInventory(
                user_id=user_id,
                cosmetic_id=quest.cosmetic_reward_id,
                source="quest_reward",
            )
            db.add(inventory_item)
            db.flush()

        # Mark as completed
        now = datetime.now(timezone.utc)
        quest_progress.status = "completed"
        quest_progress.completed_at = now
        db.flush()

        result.cosmetic_reward_id = quest.cosmetic_reward_id
        return result

    def complete_quest_by_title(
        self,
        db: Session,
        user_id: UUID,
        quest_title: str,
    ) -> QuestCompletionResult | None:
        """Find a quest by title and complete it (used for onboarding flow).

        Returns None if quest not found or already completed.
        """
        quest = (
            db.query(SideQuestCatalog)
            .filter(SideQuestCatalog.name == quest_title)
            .first()
        )
        if quest is None:
            return None

        # Find or create progress entry
        quest_progress = (
            db.query(UserQuestProgress)
            .filter(
                UserQuestProgress.user_id == user_id,
                UserQuestProgress.quest_id == quest.id,
            )
            .first()
        )

        if quest_progress is not None and quest_progress.status == "completed":
            return None

        if quest_progress is None:
            now = datetime.now(timezone.utc)
            quest_progress = UserQuestProgress(
                user_id=user_id,
                quest_id=quest.id,
                status="in_progress",
                progress={"requirements": []},
                started_at=now,
            )
            db.add(quest_progress)
            db.flush()

        return self.complete_quest(db, user_id, quest_progress)

    def _quest_to_dict(
        self,
        quest: SideQuestCatalog,
        progress: UserQuestProgress | None,
        db: Session,
        user_id: UUID,
    ) -> dict:
        """Convert a quest and its progress to a response dict."""
        requirements = quest.requirements or []
        progress_data = progress.progress if progress else None
        progress_reqs = (
            progress_data.get("requirements", []) if progress_data else []
        )

        req_list = []
        for i, req in enumerate(requirements):
            current_count = 0
            completed = False
            if i < len(progress_reqs):
                current_count = progress_reqs[i].get("current_count", 0)
                completed = progress_reqs[i].get("completed", False)

            req_list.append({
                "type": req.get("type", ""),
                "count": req.get("count", 1),
                "description": req.get("description", ""),
                "current_count": current_count,
                "completed": completed,
            })

        return {
            "id": str(quest.id),
            "name": quest.name,
            "description": quest.description,
            "level_required": quest.level_required,
            "xp_reward": quest.xp_reward,
            "coin_reward": quest.coin_reward,
            "cosmetic_reward": None,  # Will be populated when cosmetic catalog exists
            "requirements": req_list,
            "status": progress.status if progress else "available",
            "started_at": (
                progress.started_at.isoformat() if progress and progress.started_at else None
            ),
            "completed_at": (
                progress.completed_at.isoformat() if progress and progress.completed_at else None
            ),
        }


# Module-level singleton
quest_service = QuestService()
