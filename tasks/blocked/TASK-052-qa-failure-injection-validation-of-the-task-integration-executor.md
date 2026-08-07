---
task_id: TASK-052
title: QA failure-injection and negative-capability validation of the task integration executor
status: blocked
owner_role: qa
llm: gemini
branch: agent/gemini/qa/task-052
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gemini-qa-task-052
write_scope:
  - reports/qa/TASK-048-TASK-INTEGRATION-EXECUTOR-QA.md
resource_lock: null
dependencies:
  - task: TASK-048
    edge: review_ready
    satisfied: false
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-048
    gate: qa
    round: 1
    verdict: pending
    gate_class: point
    retrospective: true
    gate_lineage: LIN-TASK-INTEGRATION-EXECUTOR-QA
    lineage_round: 1
parent_task: TASK-001
publication_class: bootstrap
governance_decision_context: >-
  HUMAN-004 at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68. Its fourth operational condition is that
  "the automated checks demonstrate that the executors cannot bypass their admission predicates".
  This gate is where that condition is independently validated; its output is the
  negativeCapabilityTestAttestation member of the approved MergeExecutorActivationRecord.
normative_architecture_source: >-
  The LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 approved source
  f148567d716c00d7a24783318c8d6d7031492e7b, approved at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 - principally the twelve numbered items of
  docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md, section "Required evidence and
  validation fixtures". Read at that exact identifier and enumerate the twelve items from the
  target tree rather than from this record, which deliberately restates none of them.
control_plane_dependency: >-
  Item 7 of the approved fixture list requires LIVE protected-branch tests with both App
  identities. Those cannot execute until the human-controlled control plane is provisioned -
  branch protection, required checks, the two executor Apps, and the token broker - which round 3
  read live and recorded as ABSENT. This is an external human-controlled blocker, not a scheduling
  dependency of this task, and it is the reason this gate is retrospective rather than pre-merge.
  A verdict recorded before that provisioning exists MUST state explicitly which items could not
  be executed and MUST NOT record an unexecuted item as passing.
review_target_commit: pending TASK-048 publication
review_target_base: >-
  reproducible expression. The authored-delta base is TASK-048's own immutable branch point,
  git merge-base agent/claude/runtime/task-048 integration/autonomous-runtime, resolved by the
  Orchestrator at the activation that consumes TASK-048's publication and pinned here then.
review_target_applicability: >-
  applicable, declared as a reproducible expression because the validated artifact does not exist
  yet. It becomes resolved at the activation that consumes TASK-048's publication.
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
  review_ready(TASK-048) is unsatisfied. TASK-048 is itself blocked on three integrated() edges,
  so this task is at least two steps out.
exit_condition: >-
  TASK-048 is review_ready under its declared publication_class runtime - immutable published
  commit, branch pushed to origin, and an open or updated pull request, all three present
  independently. Note that this gate is retrospective, so TASK-048 may be integrated before this
  verdict exists; that ordering is registered in the aggregate and retrospective gate register with
  its recorded risk, and it never permits the executor to be activated.
---

# TASK-052: QA failure-injection and negative-capability validation of the task integration executor

## Objective

Record `LIN-TASK-INTEGRATION-EXECUTOR-QA` round 1: independently execute and judge the twelve required evidence and validation fixtures the approved architecture names for TASK-048, and state plainly whether the `negativeCapabilityTestAttestation` activation member may be produced.

## Why this gate is retrospective, and what that does and does not permit

`gate: qa` is **not** in TASK-048's `pre_merge_gates`, so TASK-048 may be integrated before this verdict exists. That ordering is deliberate, registered, and bounded:

- The approved architecture names a `dormant-before-durable-merge-ingress` contract under which executor source may land before TASK-026 and TASK-005 complete, with the activation record invalid, `admit` returning `AuthorityNotActivated`, and **no merge side effect permitted**.
- Item 7 of the fixture list requires **live** protected-branch tests with both App identities, which cannot run until the human-controlled control plane is provisioned. Making this a pre-merge gate would make integrating dormant code depend on a human provisioning step that `HUMAN-004` deliberately keeps outside every agent's authority.
- **Integration is not activation.** The approved `MergeExecutorActivationRecord` carries `negativeCapabilityTestAttestation` as an immutable member, so until this gate passes the executor returns `AuthorityNotActivated` whatever has been merged.

The recorded risk is stated in the aggregate and retrospective gate register and is not restated here.

## What this round carries

**One verdict, applied to one relation**: `(TASK-048, qa, round 1)`.

## Obligations this round carries that its scope list does not already imply

- **Execute the fixtures rather than reading them.** TASK-045 set this standard for `LIN-CI-EVIDENCE-REVIEW` — it ran the assertion, constructed the zero-check-run and non-`success` cases itself, and recorded live demonstrations. A fixture list is a claim until it is run.
- **Construct at least one counterexample the author did not supply**, for each of the admission table, the policy-control classifier, and the recovery path. A test suite that passes proves the cases it contains; whether the case set is exhaustive is your judgment.
- **State every unexecuted item as unexecuted.** If the control plane is unprovisioned, item 7 and any part of item 11 cannot run. **An unexecuted test is not a passing test, a `skipped` result is not a `success`, and an empty result set is an absence.** Recording an unexecuted item as met is a blocking defect in this report.
- **Re-derive every figure from the target tree** under `MC-011`. This record deliberately states no count of fixtures, cases, or items.

