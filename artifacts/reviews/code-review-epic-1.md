# Code Review: Epic 1 -- Server-Side Progression Foundation

**Reviewer:** Adversarial Code Reviewer
**Files:** `backend/app/models/progression.py`, `backend/app/models/page_visit.py`, `backend/app/models/__init__.py`, `backend/app/routes/auth.py`, `backend/tests/test_progression_models.py`
**Architecture Refs:** Section 3.1, Section 4.1, ADR-MM-001
**PRD Refs:** FR-001, FR-002, FR-003

---

## Findings

### 1. BLOCKING -- auth.py login does not call record_login (FR-020, Architecture Section 6.4)

**File:** `backend/app/routes/auth.py:70-89`
**Issue:** The `POST /auth/login` endpoint updates `last_login_at` on the UserProfile but does NOT call `progression_service.record_login()` or `reward_hook_service.process_action()`. Per the architecture (Section 6.4), the login endpoint should trigger the daily login reward flow. Currently the frontend calls `POST /api/progression/login` separately, but the backend auth login is the canonical entry point. If a client uses the auth login without also calling the progression login, the daily streak will not update.
**Suggested Fix:** Add a fire-and-forget call to `progression_service.record_login(db, user.id)` after the credential check succeeds in the auth login handler, or document that the frontend MUST call the progression login endpoint after auth login.

### 2. ADVISORY -- auth.py uses deprecated `datetime.utcnow()`

**File:** `backend/app/routes/auth.py:76`
**Issue:** `datetime.utcnow()` is deprecated in Python 3.12+. The rest of the codebase correctly uses `datetime.now(timezone.utc)`.
**Suggested Fix:** Replace `datetime.utcnow()` with `datetime.now(timezone.utc)`.

### 3. ADVISORY -- Double commit in registration flow

**File:** `backend/app/routes/auth.py:46-55`
**Issue:** The registration handler calls `db.commit()` at line 46 (to persist the user), then calls `ensure_progression_exists()` and `db.commit()` again at line 53. If the second commit fails, the user exists without a progression row. This is safe because the `ensure_progression_exists()` call is wrapped in try/except, but it means a failed progression creation is silently logged and the user is returned without progression.
**Suggested Fix:** Combine into a single transaction by removing the first `db.commit()` and only committing after both user and progression row are created, or add explicit error handling/retry.

### 4. ADVISORY -- Model check constraints not tested for all edge values

**File:** `backend/tests/test_progression_models.py`
**Issue:** Tests cover the happy paths for model constraints (negative coin_balance, negative xp_total, zero level), but do not test the valid boundary values (e.g., coin_balance=0 should succeed, level=1 should succeed). While these are implicitly tested elsewhere, explicit boundary tests would improve confidence.
**Suggested Fix:** Add boundary-value tests for coin_balance=0 and level=1.

### 5. ADVISORY -- UserProgression model sets `server_default` for timestamps

**File:** `backend/app/models/progression.py`
**Issue:** The `created_at` and `updated_at` fields use `server_default=func.now()`. This is correct for PostgreSQL but the test suite creates tables via `Base.metadata.create_all()` which correctly translates these. No issue in practice, but worth noting that the `updated_at` field uses `onupdate=func.now()` which only fires on SQLAlchemy-tracked updates, not raw SQL.
**Suggested Fix:** Document that raw SQL updates to `user_progression` should manually set `updated_at`.

---

## Summary

| Severity | Count |
|----------|-------|
| BLOCKING | 1 |
| ADVISORY | 4 |

The database models are well-implemented with proper constraints, indices, and the partial unique index on `event_key`. The primary concern is the auth login endpoint not triggering daily login rewards.
