---
task_id: TASK-062
title: Release merge executor remediation for the round-3 Security findings
status: ready
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
    verdict: pending
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 4
gate_status: >-
  OPEN on the TASK-063 Security relation. TASK-063 is blocked on review_ready(TASK-062) and will
  record lineage round 4 atomically across TASK-062 r1, TASK-059 r2, TASK-056 r3, and TASK-049 r4.
  The Reviewer lineage already closed at approved with no findings at round 3, so no review relation
  or Reviewer successor is created. QA round 2 remains forbidden until TASK-055 records round 1.
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
ready_reason: >-
  ACT-033 recorded TASK-061's immutable changes-required verdict and all three findings name this
  owner. The release-merge-executor lock is free. This task may remediate the three findings and
  publish a runtime-class artifact. It may not merge PR 37 or PR 33, activate or simulate the
  executor, accept risk, mutate repository policy or credentials, or self-satisfy Security.
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
