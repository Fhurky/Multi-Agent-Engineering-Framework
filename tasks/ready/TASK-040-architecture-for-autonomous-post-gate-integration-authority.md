---
task_id: TASK-040
title: Architecture amendment for autonomous post-gate integration authority
status: ready
owner_role: architect
llm: gpt
branch: agent/gpt/architect/task-040
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-architect-task-040
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/runtime/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies:
  - task: HUMAN-004
    edge: human_decision
    satisfied: true
    satisfied_at: 7dc07488a5b1cac8b1327ebd63bf747adbe03c68
    satisfied_by: ACT-019 consuming ingress entry seq 27, class human_decision_recorded
required_gates:
  - review
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-041
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-INTEGRATION-AUTHORITY-REVIEW
    lineage_round: 1
parent_task: TASK-001
publication_class: bootstrap
normative_architecture_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3, the immutable TASK-038 target, approved by LIN-ARCH-REVIEW at lineage_round 8 at 734bdbc and integrated onto integration/autonomous-runtime at de3a8d6. This task amends that approved baseline; it does not replace it and does not reopen any relation LIN-ARCH-REVIEW closed at round 8.
human_decisions:
  - id: HUMAN-004
    status: approved
    decided_at: 2026-08-06
    decided_on: 7dc07488a5b1cac8b1327ebd63bf747adbe03c68
    decision_branch: human/decision/human-004-autonomous-merge
    decision_artifact: plans/decisions/HUMAN-004-autonomous-merge-authority.md
    effect: Approves zero routine human GitHub merges and authorizes two narrowly scoped executors, conditionally. A runtime-owned post-gate integration executor may squash-merge an approved task pull request into the configured integration branch, currently integration/autonomous-runtime. A DevOps-owned release merge executor may merge the approved integration pull request into main after every declared aggregate gate and release-readiness check passes. The authority becomes operational only after the architecture amendment is independently approved, the implementation is independently reviewed and security-validated, the required GitHub controls are configured, and automated checks demonstrate the executors cannot bypass their admission predicates. It authorizes the amendment of AGENTS.md, the runtime architecture, ADRs, diagrams, and the integration strategy, and the later creation of separately owned runtime and devops implementation tasks plus reviewer, security, QA, and failure-injection validation tasks, each subject to its normal independent gates. It requires no role reassignment and changes config/agents/settings.yaml only if an approved architecture later demonstrates a declared write scope must change, which stays human-controlled. It does not retroactively authorize any gate bypass.
    question: May a non-human component of this system perform the squash-merge of an approved task branch into integration/autonomous-runtime, record the branch_integrated fact, and dispatch newly ready work, without a human in the loop - and what is the exact residual human exception set?
    answer: Yes for the task-to-integration merge and additionally yes for the integration-to-main release merge, both conditionally and both under the boundaries transcribed in this record. The residual human exception set is finite and has exactly three members - formal acceptance of an unresolved blocking High or Critical security risk; authorization of an irreversible production action when deployment policy explicitly requires it, with a merge to main not itself being such an action unless a later approved policy deliberately couples it to one; and granting, rotating, or revoking credentials and changing repository governance, branch-protection, or authorization policy. Routine merges are explicitly not human exceptions. A case that cannot be classified conclusively as outside the set must be refused with a typed exception record rather than absorbed.
unblocked_reason: The only declared dependency, human_decision(HUMAN-004), is satisfied at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68 on the non-agent branch human/decision/human-004-autonomous-merge, consumed by ACT-019 as ingress entry seq 27. All four clauses of this record's superseded exit condition were checked individually against the commit's own text - whether the change is authorized, which components may hold the authority, what the residual human exception set is, and which governance artefacts change - and all four are satisfied. The architecture-docs lock is free.
superseded_blocked_reason: The user requirement this task represents needs a governance decision that no agent may make or presuppose. HUMAN-004 is open. AGENTS.md requires every agent to push its task branch and use a pull request, reserves governance and enforcement paths for humans, and requires human approval for privileged, external, and release-changing actions; the approved architecture assigns the integration merge to the operator and gives no module a path that can push or merge any ref but its own task branch. Authoring the amendment before the decision would be inventing the authority it depends on.
superseded_exit_condition: A human records HUMAN-004 in a tracked commit on a non-agent branch, stating whether autonomous post-gate integration is authorized, which component may hold that authority, what the residual human exception set is, and which governance artefacts change. That commit is an ingress fact of class human_decision_recorded; the TASK-013 activation that consumes it moves this record to ready and pins the decision commit here. A decision that refuses the change closes this task instead. Discharged at ACT-019 by the approving branch; the closing branch was live until the decision document was read and is recorded here so a reader can see both outcomes were possible.
review_target_base: not applicable until this task publishes
review_target_applicability: not applicable yet. This task is gated but no artifact of it exists, so no round is pinned and there is no delta to diff. It becomes applicable when this task reaches review_ready; the Orchestrator records review_target_commit and review_target_base then, at the activation that consumes the publication.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime at or after the commit carrying the approved architecture, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-040: Architecture amendment for autonomous post-gate integration authority

