from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting SpringAIS backend...")
    # Create tables (will be populated by migrations later)
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    print("👋 Shutting down SpringAIS backend...")

app = FastAPI(
    title="SpringAIS API",
    description="AI-powered talent mobility platform for EY",
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

@app.get("/")
async def root():
    return {
        "message": "SpringAIS API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
