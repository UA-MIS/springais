# Routes will be added here by Step 2 blocks
from .auth import router as auth_router
from .badges import router as badges_router
from .hiring_manager import router as hiring_manager_router
from .matches import router as matches_router
from .skills import router as skills_router
from .patterns import router as patterns_router
from .roadmap import router as roadmap_router

__all__ = ["auth_router", "badges_router", "hiring_manager_router", "matches_router", "skills_router", "patterns_router", "roadmap_router"]
