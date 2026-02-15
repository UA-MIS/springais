# Code Review: Epic 5 -- Cosmetic Store

**Reviewer:** Adversarial Code Reviewer
**Files:** `backend/app/models/cosmetic.py`, `backend/app/services/store_service.py`, `backend/app/routes/store.py`, `backend/app/schemas/cosmetic.py`, `backend/tests/test_store_service.py`, `backend/app/data/cosmetic_seed.py`
**Architecture Refs:** Section 4.5, FINDING-SEC-003
**PRD Refs:** FR-014, FR-015, FR-016

---

## Findings

### 1. BLOCKING -- `db.rollback()` on IntegrityError in purchase flow loses spent coins

**File:** `backend/app/services/store_service.py:222-228`
**Issue:** During purchase, after coins have been successfully deducted (line 206-214), if the inventory INSERT fails with IntegrityError (duplicate purchase race condition), `db.rollback()` at line 227 rolls back the ENTIRE transaction. This means the coin deduction is also rolled back, which is safe in isolation. HOWEVER, the route handler at `store.py:88` calls `db.commit()` after `store_service.purchase()` returns. Since the rollback already happened inside the service, this commit will commit whatever partial state remains in the session, which may be inconsistent.
**Suggested Fix:** Use a savepoint:
```python
savepoint = db.begin_nested()
try:
    db.add(inventory_item)
    db.flush()
except IntegrityError:
    savepoint.rollback()
    return PurchaseResult(error="already_owned")
```
Also refund the coins explicitly by calling `award_coins()` before returning, or restructure so the coin spend and inventory insert are within the same savepoint.

### 2. BLOCKING -- Store equip route commits before checking for error

**File:** `backend/app/routes/store.py:138-145`
**Issue:** The equip endpoint calls `store_service.equip()` at line 138, then calls `db.commit()` at line 139, and THEN checks if the result is an error string at line 141. If `equip()` returns an error string like `"item_not_owned"`, the commit at line 139 has already committed whatever partial state the session had. While `equip()` doesn't mutate the DB on error paths, the commit is premature.
**Suggested Fix:** Move `db.commit()` after the error check:
```python
result = store_service.equip(db, current_user.id, cosmetic_id, body.slot)
if isinstance(result, str):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result)
db.commit()
return EquipResponse(...)
```

### 3. ADVISORY -- InventoryResponse schema missing "count" field

**File:** `backend/app/schemas/cosmetic.py:60-61`
**Issue:** The architecture document (Section 4.5) specifies that `GET /store/inventory` should return `{items: [...], count: N}`. The schema only has `items` without a `count` field. The frontend `storeService.ts` InventoryResponse type also lacks `count`.
**Suggested Fix:** Add `count: int` to InventoryResponse schema and populate it in the route handler.

### 4. ADVISORY -- Catalog pagination not tested

**File:** `backend/tests/test_store_service.py`
**Issue:** The catalog tests verify filtering and per-user flags, but do not test pagination (limit/offset parameters). The route accepts these parameters and passes them to `store_service.get_catalog()`.
**Suggested Fix:** Add tests for `get_catalog(db, user_id, limit=2, offset=1)` to verify pagination behavior.

### 5. ADVISORY -- Cosmetic seed data has no level_required > 1 validation in tests

**File:** `backend/tests/test_store_service.py:355-406`
**Issue:** The seed data validation tests check pricing ranges, categories, rarities, and quest exclusivity, but do not verify that `level_required` values in the seed data are reasonable (e.g., between 1 and 10).
**Suggested Fix:** Add a test that asserts all seed items have `1 <= level_required <= 10`.

### 6. ADVISORY -- `get_catalog()` performs N+1 query for user inventory

**File:** `backend/app/services/store_service.py:118-123`
**Issue:** `get_catalog()` runs a separate query to fetch all owned cosmetic IDs for the user. This is a single query (not N+1), which is correct. However, combining this with the catalog query via a LEFT JOIN would reduce the round trips from 3 (catalog + count + inventory) to 2 (joined + count).
**Suggested Fix:** Minor optimization; acceptable as-is for the current scale.

---

## Summary

| Severity | Count |
|----------|-------|
| BLOCKING | 2 |
| ADVISORY | 4 |

The FINDING-SEC-003 fix (early lock acquisition in purchase flow) is correctly implemented. The atomic purchase validation ordering is correct (lock -> load -> validate -> spend -> insert). The critical issues are the `db.rollback()` that destroys the transaction and the premature commit in the equip route.
