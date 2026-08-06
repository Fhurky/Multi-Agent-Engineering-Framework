---
task_id: TASK-012
title: Performance validation of scheduling, checkpointing, and recovery
status: blocked
owner_role: performance
llm: gemini
branch: agent/gemini/performance/task-012
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gemini-performance-task-012
write_scope:
  - reports/performance/PERFORMANCE_REPORT.md
  - reports/performance/**
  - tests/performance/**
dependencies:
  - task: TASK-005
    edge: review_ready
  - task: TASK-006
    edge: review_ready
  - task: TASK-008
    edge: review_ready
  - task: TASK-017
    edge: review_ready
  - lineage: LIN-RUNTIME-QA
    edge: gate_passed
    gate: qa
    lineage_round: 1
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-005
    gate: performance
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-PERFORMANCE
    lineage_round: 1
  - task: TASK-006
    gate: performance
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-PERFORMANCE
    lineage_round: 1
  - task: TASK-008
    gate: performance
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-PERFORMANCE
    lineage_round: 1
gate_scheduling: This gate is an aggregate assembly gate for every target and additionally waits on a passing QA baseline. Its reason and its recorded risk are in the aggregate and retrospective gate register in tasks/TASK-001-DEPENDENCY-GRAPH.md, row "TASK-012 / performance".
parent_task: TASK-001
publication_class: bootstrap
remediates:
  - finding: F-204
    source: reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md
  - finding: F-302
    source: reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md
blocked_reason: The scheduler, supervisor, recovery layer, and workspace lifecycle are not published, and the LIN-RUNTIME-QA lineage has recorded no verdict at all.
exit_condition: TASK-005, TASK-006, TASK-008, and TASK-017 are review_ready, and the LIN-RUNTIME-QA lineage records a passing or formally accepted authoritative verdict at lineage round 1 or higher. The dependency is the lineage form of gate_passed, not gate_recorded, because a changes-required QA verdict must not release performance validation against a failed baseline; and it names the lineage rather than TASK-011, because finding F-302 recorded that an edge bound to one gate task can never be satisfied by the successor round that a changes-required verdict requires. No gate task's terminal state is required.
review_target_base: per gated target, resolved when that target publishes
review_target_applicability: applicable per gated relation rather than once. Each of TASK-005, TASK-006, TASK-008, and TASK-017 declares its own review_target_base, and this task measures each against that value. Until then there is no single base to record, and recording one would be an assertion rather than a reading.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime at or after the commit where this task's dependencies merged, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-012: Performance validation of scheduling, checkpointing, and recovery

## Objective

Measure the runtime's scheduling throughput, checkpoint cost, and recovery time, and report measured bottlenecks with the evidence needed by the responsible implementation owner.

## Scope

- Benchmark dispatch throughput and scheduling latency at the configured concurrency limits.
- Measure checkpoint write cost and its effect on run wall-clock time as run size grows.
- Measure recovery time from a durable checkpoint as a function of run size.
- Measure lease renewal overhead and its behavior under contention.
- Measure the per-dispatch cost of the TASK-017 workspace lifecycle — branch creation, worktree creation, lock claim, scope validation, and release — because it is on the critical path of every dispatch and is the runtime's only unavoidable filesystem-bound step.
- Record environment, data set, concurrency setting, and measurement method for every result.
- Identify bottlenecks with measured evidence and name the responsible child task ID and owning role.
- Exclude implementing optimizations, prioritizing product work, and approval of another role's gate.

## Acceptance criteria

- [ ] Dispatch throughput, checkpoint cost, recovery time, lease renewal overhead, and workspace lifecycle cost per dispatch are each measured and reported.
- [ ] Every reported result records its environment, data set, concurrency setting, and measurement method.
- [ ] Measurements are repeated enough times to report variance, not a single sample.
- [ ] Each reported bottleneck names the responsible child task ID and owning role.
- [ ] No production source file is modified by this task.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- `reports/performance/PERFORMANCE_REPORT.md` summary.
- Benchmarks under `tests/performance/` and detailed results under `reports/performance/`.

## Gate and remediation path

This task performs the performance gate for TASK-005, TASK-006, and TASK-008, declared in the `gate_for` field. A `gate_for` declaration is not a scheduling dependency: this task becomes dispatchable when its targets reach `review` **and** a passing QA baseline exists, and its targets reach `done` only after this task records a verdict.

## Why the QA dependency is a lineage-form `gate_passed` and not `gate_recorded`

Finding **F-204** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md` recorded a contradiction: this record's exit condition required a **passing** end-to-end QA baseline, while its declared edge was `gate_recorded(TASK-011)`, which is satisfied by any verdict including `changes-required`. The scheduler would therefore have dispatched performance validation against a baseline QA had already rejected.

Finding **F-302** in round 4 then recorded that the owner form which replaced it — an edge naming one gate task — can never be satisfied once that task records `changes-required`, because a superseding round is always a new task and a recorded verdict is never rewritten. The **owner form is withdrawn** and is rejected at load time.

The edge declared in this record's frontmatter is therefore the **lineage form**: it names the QA gate lineage rather than any one of its rounds, and is satisfied when that lineage's authoritative verdict — the verdict at its highest recorded lineage round — is passing or formally accepted at or above the floor the edge declares. A `changes-required` QA verdict leaves this task blocked until a later round of the same lineage passes, and that later round releases it **with no edit to any edge**. The lineage identifier and the floor are declared in this record's frontmatter and resolved through the gate-lineage register in `tasks/TASK-001-DEPENDENCY-GRAPH.md`; this body names them and does not restate their values. Finding **F-402** recorded that this passage previously printed the withdrawn owner-form edge and claimed invariant 6 resolved it.

Invariant 6 now requires every `gate_passed` edge to declare exactly one of `task` or `lineage`, so no edge is ambiguous and no edge can name a gate task's own relation. TASK-005's graph validator rejects a violation at load time.

## Gate scheduling class

This gate's scheduling class, its ordering against integration, its lineage, and its lineage round are declared on both sides of each pair and summarized in the aggregate and retrospective gate register in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, row "TASK-012 / performance". Those are the only normative statements of those values; this body names the register and does not restate them. The register records that this gate runs after every other gate, so an optimization finding arrives once the code is integrated and reviewed and remediation reopens an already-gated task.

Optimizations are implemented by the responsible implementation owner, routed through TASK-013, and this role revalidates the optimization afterward in a new round with a new task. Publishing this task's report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in `reports/performance/PERFORMANCE_REPORT.md` and in the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
