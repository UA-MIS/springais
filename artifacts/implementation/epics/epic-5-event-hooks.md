# Epic 5: Event/Action Reward Hook System

> **Phase**: 2
> **Estimated Stories**: 5
> **Dependencies**: Epic 1 (Server Foundation), Epic 4 (Achievement Engine) -- at minimum Stories 4.3, 2.1
> **PRD References**: FR-020, FR-021
> **Architecture References**: Sections 4.4, 6.1-6.4
> **Security Review Fixes**: FINDING-ARCH-001, FINDING-SEC-005

---

## Story 5.1: Reward Hook Service -- Central Dispatcher

**Size**: M

**Description**: Implement `reward_hook_service.py` as the central dispatcher that existing endpoints call after a rewarded action. It orchestrates XP/Coin awards, achievement evaluation, and quest progress evaluation in a single call. Must incorporate FINDING-ARCH-001 (structured error logging + pending_rewards consideration).

**Acceptance Criteria**:
1. `RewardHookService` class with `__init__` accepting `progression_service`, `achievement_service`, and `quest_service`.
2. `process_action(db, user_id, event_type, event_key, metadata)`:
   - Calls `ensure_progression_exists()` first (FINDING-INT-002 mitigation).
   - Looks up XP/Coin amounts from `REWARD_CONFIG`.
   - If XP > 0: calls `progression_service.award_xp()`.
   - If Coins > 0: calls `progression_service.award_coins()`.
   - Calls `achievement_service.evaluate_achievements()`.
   - Calls `quest_service.evaluate_quest_progress()` (if quest_service is available; graceful if Epic 7 not yet implemented).
   - Aggregates results into `RewardResult`.
   - FINDING-ARCH-001 fix: catches ALL exceptions internally with structured logging (user_id, event_type, event_key, exception details at ERROR level). Never propagates exceptions to caller.
3. `RewardResult` dataclass contains: xp_awarded, coins_awarded, level_up (bool), new_level, achievements_unlocked (list), quest_updates (list).
4. Module-level singleton: `reward_hook_service = RewardHookService(...)`.
5. Tests cover:
   - Successful action processes all reward types.
   - Idempotent action (same event_key) returns already_awarded without duplicate rewards.
   - DB exception is caught, logged, and returns None.
   - Missing REWARD_CONFIG entry logs warning and awards nothing.
   - Quest service unavailable does not break processing.

**Dev Notes**:
- File: `backend/app/services/reward_hook_service.py` (new)
- FINDING-ARCH-001 fix: Use Python `logging` with structured fields: `logger.exception("Gamification reward failed", extra={"user_id": str(user_id), "event_type": event_type, "event_key": event_key})`.
- For pending_rewards retry: the architecture specifies this can be deferred to Phase 5 (Epic 9). For now, log errors at ERROR level so they can be manually investigated.
- Architecture Section 4.4 has the full service interface and REWARD_CONFIG dict.
- Section 6.2 has the fire-and-forget pattern code.

**D-ID References**: FR-020.5, D-MM-10, FINDING-ARCH-001

**Dependencies**: Epic 1 Story 1.5 (progression_service), Epic 4 Story 4.3 (achievement_service)

---

## Story 5.2: Integration Hook -- Module Completion (Skills Router)

**Size**: S

**Description**: Wire the existing skills module completion endpoint to emit a `module_completed` gamification event via the reward hook service.

**Acceptance Criteria**:
1. After a successful module completion in `backend/app/routes/skills.py`, `reward_hook_service.process_action()` is called with `event_type="module_completed"`, `event_key=f"module:{module_id}"`.
2. The gamification call is wrapped in try/except per the fire-and-forget pattern. Primary action always succeeds.
3. The API response optionally includes gamification rewards if the hook succeeds.
4. FINDING-SEC-005: The event_key `module:{module_id}` ensures the same module cannot award XP twice.
5. Tests cover: module completion awards 50 XP, duplicate completion is idempotent, gamification failure does not break module completion.

**Dev Notes**:
- File: `backend/app/routes/skills.py` (modify)
- Identify the exact endpoint for module completion. Per codebase analysis, it is in skills routes. The architecture references `POST /api/skills/progress/module/{id}/complete`.
- The fire-and-forget pattern from Architecture Section 6.2:
  ```python
  try:
      reward_result = reward_hook_service.process_action(db, user_id, "module_completed", f"module:{module_id}")
  except Exception:
      logger.exception("Gamification failed for module %s", module_id)
      reward_result = None
  ```

**D-ID References**: FR-020.1

**Dependencies**: Story 5.1

---

## Story 5.3: Integration Hook -- Roadmap Events

**Size**: S

**Description**: Wire the roadmap router to emit `milestone_passed` and `roadmap_generated` gamification events.

