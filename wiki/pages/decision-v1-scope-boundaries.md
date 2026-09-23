---
updated: 2026-09-23
---

> What's explicitly deferred to implementation time vs. fully out of scope for v1 — the boundary to check before adding "just one more thing."

## Deferred to implementation time (will happen, just not now)

- **Visual design** — actual mockups (3 options to choose from) generated via the frontend-design skill, scoped per UI-related Jira epic/story. This spec fixes structure only; see [[concept-ui-ux-approach]].
- **Refresh-token rotation** — if the 8-hour re-login (see [[concept-role-isolation]]) proves too disruptive in practice.
- **Splitting `Session` window from class meeting time** — if a school wants a marking window shorter than the full class period. See [[decision-attendance-window]].

## Out of scope for v1 (not planned at all right now)

- QR code / PIN / geofenced attendance marking — v1 is button-click only.
- Multi-school / multi-tenant support — this is a single-school deployment.
- CSV import or external identity system for provisioning — admin does it via in-app CRUD only.
- Explicit `ABSENT` record persistence — derived instead, see [[decision-absence-derived]].

## Why this distinction matters

"Deferred" items are acknowledged future work with a stated trigger condition (e.g. "if 8-hour re-login proves disruptive"). "Out of scope" items aren't planned and would need a fresh design decision, not just a follow-up ticket, before being built.

## Sources

- `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (§13, §14)
