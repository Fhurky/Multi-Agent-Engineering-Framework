---
task_id: TASK-016
title: Amend the runtime architecture with the agent workspace lifecycle module
status: blocked
owner_role: architect
llm: claude
branch: agent/claude/architect/task-016
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-architect-task-016
write_scope:
  - docs/architecture/runtime/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies:
  - task: TASK-002
    edge: gate_passed
required_gates:
  - review
gate_tasks:
  - task: TASK-015
    gate: review
parent_task: TASK-001
blocked_reason: The base architecture has not passed its independent review gate, and amending a document set that may still change would produce two competing versions.
exit_condition: TASK-015 records a passing verdict on TASK-002 and the architecture-docs resource lock is free.
---

# TASK-016: Amend the runtime architecture with the agent workspace lifecycle module

## Objective

Add the agent workspace lifecycle to the runtime architecture as a seventh module with exactly one owner, so that TASK-017 can implement the mandatory isolated-execution protocol against a normative contract instead of inventing one.

## Why this amendment is required

The TASK-002 architecture at commit `9576fc9` defines `AgentInvocation` with a `worktreePath` and a `branch`, and `docs/architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md` records that the runtime resolves the worktree at dispatch. But the module map in `docs/architecture/runtime/COMPONENT-BOUNDARIES.md` has six modules and none of them owns creating that worktree, creating that branch, installing the repository hooks, claiming the task lock, validating the write scope, persisting the commit and handoff, or releasing the lock.

`AGENTS.md` makes that protocol mandatory for every agent task. Without an owning module the single-command supervisor would still require a human to run `create-worktree.ps1`, `claim-task.ps1`, `validate-write-scope.ps1`, and `release-task.ps1` for every dispatch, and a supervisor that dispatched without them would run agents in a shared checkout — the exact failure the concurrency protocol exists to prevent.

This is the architect's decision to make, not the Orchestrator's. The Orchestrator routed it here through the contract change control procedure in `docs/architecture/runtime/INTEGRATION-STRATEGY.md`.

## Scope

- Add a seventh module, the agent workspace lifecycle, to the module map in `COMPONENT-BOUNDARIES.md` with `src/orchestrator/workspace/` as its source path and TASK-017 as its sole owner.
- Define its allowed import directions and confirm the module graph stays acyclic. The supervisor and the recovery layer consume it; it consumes the state contract root and no other module.
- Define the normative workspace lifecycle contract and add it to `INTERFACE-CONTRACTS.md`: the workspace handle, the prepare, finalize, abandon, and reconcile operations, their pre- and post-conditions, and their failure classification.
- Specify how the runtime invokes the existing human-controlled PowerShell orchestration scripts rather than reimplementing branch, worktree, lock, or scope logic in TypeScript, and specify what it must do when a script exits non-zero.
- Specify the crash-safe cleanup contract: which workspace states are recoverable, how an orphaned worktree, branch, or task lock is detected after an abrupt termination, and which post-crash invariants `CRASH-RECOVERY.md` gains as a result.
- Specify the session-token rule: the runtime releases only locks its own session claimed, and never force-releases another session's lock. State what the runtime does instead when it finds a lock it cannot release.
- Specify that the runtime may never push to `main`, never bypass the tracked pre-push hook, never set `ALLOW_MAIN_PUSH`, and never write a human-controlled governance path, and record how the architecture makes each of those structurally unavailable rather than merely discouraged.
- Extend the deterministic dispatch and admission rules in `LEASES-AND-SCHEDULING.md` where workspace preparation affects them.
- Record the decision as ADR-0011, including the rejected alternative of folding the workspace lifecycle into TASK-007's lifecycle module and the rejected alternative of reimplementing the orchestration scripts in TypeScript.
- Update `INTEGRATION-STRATEGY.md` so the branch topology and merge order include TASK-017 in Wave 3.
- Update the affected diagrams under `diagrams/architecture/`.
- Exclude implementing the module, changing any contract that TASK-003 through TASK-008 have already begun transcribing beyond what this amendment requires, decomposing tasks, and approving any gate.

## Acceptance criteria

- [ ] The module map contains exactly seven modules, each with exactly one owner task, and no module appears twice.
- [ ] The workspace lifecycle contract is declared in `INTERFACE-CONTRACTS.md` with observable pre- and post-conditions for prepare, finalize, abandon, and reconcile.
- [ ] The allowed import directions are stated and the module dependency graph is shown to remain acyclic.
- [ ] The contract states that the runtime delegates to `scripts/orchestration/*.ps1` and never reimplements branch, worktree, lock, or write-scope logic.
- [ ] Crash-safe cleanup is specified, and `CRASH-RECOVERY.md` gains explicit post-crash invariants for orphaned worktrees, branches, and locks.
- [ ] The session-token rule and the no-force-release rule are stated normatively, with the runtime's required behavior when it cannot release a lock.
- [ ] The prohibition on pushing to `main`, bypassing the pre-push hook, and writing a governance path is stated with the structural mechanism that enforces each.
- [ ] ADR-0011 records context, decision, rejected alternatives, and consequences.
- [ ] Every change is an amendment that names what it supersedes; no existing contract is silently rewritten.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- `docs/architecture/runtime/WORKSPACE-LIFECYCLE.md`.
- Amendments to `COMPONENT-BOUNDARIES.md`, `INTERFACE-CONTRACTS.md`, `CRASH-RECOVERY.md`, `LEASES-AND-SCHEDULING.md`, and `INTEGRATION-STRATEGY.md`.
- `docs/adr/0011-agent-workspace-lifecycle-ownership.md`.
- Updated diagrams under `diagrams/architecture/`.

## Resource lock

This task declares `resource_lock: architecture-docs`, which TASK-002 also holds. The two scopes genuinely overlap: this task amends documents TASK-002 authored. They are serialized by the lock, not by path disjointness, and this task may not be claimed while TASK-002 is active.

## Dependency notes

- `gate_passed(TASK-002)` is required because amending a document set that has not passed review would fork it.
- Blocks TASK-017, which cannot implement without this contract.
- Consumed by TASK-006 and TASK-008 indirectly, through TASK-017's published interface.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: reviewer for the TASK-015 re-review of the amendment, then orchestrator via TASK-013 to unblock TASK-017
</content>
