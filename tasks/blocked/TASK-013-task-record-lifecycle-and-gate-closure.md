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
publication_class: bootstrap
activation:
  mode: event-triggered
  ingress_model: tasks/TASK-001-DEPENDENCY-GRAPH.md#task-013-activation-and-event-ingress-model
  ingress_inbox_owner: TASK-026
  ingress_observer_owner: TASK-005
  consumption_ledger: tasks/TASK-013-ACTIVATION-LOG.md
  cursor_field: last_consumed_event_seq
  ingress_epoch: 2
  ingress_epoch_seq_base: 6
  last_consumed_event_seq: 8
  ingress_seq: 8
  ingress_seq_definition: max(seq) over the durable append-only ingress inbox; never a count over a ref scan, a branch set, or a commit timestamp
  dispatch_condition: ingress_seq > last_consumed_event_seq
  state: quiescent
  last_activation: ACT-004
blocked_reason: Quiescent. The activation cursor equals max(seq) over the ingress inbox, so no unconsumed entry exists and there is no transition to perform.
exit_condition: An authorized producer publishes a new ingress fact inside its own write scope — a gate report commit, a task-branch publication, an integration merge, a governance commit, a dependency-unsatisfiable handoff, or a remediation publication — and an ingress adapter appends it as a new inbox entry, raising max(seq) above last_consumed_event_seq. No write under tasks/ is required or permitted to create one, and no commit authored by a TASK-013 activation can create one.
---

# TASK-013: Own task-record lifecycle transitions, route validation findings, and close gates

## Objective

Be the single owner of every change to a task record in this graph. Perform each lifecycle transition, transcribe each owner's handoff, route each validation finding to the responsible implementation author, and record gate closure — so that no implementation or validation role ever has to write outside its configured scope to keep the graph's state truthful.

## Why this task exists in this shape

The first decomposition told every task owner to record its handoff in its own task record, move that record between lifecycle directories, and update its `status` field. No implementation or validation role has `tasks/**` in its configured write scope, so following that instruction would have failed `validate-write-scope.ps1`, and obeying scope would have left every lifecycle state stale. This task removes the contradiction by making task-record mutation the exclusive responsibility of the Orchestrator role, which does own `tasks/**`.

That exclusivity is also what produced finding F-201. The activation model below is what makes it survivable.

## Activation

This task is event-triggered: not permanently ready, not timer-driven, and not self-triggered.

### The correction F-201 required

Revision 2 gave this task `status: ready`, no dependencies, and an undefined `activation: recurring`. A scheduler reading that record sees a permanently dispatchable task and starves every other ready task. That was finding F-104.

Revision 3 replaced it with a cursor over an append-only log — and TASK-021 round 3 recorded, as **F-201**, that the replacement was both deadlocked and internally impossible:

- The dispatch signal was a row in `tasks/TASK-013-ACTIVATION-LOG.md`, and this task is the only task authorized to write under `tasks/`. After TASK-021 recorded its verdict, no other task or component had a write-authorized operation that could create the row. The cursor stayed at 3, `max(event.seq)` stayed at 3, and this task could never wake to close TASK-001's gate.
- The log declared rows immutable, declared an empty `consumed_by` the signal of dispatchability, and required TASK-005 to later set `consumed_by` exactly once. Setting the field edits an immutable row; not setting it means the dispatch signal never appears.

Revision 4 replaced the model rather than patching it: **the event producer is no longer this task, and the dispatch signal is no longer a row in a file this task owns.**

### The correction F-301 required

TASK-022 round 4 recorded, as **F-301**, that revision 4 fixed the producer but not the cursor. Its observation rule counted matching facts reachable from mutable refs and ordered them by committer timestamp, so a backdated commit inserted before the cursor, a deleted branch lowered the count below it, a commit matching several classes had no rule, and this task's own effects commit matched `remediation_completed` — which meant quiescence could never be demonstrated. `ingress_seq = 5` was not reproducible.

