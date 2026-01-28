from __future__ import annotations

import asyncio
import atexit
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import OPENAI_API_KEY, get_openai_client
from app.models.career_path import CareerPath
from app.models.job_posting import JobPosting
from app.models.match import Match
from app.models.skill_recommendation import UserSkillRecommendation
from app.models.user_profile import UserProfile

logger = logging.getLogger(__name__)

# Shared thread pool for DB operations (reused across requests)
_db_thread_pool: Optional[ThreadPoolExecutor] = None


def get_db_thread_pool() -> ThreadPoolExecutor:
    """Get or create shared thread pool for DB operations."""
    global _db_thread_pool
    if _db_thread_pool is None:
        _db_thread_pool = ThreadPoolExecutor(max_workers=4, thread_name_prefix="rec_db_")
        logger.info("Created shared DB thread pool for recommendation service")
    return _db_thread_pool


def shutdown_db_thread_pool():
    """Shutdown thread pool on app exit."""
    global _db_thread_pool
    if _db_thread_pool is not None:
        _db_thread_pool.shutdown(wait=False)
        _db_thread_pool = None


# Register cleanup on exit
atexit.register(shutdown_db_thread_pool)


DEFAULT_BOOTSTRAP_SKILLS = [
    ("Leadership", "leadership_management"),
    ("Project Management", "leadership_management"),
    ("AWS Fundamentals", "cloud_infrastructure"),
    ("Python", "data_analytics"),
    ("SQL", "data_analytics"),
    ("Client Presentations", "consulting_excellence"),
    ("Security Best Practices", "security"),
    ("Agile Methodologies", "business_acumen"),
]


