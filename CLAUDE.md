# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Status: design finalized, pre-code.** Stack, schema, API surface, and folder layout are locked per the approved design spec at `docs/superpowers/specs/2026-09-23-student-attendance-system-design.md`. No application code has been scaffolded yet — `frontend/`, `backend/`, and `tests/` currently hold only their own `CLAUDE.md`. Treat anything here that contradicts the actual code (once it exists) as stale and fix it.
>
> Layer-specific guidance lives in `frontend/CLAUDE.md`, `backend/CLAUDE.md`, and `tests/CLAUDE.md` — Claude Code auto-loads the nearest one alongside this file. This root file covers cross-cutting concerns: domain model, auth/security rules, and conventions shared by both apps.

## Project summary

A web-based student attendance system for a real school deployment (single school, hundreds to low-thousands of students, cloud-hosted). Students mark their own attendance during an active session window via a "Mark Present" button (v1 — no QR/PIN/geofencing). Teachers get a dashboard for attendance tracking per subject, session, and student. An admin role provisions all underlying data through in-app CRUD.

Repo: https://github.com/charan1435/Demo_Project_AI-SDLC-Embla · Jira project `AI` (board 19) on emblarnd.atlassian.net.

## User roles

Three roles, each with a **fully separate login flow** (separate pages/endpoints, not a toggle on one form): `/api/student/auth/login`, `/api/teacher/auth/login`, `/api/admin/auth/login`. Each queries only its own table — a student's email can never authenticate as a teacher or admin.

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
- Provisions students, teachers, classes, subjects, enrollments, and teacher assignments through in-app CRUD screens — no external identity system or CSV import in v1

## Domain model

| Entity | Key fields / notes |
|---|---|
| `Admin` | `id`, `name`, `email` (unique), `passwordHash` |
| `Student` | belongs to one `Class`; enrolled in many `Subject`s via `Enrollment` |
| `Teacher` | assigned to many `Subject`s (optionally scoped per `Class`) via `TeacherAssignment` |
| `Class` (grade/section) | groups students |
| `Subject` | taught by teacher(s); has enrollments; not FK'd to a single `Class` — class-scoping happens via `TeacherAssignment.classId` and via which class's students are enrolled |
| `Enrollment` | `Student` ↔ `Subject` join, unique on `(studentId, subjectId)` |
| `TeacherAssignment` | `Teacher` ↔ `Subject` (+ optional `Class`) join |
| `Session` | one scheduled meeting of a `Subject`: `startsAt`, `endsAt` (UTC) — this **is** the attendance window for v1, no separate narrower field |
| `AttendanceRecord` | `studentId`, `sessionId`, `status`, `markedAt` (UTC), `createdAt`/`updatedAt` |

Relationships: `Subject 1—* Session 1—* AttendanceRecord *—1 Student`.

**Key decisions (do not relitigate without updating this file):**
- **A — absence is derived, never stored.** No `ABSENT` rows are ever written. A student is absent for a session iff the window has closed and no `AttendanceRecord` exists for `(studentId, sessionId)`. Attendance % per subject = `COUNT(distinct AttendanceRecord for student+subject) / COUNT(Session for subject where endsAt < now())`, computed as a SQL aggregate.
- **B — the attendance window *is* `Session.startsAt`–`endsAt`.** Can be split into a narrower marking window later if needed.
- **C — `passwordHash` lives directly on each role table** (`Admin`, `Teacher`, `Student`), never a shared `users` table with a role discriminator column. Role identity is intrinsic to which table a record is in, never a spoofable field.

Full Prisma schema sketch lives in the design spec (`docs/superpowers/specs/2026-09-23-student-attendance-system-design.md`, §3) and should be treated as authoritative for `backend/src/db/schema.prisma` once created.

## Non-negotiable constraints

These must be enforced **server-side**; UI hiding is never sufficient.

1. **Role isolation is physical.** API namespaces `/api/student/*`, `/api/teacher/*`, `/api/admin/*`, each behind its own `requireRole('student' | 'teacher' | 'admin')` middleware mounted before any route handler. A valid JWT for the wrong role gets 403 at the middleware layer, not in a handler.
2. **Ownership scoping.** Students can only read/write their own records. Teachers can only read data for subjects/classes in their `TeacherAssignment`s. Scoping happens in the repository layer using `req.user.id` from the verified JWT — a client-supplied id is never trusted for "whose data is this."
3. **Marking rules.** A student may create an `AttendanceRecord` only if: (a) an `Enrollment` exists for `(req.user.id, session.subjectId)`, and (b) the server clock (`clock.now()`, UTC) falls within `[session.startsAt, session.endsAt]`. Client time is never consulted.
4. **No duplicates, enforced by the DB.** `@@unique([studentId, sessionId])` on `AttendanceRecord`. The marking flow does an optimistic `INSERT` (not check-then-insert — that has a race window) and catches the Prisma unique-violation (`P2002`), re-throwing it as `DuplicateAttendance` → `409`, never a 500.
5. **Timestamps.** Every attendance record stores `markedAt` in UTC; convert to school-local time only for display.
6. **Responsive.** Every screen is mobile-first with Tailwind breakpoints; teacher's dense tables collapse to stacked cards below `md`.

