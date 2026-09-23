---
updated: 2026-09-23
---

> The entity model and relationships behind the attendance system, per the approved Prisma schema sketch.

## Entities

| Entity | Notes |
|---|---|
| `Admin` | `id`, `name`, `email` (unique), `passwordHash` |
| `Student` | belongs to one `Class`; enrolled in many `Subject`s via `Enrollment` |
| `Teacher` | assigned to many `Subject`s (optionally scoped per `Class`) via `TeacherAssignment` |
| `Class` | grade/section; groups students |
| `Subject` | taught by teacher(s); has enrollments; **not** FK'd to a single `Class` — class-scoping happens via `TeacherAssignment.classId` and via which class's students enroll |
| `Enrollment` | `Student` ↔ `Subject` join, `@@unique([studentId, subjectId])` |
| `TeacherAssignment` | `Teacher` ↔ `Subject` (+ optional `Class`; `null` = all classes for that subject) join |
| `Session` | one scheduled meeting of a `Subject`: `startsAt`, `endsAt` (UTC) |
| `AttendanceRecord` | `studentId`, `sessionId`, `status` (only `PRESENT` in v1), `markedAt` (UTC), `createdAt`/`updatedAt` |

Relationship chain: `Subject 1—* Session 1—* AttendanceRecord *—1 Student`.

## Notable modeling choices

- **`Subject` is not scoped to one `Class`.** A subject can be taught across multiple classes; the actual class-scoping is indirect — via which class's students hold `Enrollment` rows, and via `TeacherAssignment.classId` for a teacher's view.
- **`passwordHash` is per-role-table**, not centralized — see [[decision-passwordhash-per-role]].
- **`AttendanceStatus` enum has only `PRESENT`** in v1 — absence is derived, see [[decision-absence-derived]].
- **`AttendanceRecord` has `@@unique([studentId, sessionId])`** — this is the DB-level enforcement backing the no-duplicate-marking rule in [[concept-attendance-marking-flow]]. Also indexed on `sessionId` and `studentId` separately for report queries.
- **`Session` has no separate marking-window field** — see [[decision-attendance-window]].

## Full Prisma sketch

The complete model definitions (all fields, relations, indexes) live in the raw source spec §3 and are treated as authoritative for `backend/src/db/schema.prisma` once the backend is scaffolded — this page summarizes rather than duplicates the full block to stay in sync by reference.

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§3)
