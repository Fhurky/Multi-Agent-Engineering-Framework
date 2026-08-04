# TASK-001 Dependency Graph

Durable handoff note for the autonomous multi-agent runtime task graph. It records the dependency order, ownership, write-scope partition, edge semantics, and activation model. Individual task records remain the authoritative source for scope and acceptance criteria; this document is kept in agreement with them by TASK-013.

**Revision 3**, produced by TASK-013 activation `ACT-001`. Revision 2 was reviewed by TASK-014 round 2, which returned `changes-required` with findings F-101 through F-105 in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`. TASK-015 round 1 independently returned `changes-required` on the TASK-002 architecture with findings A-001 through A-004 in `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`. Human governance decision HUMAN-001 was recorded at commit `fb9f45c`. This revision applies every resulting correction and routes every finding. The per-finding disposition register is in `tasks/TASK-013-ACTIVATION-LOG.md`.

## Dependency edge semantics

Revision 2 used a single `implementation_published` edge that required the target to be **merged to `main`**. That was the root cause of F-101: a pre-merge review gate waits for merge while merge waits for the gate. Revision 3 splits that edge into two typed conditions with distinct satisfying states, and adds a per-task declaration of which gates block integration.

| Edge | Written as | Satisfied when | Used for |
|---|---|---|---|
| `review_ready` | `{task: X, edge: review_ready}` | X has reached `review`, its record names an immutable `published_commit` on `published_branch`, that commit is readable from the shared Git common directory, and its `publication` field records the remote/pull-request outcome | The readiness edge for a gate task. It says nothing about merge |
| `integrated` | `{task: X, edge: integrated}` | X is `review_ready`, **every** gate named in X's `pre_merge_gates` has recorded a passing or formally accepted verdict, and X's branch has been merged into `integration/autonomous-runtime` per the integration order | A compile-time or contract-consumption edge between implementations |
| `gate_passed` | `{task: X, edge: gate_passed, gate: <name>}` | X is `review_ready` and X's named gate is **closed** under the gate-round rule below | An approved decision that downstream work builds on — architecture before implementation |
| `gate_recorded` | `{task: X, edge: gate_recorded}` | X, itself a gate task, has recorded its verdict, whatever that verdict is | One task needing another validator's recorded outcome — TASK-012 on TASK-011, TASK-016 on TASK-015 |
| `human_decision` | `{task: HUMAN-nnn, edge: human_decision}` | A human has recorded the named decision in a tracked commit on a non-agent branch | Work an agent is structurally forbidden to unblock |
| `terminal` | `{task: X, edge: terminal}` | X has reached `done` | Reserved. No task in this graph uses it; it exists so the scheduler can reject its misuse |

### Why `integrated` is gated by `pre_merge_gates` and not by all gates

Requiring every gate to pass before integration would reintroduce F-101 in a new place. TASK-005 consumes TASK-003 at compile time; TASK-009 reviews TASK-003 **and** TASK-005 together at Wave 7. If `integrated(TASK-003)` required TASK-009's verdict, then TASK-005 could not start until TASK-009 ran, and TASK-009 could not run until TASK-005 published. That is a cycle.

Each task therefore declares `pre_merge_gates`: the subset of its `required_gates` that must close before its branch may be integrated. The remainder are **assembly gates**, which run against the integration branch after merge and still block `done`.

| Task | `pre_merge_gates` | Assembly gates (block `done`, not merge) |
|---|---|---|
| TASK-002 | `review` | — |
| TASK-016 | `review` | — |
| TASK-018 | `review` | `security` (retrospective, TASK-010) |
| TASK-003 … TASK-008, TASK-017 | — | `review`, `security`, `qa`, `performance` where declared |

A task with an empty `pre_merge_gates` reaches `integrated` as soon as it is `review_ready` and merged in wave order. A task with a non-empty `pre_merge_gates` cannot be merged until those gates close, which is what makes TASK-019 and TASK-020 schedulable before their targets merge.

### Gate rounds and gate closure

`gate_for` declares that a task performs a named gate for a target. **`gate_for` is not a scheduling edge.** It points in the opposite direction from the scheduling edges and is evaluated only when TASK-013 decides whether a target's gate is closed. `gate_tasks` is the target's view of the same relation. `gate_for` and `gate_tasks` must agree pairwise, including on `round`.

A gate may be recorded more than once. Each pair carries a `round`, which **defaults to 1 when omitted**. Only a gate that has been recorded more than once needs an explicit round on both sides.

1. The status of a gate is the verdict recorded at its **highest** round.
2. A `changes-required` verdict at round *n* must name a `remediated_by` task and a `revalidated_by` task. The gate stays open.
3. The gate is **closed** when the highest round records `approved`, `approved-with-findings` with every blocking finding resolved, or a formal acceptance recorded by an authorized human.
4. A verdict is durable. A later round never rewrites an earlier one; it supersedes it, and both stay recorded.

This is what makes an independent verdict permanent instead of re-entrant. TASK-014's `changes-required` and TASK-015's `changes-required` are final for the artifacts they reviewed; the corrected artifacts are reviewed by new tasks in a new round.

### Gate-ready semantics, stated plainly

A task becomes **dispatchable** when every edge in its `dependencies` is satisfied. A task becomes **integrable** when it is `review_ready` and every gate in its `pre_merge_gates` is closed. A task becomes **done** when it is integrated and every gate in its `gate_tasks` is closed.

These are three conditions over two edge sets pointing in opposite directions. That separation is what makes the graph schedulable: TASK-019 becomes dispatchable when TASK-018 is `review_ready`, TASK-018 becomes integrable when TASK-019's verdict closes its review gate, and TASK-018 becomes done only after TASK-010's retrospective security verdict.

### Publication and the current bootstrap limitation

`review_ready` requires an immutable published commit. It additionally requires remote branch publication and an open pull request **for work the runtime dispatches** — TASK-017 owns that and must return an explicit `blocked` outcome when the remote or credentials are unavailable. For the human-launched CLI sessions that build the runtime itself, the sessions to date were instructed not to push, so their records carry `publication: local-only` with the reason. That is a recorded, accepted limitation of the bootstrap phase, not a satisfied publication.

| Task | `published_commit` | `published_branch` | `publication` |
|---|---|---|---|
| TASK-001 | `657b83a`, superseded by the TASK-013 `ACT-001` commit on `agent/claude/orchestrator/task-013` | `agent/claude/orchestrator/task-001`, review target now `agent/claude/orchestrator/task-013` | `local-only` — the executing sessions were instructed not to push |
| TASK-002 | `9576fc9` | `agent/claude/architect/task-002` | `local-only` — same reason |
| TASK-014 | `abb85d9` | `agent/gpt/reviewer/task-014` | `local-only` — same reason |
| TASK-015 | `8632469` | `agent/gpt/reviewer/task-015` | `local-only` — same reason |

### No-deadlock invariant

The graph is valid only if all five hold:

1. The directed graph over `review_ready`, `integrated`, `gate_passed`, `gate_recorded`, `terminal`, and `human_decision` edges is acyclic.
2. No task holding `gate_for: X` also holds a `gate_passed(X)`, `integrated(X)`, or `terminal(X)` edge. It may hold `review_ready(X)`, which is satisfiable while X is still in `review` and unmerged.
3. Every `gate_for` entry has a matching `gate_tasks` entry on the target and the reverse, agreeing on gate name and round.
4. For every task X, no gate task owning a gate in X's `pre_merge_gates` holds an `integrated(X)` edge. Otherwise merge would wait on a gate that waits on merge.
5. The relation induced by expanding each `integrated(X)` edge into `review_ready(X)` plus the edges of X's `pre_merge_gates` owners is itself acyclic.

TASK-005 owns enforcement: it implements ready-task selection over these edge types and rejects a graph violating any invariant at load time rather than deadlocking at run time.

**Verification of this graph against the invariant.**

- Invariant 1 and 5: the topological order `HUMAN-001, TASK-001, TASK-014, TASK-021, TASK-002, TASK-015, TASK-016, TASK-020, TASK-018, TASK-019, TASK-003, TASK-004, TASK-017, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013` places every task after all of its dependencies and after the pre-merge gate owners of every task it integrates. No cycle exists.
- Invariant 2: TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, TASK-019, TASK-020, and TASK-021 are the only tasks with `gate_for` entries. Every edge each of them holds to a task it gates is `review_ready`. TASK-012's only non-`review_ready` edge is `gate_recorded(TASK-011)`, and TASK-012 does not gate TASK-011. TASK-020 gates TASK-002 round 2 and holds no edge to TASK-002 at all.
- Invariant 3: checked pairwise in the gate table below.
- Invariant 4: the only non-empty `pre_merge_gates` are TASK-002 `review` (TASK-015 round 1, TASK-020 round 2), TASK-016 `review` (TASK-020), and TASK-018 `review` (TASK-019). None of TASK-015, TASK-019, or TASK-020 holds an `integrated` edge to its target.

## Ownership and dependency order

| Task | Title | Owner role | LLM | Depends on | State |
|---|---|---|---|---|---|
| TASK-001 | Decompose the autonomous multi-agent runtime | orchestrator | claude | — | review |
| TASK-002 | Runtime architecture and ADRs | architect | claude | — | review |
| TASK-003 | Durable run state and checkpoints | runtime | claude | TASK-016 `gate_passed(review)`; TASK-018 `integrated` | blocked |
| TASK-004 | Provider adapters and agent workers | runtime | claude | TASK-016 `gate_passed(review)`; TASK-018 `integrated` | blocked |
| TASK-005 | Scheduling, leases, fencing, bounded concurrency | runtime | claude | TASK-016 `gate_passed(review)`; TASK-003, TASK-004 `integrated` | blocked |
| TASK-006 | Supervisor core and state machine | runtime | claude | TASK-016 `gate_passed(review)`; TASK-003, TASK-004, TASK-005, TASK-017 `integrated` | blocked |
| TASK-007 | Lifecycle control and one-input bootstrap | runtime | claude | TASK-016 `gate_passed(review)`; TASK-006 `integrated` | blocked |
| TASK-008 | Crash recovery, timeouts, idempotent retries | runtime | claude | TASK-016 `gate_passed(review)`; TASK-003, TASK-004, TASK-006, TASK-017 `integrated` | blocked |
| TASK-009 | Independent code review of the runtime | reviewer | gpt | TASK-003 … TASK-008, TASK-017 `review_ready` | blocked |
| TASK-010 | Security review of the runtime | security | gpt | TASK-003 … TASK-008, TASK-017, TASK-018 `review_ready` | blocked |
| TASK-011 | QA validation of the runtime | qa | gemini | TASK-003 … TASK-008, TASK-017 `review_ready` | blocked |
| TASK-012 | Performance validation of the runtime | performance | gemini | TASK-005, TASK-006, TASK-008, TASK-017 `review_ready`; TASK-011 `gate_recorded` | blocked |
| TASK-013 | Task-record lifecycle transitions and gate closure | orchestrator | claude | — (event-triggered) | blocked, quiescent |
| TASK-014 | Independent review of this decomposition, rounds 1–2 | reviewer | gpt | TASK-001 `review_ready` | done |
| TASK-015 | Independent architecture review of TASK-002, round 1 | reviewer | gpt | TASK-002 `review_ready` | done |
| TASK-016 | Architecture amendment: runtime contracts and workspace lifecycle | architect | claude | TASK-015 `gate_recorded` | ready |
| TASK-017 | Agent workspace lifecycle automation | runtime | claude | TASK-016 `gate_passed(review)`; TASK-003, TASK-018 `integrated` | blocked |
| TASK-018 | Runtime toolchain bootstrap | devops | claude | TASK-016 `gate_passed(review)` | blocked |
| TASK-019 | Independent review of the runtime toolchain | reviewer | gpt | TASK-018 `review_ready` | blocked |
| TASK-020 | Independent review of the architecture amendment | reviewer | gpt | TASK-016 `review_ready` | blocked |
| TASK-021 | Independent re-review of the corrected decomposition, round 3 | reviewer | gpt | TASK-001 `review_ready` | ready |

`HUMAN-001` is resolved. Commit `fb9f45c`, `chore: assign runtime toolchain ownership to devops`, adopted option A and added `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**` to `assignments.devops.write_scope`. No task carries a `human_decision` edge any longer.

## Gate assignment

Every `required_gates` entry has a named owner, and every round is recorded.

| Gated task | review | security | qa | performance |
|---|---|---|---|---|
| TASK-001 | TASK-014 r1 `changes-required`; TASK-014 r2 `changes-required`; TASK-021 r3 pending | — | — | — |
| TASK-002 | TASK-015 r1 `changes-required`; TASK-020 r2 pending | — | — | — |
| TASK-003 | TASK-009 | TASK-010 | TASK-011 | — |
| TASK-004 | TASK-009 | TASK-010 | TASK-011 | — |
| TASK-005 | TASK-009 | TASK-010 | TASK-011 | TASK-012 |
| TASK-006 | TASK-009 | TASK-010 | TASK-011 | TASK-012 |
| TASK-007 | TASK-009 | TASK-010 | TASK-011 | — |
| TASK-008 | TASK-009 | TASK-010 | TASK-011 | TASK-012 |
| TASK-016 | TASK-020 r1 pending | — | — | — |
| TASK-017 | TASK-009 | TASK-010 | TASK-011 | — |
| TASK-018 | TASK-019 | TASK-010, retrospective | — | — |

Author and gate owner are always different roles, different execution contexts, and different LLM families. No task gates itself, and no remediation returns to the execution context that reviewed it.

Three properties of this table are deliberate:

1. **A gate owner must be schedulable when its target publishes, not several waves later.** TASK-018's review gate is TASK-019, TASK-016's is TASK-020, and TASK-002's round 1 was TASK-015 — each dispatchable at `review_ready` of its target.
2. **A gate may be retrospective only when stated as such.** TASK-018's security gate is TASK-010 at Wave 7 because no code exists to threat-model before a toolchain exists. TASK-018 is integrable at Wave 2 and `done` at Wave 7. That is coherent under `pre_merge_gates` and is a recorded, accepted risk. TASK-019 must produce the dependency inventory that makes the retrospective assessment possible.
3. **A superseding round is a new task, not a re-entrant one.** TASK-014 and TASK-015 recorded durable verdicts and are `done`. TASK-021 and TASK-020 perform the next rounds. This removes the F-102 defect at its source: a task no longer carries an undeclared per-round dependency, because each round is a task with its own dependency.

## Execution waves

```text
Wave 0   TASK-016 | TASK-021                 architecture amendment; decomposition re-review round 3
         TASK-013                            event-triggered, quiescent, not a wave member
