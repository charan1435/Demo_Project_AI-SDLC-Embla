# CLAUDE.md — tests

Scope: `tests/` only. Read the root `CLAUDE.md` first for non-negotiable constraints (role isolation, ownership scoping, marking rules, no duplicates) — every one of those needs a negative-path test somewhere in this tree.

> **Status: design finalized, pre-code.** No test files exist yet. This is the target layout per `docs/superpowers/specs/2026-09-23-student-attendance-system-design.md` §4/§11 — build to match it, and delete this notice once tests are scaffolded.

## Structure

```
tests/
├── backend/    # Vitest unit + Supertest integration, real test Postgres
├── frontend/   # React Testing Library component tests
└── e2e/        # Playwright, cross-role flows
```

## Backend tests (`tests/backend/`)

- **Unit (Vitest):** pure logic only — window checks, error mapping, aggregate query shape. No DB.
- **Integration (Supertest):** against a real local Postgres (docker-compose test DB), required for anything touching auth, scoping, marking, or uniqueness. **Mocks are not sufficient** — the `(studentId, sessionId)` DB-level unique constraint must be exercised for real, including a true concurrency test.
- **Required coverage for the attendance-marking flow** (`POST /api/student/sessions/:sessionId/attendance`):
  - Wrong role → 403
  - Not enrolled → 403 `NOT_ENROLLED`
  - Before window opens → 400 `SESSION_CLOSED`
  - After window closes → 400 `SESSION_CLOSED`
  - Duplicate submit (sequential) → 409 `DUPLICATE_ATTENDANCE`
  - True race: two concurrent inserts via `Promise.all` for the same `(studentId, sessionId)` → exactly one succeeds, the other gets 409
- Any other change touching auth, scoping, or marking needs the same shape of negative-case coverage (wrong role, not enrolled/assigned, outside window, duplicate).

## Frontend tests (`tests/frontend/`)

React Testing Library, component-level. Dashboard/report math gets unit tests with fixed fixtures rather than re-deriving percentages in the component test itself.

## E2E tests (`tests/e2e/`)

Playwright. Must cover:
- All three login flows (student, teacher, admin) — including wrong-role rejection.
- The full mark-attendance → visible-in-teacher-dashboard path, cross-role.

## Coverage target

80% (per root `CLAUDE.md` and `.claude/embla.json` `testCoverageThreshold`). PR size gate: ~300 lines.

## Commands

Not yet real — no test runner config exists. Expected once scaffolded:

```bash
docker-compose up -d              # start local test Postgres for backend integration tests
npm run test:backend              # Vitest + Supertest, from tests/backend/ or backend/
npm run test:frontend             # Vitest + RTL, from tests/frontend/ or frontend/
npx playwright test                # e2e, from tests/e2e/
npx playwright test path/to/spec.spec.ts   # single e2e spec
```
