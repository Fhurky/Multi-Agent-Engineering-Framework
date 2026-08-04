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
  - TASK-005
  - TASK-006
  - TASK-008
  - TASK-011
required_gates: []
parent_task: TASK-001
blocked_reason: The scheduler, supervisor, and recovery layer are not implemented and QA validation has not established a working baseline.
exit_condition: TASK-005, TASK-006, and TASK-008 are complete and TASK-011 has produced a passing end-to-end baseline.
---

# TASK-012: Performance validation of scheduling, checkpointing, and recovery

## Objective

Measure the runtime's scheduling throughput, checkpoint cost, and recovery time, and report measured bottlenecks with the evidence needed by the responsible implementation owner.

## Scope

- Benchmark dispatch throughput and scheduling latency at the configured concurrency limits.
- Measure checkpoint write cost and its effect on run wall-clock time as run size grows.
- Measure recovery time from a durable checkpoint as a function of run size.
- Measure lease renewal overhead and its behavior under contention.
- Record environment, data set, concurrency setting, and measurement method for every result.
- Identify bottlenecks with measured evidence and name the responsible child task ID and owning role.
- Exclude implementing optimizations, prioritizing product work, and approval of another role's gate.

## Acceptance criteria

- [ ] Dispatch throughput, checkpoint cost, recovery time, and lease renewal overhead are each measured and reported.
- [ ] Every reported result records its environment, data set, concurrency setting, and measurement method.
- [ ] Measurements are repeated enough times to report variance, not a single sample.
- [ ] Each reported bottleneck names the responsible child task ID and owning role.
- [ ] No production source file is modified by this task.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- `reports/performance/PERFORMANCE_REPORT.md` summary.
- Benchmarks under `tests/performance/` and detailed results under `reports/performance/`.

## Gate and remediation path

This task performs the performance gate for the runtime. Optimizations are implemented by the responsible implementation owner, routed through TASK-013, and this role revalidates the optimization afterward.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
