---
updated: 2026-09-23
---

> Decision B: for v1, the attendance marking window *is* the session's `startsAt`–`endsAt` — there's no separate, narrower marking-window field.

## The decision

`Session.startsAt` / `Session.endsAt` (both UTC) serve double duty: they define when the class meeting happens *and* when students are allowed to mark themselves present. No separate "class meeting time" vs. "narrower marking window" field exists in v1.

See [[concept-attendance-marking-flow]] for how this window is checked server-side at marking time.

## Why

Simplicity for v1 — one pair of timestamps instead of two, one less thing to keep in sync when scheduling a session.

## Deferred extension

Noted explicitly as a future possibility: splitting `Session` window from class meeting time, if a school wants students to only be able to mark present in (say) the first 10 minutes of class rather than the whole period. See [[decision-v1-scope-boundaries]].

## Consequences

- Server clock (`clock.now()`) comparison is a single `[startsAt, endsAt]` range check, no second window to validate.
- If/when this splits, the marking-flow check in [[concept-attendance-marking-flow]] step 3 is the one place that changes.

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§3, Decision B; §13)
