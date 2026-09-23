---
updated: 2026-09-23
---

> Decision C: `passwordHash` lives directly on `Admin`, `Teacher`, and `Student` — never on a shared `users` table with a role discriminator column.

## The decision

Each of the three role tables (`Admin`, `Teacher`, `Student`) has its own `email` (unique) and `passwordHash` columns. There is no unified `users` table with a `role` enum column.

## Why

Role identity becomes **intrinsic to which table a record lives in**, never a value stored in a field. A field-based discriminator is spoofable (a bug or a malicious write could flip `role: student` to `role: admin`); a table-based split structurally cannot be. This is the foundation [[concept-role-isolation]] is built on.

## Consequences

- Three separate login endpoints, each querying only its own table — a student's email can never authenticate as a teacher or admin, because the teacher/admin login handlers never look at the `Student` table at all.
- No cross-role email uniqueness is enforced (a person could in principle have the same email as both a student and a teacher row) — not addressed in the spec, worth flagging if it comes up during implementation.
- Any future "one person, multiple roles" feature would require real modeling work, not just a role-field change.

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§3, Decision C; §6)
