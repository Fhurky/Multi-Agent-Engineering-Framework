---
task_id: TASK-001
title: Decompose the autonomous multi-agent runtime
status: review
owner_role: orchestrator
llm: claude
branch: agent/claude/orchestrator/task-001
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-orchestrator-task-001
write_scope:
  - tasks/**
dependencies: []
required_gates:
  - review
---

# TASK-001: Decompose the autonomous multi-agent runtime

## Objective

Create an executable dependency-ordered task graph for a single-command autonomous supervisor that can start, gracefully pause, checkpoint, resume, and complete multi-agent project runs.

## Scope

- Create a Solution Architect task for the runtime architecture and ADRs.
- Create blocked Runtime Engineer tasks for supervisor, durable state, provider adapters, scheduling, lifecycle control, and recovery.
- Create independent Reviewer, Security, QA, and Performance tasks with explicit dependencies.
- Require deterministic task state transitions, bounded concurrency, leases, fencing tokens, idempotent retries, and durable checkpoints.
- Require a one-input project bootstrap that automatically creates the initial Manager task.
- Exclude architecture authorship, runtime implementation, independent approval, and release.

## Acceptance criteria

- [x] Every child task has one owner, one LLM family, explicit dependencies, acceptance criteria, gates, artifacts, branch, worktree, and non-overlapping write scope.
- [x] Architecture completes before runtime implementation starts.
- [x] Runtime implementation tasks can proceed in parallel only when their write scopes do not overlap.
- [x] Review, Security, QA, and Performance run in separate execution contexts after their dependencies are ready.
- [x] Start, graceful drain, checkpoint, pause, resume, completion, timeout, crash recovery, and retry behavior are covered.
- [x] The task graph includes an explicit path from implementation findings back to the responsible author.

## Expected artifacts

- Architecture task record assigned to `architect` / `claude`.
- Runtime implementation task records assigned to `runtime` / `claude`.
- Independent validation task records assigned to their configured LLM families.
- Durable handoff notes identifying dependency order and next owners.

## Produced task graph

| Task | Owner role | LLM | Depends on | Initial state |
|---|---|---|---|---|
| TASK-002 Runtime architecture and ADRs | architect | claude | — | ready |
| TASK-003 Durable run state and checkpoints | runtime | claude | TASK-002 | blocked |
| TASK-004 Provider adapters and agent workers | runtime | claude | TASK-002 | blocked |
| TASK-005 Scheduling, leases, fencing, bounded concurrency | runtime | claude | TASK-002, TASK-003 | blocked |
| TASK-006 Supervisor core and state machine | runtime | claude | TASK-002, TASK-003, TASK-005 | blocked |
| TASK-007 Lifecycle control and one-input bootstrap | runtime | claude | TASK-002, TASK-006 | blocked |
| TASK-008 Crash recovery, timeouts, idempotent retries | runtime | claude | TASK-002, TASK-003, TASK-006 | blocked |
| TASK-009 Independent code review | reviewer | gpt | TASK-003 … TASK-008 | blocked |
| TASK-010 Security review | security | gpt | TASK-003 … TASK-008 | blocked |
| TASK-011 QA validation | qa | gemini | TASK-007, TASK-008 | blocked |
| TASK-012 Performance validation | performance | gemini | TASK-005, TASK-006, TASK-008, TASK-011 | blocked |
| TASK-013 Remediation routing and gate closure | orchestrator | claude | TASK-009 … TASK-012 | blocked |
| TASK-014 Independent review of this decomposition | reviewer | gpt | TASK-001 | ready |

Dependency order, the write-scope partition, the required-behavior coverage matrix, and the findings return path are recorded in `tasks/TASK-001-DEPENDENCY-GRAPH.md`.

## Review gate

This task declares `required_gates: [review]`. That gate is owned by `tasks/ready/TASK-014-independent-review-of-the-task-001-decomposition.md`, assigned to `reviewer` / `gpt` on branch `agent/gpt/reviewer/task-014`, producing `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`. TASK-014 was created by a corrective Orchestrator follow-up after the gate was found to have no dedicated Reviewer task record. TASK-001 may not move to `tasks/done/` until TASK-014 records its verdict, and the Claude Orchestrator that authored this decomposition may not close that gate itself.

## Handoff

- Commit or pull request: recorded on branch `agent/claude/orchestrator/task-001`; no push or merge performed by this execution.
- Verification: `scripts/orchestration/claim-task.ps1 -TaskId TASK-001 -Role orchestrator -Llm claude` succeeded and the lock was held for the whole edit. `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef governance/autonomous-runtime-bootstrap` reported `valid = true` with all changed paths inside `tasks/**`. Each child record was checked for a single owner, a single LLM family, an explicit dependency list, acceptance criteria, gates, artifacts, branch, worktree, and a write scope that is a subset of its role's configured scope in `config/agents/settings.yaml` and disjoint from every other child task.
- Known risks:
  - TASK-003 through TASK-008 share module contracts they cannot negotiate at execution time because each owns a disjoint subtree and none may edit `src/shared/`. TASK-002 must publish those interface contracts before Wave 2 starts, or the Orchestrator must route a separate shared-contract task.
  - TASK-013 holds `tasks/**`, the same scope as TASK-001. Only one of them may be active at a time.
  - The validation tasks depend on `gpt` and `gemini` assignments being available; if a family is unavailable, the affected gate must be reassigned by the user before the wave starts, since an author may not review their own change.
  - Runtime task write scopes assume directories such as `src/orchestrator/state/` that do not exist yet; the owning task creates them.
  - TASK-014 writes `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`, which is nominally inside the broader `reports/code-review/**` scope held by TASK-009. The two are separated by sequencing rather than by disjoint paths: TASK-014 runs now, TASK-009 stays blocked until TASK-003 through TASK-008 complete. If the user prefers a purely path-based partition, TASK-009's scope must be narrowed by a separate Orchestrator task.
- Next owner: reviewer for TASK-014, the independent review gate on this decomposition; architect for TASK-002, which does not depend on that gate.
