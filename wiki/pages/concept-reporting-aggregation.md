---
updated: 2026-09-23
---

> How attendance percentages, absentee lists, and trends are computed — one SQL aggregate query, reused across student and teacher views.

## The base query

Attendance % per subject for a student:

```
COUNT(distinct AttendanceRecord for student+subject)
  / COUNT(Session for subject where endsAt < now())
```

Computed as a SQL aggregate in a dedicated `reports` backend module — **not** pulled row-by-row into app code. This directly follows from [[decision-absence-derived]] (absence has no row to count directly, so the denominator is "closed sessions" and the numerator is "records that exist").

## Reuse across views

The same base query backs:

- The **student's own history view** (`GET /subjects/:subjectId/attendance` — see [[concept-api-surface]]).
- The **teacher's per-subject report**, extended with:
  - `GROUP BY studentId` → absentee lists.
  - `GROUP BY date_trunc('week', session.startsAt)` → the trend chart (rendered with Recharts, see [[entity-tech-stack]]).
- Date-range and class filters are additional `WHERE` clauses layered on the same aggregate query, not separate queries.

## Architectural placement

Lives in `backend/src/modules/reports/` in the module layout described in [[entity-tech-stack]], following the same route → service → repository layering as every other module.

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§10)
