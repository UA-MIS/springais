"""Add skill_embeddings table.

Revision ID: 017
Revises: 016
Create Date: 2026-01-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "017"
down_revision = "016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    # Check if table already exists
    if "skill_embeddings" in inspector.get_table_names():
        return

    # Create skill_embeddings table
    op.execute("""
        CREATE TABLE skill_embeddings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            skill_text VARCHAR NOT NULL,
            normalized_text VARCHAR NOT NULL,
            embedding vector(1536) NOT NULL,
            source_type VARCHAR NOT NULL,
            source_id VARCHAR NOT NULL,
            embedding_model VARCHAR NOT NULL,
            token_count INTEGER,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)

    # Create indexes
    op.execute("""
        CREATE INDEX idx_skill_embedding_normalized
        ON skill_embeddings(normalized_text)
    """)
    op.execute("""
        CREATE INDEX idx_skill_embedding_vector
        ON skill_embeddings USING hnsw(embedding vector_cosine_ops)
    """)
    op.execute("""
        CREATE INDEX idx_skill_embedding_source
        ON skill_embeddings(source_type, source_id)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS skill_embeddings CASCADE")
