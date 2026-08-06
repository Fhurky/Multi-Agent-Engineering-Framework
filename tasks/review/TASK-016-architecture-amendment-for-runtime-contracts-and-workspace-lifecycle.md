---
task_id: TASK-016
title: Amend the runtime architecture for crash-atomic journal batches, legal recovery transitions, live control and process-tree ownership, typed scheduling contracts, and the agent workspace lifecycle module
status: review
owner_role: architect
llm: claude
branch: agent/claude/architect/task-016
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-architect-task-016
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/runtime/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies:
  - task: TASK-015
    edge: gate_recorded
required_gates:
  - review
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-020
    gate: review
    round: 1
    verdict: changes-required
    verdict_recorded_at: 4874a9d
    remediated_by: TASK-024
    revalidated_by: TASK-025
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 2
  - task: TASK-025
    gate: review
    round: 2
    verdict: changes-required
    verdict_recorded_at: aa38c7d2e095f6ffd108bbd737a9862e1bff3ec2
    remediated_by: TASK-028
    revalidated_by: TASK-029
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 3
  - task: TASK-029
    gate: review
    round: 3
    verdict: changes-required
    verdict_recorded_at: 3df261fa8f3a65bb20b9c5d6d316d8cb600a0d8c
    remediated_by: TASK-032
    revalidated_by: TASK-033
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 4
  - task: TASK-033
    gate: review
    round: 4
    verdict: changes-required
    verdict_recorded_at: 3660cc2bf0bbe5bfcf4c76ad2c3401d4c4bfa0da
    remediated_by: TASK-034
    revalidated_by: TASK-035
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 5
  - task: TASK-035
    gate: review
    round: 5
    verdict: changes-required
    verdict_recorded_at: afed1012b5f6a6febe33a0a007234fbaba987a38
    remediated_by: TASK-036
    revalidated_by: TASK-037
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 6
  - task: TASK-037
    gate: review
    round: 6
    verdict: changes-required
    verdict_recorded_at: 9bb75d9705533e52e150cafb6fa87a382496c90c
    remediated_by: TASK-038
    revalidated_by: TASK-039
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 7
  - task: TASK-039
    gate: review
    round: 7
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 8
parent_task: TASK-001
publication_class: bootstrap
published_commit: 8d0c570
published_branch: agent/claude/architect/task-016
published_remote_ref: origin/agent/claude/architect/task-016
pull_request: https://github.com/Fhurky/Multi-Agent-Engineering-Framework/pull/3
pull_request_target: main
publication: published
publication_recorded_by: ACT-003
amended_by:
  - activation: ACT-002
    change: additive
    summary: Scope item 4's referenced specification in tasks/blocked/TASK-013-task-record-lifecycle-and-gate-closure.md was rewritten to the three-surface event-ingress model under finding F-201. This record's scope, dependencies, gates, and write scope are unchanged; the incorporation is by reference and was already present.
remediates:
  - finding: A-001
    source: reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md
  - finding: A-002
    source: reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md
  - finding: A-003
    source: reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md
  - finding: A-004
    source: reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md
review_target_branch: agent/claude/architect/task-016
review_target_commit: 8d0c570e190a534a7ae929377ed19b1675bbde86
review_target_base: 9576fc96d0fa5ec8460c0208995bd2fe2295523c
review_target_applicability: applicable and resolved
review_target_note: TASK-020 round 1 reviewed this task's immutable published commit 8d0c570 against review-diff base 9576fc9, the TASK-002 architecture this amendment revises. Round 2, carried by TASK-025, reviewed the TASK-024 remediation against its own base recorded on TASK-024; round 3 is carried by TASK-029 against TASK-028's base. This field names the base of the artifact this record owns.
branch_point_of: main
scope_validation_base: c325275ea13918a9766b71a6350821af1c3c471d
scope_validation_applicability: applicable and resolved
scope_validation_note: Resolved by activation ACT-006 from the repository rather than asserted. This branch has one authored commit, 8d0c570, whose parent is c325275, the pull request #1 merge on main. git diff --name-only c325275...8d0c570 returns 29 paths, every one under docs/ or diagrams/architecture/, which is inside this task's declared write scope, and the owner recorded valid True over 29 files against this value. The merge-base derivation is no longer usable on this branch, because 8d0c570 has since been merged into main and git merge-base agent/claude/architect/task-016 main now returns the branch head rather than the branch point. The recorded 40-hex value is the durable fact; see the Task baselines rule in tasks/TASK-001-DEPENDENCY-GRAPH.md.
---

