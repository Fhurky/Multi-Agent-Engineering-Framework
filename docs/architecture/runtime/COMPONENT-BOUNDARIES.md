# Runtime Component Boundaries

Normative component decomposition for the autonomous multi-agent runtime. Produced under TASK-002 and amended under TASK-016, TASK-024, TASK-028, TASK-032, and TASK-036. Related decisions: [ADR-0002](../../adr/0002-runtime-component-boundaries-and-module-ownership.md) as superseded in part by [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) and [ADR-0021](../../adr/0021-durable-ingress-module-and-the-eight-module-map.md), plus [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md), TASK-028 ADRs [0024](../../adr/0024-task-record-projection-contract.md), [0028](../../adr/0028-nominal-store-issued-durable-append-receipts.md), [0029](../../adr/0029-ingress-delivery-ownership.md), and [0031](../../adr/0031-pre-dispatch-ingress-observer-and-collector.md), TASK-032 ADRs [0032](../../adr/0032-lossless-task-record-source-and-projection.md), [0033](../../adr/0033-unique-committed-result-effect-recovery.md), and [0034](../../adr/0034-spawn-owned-registration-proof-refusal.md), and TASK-036 ADRs [0038](../../adr/0038-total-pre-dispatch-ingress-append-dispositions.md) and [0039](../../adr/0039-single-nominal-receipt-authority-and-cross-root-conformance.md).

## Amendment register — TASK-036

The eight modules, eight owners, eight source paths, two independent contract roots, and all allowed dependency edges remain unchanged.

| Contradictory or incomplete TASK-034 transcription | Replaced by | Finding | Decision |
|---|---|---|---|
| Duplicate append success could not satisfy the collector without an entry or an unauthorized range read | TASK-026 returns a total appended/deduplicated disposition plus identity and mark; TASK-005 remains the sole activation-range reader | A-503 / HUMAN-002 Part B | [ADR-0038](../../adr/0038-total-pre-dispatch-ingress-append-dispositions.md) |
| One document claimed receipt types were structurally re-declared across roots | A cross-root conformance fixture enforces one state-root nominal declaration and an `unknown` plus verifier crossing | A-504 | [ADR-0039](../../adr/0039-single-nominal-receipt-authority-and-cross-root-conformance.md) |

## Amendment register — TASK-032

The eight modules, eight owners, eight source paths, two independent contract roots, and all allowed dependency edges are unchanged.

| Superseded claim (TASK-028) | Superseded by | Finding | Decision |
|---|---|---|---|
| TASK-007 parsed a closed nested document shape and TASK-005 retained unknown top-level keys only | TASK-007 parses a lossless raw YAML source; TASK-005 owns the exact checked projection and recursive inverse audit | A-202 (A-004/A-101 views) | [ADR-0032](../../adr/0032-lossless-task-record-source-and-projection.md) |
| TASK-004's process controller promised a proof refusal outside its result union | The same owner and boundary now expose `RegistrationNotDurableRefusal` explicitly; no module or import edge changes | A-206 (A-102 view) | [ADR-0034](../../adr/0034-spawn-owned-registration-proof-refusal.md) |

## Amendment register — TASK-028

| Superseded claim (TASK-024) | Superseded by | Finding | Decision |
|---|---|---|---|
| Ingress durability/policy split did not assign pre-dispatch collection or delivery | TASK-026 owns validation, collection, and append; TASK-005 owns high-water signalling, observation, and delivery | A-207, HUMAN-002 | [ADR-0029](../../adr/0029-ingress-delivery-ownership.md), [ADR-0031](../../adr/0031-pre-dispatch-ingress-observer-and-collector.md) |
| Nominal receipts were treated as structurally duplicable across independent roots | Nominal receipts live only in `state/contracts`; `agents/contracts` mirrors only a read-only verifier view accepting `unknown` and structural subjects | A-206 | [ADR-0028](../../adr/0028-nominal-store-issued-durable-append-receipts.md) |
| Task record normalization had no owning parser/projection seam | TASK-007 owns exact document parsing; TASK-005 owns pure projection; TASK-003 declares both sides | A-202 | [ADR-0024](../../adr/0024-task-record-projection-contract.md) |

## Amendment register — TASK-024

