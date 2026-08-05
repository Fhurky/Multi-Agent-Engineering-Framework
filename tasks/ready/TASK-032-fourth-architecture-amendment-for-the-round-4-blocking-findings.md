---
task_id: TASK-032
title: Fourth architecture amendment for the round-4 blocking findings — task-record projection, result-effect recovery reduction, the spawn refusal boundary, and diagram conformance
status: ready
owner_role: architect
llm: gpt
branch: agent/gpt/architect/task-032
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-architect-task-032
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/runtime/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies:
  - task: TASK-029
    edge: gate_recorded
required_gates:
  - review
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-033
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 5
parent_task: TASK-001
publication_class: bootstrap
normative_architecture_source: 9576fc9 as amended by 8d0c570, by c2ee3eb, and by fe0374c; this task produces the next amendment in the same lineage. None of 9576fc9, 8d0c570, c2ee3eb, and fe0374c is approved — LIN-ARCH-REVIEW recorded changes-required at rounds 1, 2, 3, and 4, the round-4 verdict at 3df261fa — so each is a superseded authoring baseline to amend and never an approved source to build on. No approved architecture source exists yet: one comes into being only when LIN-ARCH-REVIEW records a passing or formally accepted authoritative verdict at lineage_round 5 or later, which TASK-033 owns.
remediates:
  - finding: A-202
    severity: high
    source: reports/code-review/TASK-028-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-3.md
    disposition_at_round_4: not resolved
  - finding: A-203
    severity: high
    source: reports/code-review/TASK-028-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-3.md
    disposition_at_round_4: partially resolved
  - finding: A-206
    severity: high
    source: reports/code-review/TASK-028-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-3.md
    disposition_at_round_4: partially resolved
  - finding: A-105
    severity: medium
    source: reports/code-review/TASK-028-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-3.md
    disposition_at_round_4: partially resolved
  - finding: A-301
    severity: low
    source: reports/code-review/TASK-028-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-3.md
    disposition_at_round_4: new at round 4
inherited_views_not_separately_remediated:
  - finding: A-004
    view_of: A-202
  - finding: A-101
    view_of: A-202
  - finding: A-102
    view_of: A-206
  - finding: A-104
    view_of: A-203
inherited_views_note: TASK-029 recorded that A-004, A-101, A-102, and A-104 are inherited views of the same unresolved projection, registration-proof, and result-adoption defects, and stated that they "do not create duplicate implementation obligations". They are therefore not separate scope items. Each closes when the finding it is a view of closes, and TASK-033 judges each explicitly rather than inheriting round 4's disposition. Creating a duplicate remediation obligation for an inherited view would be a scope error, not thoroughness.
supersedes: TASK-028
dependencies_satisfied:
  - edge: gate_recorded
    task: TASK-029
    satisfied_at: 3df261fa8f3a65bb20b9c5d6d316d8cb600a0d8c
    satisfied_branch: agent/gpt/reviewer/task-029
    satisfied_remote_ref: refs/heads/agent/gpt/reviewer/task-029
    pull_request: 18
    verdict_recorded: changes-required
    recorded_by: TASK-013 activation ACT-008, consuming ingress entry seq 16
