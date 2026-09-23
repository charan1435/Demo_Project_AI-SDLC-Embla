# CLAUDE.md — backend

Scope: `backend/` only. Read the root `CLAUDE.md` first for domain model, non-negotiable constraints, and cross-cutting conventions — this file covers backend-specific structure, API surface, and commands.

> **Status: design finalized, pre-code.** No `package.json` or `src/` exists yet. This is the target layout and stack per `docs/superpowers/specs/2026-09-23-student-attendance-system-design.md` §4/§6/§7/§8 — build to match it, and delete this notice once the app is scaffolded.

## Stack

Node.js + Express + TypeScript, Prisma ORM, PostgreSQL, JWT auth, zod validation, bcrypt (cost factor 12).

## Structure

```
backend/src/
├── auth/       # login per role, JWT issuance/verification, role guard middleware
├── modules/
│   ├── students/  teachers/  classes/  subjects/
│   ├── enrollments/  assignments/
│   ├── sessions/  attendance/
│   ├── admin/       # provisioning endpoints
│   └── reports/     # aggregation: percentages, trends
│       (each module: routes.ts → service.ts → repository.ts)
├── db/         # Prisma schema, migrations, seeds
└── shared/     # errors, validation (zod), time utils (clock abstraction)
```

Layering is the same in every module, including `admin`: route (validation, role guard) → service (business rules) → repository (DB access, ownership filters).

## Auth & role isolation

- Three separate login endpoints, each querying only its own table: `POST /api/student/auth/login`, `POST /api/teacher/auth/login`, `POST /api/admin/auth/login`. There is no shared `users` table, so a student's email can never authenticate as a teacher or admin.
- Passwords hashed with bcrypt (cost factor 12). All three login endpoints return an identical generic 401 on failure, regardless of whether the email exists.
- JWT in an httpOnly, Secure cookie (`SameSite=Lax`, or `None` if frontend/backend end up on different top-level domains). Payload is `{ id, role }` only — no PII.
- One role-guard middleware per namespace, `requireRole('student' | 'teacher' | 'admin')`, mounted before any route handler. A valid JWT for the wrong role gets 403 at the middleware layer.
- Ownership scoping happens in the repository layer using `req.user.id` from the verified JWT — client-supplied ids are never trusted for "whose data is this."
- Logout clears the cookie; no server-side token blacklist at this scale (short expiry keeps risk low).

## API surface

**`/api/student/*`** (behind `requireRole('student')`)
- `POST /auth/login`, `POST /auth/logout`
- `GET /subjects` — enrolled subjects only
- `GET /subjects/:subjectId/sessions` — sessions with window status and this student's record status
- `POST /sessions/:sessionId/attendance` — mark present
- `GET /subjects/:subjectId/attendance` — this student's history + percentage

**`/api/teacher/*`** (behind `requireRole('teacher')`)
- `POST /auth/login`, `POST /auth/logout`
- `GET /subjects` — from this teacher's `TeacherAssignment`s only
- `POST /subjects/:subjectId/sessions` — schedule a session
- `GET /sessions/:sessionId/attendance` — roster for a session
- `GET /subjects/:subjectId/report` — attendance %, absentees, trend; filterable by date range and class
- `GET /students/:studentId/report` — per-student drill-down, only if enrolled in a subject this teacher is assigned to

**`/api/admin/*`** (behind `requireRole('admin')`)
- `POST /auth/login`, `POST /auth/logout`
- CRUD `/classes`, `/subjects`, `/students`, `/teachers`
- `POST`/`DELETE /enrollments`, `POST`/`DELETE /teacher-assignments`

### Error mapping

One error handler maps typed domain errors to HTTP status + a stable error code; no raw DB errors ever reach a client.

| Domain error | HTTP | Code |
|---|---|---|
| `NotEnrolled` | 403 | `NOT_ENROLLED` |
| `SessionClosed` | 400 | `SESSION_CLOSED` |
| `DuplicateAttendance` | 409 | `DUPLICATE_ATTENDANCE` |
| `Forbidden` | 403 | `FORBIDDEN` |
| not found | 404 | `NOT_FOUND` |
| validation (zod) failure | 400 | `VALIDATION_ERROR` |

## Attendance marking flow (critical path — read before touching)

`POST /api/student/sessions/:sessionId/attendance` — `req.user.id` from the verified JWT is the only source of "who," never the request body.

Service logic, in order:
1. Load the session (404 if missing).
2. Check `Enrollment` exists for `(req.user.id, session.subjectId)` → else `NotEnrolled` (403).
3. Check server clock (`clock.now()`, UTC, via the shared clock utility so tests can freeze time) falls within `[session.startsAt, session.endsAt]` → else `SessionClosed` (400). Client time is never consulted.
4. Insert the `AttendanceRecord` with `markedAt = clock.now()`.

**Why insert, not check-then-insert:** a `SELECT`-then-`INSERT` duplicate check has a race window — two near-simultaneous requests can both pass the check before either commits. Do an optimistic insert and rely on the DB unique constraint on `(studentId, sessionId)` as the actual enforcement: catch the Prisma unique-violation (`P2002`) and re-throw as `DuplicateAttendance` → `409`. The frontend treats 409 here as "already marked present," not an error banner.

## Reporting/aggregation

Attendance % per subject: `COUNT(distinct AttendanceRecord for student+subject) / COUNT(Session for subject where endsAt < now())`, computed as a SQL aggregate in the `reports` module — never pulled row-by-row into app code. The same query backs both the student's own history view and the teacher's per-subject report; the teacher version adds `GROUP BY studentId` for absentee lists and `GROUP BY date_trunc('week', session.startsAt)` for the trend chart. Date-range/class filters are additional `WHERE` clauses on the same aggregate query.

## Domain model

See root `CLAUDE.md` for the entity table and Decisions A/B/C. The full Prisma schema sketch (all models, `@@unique`/`@@index` constraints) is in `docs/superpowers/specs/2026-09-23-student-attendance-system-design.md` §3 — treat it as the source of truth for `backend/src/db/schema.prisma`.

## Commands

Not yet real — no `package.json` exists. Expected once scaffolded:

```bash
npm install
npm run dev              # Express API (ts-node-dev/tsx)
npm run build
npx prisma migrate dev   # apply migrations locally
npx prisma db seed       # seed dev data
npm run test              # Vitest + Supertest, requires local test Postgres (see tests/CLAUDE.md)
npm run lint
npm run typecheck
```