class SkillRecommendationService:
    def __init__(self, db: Session):
        self.db = db

    async def compute_recommendations(self, user_id: UUID) -> List[UserSkillRecommendation]:
        loop = asyncio.get_event_loop()
        executor = get_db_thread_pool()  # Use shared pool

        # Run blocking DB operations in thread pool
        def fetch_user_and_aggregate():
            user = self.db.query(UserProfile).filter_by(id=user_id).first()
            if not user:
                return None, None, set()

            current_skills = {self._skill_key(s) for s in (user.skills or []) if s}
            aggregated = {}

            self._aggregate_from_matches(aggregated, user_id, current_skills)
            return user, aggregated, current_skills

        user, aggregated, current_skills = await loop.run_in_executor(
            executor, fetch_user_and_aggregate
        )

        if not user:
            return []

        await self._aggregate_from_career_goal(aggregated, user, current_skills)

        if not aggregated:
            aggregated = await self._llm_bootstrap(user)

        # Run persist in thread pool (reuse shared pool)
        result = await loop.run_in_executor(
            executor, self._persist_recommendations, user_id, aggregated
        )
        return result

    def _aggregate_from_matches(
        self,
        aggregated: Dict[str, dict],
        user_id: UUID,
        current_skills: set[str],
    ) -> None:
        matches = self.db.query(Match).filter_by(user_id=user_id).all()
        for match in matches:
            for raw_skill in match.skill_gaps or []:
                skill_key = self._skill_key(raw_skill)
                if not skill_key or skill_key in current_skills:
                    continue
                skill_name = self._clean_skill(raw_skill)
                entry = aggregated.setdefault(
                    skill_key,
                    {
                        "skill_name": skill_name,
                        "count": 0,
                        "job_ids": [],
                        "source": "saved_matches",
                        "category": self._infer_category(skill_name),
                    },
                )
                entry["count"] += 1
                entry["job_ids"].append(str(match.job_posting_id))

    async def _aggregate_from_career_goal(
        self,
        aggregated: Dict[str, dict],
        user: UserProfile,
        current_skills: set[str],
    ) -> None:
        career_path: CareerPath | None = user.career_path
        if not career_path or not career_path.target_position_node_id:
            return

        # Run blocking DB operation in shared thread pool
        loop = asyncio.get_event_loop()
        executor = get_db_thread_pool()  # Use shared pool
        target_skills = await loop.run_in_executor(
            executor, self._get_skills_for_target, career_path.target_position_node_id
        )

        for raw_skill in target_skills:
            skill_key = self._skill_key(raw_skill)
            if not skill_key or skill_key in current_skills:
                continue
            skill_name = self._clean_skill(raw_skill)
            entry = aggregated.setdefault(
                skill_key,
                {
                    "skill_name": skill_name,
                    "count": 0,
                    "job_ids": [],
                    "source": "career_goal",
                    "category": self._infer_category(skill_name),
                },
            )
            entry["count"] += 2

    def _get_skills_for_target(self, target_node_id: str) -> List[str]:
        job = self.db.query(JobPosting).filter(JobPosting.id == target_node_id).first()
        if not job:
            normalized_title = target_node_id.replace("_", " ").replace("-", " ").strip().lower()
            job = (
                self.db.query(JobPosting)
                .filter(func.lower(JobPosting.title) == normalized_title)
                .first()
            )
        if not job:
            job = (
                self.db.query(JobPosting)
                .filter(JobPosting.title.ilike(f"%{target_node_id}%"))
                .first()
            )

        if not job:
            return []

        return list({*(job.required_skills or []), *(job.preferred_skills or [])})

    async def _llm_bootstrap(self, user: UserProfile) -> Dict[str, dict]:
        if not OPENAI_API_KEY:
            return {
                skill: {
                    "count": 1,
                    "job_ids": [],
                    "source": "llm_bootstrap",
                    "category": category,
                }
                for skill, category in DEFAULT_BOOTSTRAP_SKILLS
            }

        prompt = f"""
User's current role: {user.current_role or "Not specified"}
User's current skills: {user.skills or []}
Target service line: {user.target_service_line or "Not specified"}

Suggest 5-10 skills they should develop next for career growth.
Return as JSON object where keys are skill names and values are categories.

Categories (use exactly these):
cloud_infrastructure, leadership_management, data_analytics,
consulting_excellence, programming, security, business_acumen

Example:
{{"Python": "data_analytics", "AWS Fundamentals": "cloud_infrastructure"}}
"""
        try:
            client = get_openai_client()
            response = await client.chat.completions.create(
                model="gpt-5-nano",
                messages=[
                    {
                        "role": "system",
                        "content": "Return valid JSON only. No markdown or commentary.",
                    },
                    {"role": "user", "content": prompt},
                ],
                max_completion_tokens=500,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
            skills_dict = json.loads(content)
        except Exception as exc:
            logger.warning(f"LLM bootstrap failed, using defaults: {exc}")
            skills_dict = {skill: category for skill, category in DEFAULT_BOOTSTRAP_SKILLS}

        recommendations = {}
        for skill, category in skills_dict.items():
            skill_name = self._clean_skill(skill)
            skill_key = self._skill_key(skill_name)
            if not skill_key:
                continue
            recommendations[skill_key] = {
                "skill_name": skill_name,
                "count": 1,
                "job_ids": [],
                "source": "llm_bootstrap",
                "category": category,
            }
        return recommendations

    def _persist_recommendations(
        self,
        user_id: UUID,
        aggregated: Dict[str, dict],
    ) -> List[UserSkillRecommendation]:
        existing = (
            self.db.query(UserSkillRecommendation)
            .filter(UserSkillRecommendation.user_id == user_id)
            .all()
        )
        existing_map = {self._skill_key(rec.skill_name): rec for rec in existing}

        stale = [
            rec.skill_name
            for key, rec in existing_map.items()
            if rec.status == "recommended" and key not in aggregated
        ]
        if stale:
            self.db.query(UserSkillRecommendation).filter(
                UserSkillRecommendation.user_id == user_id,
                UserSkillRecommendation.status == "recommended",
                func.lower(UserSkillRecommendation.skill_name).in_([s.lower() for s in stale]),
            ).delete(synchronize_session=False)

        results = []
        max_count = max((data["count"] for data in aggregated.values()), default=1)

        for skill_key, data in aggregated.items():
            skill_name = data.get("skill_name", "").strip()
            if not skill_name:
                continue

            priority = min(float(data["count"]) / max_count, 1.0)
            existing_rec = existing_map.get(skill_key)

            if existing_rec:
                if existing_rec.status == "dismissed":
                    continue
                existing_rec.priority_score = priority
                existing_rec.category = data.get("category") or existing_rec.category
                existing_rec.source = data.get("source", existing_rec.source)
                existing_rec.related_job_ids = data.get("job_ids", existing_rec.related_job_ids)
                results.append(existing_rec)
            else:
                rec = UserSkillRecommendation(
                    user_id=user_id,
                    skill_name=skill_name,
                    category=data.get("category"),
                    priority_score=priority,
                    source=data.get("source", "saved_matches"),
                    related_job_ids=data.get("job_ids", []),
                )
                self.db.add(rec)
                results.append(rec)

        self.db.commit()
        return results

    def _clean_skill(self, skill: str) -> str:
        return skill.strip()

    def _skill_key(self, skill: str) -> str:
        return skill.strip().lower()

    def _infer_category(self, skill: str) -> str:
        value = skill.lower()
        keyword_map = [
            ("cloud_infrastructure", ["aws", "azure", "gcp", "cloud", "kubernetes", "docker", "terraform", "devops"]),
            ("leadership_management", ["leadership", "mentor", "mentorship", "management", "manager", "strategy", "strategic", "conflict", "coaching"]),
            ("data_analytics", ["data", "analytics", "analysis", "sql", "python", "ml", "machine learning", "tableau", "power bi", "statistics"]),
            ("consulting_excellence", ["client", "stakeholder", "presentation", "consulting", "workshop", "facilitation"]),
            ("security", ["security", "owasp", "compliance", "risk", "vulnerability", "iam", "soc"]),
            ("business_acumen", ["finance", "financial", "budget", "agile", "scrum", "business", "market"]),
            ("programming", ["javascript", "typescript", "react", "node", "java", "c#", "golang", "rust", "go"]),
        ]
        for category, keywords in keyword_map:
            if any(keyword in value for keyword in keywords):
                return category
        return "programming"
