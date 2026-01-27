from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.skill_progress import UserSkill, SkillModule, UserModuleProgress
from app.models.user_profile import UserProfile
from app.utils.skill_categorizer import categorize_skill


# Fallback modules only used when no AI groupings exist
DEFAULT_MODULES = [
    {"number": 1, "title": "Fundamentals", "description": "Core concepts and basics", "hours": 10},
    {"number": 2, "title": "Intermediate", "description": "Building on fundamentals", "hours": 15},
    {"number": 3, "title": "Advanced", "description": "Complex scenarios and patterns", "hours": 20},
    {"number": 4, "title": "Practical Application", "description": "Real-world projects", "hours": 25},
]


class SkillProgressService:
    def __init__(self, db: Session, user_profile: Optional[UserProfile] = None):
        self.db = db
        self.user_profile = user_profile

    def _get_modules_from_groupings(self, skill_name: str) -> Optional[List[Dict[str, Any]]]:
        """
        Look up modules for a skill from user's AI-generated skill_groupings.
        Returns None if skill not found in groupings.
        """
        category = self._get_category_for_skill(skill_name)
        if category:
            return category.get("modules", [])
        return None

    def _get_category_for_skill(self, skill_name: str) -> Optional[Dict[str, Any]]:
        """Get the full category info for a skill from AI groupings."""
        groupings = self._get_skill_groupings()
        if not groupings:
            return None

        categories = groupings.get("categories", [])
        skill_lower = skill_name.lower()

        for category in categories:
            category_skills = [s.lower() for s in category.get("skills", [])]
            if skill_lower in category_skills:
                return category

        return None

    def _get_skill_groupings(self) -> Optional[Dict[str, Any]]:
        """Get skill groupings, refreshing from DB if needed."""
        if self.user_profile and self.user_profile.skill_groupings:
            return self.user_profile.skill_groupings

        # Try to load from DB if not available on user_profile
        if self.db and self.user_profile:
            try:
                fresh = self.db.query(UserProfile).filter(
                    UserProfile.id == self.user_profile.id
                ).first()
                if fresh and fresh.skill_groupings:
                    return fresh.skill_groupings
            except Exception:
                pass

        return None

    def get_user_skills_with_progress(self, user_id: UUID) -> List[dict]:
        """Get all user skills with module progress, using AI groupings for module count."""
        user_skills = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id
        ).all()

        result = []
        for skill in user_skills:
            modules = self._get_skill_modules(skill.skill_name)
            progress_records = self._get_module_progress(skill.id)

            # Get category info from AI groupings if available
            category_info = self._get_category_for_skill(skill.skill_name)
            ai_modules = category_info.get("modules", []) if category_info else []

            # Use AI module count if available, otherwise fall back to DB modules
            if ai_modules:
                total = len(ai_modules)
            else:
                total = len(modules) if modules else 4

            completed = sum(1 for p in progress_records if p.status == "completed")
            # Cap completed at total to avoid showing more than exists
            completed = min(completed, total)

            # Build category name from AI groupings or fallback
            category_name = category_info.get("name") if category_info else skill.category

            result.append({
                "id": str(skill.id),
                "name": skill.skill_name,
                "category": category_name,
                "categoryId": category_info.get("id") if category_info else skill.category,
                "categoryEmoji": category_info.get("emoji", "star") if category_info else "star",
                "status": skill.status,
                "proficiency": skill.proficiency_level,
                "progress": {
                    "current": completed,
                    "total": total,
                    "unit": "modules",
                    "percentage": round(completed / total * 100) if total > 0 else 0,
                },
                "modules": [
                    {
                        "id": str(m.id),
                        "number": m.module_number,
                        "title": m.title,
                        "description": m.description,
                        "status": self._get_progress_status(progress_records, m.id),
                        "progress": self._get_progress_percent(progress_records, m.id),
                    }
                    for m in modules
                ],
                "started_at": skill.started_at.isoformat() if skill.started_at else None,
                "completed_at": skill.completed_at.isoformat() if skill.completed_at else None,
            })

        return result

    def _get_skill_modules(self, skill_name: str) -> List[SkillModule]:
        return self.db.query(SkillModule).filter(
            SkillModule.skill_name == skill_name
        ).order_by(SkillModule.sequence_order).all()

    def _get_module_progress(self, user_skill_id: UUID) -> List[UserModuleProgress]:
        return self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_skill_id == user_skill_id
        ).all()

    def _get_progress_status(self, progress_records: List[UserModuleProgress], module_id: UUID) -> str:
        for p in progress_records:
            if p.module_id == module_id:
                return p.status
        return "not_started"

    def _get_progress_percent(self, progress_records: List[UserModuleProgress], module_id: UUID) -> int:
        for p in progress_records:
            if p.module_id == module_id:
                return p.progress_percentage
        return 0

    def start_skill(self, user_id: UUID, skill_name: str) -> UserSkill:
        """Initialize skill learning with default modules."""
        existing = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_name == skill_name,
        ).first()

        if existing:
            return existing

        category = categorize_skill(skill_name)
        user_skill = UserSkill(
            user_id=user_id,
            skill_name=skill_name,
            category=category,
            status="in_progress",
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(user_skill)
        self.db.flush()

        modules = self._ensure_modules_exist(skill_name)

        for module in modules:
            progress = UserModuleProgress(
                user_skill_id=user_skill.id,
                module_id=module.id,
                status="not_started",
            )
            self.db.add(progress)

        self.db.commit()
        return user_skill

    def _ensure_modules_exist(self, skill_name: str) -> List[SkillModule]:
        """
        Ensure modules exist for a skill.
        Priority: 1) Existing DB modules, 2) AI grouping modules, 3) Default modules
        """
        modules = self._get_skill_modules(skill_name)
        if modules:
            return modules

        # Try to get modules from AI skill groupings
        ai_modules = self._get_modules_from_groupings(skill_name)

        new_modules = []
        if ai_modules:
            # Use AI-generated modules
            for i, mod in enumerate(ai_modules):
                module = SkillModule(
                    skill_name=skill_name,
                    module_number=mod.get("order", i + 1),
                    title=mod.get("name", f"Module {i + 1}"),
                    description=mod.get("description", ""),
                    sequence_order=i + 1,
                    estimated_hours=15,  # Default hours for AI modules
                )
                self.db.add(module)
                new_modules.append(module)
        else:
            # Fall back to default modules
            for i, mod in enumerate(DEFAULT_MODULES):
                module = SkillModule(
                    skill_name=skill_name,
                    module_number=mod["number"],
                    title=f"{skill_name} - {mod['title']}",
                    description=mod["description"],
                    sequence_order=i + 1,
                    estimated_hours=mod["hours"],
                )
                self.db.add(module)
                new_modules.append(module)

        self.db.flush()
        return new_modules

    def update_module_progress(self, user_id: UUID, skill_name: str, module_id: UUID, progress_percentage: int) -> UserModuleProgress:
        user_skill = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_name == skill_name,
        ).first()

        if not user_skill:
            raise ValueError(f"User skill {skill_name} not found")

        progress = self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_skill_id == user_skill.id,
            UserModuleProgress.module_id == module_id,
        ).first()

        if not progress:
            raise ValueError("Module progress not found")

        progress.progress_percentage = progress_percentage
        if progress_percentage > 0 and progress.status == "not_started":
            progress.status = "in_progress"
            progress.started_at = datetime.now(timezone.utc)

        self._update_skill_proficiency(user_skill)
        self.db.commit()
        return progress

    def complete_module(self, user_id: UUID, skill_name: str, module_id: UUID) -> UserModuleProgress:
        user_skill = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_name == skill_name,
        ).first()

        if not user_skill:
            raise ValueError(f"User skill {skill_name} not found")

        progress = self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_skill_id == user_skill.id,
            UserModuleProgress.module_id == module_id,
        ).first()

        if not progress:
            raise ValueError("Module progress not found")

        progress.status = "completed"
        progress.progress_percentage = 100
        progress.completed_at = datetime.now(timezone.utc)

        self._update_skill_proficiency(user_skill)
        self._check_skill_completion(user_skill)
        self.db.commit()
        return progress

    def _update_skill_proficiency(self, user_skill: UserSkill):
        progress_records = self._get_module_progress(user_skill.id)
        if not progress_records:
            return
        total = sum(p.progress_percentage for p in progress_records)
        user_skill.proficiency_level = round(total / len(progress_records))

    def _check_skill_completion(self, user_skill: UserSkill):
        incomplete = self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_skill_id == user_skill.id,
            UserModuleProgress.status != "completed"
        ).count()

        if incomplete == 0:
            user_skill.status = "completed"
            user_skill.completed_at = datetime.now(timezone.utc)
            user_skill.proficiency_level = 100

    def complete_skill(self, user_id: UUID, skill_name: str) -> UserSkill:
        """Mark an entire skill as complete, completing all modules."""
        user_skill = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_name == skill_name,
        ).first()

        if not user_skill:
            # Create the skill if it doesn't exist, then complete it
            user_skill = self.start_skill(user_id, skill_name)

        # Complete all modules
        progress_records = self._get_module_progress(user_skill.id)
        for progress in progress_records:
            progress.status = "completed"
            progress.progress_percentage = 100
            progress.completed_at = datetime.now(timezone.utc)

        # Mark skill as complete
        user_skill.status = "completed"
        user_skill.proficiency_level = 100
        user_skill.completed_at = datetime.now(timezone.utc)

        self.db.commit()
        return user_skill
