---
updated: 2026-09-23
---

> The full HTTP API surface, organized by role namespace, plus the domain-error-to-HTTP mapping.

## `/api/student/*` (behind `requireRole('student')`)

- `POST /auth/login`, `POST /auth/logout`
- `GET /subjects` — enrolled subjects only
- `GET /subjects/:subjectId/sessions` — sessions with window status + this student's record status
- `POST /sessions/:sessionId/attendance` — mark present (see [[concept-attendance-marking-flow]])
- `GET /subjects/:subjectId/attendance` — this student's history + percentage

## `/api/teacher/*` (behind `requireRole('teacher')`)

- `POST /auth/login`, `POST /auth/logout`
- `GET /subjects` — from this teacher's `TeacherAssignment`s only
- `POST /subjects/:subjectId/sessions` — schedule a session
- `GET /sessions/:sessionId/attendance` — roster for a session
- `GET /subjects/:subjectId/report` — attendance %, absentees, trend; filterable by date range and class (see [[concept-reporting-aggregation]])
- `GET /students/:studentId/report` — per-student drill-down, only if enrolled in a subject this teacher is assigned to

## `/api/admin/*` (behind `requireRole('admin')`)

- `POST /auth/login`, `POST /auth/logout`
- CRUD `/classes`, `/subjects`, `/students`, `/teachers`
- `POST`/`DELETE /enrollments`, `POST`/`DELETE /teacher-assignments`

## Error mapping

One error handler maps typed domain errors to HTTP status + a stable error code; no raw DB errors ever reach a client.

| Domain error | HTTP | Code |
|---|---|---|
| `NotEnrolled` | 403 | `NOT_ENROLLED` |
| `SessionClosed` | 400 | `SESSION_CLOSED` |
| `DuplicateAttendance` | 409 | `DUPLICATE_ATTENDANCE` |
| `Forbidden` | 403 | `FORBIDDEN` |
| not found | 404 | `NOT_FOUND` |
| validation (zod) failure | 400 | `VALIDATION_ERROR` |

Role-guard rejection (wrong role for namespace) happens at the [[concept-role-isolation]] middleware layer, before these route handlers ever run.

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§7)
