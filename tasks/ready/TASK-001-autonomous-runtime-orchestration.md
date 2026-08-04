---
task_id: TASK-001
title: Decompose the autonomous multi-agent runtime
status: ready
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

- [ ] Every child task has one owner, one LLM family, explicit dependencies, acceptance criteria, gates, artifacts, branch, worktree, and non-overlapping write scope.
- [ ] Architecture completes before runtime implementation starts.
- [ ] Runtime implementation tasks can proceed in parallel only when their write scopes do not overlap.
- [ ] Review, Security, QA, and Performance run in separate execution contexts after their dependencies are ready.
- [ ] Start, graceful drain, checkpoint, pause, resume, completion, timeout, crash recovery, and retry behavior are covered.
- [ ] The task graph includes an explicit path from implementation findings back to the responsible author.

## Expected artifacts

- Architecture task record assigned to `architect` / `claude`.
- Runtime implementation task records assigned to `runtime` / `claude`.
- Independent validation task records assigned to their configured LLM families.
- Durable handoff notes identifying dependency order and next owners.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: architect