resource_lock_state_at_creation: free. The shared Git common directory carries no architecture-docs holder at ACT-008. The TASK-028 execution released it and TASK-029 held no lock. This task may therefore be claimed. TASK-002, TASK-016, TASK-024, and TASK-028 are the other registered holders and none is active.
review_target_branch: agent/gpt/architect/task-032
review_target_commit: not yet published
review_target_base: fe0374c45aaa51e589525cee978c8ff244837163
review_target_applicability: applicable and resolved for the base; the target commit is a reproducible value the Orchestrator pins at the activation that consumes this task's publication
review_target_note: TASK-033 reviews this task's immutable published commit against review-diff base fe0374c, the TASK-028 amendment this one revises, reading c2ee3eb, 8d0c570, and 9576fc9 where a judgment needs an earlier baseline. The target commit does not exist yet and is deliberately not guessed. The Orchestrator binds review_target_commit from the branch as published, at the activation that consumes the publication, exactly as ACT-007 bound fe0374c and ACT-005 bound c2ee3eb. Once bound it is immutable and no later activation changes it.
branch_point_of: agent/claude/orchestrator/task-013
scope_validation_base: git merge-base HEAD agent/claude/orchestrator/task-013
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Create agent/gpt/architect/task-032 from the head of agent/claude/orchestrator/task-013 at worktree-creation time, then resolve the immutable branch point inside the worktree with git merge-base HEAD agent/claude/orchestrator/task-013 and pass that value to -BaseRef. Never pass a review-diff base, fe0374c, c2ee3eb, 8d0c570, c325275, or origin/main. Findings F-403 and A-209 each recorded why. Record the resolved value in the handoff so the Orchestrator can pin it. The derivation expires once this branch is merged into a ref the Orchestrator branch contains — TASK-029's base is the live example — so record the resolved 40-hex value, which is the durable fact, and not the expression. If the resolved value disagrees with what this record anticipates, report the actual provenance rather than substituting a base that passes.
integration_ancestry_warning: TASK-028's branch point 0b413b7 predates the merges of pull requests 3 and 9 into main, which is why pull request 15 reports CONFLICTING and why TASK-029's read-only merge-tree simulation found 15 content conflicts. Branch this task from a commit that already contains 8d0c570, c2ee3eb, and fe0374c so the same ancestry gap is not reproduced a fourth time. The head of agent/claude/orchestrator/task-013 at ACT-008 is fd7ce90, which contains all three. Resolving pull request 15 is not this task's work and not an Orchestrator action.
---

# TASK-032: Fourth architecture amendment for the round-4 blocking findings

## Objective

Amend the runtime architecture so that the five findings `LIN-ARCH-REVIEW` round 4 left open — **A-202**, **A-203**, **A-206**, **A-105**, and **A-301** — are remediated in the normative contracts, the state machine, the recovery documents, the ADRs, and the diagrams, and so that the four inherited views of them close with them.

This task authors an amendment. **It does not approve one.** `LIN-ARCH-REVIEW` round 5, owned by TASK-033, decides whether this amendment is approved, and only that verdict releases TASK-003 through TASK-008, TASK-017, TASK-018, and TASK-026 from `blocked`.

## Why this task exists rather than a second round of TASK-028

TASK-029 recorded one durable verdict, `changes-required` at commit `3df261fa`, applied atomically to four relations, and TASK-028's record stays in `review` with its `review` gate open. Under the gate-round rule in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, a recorded verdict is durable and is superseded rather than rewritten, and each superseding round is carried by a **new** task. Reopening TASK-028 would make a completed amendment re-entrant and would put a second, conflicting authored delta on a branch whose pull request is already open.

This is the **fourth** amendment in this lineage. Rounds 1, 2, and 3 rejected `9576fc9`, `8d0c570`, and `c2ee3eb`; round 4 rejected `fe0374c`. That pattern is recorded rather than absorbed: nine downstream tasks have now waited four full amendment cycles, and the risk that a fifth is needed is stated in this record and in `tasks/TASK-001-DEPENDENCY-GRAPH.md` rather than assumed away.

## Immutable-target rules

These bind this task and are the same rules TASK-024 and TASK-028 ran under.

1. **The reviewed target is one immutable commit.** Publish the amendment as a commit on `agent/gpt/architect/task-032`. Once the Orchestrator pins it into `review_target_commit`, it is immutable: a later commit on this branch is not the reviewed target, and no TASK-013 activation changes a bound target.
2. **Do not guess the target hash.** This record deliberately carries `review_target_commit: not yet published`. The Orchestrator reads it from the branch as published at the activation that consumes the publication.
3. **The review-diff base is `fe0374c` and is fixed now.** It is the TASK-028 amendment this one revises. It is **not** a scope-validation base and must never be passed to `validate-write-scope.ps1`.
4. **The scope-validation base is this branch's own immutable branch point**, resolved inside this task's worktree and reported in the handoff. The two bases answer different questions; conflating them is finding F-403.
5. **State the authored delta, the cumulative architecture diff, and any ancestry difference as three separate sets** in the handoff. Finding F-502 recorded what conflating a target diff with a review scope costs, and A-209 recorded what attributing inherited paths to the wrong owner costs.
6. **Nothing under `tasks/`, `config/`, `scripts/`, `.github/`, or `.githooks/` may be written by this task.** A governance or enforcement change is proposed to the user, never authored from an `agent/*` branch.

