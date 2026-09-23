---
updated: 2026-09-23
---

> Structural UI approach per role — screens, layout shells, and the status-color convention. Visual identity itself is deferred.

## Foundation

Tailwind CSS + shadcn/ui (Radix primitives) for accessible, themeable building blocks rather than hand-rolled ARIA. Actual visual identity (palette, type, spacing) is deferred to implementation-time frontend-design passes — see [[decision-v1-scope-boundaries]] — this spec only fixes structure.

## Role-based layout shells

Each role gets its own nav/shell (`StudentLayout`, `TeacherLayout`, `AdminLayout`) — no shared nav surfaces all three roles' links, mirroring the backend's physical separation described in [[concept-role-isolation]].

## Screens per role

**Student** (mobile-first)
- Login
- Subjects home — enrolled subjects as cards with current attendance %
- Subject detail — sessions list with status badge (upcoming / open–mark now / closed), a prominent "Mark Present" action enabled only while the window is open
- History — past sessions with status, plus percentage

**Teacher** (desktop-first, responsive)
- Login
- Dashboard home — assigned subjects/classes with at-a-glance stats
- Subject report — date range + class filters, trend chart (Recharts), absentee list
- Session drill-down — roster of who marked present for a session
- Student drill-down — one student's history within a subject

**Admin**
- Login
- Management console — tabbed sections (Classes / Subjects / Students / Teachers / Enrollments / Assignments), each a table + modal create/edit form

## Status convention

Green = present, red = absent, amber = window open/pending — **always paired with a text label or icon, never color alone.**

## Responsive rule (non-negotiable)

Every screen is mobile-first with Tailwind breakpoints; the teacher's dense tables collapse to stacked cards below `md`.

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§9)
