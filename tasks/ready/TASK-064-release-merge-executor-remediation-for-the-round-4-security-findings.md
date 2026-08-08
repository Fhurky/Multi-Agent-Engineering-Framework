---
task_id: TASK-064
title: Release merge executor remediation for the round-4 Security findings
status: ready
owner_role: devops
llm: gpt
branch: agent/gpt/devops/task-064
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-devops-task-064
write_scope:
  - scripts/release/integration-merge/**
resource_lock: release-merge-executor
dependencies:
  - task: TASK-063
    edge: gate_recorded
    satisfied: true
    satisfied_at: 7e610fabd663779724a94deec0046981e997f298
    satisfied_by: ACT-036 consuming ingress entry seq 50, class gate_verdict_recorded
    satisfied_under: >-
      TASK-063 recorded one changes-required verdict atomically across four Security relations and
      assigned both fresh Critical findings to devops. This edge authorizes remediation only; it
      approves no artifact, closes no gate, accepts no risk, and permits no merge or activation.
required_gates:
  - security
pre_merge_gates:
  - security
gate_tasks:
  - task: TASK-065
    gate: security
    round: 1
    verdict: pending
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 5
gate_status: >-
  OPEN on TASK-065 Security round 5. TASK-065 is blocked on review_ready(TASK-064) and will apply
  one future verdict atomically to TASK-064 r1, TASK-062 r2, TASK-059 r3, TASK-056 r4, and TASK-049
  r5. Review remains approved/closed and returned no finding, so no Reviewer successor exists. QA
  round 2 remains forbidden until TASK-055 records round 1.
integrable: false
parent_task: TASK-001
publication_class: runtime
supersedes: none
remediates:
  - report: reports/security/TASK-062-RELEASE-MERGE-EXECUTOR-SECURITY-ROUND-4.md
    at_commit: 7e610fabd663779724a94deec0046981e997f298
    recorded_by: TASK-063
    lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 4
    findings: [F-063-01, F-063-02]
finding_ownership_note: >-
  F-063-01 and F-063-02 are Critical, open, and assigned by TASK-063 to devops. They route to this
  single task because both affect one release-executor admission path, one module, one write scope,
  and one resource lock. Splitting them would create overlapping write scopes and concurrent authors
  for the same trust boundary. Neither finding is softened, reassigned, resolved, or accepted here.
blocking_security_note: >-
  Both fresh findings block delivery. TASK-063's atomic changes-required verdict remains durable and
  all four round-4 relations remain open. No authorized human acceptance exists, was requested, or
  is recorded. PRs 44, 37, and 33 remain non-integrable and the executor remains dormant.
finding_dispositions_carried: >-
  TASK-063 found F-061-01 not resolved with residue F-063-01; F-061-02 partially resolved with
  residue F-063-02; and F-061-03 partially resolved with residue F-063-01. Earlier partial findings
  remain linked to those residues exactly as the report records. Previously resolved findings and
  all passing negative fixtures must be re-derived and must not regress.
normative_architecture_source: >-
  Use approved source f148567d716c00d7a24783318c8d6d7031492e7b, approved at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6. It already requires independently controlled authority,
  immutable source evidence, protected-path completeness, a confined merge capability, and the
  HUMAN-004 prohibitions. This task implements conformance and may not amend architecture. If an
  actual contract conflict is proved, stop and return its exact clause to TASK-013.
review_lineage_note: >-
  TASK-060 approved the cumulative implementation with no findings and closed the Review lineage at
  round 3. Only Security returned fresh findings at round 4, so only TASK-065 is created. This task
  may not reopen Review or produce implementationReview.
deferred_qa_gate: >-
  No QA relation is added. LIN-RELEASE-EXECUTOR-QA round 1 at TASK-055 has no verdict, so invariant 8
  forbids round 2. This is a deferred obligation, not a passing result or activation permission.
governance_decision_context: >-
  HUMAN-004 at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68 remains the authority boundary. This task may
  not mutate policy, credentials, governance, branch protection, rulesets, or human acceptance.
review_target_base: d63864bcb25fc8897b21c09f8f687e390f85808d
review_target_applicability: >-
  TASK-065 must assess the complete executor from TASK-049's immutable pre-lineage base, not only
  this remediation delta, so all five Security rounds remain comparable.
branch_point_of: agent/gpt/devops/task-062
scope_validation_base: 19e75e996e8e116f74b4f8feb363ef13438a42b9
scope_validation_applicability: >-
  Applicable and resolved. Create this branch from exact published TASK-062 head
  19e75e996e8e116f74b4f8feb363ef13438a42b9 so the remediation reaches the judged artifact by true
  ancestry. Do not merge integration/autonomous-runtime or another implementation branch into it.
scope_validation_note: >-
  Verify git merge-base HEAD agent/gpt/devops/task-062 equals the literal ancestry base above and run
  validate-write-scope.ps1 with that exact BaseRef. Only scripts/release/integration-merge/** may
  change.
ready_reason: >-
  ACT-036 consumed TASK-063's immutable report and both fresh findings name this owner. The
  release-merge-executor lock is free. This task may remediate only those findings and publish a
  runtime-class artifact; it may not merge, approve, activate, accept risk, or mutate policy.
exit_condition: >-
  Publish an immutable runtime-class target by true ancestry from 19e75e996e8e116f74b4f8feb363ef13438a42b9,
  with the exact origin ref, an open non-draft pull request to integration/autonomous-runtime,
  exact-head checks, clean scope evidence, and normal task and resource-lock release.
---

# TASK-064: Release merge executor remediation for the round-4 Security findings

## Objective

Remediate F-063-01 and F-063-02 in the dormant release merge executor without widening its authority or changing the approved architecture.

## Scope

- Move composition and seal issuance behind an independently controlled runtime or host boundary that release-control application code cannot import or invoke.
- Ensure application code receives only an externally issued nominal capability bound to independently provisioned authority and merge objects.
- Resolve the complete exact base-to-head diff through an independently authenticated immutable source and bind producer identity, artifact identity, canonical entries, pagination, renames, deletions, and completeness.
- Reject direct-import capability minting, caller authenticators, nonexistent evidence objects, omitted protected paths, truncated pagination, base/head substitution, and self-consistent fabricated receipts.
- Preserve policy-control checks, dormant execution, narrow merge capability, retry/deadline behavior, durable evidence, prior resolved findings, and all existing negative fixtures.
- Exclude architecture, governance, task records, reports, workflows, credentials, repository policy, control-plane provisioning, risk acceptance, pull-request operations, and any path outside the declared module.

## Acceptance criteria

- [ ] Application code cannot import or invoke the capability issuer or supply its authenticator, authority resolver, or concrete merge port.
- [ ] Admission accepts only a capability issued and bound by the independently controlled host/runtime boundary.
- [ ] Immutable diff evidence is independently resolved for the exact base/head and proves a complete canonical path universe.
- [ ] The two exact TASK-063 counterexamples and all required negative variants fail closed before intent or merge mutation.
- [ ] The complete module suite passes, prior resolved findings do not regress, and all live fixtures remain explicitly unexecuted rather than passing.
- [ ] Publication evidence records the exact commit, true ancestry, origin ref, pull request, exact-head checks, authored scope, clean worktree, and normal lock release.
- [ ] TASK-065 alone performs Security round 5; this owner records no verdict, acceptance, activation member, approval, or merge.

## Expected artifacts

- Remediated source and tests under `scripts/release/integration-merge/**` only.

## Handoff

- Commit or pull request: publish `agent/gpt/devops/task-064` to `integration/autonomous-runtime`; do not modify or merge PRs 44, 37, or 33.
- Verification: exact counterexamples, module suite, repository security, diff and write-scope checks, true ancestry, and exact-head publication evidence.
- Known risks: F-063-01 and F-063-02 remain Critical and unaccepted until TASK-065 records a passing Security verdict.
- Next owner: TASK-065, Security/GPT, in a separate execution context after TASK-013 binds the immutable publication.