Revision 5 replaces the observation rule with a **durable append-only ingress inbox**. The full model, the entry schema, the canonical identity tuple, the class precedence order, and the epoch rules are normative in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, section "TASK-013 activation and event-ingress model". The summary below does not restate a value that document declares.

### Three surfaces

| Surface | What it is | Who may write it |
|---|---|---|
| **Ingress inbox** | A durable append-only state store of entries, each with a stable `seq` assigned once at append, a `fact_id` content hash as its identity, and a `content_hash` over its source artifact. Not a ref scan, not a commit count, not a file under `tasks/` | The ingress adapters on behalf of the producing owners, entirely within those owners' configured write scopes. **No write under `tasks/` is required or permitted to append one** |
| **Ingress cursor** | `activation.last_consumed_event_seq` in this record's frontmatter. Monotonically non-decreasing, advanced only by an activation | This task, in the same commit as the activation's effects |
| **Consumption ledger** | The event table in `tasks/TASK-013-ACTIVATION-LOG.md` | This task, append-only, one row per consumed entry, written **by the consuming activation** and never afterwards |

The ledger is a record of consumption, not a queue and not the inbox. A row arrives already consumed and already stamped with `consumed_by`, so no row is ever edited and `consumed_by` is never mutated. Consumption state lives in exactly one place: the cursor.

### Dispatch condition

`ingress_seq = max(seq)` over the inbox, or 0 when it is empty. It reads no ref, no branch set, no commit count, and no clock.

- **Dispatchable:** `ingress_seq > last_consumed_event_seq`.
- **Quiescent:** `ingress_seq == last_consumed_event_seq`. This record then carries `activation.state: quiescent`, `status: blocked`, and lives in `tasks/blocked/` with the `blocked_reason` and `exit_condition` above. It is not selectable by the scheduler in this state.
- **Invalid:** `last_consumed_event_seq > ingress_seq` is rejected at load time. The cursor may never run ahead of the inbox.

Four properties make the cursor a position rather than a tally, and each answers one failure mode F-301 constructed: a `seq` is assigned once and never recomputed, so a late-discovered fact appends at the next free position and never inserts before the cursor; entries outlive the refs that carried their source commits, so a deleted branch cannot lower `ingress_seq`; class precedence yields at most one entry per commit; and a commit authored by a TASK-013 activation is never an ingress fact, so this task's own effects cannot wake it.

`blocked` is the correct lifecycle placement for a quiescent recurring task: the directory holds work that cannot progress until an external condition occurs, with the reason and exit condition recorded. The typed waiting condition a scheduler evaluates is `activation.state` and the cursor, not the directory name.

### Who observes, and why this is not manual polling

| Phase | Who appends | Who evaluates the predicate and dispatches | Status |
|---|---|---|---|
| Runtime phase | The ingress adapters over the durable inbox, owned by **TASK-026** | The scheduler in `src/orchestrator/scheduling/`, owned by **TASK-005** | The durable design |
| Bootstrap phase | The activation records each appended entry's full identity in the consumption ledger, which is the durable record of the inbox until TASK-026 exists | The human operator who launches each CLI session | The same operator-driven scheduler that dispatches **every** bootstrap task, with a named exit: it ends when TASK-026 and TASK-005 are integrated |

The bootstrap substitution replaces **discovery**, not the producer, the identity of a fact, its position, or the cursor. This task is not polled specially; it is selected by the same mechanism that selects TASK-023 and TASK-024. The deadlock F-201 recorded was that no authorized producer existed, and that is structurally false: TASK-020 and TASK-022 each woke this activation by publishing their own reports at `4874a9d` and `e8eb23d`, entirely inside the reviewer role's configured write scope.

An undiscovered fact keeps its `fact_id`, is appended at the next free `seq` whenever it is discovered, and is consumed exactly once. Late discovery costs liveness, never correctness — that is the distinction that makes the bootstrap substitution an honest bounded limitation rather than the count-based scan F-301 rejected.

