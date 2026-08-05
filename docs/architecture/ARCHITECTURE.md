# Architecture

Entry point for the project's architecture documentation. Owned by the Solution Architect.

The repository is a provider-neutral multi-agent engineering framework. Its governance layer — roles, write scopes, worktrees, task locks, and quality gates — is defined in [`AGENTS.md`](../../AGENTS.md) and enforced by the PowerShell orchestration scripts. This document set covers the **autonomous runtime**: the executable supervisor that turns a single project input into a completed multi-agent run.

## Autonomous runtime

### Objective

One command starts a project. The supervisor bootstraps the initial Manager task from a single project brief, dispatches role-scoped work to LLM providers under bounded concurrency, persists every state change durably, and drives the run to a terminal state across pauses, provider failures, timeouts, and abrupt process termination — without an operator step in between and without duplicating completed work.

### Shape

```text
Operator ──► bin/ CLI ──► lifecycle ──► supervisor ──► scheduler ──► leases
                │             ▲             │                          │
                │             │             ├──► workspace ──► worktree, branch,
        control inbox ────────┘             │                  lock, publication, PR
     (pause / stop, durable)                │
                                            ├──► agent workers ──► provider adapters
                                            │                          │
                                            │                          └──► owned process tree
                                            │                               (job object / pgid)
                                            └──► durable state ──► run directory
                                                     ▲
                                          recovery ──┘
```

Seven modules, each owned end to end by exactly one implementation task, with no shared module ownership:

| Module | Path | Owner task |
|---|---|---|
| Durable state store | `src/orchestrator/state/` | TASK-003 |
| Provider adapters, agent workers, process trees | `src/agents/` | TASK-004 |
| Scheduler and lease manager | `src/orchestrator/scheduling/` | TASK-005 |
| Supervisor core | `src/orchestrator/supervisor/` | TASK-006 |
| Lifecycle control, live-run control, entry point | `src/orchestrator/lifecycle/`, `bin/` | TASK-007 |
| Recovery, timeouts, retries | `src/orchestrator/recovery/` | TASK-008 |
| Agent workspace lifecycle | `src/orchestrator/workspace/` | TASK-017 |

### Load-bearing decisions

Everything else follows from ten choices. The first six were made under TASK-002; the last four under TASK-016, which amended the architecture after an independent review found four of the original contracts unimplementable as written.

1. **State is the fold of an append-only event journal.** A `RunRecord` is never authored directly; it is computed by replaying events through one pure transition function. Checkpoints are materialized folds written atomically, never a second source of truth. This is what makes crash recovery a replay rather than a repair.

2. **One pure, total transition function is the sole authority on legality.** No module writes a state field. Scheduling, recovery, lifecycle, and the workspace module build event envelopes; only the append path applies them. Determinism follows: the same ordered event sequence always yields the same final state.

3. **Leases are time-bounded and fenced by a monotonic token.** A fencing token is the `stateVersion` of the event that granted the lease, so tokens are globally ordered without a second counter. A superseded worker's late write is rejected by comparison, with no cooperation required from the worker. A second level, the writer epoch, fences whole processes after a crash.

4. **Provider specifics live behind one interface.** Adding a provider is a registry registration. A closed ten-member failure taxonomy replaces raw provider errors at the boundary, and the disposition mapping — retry, fail, or escalate — has exactly one definition. Unknown failures default to `fail`, because retrying an effect of unknown character is the only outcome that can cause real duplication.

5. **Effects are registered before they are performed.** An intent-then-commit ledger lets recovery decide from recorded fact whether to adopt a completed effect or re-execute it. The guarantee is stated honestly: exactly-once for ledger-registered idempotent effects, at-most-once with explicit human escalation otherwise.

6. **Pause, stop, and crash share one reconciliation path.** A drain that hits its deadline is indistinguishable from a crash with respect to in-flight work, so resume always goes through recovery. One path, one set of invariants, one equivalence claim.

7. **A journal batch is committed by a commit record, not by an fsync.** Append and fsync give durability, not transaction atomicity for an arbitrarily sized buffer. Each batch carries a `batchId`, and its final line is a commit record naming the event count and a digest over the batch's envelopes. Restore exposes every event of a committed batch or none of it. This is what makes bootstrap and recovery genuinely all-or-nothing.

8. **Recovery emits one decision per task, chosen so that it is legal by construction.** The outcome is determined from lease state, ledger state, and elapsed deadline **before** any event is built, and each decision expands to one proven-legal event sequence. No two decisions address the same task, so batch legality reduces to per-decision legality.

9. **Every process the runtime spawns is owned, and every tree is verifiably closed.** An invocation's identity is durable before the spawn; the child is placed into a Windows job object or a POSIX process group at creation; cancellation escalates within a bound; exit is verified rather than assumed; and the outcome is durable before the writer lock is released. Fencing protects run state from a superseded worker, and nothing but ownership protects a worktree from a detached agent.

