#!/usr/bin/env python3
"""
Induce each silent failure and show what reaches the log.

Runs against whichever backend tree sits next to this script, so the SAME
script can be pointed at the old code and the new code for a direct contrast.

Production log level is simulated as WARNING: that is the whole point of the
bug being fixed. logger.debug records exist in neither deployment nor this
harness, which is exactly why the failures were invisible.

Usage:
    python /repo/scripts/induce_failures.py
"""

import asyncio
import logging
import os
import sys
import tempfile

_BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, _BACKEND)

from unittest.mock import MagicMock

BANNER = "=" * 78


class Capture(logging.Handler):
    """Collect records at or above the configured production level."""

    def __init__(self):
        super().__init__()
        self.records = []

    def emit(self, record):
        self.records.append(record)


def _install_capture(level=logging.WARNING):
    root = logging.getLogger()
    for h in list(root.handlers):
        root.removeHandler(h)
    cap = Capture()
    cap.setLevel(level)
    root.addHandler(cap)
    root.setLevel(level)
    return cap


def _report(cap, returned):
    print(f"\n  RETURNED: {returned!r}")
    if not cap.records:
        print("  LOG OUTPUT AT >=WARNING: (nothing - the failure is SILENT)")
    else:
        print(f"  LOG OUTPUT AT >=WARNING: {len(cap.records)} record(s)")
        for r in cap.records:
            print(f"    [{r.levelname}] {r.name}: {r.getMessage()[:400]}")
            if r.exc_info:
                print(f"      exc_info attached: {r.exc_info[0].__name__}")


# ---------------------------------------------------------------------------
# Failure 1: the vector query fails (simulating a dead database)
# ---------------------------------------------------------------------------
def induce_vector_query_failure():
    print(BANNER)
    print("FAILURE 1: pgvector query raises (database unreachable)")
    print(BANNER)

    from app.services.matching_service import MatchingService

    db = MagicMock()
    db.execute.side_effect = RuntimeError(
        "connection to server at \"postgres\" (172.18.0.2), port 5432 failed: "
        "Connection refused"
    )
    profile = MagicMock()
    profile.id = "6ea5bdc9-5c20-413d-8106-708c7cb5ecd9"

    service = MatchingService(db=db, user_profile=profile)
    cap = _install_capture()

    try:
        returned = service._pgvector_best_match([0.1] * 1536, str(profile.id))
    except Exception as e:
        returned = f"<raised {type(e).__name__}: {e}>"

    _report(cap, returned)

    print("\n  INTERPRETATION:")
    if returned is None:
        print("    None = 'unknown'. The caller falls back to another scoring")
        print("    leg instead of scoring this skill 0.0.")
    elif isinstance(returned, tuple) and returned[0] == 0.0:
        print("    0.0 similarity, indistinguishable from an honest 'no match'.")
        print("    The score silently drops and nothing is logged.")
    print()


# ---------------------------------------------------------------------------
# Failure 2: PCA model missing
# ---------------------------------------------------------------------------
def induce_pca_missing():
    print(BANNER)
    print("FAILURE 2: PCA model missing (embeddings would be 3072-dim)")
    print(BANNER)

    empty = tempfile.mkdtemp(prefix="no-pca-")
    os.environ["PCA_MODEL_DIR"] = empty

    # Re-import cleanly so the loader re-resolves PCA_MODEL_DIR.
    for mod in [m for m in list(sys.modules) if m.startswith("app.")]:
        del sys.modules[mod]

    from app.services.embedding_service import EmbeddingService

    cap = _install_capture()

    service = EmbeddingService(
        openai_client=MagicMock(),
        redis_client=MagicMock(),
        db_session=MagicMock(),
    )
    print(f"\n  (PCA_MODEL_DIR={empty}, service.pca={service.pca!r})")

    try:
        out = service._apply_pca([0.1] * 3072)
        returned = f"<list of {len(out)} floats>"
    except Exception as e:
        returned = f"<raised {type(e).__name__}: {e}>"

    _report(cap, returned)

    print("\n  INTERPRETATION:")
    if "raised" in str(returned):
        print("    Refuses to produce a vector. Nothing incomparable can reach")
        print("    the Vector(1536) column or the similarity search.")
    else:
        print("    Returns 3072 floats where 1536 are required. These vectors")
        print("    are in a DIFFERENT SPACE from everything already indexed;")
        print("    every similarity computed against them is meaningless.")
    print()

    del os.environ["PCA_MODEL_DIR"]


if __name__ == "__main__":
    print(f"\nbackend under test: {_BACKEND}")
    print("simulated production log level: WARNING\n")
    induce_vector_query_failure()
    induce_pca_missing()
