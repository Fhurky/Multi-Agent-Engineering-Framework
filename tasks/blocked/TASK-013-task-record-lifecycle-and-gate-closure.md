---
task_id: TASK-013
title: Own task-record lifecycle transitions, route validation findings, and close gates
status: blocked
owner_role: orchestrator
llm: claude
branch: agent/claude/orchestrator/task-013
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-orchestrator-task-013
write_scope:
  - tasks/**
resource_lock: task-records
dependencies: []
required_gates: []
pre_merge_gates: []
parent_task: TASK-001
activation:
  mode: event-triggered
  trigger_source: tasks/TASK-013-ACTIVATION-LOG.md
  cursor_field: last_consumed_event_seq
  last_consumed_event_seq: 3
  max_event_seq: 3
  dispatch_condition: max_event_seq > last_consumed_event_seq
  state: quiescent
  last_activation: ACT-001
blocked_reason: Quiescent. The activation cursor equals the highest recorded event sequence, so no unconsumed activation event exists and there is no transition to perform.
exit_condition: An event with seq greater than last_consumed_event_seq is appended to tasks/TASK-013-ACTIVATION-LOG.md.
---

# TASK-013: Own task-record lifecycle transitions, route validation findings, and close gates

## Objective

Be the single owner of every change to a task record in this graph. Perform each lifecycle transition, transcribe each owner's handoff, route each validation finding to the responsible implementation author, and record gate closure — so that no implementation or validation role ever has to write outside its configured scope to keep the graph's state truthful.

## Why this task exists in this shape

The first decomposition told every task owner to record its handoff in its own task record, move that record between lifecycle directories, and update its `status` field. No implementation or validation role has `tasks/**` in its configured write scope, so following that instruction would have failed `validate-write-scope.ps1`, and obeying scope would have left every lifecycle state stale. This task removes the contradiction by making task-record mutation the exclusive responsibility of the Orchestrator role, which does own `tasks/**`.

## Activation

This task is event-triggered, not permanently ready and not timer-driven. Revision 2 gave it `status: ready`, no dependencies, and an undefined `activation: recurring`; a scheduler reading that record sees a permanently dispatchable task, redispatches it after every release, and starves every other ready task. That was finding F-104 in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`.

### Trigger source and cursor

- The trigger source is `tasks/TASK-013-ACTIVATION-LOG.md`, an append-only log with a strictly increasing integer `seq` per event. Entries are never edited or deleted.
- The cursor is `activation.last_consumed_event_seq` in this record's frontmatter. It is monotonically non-decreasing and is advanced only by an activation.
- **Dispatch condition:** `max(event.seq) > last_consumed_event_seq`.
- **Quiescent condition:** `max(event.seq) == last_consumed_event_seq`. The task then carries `activation.state: quiescent`, `status: blocked`, and lives in `tasks/blocked/` with the `blocked_reason` and `exit_condition` above. It is not selectable by the scheduler in this state.

`blocked` is the correct lifecycle placement for a quiescent recurring task: the directory holds work that cannot progress until an external condition occurs, with the reason and exit condition recorded. The typed waiting condition a scheduler evaluates is `activation.state` and the cursor, not the directory name.

### Exactly-once consumption

An activation consumes the contiguous range `(last_consumed_event_seq, max_seq]`. The effects of the activation and the cursor advance are written in **one commit**. If that commit does not land, the cursor is unchanged and the same range is consumed again by the next activation, whose effects are identical because every transition this task performs is idempotent. There is therefore no interleaving in which an event is consumed twice with effect, and none in which an event is skipped. TASK-005 implements and tests this; TASK-016 must make it representable in the runtime contracts.

### Starvation bound

The scheduler must dispatch this task within a bounded number of scheduling rounds after an event is appended, even under a saturated ready set, and must never dispatch it while it is quiescent. TASK-005 owns the test.

### Event types and the work each triggers

| `event_type` | Appended when | Work performed |
|---|---|---|
| `gate_verdict_recorded` | A gate task records a verdict in its report artifact | On a passing verdict, close the gate and move the gated tasks out of `blocked` into `ready`, clearing `blocked_reason` and naming the satisfied edge. On findings, route one remediation task per responsible owner, or record the disposition when the responsible owner is the Orchestrator itself, and move the affected record back to `in-progress` or `blocked` |
| `artifact_published` | An owner publishes an immutable commit and reaches `review_ready` | Move that record to `review`, set `status`, record `published_commit`, `published_branch`, and `publication`, and transcribe the owner's commit, verification, and risks into its Handoff section |
| `branch_integrated` | A branch is merged into `integration/autonomous-runtime` | Record the integration and release every `integrated` edge that names it |
| `human_decision_recorded` | A human records a governance decision on a non-agent branch | Update the affected record, cite the decision commit, and unblock or close it |
| `dependency_unsatisfiable` | An owner reports that a declared dependency cannot be satisfied | Move the record to `blocked` with an explicit `blocked_reason` and `exit_condition` |
| `remediation_completed` | A remediation owner publishes the fix for a routed finding | Route the fix to a new gate task in the next round |

When every gate in a task's `gate_tasks` is closed and the task is integrated, move that record to `done` and record gate closure in the activation log.

## Scope

- Perform every `status` field change and every move between `tasks/backlog/`, `tasks/ready/`, `tasks/in-progress/`, `tasks/review/`, `tasks/blocked/`, and `tasks/done/` for TASK-001 through TASK-021 and for any remediation task this task creates.
- Maintain `tasks/TASK-013-ACTIVATION-LOG.md`: append each event, record each activation, and advance the cursor in the same commit as the activation's effects.
- Transcribe each owner's handoff from its commit message, pull request description, and role report into the Handoff section of its task record. Do not invent evidence; quote what the owner recorded and name its source.
- Read the published findings from TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, TASK-019, TASK-020, and TASK-021.
- Create one remediation task per responsible implementation owner, reusing that owner's original non-overlapping write scope so no two remediation tasks collide. When the responsible owner is the Orchestrator itself, record the correction and its disposition in the activation log instead of creating a task that would route work back to this same role.
- Set each remediation task's dependencies using the typed edge vocabulary, and its `gate_for` reverse edge — with an explicit `round` — to the validating role that must revalidate.
- Create a **new** gate task for each superseding round rather than making an existing gate task re-entrant, so that a recorded verdict stays durable and each round carries its own explicit dependency.
- Maintain `tasks/TASK-001-DEPENDENCY-GRAPH.md` as tasks are added, blocked, or closed, so the graph never disagrees with the individual records.
- Record which gates are closed, which remain open, and which high or critical security findings require formal human acceptance.
- Verify that no remediation task assigns an author to review their own change.
- Exclude implementing remediation, authoring architecture, deciding any gate verdict, approving any gate outcome, and release authorization. This task records a verdict that a gate owner produced; it never produces one.

## Acceptance criteria

- [ ] No task record in this graph is modified by any role other than `orchestrator` for the whole run. A `git log --follow` over `tasks/` shows only `agent/claude/orchestrator/*` branches.
- [ ] Every lifecycle transition names its trigger event, the satisfied edge or recorded verdict that justified it, and the source artifact it was read from.
- [ ] Every finding from TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, TASK-019, TASK-020, and TASK-021 maps to exactly one remediation task, one recorded Orchestrator disposition, or one recorded formal acceptance.
- [ ] Each remediation task names one owner role, one LLM family, one branch, one worktree, and a write scope that does not overlap any other active task and does not share an active resource lock.
- [ ] Each remediation task declares the validating role that must revalidate, as a `gate_for` reverse edge with an explicit `round`, rather than as a scheduling dependency.
- [ ] No remediation task routes a change back to the same execution context that reviewed it, and no gate task is made re-entrant across rounds.
- [ ] High and critical security findings are not marked closed without recorded authorization from an authorized human.
- [ ] Gate closure status for review, security, QA, and performance is recorded explicitly per gated task in the activation log.
- [ ] `tasks/TASK-001-DEPENDENCY-GRAPH.md` matches every individual record's frontmatter after each activation.
- [ ] Each activation advances the cursor by exactly the range it consumed, in the same commit as its effects, and leaves this record quiescent when no unconsumed event remains.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Remediation task records under `tasks/`.
- Updated lifecycle placement and status for every affected child task record.
- An updated `tasks/TASK-001-DEPENDENCY-GRAPH.md`.
- An updated `tasks/TASK-013-ACTIVATION-LOG.md` containing the event log, the cursor, the per-activation summary, and the gate closure register.

## Resource lock

This task declares `resource_lock: task-records`, held by every task whose write scope includes `tasks/**`. TASK-001 holds the same lock. The two scopes are genuinely identical and are not made disjoint by sequencing; they are serialized by the lock instead. Exactly one task holding `task-records` may be claimed at a time, and the scheduler's admission gate must enforce this in the same place it enforces write-scope exclusion. TASK-013 may not be claimed while TASK-001 is active.

## Dependency notes

- This task has no scheduling dependencies. Its dispatchability is decided by the activation cursor, not by an edge.
- It is the explicit return path from validation findings to the responsible implementation author required by TASK-001.
- TASK-005 implements and tests the activation semantics defined above; TASK-016 must represent them in the runtime contracts under finding A-004.

## Activation history

Each activation appends its outcome to `tasks/TASK-013-ACTIVATION-LOG.md`.

| Activation | Events consumed | Cursor after | Outcome |
|---|---|---|---|
| `ACT-001` | 1 … 3 | 3 | Reconciled TASK-018 with HUMAN-001 at `fb9f45c`; replaced `implementation_published` with `review_ready` and `integrated`; removed TASK-015 re-entrancy and created TASK-020; created TASK-021 for decomposition round 3; routed A-001 … A-004 to TASK-016; routed F-104 and F-105 implementation to TASK-005 and TASK-017; defined this activation model |

## Handoff

Maintained by this task's own activations; each activation appends its outcome here and in the activation log.

- Commit or pull request: `ACT-001` effects are committed at `5febe3b` on `agent/claude/orchestrator/task-013`, with one follow-up commit recording that hash in the activation log and the affected records. Publication is `local-only`; this execution was instructed not to push or merge.
- Verification: recorded in `tasks/TASK-013-ACTIVATION-LOG.md`, section "Verification performed by this activation", together with the exact script results in the execution's handoff.
- Known risks:
  - Cross-task resource locks are declared but not enforced by any script today. Until TASK-005 lands admission-time enforcement, `task-records` and `architecture-docs` depend on the Orchestrator not claiming both tasks of a pair at once.
  - Every branch in this graph is `local-only`. `review_ready` is satisfied by an immutable local commit readable from the shared Git common directory, with the missing remote publication recorded rather than assumed.
  - The activation cursor is enforced by convention until TASK-005 implements it. A scheduler that ignores `activation.state` can still redispatch this task.
- Next owner: architect / claude for TASK-016, and reviewer / gpt for TASK-021. Both are dispatchable now and their write scopes are disjoint.
