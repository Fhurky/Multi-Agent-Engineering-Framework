---
task_id: TASK-050
title: Independent review of the post-gate task integration executor
status: blocked
owner_role: reviewer
llm: gpt
branch: agent/gpt/reviewer/task-050
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-reviewer-task-050
write_scope:
  - reports/code-review/TASK-048-TASK-INTEGRATION-EXECUTOR-REVIEW.md
resource_lock: null
dependencies:
  - task: TASK-048
    edge: review_ready
    satisfied: false
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-048
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-TASK-INTEGRATION-EXECUTOR-REVIEW
    lineage_round: 1
parent_task: TASK-001
publication_class: bootstrap
governance_decision_context: >-
  HUMAN-004 at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68, artifact
  plans/decisions/HUMAN-004-autonomous-merge-authority.md. Read it at that commit, not from any
  task record's or report's transcription of it. It is the boundary the implementation is judged
  against; it is not part of the reviewed delta and must not be modified.
normative_architecture_source: >-
  The LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 approved source
  f148567d716c00d7a24783318c8d6d7031492e7b, approved at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 - principally
  docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md, with
  COMPONENT-BOUNDARIES.md, INTEGRATION-STRATEGY.md, and ADR-0042, ADR-0043, and ADR-0044. Read at
  that exact identifier. The predecessor round reports are
  reports/code-review/TASK-040-INTEGRATION-AUTHORITY-REVIEW.md at
  ec533fb5bb0055675fb81f72057d5636f7867db3,
  reports/code-review/TASK-042-INTEGRATION-AUTHORITY-REVIEW-ROUND-2.md at
  6f7f0edb63615d7f143dd6c59750a5ea7db701fc, and
  reports/code-review/TASK-046-INTEGRATION-AUTHORITY-REVIEW-ROUND-3.md at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6. Read each at its own source commit.
review_target_commit: pending TASK-048 publication
review_target_base: >-
  reproducible expression. The authored-delta base is TASK-048's own immutable branch point,
  git merge-base agent/claude/runtime/task-048 integration/autonomous-runtime, resolved by the
  Orchestrator at the activation that consumes TASK-048's publication and pinned here then.
review_target_applicability: >-
  applicable, declared as a reproducible expression because the reviewed artifact does not exist
  yet. It becomes resolved at the activation that consumes TASK-048's publication, which binds the
  immutable target commit and this base together and never afterwards retargets either.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: >-
  applicable, declared as a reproducible expression because this task's branch does not exist yet.
  It is this task's own branch point and is unrelated to review_target_base above; findings F-403
  and A-209 require the two to stay separate fields.
scope_validation_note: >-
  Branch from integration/autonomous-runtime, resolve the branch point inside the worktree with
  git merge-base HEAD integration/autonomous-runtime, and pass that exact value to -BaseRef.
  Record the resolved value in the report. Never pass origin/main, c325275, de3a8d6, f148567d, or
  a review-diff base.
blocked_reason: >-
  review_ready(TASK-048) is unsatisfied. TASK-048 is itself blocked on three integrated() edges,
  so this task is at least two steps out and nothing this task owns can shorten the distance.
exit_condition: >-
  TASK-048 is review_ready - an immutable published commit on agent/claude/runtime/task-048, the
  branch pushed to origin, and an open or updated pull request. TASK-048 declares publication_class
  runtime, so all three conditions are required independently and the bootstrap allowance of
  publication-classes rule 1 does NOT apply; a local-only publication is a blocked outcome rather
  than a satisfied edge.
---

# TASK-050: Independent review of the post-gate task integration executor

## Objective

Record `LIN-TASK-INTEGRATION-EXECUTOR-REVIEW` round 1: decide whether TASK-048's implementation of the `runtime`-owned post-gate task integration executor is correct, maintainable, and — above all — **structurally incapable of the capabilities `HUMAN-004` prohibits**. State plainly whether the module may be integrated and whether its `implementationReview` activation member may be produced.

## What this round carries

**One verdict, applied to one relation**: `(TASK-048, review, round 1)`. This is a single-member cohort, like `LIN-TOOLCHAIN-REVIEW` and `LIN-CI-EVIDENCE-REVIEW`, and unlike the three-member cohort `LIN-INTEGRATION-AUTHORITY-REVIEW` reached at round 3.