## Objective

Define, in the approved architecture, the contract under which the system itself may perform **two** post-gate merges without a human in the loop:

1. Squash-merge an approved **task** pull request into `integration/autonomous-runtime`, produce the `branch_integrated` ingress fact, and let the ordinary scheduling loop dispatch the work that fact releases — owned by **`runtime`**.
2. Merge the approved **integration** pull request into **`main`** after every declared aggregate gate and release-readiness check passes — owned by **`devops`**.

So that routine human merging becomes zero and the human remains only for the finite exception set `HUMAN-004` enumerates.

**This task authors a contract. It does not authorize the capability and does not build it.** The authorization is `HUMAN-004`, now recorded; the implementations are separate tasks that do not exist and **may not be created until TASK-041 records a passing verdict on this amendment.**

## The decision this task is authored under

`HUMAN-004` is **approved**, durable as commit **`7dc07488a5b1cac8b1327ebd63bf747adbe03c68`** `docs: approve autonomous merge authority` on the non-agent branch `human/decision/human-004-autonomous-merge`, published at `origin`. Its single artifact is `plans/decisions/HUMAN-004-autonomous-merge-authority.md`. **Read that document at that commit before authoring anything**; the transcription below states its boundaries in scope and is not a substitute for it.

| Boundary | What the decision fixes |
|---|---|
| **Two executors, two owners** | A **runtime-owned post-gate integration executor** for the task-to-integration merge, and a **DevOps-owned release merge executor** for the integration-to-`main` merge. The decision requires their implementation tasks to be owned **separately** by `runtime` and `devops`. This amendment must not collapse them into one component, one owner, or one admission predicate |
| **Conditional authority** | It "becomes operational only after the architecture amendment is independently approved, the implementation is independently reviewed and security-validated, the required GitHub controls are configured, and the automated checks demonstrate that the executors cannot bypass their admission predicates". Four conditions, none of which this amendment discharges |
| **Required normal flow, task branch** | Read the authoritative task record and immutable publication facts; confirm every declared pre-merge gate is closed with an authoritative passing verdict; confirm no unresolved blocking High or Critical security finding applies to the target; confirm target branch, base branch, head commit, integration order, and merge method exactly match the approved contracts; **persist merge intent before the external side effect**; squash-merge through the GitHub API **without bypassing branch protection**; verify the resulting tree and record the durable `branch_integrated` ingress fact; let the ordinary scheduler advance lifecycle state and dispatch newly ready work |
| **Required normal flow, release merge** | The same fail-closed pattern, and additionally confirm that **all aggregate review, security, QA, performance, documentation, deployment, and rollback requirements declared for the release are complete** |
| **Conflict and failure handling** | A merge conflict, stale head, missing check, ambiguous state, API failure, or unverifiable result "must not create a routine human merge request". Fail closed, preserve evidence, route a remediation task to the responsible agent role, retry only under the approved bounded retry policy, and "never guess, force a merge, or silently discard a conflicting change" |
| **Residual human exception set — finite, three members** | Formal acceptance of an unresolved blocking High or Critical security risk. Authorization of an irreversible production action when deployment policy explicitly requires it — with the decision stating that "a merge to `main` is not itself such an action unless a later approved policy deliberately couples it to an irreversible production change". Granting, rotating, or revoking credentials and changing repository governance, branch-protection, or authorization policy. **Routine merges are explicitly not human exceptions.** When a case "cannot be classified conclusively as outside this set, automation must refuse it and emit a typed exception record. It must not broaden its own authority" |
| **Prohibited capabilities — eight, binding on both executors** | Author, approve, close, override, or formally accept a gate on work it merges; merge a pull request whose declared pre-merge gates are open or failing; push directly to `main` or set `ALLOW_MAIN_PUSH`; force-push, bypass hooks or branch protection, use an administrator override, or disable a required check; merge governance or enforcement changes under its own authority; release another execution's lock or modify task ownership to make a merge admissible; use a mutable branch head where the contract requires an immutable commit; treat a missing, skipped, timed-out, or cancelled check as passing |
| **Credentials and GitHub controls** | A least-privilege repository credential, preferably a GitHub App installation token with short lifetime and auditable identity, kept outside the repository. "Branch protection and required checks remain authoritative; automation receives merge permission but no bypass permission." Idempotency keys and durable intent/result records must prevent duplicate side effects after retries or restarts |
| **Role assignment** | "No role reassignment is required by this decision. `config/agents/settings.yaml` changes only if an approved architecture later demonstrates that a declared write scope must change; such a change remains human-controlled" |
| **Sequencing** | TASK-013 records the commit and moves this task to `ready`; this task authors the amendment and **must cover task-to-integration and integration-to-`main` automation**; TASK-041 reviews it; **only a passing TASK-041 verdict permits the Orchestrator to create implementation and validation tasks**; existing pull requests continue to obey their current gates and "this decision does not retroactively authorize a gate bypass" |

