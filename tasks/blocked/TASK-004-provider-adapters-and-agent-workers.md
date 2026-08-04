---
task_id: TASK-004
title: Implement provider adapters and agent worker execution
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-004
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-004
write_scope:
  - src/agents/**
  - tests/unit/agents/**
dependencies:
  - TASK-002
required_gates:
  - review
  - security
  - qa
parent_task: TASK-001
blocked_reason: The provider adapter interface and error taxonomy are not approved yet.
exit_condition: TASK-002 passes its review gate and its provider adapter contract is recorded.
---

# TASK-004: Implement provider adapters and agent worker execution

## Objective

Implement the provider-neutral agent worker execution path and the concrete provider adapters, so the supervisor can dispatch a task to an LLM family without embedding provider-specific behavior.

## Scope

- Implement the provider adapter interface defined by TASK-002 and the adapter registry keyed by LLM family name.
- Implement the agent worker that resolves a role assignment, builds the invocation from role contracts and the task record, executes the provider call, and returns a structured result.
- Implement the error taxonomy that classifies failures as retryable, non-retryable, or requiring escalation, so TASK-008 can act on classification instead of raw provider errors.
- Implement worker-level timeout signalling so an unresponsive provider surfaces a timeout classification rather than blocking indefinitely.
- Read credentials only from environment variables or an injected secret provider, and never persist, log, or checkpoint credential values.
- Provide unit tests using fake adapters, with no real network calls.
- Exclude scheduling, concurrency limits, lease management, durable state writes, retry orchestration, and lifecycle commands.

## Acceptance criteria

- [ ] Adding a provider requires only a new adapter registration and no change to supervisor or scheduler modules.
- [ ] A worker result is a structured value that carries the outcome, the error classification when present, and the identifiers needed for result aggregation.
- [ ] Every provider failure maps to exactly one taxonomy class, and unknown failures default to the safest non-retryable class.
- [ ] Provider timeouts are surfaced as a timeout classification within the configured bound.
- [ ] Credentials are never written to state, checkpoints, logs, or test fixtures.
- [ ] Unit tests cover adapter dispatch, error classification, timeout signalling, and worker result shape using fakes only.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Provider adapters and worker execution under `src/agents/`.
- Unit tests under `tests/unit/agents/`.

## Dependency notes

- Depends on TASK-002 for the adapter interface and error taxonomy.
- May execute in parallel with TASK-003; their write scopes do not overlap.
- Consumed by TASK-005 and TASK-008.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator, to route the change into TASK-009 and TASK-010
