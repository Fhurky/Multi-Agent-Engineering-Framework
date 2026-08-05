---
task_id: TASK-024
title: Second architecture amendment for ingress durability, recovery, and the revision-5 scheduling vocabulary
status: ready
owner_role: architect
llm: claude
branch: agent/claude/architect/task-024
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-architect-task-024
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/runtime/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies:
  - task: TASK-020
    edge: gate_recorded
required_gates:
  - review
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-025
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 3
parent_task: TASK-001
publication_class: bootstrap
normative_architecture_source: 9576fc9 as amended by 8d0c570; this task produces the next amendment in the same lineage
remediates:
  - finding: A-101
    source: reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md
  - finding: A-102
    source: reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md
  - finding: A-103
    source: reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md
  - finding: A-104
    source: reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md
  - finding: A-105
    source: reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md
  - finding: F-301
    source: reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md
    part: contract representation only
supersedes: TASK-016
---

# TASK-024: Second architecture amendment for ingress durability, recovery, and the revision-5 scheduling vocabulary

## Objective

Amend the runtime architecture so that the five findings TASK-020 recorded are resolved and so that the contracts compile, name for name, against revision 5 of `tasks/TASK-001-DEPENDENCY-GRAPH.md` — including the durable ingress inbox that finding F-301 requires.

## Why this task exists rather than a second round of TASK-016

TASK-016 published its amendment at `8d0c570`, TASK-020 recorded one `changes-required` verdict against it at `4874a9d`, and that verdict is durable. Under the gate-round rule, a recorded verdict is superseded rather than rewritten, and each superseding round is a **new** task. TASK-016's record stays in `review` with its round 1 relation open and a round 2 relation pending; this task is the remediation that round 2 reviews. That is exactly the shape TASK-002 → TASK-016 → TASK-020 already took.

This task and TASK-016 share the `architecture-docs` resource lock, and TASK-016's execution has released it.

## Normative inputs

Read these before editing anything:

1. `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md` at commit `4874a9d` — the verdict this task remediates, with A-001 … A-004 dispositions and findings A-101 … A-105.
2. `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md` — the round 1 findings A-001 … A-004, of which A-002, A-003, and A-004 remain open.
3. `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md` at commit `e8eb23d`, finding F-301 — the ingress defect whose **contract representation** is this task's obligation.
4. `tasks/TASK-001-DEPENDENCY-GRAPH.md` at revision 5 — the vocabulary the contracts must match, and the normative statement of the ingress model, the entry schema, the canonical identity tuple, the class precedence order, and the epoch rules.

The current architecture is `9576fc9` as amended by `8d0c570`. This amendment is the next in that lineage. Do not rewrite an existing decision silently: every change is an amendment that names what it supersedes, and a changed ADR decision requires an explicit supersession record.

## Scope

Five items. All are required, and all are published together so that cross-document consistency is restored in one round.

**Item 1 — A-101 and the contract representation of F-301: typed scheduling and activation must compile against revision 5.**

- Represent `publication_class` as a declared field with the `runtime` and `bootstrap` classes and their distinct satisfying conditions, replacing the run-global `allowLocalOnlyPublication` flag.
- Represent both surviving forms of `gate_passed` — the **target form** carrying `task`, `gate`, and `round`, and the **lineage form** carrying `lineage`, `gate`, and `lineage_round` — and represent the **withdrawal** of the owner form as a load-time rejection with a message directing the edge to the lineage form.
- Make the gate relation on a gate task plural. One gate task carries one or more relations, records exactly one verdict, and applies it atomically to every relation, producing one durable gate-verdict fact per relation. TASK-025 carries three.
- Represent `gate_class`, per-pair `retrospective`, `gate_lineage`, and `lineage_round` as declared fields on both sides of every pair.
- Represent gate lineages: a stable identifier, a gate name, a cohort that may grow, an ordered succession of lineage rounds, and the authoritative-verdict rule that the highest recorded round decides while every earlier round stays durably recorded.
- Extend the graph validator contract from five invariants to the eight in revision 5, including invariant 6's form resolution and invariant 8's lineage well-formedness.
- Replace the `run.activationEvents` / `pendingThroughSeq` model with the three ingress surfaces. The contract must express: a durable append-only **ingress inbox** whose entries carry a `seq` assigned once at append, a `fact_id` content hash as identity, and a `content_hash` over the source artifact; identity-keyed deduplication; class precedence yielding at most one entry per source commit; batch ordering by source commit identifier and **never** by timestamp; retention that outlives the producing ref; explicit exclusion of the recurring task's own commits; `ingress_seq = max(seq)`; consumption state represented **only** by the cursor; a separate append-only consumption ledger written already consumed; and ingress epochs with a `seq_base` and the rule that a prior epoch's entries are never re-derived or renumbered.
- Assign the inbox to a module. It is the **eighth** module in `COMPONENT-BOUNDARIES.md`, owned by TASK-026 at `src/orchestrator/ingress/**`. The module map must remain acyclic and its owner set must remain one owner per module.

