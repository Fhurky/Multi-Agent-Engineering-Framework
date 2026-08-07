---
task_id: TASK-055
title: QA failure-injection and negative-capability validation of the release merge executor
status: blocked
owner_role: qa
llm: gemini
branch: agent/gemini/qa/task-055
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gemini-qa-task-055
write_scope:
  - reports/qa/TASK-049-RELEASE-MERGE-EXECUTOR-QA.md
resource_lock: null
dependencies:
  - task: TASK-049
    edge: review_ready
    satisfied: false
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-049
    gate: qa
    round: 1
    verdict: pending
    gate_class: point
    retrospective: true
    gate_lineage: LIN-RELEASE-EXECUTOR-QA
    lineage_round: 1
parent_task: TASK-001
publication_class: bootstrap
governance_decision_context: >-
  HUMAN-004 at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68. Its fourth operational condition is that
  "the automated checks demonstrate that the executors cannot bypass their admission predicates".
  This gate is where that condition is independently validated for the release executor; its
  output is the negativeCapabilityTestAttestation member of the approved
  MergeExecutorActivationRecord for that executor.
normative_architecture_source: >-
  The LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 approved source
  f148567d716c00d7a24783318c8d6d7031492e7b, approved at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 - principally the twelve numbered items of
  docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md, section "Required evidence and
  validation fixtures", together with INTEGRATION-STRATEGY.md step 9 and the release
  integration-evidence transaction. Enumerate the items from the target tree; this record
  deliberately restates none of them.
control_plane_dependency: >-
  Item 7 of the approved fixture list requires LIVE protected-branch tests with both App
  identities, including proof that this identity can only merge the integration pull request into
  main and that direct and force pushes fail. Those cannot execute until the human-controlled
  control plane is provisioned, which round 3 read live and recorded as ABSENT - no branch
  protection on main, no repository rulesets, and no provisioned attestor. This is an external
  human-controlled blocker, not a scheduling dependency of this task, and it is the reason this
  gate is retrospective rather than pre-merge. A verdict recorded before that provisioning exists
  MUST state which items could not be executed and MUST NOT record an unexecuted item as passing.
review_target_commit: pending TASK-049 publication
review_target_base: >-
  reproducible expression. The authored-delta base is TASK-049's own immutable branch point,
  git merge-base agent/claude/devops/task-049 integration/autonomous-runtime, resolved by the
  Orchestrator at the activation that consumes TASK-049's publication and pinned here then.
review_target_applicability: >-
  applicable, declared as a reproducible expression because the validated artifact does not exist
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
  independently. Note that this gate is retrospective, so TASK-049 may be integrated before this
  verdict exists; that ordering is registered in the aggregate and retrospective gate register with
  its recorded risk, and it never permits the executor to be activated.
---

# TASK-055: QA failure-injection and negative-capability validation of the release merge executor

## Objective

Record `LIN-RELEASE-EXECUTOR-QA` round 1: independently execute and judge the required evidence and validation fixtures the approved architecture names for TASK-049 — with particular weight on the seven aggregate release domains and the live protected-branch behaviour against `main` — and state plainly whether the `negativeCapabilityTestAttestation` activation member may be produced for the release executor.

## Why this gate is retrospective, and what that does and does not permit

`gate: qa` is **not** in TASK-049's `pre_merge_gates`, so TASK-049 may be integrated before this verdict exists. The reasoning is the same one recorded on TASK-052 and in the aggregate and retrospective gate register: executor source may land **dormant** under the approved `dormant-before-durable-merge-ingress` contract, item 7 requires a control plane that only a human may provision, and **integration is not activation** — `negativeCapabilityTestAttestation` is an immutable member of the activation record, so until this gate passes the executor returns `AuthorityNotActivated` whatever has been merged.

## What this round carries

**One verdict, applied to one relation**: `(TASK-049, qa, round 1)`.

## Obligations this round carries that its scope list does not already imply

- **Execute the fixtures rather than reading them**, and construct at least one counterexample the author did not supply for each of the release manifest, the refusal table, and the recovery path.
- **State every unexecuted item as unexecuted.** If the control plane is unprovisioned, the live protected-branch and attestor-boundary items cannot run. **An unexecuted test is not a passing test, a `skipped` result is not a `success`, and an empty result set is an absence.** Verify the control-plane state with a read-only query rather than assuming it.
- **Judge the continuous-integration evidence for your own immutable target explicitly**, read at that exact commit identifier.
- **Re-derive every figure from the target tree** under `MC-011`. This record deliberately states no count.

## Scope