**The Orchestrator transcribed this decision and did not extend it.** Nothing above is an architectural choice; every row is a constraint read from the decision commit. Where this record adds an obligation the decision does not state, it is marked as such below and it is a refusal rather than an expansion.

**Note that `AGENTS.md` merging into a decision does not mean this task may edit it.** The decision authorizes an `AGENTS.md` amendment; `AGENTS.md` is a human-controlled enforcement path and cannot be changed from an `agent/*` branch, and it is outside this role's declared write scope. See the exclusions in Scope.

## What changed when the decision landed

This record was created at `ACT-018` against the requirement as it then stood — a **single** merge, task branch into the integration branch. `HUMAN-004` authorizes **two**, and the second crosses a different safeguard, belongs to a different role, and gates on a release-readiness set this graph has never declared. `ACT-019` therefore expanded this task's scope and acceptance criteria rather than leaving a record that covers half the decision, and expanded TASK-041's review scope to match. The original single-executor framing is superseded, not deleted: the reasoning below about why no module owns the integration merge applies unchanged to the first executor and applies with more force to the second.

## Why this needs an architecture change rather than an implementation task

The Orchestrator checked the approved architecture at `8ea5c32` — integrated at `de3a8d6` and readable on `integration/autonomous-runtime` — for authority that would let an implementation task be created today. It is not there:

- **The eight-module map assigns no module the integration merge.** `COMPONENT-BOUNDARIES.md` names eight modules and eight owners; none of them owns merging into the integration branch. `INTEGRATION-STRATEGY.md` prescribes the merge **method** and **order** — one squash commit per content integration unit, ADR-0010 as amended by ADR-0016, and ADR-0041 for the cumulative architecture unit — but its executor is the operator.
- **The workspace lifecycle module can publish and cannot merge, by construction.** ADR-0011 and `WORKSPACE-LIFECYCLE.md` give `executeFinalize` commit, push, and pull-request creation or update. Exactly one function in that module constructs a push; its refspec is `refs/heads/<derivedBranch>`, it takes no ref parameter, and a record whose fields would produce another ref is refused before any process is spawned. There is no merge path and no second push target. That is a deliberate structural prohibition with declared tests behind it, not an omission.
- **The `branch_integrated` ingress class already anticipates a producer that does not exist.** `tasks/TASK-001-DEPENDENCY-GRAPH.md` types the class as produced by "the operator or the runtime's integration step". The second producer has never existed; `seq` 4 and `seq` 25 were both operator actions.
- **Governance forbids an agent from supplying the missing half on its own.** `AGENTS.md` requires each agent to push its task branch and use a pull request, marks governance and enforcement files human-controlled, and requires human approval for destructive, privileged, external, or release-changing actions. Merging into the shared integration branch is external and release-changing.

So the requirement crossed two prerequisite layers: a **governance decision** about who may hold the authority, and an **architecture decision** about what the authority's contract, refusal set, and evidence obligations are. **The first is now discharged at `7dc0748`.** This task owns the second.

**The reasoning above applies with more force to the second executor.** Merging `integration/autonomous-runtime` into `main` is the operation the tracked pre-push hook exists to constrain, `AGENTS.md` names `main` explicitly, and no module, script, or workflow in the approved architecture performs it. Neither executor is filling a gap the architecture left open by oversight; both are new authority the decision grants and this amendment must bound.

