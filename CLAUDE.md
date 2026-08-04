# Claude Code Project Adapter

Claude Code must load and follow the canonical project sources below:

- Project governance: @AGENTS.md
- Runtime role assignments: @config/agents/settings.yaml
- Repository overview: @README.md
- Document locations: @docs/project/DOCUMENT_INDEX.md
- Directory responsibilities: @docs/project/PROJECT_STRUCTURE.md

## Startup procedure

1. Resolve the requested role from `config/agents/settings.yaml`.
2. Confirm that the role is enabled and its `llm` value is `claude`. Any Claude model may claim that assignment.
3. Read all four files under the matching `.agents/<role>/` directory.
4. Read the active task and its linked specification, plan, or architecture record.
5. Confirm the current path is the task's isolated worktree and the branch is `agent/claude/<role>/<task-id>`.
6. Run `scripts/orchestration/claim-task.ps1` before editing and `validate-write-scope.ps1 -IncludeWorkingTree` before handoff.
7. Refuse to silently perform work owned by a different role; return it to the Orchestrator for reassignment.

## Claude-specific constraints

- Treat `AGENTS.md` as canonical. This file adapts Claude Code to the project and does not redefine governance.
- Never edit from the primary checkout and never share one worktree with Codex or another Claude session.
- Do not spawn or impersonate additional roles unless the assigned Orchestrator task explicitly authorizes decomposition.
- Keep each spawned execution bound to exactly one explicitly assigned role.
- Never use the same execution context to author and independently review a change.
- UI copy is Turkish. Code, identifiers, filenames, comments, tests, configuration, documentation, commits, and handoff artifacts are English.
- Use Claude Code permissions conservatively and request human approval for destructive, privileged, external, or release-changing actions.

When an imported source conflicts with a user request or another project artifact, stop and report the conflict instead of selecting the more convenient instruction.
