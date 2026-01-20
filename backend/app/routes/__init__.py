# Routes will be added here by Step 2 blocks
from .matches import router as matches_router
from .skills import router as skills_router
from .patterns import router as patterns_router

__all__ = ["matches_router", "skills_router", "patterns_router"]
