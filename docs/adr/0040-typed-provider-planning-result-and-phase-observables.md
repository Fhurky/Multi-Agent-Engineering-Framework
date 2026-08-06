# ADR-0040: Provider planning has a typed result and phase-accurate observables

- Status: TASK-037 recorded changes-required for TASK-036; A-505 individually resolved
- Date: 2026-08-06
- Deciders: Solution Architect under TASK-036
- Affects: TASK-004 provider-neutral worker; TASK-006 dispatch composition; TASK-017 workspace preparation fixture
- Supersedes in part:
  - [ADR-0019](0019-durable-intent-receipts-for-side-effects.md) — the plan phase returning `WorkerInvocationPlan` directly despite fallible adapter-family resolution. Its three-phase split, supervisor-owned appends, and intent-before-side-effect ordering remain in force.
- Extends:
  - [ADR-0007](0007-provider-adapter-boundary-and-error-taxonomy.md) — applies the existing classified failure model to pre-spawn family resolution.

## Context

Round-6 finding **A-505** records that `planInvocation` cannot express its documented `invalid_request/UNKNOWN_PROVIDER_FAMILY` path. Its signature returns `WorkerInvocationPlan` directly, and throwing would bypass the declared failure taxonomy.

The same provider document assigns timeout and non-prepared-workspace refusal to the withdrawn `execute` operation. Timeout belongs to the phase that awaits the provider. A non-prepared workspace cannot reach the worker at all because `WorkspaceRef.prepared` is the literal `true`; the only boundary able to observe failure is workspace preparation and supervisor assignment construction.

## Decision

**`planInvocation` returns `WorkerPlanResult`.**

- Success is `{ ok: true, plan: WorkerInvocationPlan }`.
- Failure is `{ ok: false, failure: WorkerPlanFailure }`.
- `WorkerPlanFailure` narrows `AdapterFailure` to `failureClass: 'invalid_request'`, `code: 'UNKNOWN_PROVIDER_FAMILY'`, `providerCode: null`, and `retryAfterMs: null`.
- The message is English and redacted.
- Throwing for an unknown family is non-conforming.

Only a successful plan may be used to append `ProcessGroupRegistered` or call `beginInvocation`. A failed plan creates no group, process, timer, registration, or provider call.

The public worker surface has exactly three phase observables:

1. `planInvocation`: typed family-resolution result, deterministic successful plan, no side effect.
2. `beginInvocation`: proof verification, owned-group creation, spawn, and typed proof/spawn refusal.
3. `completeInvocation`: provider wait, timeout classification, bounded verified tree close, and addressable worker result.

Workspace failure stays upstream. When preparation fails or blocks, the supervisor constructs no `WorkspaceRef`, `AgentInvocation`, or `WorkAssignment` and calls none of the three phases.

## Alternatives considered

**Throw on unknown family.** Rejected. It bypasses the closed taxonomy and makes a documented classified failure unrepresentable.

**Resolve the family during `beginInvocation`.** Rejected. It delays a pure refusal until after the supervisor has durably registered an invocation that can never spawn.

**Add `prepared: false` to `WorkspaceRef`.** Rejected. The handle is proof that preparation succeeded; widening it would move an upstream lifecycle refusal into every downstream worker path.

**Restore a single `execute` method for observability.** Rejected. It would remove the supervisor append seams that ADR-0019 introduced.

## Consequences

Positive:

- Every documented plan failure is a typed, classified value.
- No durable process registration is created for an unknown provider family.
- Observability aligns with the actual three-phase API.
- Workspace isolation stays structurally enforced at assignment construction.

Negative:

- Every caller must branch on `WorkerPlanResult` before accessing a plan.
- Tests and diagrams need an explicit plan-failure termination path.
- Phase-specific metrics must be attributed to three operations rather than one aggregate worker call.