10. **Dependencies are typed, and readiness is not the same as merge.** `review_ready`, `integrated`, `gate_passed`, `gate_recorded`, `human_decision`, and `terminal` have distinct satisfying conditions, gates declare which of them block integration, gate verdicts are append-only and supersede across rounds, named resource locks serialize scopes that cannot be made disjoint, and recurring work activates from a durable monotonic cursor with a quiescent waiting state. A graph violating any no-deadlock invariant is rejected at load rather than deadlocking at run time.

### TASK-016 amendment register

TASK-015 round 1 returned `changes-required` on the TASK-002 architecture at commit `9576fc9`, recording findings A-001 through A-004 in `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`. The module map also had no owner for the agent workspace lifecycle. This amendment resolves all five. Every superseded claim is named in the amending document's own register; this is the index.

| Finding or gap | What was superseded | Where | Decision |
|---|---|---|---|
| A-001 | A multi-event append was claimed all-or-nothing on the strength of one fsync; restore retained a valid prefix of an uncommitted batch | [DURABLE-STATE-AND-CHECKPOINTS.md](runtime/DURABLE-STATE-AND-CHECKPOINTS.md), reconciled in STATE-MACHINE, LIFECYCLE-AND-BOOTSTRAP, CRASH-RECOVERY, and this document | [ADR-0012](../adr/0012-crash-atomic-journal-batches-with-commit-records.md) supersedes part of ADR-0004 |
| A-002 | Recovery emitted `LeaseExpired` and then `WorkerSucceeded`, `TaskBlocked`, or `TaskTimedOut` for the same task in one batch, which the transition table rejects | [STATE-MACHINE.md](runtime/STATE-MACHINE.md), [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md), [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md), diagrams | [ADR-0013](../adr/0013-single-decision-recovery-reconciliation.md) supersedes part of ADR-0009 |
| A-003 | Live-run control was undefined and no module owned the OS process tree | [LIFECYCLE-AND-BOOTSTRAP.md](runtime/LIFECYCLE-AND-BOOTSTRAP.md), [PROVIDER-ADAPTERS.md](runtime/PROVIDER-ADAPTERS.md), [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md), [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) | [ADR-0014](../adr/0014-live-run-control-and-process-tree-ownership.md) supersedes part of ADR-0009 |
| A-004 | Dependencies were task identifiers satisfied only by `succeeded`, which cannot express the committed task graph | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), [STATE-MACHINE.md](runtime/STATE-MACHINE.md), [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md), [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md) | [ADR-0015](../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| Module gap, F-105 | `AgentInvocation` presupposed a worktree and a branch that no module created; nothing owned publication or pull-request identity | [WORKSPACE-LIFECYCLE.md](runtime/WORKSPACE-LIFECYCLE.md), [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md), [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) | [ADR-0011](../adr/0011-agent-workspace-lifecycle-module.md) supersedes part of ADR-0002 |
| Branch topology | "Every task branches from `main`" and "no long-lived integration branch" contradicted the committed task graph | [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md) | [ADR-0016](../adr/0016-integration-branch-and-typed-merge-order.md) supersedes part of ADR-0010 |

### Guarantees

| Guarantee | Established by |
|---|---|
| One project input starts a complete run with no second operator step | [Lifecycle and bootstrap](runtime/LIFECYCLE-AND-BOOTSTRAP.md) |
| Every state transition is deterministic, and replay is reproducible | [State machine](runtime/STATE-MACHINE.md) |
| An interrupted write never becomes readable as valid state | [Durable state and checkpoints](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) |
| Restore exposes every event of a committed batch, or none of it | [Durable state and checkpoints](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) |
| Concurrent conflicting writes are rejected, never merged | [Durable state and checkpoints](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) |
| Concurrency limits, write-scope exclusion, and resource locks are never exceeded | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| A superseded worker cannot overwrite a newer attempt | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| An abandoned task returns to the ready set exactly once | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| A graph that cannot be scheduled is rejected at load, not discovered as a hang | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| An activation event is consumed exactly once, and idle work never redispatches | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md), [State machine](runtime/STATE-MACHINE.md) |
| A recorded gate verdict is durable and can only be superseded, never rewritten | [State machine](runtime/STATE-MACHINE.md) |
| Retries are classified, bounded, and reproducible | [Retries, timeouts, and idempotency](runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md) |
| A task in flight at crash time completes once or retries once, never both | [Crash recovery](runtime/CRASH-RECOVERY.md) |
| Every recovery batch is legal from the state it was computed against | [Crash recovery](runtime/CRASH-RECOVERY.md), [State machine](runtime/STATE-MACHINE.md) |
| An interrupted run reaches the same terminal state as an uninterrupted one | [Crash recovery](runtime/CRASH-RECOVERY.md) |
| No provider process outlives the command that started it, unrecorded | [Provider adapters](runtime/PROVIDER-ADAPTERS.md), [Lifecycle and bootstrap](runtime/LIFECYCLE-AND-BOOTSTRAP.md) |
| Every dispatched task runs in its own worktree, on its own branch, behind its own lock | [Workspace lifecycle](runtime/WORKSPACE-LIFECYCLE.md) |
| The runtime cannot push `main`, bypass the pre-push hook, or write a governance path | [Workspace lifecycle](runtime/WORKSPACE-LIFECYCLE.md) |
| No credential is ever persisted, logged, checkpointed, or emitted | [Provider adapters](runtime/PROVIDER-ADAPTERS.md) |

