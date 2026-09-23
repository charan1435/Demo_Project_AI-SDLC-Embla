# Wiki Log

Append-only record of all wiki operations. Each entry format:
`## [YYYY-MM-DD] <operation> | <title>`

Operations: `ingest`, `query`, `lint`

---

## [2026-09-23] ingest | Student Attendance System — Design Spec

Source: `wiki/raw/specs/2026-09-23-student-attendance-system-design.md` (approved design, pre-code).

Bootstrapped the wiki from this single source — 12 pages created:

- `overview-student-attendance-system` (hub page)
- `decision-absence-derived`, `decision-attendance-window`, `decision-passwordhash-per-role`, `decision-v1-scope-boundaries`
- `concept-role-isolation`, `concept-domain-model`, `concept-attendance-marking-flow`, `concept-reporting-aggregation`, `concept-api-surface`, `concept-testing-strategy`, `concept-ui-ux-approach`
- `entity-tech-stack`

Key takeaways: three physically-isolated role namespaces enforced at auth/routing/repository layers; absence is derived (never stored) and drives the reporting aggregate; attendance marking uses optimistic insert + DB unique constraint (not check-then-insert) for race safety; visual design and refresh-token rotation are explicitly deferred, not decided here.