### Exactly-once consumption

An activation consumes the contiguous range `(last_consumed_event_seq, ingress_seq]`. The effects of the activation, the ledger rows for the consumed range, and the cursor advance are written in **one commit**. If that commit does not land, the cursor is unchanged, no ledger row exists, and the same range is consumed again by the next activation, whose effects are identical because every transition this task performs is idempotent. There is no interleaving in which a fact is consumed twice with effect, and none in which a fact is skipped.

### Starvation bound

The scheduler must dispatch this task within a stated bounded number of scheduling rounds after `ingress_seq` increases, even under a saturated ready set, and must never dispatch it while it is quiescent.

### Where the activation obligations are implemented and independently validated

| Obligation | Implemented by | Independently validated by |
|---|---|---|
| Durable append-only inbox, one-time `seq`, `fact_id`, `content_hash`, identity-keyed deduplication, ref-independent retention, crash-safe append | TASK-026 | TASK-009 `V9-F301-STORE`, TASK-011 `V11-F301-STORE` |
| Ingress adapters, class precedence, self-exclusion, batch order, epoch handling | TASK-026 | TASK-009 `V9-F301-CLASS`, TASK-010 `V10-F301-AUTH`, TASK-011 `V11-F301-CLASS` |
| Ingress observer, dispatch predicate, cursor monotonicity and upper bound | TASK-005 | TASK-009 `V9-A004-ACT`, TASK-011 `V11-A004-ACT` |
| One-commit effects-plus-cursor rule and crash replay | TASK-005 | TASK-011 `V11-A004-ACT` |
| Starvation bound under a saturated ready set | TASK-005 | TASK-009 `V9-A004-ACT`, TASK-011 `V11-A004-ACT` |
| End-to-end loop: gate report publication → append → observation → dispatch → effects commit → cursor advance → quiescence | — | TASK-011 `V11-A004-ACT` |
| Contract representation of the inbox, the epochs, the cursor, and the quiescent state | TASK-024 | TASK-025 |

This task owns the specification and the task-record surface it operates on. It does not own the implementation: `src/orchestrator/**` and `tests/**` are outside the orchestrator role's configured write scope.

### Event types and the work each triggers

| `event_type` | Ingress fact | Work performed |
|---|---|---|
| `gate_verdict_recorded` | A gate owner publishes a commit that records a verdict in its own report artifact | On a passing verdict, close the gate and move the gated tasks out of `blocked` into `ready`, clearing `blocked_reason` and naming the satisfied edge. On findings, route one remediation task per responsible owner, or record the disposition when the responsible owner is the Orchestrator itself, and move the affected record back to `in-progress` or `blocked` |
| `artifact_published` | An owner publishes an immutable commit and reaches `review_ready` under its declared `publication_class` | Move that record to `review`, set `status`, record `published_commit`, `published_branch`, `publication_class`, and `publication`, and transcribe the owner's commit, verification, and risks into its Handoff section |
| `branch_integrated` | A branch is merged into `integration/autonomous-runtime`, or that branch is merged into `main` | Record the integration and release every `integrated` edge that names it; update any publication fact the merge changes |
| `human_decision_recorded` | A human records a governance decision on a non-agent branch | Update the affected record, cite the decision commit, and unblock or close it |
| `dependency_unsatisfiable` | An owner's published handoff reports that a declared dependency cannot be satisfied | Move the record to `blocked` with an explicit `blocked_reason` and `exit_condition` |
| `remediation_completed` | A remediation owner publishes the fix for a routed finding | Route the fix to a new gate task in the next round |

When every gate in a task's `gate_tasks` is closed and the task is integrated, move that record to `done` and record gate closure in the activation log.

## Scope