# TASK-016: Amend the runtime architecture for crash-atomic journal batches, legal recovery transitions, live control and process-tree ownership, typed scheduling contracts, and the agent workspace lifecycle module

> **Quarantined authoring instruction.** This record is the brief under which the published amendment `8d0c570` was authored and under which TASK-020 judged it. Its scope items and acceptance criteria describe the vocabulary as it stood at revision 4 and are **superseded** by the registers and edge semantics in `tasks/TASK-001-DEPENDENCY-GRAPH.md`. Two passages describing the withdrawn **owner form** of `gate_passed` as live are struck in place, dated to activation `ACT-006`, and marked as history — that is the correction finding **F-402** required at round 6. They are struck rather than rewritten because rewriting an authoring brief after its independent review would change what that reviewer was asked to check; TASK-020's recorded verdict and its A-004 disposition are durable and are not touched. This record's frontmatter — its gate relations, verdicts, and pair properties — remains normative. No live obligation of this task is stated anywhere in this body that is not also in the frontmatter or in a register.

## Objective

Produce one architecture amendment that resolves every blocking finding TASK-015 round 1 recorded against the TASK-002 architecture and adds the missing agent workspace lifecycle module, so that TASK-003 through TASK-008 and TASK-017 can implement against a normative, executable contract set instead of one that cannot express the graph they are scheduled by.

## Why this amendment is required

Two independent sources converge on this task.

**TASK-015 round 1 returned `changes-required` on TASK-002 at commit `9576fc9`**, with four high-severity findings recorded in `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`. The report states plainly that TASK-003 through TASK-008 and TASK-017 must remain `blocked` on the strength of that verdict, and that the architect should resolve the findings through this task. The Orchestrator does not judge those findings and does not decide the architecture; it routes them here, which is the return path defined in `tasks/TASK-001-DEPENDENCY-GRAPH.md`.

**The module map has no owner for the agent workspace lifecycle.** The architecture defines `AgentInvocation` with a `worktreePath` and a `branch`, and `docs/architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md` records that the runtime resolves the worktree at dispatch, but none of the six modules in `docs/architecture/runtime/COMPONENT-BOUNDARIES.md` owns creating that worktree, creating that branch, installing the repository hooks, claiming the task lock, validating the write scope, publishing the branch, persisting the commit and handoff, or releasing the lock. `AGENTS.md` makes that protocol mandatory for every agent task, so without an owning module the single-command supervisor would still require a human at every dispatch, or would run agents in a shared checkout.

Both are the architect's decisions to make. This task is a single owner holding the `architecture-docs` resource lock, so the whole amendment lands as one reviewable change set rather than as two competing versions of the same documents.

## Scope

The five items below are all required. Each is an amendment that names what it supersedes; no existing contract is silently rewritten.

### 1. Crash-atomic journal batches — remediates A-001

- Replace the claim that serializing multiple newline-delimited event envelopes into one buffer and fsyncing it makes the persisted batch all-or-nothing. Append and fsync provide durability, not transaction atomicity for an arbitrarily sized buffer; a crash can persist a valid prefix and a torn final line, and the current restore rule discards only the torn tail.
- Define a recoverable batch boundary. Acceptable mechanisms named by the finding are a batch identifier plus a durable commit record, a length-prefixed and checksummed transaction frame, or one atomically replaced segment file. Choose one and state why.
- State the restore post-condition normatively: restore exposes either every event in a committed batch or none of it.
- State the crash-point obligations an implementer must test: after every partial write boundary, and immediately before and after the commit marker.
- Amend `DURABLE-STATE-AND-CHECKPOINTS.md`, and reconcile the dependent claims in `STATE-MACHINE.md`, `LIFECYCLE-AND-BOOTSTRAP.md`, `CRASH-RECOVERY.md`, and the summary in `docs/architecture/ARCHITECTURE.md`.

