# ADR-MM-005: Linear-Step XP Curve Replacing Exponential

**Status**: Proposed
**Date**: 2026-02-11
**Decision**: D-MM-5

## Context

The current adventure mode uses an exponential XP curve: `xpForLevel(level) = floor(100 * 1.5^(level-1))`.

This produces:
| Level | XP for level | Cumulative XP |
|-------|-------------|---------------|
| 1 | 100 | 0 |
| 5 | 506 | 862 |
| 10 | 3,844 | 7,538 |
| 15 | 29,193 | 58,287 |
| 20 | 221,803 | 443,504 |

At 50 XP per module, reaching level 20 would require completing 8,870 modules -- clearly unreachable.

## Decision

Replace the exponential curve with a linear-step curve:

| Level | Total XP Required | XP for this level | Title |
|-------|-------------------|-------------------|-------|
| 1 | 0 | 100 | Apprentice |
| 2 | 100 | 200 | Apprentice |
| 3 | 300 | 300 | Apprentice |
| 4 | 600 | 400 | Squire |
| 5 | 1,000 | 500 | Squire |
| 6 | 1,500 | 600 | Knight |
| 7 | 2,100 | 700 | Knight |
| 8 | 2,800 | 800 | Warrior |
| 9 | 3,600 | 900 | Warrior |
| 10 | 4,500 | 1,000 | Champion |
| 11+ | 4,500 + (L-10)*1,000 | 1,000 | Master/Grandmaster/Legend |

The pattern: each level from 1-10 requires `level * 100` XP more than the previous. After level 10, the per-level requirement flattens at 1,000 XP.

### Reachability Analysis

At 50 XP per module:
- Level 5 (Squire): 20 modules
- Level 10 (Champion): 90 modules
- Level 15 (Grandmaster): 190 modules
- Level 20 (Legend): 290 modules

With assessments (75 XP), milestones (150 XP), and certifications (300 XP), these numbers are significantly lower. A dedicated user can reach level 10 within a few months and level 20 within a year.

## Consequences

- **Positive**: Levels are achievable. Users see meaningful progress.
- **Positive**: Simple formula, easy to understand and communicate.
- **Positive**: Flat tail (1,000 XP per level after 10) prevents levels from becoming unreachable.
- **Negative**: Existing localStorage XP values are meaningless under the new curve. Mitigated by D-MM-12 (no migration of localStorage data).

## Alternatives Considered

1. **Keep exponential curve with lower base**: Rejected. Any exponential curve eventually becomes unreachable.
2. **Logarithmic curve**: Rejected. Levels get easier over time, which reduces the sense of achievement.
3. **Fixed XP per level (e.g., 500 per level)**: Considered. Simpler but too flat -- no sense of increasing challenge.
