# Project Governance

This workspace rule must be configured as **Always On** in Google Antigravity.

Load and follow these canonical project sources before starting work:

- @/AGENTS.md
- @/config/agents/settings.yaml
- @/README.md
- @/docs/project/DOCUMENT_INDEX.md
- @/docs/project/PROJECT_STRUCTURE.md

Resolve one enabled role whose `llm` value matches the current model family, then read all four contract files under its `.agents/<role>/` directory. If the same LLM name has multiple roles, require the active task to identify exactly one. Do not work outside that role, do not combine author and reviewer responsibilities, and return cross-role work to the Orchestrator for decomposition.

Never edit from the primary checkout or share a working directory with another CLI session. Use `scripts/orchestration/create-worktree.ps1` to create the task branch and isolated worktree, run `claim-task.ps1` before editing, and run `validate-write-scope.ps1 -IncludeWorkingTree` before handoff. The branch must follow `agent/<llm>/<role>/<task-id>`.

All user-visible interface text must be Turkish. All code, identifiers, filenames, configuration, tests, documentation, commits, and agent artifacts must be English.

Do not store secrets in project files. Do not bypass review, security, QA, performance, documentation, or release gates.