## Scope

Five items, one per open finding. Each cites the exact location TASK-029 recorded.

### Item 1 — A-202, High: the exact source schema still rejects committed records

`docs/architecture/runtime/INTERFACE-CONTRACTS.md:824-865` and `:890-904`.

`TaskRecordDocumentSource` cannot load every committed record into the declared exact nested shapes. `ActivationDocument` requires `subscribed_event_types`, which the sole committed activation block — TASK-013's — does not carry, and that block contains thirteen further nested activation keys that cannot enter `retained`, because `:843-864` retains only remaining **top-level** keys. `GateRelationDocument` ends at eight fields while **24 of the 92** committed relation documents carry `verdict_recorded_at`, `remediated_by`, and `revalidated_by`.

Deliver **one** of the two outcomes the round-4 record names, not a partial mixture:

- every committed task record loads against the declared types with no field renaming and no data loss; **or**
- an explicit projection contract with exact source and target schemas, an owner, and a stated transform, where the acceptance language, the validation fixture, and the contract all say the same thing.

The committed records at the target tree are the fixture. A schema that the repository's own records fail is not satisfied by amending the records — `tasks/**` is outside this task's write scope and the fixture is evidence, not a defect to edit away.

### Item 2 — A-203, High: recovery reduces the wrong fact set

`docs/architecture/runtime/INTERFACE-CONTRACTS.md:996`, `:1091`, `:1768-1807`; `docs/architecture/runtime/STATE-MACHINE.md:485-501`; `docs/architecture/runtime/CRASH-RECOVERY.md:87-91`; `diagrams/architecture/runtime-sequences.md:388-397`.

`isTaskResultEffect` and the one-flagged-intent-per-attempt guard exist, which round 4 recorded as material progress. The canonical `ReconciliationInput` nevertheless collapses all current-attempt effects into `ledgerState`, and its construction rule at `:1804-1807` yields `committed` from **any** committed entry rather than from the unique result effect. The legal crash prefix round 4 constructed — `WorkerResultRecorded` durable, an unrelated earlier effect committed, crash before the flagged result-effect intent or commit — makes R1 emit `WorkerSucceeded` for a result effect that never ran.

The amendment must let a conforming transition identify **the one committed result effect** recovery may adopt, state its uniqueness guard, and make every uninterrupted and recovery sequence use the same legal event order. Sequence 8 at `runtime-sequences.md:392-397` currently omits `WorkerResultRecorded`, `EffectIntentRecorded`, and `EffectCommitted` and must not.

Closing this item is what closes the inherited view **A-104**.

### Item 3 — A-206, High: the spawn boundary cannot represent its required refusal

`docs/architecture/runtime/INTERFACE-CONTRACTS.md:1128-1203`, `:1591-1634`, `:1654-1668`, `:1693-1695`.

`ProcessTreeController.spawnOwned` promises at `:1660-1662` that a missing, forged, stale-epoch, or subject-mismatched receipt returns `RegistrationNotDurable`, while `SpawnOwnedResult` at `:1693-1695` permits only success or `AdapterFailure`. The prose and the type disagree, so the actual side-effect boundary cannot express its own documented refusal.

Make the result type able to carry the refusal the prose requires, keep the receipts nominal, discriminated, and store-verifiable, and keep them unsynthesizable by an ordinary caller. Closing this item is what closes the process-registration half of the inherited view **A-102**.

### Item 4 — A-105, Medium: diagrams disagree with the normative interfaces

