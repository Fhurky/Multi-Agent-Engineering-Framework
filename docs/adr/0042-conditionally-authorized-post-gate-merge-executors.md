# ADR-0042: Conditionally Authorized Post-Gate Merge Executors

- Status: TASK-041 recorded changes-required; superseded in part by proposed [ADR-0043](0043-exact-merge-admission-policy-attestation-and-published-head-evidence.md); TASK-044 review pending
- Date: 2026-08-06
- Decision owner: Solution Architect
- Governance authority: HUMAN-004 at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`
- Supersedes in part: ADR-0010's human-only final release merge; ADR-0016's operator-executed integration order and prohibition on every non-human main merge
- Extends: ADR-0019 and ADR-0027 plan/execute durability, ADR-0023/ADR-0031 ingress authorization, ADR-0041 cumulative integration unit

TASK-041 at `ec533fb5bb0055675fb81f72057d5636f7867db3` retained the two-module boundary, typed refusal totality, API-only mutation, durable intent/recovery/retry order, ingress separation, HUMAN-004 exception union, and topology, while recording F-041-01, F-041-02, and F-041-04 against gate admissibility, policy observation, and published-head evidence. ADR-0043 supersedes only those clauses. This record's preserved decisions remain the predecessor content of the cumulative TASK-042 amendment.

## Context

The approved architecture defines which content unit may integrate, its order, gates, branch, merge method, and durable `BranchIntegrated` evidence, but assigns the GitHub merge to an operator. It has no component that can perform the task-to-integration merge and no component that can merge the assembled integration pull request into `main`. The workspace module deliberately cannot do either.

HUMAN-004 conditionally authorizes both operations and fixes their owners, activation conditions, finite human exception set, prohibited capabilities, and security posture. An architecture change is required before implementation because combining the authorities, reusing the workspace push path, or relying on prose gate checks would widen or obscure the grant.

## Decision

Add two separate modules:

1. A runtime-owned post-gate integration executor at `src/orchestrator/integration/`, with tests at `tests/unit/orchestrator/integration/`. It may squash-merge only the next admitted task content unit into `integration/autonomous-runtime`.
2. A DevOps-owned release merge executor at `scripts/release/integration-merge/`, with tests below that path. It may use an ordinary protected pull-request merge only from the pinned integration head into `main`, after an immutable `release-gates/v1` manifest proves all seven aggregate domains.

Both placements fit current role write scopes. No settings amendment is required. The modules share no implementation and have separate GitHub App identities, evidence namespaces, admission inputs, and result types.

Each executor is activated only by an immutable record proving independent architecture approval, implementation review and security validation, configured GitHub controls, and passing negative-capability tests. Admission is pure and total. Execution requires a store-issued receipt proving the canonical merge plan durable before the API mutation, revalidates the immutable head/base and policy, uses a fixed narrow merge port, verifies the resulting tree, and writes a durable terminal outcome. Recovery reconciles GitHub before retry, adopts only an exact match, and never blindly repeats an ambiguous mutation.

The retry policy is bounded to three total mutation attempts and 120 seconds. Known conflicts and policy failures route durable remediation to the responsible agent role. No result requests a routine human merge.

The human exception union has exactly three members: formal acceptance of an unresolved blocking High/Critical risk; authorization of a policy-required irreversible production action; and credential or repository authorization-policy change. Main merge alone is not the second member. Unclassifiable cases refuse with a typed exception record.

Neither executor appends its own ingress trigger. A TASK-026-owned merge-result adapter validates terminal evidence and appends `branch_integrated`; TASK-005 observes the high-water mark and ordinary scheduling applies the result. Before that durable path exists, implementation may be present only under `dormant-before-durable-merge-ingress`, which permits no merge.

The full typed contract, refusal union, release-gate addition, evidence protocol, identity, policy requirements, and fixtures are normative in [POST-GATE-MERGE-EXECUTORS.md](../architecture/runtime/POST-GATE-MERGE-EXECUTORS.md).

## Alternatives considered

### One executor parameterized by source and base refs

Rejected. It collapses separately owned authorities, makes a task credential capable of naming `main`, and creates one admission predicate where release has seven additional aggregate domains.

### Extend the workspace module

Rejected. Workspace publication is intentionally limited to its derived task branch. Adding a generic ref or merge method would destroy the structural prohibition that protects `main` and couple repository lifecycle to gate authority.

### Let the Orchestrator merge and append its own fact

Rejected. The Orchestrator owns routing, not domain side effects, and an appender that creates its own trigger repeats the deadlock/self-authorization defect HUMAN-002 corrected.

### Use a workflow token with administrator or bypass rights

Rejected. HUMAN-004 grants merge permission and explicitly withholds bypass. A broad workflow identity would also blur the two authorities and could mutate checks or policy.

### Ask a human to resolve every conflict or ambiguous response by merging

Rejected. Routine human merge requests are outside the finite exception set. Agent remediation, bounded retry, and evidence-based reconciliation cover these cases without guessing or force.

## Consequences

- The component map grows by two uniquely owned modules but retains exactly two independent contract roots and remains acyclic.
- `ReleaseGateManifest` and its seven-member aggregate domain set become explicit architecture vocabulary.
- Task records intended for autonomous integration require a typed `mergeAdmission` declaration; absence refuses and does not reinterpret legacy records.
- HUMAN-002 remains a separate operational prerequisite. Executor code can land dormant, but no merge is allowed until durable result append and scheduler observation are implemented and validated.
- Human-controlled changes to `AGENTS.md`, GitHub rules, required checks, App installations, credentials, and policy attestations remain necessary. This ADR does not make them.
- Existing pull requests, including TASK-018, retain their current gates. This decision is not retroactive.
- This ADR is an Architect-authored proposal. It records no approval and opens no gate.
