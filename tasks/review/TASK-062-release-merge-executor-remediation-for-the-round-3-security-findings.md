---
task_id: TASK-062
title: Release merge executor remediation for the round-3 Security findings
status: review
owner_role: devops
llm: gpt
branch: agent/gpt/devops/task-062
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-devops-task-062
write_scope:
  - scripts/release/integration-merge/**
resource_lock: release-merge-executor
dependencies:
  - task: TASK-061
    edge: gate_recorded
    satisfied: true
    satisfied_at: 17cdf4f040f7b0e89ad51f9db40d67f7ae11a615
    satisfied_by: ACT-033 consuming ingress entry seq 47, class gate_verdict_recorded
    satisfied_under: >-
      TASK-061 recorded one changes-required verdict atomically across the TASK-059, TASK-056, and
      TASK-049 Security relations and assigned all three fresh findings to devops. This dependency
      authorizes remediation only. It does not approve, integrate, activate, or accept risk.
required_gates:
  - security
pre_merge_gates:
  - security
gate_tasks:
  - task: TASK-063
    gate: security
    round: 1
    verdict: changes-required
    verdict_recorded_at: 7e610fabd663779724a94deec0046981e997f298
    remediated_by: TASK-064
    revalidated_by: TASK-065
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 4
  - task: TASK-065
    gate: security
    round: 2
    verdict: pending
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 5
gate_status: >-
  TASK-063 recorded changes-required at ACT-036, so this record's round-1 relation remains OPEN.
  ACT-037 binds TASK-065 Security round 5 to exact TASK-064 target 610716a and makes its owner ready;
  this record's round-2 relation remains open and pending inside the five-member Security cohort.
  F-063-01 and F-063-02 are Critical, open, blocking, DevOps-owned, and unaccepted. Review remains
  approved/closed with no successor. QA round 2 remains forbidden until TASK-055 records round 1.
integrable: false
parent_task: TASK-001
publication_class: runtime
supersedes: none
remediates:
  - report: reports/security/TASK-059-RELEASE-MERGE-EXECUTOR-SECURITY-ROUND-3.md
    at_commit: 17cdf4f040f7b0e89ad51f9db40d67f7ae11a615
    recorded_by: TASK-061
    lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 3
    findings: [F-061-01, F-061-02, F-061-03]
finding_ownership_note: >-
  F-061-01, F-061-02, and F-061-03 are Critical, open, and assigned by TASK-061 to devops. They
  route to exactly this one remediation task because they share one owner, one module, one declared
  scope, and one resource lock. Splitting them would create overlapping write scopes and divide one
  admission path between concurrent owners. No finding is merged, softened, reassigned, or accepted.
blocking_security_note: >-
  All three fresh findings block delivery until resolved or formally accepted by an authorized
  human. No acceptance exists, was requested, or is recorded. TASK-061's changes-required verdict
  remains durable and all three round-3 Security relations remain open while remediation proceeds.
normative_architecture_source: >-
  The approved source is f148567d716c00d7a24783318c8d6d7031492e7b, approved at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6. Its normative release-executor contract already
  requires a separately controlled RepositoryPolicyAttestor, an opaque broker capability rather
  than a raw or generic client, an immutable PR diff checked against protected paths, complete
  classic-protection and ruleset observations, pull-request-only updates, strict current-base
  enforcement, administrator enforcement, force-push and deletion prohibition, an empty effective
  bypass set, and a normalized effective-policy digest. ACT-033 therefore routes implementation
  conformance and creates no Architect amendment task. If this owner proves a required remedy is
  genuinely inexpressible under that exact contract, it must stop and return the exact conflicting
  clause to the Orchestrator; it may not edit architecture or continue on an assumption.
review_lineage_note: >-
  TASK-060 recorded approved with no findings at fa766a2401bcafa663f1eee32f4363325d145c5c and
  closed all three review relations. The repository findings-return contract requires the validating
  role that returned findings to revalidate its remediation in a new round. Only Security returned
  findings here, so TASK-063 is the only new gate task. This task may not reopen Review or produce
  implementationReview.
deferred_qa_gate: >-
  No QA relation is added. LIN-RELEASE-EXECUTOR-QA round 1 at TASK-055 over the older TASK-049
  target has no verdict, so invariant 8 forbids round 2. This is a deferred obligation, not approval
  or activation permission.
governance_decision_context: >-
  HUMAN-004 at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68. Read
  plans/decisions/HUMAN-004-autonomous-merge-authority.md at that exact commit.
review_target_base: d63864bcb25fc8897b21c09f8f687e390f85808d
review_target_applicability: >-
  Applicable to the cumulative Security round that follows publication. TASK-063 must assess the
  complete release executor from TASK-049's immutable pre-lineage base, not only this correction.
branch_point_of: agent/gpt/devops/task-059
scope_validation_base: 126f2fa9939b8ac6db4764241952dafbda50e9f4
scope_validation_applicability: >-
  Applicable and resolved. Create this branch from the exact published TASK-059 head so the
  remediation reaches the judged artifact by true ancestry. Do not merge integration/autonomous-runtime
  or another implementation branch into it.
scope_validation_note: >-
  Resolve and verify the branch point inside the isolated worktree with git merge-base HEAD
  agent/gpt/devops/task-059, then pass 126f2fa9939b8ac6db4764241952dafbda50e9f4 to
  validate-write-scope.ps1 -BaseRef. Only scripts/release/integration-merge/** may change.
published_commit: 19e75e996e8e116f74b4f8feb363ef13438a42b9
published_branch: agent/gpt/devops/task-062
published_remote_ref: refs/heads/agent/gpt/devops/task-062
pull_request: https://github.com/Fhurky/Multi-Agent-Engineering-Framework/pull/44
publication: published
publication_note: >-
  ACT-035 independently satisfied all runtime publication conditions: the immutable target equals
  the local branch, origin tracking ref, git ls-remote result, and open non-draft PR 44 head against
  integration/autonomous-runtime. PR 44 is unmerged and remains non-integrable pending TASK-063.
review_target_commit: 19e75e996e8e116f74b4f8feb363ef13438a42b9
review_target_commit_note: >-
  Bound by ACT-035 to the exact four-commit owner publication over immutable ancestry base
  126f2fa9939b8ac6db4764241952dafbda50e9f4. The binding is an immutable commit, never a moving ref.
authored_delta: >-
  21 paths, all under scripts/release/integration-merge/**, from
  126f2fa9939b8ac6db4764241952dafbda50e9f4 to the exact target; zero residue and zero deleted paths.
cumulative_review_delta: >-
  46 paths, all under scripts/release/integration-merge/**, from immutable review base
  d63864bcb25fc8897b21c09f8f687e390f85808d to the exact target; zero residue.
publication_evidence:
  activation: ACT-035
  ingress_seq: 49
  ingress_class: artifact_published
  fact_id: 1c3b87f884a4b2bd04bef7e64ac21574390ec8d094ecf7b140ca0f1625184c71
  source_path: scripts/release/integration-merge/index.ts
  source_bytes: 7174
  content_hash: a1f9ed319a92a790e466a5faf4c3ab4c5ada28af6e28b9f50f4c87c89da79b72
  commits_over_ancestry_base: 4
  target_commit: 19e75e996e8e116f74b4f8feb363ef13438a42b9
  ancestry_base: 126f2fa9939b8ac6db4764241952dafbda50e9f4
  review_base: d63864bcb25fc8897b21c09f8f687e390f85808d
  pull_request: 44
  pull_request_state: OPEN, non-draft, MERGEABLE / CLEAN, unmerged
  exact_head_checks:
    - CI / validate, check-run 93134943882, success
    - Security / security, check-run 93134943987, success
  authored_delta: 21 paths, all under scripts/release/integration-merge/**
  cumulative_review_delta: 46 paths, all under scripts/release/integration-merge/**
  module_suite: 548 declared, 537 passed, 0 failed, 0 skipped, 11 explicitly unexecuted live fixtures
  lock_release: normal; TASK-062 and release-merge-executor locks absent, owner worktree clean and exact
integrability_note: >-
  TASK-063 recorded changes-required. F-063-01 and F-063-02 remain Critical, open, blocking, and
  unaccepted. PRs 44, 37, and 33 remain open and MUST NOT be merged. The verdict closes no gate,
  activates no executor, and accepts no risk.
---

# TASK-062: Release merge executor remediation for the round-3 Security findings

## Objective

Remediate F-061-01, F-061-02, and F-061-03 in the dormant release merge executor without widening its capability surface or changing the approved architecture.

## Scope

- Establish a composition root or nominal capability the release-control caller cannot construct; independently authenticate the authority resolver and concrete merge client; bind the negative-capability evidence to the actual callable broker instance.
- Resolve the complete changed-path set from an authenticated immutable Git or pull-request boundary keyed by exact base and head OIDs; bind canonical bytes, digest, completeness, pagination, renames, and deletions into the admission universe.
- Encode every required branch-protection and ruleset semantic in the immutable required profile; represent full parameters and applicability; independently derive the normalized effective-control evaluation and digest from signed enumerated observations.
- Add the exact malicious same-identity resolver/port counterexample, omitted-protected-path counterexample, and signed missing/weakened/non-applicable/redacted policy-control counterexamples required by TASK-061.
- Preserve all previously resolved findings and the existing dormancy, exact-once recovery, retry-deadline, canonicalization, protected capability, and no-second-path properties.
- Exclude architecture, governance, task records, reports, workflows, credentials, repository policy, branch protection, rulesets, control-plane provisioning, risk acceptance, pull-request operations, and any source outside the declared module.

## Acceptance criteria

- [ ] Each fresh finding has a distinct code-and-test remedy that reconstructs TASK-061's counterexample and fails closed before intent or merge mutation.
- [ ] The concrete resolver and merge capability cannot self-authenticate through caller-supplied labels, digests, structural objects, or evidence returned by the resolver under validation.
- [ ] Protected-path admission is derived from an authenticated complete immutable diff and rejects omissions, incomplete pagination, ambiguous renames/deletions, or base/head mismatch.
- [ ] The normalized effective policy evaluation proves every HUMAN-004 branch control and rejects every missing, weakened, non-applicable, redacted, or bypass-bearing case.
- [ ] The complete module suite passes with every live fixture reported as unexecuted rather than passing, and no previously resolved finding regresses.
- [ ] The published commit, exact origin ref, open non-draft pull request, exact-head checks, authored scope, branch point, and clean worktree are recorded for TASK-013.
- [ ] TASK-063 alone performs the independent Security revalidation; this task records no verdict, acceptance, activation member, approval, or merge.

## Expected artifacts

- Remediated files and tests under `scripts/release/integration-merge/**` only.

## Handoff

- Commit or pull request: publish from `agent/gpt/devops/task-062` against `integration/autonomous-runtime`; do not modify or merge PR 37 or PR 33.
- Verification: module suite, exact counterexamples, repository security check, diff check, remote/head/PR/check evidence, and write-scope validation.
- Known risks: three Critical findings remain blocking until TASK-063 records a passing verdict; live control-plane fixtures remain unexecuted; the executor remains dormant.
- Next owner: TASK-063, Security, in a separate execution context.
- **ACT-035 publication routing.** This record moved `ready` to `review` on ingress `seq` 49,
  class `artifact_published`, exact target `19e75e996e8e116f74b4f8feb363ef13438a42b9`, fact
  `1c3b87f884a4b2bd04bef7e64ac21574390ec8d094ecf7b140ca0f1625184c71`. The runtime publication
  conditions and the 21-path authored scope were independently verified. The exact-target archive
  suite reproduced 548 declared / 537 passed / 0 failed / 11 explicitly unexecuted live fixtures.
- **No gate effect.** Owner evidence claims remedies for F-061-01 through F-061-03; only TASK-063
  may disposition them. Security remains open, the executor remains dormant, no risk is accepted,
  and PRs 44, 37, and 33 remain unmerged and non-integrable.
- Next owner: **TASK-063**, `security` / `gpt`, now `ready` in a separate execution context at fixed
  branch point `d7994690b40a4a29218c46b9e0c7bd234a56ceff`, assessing exact target `19e75e99...`
  over cumulative base `d63864bcb25fc8897b21c09f8f687e390f85808d` across its four-relation cohort.
- **ACT-036 Security routing.** TASK-063 recorded one atomic `changes-required` verdict at
  `7e610fabd663779724a94deec0046981e997f298`. This record's round-1 relation remains open; TASK-065
  adds its pending round-2 relation. F-063-01 and F-063-02 route together to TASK-064.
- Next owners: **TASK-064**, `devops` / `gpt`, then **TASK-065**, `security` / `gpt`, in a separate
  context after TASK-064 publishes. PRs 44, 37, and 33 remain forbidden.
- **ACT-037 publication routing.** TASK-064 published exact target
  `610716aabc9a6cdf455fe45c32c88eeb20caa588`; TASK-065 is now `ready` and carries this record's
  pending Security round-2 relation. No verdict or finding disposition changed. This record remains
  `review` and `integrable: false`; PRs 48, 44, 37, and 33 remain open, unmerged, and forbidden.
- Next owner: **TASK-065**, `security` / `gpt`, in a separate execution context over the immutable
  five-member cohort. Review remains closed and QA remains deferred.
