---
task_id: TASK-049
title: Integration-to-main release merge executor
status: ready
owner_role: devops
llm: claude
branch: agent/claude/devops/task-049
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-devops-task-049
write_scope:
  - scripts/release/integration-merge/**
resource_lock: null
dependencies:
  - lineage: LIN-INTEGRATION-AUTHORITY-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 3
    satisfied: true
    satisfied_at: 78359ae2e3dc6e97fb3d60f0b847b84abed08fa6
    satisfied_by: ACT-026 consuming ingress entry seq 36, class gate_verdict_recorded
    satisfied_under: TASK-047 recorded approved at LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3, applied atomically to (TASK-046, review, round 1), (TASK-042, review, round 2), and (TASK-040, review, round 3). All three relations closed together.
  - task: TASK-046
    edge: integrated
    satisfied: true
    satisfied_at: cf6333b10e628b3b61f3b7f8716b30923725067d
    satisfied_by: ACT-027 consuming ingress entry seq 37, class branch_integrated
    satisfied_under: The operator merged pull request 28 into integration/autonomous-runtime at cf6333b10e628b3b61f3b7f8716b30923725067d, mergedAt 2026-08-07T21:06:06Z. All three clauses of the integrated edge were checked individually - review_ready(TASK-046) at f148567d, its single pre_merge_gates entry review closed at approved at 78359ae2, and the branch merged into the integration branch per the approved order. This is this task's ONLY scheduling dependency besides the already-satisfied lineage gate_passed edge, which is why this record becomes ready and TASK-048 does not. SATISFYING THIS EDGE SATISFIES NO ACTIVATION PREREQUISITE AND CLEARS NO EXTERNAL BLOCKER.
required_gates:
  - review
  - security
  - qa
pre_merge_gates:
  - review
  - security
gate_tasks:
  - task: TASK-053
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-REVIEW
    lineage_round: 1
  - task: TASK-054
    gate: security
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 1
  - task: TASK-055
    gate: qa
    round: 1
    verdict: pending
    gate_class: point
    retrospective: true
    gate_lineage: LIN-RELEASE-EXECUTOR-QA
    lineage_round: 1
gate_status: >-
  OPEN on all three relations. No round of any of the three lineages has recorded a verdict, and
  none can before this task publishes. review and security are pre-merge gates and block
  integration; qa is retrospective and is registered in the aggregate and retrospective gate
  register with its reason and its recorded risk.
parent_task: TASK-001
publication_class: runtime
governance_decision_context: >-
  HUMAN-004, approved at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68 on
  human/decision/human-004-autonomous-merge, artifact
  plans/decisions/HUMAN-004-autonomous-merge-authority.md. Read the decision at that commit and
  not from any transcription. It authorizes this executor conditionally, enumerates eight
  prohibited capabilities, and states that a merge to main is explicitly NOT an irreversible
  production action unless a later approved policy deliberately couples it to one.
normative_architecture_source: >-
  docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md,
  docs/architecture/runtime/COMPONENT-BOUNDARIES.md,
  docs/architecture/runtime/INTEGRATION-STRATEGY.md, docs/adr/0042-*.md, docs/adr/0043-*.md, and
  docs/adr/0044-single-policy-result-and-two-phase-published-head-evidence.md, all read at
  f148567d716c00d7a24783318c8d6d7031492e7b, the immutable TASK-046 publication that
  LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 approved at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6. Read through Git object access at that exact
  identifier, or from integration/autonomous-runtime once TASK-046 is integrated.
activation_prerequisites: >-
  NONE OF THESE IS A SCHEDULING DEPENDENCY AND NONE IS SATISFIED BY LANDING CODE. The approved
  MergeExecutorActivationRecord requires, as immutable members - architectureReview, satisfied at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6; implementationReview, which TASK-053 alone may
  produce; implementationSecurityReview, which TASK-054 alone may produce;
  negativeCapabilityTestAttestation, which TASK-055 alone may validate; gateVocabularyCorrection,
  applied by ACT-026 to tasks/TASK-001-DEPENDENCY-GRAPH.md and to be pinned at that commit;
  requiredGitHubPolicyProfile with an immutable digest; and policyAttestorTrustRoot. Until every
  member exists and is pinned, admit returns AuthorityNotActivated and no merge side effect may
  occur. This task implements that closed behavior; it does not activate it.
external_blockers: >-
  Two, both human-controlled and neither performable from an agent/* branch. FIRST, the exact
  AGENTS.md amendment returned verbatim at
  docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md lines 577 through 604 at
  f148567d716c00d7a24783318c8d6d7031492e7b. SECOND, provisioning of the human-controlled control
  plane, including protection of main with pull-request-only updates, no force push or deletion,
  the seven required aggregate release checks pinned to their expected App sources, strict
  current-base enforcement, no bypass actors including administrators and both executor Apps, a
  repository merge-method configuration that permits an ordinary merge commit for the integration
  release pull request, the two least-privilege executor GitHub Apps and their token broker, the
  external evidence store, and the RepositoryPolicyAttestor with its pinned observer principal
  set, signing key, trust root, and revocation service. If a policy requires linear history on
  main, human governance must resolve that conflict against the selected release merge method
  before activation; an executor cannot change either. Round 3 read the live control plane and
  recorded no branch protection on main, no repository rulesets, and no provisioned attestor. This
  task must not provision, request, configure, or simulate any of it.
dormancy_contract: >-
  dormant-before-durable-merge-ingress, named normatively in
  docs/architecture/runtime/COMPONENT-BOUNDARIES.md at
  f148567d716c00d7a24783318c8d6d7031492e7b. Source may land before TASK-026 and TASK-005 complete
  only under this contract - the activation record is invalid, admit returns AuthorityNotActivated,
  and NO MERGE SIDE EFFECT MAY OCCUR. There is no operator-appended or post-merge interim
  substitute and none may be built.
review_target_base: not applicable, per the applicability rule
review_target_applicability: >-
  not applicable. This task performs no gate round and has no gate round pinned on it yet, because
  its artifact does not exist. It becomes applicable at the activation that consumes this task's
  publication, which pins the immutable target and the resolved authored-delta base for TASK-053,
  TASK-054, and TASK-055.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: >-
  applicable, declared as a reproducible expression because this task's branch does not exist yet.
  It is this task's own branch point and is unrelated to review_target_base above; findings F-403
  and A-209 require the two to stay separate fields.
scope_validation_note: >-
  TASK-046 IS NOW INTEGRATED, so this instruction is executable. Branch from
  integration/autonomous-runtime, which resolves to cf6333b10e628b3b61f3b7f8716b30923725067d as
  read at ACT-027, then resolve the immutable branch point inside the worktree with git merge-base
  HEAD integration/autonomous-runtime and pass that exact value to -BaseRef. The resolved value is
  expected to be cf6333b if the branch is created from the current head and the head has not moved,
  but it MUST be resolved inside the worktree rather than assumed from this note, because the
  integration branch is mutable and this role does not control when it moves. Record the resolved
  value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main,
  c325275, de3a8d6, f123c9a3, 49e3ff47, 8250f236, c95ce600, f148567d, or a review-diff base.
blocked_reason: >-
  NOT BLOCKED. Cleared at ACT-027. Every scheduling dependency this record declares is satisfied -
  the LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 gate_passed edge at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 since ACT-026, and integrated(TASK-046) at
  cf6333b10e628b3b61f3b7f8716b30923725067d since ACT-027. This task deliberately does NOT declare
  integrated(TASK-018): its module is a self-contained release control-plane module under
  scripts/release/**, it imports no runtime implementation and no contract root, and TASK-043
  established the precedent that a script-scoped devops task carries no toolchain edge. That
  narrower dependency set is the whole reason this record is ready while TASK-048, which declares
  three integrated() edges, is not. THE SUPERSEDED ACT-026 VALUE READ - One integrated() edge is
  unsatisfied. integrated(TASK-046) requires the operator to merge the approved
  integration-authority amendment into integration/autonomous-runtime; its gate closed at ACT-026
  and it is now integrable, but no merge has occurred and no Orchestrator activation may perform
  one. The lineage gate_passed edge IS satisfied.
readiness_qualification: >-
  READY AS A DORMANT IMPLEMENTATION ONLY, AND THAT QUALIFICATION IS THE MOST IMPORTANT SENTENCE ON
  THIS RECORD. ready here means exactly one thing - a scheduler may dispatch this task's owner to
  write source that CANNOT ACT. It does not mean this executor may run, may be activated, may be
  configured, may be credentialed, or may perform, attempt, or simulate any merge. NOT ONE
  ACTIVATION PREREQUISITE IS SATISFIED - the approved MergeExecutorActivationRecord still lacks
  implementationReview, which TASK-053 alone may produce; implementationSecurityReview, which
  TASK-054 alone may produce; negativeCapabilityTestAttestation, which TASK-055 alone may validate;
  requiredGitHubPolicyProfile with its immutable digest; and policyAttestorTrustRoot. Five of the
  seven immutable members do not exist. NOT ONE EXTERNAL CONTROL-PLANE BLOCKER IS CLEARED - the
  exact AGENTS.md amendment is unauthored and only a human may author it, main and
  integration/autonomous-runtime are both unprotected, the repository ruleset list is empty, no
  required checks are pinned to their expected App sources, no bypass-actor set is configured, the
  two least-privilege executor GitHub Apps and their token broker do not exist, the external
  evidence store does not exist, and no RepositoryPolicyAttestor with its pinned observer principal
  set, signing key, trust root, and revocation service is provisioned. Round 3 read the live
  control plane and recorded that state; ACT-027 read no policy surface and provisioned,
  configured, requested, and simulated nothing. UNDER dormancy_contract THE ACTIVATION RECORD IS
  INVALID, admit RETURNS AuthorityNotActivated, AND NO MERGE SIDE EFFECT MAY OCCUR. This record's
  own exit_condition said in advance that reaching ready never implies any of the above, and
  reaching it has not changed that.
exit_condition: >-
  DISCHARGED at ACT-027. TASK-046 is integrated into integration/autonomous-runtime at
  cf6333b10e628b3b61f3b7f8716b30923725067d with every gate in its own pre_merge_gates closed, so
  this task is now ready and dispatchable AS A DORMANT IMPLEMENTATION under dormancy_contract
  above. It is NOT active, and reaching ready did not imply and does not imply that any activation
  prerequisite or external blocker is satisfied - see readiness_qualification, which enumerates the
  five missing activation-record members and the unprovisioned control plane individually.
---

# TASK-049: Integration-to-main release merge executor

## Objective

Implement the `devops`-owned release merge executor exactly as the approved architecture defines it: a release control-plane module that, given one immutable `release-gates/v1` manifest and one immutable GitHub observation, either constructs a single ordinary merge of one admitted pull request whose head is the configured integration branch into `main`, or returns exactly one typed non-admission result — and that can do nothing else.

## Why this task exists now, and why it is separate from TASK-048

`HUMAN-004` authorizes **two** merges with **two** owners. `LIN-INTEGRATION-AUTHORITY-REVIEW` round 3 recorded `approved` at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6` and stated that "HUMAN-004 requires two separately owned tasks: the task-to-integration executor belongs to `runtime`, and the integration-to-main release executor belongs to `devops`."

The approved architecture states why the split is structural rather than organizational: release admission has **seven aggregate gate domains**, a different immutable manifest, a different GitHub identity, and authority over a different protected base. It "is a release control-plane module, not runtime business logic and not a generic Git helper", and the two authorities "are intentionally not a single executor parameterized by a target ref."

**An approval is not an activation.** The same report records that "Current live repository policy is unprovisioned, so neither executor is constructible as active today", and that the current contract "correctly fails closed while they are absent."

## Scope

- Implement the module and its nested tests under `scripts/release/integration-merge/`. That path is already inside the `devops` role's configured `write_scope`; **no role reassignment and no write-scope amendment is required.**
- Implement `ReleaseGateManifest` handling: exactly one requirement for **each** of the seven `ReleaseGateDomain` values — review, security, QA, performance, documentation, deployment, and rollback. Each requirement is evaluated with `ExecutorGateAdmissibility`, the authoritative-round rule, and `gateClass: 'aggregate'`. A missing domain, duplicate domain, point gate, open or incomplete relation set, stale round, generic formal acceptance, or non-passing verdict **refuses**. The withdrawn owner form is invalid. `gate_passed` alone is never sufficient.
- Implement the sole security exception exactly: only a security-domain `accepted_security_risk` member carrying exact immutable authorized-human `accepted-blocking-security-risk/v1` records may represent HUMAN-004's first exception. Generic formal acceptance returns `PreMergeGateNotPassing`; a Low or Medium record, an unmatched target, finding, digest, or round, a mutable ref, a missing record, an extra record, or an acceptance purporting to waive another predicate returns `SecurityRiskAcceptanceInvalid`.
- Implement release-lineage evidence handling that accepts runtime, operator, or mixed provenance **only** when every content unit carries equivalent immutable evidence, and refuses any missing, duplicate, reordered, or unverifiable unit.
- Consume a complete, fresh, plan-bound, signed `TrustedCurrentPolicyAttestation` from the separate human-controlled policy plane. **This module owns no policy-observation port**, holds no Administration or ruleset access, and is not a bypass actor.
- Implement durable receipt-backed intent before the sole mutation, exact-once recovery, reconcile-before-retry, bounded retries, and agent-owned remediation routing that creates no task.
- Implement the negative-capability surface structurally: exactly **one** pull-request merge port against `main`, with the exact expected head SHA, and **no** generic HTTP, Git ref update, `git push` to `main`, `ALLOW_MAIN_PUSH`, force, hook bypass, administrator override, required-check mutation, branch-protection or ruleset mutation, gate mutation, task-ownership mutation, or lock-release mechanism.
- Keep merge to `main` **decoupled from any irreversible production action**, per HUMAN-004's own text, unless a later approved policy deliberately records the coupling and its human authorization rule. This task must not record such a coupling.
- Provide every applicable fixture from the approved "Required evidence and validation fixtures" list, including the release manifest success fixture covering all seven domains, the exhaustive refusal table, the live protected-branch test proving this identity can only merge the integration pull request into `main` and that direct and force pushes fail, the policy-attestation fixtures, and the published-head evidence fixtures.
- Produce the `published-head-evidence/v2` two-phase bundle for this task's own publication.
- Exclude: implementing the task integration executor, which is **TASK-048**; authoring or editing `AGENTS.md`, `config/agents/settings.yaml`, `.agents/**`, `.github/**`, `.githooks/**`, `scripts/ci/**`, `scripts/quality/**`, `src/**`, `tests/**`, `tasks/**`, or any architecture document; provisioning, configuring, or requesting any control-plane or credential change; performing, requesting, or simulating any merge; and asserting that any activation prerequisite is satisfied.

## Acceptance criteria

- [ ] Every changed path is inside `scripts/release/integration-merge/**`, verified by enumerating the changed-path list. **`.github/workflows/**` is excluded even though the `devops` role is granted it**, because `AGENTS.md` reserves the baseline CI and security workflows as human-controlled paths — the same narrowing TASK-043 recorded.
- [ ] `admit` is **total** over its declared input domain and returns exactly one result member for every input, demonstrated by an exhaustive table test.
- [ ] A manifest missing any one of the seven domains, or carrying a duplicate, a point gate, a stale round, or a generic formal acceptance, is proven to construct **no** plan, **no** durable intent, and **zero** merge API calls — one test per case.
- [ ] With any activation-record member absent, unpinned, mutable, or executor-produced, `admit` returns `AuthorityNotActivated`, with each case constructed individually.
- [ ] The structural surface exposes exactly one merge port and is proven to contain no second path to `main`, enumerated against the approved negative-capability table rather than sampled.
- [ ] The module imports no runtime implementation module and no runtime contract root, proven by a static dependency test.
- [ ] The publication carries a complete two-phase `published-head-evidence/v2` bundle for the exact published head, with an absent GitHub check state recorded as an absence and never as a success.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>` reports a valid result and its output is recorded in the handoff together with the resolved branch point.
- [ ] The handoff states explicitly that the executor is **dormant**, that no activation prerequisite was satisfied by this task, and that no merge was performed, requested, or simulated.

## Expected artifacts

- `scripts/release/integration-merge/` — the release admission module, its manifest resolver, its typed result union, its durable-intent store client, its narrow GitHub merge port, and its nested tests under `scripts/release/integration-merge/tests/`.

## Write-scope isolation

`scripts/release/integration-merge/**` is disjoint from TASK-018's manifests, `scripts/quality/**`, `scripts/ci/**`, and `.github/workflows/**`; from TASK-043's `scripts/ci/**`; and from TASK-048's `src/orchestrator/integration/**` and `tests/unit/orchestrator/integration/**`. **No task in this graph declares `scripts/release/**`, so no resource lock is required or declared** — in particular this task does **not** hold `ci-toolchain`, which serializes `scripts/ci/**` alone.

## Gate and remediation path

Three gates, three separate owner roles, three separate lineages, and three separate execution contexts. **This task's owner may not perform any of them.**

| Gate | Owner | Lineage | Blocks integration |
|---|---|---|---|
| review | **TASK-053**, `reviewer` / `gpt` | `LIN-RELEASE-EXECUTOR-REVIEW` | yes |
| security | **TASK-054**, `security` / `gpt` | `LIN-RELEASE-EXECUTOR-SECURITY` | yes |
| qa | **TASK-055**, `qa` / `gemini` | `LIN-RELEASE-EXECUTOR-QA` | no — see the register |

Findings return to the Orchestrator under TASK-013; a gate owner never implements the fix and this owner never records a verdict. Publishing this task's own artifact is the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence.** The author is `devops` / `claude`; the review and security gates are `gpt` and the QA gate is `gemini`. Author and every gate owner are in different roles, different execution contexts, **and different LLM families**. TASK-053, TASK-054, and TASK-055 must additionally not run in TASK-048's, TASK-050's, TASK-051's, or TASK-052's execution context, because both executors implement one shared normative protocol and a reviewer that authored or reviewed one half is not independent of the other.

## Task-record lifecycle

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the `devops` role's configured write scope. The Orchestrator performs every transition under TASK-013.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-049 -Role devops -Llm claude`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-049 -Role devops -Llm claude` before editing.
3. Read the approved contracts at their exact identifiers through Git object access, or from `integration/autonomous-runtime` once TASK-046 is integrated.
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
5. Commit, push this task branch, and open a pull request against `integration/autonomous-runtime`. **Never push `main`, never merge anything, and never set `ALLOW_MAIN_PUSH`.**
6. Produce the two-phase published-head evidence bundle and attach it to the pull request.
7. Run `scripts/orchestration/release-task.ps1 -TaskId TASK-049 -Role devops -Llm claude`.

## Handoff

Maintained by the Orchestrator under TASK-013 from this owner's commit, pull request, and handoff.

- Commit or pull request:
- Verification:
- Known risks:
- **Created `blocked` at `ACT-026`**, on the `LIN-INTEGRATION-AUTHORITY-REVIEW` `lineage_round` 3 `approved` verdict at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6`. It is `blocked` rather than `ready` because `integrated(TASK-046)` is unsatisfied, and it must not be released until it is.
- **Transition at `ACT-027`: `blocked` → `ready`, on ingress entry `seq` 37, class `branch_integrated`.** The operator merged pull request 28 into `integration/autonomous-runtime` at **`cf6333b10e628b3b61f3b7f8716b30923725067d`**, satisfying `integrated(TASK-046)` — this record's **only** scheduling dependency besides the lineage `gate_passed` edge satisfied at `ACT-026`. All three clauses of the `integrated` edge were checked individually rather than granted on the strength of the merge existing. **`ACT-027` merged nothing and simulated nothing; it consumed the fact.**
- **THIS RECORD IS READY AS A DORMANT IMPLEMENTATION AND AS NOTHING ELSE.** No activation prerequisite is satisfied and no external control-plane blocker is cleared. **Five of the seven immutable `MergeExecutorActivationRecord` members do not exist** — `implementationReview` (TASK-053 alone), `implementationSecurityReview` (TASK-054 alone), `negativeCapabilityTestAttestation` (TASK-055 alone), `requiredGitHubPolicyProfile` with its digest, and `policyAttestorTrustRoot`. The `AGENTS.md` amendment is unauthored and only a human may author it. `main` and `integration/autonomous-runtime` are unprotected, the ruleset list is empty, and no `RepositoryPolicyAttestor` is provisioned. Under `dormancy_contract` the activation record is invalid, `admit` returns `AuthorityNotActivated`, and **no merge side effect may occur.** See `readiness_qualification`, which enumerates each one. **The owner must write source that cannot act, must not provision, request, configure, or simulate any control-plane state, and must not assert that any prerequisite is met.**
- **Why this record is `ready` and TASK-048 is not, stated because the same merge produced both outcomes.** This record declares one `integrated()` edge and TASK-048 declares three; the merge satisfied the one they share and neither of the other two. TASK-048 stays `blocked` on `integrated(TASK-018)` and `integrated(TASK-003)`.
- Next owner: **`devops` / `claude` for this task**, `ready` and dispatchable, `scripts/release/integration-merge/**`, no resource lock, branching from `integration/autonomous-runtime` at `cf6333b10e628b3b61f3b7f8716b30923725067d` with the branch point resolved inside its own worktree. The superseded `ACT-026` statement read: **Next owner: nobody yet. The operator owns the merge that satisfies `integrated(TASK-046)`** — which the operator has now performed.
