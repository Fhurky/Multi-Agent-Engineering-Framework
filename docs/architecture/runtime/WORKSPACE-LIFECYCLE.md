# Agent Workspace Lifecycle

Normative workspace contract for the autonomous runtime. Produced under TASK-016 and amended under TASK-024, TASK-028, and TASK-036. Related decisions: [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md), as amended by [ADR-0019](../../adr/0019-durable-intent-receipts-for-side-effects.md), [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md), TASK-028 ADRs [0027](../../adr/0027-finalize-split-around-the-publication-append.md) and [0028](../../adr/0028-nominal-store-issued-durable-append-receipts.md), and TASK-036 decisions [ADR-0039](../../adr/0039-single-nominal-receipt-authority-and-cross-root-conformance.md) and [ADR-0040](../../adr/0040-typed-provider-planning-result-and-phase-observables.md). Implemented by TASK-017.

## Amendment register — TASK-036

| Contradictory claim (TASK-034) | Corrected contract | Finding | Decision |
|---|---|---|---|
| `agents/contracts` re-declared receipt types from the state root | Only primitive aliases and the narrowed structural verifier views are mirrored; the nominal receipt and brand exist once in `state/contracts` | A-504 | [ADR-0039](../../adr/0039-single-nominal-receipt-authority-and-cross-root-conformance.md) |
| Provider observability placed unprepared-workspace refusal inside a worker phase even though `WorkspaceRef.prepared` can only be `true` | Workspace preparation failure stops assignment construction upstream; none of the three worker phases is called | A-505 | [ADR-0040](../../adr/0040-typed-provider-planning-result-and-phase-observables.md) |

## Amendment register — TASK-028

| Superseded claim (TASK-024) | Superseded by | Finding | Decision |
|---|---|---|---|
| One `executeFinalize` call both published and released the lock, so the supervisor could persist `ArtifactPublished` only after release | Three-phase finalize: execute while locked, append publication, then receipt-gated completion releases | A-205 | [ADR-0027](../../adr/0027-finalize-split-around-the-publication-append.md) |
| Structural receipts could be synthesized and did not carry the identity each boundary required | Discriminated, identity-bearing, store-issued receipts verified against the current writer epoch | A-206 | [ADR-0028](../../adr/0028-nominal-store-issued-durable-append-receipts.md) |

## Amendment register — TASK-024

