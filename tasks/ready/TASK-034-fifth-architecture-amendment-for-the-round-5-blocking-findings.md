---
task_id: TASK-034
title: Fifth architecture amendment for the round-5 blocking findings — current-tree projection fixtures, the reconciliation builder boundary, the withdrawn worker call, and the round-current integration and graph proof
status: ready
owner_role: architect
llm: gpt
branch: agent/gpt/architect/task-034
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-architect-task-034
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/runtime/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies:
  - task: TASK-033
    edge: gate_recorded
required_gates:
  - review
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-035
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 6
parent_task: TASK-001
publication_class: bootstrap
normative_architecture_source: 9576fc9 as amended by 8d0c570, by c2ee3eb, by fe0374c, and by 468b37b; this task produces the next amendment in the same lineage. None of 9576fc9, 8d0c570, c2ee3eb, fe0374c, and 468b37b is approved — LIN-ARCH-REVIEW recorded changes-required at rounds 1, 2, 3, 4, and 5, the round-5 verdict at 3660cc2 — so each is a superseded authoring baseline to amend and never an approved source to build on. No approved architecture source exists yet: one comes into being only when LIN-ARCH-REVIEW records a passing or formally accepted authoritative verdict at lineage_round 6 or later, which TASK-035 owns.
remediates:
  - finding: A-202
    severity: high
    source: reports/code-review/TASK-032-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-4.md
    disposition_at_round_5: partially resolved
    residual_half: the declared fixture counts disagree with the target tree; the schema half is recorded repaired
  - finding: A-105
    severity: medium
    source: reports/code-review/TASK-032-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-4.md
    disposition_at_round_5: partially resolved
    residual_half: Sequence 3 still calls the withdrawn AgentWorker.execute; both completeFinalize calls are recorded correct
  - finding: A-401
    severity: high
    source: reports/code-review/TASK-032-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-4.md
    disposition_at_round_5: new at round 5
  - finding: A-402
    severity: high
    source: reports/code-review/TASK-032-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-4.md
    disposition_at_round_5: new at round 5
inherited_residue_covered_here:
  - finding: A-004
    residue_of: the current-graph proof
    covered_by: A-402
  - finding: A-101
    residue_of: the normative integration strategy cohort and floor
    covered_by: A-402
  - finding: A-104
    residue_of: the adoptable-result construction boundary
    covered_by: A-401
inherited_views_closed_at_round_5:
  - finding: A-102
    closed_with: A-206
    note: TASK-033 judged it individually and found no independent residue. It is not a scope item here.
inherited_residue_note: Round 5 tested the inherited-view framing rather than inheriting it and found it holds only for A-102. A-004, A-101, and A-104 each have independently actionable residue, which TASK-033 assigned to A-402 and A-401 rather than to a duplicate remediation of A-202 or A-203. They are therefore covered here through A-401 and A-402 and carry no separate scope item. Creating a separate remediation for them would be a scope error. TASK-035 judges each individually again and does not inherit this framing either.
findings_closed_at_round_5_not_in_scope:
  - A-203
  - A-206
  - A-301
supersedes: TASK-032
dependencies_satisfied:
  - edge: gate_recorded
    task: TASK-033
    satisfied_at: 3660cc2bf0bbe5bfcf4c76ad2c3401d4c4bfa0da
    satisfied_branch: agent/gpt/reviewer/task-033
    satisfied_remote_ref: none — the reviewer's publication is local-only and no remote ref for that branch exists in this clone
    verdict_recorded: changes-required
    recorded_by: TASK-013 activation ACT-010, consuming ingress entry seq 18
    satisfying_rule: gate_recorded is satisfied by any recorded verdict, whatever that verdict is. That is precisely why a remediation task uses it and never the lineage form.