## Scope

- Enumerate the twelve required evidence and validation fixture items from the approved architecture at its exact identifier, and record a per-item **executed / not executed** result and a per-item **pass / fail** judgment. The two are separate columns and neither substitutes for the other.
- Execute and judge the exhaustive admission table, and independently confirm that every refusal and all three exception classifications produce **no** merge API call.
- Execute and judge the mandatory F-041-01 fixture — an authoritative `changes-required` review verdict plus a generic formal acceptance — and confirm `PreMergeGateNotPassing`, no `MergePlan`, no durable intent, and zero merge API calls.
- Execute and judge the F-044-01 policy-control fixtures, including simultaneous unavailable-and-credential-missing, ruleset-change-and-drift, key-revocation-and-invalid-signature, and unknown-cause inputs, and confirm **exactly one** result member for each.
- Execute and judge immutable head and base race tests, including a base change between planning and execute, and a required-check source mismatch.
- Execute and judge failure injection: conflict, 4xx, 5xx, rate limit, timeout, dropped response, crash before call, crash after call before result, and result-tree mismatch.
- Execute and judge idempotency: one mutation across process restart and ambiguous response, and `OutcomeUnknown` preventing a blind second call.
- Execute and judge the static dependency, command, environment, permission, and endpoint allow-list tests for **every** negative capability in the approved table.
- Execute and judge the result-adapter deduplication, append-committed-signal-absent recovery, scheduler wake-up, exact `BranchIntegrated` projection, and no-self-trigger-path tests.
- Execute and judge the published-head evidence fixtures, including invalidation after a later content commit and the requirement that no plan, intent, or API call exists before a complete exact-head bundle does.
- Report the live protected-branch and attestor-boundary items as **not executed** with the exact reason, if and only if the control plane is genuinely unprovisioned at the time of the run, verified by a read-only query rather than assumed.
- Exclude: implementing or remediating anything; authoring or modifying TASK-048's tests, which belong to its owner; performing the review or security gate, which belong to TASK-050 and TASK-051; provisioning, requesting, or configuring any control-plane change; merging anything; and creating any task.

## Acceptance criteria

- [ ] Every one of the twelve fixture items receives an explicit executed/not-executed result **and** an explicit pass/fail judgment, enumerated from the target tree.
- [ ] The verdict is one of `approved`, `approved-with-findings`, or `changes-required`, applied to the single relation this task carries, and states plainly whether the `negativeCapabilityTestAttestation` activation member may be produced.
- [ ] The report records at least one counterexample this gate constructed itself for each of the admission table, the policy classifier, and the recovery path, with its exact input and its exact observed result.
- [ ] Every defect is reproducible: exact input, exact command, exact observed output, exact expected output.
- [ ] Each defect records severity, file and line, and the responsible owner role.
- [ ] The report states explicitly what continuous-integration evidence exists for the immutable target, read at that exact commit identifier, and never infers success from an empty rollup.
- [ ] No file outside `reports/qa/TASK-048-TASK-INTEGRATION-EXECUTOR-QA.md` is modified.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the report, together with the resolved branch point.

## Expected artifacts

- `reports/qa/TASK-048-TASK-INTEGRATION-EXECUTOR-QA.md`.

## Write-scope isolation

This path is disjoint from `reports/qa/BUG_REPORT.md`, from TASK-011's `reports/qa/**` deliverables, and from TASK-055's release-executor QA path. It is deliberately narrower than the `qa` role's configured ceiling: `tests/integration/**`, `tests/e2e/**`, and `tests/fixtures/**` are **excluded**, because the approved architecture assigns the executor fixtures to the implementation owners' own test scopes — `tests/unit/orchestrator/integration/` for TASK-048 — and this gate validates them rather than authoring them. Declaring those paths here would also overlap TASK-011's scope and force a resource lock that nothing else needs. **A configured write scope is a ceiling, not a permission.** No resource lock is required.

## Gate and remediation path

This task performs round 1 of `LIN-TASK-INTEGRATION-EXECUTOR-QA`. It does **not** block integration; it blocks **activation**, through the `negativeCapabilityTestAttestation` member. Defects return to the Orchestrator under TASK-013, which routes remediation to the responsible implementation owner; the QA role reports reproducible defects and never writes the fix. Publishing this report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence.** The author is `runtime` / `claude` and this owner is `qa` / `gemini`: different roles, different execution contexts, and **different LLM families** — and a third family distinct from both the author's and the review and security gates'. This task must not run in TASK-048's, TASK-050's, TASK-051's, or TASK-055's execution context.

## Task-record lifecycle

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the QA role's configured write scope.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-052 -Role qa -Llm gemini`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-052 -Role qa -Llm gemini` before editing.
3. Read and execute against the immutable target through Git object access or a detached worktree. **Do not merge the unvalidated implementation into this branch.**
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
5. Commit, publish as the environment permits, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-052 -Role qa -Llm gemini`. Never push `main` and never merge anything.

## Handoff

Maintained by the Orchestrator under TASK-013 from this owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- **Created `blocked` at `ACT-026`**, two steps out, on the unsatisfied `review_ready(TASK-048)` edge. **It is the first `qa`-gate task this graph has created since TASK-011**, and the first ever declared `retrospective: true` at `gate_class: point` rather than as part of an aggregate runtime assembly gate.
- Next owner: nobody yet. TASK-048 must publish first, and TASK-048 is itself blocked.