- Perform every `status` field change and every move between `tasks/backlog/`, `tasks/ready/`, `tasks/in-progress/`, `tasks/review/`, `tasks/blocked/`, and `tasks/done/` for TASK-001 through TASK-026 and for any remediation task this task creates.
- Maintain `tasks/TASK-013-ACTIVATION-LOG.md`: append one ledger row per consumed ingress fact, record each activation, and advance the cursor in the same commit as the activation's effects. Never edit an existing row.
- Transcribe each owner's handoff from its commit message, pull request description, and role report into the Handoff section of its task record. Do not invent evidence; quote what the owner recorded and name its source. Where a durable fact contradicts an owner's own statement — as with TASK-021's publication — record both and do not overwrite the owner's statement.
- Read the published findings from TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, TASK-019, TASK-020, TASK-021, TASK-022, TASK-023, and TASK-025.
- Create one remediation task per responsible implementation owner, reusing that owner's original non-overlapping write scope so no two remediation tasks collide. When the responsible owner is the Orchestrator itself, record the correction and its disposition in the activation log instead of creating a task that would route work back to this same role.
- Set each remediation task's dependencies using the typed edge vocabulary, and its `gate_for` reverse edge — with an explicit `round`, `gate_class`, `retrospective`, `gate_lineage`, and `lineage_round` — to the validating role that must revalidate.
- Create a **new** gate task for each superseding round rather than making an existing gate task re-entrant, so that a recorded verdict stays durable and each round carries its own explicit dependency. Record the round as the next `lineage_round` of the relation's registered gate lineage, so a consumer of a passing baseline does not have to be retargeted when a round is superseded.
- Maintain `tasks/TASK-001-DEPENDENCY-GRAPH.md` as tasks are added, blocked, or closed, so the graph never disagrees with the individual records.
- Record which gates are closed, which remain open, and which high or critical security findings require formal human acceptance.
- Verify that no remediation task assigns an author to review their own change.
- Exclude implementing remediation, authoring architecture, implementing the ingress observer, deciding any gate verdict, approving any gate outcome, and release authorization. This task records a verdict that a gate owner produced; it never produces one.

## Acceptance criteria

- [ ] No task record in this graph is modified by any role other than `orchestrator` for the whole run. A `git log --follow` over `tasks/` shows only `agent/claude/orchestrator/*` branches.
- [ ] Every lifecycle transition names its trigger fact, the satisfied edge or recorded verdict that justified it, and the source artifact it was read from.
- [ ] Every finding from TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, TASK-019, TASK-020, TASK-021, TASK-022, TASK-023, and TASK-025 maps to exactly one remediation task, one recorded Orchestrator disposition, or one recorded formal acceptance.
- [ ] Each remediation task names one owner role, one LLM family, one branch, one worktree, and a write scope that does not overlap any other active task and does not share an active resource lock.
- [ ] Each remediation task declares the validating role that must revalidate, as a `gate_for` reverse edge with an explicit `round`, `gate_class`, `retrospective`, `gate_lineage`, and `lineage_round`, rather than as a scheduling dependency.
- [ ] No remediation task routes a change back to the same execution context that reviewed it, and no gate task is made re-entrant across rounds.
- [ ] High and critical security findings are not marked closed without recorded authorization from an authorized human.
- [ ] Gate closure status for review, security, QA, and performance is recorded explicitly per gated task in the activation log.
- [ ] `tasks/TASK-001-DEPENDENCY-GRAPH.md` matches every individual record's frontmatter after each activation.
- [ ] Each activation advances the cursor by exactly the range it consumed, appends exactly one ledger row per consumed inbox entry, writes both in the same commit as its effects, and leaves this record quiescent when no unconsumed entry remains.
- [ ] No ingress entry is created by a commit this task authored, and no epoch's entries are re-derived, renumbered, or reclassified by a later epoch.
- [ ] No existing ledger row is edited by any activation.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Remediation task records under `tasks/`.
- Updated lifecycle placement and status for every affected child task record.
- An updated `tasks/TASK-001-DEPENDENCY-GRAPH.md`.
- An updated `tasks/TASK-013-ACTIVATION-LOG.md` containing the consumption ledger, the cursor, the per-activation summary, the model-correction register, and the gate closure register.

