---
task_id: TASK-024
title: Second architecture amendment for ingress durability, recovery, and the revision-5 scheduling vocabulary
status: review
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
    round: 2
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
    round: 3
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
    round: 4
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 6
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
published_commit: c2ee3ebfe62a8bb295948d79b7cccfdcfd04fc4a
published_branch: agent/claude/architect/task-024
published_remote_ref: refs/heads/agent/claude/architect/task-024
pull_request: 9
publication: published
publication_note: The amendment commit c2ee3eb is preceded on the same branch by the merge commit 6e5a9df, which brought the TASK-016 amendment 8d0c570 into this branch so the amendment sits in the same lineage. The merge introduced only paths under docs/architecture/, docs/adr/, and diagrams/architecture/, all inside this task's declared write scope. 6e5a9df is not an ingress fact: it is not a merge on integration/autonomous-runtime nor a merge of that branch into main, and the owner's record names c2ee3eb as the published commit.
scope_validation_base: 890b8e0d0ed45f64ec913f952058e942668d784e
branch_point_of: agent/claude/orchestrator/task-013
scope_validation_note: Resolved by this activation from the published branch; git merge-base agent/claude/architect/task-024 agent/claude/orchestrator/task-013 returns 890b8e0. The owner ran the check against that branch point and recorded valid True with changed_files 35. The originally prescribed -BaseRef c325275 is superseded under finding F-403.
review_target_branch: agent/claude/architect/task-024
review_target_commit: c2ee3ebfe62a8bb295948d79b7cccfdcfd04fc4a
review_target_base: 8d0c570e190a534a7ae929377ed19b1675bbde86
review_target_note: TASK-025 reviews the immutable commit c2ee3eb against review-diff base 8d0c570, the TASK-016 amendment this one revises, reading 9576fc9 where a judgment needs the original baseline. The authored delta is 6e5a9df..c2ee3eb, 28 files. This target is immutable and is not changed by a later TASK-013 activation.
review_target_applicability: applicable and resolved
scope_validation_applicability: applicable and resolved
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

This task declares `required_gates: [review]` and `pre_merge_gates: [review]`. Round 1 was owned by **TASK-025**, which recorded **`changes-required`** at `aa38c7d2`, applied atomically to all three relations it carried. Round 2 is owned by **TASK-029**. Each pair's scheduling class, ordering against integration, lineage, and lineage round are declared in the frontmatter above and in the gate task's matching `gate_for` entry, and summarized in the registers in `tasks/TASK-001-DEPENDENCY-GRAPH.md`; this body names those sources and does not restate their values.

**This amendment is not integrable.** Round 1 recorded seven High findings, A-201 … A-207, and two Medium, A-208 and A-209. `review` is in this task's `pre_merge_gates` and that gate is open, so the architecture lineage edge stays unsatisfied and TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 stay `blocked`. The remediation is **TASK-028**, and the edge floor has risen to `lineage_round: 4`, so no verdict at round 3 can release it. `c2ee3eb` and its publication-ancestry merge `ba2c742` must not be treated as an approved architecture integration; the reviewer stated that explicitly.

