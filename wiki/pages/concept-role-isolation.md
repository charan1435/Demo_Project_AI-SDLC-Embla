---
updated: 2026-09-23
---

> How student/teacher/admin separation is enforced physically, end-to-end — not just hidden in the UI.

## The principle

UI hiding is never sufficient; every isolation rule is enforced server-side. This threads through auth, routing, and data access.

## Auth layer

Three separate login endpoints, each querying only its own table (enabled by [[decision-passwordhash-per-role]]):

- `POST /api/student/auth/login`
- `POST /api/teacher/auth/login`
- `POST /api/admin/auth/login`

Passwords hashed with bcrypt (cost factor 12). All three return an **identical generic 401** on failure, regardless of whether the email exists — avoids user enumeration.

JWT payload is minimal: `{ id, role }`, no PII. Stored in an httpOnly, Secure cookie (`SameSite=Lax`, or `None` if frontend/backend end up on different top-level domains), ~8 hour expiry, no refresh-token rotation in v1 (see [[decision-v1-scope-boundaries]]). Logout just clears the cookie — no server-side token blacklist at this scale.

## Routing layer

API namespaces `/api/student/*`, `/api/teacher/*`, `/api/admin/*`, each mounted behind its own `requireRole('student' | 'teacher' | 'admin')` middleware — mounted **before any route handler runs**. A valid JWT for the wrong role gets a 403 at the middleware layer, never inside a handler.

## Data access layer

Ownership scoping happens in the **repository layer**, using `req.user.id` from the verified JWT. A client-supplied id in the request body/params is never trusted for "whose data is this."

- Students: can only read/write their own records.
- Teachers: can only read data for subjects/classes present in their own `TeacherAssignment` rows.

## Frontend mirror

`frontend/src/features/{student,teacher,admin}/` are separate silos with **no cross-imports** between them; shared UI lives in `shared/`. Each role gets its own layout shell (`StudentLayout`, `TeacherLayout`, `AdminLayout`) — no shared nav surfaces all three roles' links.

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§2, §4, §6)
