---
task_id: TASK-038
title: Seventh architecture amendment for the round-7 integration-order blocker — one coherent integration unit for the architecture lineage
status: ready
owner_role: architect
llm: gpt
branch: agent/gpt/architect/task-038
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-architect-task-038
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/runtime/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies:
  - task: TASK-037
    edge: gate_recorded
required_gates:
  - review
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-039
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 8
parent_task: TASK-001
publication_class: bootstrap
normative_architecture_source: 9576fc9 as amended by 8d0c570, by c2ee3eb, by fe0374c, by 468b37b, by 6d145eb, and by 970b081; this task produces the next amendment in the same lineage. None of those seven is approved — LIN-ARCH-REVIEW recorded changes-required at rounds 1 through 7, the round-7 verdict at 9bb75d9 — so each is a superseded authoring baseline to amend and never an approved source to build on. No approved architecture source exists yet: one comes into being only when LIN-ARCH-REVIEW records a passing or formally accepted authoritative verdict at lineage_round 8 or later, which TASK-039 owns.
remediates:
  - finding: A-601
    severity: high
    source: reports/code-review/TASK-036-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-6.md
    disposition_at_round_7: new at round 7
    summary: The normative integration order integrates the cumulative TASK-036 target first and then requires its non-ancestral rejected predecessor TASK-034, reproducing 19 conflicting files at the immediately following step.
findings_resolved_at_round_7_not_in_scope:
  - A-501
  - A-502
  - A-503
  - A-504
  - A-505
