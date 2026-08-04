---
task_id: TASK-001
title: Decompose the autonomous multi-agent runtime
status: review
owner_role: orchestrator
llm: claude
branch: agent/claude/orchestrator/task-001
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-orchestrator-task-001
write_scope:
  - tasks/**
resource_lock: task-records
dependencies: []
required_gates:
  - review
gate_tasks:
  - task: TASK-014
    gate: review
revision: 2
---

# TASK-001: Decompose the autonomous multi-agent runtime

## Objective

Create an executable dependency-ordered task graph for a single-command autonomous supervisor that can start, gracefully pause, checkpoint, resume, and complete multi-agent project runs.

## Scope

- Create a Solution Architect task for the runtime architecture and ADRs.
- Create blocked Runtime Engineer tasks for supervisor, durable state, provider adapters, scheduling, lifecycle control, workspace automation, and recovery.
- Create independent Reviewer, Security, QA, and Performance tasks with explicit dependencies, including an independent review of the architecture itself.
- Require deterministic task state transitions, bounded concurrency, leases, fencing tokens, idempotent retries, and durable checkpoints.
- Require the mandatory isolated-execution protocol — hooks, branch, worktree, lock, scope validation, handoff, release, crash-safe cleanup — to be performed by the runtime rather than by a human.
- Require working non-interactive adapters for every configured LLM family.
- Require a one-input project bootstrap that automatically creates the initial Manager task.
- Exclude architecture authorship, runtime implementation, independent approval, and release.

## Acceptance criteria

- [x] Every child task has one owner, one LLM family, explicit typed dependencies, acceptance criteria, gates, artifacts, branch, worktree, and a write scope that is either non-overlapping or serialized by a declared resource lock.
- [x] Architecture completes and passes an independent review gate before runtime implementation starts.
- [x] Runtime implementation tasks can proceed in parallel only when their write scopes do not overlap and they hold no common resource lock.
- [x] Review, Security, QA, and Performance run in separate execution contexts after their dependencies are ready, and gate readiness cannot deadlock against terminal completion.
- [x] Start, graceful drain, checkpoint, pause, resume, completion, timeout, crash recovery, and retry behavior are covered.
- [x] The mandatory worktree, branch, lock, validation, handoff, and release protocol is owned by an implementation task with crash-safe cleanup and acceptance tests.
- [x] Every task-record lifecycle transition is owned by a role whose configured write scope includes `tasks/**`.
- [x] The task graph includes an explicit path from implementation findings back to the responsible author.

These boxes record the author's own assessment. They are confirmed only when TASK-014 round 2 records a passing verdict. The Claude Orchestrator that authored this decomposition may not close its own review gate.

## Expected artifacts

- Architecture task records assigned to `architect` / `claude`.
- Runtime implementation task records assigned to `runtime` / `claude`.
- A delivery task record assigned to `devops` / `claude`.
- Independent validation task records assigned to their configured LLM families.
- Durable handoff notes identifying dependency order, edge semantics, and next owners.

## Produced task graph

| Task | Owner role | LLM | Depends on | State |
|---|---|---|---|---|
| TASK-002 Runtime architecture and ADRs | architect | claude | — | review |
| TASK-003 Durable run state and checkpoints | runtime | claude | TASK-002 gate, TASK-018 | blocked |
| TASK-004 Provider adapters and agent workers | runtime | claude | TASK-002 gate, TASK-018 | blocked |
| TASK-005 Scheduling, leases, fencing, bounded concurrency | runtime | claude | TASK-002 gate, TASK-003, TASK-004 | blocked |
| TASK-006 Supervisor core and state machine | runtime | claude | TASK-002 gate, TASK-003, TASK-004, TASK-005, TASK-017 | blocked |
| TASK-007 Lifecycle control and one-input bootstrap | runtime | claude | TASK-002 gate, TASK-006 | blocked |
| TASK-008 Crash recovery, timeouts, idempotent retries | runtime | claude | TASK-002 gate, TASK-003, TASK-004, TASK-006, TASK-017 | blocked |
| TASK-009 Independent code review of the runtime | reviewer | gpt | TASK-003 … TASK-008, TASK-017 | blocked |
| TASK-010 Security review of the runtime | security | gpt | TASK-003 … TASK-008, TASK-017 | blocked |
| TASK-011 QA validation of the runtime | qa | gemini | TASK-003 … TASK-008, TASK-017 | blocked |
| TASK-012 Performance validation of the runtime | performance | gemini | TASK-005, TASK-006, TASK-008, TASK-017, TASK-011 verdict | blocked |
| TASK-013 Task-record lifecycle transitions and gate closure | orchestrator | claude | — | ready, recurring |
| TASK-014 Independent review of this decomposition | reviewer | gpt | TASK-001 | ready, round 2 |
| TASK-015 Independent architecture review of TASK-002 | reviewer | gpt | TASK-002 | ready |
| TASK-016 Architecture amendment: agent workspace lifecycle | architect | claude | TASK-002 gate | blocked |
| TASK-017 Agent workspace lifecycle automation | runtime | claude | TASK-016 gate, TASK-003, TASK-018 | blocked |
| TASK-018 Runtime toolchain bootstrap | devops | claude | TASK-002 gate, HUMAN-001 | blocked |
| TASK-019 Independent review of the runtime toolchain | reviewer | gpt | TASK-018 | blocked |

Edge types, gate assignment, resource locks, the write-scope partition, the reconciliation with the TASK-002 architecture, the required-behavior coverage matrix, and the findings return path are recorded in `tasks/TASK-001-DEPENDENCY-GRAPH.md`.

## Revision 2 — remediation of the TASK-014 round 1 review

TASK-014 round 1 returned `changes-required` in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`, commit `8ac0dbd`. Every finding is addressed below. The dispositions are the author's claims; TASK-014 round 2 decides whether they hold.

### F-001 — High — Mandatory isolated worker lifecycle unassigned

Created **TASK-017**, owned by `runtime` / `claude`, scoped to `src/orchestrator/workspace/**` and `tests/unit/orchestrator/workspace/**`. It owns hook verification and installation, branch and worktree creation, task-lock claim, execution inside the worktree, write-scope validation before handoff, durable commit and handoff persistence, lock release on every terminal path, and crash-safe reconciliation of orphaned worktrees, branches, and locks. It invokes the existing human-controlled PowerShell orchestration scripts and is explicitly forbidden from modifying, wrapping around, or reimplementing them.

Because the TASK-002 module map has no owner for this responsibility, the architecture must be amended first. Created **TASK-016**, owned by `architect` / `claude`, to add the seventh module, its interface contract, its crash-safe cleanup specification, and ADR-0011. This routing follows the contract change control procedure in `docs/architecture/runtime/INTEGRATION-STRATEGY.md`. TASK-017 carries `gate_passed(TASK-016)`; TASK-006 and TASK-008 carry `implementation_published(TASK-017)`.

TASK-017 also carries explicit safety criteria: it cannot push to `main`, cannot set `ALLOW_MAIN_PUSH`, cannot force-release another session's lock, cannot write a governance path, and cannot derive a branch or path from agent output.

### F-002 — High — TASK-002's review gate had no owner

Created **TASK-015**, owned by `reviewer` / `gpt`, scoped to `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`. It reviews all 25 files of commit `9576fc9` against TASK-002's own acceptance criteria and records the verdict that satisfies `gate_passed(TASK-002)`. It is re-entrant: round 1 gates TASK-002, round 2 gates the TASK-016 amendment.

Applying the finding's general lesson rather than only its stated instance, the gate table in the dependency graph was then built for the whole graph and revealed a second instance of the same defect: TASK-018 merges at Wave 2 but its review gate would have been owned by TASK-009 at Wave 7, leaving an unreviewed toolchain on `main` while three tasks compiled against it. Created **TASK-019**, owned by `reviewer` / `gpt`, scoped to `reports/code-review/TASK-018-TOOLCHAIN-REVIEW.md`, dispatchable as soon as TASK-018 publishes. Every `required_gates` entry in the graph now has an owner that is schedulable when its target publishes, with one deliberate and stated exception: TASK-018's security gate is retrospective at TASK-010, because no code exists to threat-model before a toolchain exists.

### F-003 — High — Dependency and gate readiness formed an unschedulable cycle

Introduced a typed edge vocabulary — `gate_passed`, `implementation_published`, `gate_recorded`, `terminal`, `human_decision` — each with one satisfying condition, plus a separate `gate_for` / `gate_tasks` reverse relation that is explicitly **not** a scheduling edge. Dispatchability and doneness are now evaluated over two different edge sets pointing in opposite directions.

Stated the no-deadlock invariant in three parts, verified this graph against it with an explicit topological order, and assigned enforcement to **TASK-005**, whose scope and acceptance criteria now require ready-task selection over typed edges, load-time rejection of an invalid graph, and a no-deadlock test over the full TASK-001 graph. Every record's `dependencies` field was rewritten into the typed form and every `exit_condition` restated accordingly.

### F-004 — High — Consumers and QA could run before TASK-004 completed

Added the missing edges rather than introducing an integration milestone, because the dependency is a compile-time import of `src/agents/contracts/` in each case:

| Task | Added edge | Reason |
|---|---|---|
| TASK-005 | `implementation_published(TASK-004)` | Consumes the worker result and work assignment contract |
| TASK-006 | `implementation_published(TASK-004)` | Invokes agent workers |
| TASK-008 | `implementation_published(TASK-004)` | Retry policy is defined over `DISPOSITION_BY_CLASS` |
| TASK-011 | `implementation_published` on TASK-003, TASK-004, TASK-005, TASK-006 | Previously depended only on TASK-007 and TASK-008 and claimed the rest transitively, which never implied TASK-004 |

TASK-011's exit condition no longer infers dependencies from another task's dependency list, and its acceptance criteria now require coverage to be stated per named dependency. TASK-009, TASK-010, and TASK-011 additionally gained `implementation_published(TASK-017)`. The waves were re-derived from the new edges.

### F-005 — Medium — Declared write scopes overlapped despite the non-overlap invariant

One overlap eliminated by path: **TASK-009's scope was narrowed** from `reports/code-review/**` to `reports/code-review/REVIEW.md` and `reports/code-review/runtime/**`, making it disjoint from TASK-014's, TASK-015's, and TASK-019's single files. The four reviewer-owned tasks are now mutually path-disjoint by construction, and no sequencing assumption remains.

Two overlaps are real and are now honestly serialized rather than described as disjoint. TASK-001 and TASK-013 both own `tasks/**`; TASK-002 and TASK-016 both amend the architecture documents. Each pair declares a machine-readable `resource_lock` field — `task-records` and `architecture-docs` — with four stated semantics, and **TASK-005 must enforce resource-lock exclusion at admission alongside write-scope exclusion**. The dependency graph no longer claims that no two tasks share a scope; it states which two pairs do and what serializes them.

### F-006 — High — TASK-004 could pass without implementing the three configured providers

Rewrote TASK-004. It now names `claude`, `gpt`, and `gemini` as required deliverables with a table mapping each to the roles that depend on it, and defines adapter-level acceptance criteria in five groups: command discovery with an override-then-`PATH` resolution order across Windows and POSIX; deterministic non-interactive invocation construction with the worktree as working directory and no credential in the argument vector; cancellation that terminates the child process tree within the timeout bound; result parsing with an exhaustive classification table over the closed ten-member taxonomy; and a `diagnose()` capability reporting executable presence, resolved path, version, and credential variable names only.

Committed tests remain offline: provider processes are exercised through an injected process-spawn interface with fakes and local script fixtures. A real-provider smoke check is opt-in, non-default, and excluded from CI. TASK-009, TASK-010, and TASK-011 each gained a matching verification obligation, so an adapter set that satisfies only the registry abstraction is a finding rather than a pass.

### F-007 — High — Lifecycle-update instructions required out-of-scope task-record edits

Every instruction telling a non-Orchestrator role to move a task record or edit its `status` was removed, from both the graph's operational notes and TASK-014's operational steps. Every task record gained a "Task-record lifecycle" section stating that its `status` and directory are changed only by the Orchestrator, and that the owner records its handoff in its commit message, pull request description, and role report instead. Each record's Handoff section is now labelled as Orchestrator-maintained.

**TASK-013 was reworked** from a single-shot end-of-run task into the recurring owner of every task-record mutation, retitled accordingly, moved from `blocked` to `ready`, and given no scheduling dependencies — because its first transition, unblocking TASK-003 and TASK-004 after TASK-015 passes, happens before any implementation runs. It carries a trigger table and an acceptance criterion that `git log --follow` over `tasks/` shows only `agent/claude/orchestrator/*` branches for the whole run. The dependency graph states per-actor what may and may not be written.

### Reconciliation with Architect commit 9576fc9

Beyond the seven findings, the graph was reconciled with the completed TASK-002 architecture:

- The six-module map, its source paths, and its owner tasks were checked against the write-scope partition; they agree.
- The two contract roots and the contract change control rule were restated in TASK-003 and TASK-004, and TASK-009 must verify both roots against `INTERFACE-CONTRACTS.md` by diff.
- The architecture's integration and merge order became the wave order.
- Both ownership gaps the architect recorded but could not close are now nodes in the scheduling graph: the toolchain as **TASK-018** and the workspace lifecycle as **TASK-016** plus **TASK-017**.

### Item requiring a human decision — HUMAN-001

TASK-018 needs `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**`. None is inside the devops role's configured `write_scope`, and `config/agents/settings.yaml` is a human-controlled governance path that no agent branch may change. The task therefore declares only the paths devops may write today, lists the rest under `requested_write_scope_extension`, and carries a `human_decision(HUMAN-001)` edge with three options and a recommendation. **Wave 3 cannot start until a human records that decision.** The Orchestrator cannot resolve it without either editing a governance file from an agent branch or declaring a scope the validator rejects.

## Review gate

This task declares `required_gates: [review]`. That gate is owned by `tasks/ready/TASK-014-independent-review-of-the-task-001-decomposition.md`, assigned to `reviewer` / `gpt` on branch `agent/gpt/reviewer/task-014`, producing `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`. Round 1 returned `changes-required`; round 2 reviews this revision. TASK-001 may not move to `tasks/done/` until round 2 records a passing verdict, and the Claude Orchestrator that authored this decomposition may not close that gate itself.

The gate relation is recorded as `gate_for` on TASK-014 and `gate_tasks` on this record. It is not a scheduling edge, which is why TASK-014 can be dispatchable while TASK-001 is still in `review`.

## Handoff

- Commit or pull request: recorded on branch `agent/claude/orchestrator/task-001`. No push and no merge were performed by this execution.
- Verification:
  - `scripts/orchestration/claim-task.ps1 -TaskId TASK-001 -Role orchestrator -Llm claude` succeeded and the lock was held for the whole edit.
  - `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef governance/autonomous-runtime-bootstrap` reported `valid = true` with every changed path inside `tasks/**`.
  - `scripts/ci/validate-framework.ps1` and `scripts/ci/test-orchestration.ps1` passed.
  - Each record was rechecked for a single owner, a single LLM family, a typed dependency list, acceptance criteria, gates, artifacts, branch, worktree, and a write scope that is a subset of its role's configured scope in `config/agents/settings.yaml`.
  - The 19-node graph was checked against the no-deadlock invariant by constructing a topological order and confirming that no gate task holds a `gate_passed` or `terminal` edge to a task it gates.
  - Every `gate_for` entry was checked against the corresponding `gate_tasks` entry. This check is what surfaced the unowned TASK-018 review gate, which is why TASK-019 exists.
  - Every declared write scope was compared pairwise; the only remaining overlaps are the two resource-lock pairs.
- Known risks:
  - **TASK-018 blocks Wave 3 and only a human can unblock it.** Until HUMAN-001 is recorded, TASK-003, TASK-004, and TASK-017 cannot compile or test, so no runtime implementation can start.
  - TASK-016 amends an architecture that has not yet passed TASK-015. If TASK-015 round 1 returns `changes-required`, TASK-016's scope may need to change before it is claimed.
  - The two resource locks are declared in task records and specified in the dependency graph, but nothing enforces them today. `validate-write-scope.ps1` and `claim-task.ps1` enforce per-task scope and per-task-ID locking, not cross-task resource locks. Until TASK-005 implements admission-time enforcement, the locks depend on the Orchestrator not claiming both tasks of a pair at once. This is a smaller gap than revision 1's prose sequencing, but it is not zero, and the user may wish to route a separate task to extend the orchestration scripts — which are governance-controlled and cannot be changed from an agent branch.
  - The validation tasks depend on `gpt` and `gemini` assignments being available. If a family is unavailable, the affected gate must be reassigned by the user before its wave starts, since an author may not review their own change.
  - Runtime task write scopes name directories such as `src/orchestrator/workspace/` that do not exist yet; the owning task creates them.
  - TASK-014's round 2 dispositions on F-001 through F-007 are the reviewer's to make. The dispositions claimed above are the author's and carry no gate authority.
- Next owner: **reviewer** for TASK-014 round 2, the independent review gate on this decomposition, and **reviewer** for TASK-015 round 1, the architecture gate that unblocks Wave 2. Both may proceed in parallel; their write scopes are disjoint. **The user** must record decision HUMAN-001 before Wave 3.
</content>