| Superseded claim (TASK-016) | Superseded by | Finding | Decision |
|---|---|---|---|
| Seven modules | **Eight**; the durable ingress inbox is added with `src/orchestrator/ingress/` and TASK-026 as its sole owner | A-101, F-301 | [ADR-0021](../../adr/0021-durable-ingress-module-and-the-eight-module-map.md) |
| "Cross-cutting rules binding all seven tasks" | Binding all eight | A-101 | [ADR-0021](../../adr/0021-durable-ingress-module-and-the-eight-module-map.md) |
| The permitted-duplication enumeration was extended with structural receipt types | TASK-028 removes receipt duplication: the state root owns the nominal union and the agent root exposes only `AgentProcessRegistrationSubject` plus `AgentReceiptVerifier` | A-102, A-206 | [ADR-0028](../../adr/0028-nominal-store-issued-durable-append-receipts.md) |
| The scheduler owning "activation" over an internal event queue | The scheduler owns the ingress **observer** and the dispatch predicate; the inbox, its adapters, class precedence, self-exclusion, and epochs belong to TASK-026 | A-101, F-301 | [ADR-0021](../../adr/0021-durable-ingress-module-and-the-eight-module-map.md) |

## Amendment register — TASK-016

| Superseded claim (TASK-002) | Superseded by | Decision |
|---|---|---|
| Six modules | Seven; the agent workspace lifecycle is added with `src/orchestrator/workspace/` and TASK-017 as its sole owner | [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |
| Live-run control and OS process-tree ownership unassigned — the reason one TASK-002 acceptance criterion was judged `not met` | [Responsibility assignments added under TASK-016](#responsibility-assignments-added-under-task-016): live-run control to TASK-007, process-tree lifecycle to TASK-004 | [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md) |
| "`agents/contracts` re-declares … This is the one permitted duplication" | A second permitted duplication under the identical rationale: `WorkspaceFailureClass` in `state/contracts` | [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |
| "Cross-cutting rules binding all six tasks" | Binding all seven | [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |

## Purpose

The runtime is a single-command supervisor that starts a project run, dispatches role-scoped agent work to LLM providers, persists every state change durably, and drives the run to a terminal state across pauses, crashes, and retries.

This document partitions that runtime into modules such that each module has exactly one implementation task owner, and no two tasks write the same module.

## Module map

Each row is owned end to end by exactly one task. No module appears twice, and no responsibility below is unassigned.

| Module | Source path | Owner task | Responsibility |
|---|---|---|---|
| Durable state store | `src/orchestrator/state/` | TASK-003 | Run and task record persistence, event journal, batch commit records, atomic checkpoints, compare-and-set append, restore, writer lock |
| Provider adapters and agent workers | `src/agents/` | TASK-004 | Provider adapter interface and registry, invocation assembly, provider call execution, failure classification, worker timeout signalling, **OS process-tree ownership, cancellation, escalation, and verified termination** |
| Scheduler and lease manager | `src/orchestrator/scheduling/` | TASK-005 | Ready-task selection, lossless task-record projection and inverse audit, typed dependency and gate evaluation, load-time graph validation, bounded concurrency, scope and resource-lock exclusion, **ingress high-water signalling, observation, delivery, dispatch predicate, and starvation bound**, lease grant, renew, expiry, reclaim, fencing token issuance |
| Supervisor core | `src/orchestrator/supervisor/` | TASK-006 | Deterministic transition function, run loop, result aggregation, dynamic task admission, completion detection, control-request consumption, run events |
| Lifecycle control and entry point | `src/orchestrator/lifecycle/`, `bin/` | TASK-007 | One-input bootstrap, command surface, **live-run control protocol**, graceful drain, pause, resume, signal handling, completion reporting, exit codes |
| Recovery, timeouts, retries | `src/orchestrator/recovery/` | TASK-008 | Crash recovery, single-decision reconciliation, orphan fencing and termination through the process-tree interface, timeout watchdog, retry policy, backoff, idempotency ledger enforcement, retry exhaustion |
| **Agent workspace lifecycle** | `src/orchestrator/workspace/` | **TASK-017** | Hook verification, branch and worktree creation, task-lock claim and release, write-scope validation, commit and handoff persistence, branch publication and idempotent pull-request identity, crash-safe workspace reconciliation |
| **Durable ingress inbox** | `src/orchestrator/ingress/` | **TASK-026** | The append-only ingress store, one-time `seq` assignment, identity and deduplication, ingress adapters and epochs, **external-fact validation, the pre-dispatch collector, append authorization, and append-through-store** |

Eight rows, eight distinct owner tasks, eight distinct source paths. No module appears twice and no responsibility above is unassigned.

### Responsibility assignment added under TASK-024 and amended under TASK-028

Finding A-101 and finding F-301 together recorded that the durable ingress inbox the activation model requires had no owning module. It now has exactly one, and it does not have two.

| Responsibility | Owner | Interface | Consumed by | Why this owner |
|---|---|---|---|---|
| Inbox durability, external-fact validation, deduplication, authorized append, and the HUMAN-002 collector | **TASK-026**, ingress | `IngressInbox`, `PreDispatchIngressValidator`, `PreDispatchIngressCollector` | TASK-005 receives the total append/dedup disposition, `factId`, and resulting high-water signal; no other module appends | Store invariants and the collector's append transaction share one owner, so no bypass path can skip identity-keyed deduplication or principal checks |
| High-water signal, observation, range delivery, dispatch predicate, and starvation bound | **TASK-005**, scheduling | `IngressHighWaterSignal`, `IngressObserver`, `Scheduler.activatableTasks` | TASK-006 composes the call order; `AgentInvocation.ingress` receives delivery | Admission owns the fail-closed pre-selection order. TASK-005 is the sole inbox reader and supplies the exact immutable range; the activation has no store capability |

The split is the same shape as `state` and `supervisor`: one module owns durability, another owns policy, and the policy module reaches the durable one only through an injected interface.

### Responsibility assignments added under TASK-016

Finding A-003 recorded live-run control and OS process-tree ownership as required runtime responsibilities with no owning module. Each now has exactly one owner, and neither has two.

| Responsibility | Owner | Interface | Consumed by | Why this owner |
|---|---|---|---|---|
| Live-run control protocol — transport, request identity, acknowledgement, ownership check, stale-request handling | **TASK-007**, lifecycle | `ControlChannel` in `state/contracts` | TASK-006 consumes accepted requests as events; it never reads the transport | Lifecycle already owns operator intent, the command surface, signals, and exit codes. A control request is operator intent arriving through a different door, and putting it anywhere else would split one concern across two modules |
| Durable ordering of accepted control requests | **TASK-006**, supervisor | `ControlRequestAccepted` in the event union | — | Ordering is journal order, and only the supervisor's append path writes the journal. This is not a second owner of the protocol: lifecycle owns delivery, the supervisor owns the fact that a request was accepted, and the boundary is the same one every other module already respects |
| OS process-tree ownership, cancellation, escalation, verified exit | **TASK-004**, agents | `ProcessTreeController` in `agents/contracts` | TASK-007 during drain, TASK-008 during recovery — both exclusively through the interface | Only this module spawns a provider process, and a child can be placed into an owned job object or process group only at creation. Ownership must live where the spawn is |

TASK-007 and TASK-008 act on process trees and own none of the mechanism. That is the same shape as their relationship with the state store: they call an injected interface and hold no implementation.

## Contract roots

Cross-module types are a shared surface, and a shared surface with no single owner is the most likely source of conflict between the eight parallel implementation tasks. The runtime therefore has exactly two contract roots, each inside an existing task's write scope.

| Contract root | Owner task | Declares |
|---|---|---|
| `src/orchestrator/state/contracts/` | TASK-003 | Identifiers, lossless task-record source and exact projection interfaces, runtime records and states, journal and event unions, store interface, typed graph contracts, ingress contracts, **nominal durable append receipts and verifier**, control channel, workspace lifecycle |
| `src/agents/contracts/` | TASK-004 | Provider adapter interface, invocation including read-only ingress delivery, adapter outcome, failure taxonomy, worker result, secret provider, process-tree controller, three-phase worker handshake, and a read-only receipt-verifier view accepting `unknown` |

The two roots remain independent of each other: neither imports the other, which is what keeps TASK-003 and TASK-004 genuinely parallel. TASK-026 imports `state/contracts` and nothing else, so adding the eighth module adds no edge between the roots.

`src/shared/` is deliberately not used by the runtime. It is outside every runtime task's write scope, so a module placed there would have no owner.

TASK-003 and TASK-004 execute in parallel and cannot import from each other at authoring time. Both transcribe their half of [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md) verbatim. That document, not either implementation, is the normative source. Neither contract root imports the other, so the parallel transcription cannot deadlock.

### Permitted duplications

TASK-002 recorded one, and stated it was the only one. TASK-016 adds a second under the identical rationale and no others.

| Duplication | Declared in | Mirrors | Why |
|---|---|---|---|
| `RunId`, `TaskId`, `Sha256Hex`, `IsoTimestamp`, `FencingToken`, `TaskProposal`, and — under TASK-016 — `InvocationId`, `WorkspaceId`, `InvocationRecord`, `ProcessTreeOutcome`, and — under TASK-028 — `AgentProcessRegistrationSubject` plus `AgentReceiptVerifier`, and — under TASK-036 — agent-root `TreeCloseOutcome` plus state-root `RecoveryOrphanOutcome` | Both roots, with the state snapshot named separately | Narrowed structural views needed at composition | Lets TASK-003 and TASK-004 compile in parallel with no import edge; the supervisor adapter narrows verifier evidence and maps the Phase-5 tree-close value, while the nominal brand is neither copied nor made falsely interchangeable |
| `WorkspaceFailureClass` | `state/contracts` | `FailureClass` in `agents/contracts` | The workspace module must classify a script failure into the same closed taxonomy the recovery layer acts on, and it imports `state/contracts` only. An import edge to `agents/contracts` would give the workspace module two contract roots and couple TASK-017 to TASK-004's authoring order for no behavioral gain |

There are still exactly **two permitted duplication families**. TASK-028 adds the narrowed process-registration subject and verifier view to the first structural-alias family while removing every duplicated receipt type. TASK-036 adds the differently named `TreeCloseOutcome`/`RecoveryOrphanOutcome` Phase-5 composition pair to that same structural-alias family. Neither amendment opens a third family. A duplication is a pair of roots holding the same structural shape, and the nominal receipt deliberately has no second declaration.

The primitive, verifier, and Phase-5 outcome views are structurally identical across their declared pair, but the nominal receipt itself is declared only once. Independently declaring the same `unique symbol` in both roots would create different nominal types and make them non-interchangeable; TASK-028 explicitly prohibits that duplication. The verifier accepts `unknown` and returns a structural subject, so a state-issued receipt crosses into TASK-004 without a cast while a synthesized object still fails store verification. Neither permitted duplication family is compiler-checked, so both remain review obligations. A third family requires a new ADR.

**TASK-036 cross-document conformance check.** Enumerate semantic declarations in both generated contract roots and their normative code blocks. There must be exactly one `DURABLE_RECEIPT_BRAND` declaration and exactly one `ProcessGroupRegistrationReceipt` declaration, both under `state/contracts`; there must be none in `agents/contracts`. Both agent-side side-effect methods accept `receipt: unknown`, and the only narrowing surface is `AgentReceiptVerifier`. A sequence may label the state-side store result by its nominal type, but the arrow into TASK-004 crosses as `unknown`. This check is independent of the permitted structural aliases and does not add a third duplication.

## Allowed dependency directions

An arrow means "may import from". Any import not listed is a boundary violation and must be rejected in review.

```text
state/contracts   <-  state
state/contracts   <-  scheduling
state/contracts   <-  supervisor
state/contracts   <-  lifecycle
state/contracts   <-  recovery
state/contracts   <-  workspace
state/contracts   <-  ingress

agents/contracts  <-  agents
agents/contracts  <-  scheduling
agents/contracts  <-  supervisor
agents/contracts  <-  lifecycle
agents/contracts  <-  recovery

state             <-  (nobody; reached only through the StateStore interface)
ingress           <-  (nobody; reached only through the IngressInbox interface)
scheduling        <-  supervisor
supervisor        <-  lifecycle
supervisor        <-  recovery
workspace         <-  supervisor
workspace         <-  recovery
agents            <-  (nobody; reached only through the AgentWorker and ProcessTreeController interfaces)
```

`lifecycle -> agents/contracts` is added because drain must wait on `ProcessTreeController`. It is an interface import, not an implementation import, so it introduces no new coupling to TASK-004's code. `ingress -> state/contracts` is added under TASK-024 for the same reason: the ingress module declares no types of its own and imports one contract root.

**The module graph remains acyclic.** Reading the edges as a partial order:

```text
level 0   state/contracts, agents/contracts        leaves; import nothing
level 1   state, agents, workspace, ingress        import contract roots only
level 2   scheduling                               imports contract roots
level 3   supervisor                               imports scheduling, workspace, contract roots
level 4   lifecycle, recovery                      import supervisor, workspace, contract roots
```

Every declared edge points from a higher level to a lower one, so no cycle exists. `workspace` and `ingress` sit at level 1 alongside `state` and `agents`: each consumes the state contract root and no module. `workspace` is consumed by `supervisor` and `recovery`; `ingress` is consumed by `scheduling`, through the `IngressInbox` interface by constructor injection. Neither imports `state`, `scheduling`, `supervisor`, `recovery`, or `agents`, and none of those may import either implementation.

`ingress` is deliberately at level 1 and not below `scheduling`: the scheduler depends on the inbox, collector, and validator interfaces, never the reverse. TASK-026 returns data and a high-water mark; TASK-005 supplies the signal/observer implementation. The supervisor composes them without introducing a reverse import, so TASK-026 and TASK-017 remain parallel.

Derived rules:

1. Neither contract root imports anything. They are leaves of the dependency graph.
2. Concrete implementations are never imported across module boundaries. A consumer depends on the interface declared in a contract root and receives the implementation by constructor injection. This is what allows TASK-005, TASK-006, TASK-007, TASK-008, and TASK-017 to be unit tested with fakes before their dependencies exist.
3. There are no cycles. The graph is a strict partial order matching the TASK-001 wave order.
4. `supervisor` is the only module that applies events to durable state. `scheduling`, `recovery`, `workspace`, and `ingress` produce events and hand them to the supervisor's append path; they never call `StateStore.append` with their own transition logic. `ingress` additionally owns a store of its own, the inbox, which holds no run state and is never folded into a `RunRecord`; the journal observes its high-water mark and nothing more.
5. `agents` never touches durable state, never sees a fencing token as an authority, and never decides whether to retry. It classifies and returns. It does own the OS process tree of every process it spawns, which is a resource concern rather than a state concern.
6. `lifecycle` never contains scheduling, state, provider, or retry logic. It composes the object graph, translates operator intent into run events, owns the control transport, and owns process signals and exit codes.
7. `workspace` never invokes a provider, never decides scheduling or retry policy, and never modifies a human-controlled governance path. It invokes the tracked orchestration scripts and reimplements none of them.

## Boundary rationale per module

### Durable state store (TASK-003)

The state store is the substrate. Every invariant in [CRASH-RECOVERY.md](CRASH-RECOVERY.md) is enforced here or nowhere. It owns atomicity, monotonicity, and compare-and-set rejection. It deliberately does not know what a run means; it validates structure, version, epoch, and fencing token, and delegates semantic legality to the transition function supplied by the caller.

### Provider adapters and agent workers (TASK-004)

Provider-specific behavior is confined behind `ProviderAdapter`. The supervisor selects an LLM family name from the role assignment and never learns what that family is. Adding a provider is a registry entry, not a change to any other module. Failure classification lives here because only the adapter can interpret a provider-specific error code; every module downstream consumes the closed taxonomy instead.

### Scheduler and lease manager (TASK-005)

Admission control is the only place where concurrency, dependency readiness, and write-scope exclusion are decided. Centralizing it means the supervisor cannot accidentally exceed a limit, and the limits are testable without a supervisor. Fencing tokens are issued here because grant is the only moment at which a token may change.

### Supervisor core (TASK-006)

The transition function is the single authority for state legality. Making it pure, total, and free of clock and randomness is what makes replay deterministic and what lets recovery reuse it without duplicating rules.

### Lifecycle control and entry point (TASK-007)

Operator intent and process concerns are isolated at the edge. Everything below the lifecycle boundary is deterministic given its inputs; time, signals, the filesystem location of the run, and the terminal are injected here.

### Recovery, timeouts, retries (TASK-008)

Recovery, timeout enforcement, and retry policy share one concern: deciding what to do about work that did not report a result. Splitting them would create three modules that each need the same lease, ledger, and attempt state. They are one module with one owner.

### Agent workspace lifecycle (TASK-017)

Added under TASK-016. The module exists because the repository's mandatory concurrent-execution protocol is a required runtime responsibility that no module owned, and because that protocol is the one part of the runtime whose enforcement lives outside the runtime, in human-controlled PowerShell scripts.

It is separate from `lifecycle` because the two answer different questions: `lifecycle` owns what the **operator** asked the run to do, and `workspace` owns what the **repository** requires of every dispatched task. It is separate from `agents` because a workspace must exist before an adapter is selected, and because an adapter must remain replaceable by a registry entry — a provider change must never touch worktree or lock logic. It is separate from `recovery` because its reconciliation acts on Git and the filesystem rather than on the run record, and because giving TASK-008 those paths would put branch deletion and lock release inside the module that also decides retries.

Its full contract is in [WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md).

### Durable ingress inbox (TASK-026)

Added under TASK-024. The module exists because the activation model requires a durable, append-only store whose positions are assigned once and never derived from anything observable outside it, and no module owned such a store. Finding F-301 established that deriving the position from a scan of mutable refs is not a cursor: a backdated commit inserts a fact before it, a deleted branch lowers it, and a commit matching several classes has no reproducible type.

It is separate from `state` because it has a different atomicity model and a different identity rule. The run journal is a single-writer fold whose position is `stateVersion`; the inbox is an identity-keyed set whose position is `seq` and whose deduplication key is a content hash over a source artifact. Giving TASK-003 both would give one module two stores with two append protocols and two crash-recovery stories, and would make the ingress epoch history a concern of the run's writer lock.

It is separate from `scheduling` because the scheduler's concern is admission policy — who may run now — while the inbox's concern is durability of facts other owners produced. TASK-005 reads `highWaterMark()` and never learns how an entry is stored, which is the same relationship every other policy module has with the store it consults.

It is separate from `workspace` because the workspace module acts on the repository under the runtime's own authority, while the ingress adapters only *read* what other owners already published. The workspace module writes Git; the ingress module never does.

Its full contract is section 2b of [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md), and the model it implements is normative in [STATE-MACHINE.md](STATE-MACHINE.md#ingress-model-for-event-triggered-recurring-work).

## Cross-cutting rules binding all eight tasks

1. No module writes credentials, tokens, or provider payload secrets to state, checkpoints, journals, logs, run events, or test fixtures.
2. Every module receives its `Clock`; no module reads wall-clock time directly. This is required for the fake-clock unit tests named in TASK-005, TASK-007, and TASK-008.
3. Every module receives its randomness through a seeded, run-scoped source. Unseeded randomness would break deterministic replay.
4. Every published module entry point is `index.ts`. Deep imports into another module's internals are a boundary violation.
5. User-visible command-line text is Turkish. Identifiers, option names, error codes, log lines, event names, and all source content are English.
6. An implementation task that believes a contract in this document set is wrong must stop and route the change through the Orchestrator back to the architect as an ADR amendment. It must not change the contract locally. See [INTEGRATION-STRATEGY.md](INTEGRATION-STRATEGY.md).
7. No module modifies a human-controlled governance path: the root agent adapters, `.agents/`, `config/agents/settings.yaml`, `scripts/orchestration/**`, the baseline CI and security workflows, `.githooks/**`, `scripts/setup/install-git-hooks.ps1`, `CODEOWNERS`, or the Git policy files. The workspace module invokes those scripts and reimplements none of them.
8. Every process a module spawns — a provider invocation or an orchestration script — runs inside an owned process group or job object and has a durable outcome recorded before the writer lock is released.

## Traceability to acceptance criteria

| Acceptance criterion | Satisfied by |
|---|---|
| Every component boundary maps to exactly one implementation task, with no shared module ownership | Module map and contract roots above |
| Interface contracts consumed across implementation tasks are documented before implementation starts | [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md) |
| Live-run control has one owning module and process-tree lifecycle has one owning module; neither is unassigned and neither has two owners (A-003) | [Responsibility assignments added under TASK-016](#responsibility-assignments-added-under-task-016) |
| The durable ingress inbox has one owning module and one owner task (A-101, F-301) | [Responsibility assignment added under TASK-024 and amended under TASK-028](#responsibility-assignment-added-under-task-024-and-amended-under-task-028) |
| The module map contains exactly **eight** modules, each with exactly one owner task, and no module appears twice | Module map above; eight rows, eight distinct owner tasks, eight distinct source paths |
| The allowed import directions are stated, the module dependency graph is shown to remain acyclic, and the two contract roots stay independent of each other | [Allowed dependency directions](#allowed-dependency-directions), with the level assignment that exhibits the partial order |
