"""Database initialization - creates extensions on startup."""
from sqlalchemy import text
from app.database import engine
import logging

logger = logging.getLogger(__name__)

def init_database_extensions():
    """Create required PostgreSQL extensions if they don't exist."""
    try:
        with engine.connect() as conn:
            # Enable pgvector for vector similarity search
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            logger.info("✓ pgvector extension enabled")
            
            # Enable pgcrypto for UUID generation
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
            logger.info("✓ pgcrypto extension enabled")
            
            conn.commit()
    except Exception as e:
        logger.error(f"Failed to create extensions: {e}")
        raise

if __name__ == "__main__":
    init_database_extensions()