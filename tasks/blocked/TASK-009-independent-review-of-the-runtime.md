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
  - task: TASK-026
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
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
  - task: TASK-004
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
  - task: TASK-005
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
  - task: TASK-006
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
  - task: TASK-007
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
  - task: TASK-008
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
  - task: TASK-017
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
  - task: TASK-026
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
gate_scheduling: This gate is an aggregate assembly gate for every target. Its reason and its recorded risk are in the aggregate and retrospective gate register in tasks/TASK-001-DEPENDENCY-GRAPH.md, row "TASK-009 / review".
parent_task: TASK-001
publication_class: bootstrap
blocked_reason: The runtime implementation tasks have not published their branches. The cohort gained TASK-026, the durable ingress inbox, at activation ACT-004.
exit_condition: TASK-003 through TASK-008, TASK-017, and TASK-026 are review_ready, each with an immutable published commit. This task does not wait for those tasks to be integrated or to reach done, because it is the gate that lets them reach done. It is nevertheless an aggregate gate: it waits for every target before it can gate any one of them, and every target is already integrated by then.
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
- [ ] **`V9-F301-STORE` — the ingress inbox is a position store, not a tally.** TASK-026's inbox assigns `seq` once at append and never recomputes it; `fact_id` is SHA-256 over the canonical identity tuple and reproduces byte for byte against a hand-computed fixture; `content_hash` is SHA-256 over the source artifact bytes; append is idempotent by `fact_id` and crash-atomic with no partial entry, duplicate `seq`, or duplicate `fact_id` at any crash point; `maxSeq()` is non-decreasing; and entries survive deletion, rewrite, or garbage collection of the producing ref. Confirm by reading the code that **no** path derives a position from a count of commits, refs, branches, or files, and that a sealed epoch's entries are never re-derived or renumbered. This is the defect finding F-301 recorded.
- [ ] **`V9-F301-CLASS` — one commit, one entry, and no self-trigger.** The adapters resolve a source commit matching several fact classes to exactly one entry under the declared precedence order; distinct commits stay distinct facts; batch ordering uses the source commit identifier and **no** path reads a committer or author timestamp; the epoch `seq_base` rule is implemented; and every commit authored by a recurring-task activation on its own branch is excluded from every fact class by an explicit rule. Confirm that fields read out of commit, report, or handoff text are validated against the contract types and that none is used to derive a path, a ref, or a command argument.
- [ ] **`V9-F401-SCHEMA` — the inbox entry and the ledger row are two schemas, and only one of them records consumption.** Read TASK-026's persisted inbox entry type and confirm it declares **no** consumption field, that no exposed operation can set one, and that an entry is byte-identical before and after its consumption; read the consumption-ledger row type and confirm it is a separate record that references an entry by `seq` and `fact_id` and never writes back to it. Confirm that consumption is decided only by comparing a `seq` with the cursor. Confirm that TASK-005 rejects, at load time, an entry carrying a consumption field and a recurring task whose `activation.bootstrap_dispatch_contract` is absent or unknown, and that under `durable-bootstrap-append` a dispatch whose only durable evidence is created by the activation itself is rejected. Report a divergence between the implementation and the approved contract as a finding against whichever of the two the evidence indicates. This is the defect finding F-401 recorded.
- [ ] **`V9-F302-LINEAGE` — supersession without weakening history.** TASK-005 resolves the target and lineage forms of `gate_passed`, rejects the withdrawn owner form at load time, and enforces invariant 8 over every registered lineage. Confirm that the lineage form is satisfied only by a passing or formally accepted authoritative verdict, that a successor gate task passing at lineage round n+1 releases a consumer with no edit to the consumer's edge, and that every superseded round remains readable with its verdict, its commit, and its `remediated_by` and `revalidated_by` fields intact. This is the deadlock finding F-302 constructed.
- [ ] **`V9-F105` — task-branch publication, idempotent pull request, blocked remote outcome.** TASK-017's `finalize` publishes the branch, records commit, branch, and pull-request identity durably before lock release, creates or updates exactly one pull request per task and branch across reruns and crash replays, and returns an explicit `blocked` outcome with a typed failure class when the remote or credentials are unavailable. Confirm by inspecting the constructed command vectors that no code path can push `main` or any ref other than `refs/heads/agent/<llm>/<role>/<task-id>`, and that no `succeeded` outcome is reachable from a local-only commit.

## Expected artifacts

- `reports/code-review/REVIEW.md` summary.
- Detailed findings under `reports/code-review/runtime/`.
- `reports/code-review/runtime/AMENDED-BEHAVIOR-COVERAGE.md`, recording the `met` / `not met` judgment and the supporting evidence for each of the ten tagged obligations: `V9-A001`, `V9-A002`, `V9-A004-EDGE`, `V9-A004-LOCK`, `V9-A004-ACT`, `V9-F105`, `V9-F301-STORE`, `V9-F301-CLASS`, `V9-F302-LINEAGE`, and `V9-F401-SCHEMA`.

## Write-scope isolation

This task's scope was narrowed from `reports/code-review/**` to `reports/code-review/REVIEW.md` and `reports/code-review/runtime/**` so that it is path-disjoint from every other review task. It must not write `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`, which belongs to TASK-014, or `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`, which belongs to TASK-015. No sequencing assumption is required; the partition is now enforceable by path.

## Gate and remediation path

This task performs the review gate for TASK-003 through TASK-008 and TASK-017, declared in the `gate_for` field. A `gate_for` declaration is not a scheduling dependency: this task becomes dispatchable when its targets reach `review`, and its targets reach `done` only after this task records a verdict. That is why the two directions cannot deadlock.

**This gate's scheduling class, its ordering against integration, its lineage, and its lineage round are declared in the frontmatter of each pair above and summarized in the aggregate and retrospective gate register in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, row "TASK-009 / review".** Those are the only normative statements of those values; this body names the register and does not restate them. The register records why the delay is accepted, what it costs, and which targets sit unreviewed while it waits. Finding F-203 recorded that revision 3 asserted the opposite of the frontmatter; finding F-402 recorded that this body still restated values it may only reference.

It does not approve its own output. Findings return to the responsible implementation owner through TASK-013, which reopens the named child task. The reviewer must run in an execution context separate from every implementation author. Publishing this task's report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in `reports/code-review/REVIEW.md` and in the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
