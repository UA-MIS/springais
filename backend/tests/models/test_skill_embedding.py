from __future__ import annotations

from sqlalchemy import select

from app.models import SkillEmbedding


def test_skill_embedding_similarity(db_session):
    vector_a = [0.1] * 1536
    vector_b = [0.1] * 1536

    embedding = SkillEmbedding(
        skill_text="Python",
        normalized_text="python",
        embedding=vector_a,
        source_type="employee",
        source_id="EMP-TEST-001",
        embedding_model="text-embedding-3-large",
        token_count=12,
    )
    db_session.add(embedding)
    db_session.flush()

    similarity = embedding.similarity_to(vector_b)
    assert similarity > 0.99


def test_skill_embedding_normalized_text_lookup(db_session):
    embedding = SkillEmbedding(
        skill_text="Cloud Architecture",
        normalized_text="cloud architecture",
        embedding=[0.2] * 1536,
        source_type="job_posting",
        source_id="JOB-TEST-002",
        embedding_model="text-embedding-3-large",
        token_count=15,
    )
    db_session.add(embedding)
    db_session.flush()

    result = db_session.execute(
        select(SkillEmbedding).where(SkillEmbedding.normalized_text == "cloud architecture")
    ).scalar_one()
    assert result.skill_text == "Cloud Architecture"
