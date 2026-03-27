from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.skill_progress import UserSkill, SkillModule, UserModuleProgress
from app.models.user_profile import UserProfile
from app.models.match import Match
from app.utils.skill_categorizer import categorize_skill

logger = logging.getLogger(__name__)

# ============================================
# Proficiency Scale Constants
# ============================================

# Proficiency levels (1-5 scale)
PROFICIENCY_LABELS = {
    0: "None",
    1: "Beginner",
    2: "Elementary",
    3: "Intermediate",  # Threshold for "proficient" - counts toward job matching
    4: "Advanced",
    5: "Expert",
}

# Threshold for counting toward job matches
# Skills at this level or higher are added to user_profile.skills
PROFICIENCY_MATCH_THRESHOLD = 3

# Module count by skill type
MODULE_COUNTS = {
    "technical": (4, 6),  # min, max modules
    "soft": (3, 4),
    "tool": (2, 3),
}

# Skill decay warning threshold (months without update)
SKILL_DECAY_MONTHS = 6

# Keywords for determining skill type
TECHNICAL_KEYWORDS = [
    "python", "java", "javascript", "react", "node", "sql", "aws", "azure",
    "c#", "csharp", ".net", "docker", "kubernetes", "machine learning",
    "data science", "api", "backend", "frontend", "devops", "cloud",
    "programming", "software", "typescript", "angular", "vue", "django",
    "flask", "spring", "ruby", "php", "go", "rust", "kotlin", "swift",
    "scala", "terraform", "jenkins", "ci/cd", "graphql", "mongodb",
    "postgresql", "redis", "elasticsearch", "spark", "hadoop", "tensorflow",
    "pytorch", "deep learning", "nlp", "computer vision"
]

SOFT_KEYWORDS = [
    "leadership", "communication", "teamwork", "presentation", "negotiation",
    "management", "coaching", "mentoring", "collaboration", "strategy",
    "problem solving", "critical thinking", "emotional intelligence",
    "public speaking", "conflict resolution", "decision making", "influence"
]

TOOL_KEYWORDS = [
    "excel", "powerpoint", "word", "jira", "confluence", "slack", "teams",
    "salesforce", "tableau", "power bi", "git", "vs code", "figma",
    "sketch", "postman", "notion", "trello", "asana", "monday"
]


