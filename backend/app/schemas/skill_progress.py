from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ExternalResourceSchema(BaseModel):
    title: str
    url: str
    type: str
    provider: str
    estimated_time: str
    description: str

class EYResourceSchema(BaseModel):
    title: str
    url: str
    type: str
    badge_available: bool = False
    description: str
    # Badge integration fields (ADR-003: additive, non-breaking)
    badge_id: Optional[str] = None
    issuer: Optional[str] = None
    image_url: Optional[str] = None
    difficulty_level: Optional[str] = None

class ModuleSchema(BaseModel):
    id: str
    number: int
    title: str
    description: Optional[str] = None
    status: str
    progress: int
    # Learning content fields
    learning_content: Optional[str] = None
    external_resources: List[ExternalResourceSchema] = []
    ey_resources: List[EYResourceSchema] = []

class SkillProgressSchema(BaseModel):
    current: int
    total: int
    unit: str = "modules"
    percentage: int

class UserSkillWithProgress(BaseModel):
    id: str
    name: str
    category: str
    categoryId: Optional[str] = None
    categoryEmoji: str = "star"
    status: str
    proficiency: int
    # New proficiency fields
    proficiency_level: int = 0
    proficiency_label: str = "None"
    source: str = "manual"
    counts_for_matching: bool = False
    last_updated_at: Optional[str] = None
    needs_update: bool = False
    progress: SkillProgressSchema
    modules: List[ModuleSchema]
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

class UserSkillsWithProgressResponse(BaseModel):
    skills: List[UserSkillWithProgress]
    total_count: int
