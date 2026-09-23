# CLAUDE.md — frontend

Scope: `frontend/` only. Read the root `CLAUDE.md` first for domain model, auth rules, and cross-cutting conventions — this file covers frontend-specific structure and commands.

> **Status: design finalized, pre-code.** No `package.json` or `src/` exists yet. This is the target layout and stack per `docs/superpowers/specs/2026-09-23-student-attendance-system-design.md` §4/§9 — build to match it, and delete this notice once the app is scaffolded.

## Stack

React + Vite + TypeScript, React Router, TanStack Query, Tailwind CSS + shadcn/ui (Radix primitives), Recharts for charts.

## Structure

```
frontend/src/
├── features/
│   ├── student/   # login, subjects, mark attendance, history
│   ├── teacher/   # login, dashboard, filters, drill-downs
│   └── admin/     # login, manage students/teachers/classes/subjects/enrollments
├── shared/        # UI components, api client, auth context
└── routes/        # role-guarded route definitions
```

- **No cross-imports between role features.** `student/` never imports from `teacher/` or `admin/` and vice versa — this mirrors the backend's physical role separation. Shared pieces (buttons, layout primitives, the API client, auth context) live in `shared/` only.
- Each role gets its own layout shell — `StudentLayout`, `TeacherLayout`, `AdminLayout` — no shared nav surfaces all three roles' links.
- The API client in `shared/` calls role-namespaced endpoints (`/api/student/*`, `/api/teacher/*`, `/api/admin/*`) with `credentials: 'include'` — auth is an httpOnly cookie set by the backend, the frontend never touches the JWT directly.

## Screens per role

**Student** (mobile-first)
- Login
- Subjects home — enrolled subjects as cards with current attendance %
- Subject detail — sessions list with status badge (upcoming / open — mark now / closed), a prominent "Mark Present" action enabled only while the window is open
- History — past sessions with status, plus the percentage

**Teacher** (desktop-first, responsive)
- Login
- Dashboard home — assigned subjects/classes with at-a-glance stats
- Subject report — date range + class filters, trend chart (Recharts), absentee list
- Session drill-down — roster of who marked present for a session
- Student drill-down — one student's history within a subject

**Admin**
- Login
- Management console — tabbed sections (Classes / Subjects / Students / Teachers / Enrollments / Assignments), each a table + modal create/edit form

## Design process

- Before building a new screen or reshaping an existing one, invoke the `frontend-design` skill for aesthetic direction, typography, and layout choices — don't default to generic Tailwind/shadcn defaults without a deliberate pass.
- For UI mockups/visual exploration ahead of implementation (e.g. validating a dashboard layout before wiring up real components), use Claude's Design artifact (`/design` or the Artifact tool's design quickstart). Treat it as a throwaway prototype, not the source of truth — the shadcn/ui + Tailwind implementation in `src/` is what ships.

## UI conventions

- Foundation: Tailwind + shadcn/ui for accessible, themeable building blocks rather than hand-rolled ARIA. Visual identity (palette, type, spacing) is a separate implementation-time design pass, not fixed by this file.
- **Status convention:** green = present, red = absent, amber = window open/pending — always paired with a text label or icon, never color alone.
- **Responsive rule (non-negotiable):** every screen mobile-first with Tailwind breakpoints; teacher's dense tables collapse to stacked cards below `md`.
- A 409 from `POST /api/student/sessions/:sessionId/attendance` means "already marked present" — render it as that state, not an error banner (see root `CLAUDE.md` non-negotiable constraint #4 and `backend/CLAUDE.md` error mapping).

## Testing

Component tests live in `tests/frontend/` (React Testing Library), not colocated under `src/` — see `tests/CLAUDE.md`. Cross-role e2e flows (login, mark-attendance → visible-in-teacher-dashboard) live in `tests/e2e/` (Playwright) and are not this directory's concern.

## Commands

Not yet real — no `package.json` exists. Expected once scaffolded:

```bash
npm install
npm run dev          # Vite dev server
npm run build
npm run test          # Vitest + RTL, tests/frontend/
npm run lint
npm run typecheck
```
