---
task_id: TASK-009
title: Independent code review of the autonomous runtime
status: blocked
owner_role: reviewer
llm: gpt
branch: agent/gpt/reviewer/task-009
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-reviewer-task-009
write_scope:
  - reports/code-review/REVIEW.md
  - reports/code-review/runtime/**
dependencies:
  - task: TASK-003
    edge: review_ready
  - task: TASK-004
    edge: review_ready
  - task: TASK-005
    edge: review_ready
  - task: TASK-006
    edge: review_ready
  - task: TASK-007
    edge: review_ready
  - task: TASK-008
    edge: review_ready
  - task: TASK-017
    edge: review_ready
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-003
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
  - task: TASK-004
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
  - task: TASK-005
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
  - task: TASK-006
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
  - task: TASK-007
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
  - task: TASK-008
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
  - task: TASK-017
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
gate_scheduling: This gate is an aggregate assembly gate for every target. Its reason and its recorded risk are in the aggregate and retrospective gate register in tasks/TASK-001-DEPENDENCY-GRAPH.md, row "TASK-009 / review".
parent_task: TASK-001
publication_class: bootstrap
blocked_reason: The runtime implementation tasks have not published their branches.
exit_condition: TASK-003 through TASK-008 and TASK-017 are review_ready, each with an immutable published commit. This task does not wait for those tasks to be integrated or to reach done, because it is the gate that lets them reach done. It is nevertheless an aggregate gate: it waits for every target before it can gate any one of them, and every target is already integrated by then.
---

# TASK-009: Independent code review of the autonomous runtime

## Objective

Perform an independent code review of the runtime implementation produced by TASK-003 through TASK-008 and TASK-017, and record actionable findings that route back to the responsible implementation owner.

## Scope

- Review correctness, maintainability, and compliance with the normative architecture: the TASK-002 documents at `9576fc9` **as amended by the TASK-016 commit that TASK-020 approves**. The rejected baseline alone is never the normative source; three of its seven acceptance criteria were judged `not met` by TASK-015.
- Verify that the `claude`, `gpt`, and `gemini` adapters required by TASK-004 each exist and implement command discovery, non-interactive invocation construction, cancellation, result parsing, and credential-free diagnostics. An adapter set that satisfies only the registry abstraction is a finding.
- Verify that the workspace lifecycle from TASK-017 is invoked on every dispatch path and that no result path leaves a workspace or a task lock unfinalized.
- Verify that neither contract root was amended locally in violation of the contract change control procedure in `docs/architecture/runtime/INTEGRATION-STRATEGY.md`, by diffing `src/orchestrator/state/contracts/` and `src/agents/contracts/` against `docs/architecture/runtime/INTERFACE-CONTRACTS.md`.
- Verify that each implementation task stayed inside its declared write scope and did not modify another task's module.
- Verify that the state machine, lease and fencing, checkpoint, retry, and idempotency contracts are implemented as specified rather than reinterpreted.
- Verify that the language policy holds: Turkish only for user-visible command-line copy, English everywhere else.
- Record each finding with a severity, a file and line reference, and the responsible child task ID and owner role.
- Exclude authoring or fixing any reviewed change, architecture decisions, and approval of any other role's gate.

## Acceptance criteria

- [ ] Every implementation task from TASK-003 through TASK-008 plus TASK-017 is covered, and coverage is stated explicitly.
- [ ] Each finding records severity, file and line, the responsible child task ID, and the owning role.
- [ ] Contract deviations from the normative architecture are reported as findings rather than silently accepted.
- [ ] No reviewed source file is modified by this task.
- [ ] All changed files remain inside this task's declared write scope.

### Amended-behavior obligations

Finding **F-202** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md` recorded that the required-behavior coverage matrix named this task as the independent validator of several amended behaviors that this record did not require it to check. Each criterion below is cited by exactly one row of that matrix and must be answered explicitly, with a `met` or `not met` judgment and file-and-line evidence. An implementing task's own unit tests do not satisfy any of them; this task judges whether the implementation and its tests actually discharge the obligation.

- [ ] **`V9-A001` — crash-atomic journal batches and partial-write boundaries.** TASK-003 implements the recoverable batch boundary mechanism the amendment chose, the restore post-condition exposes a committed batch entirely or not at all, and a crash-point test exists for **every** partial write boundary the amendment names and for the points immediately before and after the commit marker. A batch mechanism that relies on append-and-fsync alone, or a test set that covers only the torn tail, is a finding.
- [ ] **`V9-A002` — legal recovery transitions.** TASK-006 and TASK-008 implement recovery so that every recovery batch is legal by construction, and the transition table covers **every** combination of lease state, ledger state, and elapsed deadline with exactly one legal transition each. A combination with no mapping, two mappings, or a mapping that reaches an illegal transition is a finding.
- [ ] **`V9-A004-EDGE` — typed dependency, gate readiness, and no-deadlock.** TASK-005 implements ready-task selection over the full typed edge vocabulary, both forms of `gate_passed` with the ambiguity rejection, the atomic multi-relation verdict, and the load-time rejection of each of the seven no-deadlock invariants in `tasks/TASK-001-DEPENDENCY-GRAPH.md`. Each invariant has a rejection test that actually fails an invalid graph.
- [ ] **`V9-A004-LOCK` — named resource-lock admission.** TASK-005 enforces named resource-lock exclusion at admission alongside write-scope exclusion, refuses admission rather than queueing, and a test asserts that two tasks declaring the same `resource_lock` are never concurrently leased even when their paths would otherwise permit it.
- [ ] **`V9-A004-ACT` — event ingress, activation, quiescence, exactly-once, starvation bound.** TASK-005 implements the ingress observer with deterministic ordering, the cursor as the only consumption state, the one-commit effects-plus-cursor rule, load-time rejection of a cursor above `ingress_seq` and of an edited ledger row, and a starvation bound asserted as a bound rather than as eventual dispatch. Confirm specifically that no code path requires the recurring task itself to produce its own ingress fact — the defect finding F-201 recorded.
- [ ] **`V9-F105` — task-branch publication, idempotent pull request, blocked remote outcome.** TASK-017's `finalize` publishes the branch, records commit, branch, and pull-request identity durably before lock release, creates or updates exactly one pull request per task and branch across reruns and crash replays, and returns an explicit `blocked` outcome with a typed failure class when the remote or credentials are unavailable. Confirm by inspecting the constructed command vectors that no code path can push `main` or any ref other than `refs/heads/agent/<llm>/<role>/<task-id>`, and that no `succeeded` outcome is reachable from a local-only commit.

## Expected artifacts

- `reports/code-review/REVIEW.md` summary.
- Detailed findings under `reports/code-review/runtime/`.
- `reports/code-review/runtime/AMENDED-BEHAVIOR-COVERAGE.md`, recording the `met` / `not met` judgment and the supporting evidence for each of `V9-A001`, `V9-A002`, `V9-A004-EDGE`, `V9-A004-LOCK`, `V9-A004-ACT`, and `V9-F105`.

## Write-scope isolation

This task's scope was narrowed from `reports/code-review/**` to `reports/code-review/REVIEW.md` and `reports/code-review/runtime/**` so that it is path-disjoint from every other review task. It must not write `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`, which belongs to TASK-014, or `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`, which belongs to TASK-015. No sequencing assumption is required; the partition is now enforceable by path.

## Gate and remediation path

This task performs the review gate for TASK-003 through TASK-008 and TASK-017, declared in the `gate_for` field. A `gate_for` declaration is not a scheduling dependency: this task becomes dispatchable when its targets reach `review`, and its targets reach `done` only after this task records a verdict. That is why the two directions cannot deadlock.

**This gate is `aggregate` and `retrospective` for every target, and that is declared rather than glossed over.** It waits for all seven targets before it can gate any one of them, and every target is already integrated on `integration/autonomous-runtime` by the time it runs. The reason and the accepted risk are recorded in the aggregate and retrospective gate register in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, row "TASK-009 / review": the review exists to check cross-module properties that are not observable before assembly, and the cost is that TASK-003 and TASK-004 sit unreviewed for up to five waves. Finding F-203 recorded that revision 3 claimed the opposite.

It does not approve its own output. Findings return to the responsible implementation owner through TASK-013, which reopens the named child task. The reviewer must run in an execution context separate from every implementation author. Publishing this task's report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in `reports/code-review/REVIEW.md` and in the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
