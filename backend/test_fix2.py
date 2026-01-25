"""Debug the skill gap fix."""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import numpy as np
import os

from app.models.user_profile import UserProfile
from app.models.job_posting import JobPosting
from app.models.skill_embedding import SkillEmbedding
from app.utils.text import normalize_skill_text
from app.services.skill_taxonomy import get_taxonomy_service

DATABASE_URL = 'postgresql+psycopg://postgres:postgres@localhost:5432/springais'

SKILL_MATCH_THRESHOLD = 0.65
SKILL_TRANSFERABLE_THRESHOLD = 0.50

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
        # Preload ALL embeddings
        all_embeddings = session.query(SkillEmbedding).all()
        embedding_cache = {}
        for emb in all_embeddings:
            embedding_cache[emb.normalized_text] = list(emb.embedding)
        print(f"Loaded {len(embedding_cache)} embeddings")

        # Get Tami
        tami = session.query(UserProfile).filter(UserProfile.email == 'tami@ey.com').first()
        employee_skills = set(tami.skills or [])
        print(f"Tami has {len(employee_skills)} skills")

        # Build employee embeddings
        employee_embeddings = {}
        for skill in employee_skills:
            normalized = normalize_skill_text(skill)
            if normalized in embedding_cache:
                employee_embeddings[skill] = embedding_cache[normalized]
        print(f"Employee embeddings loaded: {len(employee_embeddings)}")

        # Get job
        result = session.execute(text("""
            SELECT id FROM job_postings
            WHERE llm_required_skills::text ILIKE '%quantitative research%'
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

        print(f"Job: {job.title}")
        print(f"Job skills: {len(job_skills)}, with embeddings: {len(job_embeddings)}")

        # Now run the gap calculation manually
        print("\n=== Calculating gaps with semantic matching ===\n")

        overlapping = []
        missing = []
        transferable = []

        for req_skill in job_skills:
            # 1. Exact match
            if req_skill.lower() in {s.lower() for s in employee_skills}:
                overlapping.append(req_skill)
                print(f"[EXACT] {req_skill}")
                continue

            # 2. Taxonomy match
            taxonomy_score = taxonomy.calculate_skill_coverage(list(employee_skills), req_skill)
            if taxonomy_score >= 0.70:
                overlapping.append(req_skill)
                print(f"[TAXONOMY={taxonomy_score:.2f}] {req_skill}")
                continue

            # 3. Embedding similarity
            req_embedding = job_embeddings.get(req_skill)
            if req_embedding is not None:
                best_similarity = 0.0
                best_matching_skill = None

                for emp_skill in employee_skills:
                    emp_embedding = employee_embeddings.get(emp_skill)
                    if emp_embedding is not None:
                        similarity = cosine_similarity(emp_embedding, req_embedding)
                        if similarity > best_similarity:
                            best_similarity = similarity
                            best_matching_skill = emp_skill

                if best_similarity >= SKILL_MATCH_THRESHOLD:
                    overlapping.append(req_skill)
                    print(f"[SEMANTIC={best_similarity:.3f}] {req_skill} <- {best_matching_skill}")
                    continue
                elif best_similarity >= SKILL_TRANSFERABLE_THRESHOLD:
                    transferable.append(f"{req_skill} (via {best_matching_skill})")
                    print(f"[TRANSFER={best_similarity:.3f}] {req_skill} <- {best_matching_skill}")
                    continue
                else:
                    print(f"[GAP best={best_similarity:.3f}] {req_skill} (best: {best_matching_skill})")
            else:
                print(f"[GAP no-emb] {req_skill}")

            missing.append(req_skill)

        print(f"\n=== SUMMARY ===")
        print(f"Matched: {len(overlapping)}/{len(job_skills)}")
        print(f"Transferable: {len(transferable)}")
        print(f"Gaps: {len(missing)}")

if __name__ == '__main__':
    main()
