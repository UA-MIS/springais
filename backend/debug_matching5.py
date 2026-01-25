"""Check if embeddings are loaded during matching."""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import os

from app.models.skill_embedding import SkillEmbedding
from app.models.user_profile import UserProfile
from app.models.job_posting import JobPosting
from app.utils.text import normalize_skill_text

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg://postgres:postgres@localhost:5432/springais')

def main():
    engine = create_engine(DATABASE_URL)

    with Session(engine) as session:
        # Preload all embeddings (like matching service does)
        all_embeddings = session.query(SkillEmbedding).all()
        embedding_cache = {}
        for emb in all_embeddings:
            embedding_cache[emb.normalized_text] = list(emb.embedding)

        print(f"Loaded {len(embedding_cache)} embeddings into cache")

        # Get Tami
        tami = session.query(UserProfile).filter(UserProfile.email == 'tami@ey.com').first()
        user_skills = tami.skills or []

        # Get a job
        result = session.execute(text("""
            SELECT id FROM job_postings
            WHERE llm_required_skills::text ILIKE '%quantitative%'
            LIMIT 1
        """))
        row = result.fetchone()
        job = session.query(JobPosting).filter(JobPosting.id == row[0]).first()

        job_skills = []
        if job.llm_required_skills:
            for s in job.llm_required_skills:
                if isinstance(s, dict):
                    job_skills.append(s.get('name', ''))
                else:
                    job_skills.append(s)

        print(f"\nJob: {job.title}")
        print(f"Job has {len(job_skills)} required skills")
        print(f"Tami has {len(user_skills)} skills")

        # Simulate _build_skill_embeddings for job skills
        print("\n=== Checking job skill embedding lookups ===")
        job_embeddings_found = 0
        job_embeddings_missing = []

        for skill in job_skills:
            normalized = normalize_skill_text(skill)
            if normalized in embedding_cache:
                job_embeddings_found += 1
            else:
                job_embeddings_missing.append(f"'{skill}' (normalized: '{normalized}')")

        print(f"Job skills with embeddings: {job_embeddings_found}/{len(job_skills)}")
        if job_embeddings_missing:
            print(f"Missing: {job_embeddings_missing[:5]}...")

        # Simulate _build_skill_embeddings for user skills
        print("\n=== Checking user skill embedding lookups ===")
        user_embeddings_found = 0
        user_embeddings_missing = []

        for skill in user_skills:
            normalized = normalize_skill_text(skill)
            if normalized in embedding_cache:
                user_embeddings_found += 1
            else:
                user_embeddings_missing.append(f"'{skill}' (normalized: '{normalized}')")

        print(f"User skills with embeddings: {user_embeddings_found}/{len(user_skills)}")
        if user_embeddings_missing:
            print(f"Missing: {user_embeddings_missing[:10]}...")

        # Check specific skills
        print("\n=== Specific lookups ===")
        test_skills = ['Quantitative Research', 'Quantitative Data Collection', 'Risk Management', 'Vendor Risk Management']
        for skill in test_skills:
            normalized = normalize_skill_text(skill)
            found = normalized in embedding_cache
            print(f"'{skill}' -> normalized: '{normalized}' -> {'FOUND' if found else 'NOT FOUND'}")

if __name__ == '__main__':
    main()
