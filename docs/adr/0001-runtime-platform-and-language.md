# ADR-0001: Runtime platform and language

- Status: Accepted
- Date: 2026-08-04
- Deciders: Solution Architect under TASK-002
- Affects: TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008

## Context

The autonomous runtime has no implementation yet and no language is fixed anywhere in the repository. Six implementation tasks are blocked on TASK-002 and cannot start without one, because a contract expressed in one language is not transcribable into another without renegotiation.

Constraints observable in the repository:

- `.gitignore` already excludes `node_modules/`, `dist/`, and `coverage/`, anticipating a Node.js toolchain.
- CI runs on `windows-latest` with `pwsh`, and all orchestration scripts are PowerShell. The runtime must run on Windows first and must not assume a POSIX-only filesystem API.
- `bin/` is designated for command-line entry points, and TASK-007 owns it.
- Provider agents are command-line tools (`claude`, `codex`) invoked as child processes, plus HTTP APIs.
- The contracts in this decision set are heavily typed: closed unions, result types instead of exceptions, and injected interfaces for clock, randomness, and secrets.

## Decision

The runtime is implemented in **TypeScript in strict mode, targeting Node.js 22 LTS, using ES modules**.

Binding parameters for every implementation task:

| Parameter | Value |
|---|---|
| Runtime | Node.js 22 LTS or newer |
| Language | TypeScript, `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` |
| Module system | ESM (`"type": "module"`), `.js` extensions in relative import specifiers |
| Test runner | `node:test` with `node:assert/strict` |
| Async model | Promises and `async`/`await`; `AbortSignal` for cancellation |
| Error model | Returned result unions for expected failures; thrown errors only for defects |
| Filesystem | `node:fs/promises`, with atomic replace abstracted behind one function |
| Entry points | ESM scripts under `bin/`, invoked as `node bin/<name>.mjs` |

Strict mode is not stylistic here. `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are what make the `Record<TaskId, TaskRecord>` lookups and the nullable `lease`, `result`, and `notBefore` fields in the contracts safe without defensive code in six separate modules.

`node:test` is chosen over an external framework so that Wave 2 can begin with zero third-party dependencies, which matters because the toolchain task and the first implementation tasks are close together in the schedule and every added dependency is also a security-review surface.

## Alternatives considered

**PowerShell.** Natural fit for the existing orchestration scripts and requires no toolchain task. Rejected: the contracts depend on discriminated unions and compile-time exhaustiveness that PowerShell cannot express, the state machine's determinism would be unverifiable by the type system, and unit testing with injected fakes and a fake clock is substantially harder. The orchestration scripts remain PowerShell; they solve a different problem.

**Python.** Strong async support and good typing with `mypy`. Rejected: it would require new ignore rules, a new CI toolchain, and a second language in a repository whose automation is already PowerShell and whose ignore file already anticipates Node. The advantage over TypeScript is not large enough to justify a third ecosystem.

**Go.** Best concurrency primitives and single-binary distribution, and the strongest fit for leases and fencing. Rejected: it is the largest deviation from the repository's existing tooling, cross-compilation adds release complexity that TASK-001 did not scope, and the runtime's concurrency is bounded and coarse-grained, so Go's advantage is small in this specific design.

**JavaScript without types.** Rejected outright: the entire value of TASK-002 is that six parallel tasks share a checkable contract. Without static types the contract would be prose only, and drift would surface at integration.

## Consequences

Positive:

- Contracts in [INTERFACE-CONTRACTS.md](../architecture/runtime/INTERFACE-CONTRACTS.md) are directly transcribable and compiler-checked, so contract drift between parallel branches fails at build time.
- Zero runtime dependencies are required for Wave 2, keeping the security review surface minimal.
- `AbortSignal` maps directly onto the worker timeout contract in [PROVIDER-ADAPTERS.md](../architecture/runtime/PROVIDER-ADAPTERS.md).

Negative:

- A toolchain must be added to the repository before Wave 2 can compile, and **no task in the TASK-001 graph owns the root manifests**. This is recorded as an Orchestrator routing item in [INTEGRATION-STRATEGY.md](../architecture/runtime/INTEGRATION-STRATEGY.md); the recommendation is one small devops-owned task.
- The repository gains a second ecosystem alongside PowerShell. Ownership stays split cleanly: PowerShell owns worktree, lock, and scope enforcement; TypeScript owns the runtime.
- Atomic file replacement differs between Windows and POSIX and must be abstracted by TASK-003 rather than assumed.

Reversibility: this decision is cheap to reverse only before TASK-003 begins. After Wave 2 merges, reversal means rewriting every module.
