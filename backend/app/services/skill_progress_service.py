from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.skill_progress import UserSkill, SkillModule, UserModuleProgress
from app.utils.skill_categorizer import categorize_skill


DEFAULT_MODULES = [
    {"number": 1, "title": "Fundamentals", "description": "Core concepts and basics", "hours": 10},
    {"number": 2, "title": "Intermediate", "description": "Building on fundamentals", "hours": 15},
    {"number": 3, "title": "Advanced", "description": "Complex scenarios and patterns", "hours": 20},
    {"number": 4, "title": "Practical Application", "description": "Real-world projects", "hours": 25},
]


class SkillProgressService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_skills_with_progress(self, user_id: UUID) -> List[dict]:
        """Get all user skills with module progress."""
        user_skills = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id
        ).all()

        result = []
        for skill in user_skills:
            modules = self._get_skill_modules(skill.skill_name)
            progress_records = self._get_module_progress(skill.id)

            completed = sum(1 for p in progress_records if p.status == "completed")
            total = len(modules) if modules else 4

            result.append({
                "id": str(skill.id),
                "name": skill.skill_name,
                "category": skill.category,
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
        modules = self._get_skill_modules(skill_name)
        if modules:
            return modules

        new_modules = []
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