The architect is `claude` and the reviewer is `gpt`, so author and reviewer are in separate execution contexts and separate LLM families. This task authors; it never reviews and never closes its own gate. Publishing this branch is what wakes TASK-013; this task never writes under `tasks/`.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-024 -Role architect -Llm claude`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-024 -Role architect -Llm claude` before editing. Confirm no other holder of `architecture-docs` is claimed.
3. Read the four normative inputs above before editing.
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <scope_validation_base>` — the immutable branch point declared in this record's frontmatter, not a review-diff base. The originally prescribed `-BaseRef c325275` is **superseded** under finding F-403; the owner substituted the branch point by hand to complete the handoff.
5. Commit, publish the task branch and open or update a pull request when a remote and credentials are available — otherwise record `publication: local-only` with the reason, which this task's `publication_class: bootstrap` permits — and run `scripts/orchestration/release-task.ps1 -TaskId TASK-024 -Role architect -Llm claude`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the architect role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator performs the transition under TASK-013.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013.

## Publication outcome and what it does not establish

This task **published** and is therefore `review_ready`. That is authoring evidence and nothing more. No finding it claims to remediate is resolved by this record, by this graph, or by any Orchestrator activation. **TASK-025's single verdict decides A-101 … A-105, the still-open A-002, A-003, and A-004, the eleven ingress checks, and the F-401 correction**, and applies that one verdict atomically to all three relations it carries.

One divergence is recorded here as a fact rather than judged: the published contract at `c2ee3eb` declares `consumedBy: ActivationId | null` on the inbox entry at `docs/architecture/runtime/INTERFACE-CONTRACTS.md:551`, and repeats the single-schema model in ADR-0017 and `STATE-MACHINE.md`. Finding **F-401**, recorded by TASK-023 at `667d3b8` **after** this amendment was authored, rejects that shape and requires the inbox entry schema and the consumption-ledger row schema to be separate with no consumption field on the entry. This amendment was authored against revision 5, which still declared the single schema, so the divergence is chronological rather than a departure from the brief it was given. TASK-025 judges it under Part D of its record; the Orchestrator does not pre-judge it.

## Handoff

Maintained by the Orchestrator under TASK-013 from the architect's commit, pull request, and handoff. Transcribed by activation `ACT-005` from the commit message of `c2ee3eb`; quoted, not invented.

- Commit or pull request: `c2ee3ebfe62a8bb295948d79b7cccfdcfd04fc4a` `docs: amend the runtime architecture for TASK-024` on `agent/claude/architect/task-024`, parent `6e5a9df`. 28 files changed, all under `docs/architecture/`, `docs/adr/`, and `diagrams/architecture/`. Published at `refs/heads/agent/claude/architect/task-024` on `origin` and opened as pull request #9.
- Owner-recorded scope: A-101 typed scheduling and activation compiled against revision 5 name for name, including `publication_class`, both surviving `gate_passed` forms with the owner form rejected at load, plural `gateFor` with one atomic verdict, the four per-pair properties, gate lineages with the authoritative-verdict rule, eight validator invariants, the three ingress surfaces replacing `activationEvents`, and the ingress inbox as the eighth module owned by TASK-026. A-102 a three-phase worker handshake with `spawnOwned` taking a registration receipt issued only by the state store's append path, and an unqualified drain post-condition producing `RunDrainBlocked` with exit code 5. A-103 plan and execute phases behind a durable-intent receipt, with `WorkspaceAbandonIntended` entering the `abandoning` state. A-104 `WorkerResultRecorded` making the complete `TaskResultSummary` and verbatim `proposedTasks` durable before commitment. A-105 diagram reconciliation. New ADR-0017 … ADR-0022 with forward supersession recorded on ADR-0002, ADR-0011, ADR-0013, ADR-0014, ADR-0015, and ADR-0016.
- Verification, as the owner recorded it: `scripts/ci/validate-framework.ps1` passed for 13 roles; `scripts/ci/test-orchestration.ps1` passed; `validate-write-scope.ps1 -IncludeWorkingTree -BaseRef 890b8e0` returned `valid True`, role `architect`, llm `claude`, `changed_files 35`; `git diff --check` clean on the committed range and the working tree; link and anchor validation across 38 architecture, ADR, and diagram files with no broken relative link and no missing anchor; a revision-5 vocabulary compile check over 38 terms, all representable. The owner also recorded that no structural prohibition in `WORKSPACE-LIFECYCLE.md` was weakened.
- Known risks: **no verdict exists on this amendment.** Its `review` gate is in `pre_merge_gates`, so the amendment is not integrable, and TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 stay `blocked`. The F-401 divergence recorded above is open and is TASK-025's to judge. This task's `architecture-docs` lock was still present in the shared Git common directory at `ACT-005`; releasing a stale lock is a human decision under the concurrent-execution protocol and this activation did not force it.
- Next owner: ~~**reviewer / gpt for TASK-025**~~ — discharged. TASK-025 recorded its verdict at `aa38c7d2`. The next owner is **architect / claude for TASK-028**, the remediation of A-201 … A-208 and the approved `HUMAN-002` observer contract, then **reviewer / gpt for TASK-029** at `LIN-ARCH-REVIEW` lineage round 4.

## Review gate outcome — round 1

**TASK-025 recorded `changes-required` at commit `aa38c7d2`.** The verdict is durable and is superseded rather than rewritten. This record stays in `tasks/review/`, is **not integrable** — `review` is in its `pre_merge_gates` and that relation is open — and cannot reach `done`.

TASK-025's dispositions on the findings this amendment was created to resolve, transcribed from `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md`:

| Finding | Disposition recorded by TASK-025 |
|---|---|
| A-101 | `not resolved` — F-401 absent, `consumedBy` still on the inbox entry, records do not parse name-for-name, ingress payload delivery unowned |
| A-102 | `not resolved` — receipts do not enforce durable issuance, and `RunDrainBlocked` returns with a descendant that cannot enter recovery Phase 5 |
| A-103 | `partially resolved` — the intents and `WorkspaceAbandonIntended` exist, but the receipt proof is forgeable and finalize cannot persist publication before unlock |
| A-104 | `not resolved` — no runtime event can set `isTaskResultEffect`, so the adopt path cannot identify the required ledger entry |
| A-105 | `partially resolved` — the terminal-event exception and the repository-access diagram are corrected; the sequences still contradict four interfaces |
| A-002 | `partially resolved` |
| A-003 | `partially resolved` |
| A-004 | `not resolved` |

The **F-401 divergence recorded above as a fact is now judged, and judged against the amendment.** Four of the six Part D checks are `not satisfied`: `IngressEntry.consumedBy` remains at `INTERFACE-CONTRACTS.md:551`; neither named bootstrap dispatch contract exists in the target; `appendedBy` permits "adapter or activation" instead of enumerating authorized principals per phase; and ADR-0017 line 84 still makes the discovery-affects-only-liveness claim. Ten of the eleven Part B ingress checks are satisfied; the eleventh fails on the same `consumedBy` field.

The nine findings A-201 through A-209 are routed by activation `ACT-006`: A-201 … A-208 to **TASK-028**, a new architect-owned amendment task, and A-209 to the Orchestrator, which corrected TASK-025's own record. The per-finding disposition register is in `tasks/TASK-013-ACTIVATION-LOG.md`, activation `ACT-006`. This record is not reopened and is not re-entered: TASK-028 is the remediation and TASK-029 records round 2.

The Orchestrator recorded this verdict; it did not produce it, judge it, or assess whether the findings are correct.
