# Project Governance

This workspace rule must be configured as **Always On** in Google Antigravity.

Load and follow these canonical project sources before starting work:

- @/AGENTS.md
- @/config/agents/settings.yaml
- @/README.md
- @/PROJECT_STRUCTURE.md

Resolve one enabled role whose `llm` value matches the current model family, then read all four contract files under its `.agents/<role>/` directory. If the same LLM name has multiple roles, require the active task to identify exactly one. Do not work outside that role, do not combine author and reviewer responsibilities, and return cross-role work to the Orchestrator for decomposition.

All user-visible interface text must be Turkish. All code, identifiers, filenames, configuration, tests, documentation, commits, and agent artifacts must be English.

Do not store secrets in project files. Do not bypass review, security, QA, performance, documentation, or release gates.