### 2. Legal recovery transitions — remediates A-002

- Recovery phase 4 emits `LeaseExpired`, which moves a `running` task to `ready`; phases 5 and 6 then emit `WorkerSucceeded`, `TaskBlocked`, or `TaskTimedOut`, which are legal only from `running`. The documented all-or-nothing recovery batch therefore rejects ordinary crash cases instead of completing recovery.
- Resolve it by either defining recovery-specific transitions with explicit guards and record effects, or determining the final reconciliation outcome before emitting exactly one legal task transition. State which, and state the invariant that makes every recovery batch legal by construction.
- State the transition-table and batch-order test obligations for every combination of lease state, ledger state, and elapsed deadline.
- Amend `STATE-MACHINE.md`, `CRASH-RECOVERY.md`, `RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md`, and `diagrams/architecture/runtime-sequences.md` and `runtime-state-machine.md`.

### 3. Live run control and OS process-tree ownership — remediates A-003

- Define one cross-platform live-run control protocol for delivering a second `pause` or `stop` command to a running foreground supervisor: transport, request identity, acknowledgement, durable ordering, ownership or authentication check, and stale-request behavior.
- Define one process-tree lifecycle contract. Each invocation needs a durable invocation identity, an owned process group or Windows Job Object equivalent, graceful cancellation, bounded escalation, verified tree exit, and a persisted outcome before the writer lock is released.
- State that pause may leave resumable task state but must not return while an unmanaged descendant remains, and that recovery must detect and safely fence or terminate an orphan belonging to a recorded invocation.
- Assign both responsibilities to a named module in `COMPONENT-BOUNDARIES.md`. The finding records that they are required runtime responsibilities with no owning module, which is why one TASK-002 acceptance criterion is judged `not met`.
- State the test obligation the finding names: a child that spawns a grandchild, ignores the first cancellation, and outlives the command timeout.
- Amend `LIFECYCLE-AND-BOOTSTRAP.md`, `PROVIDER-ADAPTERS.md`, `INTERFACE-CONTRACTS.md`, `COMPONENT-BOUNDARIES.md`, and ADR-0009.

### 4. Typed gate, resource-lock, and recurring-event contracts — remediates A-004

The runtime contracts model dependencies as task identifiers satisfied only when every target is `succeeded`. That cannot represent the graph the runtime is scheduled by, and implementing it as written would either deadlock pre-merge review gates or release consumers before their independent gates pass. Amend the task, event, scheduler, and completion contracts so they can represent, using the vocabulary defined in `tasks/TASK-001-DEPENDENCY-GRAPH.md`:

- `review_ready` — an immutable published commit on a task branch, with the remote publication and pull-request outcome recorded, satisfiable while the branch is unmerged.
- `integrated` — `review_ready`, plus every gate in the target's `pre_merge_gates` closed, plus merge into the integration branch.
- `gate_passed` with a named gate and a `round`, and `gate_recorded` for a verdict of any value.
- `pre_merge_gates` as a per-task declaration distinguishing gates that block integration from assembly gates that block only `done`.
- Independent gate verdicts as durable, superseding rather than rewriting across rounds.
- Named resource locks that serialize tasks whose path globs are not disjoint, enforced at admission alongside write-scope exclusion.
- Monotonic event-triggered recurring activation with a durable cursor, a `quiescent` waiting state, exactly-once consumption, and a starvation bound, as specified in `tasks/blocked/TASK-013-task-record-lifecycle-and-gate-closure.md`.

Prove acyclicity across scheduling, gate, and integration preconditions rather than over scheduling edges alone, and state the idle-quiescence and exactly-once activation test obligations. Amend `INTERFACE-CONTRACTS.md`, `STATE-MACHINE.md`, `LEASES-AND-SCHEDULING.md`, and `INTEGRATION-STRATEGY.md`.

