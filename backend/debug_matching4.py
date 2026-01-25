"""Debug matching using the ORM models properly."""
import asyncio
import sys
import numpy as np
sys.path.insert(0, '.')

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
import os

# Use sync engine to avoid pgvector/asyncpg issues
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg://postgres:postgres@localhost:5432/springais')

def cosine_similarity(vec1, vec2):
    v1, v2 = np.array(vec1), np.array(vec2)
    return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))

def main():
    from app.models.skill_embedding import SkillEmbedding
    from app.models.user_profile import UserProfile
    from app.models.job_posting import JobPosting

    engine = create_engine(DATABASE_URL)

    with Session(engine) as session:
        # Get Tami
        tami = session.query(UserProfile).filter(UserProfile.email == 'tami@ey.com').first()
        if not tami:
            print("Tami not found")
            return

        user_skills = tami.skills or []
        print(f"Tami has {len(user_skills)} skills")

        # Get a job with quantitative research
        from sqlalchemy import text
        result = session.execute(text("""
            SELECT id FROM job_postings
            WHERE llm_required_skills::text ILIKE '%quantitative%'
            LIMIT 1
        """))
        row = result.fetchone()
        if not row:
            print("No job with quantitative skill found")
            return
        job = session.query(JobPosting).filter(JobPosting.id == row[0]).first()

        if not job:
            print("No job with quantitative skill found")
            return

        print(f"\nJob: {job.title}")
        job_skills = []
        if job.llm_required_skills:
            for s in job.llm_required_skills:
                if isinstance(s, dict):
                    job_skills.append(s.get('name', ''))
                else:
                    job_skills.append(s)

        print(f"Job requires {len(job_skills)} skills: {job_skills[:5]}...")

        # Find Quantitative Research skill
        quant_skill = None
        for s in job_skills:
            if 'quantitative' in s.lower():
                quant_skill = s
                break

        if not quant_skill:
            print("No quantitative skill in this job")
            return

        print(f"\n=== Analyzing: '{quant_skill}' ===")

        # Get embedding for job skill
        job_emb = session.query(SkillEmbedding).filter(
            SkillEmbedding.normalized_text.ilike(f'%{quant_skill.lower()}%')
        ).first()

        if not job_emb:
            print(f"NO EMBEDDING for job skill '{quant_skill}'")
            print("This means embedding similarity can't be computed!")

            # Check what's in the DB for similar names
            similar = session.query(SkillEmbedding).filter(
                SkillEmbedding.normalized_text.ilike('%quant%')
            ).limit(5).all()
            print(f"\nSimilar skills in DB: {[s.normalized_text for s in similar]}")
            return

        print(f"Job skill embedding found: {job_emb.normalized_text}")
        job_embedding = list(job_emb.embedding)

        # Check Tami's related skills
        tami_related = [s for s in user_skills if any(x in s.lower() for x in ['quant', 'data', 'survey', 'research', 'collect'])]
        print(f"\nTami's potentially matching skills: {tami_related}")

        for user_skill in tami_related:
            user_emb = session.query(SkillEmbedding).filter(
                SkillEmbedding.normalized_text == user_skill.lower()
            ).first()

            if user_emb:
                user_embedding = list(user_emb.embedding)
                sim = cosine_similarity(job_embedding, user_embedding)
                print(f"  '{user_skill}' -> similarity: {sim:.4f}")
            else:
                print(f"  '{user_skill}' -> NO EMBEDDING")

        # Also test Risk Management
        print(f"\n=== Analyzing: 'Risk Management' ===")
        risk_emb = session.query(SkillEmbedding).filter(
            SkillEmbedding.normalized_text.ilike('%risk management%')
        ).first()

        if risk_emb:
            risk_embedding = list(risk_emb.embedding)
            tami_risk = [s for s in user_skills if any(x in s.lower() for x in ['risk', 'control', 'access', 'vendor', 'itgc'])]
            print(f"Tami's risk-related skills: {tami_risk}")

            for user_skill in tami_risk:
                user_emb = session.query(SkillEmbedding).filter(
                    SkillEmbedding.normalized_text == user_skill.lower()
                ).first()

                if user_emb:
                    user_embedding = list(user_emb.embedding)
                    sim = cosine_similarity(risk_embedding, user_embedding)
                    print(f"  '{user_skill}' -> similarity: {sim:.4f}")
                else:
                    print(f"  '{user_skill}' -> NO EMBEDDING")
        else:
            print("No 'Risk Management' embedding found in DB")

if __name__ == '__main__':
    main()