## Resource lock

This task declares `resource_lock: task-records`, held by every task whose write scope includes `tasks/**`. TASK-001 holds the same lock. The two scopes are genuinely identical and are not made disjoint by sequencing; they are serialized by the lock instead. Exactly one task holding `task-records` may be claimed at a time, and the scheduler's admission gate must enforce this in the same place it enforces write-scope exclusion. TASK-013 may not be claimed while TASK-001 is active.

## Dependency notes

- This task has no scheduling dependencies. Its dispatchability is decided by the activation cursor against the observed ingress high-water mark, not by an edge.
- It is the explicit return path from validation findings to the responsible implementation author required by TASK-001.
- TASK-005 implements and tests the ingress observer and the activation semantics defined above; TASK-011 owns the end-to-end loop test; TASK-016 must represent them in the runtime contracts under finding A-004, and TASK-020 checks that it did.

## Activation history

Each activation appends its outcome to `tasks/TASK-013-ACTIVATION-LOG.md`.

| Activation | Facts consumed | Cursor after | Outcome |
|---|---|---|---|
| `ACT-001` | 1 … 3 | 3 | Reconciled TASK-018 with HUMAN-001 at `fb9f45c`; replaced `implementation_published` with `review_ready` and `integrated`; removed TASK-015 re-entrancy and created TASK-020; created TASK-021 for decomposition round 3; routed A-001 … A-004 to TASK-016; routed F-104 and F-105 implementation to TASK-005 and TASK-017; defined the revision-3 activation model |
| `ACT-002` | 4 … 5 | 5 | Consumed the integration and publication of the `ACT-001` effects, and the TASK-021 round 3 `changes-required` verdict. Replaced the deadlocked activation model with the three-surface ingress model (F-201); made the required-behavior matrix truthful with eighteen tagged validator obligations and the amended normative-source rule (F-202); declared `gate_class` and `retrospective` on every gate pair with an aggregate/retrospective register (F-203); retyped TASK-012's QA edge to the owner form of `gate_passed` and added invariant 6 (F-204); completed the round-1 revalidation metadata and fixed the TASK-020 verdict cardinality to one verdict applied atomically to two relations (F-205); closed out the residual halves of F-101 and F-104; moved TASK-021 to `done`; created TASK-022 for round 4 |
| `ACT-003` | 6 | 6 | Consumed the TASK-016 architecture-amendment publication at `8d0c570` with pull request #3. Moved TASK-016 from `ready` to `review`, recording its publication facts and transcribing its owner's commit, verification, limitations, and next owner; moved TASK-020 from `blocked` to `ready` on the now-satisfied `review_ready(TASK-016)` edge, clearing only the obsolete `blocked_reason` and `exit_condition` and recording the satisfying edge and its evidence; reconciled the graph's lifecycle, publication, ownership-gap, and resource-lock statements. No gate was closed, no verdict was authored, and no edge semantics, finding disposition, validator criterion, wave, role scope, or review target changed |
| `ACT-004` | 7 … 8 | 8 | Consumed two independent `changes-required` verdicts. Recorded TASK-020's single verdict as the two durable facts `(TASK-016, review, r1)` and `(TASK-002, review, r2)`, and TASK-022's round 4 verdict on `(TASK-001, review, r4)`; every relation stays open. Replaced the count-over-mutable-refs observation rule with the durable append-only ingress inbox, declared ingress epoch 2 with `seq_base = 6`, and sealed epoch 1 without editing a row (F-301). Withdrew the owner form of `gate_passed`, introduced the lineage form and eight registered gate lineages with invariant 8, and retyped TASK-012's QA edge and the nine architecture edges (F-302). Removed the three contradictory `retrospective` passages and made pair metadata normative in exactly one place (F-303). Routed A-101 … A-105 and the ingress contract to new **TASK-024**; created **TASK-025** for architecture lineage round 3, **TASK-023** for decomposition lineage round 5, and **TASK-026** for the ingress inbox implementation. Moved TASK-020 and TASK-022 to `done`. No gate was closed and no verdict was authored |

