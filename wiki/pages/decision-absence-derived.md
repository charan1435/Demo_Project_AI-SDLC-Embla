---
updated: 2026-09-23
---

> Decision A: absence is never written as a row — it's computed from the absence of a record after a session closes.

## The decision

No `ABSENT` `AttendanceRecord` rows are ever written. A student is absent for a session **iff** the session's window has closed (`endsAt < now()`) and no `AttendanceRecord` exists for `(studentId, sessionId)`.

The `AttendanceStatus` enum in [[concept-domain-model]] currently has only one value: `PRESENT`.

## Why

Only positive attendance events need persisting; absence is the default state of "nothing happened yet, or nothing happened by the deadline." Storing explicit absence rows would require a write for every non-attending student on every session close — unnecessary volume and a sync-timing problem (when exactly do you write them?).

## How it drives the math

Attendance % per subject, for a student:

```
COUNT(distinct AttendanceRecord for student+subject)
  / COUNT(Session for subject where endsAt < now())
```

Computed as a single SQL aggregate in the `reports` module — see [[concept-reporting-aggregation]] — not row-by-row in application code.

## Consequences

- Reporting queries must always filter `Session` by `endsAt < now()` when computing a denominator — a session still in progress or in the future doesn't count against or for the student yet.
- There's no `ABSENT`-row backfill job to maintain.
- Explicit absence-record persistence is called out as **out of scope for v1** — see [[decision-v1-scope-boundaries]].

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§3, Decision A; §10)