`diagrams/architecture/runtime-sequences.md:121` and `:334` versus `docs/architecture/runtime/INTERFACE-CONTRACTS.md:2029-2041` and `docs/architecture/runtime/WORKSPACE-LIFECYCLE.md:123-146`.

Two sequences still call `completeFinalize(plan, publication, publicationReceipt)` where the normative interface requires `completeFinalize(continuation: WorkspaceFinalizeContinuation, receipt: ArtifactPublicationReceipt)`. Round 4 recorded that the terminal-event and repository-access contradictions from the original A-105 are corrected and these two calls are not. **Fixing prose alone does not satisfy this item**: the diagrams are implementation-significant, and round 4 said so explicitly. The Sequence 8 event-order half of this finding is shared with item 2.

### Item 5 — A-301, Low: broken evidence anchor

`docs/architecture/runtime/COMPONENT-BOUNDARIES.md:224` targets `#responsibility-assignment-added-under-task-024`, while the heading at `:54` now generates `#responsibility-assignment-added-under-task-024-and-amended-under-task-028`. One fragment of 64 checked; 645 relative links were otherwise clean.

### Preservation obligations

- Every ADR whose decision changes must carry an explicit supersession record, and no existing decision body may be silently rewritten. Round 4 verified that ADR-0011 … ADR-0022 were preserved by TASK-028 — five byte-identical, seven differing only in forward supersession metadata — and the same standard applies here.
- New ADRs are numbered from **ADR-0032**; the target tree contains 31 numbered ADRs.
- The eight-module map, its two independent contract roots, and its acyclicity must be preserved. Round 4 verified 8 modules, 8 owners, 8 paths, 10 dependency nodes, 17 edges, no cycle, no cross-root edge.
- The six `HUMAN-002` Part B properties were all recorded **satisfied** at round 4. **Do not weaken any of them**, and do not treat their satisfaction as curing A-202 — round 4 stated in terms that it does not.
- The structural prohibitions on pushing `main`, setting `ALLOW_MAIN_PUSH`, bypassing hooks, writing a governance path, and force-releasing a lock must not be weakened.
- Turkish is reserved for user-visible command-line copy; all engineering material is English.

### Explicitly out of scope

- Authoring, approving, or recording any gate verdict, including this task's own.
- Any change under `tasks/`, `config/`, `scripts/`, `.github/`, or `.githooks/`.
- Implementing any runtime module. This task amends contracts; TASK-003 … TASK-008, TASK-017, and TASK-026 implement them once an approved source exists.
- Resolving pull request 15 or any merge conflict on the TASK-028 branch.
- Creating a separate remediation for A-004, A-101, A-102, or A-104. They are inherited views and close with the findings named above.

## Acceptance criteria

