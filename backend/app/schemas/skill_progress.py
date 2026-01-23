from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ModuleSchema(BaseModel):
    id: str
    number: int
    title: str
    description: Optional[str] = None
    status: str
    progress: int

class SkillProgressSchema(BaseModel):
    current: int
    total: int
    unit: str = "modules"
    percentage: int

class UserSkillWithProgress(BaseModel):
    id: str
    name: str
    category: str
    status: str
    proficiency: int
    progress: SkillProgressSchema
    modules: List[ModuleSchema]
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

class UserSkillsWithProgressResponse(BaseModel):
    skills: List[UserSkillWithProgress]
    total_count: int
