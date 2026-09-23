# Commit Message Conventions

## Format
{jira-key} {type}: {description}

## Example
AI-1562 feat: add PyMuPDF extractor

## Commit Types
| Type       | When to use                                              |
|------------|----------------------------------------------------------|
| feat       | New feature or user-facing functionality                 |
| fix        | Bug fix                                                  |
| docs       | Documentation only                                       |
| refactor   | Code change that neither fixes a bug nor adds a feature  |
| test       | Adding or updating tests                                 |
| chore      | Build, tooling, dependency updates                       |
| style      | Formatting, whitespace (no logic change)                 |
| perf       | Performance improvement                                  |
| ci         | CI/CD pipeline changes                                   |

## Rules
- Use imperative mood: "add login endpoint" not "added" or "adds"
- Lowercase first letter, no period at the end
- Keep the description under 72 characters
- Include the Jira key when the commit closes or progresses a ticket
