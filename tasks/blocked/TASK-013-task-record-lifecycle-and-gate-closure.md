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
  last_consumed_event_seq: 15
  ingress_seq: 15
  ingress_seq_definition: max(seq) over the durable append-only ingress inbox; never a count over a ref scan, a branch set, or a commit timestamp
  dispatch_condition: ingress_seq > last_consumed_event_seq
  bootstrap_dispatch_contract: interim-operator-authorized
  bootstrap_dispatch_contract_note: Declared under finding F-401 and unchanged by ACT-006 or ACT-007. Human governance decision HUMAN-002 is approved and selects a runtime-owned durable pre-dispatch ingress observer and collector, transcribed as model correction MC-006 in tasks/TASK-013-ACTIVATION-LOG.md. That approval is a decision, not a capability. TASK-028 published a contract representation of it at fe0374c, including ADR-0023 and ADR-0031; a published contract is neither an approved contract nor an implemented collector, and TASK-029 has recorded no verdict on it. No authorized producer can yet append a durable entry outside tasks/** before this task is selected. While this field reads interim-operator-authorized, no claim is made that the ingress_seq > last_consumed_event_seq predicate is what authorized a dispatch. ACT-005, ACT-006, and ACT-007 each ran under this contract.
  bootstrap_dispatch_contract_exit: The HUMAN-002 collector is implemented by TASK-026, its contract published by TASK-028 and approved by TASK-029, its signal consumed by TASK-005, and its behavior independently validated by TASK-009 V9-F401-SCHEMA, TASK-010 V10-F401-AUTH, and TASK-011 V11-F401-PREDISPATCH. Only then does this field become durable-bootstrap-append. The prior exit condition — the absence of the governance decision itself — is discharged; what remains is the implementation and its validation, and interim operator authorization may remain only until then. It is not the final autonomous contract.
  state: quiescent
  last_activation: ACT-007
branch_point_of: agent/claude/orchestrator/task-013
scope_validation_base: 443ff9be91025b892b8fb4d764a6a49a8e811491
scope_validation_applicability: applicable and resolved, per activation
scope_validation_note: The ACT-007 authored delta is validated against the immutable branch point of this branch at the start of the activation, which is 443ff9b, the merge of pull request 16 into main. This is the first activation whose base is a main merge commit rather than the previous activation's follow-up commit, because the branch was reset to 443ff9b; that commit contains the ACT-006 follow-up e7bd748 as an ancestor, so no ACT-006 effect falls inside this activation's delta. Under findings F-403 and A-209 this is deliberately not e7bd748, not 62d6f2d, not c325275, and not a review-diff base. This field names the branch point of the activation currently running; each activation records its own value here and in its section of the activation log, and the superseded values — 62d6f2d for ACT-006, 890b8e0 for ACT-005, and c325275 for the earlier activations, which validated against it while the branch carried fewer inherited commits — stay recorded in the log rather than being retrofitted.
review_target_base: not applicable to this record
review_target_applicability: not applicable. This task declares required_gates and pre_merge_gates as empty and carries no gate_for entry, so it neither performs a gate round nor has a round pinned on it, and there is no delta under review. Its activations author revisions of TASK-001, whose review target is declared on TASK-001 and on the round's own gate task. Becomes applicable only if this task is ever given a gate of its own, which no round has proposed.
blocked_reason: Quiescent. The activation cursor equals max(seq) over the ingress inbox, so no unconsumed entry exists and there is no transition to perform.
exit_condition: An authorized producer publishes a new ingress fact inside its own write scope — a gate report commit, a task-branch publication, an integration merge, a governance commit, a dependency-unsatisfiable handoff, or a remediation publication — and an authorized appender appends it as a new inbox entry, raising max(seq) above last_consumed_event_seq. No write under tasks/ is required or permitted to create one, and no commit authored by a TASK-013 activation can create one. While bootstrap_dispatch_contract is interim-operator-authorized, the operator performs the selection and the durable predicate is recorded as not operative rather than as satisfied. HUMAN-002 has approved the runtime-owned collector that will perform the append, but it is not implemented, so this exit condition is unchanged in substance by that approval.
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

### The correction F-401 required

TASK-023 round 5 recorded, as **F-401**, that revision 5's inbox could not represent an unconsumed fact and could not have woken this task during bootstrap:

- The normative **entry schema included `consumed_by`**, while the same model required an entry to exist before consumption and required consumption state to live only in the cursor. At append time no consumer exists, so the field could only be mutated later, duplicated outside the cursor, predicted, or left false — each violating a stated rule.
- During bootstrap the consuming activation was **both the first durable appender and the consumer**. Before dispatch no durable entry existed, `ingress_seq` equalled the cursor, and the formal predicate could not be what authorized the dispatch. The claim that discovery affected only liveness did not hold.

Revision 6 corrects both, and does **not** claim the finding resolved. The schemas are split — an inbox entry carries no consumption field of any kind — and two disjoint bootstrap dispatch contracts are named, with this record declaring which one is in force.

### Three surfaces

| Surface | What it is | Who may write it |
|---|---|---|
| **Ingress inbox** | A durable append-only state store of entries, each with a stable `seq` assigned once at append, a `fact_id` content hash as its identity, and a `content_hash` over its source artifact. **No entry carries a consumption field**, and an entry is byte-identical before and after the activation that consumes it. Not a ref scan, not a commit count, not a file under `tasks/` | The ingress adapters in the runtime phase and the authorized bootstrap appender in the bootstrap phase, on behalf of the producing owners and entirely within those owners' configured write scopes. **No write under `tasks/` is required or permitted to append one, and no TASK-013 activation may append one** |
| **Ingress cursor** | `activation.last_consumed_event_seq` in this record's frontmatter. Monotonically non-decreasing, advanced only by an activation | This task, in the same commit as the activation's effects |
| **Consumption ledger** | The event table in `tasks/TASK-013-ACTIVATION-LOG.md` | This task, append-only, one row per consumed entry, written **by the consuming activation** and never afterwards |

The ledger is a record of consumption, not a queue and not the inbox. A row is a **separate record that references an entry** by `seq` and `fact_id`; it arrives already consumed and already stamped with `consumed_by`, no row is ever edited, `consumed_by` is never mutated, and a row never writes back to the entry it references. Consumption state lives in exactly one place: the cursor. A reader decides whether entry *n* is consumed by comparing *n* with the cursor, never by reading a field on the entry or the row.

### Which bootstrap dispatch contract is in force

`activation.bootstrap_dispatch_contract` declares it, and the two contracts are defined in `tasks/TASK-001-DEPENDENCY-GRAPH.md`. Today it reads `interim-operator-authorized`: the operator selects this task on the strength of a published producer commit, and **no claim is made that the durable predicate authorized the dispatch.** `ACT-005`, `ACT-006`, and `ACT-007` each ran under that contract.

**A published contract is not an implemented collector.** TASK-028 published a contract representation of the approved collector at `fe0374c`, including ADR-0023 `immutable-ingress-entries-and-named-bootstrap-dispatch-contracts` and ADR-0031 `pre-dispatch-ingress-observer-and-collector`. TASK-029 has recorded no verdict on it, so the contract is neither approved nor built, nothing appends before dispatch, and this field is unchanged. A reader who treats the publication as the capability reproduces the F-401 overclaim two levels up — first mistaking an approval for an implementation, then a publication for an approval.

**`HUMAN-002` is approved, and the contract has not changed.** The user approved it in the control session on 2026-08-05, selecting a **runtime-owned durable pre-dispatch ingress observer and collector** that lives outside `tasks/**` in the runtime control plane, validates and deduplicates an external source fact before scheduler selection, appends the immutable entry through the TASK-026 ingress store, and signals the new high-water mark to TASK-005. This task consumes entries and records ledger rows and cursor effects, and is **prohibited from appending its own trigger** — which is the F-201 self-trigger rule restated as an authorization property, and it is the reason the approved option keeps the append outside this role rather than granting it here. The decision is transcribed verbatim as `MC-006` in `tasks/TASK-013-ACTIVATION-LOG.md`; this body names that source and does not restate the decision in different words.

**An approval is not an implementation.** The collector does not exist, so nothing appends before dispatch and the durable predicate is still not what authorizes one. The exit condition in the frontmatter has therefore changed from "a human must decide" to "the approved collector must be built and independently validated", and interim operator authorization may remain only until then. It is not the final autonomous contract, and this record does not present it as one.

### Dispatch condition

`ingress_seq = max(seq)` over the inbox, or 0 when it is empty. It reads no ref, no branch set, no commit count, and no clock. It also reads no field on an entry: an entry has no consumption state to read.

- **Dispatchable:** `ingress_seq > last_consumed_event_seq`.
- **Quiescent:** `ingress_seq == last_consumed_event_seq`. This record then carries `activation.state: quiescent`, `status: blocked`, and lives in `tasks/blocked/` with the `blocked_reason` and `exit_condition` above. It is not selectable by the scheduler in this state.
- **Invalid:** `last_consumed_event_seq > ingress_seq` is rejected at load time. The cursor may never run ahead of the inbox.

Four properties make the cursor a position rather than a tally, and each answers one failure mode F-301 constructed: a `seq` is assigned once and never recomputed, so a late-discovered fact appends at the next free position and never inserts before the cursor; entries outlive the refs that carried their source commits, so a deleted branch cannot lower `ingress_seq`; class precedence yields at most one entry per commit; and a commit authored by a TASK-013 activation is never an ingress fact, so this task's own effects cannot wake it.

`blocked` is the correct lifecycle placement for a quiescent recurring task: the directory holds work that cannot progress until an external condition occurs, with the reason and exit condition recorded. The typed waiting condition a scheduler evaluates is `activation.state` and the cursor, not the directory name.

### Who observes, and why this is not manual polling

| Phase | Who appends, before dispatch | Who evaluates the predicate and dispatches | Status |
|---|---|---|---|
| Runtime phase | The ingress adapters over the durable inbox, owned by **TASK-026** | The ingress observer in `src/orchestrator/scheduling/`, owned by **TASK-005** | The durable design |
| Bootstrap phase, `durable-bootstrap-append` | The **runtime-owned durable pre-dispatch ingress collector** that `HUMAN-002` approved: it validates and deduplicates an external source fact and appends the entry through the TASK-026 store, outside `tasks/**` and in the runtime control plane, **before** this task is selected | The observer, evaluating the same predicate against the high-water mark the collector exposes or signals to TASK-005 scheduling | **Approved and specified; not operative.** Waits on TASK-028's contract, TASK-026's and TASK-005's implementation, and the TASK-009, TASK-010, and TASK-011 validations |
| Bootstrap phase, `interim-operator-authorized` | Nothing is appended before dispatch | The operator, on their own authority, on the strength of a published producer commit | **In force.** Declared in this record's frontmatter as a limitation, not as the durable predicate |

This task is not polled specially; it is selected by the same mechanism that selects TASK-029 and TASK-031. The deadlock F-201 recorded was that no authorized *producer* existed, and that is structurally false: TASK-020, TASK-022, TASK-023, TASK-024, TASK-025, TASK-027, TASK-028, and TASK-030 each woke an activation by publishing their own artifacts at `4874a9d`, `e8eb23d`, `667d3b8`, `c2ee3eb`, `aa38c7d2`, `710351fd`, `fe0374c`, and `f36e6c06`, entirely inside their own configured write scopes — and a human produced one at `0b413b7`, outside any agent scope, which is a third kind of authorized producer the model already named and had not until now exercised in epoch 2. What F-401 recorded is a different gap: an authorized **appender** with a durable place to append, before selection. That gap now has an approved owner and shape, and it is still open until the collector exists.

An undiscovered fact keeps its `fact_id`, is appended at the next free `seq` whenever it is discovered, and is consumed exactly once — so identity and position never depend on discovery. But under the interim contract the *dispatch* does, and the graph no longer claims otherwise. Late discovery costs liveness; the absence of a durable pre-dispatch entry costs the validity of the predicate, and that is recorded as an open High finding rather than as an accepted bound.

### Exactly-once consumption

An activation consumes the contiguous range `(last_consumed_event_seq, ingress_seq]`. The effects of the activation, the ledger rows for the consumed range, and the cursor advance are written in **one commit**. If that commit does not land, the cursor is unchanged, no ledger row exists, and the same range is consumed again by the next activation, whose effects are identical because every transition this task performs is idempotent. There is no interleaving in which a fact is consumed twice with effect, and none in which a fact is skipped.

### Starvation bound

The scheduler must dispatch this task within a stated bounded number of scheduling rounds after `ingress_seq` increases, even under a saturated ready set, and must never dispatch it while it is quiescent.

### Where the activation obligations are implemented and independently validated

| Obligation | Implemented by | Independently validated by |
|---|---|---|
| Durable append-only inbox, one-time `seq`, `fact_id`, `content_hash`, identity-keyed deduplication, ref-independent retention, crash-safe append | TASK-026 | TASK-009 `V9-F301-STORE`, TASK-011 `V11-F301-STORE` |
| Inbox entry carrying no consumption state, ledger row as a separate referencing record, authorized-appender check | TASK-026 | TASK-009 `V9-F401-SCHEMA`, TASK-010 `V10-F401-AUTH`, TASK-011 `V11-F401-PREDISPATCH` |
| Durable entry present before dispatch, and rejection of a dispatch whose declared contract is unsatisfied | TASK-005 | TASK-011 `V11-F401-PREDISPATCH` |
| Ingress adapters, class precedence, self-exclusion, batch order, epoch handling | TASK-026 | TASK-009 `V9-F301-CLASS`, TASK-010 `V10-F301-AUTH`, TASK-011 `V11-F301-CLASS` |
| Ingress observer, dispatch predicate, cursor monotonicity and upper bound | TASK-005 | TASK-009 `V9-A004-ACT`, TASK-011 `V11-A004-ACT` |
| One-commit effects-plus-cursor rule and crash replay | TASK-005 | TASK-011 `V11-A004-ACT` |
| Starvation bound under a saturated ready set | TASK-005 | TASK-009 `V9-A004-ACT`, TASK-011 `V11-A004-ACT` |
| End-to-end loop: gate report publication → append → observation → dispatch → effects commit → cursor advance → quiescence | — | TASK-011 `V11-A004-ACT` |
| Contract representation of the inbox, the epochs, the cursor, and the quiescent state | TASK-024, published at `c2ee3eb` | TASK-025 |
| Contract representation of the split entry / ledger-row schemas, the two named bootstrap dispatch contracts, and the approved `HUMAN-002` collector | **TASK-028** | **TASK-029** |
| The durable, authorized pre-dispatch collector outside `tasks/**` — validation, deduplication, append through the store, and the high-water-mark signal | **TASK-026**, with the signal consumed by **TASK-005** | TASK-009 `V9-F401-SCHEMA`, TASK-010 `V10-F401-AUTH`, TASK-011 `V11-F401-PREDISPATCH` |

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

- Perform every `status` field change and every move between `tasks/backlog/`, `tasks/ready/`, `tasks/in-progress/`, `tasks/review/`, `tasks/blocked/`, and `tasks/done/` for TASK-001 through TASK-031 and for any remediation task this task creates.
- Maintain `tasks/TASK-013-ACTIVATION-LOG.md`: append one ledger row per consumed ingress fact, record each activation, and advance the cursor in the same commit as the activation's effects. Never edit an existing row.
- Transcribe each owner's handoff from its commit message, pull request description, and role report into the Handoff section of its task record. Do not invent evidence; quote what the owner recorded and name its source. Where a durable fact contradicts an owner's own statement — as with TASK-021's publication — record both and do not overwrite the owner's statement.
- Read the published findings from TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, TASK-019, TASK-020, TASK-021, TASK-022, TASK-023, TASK-025, TASK-027, TASK-029, TASK-030, and TASK-031.
- Create one remediation task per responsible implementation owner, reusing that owner's original non-overlapping write scope so no two remediation tasks collide. When the responsible owner is the Orchestrator itself, record the correction and its disposition in the activation log instead of creating a task that would route work back to this same role.
- Set each remediation task's dependencies using the typed edge vocabulary, and its `gate_for` reverse edge — with an explicit `round`, `gate_class`, `retrospective`, `gate_lineage`, and `lineage_round` — to the validating role that must revalidate.
- Create a **new** gate task for each superseding round rather than making an existing gate task re-entrant, so that a recorded verdict stays durable and each round carries its own explicit dependency. Record the round as the next `lineage_round` of the relation's registered gate lineage, so a consumer of a passing baseline does not have to be retargeted when a round is superseded.
- Maintain `tasks/TASK-001-DEPENDENCY-GRAPH.md` as tasks are added, blocked, or closed, so the graph never disagrees with the individual records.
- Record which gates are closed, which remain open, and which high or critical security findings require formal human acceptance.
- Verify that no remediation task assigns an author to review their own change.
- Exclude implementing remediation, authoring architecture, implementing the ingress observer, deciding any gate verdict, approving any gate outcome, and release authorization. This task records a verdict that a gate owner produced; it never produces one.

## Acceptance criteria

- [ ] No task record in this graph is modified by any **agent role** other than `orchestrator` for the whole run. A `git log --follow` over `tasks/` shows only `agent/claude/orchestrator/*` branches **and human governance branches**. The exception is real and named rather than notional: `HUMAN-003` at `0b413b7` on `human/reroute/task-028-gpt` changed four records under `tasks/**` on the user's own authority. A human is not bound by an agent role's write scope, no agent may reverse or re-apply such an edit, and this task's obligation is to verify it and record it as an ingress fact of class `human_decision_recorded` — which `ACT-007` did at `seq` 13. A commit on any `agent/*` branch other than this one touching `tasks/` remains a violation.
- [ ] Every lifecycle transition names its trigger fact, the satisfied edge or recorded verdict that justified it, and the source artifact it was read from.
- [ ] Every finding from TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, TASK-019, TASK-020, TASK-021, TASK-022, TASK-023, TASK-025, TASK-027, TASK-029, TASK-030, and TASK-031 maps to exactly one remediation task, one recorded Orchestrator disposition, or one recorded formal acceptance.
- [ ] Each remediation task names one owner role, one LLM family, one branch, one worktree, and a write scope that does not overlap any other active task and does not share an active resource lock.
- [ ] Each remediation task declares the validating role that must revalidate, as a `gate_for` reverse edge with an explicit `round`, `gate_class`, `retrospective`, `gate_lineage`, and `lineage_round`, rather than as a scheduling dependency.
- [ ] No remediation task routes a change back to the same execution context that reviewed it, and no gate task is made re-entrant across rounds.
- [ ] High and critical security findings are not marked closed without recorded authorization from an authorized human.
- [ ] Gate closure status for review, security, QA, and performance is recorded explicitly per gated task in the activation log.
- [ ] `tasks/TASK-001-DEPENDENCY-GRAPH.md` matches every individual record's frontmatter after each activation.
- [ ] Each activation advances the cursor by exactly the range it consumed, appends exactly one ledger row per consumed inbox entry, writes both in the same commit as its effects, and leaves this record quiescent when no unconsumed entry remains.
- [ ] No ingress entry is created by a commit this task authored, and no epoch's entries are re-derived, renumbered, or reclassified by a later epoch.
- [ ] No existing ledger row is edited by any activation.
- [ ] No inbox entry is edited by an activation, and no activation writes a consumption field onto an entry; consumption is recorded only by a new ledger row and the cursor advance.
- [ ] Each activation declares the bootstrap dispatch contract it ran under and does not claim the durable predicate authorized a dispatch that it did not.
- [ ] Every record this task creates or maintains declares `review_target_base` and `scope_validation_base` as separate fields, each carrying a resolved 40-hex value, a reproducible expression with its `branch_point_of`, or an explicit `not applicable` with a stated reason and a stated becomes-applicable condition, under the applicability rule in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, section "Task baselines". Every resolved value is read from the repository rather than asserted, and every prescribed acceptance command is reproducible.
- [ ] A human governance decision this task transcribes is recorded verbatim in scope and is never treated as an implemented capability. A decision that authorizes future work leaves every dependent field, contract, and gate unchanged until the work is built and independently validated.
- [ ] All changed files remain inside this task's declared write scope, validated against the immutable branch point of this branch rather than a review-diff base.

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
| `ACT-005` | 9 … 10 | 10 | Consumed the TASK-023 round 5 `changes-required` verdict at `667d3b8` and the TASK-024 architecture-amendment publication at `c2ee3eb`. Recorded `(TASK-001, review, r5)` as `changes-required` and left it open; created **TASK-027** for decomposition lineage round 6. Split the ingress entry schema from the consumption-ledger row schema, removed `consumed_by` from the inbox entry, and named two disjoint bootstrap dispatch contracts, declaring `interim-operator-authorized` as the one in force and routing the durable one to `HUMAN-002` (F-401, **not claimed resolved**). Removed every owner-form and pair-property restatement from eleven active bodies (F-402). Separated `review_target_base` from `scope_validation_base` on every record and made the branch point reproducible (F-403). Moved TASK-023 to `done`, TASK-024 to `review` with its publication transcribed, and TASK-025 to `ready` with its target bound immutably to `c2ee3eb`, its own Part D for F-401, and an obligation covering every TASK-024 acceptance criterion. No gate was closed and no verdict was authored |
| `ACT-006` | 11 … 12 | 12 | Consumed the TASK-027 round 6 `changes-required` verdict at `710351fd` and the TASK-025 architecture verdict at `aa38c7d2`. Recorded `(TASK-001, review, r6)` as `changes-required`, and recorded TASK-025's single verdict as the three durable facts `(TASK-024, review, r1)`, `(TASK-016, review, r2)`, and `(TASK-002, review, r3)`; every relation stays open. Transcribed the approved human governance decision **`HUMAN-002`** as `MC-006` — a runtime-owned durable pre-dispatch ingress observer and collector — and routed its contract to **TASK-028**, its implementation to **TASK-026** and **TASK-005**, and its validation to TASK-009, TASK-010, and TASK-011, without implementing it and without changing the declared interim dispatch contract (F-401, **still not claimed resolved**). Corrected TASK-001's lifecycle and gate summary against the records (F-501), TASK-027's target-diff coverage statement (F-502), TASK-025's actual branch point `62d6f2d` without touching its verdict (A-209), the last live owner-form passages in TASK-016 by quarantine (F-402), and the two baseline fields on every record under an explicit applicability rule (F-403). Routed A-201 … A-208 to **TASK-028**; created **TASK-029** for architecture lineage round 4 and **TASK-030** for decomposition lineage round 7; raised the architecture edge floor to `lineage_round: 4`. Moved TASK-025 and TASK-027 to `done`. No gate was closed, no verdict was authored, and no implementation task was released |
| `ACT-007` | 13 … 15 | 15 | Consumed the human governance decision **`HUMAN-003`** at `0b413b7`, the TASK-030 round 7 `changes-required` verdict at `f36e6c06`, and the TASK-028 architecture-amendment publication at `fe0374c`. Recorded `HUMAN-003` — the TASK-028 execution-provider reroute from `claude` to `gpt` — as the second `human_decision_recorded` entry in this ledger; the user had authored its task-record effects directly, so this activation **verified and recorded** them rather than re-applying or extending them, and added a **human** row to the task-record-ownership table so the exclusivity rule states what it actually constrains. Recorded `(TASK-001, review, r7)` as `changes-required` and left it open; created **TASK-031** for decomposition lineage round 8. Corrected the architecture source binding on nine consumer records and five graph passages so that **no approved architecture source is claimed to exist** until `LIN-ARCH-REVIEW` records a passing verdict at `lineage_round` 4 or later, and stated that the lineage floor and the source clause must move together (F-601). Expanded five abbreviated `review_target_base` values to full 40-hex, read with `git rev-parse`, touching no verdict (F-602). Corrected the false `ACT-006` additions-only evidence claim as `MC-008`, by append rather than by editing the closed section, with the trade stated and routed (F-603). Added `MC-007`, defining `source_path` and `producer_task` for a `human_decision_recorded` fact, a schema gap epoch 2 had never exercised. Moved TASK-030 to `done`, TASK-028 to `review` with its publication transcribed and the `CONFLICTING` pull request 15 recorded as an integration risk, and TASK-029 to `ready` with its target bound immutably to `fe0374c`. No gate was closed, no verdict was authored, no implementation task was released, and no publication or governance decision was treated as a satisfied precondition |

## Task-record lifecycle

This record's `status` field, its lifecycle directory, and its activation cursor are changed only by this task's own activations.

## Handoff

Maintained by this task's own activations; each activation appends its outcome here and in the activation log.

- Commit or pull request: `ACT-007` effects are committed on `agent/claude/orchestrator/task-013` in one commit that carries the ledger rows for seq 13, 14, and 15, `MC-007`, `MC-008`, the cursor advance to 15, and every lifecycle effect, with one follow-up commit recording that hash for TASK-031's review target. `ACT-006` effects are at `83c1e03` with follow-up `e7bd748`, which was TASK-030's immutable review target; both are ancestors of this activation's base `443ff9b`, and they reached `main` at `1fc5f53` through pull request 13. `ACT-006` effects are committed on `agent/claude/orchestrator/task-013` in one commit that carries the ledger rows for seq 11 and 12, `MC-006`, the cursor advance to 12, and every lifecycle effect, with one follow-up commit recording that hash for TASK-030's review target. `ACT-005` effects are at `70162b0` with follow-up `62d6f2d`, which was TASK-027's immutable review target and is this activation's branch point. `ACT-005` effects are committed on `agent/claude/orchestrator/task-013` in one commit that carries the ledger rows for seq 9 and 10, the cursor advance to 10, and every lifecycle effect, with one follow-up commit recording that hash for TASK-027's review target. `ACT-004` effects are at `ac9c8f2` with follow-up `890b8e0`, which was TASK-023's immutable review target. `ACT-003` effects are at `d0c030a`. `ACT-002` effects are at `f590749` with follow-up `4f8a1cc`, which was TASK-022's immutable review target. `ACT-001` effects are at `5febe3b` with follow-up `88dc554`, integrated at `e8edbcd` and merged to `main` at `c325275` through pull request #1.
- Verification: recorded in `tasks/TASK-013-ACTIVATION-LOG.md`, section "Verification performed by this activation" for each activation, together with the exact script results in the execution's handoff.
- Known risks:
  - **F-401 is open and is not claimed resolved.** The schema split is applied to the decomposition and round 6 judged that half `resolved`. The bootstrap-dispatch half is not: TASK-025 judged four of six Part D checks `not satisfied` at `aa38c7d2`, so the published architecture contract at `c2ee3eb` still declares `consumedBy` on the inbox entry and still names neither dispatch contract. `HUMAN-002` is now **approved**, selecting a runtime-owned durable pre-dispatch collector, but the collector does not exist: `bootstrap_dispatch_contract` still reads `interim-operator-authorized`, `ACT-006` itself ran under it, and its exit is now the implementation and validation of that collector. Until then, whether a dispatch of this task was formally authorized rests on the operator rather than on the durable predicate, and the graph says so rather than claiming otherwise.
  - **A published architecture contract is now the newest way this graph could overclaim.** TASK-028 published a representation of the approved `HUMAN-002` collector at `fe0374c`, with its own owner stating plainly that it is "an architect-authored amendment, not a passing review judgment". TASK-029 has recorded nothing. The chain approval → contract → approved contract → implementation → validation has advanced by exactly one link, and every field that depends on the last two links is unchanged. `ACT-007` marks the distinction in five places.
  - **`HUMAN-003` narrowed the reviewer-independence margin on the architecture lineage.** TASK-028 and TASK-029 are both `gpt` after the reroute, so the repository's preference for a different LLM family no longer applies to `LIN-ARCH-REVIEW` round 4. The mandatory guarantee that remains is execution-context separation, which both records state explicitly and which no script enforces. Nothing detects a violation of it today except a human noticing.
  - **Pull request 15 is `CONFLICTING` against `main`.** TASK-028's branch point `0b413b7` predates the merges of pull requests 3 and 9, so twelve ADRs appear as additions rather than modifications. Nothing is blocked by it today because TASK-028 is not integrable while its `review` gate is open, but it will have to be resolved before the amendment can merge, and resolving it is not an Orchestrator action.
  - **An approved governance decision is the newest way this graph could overclaim.** `HUMAN-002` changes what is routed and to whom; it changes no contract, no gate, and no declared field. A later reader who treats the approval as a satisfied precondition would reintroduce exactly the defect F-401 recorded. `ACT-006` states the distinction in five places rather than one, and nothing enforces it until TASK-005's validator lands.
  - Cross-task resource locks are declared but not enforced by any script today. Until TASK-005 lands admission-time enforcement, `task-records` and `architecture-docs` depend on the Orchestrator not claiming two holders at once. At `ACT-006` the `architecture-docs` lock is **free** — the stale TASK-024 lock that `ACT-005` recorded has been released — and the lock now has four registered holders rather than three, because TASK-028 joins them.
  - **Nine High architecture findings are open across two rounds.** A-102 and A-103 from round 2 remain unresolved, and round 3 added A-201 … A-207. TASK-024 published its remediation at `c2ee3eb` and TASK-025 rejected it, so the graph's own assumption that a workspace or process side effect is preceded by durable intent is not merely unproven but independently judged unsupported at the reviewed commit.
  - **The architecture lineage has failed three times.** Every consumer edge now waits at `lineage_round: 4`. If round 4 also fails, nine tasks wait another full amendment cycle, and this pattern has held for three rounds.
  - The ingress inbox is specified and routed but not executable. Until TASK-026 and TASK-005 are integrated, discovery of a published fact is performed by the human operator, and under the interim contract so is the dispatch decision itself. Identity, position, and deduplication remain durable and do not depend on that substitution.
  - Epoch 1's high-water mark is retained as history and is **not** reproducible under its own rule. A reader who recomputes it will disagree with rows 1 … 6. That is recorded deliberately in `MC-003` rather than repaired by editing rows this log promises never to edit, and it means the append-only guarantee is stronger than the derivability guarantee for that epoch.
  - The lineage model removes the F-302 deadlock but adds a second register that must agree with 41 pairs of frontmatter. Nothing enforces that agreement until TASK-005 implements invariant 8; until then it is checked by the Orchestrator at each activation and by each review round.
  - Publication is mixed. TASK-001, TASK-016, TASK-020, TASK-021, TASK-022, TASK-023, TASK-024, TASK-025, and TASK-027 are remotely published; TASK-002, TASK-014, and TASK-015 remain `publication: local-only` with a recorded reason under the `bootstrap` publication class. That class never satisfies `review_ready` for a `runtime`-class task.
  - The activation cursor is enforced by convention until TASK-005 implements it. A scheduler that ignores `activation.state` can still redispatch this task.
  - **`HUMAN-002` has no durable governance commit.** `HUMAN-001` was recorded as a tracked commit `fb9f45c` on a non-agent branch, which is what made it an ingress fact. `HUMAN-002` was given in the control session and is durable only as this Orchestrator's transcription inside `tasks/**`. It therefore raised no `ingress_seq` and is not an entry in the inbox. If the user wants the same provenance `HUMAN-001` has, a governance commit recording the decision outside `tasks/**` is the remaining step; this activation cannot author one.
- Next owner: **reviewer / gpt for TASK-029**, the independent review of the third architecture amendment, `ready` and dispatchable now on the satisfied `review_ready(TASK-028)` edge at `fe0374c`. It records one verdict applied atomically to four `LIN-ARCH-REVIEW` round-4 relations and decides whether nine implementation tasks may leave `blocked`. **reviewer / gpt for TASK-031**, decomposition review round 8, is `ready` and dispatchable in parallel; its report path is disjoint from every other active scope and it holds no resource lock. Both must run in execution contexts separate from each other and from the TASK-028 author context. TASK-013 returns to `quiescent` at cursor 15 and is not selectable until a further ingress fact is appended.