**This round judges an implementation, not an architecture.** `LIN-INTEGRATION-AUTHORITY-REVIEW` round 3 approved the contract at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6`; that verdict is durable, closed, and **not reopened, re-argued, or re-dispositioned here**. What this round decides is whether the code implements it.

## Obligations this round carries that its scope list does not already imply

- **Construct the negative counterexamples yourself rather than reading the tests.** The approved contract's own required-fixture list is a statement of what the author must supply; whether each fixture actually proves what it claims is your judgment. Round 2 of the architecture lineage found its finding by constructing a counterexample rather than by reading a claim, and round 3 did the same for four policy-control cases.
- **Judge the continuous-integration evidence for your own immutable target explicitly**, read at that exact commit identifier. An unexecuted workflow is not a passing check, a `skipped` conclusion is not a `success`, and an empty rollup is an **absence**.
- **Judge TASK-048's own `published-head-evidence/v2` bundle in full**, both phases, and recompute its digests rather than accepting them. TASK-046's bundle set the standard and F-044-03 exists because an earlier publication wrote the obligation without meeting it.
- **Re-derive every figure from the target tree** under `MC-011`. This record deliberately states no count of modules, edges, files, tests, or fixtures.
- **Judge dormancy as a property rather than as a claim.** The module must return `AuthorityNotActivated` with any activation-record member absent, unpinned, mutable, or executor-produced, and must produce no merge side effect. Verify that the implementation cannot be made active by configuration alone.

## Scope

- Verify that every changed path is inside `src/orchestrator/integration/**` or `tests/unit/orchestrator/integration/**`, and that no governance, enforcement, settings, workflow, hook, script, architecture, report, or task path was touched. **Authoring any of those from an `agent/*` branch is a blocking finding regardless of content.**
- Verify that `admit` is total and disjoint over its declared input domain and returns exactly one `MergeAdmissionResult` member for every input, and that `classifyPolicyControl` is the one ordered constructor the approved contract requires.
- Verify that **every** non-admission path constructs no `MergePlan`, no durable intent, and zero merge API calls — including the mandatory F-041-01 case of an authoritative `changes-required` verdict accompanied by a generic formal acceptance.
- Verify the exact security-exception predicate: only exact immutable authorized-human `accepted-blocking-security-risk/v1` records for **every** matching unresolved blocking High or Critical finding, bound byte-for-byte to target, security lineage, round, verdict, finding ID, severity, evidence digest, and acceptance scope. Verify that a Low or Medium record, an unmatched field, a missing record, an extra record, or an acceptance purporting to waive another predicate returns `SecurityRiskAcceptanceInvalid`.
- Verify the structural negative-capability surface against the approved table **item by item**: one pull-request merge port and no generic HTTP, ref update, `git push`, `ALLOW_MAIN_PUSH`, force, hook bypass, administrator override, required-check mutation, deployment, secret, gate-writing, lock-release, task-ownership, or policy-bypass mechanism. **State explicitly whether you found any second mutation path.**
- Verify that the module owns no policy-observation port, holds no Administration or ruleset capability, and consumes policy state only as a signed attestation from the separate human-controlled plane.
- Verify durable receipt-backed intent before the sole mutation, exact-once recovery, reconcile-before-retry, bounded retries, and that `OutcomeUnknown` prevents a blind second call.
- Verify that the module imports `src/orchestrator/state/contracts/` read-only and imports no scheduler, inbox, journal, or workspace push path, and that it appends no ingress fact and has no self-trigger.
- Verify that the implementation neither claims nor requires that any activation prerequisite or external blocker is satisfied.
- Exclude: authoring or fixing the implementation; re-deciding `HUMAN-004`; reopening or re-dispositioning any `LIN-INTEGRATION-AUTHORITY-REVIEW` finding; performing the security or QA gate, which belong to TASK-051 and TASK-052; provisioning or requesting any control-plane change; merging anything; and creating any task.

## Acceptance criteria

- [ ] Every scope item receives an explicit `met` or `not met` judgment with file and line evidence.
- [ ] The verdict is one of `approved`, `approved-with-findings`, or `changes-required`, applied to the single relation this task carries, and states plainly whether the module may be integrated and whether the `implementationReview` activation member may be produced.
- [ ] Each finding records severity, file and line, and the responsible owner role. A finding whose owner is the Orchestrator is named as such rather than routed to the implementer.
- [ ] The report states explicitly whether it found **any** path by which the executor could merge without a passing independent gate, and **any** second mutation path, and quotes the evidence either way.
- [ ] The report states explicitly what continuous-integration evidence exists for the immutable target, read at that exact commit identifier, and never infers success from an empty rollup.
- [ ] No file outside `reports/code-review/TASK-048-TASK-INTEGRATION-EXECUTOR-REVIEW.md` is modified.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the report, together with the resolved branch point.

## Expected artifacts

- `reports/code-review/TASK-048-TASK-INTEGRATION-EXECUTOR-REVIEW.md`.

## Write-scope isolation

This task's single file is path-disjoint from every other reviewer-owned report path in this graph, including TASK-047's and TASK-053's, and from the security and QA report paths of TASK-051 and TASK-052. No resource lock is required.

## Gate and remediation path

This task performs round 1 of `LIN-TASK-INTEGRATION-EXECUTOR-REVIEW`. TASK-048 becomes integrable only when **both** of its pre-merge gates — this one and TASK-051's security gate — are closed. Findings return to the Orchestrator under TASK-013, which routes remediation and creates the next round; the reviewer never implements the fix. Publishing this report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence.** The author is `runtime` / `claude` and this reviewer is `reviewer` / `gpt`: different roles, different execution contexts, and **different LLM families**. This task must not run in TASK-048's execution context, nor in TASK-051's or TASK-052's, nor in TASK-053's — the two executors implement one shared normative protocol, and a reviewer of one is not independent of the other.

## Task-record lifecycle

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the reviewer role's configured write scope.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-050 -Role reviewer -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-050 -Role reviewer -Llm gpt` before editing.
3. Read the immutable target through Git object access or a detached worktree. **Do not merge the unreviewed implementation into this branch to assemble the review.**
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
5. Commit, publish as the environment permits, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-050 -Role reviewer -Llm gpt`. Never push `main` and never merge anything.

## Handoff

Maintained by the Orchestrator under TASK-013 from the reviewer's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- **Created `blocked` at `ACT-026`**, two steps out, on the unsatisfied `review_ready(TASK-048)` edge.
- Next owner: nobody yet. TASK-048 must publish first, and TASK-048 is itself blocked.
