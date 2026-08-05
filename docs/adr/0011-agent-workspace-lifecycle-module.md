# ADR-0011: Agent workspace lifecycle as the seventh runtime module

- Status: Accepted; superseded in part by [ADR-0019](0019-durable-intent-receipts-for-side-effects.md), which replaces the four single-call operations with plan/execute phases behind a durable-intent receipt and adds the abandonment intent event, and by [ADR-0021](0021-durable-ingress-module-and-the-eight-module-map.md), which replaces "seven modules" with eight. Every other decision below stands as written.
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-016
- Affects: TASK-017 primarily; TASK-006 and TASK-008 consume it; TASK-004's invocation shape changes
- Supersedes in part: [ADR-0002](0002-runtime-component-boundaries-and-module-ownership.md) — its six-module map and its "one permitted duplication" clause. ADR-0002's other decisions stand.

## Context

`AGENTS.md` makes one protocol mandatory for every agent task: verified repository hooks, one isolated worktree, one branch named `agent/<llm>/<role>/<task-id>`, one atomic task lock claimed before editing, write-scope validation before handoff, a published branch and a pull request, a durable handoff, and lock release afterward.

The TASK-002 architecture assumed the **result** of that protocol without assigning it. `AgentInvocation` carries a `worktreePath` and a `branch`, and [LIFECYCLE-AND-BOOTSTRAP.md](../architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md) recorded that "the runtime resolves it at dispatch". None of the six modules created the worktree, created the branch, installed the hooks, claimed the lock, validated the scope, published the branch, persisted the handoff, or released the lock.

A supervisor built on that architecture has two options at every dispatch, and both defeat the stated objective of a single command that runs to completion: stop and wait for a human, or run every agent in one shared checkout — which is the failure mode the protocol exists to prevent.

