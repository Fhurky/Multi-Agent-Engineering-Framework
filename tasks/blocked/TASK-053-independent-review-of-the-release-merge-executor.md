---
task_id: TASK-053
title: Independent review of the integration-to-main release merge executor
status: blocked
owner_role: reviewer
llm: gpt
branch: agent/gpt/reviewer/task-053
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-reviewer-task-053
write_scope:
  - reports/code-review/TASK-049-RELEASE-MERGE-EXECUTOR-REVIEW.md
resource_lock: null
dependencies:
  - task: TASK-049
    edge: review_ready
    satisfied: false
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-049
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-REVIEW
    lineage_round: 1
parent_task: TASK-001
publication_class: bootstrap
governance_decision_context: >-
  HUMAN-004 at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68, artifact
  plans/decisions/HUMAN-004-autonomous-merge-authority.md. Read it at that commit, not from any
  transcription. It authorizes this executor's merge into main conditionally, states that a merge
  to main is explicitly NOT an irreversible production action unless a later approved policy
  deliberately couples it to one, and enumerates eight prohibited capabilities.
normative_architecture_source: >-
  The LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 approved source
  f148567d716c00d7a24783318c8d6d7031492e7b, approved at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 - principally
  docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md sections on the integration-to-main input
  and release-gate vocabulary and on structural negative capabilities, plus
  docs/architecture/runtime/INTEGRATION-STRATEGY.md step 9 and the release integration-evidence
  transaction, with ADR-0042, ADR-0043, and ADR-0044. Read at that exact identifier.
review_target_commit: pending TASK-049 publication
review_target_base: >-
  reproducible expression. The authored-delta base is TASK-049's own immutable branch point,
  git merge-base agent/claude/devops/task-049 integration/autonomous-runtime, resolved by the
  Orchestrator at the activation that consumes TASK-049's publication and pinned here then.
review_target_applicability: >-
  applicable, declared as a reproducible expression because the reviewed artifact does not exist
  yet. It becomes resolved at the activation that consumes TASK-049's publication, which binds the
  immutable target and this base together and never afterwards retargets either.
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

# TASK-053: Independent review of the integration-to-main release merge executor

## Objective

Record `LIN-RELEASE-EXECUTOR-REVIEW` round 1: decide whether TASK-049's implementation of the `devops`-owned release merge executor is correct, maintainable, and **structurally incapable of reaching `main` by any path other than the exact-head pull-request merge API under branch rules and required checks**. State plainly whether the module may be integrated and whether its `implementationReview` activation member may be produced.

## What this round carries

**One verdict, applied to one relation**: `(TASK-049, review, round 1)`.

