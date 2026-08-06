---
task_id: TASK-026
title: Implement the durable ingress inbox and activation cursor store
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-026
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-026
write_scope:
  - src/orchestrator/ingress/**
  - tests/unit/orchestrator/ingress/**
dependencies:
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 8
  - task: TASK-003
    edge: integrated
  - task: TASK-018
    edge: integrated
required_gates:
  - review
  - security
  - qa
pre_merge_gates: []
gate_tasks:
  - task: TASK-009
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
  - task: TASK-010
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
  - task: TASK-011
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
dependencies_satisfied:
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 8
    satisfied_at: 734bdbc5d9541daa78fd570057317152247d1f87
    verdict_recorded: approved
    recorded_by: TASK-013 activation ACT-016, consuming ingress entry seq 24
    approved_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3
parent_task: TASK-001
publication_class: runtime
normative_architecture_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3, the immutable TASK-038 target. THIS IS THE FIRST APPROVED ARCHITECTURE SOURCE THIS GRAPH HAS HAD. LIN-ARCH-REVIEW recorded approved at lineage_round 8, at 734bdbc, and TASK-013 activation ACT-016 closed all eight relations together, so the lineage's authoritative verdict is passing at the floor this record's edge declares. The earlier baselines 9576fc9, 8d0c570, c2ee3eb, fe0374c, 468b37b, 6d145eb, and 970b081 remain superseded authoring baselines that were each rejected at rounds 1 through 7; a record that cites any of them as approved is still a finding. Build against 8ea5c32 and nothing else. The approved source is a commit on agent/gpt/architect/task-038 that has NOT been integrated into any branch; reading it is how a consumer consults the approved architecture until the separate branch-integration operation lands.
remediates:
  - finding: F-301
    source: reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md
    part: implementation of the durable store and its adapters
blocked_reason: The architecture gate is NO LONGER a blocker. LIN-ARCH-REVIEW round 8 recorded approved at 734bdbc with A-601 resolved and no new finding, and TASK-013 activation ACT-016 closed all eight relations together, so this record's gate_passed(LIN-ARCH-REVIEW, review, 8) dependency is SATISFIED and the approved source is 8ea5c32. What still blocks this task is integrated(TASK-003) and integrated(TASK-018) - neither the durable state store nor the toolchain is integrated. No branch integration has happened yet: gate closure removes the obstacle to integration without performing one, and the integration of the approved architecture is a separate externally visible operation that produces its own ingress fact.
exit_condition: TASK-003 and TASK-018 are integrated into integration/autonomous-runtime. The architecture condition is already met and does not need to be waited on again.
review_target_base: not applicable until this task publishes
review_target_applicability: not applicable yet. This task is gated but no artifact of it exists, so no round is pinned and there is no delta to diff. It becomes applicable when this task reaches review_ready; the Orchestrator records review_target_commit and review_target_base then, at the activation that consumes the publication, from the branch as published.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime at or after the commit where this task's dependencies merged, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-026: Implement the durable ingress inbox and activation cursor store

## Objective

Implement the durable append-only ingress inbox that the activation model requires: a state store whose entries carry a stable one-time sequence number, a content-hash identity, and a hash of their source artifact, so that the recurring task's cursor is a position rather than a count over mutable Git refs.

## Why this task exists

Finding **F-301** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md` recorded that the revision-4 ingress model derived `ingress_seq` by scanning every matching fact reachable from `integration/autonomous-runtime` and every live `agent/*` branch, ordering by committer timestamp, and taking the **count**. That is not a cursor. A backdated commit inserts a fact before the cursor so the old tail replays and the new fact is skipped; deleting a live branch reduces the count below the cursor, which the model itself declares invalid; a commit matching several event classes has no rule; and the recurring task's own effects commit matched a fact class, so quiescence could never be demonstrated.

Revision 5 of `tasks/TASK-001-DEPENDENCY-GRAPH.md` replaces the observation rule with a durable inbox. This task owns the store and its adapters. **TASK-005** owns the observer, the dispatch predicate, cursor validation, and the one-commit effects-plus-cursor rule that read this store; the two are separate modules with disjoint write scopes.

## Normative source

The named documents at **`8ea5c32`**, the immutable TASK-038 target and **the first approved architecture source this graph has had**. `LIN-ARCH-REVIEW` recorded `approved` at round 8, at `734bdbc`, and `ACT-016` closed all eight relations together. The earlier baselines `9576fc9` … `970b081` remain superseded and rejected; do not build against any of them. `docs/architecture/runtime/COMPONENT-BOUNDARIES.md` must assign the ingress inbox to this task as the eighth module, and `INTERFACE-CONTRACTS.md` must declare its types. Do not start before that contract is approved, which means before this task's remaining `integrated()` dependencies are satisfied. The architecture condition is now met: `LIN-ARCH-REVIEW` recorded a passing verdict at `lineage_round` 8.

**Round 8 approved the collector contract.** `LIN-ARCH-REVIEW` recorded `approved` at `734bdbc` with A-601 resolved and no new finding, and `ACT-016` closed all eight relations. The contract this module implements — the `HUMAN-002` pre-dispatch observer and collector, whose own Part B property A-503 repaired at round 7 — is now carried inside a **passing** verdict for the first time. The architecture obstacle to this task is gone; what remains is `integrated(TASK-003)` and `integrated(TASK-018)`, neither of which has happened.

**Superseded round-7 note.** Round 7 recorded A-503 `resolved` while the contract was still not approved. Round 6 had found the first unsatisfied `HUMAN-002` property since round 4; TASK-036 repaired it and TASK-037 verified the repair — `TASK-026` alone appends, `TASK-005` alone signals, observes, and reads the activation range, and both the appended and the deduplicated success dispositions are constructible. **That closes the defect this module's own boundary depended on.** It releases nothing: round 7 still returned `changes-required` on a different blocker, A-601, so the contract carrying the repaired property remains unapproved and this task's dependencies are unchanged.

**Superseded round-6 note.** Round 6 found a collector-contract defect, which reversed the direction of the previous two rounds. Rounds 4 and 5 each recorded all six `HUMAN-002` Part B properties satisfied inside a failing verdict, with the blockers lying elsewhere. **Round 6 recorded A-503**, the first unsatisfied property since round 4: `PreDispatchCollectResult` requires an `entry` on every success, which the append-committed / signal-not-yet-issued crash prefix cannot produce without fabricating a durable `seq` or violating TASK-005's sole-reader boundary. That is a defect in the contract representation of the collector this task implements — not in the `HUMAN-002` decision or in the ingress model — and it is routed to **TASK-036** item 3. It does not change this task's dependencies; it does mean the contract this task waits on is now known to be wrong in a way that directly concerns this module's own boundary.

**Round 4 assessed this task's own contract and did not approve it.** TASK-029 recorded all six `HUMAN-002` Part B checks **satisfied** — the collector is represented as runtime-owned, outside `tasks/**`, running before scheduler selection, validating and deduplicating before the durable append, appending through this task's store, signalling the high-water mark to TASK-005, structurally barred from letting the recurring task append its own trigger, and bounding interim operator authorization by implementation and validation. **That is not an approval of the contract**: the same verdict is `changes-required`, and `A-202` — the exact source schema that cannot load the committed task records — is recorded `not resolved` with the reviewer stating in terms that the satisfied `HUMAN-002` checks "does not cure A-202". This task therefore still has no approved contract to implement.

Every field name, type, signature, and string-literal union in this module comes from the approved contract. Under the contract change control rule in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, this task may not change one even inside its own write scope; a contract that is wrong stops at the boundary and is handed to the Orchestrator, which routes an amendment to the architect.

## Scope

**Item 1 — the durable append-only store.**

- Persist entries with the contract's **inbox entry** schema: `seq`, `epoch`, `fact_id`, `content_hash`, `event_type`, `producer_task`, `producer_role`, `source_commit`, `source_path`, `appended_by`. Finding **F-401** removed `consumed_by` from this schema: an entry carries **no consumption state of any kind** and is byte-identical before and after the activation that consumes it. The consumption ledger is a separate append-only record whose rows reference an entry by `seq` and `fact_id` and carry `consumed_by`; a ledger row never writes back to an entry, and this module never exposes a way to mark an entry consumed.
- Assign `seq` **once** at append time, in append order. Never recompute it, never derive it from a count of anything outside the store, and never reorder or renumber an existing entry.
- Compute `fact_id` as SHA-256 over the canonical identity tuple the contract defines, byte for byte, so two independent implementations agree.
- Compute `content_hash` as SHA-256 over the bytes of the source artifact at the source commit.
- Make append **idempotent by `fact_id`**: appending a fact already present is a no-op that returns the existing entry.
- Make append **crash-atomic**: after any crash the store contains either the whole entry or none of it, and never a partial or duplicate `seq`. Reuse the durable-state primitives TASK-003 provides rather than reimplementing them.
- Expose `maxSeq()` returning `max(seq)` or 0, and a read of the contiguous range `(from, to]` in `seq` order.
- Retain entries independently of Git refs. Deleting, rewriting, or garbage-collecting a branch must not remove an entry, change a `seq`, or lower `maxSeq()`.

**Item 2 — the ingress adapters.**

- Recognize the closed event-type set from the contract, and resolve a source commit matching several classes to **exactly one** entry using the declared class precedence order.
- Treat distinct commits as distinct facts even when they express one logical step.
- Order the entries of one append batch by ascending source commit identifier. **Never order by committer timestamp**, and do not record a timestamp as an ordering input.
- Exclude, explicitly and by rule, every commit authored by an activation of the recurring task on its own branch. This exclusion is unconditional across all fact classes.
- Accept an append only from an **authorized appender** as the contract defines it — the adapters in the runtime phase, and the authorized bootstrap appender named by the governance decision in the bootstrap phase. Reject an append offered by the recurring task, and reject an append whose declared appender is not authorized. This is the second half of finding **F-401** and is independently assessed as **TASK-010 `V10-F401-AUTH`**.

**Item 2a — the durable pre-dispatch ingress observer and collector, as `HUMAN-002` approved it.**

The human governance decision `HUMAN-002` was **approved by the user in the control session on 2026-08-05**, and it assigns this component to the **runtime** role. It is transcribed verbatim in `tasks/TASK-013-ACTIVATION-LOG.md` as model correction `MC-006`; read that transcription rather than this summary where the two could differ, and implement only what the approved contract that TASK-028 publishes declares. The decision's shape:

- The collector is **durable**, lives **outside `tasks/**`**, and runs in the **runtime control plane**.
- **Before scheduler selection**, it **validates and deduplicates** an external source fact, then **appends the immutable inbox entry through this module's ingress store** — the same append path, the same identity-keyed deduplication, and the same authorized-appender check as Item 1 and Item 2, not a second parallel path.
- It then **exposes or signals the new high-water mark to TASK-005 scheduling**.
- **TASK-013 consumes entries and records ledger rows and cursor effects, and is prohibited from appending its own trigger.** That prohibition must be enforced by this module's authorized-appender check, not by convention, and it is the self-exclusion rule of Item 2 stated as an authorization property.

Implement the collector inside this task's declared write scope, `src/orchestrator/ingress/**`, **unless the approved TASK-028 contract places it elsewhere** — in which case stop at the boundary under the contract change control rule and hand the placement to the Orchestrator, which routes a write-scope correction before this task is dispatched. Do not widen this task's write scope unilaterally, and write nothing under `tasks/`.

**Interim authorization is bounded, not permanent.** Until this collector is implemented and independently validated, TASK-013 runs under the declared `interim-operator-authorized` bootstrap dispatch contract. `HUMAN-002` being approved does not make the durable contract operative; only this implementation plus its validation does. Do not treat the approval as a satisfied precondition.
- Handle the epoch boundary: read the active epoch's `seq_base`, assign the first entry of a new epoch `seq_base + 1`, and never re-derive, renumber, or reclassify an entry from a sealed epoch.
- Treat every field read out of a commit message, a report, or a handoff as untrusted input: validate it against the contract's types before it becomes an entry field, and never derive a filesystem path, a ref name, or a command argument from it.

**Item 3 — tests.** Committed tests are offline and deterministic, and use fixtures rather than a live remote. The six failure modes F-301 named are each a required test:

| Test | What it must prove |
|---|---|
| Backdated publication | A fact whose source commit predates existing entries appends at the next free `seq` and does not insert before any existing entry or before the cursor |
| Late discovery of a historical fact | A fact reachable all along but never appended is appended on discovery, at the next free `seq`, and is consumed exactly once |
| Multiple matching classes | A commit matching several fact classes produces exactly one entry, typed by the highest-precedence class |
| Producing ref deleted | After the source branch is deleted, the entry survives, its `seq` is unchanged, and `maxSeq()` does not decrease |
| Self-effects publication | A commit authored by a recurring-task activation on its own branch produces no entry, so `maxSeq()` is unchanged and quiescence is preserved |
| Crash replay | A crash during append leaves either a complete entry or none, and a replay of the same fact is a no-op by `fact_id` rather than a second entry |

Additional required tests: `fact_id` and `content_hash` reproduce the values a reader computes by hand from the same inputs; `maxSeq()` is non-decreasing across an arbitrary interleaving of appends and reads; a duplicate `fact_id` never yields two `seq` values; and a sealed epoch's entries are unchanged after a new epoch is declared.

**Exclusions.** Do not implement the observer, the dispatch predicate, cursor validation, or the one-commit effects-plus-cursor rule; those are TASK-005's and this task writes nothing under `src/orchestrator/scheduling/`. Do not write any task record, report, architecture document, governance file, or enforcement file. Do not decide any gate.

## Acceptance criteria

- [ ] Entries persist with the full contract **inbox entry** schema, and every field name and type matches `INTERFACE-CONTRACTS.md` exactly.
- [ ] **No inbox entry carries a consumption field.** A test asserts that the persisted entry is byte-identical before and after a consuming activation records its ledger row, and that no exposed operation can set consumption state on an entry. If the approved contract still declares `consumed_by` on the inbox entry, this task stops at the boundary and hands the divergence to the Orchestrator under the contract change control rule rather than implementing either side unilaterally. Independently assessed as **TASK-009 `V9-F401-SCHEMA`** and **TASK-011 `V11-F401-PREDISPATCH`**.
- [ ] An append offered by the recurring task, or by an appender the contract does not authorize, is rejected, proven by a test.
- [ ] The `HUMAN-002` collector validates and deduplicates an external source fact and appends the resulting immutable entry **through this module's own store**, with no second append path that bypasses the identity-keyed deduplication or the authorized-appender check, proven by a test.
- [ ] The collector's append completes and is durable **before** the scheduler can select the recurring task, and the new high-water mark is exposed or signalled to the scheduling module through the interface the approved contract declares. A test asserts that a run in which the recurring task's own activation creates the only durable evidence is rejected rather than dispatched. Independently assessed as **TASK-010 `V10-F401-AUTH`** for the authorization half and **TASK-011 `V11-F401-PREDISPATCH`** for the ordering half.
- [ ] The collector lives outside `tasks/**` and writes nothing under `tasks/`, proven by a path assertion rather than by convention.
- [ ] `seq` is assigned once at append and is never recomputed, reordered, or renumbered, and no code path derives it from a count of commits, refs, branches, or files.
- [ ] `fact_id` is SHA-256 over the contract's canonical identity tuple and reproduces byte for byte against a hand-computed value in a test fixture.
- [ ] `content_hash` is SHA-256 over the source artifact bytes and detects a rewrite of the artifact under the same path.
- [ ] Append is idempotent by `fact_id` and crash-atomic; no crash point produces a partial entry, a duplicate `seq`, or a duplicate `fact_id`.
- [ ] `maxSeq()` is non-decreasing for the life of the store under every tested interleaving, including ref deletion and rewrite.
- [ ] A source commit matching several fact classes produces exactly one entry under the declared precedence order.
- [ ] Batch ordering uses the source commit identifier; no ordering path reads a committer or author timestamp.
- [ ] A commit authored by a recurring-task activation on its own branch produces no entry, proven by a test rather than asserted in a comment.
- [ ] A sealed epoch's entries are byte-identical after a new epoch is declared, and the new epoch's first entry is `seq_base + 1`.
- [ ] Every field derived from commit, report, or handoff text is validated against the contract types before use, and no path, ref, or command argument is derived from it.
- [ ] All six F-301 failure-mode tests exist, are named for the mode they cover, and pass.
- [ ] The module writes nothing outside `src/orchestrator/ingress/**` and `tests/unit/orchestrator/ingress/**`, and imports only from a contract root, never from a sibling implementation.
- [ ] The toolchain's build, type check, lint, and unit test commands pass.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the handoff.
- [ ] The branch is published with an immutable commit and a pull request. `publication_class: runtime`, so an unavailable remote is an explicit `blocked` outcome, not a `local-only` success.

## Expected artifacts

- The ingress inbox implementation under `src/orchestrator/ingress/`.
- The ingress adapters for the closed event-type set, with the precedence and exclusion rules.
- The durable pre-dispatch ingress observer and collector that `HUMAN-002` approved, at the path the approved TASK-028 contract declares, with its validation, deduplication, append-through-the-store, and high-water-mark signal to the scheduling module.
- Unit tests under `tests/unit/orchestrator/ingress/`, including the six named failure-mode tests, the collector's pre-dispatch ordering and authorization tests, and the hash-reproduction fixtures.

## Write-scope isolation

`src/orchestrator/ingress/**` and `tests/unit/orchestrator/ingress/**` are new directories, disjoint from TASK-003's `state/`, TASK-005's `scheduling/`, TASK-006's `supervisor/`, TASK-007's `lifecycle/` and `bin/`, TASK-008's `recovery/`, and TASK-017's `workspace/`. Both are inside the runtime role's configured `src/orchestrator/**` and `tests/unit/orchestrator/**`. This task holds no resource lock.

## Gate and remediation path

This task declares `required_gates: [review, security, qa]` and `pre_merge_gates: []`. Each of the three relations declares its gate name, scheduling class, ordering against integration, lineage, and lineage round in the frontmatter above, and each is summarized in the gate-lineage register and the aggregate and retrospective gate register in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, which record why each delay is accepted and what it costs. Those registers are the only normative statements of those values; this body names them and does not restate them.

The independent validation obligations that specifically cover this module are **TASK-009 `V9-F301-STORE`**, **`V9-F301-CLASS`**, and **`V9-F401-SCHEMA`**; **TASK-010 `V10-F301-AUTH`** and **`V10-F401-AUTH`**; and **TASK-011 `V11-F301-STORE`**, **`V11-F301-CLASS`**, and **`V11-F401-PREDISPATCH`**. This task's own unit tests never satisfy them.

Findings return to the Orchestrator under TASK-013, which routes remediation to this task's owner. This task never reviews its own work and never closes its own gate.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-026 -Role runtime -Llm claude`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-026 -Role runtime -Llm claude` before editing.
3. Branch from `integration/autonomous-runtime` at or after the commit where TASK-003 and TASK-018 merged.
4. Before handoff, run the toolchain checks and `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree`.
5. Commit, publish the task branch and open or update a pull request. If the remote or credentials are unavailable, record an explicit `blocked` outcome — `publication_class: runtime` does not permit a `local-only` success — and run `scripts/orchestration/release-task.ps1 -TaskId TASK-026 -Role runtime -Llm claude`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the runtime role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator performs the transition under TASK-013.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit, pull request, and handoff.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to record the publication and release the `integrated(TASK-026)` edge TASK-005 holds