### Quality attributes

| Attribute | Position |
|---|---|
| Correctness under interruption | Highest priority. Every other attribute yields to it. |
| Determinism | Required, not merely desirable: replay, seeded backoff, and total dispatch ordering are what make the equivalence claims testable. |
| Observability | Every state change is a durable, diffable, canonical-JSON event. Run events carry primitives only, so no payload can leak through them. |
| Testability | Every boundary is an injected interface, so each module is unit-testable with fakes before its dependencies exist. |
| Throughput | Deliberately traded away. Bounded concurrency and write-scope exclusion cap parallelism; agent invocations dominate wall-clock time, so scheduler overhead is irrelevant. |
| Distribution | Explicitly out of scope. A run has one writer process. The writer epoch is the seam a future multi-process design would extend. |

### Document set

Detailed specifications, all normative:

| Document | Covers |
|---|---|
| [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md) | Module map, contract roots, allowed dependency directions, cross-cutting rules |
| [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) | Every type and signature crossing a module boundary |
| [STATE-MACHINE.md](runtime/STATE-MACHINE.md) | Run and task states, transition tables, illegal transitions, dynamic admission |
| [DURABLE-STATE-AND-CHECKPOINTS.md](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) | Journal, atomic checkpoints, restore, monotonicity, writer lock |
| [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md) | Lease lifecycle, fencing, admission gates, deterministic ordering |
| [PROVIDER-ADAPTERS.md](runtime/PROVIDER-ADAPTERS.md) | Adapter interface, failure taxonomy, timeout layering, credential handling |
| [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md) | Idempotency keys, effect ledger, backoff, exhaustion, timeout layers |
| [LIFECYCLE-AND-BOOTSTRAP.md](runtime/LIFECYCLE-AND-BOOTSTRAP.md) | One-input bootstrap, command surface, live-run control protocol, drain, pause and resume, exit codes |
| [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md) | Failure model, recovery phases, twenty post-crash invariants, accepted risks |
| [WORKSPACE-LIFECYCLE.md](runtime/WORKSPACE-LIFECYCLE.md) | Workspace handle, prepare/finalize/abandon/reconcile, script delegation, publication and pull-request identity, structural prohibitions |
| [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md) | Branch topology, integration order, contract change control |

Decisions: [`docs/adr/`](../adr/README.md), ADR-0001 through ADR-0016.

Diagrams: [components](../../diagrams/architecture/runtime-components.md), [state machines](../../diagrams/architecture/runtime-state-machine.md), [sequences](../../diagrams/architecture/runtime-sequences.md).

### Constraints on implementation tasks

1. [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) is normative. During Waves 3 through 6, no implementation task changes a contract, even inside its own write scope. A contract believed to be wrong is escalated to the Orchestrator for an architect amendment.
2. Every module receives `Clock`, `SeededRandom`, and `SecretProvider` by injection. No module reads wall-clock time, unseeded randomness, or an environment variable directly.
3. No credential, token, or provider secret is written to state, checkpoints, journals, logs, run events, or test fixtures.
4. Operator-visible command-line text is Turkish. Identifiers, options, error codes, log lines, event names, and all source content are English.
5. Every published module entry point is `index.ts`. Deep imports into another module's internals are a boundary violation.
6. No module writes a human-controlled governance path, and no module reimplements the orchestration scripts. The workspace module invokes them; nothing else touches a worktree, a task branch, or a task lock.
7. Every process a module spawns runs inside an owned job object or process group, and has a durable outcome before the writer lock is released.

### Known gaps requiring Orchestrator routing

None. Both gaps recorded under TASK-002 are closed.

| Gap | Resolution |
|---|---|
| No task owned the root toolchain manifests or `scripts/quality/**` | Human governance decision HUMAN-001 at commit `fb9f45c` added them to the devops role's write scope; TASK-018 owns the toolchain and is gated by TASK-019 |
| No module owned the agent workspace lifecycle that `AgentInvocation.worktreePath` presupposes | This amendment adds the seventh module; TASK-017 owns it |

## Application architecture

Not yet defined. The repository's application layers — `src/backend/`, `src/frontend/`, `console/`, and `schema/` — remain placeholders until a target project supplies scope. Their architecture will be recorded here and under `docs/architecture/` when a Project Manager task defines it.
