# ADR-0031: Runtime-owned pre-dispatch ingress observer and collector

- Status: Accepted HUMAN-002 decision; success-result shape superseded in part by [ADR-0038](0038-total-pre-dispatch-ingress-append-dispositions.md)
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-028, representing the user-approved HUMAN-002 decision
- Affects: TASK-026 implements validation, collection, and append-through-store; TASK-005 implements the high-water signal and pre-selection observation; TASK-006 wires the two without owning either operation; TASK-009, TASK-010, and TASK-011 validate the completed capability
- Builds on: [ADR-0023](0023-immutable-ingress-entries-and-named-bootstrap-dispatch-contracts.md) and [ADR-0029](0029-ingress-delivery-ownership.md)

## Context

HUMAN-002 selected a Runtime-owned durable pre-dispatch ingress observer and collector. Before this decision, the recurring activation could be selected only under an interim operator authorization because no authorized runtime principal durably appended its trigger before scheduler selection. Allowing the activation to append after it started would manufacture its own wake-up and reopen F-201; treating the operator as the durable appender would misrepresent the option the user approved.

The contract must also preserve the eight-module acyclic graph. The ingress module may expose a new mark, but it must not import scheduling policy or call a scheduler implementation directly.

## Decision

**The collector is Runtime-owned, lives outside `tasks/**`, and runs in the runtime control plane.** Its implementation path is `src/orchestrator/ingress/pre-dispatch-collector.ts`, owned by TASK-026. It is not an agent activation, an Orchestrator task, a provider adapter, or an operator-run tool.

**Four named interfaces express the complete pre-dispatch path, each with one owner.**

| Step | Interface | Owning module and task |
|---|---|---|
| Validate an external source fact and reject malformed, unauthorized, or self-produced input | `PreDispatchIngressValidator.validate` | `src/orchestrator/ingress/`, TASK-026 |
| Deduplicate and durably append under the `pre_dispatch_collector` principal | `IngressInbox.append` | `src/orchestrator/ingress/`, TASK-026 |
| Expose the committed high-water mark without importing scheduling | `PreDispatchIngressCollector.collect` result | `src/orchestrator/ingress/`, TASK-026 |
| Signal and observe that mark before candidate selection | `IngressHighWaterSignal.signal` and `IngressObserver.observe` | `src/orchestrator/scheduling/`, TASK-005 |

The supervisor in TASK-006 is composition only: it calls `collect`, passes the returned mark to `signal`, waits for `observe`, and only then calls the pure scheduler. It validates no fact, appends no ingress entry, and chooses no substitute mark.

**The ordering is normative and fail-closed.**

    external source fact
      -> PreDispatchIngressValidator.validate
      -> IngressInbox.append(pre_dispatch_collector, bootstrap context, candidate)
      -> durable append result with highWaterMark
      -> IngressHighWaterSignal.signal(highWaterMark)
      -> IngressObserver.observe confirms the same or a later durable mark
      -> Scheduler.activatableTasks
      -> TaskActivated

No selection call is legal before the observation step succeeds. A validation or append failure produces no signal. A signal/observation mismatch returns `BootstrapContractUnsatisfied`; it never falls back to operator selection while declaring `durable-bootstrap-append`.

**The recurring activation consumes and never produces.** It receives immutable entries through the delivery contract in ADR-0029, records consumption rows and the cursor advance through `IngressRangeConsumed`, and has no `IngressAppendPrincipal`, `IngressInbox`, collector, validator, or signal capability. The closed principal union in ADR-0023 makes self-triggering structurally inexpressible.

**Interim authorization is bounded.** `interim-operator-authorized` remains an honest bootstrap limitation only until TASK-026 and TASK-005 implement this path and TASK-009, TASK-010, and TASK-011 record passing validation of schema, authorization, and pre-selection ordering. HUMAN-002 approval alone changes no task declaration and closes no gate. After those conditions hold, the recurring task declaration changes to `durable-bootstrap-append`; no runtime default performs the change.

## Alternatives considered

**Let the recurring activation append its own trigger.** Rejected because the consumer would manufacture the predicate that authorizes its own dispatch.

**Use the operator or an operator-run tool as the durable appender.** Rejected because HUMAN-002 chose a Runtime-owned component and because the operator path has no module-owned authorization boundary.

**Put collection in scheduling.** Rejected because validation, identity-keyed deduplication, and durable append are ingress durability concerns; placing them in TASK-005 would collapse policy and storage and would give scheduling an append capability.

**Have ingress call the scheduler directly.** Rejected because scheduling already reads ingress. The reverse call would introduce a module cycle. Returning a mark and wiring the scheduling-owned signal through the supervisor preserves the declared dependency direction.

**Poll mutable Git refs and use their count as the signal.** Rejected because a ref scan is neither durable nor append-stable and cannot establish the predicate the scheduler claims.

## Consequences

Positive:

- A durable entry exists before selection, so the autonomous bootstrap predicate is real rather than reconstructed after dispatch.
- Validation, deduplication, append, signalling, observation, and delivery each have one named interface and one owner.
- The self-trigger prohibition is enforced by capability absence and a closed principal union.
- The module graph remains acyclic: ingress exposes data, scheduling owns observation, and the supervisor only composes.

Negative:

- The pre-dispatch path adds a control-plane round trip before candidate selection.
- The system carries two explicit bootstrap contracts until implementation and independent validation permit the recurring task declaration to change.
- TASK-006 must wire the mark without becoming an alternative validator, appender, or observer; tests must detect that accidental ownership expansion.
