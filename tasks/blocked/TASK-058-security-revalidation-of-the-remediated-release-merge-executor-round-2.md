---
task_id: TASK-058
title: Security revalidation of the remediated release merge executor, round 2
status: blocked
owner_role: security
llm: gpt
branch: agent/gpt/security/task-058
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-security-task-058
write_scope:
  - reports/security/TASK-056-RELEASE-MERGE-EXECUTOR-SECURITY-ROUND-2.md
resource_lock: null
dependencies:
  - task: TASK-056
    edge: review_ready
    satisfied: false
    satisfied_at: null
    satisfied_by: null
    satisfied_under: >-
      TASK-056 declares publication_class runtime, so ALL THREE of that class's conditions must hold
      INDEPENDENTLY - an immutable published commit, the branch agent/claude/devops/task-056 present
      on origin, and an open or updated pull request for it. THIS IS THIS TASK'S ONLY SCHEDULING
      DEPENDENCY. SATISFYING IT WILL AUTHORIZE A SECURITY ASSESSMENT AND NOTHING ELSE.
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-056
    gate: security
    round: 1
    verdict: pending
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 2
  - task: TASK-049
    gate: security
    round: 2
    verdict: pending
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 2
parent_task: TASK-001
publication_class: bootstrap
supersedes: TASK-054
verdict_cardinality_note: >-
  ONE VERDICT, APPLIED ATOMICALLY TO BOTH RELATIONS, under gate-round rule 5. Both close together or
  both stay open together, and A SPLIT OUTCOME IS NOT REPRESENTABLE. This round cannot clear the
  remediation while leaving TASK-049's security relation open, and cannot close TASK-049's relation
  without clearing the remediation.
governance_decision_context: >-
  HUMAN-004 at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68. Its eight prohibited capabilities, its finite
  three-member residual human exception set, and its statement that branch protection and required
  checks remain authoritative while automation receives merge permission but no bypass permission are
  the boundary this gate assesses the remediation against.
normative_architecture_source: >-
  The LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 approved source
  f148567d716c00d7a24783318c8d6d7031492e7b, approved at 78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 -
  principally docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md sections "GitHub identity and
  human-controlled policy", "Trusted current-policy observation boundary", and "Required evidence and
  validation fixtures", with ADR-0043 and ADR-0044. Read at that exact identifier.
prior_round: >-
  LIN-RELEASE-EXECUTOR-SECURITY round 1, recorded by TASK-054 at
  8b2da2f88d38872ded14bc18b739c6586ec47336, artifact
  reports/security/TASK-049-RELEASE-MERGE-EXECUTOR-SECURITY.md, published as pull request 32. Verdict
  changes-required over the single relation (TASK-049, security, round 1). EIGHT FINDINGS - F-054-01
  through F-054-05 CRITICAL, F-054-06 and F-054-07 High, F-054-08 Medium - all devops-owned, and NO
  RISK ACCEPTED. READ THAT REPORT AT THAT COMMIT THROUGH GIT OBJECT ACCESS. Its verdict is DURABLE:
  this round supersedes it and never rewrites it, and both stay recorded.
blocking_findings_carried: >-
  SEVEN - the five Critical F-054-01 through F-054-05 and the two High F-054-06 and F-054-07. THEY
  BLOCK DELIVERY UNTIL RESOLVED OR FORMALLY ACCEPTED BY AN AUTHORIZED HUMAN. NO ACCEPTANCE OF ANY KIND
  EXISTS ANYWHERE IN THIS REPOSITORY, none was sought by the Orchestrator, and THIS TASK MUST NOT
  RECORD, REQUEST, MANUFACTURE, OR RELY ON ONE - recording a formal human acceptance is outside this
  role's scope and always has been. A finding is closed here only by an independent judgment that the
  remediation actually resolved it.
review_target_commit: >-
  not yet resolved. It is TASK-056's published head, bound by the Orchestrator at the activation that
  consumes TASK-056's publication, under the head-binding rule. Do not begin against a branch name.
review_target_base: d63864bcb25fc8897b21c09f8f687e390f85808d
review_target_applicability: >-
  applicable and RESOLVED at ACT-029, and DELIBERATELY NOT TASK-056'S OWN BRANCH POINT. This round
  carries a relation for TASK-049 as well as for TASK-056, so it must assess the COMPLETE release
  executor rather than only the correction to it - which means diffing TASK-056's published head
  against d63864bcb25fc8897b21c09f8f687e390f85808d, TASK-049's own immutable branch point and the
  base round 1 used. It is NOT 9fb2eb0c, NOT 1dd3b93e, NOT cf6333b1, NOT origin/main, and NOT this
  task's own branch point. A security round that saw only the delta could not re-derive the
  executor-reachable capability statement, which is the core of what this gate produces.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: >-
  applicable, declared as a reproducible expression because this task's branch does not exist yet.
  It is this task's own branch point and is unrelated to review_target_base above.