## Scope

Within the boundaries `HUMAN-004` sets, and no further. Every item below applies to **both** executors unless it names one.

**Ownership and placement**

- Name the module that owns the **runtime** post-gate integration executor, its source path, and its single owner **role** — `runtime` — and place it in the module map, the dependency graph, and the level witness without breaking the two-independent-contract-roots property or introducing a cycle.
- Name the module that owns the **DevOps** release merge executor, its source path, and its single owner **role** — `devops` — and place it the same way. **Keep the two components separate**: the decision requires separately owned implementation tasks, so a single component parameterized by target ref does not satisfy it and is a finding.
- **If either component's natural source path falls outside its owner role's declared `write_scope` in `config/agents/settings.yaml`, say so explicitly and return the placement question rather than deciding it.** `assignments.runtime.write_scope` covers `src/orchestrator/**`, `src/agents/**`, `bin/**`, and their unit tests; `assignments.devops.write_scope` covers the manifests, `.github/workflows/**`, and `scripts/ci|deploy|release|setup|quality/**`. A write-scope change is human-controlled — the decision says so in terms — so the amendment records the requirement and the Orchestrator routes it to the user. This is the same rule TASK-026's placement already carries.

**Admission**

- Define the typed **admission predicate** the **runtime** executor evaluates: the target is `review_ready` under its declared `publication_class`; every gate in the target's `pre_merge_gates` is closed at its authoritative lineage round with a passing or formally accepted verdict; no blocking High or Critical security finding is open against the target; the target branch, base branch, head commit, integration order, and merge method match the approved contracts; and the target's own record is the source of every one of those facts.
- Define the typed **admission predicate** the **DevOps** executor evaluates for the integration-to-`main` merge, including the decision's additional requirement that **all aggregate review, security, QA, performance, documentation, deployment, and rollback requirements declared for the release are complete**. **State how a release's declared requirement set is expressed in this graph's existing vocabulary** — this graph has never declared an aggregate release gate, and inventing one silently would be the defect A-506 and F-601 each describe in a new place. If the vocabulary needs an addition, name it as an addition.
- Both predicates read **immutable commits**, never mutable branch heads, wherever the contract requires an immutable identity. The decision lists using a mutable head where an immutable commit is required as a prohibited capability.

**Refusal**

- Define the **refusal set** as a total, typed result rather than as prose, for each executor. State explicitly what each refuses and **cannot express**: merging a target with an open or failing pre-merge gate; merging ahead of the declared integration order; merging into any ref other than the one that executor is configured for; pushing `main` directly; setting `ALLOW_MAIN_PUSH`; force-pushing; bypassing the pre-push hook, branch protection, or a required check; using an administrator override; force-releasing a lock or modifying task ownership to make a merge admissible; writing a governance or enforcement path; merging a governance or enforcement change under its own authority; treating a missing, skipped, timed-out, or cancelled check as passing; and closing, overriding, authoring, or formally accepting any gate verdict on work it merges.
- **The `main` prohibition and the `main` authority must be distinguished precisely and shown not to collide.** The DevOps executor merges into `main` through the GitHub API under branch protection; it may not **push** `main` and may not set `ALLOW_MAIN_PUSH`. State the mechanism that makes the second unconstructible while the first is permitted, with the declared test.
- Define the **fail-closed** behavior the decision requires for a conflict, stale head, missing check, ambiguous state, API failure, or unverifiable result: no routine human merge request is produced, evidence is preserved, a remediation task is routed to the responsible agent role, and retries are bounded by an approved policy.

**Evidence, ordering, and identity**

- Define the **evidence and ordering contract**: intent is durable **before** the side effect, in the plan/execute shape ADR-0019 and ADR-0027 already require; the squash shape and the exact target-tree equality ADR-0041 requires are verified before the evidence batch is appended; and idempotency keys plus durable intent and result records prevent a duplicate side effect after a retry or a restart, which the decision requires by name.
- State that the resulting `branch_integrated` entry is appended by an **authorized appender** through the TASK-026 ingress store, never by the Orchestrator and never by the executor writing its own trigger.
- State how the **credential** contract is expressed architecturally — least-privilege, short-lived, auditable identity, held outside the repository, carrying merge permission and **no bypass permission**. No credential value, token, or endpoint containing a secret appears in any artifact.

**Exceptions**