| Superseded claim (TASK-016) | Superseded by | Finding | Decision |
|---|---|---|---|
| `prepare`, `finalize`, and `abandon` as single calls that returned their intent events only after the operation, with no way for the supervisor to append an intent first | [Split-phase operations](#split-phase-operations): a `plan` phase producing the intent event and a matching `execute` phase that refuses without a receipt proving it durable | A-103 | [ADR-0019](../../adr/0019-durable-intent-receipts-for-side-effects.md) |
| `abandon` with `WorkspaceAbandoned` and no event entering `abandoning` | `WorkspaceAbandonIntended` enters `abandoning`; `WorkspaceAbandoned` leaves it | A-103 | [ADR-0019](../../adr/0019-durable-intent-receipts-for-side-effects.md) |
| `allowLocalOnlyPublication` as a run limit deciding whether a `local-only` publication satisfies `review_ready` | The owning task's declared `publicationClass`, read from the finalize request | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| A component-diagram claim that the workspace reaches the repository only through human-controlled scripts | [Repository access paths](#repository-access-paths), stated once here and mirrored in the diagram | A-105 | [ADR-0019](../../adr/0019-durable-intent-receipts-for-side-effects.md) |

Nothing in this amendment weakens a structural prohibition. Pushing `main`, setting `ALLOW_MAIN_PUSH`, bypassing the pre-push hook, writing a governance path, and force-releasing a lock remain unavailable by the same mechanisms, and the split-phase change adds a refusal rather than removing one.

## Why this module exists

`AGENTS.md` makes one protocol mandatory for every agent task: verified repository hooks, one isolated worktree, one branch named `agent/<llm>/<role>/<task-id>`, one atomic task lock claimed before editing, write-scope validation before handoff, a published branch and a pull request, a durable handoff, and lock release afterward.

The TASK-002 architecture assumed the result of that protocol without assigning it. `AgentInvocation` carries a `worktreePath` and a `branch`, and [LIFECYCLE-AND-BOOTSTRAP.md](LIFECYCLE-AND-BOOTSTRAP.md) recorded that "the runtime resolves it at dispatch" — but none of the six modules created the worktree, created the branch, installed the hooks, claimed the lock, validated the scope, published the branch, persisted the handoff, or released the lock. A supervisor built on that architecture has exactly two options at every dispatch, and both defeat the objective: stop and wait for a human, or run every agent in one shared checkout, which is the failure the protocol exists to prevent.

This module owns the protocol. It is the seventh of the eight modules in the map, its source path is `src/orchestrator/workspace/`, and TASK-017 is its sole owner.

## Boundaries

**It owns:** workspace preparation, finalization, abandonment, and reconciliation; the derivation and validation of branch and worktree identity; invocation of the human-controlled orchestration scripts; publication and pull-request identity; and the classification of every workspace failure.

**It does not own:** provider invocation, scheduling policy, state-store internals, retry policy, lifecycle command handling, or any change to the scripts it drives. It proposes events; it never appends them itself, because only the supervisor's append path mutates durable state.

**Consumers:** the supervisor (TASK-006) drives `planPrepare`/`executePrepare`, `planFinalize`/`executeFinalize`/`completeFinalize`, and `planAbandon`/`executeAbandon`, appending each required durable event between phases; the recovery layer (TASK-008) calls `reconcile` on attach. Both receive the module by constructor injection through the `WorkspaceLifecycle` interface declared in `state/contracts`.

**Imports:** `state/contracts` and nothing else. The module needs the provider failure taxonomy in order to classify, and takes it through `WorkspaceFailureClass`, a structurally identical re-declaration of `FailureClass` in `state/contracts`. The independent `agents/contracts` root mirrors only the explicitly permitted primitive aliases, `AgentProcessRegistrationSubject`, and `AgentReceiptVerifier`; it does **not** re-declare any durable receipt or nominal brand. See [COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md), [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md), and [ADR-0039](../../adr/0039-single-nominal-receipt-authority-and-cross-root-conformance.md).

## The workspace handle

A handle is the durable identity of one task's workspace for one attempt. It is derived, never accepted from agent output.

```text
workspaceId  = "ws-" + first16HexOf(sha256(canonicalJson({ runId, taskId, attempt })))
branch       = "agent/" + llm + "/" + role + "/" + lowercase(taskId)
worktreePath = worktreeRoot + "/" + llm + "-" + role + "-" + lowercase(taskId)
```

`llm`, `role`, and `taskId` are read from the task record and from the resolved role assignment. Every one is validated against `/^[a-z0-9][a-z0-9-]*$/` before it is concatenated, and `branch` is validated as a whole against `/^agent\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/`. A value that fails validation is a dispatch refusal, not a sanitization opportunity: nothing is stripped, escaped, or corrected. This is what makes hostile agent output — a path traversal sequence, a shell metacharacter, a ref that resolves to `main` — unable to reach a filesystem path or a command vector, because it never enters the derivation at all.

## Workspace states

| State | Meaning | Recoverable |
|---|---|---|
| `unprepared` | No workspace exists for this attempt | Nothing to recover |
| `preparing` | Prepare intent is durable; the worktree, branch, or lock may or may not exist | Yes — `reconcile` resolves to `prepared` or `abandoned` |
| `prepared` | Worktree exists, branch exists, hooks verified, lock held with a recorded session id | Yes — reused by the same attempt |
| `finalizing` | Finalize intent is durable; validation, commit, publication, or pull-request creation may be partially done | Yes — `reconcile` reads what happened and completes or blocks |
| `finalized` | Commit, publication, and pull-request identity are durable; the lock is released | Terminal for this attempt |
| `abandoning` | Abandon intent is durable | Yes — completed idempotently |
| `abandoned` | Lock released, worktree removed, branch retained if it holds commits | Terminal for this attempt |
| `unresolved` | Reconciliation could not reach a known state without breaking a safety rule | **No.** Requires human attention; the owning task is `blocked` |

| State | Entered by | Left by |
|---|---|---|
| `preparing` | `WorkspacePrepareIntended` | `WorkspacePrepared`, `WorkspaceAbandoned`, or `WorkspaceReconciled` |
| `prepared` | `WorkspacePrepared` | `WorkspaceFinalizeIntended` or `WorkspaceAbandonIntended` |
| `finalizing` | `WorkspaceFinalizeIntended` | `WorkspaceFinalized`, `WorkspaceAbandoned`, or `WorkspaceReconciled` |
| `abandoning` | **`WorkspaceAbandonIntended`** — added under TASK-024 | `WorkspaceAbandoned` or `WorkspaceReconciled` |

TASK-016 declared `abandoning` and gave it no entering event, which finding A-103 recorded: the union held `WorkspaceAbandoned` and nothing that reached the state it was supposed to leave. Every one of the four intent-bearing states now has exactly one entering event, and each of those events is durable before the operation it authorizes.

Every state transition follows an intent-then-commit pair, mirroring the effect ledger: an intent event is durable before the operation is attempted, and a completion event is durable after it succeeds. TASK-024 makes that a property of the interface rather than of the prose, through the split-phase protocol below.

## Split-phase operations

Added under TASK-024 (ADR-0019) to resolve A-103. TASK-016 required prepare, finalize, and abandon intent to be durable before any script or Git command ran, and then exposed each operation as **one call** that returned its intent event only after the operation. The module is forbidden to append, and no callback or split existed, so the requirement was unsatisfiable: a crash during a script could leave a branch, worktree, lock, commit, or publication side effect with no durable intent for `reconcile` to find.

Prepare and abandon are two calls with the supervisor's append between them:

```text
1. supervisor:  plan = ws.planPrepare(request)             pure; no script, no git, no filesystem write
2. supervisor:  append(plan.intentEvent)                   WorkspacePrepareIntended, durable
3. supervisor:  receipt = appendResult.receipts[i]         issued only after the batch commit record
4. supervisor:  result = await ws.executePrepare(plan, receipt)
```

Abandon follows the identical shape with `WorkspaceAbandonIntended`. Finalize adds one more boundary under TASK-028: `executeFinalize` publishes while retaining the lock, the supervisor appends `ArtifactPublished`, and only `completeFinalize` may release the lock after verifying the publication receipt.

Four properties follow, and each is checkable rather than promised:

1. **The intent precedes the side effect by construction.** `executePrepare` is the only method that invokes a script, and it takes a receipt parameter. There is no overload without one, so a side effect before a durable intent is not expressible.
2. **The module still holds no write authority.** A `WorkspaceIntentReceipt` or `ArtifactPublicationReceipt` is evidence that an event is durable. Each is identity-bearing, issued by `StateStore.append`, and verified against the store-recorded subject and current writer epoch. Neither carries an append capability. The rule that only the supervisor's append path mutates durable state is unchanged.
3. **A refusal costs nothing.** The `plan` phase can refuse — a branch or worktree that fails derivation validation is a dispatch refusal — and it refuses *before* an intent exists, so a refused dispatch leaves no workspace record to reconcile.
4. **A crash anywhere in `execute` is recoverable.** Whatever the script did or did not do, the intent is durable, so `reconcile` has a record to act on. That is the guarantee A-103 said the interface could not deliver.

The same shape is used for process registration in [PROVIDER-ADAPTERS.md](PROVIDER-ADAPTERS.md); one mechanism, two boundaries.

## Operations

### `prepare`

`planPrepare` is called by the supervisor after the lease is granted; `executePrepare` is called after the intent is durable and before the worker is invoked.

| | Condition |
|---|---|
| Pre, `planPrepare` | The task holds a valid lease; the derived branch and worktree pass validation; no workspace for this task is in `preparing`, `finalizing`, or `unresolved`. It performs no side effect, so a refusal here leaves nothing behind |
| Pre, `executePrepare` | A `WorkspaceIntentReceipt` for `WorkspacePrepareIntended` on this `workspaceId` is presented. Without it the call returns `failed` with code `INTENT_NOT_DURABLE` and invokes no script |
| Post, `ok` | Repository hooks are verified installed; the worktree exists at the derived path; the branch exists and matches the derived name; the task lock is held and its `session_id` is recorded durably; `WorkspacePrepared` is durable; the returned handle is `prepared` |
| Post, `blocked` | No worktree, branch, or lock was left in an indeterminate state that `reconcile` cannot resolve; the typed failure class and reason are recorded |
| Post, always | No provider process has been spawned. A dispatch cannot reach provider invocation without a `prepared` handle, and `DispatchStarted` is an illegal transition without one |

Steps, in order, each delegating to the script named:

1. **Verify hooks.** Read `git config core.hooksPath`; it must be `.githooks`. When it is not, invoke `scripts/setup/install-git-hooks.ps1` once and re-read. A second failure is a dispatch refusal with code `HOOKS_NOT_INSTALLED`. The runtime never writes a hook file itself.
2. **Create branch and worktree.** Invoke `scripts/orchestration/create-worktree.ps1 -TaskId -Role -Llm [-BaseRef]`. `BaseRef` is the configured integration branch at or after the commit where the task's dependencies merged, per [INTEGRATION-STRATEGY.md](INTEGRATION-STRATEGY.md).
3. **Claim the lock.** Invoke `scripts/orchestration/claim-task.ps1 -TaskId -Role -Llm` with the working directory set to the created worktree. Record the returned `session_id` durably in the same append as `WorkspacePrepared`.

A failed claim is a **dispatch refusal, not a retry condition**. The task returns to the ready set with its lease released and its attempt unconsumed, and the scheduler may select it again later. Retrying a claim in place would produce a second claim attempt against a lock another session legitimately holds.

### `finalize`

`planFinalize` is called by the supervisor after the worker returns. `executeFinalize` is called after the intent is durable and performs validation, commit, publication, and pull-request reconciliation while the task lock remains held. `completeFinalize` is called only after `ArtifactPublished` is durable.

| | Condition |
|---|---|
| Pre, `planFinalize` | The handle is `prepared` and the worker has returned. It performs no side effect |
| Pre, `executeFinalize` | A `WorkspaceIntentReceipt` for `WorkspaceFinalizeIntended` on this `workspaceId` is presented, so `WorkspaceFinalizeIntended` is durable before any script or git command is invoked. Without it the call returns `failed` with code `INTENT_NOT_DURABLE` |
| Pre, `completeFinalize` | An `ArtifactPublicationReceipt` whose store-recorded subject matches the continuation's `workspaceId` and `publishedCommit` is presented. Without it the call returns `failed` with code `PUBLICATION_NOT_DURABLE` and invokes no release script |
| Post, `executeFinalize` `ok` | Write-scope validation passed; a commit exists; publication satisfies the task's class; a pull request exists when required; the returned `publicationEvent` and process-local continuation identify the exact workspace and commit; `lockReleased` is always `false` |
| Post, `completeFinalize` `ok` | The task lock is released by the matching session, `lockReleased` is `true`, and the returned `WorkspaceFinalized` event is ready for the supervisor to append |
| Post, `failed` | Validation failed. No commit was created, no branch was published, no pull request was touched, and the task fails with a recorded reason |
| Post, `blocked` | The remote is unreachable, credentials are absent, or pull-request creation is unauthorized. The typed class and reason are recorded, **no `ok` outcome is produced for a local-only runtime commit**, and the lock remains held |

Steps, in order:

1. **Validate the write scope.** Invoke `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` in the worktree. A non-zero exit is a task failure with a recorded reason. It never falls through to a commit.
2. **Commit.** Stage only paths inside the task's declared write scope — `git add --` with the scope patterns, never `git add -A` — and commit with an English message naming the task ID. The commit is registered in the effect ledger as `idempotent: true`, because its content is deterministic and its target ref is owned by exactly one task.
3. **Publish the branch.** Push to the configured remote with the refspec `refs/heads/<derivedBranch>:refs/heads/<derivedBranch>`. Record the pushed commit SHA as the immutable `review_ready` artifact.
4. **Create or update the pull request.** Look up an open pull request whose head is the task branch. When one exists, update it; when none exists, create one with the configured integration branch as its base. This look-up-then-create is what makes the operation idempotent and is why [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md) classifies it `idempotent: true`.
5. **Return publication while locked.** `executeFinalize` returns one `ArtifactPublished` envelope and a process-local `WorkspaceFinalizeContinuation`; it appends nothing and reports `lockReleased: false`.
6. **Persist identity.** The supervisor appends that envelope through `StateStore.append`. The specialized append receipt carries the exact `workspaceId` and `publishedCommit`.
7. **Release behind proof.** The supervisor calls `completeFinalize(continuation, receipt)`. That method verifies the proof and subject, then invokes `scripts/orchestration/release-task.ps1 -TaskId -Role -Llm`, never with `-Force`. It is the only workspace method that releases a successfully finalized task lock.
8. **Persist completion.** The supervisor appends the returned `WorkspaceFinalized` event. A crash after step 6 leaves durable publication identity and a held lock; reconciliation can safely complete steps 7 and 8.

**Publication failure is an outcome, not a fallback.** When the remote is unreachable, credentials are absent, or pull-request creation is unauthorized, `executeFinalize` returns `blocked` with the typed class and the reason. It never reports success on a local-only runtime commit, never retries into a different target, never falls back to pushing another branch, and never pushes `main`. Every non-success result reports `lockReleased: false`; `completeFinalize` is not called. A blocked publication leaves the commit durable locally, the lock held, and the workspace in `finalizing`, so a later attempt with working credentials publishes the same commit rather than producing a new one.

**The publication class decides what a blocked publication means**, and it is read from the owning task's record. Amended under TASK-024, superseding the run-global `allowLocalOnlyPublication` limit.

| `request.publicationClass` | A blocked remote produces |
|---|---|
| `runtime` | `blocked` with the typed class and reason. There is no `ok` outcome for a local-only commit, and `review_ready` stays unsatisfied |
| `bootstrap` | `publication: 'local-only'` with a required `reason`, which satisfies `review_ready` for that task only |

The superseded flag was run-global, so accepting the limitation for one bootstrap task silently accepted it for every runtime task in the same run. The class is per-task, declared in the record, and validated at admission, so the acceptance is scoped to the task that recorded it and to no other.

### `abandon`

`planAbandon` is called when a dispatch is cancelled, a lease is lost, or the run drains before the worker returned; `executeAbandon` is called after the intent is durable.

| | Condition |
|---|---|
| Pre, `planAbandon` | A handle exists in any state. It performs no side effect and produces `WorkspaceAbandonIntended` |
| Pre, `executeAbandon` | A `WorkspaceIntentReceipt` for `WorkspaceAbandonIntended` on this `workspaceId` is presented, so the abandonment intent is durable — and the workspace is in `abandoning` — before any lock release, worktree removal, or Git command. Without it the call returns `failed` with code `INTENT_NOT_DURABLE` |
| Post | The lock is released when and only when this session holds it; the worktree is removed when it holds no uncommitted change; the branch is retained whenever it holds any commit; `WorkspaceAbandoned` is durable |
| Post | Nothing is deleted that could hold unpublished work. A worktree with uncommitted changes is left in place and recorded, not removed |

Abandonment is deliberately conservative. Losing an agent's uncommitted work to an automatic cleanup is worse than leaving a directory behind for a human to inspect.

TASK-016 stated the pre-condition as "`WorkspaceAbandoned` intent is durable first", naming a **completion** event as if it were an intent, and declared no event that entered `abandoning`. Both halves are corrected: `WorkspaceAbandonIntended` is the intent and enters the state, `WorkspaceAbandoned` is the completion and leaves it.

## Repository access paths

Stated here once, normatively, because finding A-105 recorded that the component diagram claimed the workspace module reaches the repository **only** through the human-controlled scripts while this contract and the finalize sequence require direct Git operations. The contract is the following, and the diagram states the same thing.

| Path | Used for | Reimplemented? |
|---|---|---|
| The tracked PowerShell orchestration and setup scripts | Hook verification and installation, branch and worktree creation, task-lock claim, write-scope validation, task-lock release | **Never.** The module contains no lock file format, no worktree creation, no scope glob evaluation, and no hook installation |
| Direct Git commands, spawned as argument vectors | `git add --` with the declared write-scope patterns, `git commit`, and `git push` of exactly one derived refspec | Not applicable; these are ordinary Git operations that no tracked script performs on the runtime's behalf |
| The pull-request provider API | Look up an open pull request by head branch, then create or update it | Not applicable |

The distinction is the one that matters for the enforcement argument: **every operation that the human-controlled scripts define is delegated to them, and only those.** Committing and pushing a task's own branch are not among them, so the module performs them directly, under the structural prohibitions below — one push-constructing function, no ref parameter, an allow-listed environment, and no `--no-verify`. Claiming that the module never touches Git would be false, and a diagram that says so contradicts the code a reviewer will read.

### `reconcile`

Called by the recovery layer on every attach, before the recovery batch is built. See [CRASH-RECOVERY.md](CRASH-RECOVERY.md) Phase 6.

| | Condition |
|---|---|
| Pre | The writer lock is held with a strictly greater epoch; the run record is restored |
| Post | Every workspace with a durable intent and no completion record reaches exactly one of `prepared`, `finalized`, `abandoned`, or `unresolved` |
| Post | No lock was force-released; no branch was republished; no second pull request was opened |
| Post | Running it twice yields the same records and performs no second git or filesystem mutation |

Detection rules:

| Observed | Resolution |
|---|---|
| `preparing`, and the worktree, branch, and lock all exist with this run's recorded `session_id` | Adopt as `prepared` |
| `preparing`, and any of them is missing | Abandon idempotently: release the lock if this session holds it, remove the worktree if it holds no change, retain the branch if it holds a commit |
| `finalizing`, and a durable `ArtifactPublished` exists but `WorkspaceFinalized` does not | Verify the publication subject, release only the matching session lock, and append completion. Never republish or reopen |
| `finalizing`, and a commit exists but no durable `ArtifactPublished` exists | Query the remote branch and open pull request. Reconstruct and append publication identity before any lock release; complete only missing idempotent steps |
| `finalizing`, and no commit exists | Abandon idempotently |
| `abandoning` — TASK-024 | Complete the abandonment idempotently under the same rules `executeAbandon` applies: release the lock only when this session holds it, remove the worktree only when it holds no uncommitted change, retain the branch whenever it holds a commit |
| A worktree under the worktree root with no `WorkspacePrepared` in this run's journal | **Do not delete.** Record `orphan_unowned` for human attention. It may belong to a human session or to another run |
| A task lock whose `session_id` differs from this run's recorded value, or for which no session token is held | **Never force-release.** Record `lock_not_releasable` for human attention and leave the lock held |
| A workspace whose owning session is demonstrably alive | Leave untouched |

An `unresolved` outcome — an unreleasable lock, an orphaned worktree that would have to be destroyed to proceed, or a live owning session — blocks the owning task with reason `workspace_lock_not_releasable` or `workspace_unresolved`. It never resolves itself by breaking a safety rule.

## Session-token ownership

`claim-task.ps1` writes the lock to the shared Git common directory and writes an ignored session token into the claiming worktree. `release-task.ps1` refuses a release when the token is absent or does not match, unless `-Force` is passed.

The runtime's rules are narrower than the script's:

1. It records `session_id` durably at `WorkspacePrepared`, so ownership survives a crash rather than depending on a file in a worktree that may be gone.
2. It attempts a release only when the durable `session_id` equals the lock's. When they differ, it does not attempt one.
3. **It never passes `-Force`.** The release command vector is built by one function from a fixed template with no slot for a force flag, so the flag cannot be added by a caller, by configuration, or by agent output. `AGENTS.md` reserves force release for a human who has verified that the owning session and worktree are stale, and the runtime has no way to verify that.
4. When a lock cannot be released, it records `lock_not_releasable` naming the task, the lock's recorded owner, and the worktree; emits a `RunEvent` with code `WORKSPACE_LOCK_NOT_RELEASABLE`; blocks the owning task with an exit condition naming the lock; and **leaves the lock held**. Breaking it would let a second execution claim a task another session may still be editing, which is the exact condition the lock exists to prevent.

## Structural prohibitions

Each prohibition is enforced by a mechanism that makes the prohibited action unavailable, not by an instruction that it must not be taken.

| Prohibited | Structural mechanism | Asserted by |
|---|---|---|
| Pushing `main` | Exactly one function in the module constructs a push. Its refspec is `refs/heads/<derivedBranch>:refs/heads/<derivedBranch>`, `derivedBranch` comes only from the validated derivation above, and the function takes no ref parameter. No other code path may spawn `git push` | A test feeding a task record whose fields would produce another ref asserts the dispatch is refused before any process is spawned, and a test asserting every constructed push vector targets only the task branch |
| Setting `ALLOW_MAIN_PUSH` | The process runner passes an **allow-listed environment**: a fixed set of variable names, built from nothing but the run's configuration. Every other variable is stripped, so the value cannot be set by the module and cannot be inherited from the supervisor's environment either | A test asserting the constructed environment for every invocation contains no key outside the allow list |
| Bypassing the pre-push hook | `--no-verify` is not in any constructed vector, and `prepare` refuses to proceed when `core.hooksPath` is not `.githooks` | A test asserting the hook path check runs before the first script invocation, and a test asserting no vector contains the flag |
| Writing a human-controlled governance path | `finalize` stages only the task's declared write-scope patterns and runs `validate-write-scope.ps1 -IncludeWorkingTree` before committing; that script rejects every governance path independently of the runtime | A fixture run asserting the module's own committed diff contains no governance path, and a test asserting a staged governance path fails validation and produces no commit |
| Reimplementing lock, worktree, branch, or scope logic | The module contains no lock file format, no worktree creation, no scope glob evaluation, and no hook installation. Each is one process invocation of the tracked script | A review check, and a test asserting each operation produces the expected script invocation rather than a filesystem mutation |

## Script delegation

The runtime **invokes** the human-controlled PowerShell orchestration scripts and never reimplements what they do. Reimplementing lock or scope logic in TypeScript would put the enforcement mechanism inside the thing it constrains, which is the reason those files are human-controlled in the first place.

| Operation | Script | Argument vector |
|---|---|---|
| Verify or install hooks | `scripts/setup/install-git-hooks.ps1` | none |
| Create branch and worktree | `scripts/orchestration/create-worktree.ps1` | `-TaskId <id> -Role <role> -Llm <llm> [-BaseRef <ref>]` |
| Claim the lock | `scripts/orchestration/claim-task.ps1` | `-TaskId <id> -Role <role> -Llm <llm>` |
| Validate the write scope | `scripts/orchestration/validate-write-scope.ps1` | `-IncludeWorkingTree [-BaseRef <ref>]` |
| Release the lock | `scripts/orchestration/release-task.ps1` | `-TaskId <id> -Role <role> -Llm <llm>` |

Invocation rules:

1. Each is spawned with an explicit argument **vector**, never a shell command string. No value is interpolated into a string that a shell will parse.
2. Each runs with its working directory set to the task's worktree, except hook verification and worktree creation, which run in the repository root.
3. Each is spawned inside an owned process group, exactly as a provider invocation is, so a hung script cannot outlive its invocation. See [PROVIDER-ADAPTERS.md](PROVIDER-ADAPTERS.md).
4. Standard output and standard error are captured, size-bounded, and redacted before they reach a record.

### What a non-zero exit means

These scripts set `$ErrorActionPreference = 'Stop'` and throw on every failure, so a failure is a non-zero exit and the message text is diagnostic rather than structured.

**Classification is decided by a runtime-side observation of durable artifacts, never by parsing the script's message text.** Message text is not a contract: it changes, and a runtime that branched on it would silently mis-handle a failure the day a message was reworded.

| Operation | Observation after a non-zero exit | Class | Disposition |
|---|---|---|---|
| Hook verification | `core.hooksPath` still not `.githooks` | `invalid_request` | `fail` — refuse the dispatch |
| Worktree creation | Branch already exists, or worktree path already exists | `agent_reported_blocked` | `escalate` — a previous attempt left state; `reconcile` owns it |
| Worktree creation | Neither exists | `transient` | `retry` |
| Lock claim | Lock file exists and names another owner | `agent_reported_blocked` | `escalate` — dispatch refusal, task returns to the ready set |
| Lock claim | Lock file absent | `transient` | `retry` |
| Scope validation | Any non-zero exit | `invalid_request` | `fail` — a scope violation is never retried into |
| Lock release | Lock file absent | none — already released; treat as success | — |
| Lock release | Lock file present and owned by this session | `transient` | `retry` within the bound, then `lock_not_releasable` |
| Lock release | Lock file present and owned by another session | `agent_reported_blocked` | `escalate` — never force |
| Any | An observation not in this table | `unknown` | `fail` |

`unknown` mapping to `fail` is the same safety rule the provider taxonomy uses: retrying an operation of unknown character is the one outcome that can cause real duplication.

A script that exits non-zero for a reason the runtime cannot observe leaves the workspace in its intent state, which `reconcile` resolves on the next attach. The runtime never assumes a script partially succeeded.

## Test obligations

TASK-017 owns these; TASK-009, TASK-010, and TASK-011 validate them.

**Protocol completeness**

1. A dispatched task runs on the derived branch, in a worktree created for it, with hooks verified beforehand.
2. The lock is claimed before the worker is invoked and released on every terminal path, including success, failure, timeout, and cancellation.
3. Scope validation runs after the worker returns and before any commit; a failure produces a recorded task failure and no commit.
4. The handoff is durable before the lock is released; a crash between them leaves it readable.
5. No dispatch path reaches provider invocation without a prepared workspace. Stub `executePrepare` to return each failed and blocked result and assert the supervisor constructs no `WorkspaceRef`, `AgentInvocation`, or `WorkAssignment`, and calls none of `planInvocation`, `beginInvocation`, or `completeInvocation`. This assertion belongs here, at the upstream boundary that can receive an unprepared outcome; `WorkspaceRef.prepared` is the literal `true`, so an unprepared worker assignment is deliberately unrepresentable.

**Publication and pull-request identity**

6. `executeFinalize` publishes the branch while retaining the lock; `completeFinalize` refuses until the exact `ArtifactPublished` subject is durable and then releases the lock.
7. Finalize run twice, and after simulated crashes before and after the publication append, yields exactly one pull request per task and branch, one publication identity per commit, and one successful lock release.
8. A later `finalize` publishes a new commit SHA, updates the same pull request, records both SHAs in order, and never opens a second one.
9. With the remote unreachable, credentials absent, or pull-request creation unauthorized, `executeFinalize` returns `blocked` with a typed class for a `runtime` task and records `publication: 'local-only'` with a reason for a `bootstrap` task; no `ok` outcome is produced for a local-only commit on a `runtime` task and no alternative push target is attempted.
10. A crash after the publication append and before `completeFinalize` leaves branch, commit, and pull-request identity readable by `reconcile`, which neither republishes nor reopens and releases only the matching session lock.

**Durable intent before every side effect — added under TASK-024**

21. Each of `executePrepare`, `executeFinalize`, and `executeAbandon` called without a matching verified intent receipt returns `failed` with code `INTENT_NOT_DURABLE`, spawns no process, and performs no Git or filesystem mutation. `completeFinalize` called without a matching verified publication receipt returns `PUBLICATION_NOT_DURABLE` and does not invoke the release script.
26. `executeFinalize` reports `lockReleased: false` for every union member. Only a successful `completeFinalize` reports `true`; its proof subject must match both `workspaceId` and `publishedCommit`.
22. For each of the three operations, a crash injected at every step of the execute phase leaves a durable intent event, and `reconcile` reaches exactly one of `prepared`, `finalized`, `abandoned`, or `unresolved` from it. No injected crash point leaves a branch, worktree, lock, commit, or publication side effect with no durable intent.
23. `planPrepare`, `planFinalize`, and `planAbandon` spawn no process and perform no filesystem or Git mutation, for both accepting and refusing inputs.
24. `WorkspaceAbandonIntended` moves the workspace to `abandoning`, and a record in `abandoning` with no `WorkspaceAbandoned` is resolved by `reconcile` idempotently.
25. A `runtime` task with an unreachable remote produces `blocked` and an unsatisfied `review_ready`; a `bootstrap` task with the same remote produces `local-only` with a reason and a satisfied `review_ready`; and no run-level setting changes either answer.

**Crash safety**

11. `reconcile` after a simulated abrupt termination detects an orphaned worktree, an orphaned branch, and a lock held by a dead session, and returns each to a known state, against a real temporary repository.
12. Every operation records an intent before it acts and a completion after it succeeds, so replaying `reconcile` twice equals replaying it once.
13. A workspace whose owning session is alive is left untouched.
14. A lock held by a live session is never force-released; the case is recorded for human attention.

**Safety boundaries**

15. Every constructed push vector targets only `refs/heads/agent/<llm>/<role>/<task-id>`; a record whose fields would produce another ref is refused before any process is spawned.
16. No constructed environment contains `ALLOW_MAIN_PUSH` or any key outside the allow list; no constructed vector contains `--no-verify` or `-Force`.
17. The module's own committed diff in a fixture run contains no human-controlled governance path.
18. Hostile agent output containing a path traversal sequence and a shell metacharacter reaches neither a command vector nor a filesystem path.

**Failure classification**

19. Every non-zero script exit maps to exactly one class through a durable-artifact observation, and an unrecognized observation maps to `unknown` with disposition `fail`.
20. Tests run against a real temporary Git repository with an injected process runner and a fake clock, and make no network call.