class SkillProgressService:
    def __init__(self, db: Session, user_profile: Optional[UserProfile] = None):
        self.db = db
        self.user_profile = user_profile

    # ============================================
    # Skill Type Determination
    # ============================================

    def _determine_skill_type(self, skill_name: str) -> str:
        """Determine if a skill is technical, soft, or tool."""
        skill_lower = skill_name.lower()

        for kw in SOFT_KEYWORDS:
            if kw in skill_lower:
                return "soft"

        for kw in TOOL_KEYWORDS:
            if kw in skill_lower:
                return "tool"

        for kw in TECHNICAL_KEYWORDS:
            if kw in skill_lower:
                return "technical"

        # Default to technical for unknown skills
        return "technical"

    # ============================================
    # Profile Sync Methods
    # ============================================

    def _sync_skill_to_profile(
        self,
        user_id: UUID,
        skill_name: str,
        proficiency: int,
    ) -> None:
        """
        Sync skill with user_profile.skills list based on proficiency.
        Skills at proficiency 3+ get added, below 3 get removed.
        This ensures only proficient skills count toward job matching.
        """
        user = self.db.query(UserProfile).filter(UserProfile.id == user_id).first()
        if not user:
            return

        current_skills = set(s.lower() for s in (user.skills or []))
        skill_lower = skill_name.lower()
        skills_changed = False

        if proficiency >= PROFICIENCY_MATCH_THRESHOLD:
            # Add to skills list if not present
            if skill_lower not in current_skills:
                user.skills = (user.skills or []) + [skill_name]
                self.db.add(user)
                skills_changed = True
                logger.info(f"Added {skill_name} to user profile skills (proficiency {proficiency})")
        else:
            # Remove from skills list if present (user's proficiency dropped)
            if skill_lower in current_skills:
                user.skills = [s for s in user.skills if s.lower() != skill_lower]
                self.db.add(user)
                skills_changed = True
                logger.info(f"Removed {skill_name} from user profile skills (proficiency {proficiency})")

        if skills_changed:
            self._refresh_saved_matches(user_id, user)

    def _refresh_saved_matches(self, user_id: UUID, user: UserProfile) -> None:
        """Re-score all saved matches when the user's matchable skills change."""
        from app.services.matching_service import MatchingService, MatchMode

        saved_matches = (
            self.db.query(Match)
            .filter(Match.user_id == user_id)
            .all()
        )
        if not saved_matches:
            return

        try:
            service = MatchingService(db=self.db, user_profile=user)
            service._preload_all_embeddings()
            employee = service._get_employee_profile(1)  # ID unused when user_profile is set
            if not employee:
                return

            for match in saved_matches:
                job = service._get_job_by_id(str(match.job_posting_id))
                if not job:
                    continue

                mode = MatchMode(match.match_mode)
                scoped_service = MatchingService(
                    db=self.db, user_profile=user, mode=mode,
                )
                scoped_service._embedding_cache = service._embedding_cache
                candidate = scoped_service._score_candidate(employee, job)

                match.skill_match_score = round(candidate.skill_score, 4)
                match.experience_score = round(candidate.experience_score, 4)
                match.growth_potential_score = round(candidate.role_fit_score, 4)
                match.overall_score = round(candidate.overall_score, 4)
                if candidate.gap_analysis:
                    match.matched_skills = candidate.gap_analysis.overlapping_skills
                    match.skill_gaps = candidate.gap_analysis.missing_skills
                    match.transferable_skills = candidate.gap_analysis.transferable_skills

            logger.info(f"Refreshed {len(saved_matches)} saved matches for user {user_id}")
        except Exception as e:
            logger.warning(f"Failed to refresh saved matches: {e}")

    # ============================================
    # Skill Groupings Methods
    # ============================================

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

            # DEBUG: Log learning content status for each module
            for m in modules:
                has_content = bool(m.learning_content)
                if has_content:
                    logger.info(f"Module '{m.title}' has learning_content (length: {len(m.learning_content)})")

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

            # Calculate skill decay warning
            needs_update = False
            if skill.last_updated_at:
                days_since_update = (datetime.now(timezone.utc) - skill.last_updated_at).days
                needs_update = days_since_update > SKILL_DECAY_MONTHS * 30

            result.append({
                "id": str(skill.id),
                "name": skill.skill_name,
                "category": category_name,
                "categoryId": category_info.get("id") if category_info else skill.category,
                "categoryEmoji": category_info.get("emoji", "star") if category_info else "star",
                "status": skill.status,
                "proficiency": skill.proficiency_level,
                # New proficiency fields
                "proficiency_level": skill.proficiency_level,
                "proficiency_label": PROFICIENCY_LABELS.get(skill.proficiency_level, "Unknown"),
                "source": getattr(skill, 'source', 'manual'),
                "counts_for_matching": skill.proficiency_level >= PROFICIENCY_MATCH_THRESHOLD,
                "last_updated_at": skill.last_updated_at.isoformat() if skill.last_updated_at else None,
                "needs_update": needs_update,
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
                        # Include learning content if available - direct access for proper loading
                        "learning_content": m.learning_content,
                        "external_resources": m.external_resources or [],
                        "ey_resources": m.ey_resources or [],
                    }
                    for m in modules
                ],
                "started_at": skill.started_at.isoformat() if skill.started_at else None,
                "completed_at": skill.completed_at.isoformat() if skill.completed_at else None,
            })

        return result

    def _get_skill_modules(self, skill_name: str) -> List[SkillModule]:
        # Case-insensitive lookup to ensure modules are reused across accounts
        # Expire all to ensure fresh data (learning_content may have been added)
        self.db.expire_all()
        modules = self.db.query(SkillModule).filter(
            func.lower(SkillModule.skill_name) == skill_name.lower()
        ).order_by(SkillModule.sequence_order).all()
        return modules

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

    def start_skill(
        self,
        user_id: UUID,
        skill_name: str,
        source: str = "manual",
        initial_proficiency: int = 0,
        auto_commit: bool = True,
    ) -> UserSkill:
        """
        Initialize skill learning with dynamically generated modules.

        Args:
            user_id: User's ID
            skill_name: Name of the skill
            source: Where the skill came from (resume, job_gap, manual, roadmap)
            initial_proficiency: Starting proficiency level (0-5)
                - resume skills: 3 (assumed proficient)
                - job_gap/manual: 0 (needs development)
            auto_commit: Whether to commit the transaction (set False for batch operations)
        """
        existing = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_name == skill_name,
        ).first()

        if existing:
            # FIX: Update proficiency if new value is higher (e.g., resume says proficient)
            if initial_proficiency > existing.proficiency_level:
                existing.proficiency_level = initial_proficiency
                existing.last_updated_at = datetime.now(timezone.utc)
                # Update status if now proficient
                if initial_proficiency >= PROFICIENCY_MATCH_THRESHOLD and existing.status == "not_started":
                    existing.status = "in_progress"
                self._sync_skill_to_profile(user_id, skill_name, initial_proficiency)
                logger.info(f"Updated {skill_name} proficiency from {existing.proficiency_level} to {initial_proficiency}")

            # FIX: ALWAYS ensure modules exist, even for existing skills
            skill_type = self._determine_skill_type(skill_name)
            modules = self._ensure_modules_exist(skill_name, skill_type)

            # Create UserModuleProgress for any missing modules
            existing_module_ids = {p.module_id for p in self._get_module_progress(existing.id)}
            for module in modules:
                if module.id not in existing_module_ids:
                    progress = UserModuleProgress(
                        user_skill_id=existing.id,
                        module_id=module.id,
                        status="not_started",
                    )
                    self.db.add(progress)
                    logger.debug(f"Created missing module progress for {skill_name} - {module.title}")

            if auto_commit:
                self.db.commit()
            return existing

        category = categorize_skill(skill_name)
        skill_type = self._determine_skill_type(skill_name)

        # Determine initial status based on proficiency
        status = "in_progress" if initial_proficiency >= PROFICIENCY_MATCH_THRESHOLD else "not_started"

        now = datetime.now(timezone.utc)
        user_skill = UserSkill(
            user_id=user_id,
            skill_name=skill_name,
            category=category,
            status=status,
            proficiency_level=initial_proficiency,
            source=source,
            started_at=now,
            last_updated_at=now,
        )
        self.db.add(user_skill)
        self.db.flush()

        modules = self._ensure_modules_exist(skill_name, skill_type)

        for module in modules:
            progress = UserModuleProgress(
                user_skill_id=user_skill.id,
                module_id=module.id,
                status="not_started",
            )
            self.db.add(progress)

        # Sync with user_profile.skills list BEFORE commit if proficient
        self._sync_skill_to_profile(user_id, skill_name, initial_proficiency)

        if auto_commit:
            self.db.commit()

        return user_skill

    def _ensure_modules_exist(
        self,
        skill_name: str,
        skill_type: str = "technical",
    ) -> List[SkillModule]:
        """
        Ensure modules exist for a skill.
        Priority: 1) Existing DB modules, 2) AI grouping modules, 3) Dynamic fallback modules
        """
        modules = self._get_skill_modules(skill_name)
        if modules:
            return modules

        # Try to get modules from AI skill groupings
        ai_modules = self._get_modules_from_groupings(skill_name)

        new_modules = []
        if ai_modules:
            # Use AI-generated modules from skill groupings
            for i, mod in enumerate(ai_modules):
                module = SkillModule(
                    skill_name=skill_name,
                    module_number=mod.get("order", i + 1),
                    title=mod.get("name", f"Module {i + 1}"),
                    description=mod.get("description", ""),
                    sequence_order=i + 1,
                    estimated_hours=15 if skill_type == "technical" else 10,
                    skill_type=skill_type,
                )
                self.db.add(module)
                new_modules.append(module)
        else:
            # Generate dynamic fallback modules based on skill type
            fallback_modules = self._get_fallback_modules(skill_name, skill_type)
            for i, mod in enumerate(fallback_modules):
                module = SkillModule(
                    skill_name=skill_name,
                    module_number=mod.get("order", i + 1),
                    title=mod.get("name", f"Module {i + 1}"),
                    description=mod.get("description", ""),
                    sequence_order=i + 1,
                    estimated_hours=15 if skill_type == "technical" else 10,
                    skill_type=skill_type,
                )
                self.db.add(module)
                new_modules.append(module)

        self.db.flush()
        return new_modules

    def _get_fallback_modules(
        self,
        skill_name: str,
        skill_type: str,
    ) -> List[Dict[str, Any]]:
        """Generate fallback modules based on skill type."""

        if skill_type == "technical":
            return [
                {"name": f"{skill_name} Fundamentals", "description": "Core concepts and setup", "order": 1},
                {"name": f"Building with {skill_name}", "description": "Practical project development", "order": 2},
                {"name": f"Advanced {skill_name} Patterns", "description": "Best practices and optimization", "order": 3},
                {"name": f"{skill_name} in Production", "description": "Real-world deployment and maintenance", "order": 4},
            ]
        elif skill_type == "soft":
            return [
                {"name": "Understanding & Self-Assessment", "description": "Foundations and awareness", "order": 1},
                {"name": "Developing the Skill", "description": "Techniques and practice methods", "order": 2},
                {"name": "Applying in Practice", "description": "Real situations and feedback", "order": 3},
            ]
        else:  # tool
            return [
                {"name": "Getting Started", "description": "Setup and basic features", "order": 1},
                {"name": "Core Workflows", "description": "Essential daily usage patterns", "order": 2},
                {"name": "Advanced Features", "description": "Power features and integrations", "order": 3},
            ]

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
        """Update skill proficiency based on module completion progress."""
        progress_records = self._get_module_progress(user_skill.id)
        if not progress_records:
            return

        # Calculate proficiency from module progress
        # Scale: 0-100 module average -> 0-5 proficiency
        total = sum(p.progress_percentage for p in progress_records)
        avg_percentage = total / len(progress_records)

        # Map 0-100% to 0-5 scale
        # 0-20% = 1, 20-40% = 2, 40-60% = 3, 60-80% = 4, 80-100% = 5
        if avg_percentage >= 80:
            proficiency = 5
        elif avg_percentage >= 60:
            proficiency = 4
        elif avg_percentage >= 40:
            proficiency = 3
        elif avg_percentage >= 20:
            proficiency = 2
        elif avg_percentage > 0:
            proficiency = 1
        else:
            proficiency = user_skill.proficiency_level  # Keep existing

        user_skill.proficiency_level = proficiency
        user_skill.last_updated_at = datetime.now(timezone.utc)

        # Sync with profile skills list
        self._sync_skill_to_profile(user_skill.user_id, user_skill.skill_name, proficiency)

    def _check_skill_completion(self, user_skill: UserSkill):
        incomplete = self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_skill_id == user_skill.id,
            UserModuleProgress.status != "completed"
        ).count()

        if incomplete == 0:
            user_skill.status = "completed"
            user_skill.completed_at = datetime.now(timezone.utc)
            user_skill.proficiency_level = 5  # Expert level on 0-5 scale

    def complete_skill(self, user_id: UUID, skill_name: str) -> UserSkill:
        """Mark an entire skill as complete, completing all modules."""
        user_skill = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_name == skill_name,
        ).first()

        if not user_skill:
            # Create the skill if it doesn't exist, then complete it
            user_skill = self.start_skill(user_id, skill_name)

        now = datetime.now(timezone.utc)

        # Complete all modules
        progress_records = self._get_module_progress(user_skill.id)
        for progress in progress_records:
            progress.status = "completed"
            progress.progress_percentage = 100
            progress.completed_at = now

        # Mark skill as complete with max proficiency
        user_skill.status = "completed"
        user_skill.proficiency_level = 5  # Expert level when fully complete
        user_skill.completed_at = now
        user_skill.last_updated_at = now

        # Sync with profile skills list BEFORE commit (proficiency 5 counts for matching)
        self._sync_skill_to_profile(user_id, skill_name, 5)

        self.db.commit()

        return user_skill

    # ============================================
    # Proficiency Management Methods
    # ============================================

    def update_proficiency(
        self,
        user_id: UUID,
        skill_name: str,
        new_proficiency: int,
    ) -> UserSkill:
        """
        Manually update skill proficiency (0-5 scale).
        User can change this anytime without proof required.

        Args:
            user_id: User's ID
            skill_name: Name of the skill
            new_proficiency: New proficiency level (0-5)

        Returns:
            Updated UserSkill
        """
        if not 0 <= new_proficiency <= 5:
            raise ValueError("Proficiency must be between 0 and 5")

        user_skill = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_name == skill_name,
        ).first()

        if not user_skill:
            raise ValueError(f"Skill {skill_name} not found for user")

        user_skill.proficiency_level = new_proficiency
        user_skill.last_updated_at = datetime.now(timezone.utc)

        # Update status based on proficiency
        if new_proficiency >= PROFICIENCY_MATCH_THRESHOLD:
            if user_skill.status == "not_started":
                user_skill.status = "in_progress"

        # Sync with user profile skills list BEFORE commit
        self._sync_skill_to_profile(user_id, skill_name, new_proficiency)

        self.db.commit()

        return user_skill

    def get_skills_needing_update(self, user_id: UUID) -> List[Dict[str, Any]]:
        """
        Get skills that haven't been updated in 6+ months (or never updated).
        These skills may need refreshing or validation.

        Returns:
            List of skill dicts with decay information
        """
        from sqlalchemy import or_

        threshold = datetime.now(timezone.utc) - timedelta(days=SKILL_DECAY_MONTHS * 30)

        stale_skills = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.proficiency_level >= PROFICIENCY_MATCH_THRESHOLD,
            or_(
                UserSkill.last_updated_at < threshold,
                UserSkill.last_updated_at.is_(None),
            ),
        ).all()

        return [
            {
                "skill_name": s.skill_name,
                "proficiency": s.proficiency_level,
                "proficiency_label": PROFICIENCY_LABELS.get(s.proficiency_level, "Unknown"),
                "last_updated": s.last_updated_at.isoformat() if s.last_updated_at else None,
                "days_since_update": (datetime.now(timezone.utc) - s.last_updated_at).days if s.last_updated_at else None,
            }
            for s in stale_skills
        ]

    def boost_skill_proficiency(
        self,
        user_id: UUID,
        skill_name: str,
        boost_amount: int = 1,
    ) -> UserSkill:
        """
        Boost skill proficiency by a specified amount (used by roadmap completion).
        Caps at proficiency 5.

        Args:
            user_id: User's ID
            skill_name: Name of the skill
            boost_amount: Amount to increase proficiency by (default 1)

        Returns:
            Updated UserSkill
        """
        user_skill = self.db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            func.lower(UserSkill.skill_name) == skill_name.lower(),
        ).first()

        if not user_skill:
            # Skill doesn't exist yet - create it at the boost level
            return self.start_skill(
                user_id=user_id,
                skill_name=skill_name,
                source="roadmap",
                initial_proficiency=min(boost_amount, 5),
            )

        # Boost proficiency, cap at 5
        new_proficiency = min(user_skill.proficiency_level + boost_amount, 5)
        user_skill.proficiency_level = new_proficiency
        user_skill.last_updated_at = datetime.now(timezone.utc)

        # Sync with profile BEFORE commit
        self._sync_skill_to_profile(user_id, skill_name, new_proficiency)

        self.db.commit()

        return user_skill
