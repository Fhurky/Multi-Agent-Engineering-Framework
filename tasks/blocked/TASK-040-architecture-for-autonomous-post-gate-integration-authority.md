---
task_id: TASK-040
title: Architecture amendment for autonomous post-gate integration authority
status: blocked
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
    status: open
    decided_at: null
    decided_on: null
    effect: null
    question: May a non-human component of this system perform the squash-merge of an approved task branch into integration/autonomous-runtime, record the branch_integrated fact, and dispatch newly ready work, without a human in the loop - and what is the exact residual human exception set?
blocked_reason: The user requirement this task represents needs a governance decision that no agent may make or presuppose. HUMAN-004 is open. AGENTS.md requires every agent to push its task branch and use a pull request, reserves governance and enforcement paths for humans, and requires human approval for privileged, external, and release-changing actions; the approved architecture assigns the integration merge to the operator and gives no module a path that can push or merge any ref but its own task branch. Authoring the amendment before the decision would be inventing the authority it depends on.
exit_condition: A human records HUMAN-004 in a tracked commit on a non-agent branch, stating whether autonomous post-gate integration is authorized, which component may hold that authority, what the residual human exception set is, and which governance artefacts change. That commit is an ingress fact of class human_decision_recorded; the TASK-013 activation that consumes it moves this record to ready and pins the decision commit here. A decision that refuses the change closes this task instead.
review_target_base: not applicable until this task publishes
review_target_applicability: not applicable yet. This task is gated but no artifact of it exists, so no round is pinned and there is no delta to diff. It becomes applicable when this task reaches review_ready; the Orchestrator records review_target_commit and review_target_base then, at the activation that consumes the publication.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime at or after the commit carrying the approved architecture, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-040: Architecture amendment for autonomous post-gate integration authority

## Objective

Define, in the approved architecture, the contract under which the system itself may squash-merge an approved task branch into `integration/autonomous-runtime`, produce the `branch_integrated` ingress fact, and let the ordinary scheduling loop dispatch the work that fact releases — so that routine human merging becomes zero and the human remains only for the explicitly named policy exceptions.

**This task authors a contract. It does not authorize the capability and does not build it.** The authorization is `HUMAN-004`; the implementation is a separate task that does not exist and may not be created until this amendment is approved.

## The requirement this task represents

The user stated it in the control session on 2026-08-06, and it is recorded here verbatim in substance rather than paraphrased into a design:

- Routine human GitHub merging must become **zero**.
- After the required independent gates pass, the system should **automatically squash-merge the approved task pull request into `integration/autonomous-runtime`**, record `branch_integrated`, advance the task's lifecycle state, and dispatch the work that becomes ready.
- Humans remain only for **explicit policy exceptions** — the named examples are formal acceptance of a blocking High or Critical security risk, and authorization of an irreversible production action.

The Orchestrator routed this requirement without implementing it, approving it, or weakening any safeguard to accommodate it. Nothing in this record is a decision that the requirement will be adopted.

## Why this needs an architecture change rather than an implementation task

The Orchestrator checked the approved architecture at `8ea5c32` — integrated at `de3a8d6` and readable on `integration/autonomous-runtime` — for authority that would let an implementation task be created today. It is not there:

- **The eight-module map assigns no module the integration merge.** `COMPONENT-BOUNDARIES.md` names eight modules and eight owners; none of them owns merging into the integration branch. `INTEGRATION-STRATEGY.md` prescribes the merge **method** and **order** — one squash commit per content integration unit, ADR-0010 as amended by ADR-0016, and ADR-0041 for the cumulative architecture unit — but its executor is the operator.
- **The workspace lifecycle module can publish and cannot merge, by construction.** ADR-0011 and `WORKSPACE-LIFECYCLE.md` give `executeFinalize` commit, push, and pull-request creation or update. Exactly one function in that module constructs a push; its refspec is `refs/heads/<derivedBranch>`, it takes no ref parameter, and a record whose fields would produce another ref is refused before any process is spawned. There is no merge path and no second push target. That is a deliberate structural prohibition with declared tests behind it, not an omission.
- **The `branch_integrated` ingress class already anticipates a producer that does not exist.** `tasks/TASK-001-DEPENDENCY-GRAPH.md` types the class as produced by "the operator or the runtime's integration step". The second producer has never existed; `seq` 4 and `seq` 25 were both operator actions.
- **Governance forbids an agent from supplying the missing half on its own.** `AGENTS.md` requires each agent to push its task branch and use a pull request, marks governance and enforcement files human-controlled, and requires human approval for destructive, privileged, external, or release-changing actions. Merging into the shared integration branch is external and release-changing.

So the requirement crosses two prerequisite layers: a **governance decision** about who may hold the authority, and an **architecture decision** about what the authority's contract, refusal set, and evidence obligations are. This task owns the second and is blocked on the first.

## Scope

Only if `HUMAN-004` authorizes the change, and only within the boundaries it sets:

