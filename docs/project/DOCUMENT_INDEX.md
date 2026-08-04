# Document Index

This file is the canonical location map for project Markdown documents. Agents must use these paths instead of recreating moved documents at the repository root.

## Root adapters

| Document | Location | Purpose |
|---|---|---|
| Repository overview | `README.md` | Human entry point, setup, workflow, and framework summary. |
| Canonical agent governance | `AGENTS.md` | Project-wide instructions automatically discovered by Codex-compatible agents. |
| Claude adapter | `CLAUDE.md` | Claude Code entry point that imports canonical governance. |

## Project and community documents

| Document | Location | Primary owner |
|---|---|---|
| Directory guide | `docs/project/PROJECT_STRUCTURE.md` | Documentation Engineer |
| Governance summary | `docs/project/GOVERNANCE.md` | Project Manager |
| Changelog | `docs/project/CHANGELOG.md` | Documentation Engineer |
| Contribution guide | `.github/CONTRIBUTING.md` | Documentation Engineer |
| Security policy | `.github/SECURITY.md` | Security Engineer |
| Support guide | `.github/SUPPORT.md` | Documentation Engineer |

## Planning and architecture

| Document | Location | Primary owner |
|---|---|---|
| Roadmap | `plans/ROADMAP.md` | Project Manager |
| Sprint summary | `plans/SPRINT.md` | Project Manager |
| Architecture summary | `docs/architecture/ARCHITECTURE.md` | Solution Architect |
| Architecture decisions | `docs/adr/` | Solution Architect |

## Review and delivery evidence

| Document | Location | Primary owner |
|---|---|---|
| Code review summary | `reports/code-review/REVIEW.md` | Independent Reviewer |
| Security report summary | `reports/security/SECURITY_REPORT.md` | Security Engineer |
| QA defect summary | `reports/qa/BUG_REPORT.md` | QA Engineer |
| Performance report summary | `reports/performance/PERFORMANCE_REPORT.md` | Performance Engineer |
| Release notes | `docs/releases/RELEASE_NOTES.md` | Documentation Engineer |

Detailed historical evidence belongs beside these summaries in the matching `plans/`, `reports/`, or `docs/` subdirectory.
