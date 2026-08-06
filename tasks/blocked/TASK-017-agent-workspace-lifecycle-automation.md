---
task_id: TASK-017
title: Implement automated agent workspace lifecycle and crash-safe cleanup
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-017
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-017
write_scope:
  - src/orchestrator/workspace/**
  - tests/unit/orchestrator/workspace/**
dependencies:
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 8
  - task: TASK-003
    edge: integrated
  - task: TASK-018
    edge: integrated
required_gates:
  - review
  - security
  - qa
pre_merge_gates: []
gate_tasks:
  - task: TASK-009
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
  - task: TASK-010
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
  - task: TASK-011
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
dependencies_satisfied:
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 8
    satisfied_at: 734bdbc5d9541daa78fd570057317152247d1f87
    verdict_recorded: approved
    recorded_by: TASK-013 activation ACT-016, consuming ingress entry seq 24
    approved_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3
parent_task: TASK-001
publication_class: runtime
normative_architecture_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3, the immutable TASK-038 target. THIS IS THE FIRST APPROVED ARCHITECTURE SOURCE THIS GRAPH HAS HAD. LIN-ARCH-REVIEW recorded approved at lineage_round 8, at 734bdbc, and TASK-013 activation ACT-016 closed all eight relations together, so the lineage's authoritative verdict is passing at the floor this record's edge declares. The earlier baselines 9576fc9, 8d0c570, c2ee3eb, fe0374c, 468b37b, 6d145eb, and 970b081 remain superseded authoring baselines that were each rejected at rounds 1 through 7; a record that cites any of them as approved is still a finding. Build against 8ea5c32 and nothing else. The approved source is a commit on agent/gpt/architect/task-038 that has NOT been integrated into any branch; reading it is how a consumer consults the approved architecture until the separate branch-integration operation lands.
remediates:
  - finding: F-001
    source: reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md
  - finding: F-105
    source: reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md
blocked_reason: The architecture gate is NO LONGER a blocker. LIN-ARCH-REVIEW round 8 recorded approved at 734bdbc with A-601 resolved and no new finding, and TASK-013 activation ACT-016 closed all eight relations together, so this record's gate_passed(LIN-ARCH-REVIEW, review, 8) dependency is SATISFIED and the approved source is 8ea5c32. What still blocks this task is integrated(TASK-003) and integrated(TASK-018) - neither the durable state store nor the toolchain is integrated. No branch integration has happened yet: gate closure removes the obstacle to integration without performing one, and the integration of the approved architecture is a separate externally visible operation that produces its own ingress fact.
exit_condition: TASK-003 and TASK-018 are integrated into integration/autonomous-runtime. The architecture condition is already met and does not need to be waited on again.
review_target_base: not applicable until this task publishes
review_target_applicability: not applicable yet. This task is gated but no artifact of it exists, so no round is pinned and there is no delta to diff. It becomes applicable when this task reaches review_ready; the Orchestrator records review_target_commit and review_target_base then, at the activation that consumes the publication, from the branch as published.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime at or after the commit where this task's dependencies merged, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-017: Implement automated agent workspace lifecycle and crash-safe cleanup

## Objective

Implement the module that performs the repository's mandatory concurrent-execution protocol automatically for every dispatched agent task, so that a single-command run needs no human to create a branch, create a worktree, claim a lock, validate a scope, persist a handoff, or release a lock.

## Why this task exists

`AGENTS.md` requires every agent task to run on one isolated worktree, on one branch named `agent/<llm>/<role>/<task-id>`, behind one atomic task lock, with write-scope validation before handoff and lock release afterward. In the first decomposition, no implementation task owned any of it: TASK-004 started a provider call and returned a result, TASK-005 leased work, TASK-006 invoked workers, and the protocol appeared only as manual instructions addressed to human operators. A supervisor built that way would either stall waiting for a human at every dispatch or run agents in a shared checkout, which is the failure mode the protocol exists to prevent.

## Scope

- Implement the workspace lifecycle interface defined by TASK-016 in `docs/architecture/runtime/INTERFACE-CONTRACTS.md`: `prepare`, `finalize`, `abandon`, and `reconcile`.
- **Hook installation** — verify that the repository's tracked Git hooks are installed before any dispatch, and install them by invoking `scripts/setup/install-git-hooks.ps1` when they are not. Refuse to dispatch if hooks cannot be verified.
- **Branch and worktree creation** — create the task's branch and isolated worktree by invoking `scripts/orchestration/create-worktree.ps1` with the task ID, role, and LLM family. Derive the branch name from the task record, never from agent output. Reject any task whose derived branch does not match `agent/<llm>/<role>/<task-id>`.
- **Lock claim** — claim the task lock by invoking `scripts/orchestration/claim-task.ps1` from the created worktree, before the agent is invoked. Treat a failed claim as a dispatch refusal, not as a condition to retry into, and surface it to the scheduler so the task returns to the ready set without a duplicate claim.
- **Agent execution boundary** — hand the prepared workspace handle to the caller so the TASK-004 worker runs the provider with its working directory inside that worktree. This module does not invoke providers.
- **Write-scope validation** — run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` in the worktree after the agent returns and before any handoff is persisted. A validation failure is a task failure with a recorded reason; it never falls through to a commit.
- **Commit and handoff persistence** — commit the agent's changes on the task branch with an English message naming the task ID, and persist the handoff record durably through the TASK-003 state store so it survives a crash.
- **Branch publication** — push the task branch to the configured remote. The push refspec targets only `refs/heads/agent/<llm>/<role>/<task-id>`; no code path may construct a push to `main` or to any other branch. Record the published commit SHA as the immutable `review_ready` artifact.
- **Pull-request creation** — create a pull request for the task branch, or update the existing open one, so that re-running after a crash, a retry, or a resume never produces a second pull request for the same task and branch. Persist the pull-request identity durably.
- **Publication failure is an outcome, not a fallback** — when the remote is unreachable, credentials are absent, or pull-request creation is unauthorized, return an explicit `blocked` outcome carrying the typed failure class and the reason. Never report success on a local-only commit, never retry into a different target, and never fall back to pushing `main`.
- **Lock release** — release the lock by invoking `scripts/orchestration/release-task.ps1` on every terminal path, including failure and cancellation.
- **Crash-safe cleanup** — implement `reconcile`, which after an abrupt termination detects orphaned worktrees, orphaned branches, and locks held by a dead session, and returns each to a known state. Use an intent-then-commit record so every workspace operation is replayable and no operation is applied twice.
- **Session-token discipline** — release only a lock this session claimed. Never force-release another session's lock. When a lock cannot be released, record it for human attention and leave it held rather than breaking it.
- Classify every workspace failure into the TASK-004 taxonomy so the recovery layer can act on a class rather than on a script's exit code.
- Provide unit tests against a real temporary Git repository with a fake clock and an injected process runner.
- Exclude modifying any file under `scripts/orchestration/`, `scripts/setup/`, `.githooks/`, or any other human-controlled governance path; exclude provider invocation, scheduling policy, state store internals, retry policy, and lifecycle command handling.

## Governance constraint

The orchestration and hook scripts this module drives are human-controlled enforcement files. This task **invokes** them and must never modify, replace, wrap-around, or reimplement them. If a script's interface is insufficient, stop at the boundary and hand off to the Orchestrator, which raises the change with the user. Reimplementing lock or scope logic in TypeScript would put the enforcement mechanism inside the thing it constrains.

## Acceptance criteria

### Protocol completeness

- [ ] A dispatched task is executed on a branch matching `agent/<llm>/<role>/<task-id>` derived from its task record, in a worktree created for that task, with the repository hooks verified as installed beforehand.
- [ ] The task lock is claimed before the agent is invoked and released on every terminal path, including success, failure, timeout, and cancellation.
- [ ] Write-scope validation runs after the agent returns and before any commit, and a validation failure produces a recorded task failure with no commit.
- [ ] The handoff is persisted through the TASK-003 state store before the lock is released, so a crash between the two leaves the handoff readable.
- [ ] No dispatch path can reach provider invocation without a prepared workspace; a test asserts this by attempting to dispatch with preparation stubbed to fail.

### Publication and pull request

The mandatory handoff in `AGENTS.md` includes pushing the task branch and opening a pull request. Finding F-105 records that this task previously required only a local commit.

- [ ] `finalize` publishes the task branch to the configured remote and records the published commit SHA, the branch name, and the pull-request identity as one durable record through the TASK-003 state store, written before the lock is released.
- [ ] Pull-request creation is idempotent: when an open pull request already exists for the task branch, it is updated rather than duplicated. A test runs `finalize` twice, and after a simulated crash between publication and lock release, and asserts exactly one pull request per task and branch.
- [ ] The published commit is immutable for review purposes. A later `finalize` on the same task publishes a new commit SHA, updates the same pull request, and records both SHAs in order; it never opens a second pull request.
- [ ] When the remote is unreachable, credentials are absent, or pull-request creation is unauthorized, `finalize` returns an explicit `blocked` outcome with a typed failure class and a recorded reason. A test asserts that no `succeeded` outcome is produced for a local-only commit and that no alternative push target is attempted.
- [ ] Every constructed push command vector is asserted to target only `refs/heads/agent/<llm>/<role>/<task-id>`. A test feeds a task record whose fields would produce another ref and asserts the dispatch is refused before any process is spawned.
- [ ] A crash after publication and before lock release leaves the branch, commit, and pull-request identity readable by `reconcile`, which does not republish or reopen.
- [ ] `publication_class: runtime` is enforced in behavior, not only declared: a local-only commit never satisfies `review_ready` for a task the runtime dispatches. A test asserts that the recorded outcome for an unreachable remote is `blocked`, never `local-only` and never `succeeded`. The `bootstrap` publication class in `tasks/TASK-001-DEPENDENCY-GRAPH.md` applies only to human-launched sessions and is not reachable from this module.

These implementation criteria resolve the implementation half of finding F-105. They do **not** satisfy the graph's independent-validation claim: that is discharged by TASK-009 `V9-F105`, TASK-010 `V10-F105`, and TASK-011 `V11-F105`, which finding F-202 required.

### Crash safety

- [ ] `reconcile` after a simulated abrupt termination detects an orphaned worktree, an orphaned branch, and a lock held by a dead session, and returns each to a known state, asserted against a real temporary repository.
- [ ] Every workspace operation records an intent before it acts and a commit after it succeeds, so replaying `reconcile` twice produces the same result as replaying it once.
- [ ] A workspace whose owning session is still alive is left untouched by `reconcile`.
- [ ] Recovery never force-releases a lock held by a live session; a test asserts that this case is recorded for human attention instead.

### Safety boundaries

- [ ] The module cannot produce a push to `main`; a test asserts that every push path targets only the task branch and that the pre-push hook remains installed. This holds for the publication path added above as well as for any other push the module constructs.
- [ ] The module never sets `ALLOW_MAIN_PUSH` and never passes a force flag to a release; both are asserted by inspecting the constructed command vectors.
- [ ] The module never writes a human-controlled governance path; a test asserts that its own committed diff in a fixture run contains no such path.
- [ ] Branch and worktree names are derived only from task-record fields and never from agent output; a test feeds hostile agent output containing a path traversal sequence and a shell metacharacter and asserts neither reaches a command vector or a filesystem path.

### Failure classification and tests

- [ ] Every non-zero exit from an invoked orchestration script maps to exactly one `FailureClass` from the TASK-004 taxonomy, and an unrecognized exit maps to `unknown` with disposition `fail`.
- [ ] Unit tests run against a real temporary Git repository, with an injected process runner and a fake clock, and make no network call.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Workspace lifecycle implementation under `src/orchestrator/workspace/`.
- Unit tests under `tests/unit/orchestrator/workspace/`, including the real-temporary-repository crash reconciliation tests and the publication, idempotent pull-request, and blocked-outcome tests.

## Dependency notes

- `gate_passed(TASK-016, review)` supplies the workspace lifecycle contract, the publication and pull-request contract, and the crash-safe cleanup specification. The normative source is `9576fc9` **as amended by the TASK-016 commit that TASK-020 approves**; the workspace lifecycle module does not exist in the rejected baseline at all, so there is nothing for this task to implement from it. Implementation cannot start before the module is part of the approved architecture. That gate is owned by TASK-020.
- `integrated(TASK-003)` supplies the durable state store and the intent-then-commit substrate used for replayable workspace operations. It is `integrated` and not `review_ready` because this is a compile-time import.
- `integrated(TASK-018)` supplies the toolchain.
- May execute in parallel with TASK-005; `src/orchestrator/workspace/**` and `src/orchestrator/scheduling/**` do not overlap.
- Blocks TASK-006 and TASK-008, both of which now carry an explicit edge to this task.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it into the section below.

Note the distinction this task must preserve: it automates the workspace protocol for tasks the **runtime** dispatches, writing generated records only to a run-scoped location. It never edits this repository's own `tasks/` directory.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to unblock TASK-006 and to route the change into TASK-009, TASK-010, and TASK-011
</content>