> **Amendment note — TASK-013 activation `ACT-002`, additive.** The specification this scope item incorporates by reference, `tasks/blocked/TASK-013-task-record-lifecycle-and-gate-closure.md`, was rewritten after this record was authored, to remediate finding **F-201** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md`. **Re-read it before writing the activation contract.** The recurring-activation model is now a three-surface model, and the contracts must be able to represent all three:
>
> 1. an **ingress source set** of durable facts produced by owners *other than* the recurring task, each inside its own write scope, with a deterministic total order and an `ingress_seq` high-water mark;
> 2. a **cursor** that is the only representation of consumption state; and
> 3. an **append-only consumption ledger** written by the consuming activation and never edited, in which `consumed_by` is stamped at write time rather than mutated later.
>
> A contract in which the recurring task must write its own trigger, or in which consumption is represented by mutating an existing row, reproduces the deadlock F-201 recorded and will be judged `not resolved` by TASK-020, whose A-004 disposition now checks this specifically. Nothing else in this record's scope, dependencies, gates, write scope, or acceptance criteria changed; the incorporation by reference was already present, and this note only flags that the referenced text moved.
>
> ~~The graph's own vocabulary also gained two items scope item 4 must now represent, both defined in `tasks/TASK-001-DEPENDENCY-GRAPH.md`: the **owner form** of `gate_passed`, satisfied only by a passing verdict from a named gate task, with a resolution rule that disambiguates it from the target form; and per-gate-pair **`gate_class`** and **`retrospective`** metadata.~~
>
> **Withdrawn by TASK-013 activation `ACT-006` under finding F-402.** The owner form of `gate_passed` was **withdrawn** by revision 5 and is rejected at load time; see `tasks/TASK-001-DEPENDENCY-GRAPH.md`, "Dependency edge semantics" and invariant 6. The sentence above described it as a live vocabulary item that this amendment must represent, which is no longer true and was the one active body finding F-402 still named at round 6. The struck text is retained as the instruction under which `8d0c570` was authored — see the quarantine banner at the head of this record — and carries no current obligation. The live requirement is the **lineage form**, which the successor amendment carries and which no obligation of this record ever covered.

### 5. Agent workspace lifecycle module

- Add a seventh module, the agent workspace lifecycle, to the module map in `COMPONENT-BOUNDARIES.md` with `src/orchestrator/workspace/` as its source path and TASK-017 as its sole owner.
- Define its allowed import directions and confirm the module graph stays acyclic. The supervisor and the recovery layer consume it; it consumes the state contract root and no other module.
- Define the normative workspace lifecycle contract in `INTERFACE-CONTRACTS.md`: the workspace handle, the prepare, finalize, abandon, and reconcile operations, their pre- and post-conditions, and their failure classification.
- Include **branch publication and pull-request identity** in the contract, which finding F-105 in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md` records as missing: publishing the task branch, creating or updating a pull request idempotently, persisting branch, commit, and pull-request identity durably, and returning an explicit blocked outcome when the remote or credentials are unavailable. The contract must make pushing `main` structurally unavailable.
- Specify how the runtime invokes the existing human-controlled PowerShell orchestration scripts rather than reimplementing branch, worktree, lock, or scope logic in TypeScript, and what it must do when a script exits non-zero.
- Specify the crash-safe cleanup contract: which workspace states are recoverable, how an orphaned worktree, branch, or task lock is detected after an abrupt termination, and which post-crash invariants `CRASH-RECOVERY.md` gains as a result.
- Specify the session-token rule: the runtime releases only locks its own session claimed, and never force-releases another session's lock. State what it does instead when it finds a lock it cannot release.
- Specify that the runtime may never push to `main`, never bypass the tracked pre-push hook, never set `ALLOW_MAIN_PUSH`, and never write a human-controlled governance path, and record how the architecture makes each structurally unavailable rather than merely discouraged.
- Extend the deterministic dispatch and admission rules in `LEASES-AND-SCHEDULING.md` where workspace preparation affects them.
- Update `INTEGRATION-STRATEGY.md` so the branch topology and merge order include TASK-017 at Wave 4 and reflect the `review_ready` / `integrated` / `pre_merge_gates` vocabulary.

