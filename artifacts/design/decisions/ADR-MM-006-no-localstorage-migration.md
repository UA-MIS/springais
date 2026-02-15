# ADR-MM-006: No Migration of localStorage Gamification Data

**Status**: Proposed
**Date**: 2026-02-11
**Decision**: D-MM-12

## Context

The current adventure mode stores all gamification state in browser `localStorage` under the key `springais-adventure-mode`. When migrating to server-side storage, we must decide whether to attempt migrating existing localStorage data.

### Problems with localStorage Data

1. **Not per-user**: localStorage is shared across all users on the same browser. User A's data could include progress from User B.
2. **Manipulable**: Anyone can open browser devtools and edit localStorage values. XP, gold, and achievements can be freely inflated.
3. **Incomplete**: Users who cleared browser data have already lost their progression. The data is inherently lossy.
4. **Different schema**: The current XP curve is exponential. The new system uses a linear-step curve. XP values do not translate directly.
5. **Client-side only**: There is no server API to upload localStorage data, so the frontend would need to send a "migration bundle" to a new endpoint -- which the server cannot verify.

### Options

**Option A: Attempt migration**
- Add a temporary `POST /api/progression/migrate` endpoint.
- Frontend reads localStorage and sends the data to the server on first login.
- Server accepts the data with some validation (e.g., cap XP at reasonable levels).
- Delete localStorage after successful migration.

**Option B: Clean start**
- All users start fresh with the new server-side system.
- LocalStorage data is ignored and eventually cleaned up by the frontend.
- No migration endpoint needed.

## Decision

**Option B: Clean start.** No migration of localStorage data.

### Rationale

1. The current data is untrustworthy (not per-user, manipulable, lossy).
2. The XP curve is changing, so existing XP values would need arbitrary re-mapping.
3. The gold system is changing fundamentally (renamed to Coins, new reward sources, new spending destinations). Existing gold balances are meaningless.
4. The achievement system is expanding from 14 to 24+ achievements with different trigger mechanisms.
5. A migration endpoint would require complex validation to prevent abuse (users injecting inflated values).
6. The user impact is low: the current system was broken (data could be lost at any time), and the old gold had no meaningful use beyond gambling.

### User Communication

To soften the transition:
- Consider a one-time "Welcome Back" Coin bonus (e.g., 100 Coins) for users who had adventure mode enabled before the migration. This can be detected by checking if `localStorage.getItem('springais-adventure-mode')` exists.
- The frontend can show a brief message: "Adventure Mode has been upgraded! Your journey begins anew with the new server-backed progression system."

## Consequences

- **Positive**: Simpler implementation. No migration endpoint, no validation logic, no edge cases.
- **Positive**: Eliminates the risk of migrating corrupt or manipulated data.
- **Positive**: Clean baseline for metrics (all users start at 0, making engagement tracking meaningful).
- **Negative**: Users with legitimate progress lose it. Mitigated by the fact that progress was already unreliable and the old gold had no value.
- **Negative**: Some users may be briefly disappointed. Mitigated by the welcome bonus and improved system.

## Alternatives Considered

1. **Full migration with server validation**: Rejected. Cannot validate client-sent data. Adds complexity for untrustworthy data.
2. **Partial migration (only achievements)**: Rejected. Achievement triggers are changing. Would still need validation and the effort is not justified.
3. **Honor system migration (accept whatever the client sends)**: Rejected. Creates a cheating vector on day one of the new anti-cheat system.
