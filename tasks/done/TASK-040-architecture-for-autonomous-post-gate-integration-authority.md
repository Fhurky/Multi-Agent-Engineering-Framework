---
task_id: TASK-040
title: Architecture amendment for autonomous post-gate integration authority
status: done
owner_role: architect
llm: gpt
branch: agent/gpt/architect/task-040
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-architect-task-040
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/runtime/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies:
  - task: HUMAN-004
    edge: human_decision
    satisfied: true
    satisfied_at: 7dc07488a5b1cac8b1327ebd63bf747adbe03c68
    satisfied_by: ACT-019 consuming ingress entry seq 27, class human_decision_recorded
required_gates:
  - review
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-041
    gate: review
    round: 1
    verdict: changes-required
    verdict_recorded_at: ec533fb5bb0055675fb81f72057d5636f7867db3
    remediated_by: TASK-042
    revalidated_by: TASK-044
    gate_class: point
    retrospective: false
    gate_lineage: LIN-INTEGRATION-AUTHORITY-REVIEW
    lineage_round: 1
  - task: TASK-044
    gate: review
    round: 2
    verdict: changes-required
    verdict_recorded_at: 6f7f0edb63615d7f143dd6c59750a5ea7db701fc
    remediated_by: TASK-046
    revalidated_by: TASK-047
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-INTEGRATION-AUTHORITY-REVIEW
    lineage_round: 2
  - task: TASK-047
    gate: review
    round: 3
    verdict: approved
    verdict_recorded_at: 78359ae2e3dc6e97fb3d60f0b847b84abed08fa6
    relation_status: closed
    gate_class: point
    retrospective: false
    gate_lineage: LIN-INTEGRATION-AUTHORITY-REVIEW
    lineage_round: 3
gate_status: >-
  CLOSED. The review gate's status is the verdict recorded at its highest round, which is round 3
  and records approved at 78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 on agent/gpt/reviewer/task-047,
  artifact reports/code-review/TASK-046-INTEGRATION-AUTHORITY-REVIEW-ROUND-3.md, published as pull
  request 29. Under gate-round rule 3 a gate is closed when its highest round records approved.
  ROUNDS 1 AND 2 KEEP THEIR DURABLE changes-required VERDICTS at
  ec533fb5bb0055675fb81f72057d5636f7867db3 and 6f7f0edb63615d7f143dd6c59750a5ea7db701fc - both are
  superseded, never rewritten, and all three rows stay recorded, which is gate-round rule 4. THIS
  IS THE LONGEST REMEDIATION CHAIN IN THIS LINEAGE AND THE ONLY RELATION HERE TO TAKE THREE ROUNDS.
  The round-3 verdict was authored by TASK-047 and applied ATOMICALLY to this relation and to
  (TASK-046, review, round 1) and (TASK-042, review, round 2); all three closed together and a
  split outcome is not representable. Transcribed here by the Orchestrator at ACT-026; this role
  produced no verdict and closed nothing on its own authority. The superseded ACT-023 value read -
  OPEN. The review gate's status is the verdict recorded at its highest round, which is round 3 and
  is pending. Rounds 1 and 2 both recorded changes-required, at ec533fb5bb0055675fb81f72057d5636f7867db3
  and at 6f7f0edb63615d7f143dd6c59750a5ea7db701fc, and both are durable and superseded, never
  rewritten. This record is therefore NOT INTEGRABLE - review is in its pre_merge_gates and that
  gate now carries two durable failing verdicts and no verdict at round 3. Pull request 22 must not
  be merged. The superseded ACT-022 value read - OPEN. The review gate's status is the verdict
  recorded at its highest round, which is round 2 and is pending. Round 1 recorded changes-required
  and is durable and superseded, never rewritten. This record is therefore NOT INTEGRABLE - review
  is in its pre_merge_gates and that gate now carries a durable failing verdict at round 1 and no
  verdict at round 2. Pull request 22 must not be merged. At ACT-022 the round-2 gate owner TASK-044
  became DISPATCHABLE, because this record's remediation TASK-042 published at
  e33a62beb8198162db7c37f4e9740269e1454d2d and satisfied review_ready(TASK-042). That is a change in
  the round-2 owner's readiness and NOT a change in this gate's status, in this record's verdict, or
  in its integrability.
round_2_verdict: >-
  changes-required, recorded by TASK-044 at 6f7f0edb63615d7f143dd6c59750a5ea7db701fc, published as
  pull request 27, artifact reports/code-review/TASK-042-INTEGRATION-AUTHORITY-REVIEW-ROUND-2.md.
  ONE verdict applied ATOMICALLY to (TASK-042, review, round 1) and to this record's round-2
  relation; the report states it applies "without a split outcome" and that both relations remain
  non-passing. Implementation authorization is DENIED for both executors for the second consecutive
  round, and the report instructs the Orchestrator not to create either executor implementation
  task. Three new findings - F-044-01, F-044-02, F-044-03 - all Medium, all blocking, all
  architect-owned, routed to TASK-046 and revalidated by TASK-047 at round 3. This record's own
  artifact is unchanged and is not re-authored - 5e5fc8f stays the immutable round-1 target forever
  and the remediation chain runs TASK-042 then TASK-046 on new branches at new rounds.
round_3_verdict: >-
  approved, recorded by TASK-047 at 78359ae2e3dc6e97fb3d60f0b847b84abed08fa6, published as pull
  request 29, artifact reports/code-review/TASK-046-INTEGRATION-AUTHORITY-REVIEW-ROUND-3.md, 272
  lines, over the cumulative base c95ce600b40ab2dbac73da44a21bbb7a207c444d, which is this record's
  own immutable branch point. ONE verdict applied ATOMICALLY to (TASK-046, review, round 1),
  (TASK-042, review, round 2), and this record's round-3 relation; the report states it "applies
  atomically to the complete relation cohort" and "is not a split result". NO FINDING OF ANY
  SEVERITY WAS RECORDED. Round-1 dispositions read from the report - F-041-01 resolved and remains
  resolved; F-041-02 resolved by the F-044-02 correction; F-041-04 resolved by the F-044-03
  correction and the actual publication; F-041-03 explicitly NOT re-dispositioned, because it
  belongs to the separately closed LIN-CI-EVIDENCE-REVIEW lineage. Round-2 dispositions - F-044-01,
  F-044-02, and F-044-03 all resolved. All 32 carried scope rows met, from a fresh parse. IMPLEMENTATION
  AUTHORIZATION IS GRANTED FOR THE FIRST TIME, after two consecutive denials - the report states
  that "Implementation tasks may now be created, after the Orchestrator records this atomic verdict"
  and that HUMAN-004 requires TWO separately owned tasks, runtime for the task-to-integration
  executor and devops for the integration-to-main release executor. It states equally plainly that
  "This approval does not activate either executor" and that the returned tasks-owned gate
  narrowing, the returned human-controlled AGENTS.md amendment, and the separately provisioned
  human-controlled RepositoryPolicyAttestor "remain prerequisites; the current contract correctly
  fails closed while they are absent". This record's own artifact 5e5fc8f is unchanged and was not
  re-authored; the remediation chain ran TASK-042 then TASK-046 on new branches at new rounds, and
  round 3 judged the cumulative result.
