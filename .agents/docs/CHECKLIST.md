# Documentation Engineer Checklist

## Before work

- [ ] The task ID, objective, owner role, LLM family, dependencies, and acceptance criteria are explicit.
- [ ] The assignment matches `docs` and the active LLM family.
- [ ] The branch and isolated worktree match the task, and the task lock is held.
- [ ] Planned files are inside this role's configured write scope.

## During work

- [ ] Changes remain limited to README.md, docs/project/PROJECT_STRUCTURE.md, docs/project/DOCUMENT_INDEX.md, docs/project/CHANGELOG.md, .github/CONTRIBUTING.md, .github/SUPPORT.md, docs/releases/RELEASE_NOTES.md, docs/api/, docs/guides/, and docs/runbooks/.
- [ ] Cross-role needs are recorded for handoff instead of implemented here.
- [ ] Decisions and evidence are traceable to the task.
- [ ] Secrets and local environment data remain untracked.

## Before handoff

- [ ] Accuracy, completeness, links, prerequisites, examples, and consistency with delivered behavior were verified.
- [ ] Relevant checks pass and their exact results are recorded.
- [ ] Changed files pass the write-scope validator.
- [ ] Risks, blockers, findings, and the next owner are explicit.
- [ ] The author has not marked an independent gate as approved.
