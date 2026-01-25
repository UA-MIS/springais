"""Test the skill gap fix."""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import os

from app.models.user_profile import UserProfile
from app.models.job_posting import JobPosting
from app.services.matching_service import MatchingService
from app.config.matching_config import MatchMode

DATABASE_URL = 'postgresql+psycopg://postgres:postgres@localhost:5432/springais'

def main():
    engine = create_engine(DATABASE_URL)

    with Session(engine) as session:
        # Get Tami
        tami = session.query(UserProfile).filter(UserProfile.email == 'tami@ey.com').first()
        if not tami:
            print("Tami not found")
            return

        print(f"Testing with Tami ({len(tami.skills or [])} skills)")

        # Find a job with Quantitative Research skill (to test the fix)
        result = session.execute(text("""
            SELECT id FROM job_postings
            WHERE llm_required_skills::text ILIKE '%quantitative research%'
            LIMIT 1
        """))
        row = result.fetchone()

        if not row:
            print("No suitable job found")
            return

        job = session.query(JobPosting).filter(JobPosting.id == row[0]).first()
        print(f"\nJob: {job.title}")

        # Get job skills
        job_skills = []
        if job.llm_required_skills:
            for s in job.llm_required_skills:
                if isinstance(s, dict):
                    job_skills.append(s.get('name', ''))
                else:
                    job_skills.append(s)
        print(f"Required skills: {len(job_skills)}")

        # Run matching
        service = MatchingService(
            db=session,
            user_profile=tami,
            mode=MatchMode.BEST_FIT
        )

        try:
            result = service.get_detailed_match(
                employee_id=tami.id,
                job_id=str(job.id)
            )

            print(f"\n=== RESULTS ===")
            print(f"Overall Score: {result.scores.overall * 100:.1f}%")
            print(f"Skill Score: {result.scores.skill_match * 100:.1f}%")

            print(f"\nMatched Skills ({len(result.gap_analysis.overlapping_skills)}):")
            for skill in result.gap_analysis.overlapping_skills:
                print(f"  [MATCH] {skill}")

            print(f"\nTransferable ({len(result.gap_analysis.transferable_skills)}):")
            for skill in result.gap_analysis.transferable_skills[:10]:
                print(f"  ~ {skill}")

            print(f"\nSkill Gaps ({len(result.gap_analysis.missing_skills)}):")
            for skill in result.gap_analysis.missing_skills[:10]:
                print(f"  [GAP] {skill}")

            # Check if Quantitative Research is now matched
            quant_matched = any('quantitative research' in s.lower() for s in result.gap_analysis.overlapping_skills)
            quant_gap = any('quantitative research' in s.lower() for s in result.gap_analysis.missing_skills)
            print(f"\n'Quantitative Research' status: {'MATCHED' if quant_matched else 'GAP' if quant_gap else 'TRANSFERABLE'}")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    main()