scope_validation_note: >-
  Branch from integration/autonomous-runtime, resolve the branch point inside the worktree with
  git merge-base HEAD integration/autonomous-runtime, and pass that exact value to -BaseRef. RESOLVE
  IT RATHER THAN ASSUME IT. Record the resolved value in the report. DO NOT BRANCH FROM
  agent/claude/devops/task-056 and DO NOT MERGE THE UNASSESSED IMPLEMENTATION INTO THIS BRANCH; read
  the target through Git object access or a detached worktree, as TASK-054 did.
blocked_reason: >-
  review_ready(TASK-056) is unsatisfied. TASK-056 is ready and dispatchable but has published nothing,
  so there is no immutable target to assess. This is a genuine scheduling dependency and the only one
  this record declares.
exit_condition: >-
  TASK-056 publishes an immutable commit on agent/claude/devops/task-056, pushes the branch to origin,
  and opens a pull request against integration/autonomous-runtime - all three independently. The
  Orchestrator then binds this record's review_target_commit and this task becomes ready. REACHING
  READY WILL AUTHORIZE AN INDEPENDENT SECURITY ASSESSMENT AND NOTHING ELSE - no approval, no merge,
  no integration, no activation-record member, and no risk acceptance.
verdict_authority_note: >-
  THIS TASK ALONE may produce the implementationSecurityReview member of the approved
  MergeExecutorActivationRecord for the release executor, superseding TASK-054's refusal to produce
  it, and it may do so ONLY by recording a passing verdict of its own. A PASSING REPOSITORY SECURITY
  WORKFLOW IS NOT A THREAT MODEL, and the exact-head security check run is owner-side evidence.
  TASK-056's own test results, its evidence bundle, its owner-recorded check-repository.ps1 result,
  and any reproduction of its figures are ALL owner-side or consumer-side evidence and NONE of them
  is a security verdict. TASK-057's review verdict is a SEPARATE gate in a separate lineage and is
  neither an input to this one nor predictable from it. High and critical findings block delivery
  until resolved or formally accepted by an authorized human, and no such acceptance exists.
---

# TASK-058: Security revalidation of the remediated release merge executor, round 2

## Objective

Record `LIN-RELEASE-EXECUTOR-SECURITY` round 2: re-threat-model the release merge executor as remediated by TASK-056, decide whether each of the eight findings TASK-054 recorded at round 1 is actually resolved, assess the whole module against `HUMAN-004`'s eight prohibited capabilities and the approved credential-confinement boundary, and state plainly whether the module may be integrated and whether its `implementationSecurityReview` activation member may be produced.

## Why this gate exists separately, and why it must run again

This is the executor with authority over **`main`**. `HUMAN-004` requires that the implementation be independently reviewed **and** security-validated, and the approved `MergeExecutorActivationRecord` carries `implementationReview` and `implementationSecurityReview` as **two distinct immutable members**. One task cannot produce both, and TASK-057's outcome says nothing about this one.

**Round 1 recorded five Critical and two High findings, and every one of them blocks delivery until resolved or formally accepted by an authorized human.** No acceptance exists and this task may not create one. The findings-return path requires that a validating role revalidate its own remediation in a **new** round and a **new** execution context, which is what this record is.

## What this round carries

**One verdict, applied atomically to two relations**: `(TASK-056, security, round 1)` and `(TASK-049, security, round 2)`.

**It assesses the complete executor, not only the correction.** The assessment base is TASK-049's own branch point `d63864bc`, which is what makes the executor-reachable capability statement re-derivable rather than inherited.

**It is not the review gate and not the QA gate.** TASK-057 owns `LIN-RELEASE-EXECUTOR-REVIEW` round 2 and TASK-055 still owes `LIN-RELEASE-EXECUTOR-QA` round 1 on the earlier target. **Do not disposition an `F-053-*` finding**, and do not treat TASK-057's outcome as an input to this verdict.

## Obligations this round carries that its scope list does not already imply

