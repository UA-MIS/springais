"""Debug why embeddings aren't producing higher match scores."""
from sqlalchemy import create_engine, text
import os

# Get database URL from environment or use default
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/springais')

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Get Tami's profile
    result = conn.execute(text("""
        SELECT id, skills
        FROM user_profiles
        WHERE email = 'tami@ey.com'
    """))
    user = result.fetchone()

    if not user:
        print("Tami not found!")
        exit()

    user_id = user[0]
    user_skills = user[1] or []

    print(f"=== TAMI'S PROFILE ===")
    print(f"User ID: {user_id}")
    print(f"Total skills: {len(user_skills)}")
    print()

    # Check how many of her skills have embeddings
    skills_with_embeddings = 0
    skills_without_embeddings = []

    for skill in user_skills[:20]:  # Check first 20
        result = conn.execute(text("""
            SELECT COUNT(*) FROM skill_embeddings
            WHERE LOWER(normalized_text) = LOWER(:skill)
        """), {'skill': skill})
        count = result.scalar()
        if count > 0:
            skills_with_embeddings += 1
        else:
            skills_without_embeddings.append(skill)

    print(f"Skills with embeddings: {skills_with_embeddings}/20 checked")
    if skills_without_embeddings:
        print(f"Missing embeddings for: {skills_without_embeddings[:5]}")
    print()

    # Get the job she's matching against (EY-Parthenon role)
    result = conn.execute(text("""
        SELECT id, title, llm_required_skills, required_skills
        FROM job_postings
        WHERE title ILIKE '%parthenon%' OR title ILIKE '%strategy%'
        LIMIT 1
    """))
    job = result.fetchone()

    if job:
        print(f"=== JOB POSTING ===")
        print(f"Job ID: {job[0]}")
        print(f"Title: {job[1]}")

        # Check job skills
        job_skills = []
        if job[2]:  # llm_required_skills
            job_skills = [s.get('name') if isinstance(s, dict) else s for s in job[2]]
        elif job[3]:  # required_skills
            job_skills = job[3]

        print(f"Required skills: {len(job_skills)}")
        print(f"Skills: {job_skills[:10]}")
        print()

        # Check job skill embeddings
        job_skills_with_embeddings = 0
        job_skills_without = []
        for skill in job_skills[:10]:
            result = conn.execute(text("""
                SELECT COUNT(*) FROM skill_embeddings
                WHERE LOWER(normalized_text) = LOWER(:skill)
            """), {'skill': skill})
            count = result.scalar()
            if count > 0:
                job_skills_with_embeddings += 1
            else:
                job_skills_without.append(skill)

        print(f"Job skills with embeddings: {job_skills_with_embeddings}/10 checked")
        if job_skills_without:
            print(f"Job skills missing embeddings: {job_skills_without}")
    else:
        print("No matching job found")

    # Total embeddings in DB
    result = conn.execute(text("SELECT COUNT(*) FROM skill_embeddings"))
    total = result.scalar()
    print(f"\nTotal embeddings in database: {total}")
