---
task_id: TASK-048
title: Post-gate task integration executor
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-048
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-048
write_scope:
  - src/orchestrator/integration/**
  - tests/unit/orchestrator/integration/**
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
    satisfied_under: The operator merged pull request 28 into integration/autonomous-runtime at cf6333b10e628b3b61f3b7f8716b30923725067d, mergedAt 2026-08-07T21:06:06Z. All three clauses of the integrated edge were checked individually - review_ready(TASK-046) at f148567d, its single pre_merge_gates entry review closed at approved at 78359ae2, and the branch merged into the integration branch. THIS EDGE BEING SATISFIED DOES NOT MAKE THIS TASK READY - two further integrated() edges remain false.
  - task: TASK-018
    edge: integrated
    satisfied: false
  - task: TASK-003
    edge: integrated
    satisfied: false
required_gates:
  - review
  - security
  - qa
pre_merge_gates:
  - review
  - security
gate_tasks:
  - task: TASK-050
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-TASK-INTEGRATION-EXECUTOR-REVIEW
    lineage_round: 1
  - task: TASK-051
    gate: security
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-TASK-INTEGRATION-EXECUTOR-SECURITY
    lineage_round: 1
  - task: TASK-052
    gate: qa
    round: 1
    verdict: pending
    gate_class: point
    retrospective: true
    gate_lineage: LIN-TASK-INTEGRATION-EXECUTOR-QA
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
  plans/decisions/HUMAN-004-autonomous-merge-authority.md. Read the decision at that commit. Do
  not read it from TASK-040's, TASK-042's, or TASK-046's transcription, from this record, or from
  any round report. The decision authorizes this executor conditionally and enumerates eight
  prohibited capabilities and a finite three-member residual human exception set.
normative_architecture_source: >-
  docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md,
  docs/architecture/runtime/COMPONENT-BOUNDARIES.md,
  docs/architecture/runtime/INTEGRATION-STRATEGY.md, docs/adr/0042-*.md, docs/adr/0043-*.md, and
  docs/adr/0044-single-policy-result-and-two-phase-published-head-evidence.md, all read at
  f148567d716c00d7a24783318c8d6d7031492e7b, the immutable TASK-046 publication that
  LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 approved at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6. The underlying runtime architecture is the
  LIN-ARCH-REVIEW lineage_round 8 approved source 8ea5c32789ee01fd4a2cec4aff13905b120edae3,
  integrated at de3a8d6ae74a0db423e07cfde5f7b251326d8249. Read both through Git object access at
  those exact identifiers, or from integration/autonomous-runtime once TASK-046 is integrated.
activation_prerequisites: >-
  NONE OF THESE IS A SCHEDULING DEPENDENCY AND NONE IS SATISFIED BY LANDING CODE. The approved
  MergeExecutorActivationRecord requires, as immutable members - architectureReview, satisfied at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6; implementationReview, which TASK-050 alone may
  produce; implementationSecurityReview, which TASK-051 alone may produce;
  negativeCapabilityTestAttestation, which TASK-052 alone may validate; gateVocabularyCorrection,
  applied by ACT-026 to tasks/TASK-001-DEPENDENCY-GRAPH.md and to be pinned at that commit;
  requiredGitHubPolicyProfile with an immutable digest; and policyAttestorTrustRoot. Until every
  member exists and is pinned, admit returns AuthorityNotActivated and no merge side effect may
  occur. This task implements that closed behavior; it does not activate it and may not assert
  that it has.
external_blockers: >-
  Two, both human-controlled, both outside every agent role's write scope, and neither performable
  from an agent/* branch. FIRST, the exact AGENTS.md amendment returned verbatim at
  docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md lines 577 through 604 at
  f148567d716c00d7a24783318c8d6d7031492e7b. AGENTS.md is a governance and enforcement path.
  SECOND, provisioning of the human-controlled control plane - branch protection on main and on
  integration/autonomous-runtime with pull-request-only updates, no force push or deletion,
  required checks pinned to their expected App sources, strict current-base enforcement and no
  bypass actors including administrators and both executor Apps; repository merge methods; the
  seven required aggregate release checks on main; the two least-privilege executor GitHub Apps
  and their token broker; the external evidence store; and the RepositoryPolicyAttestor with its
  pinned policy-observer principal set, signing key, trust root, and revocation service. Round 3
  read the live control plane and recorded no branch protection on either branch, no repository
  rulesets, and no provisioned attestor. This task must not provision, request, configure, or
  simulate any of it.
dormancy_contract: >-
  dormant-before-durable-merge-ingress, named normatively in
  docs/architecture/runtime/COMPONENT-BOUNDARIES.md at
  f148567d716c00d7a24783318c8d6d7031492e7b. Source may land before TASK-026 and TASK-005 complete
  only under this contract - the activation record is invalid, admit returns AuthorityNotActivated,
  and NO MERGE SIDE EFFECT MAY OCCUR. There is no operator-appended or post-merge interim
  substitute and none may be built. The separate interim-operator-authorized bootstrap contract is
  bounded to TASK-013 dispatch and is neither reused nor widened here.
review_target_base: not applicable, per the applicability rule
review_target_applicability: >-
  not applicable. This task performs no gate round and has no gate round pinned on it yet, because
  its artifact does not exist. It becomes applicable at the activation that consumes this task's
  publication, which pins the immutable target and the resolved authored-delta base for TASK-050,
  TASK-051, and TASK-052. Recording a base for a delta that does not exist would be an invention,
  which is the second value form under Task baselines rather than this one.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: >-
  applicable, declared as a reproducible expression because this task's branch does not exist yet.
  It is this task's own branch point and is unrelated to review_target_base above; findings F-403
  and A-209 require the two to stay separate fields.
scope_validation_note: >-
  Branch from integration/autonomous-runtime AFTER TASK-046 and TASK-018 are integrated, then
  resolve the immutable branch point inside the worktree with
  git merge-base HEAD integration/autonomous-runtime and pass that exact value to -BaseRef. Record
  the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass
  origin/main, c325275, de3a8d6, f123c9a3, 49e3ff47, c95ce600, f148567d, or a review-diff base.
blocked_reason: >-
  TWO of three integrated() edges are unsatisfied, down from three at ACT-026, and this record
  stays blocked. integrated(TASK-046) IS NOW SATISFIED at cf6333b10e628b3b61f3b7f8716b30923725067d,
  consumed as ingress entry seq 37 at ACT-027 - the operator merged pull request 28 and the
  approved integration-authority amendment is on integration/autonomous-runtime. That changes this
  record's dependency state and NOT its lifecycle state. integrated(TASK-018) requires the runtime
  toolchain, whose review gate TASK-019 has recorded no verdict at any round and whose pull request
  20 must not be merged before it does; nothing about that changed at ACT-027. integrated(TASK-003)
  requires the durable state contracts under src/orchestrator/state/contracts/ that this module
  imports read-only, and TASK-003 is itself blocked; nothing about that changed either. The lineage
  gate_passed edge IS satisfied and has been since ACT-026. ONE EDGE MOVED AND THIS RECORD DID NOT,
  which is stated rather than left to arithmetic, and it is the reason TASK-049 became ready at the
  same activation while this record did not - TASK-049 declares integrated(TASK-046) as its only
  scheduling dependency and this record declares three.
exit_condition: >-
  TASK-018 and TASK-003 are each integrated into integration/autonomous-runtime, each with every
  gate in its own pre_merge_gates closed. TASK-046 already is, at
  cf6333b10e628b3b61f3b7f8716b30923725067d, so that clause of this condition is discharged and the
  remaining two are not. At that point this task is ready and dispatchable AS A DORMANT
  IMPLEMENTATION under dormancy_contract above. It is NOT then active, and reaching ready never
  implies that any activation prerequisite or external blocker is satisfied.
---

# TASK-048: Post-gate task integration executor

## Objective

Implement the `runtime`-owned post-gate task integration executor exactly as the approved architecture defines it: a module that, given one immutable repository tree and one immutable GitHub observation, either constructs a single squash-merge of one admitted task pull request into the configured integration branch or returns exactly one typed non-admission result — and that can do nothing else.

## Why this task exists now and did not exist before

`HUMAN-004` authorized this executor **conditionally** on 2026-08-05 and its own fourth sequencing step forbids implementation until the architecture amendment is independently approved. `LIN-INTEGRATION-AUTHORITY-REVIEW` rounds 1 and 2 each recorded `changes-required` and each **explicitly denied implementation authorization**. Round 3 recorded **`approved`** at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6`, stating in its own words that "Implementation tasks may now be created, after the Orchestrator records this atomic verdict" and that "HUMAN-004 requires two separately owned tasks: the task-to-integration executor belongs to `runtime`, and the integration-to-main release executor belongs to `devops`."

**This record is that first task, and it is one of two.** It is deliberately not a component parameterized by a target ref: the two authorities have different credentials, different admission predicates, different protected bases, and different owner roles, and the approved architecture states that they "are intentionally not a single executor parameterized by a target ref."

**An approval is not an activation, and this record does not present it as one.** The same report that permits this task states that "This approval does not activate either executor" and that "Current live repository policy is unprovisioned, so neither executor is constructible as active today." The `activation_prerequisites` and `external_blockers` fields above carry that unchanged.

## Scope

- Implement the module at `src/orchestrator/integration/`, with its unit tests at `tests/unit/orchestrator/integration/`. Both paths are already inside the `runtime` role's configured `write_scope`; **no role reassignment and no write-scope amendment is required, and requesting one is a scope error.**
- Implement `TaskIntegrationAdmissionInput` construction from **one immutable repository tree and one immutable GitHub observation**. The target's own lossless task record is the sole source of its publication class, publication, branch, dependencies, `pre_merge_gates`, gate relations, security evidence links, integration-order position, and merge declaration. Values supplied by a command line or a pull-request description are comparisons only and **never** override the record.
- Implement `ExecutorGateAdmissibility` with the ordered, total, disjoint classifier the amendment specifies. The `passing` member requires the authoritative verdict itself to be passing **and** every relation in its atomic set to be closed. The only alternative is HUMAN-004's first exception: an explicitly `formally_accepted` authoritative **security** state carrying exactly one valid immutable authorized-human `accepted-blocking-security-risk/v1` record for **every** matching unresolved blocking High or Critical finding and **no** record for anything else, each bound byte-for-byte to the same target, security lineage, round, verdict, finding ID, severity, evidence digest, and acceptance scope.
- Implement `classifyPolicyControl` as **one ordered function** over normalized `PolicyControlFacts` such that every input in the closed policy-control domain selects **exactly one** `MergeAdmissionResult` member. A verified credential or repository-policy action always selects HUMAN-004's third exception; an operational observation failure selects `PolicyObservationUnavailable` **only** when credential and repository-policy action are conclusively excluded; an unknown cause selects the single unclassifiable candidate-third exception. `PolicyDrift` is not a competing refusal code.
- Implement the trusted-attestation consumption path: the executor accepts a complete, fresh, plan-bound, Ed25519-signed `TrustedCurrentPolicyAttestation` from the separate human-controlled policy plane and **owns no policy-observation port of any kind.** A missing or permission-redacted `bypass_actors` is never an empty set.
- Implement durable, receipt-backed, append-only intent **before** the sole external mutation, and the exact-once recovery rule: reconcile before retry, adopt only an exact verified result, and let `OutcomeUnknown` prevent a blind second call.
- Implement the negative-capability surface as a structural property, not a runtime check: one pull-request merge port and **no** generic HTTP, Git ref update, `git push`, `ALLOW_MAIN_PUSH`, force, hook-bypass, administrator, required-check, deployment, secret, gate-writing, lock-release, task-ownership, or policy-bypass mechanism.
- Publish the verified terminal result for **TASK-026's** authorized result adapter, and consume nothing else. This module has **no scheduler, no inbox, no journal, and no self-trigger capability**, and it never appends its own ingress fact.
- Provide every fixture in the approved "Required evidence and validation fixtures" list — success fixtures, the exhaustive admission table, the mandatory F-041-01 counterexample asserting `PreMergeGateNotPassing` with no `MergePlan`, no durable intent, and zero merge API calls, the F-044-01 policy-control counterexamples, head/base race tests, failure injection, idempotency, static allow-list tests, live protected-branch tests, result-adapter recovery tests, release-lineage fixtures where applicable, policy-attestation fixtures, the attestor boundary test, and published-head evidence fixtures.
- Produce the `published-head-evidence/v2` two-phase bundle for this task's own publication, under the same obligation TASK-046 discharged. The author phase runs after the final authored content commit; the control phase runs after publication.
- Exclude: implementing the release merge executor, which is **TASK-049**; authoring or editing `AGENTS.md`, `config/agents/settings.yaml`, `.agents/**`, `.github/**`, `.githooks/**`, `scripts/**`, `tasks/**`, or any architecture document; provisioning, configuring, or requesting any GitHub control-plane or credential change; performing, requesting, or simulating any merge; creating any task; and asserting that any activation prerequisite is satisfied.

## Acceptance criteria

- [ ] Every changed path is inside `src/orchestrator/integration/**` or `tests/unit/orchestrator/integration/**`, verified by enumerating the changed-path list rather than by inference.
- [ ] `admit` is **total** over its declared input domain and returns exactly one `MergeAdmissionResult` member for every input, demonstrated by an exhaustive table test rather than asserted.
- [ ] Every non-admission path is proven to construct **no** `MergePlan`, **no** durable intent, and **zero** merge API calls.
- [ ] With any activation-record member absent, unpinned, mutable, or executor-produced, `admit` returns `AuthorityNotActivated`, and a test constructs each of those cases individually.
- [ ] The static dependency, command, environment, permission, and endpoint allow-list tests pass for **every** negative capability in the approved table, and the test enumerates the table rather than sampling it.
- [ ] The module exposes no policy-observation port and no second mutation path, proven structurally rather than by convention.
- [ ] The module imports `src/orchestrator/state/contracts/` read-only and imports no scheduler, inbox, journal, or workspace push path.
- [ ] The publication carries a complete two-phase `published-head-evidence/v2` bundle for the exact published head, with both phases, all mandatory per-command fields, the three-ref no-later-content proof, and the exact-head GitHub check state recorded truthfully — an absence recorded as an absence.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>` reports a valid result and its output is recorded in the handoff together with the resolved branch point.
- [ ] The handoff states explicitly that the executor is **dormant**, that no activation prerequisite was satisfied by this task, and that no merge was performed, requested, or simulated.

## Expected artifacts

- `src/orchestrator/integration/` — the executor module, its admission and classification functions, its typed result union, its durable-intent store client, and its narrow GitHub merge port.
- `tests/unit/orchestrator/integration/` — the fixtures and allow-list tests named above.

## Write-scope isolation

`src/orchestrator/integration/**` and `tests/unit/orchestrator/integration/**` are disjoint from TASK-003's `state/`, TASK-004's `src/agents/**`, TASK-005's `scheduling/`, TASK-006's `supervisor/`, TASK-007's `lifecycle/`, TASK-008's `recovery/`, TASK-017's `workspace/`, TASK-026's `ingress/`, TASK-018's manifests and `scripts/**`, and TASK-049's `scripts/release/integration-merge/**`. **No resource lock is required or declared.**

## Gate and remediation path

Three gates, three separate owner roles, three separate lineages, and three separate execution contexts. **This task's owner may not perform any of them.**

| Gate | Owner | Lineage | Blocks integration |
|---|---|---|---|
| review | **TASK-050**, `reviewer` / `gpt` | `LIN-TASK-INTEGRATION-EXECUTOR-REVIEW` | yes |
| security | **TASK-051**, `security` / `gpt` | `LIN-TASK-INTEGRATION-EXECUTOR-SECURITY` | yes |
| qa | **TASK-052**, `qa` / `gemini` | `LIN-TASK-INTEGRATION-EXECUTOR-QA` | no — see the register |

Findings return to the Orchestrator under TASK-013, which routes remediation and creates the next round; a gate owner never implements the fix and this owner never records a verdict. Publishing this task's own artifact is the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence.** The author is `runtime` / `claude`; the review and security gates are `gpt` and the QA gate is `gemini`. Author and every gate owner are in different roles, different execution contexts, **and different LLM families** — the repository's preferred separation, which `LIN-INTEGRATION-AUTHORITY-REVIEW` and `LIN-ARCH-REVIEW` have not had since `HUMAN-003`. No script enforces execution-context separation.

## Task-record lifecycle

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the `runtime` role's configured write scope. The Orchestrator performs every transition under TASK-013.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-048 -Role runtime -Llm claude`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-048 -Role runtime -Llm claude` before editing.
3. Read the approved contracts at their exact identifiers through Git object access, or from `integration/autonomous-runtime` once TASK-046 is integrated. **Do not merge an unintegrated branch into this one to assemble the sources.**
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
5. Commit, push this task branch, and open a pull request against `integration/autonomous-runtime`. **Never push `main`, never merge anything, and never set `ALLOW_MAIN_PUSH`.**
6. Produce the two-phase published-head evidence bundle and attach it to the pull request.
7. Run `scripts/orchestration/release-task.ps1 -TaskId TASK-048 -Role runtime -Llm claude`.

## Handoff

Maintained by the Orchestrator under TASK-013 from this owner's commit, pull request, and handoff.

- Commit or pull request:
- Verification:
- Known risks:
- **Created `blocked` at `ACT-026`**, on the `LIN-INTEGRATION-AUTHORITY-REVIEW` `lineage_round` 3 `approved` verdict at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6` — **the first implementation task in this graph ever authorized by a passing gate of the lineage that gates it.** It is `blocked` rather than `ready` because three `integrated()` edges are unsatisfied, and it must not be released until all three are.
- **One dependency satisfied at `ACT-027` and the record did not move.** `integrated(TASK-046)` became satisfied at `cf6333b10e628b3b61f3b7f8716b30923725067d`, ingress entry `seq` 37, class `branch_integrated`, when the operator merged pull request 28. All three clauses of that edge were checked individually rather than granted on the strength of the merge existing. **`integrated(TASK-018)` and `integrated(TASK-003)` remain `false`, so this record stays `blocked`** and its `blocked_reason` was rewritten to name only the two that remain. **This is the deliberate contrast with TASK-049**, which declares `integrated(TASK-046)` as its only scheduling dependency and became `ready` at the same activation: one merge, two records, two different outcomes, because the dependency sets differ. **Nothing else about this record changed** — no scope, acceptance criterion, gate relation, activation prerequisite, external blocker, or dormancy clause.
- Next owner: still nobody. `reviewer` / `gpt` owns TASK-019, whose verdict is the first step toward `integrated(TASK-018)`, and the operator would then own the merge of pull request 20; TASK-003 is itself blocked behind the toolchain. The superseded `ACT-026` statement additionally named the operator's merge for `integrated(TASK-046)`, which has now happened.