**Item 2 — A-102: process registration must be durable before the worker-owned spawn.**

Define an implementation-ready supervisor/worker handshake that makes `ProcessGroupRegistered` durable **before** `spawnOwned`, and makes the process binding durable immediately after it, without giving TASK-004 state-write ownership and without the sequence diagram showing a worker appending durable state directly. Define a non-success outcome that prevents `pause` or `drain` from returning while an `orphan_unresolved` descendant survives, so the post-condition matches the unqualified criterion rather than admitting an exception.

**Item 3 — A-103: workspace intent must be durable before its side effects.**

Replace the single-call workspace operations with explicit begin/execute/complete phases or an append-acknowledgement callback, so the supervisor can durably append the intent for `prepare`, `finalize`, and `abandon` and then authorize continuation. Add a distinct abandonment-intent event and the transition that enters `abandoning`; the union currently has `WorkspaceAbandoned` with no event that enters the state. A crash during a script or Git operation must leave discoverable durable intent for `reconcile`.

**Item 4 — A-104: recovery must be able to reconstruct an adopted worker result.**

Either durably record the complete adoptable result — artifact paths, `TaskResultSummary`, completion timestamp, and `proposedTasks` — before commitment, or define a recovery-specific adoption event with sufficient durable source data and explicit record effects. The current committed ledger entry retains only `resultDigest`, while the recovery table maps that state to `WorkerSucceeded`, which requires a complete summary and task proposals. Losing `proposedTasks` can change the terminal task graph, so the chosen option must state what happens to them.

**Item 5 — A-105: the diagrams must agree with the normative contracts.**

Make `diagrams/architecture/runtime-state-machine.md` state the same terminal-event exceptions as `STATE-MACHINE.md`, and `diagrams/architecture/runtime-components.md` state the same repository access paths as `WORKSPACE-LIFECYCLE.md`. Update `runtime-sequences.md` for items 2 and 3.

**Also required across all five items.**

- Reconcile `INTEGRATION-STRATEGY.md` with the revision-5 vocabulary. A-101 records that it still proves the revision-3 five-invariant graph.
- Update `docs/architecture/ARCHITECTURE.md`'s amendment register and module summary to eight modules.
- Record each new decision as an ADR from `docs/adr/0017` onward, with context, decision, rejected alternatives, and consequences, and explicitly supersede any ADR whose decision changes — including ADR-0011, ADR-0013, ADR-0014, and ADR-0015, which TASK-020 records as inheriting A-101 … A-104.
- Do not weaken the structural prohibitions in `WORKSPACE-LIFECYCLE.md` on pushing `main`, setting `ALLOW_MAIN_PUSH`, bypassing hooks, writing a governance path, or force-releasing a lock.

**Exclusions.** Do not implement any runtime code or test. Do not write any file under `tasks/`, `reports/`, `src/`, `tests/`, `scripts/`, `config/`, or `.github/`. Do not decide any gate, approve any review, or record any verdict. Do not change a governance or enforcement file.

## Acceptance criteria

