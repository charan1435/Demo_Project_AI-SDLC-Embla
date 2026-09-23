---
updated: 2026-09-23
---

> High-level synthesis of the Student Attendance System: what it is, who uses it, and how the pieces fit together.

## What it is

A web-based attendance system for a **single real school deployment** (hundreds to low-thousands of students, cloud-hosted) — not a demo-only build. Students self-mark attendance with a "Mark Present" button during an active session window (v1: no QR/PIN/geofencing). Teachers get a dashboard for tracking. Admins provision all underlying data via in-app CRUD.

Repo: `github.com/charan1435/Demo_Project_AI-SDLC-Embla` · Jira project `AI` (board 19) on emblarnd.atlassian.net.

## The three roles

Each role has a **fully separate login flow** — not a toggle on one form. See [[concept-role-isolation]] for how this is enforced end-to-end.

- **Student** — sees only enrolled subjects; marks attendance only while a session window is open; views own history/percentage.
- **Teacher** — sees only assigned subjects/classes; dashboard with stats, filters, drill-downs.
- **Admin** — CRUD-provisions students, teachers, classes, subjects, enrollments, assignments.

## Core architecture

Two separately deployable apps (React/Vite frontend, Node/Express backend) over HTTP, sharing a Postgres DB via Prisma. See [[entity-tech-stack]] for the full stack and [[concept-domain-model]] for the schema.

Layering is uniform across every backend module, including admin: **route (validation, role guard) → service (business rules) → repository (DB access, ownership filters)**.

## Key design decisions

Three decisions are treated as settled and shouldn't be relitigated without updating the source spec:

- [[decision-absence-derived]] — absence is computed, never stored as a row.
- [[decision-attendance-window]] — the marking window *is* the session's start/end, no separate field.
- [[decision-passwordhash-per-role]] — no shared `users` table; each role table owns its own credentials.

## Core flows

- [[concept-attendance-marking-flow]] — how a student's "Mark Present" click is validated and persisted (optimistic insert, not check-then-insert).
- [[concept-reporting-aggregation]] — how attendance % / trends / absentee lists are computed.
- [[concept-api-surface]] — the full endpoint list and error-code mapping.
- [[concept-ui-ux-approach]] — screens per role, layout shells, status color convention.
- [[concept-testing-strategy]] — test layers and the mandatory negative-case coverage for the marking flow.

## Scope

See [[decision-v1-scope-boundaries]] for what's explicitly deferred vs. out of scope for v1.

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md`