round_3_verdict_note: >-
  The verdict is recorded here by the Orchestrator at ACT-026 and was authored by TASK-047. This
  role transcribes a gate owner's judgment and never produces, softens, extends, or anticipates
  one. No finding was created, resolved, re-dispositioned, merged, or split by ACT-026. In
  particular, the report's grant of implementation authorization is the report's; ACT-026 acted on
  it by creating TASK-048 and TASK-049 as BLOCKED records with their six single-owner gate tasks,
  and made neither executor ready and neither active.
round_3_owner_state: >-
  SUPERSEDED at ACT-026 by round_3_verdict above; retained verbatim as the state that was true
  before the round reported. TASK-047 is blocked as of ACT-023, one step out, on review_ready(TASK-046). It records one verdict
  applied atomically to THREE relations - (TASK-046, review, round 1), (TASK-042, review, round 2),
  and (TASK-040, review, round 3) - over the target TASK-046 will publish and the pre-lineage base
  c95ce600b40ab2dbac73da44a21bbb7a207c444d, which is this record's own immutable branch point and is
  chosen so that the round sees the complete integration-authority amendment rather than only the
  latest correction to it. That is the same reasoning ACT-021 applied when it gave TASK-044 the same
  base. Nothing about this record's artifact changed at ACT-023, and the round-1 target 5e5fc8f was
  re-queried again and still returns total_count 0 check runs, recorded once more as an absence and
  never as a success.
integrable: true
integrable_reason: >-
  review is this record's only declared pre_merge_gate and its only required_gate, and that
  relation is CLOSED at approved at its highest round, round 3. Under the integrated edge
  definition this record is review_ready with every pre-merge gate closed. It does NOT follow that
  pull request 22 should be merged separately: under the approved INTEGRATION-STRATEGY.md the
  content-bearing unit is the ONE latest cumulative target whose authoritative lineage verdict
  passes, which is TASK-046 at f148567d716c00d7a24783318c8d6d7031492e7b. This record's published
  head 5e5fc8fe656b0e08a5337642447d7a81f83c4822 is that target's grandparent - 5e5fc8f is
  e33a62be's parent and e33a62be is f148567d's parent - so this record reaches integrated through
  the same merge, by ancestry and by the lineage-subsumption evidence rule, and receives no commit
  of its own. ACT-026 merged nothing, prescribed no merge, and left pull requests 22, 25, and 28
  unmerged and unmodified; no Orchestrator activation may perform any of those merges. HUMAN-004's
  own text still states that existing pull requests continue to obey their current gates and that
  the decision "does not retroactively authorize a gate bypass" - the gate here was passed, not
  bypassed. THAT MERGE HAPPENED AT ACT-027, at cf6333b10e628b3b61f3b7f8716b30923725067d, and
  ACT-027 consumed the fact rather than producing it. The superseded ACT-023 value read -
  integrable: false. review is declared in
  pre_merge_gates and the relation is open, now carrying durable failing verdicts at rounds 1 and 2
  and no verdict at round 3. Neither ACT-021, ACT-022, nor ACT-023 merged, modified, closed,
  reopened, commented on, or approved pull request 22.
integrated: true
integrated_at: cf6333b10e628b3b61f3b7f8716b30923725067d
integrated_evidence: >-
  LINEAGE-SUBSUMED, not content-merged, at one further remove than TASK-042. This record receives
  NO COMMIT OF ITS OWN and contributes no Git content of its own to the integration branch, which
  is what ADR-0041 and the approved INTEGRATION-STRATEGY.md prescribe for a superseded cohort
  member. The integration branch is integration/autonomous-runtime; the merged commit is
  cf6333b10e628b3b61f3b7f8716b30923725067d; the source task T is TASK-046; the source published
  commit is f148567d716c00d7a24783318c8d6d7031492e7b; the lineage is
  LIN-INTEGRATION-AUTHORITY-REVIEW; the authoritative round is lineage_round 3. All six values are
  identical to those on TASK-046's and TASK-042's records, which is the batch-consistency property
  the strategy requires and which was checked across the three records rather than copied. THE
  ANCESTRY WAS PROVED RATHER THAN ASSERTED - git merge-base --is-ancestor
  5e5fc8fe656b0e08a5337642447d7a81f83c4822 cf6333b10e628b3b61f3b7f8716b30923725067d succeeds, and
  5e5fc8f is the LITERAL PARENT of e33a62be, which is the literal parent of f148567d, each read
  with git cat-file -p. This record is therefore the grandparent of the cumulative target and the
  oldest member of the subsumed set. GITHUB CLOSED PULL REQUEST 22 AS MERGED AT
  2026-08-07T21:06:08Z with mergeCommit.oid equal to 5e5fc8fe656b0e08a5337642447d7a81f83c4822,
  which is this record's OWN HEAD and not a separate merge commit - read live from the API at
  ACT-027 and recorded as external corroboration that no second merge exists. LINEAGE SUBSUMPTION
  IS LIFECYCLE EVIDENCE AND NOT A GIT OPERATION, and it is emphatically not a claim that this
  record's own publication was approved in isolation - rounds 1 and 2 recorded changes-required at
  ec533fb5bb0055675fb81f72057d5636f7867db3 and 6f7f0edb63615d7f143dd6c59750a5ea7db701fc, both
  durable and unrewritten, and only round 3's approved verdict at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 closed the relation. This record's own published head
  5e5fc8f still carries ZERO GitHub check runs, unchanged and recorded once more as an absence
  rather than as a success; it was not re-queried at ACT-027 and its recorded absence is carried
  forward as a recorded absence. Because the same authoritative verdict already closed every cohort
  relation, this record may satisfy terminal and reach done without replaying its blobs. The source
  branch agent/gpt/architect/task-040 was NOT deleted and still resolves to 5e5fc8f both locally
  and on origin.
parent_task: TASK-001
publication_class: bootstrap
published_commit: 5e5fc8fe656b0e08a5337642447d7a81f83c4822
published_branch: agent/gpt/architect/task-040
publication: published
published_remote_ref: refs/heads/agent/gpt/architect/task-040 on origin, resolving to 5e5fc8fe656b0e08a5337642447d7a81f83c4822
pull_request: 22, OPEN against integration/autonomous-runtime, head 5e5fc8fe656b0e08a5337642447d7a81f83c4822, not a draft, reported MERGEABLE with mergeStateStatus CLEAN, created 2026-08-06T20:33:37Z, updated 2026-08-06T20:35:06Z. Read from the GitHub API at ACT-020, not from the dispatch hint.
publication_note: >-
  This is a bootstrap-class publication that satisfies review_ready on all three
  conditions independently — immutable commit, remote publication, and an open pull
  request — so the rule 1 bootstrap allowance was available and was not needed. It is
  the fourth architecture publication in this graph to reach that standard, after
  TASK-016, TASK-024, and TASK-028, and the first architecture pull request whose base
  is integration/autonomous-runtime rather than main.