## Task-record lifecycle

This record's `status` field, its lifecycle directory, and its activation cursor are changed only by this task's own activations.

## Handoff

Maintained by this task's own activations; each activation appends its outcome here and in the activation log.

- Commit or pull request: `ACT-004` effects are committed on `agent/claude/orchestrator/task-013` in one commit that carries the ledger rows for seq 7 and 8, the epoch-2 declaration, the cursor advance to 8, and every lifecycle effect, with one follow-up commit recording that hash for TASK-023's review target. `ACT-003` effects are at `d0c030a`. `ACT-002` effects are at `f590749` with follow-up `4f8a1cc`, which was TASK-022's immutable review target. `ACT-001` effects are at `5febe3b` with follow-up `88dc554`, integrated at `e8edbcd` and merged to `main` at `c325275` through pull request #1.
- Verification: recorded in `tasks/TASK-013-ACTIVATION-LOG.md`, section "Verification performed by this activation" for each activation, together with the exact script results in the execution's handoff.
- Known risks:
  - Cross-task resource locks are declared but not enforced by any script today. Until TASK-005 lands admission-time enforcement, `task-records` and `architecture-docs` depend on the Orchestrator not claiming two holders at once. `architecture-docs` now has three declared holders — TASK-002, TASK-016, and TASK-024 — which widens the surface the convention has to cover. At `ACT-004` the lock is free.
  - Two High-severity architecture findings, A-102 and A-103, describe contract seams that cannot provide the durability they promise. The remediation is routed to TASK-024, but until TASK-025 records a passing verdict the graph's own assumption that a workspace or process side effect is preceded by durable intent is unproven. TASK-023 is asked to report whether the decomposition over-relies on it.
  - The ingress inbox is specified and routed but not executable. Until TASK-026 and TASK-005 are integrated, discovery of a published fact is performed by the human operator. Identity, position, deduplication, and the cursor are durable and do not depend on that substitution, so the exposure is liveness rather than correctness — but the substitution is not machine-enforced and the exit is a whole wave away.
  - Epoch 1's high-water mark is retained as history and is **not** reproducible under its own rule. A reader who recomputes it will disagree with rows 1 … 6. That is recorded deliberately in `MC-003` rather than repaired by editing rows this log promises never to edit, and it means the append-only guarantee is stronger than the derivability guarantee for that epoch.
  - The lineage model removes the F-302 deadlock but adds a second register that must agree with 40 pairs of frontmatter. Nothing enforces that agreement until TASK-005 implements invariant 8; until then it is checked by the Orchestrator at each activation and by each review round.
  - Publication is mixed. TASK-001, TASK-016, TASK-020, TASK-021, and TASK-022 are remotely published; TASK-002, TASK-014, and TASK-015 remain `publication: local-only` with a recorded reason under the `bootstrap` publication class. That class never satisfies `review_ready` for a `runtime`-class task.
  - The activation cursor is enforced by convention until TASK-005 implements it. A scheduler that ignores `activation.state` can still redispatch this task.
- Next owner: **architect / claude for TASK-024**, the second architecture amendment, `ready` and dispatchable now on the satisfied `gate_recorded(TASK-020)` edge with the `architecture-docs` lock free. **reviewer / gpt for TASK-023**, decomposition review round 5, is `ready` and dispatchable in parallel; its report path is disjoint from every other active scope and it holds no resource lock. TASK-013 returns to `quiescent` at cursor 8 and is not selectable until a further ingress fact is appended.
