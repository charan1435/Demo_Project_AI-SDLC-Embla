# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Status: pre-implementation.** No code exists yet. Sections marked **(planned)** or **TBD** are proposals — update this file as soon as the stack, folder layout, and commands are finalized. Treat anything here that contradicts the actual code as stale and fix it.

## Project summary

A web-based student attendance system for a school. Students sign in to their own sessions; teachers get a dashboard for tracking attendance per subject, session, and student.

Repo: https://github.com/charan1435/Demo_Project_AI-SDLC-Embla · Jira project `AI` (board 19) on emblarnd.atlassian.net.

## User roles

Two roles with **separate login flows** (separate login pages/endpoints, not a role toggle on one form).

**Student**
- Sees only their enrolled subjects
- Marks attendance for a specific session of an enrolled subject, only while that session's window is active
- Views their own attendance history and percentage per subject

**Teacher**
- Sees only subjects/classes they are assigned to
- Views attendance overall, per subject, per session, and per student
- Summary stats: attendance %, absentees, trends over time
- Filters: date range, subject, class/grade

## Domain model

| Entity | Key fields / notes |
|---|---|
| `Student` | belongs to one `Class`; enrolled in many `Subject`s |
| `Teacher` | assigned to many `Subject`s (optionally scoped per `Class`) |
| `Class` (grade/section) | groups students |
| `Subject` | taught by teacher(s); has enrollments |
| `Enrollment` | `Student` ↔ `Subject` join |
| `TeacherAssignment` | `Teacher` ↔ `Subject` (+ `Class`) join |
| `Session` | one scheduled meeting of a `Subject`: `startsAt`, `endsAt`, attendance window |
| `AttendanceRecord` | `studentId`, `sessionId`, `status`, `markedAt` timestamp, `createdAt`/`updatedAt` |

Relationships: `Subject 1—* Session 1—* AttendanceRecord *—1 Student`.

Attendance % per subject = present records ÷ sessions held (sessions whose window has closed) for that subject. Absence is derived from the *lack* of a record for a closed session unless we decide to persist explicit `absent` rows — decide this early and record it here.

## Non-negotiable constraints

These must be enforced **server-side**; UI hiding is never sufficient.

1. **Role isolation.** Student and teacher routes/APIs are disjoint. A student token must be rejected (403) by every teacher endpoint and vice versa. Put the check in shared middleware/guards, not ad hoc in handlers.
2. **Ownership scoping.** Students can only read/write their own records. Teachers can only read data for subjects/classes in their `TeacherAssignment`s. Scope at the query level (filter by the authenticated user's id), never by trusting an id passed from the client.
3. **Marking rules.** A student may create an `AttendanceRecord` only if: they are enrolled in the session's subject **and** the server's current time is within the session's attendance window. Use server time, never client time.
4. **No duplicates.** Enforce a DB-level unique constraint on `(studentId, sessionId)`. Application checks alone are not enough (race conditions). A duplicate attempt should return a clear conflict (409), not a 500.
5. **Timestamps.** Every attendance record stores when it was marked (UTC in storage; convert to school-local time only for display).
6. **Responsive.** Dashboard and student views must be usable on mobile and desktop.

Every change touching auth, scoping, or marking should include tests for the negative cases (wrong role, not enrolled, not assigned, outside window, duplicate).

## Tech stack — TBD

| Layer | Choice |
|---|---|
| Frontend | TBD |
| Backend / API | TBD |
| Database | TBD (must support unique constraints + transactions) |
| ORM / migrations | TBD |
| Auth | TBD (sessions or JWT; must carry role claim) |
| Charts (dashboard trends) | TBD |
| Testing | TBD (unit + integration + e2e) |
| Hosting / CI | TBD |

## Planned architecture (planned — not yet built)

```
/
├── frontend/            # web UI
│   └── src/
│       ├── features/
│       │   ├── student/     # login, subjects, mark attendance, history
│       │   └── teacher/     # login, dashboard, filters, drill-downs
│       ├── shared/          # UI components, api client, auth context
│       └── routes/          # role-guarded route definitions
├── backend/
│   └── src/
│       ├── auth/            # login per role, token/session, role guards
│       ├── modules/         # one per domain area: students, teachers,
│       │                    #   subjects, sessions, attendance, reports
│       │   └── <module>/    #   routes → service → repository
│       ├── db/              # schema, migrations, seeds
│       └── shared/          # errors, validation, time utils
└── tests/e2e/
```

- Layering: route/controller (validation, auth guard) → service (business rules like enrollment + window checks) → repository (DB access, ownership filters).
- API namespaces split by role, e.g. `/api/student/*` and `/api/teacher/*`, each behind its own role guard.
- Reporting/aggregation (percentages, trends) lives in a dedicated `reports` module and is computed in the DB where practical.

## Conventions

- **Naming:** DB tables/columns `snake_case`; code identifiers per language norm; entity names match the domain model table above.
- **Components:** feature-scoped folders; role-specific UI never imported across `student/` ↔ `teacher/`. Shared pieces go in `shared/`.
- **Errors:** services throw typed domain errors (e.g. `NotEnrolled`, `SessionClosed`, `DuplicateAttendance`, `Forbidden`); a single error handler maps them to HTTP status + a stable error code. No raw DB errors leak to clients.
- **Testing:** business rules and access control get integration tests against a real test database (the uniqueness constraint must be exercised for real). Dashboard math gets unit tests with fixed fixtures.
- **Time:** all time comparisons go through one shared clock utility so tests can freeze time.

## Git workflow

Defined in `.claude/branch-conventions.md`, `.claude/commit-conventions.md`, and `.claude/embla.json` (read those for full details):

- Main branch: `main`
- Feature: `s{sprint}/{jira-key}-{short-description}` · Bug: `s{sprint}/bug/{jira-key}-...` · Hotfix: `hotfix/{jira-key}-...` · Release: `release/s{sprint}`
- Commits: `{jira-key} {type}: {description}` (e.g. `AI-1562 feat: add session window check`), imperative, lowercase, ≤72 chars
- Test coverage target: 80%; PR size gate: ~300 lines

## Commands — TBD

Fill these in once the stack is chosen.

```bash
# Setup / install
TBD

# Run dev server(s)
TBD

# Build
TBD

# Test (all)
TBD

# Test (single file / single test)
TBD

# Lint / format / typecheck
TBD

# DB migrate / seed
TBD
```