Finding F-105 in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md` recorded a narrower version of the same gap on the task side: the workspace automation task required only a local commit, and never required successful branch publication, idempotent pull-request creation, or durable pull-request identity. The mandatory handoff includes both, and TASK-013's `artifact_published` activation event triggers on them.

## Decision

**A seventh module, `src/orchestrator/workspace/`, owned solely by TASK-017.** Its normative contract is [WORKSPACE-LIFECYCLE.md](../architecture/runtime/WORKSPACE-LIFECYCLE.md) and its interface is section 10 of [INTERFACE-CONTRACTS.md](../architecture/runtime/INTERFACE-CONTRACTS.md).

**Four operations**, each with observable pre- and post-conditions and a typed failure classification: `prepare`, `finalize`, `abandon`, and `reconcile`.

**It imports `state/contracts` and no module.** The supervisor and the recovery layer consume it through the `WorkspaceLifecycle` interface by constructor injection. The module dependency graph stays acyclic, with `workspace` at the same level as `state` and `agents`: above the contract roots, below `supervisor` and `recovery`.

**It delegates to the human-controlled PowerShell orchestration scripts and reimplements none of them.** Hook installation, worktree and branch creation, lock claim, scope validation, and lock release are each one process invocation with an explicit argument vector. The module contains no lock file format, no worktree creation, no scope glob evaluation, and no hook installation.

**Failure classification is decided by observing durable artifacts, never by parsing a script's message text.** A non-zero exit is a failure; which class it is follows from whether the lock file exists and who owns it, whether the branch exists, and whether the worktree exists. An unrecognized observation maps to `unknown`, whose disposition is `fail`.

**Branch publication and pull-request identity are part of the contract.** `finalize` pushes exactly one derived ref, looks up an open pull request by head branch before creating one, and persists branch, commit, and pull-request identity as one durable record **before** the lock is released. Publication failure is an explicit `blocked` outcome carrying a typed class; it is never reported as success on a local-only commit, never retried into a different target, and never a fallback to another ref.

**Because the push target is a stable derived key and pull-request creation is look-up-then-create, both are `idempotent: true` in the effect ledger.** This refines [ADR-0006](0006-retry-classification-backoff-and-idempotency-keys.md), which classified pull-request creation as non-idempotent in the general case; the general case remains non-idempotent, and this specific contract is what makes the runtime's own usage safe to replay.

**Four prohibitions are enforced structurally**, not by instruction:

| Prohibited | Mechanism |
|---|---|
| Pushing `main` | One push-constructing function, taking no ref parameter, whose refspec is derived from the validated branch pattern |
| Setting `ALLOW_MAIN_PUSH` | An allow-listed spawn environment; every variable outside the list is stripped, so it cannot even be inherited |
| Bypassing the pre-push hook | `--no-verify` appears in no constructed vector, and `prepare` refuses when `core.hooksPath` is not `.githooks` |
| Writing a governance path | Only the task's declared write-scope patterns are staged, and `validate-write-scope.ps1` runs before the commit |

**The session-token rule is narrower than the script's.** The runtime records `session_id` durably at `WorkspacePrepared`; it attempts a release only when its recorded session matches the lock's; and it never passes `-Force`, which is structurally unavailable because the release vector is built from a fixed template with no slot for it. When a lock cannot be released, the runtime records it for human attention, blocks the owning task, and **leaves the lock held**.

**A second permitted duplication.** `WorkspaceFailureClass` is declared in `state/contracts` as a structurally identical mirror of `FailureClass`, so the workspace module can classify into the taxonomy the recovery layer acts on while importing one contract root. ADR-0002 stated that the six primitive aliases in `agents/contracts` were the only permitted duplication; this is the second and last, and a third requires a new ADR.

## Alternatives considered

**Give the responsibility to `lifecycle` (TASK-007).** It already owns process concerns and the composition root. Rejected: `lifecycle` owns what the **operator** asked the run to do, and this is what the **repository** requires of every dispatched task. They have different lifetimes — one per command versus one per task attempt — and merging them would put worktree and lock logic in the module that also owns signal handling and exit codes, in the same wave as the one-input bootstrap.

**Give it to `agents` (TASK-004).** The worktree is what the provider runs in, so the coupling is real. Rejected: a workspace must exist before an adapter is selected, and the extension test for the provider boundary is that adding a provider requires exactly one registry entry. Putting Git worktree and task-lock logic inside `src/agents/` would make a provider change a change to lock handling, and it would put the repository's enforcement protocol behind a boundary whose whole purpose is provider neutrality.

**Give it to `recovery` (TASK-008).** Reconciliation of orphaned worktrees is recovery-shaped work. Rejected: it inverts the lifetime. Preparation and finalization happen on the dispatch path, and only reconciliation is recovery-shaped. It would also give the module that decides retries the authority to delete branches and release locks, which is more power in one place than any other module holds.

**Reimplement the protocol in TypeScript instead of invoking the scripts.** Faster, testable without spawning processes, and independent of PowerShell. Rejected outright: the scripts are human-controlled enforcement files precisely because they constrain the agents. Reimplementing lock or scope logic inside the runtime would put the enforcement mechanism inside the thing it constrains, and a runtime bug would then silently disable the guarantee rather than fail loudly. The cost — process spawn latency per dispatch, measured against agent invocations that take minutes — is negligible.

**Parse script output to classify failures.** More precise than observing artifacts. Rejected: message text is not a contract. A runtime that branched on it would mis-handle a failure the day a message was reworded, and it would silently couple the runtime to strings in a human-controlled file it may not edit.

**Treat publication as best-effort with a local-only fallback.** It would make the runtime work without credentials. Rejected: it makes `review_ready` a lie. A gate task scheduled on an unpublished commit cannot be reviewed by an independent execution context, and the graph's readiness edge would be satisfied by something no reviewer can read. `blocked` with a typed reason is the honest outcome, and `allowLocalOnlyPublication` exists as an explicit operator-recorded acceptance rather than as a silent default.

**Force-release a lock whose owning session appears dead.** It would let a crashed run recover unattended. Rejected: the runtime cannot distinguish a dead session from a live one on another machine, and `AGENTS.md` reserves force release for a human who has verified staleness. Breaking a lock could let a second execution edit a worktree another session is still writing, which is the exact condition the lock exists to prevent. Leaving it held costs one blocked task and a recorded diagnostic.

## Consequences

Positive:

- The single-command objective becomes achievable: no human is needed at any dispatch.
- Every mandatory protocol step has exactly one owner, and the module map has no unassigned runtime responsibility.
- The enforcement scripts remain the single source of truth for locks, worktrees, and scopes, so a runtime defect cannot weaken them.
- Publication and pull-request identity are durable and idempotent, which makes `review_ready` a fact a reviewer can act on and removes F-105 at its source.
- The four prohibitions are unavailable rather than discouraged, so a security review can verify them by reading one function and one allow list.

Negative:

- The runtime gains a hard dependency on PowerShell and on the scripts' current parameter surface. A change to a script's interface is a cross-boundary coordination that TASK-017 must escalate rather than absorb.
- Failure classification by artifact observation is coarser than parsing would be. Some distinct failures collapse into `unknown`, whose disposition is `fail`, so the runtime will occasionally fail a task it could in principle have retried. That is the safe direction.
- Every dispatch pays a process spawn per protocol step. Against agent invocations measured in minutes this is irrelevant, but it makes the module's unit tests slower than a pure module's, and they require a real temporary Git repository.
- `abandon` is deliberately conservative and can leave a worktree on disk when it holds uncommitted changes. A long-running installation will accumulate directories that a human must inspect. Losing an agent's uncommitted work to an automatic cleanup is the worse failure.
- TASK-006 and TASK-008 both gain an edge to a module that did not exist in the TASK-001 wave plan. Both already declare `integrated(TASK-017)` in the committed graph, so no re-decomposition follows from this decision.