- **Disposition each of F-054-01 … F-054-08 individually**, as `resolved`, `partially resolved`, or `not resolved`, with file-and-line evidence at the new target, and **reproduce round 1's own probe against the new code rather than reading the diff**. Round 1 demonstrated each finding with an executed counterexample; a claim that a fix works is not the same fact.
- **Re-derive the executor-reachable capability statement in full** — raw credentials, arbitrary requests, policy observation and mutation, branch-protection bypass, evidence replay and forgery, scope crossing, and any second path to `main` — rather than carrying round 1's over. Round 1 recorded "evidence replay or forgery: **yes**"; whether that answer changes is this round's to establish.
- **Assess each of `HUMAN-004`'s eight prohibited capabilities individually and state a per-item result.** Round 1 recorded two `met for the target source` and six `not met`. **A partially satisfied prohibition set is not a passing verdict**, and a per-item improvement is not a verdict either.
- **Verify that a remedy did not widen the attack surface it repaired.** A new authentication path, a new port, a new injected dependency, or a new trust root is itself a subject of this assessment.
- **Judge the continuous-integration evidence for your own immutable target explicitly**, read at that exact commit identifier, and never infer success from an empty rollup.
- **State every unexecuted fixture as unexecuted**, and verify the control-plane state with a read-only query rather than assuming it. **Never provision, request, configure, or simulate any control-plane state to make an assessment possible.**
- **Re-derive every figure from the target tree** under `MC-011`. This record deliberately states no count.

## Scope

- Re-threat-model the **credential surface** for the release identity: a short-lived installation token obtained at execution time, held outside the repository, scoped to one repository, never obtainable or loggable by the executor process, and reachable only through a broker that injects an opaque client capability limited to the admission and reconciliation reads and the one exact pull-request merge request. Assess whether the remediation binds the injected port identity to an authenticated capability attestation, which round 1 recorded it did not.
- Verify that the release identity holds **only** Contents read/write, Pull requests read, Checks read, Commit statuses read, and Metadata read, holds **no** Administration, Actions, Environments, Deployments, Secrets, Issues, policy observation or mutation, or checks/status write permission, and is **not** a ruleset or branch-protection bypass actor — and that the module now **enforces** that rather than reading claimed identifiers.
- Verify attestation validation end to end: canonical digest, **real Ed25519 signature verification against an independently pinned key or key-resolution boundary**, exact declared subject including repository, ref, pull request, head, base, and App, freshness window, execution margin, key and issuer revocation through a trusted online result, and complete parent and repository ruleset enumeration. **A missing or permission-redacted `bypass_actors` must never be treated as an empty set.**
- Verify that activation cannot be completed by configuration alone: an authenticated immutable activation-record artifact, verified own commit, path, digest, and issuer; every member dereferenced and bound to its exact expected kind, gate, lineage, target, and producer; executor-produced and provenance-absent evidence rejected for **every** member; and the policy-profile artifact digest bound to the effective required digest.
- Verify that release authority evidence is no longer caller-controlled: manifests and snapshots constructed from authenticated immutable artifacts, duplicate and contradictory relations rejected, the required-check set derived from the pinned signed policy profile, authorized-human acceptance provenance verified, and the complete integration content-unit universe independently enumerated rather than trusted.
- Verify that the admitted plan is not substitutable before execution, and that retry cannot outlive the exact protected base, the required checks, the activation predicates, or the pre-mutation authorization.
- Verify that durable intent and evidence resist secret exposure, tampering, replay, and unauthorized append, that store-issued receipts are authenticated, and that a merged result is proven reachable from and contained by `main` before it is recorded as success.
- Assess, as a security property, that there is exactly **one** path to `main` and that it is the exact-head pull-request merge API. **State explicitly whether you found a second path**, established against the new code.
- Verify that production-action authorization, if the coupled path is exercised at all, binds the exact policy commit, release head OID, repository, action, scope, and decision artifact — and that the module still does not treat an uncoupled merge to `main` as an irreversible production action, which `HUMAN-004` says it is not.
- Verify that the two-phase published-head evidence requires distinct authenticated producer and session identities and binds each proof kind to a distinct command record.
- Confirm that **no secret, credential, private key, token, or sensitive production value** appears in any committed path, test fixture, or report — including this report.
- Assess the dormancy contract as a security control: with any activation-record member absent, unpinned, mutable, or executor-produced, no merge side effect may occur.
- Exclude: implementing or remediating anything; performing the review or QA gate, which belong to TASK-057 and TASK-055; dispositioning any `F-053-*` finding; assessing TASK-048, which is TASK-051's; re-deciding `HUMAN-004`; provisioning, requesting, configuring, or simulating any control-plane, credential, branch-protection, ruleset, App, attestor, or evidence-store change; **recording a formal human acceptance of any finding**; merging anything; and creating any task.