### Decision records and exclusions

- Record each cross-cutting decision as an ADR numbered from 0011, with context, decision, rejected alternatives, and consequences. At minimum: the workspace lifecycle module and its ownership, the crash-atomic batch mechanism, the recovery transition model, the live-control and process-tree ownership contract, and the typed scheduling and activation contracts. Where a decision changes ADR-0004 or ADR-0009, supersede it explicitly rather than editing it in place.
- Exclude implementing any module, decomposing tasks, editing any file under `tasks/`, and approving any gate — including this task's own.

## Acceptance criteria

### A-001 — crash-atomic journal batches

- [ ] The amendment states one recoverable batch boundary mechanism and why it was chosen over the alternatives the finding names.
- [ ] The restore post-condition is normative: every event in a committed batch is exposed, or none is.
- [ ] The false all-or-nothing claim is superseded explicitly in `DURABLE-STATE-AND-CHECKPOINTS.md`, and every document that inherited it is reconciled.
- [ ] Crash-point test obligations are stated for every partial write boundary and for before and after the commit marker.

### A-002 — legal recovery transitions

- [ ] Every recovery batch is legal by construction, and the mechanism that guarantees it is stated.
- [ ] Each combination of lease state, ledger state, and elapsed deadline maps to exactly one legal task transition.
- [ ] Transition-table and batch-order test obligations are stated.
- [ ] The state-machine and sequence diagrams agree with the amended table.

### A-003 — live control and process-tree ownership

- [ ] A named module in `COMPONENT-BOUNDARIES.md` owns live-run control, and a named module owns provider process-tree lifecycle. Neither responsibility is unassigned and neither has two owners.
- [ ] The live-run control protocol states transport, request identity, acknowledgement, durable ordering, ownership check, and stale-request behavior.
- [ ] The process-tree contract states durable invocation identity, owned process group or Windows Job Object equivalent, graceful cancellation, bounded escalation, verified tree exit, and a persisted outcome before the writer lock is released.
- [ ] Pause and drain post-conditions state that no unmanaged descendant may survive the command's return, and recovery detects and fences or terminates an orphan belonging to a recorded invocation.
- [ ] The grandchild, ignored-cancellation, and outlived-timeout test obligations are stated.

### A-004 — typed scheduling contracts

- [x] ~~The contracts represent `review_ready`, `integrated`, **both forms of** `gate_passed` with gate and round plus the rule that disambiguates them, `gate_recorded`, `pre_merge_gates`, per-gate-pair `gate_class` and `retrospective`, named resource locks, monotonic event-**ingress** activation, and a waiting/quiescent state.~~ **Closed and quarantined by `ACT-006` under finding F-402.** "Both forms" meant the target form and the **owner** form, and the owner form was withdrawn by revision 5 and is now rejected at load time. This criterion is the one TASK-020 judged against `8d0c570`, and its judgment — A-004 `not resolved` — is durable and is not rewritten. It is closed here as a historical criterion rather than reworded, because rewording it would change what an independent reviewer was asked to check after they had already answered. The live obligation is carried forward by the successor amendment and is stated there in the lineage form.
- [ ] The activation contract represents the three surfaces separately: an ingress source set whose facts are produced by owners other than the recurring task, a cursor that is the only representation of consumption state, and an append-only consumption ledger that is never edited. See the amendment note in scope item 4.
- [ ] Gate verdicts are durable and supersede across rounds rather than being rewritten.
- [ ] Acyclicity is proven across scheduling, gate, and integration preconditions together, not over scheduling edges alone.
- [ ] Idle-quiescence, exactly-once activation, monotonic-cursor, and no-starvation test obligations are stated.
- [ ] The vocabulary matches `tasks/TASK-001-DEPENDENCY-GRAPH.md` name for name, so no task record has to be restated to compile against the contracts.

### Workspace lifecycle module

