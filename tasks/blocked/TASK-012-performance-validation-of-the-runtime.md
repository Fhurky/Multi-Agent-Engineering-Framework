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
  - task: TASK-011
    edge: gate_passed
    gate: qa
    round: 1
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-005
    gate: performance
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
  - task: TASK-006
    gate: performance
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
  - task: TASK-008
    gate: performance
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
gate_scheduling: This gate is an aggregate assembly gate for every target and additionally waits on a passing QA baseline. Its reason and its recorded risk are in the aggregate and retrospective gate register in tasks/TASK-001-DEPENDENCY-GRAPH.md, row "TASK-012 / performance".
parent_task: TASK-001
publication_class: bootstrap
remediates:
  - finding: F-204
    source: reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md
blocked_reason: The scheduler, supervisor, recovery layer, and workspace lifecycle are not published, and the qa gate TASK-011 owns has not been closed by a passing verdict.
exit_condition: TASK-005, TASK-006, TASK-008, and TASK-017 are review_ready, and the qa gate TASK-011 owns is closed by a passing or formally accepted verdict at round 1 or higher. The dependency is the owner form of gate_passed, not gate_recorded, because a changes-required QA verdict must not release performance validation against a failed baseline. TASK-011's terminal state is not required, because TASK-011 also cannot reach done until its own findings are routed.
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

## Why the QA dependency is `gate_passed` and not `gate_recorded`

Finding **F-204** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md` recorded a contradiction: this record's exit condition required a **passing** end-to-end QA baseline, while its declared edge was `gate_recorded(TASK-011)`, which is satisfied by any verdict including `changes-required`. The scheduler would therefore have dispatched performance validation against a baseline QA had already rejected.

The edge is now the **owner form** of `gate_passed`: `{task: TASK-011, edge: gate_passed, gate: qa, round: 1}`, satisfied only when the qa gate TASK-011 owns is closed by a passing or formally accepted verdict at round 1 or higher. A `changes-required` QA verdict leaves this task blocked until a later QA round passes. The frontmatter, the edge semantics table, the ownership table, the Wave 8 note, this exit condition, and TASK-011's `consumed_by` declaration all state the same thing.

The two `gate_passed` forms are disambiguated by no-deadlock invariant 6: TASK-011 declares `required_gates: []` and declares `gate: qa` in seven `gate_for` entries, so only the owner form resolves. TASK-005's graph validator rejects an ambiguous edge at load time.

## Aggregate gate class

This gate is `aggregate` and `retrospective` for all three targets, declared on both sides of each pair and registered with a reason and a recorded risk in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, row "TASK-012 / performance". It runs one wave after every other gate, so an optimization finding arrives after the code is integrated and reviewed and remediation reopens an already-gated task.

Optimizations are implemented by the responsible implementation owner, routed through TASK-013, and this role revalidates the optimization afterward in a new round with a new task. Publishing this task's report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in `reports/performance/PERFORMANCE_REPORT.md` and in the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