## Acceptance criteria

- [ ] Each of F-054-01 … F-054-08 receives its own explicit disposition with file-and-line evidence at the new target and, for every disposition of `resolved`, the reproduced round-1 probe and its new observed result. Any residue names the new finding that carries it.
- [ ] Every scope item receives an explicit `met` or `not met` judgment with file and line evidence.
- [ ] The verdict is one of `approved`, `approved-with-findings`, or `changes-required`, applied **atomically** to both relations this task carries, and states plainly whether the module may be integrated and whether the `implementationSecurityReview` activation member may be produced.
- [ ] Each finding records severity, file and line, the responsible owner role, and — for High and Critical — the explicit statement that it **blocks delivery until resolved or formally accepted by an authorized human**, with no acceptance recorded by this task. New findings use a fresh numbering series that does not collide with `F-053-*` or `F-054-*`.
- [ ] Each of `HUMAN-004`'s eight prohibited capabilities receives its own recorded result, enumerated rather than summarized.
- [ ] The report states explicitly whether any executor-reachable path can obtain a raw credential, construct an arbitrary request, observe or mutate policy, bypass branch protection, replay or forge evidence, or reach `main` other than through the exact-head pull-request merge API — each re-derived at the new target.
- [ ] The report states explicitly what continuous-integration evidence exists for the immutable target, read at that exact commit identifier, and never infers success from an empty rollup.
- [ ] The report records which fixtures were executed and which were not, separately from pass and fail, verifies the live control-plane state with a read-only query, and records no unexecuted item as passing.
- [ ] No secret value is written into the report, and no file outside `reports/security/TASK-056-RELEASE-MERGE-EXECUTOR-SECURITY-ROUND-2.md` is modified.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the report, together with the resolved branch point.

## Expected artifacts

- `reports/security/TASK-056-RELEASE-MERGE-EXECUTOR-SECURITY-ROUND-2.md`.

## Write-scope isolation

This path is disjoint from `reports/security/SECURITY_REPORT.md`, from TASK-010's deliverables, from TASK-051's task-integration-executor security path, and from TASK-054's `TASK-049-RELEASE-MERGE-EXECUTOR-SECURITY.md`. It is deliberately narrower than the `security` role's configured ceiling: `specs/security/**` and `.github/SECURITY.md` are **excluded**, because this task assesses one implementation rather than amending the repository's security requirements or its human-controlled security policy — the same narrowing TASK-054 declared. No resource lock is required.

## Gate and remediation path

This task performs round 2 of `LIN-RELEASE-EXECUTOR-SECURITY`. TASK-049 and TASK-056 become integrable only when **both** of their pre-merge gates — TASK-057's review gate and this one — are closed at a passing verdict. Findings return to the Orchestrator under TASK-013, which routes remediation to the responsible implementation owner; the security role reports remediation requirements and never writes the remediation. Publishing this report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence.** The author is `devops` / `claude` and this owner is `security` / `gpt`: different roles, different execution contexts, and different LLM families. **This task must not run in TASK-056's, TASK-049's, TASK-053's, TASK-054's, TASK-055's, or TASK-057's execution context**, nor in TASK-051's — it supersedes TASK-054's round, carries a relation for TASK-049, and the two executors implement one shared normative protocol.

## Task-record lifecycle

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the security role's configured write scope.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-058 -Role security -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-058 -Role security -Llm gpt` before editing.
3. Read the immutable target through Git object access or a detached worktree. **Do not merge the unassessed implementation into this branch.**
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
5. Commit, publish as the environment permits, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-058 -Role security -Llm gpt`. Never push `main` and never merge anything.

## Handoff

Maintained by the Orchestrator under TASK-013 from this owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- **Created `blocked` at `ACT-029`**, on the unsatisfied `review_ready(TASK-056)` edge, as the successor round to TASK-054's `changes-required` verdict at `8b2da2f88d38872ded14bc18b739c6586ec47336`. **A superseding round is a new task, never a re-entrant one**, and TASK-054's verdict — including its five Critical findings — stays durable and unrewritten.
- **Seven blocking findings travel to this round unresolved and unaccepted.** They block delivery until this round records that they are resolved, or until an authorized human formally accepts them. **The Orchestrator recorded no acceptance and this task may not record one.**
- Next owner: **nobody yet.** TASK-056 must publish first. When it does, this record's `review_target_commit` is bound by the Orchestrator and this task becomes `ready`.
