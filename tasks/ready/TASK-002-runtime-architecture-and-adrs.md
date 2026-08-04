---
task_id: TASK-002
title: Define the autonomous runtime architecture and decision records
status: ready
owner_role: architect
llm: claude
branch: agent/claude/architect/task-002
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-architect-task-002
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/**
  - docs/adr/**
  - diagrams/architecture/**
dependencies: []
required_gates:
  - review
parent_task: TASK-001
---

# TASK-002: Define the autonomous runtime architecture and decision records

## Objective

Produce the approved architecture and decision records for a single-command autonomous supervisor that starts, gracefully pauses, checkpoints, resumes, recovers, and completes multi-agent project runs, so that runtime implementation can proceed against stable contracts.

## Scope

- Define the runtime component boundaries for supervisor, durable state store, scheduler, provider adapters, lifecycle control, and recovery, and map each boundary to exactly one implementation task among TASK-003 through TASK-008.
- Define the deterministic run and task state machine, including the legal transitions and the terminal states used for completion.
- Define durable checkpoint semantics, the checkpoint record contract, and the resume-from-checkpoint contract.
- Define lease acquisition, lease renewal, lease expiry, and monotonic fencing token semantics for bounded-concurrency scheduling.
- Define idempotency keys, retry classification, backoff policy, and the exactly-once-effect guarantee expected from retried work.
- Define the provider adapter interface, its error taxonomy, and how provider-specific behavior stays out of the supervisor.
- Define the one-input project bootstrap contract, including how a single project input deterministically produces the initial Manager task record.
- Define the crash-recovery contract, including which invariants must hold after an abrupt process termination.
- Record each cross-cutting decision as an Architecture Decision Record under `docs/adr/`.
- Exclude runtime implementation, test authorship, task decomposition, independent approval, and release.

## Acceptance criteria

- [ ] Every component boundary named in this task maps to exactly one implementation task among TASK-003 through TASK-008, with no shared module ownership.
- [ ] The run and task state machine is documented as an explicit transition table with terminal states and illegal transitions.
- [ ] Checkpoint, resume, lease, fencing token, idempotency, retry, timeout, and crash-recovery contracts are each specified with observable pre- and post-conditions.
- [ ] The interface contracts consumed across implementation tasks are documented before implementation starts, so that TASK-003 through TASK-008 do not have to negotiate contracts during execution.
- [ ] The one-input project bootstrap contract specifies its single input, its deterministic output, and that it creates the initial Manager task record without an additional operator step.
- [ ] Each cross-cutting decision has an ADR that records context, decision, alternatives, and consequences.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- `docs/architecture/ARCHITECTURE.md` updated with the runtime architecture summary.
- Detailed runtime architecture documents under `docs/architecture/`.
- ADRs under `docs/adr/` for the state machine, durable state, leasing and fencing, retry and idempotency, provider adapter boundary, and bootstrap contract.
- Optional component and sequence diagrams under `diagrams/architecture/`.

## Dependency notes

- This task has no dependencies and is the first executable node of the TASK-001 graph.
- TASK-003 through TASK-008 remain blocked until this task passes its review gate.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: reviewer for the review gate, then orchestrator to unblock TASK-003 and TASK-004
