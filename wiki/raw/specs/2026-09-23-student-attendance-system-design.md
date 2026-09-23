# Student Attendance System — Design Spec

**Date:** 2026-09-23
**Status:** Approved design, pending implementation planning

## 1. Purpose & context

A web-based student attendance system for a real school deployment (not a demo-only build). Students mark their own attendance during an active session window; teachers get a dashboard for attendance tracking per subject, session, and student; an admin role provisions the underlying data (students, teachers, classes, subjects, enrollments, assignments).

- Scale: single school, hundreds to low-thousands of students, cloud-hosted.
- Team background: JavaScript/TypeScript full-stack.
- Attendance marking mechanism (v1): a simple "Mark Present" button click during the session's active window — no QR/PIN/geofencing for v1.
- Repo: https://github.com/charan1435/Demo_Project_AI-SDLC-Embla · Jira project `AI` (board 19) on emblarnd.atlassian.net.

## 2. Roles

Three roles, each with a fully separate login flow (separate pages/endpoints, not a toggle on one form):

**Student**
- Sees only their enrolled subjects
- Marks attendance for a session of an enrolled subject, only while that session's window is active
- Views their own attendance history and percentage per subject

**Teacher**
- Sees only subjects/classes they are assigned to
- Views attendance overall, per subject, per session, and per student
- Summary stats: attendance %, absentees, trends over time
- Filters: date range, subject, class

**Admin**
- Provisions students, teachers, classes, subjects, enrollments, and teacher assignments through in-app CRUD screens (no external identity system or CSV-import dependency for v1)

## 3. Domain model & key decisions

| Entity | Key fields / notes |
|---|---|
| `Admin` | `id`, `name`, `email` (unique), `passwordHash` |
| `Student` | belongs to one `Class`; enrolled in many `Subject`s via `Enrollment` |
| `Teacher` | assigned to many `Subject`s (optionally scoped per `Class`) via `TeacherAssignment` |
| `Class` (grade/section) | groups students |
| `Subject` | taught by teacher(s); has enrollments; not FK'd to a single `Class` — class-scoping happens via `TeacherAssignment.classId` and via which class's students are enrolled |
| `Enrollment` | `Student` ↔ `Subject` join, unique on `(studentId, subjectId)` |
| `TeacherAssignment` | `Teacher` ↔ `Subject` (+ optional `Class`) join |
| `Session` | one scheduled meeting of a `Subject`: `startsAt`, `endsAt` (UTC) |
| `AttendanceRecord` | `studentId`, `sessionId`, `status`, `markedAt` (UTC), `createdAt`/`updatedAt` |

Relationships: `Subject 1—* Session 1—* AttendanceRecord *—1 Student`.

**Decision A — absence is derived, not stored.** No `ABSENT` rows are ever written. A student is absent for a session iff the session's window has closed and no `AttendanceRecord` exists for `(studentId, sessionId)`. Attendance % per subject = `COUNT(distinct AttendanceRecord for student+subject) / COUNT(Session for subject where endsAt < now())`, computed as a SQL aggregate.

**Decision B — the attendance window *is* the session's `startsAt`–`endsAt` for v1.** No separate "class meeting time" vs. "narrower marking window" field. Can be split later if a school wants a shorter marking window than the class period.

**Decision C — passwordHash lives directly on each role table** (`Admin`, `Teacher`, `Student`), not a shared `users` table with a role discriminator column. Role identity is intrinsic to which table a record is in, never a spoofable field.

### Prisma schema sketch

```prisma
model Admin {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Teacher {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  assignments  TeacherAssignment[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Student {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  classId      String
  class        Class    @relation(fields: [classId], references: [id])
  enrollments  Enrollment[]
  records      AttendanceRecord[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Class {
  id          String    @id @default(cuid())
  name        String    // e.g. "Grade 10 - A"
  students    Student[]
  assignments TeacherAssignment[]
}

model Subject {
  id          String   @id @default(cuid())
  name        String
  enrollments Enrollment[]
  assignments TeacherAssignment[]
  sessions    Session[]
}

model Enrollment {
  id        String   @id @default(cuid())
  studentId String
  subjectId String
  student   Student  @relation(fields: [studentId], references: [id])
  subject   Subject  @relation(fields: [subjectId], references: [id])
  createdAt DateTime @default(now())

  @@unique([studentId, subjectId])
}

model TeacherAssignment {
  id        String   @id @default(cuid())
  teacherId String
  subjectId String
  classId   String?           // null = all classes for this subject
  teacher   Teacher  @relation(fields: [teacherId], references: [id])
  subject   Subject  @relation(fields: [subjectId], references: [id])
  class     Class?   @relation(fields: [classId], references: [id])
  createdAt DateTime @default(now())
}

model Session {
  id        String   @id @default(cuid())
  subjectId String
  subject   Subject  @relation(fields: [subjectId], references: [id])
  startsAt  DateTime // UTC — also the attendance window start
  endsAt    DateTime // UTC — also the attendance window end
  records   AttendanceRecord[]
  createdAt DateTime @default(now())

  @@index([subjectId])
}

model AttendanceRecord {
  id        String   @id @default(cuid())
  studentId String
  sessionId String
  status    AttendanceStatus @default(PRESENT) // v1: only PRESENT is ever written
  markedAt  DateTime         // UTC, server clock at time of marking
  student   Student  @relation(fields: [studentId], references: [id])
  session   Session  @relation(fields: [sessionId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([studentId, sessionId])   // DB-level, enforces non-negotiable #4
  @@index([sessionId])
  @@index([studentId])
}

enum AttendanceStatus {
  PRESENT
}
```

