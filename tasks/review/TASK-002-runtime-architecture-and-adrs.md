---
task_id: TASK-002
title: Define the autonomous runtime architecture and decision records
status: review
owner_role: architect
llm: claude
branch: agent/claude/architect/task-002
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-architect-task-002
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies: []
required_gates:
  - review
gate_tasks:
  - task: TASK-015
    gate: review
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

- [x] Every component boundary named in this task maps to exactly one implementation task among TASK-003 through TASK-008, with no shared module ownership.
- [x] The run and task state machine is documented as an explicit transition table with terminal states and illegal transitions.
- [x] Checkpoint, resume, lease, fencing token, idempotency, retry, timeout, and crash-recovery contracts are each specified with observable pre- and post-conditions.
- [x] The interface contracts consumed across implementation tasks are documented before implementation starts, so that TASK-003 through TASK-008 do not have to negotiate contracts during execution.
- [x] The one-input project bootstrap contract specifies its single input, its deterministic output, and that it creates the initial Manager task record without an additional operator step.
- [x] Each cross-cutting decision has an ADR that records context, decision, alternatives, and consequences.
- [x] All changed files remain inside this task's declared write scope.

These boxes record the author's own assessment. They are not an approval. The criteria are confirmed only when TASK-015 records a passing verdict; the architect may not close its own review gate.

## Expected artifacts

- `docs/architecture/ARCHITECTURE.md` updated with the runtime architecture summary.
- Detailed runtime architecture documents under `docs/architecture/`.
- ADRs under `docs/adr/` for the state machine, durable state, leasing and fencing, retry and idempotency, provider adapter boundary, and bootstrap contract.
- Optional component and sequence diagrams under `diagrams/architecture/`.

## Delivered artifacts

Commit `9576fc9` on `agent/claude/architect/task-002`, 25 files, 2862 insertions:

- `docs/architecture/ARCHITECTURE.md` — runtime architecture summary.
- `docs/architecture/runtime/COMPONENT-BOUNDARIES.md` — module map, contract roots, allowed import directions, cross-cutting rules.
- `docs/architecture/runtime/INTERFACE-CONTRACTS.md` — normative cross-module types.
- `docs/architecture/runtime/STATE-MACHINE.md` — run and task transition tables, terminal and illegal transitions, dynamic admission guards.
- `docs/architecture/runtime/DURABLE-STATE-AND-CHECKPOINTS.md` — append-only journal, atomic checkpoints, monotonic versioning, compare-and-set append, single-writer lock.
- `docs/architecture/runtime/LEASES-AND-SCHEDULING.md` — leases, fencing tokens, bounded concurrency, write-scope exclusion, deterministic dispatch order.
- `docs/architecture/runtime/PROVIDER-ADAPTERS.md` — adapter boundary, closed ten-member failure taxonomy, layered timeouts, credential rules.
- `docs/architecture/runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md` — idempotency keys, intent-then-commit effect ledger, seeded backoff, bounded retries.
- `docs/architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md` — one-input bootstrap, graceful drain, pause, resume, exit codes.
- `docs/architecture/runtime/CRASH-RECOVERY.md` — seven recovery phases, twelve post-crash invariants.
- `docs/architecture/runtime/INTEGRATION-STRATEGY.md` — branch topology, merge order, contract change control.
- `docs/adr/0001` through `docs/adr/0010`, plus `docs/adr/README.md`.
- `diagrams/architecture/runtime-components.md`, `runtime-state-machine.md`, `runtime-sequences.md`.

## Dependency notes

- This task has no dependencies and is the first executable node of the TASK-001 graph.
- TASK-003 through TASK-008 remain blocked until this task passes the independent review gate performed by TASK-015. `gate_passed(TASK-002)` is the satisfying condition for their architecture edges; see the edge vocabulary in `tasks/TASK-001-DEPENDENCY-GRAPH.md`.
- This task holds resource lock `architecture-docs`. TASK-016 amends the same documents and must not be claimed while this record is active.

## Routing items raised by this task for the Orchestrator

The architect recorded two items it could not resolve inside its own role boundary. Both are now routed:

1. **No task owns the runtime toolchain.** `docs/architecture/runtime/INTEGRATION-STRATEGY.md` and ADR-0001 record that the root manifests and `scripts/quality/**` are outside every configured role write scope, so Wave 2 cannot compile. Routed to **TASK-018**, which is blocked pending a human governance decision on `config/agents/settings.yaml`.
2. **No module owns the isolated agent workspace lifecycle.** `AgentInvocation` carries `worktreePath` and `branch`, and `LIFECYCLE-AND-BOOTSTRAP.md` states the runtime resolves the worktree at dispatch, but the module map has no owner for creating it. Routed to **TASK-016** for the architecture amendment and **TASK-017** for the implementation.

## Handoff

- Commit or pull request: commit `9576fc9`, `docs: define the autonomous runtime architecture and decision records`, on branch `agent/claude/architect/task-002`. No push and no merge were performed by that execution.
- Verification recorded by the author: `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef agent/claude/orchestrator/task-001` reported valid over 25 files; `scripts/ci/validate-framework.ps1` and `scripts/ci/test-orchestration.ps1` passed; 77 relative document links resolved. This is the author's own evidence and is not a substitute for the TASK-015 gate.
- Known risks:
  - The module map has six modules and no owner for the agent workspace lifecycle. TASK-016 must amend it before TASK-017 can implement against it.
  - Wave 2 cannot compile until TASK-018 lands a toolchain, and TASK-018 is blocked on a human write-scope decision.
  - The two contract roots live inside TASK-003's and TASK-004's write scopes, so those tasks can physically change a normative contract. The contract change control procedure in `INTEGRATION-STRATEGY.md` is the only control; TASK-015 should confirm it is enforceable by review.
- Next owner: **reviewer** for TASK-015, the independent architecture review gate. The Claude Architect that authored this output may not close that gate. After TASK-015 records a passing verdict, the Orchestrator unblocks TASK-003 and TASK-004 under TASK-013.
- Task lock released: yes, by the TASK-002 execution.
</content>