publication_check_runs: >-
  None. GitHub reported total_count 0 check runs for 5e5fc8fe656b0e08a5337642447d7a81f83c4822,
  an empty statusCheckRollup on pull request 22, and a combined status with zero
  contexts. Recorded as an absence. No check is claimed to have passed, and the
  combined status literal "pending" is GitHub's default for zero contexts rather than
  a running check. This is the same treatment ACT-018 gave the absent run on pull
  request 20, and judging the gap is TASK-041's, not the Orchestrator's.
review_target_commit: 5e5fc8fe656b0e08a5337642447d7a81f83c4822
round_1_verdict: >-
  changes-required, recorded by TASK-041 at ec533fb5bb0055675fb81f72057d5636f7867db3, published
  as pull request 23, artifact reports/code-review/TASK-040-INTEGRATION-AUTHORITY-REVIEW.md.
  Four findings - F-041-01 High, F-041-02 High, F-041-03 High, F-041-04 Medium. Three are
  architect-owned and routed to TASK-042; F-041-03 is devops-owned and routed to TASK-043.
  Implementation authorization is DENIED for both executors at this round, in the report's own
  words. Its scope table holds twenty-six rows, of which 20 are met and 6 are not met - corrected
  in place at ACT-023 under MC-018, which records that this field previously read "Twenty-two of
  twenty-six scope items were judged met" and that the recount was performed two ways over the
  report at ec533fb and reached independently by round 2. The figure never determined the verdict
  and nothing else in this field changes. This record's own artifact is unchanged and is not
  re-authored: the remediation is a
  new amendment on a new branch, judged at a new round, and 5e5fc8f stays the immutable round-1
  target forever.
round_1_verdict_note: >-
  The verdict is recorded here by the Orchestrator and was authored by TASK-041. This role
  transcribes a gate owner's judgment and never produces, softens, or anticipates one. No
  finding was resolved, re-dispositioned, merged, or split by ACT-021.
superseded_by_round: TASK-042 authors the remediation and TASK-044 records LIN-INTEGRATION-AUTHORITY-REVIEW round 2 over two relations - TASK-042 at round 1 and this record at round 2 - applied atomically. Round 2's review-diff base is c95ce600b40ab2dbac73da44a21bbb7a207c444d, the same base this round used, so the round that judges this record's relation sees this record's delta.
normative_architecture_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3, the immutable TASK-038 target, approved by LIN-ARCH-REVIEW at lineage_round 8 at 734bdbc and integrated onto integration/autonomous-runtime at de3a8d6. This task amends that approved baseline; it does not replace it and does not reopen any relation LIN-ARCH-REVIEW closed at round 8.
human_decisions:
  - id: HUMAN-004
    status: approved
    decided_at: 2026-08-06
    decided_on: 7dc07488a5b1cac8b1327ebd63bf747adbe03c68
    decision_branch: human/decision/human-004-autonomous-merge
    decision_artifact: plans/decisions/HUMAN-004-autonomous-merge-authority.md
    effect: Approves zero routine human GitHub merges and authorizes two narrowly scoped executors, conditionally. A runtime-owned post-gate integration executor may squash-merge an approved task pull request into the configured integration branch, currently integration/autonomous-runtime. A DevOps-owned release merge executor may merge the approved integration pull request into main after every declared aggregate gate and release-readiness check passes. The authority becomes operational only after the architecture amendment is independently approved, the implementation is independently reviewed and security-validated, the required GitHub controls are configured, and automated checks demonstrate the executors cannot bypass their admission predicates. It authorizes the amendment of AGENTS.md, the runtime architecture, ADRs, diagrams, and the integration strategy, and the later creation of separately owned runtime and devops implementation tasks plus reviewer, security, QA, and failure-injection validation tasks, each subject to its normal independent gates. It requires no role reassignment and changes config/agents/settings.yaml only if an approved architecture later demonstrates a declared write scope must change, which stays human-controlled. It does not retroactively authorize any gate bypass.
    question: May a non-human component of this system perform the squash-merge of an approved task branch into integration/autonomous-runtime, record the branch_integrated fact, and dispatch newly ready work, without a human in the loop - and what is the exact residual human exception set?
    answer: Yes for the task-to-integration merge and additionally yes for the integration-to-main release merge, both conditionally and both under the boundaries transcribed in this record. The residual human exception set is finite and has exactly three members - formal acceptance of an unresolved blocking High or Critical security risk; authorization of an irreversible production action when deployment policy explicitly requires it, with a merge to main not itself being such an action unless a later approved policy deliberately couples it to one; and granting, rotating, or revoking credentials and changing repository governance, branch-protection, or authorization policy. Routine merges are explicitly not human exceptions. A case that cannot be classified conclusively as outside the set must be refused with a typed exception record rather than absorbed.
unblocked_reason: The only declared dependency, human_decision(HUMAN-004), is satisfied at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68 on the non-agent branch human/decision/human-004-autonomous-merge, consumed by ACT-019 as ingress entry seq 27. All four clauses of this record's superseded exit condition were checked individually against the commit's own text - whether the change is authorized, which components may hold the authority, what the residual human exception set is, and which governance artefacts change - and all four are satisfied. The architecture-docs lock is free.
superseded_blocked_reason: The user requirement this task represents needs a governance decision that no agent may make or presuppose. HUMAN-004 is open. AGENTS.md requires every agent to push its task branch and use a pull request, reserves governance and enforcement paths for humans, and requires human approval for privileged, external, and release-changing actions; the approved architecture assigns the integration merge to the operator and gives no module a path that can push or merge any ref but its own task branch. Authoring the amendment before the decision would be inventing the authority it depends on.
superseded_exit_condition: A human records HUMAN-004 in a tracked commit on a non-agent branch, stating whether autonomous post-gate integration is authorized, which component may hold that authority, what the residual human exception set is, and which governance artefacts change. That commit is an ingress fact of class human_decision_recorded; the TASK-013 activation that consumes it moves this record to ready and pins the decision commit here. A decision that refuses the change closes this task instead. Discharged at ACT-019 by the approving branch; the closing branch was live until the decision document was read and is recorded here so a reader can see both outcomes were possible.
review_target_base: c95ce600b40ab2dbac73da44a21bbb7a207c444d
review_target_applicability: applicable and resolved at ACT-020. TASK-041 round 1 diffs the immutable target 5e5fc8fe656b0e08a5337642447d7a81f83c4822 against this base, which is this branch's own immutable branch point on integration/autonomous-runtime, read with git merge-base agent/gpt/architect/task-040 integration/autonomous-runtime and independently confirmed as the parent of the first authored commit d2c599696d25bc8938ef43514e8dc37aad70b047. It is deliberately not de3a8d6, not origin/main, and not any earlier architecture publication.
review_target_pin_note: The target is the branch head rather than d2c599696d25bc8938ef43514e8dc37aad70b047. The head is the second authored commit and it changes two in-scope documents, so the parent is not the complete amendment. This is the same head-binding rule ACT-009, ACT-013, and ACT-015 applied. Pull request 22 was opened at 2026-08-06T20:33:37Z, before the head commit at 2026-08-06T20:34:34Z, and its headRefOid now reads 5e5fc8fe656b0e08a5337642447d7a81f83c4822, so the pull request and the pinned target agree.
branch_point_of: agent/gpt/architect/task-040
scope_validation_base: c95ce600b40ab2dbac73da44a21bbb7a207c444d
scope_validation_applicability: applicable and resolved at ACT-020, superseding the reproducible expression this record carried before the branch existed
scope_validation_note: The owner resolved the branch point as instructed and recorded it as c95ce600b40ab2dbac73da44a21bbb7a207c444d in the pull request description; the Orchestrator recomputed the same value two ways at ACT-020. Never pass origin/main, c325275, de3a8d6, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-040: Architecture amendment for autonomous post-gate integration authority

