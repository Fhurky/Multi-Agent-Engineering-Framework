---
task_id: TASK-013
title: Own task-record lifecycle transitions, route validation findings, and close gates
status: ready
owner_role: orchestrator
llm: claude
branch: agent/claude/orchestrator/task-013
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-orchestrator-task-013
write_scope:
  - tasks/**
resource_lock: task-records
dependencies: []
required_gates: []
parent_task: TASK-001
activation: recurring
---

# TASK-013: Own task-record lifecycle transitions, route validation findings, and close gates

## Objective

Be the single owner of every change to a task record in this graph. Perform each lifecycle transition, transcribe each owner's handoff, route each validation finding to the responsible implementation author, and record gate closure — so that no implementation or validation role ever has to write outside its configured scope to keep the graph's state truthful.

## Why this task exists in this shape

The first decomposition told every task owner to record its handoff in its own task record, move that record between lifecycle directories, and update its `status` field. No implementation or validation role has `tasks/**` in its configured write scope, so following that instruction would have failed `validate-write-scope.ps1`, and obeying scope would have left every lifecycle state stale. This task removes the contradiction by making task-record mutation the exclusive responsibility of the Orchestrator role, which does own `tasks/**`.

## Activation

This task is recurring rather than single-shot. It is claimed briefly, does one unit of transition or routing work, and is released. It is claimed when any of the following occurs:

| Trigger | Work performed |
|---|---|
| A gate task records a passing verdict | Move the gated tasks out of `blocked` into `ready`, clear `blocked_reason`, and record which edge became satisfied |
| An owner publishes a branch and opens a pull request | Move that record to `review`, set `status`, and transcribe the owner's commit, verification, and risks into its Handoff section |
| A gate task records findings | Create one remediation task per responsible implementation owner and move the affected record back to `in-progress` or `blocked` |
| All gates for a task have passed | Move that record to `done` and record gate closure |
| A dependency cannot be satisfied | Move the record to `blocked` with an explicit `blocked_reason` and `exit_condition` |
| A human records a governance decision | Update the affected record and unblock or close it |

## Scope

- Perform every `status` field change and every move between `tasks/backlog/`, `tasks/ready/`, `tasks/in-progress/`, `tasks/review/`, `tasks/blocked/`, and `tasks/done/` for TASK-002 through TASK-019 and for any remediation task this task creates.
- Transcribe each owner's handoff from its commit message, pull request description, and role report into the Handoff section of its task record. Do not invent evidence; quote what the owner recorded and name its source.
- Read the published findings from TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, and TASK-019.
- Create one remediation task per responsible implementation owner, reusing that owner's original non-overlapping write scope so no two remediation tasks collide.
- Set each remediation task's dependencies to the finding that caused it, using the typed edge vocabulary, and its `gate_for` reverse edge to the validating role that must revalidate.
- Maintain `tasks/TASK-001-DEPENDENCY-GRAPH.md` as tasks are added, blocked, or closed, so the graph never disagrees with the individual records.
- Record which gates are closed, which remain open, and which high or critical security findings require formal human acceptance.
- Verify that no remediation task assigns an author to review their own change.
- Exclude implementing remediation, authoring architecture, deciding any gate verdict, approving any gate outcome, and release authorization. This task records a verdict that a gate owner produced; it never produces one.

## Acceptance criteria

- [ ] No task record in this graph is modified by any role other than `orchestrator` for the whole run. A `git log --follow` over `tasks/` shows only `agent/claude/orchestrator/*` branches.
- [ ] Every lifecycle transition names its trigger, the satisfied edge or recorded verdict that justified it, and the source artifact it was read from.
- [ ] Every finding from TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, and TASK-019 maps to exactly one remediation task or to a recorded formal acceptance.
- [ ] Each remediation task names one owner role, one LLM family, one branch, one worktree, and a write scope that does not overlap any other active task and does not share an active resource lock.
- [ ] Each remediation task declares the validating role that must revalidate, as a `gate_for` reverse edge rather than as a scheduling dependency.
- [ ] No remediation task routes a change back to the same execution context that reviewed it.
- [ ] High and critical security findings are not marked closed without recorded authorization from an authorized human.
- [ ] Gate closure status for review, security, QA, and performance is recorded explicitly per gated task.
- [ ] `tasks/TASK-001-DEPENDENCY-GRAPH.md` matches every individual record's frontmatter after each transition.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Remediation task records under `tasks/`.
- Updated lifecycle placement and status for every affected child task record.
- An updated `tasks/TASK-001-DEPENDENCY-GRAPH.md`.
- A recorded gate closure summary under `tasks/`.

## Resource lock

This task declares `resource_lock: task-records`, held by every task whose write scope includes `tasks/**`. TASK-001 holds the same lock. The two scopes are genuinely identical and are not made disjoint by sequencing; they are serialized by the lock instead. Exactly one task holding `task-records` may be claimed at a time, and the scheduler's admission gate must enforce this in the same place it enforces write-scope exclusion. TASK-013 may not be claimed while TASK-001 is active.

## Dependency notes

- This task has no scheduling dependencies. It is dispatchable from the start of the run because the first transition it must perform — moving TASK-003 and TASK-004 out of `blocked` after TASK-015 passes — happens before any implementation task runs.
- It is the explicit return path from validation findings to the responsible implementation author required by TASK-001.

## Handoff

Maintained by this task's own executions; each claim appends its outcome.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: the implementation owner named in each remediation task, then the validating role for revalidation
</content>