inherited_obligations_satisfied_at_round_7: Every required inherited and regression obligation was recorded satisfied, and every declared TASK-036 acceptance criterion was recorded met. Do not reopen any of them.
orchestrator_owned_finding_not_in_scope:
  - finding: A-506
    owner: orchestrator
    note: A-506 concerns task-decomposition prose under tasks/**, which is Orchestrator-owned and adjudicated by the independent LIN-DECOMP-REVIEW lineage. Round 7 states in terms that it is not adjudicated or changed there, and it is not this task's work either. Do not attempt to address it and do not propose any change under tasks/.
supersedes: TASK-036
dependencies_satisfied:
  - edge: gate_recorded
    task: TASK-037
    satisfied_at: 9bb75d9705533e52e150cafb6fa87a382496c90c
    satisfied_branch: agent/gpt/reviewer/task-037
    satisfied_remote_ref: none — the reviewer's publication is local-only and no remote ref for that branch exists in this clone
    verdict_recorded: changes-required
    recorded_by: TASK-013 activation ACT-014, consuming ingress entry seq 22
    satisfying_rule: gate_recorded is satisfied by any recorded verdict, whatever that verdict is.
resource_lock_state_at_creation: free. The TASK-036 execution's lock was released after its commit, confirmed by a direct read of the shared lock directory at ACT-014, and TASK-037 declared no lock. TASK-002, TASK-016, TASK-024, TASK-028, TASK-032, TASK-034, and TASK-036 are the other registered holders and none is active. This task becomes the eighth registered holder.
review_target_branch: agent/gpt/architect/task-038
review_target_commit: not yet published
review_target_base: 970b08125eaf6e5bfb7b24ec2a55238161b16eac
review_target_applicability: applicable and resolved for the base; the target commit is a value the Orchestrator pins at the activation that consumes this task's publication
review_target_note: TASK-039 reviews this task's immutable published commit against review-diff base 970b081, the TASK-036 amendment this one revises, reading 6d145eb, 468b37b, fe0374c, c2ee3eb, 8d0c570, and 9576fc9 where a judgment needs an earlier baseline. The target commit does not exist yet and is deliberately not guessed. The Orchestrator binds it from the branch as published. If this branch carries more than one commit, the bound target is the one this task's own handoff names as published, and its declared entry-point artifact must be complete at that commit — ACT-013 bound a three-commit publication's head for exactly that reason.
branch_point_of: agent/claude/orchestrator/task-013
scope_validation_base: git merge-base HEAD agent/claude/orchestrator/task-013
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Create agent/gpt/architect/task-038 from the head of agent/claude/orchestrator/task-013 at worktree-creation time, then resolve the immutable branch point inside the worktree with git merge-base HEAD agent/claude/orchestrator/task-013 and pass that value to -BaseRef. Never pass a review-diff base, 970b081, 6d145eb, 468b37b, fe0374c, c2ee3eb, 8d0c570, c325275, or origin/main. Findings F-403 and A-209 each recorded why. Record the resolved 40-hex value in the handoff, and report the actual provenance if it disagrees with what this record anticipates rather than substituting a base that passes.
architecture_baseline_arrives_by_content_import: true
architecture_baseline_import_note: Stated as a measured fact, which is the discipline MC-010 enforces. At the time this record was written 970b081 is NOT an ancestor of agent/claude/orchestrator/task-013 and cannot be made one - it sits on agent/gpt/architect/task-036, its review gate carries a changes-required verdict, and merging a rejected unreviewed amendment into the Orchestrator branch is prohibited by that gate being in TASK-036's pre_merge_gates. No branch point exists that both contains 970b081 and carries the current task records. Import the 970b081 architecture content by tree and blob copy, committed separately from the amendment as TASK-034 and TASK-036 both did. Note the sharp irony this round has surfaced - the import mechanism this graph adopted to work around unmergeable predecessors is precisely what A-601 says the integration strategy has not accounted for. Importing content for authoring is not the same as prescribing a merge order for integration, and this task must fix the second without abandoning the first.
fixture_source_rule: Derive every count, cardinality, and graph proof over tasks/** by enumeration over THIS task's own published target tree at publication time. Inherit no count from any review report, from any earlier amendment, or from this record. This record deliberately states no count anywhere, and that omission is the instruction rather than a gap - see MC-011. TASK-034 and TASK-036 both followed this rule and round 6 and round 7 recorded the resulting findings resolved; preserve that approach rather than reverting to literals.
---

# TASK-038: Seventh architecture amendment for the round-7 integration-order blocker

## Objective

Amend the runtime architecture so that finding **A-601** is remediated: define **one coherent integration unit** for this architecture lineage, so that following the normative integration order end to end does not replay a non-ancestral rejected predecessor and does not conflict.

This task authors an amendment. **It does not approve one.** Round 8, owned by TASK-039, decides whether it is approved, and only that verdict releases TASK-003 through TASK-008, TASK-017, TASK-018, and TASK-026 from `blocked`.

## Why this task exists, and what is different about it

TASK-037 recorded one durable verdict, `changes-required` at `9bb75d9`, applied atomically to seven relations. A recorded verdict is superseded rather than rewritten, and each superseding round is carried by a **new** task.

**Round 7 is the strongest result this lineage has produced and it still blocked.** A-501 through A-505 are all `resolved`; every inherited and regression obligation is satisfied; **every declared TASK-036 acceptance criterion is met**. The reviewer states in terms that meeting the author's declared criteria "does not eliminate a reviewer's duty to find fresh defects".

**The remaining defect is not in the architecture's content — it is in the procedure the architecture prescribes for landing itself.** That distinction matters for how you approach this task: the contracts, the module map, the state machine, the recovery model, and the collector boundary are all now judged sound. `INTEGRATION-STRATEGY.md` is not.

## Scope — one item

### A-601, High: the normative integration order replays a non-ancestral rejected predecessor and conflicts

`docs/architecture/runtime/INTEGRATION-STRATEGY.md:121-127` and `:143`.

The order integrates the cumulative TASK-036 target first, then requires TASK-034, TASK-032, TASK-028, TASK-024, TASK-016, and TASK-002 in reverse amendment order, with a squash merge for each task. A read-only `git merge-tree --write-tree 970b08125eaf6e5bfb7b24ec2a55238161b16eac 6d145eb81033986361aba6454d10f52e5773f950` exits 1 and reports **19 conflicts**: all three sequence diagrams; ADR-0013, ADR-0019, ADR-0031, ADR-0035, and ADR-0036; `docs/architecture/README.md`; `docs/architecture/ARCHITECTURE.md`; and nine runtime documents.

The target alone merges cleanly into every integration base the reviewer tested. **The failure is at step 2 of the prescribed sequence**, and the reviewer notes the second, subtler cost: replaying a rejected non-ancestral predecessor *after* the cumulative target risks regressing the very repairs round 7 verified.

**Deliver one of the two outcomes the reviewer named, not a partial mixture:**

- **Integrate only the latest passing cumulative target**, and specify a lifecycle and gate mechanism that closes the superseded predecessor tasks **without replaying their blobs**; or
- **Define an ancestry-preserving or no-content predecessor order** that precedes the latest target rather than following it.

Either way you must **reconcile the meaning of `integrated` and the per-task squash rule with the choice you make**. Those two clauses are what make the current order self-contradictory, and leaving either as written reproduces the finding.

**Add a read-only `merge-tree` fixture that executes the complete prescribed order** — not merely each target against a base — and proves the order stays conflict-free and yields the final target tree. Round 7's evidence is that per-target checks pass while the sequence fails; a fixture that only repeats the per-target check would not have caught this and will not catch its recurrence.

### A note on scope discipline

This is a **single-finding amendment**. Do not use it as an opportunity to revisit contracts round 7 judged sound. A change outside `INTEGRATION-STRATEGY.md` is justified only where the integration-unit decision genuinely requires it — for example if the meaning of `integrated` is stated elsewhere — and the handoff must say why for each such file.

### Preservation obligations

- **A-501 … A-505 are `resolved`, every inherited obligation is satisfied, and every TASK-036 acceptance criterion is met. Do not regress any of them.** A previously resolved finding this amendment reopens is a new finding against this task. This is the largest preserved set any amendment in this lineage has carried.
- **Keep the target-tree fixture derivation** that closed A-202 and A-402; do not revert to literal counts.
- **Keep A-503's repair**: TASK-026 alone appends, TASK-005 alone signals, observes, and reads the activation range, and both success dispositions stay constructible.
- Every ADR whose decision changes carries an explicit supersession record; no existing decision body is silently rewritten.
- New ADRs are numbered from the target tree's highest existing ADR plus one. Confirm that against your own target tree rather than trusting any sentence in this record.
- The eight-module map, its two independent contract roots, and its acyclicity must be preserved.
- All six `HUMAN-002` Part B properties must stay satisfied.
- The structural prohibitions on pushing `main`, setting `ALLOW_MAIN_PUSH`, bypassing hooks, writing a governance path, and force-releasing a lock must not be weakened.
- Turkish is reserved for user-visible command-line copy; all engineering material is English.

### Explicitly out of scope

- Authoring, approving, or recording any gate verdict, including this task's own.
- Any change under `tasks/`, `config/`, `scripts/`, `.github/`, or `.githooks/`.
- **A-506**, which is Orchestrator-owned and belongs to `LIN-DECOMP-REVIEW`.
- Reopening any finding resolved at round 7.
- Implementing any runtime module; resolving pull request 15; performing any merge yourself. **This task defines an integration order; it does not execute one.**

## Acceptance criteria

- [ ] A-601 is addressed, and the handoff states what changed, in which file, and at which lines.
- [ ] The architecture defines **one coherent integration unit**, stating explicitly which of the two named outcomes it adopts and why the other was rejected.
- [ ] The meaning of `integrated` and the per-task squash rule are reconciled with that choice, with any superseded clause named.
- [ ] Following the complete prescribed order end to end produces **no conflict**, demonstrated by a read-only `merge-tree` fixture that executes the whole sequence rather than each target independently.
- [ ] The fixture proves the final tree after the full order equals the intended target tree.
- [ ] No superseded predecessor's blobs are replayed after the cumulative target, or — if a predecessor order is defined instead — it precedes the target and preserves ancestry or carries no content.
- [ ] A-501 … A-505 remain resolved, every inherited obligation remains satisfied, and the handoff states that none was reopened.
- [ ] All six `HUMAN-002` Part B properties remain satisfied.
- [ ] Every count and graph proof over `tasks/**` is derived by enumeration over this task's own target tree; no value is inherited.
- [ ] Every relative link and heading fragment resolves; the count checked and the count failed are both reported.
- [ ] ADR supersession, completeness, numbering, and non-contradiction hold.
- [ ] The eight-module map, its owners, source paths, acyclicity, and two independent contract roots are preserved, with counts reported.
- [ ] The import of the `970b081` architecture content is committed separately, verified, and reported as its own set with zero deletions and zero unexpected divergence.
- [ ] Any file changed outside `INTEGRATION-STRATEGY.md` is justified individually in the handoff.
- [ ] No file outside this task's declared `write_scope` is modified.
- [ ] `validate-assignment.ps1 -Role architect -Llm gpt` reports a valid result.
- [ ] `validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved scope_validation_base>` reports a valid result, and both the resolved branch point and the output are recorded.
- [ ] The handoff states the authored delta, the cumulative architecture diff against `970b081`, and the import set as three separate sets, with counts.
- [ ] The handoff states plainly that this is an architect-authored amendment and **not** a passing review judgment, and claims no finding resolved.
- [ ] The publication outcome is recorded.

## Expected artifacts

- `docs/architecture/ARCHITECTURE.md`, amended. This is the declared **entry-point artifact** and the `source_path` for this publication's `content_hash`; it must be complete at the published commit.
- `docs/architecture/runtime/INTEGRATION-STRATEGY.md`, amended — the primary subject of this round.
- Any other runtime document, ADR, or diagram the integration-unit decision genuinely requires, each justified in the handoff.

## Write-scope isolation

Identical to the seven earlier architecture scopes, serialized by the `architecture-docs` resource lock rather than by sequencing. The registered holder set grows from seven to eight; the number of distinct overlapping scopes stays one.

## Gate and remediation path

`required_gates: [review]` and `pre_merge_gates: [review]`, so this task is **not integrable until its review gate closes**. TASK-039 records **one** verdict applied atomically to eight relations, in an execution context separate from this one and from every earlier `LIN-ARCH-REVIEW` execution. The architect may not close this gate. Publishing this amendment is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Both this task and TASK-039 are assigned to `gpt`**, the fifth consecutive round. The mandatory guarantee is **execution-context separation**, which is unconditional and which no script enforces.

## Operational steps

1. `scripts/orchestration/create-worktree.ps1 -TaskId TASK-038 -Role architect -Llm gpt` from the primary checkout.
2. `scripts/orchestration/claim-task.ps1 -TaskId TASK-038 -Role architect -Llm gpt` inside the returned worktree before editing.
3. Read `reports/code-review/TASK-036-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-6.md` in full — especially A-601 and its reproduction command — then the six earlier round baselines, then `MC-006`, `MC-010`, and `MC-011`.
4. Import the `970b081` architecture content as its own commit, verify it, then amend in a second commit.
5. Resolve the branch point with `git merge-base HEAD agent/claude/orchestrator/task-013` and run the write-scope validator against it.
6. Commit, record `publication: local-only` with the reason if no remote step is authorized, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-038 -Role architect -Llm gpt`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the architect role's configured write scope.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. It was created `ready` at activation `ACT-014`, on the satisfied `gate_recorded(TASK-037)` edge at `9bb75d9`.

## Handoff

Maintained by the Orchestrator under TASK-013 from the architect's commits and published documents.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: reviewer / gpt via TASK-039, which records one verdict applied atomically to eight `LIN-ARCH-REVIEW` round-8 relations and decides whether TASK-003 through TASK-008, TASK-017, TASK-018, and TASK-026 may leave `blocked`