## Objective

Define, in the approved architecture, the contract under which the system itself may perform **two** post-gate merges without a human in the loop:

1. Squash-merge an approved **task** pull request into `integration/autonomous-runtime`, produce the `branch_integrated` ingress fact, and let the ordinary scheduling loop dispatch the work that fact releases — owned by **`runtime`**.
2. Merge the approved **integration** pull request into **`main`** after every declared aggregate gate and release-readiness check passes — owned by **`devops`**.

So that routine human merging becomes zero and the human remains only for the finite exception set `HUMAN-004` enumerates.

**This task authors a contract. It does not authorize the capability and does not build it.** The authorization is `HUMAN-004`, now recorded; the implementations are separate tasks that do not exist and **may not be created until TASK-041 records a passing verdict on this amendment.**

## The decision this task is authored under

`HUMAN-004` is **approved**, durable as commit **`7dc07488a5b1cac8b1327ebd63bf747adbe03c68`** `docs: approve autonomous merge authority` on the non-agent branch `human/decision/human-004-autonomous-merge`, published at `origin`. Its single artifact is `plans/decisions/HUMAN-004-autonomous-merge-authority.md`. **Read that document at that commit before authoring anything**; the transcription below states its boundaries in scope and is not a substitute for it.

| Boundary | What the decision fixes |
|---|---|
| **Two executors, two owners** | A **runtime-owned post-gate integration executor** for the task-to-integration merge, and a **DevOps-owned release merge executor** for the integration-to-`main` merge. The decision requires their implementation tasks to be owned **separately** by `runtime` and `devops`. This amendment must not collapse them into one component, one owner, or one admission predicate |
| **Conditional authority** | It "becomes operational only after the architecture amendment is independently approved, the implementation is independently reviewed and security-validated, the required GitHub controls are configured, and the automated checks demonstrate that the executors cannot bypass their admission predicates". Four conditions, none of which this amendment discharges |
| **Required normal flow, task branch** | Read the authoritative task record and immutable publication facts; confirm every declared pre-merge gate is closed with an authoritative passing verdict; confirm no unresolved blocking High or Critical security finding applies to the target; confirm target branch, base branch, head commit, integration order, and merge method exactly match the approved contracts; **persist merge intent before the external side effect**; squash-merge through the GitHub API **without bypassing branch protection**; verify the resulting tree and record the durable `branch_integrated` ingress fact; let the ordinary scheduler advance lifecycle state and dispatch newly ready work |
| **Required normal flow, release merge** | The same fail-closed pattern, and additionally confirm that **all aggregate review, security, QA, performance, documentation, deployment, and rollback requirements declared for the release are complete** |
| **Conflict and failure handling** | A merge conflict, stale head, missing check, ambiguous state, API failure, or unverifiable result "must not create a routine human merge request". Fail closed, preserve evidence, route a remediation task to the responsible agent role, retry only under the approved bounded retry policy, and "never guess, force a merge, or silently discard a conflicting change" |
| **Residual human exception set — finite, three members** | Formal acceptance of an unresolved blocking High or Critical security risk. Authorization of an irreversible production action when deployment policy explicitly requires it — with the decision stating that "a merge to `main` is not itself such an action unless a later approved policy deliberately couples it to an irreversible production change". Granting, rotating, or revoking credentials and changing repository governance, branch-protection, or authorization policy. **Routine merges are explicitly not human exceptions.** When a case "cannot be classified conclusively as outside this set, automation must refuse it and emit a typed exception record. It must not broaden its own authority" |
| **Prohibited capabilities — eight, binding on both executors** | Author, approve, close, override, or formally accept a gate on work it merges; merge a pull request whose declared pre-merge gates are open or failing; push directly to `main` or set `ALLOW_MAIN_PUSH`; force-push, bypass hooks or branch protection, use an administrator override, or disable a required check; merge governance or enforcement changes under its own authority; release another execution's lock or modify task ownership to make a merge admissible; use a mutable branch head where the contract requires an immutable commit; treat a missing, skipped, timed-out, or cancelled check as passing |
| **Credentials and GitHub controls** | A least-privilege repository credential, preferably a GitHub App installation token with short lifetime and auditable identity, kept outside the repository. "Branch protection and required checks remain authoritative; automation receives merge permission but no bypass permission." Idempotency keys and durable intent/result records must prevent duplicate side effects after retries or restarts |
| **Role assignment** | "No role reassignment is required by this decision. `config/agents/settings.yaml` changes only if an approved architecture later demonstrates that a declared write scope must change; such a change remains human-controlled" |
| **Sequencing** | TASK-013 records the commit and moves this task to `ready`; this task authors the amendment and **must cover task-to-integration and integration-to-`main` automation**; TASK-041 reviews it; **only a passing TASK-041 verdict permits the Orchestrator to create implementation and validation tasks**; existing pull requests continue to obey their current gates and "this decision does not retroactively authorize a gate bypass" |

**The Orchestrator transcribed this decision and did not extend it.** Nothing above is an architectural choice; every row is a constraint read from the decision commit. Where this record adds an obligation the decision does not state, it is marked as such below and it is a refusal rather than an expansion.

**Note that `AGENTS.md` merging into a decision does not mean this task may edit it.** The decision authorizes an `AGENTS.md` amendment; `AGENTS.md` is a human-controlled enforcement path and cannot be changed from an `agent/*` branch, and it is outside this role's declared write scope. See the exclusions in Scope.

## What changed when the decision landed

This record was created at `ACT-018` against the requirement as it then stood — a **single** merge, task branch into the integration branch. `HUMAN-004` authorizes **two**, and the second crosses a different safeguard, belongs to a different role, and gates on a release-readiness set this graph has never declared. `ACT-019` therefore expanded this task's scope and acceptance criteria rather than leaving a record that covers half the decision, and expanded TASK-041's review scope to match. The original single-executor framing is superseded, not deleted: the reasoning below about why no module owns the integration merge applies unchanged to the first executor and applies with more force to the second.

## Why this needs an architecture change rather than an implementation task

The Orchestrator checked the approved architecture at `8ea5c32` — integrated at `de3a8d6` and readable on `integration/autonomous-runtime` — for authority that would let an implementation task be created today. It is not there:

- **The eight-module map assigns no module the integration merge.** `COMPONENT-BOUNDARIES.md` names eight modules and eight owners; none of them owns merging into the integration branch. `INTEGRATION-STRATEGY.md` prescribes the merge **method** and **order** — one squash commit per content integration unit, ADR-0010 as amended by ADR-0016, and ADR-0041 for the cumulative architecture unit — but its executor is the operator.
- **The workspace lifecycle module can publish and cannot merge, by construction.** ADR-0011 and `WORKSPACE-LIFECYCLE.md` give `executeFinalize` commit, push, and pull-request creation or update. Exactly one function in that module constructs a push; its refspec is `refs/heads/<derivedBranch>`, it takes no ref parameter, and a record whose fields would produce another ref is refused before any process is spawned. There is no merge path and no second push target. That is a deliberate structural prohibition with declared tests behind it, not an omission.
- **The `branch_integrated` ingress class already anticipates a producer that does not exist.** `tasks/TASK-001-DEPENDENCY-GRAPH.md` types the class as produced by "the operator or the runtime's integration step". The second producer has never existed; `seq` 4 and `seq` 25 were both operator actions.
- **Governance forbids an agent from supplying the missing half on its own.** `AGENTS.md` requires each agent to push its task branch and use a pull request, marks governance and enforcement files human-controlled, and requires human approval for destructive, privileged, external, or release-changing actions. Merging into the shared integration branch is external and release-changing.

So the requirement crossed two prerequisite layers: a **governance decision** about who may hold the authority, and an **architecture decision** about what the authority's contract, refusal set, and evidence obligations are. **The first is now discharged at `7dc0748`.** This task owns the second.

**The reasoning above applies with more force to the second executor.** Merging `integration/autonomous-runtime` into `main` is the operation the tracked pre-push hook exists to constrain, `AGENTS.md` names `main` explicitly, and no module, script, or workflow in the approved architecture performs it. Neither executor is filling a gap the architecture left open by oversight; both are new authority the decision grants and this amendment must bound.

## Scope

Within the boundaries `HUMAN-004` sets, and no further. Every item below applies to **both** executors unless it names one.

**Ownership and placement**

- Name the module that owns the **runtime** post-gate integration executor, its source path, and its single owner **role** — `runtime` — and place it in the module map, the dependency graph, and the level witness without breaking the two-independent-contract-roots property or introducing a cycle.
- Name the module that owns the **DevOps** release merge executor, its source path, and its single owner **role** — `devops` — and place it the same way. **Keep the two components separate**: the decision requires separately owned implementation tasks, so a single component parameterized by target ref does not satisfy it and is a finding.
- **If either component's natural source path falls outside its owner role's declared `write_scope` in `config/agents/settings.yaml`, say so explicitly and return the placement question rather than deciding it.** `assignments.runtime.write_scope` covers `src/orchestrator/**`, `src/agents/**`, `bin/**`, and their unit tests; `assignments.devops.write_scope` covers the manifests, `.github/workflows/**`, and `scripts/ci|deploy|release|setup|quality/**`. A write-scope change is human-controlled — the decision says so in terms — so the amendment records the requirement and the Orchestrator routes it to the user. This is the same rule TASK-026's placement already carries.

**Admission**

- Define the typed **admission predicate** the **runtime** executor evaluates: the target is `review_ready` under its declared `publication_class`; every gate in the target's `pre_merge_gates` is closed at its authoritative lineage round with a passing or formally accepted verdict; no blocking High or Critical security finding is open against the target; the target branch, base branch, head commit, integration order, and merge method match the approved contracts; and the target's own record is the source of every one of those facts.
- Define the typed **admission predicate** the **DevOps** executor evaluates for the integration-to-`main` merge, including the decision's additional requirement that **all aggregate review, security, QA, performance, documentation, deployment, and rollback requirements declared for the release are complete**. **State how a release's declared requirement set is expressed in this graph's existing vocabulary** — this graph has never declared an aggregate release gate, and inventing one silently would be the defect A-506 and F-601 each describe in a new place. If the vocabulary needs an addition, name it as an addition.
- Both predicates read **immutable commits**, never mutable branch heads, wherever the contract requires an immutable identity. The decision lists using a mutable head where an immutable commit is required as a prohibited capability.

**Refusal**

- Define the **refusal set** as a total, typed result rather than as prose, for each executor. State explicitly what each refuses and **cannot express**: merging a target with an open or failing pre-merge gate; merging ahead of the declared integration order; merging into any ref other than the one that executor is configured for; pushing `main` directly; setting `ALLOW_MAIN_PUSH`; force-pushing; bypassing the pre-push hook, branch protection, or a required check; using an administrator override; force-releasing a lock or modifying task ownership to make a merge admissible; writing a governance or enforcement path; merging a governance or enforcement change under its own authority; treating a missing, skipped, timed-out, or cancelled check as passing; and closing, overriding, authoring, or formally accepting any gate verdict on work it merges.
- **The `main` prohibition and the `main` authority must be distinguished precisely and shown not to collide.** The DevOps executor merges into `main` through the GitHub API under branch protection; it may not **push** `main` and may not set `ALLOW_MAIN_PUSH`. State the mechanism that makes the second unconstructible while the first is permitted, with the declared test.
- Define the **fail-closed** behavior the decision requires for a conflict, stale head, missing check, ambiguous state, API failure, or unverifiable result: no routine human merge request is produced, evidence is preserved, a remediation task is routed to the responsible agent role, and retries are bounded by an approved policy.

**Evidence, ordering, and identity**

- Define the **evidence and ordering contract**: intent is durable **before** the side effect, in the plan/execute shape ADR-0019 and ADR-0027 already require; the squash shape and the exact target-tree equality ADR-0041 requires are verified before the evidence batch is appended; and idempotency keys plus durable intent and result records prevent a duplicate side effect after a retry or a restart, which the decision requires by name.
- State that the resulting `branch_integrated` entry is appended by an **authorized appender** through the TASK-026 ingress store, never by the Orchestrator and never by the executor writing its own trigger.
- State how the **credential** contract is expressed architecturally — least-privilege, short-lived, auditable identity, held outside the repository, carrying merge permission and **no bypass permission**. No credential value, token, or endpoint containing a secret appears in any artifact.

**Exceptions**

- Define the **human exception surface** as a typed, enumerable set of exactly the three members the decision names, not as a discretionary pause. State how each executor **detects** that it is inside the set, what typed exception record it emits when it cannot classify a case, and why refusing is the only representable outcome in that case. The decision's clause that a merge to `main` is not itself an irreversible production action — unless a later approved policy couples it to one — must be represented rather than paraphrased away.

**Relationships this amendment must state rather than assume**

- State how this interacts with the still-unimplemented `HUMAN-002` collector: an integration executor produces a fact that something must append pre-dispatch, and that appender does not exist. Say whether either executor may land before the collector does, and if so what the interim contract is and how it is **named** — the same discipline `MC-005` applied to the bootstrap dispatch contracts.
- State the relationship between the two executors: whether the release executor may act on an integration branch whose task merges were performed by the runtime executor, by the operator, or by a mixture, and what it requires of each.

**Recording**

- Record the decisions as one or more ADRs continuing the existing numbering, and state which earlier decision each supersedes in part, if any.

**Exclusions — each is a refusal, and exceeding one is a finding**