- Define the **human exception surface** as a typed, enumerable set of exactly the three members the decision names, not as a discretionary pause. State how each executor **detects** that it is inside the set, what typed exception record it emits when it cannot classify a case, and why refusing is the only representable outcome in that case. The decision's clause that a merge to `main` is not itself an irreversible production action — unless a later approved policy couples it to one — must be represented rather than paraphrased away.

**Relationships this amendment must state rather than assume**

- State how this interacts with the still-unimplemented `HUMAN-002` collector: an integration executor produces a fact that something must append pre-dispatch, and that appender does not exist. Say whether either executor may land before the collector does, and if so what the interim contract is and how it is **named** — the same discipline `MC-005` applied to the bootstrap dispatch contracts.
- State the relationship between the two executors: whether the release executor may act on an integration branch whose task merges were performed by the runtime executor, by the operator, or by a mixture, and what it requires of each.

**Recording**

- Record the decisions as one or more ADRs continuing the existing numbering, and state which earlier decision each supersedes in part, if any.

**Exclusions — each is a refusal, and exceeding one is a finding**

- **Do not implement either executor.** No code, no script, no workflow.
- **Do not author, draft, or edit `AGENTS.md`.** The decision authorizes its amendment; it is a human-controlled enforcement path, it cannot be changed from an `agent/*` branch, and it is outside this role's write scope. **State what the amendment must say and return it**; the Orchestrator routes it to the user.
- **Do not change `config/agents/settings.yaml`**, for the same reason and because the decision reserves it.
- Do not change any structural prohibition, any gate's owner, round, lineage, or verdict, or any write scope.
- Do not create the implementation or validation tasks. Only a passing TASK-041 verdict permits that, and only the Orchestrator may do it.
- Do not assert that this amendment is approved, and do not treat `HUMAN-004` as making the capability exist.
- Do not reopen, retarget, or weaken any relation `LIN-ARCH-REVIEW` closed at round 8, and do not alter TASK-018's or TASK-019's gates, edges, or ordering.

## Acceptance criteria

- [ ] The amendment cites the decision commit `7dc07488a5b1cac8b1327ebd63bf747adbe03c68` and stays inside the boundaries it sets. **An amendment that assumes an authority the decision did not grant is a blocking defect whatever its other merits**, and so is one that silently narrows an authority the decision did grant.
- [ ] **Both** authorized executors are covered: the task-to-`integration/autonomous-runtime` merge and the `integration/autonomous-runtime`-to-`main` release merge. An amendment covering only the first does not satisfy the decision's own sequencing clause.
- [ ] Each executor has exactly one owning module, one source path, and one owner **role**, and the two are **not** collapsed into a single component. The module map, the dependency graph, the level witness, the acyclicity proof, and the two-independent-contract-roots property are each re-derived from the amendment's own target tree rather than inherited from any earlier document or from this record. `MC-011` applies in full: this record deliberately states no count.
- [ ] Where a component's source path would fall outside its owner role's declared write scope, the amendment says so explicitly and **returns** the question instead of deciding it.
- [ ] Each admission predicate is expressed in the typed edge and gate vocabulary this graph already declares — `review_ready`, `pre_merge_gates`, the lineage form of `gate_passed`, and the gate-closure rule — and not in new prose that restates them. Any genuinely new vocabulary the release gate requires is named as an addition rather than introduced silently.
- [ ] Each refusal set is a **total typed result**. Every structural prohibition listed in Scope is shown to be **unconstructible** rather than merely forbidden, with the declared test that demonstrates it — including, specifically, that the DevOps executor cannot push `main`, cannot set `ALLOW_MAIN_PUSH`, and cannot bypass branch protection while still being able to merge through the API.
- [ ] The fail-closed contract is represented: no path produces a routine human merge request, evidence is preserved, remediation is routed to the responsible agent **role**, and retries are bounded.
- [ ] Durable intent precedes every external side effect, and idempotency keys plus durable intent and result records make a duplicate side effect after retry or restart unrepresentable.
- [ ] The human exception set is enumerable, typed, has exactly the three members the decision names, and is **detectable** by each executor; the amendment states what happens when an executor cannot classify a case, and the outcome is refusal with a typed exception record.
- [ ] Neither executor can author, approve, close, override, or formally accept a gate on work it merges, and neither can merge a governance or enforcement change under its own authority.
- [ ] No merge ordering weaker than `INTEGRATION-STRATEGY.md`'s integration order is introduced, and ADR-0041's cumulative-unit rule is preserved unchanged.
- [ ] The relationship to the unimplemented `HUMAN-002` collector is stated explicitly, and no claim is made that either one implies the other.
- [ ] The amendment states plainly, in its own words, that it authors a contract and records no approval of it, and it opens no gate on its own behalf.
- [ ] `AGENTS.md` and `config/agents/settings.yaml` are unmodified. What the `AGENTS.md` amendment must say is stated and returned.
- [ ] No credential, token, or secret-bearing endpoint appears in any artifact.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>` reports a valid result, and every changed path is inside this task's declared write scope.

## Expected artifacts

- `docs/architecture/ARCHITECTURE.md`, as the declared entry-point artifact.
- The amended documents under `docs/architecture/runtime/`.
- One or more ADRs under `docs/adr/`.
- Updated diagrams under `diagrams/architecture/` where the module map changes.

## Dependency notes

- The only scheduling dependency is `human_decision(HUMAN-004)`, and it is **satisfied** at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`. This is the second `human_decision` edge this graph has ever carried; the first was TASK-018's on `HUMAN-001`, satisfied at `fb9f45c`. It was used here for the reason the edge vocabulary states — **work an agent is structurally forbidden to unblock** — and it did what the vocabulary promises: the task waited, a human recorded a durable decision, and the edge released without any agent widening its own authority.
- **This task does not block TASK-018 or TASK-019, and neither of them depends on it.** The toolchain's review gate, its security gate, and its integration are unchanged and proceed on their own edges. Nothing in this record may be read as a reason to delay, accelerate, or bypass them.
- **TASK-018 must never be merged before TASK-019 records a passing verdict.** That is TASK-018's declared `pre_merge_gates: [review]` and it is unaffected by anything this task may later define.
- This task holds `architecture-docs` as its ninth registered holder. The lock is free.

