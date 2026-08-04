# TASK-001 Dependency Graph

Durable handoff note produced by the Orchestrator under TASK-001. It records the dependency order, ownership, write-scope partition, and edge semantics of the autonomous multi-agent runtime task graph. Individual task records remain the authoritative source for scope and acceptance criteria; this document must be kept in agreement with them by TASK-013.

**Revision 2.** Revision 1 was reviewed by TASK-014 round 1, which returned `changes-required` with findings F-001 through F-007 in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`. This revision applies the corrections and reconciles the graph with the TASK-002 architecture at commit `9576fc9`. The correction summary is in `tasks/review/TASK-001-autonomous-runtime-orchestration.md`.

## Dependency edge semantics

Revision 1 used a single untyped `dependencies` list. That was the root cause of F-003: a validation task depends on the implementation whose gate it performs, so if a dependency were satisfied only by a terminal state, no gate could ever start; and if `review` satisfied every dependency, implementation dependencies would release too early. Edges are now typed, and each type has one satisfying condition.

| Edge | Written as | Satisfied when | Used for |
|---|---|---|---|
| `gate_passed` | `{task: X, edge: gate_passed}` | X has reached `review` **and** every task in X's `gate_tasks` has recorded a passing or formally accepted verdict | An approved decision that downstream work builds on — architecture before implementation |
| `implementation_published` | `{task: X, edge: implementation_published}` | X has reached `review` **and** its branch is merged to `main` per the integration order | A compile-time or contract-consumption edge between implementations, and the readiness edge for a gate task |
| `gate_recorded` | `{task: X, edge: gate_recorded}` | X, itself a gate task, has recorded its verdict | One validating role needing another validator's baseline — TASK-012 on TASK-011 |
| `terminal` | `{task: X, edge: terminal}` | X has reached `done` | Reserved. No task in this graph uses it; it exists so the scheduler can reject its misuse |
| `human_decision` | `{task: HUMAN-nnn, edge: human_decision}` | A human has recorded the named decision | Work an agent is structurally forbidden to unblock — TASK-018 on HUMAN-001 |

A separate field, `gate_for`, declares that a task performs a named gate for a target. **`gate_for` is not a scheduling edge.** It points in the opposite direction from the scheduling edges and is evaluated only when TASK-013 decides whether a target may move to `done`.

`gate_tasks` is the target's view of the same relation: the list of tasks that must record a verdict before this task's gates are closed. `gate_for` and `gate_tasks` must agree pairwise.

### Gate-ready semantics, stated plainly

A task becomes **dispatchable** when every edge in its `dependencies` is satisfied. A task becomes **done** when it is dispatchable, its own work is published, and every task listed in its `gate_tasks` has recorded a passing or formally accepted verdict.

These are two different conditions evaluated over two different edge sets pointing in opposite directions. That separation is what makes the graph schedulable: TASK-009 becomes dispatchable when TASK-003 reaches `review`, and TASK-003 becomes done only after TASK-009 records its verdict.

### No-deadlock invariant

The graph is valid only if all three hold:

1. The directed graph over `gate_passed`, `implementation_published`, `gate_recorded`, `terminal`, and `human_decision` edges is acyclic.
2. No task holding `gate_for: X` also holds a `gate_passed(X)` or `terminal(X)` edge. A gate task may hold `implementation_published(X)`, which is satisfiable while X is still in `review`.
3. Every `gate_for` entry has a matching `gate_tasks` entry on the target, and every `gate_tasks` entry has a matching `gate_for` entry on the gate task.

TASK-005 owns enforcement: it implements ready-task selection over these edge types, and it rejects a graph violating invariant 1 or 2 at load time rather than deadlocking at run time. TASK-005's acceptance criteria name both the enforcement and the no-deadlock test.

**Verification of this graph against the invariant.**

- Invariant 1: the topological order `HUMAN-001, TASK-001, TASK-002, TASK-014, TASK-015, TASK-016, TASK-018, TASK-019, TASK-003, TASK-004, TASK-017, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013` places every task after all of its dependencies. No cycle exists.
- Invariant 2: TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, and TASK-019 are the only tasks with `gate_for` entries. Every edge each of them holds to a task it gates is `implementation_published`. TASK-012's only non-implementation edge is `gate_recorded(TASK-011)`, and TASK-012 does not gate TASK-011.
- Invariant 3: checked pairwise in the gate table below.

## Ownership and dependency order

| Task | Title | Owner role | LLM | Depends on | State |
|---|---|---|---|---|---|
| TASK-002 | Runtime architecture and ADRs | architect | claude | — | review |
| TASK-003 | Durable run state and checkpoints | runtime | claude | TASK-002 `gate_passed`; TASK-018 `implementation_published` | blocked |
| TASK-004 | Provider adapters and agent workers | runtime | claude | TASK-002 `gate_passed`; TASK-018 `implementation_published` | blocked |
| TASK-005 | Scheduling, leases, fencing, bounded concurrency | runtime | claude | TASK-002 `gate_passed`; TASK-003, TASK-004 `implementation_published` | blocked |
| TASK-006 | Supervisor core and state machine | runtime | claude | TASK-002 `gate_passed`; TASK-003, TASK-004, TASK-005, TASK-017 `implementation_published` | blocked |
| TASK-007 | Lifecycle control and one-input bootstrap | runtime | claude | TASK-002 `gate_passed`; TASK-006 `implementation_published` | blocked |
| TASK-008 | Crash recovery, timeouts, idempotent retries | runtime | claude | TASK-002 `gate_passed`; TASK-003, TASK-004, TASK-006, TASK-017 `implementation_published` | blocked |
| TASK-009 | Independent code review of the runtime | reviewer | gpt | TASK-003 … TASK-008, TASK-017 `implementation_published` | blocked |
| TASK-010 | Security review of the runtime | security | gpt | TASK-003 … TASK-008, TASK-017 `implementation_published` | blocked |
| TASK-011 | QA validation of the runtime | qa | gemini | TASK-003 … TASK-008, TASK-017 `implementation_published` | blocked |
| TASK-012 | Performance validation of the runtime | performance | gemini | TASK-005, TASK-006, TASK-008, TASK-017 `implementation_published`; TASK-011 `gate_recorded` | blocked |
| TASK-013 | Task-record lifecycle transitions and gate closure | orchestrator | claude | — | ready, recurring |
| TASK-014 | Independent review of this decomposition | reviewer | gpt | TASK-001 `implementation_published` | ready, round 2 |
| TASK-015 | Independent architecture review of TASK-002 | reviewer | gpt | TASK-002 `implementation_published` | ready |
| TASK-016 | Architecture amendment: agent workspace lifecycle | architect | claude | TASK-002 `gate_passed` | blocked |
| TASK-017 | Agent workspace lifecycle automation | runtime | claude | TASK-016 `gate_passed`; TASK-003, TASK-018 `implementation_published` | blocked |
| TASK-018 | Runtime toolchain bootstrap | devops | claude | TASK-002 `gate_passed`; HUMAN-001 `human_decision` | blocked |
| TASK-019 | Independent review of the runtime toolchain | reviewer | gpt | TASK-018 `implementation_published` | blocked |

## Gate assignment

Every `required_gates` entry has a named owner. Revision 1 left TASK-002's review gate unowned, which was F-002.

| Gated task | review | security | qa | performance |
|---|---|---|---|---|
| TASK-001 | TASK-014 | — | — | — |
| TASK-002 | TASK-015 round 1 | — | — | — |
| TASK-003 | TASK-009 | TASK-010 | TASK-011 | — |
| TASK-004 | TASK-009 | TASK-010 | TASK-011 | — |
| TASK-005 | TASK-009 | TASK-010 | TASK-011 | TASK-012 |
| TASK-006 | TASK-009 | TASK-010 | TASK-011 | TASK-012 |
| TASK-007 | TASK-009 | TASK-010 | TASK-011 | — |
| TASK-008 | TASK-009 | TASK-010 | TASK-011 | TASK-012 |
| TASK-016 | TASK-015 round 2 | — | — | — |
| TASK-017 | TASK-009 | TASK-010 | TASK-011 | — |
| TASK-018 | TASK-019 | TASK-010, retrospective | — | — |

Author and gate owner are always different roles, different execution contexts, and — for every implementation task — different LLM families. No task gates itself.

Two properties of this table are deliberate and worth stating, because getting either wrong reproduces F-002:

1. **A gate owner must be schedulable when its target publishes, not five waves later.** TASK-018 merges at Wave 2, so its review gate is TASK-019 rather than TASK-009. TASK-002's review gate is TASK-015 rather than TASK-009 for the same reason.
2. **A gate may be retrospective only when stated as such.** TASK-018's security gate is owned by TASK-010 at Wave 7 because no code exists to threat-model before a toolchain exists. TASK-018 therefore reaches `implementation_published` at Wave 2 and `done` at Wave 7. That is coherent under the edge vocabulary — the two are different conditions — but it is a recorded, accepted risk rather than an oversight, and TASK-019 must produce the dependency inventory that makes the retrospective assessment possible.

## Execution waves

```text
Wave 0   TASK-013 | TASK-014 r2 | TASK-015 r1     recurring transitions, decomposition re-review, architecture review
Wave 1   TASK-002                                 architecture, in review, awaiting TASK-015
Wave 2   TASK-016 | TASK-018                      amendment and toolchain; TASK-018 also needs HUMAN-001
         TASK-015 r2 | TASK-019                   gate the amendment and the toolchain