- [ ] The module map contains exactly seven modules, each with exactly one owner task, and no module appears twice.
- [ ] The workspace lifecycle contract declares prepare, finalize, abandon, and reconcile with observable pre- and post-conditions.
- [ ] The contract includes branch publication, idempotent pull-request creation, durable branch/commit/pull-request identity, and an explicit blocked outcome when the remote or credentials are unavailable.
- [ ] The allowed import directions are stated and the module dependency graph is shown to remain acyclic.
- [ ] The contract states that the runtime delegates to `scripts/orchestration/*.ps1` and never reimplements branch, worktree, lock, or write-scope logic.
- [ ] Crash-safe cleanup is specified, and `CRASH-RECOVERY.md` gains explicit post-crash invariants for orphaned worktrees, branches, and locks.
- [ ] The session-token rule and the no-force-release rule are stated normatively, with the runtime's required behavior when it cannot release a lock.
- [ ] The prohibition on pushing `main`, bypassing the pre-push hook, and writing a governance path is stated with the structural mechanism that enforces each.

### Amendment discipline

- [ ] Every change names what it supersedes; no existing contract is silently rewritten.
- [ ] Each cross-cutting decision has an ADR numbered from 0011 with context, decision, rejected alternatives, and consequences, and ADR-0004 and ADR-0009 are superseded explicitly where they are changed.
- [ ] No two ADRs decide the same question differently.
- [ ] All changed files remain inside this task's declared write scope, and no file under `tasks/` is modified.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the handoff.

## Expected artifacts

- `docs/architecture/runtime/WORKSPACE-LIFECYCLE.md`.
- Amendments to `docs/architecture/ARCHITECTURE.md`, `COMPONENT-BOUNDARIES.md`, `INTERFACE-CONTRACTS.md`, `STATE-MACHINE.md`, `DURABLE-STATE-AND-CHECKPOINTS.md`, `LEASES-AND-SCHEDULING.md`, `PROVIDER-ADAPTERS.md`, `RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md`, `LIFECYCLE-AND-BOOTSTRAP.md`, `CRASH-RECOVERY.md`, and `INTEGRATION-STRATEGY.md`.
- ADRs numbered from `docs/adr/0011`, including explicit supersession of ADR-0004 and ADR-0009 where changed.
- Updated diagrams under `diagrams/architecture/`.

## Resource lock

This task declares `resource_lock: architecture-docs`, which TASK-002 and TASK-024 also hold. The two scopes genuinely overlap: this task amends documents TASK-002 authored. They are serialized by the lock, not by path disjointness. The TASK-002 execution released the lock, which is why this task could be claimed; the TASK-016 execution has since released it as well, so `architecture-docs` is free.

## Dependency notes

- `gate_recorded(TASK-015)` is the dependency, not `gate_passed(TASK-002)`. TASK-015 recorded `changes-required`, so `gate_passed(TASK-002)` is not satisfiable and never will be at round 1. This task **is** the remediation for that verdict, so it depends on the verdict having been recorded, at commit `8632469`.
- This task's own review gate is owned by TASK-020, a separate reviewer task with an explicit `review_ready(TASK-016)` dependency. TASK-015 is not re-entered; its verdict is durable and its record is `done`. That removes finding F-102 at its source.
- The architecture-approval edge held by TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 no longer names this task. Activation `ACT-004` retyped it to the `LIN-ARCH-REVIEW` lineage form under finding F-302, so it survives supersession without an edit; its floor was `lineage_round: 3` then, and activation `ACT-006` raised it to `4` after round 3 recorded `changes-required`. The edge's current floor is normative in each consumer's own frontmatter, not here. **There is no approved architecture:** `9576fc9`, `8d0c570`, and `c2ee3eb` have each been rejected by their round, and the approved source will be the TASK-028 commit that TASK-029 approves.
- TASK-020 recorded `changes-required` at `4874a9d`, so neither this task's review gate nor TASK-002's round 2 gate closed. Round 2, carried by TASK-025, recorded `changes-required` again at `aa38c7d2`. Both relations are open, both now name **TASK-028** as `remediated_by` and **TASK-029** as `revalidated_by`, and round 3 of this task's gate is TASK-029's.
- Blocks TASK-017, which cannot implement without the workspace contract, and blocks Wave 2 onward.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Transcribed by the Orchestrator under TASK-013 activation `ACT-003` from the owner's commit `8d0c570`, its commit message, and its pull request. The Orchestrator did not read, judge, or verify the architecture content; it records what the owner published and names the source of each statement.