## Gate ownership

The review gate is owned by **TASK-041**, in a separate execution context, under the new gate lineage `LIN-INTEGRATION-AUTHORITY-REVIEW` at `lineage_round` 1. The lineage is new rather than a ninth round of `LIN-ARCH-REVIEW` for a stated reason: `LIN-ARCH-REVIEW`'s cohort is the eight-member remediation chain whose relations all closed together at round 8, and adding a round there would either reopen eight closed relations or silently change what a cohort means. `LIN-TOOLCHAIN-REVIEW` is the precedent — a separate artifact under the same gate name gets its own lineage.

Whether an autonomous integration executor additionally requires a security gate before it may be built is a question for `TASK-041` and for the security owner, not for this record to assert. **The decision names independent reviewer, security, QA, and failure-injection validation for the implementation**, which is a stronger statement about the implementation than about this amendment; it does not itself declare a security gate on this task, and this record does not add one on the decision's behalf.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-040 -Role architect -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-040 -Role architect -Llm gpt` before editing. The `architecture-docs` lock is free; this task is its ninth registered holder.
3. Branch from `integration/autonomous-runtime`, at or after `de3a8d6`, so the approved architecture is present. Resolve the immutable branch point inside the worktree with `git merge-base HEAD integration/autonomous-runtime` and record the resolved value in the handoff. Never pass `origin/main`, `c325275`, or a review-diff base to `-BaseRef`.
4. Read `plans/decisions/HUMAN-004-autonomous-merge-authority.md` at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68` before authoring.
5. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
6. Commit, publish as the environment permits, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-040 -Role architect -Llm gpt`. **Never push `main` and never merge anything** — including under this amendment, which authorizes a capability that does not exist and confers nothing on the task that authors it.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Governance decision consumed: **`HUMAN-004`, approved** at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`, consumed by TASK-013 activation `ACT-019` as ingress entry `seq` 27. Its boundaries are transcribed above and its full text is at `plans/decisions/HUMAN-004-autonomous-merge-authority.md` at that commit. **The decision authorizes a capability; it does not create one, and this amendment does not create one either.**
- Next owner: **architect / gpt for this task**, `ready` and dispatchable now. Then **reviewer / gpt for TASK-041**, `LIN-INTEGRATION-AUTHORITY-REVIEW` round 1, which is `blocked` until this task publishes. **Only a passing TASK-041 verdict permits the Orchestrator to create the implementation and validation tasks**, which are separately owned by `runtime` and `devops` and do not exist. The `AGENTS.md` amendment, the GitHub branch-protection and required-check configuration, and the least-privilege credential remain the **user's**, authorized and unperformed.