Wave 3   TASK-003 | TASK-004                      parallel, disjoint scopes, both need the toolchain
Wave 4   TASK-005 | TASK-017                      parallel, disjoint scopes
Wave 5   TASK-006                                 needs state, workers, scheduler, workspace
Wave 6   TASK-007 | TASK-008                      parallel, disjoint scopes
Wave 7   TASK-009 | TASK-010 | TASK-011           parallel, separate execution contexts
Wave 8   TASK-012                                 needs a recorded QA baseline
```

TASK-013 is not a wave. It is claimed briefly at every wave boundary to perform the transitions, then released.

## Reconciliation with the TASK-002 architecture

The architecture at commit `9576fc9` on `agent/claude/architect/task-002` is the normative technical source. This graph is reconciled with it as follows.

**Module map.** Each of the six modules in `docs/architecture/runtime/COMPONENT-BOUNDARIES.md` maps to exactly the owner task this graph assigns, and the source paths match the write-scope partition below. The seventh module added by TASK-016 maps to TASK-017.

**Contract roots.** `src/orchestrator/state/contracts/` is owned by TASK-003 and `src/agents/contracts/` by TASK-004, both inside their existing scopes. Every other task imports from a contract root and never from a sibling implementation. This is why the missing TASK-004 edges in revision 1 mattered: TASK-005, TASK-006, and TASK-008 all import `src/agents/contracts/`, so TASK-004 is a compile-time dependency, not a documentation reference.

**Contract change control.** No implementation task may change a type, signature, field name, or string-literal union declared in `INTERFACE-CONTRACTS.md` during Waves 3 through 6, even inside its own write scope. A task that finds a contract wrong stops at the boundary and hands off to the Orchestrator, which routes an amendment to the architect under a task shaped like TASK-016. TASK-003 and TASK-004 restate this rule in a "Contract root ownership" section; TASK-009 verifies it by diffing both contract roots against the document.

**Integration order.** `docs/architecture/runtime/INTEGRATION-STRATEGY.md` requires every task to branch from `main` at or after the commit where its dependencies merged, squash-merge one commit per task, and never push to `main`. The wave order above is that merge order. Step 2 of the architecture's integration order — the toolchain bootstrap — is now TASK-018, and it appears in the scheduling graph as an `implementation_published` edge held by TASK-003, TASK-004, and TASK-017 rather than only as a prose note.

**Ownership gaps the architecture raised.** Both are now routed and both appear in the graph:

| Gap recorded in `INTEGRATION-STRATEGY.md` | Routed to | Status |
|---|---|---|
| No task owns the root toolchain manifests or `scripts/quality/**` | TASK-018 | Blocked on human decision HUMAN-001 |
| No module owns the agent workspace lifecycle that `AgentInvocation.worktreePath` presupposes | TASK-016 then TASK-017 | Blocked on `gate_passed(TASK-002)` |

## Write-scope partition

Two tasks may run concurrently only when their write scopes are disjoint **and** they do not hold the same resource lock.

| Task | Write scope | Resource lock |
|---|---|---|
| TASK-001 | `tasks/**` | `task-records` |
| TASK-002 | `docs/architecture/**`, `docs/adr/**`, `diagrams/architecture/**` | `architecture-docs` |
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
| TASK-016 | `docs/architecture/runtime/**`, `docs/adr/**`, `diagrams/architecture/**` | `architecture-docs` |
| TASK-017 | `src/orchestrator/workspace/**`, `tests/unit/orchestrator/workspace/**` | — |
| TASK-018 | `scripts/ci/**`, `.github/workflows/**` (plus a requested extension, see below) | — |
| TASK-019 | `reports/code-review/TASK-018-TOOLCHAIN-REVIEW.md` | — |

Every scope is a subset of its role's configured scope in `config/agents/settings.yaml`, except where noted for TASK-018.

### Overlaps eliminated

Revision 1 claimed "no two tasks share a write scope" and then acknowledged two overlaps in prose. That was F-005. One overlap is now eliminated by path, the other two are serialized by an enforceable lock.

**Eliminated.** TASK-009's scope was `reports/code-review/**`, which contained TASK-014's file. It is now `reports/code-review/REVIEW.md` and `reports/code-review/runtime/**`, which is disjoint from `TASK-001-DECOMPOSITION-REVIEW.md` (TASK-014), `TASK-002-ARCHITECTURE-REVIEW.md` (TASK-015), and `TASK-018-TOOLCHAIN-REVIEW.md` (TASK-019). No sequencing assumption remains. The four reviewer-owned tasks are mutually path-disjoint by construction, so any two of them may run concurrently.

### Overlaps that remain, and how they are honestly serialized

Two pairs have genuinely identical scopes, because in each pair the second task exists to revise what the first produced. Pretending they are disjoint would be false. They declare a shared `resource_lock` instead.

| Lock | Held by | Why the overlap is real |
|---|---|---|
| `task-records` | TASK-001, TASK-013 | Both own `tasks/**`. TASK-013 exists to keep every task record current, which is by definition the same surface TASK-001 created. |
| `architecture-docs` | TASK-002, TASK-016 | TASK-016 amends documents TASK-002 authored. |

Resource-lock semantics, which TASK-005 must enforce at admission alongside write-scope exclusion:

1. At most one task holding a given resource lock may be claimed at any time.
2. A lock is not a dependency. It constrains concurrency, not order; two lock-sharing tasks may run in either order when their scheduling edges allow.
3. The scheduler refuses admission of a task whose lock is held, and returns it to the ready set rather than queueing behind it.
4. A resource lock is declared in the task record's `resource_lock` field and is machine-readable. It is not a prose sequencing claim.

### TASK-018's declared scope versus its requested extension

TASK-018 needs `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**`. None of these is inside the devops role's configured `write_scope`, and `config/agents/settings.yaml` is a human-controlled governance path no agent may extend. Its record therefore declares only the paths the role may write today and lists the remainder under `requested_write_scope_extension`, gated on human decision HUMAN-001. This keeps the role-scope-subset invariant true rather than declaring a scope the validator would reject.

## Task-record lifecycle ownership

Revision 1's operational notes told every task owner to record its handoff in its task record, move it between lifecycle directories, and update its `status`. No implementation or validation role has `tasks/**` in its configured scope, so obeying those instructions would fail write-scope validation and obeying scope would leave the graph's state stale. That was F-007.

**Every task-record mutation in this graph is performed by the `orchestrator` role and by nothing else.** TASK-013 owns it. Concretely:

| Actor | May write | Must not write |
|---|---|---|
| Implementation owner (TASK-003 … TASK-008, TASK-017, TASK-018) | Its own source and test scope; the commit message; the pull request description | Any file under `tasks/` |
| Validating owner (TASK-009 … TASK-012, TASK-014, TASK-015) | Its own report scope; the pull request description | Any file under `tasks/` |
| Architect (TASK-002, TASK-016) | Its architecture scope; the commit message; the pull request description | Any file under `tasks/` |
| Orchestrator (TASK-013) | Every task record, including `status`, lifecycle directory, Handoff sections, and this graph | Any source, test, report, or architecture file |

Each owner records its handoff where its own scope allows, and TASK-013 transcribes it into the task record, naming the source. Every task record therefore carries a "Task-record lifecycle" section stating this, and no record instructs its owner to move itself.

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
| Working `claude`, `gpt`, and `gemini` adapters | TASK-004 | TASK-009, TASK-010, TASK-011 |
| Provider command discovery and diagnostics | TASK-004 | TASK-010, TASK-011 |
| Automated hook verification and installation | TASK-017 | TASK-010, TASK-011 |
| Automated branch and worktree creation | TASK-017 | TASK-009, TASK-010, TASK-011 |
| Automated task-lock claim and release | TASK-017 | TASK-010, TASK-011 |
| Automated write-scope validation before handoff | TASK-017 | TASK-009, TASK-010, TASK-011 |
| Durable commit and handoff persistence | TASK-017 | TASK-011 |
| Crash-safe workspace cleanup and reconciliation | TASK-017, TASK-008 | TASK-011, TASK-012 |
| Compiling, testable toolchain | TASK-018 | TASK-019, TASK-010 |
| Workspace lifecycle architecture | TASK-016 | TASK-015 round 2 |

## Findings return path

```text
TASK-009 / TASK-010 / TASK-011 / TASK-012        runtime findings
TASK-014 / TASK-015 / TASK-019                   decomposition, architecture, and toolchain findings
        |  finding names the responsible task ID and owner role
        v
TASK-013 (orchestrator)
        |  creates one remediation task per responsible owner,
        |  performs the lifecycle transition, records the gate status
        v
the named owner applies the fix on a new branch from current main
        |
        v
the originating validating role revalidates and the gate closes
```

Validating roles report and revalidate; they never implement the fix. High and critical security findings block delivery until they are resolved or formally accepted by an authorized human. Remediation branches follow the same write-scope partition and the same contract change control as the original.

## Operational notes for each next owner

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId <id> -Role <role> -Llm <llm>`. Reuse an existing worktree when the task already has one.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1` before editing.
3. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree`.
4. Commit, push the agent branch, open a pull request, and run `scripts/orchestration/release-task.ps1`.
5. Record the handoff where your own write scope allows — the commit message, the pull request description, and your role's report artifact. **Do not move your task record and do not edit its `status` field.** The Orchestrator performs every task-record transition under TASK-013.

Steps 1 through 4 are what TASK-017 automates for runtime-dispatched work. They remain the manual procedure for the human-launched CLI sessions that build the runtime itself.
</content>
