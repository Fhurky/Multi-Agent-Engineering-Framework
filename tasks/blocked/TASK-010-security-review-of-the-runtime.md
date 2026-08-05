---
task_id: TASK-010
title: Security review of the autonomous runtime
status: blocked
owner_role: security
llm: gpt
branch: agent/gpt/security/task-010
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-security-task-010
write_scope:
  - reports/security/SECURITY_REPORT.md
  - reports/security/**
  - specs/security/**
dependencies:
  - task: TASK-003
    edge: review_ready
  - task: TASK-004
    edge: review_ready
  - task: TASK-005
    edge: review_ready
  - task: TASK-006
    edge: review_ready
  - task: TASK-007
    edge: review_ready
  - task: TASK-008
    edge: review_ready
  - task: TASK-017
    edge: review_ready
  - task: TASK-018
    edge: review_ready
  - task: TASK-026
    edge: review_ready
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-003
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
  - task: TASK-004
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
  - task: TASK-005
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
  - task: TASK-006
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
  - task: TASK-007
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
  - task: TASK-008
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
  - task: TASK-017
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
  - task: TASK-018
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-TOOLCHAIN-SECURITY
    lineage_round: 1
  - task: TASK-026
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
gate_scheduling: Every gate this task owns is an aggregate assembly gate and every one is retrospective. Reasons and recorded risks are in the aggregate and retrospective gate register in tasks/TASK-001-DEPENDENCY-GRAPH.md, rows "TASK-010 / security / runtime cohort" and "TASK-010 / security / TASK-018". TASK-018 is not the only retrospective case; it is the earliest and longest-exposed one.
parent_task: TASK-001
publication_class: bootstrap
blocked_reason: The runtime implementation tasks have not published their branches. The cohort gained TASK-026, the durable ingress inbox, at activation ACT-004.
exit_condition: TASK-003 through TASK-008, TASK-017, TASK-018, and TASK-026 are review_ready, each with an immutable published commit. This task does not wait for those tasks to be integrated or to reach done, because it is the gate that lets them reach done. It is nevertheless an aggregate gate for all nine targets, and every target is already integrated by the time it runs.
---

# TASK-010: Security review of the autonomous runtime

## Objective

Threat model the autonomous runtime, perform the security gate for TASK-003 through TASK-008, and record risk findings with remediation requirements.

## Scope

- Threat model the supervisor, durable state, scheduler, provider adapters, workspace lifecycle, lifecycle entry point, and recovery layer.
- Assess the workspace lifecycle from TASK-017 specifically: that the runtime cannot create a branch or worktree outside the `agent/<llm>/<role>/<task-id>` convention, cannot edit the primary checkout, cannot force-release another session's task lock, cannot bypass the tracked pre-push hook or push to `main`, and cannot modify a human-controlled governance path.
- Assess the three provider adapters from TASK-004: that no credential reaches an argument vector, a diagnostic, a log, an event, or a persisted record, and that provider standard output is treated as untrusted input rather than as a trusted instruction to the supervisor.
- Verify that credentials and tokens are never persisted in state, checkpoints, logs, run events, reports, or test fixtures.
- Verify that agent output, task records, and provider responses are treated as untrusted input.
- Verify that the one-input bootstrap cannot be used to write outside its intended run-scoped output location.
- Verify that lease and fencing token handling cannot be bypassed to gain unauthorized concurrent write access.
- Assess the TASK-018 toolchain retrospectively: review the dependency inventory TASK-019 produced, assess the supply-chain surface of every added devDependency, and confirm that ADR-0001's zero-third-party-runtime-dependency rule held. This assessment is retrospective by design — the toolchain merges at Wave 2 because no code exists to threat-model before it. It is **not** the only retrospective gate this task owns; every security gate in the runtime cohort is retrospective as well, and all of them are registered in `tasks/TASK-001-DEPENDENCY-GRAPH.md`.
- Record security requirements under `specs/security/` where a durable requirement is missing.
- Assign a severity to each finding and mark high and critical findings as delivery blocking.
- Exclude implementing remediation code, feature work, and approval of another role's gate.

## Acceptance criteria

- [ ] A threat model covers every runtime component from TASK-003 through TASK-008 plus TASK-017.
- [ ] Git worktree, branch, task-lock, push-protection, and governance-path integrity are explicitly assessed for the automated workspace lifecycle.
- [ ] Secret handling, untrusted input handling, bootstrap write boundaries, and lease integrity are each explicitly assessed.
- [ ] Each finding records severity, affected component, the responsible child task ID, and the required remediation outcome.
- [ ] High and critical findings are marked as blocking delivery until resolved or formally accepted by an authorized human.
- [ ] No production source file is modified by this task.
- [ ] No secret value or scanner output containing a secret is committed.
- [ ] All changed files remain inside this task's declared write scope.

### Amended-behavior obligations

Finding **F-202** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md` recorded that the required-behavior coverage matrix named this task as the independent validator of several amended behaviors that this record did not require it to assess. Each criterion below is cited by exactly one row of that matrix and must be answered explicitly, with an assessment result and the affected component. An implementing task's own tests do not satisfy any of them.

- [ ] **`V10-A003-CTL` — live-run control protocol.** Assess the delivered live-run control path against the amended contract: transport, request identity, acknowledgement, durable ordering, the ownership or authentication check, and stale-request behavior. An unauthenticated or unowned control channel that can pause or stop a foreground supervisor, or a replayable control request, is a High finding.
- [ ] **`V10-A003-TREE` — process-tree ownership, child and grandchild termination.** Assess that every provider invocation runs inside an owned process group or Windows Job Object equivalent with a durable invocation identity, that cancellation escalates within a bounded time and verifies tree exit, and that a **grandchild** that ignores the first cancellation and outlives the command timeout cannot survive as an unmanaged descendant. Assess that recovery detects, fences, or terminates an orphan belonging to a recorded invocation. A surviving descendant holding a worktree, a lock, or a credential-bearing environment is a High finding.
- [ ] **`V10-A004-LOCK` — named resource-lock integrity.** Assess whether named resource-lock admission can be bypassed to obtain concurrent write access to a shared surface, including through lease expiry, a stale fencing token, or a task record that declares no lock for a scope that overlaps one.
- [ ] **`V10-F105` — publication and pull-request authorization.** Assess the publication path: that the constructed push refspec can target only `refs/heads/agent/<llm>/<role>/<task-id>`, that no path can push `main` or set `ALLOW_MAIN_PUSH` or bypass the tracked pre-push hook, that pull-request creation uses only credentials read through `SecretProvider` and leaks none into a command vector, a log, an event, or a persisted record, and that an unauthorized pull-request attempt produces a `blocked` outcome rather than a fallback to a different target. Assess that the persisted branch, commit, and pull-request identity contains no credential.
- [ ] **`V10-F301-AUTH` — ingress fact authenticity and untrusted input.** Assess the ingress inbox as a trust boundary. An entry is derived from commit, report, and handoff text that agents and humans author, so assess: that every field is validated against the contract types before it becomes an entry field; that no entry field is used to derive a filesystem path, a ref name, an environment variable, or a command argument; that a forged or replayed fact cannot displace, renumber, or overwrite an existing entry, because `fact_id` is identity-keyed and `seq` is assigned once; that `content_hash` detects a source artifact rewritten under the same path; and that no credential, token, or secret value can reach an entry, the consumption ledger, or a log line. Assess the self-exclusion rule as a control: a commit authored by the recurring task's own activation must not be able to raise the dispatch signal.
- [ ] **`V10-TOOLCHAIN` — retrospective toolchain assessment.** Using the dependency inventory TASK-019 produced, assess the supply-chain surface of every devDependency TASK-018 added, by name, version, and purpose, and confirm that ADR-0001's zero-third-party-runtime-dependency rule actually held in the delivered `package.json` and lockfile. Record explicitly that this assessment is retrospective and state the exposure window in waves.

## Expected artifacts

- `reports/security/SECURITY_REPORT.md` summary.
- Detailed findings under `reports/security/`.
- `reports/security/AMENDED-BEHAVIOR-ASSESSMENT.md`, recording the result and evidence for each of the six tagged obligations: `V10-A003-CTL`, `V10-A003-TREE`, `V10-A004-LOCK`, `V10-F105`, `V10-TOOLCHAIN`, and `V10-F301-AUTH`.
- Security requirements under `specs/security/` when a durable requirement is missing.

## Gate and remediation path

This task performs the security gate for TASK-003 through TASK-008, TASK-017, and TASK-018, declared in the `gate_for` field. A `gate_for` declaration is not a scheduling dependency: this task becomes dispatchable when its targets reach `review`, and its targets reach `done` only after this task records a verdict.

**Every gate this task owns is `aggregate` and `retrospective`**, declared on both sides of each pair and registered with a reason and a recorded risk in `tasks/TASK-001-DEPENDENCY-GRAPH.md`. The consequence is stated plainly: eight targets are already integrated on `integration/autonomous-runtime` before this gate runs, so a High or Critical finding at Wave 7 blocks delivery for the whole graph rather than for one branch. Finding F-203 recorded that revision 3 claimed only the TASK-018 pair was retrospective.

Remediation is performed by the responsible implementation owner, not by this role. Findings return through TASK-013, which reopens the named child task, and this role revalidates afterward in a new round with a new task. High and critical findings block delivery until they are resolved or formally accepted by an authorized human. Publishing this task's report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in `reports/security/SECURITY_REPORT.md` and in the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
