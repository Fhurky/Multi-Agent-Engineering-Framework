---
task_id: TASK-011
title: QA validation of autonomous run lifecycle behavior
status: blocked
owner_role: qa
llm: gemini
branch: agent/gemini/qa/task-011
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gemini-qa-task-011
write_scope:
  - reports/qa/BUG_REPORT.md
  - reports/qa/**
  - tests/integration/**
  - tests/e2e/**
  - tests/fixtures/**
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
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
  - task: TASK-004
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
  - task: TASK-005
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
  - task: TASK-006
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
  - task: TASK-007
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
  - task: TASK-008
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
  - task: TASK-017
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
  - task: TASK-026
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
gate_scheduling: This gate is an aggregate assembly gate for every target. Its reason and its recorded risk are in the aggregate and retrospective gate register in tasks/TASK-001-DEPENDENCY-GRAPH.md, row "TASK-011 / qa".
consumed_by:
  - task: TASK-012
    edge: gate_passed
    lineage: LIN-RUNTIME-QA
    gate: qa
    lineage_round: 1
    note: TASK-012 depends on the LIN-RUNTIME-QA lineage, not on this task by name. Finding F-302 recorded that an edge naming this task could never be satisfied after a changes-required verdict, because a superseding round is a new gate task and a recorded verdict is durable. A changes-required verdict here therefore leaves TASK-012 blocked until a successor QA task records a passing authoritative verdict at lineage round 2 or higher, at which point the edge is satisfied with no change to it.
parent_task: TASK-001
publication_class: bootstrap
blocked_reason: The runtime implementation tasks have not published their branches. The cohort gained TASK-026, the durable ingress inbox, at activation ACT-004.
exit_condition: TASK-003 through TASK-008, TASK-017, and TASK-026 are each review_ready, with an immutable published commit. Every dependency is listed explicitly; this task does not infer a dependency from another task's dependency list. It is nevertheless an aggregate gate: it waits for every target before it can gate any one of them, and every target is already integrated by then.
---

# TASK-011: QA validation of autonomous run lifecycle behavior

## Objective

Independently validate the end-to-end autonomous run lifecycle against the TASK-001 acceptance behaviors and record reproducible defects that route back to the responsible implementation owner.

## Scope

- Author integration and end-to-end tests covering start, graceful drain, checkpoint, pause, resume, completion, timeout, crash recovery, and retry.
- Validate the one-input bootstrap: a single project input produces the initial Manager task record with no additional operator step.
- Validate that a paused and resumed run reaches the same terminal state as an uninterrupted run for the same input.
- Validate that a simulated crash followed by recovery reaches the same terminal state and does not duplicate completed work.
- Validate that bounded concurrency is never exceeded during a real run.
- Validate the provider adapter surface delivered by TASK-004: that `claude`, `gpt`, and `gemini` are all registered and resolvable, that each reports a usable `diagnose()` result, and that a missing executable or a missing credential variable produces the specified classification. Adapter execution is exercised through local script fixtures, never a real provider.
- Validate the workspace lifecycle delivered by TASK-017 end to end: that a dispatched task runs on its own `agent/<llm>/<role>/<task-id>` branch in its own worktree, that the task lock is claimed before any edit and released afterward, that write-scope validation runs before handoff, that the branch is published and exactly one pull request exists per task and branch, that an unavailable remote produces an explicit `blocked` outcome rather than a local-only success, and that an abruptly terminated run leaves no worktree, branch, or lock that recovery cannot reconcile.
- Validate the amended behaviors listed under **Amended-behavior obligations** below, each with an executable test. These are the behaviors the required-behavior coverage matrix in `tasks/TASK-001-DEPENDENCY-GRAPH.md` names this task as the independent validator of.
- Validate that operator-facing command-line copy is Turkish while identifiers, flags, and logs are English.
- Use deterministic fixtures and fake providers; no real provider credentials or network calls.
- Exclude production implementation, architecture decisions, and approval of another role's gate.

## Acceptance criteria

- [ ] Every behavior in the TASK-001 acceptance list has at least one executable test: start, graceful drain, checkpoint, pause, resume, completion, timeout, crash recovery, and retry.
- [ ] Pause-resume equivalence and crash-recovery equivalence are each asserted against an uninterrupted baseline run.
- [ ] Concurrency limit adherence is asserted during an actual multi-task run.
- [ ] All three configured provider families are asserted present and resolvable, and adapter discovery, cancellation, and diagnostic behavior are each covered.
- [ ] Automated branch creation, worktree isolation, hook installation, lock claim, scope validation, commit and handoff persistence, lock release, and crash-safe cleanup are each covered by an executable test.
- [ ] Coverage is stated per dependency task, and every dependency named in the frontmatter is covered explicitly rather than assumed to be covered transitively.
- [ ] Each defect is reproducible from a recorded command and fixture, and names the responsible child task ID and owning role.
- [ ] Tests are deterministic and contain no credentials or personal data.
- [ ] No production source file is modified by this task.
- [ ] All changed files remain inside this task's declared write scope.

### Amended-behavior obligations

Finding **F-202** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md` recorded that the required-behavior coverage matrix named this task as the independent validator of several amended behaviors that this record did not require it to test. Each criterion below is cited by exactly one row of that matrix and must be discharged by an **executable test** in this task's own scope. An implementing task's own unit tests do not satisfy any of them.

- [ ] **`V11-A001` — crash partial-write boundary matrix.** An executable test per partial write boundary the amendment names, plus one immediately before and one immediately after the commit marker, asserting that restore exposes every event of a committed batch or none of it. A run interrupted at any enumerated boundary never yields a partially visible batch.
- [ ] **`V11-A002` — lease, ledger, and deadline recovery matrix.** An executable test for every combination of lease state, ledger state, and elapsed deadline, asserting that recovery emits exactly one legal transition per task and that no recovery batch contains an illegal transition. The matrix is enumerated in the test, not sampled.
- [ ] **`V11-A003-CTL` — live run control end to end.** A running foreground supervisor accepts a second `pause` and a second `stop` command over the amended control transport, acknowledges each, applies them in the durable order recorded, rejects a request that fails the ownership check, and rejects a stale request. Assert that `pause` does not return while an unmanaged descendant remains.
- [ ] **`V11-A003-TREE` — child and grandchild termination.** A fixture provider spawns a child that spawns a grandchild; the child ignores the first cancellation and the invocation outlives its command timeout. Assert that escalation is bounded, that tree exit is verified, that no descendant process survives the run, and that a deliberately orphaned descendant is detected and fenced or terminated by recovery.
- [ ] **`V11-A004-EDGE` — typed dependency and no-deadlock end to end.** A run over the full TASK-001 graph shape reaches a state in which every task has been dispatchable, with no deadlock and no livelock. Assert that a graph violating each of the seven no-deadlock invariants is rejected at load time rather than deadlocking at run time.
- [ ] **`V11-A004-LOCK` — named resource-lock admission end to end.** During an actual multi-task run, two tasks declaring the same `resource_lock` are never concurrently leased, and the second is returned to the ready set rather than queued behind the first.
- [ ] **`V11-A004-ACT` — the complete event-ingress loop.** One end-to-end test that exercises the full path finding **F-201** required: a gate report is published as a commit by a writer whose scope **excludes** the recurring task's write scope; the ingress observer sees `ingress_seq` rise above the cursor; the recurring task is dispatched within the stated starvation bound; its effects, its ledger rows, and its cursor advance land in one commit; and the task returns to `quiescent` with the cursor equal to `ingress_seq`. The test must additionally assert that (a) no step in the loop requires a write by the recurring task to create its own trigger, (b) no existing ledger row is modified, (c) a crash before the effects commit replays to the identical final state, and (d) appending a further ingress fact afterwards wakes the task again without editing any prior row.
- [ ] **`V11-F301-STORE` — the six ingress failure modes finding F-301 constructed.** Executable tests, each named for the mode it covers: a **backdated** publication appends at the next free `seq` and never inserts below the cursor; a **late-discovered historical** fact is appended on discovery and consumed exactly once; the **producing ref is deleted** and the entry survives with an unchanged `seq` and a non-decreasing `maxSeq()`; a **crash during append** leaves either a complete entry or none, and a replay of the same fact is a no-op by `fact_id`; `fact_id` and `content_hash` reproduce values computed independently from the same inputs; and a sealed epoch's entries are byte-identical after a new epoch is declared with `seq_base` equal to the prior high-water mark.
- [ ] **`V11-F301-CLASS` — class precedence and self-exclusion end to end.** A commit matching several fact classes produces exactly one entry under the declared precedence; two distinct commits expressing one logical step produce two entries; a batch containing facts whose committer timestamps run opposite to their source commit identifiers is ordered by the identifier; and a commit authored by a recurring-task activation on its own branch produces **no** entry, so `maxSeq()` is unchanged and the task stays quiescent immediately after its own effects commit.
- [ ] **`V11-F401-PREDISPATCH` — a durable entry exists before dispatch, and consumption never mutates it.** One end-to-end test that constructs the operational deadlock finding F-401 described. Under the `durable-bootstrap-append` contract: an authorized appender commits an entry outside `tasks/**` **before** the recurring task is selected; the observer then sees `ingress_seq > cursor` and dispatches; the activation's effects, its ledger rows, and its cursor advance land in one commit; and the task returns to quiescence. The test must additionally assert that the inbox entry is **byte-identical** before and after consumption, that the ledger row is a separate record referencing it, and that a run in which the activation itself creates the only durable evidence is **rejected** rather than dispatched. A second case asserts that a recurring task declaring `interim-operator-authorized` surfaces the unmet precondition instead of reporting the durable predicate as satisfied.
- [ ] **`V11-F302-LINEAGE` — a failed round followed by a passing successor round.** One end-to-end test that constructs the deadlock finding F-302 described: the QA lineage records `changes-required` at lineage round 1; remediation lands; a **new** gate task records a passing verdict at lineage round 2; and the consumer holding `gate_passed(LIN-RUNTIME-QA, qa, 1)` becomes dispatchable **without any edit to its edge**. The test must additionally assert that round 1's verdict is still readable with its commit and its `remediated_by` and `revalidated_by` fields, so supersession did not weaken gate history.
- [ ] **`V11-F105` — publication, idempotent pull request, blocked remote outcome.** Against a local fixture remote: `finalize` publishes the task branch and records commit, branch, and pull-request identity durably before lock release; running `finalize` twice, and once more after a simulated crash between publication and lock release, yields exactly one pull request for the task and branch; and with the fixture remote unreachable or its credential absent, `finalize` returns an explicit `blocked` outcome with a typed failure class, produces no `succeeded` outcome for the local-only commit, and attempts no alternative push target.

## Expected artifacts

- `reports/qa/BUG_REPORT.md` summary.
- Integration tests under `tests/integration/`, end-to-end tests under `tests/e2e/`, and fixtures under `tests/fixtures/`.
- `tests/e2e/activation-ingress-loop/` containing the `V11-A004-ACT` end-to-end test and its fixtures.
- `tests/e2e/ingress-inbox/` containing the `V11-F301-STORE`, `V11-F301-CLASS`, and `V11-F401-PREDISPATCH` tests and their fixtures, and `tests/e2e/gate-lineage-supersession/` containing the `V11-F302-LINEAGE` test.
- `reports/qa/AMENDED-BEHAVIOR-COVERAGE.md`, mapping each of the twelve tagged obligations — `V11-A001`, `V11-A002`, `V11-A003-CTL`, `V11-A003-TREE`, `V11-A004-EDGE`, `V11-A004-LOCK`, `V11-A004-ACT`, `V11-F105`, `V11-F301-STORE`, `V11-F301-CLASS`, `V11-F302-LINEAGE`, and `V11-F401-PREDISPATCH` — to the executable test that discharges it and to its result.

## Gate and remediation path

This task performs the QA gate for TASK-003 through TASK-008 and TASK-017, declared in the `gate_for` field. A `gate_for` declaration is not a scheduling dependency: this task becomes dispatchable when its targets reach `review`, and its targets reach `done` only after this task records a verdict.

**This gate's scheduling class, its ordering against integration, its lineage, and its lineage round are declared on both sides of each pair and summarized in the aggregate and retrospective gate register in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, row "TASK-011 / qa".** Those are the only normative statements of those values; this body names the register and does not restate them. End-to-end lifecycle validation requires a startable runtime, so this gate cannot be split per target; the register records that reason and the risk it carries.

**A passing authoritative verdict in this task's QA lineage is a scheduling precondition for TASK-012.** TASK-012 holds a lineage-form `gate_passed` edge, declared in its own frontmatter and resolved through the gate-lineage register in `tasks/TASK-001-DEPENDENCY-GRAPH.md`; the owner form the graph once used is **withdrawn** and rejected at load time. The edge is satisfied only by a passing or formally accepted authoritative verdict, so a `changes-required` verdict here leaves TASK-012 blocked until a later round of the same lineage passes — and that later round releases it with no edit to any edge. That is the correction findings F-204 and F-302 required; finding F-402 recorded that this body still described the withdrawn form.

Defects return to the responsible implementation owner through TASK-013, which reopens the named child task. QA revalidates after remediation in a new round with a new task and does not implement fixes. Publishing this task's report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in `reports/qa/BUG_REPORT.md` and in the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
