---
updated: 2026-09-23
---

> The test pyramid for the attendance system and why mocks aren't enough for some of it.

## Layers

- **Vitest** — backend unit tests for pure logic (window checks, error mapping).
- **Supertest + real local Postgres** (docker-compose test DB) — integration tests for anything touching auth, scoping, marking, or uniqueness. Explicitly: **mocks are not sufficient** for exercising the DB-level `@@unique` constraint that [[concept-attendance-marking-flow]] depends on for race-safe duplicate detection.
- **React Testing Library** — frontend component tests.
- **Playwright** — e2e: all three role login flows, and the full mark-attendance → visible-in-teacher-dashboard path.

## Coverage target

80% (per root `CLAUDE.md` / `.claude/embla.json` `testCoverageThreshold`).

## Mandatory negative-case coverage

Every change touching auth, scoping, or marking needs tests for the negative cases: wrong role, not enrolled, not assigned, outside window, duplicate. The full required list for the marking endpoint specifically is detailed in [[concept-attendance-marking-flow]], including the true-race `Promise.all` concurrent-insert test.

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§8, §11)
