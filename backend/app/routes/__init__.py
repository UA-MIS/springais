# Routes will be added here by Step 2 blocks
from .achievements import router as achievements_router
from .auth import router as auth_router
from .badges import router as badges_router
from .hiring_manager import router as hiring_manager_router
from .matches import router as matches_router
from .progression import router as progression_router
from .quests import router as quests_router
from .skills import router as skills_router
from .store import router as store_router
from .patterns import router as patterns_router
from .roadmap import router as roadmap_router

__all__ = [
    "achievements_router",
    "auth_router",
    "badges_router",
    "hiring_manager_router",
    "matches_router",
    "progression_router",
    "quests_router",
    "skills_router",
    "store_router",
    "patterns_router",
    "roadmap_router",
]
