"""Simulate exactly what the matching service does."""
import asyncio
import sys
import numpy as np
sys.path.insert(0, '.')

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/springais')

def cosine_similarity(vec1, vec2):
    v1, v2 = np.array(vec1), np.array(vec2)
    return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))

async def debug():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Get Tami's skills
        result = await session.execute(text("""
            SELECT skills FROM user_profiles WHERE email = 'tami@ey.com'
        """))
        user = result.fetchone()
        user_skills = user[0] or []

        # Get a job with "Quantitative Research" requirement
        result = await session.execute(text("""
            SELECT id, title, llm_required_skills
            FROM job_postings
            WHERE llm_required_skills::text ILIKE '%quantitative%'
            LIMIT 1
        """))
        job = result.fetchone()

        if not job:
            print("No job with Quantitative Research found")
            return

        print(f"Job: {job[1]}")
        job_skills = [s.get('name') if isinstance(s, dict) else s for s in (job[2] or [])]
        print(f"Job requires {len(job_skills)} skills")

        # Find the Quantitative Research skill
        quant_skill = None
        for s in job_skills:
            if 'quantitative' in s.lower():
                quant_skill = s
                break

        if not quant_skill:
            print("No quantitative skill found in job")
            return

        print(f"\nTarget skill: '{quant_skill}'")

        # Get embedding for job skill
        result = await session.execute(text("""
            SELECT embedding FROM skill_embeddings
            WHERE LOWER(normalized_text) = LOWER(:skill)
            LIMIT 1
        """), {'skill': quant_skill})
        job_emb_row = result.fetchone()

        if not job_emb_row:
            print(f"  -> NO EMBEDDING for job skill '{quant_skill}'! Falls back to fuzzy matching.")
        else:
            job_embedding = list(job_emb_row[0])
            print(f"  -> Job skill has embedding (dim={len(job_embedding)})")

            # Now check Tami's related skills
            tami_quant_skills = [s for s in user_skills if 'quant' in s.lower() or 'data' in s.lower() or 'research' in s.lower()]
            print(f"\nTami's potentially matching skills: {tami_quant_skills}")

            for user_skill in tami_quant_skills:
                result = await session.execute(text("""
                    SELECT embedding FROM skill_embeddings
                    WHERE LOWER(normalized_text) = LOWER(:skill)
                    LIMIT 1
                """), {'skill': user_skill})
                user_emb_row = result.fetchone()

                if user_emb_row:
                    user_embedding = list(user_emb_row[0])
                    similarity = cosine_similarity(job_embedding, user_embedding)
                    print(f"  '{user_skill}' -> similarity: {similarity:.4f}")
                else:
                    print(f"  '{user_skill}' -> NO EMBEDDING")

        # Also check Risk Management
        print("\n--- Risk Management ---")
        risk_skill = "Risk Management"
        result = await session.execute(text("""
            SELECT embedding FROM skill_embeddings
            WHERE LOWER(normalized_text) LIKE '%risk manage%'
            LIMIT 1
        """))
        risk_emb = result.fetchone()

        if risk_emb:
            risk_embedding = list(risk_emb[0])
            print(f"'{risk_skill}' has embedding")

            tami_risk_skills = [s for s in user_skills if 'risk' in s.lower() or 'control' in s.lower()]
            print(f"Tami's related skills: {tami_risk_skills}")

            for user_skill in tami_risk_skills:
                result = await session.execute(text("""
                    SELECT embedding FROM skill_embeddings
                    WHERE LOWER(normalized_text) = LOWER(:skill)
                    LIMIT 1
                """), {'skill': user_skill})
                user_emb_row = result.fetchone()

                if user_emb_row:
                    user_embedding = list(user_emb_row[0])
                    similarity = cosine_similarity(risk_embedding, user_embedding)
                    print(f"  '{user_skill}' -> similarity: {similarity:.4f}")
                else:
                    print(f"  '{user_skill}' -> NO EMBEDDING")
        else:
            print(f"'{risk_skill}' has NO EMBEDDING in database")

asyncio.run(debug())