- **Commit or pull request:** commit `8d0c570` `docs: amend the runtime architecture for TASK-016` on `agent/claude/architect/task-016`, branch point `c325275`. Pushed to `origin/agent/claude/architect/task-016` and opened as pull request `https://github.com/Fhurky/Multi-Agent-Engineering-Framework/pull/3`, targeting `main`. Under the `bootstrap` publication class this satisfies `review_ready(TASK-016)`; `publication: published`.
- **Files changed:** 29 — verified from `git diff-tree --no-commit-id --name-only -r 8d0c570`. 22 amended (`docs/architecture/ARCHITECTURE.md`, the eleven documents under `docs/architecture/runtime/`, seven existing ADRs, `docs/adr/README.md`, and the three diagrams under `diagrams/architecture/`) and 7 added (`docs/architecture/runtime/WORKSPACE-LIFECYCLE.md` and ADR-0011 … ADR-0016). Every path is inside this task's declared write scope; no file under `tasks/` was touched.
- **What the owner recorded as delivered**, quoted from the commit message of `8d0c570`:
  - A-001 — "Adopt a batch identifier plus a durable commit record: event lines carry a `batchId` and `batchIndex`, the final line commits the batch with an event count and a digest over its envelopes, and restore exposes every event of a committed batch or none of it. Ten crash-point obligations stated."
  - A-002 — "Recovery now computes exactly one reconciliation decision per task from lease state, ledger state and an elapsed deadline, each expanding to one proven-legal event sequence. Add `TaskRecord.attemptStartedAt` so the deadline is a function of the record. Transition-table and batch-order obligations stated."
  - A-003 — "Define a durable file-based control protocol with request identity, journal-order consumption, acknowledgement, epoch ownership check and stale-request sweep, owned by TASK-007. Define process-tree lifecycle owned by TASK-004: durable invocation identity before the spawn, a Windows job object with kill-on-close or a POSIX process group, bounded escalation, verified exit, and a persisted outcome before the writer lock is released. Pause may not return while an unmanaged descendant remains."
  - A-004 — "Add `review_ready`, `integrated`, `gate_passed` with gate and round, `gate_recorded`, `human_decision` and `terminal` edges; `pre_merge_gates`; append-only gate verdicts that supersede across rounds; named resource locks; and monotonic event-triggered activation with a quiescent state, an exactly-once cursor and a starvation bound. Prove acyclicity over the expanded precondition graph and reject a violating graph at load. Vocabulary matches `tasks/TASK-001-DEPENDENCY-GRAPH.md` name for name."
  - Workspace lifecycle module — "add the seventh module, `src/orchestrator/workspace/`, owned by TASK-017, with prepare/finalize/abandon/reconcile, delegation to the human-controlled PowerShell orchestration scripts, session-token ownership with no force release, crash-safe cleanup, branch publication and idempotent pull-request identity, and structural unavailability of pushing `main`, `ALLOW_MAIN_PUSH`, hook bypass and governance-path writes. Resolves F-105."
  - Decision records — "New ADR-0011 through ADR-0016. ADR-0002, ADR-0004, ADR-0009 and ADR-0010 are superseded in part and carry forward references only; their decisions are unchanged."
- **Verification, as recorded by the owner** in the commit message of `8d0c570` and in the execution handoff read by this activation:
  - `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef c325275` — valid `True`, 29 files.
  - `scripts/ci/validate-framework.ps1` — passed for 13 roles.
  - `scripts/ci/test-orchestration.ps1` — orchestration unit checks passed.
  - `git diff --check` — clean.
  - Link and anchor integrity across `docs/` and `diagrams/` — 0 broken.
  - Task lock released; worktree clean. The `architecture-docs` resource lock is therefore free.
