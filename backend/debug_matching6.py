"""Simulate exact skill matching calculation."""
import sys
import numpy as np
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import os

from app.models.skill_embedding import SkillEmbedding
from app.models.user_profile import UserProfile
from app.models.job_posting import JobPosting
from app.utils.text import normalize_skill_text
from app.services.skill_taxonomy import get_taxonomy_service

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg://postgres:postgres@localhost:5432/springais')

def cosine_similarity(vec1, vec2):
    v1, v2 = np.array(vec1), np.array(vec2)
    norm1, norm2 = np.linalg.norm(v1), np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))

def main():
    engine = create_engine(DATABASE_URL)
    taxonomy = get_taxonomy_service()

    with Session(engine) as session:
        # Preload embeddings
        all_embeddings = session.query(SkillEmbedding).all()
        embedding_cache = {}
        for emb in all_embeddings:
            embedding_cache[emb.normalized_text] = list(emb.embedding)

        # Get Tami
        tami = session.query(UserProfile).filter(UserProfile.email == 'tami@ey.com').first()
        user_skills = tami.skills or []

        # Build user embeddings dict (like matching service)
        user_embeddings = {}
        for skill in user_skills:
            normalized = normalize_skill_text(skill)
            if normalized in embedding_cache:
                user_embeddings[skill] = embedding_cache[normalized]

        print(f"User has {len(user_skills)} skills, {len(user_embeddings)} with embeddings")

        # Get job
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

        # Build job embeddings
        job_embeddings = {}
        for skill in job_skills:
            normalized = normalize_skill_text(skill)
            if normalized in embedding_cache:
                job_embeddings[skill] = embedding_cache[normalized]

        print(f"Job requires {len(job_skills)} skills, {len(job_embeddings)} with embeddings")
        print(f"\nJob: {job.title}")

        # Simulate _calculate_skill_match_score
        print("\n=== Simulating skill match calculation ===\n")

        matches = []
        user_skills_lower = {s.lower() for s in user_skills}
        user_embedding_list = list(user_embeddings.values())

        for required_skill in job_skills:
            # 1. Check taxonomy
            taxonomy_score = taxonomy.calculate_skill_coverage(user_skills, required_skill)
            if taxonomy_score > 0:
                print(f"'{required_skill}': TAXONOMY match = {taxonomy_score:.2f}")
                matches.append(taxonomy_score)
                continue

            # 2. Exact string match
            if required_skill.lower() in user_skills_lower:
                print(f"'{required_skill}': EXACT match = 1.0")
                matches.append(1.0)
                continue

            # 3. Embedding similarity
            job_emb = job_embeddings.get(required_skill)
            if job_emb is None or not user_embedding_list:
                # Fuzzy fallback
                print(f"'{required_skill}': NO EMBEDDING, fuzzy fallback")
                matches.append(0.0)
                continue

            # Find best matching user skill
            best_sim = 0.0
            best_skill = None
            for user_skill, user_emb in user_embeddings.items():
                sim = cosine_similarity(job_emb, user_emb)
                if sim > best_sim:
                    best_sim = sim
                    best_skill = user_skill

            print(f"'{required_skill}': EMBEDDING best match '{best_skill}' = {best_sim:.4f}")
            matches.append(best_sim)

        # Calculate final score
        skill_score = sum(matches) / len(matches) if matches else 0.0
        print(f"\n=== RESULT ===")
        print(f"Average skill score: {skill_score:.4f} ({skill_score*100:.1f}%)")
        print(f"Overall (80% skill weight): {skill_score * 0.8:.4f}")

if __name__ == '__main__':
    main()