- **Do not implement either executor.** No code, no script, no workflow.
- **Do not author, draft, or edit `AGENTS.md`.** The decision authorizes its amendment; it is a human-controlled enforcement path, it cannot be changed from an `agent/*` branch, and it is outside this role's write scope. **State what the amendment must say and return it**; the Orchestrator routes it to the user.
- **Do not change `config/agents/settings.yaml`**, for the same reason and because the decision reserves it.
- Do not change any structural prohibition, any gate's owner, round, lineage, or verdict, or any write scope.
- Do not create the implementation or validation tasks. Only a passing TASK-041 verdict permits that, and only the Orchestrator may do it.
- Do not assert that this amendment is approved, and do not treat `HUMAN-004` as making the capability exist.
- Do not reopen, retarget, or weaken any relation `LIN-ARCH-REVIEW` closed at round 8, and do not alter TASK-018's or TASK-019's gates, edges, or ordering.

## Acceptance criteria

- [ ] The amendment cites the decision commit `7dc07488a5b1cac8b1327ebd63bf747adbe03c68` and stays inside the boundaries it sets. **An amendment that assumes an authority the decision did not grant is a blocking defect whatever its other merits**, and so is one that silently narrows an authority the decision did grant.
- [ ] **Both** authorized executors are covered: the task-to-`integration/autonomous-runtime` merge and the `integration/autonomous-runtime`-to-`main` release merge. An amendment covering only the first does not satisfy the decision's own sequencing clause.
- [ ] Each executor has exactly one owning module, one source path, and one owner **role**, and the two are **not** collapsed into a single component. The module map, the dependency graph, the level witness, the acyclicity proof, and the two-independent-contract-roots property are each re-derived from the amendment's own target tree rather than inherited from any earlier document or from this record. `MC-011` applies in full: this record deliberately states no count.
- [ ] Where a component's source path would fall outside its owner role's declared write scope, the amendment says so explicitly and **returns** the question instead of deciding it.
- [ ] Each admission predicate is expressed in the typed edge and gate vocabulary this graph already declares — `review_ready`, `pre_merge_gates`, the lineage form of `gate_passed`, and the gate-closure rule — and not in new prose that restates them. Any genuinely new vocabulary the release gate requires is named as an addition rather than introduced silently.
- [ ] Each refusal set is a **total typed result**. Every structural prohibition listed in Scope is shown to be **unconstructible** rather than merely forbidden, with the declared test that demonstrates it — including, specifically, that the DevOps executor cannot push `main`, cannot set `ALLOW_MAIN_PUSH`, and cannot bypass branch protection while still being able to merge through the API.
- [ ] The fail-closed contract is represented: no path produces a routine human merge request, evidence is preserved, remediation is routed to the responsible agent **role**, and retries are bounded.
- [ ] Durable intent precedes every external side effect, and idempotency keys plus durable intent and result records make a duplicate side effect after retry or restart unrepresentable.
- [ ] The human exception set is enumerable, typed, has exactly the three members the decision names, and is **detectable** by each executor; the amendment states what happens when an executor cannot classify a case, and the outcome is refusal with a typed exception record.
- [ ] Neither executor can author, approve, close, override, or formally accept a gate on work it merges, and neither can merge a governance or enforcement change under its own authority.
- [ ] No merge ordering weaker than `INTEGRATION-STRATEGY.md`'s integration order is introduced, and ADR-0041's cumulative-unit rule is preserved unchanged.
- [ ] The relationship to the unimplemented `HUMAN-002` collector is stated explicitly, and no claim is made that either one implies the other.
- [ ] The amendment states plainly, in its own words, that it authors a contract and records no approval of it, and it opens no gate on its own behalf.
- [ ] `AGENTS.md` and `config/agents/settings.yaml` are unmodified. What the `AGENTS.md` amendment must say is stated and returned.
- [ ] No credential, token, or secret-bearing endpoint appears in any artifact.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>` reports a valid result, and every changed path is inside this task's declared write scope.

## Expected artifacts

- `docs/architecture/ARCHITECTURE.md`, as the declared entry-point artifact.
- The amended documents under `docs/architecture/runtime/`.
- One or more ADRs under `docs/adr/`.
- Updated diagrams under `diagrams/architecture/` where the module map changes.

## Dependency notes

- The only scheduling dependency is `human_decision(HUMAN-004)`, and it is **satisfied** at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`. This is the second `human_decision` edge this graph has ever carried; the first was TASK-018's on `HUMAN-001`, satisfied at `fb9f45c`. It was used here for the reason the edge vocabulary states — **work an agent is structurally forbidden to unblock** — and it did what the vocabulary promises: the task waited, a human recorded a durable decision, and the edge released without any agent widening its own authority.
- **This task does not block TASK-018 or TASK-019, and neither of them depends on it.** The toolchain's review gate, its security gate, and its integration are unchanged and proceed on their own edges. Nothing in this record may be read as a reason to delay, accelerate, or bypass them.
- **TASK-018 must never be merged before TASK-019 records a passing verdict.** That is TASK-018's declared `pre_merge_gates: [review]` and it is unaffected by anything this task may later define.
- This task holds `architecture-docs` as its ninth registered holder. The lock is free.

## Gate ownership

The review gate is owned by **TASK-041**, in a separate execution context, under the new gate lineage `LIN-INTEGRATION-AUTHORITY-REVIEW` at `lineage_round` 1. The lineage is new rather than a ninth round of `LIN-ARCH-REVIEW` for a stated reason: `LIN-ARCH-REVIEW`'s cohort is the eight-member remediation chain whose relations all closed together at round 8, and adding a round there would either reopen eight closed relations or silently change what a cohort means. `LIN-TOOLCHAIN-REVIEW` is the precedent — a separate artifact under the same gate name gets its own lineage.

Whether an autonomous integration executor additionally requires a security gate before it may be built is a question for `TASK-041` and for the security owner, not for this record to assert. **The decision names independent reviewer, security, QA, and failure-injection validation for the implementation**, which is a stronger statement about the implementation than about this amendment; it does not itself declare a security gate on this task, and this record does not add one on the decision's behalf.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-040 -Role architect -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-040 -Role architect -Llm gpt` before editing. The `architecture-docs` lock is free; this task is its ninth registered holder.
3. Branch from `integration/autonomous-runtime`, at or after `de3a8d6`, so the approved architecture is present. Resolve the immutable branch point inside the worktree with `git merge-base HEAD integration/autonomous-runtime` and record the resolved value in the handoff. Never pass `origin/main`, `c325275`, or a review-diff base to `-BaseRef`.
4. Read `plans/decisions/HUMAN-004-autonomous-merge-authority.md` at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68` before authoring.
5. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
6. Commit, publish as the environment permits, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-040 -Role architect -Llm gpt`. **Never push `main` and never merge anything** — including under this amendment, which authorizes a capability that does not exist and confers nothing on the task that authors it.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request. Transcribed at `ACT-020` from the two commit messages on `agent/gpt/architect/task-040` and the pull request 22 description, both read at that commit. Nothing below is the Orchestrator's own assessment of the amendment; judging it is TASK-041's.

