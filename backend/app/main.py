from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routes import auth_router, badges_router, hiring_manager_router, matches_router, skills_router, patterns_router, roadmap_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting SkillBridge backend...")
    # Create tables (will be populated by migrations later)
    Base.metadata.create_all(bind=engine)

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
    allow_origins=["http://localhost:3000"],  # Frontend URL
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
app.include_router(skills_router, prefix="/api")
app.include_router(patterns_router, prefix="/api")
app.include_router(roadmap_router, prefix="/api")
app.include_router(hiring_manager_router, prefix="/api")
app.include_router(auth_router)