## 4. Architecture

Two separately deployable applications communicating over HTTP:

```
/
├── frontend/                    # React + Vite + TS SPA
│   └── src/
│       ├── features/
│       │   ├── student/         # login, subjects, mark attendance, history
│       │   ├── teacher/         # login, dashboard, filters, drill-downs
│       │   └── admin/           # login, manage students/teachers/classes/subjects/enrollments
│       ├── shared/               # UI components, api client, auth context
│       └── routes/               # role-guarded route definitions
│
├── backend/                      # Node + Express + TS API
│   └── src/
│       ├── auth/                 # login per role, JWT issuance/verification, role guard middleware
│       ├── modules/
│       │   ├── students/  teachers/  classes/  subjects/
│       │   ├── enrollments/  assignments/
│       │   ├── sessions/  attendance/
│       │   ├── admin/            # provisioning endpoints
│       │   └── reports/          # aggregation: percentages, trends
│       │       (each module: routes.ts → service.ts → repository.ts)
│       ├── db/                   # Prisma schema, migrations, seeds
│       └── shared/               # errors, validation (zod), time utils (clock abstraction)
│
└── tests/
    ├── backend/ (unit + integration, real test Postgres)
    ├── frontend/ (component tests)
    └── e2e/ (Playwright, cross-role flows)
```

- Role isolation is physical: API namespaces `/api/student/*`, `/api/teacher/*`, `/api/admin/*`, each behind its own role-guard middleware.
- Layering is route (validation, role guard) → service (business rules) → repository (DB access, ownership filters) everywhere, including `admin`.
- `frontend/src/features/admin/` is a third silo alongside `student/`/`teacher/` — no cross-imports between role features; shared UI lives in `shared/`.

## 5. Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript, React Router, TanStack Query, Tailwind CSS + shadcn/ui (Radix primitives) |
| Backend / API | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM / migrations | Prisma |
| Auth | JWT (`{ id, role }` claim) in an httpOnly, Secure cookie; ~8 hour expiry; no refresh-token rotation in v1 |
| Charts | Recharts |
| Testing | Vitest + Supertest (backend, real test Postgres), React Testing Library (frontend components), Playwright (e2e) |
| Hosting / CI | Frontend on Vercel; backend on Render/Railway; managed Postgres (Neon/Supabase); CI on Bitbucket Pipelines (lint → typecheck → unit → integration → build) |

## 6. Auth & role isolation

- Three separate login endpoints, each querying only its own table: `POST /api/student/auth/login`, `POST /api/teacher/auth/login`, `POST /api/admin/auth/login`. A student's email can never authenticate as a teacher or admin — there is no shared table to blur the lookup.
- Passwords hashed with bcrypt (cost factor 12). All three login endpoints return an identical generic 401 on failure, regardless of whether the email exists.
- JWT stored in an httpOnly, Secure cookie (`SameSite=Lax`, or `None` if frontend/backend end up on different top-level domains). Payload contains only `{ id, role }`, no PII.
- One role-guard middleware per namespace (`requireRole('student' | 'teacher' | 'admin')`), mounted before any route handler. A valid JWT for the wrong role gets 403 at the middleware layer.
- Ownership scoping happens in the repository layer using `req.user.id` from the verified JWT — client-supplied ids are never trusted for "whose data is this."
- Logout clears the cookie; no server-side token blacklist at this scale (short expiry keeps risk low).

## 7. API surface

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

## 8. Attendance marking flow

`POST /api/student/sessions/:sessionId/attendance` — `req.user.id` from the verified JWT is the only source of "who," never the request body.

