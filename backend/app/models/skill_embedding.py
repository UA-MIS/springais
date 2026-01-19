from __future__ import annotations

from typing import Sequence
from uuid import UUID, uuid4

import numpy as np
from pgvector.sqlalchemy import Vector
from sqlalchemy import Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import text

from .base import Base, TimestampMixin


class SkillEmbedding(Base, TimestampMixin):
    __tablename__ = "skill_embeddings"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    skill_text: Mapped[str] = mapped_column(String, nullable=False)
    normalized_text: Mapped[str] = mapped_column(String, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(Vector(1536), nullable=False)
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    source_id: Mapped[str] = mapped_column(String, nullable=False)
    embedding_model: Mapped[str] = mapped_column(String, nullable=False)
    token_count: Mapped[int | None] = mapped_column(Integer)

    __table_args__ = (
        Index("idx_skill_embedding_normalized", "normalized_text"),
        Index(
            "idx_skill_embedding_vector",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        Index("idx_skill_embedding_source", "source_type", "source_id"),
    )

    def similarity_to(self, other_embedding: Sequence[float]) -> float:
        """Compute cosine similarity to another embedding vector."""

        if not other_embedding:
            return 0.0
        vec_a = np.array(self.embedding, dtype=float)
        vec_b = np.array(other_embedding, dtype=float)
        denom = (np.linalg.norm(vec_a) * np.linalg.norm(vec_b)) or 1.0
        return float(np.dot(vec_a, vec_b) / denom)
