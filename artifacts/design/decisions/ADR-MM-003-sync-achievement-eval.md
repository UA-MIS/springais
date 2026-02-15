# ADR-MM-003: Synchronous In-Process Achievement Evaluation

**Status**: Proposed
**Date**: 2026-02-11

## Context

After a gamification event is recorded (e.g., module_completed), the system needs to check whether any achievements should be unlocked. There are two main approaches:

1. **Synchronous (in-process)**: Evaluate achievements within the same request/transaction that created the event.
2. **Asynchronous (background worker)**: Push the event to a queue and process achievements in a separate worker.

## Decision

Use synchronous in-process evaluation. After every gamification event, `achievement_service.evaluate_achievements()` is called within the same request lifecycle.

### Rationale

1. **Low overhead**: The achievement catalog has ~25 rows. Evaluation is a simple in-memory loop comparing event counts and thresholds. Expected time: < 10ms.
2. **Immediate feedback**: Users see achievement unlock toasts immediately after the triggering action, not seconds later.
3. **Simpler architecture**: No message queue, no background worker, no eventual consistency issues.
4. **Transaction consistency**: Achievement unlock and its XP/Coin rewards are committed in the same transaction as the triggering event.

### Performance Budget

The NFR specifies < 50ms added latency for achievement evaluation. With ~25 achievements and simple conditions:
- In-memory catalog iteration: < 1ms
- DB query for user's current achievement count: < 5ms (indexed)
- Event count queries (for event_based triggers): < 5ms each (indexed)
- Total: well under 50ms budget.

### Error Handling

Achievement evaluation is wrapped in the `reward_hook_service.process_action()` try/except. If it fails, the primary action still succeeds. This matches the fire-and-forget pattern.

## Consequences

- **Positive**: Instant achievement feedback to users.
- **Positive**: Simpler infrastructure (no queue/worker).
- **Positive**: Transactional consistency.
- **Negative**: Adds latency to the triggering request (~10-30ms). Acceptable within budget.
- **Negative**: If the catalog grows to hundreds of achievements, evaluation time may need optimization (pre-filter by event_type, lazy evaluation). Not a concern at ~25 achievements.

## Alternatives Considered

1. **Background worker (Celery/Redis queue)**: Rejected. Adds infrastructure complexity, delayed feedback, eventual consistency. Not warranted for ~25 achievements.
2. **Database trigger**: Rejected. Business logic in SQL is harder to test and maintain.
3. **Lazy evaluation (check only on GET /api/achievements)**: Rejected. Users would not see unlock toasts until they navigate to the achievements page.
