---
updated: 2026-09-23
---

> The locked technology choices for the attendance system — frontend, backend, data, auth, testing, and hosting.

## Stack table

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript, React Router, TanStack Query, Tailwind CSS + shadcn/ui (Radix primitives) |
| Backend / API | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM / migrations | Prisma |
| Auth | JWT (`{ id, role }` claim only) in an httpOnly, Secure cookie; ~8 hour expiry; no refresh-token rotation in v1 |
| Charts | Recharts |
| Testing | Vitest + Supertest (backend, real test Postgres), React Testing Library (frontend components), Playwright (e2e) |
| Hosting / CI | Frontend on Vercel; backend on Render/Railway; managed Postgres (Neon/Supabase); CI on Bitbucket Pipelines |

## Repo layout

Two separately deployable apps plus a top-level test suite:

```
frontend/src/{features/{student,teacher,admin}, shared, routes}
backend/src/{auth, modules/{students,teachers,classes,subjects,enrollments,assignments,sessions,attendance,admin,reports}, db, shared}
tests/{backend, frontend, e2e}
```

Each backend module follows `routes.ts → service.ts → repository.ts`. Team background is JavaScript/TypeScript full-stack, which the stack choice reflects throughout (no polyglot pieces).

## Why these choices matter elsewhere

- Prisma's typed unique-constraint violation (`P2002`) is the mechanism [[concept-attendance-marking-flow]] relies on for race-safe duplicate detection.
- Recharts renders the trend chart described in [[concept-reporting-aggregation]].
- The shared `clock` utility (under `backend/src/shared/`) is what makes the window check in [[concept-attendance-marking-flow]] freezable in tests.
- Zod is the validation library named for the backend `shared/` folder (request validation → `VALIDATION_ERROR`, see [[concept-api-surface]]).

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§4, §5)