- **Limitations of that evidence, recorded by this activation rather than claimed by the owner:** every check above is a repository-structure, scope, or link validator. None of them evaluates whether A-001 … A-004 are actually resolved, whether the module map is correct, or whether the ADRs are coherent. This task's own acceptance criteria are self-asserted until an independent gate owner judges them. **No verdict exists on this amendment.**
- **Known risks:**
  - `gate_tasks: TASK-020 round 1` is `pending`. This record's `review` gate is **open**, and `review` is in its `pre_merge_gates`, so TASK-016 is `review_ready` but **not integrable**. The Orchestrator has not closed and may not close this gate.
  - `gate_passed(TASK-016, review)` is the architecture edge for TASK-003 … TASK-008, TASK-017, and TASK-018. All of them stay `blocked` until TASK-020 records a passing verdict. Publication alone releases nothing beyond TASK-020's own dependency.
  - The single TASK-020 verdict also closes or leaves open TASK-002's `review` gate at round 2, atomically with this one. A rejection here leaves both targets open.
  - The `ACT-002` amendment note in scope item 4 was appended after this task was claimed. Whether the published amendment incorporates the corrected three-surface ingress model is exactly what TASK-020's A-004 disposition must check; this activation does not assess it.
- **Next owner:** reviewer / gpt for **TASK-020**, now `ready` and dispatchable on the satisfied `review_ready(TASK-016)` edge; then orchestrator via TASK-013 to record TASK-020's single verdict as the two durable gate-verdict facts, and — on a passing verdict — to unblock TASK-018 and Wave 3.

## Review gate outcome — round 1

**TASK-020 recorded `changes-required` at commit `4874a9d`.** The verdict is durable and is superseded rather than rewritten. This record stays in `tasks/review/`, is **not integrable** — `review` is in its `pre_merge_gates` and that relation is open — and cannot reach `done`.

TASK-020's round 1 dispositions on the findings this amendment was created to resolve, transcribed from `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md`:

| Finding | Disposition recorded by TASK-020 |
|---|---|
| A-001 | `resolved` |
| A-002 | `partially resolved` — blocked by A-104 |
| A-003 | `partially resolved` — blocked by A-102, and the pause post-condition admits a surviving `orphan_unresolved` descendant |
| A-004 | `not resolved` — the contracts model neither the current scheduling vocabulary nor the corrected ingress model; A-101 is its successor |

The five fresh findings A-101 through A-105 are routed to **TASK-024**, a new architect-owned amendment task, with the per-finding disposition register in `tasks/TASK-013-ACTIVATION-LOG.md`, activation `ACT-004`. This record is not reopened and is not re-entered: TASK-024 is the remediation and TASK-025 records round 2.

The Orchestrator recorded this verdict; it did not produce it, judge it, or assess whether the findings are correct.

## Review gate outcome — round 2

**TASK-025 recorded `changes-required` at commit `aa38c7d2`**, applied atomically to this record's round 2 relation together with `(TASK-024, review, r1)` and `(TASK-002, review, r3)`. The verdict is durable and is superseded rather than rewritten. This record stays in `tasks/review/`, is still **not integrable**, and still cannot reach `done`.

Round 2 judged the TASK-024 remediation, not this record's own artifact — under the gate-round rule, at round *n* > 1 the reviewed artifact is the remediation named by round *n* − 1. TASK-025 recorded A-101 `not resolved`, A-102 `not resolved`, A-103 `partially resolved`, A-104 `not resolved`, and A-105 `partially resolved`, so **none of the round-1 findings against this amendment is closed**. Nine fresh findings A-201 … A-209 are routed by activation `ACT-006`. Round 3 is carried by **TASK-029** against the **TASK-028** remediation.

The architecture-approval edge held by TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 names the lineage rather than this record, so it did not have to be retargeted; `ACT-006` raised its floor to `lineage_round: 4`. Every one of those tasks stays `blocked`.

The Orchestrator recorded this verdict; it did not produce it, judge it, or assess whether the findings are correct.