resource_lock_state_at_creation: free. The TASK-032 execution released architecture-docs, recording its lock as released in its own handoff, and TASK-033 declared no lock. TASK-002, TASK-016, TASK-024, TASK-028, and TASK-032 are the other registered holders and none is active. This task becomes the sixth registered holder.
review_target_branch: agent/gpt/architect/task-034
review_target_commit: not yet published
review_target_base: 468b37b2649d031074eba64aca47f4561a0c41a3
review_target_applicability: applicable and resolved for the base; the target commit is a value the Orchestrator pins at the activation that consumes this task's publication
review_target_note: TASK-035 reviews this task's immutable published commit against review-diff base 468b37b, the TASK-032 amendment this one revises, reading fe0374c, c2ee3eb, 8d0c570, and 9576fc9 where a judgment needs an earlier baseline. The target commit does not exist yet and is deliberately not guessed. The Orchestrator binds review_target_commit from the branch as published, exactly as ACT-009 bound 468b37b and ACT-007 bound fe0374c. If this branch carries more than one commit, the Orchestrator binds the one this task's own handoff names as published, and the entry-point artifact must be complete at that commit — ACT-009 recorded why binding a parent whose declared entry-point artifact still held a placeholder would have been wrong.
branch_point_of: agent/claude/orchestrator/task-013
scope_validation_base: git merge-base HEAD agent/claude/orchestrator/task-013
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Create agent/gpt/architect/task-034 from the head of agent/claude/orchestrator/task-013 at worktree-creation time, then resolve the immutable branch point inside the worktree with git merge-base HEAD agent/claude/orchestrator/task-013 and pass that value to -BaseRef. Never pass a review-diff base, 468b37b, fe0374c, c2ee3eb, 8d0c570, c325275, or origin/main. Findings F-403 and A-209 each recorded why. Record the resolved 40-hex value in the handoff so the Orchestrator can pin it, and report the actual provenance if it disagrees with what this record anticipates rather than substituting a base that passes.
architecture_baseline_arrives_by_content_import: true
architecture_baseline_import_note: This is stated as a measured fact and not as an expectation, because ACT-008 asserted an ancestry relation it had not read and MC-010 records the cost. At the time this record was written, 468b37b is NOT an ancestor of agent/claude/orchestrator/task-013 and cannot be made one by any action available to this graph - it sits on agent/gpt/architect/task-032, its review gate carries a changes-required verdict, and merging a rejected unreviewed amendment into the Orchestrator branch to create the ancestry is prohibited by that gate being in TASK-032's pre_merge_gates. There is therefore no branch point that both contains 468b37b and carries the current task records, and this record does not pretend otherwise. Import the 468b37b architecture content into this branch by tree and blob copy, exactly as TASK-032 did from fe0374c. Round 5 verified that mechanism end to end and found it faithful, with zero deletions and zero unexpected divergent paths, so it is a known-workable path rather than an improvisation. Verify the import yourself before amending, report it as its own set, and expect TASK-035 to re-verify it.
fixture_source_rule: Derive every count, every cardinality, and every graph proof over tasks/** by enumeration over THIS task's own published target tree, at publication time. Inherit no count from any review report, from any earlier amendment, from TASK-032, or from this record. This record deliberately states no count anywhere, and that omission is the instruction rather than a gap - see MC-011. The reason is recorded rather than assumed - TASK-029 and TASK-033 each told the previous architect to recount, and the previous amendment inherited the numbers anyway, which is exactly how A-202's fixture half survived into round 5.
---

# TASK-034: Fifth architecture amendment for the round-5 blocking findings

## Objective

Amend the runtime architecture so that the four findings `LIN-ARCH-REVIEW` round 5 left open — **A-202** (residual fixture half), **A-105** (residual sequence half), and the fresh **A-401** and **A-402** — are remediated in the normative contracts, the integration strategy, the graph proof, the ADRs, and the diagrams, and so that the A-004, A-101, and A-104 residue closes with them.

This task authors an amendment. **It does not approve one.** `LIN-ARCH-REVIEW` round 6, owned by TASK-035, decides whether this amendment is approved, and only that verdict releases TASK-003 through TASK-008, TASK-017, TASK-018, and TASK-026 from `blocked`.

## Why this task exists rather than a second round of TASK-032

TASK-033 recorded one durable verdict, `changes-required` at commit `3660cc2`, applied atomically to five relations, and TASK-032's record stays in `review` with its `review` gate open. Under the gate-round rule a recorded verdict is durable and is superseded rather than rewritten, and each superseding round is carried by a **new** task.

This is the **fifth** amendment in this lineage. Rounds 1 through 5 rejected `9576fc9`, `8d0c570`, `c2ee3eb`, `fe0374c`, and `468b37b`. Nine downstream tasks have now waited five full amendment cycles. That is recorded rather than absorbed.

**What round 5 changed, and why it is not merely another failure.** Three of the five carried findings closed — A-203, A-206, and A-301 are `resolved` — and one inherited view, A-102, closed with no residue. The open set is smaller and its character has changed: A-202's *schema* half is repaired and only its *fixture* half survives. **Three of the four items below are consistency defects between the architecture and a graph it does not own, not contract-design defects.** A-401 is the exception and is a genuine contract-completeness defect.

## Immutable-target rules

These bind this task and are the same rules TASK-024, TASK-028, and TASK-032 ran under.

1. **The reviewed target is one immutable commit** on `agent/gpt/architect/task-034`. Once the Orchestrator pins it, it is immutable.
2. **Do not guess the target hash.** This record carries `review_target_commit: not yet published`.
3. **The review-diff base is `468b37b` and is fixed now.** It is **not** a scope-validation base and must never be passed to `validate-write-scope.ps1`.
4. **The scope-validation base is this branch's own immutable branch point**, resolved inside this task's worktree and reported in the handoff.
5. **State the authored delta, the cumulative architecture diff, and the import set as three separate sets**, with counts.
6. **Nothing under `tasks/`, `config/`, `scripts/`, `.github/`, or `.githooks/` may be written by this task.**

## The baseline arrives by import, and this record says so plainly

`468b37b` is **not** an ancestor of this task's branch point, and no commit exists that both contains it and carries the current task records. The frontmatter field `architecture_baseline_import_note` states the measured facts and the reason. Import the architecture content from `468b37b`, verify the import yourself, and report it as its own set.

**This is the second consecutive round to work this way, and the first to be told so honestly in advance.** Round 5's equivalent instruction contained a false ancestry claim, recorded as `MC-010`; the architect worked around it correctly and disclosed the workaround, and the reviewer then verified the import was faithful. Nothing here is hidden and nothing is assumed.

## Scope

Four items, one per open finding.

### Item 1 — A-202 residual, High: the declared fixture disagrees with the target tree

`docs/adr/0032-*.md:33`, `docs/architecture/runtime/INTERFACE-CONTRACTS.md:997-1002`, `docs/architecture/runtime/LEASES-AND-SCHEDULING.md:278`, and `docs/architecture/ARCHITECTURE.md:263-264`.

Round 5 recorded the schema half **repaired**: the generic recursive source, exact raw and body retention, the leaf audit, the explicit transform and inverse, and the split owners together fix the closed-schema and data-loss defect that has held this finding open since round 1. That work stands and must not be undone.

What survives is narrower and purely factual: the amendment asserts record, relation-document, and enriched-document counts that its own tree contradicts. Round 5 enumerated the target independently and found different values in all three.

**Do not copy round 5's numbers either.** They describe `468b37b`'s tree, not yours: this task's target tree contains the `ACT-010` records, including this record and TASK-035's. Enumerate your own target tree at publication time and report both the values and the enumeration method. See `fixture_source_rule` and `MC-011`.

Prefer a fixture that is **derived and stated as a rule** over one that hard-codes integers, where the contract permits it. A count embedded in a normative document goes stale the moment the Orchestrator performs any activation, through no fault of this role; a rule that says how to derive the count does not. If you judge that the contract genuinely requires literal values, say so and state the tree they are derived from, so the next round can check them against that tree rather than against a moving one.

### Item 2 — A-401, High: the reconciliation builder cannot construct its declared result

`docs/architecture/runtime/INTERFACE-CONTRACTS.md:206-240`, `:247-297`, `:1858-1865`, `:1884-1917`.

`ReconciliationInputBuilder.build(task, currentAttemptEntries, deadline)` promises a complete `ReconciliationEvidenceResult` whose `input` has six fields. Two are not derivable from its parameters: `adoptableResultPresent` is a property of `RunRecord.pendingResults`, supplied through `RecoveryContext.pendingResults`, and `leaseState` requires the current `RunRecord.writerEpoch`. Neither is an input. ADR-0030 explicitly rejected hidden reads from the whole run, so a conforming implementation must read undeclared state or fabricate values.

Deliver one of the two outcomes round 5 named: pass typed current-epoch and attempt-matching adoptable-result evidence into `build`, **or** narrow this builder to result-ledger evidence and define a second explicit, typed composition boundary that assembles all six fields without hidden state. Update the recovery fixtures so every decision-domain point is constructed through that public boundary.

Closing this item is what closes the **A-104** residue.

### Item 3 — A-402, High: the integration strategy and graph proof are a round behind

`docs/architecture/runtime/INTEGRATION-STRATEGY.md:3-15`, `:65-78`, `:189-191`; `docs/architecture/runtime/INTERFACE-CONTRACTS.md:1456-1464`; `docs/architecture/runtime/LEASES-AND-SCHEDULING.md:201-210`, `:244-265`.

The normative integration strategy tells consumers a round-4 floor and a four-member cohort release them, when round 4 recorded `changes-required`. The stated current-graph proof is of a 31-task, 46-pair graph at revision 7 / TASK-028 and omits later tasks entirely, so it cannot be the proof for the target commit.

Amend the integration strategy, the `validateGraph` contract comment, the current-graph proof, and every associated current-target fixture so they describe the graph at **your** target tree. Name the round-4 clauses being superseded rather than silently replacing them.

**Two cautions specific to this item.** First, the floor and cohort move every failing round — they are at round 6 and six members as this record is written, and they will move again if round 6 fails. Prefer naming the rule and the lineage register as the source of truth over hard-coding a round number, for the same reason as item 1. Second, an independent projection at round 5 found the committed records themselves acyclic and schedulable, so **this is a currentness defect in the architecture, not a defect in the graph it describes**. Do not "fix" it by proposing changes to `tasks/**`, which is outside this role's write scope.

Closing this item is what closes the **A-004** and **A-101** residue.

### Item 4 — A-105 residual, Medium: a sequence calls a withdrawn worker boundary

`diagrams/architecture/runtime-sequences.md:162` versus `docs/architecture/runtime/INTERFACE-CONTRACTS.md:50` and `:1690-1712`.

Both `completeFinalize` calls are recorded correct and Sequence 8 now shows the legal result order; that work stands. Sequence 3 still calls `Worker B.execute(...)`, while the normative contract records that the opaque `AgentWorker.execute` was replaced and exposes only `planInvocation`, `beginInvocation`, and `completeInvocation`.

Redraw the retry and late-write sequence through the three-phase worker boundary, including the supervisor-owned registration append and the proof-bearing begin call — or state explicitly that it depicts a non-interface conceptual operation and stop naming `AgentWorker`. **A prose-only fix does not satisfy this**; round 4 and round 5 each recorded that the diagrams are implementation-significant.

### Preservation obligations

- **A-203, A-206, and A-301 are `resolved` and A-102 closed with no residue. Do not regress any of them.** A previously resolved finding that this amendment reopens is a new finding against this task.
- The six `HUMAN-002` Part B properties have been recorded satisfied at rounds 4 and 5. **Do not weaken any**, and do not treat their satisfaction as curing A-202, A-401, or A-402 — round 5 stated in terms that it does not.
- Every ADR whose decision changes carries an explicit supersession record; no existing decision body is silently rewritten. Round 5 verified this held for TASK-032.
- New ADRs are numbered from **ADR-0035**; the round-5 target contains 34 numbered ADRs, complete through ADR-0034. Confirm that against your own target tree rather than trusting this sentence.
- The eight-module map, its two independent contract roots, and its acyclicity must be preserved.
- The structural prohibitions on pushing `main`, setting `ALLOW_MAIN_PUSH`, bypassing hooks, writing a governance path, and force-releasing a lock must not be weakened.
- Turkish is reserved for user-visible command-line copy; all engineering material is English.

### Explicitly out of scope

- Authoring, approving, or recording any gate verdict, including this task's own.
- Any change under `tasks/`, `config/`, `scripts/`, `.github/`, or `.githooks/` — including any change proposed as a way to make a fixture agree with the architecture.
- Implementing any runtime module.
- Resolving pull request 15 or any merge conflict on the TASK-028 branch.
- Creating a separate remediation for A-004, A-101, or A-104. They are residue covered by A-402 and A-401.
- Re-opening A-203, A-206, A-301, or A-102.

## Acceptance criteria

- [ ] Each of A-202, A-105, A-401, and A-402 is addressed, and the handoff states for each what changed, in which file, and at which lines.
- [ ] Every count, cardinality, and graph proof over `tasks/**` is derived by enumeration over this task's own target tree, the enumeration method is stated, and no value is inherited from a report, an earlier amendment, or this record.
- [ ] The reconciliation decision input is constructible through a declared public boundary with no hidden state, and the recovery fixtures construct every decision-domain point through it.
- [ ] The normative integration strategy, the `validateGraph` contract comment, and the current-graph proof describe the graph at this task's target tree, and every superseded round-4 clause is named.
- [ ] No sequence diagram calls a withdrawn interface; Sequence 3 uses the three-phase worker boundary or stops naming `AgentWorker`.
- [ ] A-203, A-206, A-301, and A-102 remain closed, and the handoff states that none was reopened.
- [ ] The six `HUMAN-002` Part B properties remain satisfied and none is weakened.
- [ ] Every relative link and heading fragment resolves; the count checked and the count failed are both reported.
- [ ] Every changed ADR decision names what it supersedes; each new ADR records context, decision, rejected alternatives, and consequences; numbering continues from the target tree's highest existing ADR; no duplicate and no contradictory pair.
- [ ] The eight-module map, its owners, its source paths, its acyclicity, and its two independent contract roots are preserved, and the counts are reported.
- [ ] The import of the `468b37b` architecture content is verified by the author, reported as its own set, and shown to introduce no deletion and no unexpected divergence.
- [ ] No file outside this task's declared `write_scope` is modified.
- [ ] `scripts/orchestration/validate-assignment.ps1 -Role architect -Llm gpt` reports a valid result.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved scope_validation_base>` reports a valid result, and both the resolved branch point and the output are recorded in the handoff.
- [ ] The handoff states the authored delta, the cumulative architecture diff against `468b37b`, and the import set as three separate sets, with counts.
- [ ] The handoff states plainly that this is an architect-authored amendment and **not** a passing review judgment, and claims no finding resolved — every disposition is TASK-035's to record.
- [ ] The publication outcome is recorded: `publication: published` with the remote ref and pull request when the remote step succeeds, or `publication: local-only` with the reason when it does not.

## Expected artifacts

- `docs/architecture/ARCHITECTURE.md`, amended. This is the declared **entry-point artifact**, and it is the `source_path` the Orchestrator uses to compute this publication's `content_hash`. It must be complete at the published commit.
- The amended documents under `docs/architecture/runtime/`, including `INTEGRATION-STRATEGY.md`, `INTERFACE-CONTRACTS.md`, and `LEASES-AND-SCHEDULING.md`.
- New and amended records under `docs/adr/`, numbered from ADR-0035.
- The amended diagrams under `diagrams/architecture/`.

## Write-scope isolation

This task's scope is identical to TASK-002's, TASK-016's, TASK-024's, TASK-028's, and TASK-032's, because an amendment necessarily edits the documents the previous amendment authored. That overlap is real and is serialized by the `architecture-docs` resource lock rather than by sequencing. The lock's registered holder set grows from five to six; the number of distinct overlapping scopes stays one. No path this task may write is inside any reviewer, security, QA, performance, runtime, devops, or orchestrator task's scope.

## Gate and remediation path

This task declares `required_gates: [review]` and `pre_merge_gates: [review]`, so it is **not integrable until its review gate closes**. The gate is recorded as `gate_tasks` here and as `gate_for` on TASK-035, with matching gate name, round, class, ordering, lineage, and lineage round.

TASK-035 records **one** verdict, applied atomically to six relations. It must run in an execution context separate from this one and from every earlier `LIN-ARCH-REVIEW` execution, including TASK-033's. The architect may not close this gate. Publishing this amendment is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Both this task and TASK-035 are assigned to `gpt`**, because `HUMAN-003` set `assignments.architect.llm` to `gpt` and the reviewer role is `gpt`. The repository's cross-family reviewer preference therefore does not apply to this lineage. The mandatory guarantee that remains is **execution-context separation**, which is unconditional. No script enforces it; it is recorded here, on TASK-035, and in the graph as a standing risk.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-034 -Role architect -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-034 -Role architect -Llm gpt` before editing.
3. Read `reports/code-review/TASK-032-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-4.md` in full, then the four earlier round baselines, then `tasks/TASK-013-ACTIVATION-LOG.md` model corrections `MC-006`, `MC-010`, and `MC-011`, before changing anything.
4. Import the `468b37b` architecture content, verify it, then amend.
5. Before handoff, resolve the immutable branch point with `git merge-base HEAD agent/claude/orchestrator/task-013` and run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <that value>`. Do not pass `468b37b`, `fe0374c`, `c2ee3eb`, `8d0c570`, `c325275`, or `origin/main`.
6. Commit, publish the task branch and open or update a pull request when a remote and credentials are available — otherwise record `publication: local-only` with the reason — and run `scripts/orchestration/release-task.ps1 -TaskId TASK-034 -Role architect -Llm gpt`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the architect role's configured write scope. Record the handoff in the commit message, the pull request description, and the amended documents; the Orchestrator performs the transition under TASK-013.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. It was created `ready` at activation `ACT-010`, on the satisfied `gate_recorded(TASK-033)` edge at `3660cc2`.

## Handoff

Maintained by the Orchestrator under TASK-013 from the architect's commit, pull request, and published documents.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: reviewer / gpt via TASK-035, which records one verdict applied atomically to six `LIN-ARCH-REVIEW` round-6 relations and decides whether TASK-003 through TASK-008, TASK-017, TASK-018, and TASK-026 may leave `blocked`
