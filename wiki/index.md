# Student Attendance System Wiki Index

Central catalog of all pages in `wiki/pages/`. Updated by the LLM on every ingest.

---

## Decisions

- [[decision-absence-derived]] — absence is never stored, only derived from a missing record after window close. _(2026-09-23)_
- [[decision-attendance-window]] — v1's marking window *is* the session's start/end, no separate field. _(2026-09-23)_
- [[decision-passwordhash-per-role]] — credentials live per-role-table, never a shared `users` table with a role field. _(2026-09-23)_
- [[decision-v1-scope-boundaries]] — what's deferred-with-trigger vs. fully out of scope for v1. _(2026-09-23)_

## Concepts

- [[concept-role-isolation]] — how student/teacher/admin separation is enforced physically at auth, routing, and data layers. _(2026-09-23)_
- [[concept-domain-model]] — entities, relationships, and notable modeling choices from the Prisma schema sketch. _(2026-09-23)_
- [[concept-attendance-marking-flow]] — the "Mark Present" request lifecycle, race-safe duplicate handling, required tests. _(2026-09-23)_
- [[concept-reporting-aggregation]] — the single SQL aggregate behind attendance %, absentee lists, and trends. _(2026-09-23)_
- [[concept-api-surface]] — full endpoint list per role namespace plus the domain-error-to-HTTP mapping. _(2026-09-23)_
- [[concept-testing-strategy]] — test pyramid, coverage target, mandatory negative-case testing. _(2026-09-23)_
- [[concept-ui-ux-approach]] — screens per role, layout shells, status-color convention. _(2026-09-23)_

## Entities

- [[entity-tech-stack]] — locked stack choices (frontend, backend, DB, auth, testing, hosting) and repo layout. _(2026-09-23)_

## Comparisons

_No pages yet._

## Overviews

- [[overview-student-attendance-system]] — high-level synthesis; start here. _(2026-09-23)_
