#!/usr/bin/env python3
"""
End-to-end match benchmark, at the service layer.

Calls MatchingService.find_matches_for_employee_with_total exactly as the
/api/matches route does, against the real database, and prints:

  * wall clock per run (warm)
  * the full ranked output, as a stable text block

Run this under the OLD code and the NEW code against the SAME database and diff
the ranked-output block. It must be identical: the N+1 -> LATERAL rewrite is a
transport change, not a scoring change.

Usage (inside a backend container):
    python /repo/scripts/bench_match_e2e.py --repeat 5 --out /tmp/ranked.txt
"""

import argparse
import os
import statistics
import sys
import time

# Load the backend that sits NEXT TO this script, not whatever happens to be
# mounted at /app. That is what makes an A/B run meaningful: mount the old tree
# at /repo and you benchmark the old code, mount the new tree and you benchmark
# the new code, with everything else held constant.
_BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, _BACKEND)
print(f"[bench] importing app from {_BACKEND}")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.services.matching_service import MatchingService
from app.models.user_profile import UserProfile
from app.models.employee import Employee


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repeat", type=int, default=5)
    ap.add_argument("--out", default=None, help="write ranked output here")
    ap.add_argument("--top-k", type=int, default=25)
    args = ap.parse_args()

    engine = create_engine(os.environ["DATABASE_URL"])
    Session = sessionmaker(bind=engine)
    db = Session()

    # The user who actually has skill embeddings.
    user_id = db.execute(text("""
        SELECT source_id FROM skill_embeddings
        WHERE source_type = 'user'
        GROUP BY source_id ORDER BY count(*) DESC LIMIT 1
    """)).scalar()

    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if user is None:
        print(f"no UserProfile row for {user_id}", file=sys.stderr)
        sys.exit(2)

    employee = db.query(Employee).first()
    if employee is None:
        print("no employees seeded", file=sys.stderr)
        sys.exit(2)

    n_jobs = db.execute(text("SELECT count(*) FROM job_postings")).scalar()
    n_vecs = db.execute(
        text("SELECT count(*) FROM skill_embeddings "
             "WHERE source_type='user' AND source_id=:u"),
        {"u": user_id},
    ).scalar()

    print(f"user_id={user_id}")
    print(f"employee_id={employee.id}")
    print(f"jobs={n_jobs}")
    print(f"user skill vectors={n_vecs}")
    print()

    def run_once():
        # A fresh service per call, matching the route (which constructs one
        # per request) so no in-process cache hides the query cost.
        service = MatchingService(db=db, user_profile=user, top_k=args.top_k,
                                  min_overall_score=0.0)
        return service.find_matches_for_employee_with_total(employee.id, None, None)

    # Warm: fills the module-level embedding cache and the PG page cache, so we
    # measure the steady state the demo actually experiences, not cold start.
    matches, total = run_once()

    times = []
    for _ in range(args.repeat):
        t0 = time.perf_counter()
        matches, total = run_once()
        times.append((time.perf_counter() - t0) * 1000)

    print(f"warm match: median {statistics.median(times):8.2f} ms   "
          f"min {min(times):8.2f}   max {max(times):8.2f}   n={len(times)}")
    print(f"matches returned: {len(matches)} (total_count={total})\n")

    # Stable, diffable ranked output.
    lines = []
    for i, m in enumerate(matches):
        s = m.scores
        gap = m.gap_analysis
        lines.append(
            f"{i:03d} job={m.job_id} overall={s.overall:.9f} "
            f"skill={s.skill_match:.9f} exp={s.experience_match:.9f} "
            f"role_fit={getattr(s, 'role_fit', getattr(s, 'growth_potential', 0.0)):.9f}"
        )
        lines.append(f"     overlapping={sorted(gap.overlapping_skills)}")
        lines.append(f"     missing={sorted(gap.missing_skills)}")
        lines.append(f"     transferable={sorted(gap.transferable_skills)}")

    block = "\n".join(lines)
    print("---- RANKED OUTPUT ----")
    print(block)

    if args.out:
        with open(args.out, "w") as f:
            f.write(block + "\n")
        print(f"\nranked output written to {args.out}")


if __name__ == "__main__":
    main()