- [ ] A-101 through A-105 each have a named location in the amended documents where the required remediation is stated, and the amendment register names each.
- [ ] Every vocabulary term in `tasks/TASK-001-DEPENDENCY-GRAPH.md` revision 5 that a task record uses is representable in the contracts **name for name**, so no task record must be restated to compile against them. Divergence is a finding against this task.
- [ ] The ingress contract represents a durable append-only inbox with a one-time `seq`, `fact_id`, `content_hash`, identity-keyed deduplication, class precedence, batch ordering that is not timestamp-based, ref-independent retention, self-exclusion of the recurring task's commits, `ingress_seq = max(seq)`, cursor-only consumption state, a separate append-only ledger, and epochs with a `seq_base`. A contract in which the recurring task writes its own trigger, in which consumption is represented by mutating a row, or in which the cursor is a count over observable refs does not satisfy this criterion.
- [ ] The module map contains exactly eight modules, each with exactly one owner task, and the module dependency graph is acyclic with the two contract roots independent of each other.
- [ ] The graph validator contract states all eight invariants, and the expanded scheduling, gate, and integration DAG is proven acyclic for the revision-5 graph rather than the revision-3 graph.
- [ ] Process registration is durable before the worker-owned spawn, with no interface requiring a worker to append durable state, and no post-condition permits pause or drain to return with a surviving unmanaged descendant.
- [ ] Workspace `prepare`, `finalize`, and `abandon` each have a durable intent that is persisted before any script or Git side effect, and `abandoning` has an entering event.
- [ ] Recovery can construct a legal transition for a committed-but-unadopted worker result, and the fate of `proposedTasks` is stated explicitly.
- [ ] Every diagram states the same allowed paths, terminal-event exceptions, and repository access paths as the normative contracts.
- [ ] Every change is an amendment naming what it supersedes; no existing contract is silently rewritten; every new ADR has context, decision, rejected alternatives, and consequences; and no two ADRs decide the same question differently.
- [ ] Engineering text is English. Any user-visible command-line copy is Turkish.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the handoff.
- [ ] The branch is published with an immutable commit, and the publication outcome is recorded so the Orchestrator can transcribe it accurately.

## Expected artifacts

- Amended `docs/architecture/ARCHITECTURE.md` with an updated amendment register and an eight-module summary.
- Amended documents under `docs/architecture/runtime/`, including `INTERFACE-CONTRACTS.md`, `STATE-MACHINE.md`, `LEASES-AND-SCHEDULING.md`, `COMPONENT-BOUNDARIES.md`, `LIFECYCLE-AND-BOOTSTRAP.md`, `PROVIDER-ADAPTERS.md`, `WORKSPACE-LIFECYCLE.md`, `CRASH-RECOVERY.md`, `RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md`, and `INTEGRATION-STRATEGY.md`.
- A new document or section defining the ingress inbox module and its contract.
- New ADRs from `docs/adr/0017` and explicit supersession records for the ADRs whose decisions change.
- Updated `diagrams/architecture/runtime-components.md`, `runtime-sequences.md`, and `runtime-state-machine.md`.

## Write-scope isolation

This task's scope is identical to TASK-016's and overlaps TASK-002's. All three declare `resource_lock: architecture-docs`, and at most one may be claimed at a time. TASK-002's and TASK-016's executions have both released the lock. This task writes nothing outside `docs/architecture/`, `docs/adr/`, and `diagrams/architecture/`.

## Gate and remediation path

This task declares `required_gates: [review]` and `pre_merge_gates: [review]`, owned by **TASK-025**, which records `LIN-ARCH-REVIEW` lineage round 3. TASK-025's single verdict applies atomically to `(TASK-024, review, r1)`, `(TASK-016, review, r2)`, and `(TASK-002, review, r3)`. Until that verdict is passing, this amendment is not integrable and `gate_passed(LIN-ARCH-REVIEW, review, 3)` is unsatisfied, so TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 stay `blocked`.

The architect is `claude` and the reviewer is `gpt`, so author and reviewer are in separate execution contexts and separate LLM families. This task authors; it never reviews and never closes its own gate. Publishing this branch is what wakes TASK-013; this task never writes under `tasks/`.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-024 -Role architect -Llm claude`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-024 -Role architect -Llm claude` before editing. Confirm no other holder of `architecture-docs` is claimed.
3. Read the four normative inputs above before editing.
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef c325275`.
5. Commit, publish the task branch and open or update a pull request when a remote and credentials are available — otherwise record `publication: local-only` with the reason, which this task's `publication_class: bootstrap` permits — and run `scripts/orchestration/release-task.ps1 -TaskId TASK-024 -Role architect -Llm claude`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the architect role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator performs the transition under TASK-013.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013.

## Handoff

Maintained by the Orchestrator under TASK-013 from the architect's commit, pull request, and handoff.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to record the publication and dispatch TASK-025, the independent review that records `LIN-ARCH-REVIEW` lineage round 3