Wave 1   TASK-020                            gate the architecture amendment before it merges
Wave 2   TASK-018                            toolchain, needs the amended architecture approved
         TASK-019                            gate the toolchain before it merges
Wave 3   TASK-003 | TASK-004                 parallel, disjoint scopes, both need the toolchain integrated
Wave 4   TASK-005 | TASK-017                 parallel, disjoint scopes
Wave 5   TASK-006                            needs state, workers, scheduler, workspace
Wave 6   TASK-007 | TASK-008                 parallel, disjoint scopes
Wave 7   TASK-009 | TASK-010 | TASK-011      parallel, separate execution contexts
Wave 8   TASK-012                            needs a recorded QA baseline
```

TASK-013 is not a wave and is not claimed at wave boundaries on a timer. It is dispatched only when an unconsumed activation event exists; see the activation model below.

## TASK-013 activation model

Revision 2 gave TASK-013 `status: ready`, no dependencies, and an undefined `activation: recurring`. A scheduler reading that record sees a permanently dispatchable task and redispatches it after every release, which is F-104: an infinite control-plane loop that starves every other ready task. Revision 3 replaces it with a durable, monotonic, event-triggered activation.

**Event log.** `tasks/TASK-013-ACTIVATION-LOG.md` is an append-only log owned by TASK-013. Every entry carries a strictly increasing integer `seq`, an `event_type` from a closed set, the source commit or report it was read from, and the activation that consumed it. Entries are never edited or deleted.

**Cursor.** TASK-013's record carries `activation.last_consumed_event_seq`. The cursor is monotonically non-decreasing and is advanced only by an activation.

**Dispatch condition.** TASK-013 is dispatchable if and only if `max(event.seq) > activation.last_consumed_event_seq`. When they are equal the task is **quiescent**: `activation.state: quiescent`, `status: blocked`, stored in `tasks/blocked/`, with a `blocked_reason` and `exit_condition` naming the cursor. `blocked` here means "not dispatchable and waiting on an external condition", which is exactly what the directory contract requires; the typed waiting condition the scheduler evaluates is `activation.state` plus the cursor, not the directory.

**Exactly-once consumption.** An activation consumes the contiguous range `(last_consumed_event_seq, max_seq]`. The effects of the activation and the cursor advance are written in **one commit**. If that commit does not land, the cursor is unchanged and the same range is consumed again by the next activation, whose effects are identical because every transition is idempotent. There is therefore no interleaving in which an event is consumed twice with effect, and none in which an event is skipped.

**Starvation bound.** The scheduler must dispatch TASK-013 within a bounded number of scheduling rounds after an event is appended, even under a saturated ready set, and must not dispatch it when the cursor equals `max(event.seq)`.

TASK-005 implements and tests all four properties; TASK-016 must make them representable in the runtime contracts. The closed `event_type` set is:

| `event_type` | Appended when |
|---|---|
| `gate_verdict_recorded` | A gate task records a verdict in its report artifact |
| `artifact_published` | An owner publishes an immutable commit and reaches `review_ready` |
| `branch_integrated` | A branch is merged into `integration/autonomous-runtime` |
| `human_decision_recorded` | A human records a governance decision on a non-agent branch |
| `dependency_unsatisfiable` | An owner reports that a declared dependency cannot be satisfied |
| `remediation_completed` | A remediation owner publishes the fix for a routed finding |

## Reconciliation with the TASK-002 architecture

The architecture at commit `9576fc9` on `agent/claude/architect/task-002` was the normative technical source. TASK-015 round 1 returned `changes-required` against it with findings A-001 through A-004, so **the approved architecture this graph builds on is `9576fc9` as amended by TASK-016**, and every architecture dependency edge now names `gate_passed(TASK-016, review)` rather than `gate_passed(TASK-002, review)`. TASK-002's own review gate closes at round 2, when TASK-020 confirms the amendment resolves A-001 through A-004.

**Module map.** Each of the six modules in `docs/architecture/runtime/COMPONENT-BOUNDARIES.md` maps to exactly the owner task this graph assigns, and the source paths match the write-scope partition below. The seventh module added by TASK-016 maps to TASK-017. A-003 requires TASK-016 to give live-run control and OS process-tree ownership an owning module and contract; the amendment must state which existing module owns it rather than leaving it unassigned.

**Contract roots.** `src/orchestrator/state/contracts/` is owned by TASK-003 and `src/agents/contracts/` by TASK-004. Every other task imports from a contract root and never from a sibling implementation.

**Contract change control.** No implementation task may change a type, signature, field name, or string-literal union declared in `INTERFACE-CONTRACTS.md` during Waves 3 through 6, even inside its own write scope. A task that finds a contract wrong stops at the boundary and hands off to the Orchestrator, which routes an amendment to the architect under a task shaped like TASK-016. TASK-009 verifies it by diffing both contract roots against the document.

**Integration order.** `docs/architecture/runtime/INTEGRATION-STRATEGY.md` requires every task to branch from the integration branch at or after the commit where its dependencies merged, squash-merge one commit per task, and never push to `main`. The wave order above is that merge order. TASK-016 must reconcile that document with the `review_ready` / `integrated` / `pre_merge_gates` vocabulary, which is part of A-004.

**Ownership gaps the architecture raised.** Both are routed and both appear in the graph:

| Gap recorded in `INTEGRATION-STRATEGY.md` | Routed to | Status |
|---|---|---|
| No task owns the root toolchain manifests or `scripts/quality/**` | TASK-018 | Ownership resolved by HUMAN-001 at `fb9f45c`; now blocked only on `gate_passed(TASK-016)` |
| No module owns the agent workspace lifecycle that `AgentInvocation.worktreePath` presupposes | TASK-016 then TASK-017 | TASK-016 is `ready` |

## Write-scope partition

Two tasks may run concurrently only when their write scopes are disjoint **and** they do not hold the same resource lock.

| Task | Write scope | Resource lock |
|---|---|---|
| TASK-001 | `tasks/**` | `task-records` |
| TASK-002 | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/**`, `docs/adr/**`, `diagrams/architecture/**` | `architecture-docs` |
| TASK-003 | `src/orchestrator/state/**`, `tests/unit/orchestrator/state/**` | — |
| TASK-004 | `src/agents/**`, `tests/unit/agents/**` | — |
| TASK-005 | `src/orchestrator/scheduling/**`, `tests/unit/orchestrator/scheduling/**` | — |
| TASK-006 | `src/orchestrator/supervisor/**`, `tests/unit/orchestrator/supervisor/**` | — |
| TASK-007 | `src/orchestrator/lifecycle/**`, `bin/**`, `tests/unit/orchestrator/lifecycle/**` | — |
| TASK-008 | `src/orchestrator/recovery/**`, `tests/unit/orchestrator/recovery/**` | — |
| TASK-009 | `reports/code-review/REVIEW.md`, `reports/code-review/runtime/**` | — |
| TASK-010 | `reports/security/**`, `specs/security/**` | — |
| TASK-011 | `reports/qa/**`, `tests/integration/**`, `tests/e2e/**`, `tests/fixtures/**` | — |
| TASK-012 | `reports/performance/**`, `tests/performance/**` | — |
| TASK-013 | `tasks/**` | `task-records` |
| TASK-014 | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md` | — |
| TASK-015 | `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md` | — |
| TASK-016 | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/runtime/**`, `docs/adr/**`, `diagrams/architecture/**` | `architecture-docs` |
| TASK-017 | `src/orchestrator/workspace/**`, `tests/unit/orchestrator/workspace/**` | — |
| TASK-018 | `package.json`, `package-lock.json`, `tsconfig.json`, `scripts/quality/**`, `scripts/ci/**`, `.github/workflows/**` | — |
| TASK-019 | `reports/code-review/TASK-018-TOOLCHAIN-REVIEW.md` | — |
| TASK-020 | `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md` | — |
| TASK-021 | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md` | — |

Every scope is a subset of its role's configured scope in `config/agents/settings.yaml` at commit `fb9f45c`. TASK-018 no longer declares a `requested_write_scope_extension`: all four previously requested paths are inside the devops role's configured scope after HUMAN-001.

The six reviewer-owned report files — TASK-009's two paths, TASK-014, TASK-015, TASK-019, TASK-020, and TASK-021 — are mutually path-disjoint by construction, so any of them may run concurrently.

### Overlaps that remain, and how they are serialized

Two pairs have genuinely identical scopes, because in each pair the second task exists to revise what the first produced. They declare a shared `resource_lock`.

| Lock | Held by | Why the overlap is real |
|---|---|---|
| `task-records` | TASK-001, TASK-013 | Both own `tasks/**`. TASK-013 exists to keep every task record current, which is by definition the surface TASK-001 created. |
| `architecture-docs` | TASK-002, TASK-016 | TASK-016 amends documents TASK-002 authored. |

Resource-lock semantics, which TASK-005 must enforce at admission alongside write-scope exclusion:

1. At most one task holding a given resource lock may be claimed at any time.
2. A lock is not a dependency. It constrains concurrency, not order.
3. The scheduler refuses admission of a task whose lock is held and returns it to the ready set rather than queueing behind it.
4. A resource lock is declared in the task record's `resource_lock` field and is machine-readable.

TASK-002's execution has released the `architecture-docs` lock, which is why TASK-016 can be claimed.

## Task-record lifecycle ownership

**Every task-record mutation in this graph is performed by the `orchestrator` role and by nothing else.** TASK-013 owns it.

| Actor | May write | Must not write |
|---|---|---|
| Implementation owner (TASK-003 … TASK-008, TASK-017, TASK-018) | Its own source and test scope; the commit message; the pull request description | Any file under `tasks/` |
| Validating owner (TASK-009 … TASK-012, TASK-014, TASK-015, TASK-019, TASK-020, TASK-021) | Its own report scope; the pull request description | Any file under `tasks/` |
| Architect (TASK-002, TASK-016) | Its architecture scope; the commit message; the pull request description | Any file under `tasks/` |
| Orchestrator (TASK-013) | Every task record, including `status`, lifecycle directory, Handoff sections, the activation log, and this graph | Any source, test, report, or architecture file |

Each owner records its handoff where its own scope allows, and TASK-013 transcribes it into the task record, naming the source. Every task record carries a "Task-record lifecycle" section stating this, and no record instructs its owner to move itself.

## Required behavior coverage

| Required behavior | Implemented by | Validated by |
|---|---|---|
| Start | TASK-007 | TASK-011 |
| Graceful drain | TASK-007 | TASK-011 |
| Checkpoint | TASK-003 | TASK-011, TASK-012 |
| Pause | TASK-007 | TASK-011 |
| Resume | TASK-003, TASK-007 | TASK-011 |
| Completion | TASK-006, TASK-007 | TASK-011 |
| Timeout | TASK-004, TASK-005, TASK-008 | TASK-011 |
| Crash recovery | TASK-008, TASK-017 | TASK-011, TASK-012 |
| Retry | TASK-004, TASK-008 | TASK-011 |
| Deterministic state transitions | TASK-006 | TASK-009, TASK-011 |
| Bounded concurrency | TASK-005 | TASK-011, TASK-012 |
| Leases and fencing tokens | TASK-005 | TASK-009, TASK-010 |
| Idempotent retries | TASK-008 | TASK-009, TASK-011 |
| Durable checkpoints | TASK-003 | TASK-010, TASK-011 |
| One-input project bootstrap | TASK-007 | TASK-011 |
| Typed dependency and gate readiness, no-deadlock | TASK-005 | TASK-009, TASK-011 |
| Crash-atomic journal batches | TASK-003 | TASK-009, TASK-011 |
| Legal recovery transitions | TASK-006, TASK-008 | TASK-009, TASK-011 |
| Live run control protocol | TASK-007 | TASK-010, TASK-011 |
| OS process-tree ownership and termination | TASK-004, TASK-007, TASK-008 | TASK-010, TASK-011 |
| Named resource-lock admission | TASK-005 | TASK-009, TASK-011 |
| Recurring event activation, quiescence, exactly-once, no starvation | TASK-005 | TASK-009, TASK-011 |
| Working `claude`, `gpt`, and `gemini` adapters | TASK-004 | TASK-009, TASK-010, TASK-011 |
| Provider command discovery and diagnostics | TASK-004 | TASK-010, TASK-011 |
| Automated hook verification and installation | TASK-017 | TASK-010, TASK-011 |
| Automated branch and worktree creation | TASK-017 | TASK-009, TASK-010, TASK-011 |
| Automated task-lock claim and release | TASK-017 | TASK-010, TASK-011 |
| Automated write-scope validation before handoff | TASK-017 | TASK-009, TASK-010, TASK-011 |
| Durable commit and handoff persistence | TASK-017 | TASK-011 |
| Task-branch publication and idempotent pull-request creation | TASK-017 | TASK-009, TASK-010, TASK-011 |
| Crash-safe workspace cleanup and reconciliation | TASK-017, TASK-008 | TASK-011, TASK-012 |
| Compiling, testable toolchain | TASK-018 | TASK-019, TASK-010 |
| Workspace lifecycle architecture | TASK-016 | TASK-020 |
| Amended runtime contracts for A-001 … A-004 | TASK-016 | TASK-020 |

## Findings return path

```text
TASK-009 / TASK-010 / TASK-011 / TASK-012        runtime findings
TASK-014 / TASK-015 / TASK-019 / TASK-020 / TASK-021   decomposition, architecture, and toolchain findings
        |  finding names the responsible task ID and owner role
        v
TASK-013 (orchestrator), triggered by a gate_verdict_recorded event
        |  creates one remediation task per responsible owner, or records the
        |  disposition when the responsible owner is the Orchestrator itself,
        |  performs the lifecycle transition, records the gate status
        v
the named owner applies the fix on a new branch from the current integration branch
        |
        v
a new gate task in the next round revalidates and the gate closes
```

Validating roles report and revalidate; they never implement the fix. A validating role never revalidates in the execution context that produced the change. High and critical security findings block delivery until they are resolved or formally accepted by an authorized human. Remediation branches follow the same write-scope partition and the same contract change control as the original.

## Operational notes for each next owner

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId <id> -Role <role> -Llm <llm>`. Reuse an existing worktree when the task already has one.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1` before editing.
3. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree`.
4. Commit on the task branch. Push the task branch and open or update a pull request when a remote and credentials are available; never push `main`. If publication is unavailable, record `publication: local-only` with the reason so the Orchestrator can transcribe it accurately.
5. Run `scripts/orchestration/release-task.ps1`.
6. Record the handoff where your own write scope allows — the commit message, the pull request description, and your role's report artifact. **Do not move your task record and do not edit its `status` field.** The Orchestrator performs every task-record transition under TASK-013.

Steps 1 through 5 are what TASK-017 automates for runtime-dispatched work, including step 4's publication and pull-request outcome. They remain the manual procedure for the human-launched CLI sessions that build the runtime itself.
