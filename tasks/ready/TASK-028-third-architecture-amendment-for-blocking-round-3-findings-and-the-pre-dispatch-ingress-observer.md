---
task_id: TASK-028
title: Third architecture amendment for the round-3 blocking findings and the approved pre-dispatch ingress observer contract
status: ready
owner_role: architect
llm: gpt
branch: agent/gpt/architect/task-028
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-architect-task-028
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/runtime/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies:
  - task: TASK-025
    edge: gate_recorded
required_gates:
  - review
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-029
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 4
parent_task: TASK-001
publication_class: bootstrap
normative_architecture_source: 9576fc9 as amended by 8d0c570 and by c2ee3eb; this task produces the next amendment in the same lineage. Neither 8d0c570 nor c2ee3eb is approved — LIN-ARCH-REVIEW recorded changes-required at rounds 2 and 3 — so each is a superseded authoring baseline to amend, never an approved source to build on.
remediates:
  - finding: A-201
    source: reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md
  - finding: A-202
    source: reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md
  - finding: A-203
    source: reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md
  - finding: A-204
    source: reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md
  - finding: A-205
    source: reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md
  - finding: A-206
    source: reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md
  - finding: A-207
    source: reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md
  - finding: A-208
    source: reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md
  - decision: HUMAN-002
    source: tasks/TASK-013-ACTIVATION-LOG.md, model correction MC-006
    part: contract representation of the approved Runtime-owned durable pre-dispatch ingress observer and collector
supersedes: TASK-024
dependencies_satisfied:
  - edge: gate_recorded
    task: TASK-025
    satisfied_at: aa38c7d2e095f6ffd108bbd737a9862e1bff3ec2
    satisfied_branch: agent/gpt/reviewer/task-025
    satisfied_remote_ref: refs/heads/agent/gpt/reviewer/task-025
    pull_request: 11
    verdict_recorded: changes-required
    recorded_by: TASK-013 activation ACT-006
resource_lock_state_at_creation: free. The shared Git common directory carries no architecture-docs holder at ACT-006. The TASK-024 execution's lock, which ACT-005 recorded as still held, has since been released, and TASK-025 held no lock. This task may therefore be claimed.
review_target_branch: agent/gpt/architect/task-028
review_target_commit: not yet published
review_target_base: c2ee3ebfe62a8bb295948d79b7cccfdcfd04fc4a
review_target_applicability: applicable, resolved on publication
review_target_note: TASK-029 will review this task's immutable published commit against review-diff base c2ee3eb, the TASK-024 amendment this one revises, reading 8d0c570 and 9576fc9 where a judgment needs an earlier baseline. review_target_commit is recorded by the Orchestrator at the activation that consumes this task's publication; it is not guessed here.
branch_point_of: human/reroute/task-028-gpt
scope_validation_base: git merge-base HEAD human/reroute/task-028-gpt
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Create agent/gpt/architect/task-028 from the head of human/reroute/task-028-gpt at worktree-creation time, then resolve the immutable branch point inside the worktree with git merge-base HEAD human/reroute/task-028-gpt and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass a review-diff base, c2ee3eb, 8d0c570, c325275, or origin/main. Findings F-403 and A-209 each recorded why. The interrupted Claude draft is imported as uncommitted source material, not as a merge or an approved artifact; the GPT architect owns and must inspect the complete resulting delta. If you import another owner's published artifact by merging it onto this branch, that merge is part of your authored delta and its paths must already be inside this task's write scope.
---

# TASK-028: Third architecture amendment for the round-3 blocking findings and the approved pre-dispatch ingress observer contract

## Human-authorized execution-provider reroute

On 2026-08-05 the user rerouted this task from `claude` to `gpt` after the managed control environment refused to send repository, reviewer, and unpushed draft content to an external Claude service. The Claude process tree was verified stopped, its task lock was released normally with its matching session token, and its worktree retained 43 uncommitted in-scope paths with no commit or push. The GPT architect starts from `human/reroute/task-028-gpt`, imports that draft only as source material, and owns the inspection, correction, validation, and final commit of the complete architecture delta. This reroute changes execution identity and provenance only; it changes no scope, dependency, acceptance criterion, gate, lineage, or decision authority.

## Objective

Produce one architecture amendment that resolves every blocking finding `LIN-ARCH-REVIEW` lineage round 3 recorded against the TASK-024 amendment, and that represents the pre-dispatch ingress observer contract the human governance decision `HUMAN-002` approved, so that the eight runtime modules can be implemented against a contract set that can actually express the behavior it requires.

## Why this task exists rather than a second round of TASK-024

