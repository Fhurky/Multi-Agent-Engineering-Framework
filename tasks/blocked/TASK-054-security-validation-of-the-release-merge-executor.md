---
task_id: TASK-054
title: Security validation of the integration-to-main release merge executor
status: blocked
owner_role: security
llm: gpt
branch: agent/gpt/security/task-054
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-security-task-054
write_scope:
  - reports/security/TASK-049-RELEASE-MERGE-EXECUTOR-SECURITY.md
resource_lock: null
dependencies:
  - task: TASK-049
    edge: review_ready
    satisfied: false
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-049
    gate: security
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 1
parent_task: TASK-001
publication_class: bootstrap
governance_decision_context: >-
  HUMAN-004 at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68. Its eight prohibited capabilities, its
  finite three-member residual human exception set, and its statement that branch protection and
  required checks remain authoritative while automation receives merge permission but no bypass
  permission are the boundary this gate assesses the implementation against.
normative_architecture_source: >-
  The LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 approved source
  f148567d716c00d7a24783318c8d6d7031492e7b, approved at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 - principally
  docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md sections "GitHub identity and
  human-controlled policy", "Trusted current-policy observation boundary", and "Required evidence
  and validation fixtures", with ADR-0043 and ADR-0044. Read at that exact identifier.
review_target_commit: pending TASK-049 publication
review_target_base: >-
  reproducible expression. The authored-delta base is TASK-049's own immutable branch point,
  git merge-base agent/claude/devops/task-049 integration/autonomous-runtime, resolved by the
  Orchestrator at the activation that consumes TASK-049's publication and pinned here then.
review_target_applicability: >-
  applicable, declared as a reproducible expression because the assessed artifact does not exist
  yet. It becomes resolved at the activation that consumes TASK-049's publication.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: >-
  applicable, declared as a reproducible expression because this task's branch does not exist yet.
  It is this task's own branch point and is unrelated to review_target_base above.
scope_validation_note: >-
  Branch from integration/autonomous-runtime, resolve the branch point inside the worktree with
  git merge-base HEAD integration/autonomous-runtime, and pass that exact value to -BaseRef.
  Record the resolved value in the report.
blocked_reason: >-
  review_ready(TASK-049) is unsatisfied. TASK-049 is itself blocked on integrated(TASK-046), so
  this task is at least two steps out.
exit_condition: >-
  TASK-049 is review_ready under its declared publication_class runtime - immutable published
  commit, branch pushed to origin, and an open or updated pull request, all three present
  independently.
---

# TASK-054: Security validation of the integration-to-main release merge executor

## Objective

Record `LIN-RELEASE-EXECUTOR-SECURITY` round 1: threat-model TASK-049's implementation, assess it against `HUMAN-004`'s eight prohibited capabilities and the approved credential-confinement boundary, and state plainly whether the module may be integrated and whether its `implementationSecurityReview` activation member may be produced.

## Why this gate exists separately

This is the executor with authority over **`main`**, the repository's protected release base. `HUMAN-004` requires that "the implementation is independently reviewed **and** security-validated", and the approved `MergeExecutorActivationRecord` carries `implementationReview` and `implementationSecurityReview` as **two distinct immutable members**. One task cannot produce both.

**It is also a separate gate from TASK-051.** The two executors hold different identities against different protected bases, and a security verdict about the integration-branch executor says nothing about the identity that can write `main`.

## Scope

