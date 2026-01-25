"""Debug why embeddings aren't producing higher match scores."""
import asyncio
import sys
sys.path.insert(0, '.')

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/springais')

async def debug():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Get Tami's profile
        result = await session.execute(text("""
            SELECT id, skills FROM user_profiles WHERE email = 'tami@ey.com'
        """))
        user = result.fetchone()

        if not user:
            print("Tami not found!")
            return

        user_skills = user[1] or []
        print(f"=== TAMI'S SKILLS: {len(user_skills)} total ===\n")

        # Check embeddings for first 10 skills
        print("Checking embeddings for Tami's skills:")
        for skill in user_skills[:10]:
            result = await session.execute(text("""
                SELECT id FROM skill_embeddings
                WHERE LOWER(normalized_text) = LOWER(:skill)
                LIMIT 1
            """), {'skill': skill})
            exists = result.fetchone()
            status = "YES" if exists else "NO"
            print(f"  {skill}: {status}")

        print()

        # Get a job posting to check
        result = await session.execute(text("""
            SELECT id, title, llm_required_skills, required_skills
            FROM job_postings
            WHERE is_active = true
            LIMIT 1
        """))
        job = result.fetchone()

        if job:
            print(f"=== JOB: {job[1]} ===\n")

            # Get job skills
            job_skills = []
            if job[2]:  # llm_required_skills (JSON)
                for s in job[2]:
                    if isinstance(s, dict):
                        job_skills.append(s.get('name', ''))
                    else:
                        job_skills.append(s)
            elif job[3]:
                job_skills = job[3]

            print(f"Required skills: {len(job_skills)}")
            print("Checking embeddings for job skills:")
            for skill in job_skills[:10]:
                result = await session.execute(text("""
                    SELECT id FROM skill_embeddings
                    WHERE LOWER(normalized_text) = LOWER(:skill)
                    LIMIT 1
                """), {'skill': skill})
                exists = result.fetchone()
                status = "YES" if exists else "NO"
                print(f"  {skill}: {status}")

        print()

        # Total count
        result = await session.execute(text("SELECT COUNT(*) FROM skill_embeddings"))
        total = result.scalar()
        print(f"Total embeddings in database: {total}")

asyncio.run(debug())
