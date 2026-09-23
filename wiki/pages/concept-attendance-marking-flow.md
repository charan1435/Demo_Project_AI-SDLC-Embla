---
updated: 2026-09-23
---

> How `POST /api/student/sessions/:sessionId/attendance` validates and records a "Mark Present" click.

## The flow

`req.user.id` from the verified JWT is the **only** source of "who" — never the request body. Service logic runs in order:

1. Load the session — 404 if missing.
2. Check an `Enrollment` exists for `(req.user.id, session.subjectId)` — else throw `NotEnrolled` → 403 `NOT_ENROLLED`.
3. Check the server clock (`clock.now()`, UTC, via a shared clock utility so tests can freeze time) falls within `[session.startsAt, session.endsAt]` — else throw `SessionClosed` → 400 `SESSION_CLOSED`. **Client time is never consulted.** The window itself is defined by [[decision-attendance-window]].
4. Insert the `AttendanceRecord` with `markedAt = clock.now()`.

## Why optimistic insert, not check-then-insert

A `SELECT`-then-`INSERT` duplicate check has a race window: two near-simultaneous requests can both pass the check before either commits. Instead, the flow does an **optimistic insert** and relies on the DB's `@@unique([studentId, sessionId])` constraint (see [[concept-domain-model]]) as the real enforcement. A Prisma unique-violation (`P2002`) is caught and re-thrown as `DuplicateAttendance` → 409 `DUPLICATE_ATTENDANCE`.

The frontend treats a 409 here as "already marked present" (a benign, expected state), not an error banner.

## Required test coverage

Per the spec, this flow specifically needs:

- Wrong role → 403
- Not enrolled → 403 `NOT_ENROLLED`
- Before window opens → 400 `SESSION_CLOSED`
- After window closes → 400 `SESSION_CLOSED`
- Duplicate submit (sequential) → 409 `DUPLICATE_ATTENDANCE`
- **True race**: two concurrent inserts via `Promise.all` for the same `(studentId, sessionId)` → exactly one succeeds, the other gets 409

See [[concept-testing-strategy]] for how this fits the broader test pyramid, and [[concept-api-surface]] for the full error-code table.

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§8)
