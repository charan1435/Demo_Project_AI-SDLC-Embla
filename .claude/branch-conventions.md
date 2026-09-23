# Branch Naming Conventions

## Master Branch
Production-ready branch: main

## Feature Branch
Format:  s{sprint}/{jira-key}-{short-description}
Example: s29/AI-1561-pdf-agent-service

## Bug Fix Branch
Format:  s{sprint}/bug/{jira-key}-{short-description}
Example: s29/bug/AI-1580-null-response-on-extract

## Hotfix Branch
Format:  hotfix/{jira-key}-{short-description}
Example: hotfix/AI-1600-schema-passthrough-crash

## Release Branch
Format:  release/s{sprint}
Example: release/s29

---

## Short Description Rules
- Use kebab-case (lowercase, hyphen-separated)
- 3–5 words maximum
- Describe the feature/fix, not the ticket
- No special characters, no spaces

## Sprint Number
Infer from current branch (e.g. s29/AI-1561-... → sprint s29), or from the active sprint on Jira board 19 ("AI Sprint {number}"). Ask developer if unclear.