TASK-025 recorded one durable verdict — `changes-required` at commit `aa38c7d2` — applied atomically to `(TASK-024, review, round 1)`, `(TASK-016, review, round 2)`, and `(TASK-002, review, round 3)`. Under the gate-round rule in `tasks/TASK-001-DEPENDENCY-GRAPH.md` a recorded verdict is superseded rather than rewritten, and each remediation is a **new** task. TASK-024's record stays in `tasks/review/` with its published artifact `c2ee3eb` durable and its gate open, exactly as TASK-016 stayed in `review` when TASK-024 was created for it.

This task joins the `LIN-ARCH-REVIEW` cohort at lineage round 4. The cohort now has four members and a member is never removed, so round 3's coverage claim stays true of what it covered.

## Normative source and what is *not* approved

The named documents at `9576fc9` **as amended by `8d0c570` and by `c2ee3eb`**. All three are **authoring baselines to amend, not approved sources**: round 1 rejected `9576fc9`, round 2 rejected `8d0c570`, and round 3 rejected `c2ee3eb`. No document in this lineage has ever recorded a passing verdict. A statement in this amendment that treats any of them as approved is a finding.

## Scope

Nine items. Items 1 through 8 are the round-3 findings, each stated in the reviewer's own terms; item 9 is the approved governance contract. Read `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md` at `aa38c7d2` in full first — the file and line evidence for every finding is there and is not restated here.

### 1. A-201 (High) — the F-401 correction is absent and the immutable inbox still carries consumption state

Remove every consumption field from `IngressEntry`, including `consumedBy` at `docs/architecture/runtime/INTERFACE-CONTRACTS.md:551`, and keep consumption only in the separate append-only ledger and the cursor. Define both bootstrap dispatch contracts by name, require the recurring task to select one in its declaration, enumerate the authorized append principals per phase, reject every other principal, and align `INTERFACE-CONTRACTS.md`, ADR-0017, `STATE-MACHINE.md`, the diagrams, and the ownership map. `appendedBy` may not permit "the adapter or activation". ADR-0017's claim that correctness does not depend on promptness may not stand alongside a phase in which the consumer is the first durable appender.

### 2. A-202 (High) — the declared runtime types cannot load the committed task-record vocabulary

Either define and own an explicit task-record parser or projection contract with exact source and target schemas, or make the contract types match the committed records literally. The committed records use `task_id`, `owner_role`, `write_scope`, `required_gates`, `pre_merge_gates`, `gate_for`, `gate_class`, `gate_lineage`, `lineage_round`, `publication_class`, `status`, and a per-relation `verdict`; `TaskRecord` uses camelCase, requires runtime-only fields absent from the record, and `GateTarget` has no `verdict` member. Update the acceptance language and the validation fixture consistently. A claim that records compile "without restatement" or load with "no field renaming" must be true as written or must be withdrawn.

### 3. A-203 (High) — the adoptable-result path cannot mark a result effect with the event union it defines

Make result-effect identity representable in the event and transition contracts, define its uniqueness guard, and make every uninterrupted and recovery sequence use the same legal event order. `EffectLedgerEntry.isTaskResultEffect` is required and the normative sequence requires `EffectIntentRecorded { isTaskResultEffect: true }`, but no `RuntimeEvent` member carries that property and sequence 2 records no `EffectIntentRecorded` at all. A-104 is not resolved until this is expressible.

### 4. A-204 (High) — `RunDrainBlocked` strands the run and excludes its surviving process tree from recovery

Define a legal attach transition from both blocked-drain states and make recovery select every unverified closure record, or define another complete outcome that satisfies the unqualified no-survivor criterion. Align `LIFECYCLE-AND-BOOTSTRAP.md`, `CRASH-RECOVERY.md`, `STATE-MACHINE.md`, and the sequence diagram. The "next attach terminates it" claim must be true on every path it is stated for, or must be replaced.

### 5. A-205 (High) — workspace finalize cannot durably record publication identity before releasing the task lock

Split `executeFinalize` around the publication append, or introduce a callback or capability contract that preserves single-writer ownership and makes the ordering enforceable. Update both affected sequences to the implementable interface. The publication-before-unlock invariant must be implementable through the documented interface rather than only asserted beside it.

### 6. A-206 (High) — durable-intent receipts neither carry the required identity nor prove durable issuance

Have the append result return discriminated, identity-bearing receipts that callers can narrow without an assertion, and use a nominal or store-verifiable proof that an ordinary caller cannot synthesize. "Spawn before durable registration is not expressible" and "only `StateStore.append` issues a receipt" must be properties of the contract, not conventions. A-102 and A-103 are not resolved until this holds.

### 7. A-207 (High) — no owned interface delivers immutable inbox entries to the consuming activation

