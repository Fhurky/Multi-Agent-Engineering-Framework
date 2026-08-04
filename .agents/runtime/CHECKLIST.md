# Agent Runtime Engineer Checklist

## Before work

- [ ] The task ID, objective, owner role, LLM family, dependencies, and acceptance criteria are explicit.
- [ ] The assignment matches `runtime` and the active LLM family.
- [ ] An approved architecture defines scheduler, state, lease, provider, and failure-handling boundaries.
- [ ] The branch and isolated worktree match the task, and the task lock is held.
- [ ] Planned files are inside this role's configured write scope.

## During work

- [ ] Changes remain limited to src/orchestrator/, src/agents/, bin/, tests/unit/orchestrator/, and tests/unit/agents/.
- [ ] Task claims and state transitions remain atomic and idempotent.
- [ ] Concurrency, retry, timeout, and provider-failure behavior is bounded and observable.
- [ ] Cross-role needs are recorded for handoff instead of implemented here.
- [ ] Secrets, credentials, task content, and provider output are handled safely.

## Before handoff

- [ ] Scheduling, lease recovery, retries, provider failure handling, and result aggregation were verified.
- [ ] Relevant checks pass and their exact results are recorded.
- [ ] Changed files pass the write-scope validator.
- [ ] Risks, blockers, findings, and the next owner are explicit.
- [ ] The author has not marked an independent gate as approved.
