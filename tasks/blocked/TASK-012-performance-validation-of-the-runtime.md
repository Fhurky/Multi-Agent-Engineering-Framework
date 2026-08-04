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
    edge: implementation_published
  - task: TASK-006
    edge: implementation_published
  - task: TASK-008
    edge: implementation_published
  - task: TASK-017
    edge: implementation_published
  - task: TASK-011
    edge: gate_recorded
required_gates: []
gate_for:
  - task: TASK-005
    gate: performance
  - task: TASK-006
    gate: performance
  - task: TASK-008
    gate: performance
parent_task: TASK-001
blocked_reason: The scheduler, supervisor, recovery layer, and workspace lifecycle are not published, and QA validation has not established a working baseline.
exit_condition: TASK-005, TASK-006, TASK-008, and TASK-017 have reached status review, and TASK-011 has recorded a passing end-to-end baseline verdict. TASK-011 is depended on by its recorded verdict, not by its terminal state, because TASK-011 also cannot reach done until its own findings are routed.
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

This task performs the performance gate for TASK-005, TASK-006, and TASK-008, declared in the `gate_for` field. A `gate_for` declaration is not a scheduling dependency: this task becomes dispatchable when its targets reach `review`, and its targets reach `done` only after this task records a verdict.

Optimizations are implemented by the responsible implementation owner, routed through TASK-013, and this role revalidates the optimization afterward.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in `reports/performance/PERFORMANCE_REPORT.md` and in the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
