# ADR-MM-001: Adopt Alembic for Gamification Schema Migrations

**Status**: Proposed
**Date**: 2026-02-11
**Decision**: D-MM-11

## Context

The SpringAIS backend currently uses `Base.metadata.create_all()` on startup to create database tables. This approach has worked for the initial set of tables but is insufficient for the gamification overhaul because:

1. **11 new tables** are being added, with complex constraints, indexes, and seed data.
2. `create_all()` does not handle schema modifications to existing tables.
3. `create_all()` does not support seed data insertion.
4. There is no rollback mechanism if a deployment fails.
5. Alembic is already listed in `backend/requirements.txt` but has never been initialized.

## Decision

Adopt Alembic for managing all new gamification tables. Existing tables continue to be managed by `create_all()` (no retroactive migration of existing schema).

### Implementation

1. Initialize Alembic in `backend/` with `alembic init alembic`.
2. Configure `alembic/env.py` to use the project's `DATABASE_URL` and `Base.metadata`.
3. Create a single initial migration that:
   - Creates all 11 gamification tables in dependency order.
   - Seeds achievement_catalog (24 rows), cosmetic_catalog (30+ rows), side_quest_catalog (5 rows).
4. Add `alembic upgrade head` to the deployment process (before starting uvicorn).
5. Keep `Base.metadata.create_all()` in `main.py` for existing tables -- it is idempotent and harmless.

### Coexistence Strategy

- Alembic's `target_metadata` includes ALL models (existing + new).
- The `--autogenerate` flag will detect existing tables but we mark them as already created using `op.create_table_if_not_exists` or by excluding them in `env.py` include_object filter.
- Future schema changes (to any table) should use Alembic migrations.

## Consequences

- **Positive**: Versioned, reversible migrations. Seed data is part of the migration. Schema changes are auditable.
- **Positive**: Future developers can run `alembic upgrade head` to get the full schema.
- **Negative**: Two schema management systems coexist temporarily. This is acceptable for the transition period.
- **Negative**: Slightly more complex deployment (run migration before start). Mitigated by adding to entrypoint script.

## Alternatives Considered

1. **Continue with `create_all()` only**: Rejected. Cannot handle seed data, constraints added after initial creation, or rollbacks.
2. **Raw SQL migration scripts**: Rejected. Lacks version tracking, rollback support, and autogenerate capability.
3. **Full Alembic migration of existing tables**: Rejected. Unnecessary risk for tables that are stable and working. Can be done later as a separate project.