- [ ] Each of A-202, A-203, A-206, A-105, and A-301 is addressed, and the handoff states for each what changed, in which file, and at which lines.
- [ ] The exact source or projection contract loads every committed task record in the target tree, including the TASK-013 activation block and all 24 enriched gate-relation documents, or an explicit owned projection contract states the transform and its acceptance language, fixture, and contract agree.
- [ ] A conforming recovery transition can identify the one committed result effect it may adopt, its uniqueness guard is stated normatively, and every uninterrupted and recovery sequence — including Sequence 8 — uses the same legal event order.
- [ ] `SpawnOwnedResult` can express the `RegistrationNotDurable` refusal its own prose promises, and receipts remain nominal, discriminated, store-verifiable, and unsynthesizable.
- [ ] Every sequence diagram call agrees with the normative interface it depicts, and the two `completeFinalize` calls use the continuation-plus-receipt form.
- [ ] Every relative link and heading fragment resolves; the count checked and the count failed are both reported.
- [ ] Every changed ADR decision names what it supersedes; each new ADR records context, decision, rejected alternatives, and consequences; no duplicate ADR number and no contradictory ADR pair exists.
- [ ] The eight-module map, its owners, its source paths, its acyclicity, and its two independent contract roots are preserved, and the counts are reported.
- [ ] The six `HUMAN-002` Part B properties remain satisfied and none is weakened.
- [ ] No file outside this task's declared `write_scope` is modified.
- [ ] `scripts/orchestration/validate-assignment.ps1 -Role architect -Llm gpt` reports a valid result.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved scope_validation_base>` reports a valid result, and both the resolved branch point and the output are recorded in the handoff. If the resolved branch point disagrees with what this record anticipated, report the actual provenance rather than substituting a base that passes.
- [ ] The handoff states the authored delta, the cumulative architecture diff against `fe0374c`, and any ancestry difference as three separate sets, with counts.
- [ ] The handoff states plainly that this is an architect-authored amendment and **not** a passing review judgment, and claims no finding resolved — every disposition is TASK-033's to record.
- [ ] The publication outcome is recorded: `publication: published` with the remote ref and pull request when the remote step succeeds, or `publication: local-only` with the reason when it does not.

## Expected artifacts

- `docs/architecture/ARCHITECTURE.md`, amended. This is the declared **entry-point artifact**, and it is the `source_path` the Orchestrator uses to compute this publication's `content_hash`.
- The amended documents under `docs/architecture/runtime/`.
- New and amended records under `docs/adr/`, numbered from ADR-0032.
- The amended diagrams under `diagrams/architecture/`.

## Write-scope isolation

This task's scope is identical to TASK-002's, TASK-016's, TASK-024's, and TASK-028's, because an amendment necessarily edits the documents the previous amendment authored. That overlap is real and is serialized by the `architecture-docs` resource lock rather than by sequencing. The lock's registered holder set grows from four to five; the number of distinct overlapping scopes stays one. No path this task may write is inside any reviewer, security, QA, performance, runtime, devops, or orchestrator task's scope.

## Gate and remediation path

This task declares `required_gates: [review]` and `pre_merge_gates: [review]`, so it is **not integrable until its review gate closes**. The gate is recorded as `gate_tasks` here and as `gate_for` on TASK-033, with matching gate name, round, class, ordering, lineage, and lineage round. Those values are normative in the two frontmatter blocks and in the registers in `tasks/TASK-001-DEPENDENCY-GRAPH.md`; this body does not restate them.

TASK-033 records **one** verdict, applied atomically to five relations. It must run in an execution context separate from this one and from every earlier `LIN-ARCH-REVIEW` execution. The architect may not close this gate. Publishing this amendment is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Both this task and TASK-033 are assigned to `gpt`**, because `HUMAN-003` set `assignments.architect.llm` to `gpt` and the reviewer role is `gpt`. The repository's cross-family reviewer preference therefore does not apply to this lineage. The mandatory guarantee that remains is **execution-context separation**, which is unconditional. No script enforces it; it is recorded here, on TASK-033, and in the graph as a standing risk.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-032 -Role architect -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-032 -Role architect -Llm gpt` before editing.
3. Read `reports/code-review/TASK-028-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-3.md` in full, then the three earlier round baselines, before changing anything.
4. Before handoff, resolve the immutable branch point with `git merge-base HEAD agent/claude/orchestrator/task-013` and run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <that value>`. Do not pass `fe0374c`, `c2ee3eb`, `8d0c570`, `c325275`, or `origin/main`.
5. Commit, publish the task branch and open or update a pull request when a remote and credentials are available — otherwise record `publication: local-only` with the reason — and run `scripts/orchestration/release-task.ps1 -TaskId TASK-032 -Role architect -Llm gpt`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the architect role's configured write scope. Record the handoff in the commit message, the pull request description, and the amended documents; the Orchestrator performs the transition under TASK-013.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013.

## Handoff

Maintained by the Orchestrator under TASK-013 from the architect's commit, pull request, and published documents.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: reviewer / gpt via TASK-033, which records one verdict applied atomically to five `LIN-ARCH-REVIEW` round-5 relations and decides whether TASK-003 through TASK-008, TASK-017, TASK-018, and TASK-026 may leave `blocked`
