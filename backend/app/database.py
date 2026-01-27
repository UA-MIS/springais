import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv

from app.models.base import Base

load_dotenv()

# PostgreSQL connection URL
# Format: postgresql+psycopg://user:password@host:port/database
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/springais"
)

# Normalize common DSN formats to psycopg3 dialect.
# This prevents accidental psycopg2 usage when the env var is set to "postgresql://...".
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)

# Create engine with psycopg3 and connection pooling
# Pool settings to prevent connection exhaustion during heavy loads
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,           # Base number of connections to keep open
    max_overflow=30,        # Additional connections allowed under load
    pool_timeout=30,        # Seconds to wait for connection before timeout
    pool_recycle=1800,      # Recycle connections after 30 minutes
    pool_pre_ping=True,     # Verify connections are alive before using
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