- **Transition at `ACT-027`: `review` → `done`, on ingress entry `seq` 37, class `branch_integrated`, LINEAGE-SUBSUMED.** The operator merged **pull request 28** — TASK-046's, not this record's — into `integration/autonomous-runtime` at **`cf6333b10e628b3b61f3b7f8716b30923725067d`**. **This record's own branch was not merged and receives no commit of its own.** Its published head `5e5fc8fe656b0e08a5337642447d7a81f83c4822` is the cumulative target's **grandparent** — `5e5fc8f` is `e33a62be`'s literal parent and `e33a62be` is `f148567d`'s — so it is the oldest member of the subsumed set, proved with `git merge-base --is-ancestor` and `git cat-file -p`. **GitHub closed pull request 22 as `MERGED` with `mergeCommit.oid` equal to this record's own head OID**, read live and recorded as corroboration of the ancestry rather than as a third integration. Its three `integrated` clauses are each satisfied: `review_ready` at `5e5fc8f`, its single `pre_merge_gates` entry `review` closed at `approved` at round 3, and the content merged into the integration branch as part of the one cumulative unit. **`ACT-027` merged nothing and simulated nothing.** See `integrated_evidence`.
- **What reaching `done` does not mean here, and it means less than for any other record in this cohort.** This record's own publication was rejected **twice**, at `ec533fb` and `6f7f0edb`, and both verdicts stay durable and unrewritten. Its own target still carries **zero** check runs. `done` says only that the one reviewed cumulative tree contains this record's content and that round 3's `approved` verdict already closed this record's relation, so `terminal` is satisfied without replaying its blobs. **Nothing was re-reviewed at `ACT-027` and no verdict was authored, softened, or extended.**
- **Gate closed at `ACT-026`, at round 3, after three rounds and two remediations — the longest chain any relation in this graph has run.** TASK-047 recorded **`approved`** at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6`, ingress entry `seq` 36, class `gate_verdict_recorded`, applied **atomically** to `(TASK-046, r1)`, `(TASK-042, r2)`, and this record's `r3` — all three closed together. **Rounds 1 and 2 keep their durable `changes-required` verdicts** at `ec533fb5bb0055675fb81f72057d5636f7867db3` and `6f7f0edb63615d7f143dd6c59750a5ea7db701fc`; both are superseded, never rewritten, and all three rows stay recorded. **This record's `published_commit` `5e5fc8f` is unchanged, was not re-authored, and was not itself re-reviewed**: round 3 reviewed the cumulative delta `c95ce600..f148567d`, and this relation is inside its cohort because that delta contains this record's own delta. **`5e5fc8f` still carries `total_count` 0 check runs**, unchanged and recorded once more as an absence rather than as a success; the round's own target `f148567d` carries two `success` runs and the round's own report commit carries two more.
- **What the closure authorizes, and what it does not.** The report grants implementation authorization for the first time, for **two separately owned executors**. `ACT-026` acted on that by creating **TASK-048** (`runtime` / `claude`) and **TASK-049** (`devops` / `claude`) as **`blocked`** records, each with its own single-owner review, security, and QA gate tasks — TASK-050, TASK-051, TASK-052 and TASK-053, TASK-054, TASK-055. **Neither executor is `ready` and neither is active.** The `AGENTS.md` amendment and the whole `RepositoryPolicyAttestor` and GitHub control-plane provisioning set remain the **user's**, authorized and unperformed, and `ACT-026` adopted and provisioned neither. **The one returned item inside this role's own scope — the `tasks/**`-owned `gate_passed` narrowing — was applied verbatim and pinned to `POST-GATE-MERGE-EXECUTORS.md` line 191 at `f148567d716c00d7a24783318c8d6d7031492e7b`**, because the round carrying it has now passed.

- **Commit or pull request:** published commit **`5e5fc8fe656b0e08a5337642447d7a81f83c4822`** `docs(TASK-040): tighten merge authority boundaries`, the branch head, preceded on the same branch by **`d2c599696d25bc8938ef43514e8dc37aad70b047`** `docs(TASK-040): define autonomous post-gate merge executors`, which is authoring ancestry rather than the published commit. Branch point **`c95ce600b40ab2dbac73da44a21bbb7a207c444d`** on `integration/autonomous-runtime`. Pushed to `origin` and opened as **pull request 22**, `OPEN` against `integration/autonomous-runtime`, head `5e5fc8f`, not a draft, `MERGEABLE` / `CLEAN`. **This is a two-commit publication — the shortest in this architecture lineage since TASK-016 — and the first architecture publication whose pull request targets the integration branch rather than `main`.**
- **Authored delta, recomputed by the Orchestrator:** **18 paths, 741 insertions, 84 deletions** over `c95ce600`. `d2c5996` carries 17 of those paths with 736 insertions and 83 deletions; the head adds `docs/architecture/runtime/LEASES-AND-SCHEDULING.md` and amends `docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md`, for 7 insertions and 3 deletions. **All 18 paths are inside this task's declared write scope**, checked by filtering the delta against `docs/architecture/ARCHITECTURE.md`, `docs/architecture/runtime/`, `docs/adr/`, and `diagrams/architecture/`; the residue is empty. `AGENTS.md`, `config/agents/settings.yaml`, `tasks/**`, `.github/**`, `.githooks/**`, `scripts/**`, `src/**`, and `tests/**` are all untouched — verified as an empty path list rather than inferred from the owner's statement.
- **Verification, as the owner recorded it in the pull request description:** "write scope: valid, 17 changed files, base `c95ce600b40ab2dbac73da44a21bbb7a207c444d`"; "architect assignment: valid"; "framework validation: passed for 13 roles"; "orchestration checks: passed"; "repository security checks: passed"; "whitespace checks: passed"; "570 relative Markdown file links checked, zero broken"; "ADR sequence contiguous from 0001 through 0042"; "`AGENTS.md`, settings, tasks, workflows, and enforcement paths unchanged".
- **One divergence between the owner's figure and the durable state, recorded beside it rather than over it.** The owner's write-scope line reports **17** changed files; the durable delta over the same declared base is **18**. Both are accurate about different commits: 17 is the delta at `d2c5996`, and the head commit added one further in-scope path afterwards. The pull request's own metadata reports `changed_files` 18, agreeing with the Orchestrator's recomputation. **The consequence is bounded and is stated rather than smoothed: the owner's recorded write-scope run does not cover the two paths in the head commit.** The Orchestrator re-derived scope validity across the full 18-path delta and found no path outside scope, so nothing is known to be wrong; whether an owner's verification evidence must cover the commit it publishes is a judgment for TASK-041 and, if it generalizes, for the next decomposition round. The owner's statement is not edited.
- **Owner-declared artifacts, as recorded in the pull request description:** "ADR-0042", "`docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md`", and "architecture entry point, boundaries, interfaces, state machine, integration strategy, retry/workspace contracts, ADR metadata, and architecture diagrams". The Orchestrator confirmed only that `docs/adr/0042-conditionally-authorized-post-gate-merge-executors.md` and `docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md` exist at the target as new files. **Whether their contents satisfy any acceptance criterion of this record is not assessed here.**
- **Owner-declared scope, quoted:** "Defines two separate, conditionally activated merge executors" — "runtime-owned task PR -> `integration/autonomous-runtime` squash integration" and "DevOps-owned `integration/autonomous-runtime` -> `main` protected release merge" — and "It does not implement or activate either executor and does not change governance."
- **Known risks, as the owner recorded them:** "TASK-041 owns the independent review; this PR must not merge before a passing verdict." "No implementation task may be created before TASK-041 passes." "HUMAN-002 durable ingress work remains an independent prerequisite; executors stay dormant until it exists." "Human-controlled `AGENTS.md`, GitHub rules, App installation/credentials, and control attestations remain unperformed."
- **Continuous integration: no run exists.** GitHub reports **zero** check runs for `5e5fc8f`, an empty `statusCheckRollup` on pull request 22, and a combined status with zero contexts. **This is recorded as an absence and never as a success.** TASK-041 must judge the gap explicitly rather than treat an unexecuted workflow as a passing check, which is the same obligation `ACT-018` placed on TASK-019 for pull request 20.
- **What this activation did not do.** It recorded no verdict, closed no gate, resolved no finding, and formed no opinion on whether the amendment covers both executors, bounds them correctly, or satisfies any acceptance criterion above. It did not merge, modify, review, comment on, or approve pull request 22 or pull request 20, and it created no implementation or validation task. **A publication is a readiness fact, not a judgment** — the distinction `ACT-007` recorded, restated here at the point where it would be easiest to skip, because this amendment authorizes the most consequential capability the graph has considered.
- Governance decision consumed: **`HUMAN-004`, approved** at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`, consumed by TASK-013 activation `ACT-019` as ingress entry `seq` 27. Its boundaries are transcribed above and its full text is at `plans/decisions/HUMAN-004-autonomous-merge-authority.md` at that commit. **The decision authorizes a capability; it does not create one, and this amendment does not create one either.**
- **Round 1 recorded `changes-required` at `ACT-021`**, at `ec533fb5bb0055675fb81f72057d5636f7867db3`, published as pull request 23 with two passing GitHub check runs of its own. The relation `(TASK-040, review, round 1)` **stays open** and is superseded by round 2. **Three of the four findings are architect-owned and routed to TASK-042**; **F-041-03 is devops-owned and routed to TASK-043**. **Implementation authorization is denied for both executors at this round**, and `ACT-021` created no implementation or validation task for either. This record's artifact is unchanged: `5e5fc8f` stays the immutable round-1 target, the remediation is a new amendment on a new branch, and no verdict was rewritten.
- **The absent continuous-integration run became a recorded finding rather than a note.** `ACT-020` recorded the zero check runs as an absence and left the judgment to TASK-041; TASK-041 judged it, made it **F-041-03**, and stated "**Absent CI is not passing CI**". `ACT-021` re-read the same surfaces and the target's check-run total is still zero. The gap is now owned, routed, and revalidated, which is what recording an absence rather than inferring a success was for.
- **Round 2 recorded `changes-required` at `ACT-023`**, at `6f7f0edb63615d7f143dd6c59750a5ea7db701fc` on `agent/gpt/reviewer/task-044`, published as **pull request 27** with two passing GitHub check runs of its own. **The verdict was applied atomically to this record's round-2 relation and to `(TASK-042, review, round 1)`**, both of which **stay open** and are superseded by round 3. Round 1's own `changes-required` at `ec533fb` is untouched and stays durable. **Three new findings — F-044-01, F-044-02, and F-044-03, all Medium, all blocking, all `architect`-owned — were routed to TASK-046**, and **implementation authorization is denied for both executors for the second consecutive round**, in the report's own words: the Orchestrator "must not create either executor implementation task". `ACT-023` created neither, and created no validation task for either. **This record's artifact is unchanged**: `5e5fc8f` stays the immutable round-1 target, and `total_count` 0 at that head was re-queried at `ACT-023` and re-recorded as an absence.
- **What round 2 found affirmatively about the amendment's safety, recorded because it bounds what the findings mean.** It found **no** path by which generic formal acceptance of a non-security verdict can construct a merge plan — the F-041-01 counterexample it constructed itself returns `PreMergeGateNotPassing` before durable intent or any merge call — and **no** contract path by which the release executor could reach `main` other than the exact-head pull-request merge API under authoritative branch protection. It also read the live control plane and recorded that **`main` and `integration/autonomous-runtime` are both unprotected, the ruleset list is empty, and no attestor artifact exists**, so activation "must remain impossible", while stating that it "does not interpret those administrative facts as authorization to configure or alter them". **`ACT-023` configured nothing.**
- **Next owner: none.** This record is `done`. Its gate is closed at round 3, its content is integrated by lineage subsumption, and nothing downstream waits on it directly — the two edges the merge released name TASK-046, not this record. **Pull request 22 is `MERGED` and must not be reopened or re-merged.** The superseded statement, from `ACT-023`, read: **Next owner: architect / gpt for TASK-046**, `ready` and dispatchable on the satisfied `gate_recorded(TASK-044)` edge at `6f7f0edb63615d7f143dd6c59750a5ea7db701fc`, branching from TASK-042's published head `e33a62be` and holding the free `architecture-docs` lock as its eleventh registered holder; and **reviewer / gpt for TASK-047**, `LIN-INTEGRATION-AUTHORITY-REVIEW` round 3, `blocked` until TASK-046 publishes, recording **one** verdict applied atomically to **three** relations over the same pre-lineage base `c95ce600`. **Pull request 22 must not be merged before a round of this lineage records a passing verdict**, which rounds 1 and 2 did not supply. The superseded statement, from `ACT-021`, read: **Next owner: architect / gpt for TASK-042**, `ready` and dispatchable now on the satisfied `gate_recorded(TASK-041)` edge at `ec533fb`, branching from this record's own published head `5e5fc8f` and holding the free `architecture-docs` lock as its tenth registered holder; and **devops / claude for TASK-043**, `ready` and dispatchable in parallel with a disjoint scope. **Reviewer / gpt for TASK-044** records round 2 over two relations and is `blocked` until TASK-042 publishes; **reviewer / gpt for TASK-045** records `LIN-CI-EVIDENCE-REVIEW` round 1 and is `blocked` until TASK-043 publishes. **Pull request 22 must not be merged before a `LIN-INTEGRATION-AUTHORITY-REVIEW` round records a passing verdict**, which is this task's declared `pre_merge_gates: [review]` and which `HUMAN-004`'s own text restates rather than relaxes. The `AGENTS.md` amendment, the GitHub branch-protection and required-check configuration, and the least-privilege credential remain the **user's**, authorized and unperformed. The superseded statement, from `ACT-020`, read: **reviewer / gpt for TASK-041**, `LIN-INTEGRATION-AUTHORITY-REVIEW` round 1, `ready` and dispatchable now on the satisfied `review_ready(TASK-040)` edge at `5e5fc8f`. It records one verdict applied to the single relation it carries. **Only a passing TASK-041 verdict permits the Orchestrator to create the implementation and validation tasks**, which are separately owned by `runtime` and `devops` and do not exist. The further superseded statement, from `ACT-019`, read: **architect / gpt for this task**, `ready` and dispatchable now.
