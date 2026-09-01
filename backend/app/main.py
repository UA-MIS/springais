from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging

# NOTE: `engine` and `Base` are deliberately NOT imported here any more. They were used
# only by the create_all() call removed from the lifespan hook below — see the long
# comment there. app.database is still imported (by app.init_db and by every route's
# get_db dependency), so the engine is still constructed exactly once at import time.
from app.routes import achievements_router, auth_router, badges_router, hiring_manager_router, matches_router, progression_router, quests_router, skills_router, store_router, patterns_router, roadmap_router
from app.init_db import init_database_extensions

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting SkillBridge backend...")
    
    # Initialize database extensions (pgvector, pgcrypto)
    init_database_extensions()
    logger.info("✓ Database initialized with required extensions")
    
    # ------------------------------------------------------------------
    # NO Base.metadata.create_all() HERE. THIS IS DELIBERATE — DO NOT RESTORE IT.
    # ------------------------------------------------------------------
    # It used to read:
    #     Base.metadata.create_all(bind=engine)
    # and on an EMPTY database it did real damage, in a way that only showed up in a
    # fresh environment (i.e. never in the developer's already-migrated local one):
    #
    #   1. It builds the tables from the SQLAlchemy models and never stamps
    #      `alembic_version`. Alembic then believes the database is at revision NONE.
    #   2. It CANNOT create three of the four HNSW vector indexes. Those are raw
    #      `op.execute("CREATE INDEX ... USING hnsw (...)")` statements in migration
    #      016_add_llm_skill_columns.py — DDL that exists only in the migration, not in
    #      any model definition. So the schema came out silently missing its ANN indexes,
    #      and similarity search degraded to a sequential scan.
    #   3. On the next start `alembic upgrade head` replayed from 001 against tables that
    #      already existed and died on "relation already exists" — which the old image
    #      CMD then swallowed with `|| echo 'Migration skipped'`.
    #
    # Alembic owns this schema, exclusively. It runs once per deploy in the chart's
    # migration initContainer (.devops/chart/base/deployments.yaml) with a bare
    # `alembic upgrade head`, and the app container does not start unless it exited 0.
    # By the time this lifespan hook runs, the schema is already at head.

    # Seed badge catalog if empty
    from app.database import SessionLocal
    from app.models.badge import BadgeCatalog
    db = SessionLocal()
    try:
        badge_count = db.query(BadgeCatalog).count()
        if badge_count == 0:
            from app.data.badge_seed import seed_badge_catalog
            count = seed_badge_catalog(db)
            print(f"Seeded badge catalog with {count} badges")
        else:
            print(f"Badge catalog already has {badge_count} entries")

        # Seed achievement catalog if empty
        from app.models.achievement import AchievementCatalog
        achievement_count = db.query(AchievementCatalog).count()
        if achievement_count == 0:
            from app.data.achievement_seed import seed_achievement_catalog
            count = seed_achievement_catalog(db)
            print(f"Seeded achievement catalog with {count} achievements")
        else:
            print(f"Achievement catalog already has {achievement_count} entries")

        # Seed quest catalog if empty
        from app.models.quest import SideQuestCatalog
        quest_count = db.query(SideQuestCatalog).count()
        if quest_count == 0:
            from app.data.quest_seed import seed_quest_catalog
            count = seed_quest_catalog(db)
            print(f"Seeded quest catalog with {count} quests")
        else:
            print(f"Quest catalog already has {quest_count} entries")

        # Seed cosmetic catalog (always run to pick up new items)
        from app.data.cosmetic_seed import seed_cosmetic_catalog
        count = seed_cosmetic_catalog(db)
        if count > 0:
            print(f"Seeded cosmetic catalog with {count} new cosmetics")
        else:
            print("Cosmetic catalog is up to date")
    finally:
        db.close()

    yield
    # Shutdown
    print("Shutting down SkillBridge backend...")

app = FastAPI(
    title="SkillBridge API",
    description="AI-powered talent mobility platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://myskillbridge.me",
        "http://myskillbridge.me",
        "https://skillbridge-4t23g.ondigitalocean.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression middleware - reduces payload sizes by 60-80%
# Only compresses responses larger than 1000 bytes
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.get("/")
async def root():
    return {
        "message": "SkillBridge API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Include routers
app.include_router(badges_router, prefix="/api")
app.include_router(matches_router, prefix="/api")
app.include_router(progression_router, prefix="/api")
app.include_router(skills_router, prefix="/api")
app.include_router(patterns_router, prefix="/api")
app.include_router(roadmap_router, prefix="/api")
app.include_router(hiring_manager_router, prefix="/api")
app.include_router(quests_router, prefix="/api")
app.include_router(achievements_router, prefix="/api")
app.include_router(store_router, prefix="/api")
app.include_router(auth_router, prefix="/api")