Assign one module to read and deliver the consumed range, represent that delivery in a typed interface, and align the component table, sequence 8, the scheduler API, `AgentInvocation`, and the consumption contracts. This finding and item 9 are the same seam approached from two directions and must be resolved together, not separately: the approved `HUMAN-002` observer is the component that appends, and this finding is about the component that delivers. State explicitly which module owns each half and which task implements it.

### 8. A-208 (Medium) — recovery is normative over four inputs and tested over six

Define one canonical decision input type and its cardinality, explicitly supersede the four-input wording in ADR-0013, `CRASH-RECOVERY.md`, and `STATE-MACHINE.md`, and update every normative document and diagram. ADR-0020 acknowledging two added axes is not a supersession.

### 9. The approved `HUMAN-002` contract — a Runtime-owned durable pre-dispatch ingress observer and collector

`HUMAN-002` was **approved by the user in the control session on 2026-08-05**. The decision is transcribed in `tasks/TASK-013-ACTIVATION-LOG.md` as model correction `MC-006` and in `tasks/TASK-001-DEPENDENCY-GRAPH.md`; this record names those sources and does not restate the decision in different words. What this amendment must represent is the contract for exactly the approved option:

- The component is a **durable pre-dispatch ingress observer and collector**, owned by the **runtime** role. It lives **outside `tasks/**`** and runs in the **runtime control plane**.
- **Before scheduler selection**, it validates and deduplicates an external source fact, then **appends the immutable inbox entry through the TASK-026 ingress store**.
- It then **exposes or signals the new high-water mark to TASK-005 scheduling**.
- The recurring task — TASK-013 — **consumes entries and records ledger rows and cursor effects, and is prohibited from appending its own trigger.** The contract must make that prohibition structural rather than advisory, which is the F-201 self-trigger rule restated as an authorization property.
- Interim operator authorization may remain in force **only until this observer is implemented and validated**. The contract must state that it is not the final autonomous contract, and must not represent operator authorization as the durable predicate.

Model the collector's authorization boundary, its validation and deduplication step, its append path through the ingress store, and its signal to the scheduler as named interfaces with owners. Do **not** widen any role's configured write scope to accommodate it, and do not place any part of it under `tasks/**`.

### Decision records and exclusions

- Record each cross-cutting decision as an ADR numbered from 0023, with context, decision, rejected alternatives, and consequences. At minimum: the corrected ingress entry and bootstrap dispatch contracts, the task-record projection contract, the result-effect identity model, the blocked-drain outcome, the finalize-and-publication ordering, the receipt issuance proof, the ingress delivery ownership, the canonical recovery decision domain, and the approved pre-dispatch observer. Where a decision changes ADR-0013, ADR-0017, ADR-0019, ADR-0020, ADR-0021, or ADR-0022, supersede it **explicitly** rather than editing it in place.
- Exclude implementing any module, decomposing tasks, editing any file under `tasks/`, deciding whether a prior finding is resolved, and approving any gate — including this task's own.

## Acceptance criteria