Service logic, in order:
1. Load the session (404 if missing).
2. Check `Enrollment` exists for `(req.user.id, session.subjectId)` → else `NotEnrolled` (403).
3. Check server clock (`clock.now()`, UTC, via a shared clock utility so tests can freeze time) falls within `[session.startsAt, session.endsAt]` → else `SessionClosed` (400). Client time is never consulted.
4. Insert the `AttendanceRecord` with `markedAt = clock.now()`.

**Why insert, not check-then-insert:** a `SELECT`-then-`INSERT` duplicate check has a race window — two near-simultaneous requests can both pass the check before either commits. The flow does an optimistic insert and relies on the DB unique constraint on `(studentId, sessionId)` as the actual enforcement: a Prisma unique-violation (P2002) is caught and re-thrown as `DuplicateAttendance` → `409`. The frontend treats 409 here as "already marked present," not an error banner.

### Required test coverage for this flow
- Wrong role → 403
- Not enrolled → 403 `NOT_ENROLLED`
- Before window opens → 400 `SESSION_CLOSED`
- After window closes → 400 `SESSION_CLOSED`
- Duplicate submit (sequential) → 409 `DUPLICATE_ATTENDANCE`
- True race: two concurrent inserts via `Promise.all` for the same `(studentId, sessionId)` → exactly one succeeds, the other gets 409

## 9. UI/UX approach

**Foundation:** Tailwind CSS + shadcn/ui (Radix primitives) for accessible, themeable building blocks rather than hand-rolled ARIA. Actual visual identity (palette, type, spacing) is deferred to implementation-time frontend-design passes (see §12), not decided in this spec.

**Role-based layout shells:** each role gets its own nav/shell (`StudentLayout`, `TeacherLayout`, `AdminLayout`) — no shared nav surfaces all three roles' links, mirroring the backend's physical separation.

**Screens per role:**

*Student* (mobile-first)
- Login
- Subjects home — enrolled subjects as cards with current attendance %
- Subject detail — sessions list with status badge (upcoming / open — mark now / closed), a prominent "Mark Present" action enabled only while the window is open
- History — past sessions with status, plus the percentage

*Teacher* (desktop-first, responsive)
- Login
- Dashboard home — assigned subjects/classes with at-a-glance stats
- Subject report — date range + class filters, trend chart (Recharts), absentee list
- Session drill-down — roster of who marked present for a session
- Student drill-down — one student's history within a subject

*Admin*
- Login
- Management console — tabbed sections (Classes / Subjects / Students / Teachers / Enrollments / Assignments), each a table + modal create/edit form

**Status convention:** green = present, red = absent, amber = window open/pending — always paired with a text label or icon, never color alone.

**Responsive rule (non-negotiable):** every screen mobile-first with Tailwind breakpoints; teacher's dense tables collapse to stacked cards below `md`.

## 10. Reporting/aggregation

Attendance % per subject: `COUNT(distinct AttendanceRecord for student+subject) / COUNT(Session for subject where endsAt < now())`, computed as a SQL aggregate in the `reports` module — not pulled row-by-row into app code. The same query backs both the student's own history view and the teacher's per-subject report; the teacher version adds `GROUP BY studentId` for absentee lists and `GROUP BY date_trunc('week', session.startsAt)` for the trend chart. Date-range/class filters are additional `WHERE` clauses on the same aggregate query.

## 11. Testing strategy

- Vitest for backend unit tests (pure logic: window checks, error mapping).
- Supertest integration tests against a real local Postgres (docker-compose test DB) for anything touching auth, scoping, marking, or uniqueness — mocks are not sufficient for the DB-level unique constraint.
- React Testing Library for frontend component tests.
- Playwright for e2e: all three login flows, and the full mark-attendance → visible-in-teacher-dashboard path.
- Target: 80% coverage (per CLAUDE.md).

## 12. Hosting / CI

- Frontend: Vercel (static SPA build).
- Backend: Render or Railway (Node service).
- Database: managed Postgres (Neon or Supabase), or the backend host's Postgres add-on.
- CI: Bitbucket Pipelines — lint → typecheck → unit → integration tests → build, gating merges.

## 13. Deferred to implementation time

- **Visual design:** actual mockups (3 options to choose from) generated via the frontend-design skill, scoped per UI-related Jira epic/story — not decided in this spec. This spec fixes the structural approach (component foundation, screens, layout shells, status conventions); visual identity is a separate pass once Jira UI epics exist or are updated.
- Refresh-token rotation (if 8-hour re-login proves too disruptive in practice).
- Splitting `Session` window from class meeting time (if a school wants a shorter marking window than the full class period).

## 14. Out of scope for v1

- QR code / PIN / geofenced attendance marking.
- Multi-school / multi-tenant support.
- CSV import or external identity system for provisioning (admin does it via in-app CRUD).
- Explicit `ABSENT` record persistence (derived instead — see Decision A).
