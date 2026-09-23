# Student Attendance System

A web-based student attendance system for a real school deployment (single school, hundreds to low-thousands of students, cloud-hosted).

## Development wiki

This repo uses Karpathy's LLM Wiki pattern as its development knowledge base.
See `wiki/CLAUDE.md` for the full wiki schema and operating instructions.

Quick reference:
- Drop new notes/decisions into `wiki/raw/` and ask Claude to ingest them
- Ask questions — Claude consults `wiki/pages/` and cites sources
- Run lint periodically: "lint the wiki"
- `wiki/raw/` is read-only. Never modify files there.
- `wiki/pages/` is LLM-owned. Only Claude writes there.

## Design specs

When brainstorming or designing a feature, save the spec to:

```
wiki/raw/specs/YYYY-MM-DD-<topic>-design.md
```

## Repository structure

```
wiki/raw/         ← source documents (immutable)
wiki/raw/specs/   ← design specs
wiki/raw/assets/  ← downloaded images
wiki/pages/       ← LLM-generated wiki pages
wiki/index.md     ← page registry
wiki/log.md       ← change log
```