- [ ] Each of A-201 … A-208 is addressed, and for each the amendment states the file and line it changed and what it superseded.
- [ ] `IngressEntry` declares no consumption field of any kind, and no document, ADR, diagram, or example reintroduces one.
- [ ] Both bootstrap dispatch contracts are defined by name, the recurring task declares which one it runs under, the authorized append principals are enumerated per phase, and every other principal — including the recurring task itself — is rejected by the contract rather than by convention.
- [ ] The approved `HUMAN-002` observer and collector is represented as a runtime-owned component outside `tasks/**` in the runtime control plane, with its validation, deduplication, append-through-TASK-026, and high-water-mark signal to TASK-005 each expressed in a named interface with exactly one owning module.
- [ ] The contract states that interim operator authorization is bounded by the implementation and validation of that observer, and does not present it as the durable predicate.
- [ ] A committed task record loads against the declared types with no field renaming, or an explicit projection contract with exact source and target schemas is defined and owned; whichever is chosen, the acceptance language and the validation fixture say the same thing.
- [ ] A conforming transition can identify the one committed result effect that recovery may adopt, its uniqueness guard is stated, and every sequence uses the same legal event order.
- [ ] A blocked drain has a legal attach transition and its unresolved process tree is selected by recovery, or a different complete outcome satisfies the unqualified no-survivor criterion.
- [ ] Publication identity is durably recorded before the task lock is released, through an interface that can actually perform both halves.
- [ ] Receipts returned by the append path carry the identity the side-effect boundaries require and cannot be synthesized by an ordinary caller.
- [ ] Exactly one module owns delivery of consumed inbox entries to the activation, and the component table, sequences, scheduler API, and invocation contract all agree.
- [ ] The recovery decision domain has one canonical input type and cardinality, and the four-input wording is explicitly superseded everywhere it appears.
- [ ] Every changed decision names what it supersedes; no existing contract is silently rewritten; each new ADR records context, decision, rejected alternatives, and consequences; and no two ADRs decide the same question differently.
- [ ] The module map still contains exactly the modules the graph assigns, each with exactly one owner task, and the module dependency graph is still acyclic with two independent contract roots.
- [ ] The structural prohibitions on pushing `main`, setting `ALLOW_MAIN_PUSH`, bypassing hooks, writing a governance path, and force-releasing a lock are not weakened.
- [ ] The amendment requires no agent to write outside its configured role scope and requires no governance or enforcement file to change.
- [ ] Diagrams agree with the normative contracts; relative links and anchors resolve.
- [ ] The language policy holds: English throughout, with Turkish reserved for user-visible command-line copy.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved scope_validation_base>` reports a valid result, and both the resolved branch point and the output are recorded in the handoff.
- [ ] The branch is published with an immutable commit, and the publication outcome is recorded. `publication_class: bootstrap`, so `publication: local-only` with a stated reason is permitted when the remote step is unavailable.

## Expected artifacts

- `docs/architecture/ARCHITECTURE.md`, amended.
- The affected documents under `docs/architecture/runtime/`, amended with explicit supersession.
- New ADRs numbered from 0023 under `docs/adr/`, and forward supersession notes on every ADR whose decision changed.
- The affected diagrams under `diagrams/architecture/`, reconciled with the normative contracts.

## Write-scope isolation and the resource lock

This task's write scope is identical to TASK-002's, TASK-016's, and TASK-024's, because an amendment necessarily edits the documents the prior amendment authored. It is **disjoint from every non-architecture task's scope** — no path it may write is inside any reviewer, security, QA, performance, runtime, devops, or orchestrator task's scope — and it introduces **no new overlap**: the three-way `architecture-docs` overlap becomes four-way among the same registered holders, and is serialized by the declared `resource_lock: architecture-docs`. At most one holder may be claimed at a time. The lock is free at creation; see `resource_lock_state_at_creation`.

## Gate and remediation path

This task declares `required_gates: [review]` and `pre_merge_gates: [review]`. Its single gate relation, its scheduling class, its ordering against integration, its lineage, and its lineage round are declared in the frontmatter above and summarized in the registers in `tasks/TASK-001-DEPENDENCY-GRAPH.md`; this body names those sources and does not restate their values.

**Publication is not approval.** Reaching `review_ready` makes this amendment reviewable and releases nothing. `gate_passed(LIN-ARCH-REVIEW, review, 4)` is satisfied only by a passing or formally accepted authoritative verdict, which **TASK-029** owns. TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 stay `blocked` until then.

The architect and reviewer are both assigned to the `gpt` family after the human-authorized reroute, but they must run in separate execution contexts. The TASK-028 author context may not execute TASK-029, and neither the TASK-015, TASK-020, nor TASK-025 execution context is reused. This task may not close its own gate, and it may not judge whether any prior finding is resolved — that is TASK-029's judgment. The repository's cross-family reviewer preference is not a substitute for, and does not weaken, the mandatory execution-context separation.

Publishing this task's artifact is what wakes TASK-013. Until the approved observer of scope item 9 is implemented and validated, the append and the dispatch decision are performed under the declared interim contract, which `tasks/blocked/TASK-013-task-record-lifecycle-and-gate-closure.md` records as a limitation rather than as the durable predicate. This task must not, and need not, write anything under `tasks/`.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-028 -Role architect -Llm gpt -BaseRef human/reroute/task-028-gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-028 -Role architect -Llm gpt` before editing. The `architecture-docs` lock is a declared cross-task lock that no script enforces yet; confirm no other holder is claimed before starting.
3. Read `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md` at `aa38c7d2` in full, then `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md` and `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md` for the earlier rounds, then `tasks/TASK-013-ACTIVATION-LOG.md` model correction `MC-006` for the approved `HUMAN-002` decision. Amend from `c2ee3eb`.
4. Before handoff, resolve the immutable branch point with `git merge-base HEAD human/reroute/task-028-gpt` and run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <that value>`. Do not pass a review-diff base, `c2ee3eb`, `8d0c570`, `c325275`, or `origin/main`; findings F-403 and A-209 each recorded why. Record the resolved value in the handoff.
5. Commit, publish the task branch and open or update a pull request when a remote and credentials are available — otherwise record `publication: local-only` with the reason — and run `scripts/orchestration/release-task.ps1 -TaskId TASK-028 -Role architect -Llm gpt`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the architect role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator performs the transition under TASK-013.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit, pull request, and handoff.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to record the publication, move this record to `review`, and release the `review_ready(TASK-028)` edge that TASK-029 holds