- Name the module that owns the post-gate integration executor, its source path, and its single owner task, and place it in the module map, the dependency graph, and the level witness without breaking the two-independent-contract-roots property or introducing a cycle.
- Define the typed **admission predicate** the executor evaluates before it may act: the target is `review_ready` under its declared `publication_class`; every gate in the target's `pre_merge_gates` is closed at its authoritative lineage round with a passing or formally accepted verdict; no blocking High or Critical security finding is open against the target; and the target's own record is the source of every one of those facts.
- Define the **refusal set** as a total, typed result rather than as prose. State explicitly what the executor refuses and cannot express: merging a target with an open gate; merging ahead of the declared integration order; merging into any ref but the configured integration branch; pushing `main`; setting `ALLOW_MAIN_PUSH`; bypassing the pre-push hook; force-releasing a lock; writing a governance path; and closing, overriding, or authoring any gate verdict.
- Define the **evidence and ordering contract** for an autonomous integration: the intent is durable before the side effect, in the plan/execute shape ADR-0019 and ADR-0027 already require; the squash shape and exact target-tree equality ADR-0041 requires are verified before the evidence batch is appended; and the resulting `branch_integrated` entry is appended by an authorized appender through the TASK-026 ingress store, never by the Orchestrator and never by the executor writing its own trigger.
- Define the **human exception surface** as a typed, enumerable set rather than as a discretionary pause: formal acceptance of a blocking High or Critical security finding, and authorization of an irreversible production action. State how the executor detects that it is inside the exception set, and what it does when it cannot decide.
- State how this interacts with the still-open `HUMAN-002` collector: the integration executor produces a fact that something must append pre-dispatch, and that appender does not exist yet. Say whether the executor may land before the collector does, and if so what the interim contract is and how it is named — the same discipline `MC-005` applied to the bootstrap dispatch contracts.
- Record the decision as one or more ADRs continuing the existing numbering, and state which earlier decision each supersedes in part, if any.
- **Exclude** implementing the executor, changing any structural prohibition, changing any gate's owner or verdict, changing `AGENTS.md` or `config/agents/settings.yaml`, and asserting that the requirement is approved.

## Acceptance criteria

- [ ] The amendment is authored only after `HUMAN-004` is recorded, and it cites the decision commit. Every boundary the decision sets is respected; nothing beyond it is assumed.
- [ ] The integration executor has exactly one owning module, one source path, and one owner task, and the module map, the dependency graph, the level witness, the acyclicity proof, and the two-independent-contract-roots property are each re-derived from the amendment's own target tree rather than inherited from any earlier document or from this record. `MC-011` applies in full: this record deliberately states no count.
- [ ] The admission predicate is expressed in the typed edge and gate vocabulary this graph already declares — `review_ready`, `pre_merge_gates`, the lineage form of `gate_passed`, and the gate-closure rule — and not in new prose that restates them.
- [ ] The refusal set is a total typed result. Every structural prohibition listed in the scope above is shown to be unconstructible rather than merely forbidden, with the declared test that demonstrates it.
- [ ] The human exception set is enumerable, typed, and detectable by the executor, and the amendment states what happens when the executor cannot classify a case.
- [ ] No merge ordering weaker than `INTEGRATION-STRATEGY.md`'s integration order is introduced, and ADR-0041's cumulative-unit rule is preserved unchanged.
- [ ] The amendment states plainly, in its own words, that it authors a contract and records no approval of it, and it opens no gate on its own behalf.
- [ ] The relationship to the open `HUMAN-002` collector is stated explicitly, and no claim is made that either one implies the other.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result against the resolved branch point, and every changed path is inside this task's declared write scope.

## Expected artifacts

- `docs/architecture/ARCHITECTURE.md`, as the declared entry-point artifact.
- The amended documents under `docs/architecture/runtime/`.
- One or more ADRs under `docs/adr/`.
- Updated diagrams under `diagrams/architecture/` where the module map changes.

## Dependency notes

- The only scheduling dependency is `human_decision(HUMAN-004)`. This is the second `human_decision` edge this graph has ever carried; the first was TASK-018's on `HUMAN-001`, removed when `fb9f45c` satisfied it. It is used here for the reason the edge vocabulary states: **work an agent is structurally forbidden to unblock.**
- **This task does not block TASK-018 or TASK-019, and neither of them depends on it.** The toolchain's review gate, its security gate, and its integration are unchanged and proceed on their own edges. Nothing in this record may be read as a reason to delay, accelerate, or bypass them.
- **TASK-018 must never be merged before TASK-019 records a passing verdict.** That is TASK-018's declared `pre_merge_gates: [review]` and it is unaffected by anything this task may later define.
- This task holds `architecture-docs` as its ninth registered holder. The lock is free.

## Gate ownership

The review gate is owned by **TASK-041**, in a separate execution context, under the new gate lineage `LIN-INTEGRATION-AUTHORITY-REVIEW` at `lineage_round` 1. The lineage is new rather than a ninth round of `LIN-ARCH-REVIEW` for a stated reason: `LIN-ARCH-REVIEW`'s cohort is the eight-member remediation chain whose relations all closed together at round 8, and adding a round there would either reopen eight closed relations or silently change what a cohort means. `LIN-TOOLCHAIN-REVIEW` is the precedent — a separate artifact under the same gate name gets its own lineage.

Whether an autonomous integration executor additionally requires a security gate before it may be built is a question for `TASK-041` and for the security owner, not for this record to assert.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Governance decision consumed: `HUMAN-004`, **open**. Nothing has been decided.
- Next owner: **user**, to record or refuse `HUMAN-004`. Then architect / gpt for this task, then reviewer / gpt for TASK-041.