- Enumerate the applicable required evidence and validation fixture items from the approved architecture at its exact identifier, and record a per-item **executed / not executed** result and a per-item **pass / fail** judgment. The two are separate columns and neither substitutes for the other.
- Execute and judge the release manifest success fixture containing **all seven** aggregate domains, and one constructed refusal case for each of: a missing domain, a duplicate domain, a point gate, an open or incomplete relation set, a stale round, a generic formal acceptance, and a non-passing verdict. Confirm each produces no plan, no durable intent, and zero merge API calls.
- Execute and judge the security-exception fixtures: an exact matching High or Critical `accepted-blocking-security-risk/v1` record set admits, and a Low or Medium record, an unmatched target, finding, severity, evidence digest, verdict, or round, a missing record, and an extra record each return `SecurityRiskAcceptanceInvalid`.
- Execute and judge the release-lineage fixtures: runtime, operator, and mixed provenance accepted only with equivalent immutable evidence for every content unit, and any missing, duplicate, reordered, or unverifiable unit refused.
- Execute and judge immutable head and base race tests, failure injection across conflict, 4xx, 5xx, rate limit, timeout, dropped response, crash before call, crash after call before result, and result-tree mismatch, and the idempotency and `OutcomeUnknown` behaviour.
- Execute and judge the static dependency, command, environment, permission, and endpoint allow-list tests for **every** negative capability in the approved table, and independently confirm there is no second path to `main`.
- Execute and judge the policy-attestation fixtures, including explicit empty and non-empty bypass sets, pagination, freshness, execution margin, and key and issuer revocation, and confirm that a missing or permission-redacted `bypass_actors` is never treated as an empty set.
- Execute and judge the published-head evidence fixtures, including invalidation after a later content commit.
- Report the live protected-branch and attestor-boundary items as **not executed** with the exact reason, if and only if the control plane is genuinely unprovisioned at the time of the run.
- Exclude: implementing or remediating anything; authoring or modifying TASK-049's tests, which belong to its owner; performing the review or security gate, which belong to TASK-053 and TASK-054; validating TASK-048, which is TASK-052's; provisioning, requesting, or configuring any control-plane change; merging anything; and creating any task.

## Acceptance criteria

- [ ] Every applicable fixture item receives an explicit executed/not-executed result **and** an explicit pass/fail judgment, enumerated from the target tree.
- [ ] The verdict is one of `approved`, `approved-with-findings`, or `changes-required`, applied to the single relation this task carries, and states plainly whether the `negativeCapabilityTestAttestation` activation member may be produced.
- [ ] Each of the seven aggregate release domains receives its own recorded executed and pass/fail result.
- [ ] The report records at least one counterexample this gate constructed itself for each of the release manifest, the refusal table, and the recovery path, with its exact input and its exact observed result.
- [ ] Every defect is reproducible: exact input, exact command, exact observed output, exact expected output.
- [ ] Each defect records severity, file and line, and the responsible owner role.
- [ ] The report states explicitly what continuous-integration evidence exists for the immutable target, read at that exact commit identifier, and never infers success from an empty rollup.
- [ ] No file outside `reports/qa/TASK-049-RELEASE-MERGE-EXECUTOR-QA.md` is modified.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the report, together with the resolved branch point.

## Expected artifacts

- `reports/qa/TASK-049-RELEASE-MERGE-EXECUTOR-QA.md`.

## Write-scope isolation

This path is disjoint from `reports/qa/BUG_REPORT.md`, from TASK-011's `reports/qa/**` deliverables, and from TASK-052's task-integration-executor QA path. It is deliberately narrower than the `qa` role's configured ceiling: `tests/integration/**`, `tests/e2e/**`, and `tests/fixtures/**` are **excluded**, because the approved architecture assigns the executor fixtures to the implementation owner's own nested test scope — `scripts/release/integration-merge/tests/` for TASK-049 — and this gate validates them rather than authoring them. No resource lock is required.

## Gate and remediation path

This task performs round 1 of `LIN-RELEASE-EXECUTOR-QA`. It does **not** block integration; it blocks **activation**, through the `negativeCapabilityTestAttestation` member. Defects return to the Orchestrator under TASK-013; the QA role reports reproducible defects and never writes the fix. Publishing this report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence.** The author is `devops` / `claude` and this owner is `qa` / `gemini`: different roles, different execution contexts, and **different LLM families** — a third family distinct from both the author's and the review and security gates'. This task must not run in TASK-049's, TASK-053's, TASK-054's, or TASK-052's execution context.

## Task-record lifecycle

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the QA role's configured write scope.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-055 -Role qa -Llm gemini`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-055 -Role qa -Llm gemini` before editing.
3. Read and execute against the immutable target through Git object access or a detached worktree. **Do not merge the unvalidated implementation into this branch.**
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
5. Commit, publish as the environment permits, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-055 -Role qa -Llm gemini`. Never push `main` and never merge anything.

## Handoff

Maintained by the Orchestrator under TASK-013 from this owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- **Created `blocked` at `ACT-026`**, two steps out, on the unsatisfied `review_ready(TASK-049)` edge.
- Next owner: nobody yet. TASK-049 must publish first, and TASK-049 is itself blocked.