**Acceptance Criteria**:
1. After a milestone is marked complete in `backend/app/routes/roadmap.py`, `reward_hook_service.process_action()` is called with `event_type="milestone_passed"`, `event_key=f"milestone:{milestone_id}"`.
2. After a roadmap is generated, `reward_hook_service.process_action()` is called with `event_type="roadmap_generated"`, `event_key=f"roadmap:{roadmap_id}"`.
3. Both calls are fire-and-forget wrapped.
4. FINDING-SEC-005: `roadmap_generated` uses unique `roadmap_id` as event_key, so each roadmap awards XP only once. Note: a user could generate many roadmaps. Rate limiting on roadmap generation should be considered (documented as advisory, not blocking for MVP).
5. Tests cover: milestone completion awards 150 XP, roadmap generation awards 50 XP + 25 Coins, duplicate events are idempotent.

**Dev Notes**:
- File: `backend/app/routes/roadmap.py` (modify)
- Milestone endpoint: `POST /api/roadmap/progress/milestone/{id}` (mark complete).
- Roadmap generation: `POST /api/roadmap/generate`.
- Architecture Section 6.4 specifies exact integration points.

**D-ID References**: FR-020.1

**Dependencies**: Story 5.1

---

## Story 5.4: Integration Hooks -- Matches, Resume, Profile, Auth

**Size**: M

**Description**: Wire the remaining integration points: first match view, resume upload, profile completion, and registration/login hooks.

**Acceptance Criteria**:
1. `backend/app/routes/matches.py`: After first match query, emits `first_match_view` with `event_key=f"first_match:{user_id}"` (one-time per user).
2. `backend/app/routes/skills.py` (resume upload): After resume upload, emits `resume_uploaded` with `event_key=f"resume:{user_id}"` (one-time per user).
3. `backend/app/routes/auth.py` (profile update or a suitable endpoint): After profile completion, emits `profile_completed` with `event_key=f"profile:{user_id}"` (one-time per user).
4. `backend/app/routes/auth.py` (register): Creates `user_progression` row via `ensure_progression_exists()` on registration.
5. `backend/app/routes/auth.py` (login): Calls `progression_service.record_login()` on login (or this is deferred to the frontend calling `POST /api/progression/login`).
6. All hooks are fire-and-forget wrapped.
7. Tests cover: each integration point awards correct XP/Coins, one-time events are idempotent, registration creates progression row.

**Dev Notes**:
- File: `backend/app/routes/matches.py` (modify)
- File: `backend/app/routes/skills.py` (modify -- resume upload hook)
- File: `backend/app/routes/auth.py` (modify -- register creates progression, login records login)
- For profile completion: identify which endpoint marks profile as complete. Per codebase analysis, `PUT /auth/me` or the profile page may trigger this.
- Architecture Section 6.4 lists all integration points.

**D-ID References**: FR-020.1, FR-001.2

**Dependencies**: Story 5.1

---

## Story 5.5: Page Visit Tracking and Explorer Achievement

**Size**: S

**Description**: Implement server-side page visit tracking that replaces the localStorage `trackPageVisit` function. The "explorer" achievement unlocks when the user has visited all required pages.

**Acceptance Criteria**:
1. `POST /api/progression/visit` records a page visit in `user_page_visits` table (already created in Epic 1 Story 1.7).
2. On each visit, the service checks if all required pages have been visited: `/matches`, `/profile`, `/saved`, `/roadmap`, `/success-patterns`.
3. If all pages visited, the "explorer" achievement is evaluated and unlocked via `achievement_service`.
4. The frontend calls `POST /api/progression/visit` on each page mount, replacing the localStorage `trackPageVisit` call.
5. Visit count increments on revisits (UPSERT pattern).
6. Tests cover: recording visits, explorer achievement unlocks when all pages visited, partial visits do not unlock, revisits increment count.

**Dev Notes**:
- File: `backend/app/services/progression_service.py` or a dedicated visit handler (extend)
- File: `frontend/src/context/AdventureModeContext.tsx` (modify -- replace trackPageVisit with API call)
- The `user_page_visits` model and `POST /api/progression/visit` endpoint were created in Epic 1 Story 1.7.
- The explorer achievement is a manual trigger: after recording the visit, check if all required pages exist for the user, and if so, call `achievement_service` to evaluate.
- FINDING-AUTH-002 (already incorporated in Story 1.7): page must be validated against allowlist.
- The frontend should call the visit endpoint on page mount using a `useEffect` in each page component or a centralized hook.

**D-ID References**: FR-021

**Dependencies**: Epic 1 Story 1.7, Epic 4 Story 4.3

---

## Story Dependency Graph (Epic 5)

```
Epic 1 + Epic 4 Story 4.3
 |
 v
5.1 Reward Hook Service (FINDING-ARCH-001)
 |         \          \          \
 v          v          v          v
5.2 Skills  5.3 Roadmap 5.4 Auth/Match/Resume  5.5 Page Visit
```
