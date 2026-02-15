# ADR-MM-004: SELECT FOR UPDATE for Coin Balance Integrity

**Status**: Proposed
**Date**: 2026-02-11
**Decision**: D-MM-3

## Context

Coin balance mutations (award, spend) must be atomic to prevent:
1. **Race conditions**: Two concurrent requests could both read balance=100, both approve a 75-coin purchase, resulting in balance=-50.
2. **Negative balances**: The business rule requires `coin_balance >= 0` at all times.
3. **Ledger inconsistency**: The `balance_after` in `coin_transactions` must match the actual `coin_balance`.

## Decision

Use `SELECT FOR UPDATE` row-level locking on `user_progression` for all Coin balance mutations.

### Implementation

```python
def spend_coins(self, db: Session, user_id: UUID, amount: int, ...):
    # Acquire row lock
    progression = db.query(UserProgression).filter(
        UserProgression.user_id == user_id
    ).with_for_update().one()

    if progression.coin_balance < amount:
        return SpendCoinsResult(success=False, reason="insufficient_coins")

    progression.coin_balance -= amount

    txn = CoinTransaction(
        user_id=user_id,
        amount=-amount,
        balance_after=progression.coin_balance,
        transaction_type="spent",
        source=source,
        reference_id=reference_id,
    )
    db.add(txn)
    # Lock released on commit
```

### Defense in Depth

Three layers of protection:
1. **Application layer**: `SELECT FOR UPDATE` prevents concurrent reads.
2. **Database constraint**: `CHECK (coin_balance >= 0)` on `user_progression` table catches any bypass.
3. **Transaction ledger**: `CHECK (balance_after >= 0)` on `coin_transactions` table.

### Performance Implications

- Row-level lock scope: Only locks the single user's progression row. Other users are unaffected.
- Lock duration: Held for the duration of the DB transaction (typically < 50ms).
- Contention: Very low. A single user is unlikely to send concurrent coin-spending requests.

## Consequences

- **Positive**: Guarantees balance never goes negative, even under concurrent requests.
- **Positive**: Ledger `balance_after` is always consistent with actual balance.
- **Positive**: Simple implementation using SQLAlchemy's `with_for_update()`.
- **Negative**: Serializes concurrent mutations for the same user. Acceptable because coin mutations are infrequent per-user.

## Alternatives Considered

1. **Optimistic locking (version column)**: Rejected. Requires retry logic on conflict. `SELECT FOR UPDATE` is simpler for this use case.
2. **Database-only constraint (no app lock)**: Rejected. The CHECK constraint would reject the transaction after the fact, requiring error handling. Better to check proactively.
3. **Redis-based distributed lock**: Rejected. Overkill for a single-database system. The DB row lock is sufficient.
