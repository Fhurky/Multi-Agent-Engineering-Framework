# ADR-0002: Runtime component boundaries and module ownership

- Status: Accepted; superseded in part by [ADR-0011](0011-agent-workspace-lifecycle-module.md)
- Date: 2026-08-04
- Deciders: Solution Architect under TASK-002
- Affects: TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008
- Superseded in part: the six-module map and the "one permitted duplication" clause are replaced by ADR-0011, which adds `src/orchestrator/workspace/` owned by TASK-017 and a second permitted duplication. Everything else below stands.

## Context

TASK-001 partitioned the runtime into six implementation tasks with disjoint write scopes so that any two tasks with satisfied dependencies can run concurrently. TASK-002 must map the runtime's component boundaries onto that partition such that no module has two owners.

The hard part is not the module split; it is the shared type surface. Six modules exchange run records, task records, events, leases, worker results, and failure classifications. A shared types module is the obvious home, but `src/shared/` is outside every runtime task's write scope, so anything placed there would have no owner and could not be written by any task in the graph.

## Decision

Six modules, each owned end to end by exactly one task, matching the TASK-001 write-scope partition:

| Module | Path | Owner |
|---|---|---|
| Durable state store | `src/orchestrator/state/` | TASK-003 |
| Provider adapters and workers | `src/agents/` | TASK-004 |
| Scheduler and lease manager | `src/orchestrator/scheduling/` | TASK-005 |
| Supervisor core | `src/orchestrator/supervisor/` | TASK-006 |
| Lifecycle and entry point | `src/orchestrator/lifecycle/`, `bin/` | TASK-007 |
| Recovery, timeouts, retries | `src/orchestrator/recovery/` | TASK-008 |

Cross-module types live in **exactly two contract roots**, each inside an existing owner's scope:

- `src/orchestrator/state/contracts/` — owned by TASK-003. Declares identifiers, records, states, events, the store interface, and the scheduler, retry, recovery, and lifecycle interfaces.
- `src/agents/contracts/` — owned by TASK-004. Declares the provider adapter interface, invocation, outcome, failure taxonomy, and worker result.

`src/shared/` is not used by the runtime.

Supporting rules:

1. Concrete implementations are never imported across modules. Consumers depend on an interface from a contract root and receive the implementation by constructor injection.
2. The dependency graph is acyclic and matches the wave order. Contract roots are leaves.
3. Only the supervisor's append path mutates durable state. The scheduler and recovery layer produce event envelopes and hand them over.
4. TASK-003 declares more interfaces than it implements, because the contract root must exist before Wave 3.
5. `agents/contracts` re-declares six primitive aliases (`RunId`, `TaskId`, `Sha256Hex`, `IsoTimestamp`, `FencingToken`, `TaskProposal`) rather than importing them from `state/contracts`. This is the one permitted duplication.

## Alternatives considered

**A shared types package under `src/shared/`.** The conventional answer and the one PROJECT_STRUCTURE.md nominally invites. Rejected: it has no owner in the task graph. Adopting it would require expanding some task's write scope to a repository-wide surface, which reintroduces exactly the shared ownership the partition exists to prevent, or creating a seventh task whose only output is a types file — a full worktree, lock, branch, and review gate for a file that changes only when this ADR changes.

**Every module declares its own local types and relies on structural typing.** Rejected: TypeScript would accept it, so drift would be invisible to the compiler. Six independent copies of a nine-member failure union is a guaranteed divergence, and the disposition mapping in particular must have exactly one definition.

**One contract root inside TASK-003 only.** Simpler, and was the first candidate. Rejected: TASK-003 and TASK-004 run concurrently in Wave 2. TASK-004 would have to import types from a directory that does not exist yet on its branch, which either serializes the two tasks or forces TASK-004 to write into TASK-003's scope. Two roots split along the parallel boundary is what makes Wave 2 genuinely parallel.

**Merge recovery into the supervisor.** Fewer modules and no interface between them. Rejected: it would give TASK-006 and TASK-008 the same write scope, violating the partition, and would put retry policy in the same module as the transition function, where a timing bug and a legality bug become hard to distinguish.

## Consequences

Positive:

- Every module has exactly one owner and one review gate. No branch can conflict with another textually.
- Wave 2 is genuinely parallel: neither contract root imports the other, so there is no ordering constraint between TASK-003 and TASK-004.
- Fakes for every boundary follow directly from the injected interfaces, which is what allows TASK-005 through TASK-008 to be unit tested before their dependencies exist.

Negative:

- The six duplicated primitive aliases must be kept identical by review rather than by the compiler. They are aliases over `string` and `number`, so the blast radius of a divergence is small, but the reviewer of TASK-004 must check them against [INTERFACE-CONTRACTS.md](../architecture/runtime/INTERFACE-CONTRACTS.md).
- TASK-003 owns interfaces it does not implement, so its reviewer must review declarations whose behavior is validated in a later task.
- `src/shared/` remains empty for the runtime, which reads as inconsistent with PROJECT_STRUCTURE.md until that document is updated by its owner, the Documentation Engineer.