- Threat-model the **credential surface** for the release identity: a short-lived installation token obtained at execution time, held outside the repository, scoped to one repository, never obtainable or loggable by the executor process, and reachable only through a broker that injects an opaque client capability limited to the admission and reconciliation reads and the one exact pull-request merge request.
- Verify that the release identity holds **only** Contents read/write, Pull requests read, Checks read, Commit statuses read, and Metadata read, holds **no** Administration, Actions, Environments, Deployments, Secrets, Issues, policy observation or mutation, or checks/status write permission, and is **not** a ruleset or branch-protection bypass actor.
- Assess, as a security property, that there is exactly **one** path to `main` and that it is the exact-head pull-request merge API: no generic HTTP, no ref update, no `git push`, no `ALLOW_MAIN_PUSH`, no force, no hook bypass, no administrator override, no required-check mutation, and no branch-protection or ruleset mutation. **State explicitly whether you found a second path.**
- Verify the attestor boundary: neither the executor process nor its opaque merge client can obtain the policy-observer credential, invoke Administration or ruleset endpoints, mutate policy, issue an attestation, or suppress revocation; and the attestor port cannot call a merge endpoint.
- Verify attestation validation: canonical digest, Ed25519 signature, exact declared subject including repository, ref, pull request, head, base, and App, freshness window, execution margin, key and issuer revocation, and complete parent and repository ruleset enumeration. **A missing or permission-redacted `bypass_actors` must never be treated as an empty set.**
- Assess each of `HUMAN-004`'s **eight prohibited capabilities** individually against the implementation and state a per-item result. Confirm the implementation constructs no fourth kind of human exception, and that it does not treat a merge to `main` as an irreversible production action requiring the second exception unless a later approved policy records that coupling — which none does.
- Assess the seven aggregate release-gate resolution path for privilege escalation: that no domain can be satisfied by an executor-authored artifact, a generic formal acceptance, a mutable ref, or a stale round.
- Assess the durable-intent store and evidence store for secret exposure, tampering, replay, and unauthorized append.
- Confirm that **no secret, credential, private key, token, or sensitive production value** appears in any committed path, test fixture, or report — including this report.
- Assess the dormancy contract as a security control: with any activation-record member absent, unpinned, mutable, or executor-produced, no merge side effect may occur, and the module must not be activatable by configuration alone.
- Exclude: implementing or remediating anything; performing the review or QA gate, which belong to TASK-053 and TASK-055; assessing TASK-048, which is TASK-051's; re-deciding `HUMAN-004`; provisioning, requesting, or configuring any control-plane, credential, branch-protection, ruleset, or App change; recording a formal human acceptance of any finding; merging anything; and creating any task.

## Acceptance criteria

- [ ] Every scope item receives an explicit `met` or `not met` judgment with file and line evidence.
- [ ] The verdict is one of `approved`, `approved-with-findings`, or `changes-required`, applied to the single relation this task carries, and states plainly whether the module may be integrated and whether the `implementationSecurityReview` activation member may be produced.
- [ ] Each finding records severity, file and line, the responsible owner role, and — for High and Critical — the explicit statement that it **blocks delivery until resolved or formally accepted by an authorized human**, with no acceptance recorded by this task.
- [ ] Each of `HUMAN-004`'s eight prohibited capabilities receives its own recorded result, enumerated rather than summarized.
- [ ] The report states explicitly whether any executor-reachable path can obtain a raw credential, construct an arbitrary request, observe or mutate policy, bypass branch protection, or reach `main` other than through the exact-head pull-request merge API.
- [ ] The report states explicitly what continuous-integration evidence exists for the immutable target, read at that exact commit identifier, and never infers success from an empty rollup.
- [ ] No secret value is written into the report, and no file outside `reports/security/TASK-049-RELEASE-MERGE-EXECUTOR-SECURITY.md` is modified.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the report, together with the resolved branch point.

## Expected artifacts

- `reports/security/TASK-049-RELEASE-MERGE-EXECUTOR-SECURITY.md`.

## Write-scope isolation

This path is disjoint from `reports/security/SECURITY_REPORT.md`, from TASK-010's deliverables, and from TASK-051's task-integration-executor security path. It is deliberately narrower than the `security` role's configured ceiling: `specs/security/**` and `.github/SECURITY.md` are **excluded**, because this task assesses one implementation rather than amending the repository's security requirements or its human-controlled security policy. No resource lock is required.

## Gate and remediation path

This task performs round 1 of `LIN-RELEASE-EXECUTOR-SECURITY`. TASK-049 becomes integrable only when **both** of its pre-merge gates — TASK-053's review gate and this one — are closed. Findings return to the Orchestrator under TASK-013, which routes remediation to the responsible implementation owner; the security role reports remediation requirements and never writes the remediation. Publishing this report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence.** The author is `devops` / `claude` and this owner is `security` / `gpt`: different roles, different execution contexts, and **different LLM families**. This task must not run in TASK-049's, TASK-053's, TASK-055's, or TASK-051's execution context.

## Task-record lifecycle

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the security role's configured write scope.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-054 -Role security -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-054 -Role security -Llm gpt` before editing.
3. Read the immutable target through Git object access or a detached worktree. **Do not merge the unassessed implementation into this branch.**
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
5. Commit, publish as the environment permits, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-054 -Role security -Llm gpt`. Never push `main` and never merge anything.

## Handoff

Maintained by the Orchestrator under TASK-013 from this owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- **Created `blocked` at `ACT-026`**, two steps out, on the unsatisfied `review_ready(TASK-049)` edge.
- Next owner: nobody yet. TASK-049 must publish first, and TASK-049 is itself blocked.