**This round judges an implementation, not an architecture.** `LIN-INTEGRATION-AUTHORITY-REVIEW` round 3 approved the contract at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6`; that verdict is durable, closed, and **not reopened, re-argued, or re-dispositioned here**.

**It is also not a review of TASK-048.** The two executors share one normative protocol and nothing else — different owner roles, different source trees, different identities, different admission inputs, and a different protected base. Judge this module on its own terms and do not import TASK-050's result as evidence about it.

## Obligations this round carries that its scope list does not already imply

- **Construct the second-path counterexample yourself.** Round 2 and round 3 of the architecture lineage each searched for a contract path to `main` other than the exact-head pull-request merge API and each found none. **That was a finding about a document; this is a finding about code, and it must be established again against the implementation.**
- **Judge the seven aggregate release domains individually.** A manifest missing one, duplicating one, resolving one through a point gate, or satisfying one by generic formal acceptance must refuse. Construct each of those cases.
- **Judge the continuous-integration evidence for your own immutable target explicitly**, read at that exact commit identifier. An unexecuted workflow is not a passing check and an empty rollup is an absence.
- **Judge TASK-049's own `published-head-evidence/v2` bundle in full**, both phases, recomputing its digests rather than accepting them.
- **Re-derive every figure from the target tree** under `MC-011`. This record deliberately states no count.

## Scope

- Verify that every changed path is inside `scripts/release/integration-merge/**`, and that no governance, enforcement, settings, workflow, hook, `scripts/ci/**`, `scripts/quality/**`, source, test, architecture, report, or task path was touched. **Authoring a governance or enforcement path from an `agent/*` branch is a blocking finding regardless of content**, and `.github/workflows/**` is excluded here even though the `devops` role is granted it.
- Verify that `ReleaseGateManifest` handling requires exactly one requirement for **each** of the seven `ReleaseGateDomain` values, evaluated with `ExecutorGateAdmissibility`, the authoritative-round rule, and `gateClass: 'aggregate'`, and that the withdrawn owner form is rejected and `gate_passed` alone is never sufficient.
- Verify that a missing domain, duplicate domain, point gate, open or incomplete relation set, stale round, generic formal acceptance, or non-passing verdict constructs **no** plan, **no** durable intent, and **zero** merge API calls — one constructed case each.
- Verify the sole security exception: only a security-domain `accepted_security_risk` member carrying exact immutable authorized-human `accepted-blocking-security-risk/v1` records may represent it, and every near-miss returns `SecurityRiskAcceptanceInvalid`.
- Verify the release-lineage evidence rule: runtime, operator, or mixed provenance accepted **only** when every content unit carries equivalent immutable evidence, and any missing, duplicate, reordered, or unverifiable unit refused.
- Verify the structural negative-capability surface against the approved table **item by item**, and confirm exactly one merge port against `main` with an exact expected head SHA and no generic HTTP, ref update, `git push`, `ALLOW_MAIN_PUSH`, force, hook bypass, administrator override, required-check mutation, branch-protection or ruleset mutation, gate mutation, task-ownership mutation, or lock-release mechanism.
- Verify that the module owns no policy-observation port and consumes policy state only as a complete, fresh, plan-bound signed attestation from the separate human-controlled plane.
- Verify durable receipt-backed intent before the sole mutation, exact-once recovery, reconcile-before-retry, bounded retries, and that `OutcomeUnknown` prevents a blind second call.
- Verify by a static dependency test that the module imports no runtime implementation module and no runtime contract root, and that it is not a generic Git helper.
- Verify that merge to `main` is **not** coupled to any irreversible production action, and that the implementation records no such coupling.
- Verify that the implementation neither claims nor requires that any activation prerequisite or external blocker is satisfied.
- Exclude: authoring or fixing the implementation; re-deciding `HUMAN-004`; reopening any `LIN-INTEGRATION-AUTHORITY-REVIEW` finding; performing the security or QA gate, which belong to TASK-054 and TASK-055; reviewing TASK-048; provisioning or requesting any control-plane change; merging anything; and creating any task.

## Acceptance criteria

- [ ] Every scope item receives an explicit `met` or `not met` judgment with file and line evidence.
- [ ] The verdict is one of `approved`, `approved-with-findings`, or `changes-required`, applied to the single relation this task carries, and states plainly whether the module may be integrated and whether the `implementationReview` activation member may be produced.
- [ ] Each of the seven aggregate release domains receives its own recorded result, enumerated rather than summarized.
- [ ] The report states explicitly whether it found **any** path by which this executor could reach `main` other than the exact-head pull-request merge API under branch rules and required checks, and quotes the evidence either way.
- [ ] Each finding records severity, file and line, and the responsible owner role.
- [ ] The report states explicitly what continuous-integration evidence exists for the immutable target, read at that exact commit identifier, and never infers success from an empty rollup.
- [ ] No file outside `reports/code-review/TASK-049-RELEASE-MERGE-EXECUTOR-REVIEW.md` is modified.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the report, together with the resolved branch point.

## Expected artifacts

- `reports/code-review/TASK-049-RELEASE-MERGE-EXECUTOR-REVIEW.md`.

## Write-scope isolation

This task's single file is path-disjoint from every other reviewer-owned report path in this graph, including TASK-047's and TASK-050's, and from the security and QA report paths of TASK-054 and TASK-055. No resource lock is required.

## Gate and remediation path

This task performs round 1 of `LIN-RELEASE-EXECUTOR-REVIEW`. TASK-049 becomes integrable only when **both** of its pre-merge gates — this one and TASK-054's security gate — are closed. Findings return to the Orchestrator under TASK-013; the reviewer never implements the fix. Publishing this report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence.** The author is `devops` / `claude` and this reviewer is `reviewer` / `gpt`: different roles, different execution contexts, and **different LLM families**. This task must not run in TASK-049's execution context, nor in TASK-054's or TASK-055's, nor in TASK-048's or TASK-050's — the two executors implement one shared normative protocol, and an execution that authored or reviewed one half is not independent of the other.

## Task-record lifecycle

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the reviewer role's configured write scope.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-053 -Role reviewer -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-053 -Role reviewer -Llm gpt` before editing.
3. Read the immutable target through Git object access or a detached worktree. **Do not merge the unreviewed implementation into this branch.**
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
5. Commit, publish as the environment permits, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-053 -Role reviewer -Llm gpt`. Never push `main` and never merge anything.

## Handoff

Maintained by the Orchestrator under TASK-013 from the reviewer's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- **Created `blocked` at `ACT-026`**, two steps out, on the unsatisfied `review_ready(TASK-049)` edge.
- Next owner: nobody yet. TASK-049 must publish first, and TASK-049 is itself blocked.
