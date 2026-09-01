#!/usr/bin/env python3
"""
Prove the N+1 -> LATERAL rewrite at the SQL layer.

Runs the OLD implementation (one query per skill) and the NEW implementation
(one LATERAL query for all skills) against the SAME database and the SAME
inputs, then:

  * asserts the two produce IDENTICAL results (skill -> matched skill, score)
  * reports wall-clock for each

Identical results are the point. A speedup that changes rankings is a bug, not
an optimisation.

Usage (inside the backend container):
    python /app/scripts/bench_vector_match.py [--repeat N] [--skills N]
"""

import argparse
import os
import statistics
import sys
import time

from sqlalchemy import create_engine, text

EF_SEARCH = 100


def old_per_skill(conn, embeddings, user_id, set_ef):
    """The original implementation: one round trip per skill."""
    results = {}
    if set_ef:
        conn.execute(text(f"SET LOCAL hnsw.ef_search = {EF_SEARCH}"))
    for key, emb in embeddings.items():
        row = conn.execute(
            text("""
                SELECT skill_text,
                       1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
                FROM skill_embeddings
                WHERE source_type = 'user' AND source_id = :user_id
                ORDER BY embedding <=> CAST(:embedding AS vector)
                LIMIT 1
            """),
            {"embedding": emb, "user_id": user_id},
        ).fetchone()
        results[key] = (round(float(row.similarity), 12), row.skill_text) if row else (0.0, None)
    return results


def new_lateral(conn, embeddings, user_id, set_ef):
    """The rewrite: a single LATERAL join for the whole batch."""
    keys = list(embeddings)
    rows, params = [], {"user_id": user_id}
    for i, k in enumerate(keys):
        params[f"k{i}"] = k
        params[f"e{i}"] = embeddings[k]
        rows.append(f"(CAST(:k{i} AS text), CAST(:e{i} AS vector))")

    sql = f"""
        WITH q(skill_key, emb) AS (VALUES {", ".join(rows)})
        SELECT q.skill_key AS skill_key,
               m.skill_text AS skill_text,
               1 - (m.embedding <=> q.emb) AS similarity
        FROM q
        LEFT JOIN LATERAL (
            SELECT se.skill_text, se.embedding
            FROM skill_embeddings se
            WHERE se.source_type = 'user' AND se.source_id = :user_id
            ORDER BY se.embedding <=> q.emb
            LIMIT 1
        ) m ON TRUE
    """
    if set_ef:
        conn.execute(text(f"SET LOCAL hnsw.ef_search = {EF_SEARCH}"))
    out = {k: (0.0, None) for k in keys}
    for row in conn.execute(text(sql), params).fetchall():
        if row.skill_text is not None and row.similarity is not None:
            out[row.skill_key] = (round(float(row.similarity), 12), row.skill_text)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repeat", type=int, default=10)
    ap.add_argument("--skills", type=int, default=12)
    ap.add_argument("--no-ef", action="store_true", help="do not set hnsw.ef_search")
    args = ap.parse_args()

    url = os.environ["DATABASE_URL"]
    engine = create_engine(url)

    with engine.connect() as conn:
        user_id = conn.execute(text("""
            SELECT source_id FROM skill_embeddings
            WHERE source_type = 'user'
            GROUP BY source_id ORDER BY count(*) DESC LIMIT 1
        """)).scalar()

        # Use 'global' (job-side) embeddings as the query vectors, which is what
        # the matcher does: job required-skill vectors probed against the user's.
        probe_rows = conn.execute(text("""
            SELECT skill_text, embedding::text AS emb
            FROM skill_embeddings
            WHERE source_type <> 'user'
            ORDER BY skill_text
            LIMIT :n
        """), {"n": args.skills}).fetchall()

        embeddings = {r.skill_text: r.emb for r in probe_rows}
        print(f"user_id={user_id}  probe_skills={len(embeddings)}  "
              f"ef_search={'default' if args.no_ef else EF_SEARCH}  repeat={args.repeat}")

        n_user = conn.execute(text(
            "SELECT count(*) FROM skill_embeddings WHERE source_type='user' AND source_id=:u"
        ), {"u": user_id}).scalar()
        print(f"user skill vectors searched: {n_user}\n")

        set_ef = not args.no_ef

        # Warm both paths (connection, plan cache, page cache).
        conn.rollback()
        with conn.begin():
            old_per_skill(conn, embeddings, user_id, set_ef)
            new_lateral(conn, embeddings, user_id, set_ef)

        old_times, new_times = [], []
        old_res = new_res = None
        for _ in range(args.repeat):
            conn.rollback()
            with conn.begin():
                t0 = time.perf_counter()
                old_res = old_per_skill(conn, embeddings, user_id, set_ef)
                old_times.append((time.perf_counter() - t0) * 1000)

                t0 = time.perf_counter()
                new_res = new_lateral(conn, embeddings, user_id, set_ef)
                new_times.append((time.perf_counter() - t0) * 1000)

        assert len(old_times) == args.repeat, (
            f"expected {args.repeat} samples, collected {len(old_times)}"
        )

        def stat(xs):
            return (f"median {statistics.median(xs):7.2f} ms   "
                    f"min {min(xs):7.2f}   max {max(xs):7.2f}")

        print(f"OLD (N+1, {len(embeddings)} queries): {stat(old_times)}")
        print(f"NEW (1 LATERAL query)            : {stat(new_times)}")
        speedup = statistics.median(old_times) / statistics.median(new_times)
        print(f"speedup: {speedup:.2f}x\n")

        # ---- the part that matters more than the speed ----
        if old_res == new_res:
            print(f"RESULTS IDENTICAL across all {len(old_res)} skills")
        else:
            print("RESULTS DIFFER -- this is a BUG, not a speedup:")
            for k in sorted(set(old_res) | set(new_res)):
                if old_res.get(k) != new_res.get(k):
                    print(f"  {k!r}:\n    old={old_res.get(k)}\n    new={new_res.get(k)}")
            sys.exit(1)

        # Show the ranked output so the diff is inspectable by eye too.
        print("\ntop matches (new impl), ranked:")
        for k, (sim, sk) in sorted(new_res.items(), key=lambda kv: -kv[1][0])[:10]:
            print(f"  {sim:.6f}  {k!r} -> {sk!r}")

        # Did the planner actually use the HNSW index?
        print("\nplan for the LATERAL query:")
        conn.rollback()
        with conn.begin():
            if set_ef:
                conn.execute(text(f"SET LOCAL hnsw.ef_search = {EF_SEARCH}"))
            keys = list(embeddings)
            rows, params = [], {"user_id": user_id}
            for i, k in enumerate(keys):
                params[f"k{i}"] = k
                params[f"e{i}"] = embeddings[k]
                rows.append(f"(CAST(:k{i} AS text), CAST(:e{i} AS vector))")
            sql = f"""
                WITH q(skill_key, emb) AS (VALUES {", ".join(rows)})
                SELECT q.skill_key, m.skill_text, 1 - (m.embedding <=> q.emb)
                FROM q LEFT JOIN LATERAL (
                    SELECT se.skill_text, se.embedding FROM skill_embeddings se
                    WHERE se.source_type='user' AND se.source_id=:user_id
                    ORDER BY se.embedding <=> q.emb LIMIT 1
                ) m ON TRUE
            """
            for line in conn.execute(text("EXPLAIN ANALYZE " + sql), params).fetchall():
                print("   ", line[0])


if __name__ == "__main__":
    main()