Every change touching auth, scoping, or marking should include tests for the negative cases (wrong role, not enrolled, not assigned, outside window, duplicate — see `tests/CLAUDE.md`).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript, React Router, TanStack Query, Tailwind CSS + shadcn/ui (Radix primitives) |
| Backend / API | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM / migrations | Prisma |
| Auth | JWT (`{ id, role }` claim only, no PII) in an httpOnly, Secure cookie (`SameSite=Lax`, or `None` if frontend/backend end up on different top-level domains); ~8 hour expiry; no refresh-token rotation in v1 |
| Charts | Recharts |
| Testing | Vitest + Supertest (backend, real test Postgres), React Testing Library (frontend components), Playwright (e2e) |
| Hosting / CI | Frontend on Vercel; backend on Render/Railway; managed Postgres (Neon/Supabase); CI on Bitbucket Pipelines (lint → typecheck → unit → integration → build) |

## Architecture

Two separately deployable applications communicating over HTTP:

```
/
├── frontend/            # React + Vite + TS SPA — see frontend/CLAUDE.md
├── backend/              # Node + Express + TS API — see backend/CLAUDE.md
└── tests/                # tests/backend, tests/frontend, tests/e2e — see tests/CLAUDE.md
```

- Layering everywhere (including `admin`): route (validation, role guard) → service (business rules) → repository (DB access, ownership filters).
- `frontend/src/features/admin/` is a third silo alongside `student/`/`teacher/` — no cross-imports between role features; shared UI lives in `shared/`.
- Reporting/aggregation (percentages, trends) lives in a dedicated `reports` backend module and is computed in the DB (SQL aggregate), not row-by-row in app code.

## Conventions

- **Naming:** DB tables/columns follow Prisma model/field casing from the schema sketch (models `PascalCase`, fields `camelCase`); entity names match the domain model table above.
- **Components:** feature-scoped folders; role-specific UI never imported across `student/` ↔ `teacher/` ↔ `admin/`. Shared pieces go in `shared/`.
- **Errors:** services throw typed domain errors (`NotEnrolled`, `SessionClosed`, `DuplicateAttendance`, `Forbidden`, not-found, `VALIDATION_ERROR`); a single error handler maps them to HTTP status + a stable error code (full table in `backend/CLAUDE.md`). No raw DB errors leak to clients.
- **Testing:** business rules and access control get integration tests against a real test database (the uniqueness constraint must be exercised for real — mocks are not sufficient). Dashboard math gets unit tests with fixed fixtures. Target: 80% coverage.
- **Time:** all time comparisons go through one shared clock utility (`backend/src/shared/`) so tests can freeze time.
- **Status convention (UI):** green = present, red = absent, amber = window open/pending — always paired with a text label or icon, never color alone.

## Git workflow

Defined in `.claude/branch-conventions.md`, `.claude/commit-conventions.md`, and `.claude/embla.json` (read those for full details):

- Main branch: `main`
- Feature: `s{sprint}/{jira-key}-{short-description}` · Bug: `s{sprint}/bug/{jira-key}-...` · Hotfix: `hotfix/{jira-key}-...` · Release: `release/s{sprint}`
- Commits: `{jira-key} {type}: {description}` (e.g. `AI-1562 feat: add session window check`), imperative, lowercase, ≤72 chars
- Test coverage target: 80%; PR size gate: ~300 lines

## Commands

No `package.json` exists yet in `frontend/` or `backend/` — these are the commands the chosen stack implies once each app is scaffolded. Update this block with real copy-paste-verified commands as soon as scaffolding lands.

```bash
# Setup / install (run in each of frontend/ and backend/)
npm install

# Run dev servers
cd backend && npm run dev     # Express API, ts-node-dev/tsx
cd frontend && npm run dev    # Vite dev server

# Build
npm run build                 # in each of frontend/ and backend/

# Test (all)
npm run test                  # backend: Vitest + Supertest; frontend: Vitest + RTL
npx playwright test           # e2e, from tests/e2e/

# Test (single file / single test)
npm run test -- path/to/file.test.ts
npx playwright test path/to/spec.spec.ts

# Lint / format / typecheck
npm run lint
npm run typecheck

# DB migrate / seed (backend/)
npx prisma migrate dev
npx prisma db seed
```
