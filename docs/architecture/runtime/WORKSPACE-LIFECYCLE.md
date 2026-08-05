# Agent Workspace Lifecycle

Normative workspace contract for the autonomous runtime. Produced under TASK-016. Related decision: [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md). Implemented by TASK-017.

## Why this module exists

`AGENTS.md` makes one protocol mandatory for every agent task: verified repository hooks, one isolated worktree, one branch named `agent/<llm>/<role>/<task-id>`, one atomic task lock claimed before editing, write-scope validation before handoff, a published branch and a pull request, a durable handoff, and lock release afterward.

The TASK-002 architecture assumed the result of that protocol without assigning it. `AgentInvocation` carries a `worktreePath` and a `branch`, and [LIFECYCLE-AND-BOOTSTRAP.md](LIFECYCLE-AND-BOOTSTRAP.md) recorded that "the runtime resolves it at dispatch" — but none of the six modules created the worktree, created the branch, installed the hooks, claimed the lock, validated the scope, published the branch, persisted the handoff, or released the lock. A supervisor built on that architecture has exactly two options at every dispatch, and both defeat the objective: stop and wait for a human, or run every agent in one shared checkout, which is the failure the protocol exists to prevent.

This module owns the protocol. It is the seventh module in the map, its source path is `src/orchestrator/workspace/`, and TASK-017 is its sole owner.

## Boundaries

**It owns:** workspace preparation, finalization, abandonment, and reconciliation; the derivation and validation of branch and worktree identity; invocation of the human-controlled orchestration scripts; publication and pull-request identity; and the classification of every workspace failure.

**It does not own:** provider invocation, scheduling policy, state-store internals, retry policy, lifecycle command handling, or any change to the scripts it drives. It proposes events; it never appends them itself, because only the supervisor's append path mutates durable state.

**Consumers:** the supervisor (TASK-006) calls `prepare` and `finalize` around a dispatch; the recovery layer (TASK-008) calls `reconcile` on attach. Both receive the module by constructor injection through the `WorkspaceLifecycle` interface declared in `state/contracts`.

**Imports:** `state/contracts` and nothing else. The module needs the provider failure taxonomy in order to classify, and takes it through `WorkspaceFailureClass`, a structurally identical re-declaration of `FailureClass` in `state/contracts`, exactly as `agents/contracts` re-declares six primitives from `state/contracts` under the same rationale. See [COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md) and [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md).

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

Every state transition follows an intent-then-commit pair, mirroring the effect ledger: an intent event is durable before the operation is attempted, and a completion event is durable after it succeeds. That is what makes every workspace operation replayable and no operation applied twice.

## Operations

### `prepare`

Called by the supervisor after the lease is granted and before the worker is invoked.

| | Condition |
|---|---|
| Pre | The task holds a valid lease; the derived branch and worktree pass validation; no workspace for this task is in `preparing`, `finalizing`, or `unresolved` |
| Pre | `WorkspacePrepareIntended` is durable before any script is invoked |
| Post, `ok` | Repository hooks are verified installed; the worktree exists at the derived path; the branch exists and matches the derived name; the task lock is held and its `session_id` is recorded durably; `WorkspacePrepared` is durable; the returned handle is `prepared` |
| Post, `blocked` | No worktree, branch, or lock was left in an indeterminate state that `reconcile` cannot resolve; the typed failure class and reason are recorded |
| Post, always | No provider process has been spawned. A dispatch cannot reach provider invocation without a `prepared` handle, and `DispatchStarted` is an illegal transition without one |

Steps, in order, each delegating to the script named:

1. **Verify hooks.** Read `git config core.hooksPath`; it must be `.githooks`. When it is not, invoke `scripts/setup/install-git-hooks.ps1` once and re-read. A second failure is a dispatch refusal with code `HOOKS_NOT_INSTALLED`. The runtime never writes a hook file itself.
2. **Create branch and worktree.** Invoke `scripts/orchestration/create-worktree.ps1 -TaskId -Role -Llm [-BaseRef]`. `BaseRef` is the configured integration branch at or after the commit where the task's dependencies merged, per [INTEGRATION-STRATEGY.md](INTEGRATION-STRATEGY.md).
3. **Claim the lock.** Invoke `scripts/orchestration/claim-task.ps1 -TaskId -Role -Llm` with the working directory set to the created worktree. Record the returned `session_id` durably in the same append as `WorkspacePrepared`.

A failed claim is a **dispatch refusal, not a retry condition**. The task returns to the ready set with its lease released and its attempt unconsumed, and the scheduler may select it again later. Retrying a claim in place would produce a second claim attempt against a lock another session legitimately holds.

### `finalize`

Called by the supervisor after the worker returns and before the lease is released.

| | Condition |
|---|---|
| Pre | The handle is `prepared`; the worker has returned; `WorkspaceFinalizeIntended` is durable before any script or git command is invoked |
| Post, `ok` | Write-scope validation passed; a commit exists on the task branch; the branch is published to the configured remote; a pull request exists for it, created or updated but never duplicated; branch, commit, and pull-request identity are one durable record written **before** the lock is released; the lock is released; `WorkspaceFinalized` is durable |
| Post, `failed` | Validation failed. No commit was created, no branch was published, no pull request was touched, and the task fails with a recorded reason |
| Post, `blocked` | The remote is unreachable, credentials are absent, or pull-request creation is unauthorized. The typed class and reason are recorded, and **no `ok` outcome is produced for a local-only commit** |

Steps, in order:

1. **Validate the write scope.** Invoke `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` in the worktree. A non-zero exit is a task failure with a recorded reason. It never falls through to a commit.
2. **Commit.** Stage only paths inside the task's declared write scope — `git add --` with the scope patterns, never `git add -A` — and commit with an English message naming the task ID. The commit is registered in the effect ledger as `idempotent: true`, because its content is deterministic and its target ref is owned by exactly one task.
3. **Publish the branch.** Push to the configured remote with the refspec `refs/heads/<derivedBranch>:refs/heads/<derivedBranch>`. Record the pushed commit SHA as the immutable `review_ready` artifact.
4. **Create or update the pull request.** Look up an open pull request whose head is the task branch. When one exists, update it; when none exists, create one with the configured integration branch as its base. This look-up-then-create is what makes the operation idempotent and is why [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md) classifies it `idempotent: true`.
5. **Persist identity.** Write branch, commit SHA, and pull-request identity as one `ArtifactPublished` record through the state store, **before** step 6. A crash between them leaves the handoff readable and the lock held, which `reconcile` can resolve; the reverse order would leave a released lock and no record of what was published.
6. **Release the lock.** Invoke `scripts/orchestration/release-task.ps1 -TaskId -Role -Llm`, never with `-Force`.

**Publication failure is an outcome, not a fallback.** When the remote is unreachable, credentials are absent, or pull-request creation is unauthorized, `finalize` returns `blocked` with the typed class and the reason. It never reports success on a local-only commit, never retries into a different target, never falls back to pushing another branch, and never pushes `main`. A `blocked` publication leaves the commit durable locally and the workspace in `finalizing`, so a later attempt with working credentials publishes the same commit rather than producing a new one.

`allowLocalOnlyPublication` is the one recorded exception. It is a run limit defaulting to `false`; when an operator sets it true, a `blocked` publication is recorded as `publication: 'local-only'` with its reason and satisfies `review_ready`. That is an operator-recorded acceptance of a bootstrap-phase limitation, matching how the human-launched sessions that built this runtime were obliged to record theirs. It is never a default and never inferred.

### `abandon`

Called when a dispatch is cancelled, a lease is lost, or the run drains before the worker returned.

| | Condition |
|---|---|
| Pre | A handle exists in any state; `WorkspaceAbandoned` intent is durable first |
| Post | The lock is released when and only when this session holds it; the worktree is removed when it holds no uncommitted change; the branch is retained whenever it holds any commit; `WorkspaceAbandoned` is durable |
| Post | Nothing is deleted that could hold unpublished work. A worktree with uncommitted changes is left in place and recorded, not removed |

Abandonment is deliberately conservative. Losing an agent's uncommitted work to an automatic cleanup is worse than leaving a directory behind for a human to inspect.

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
| `finalizing`, and a commit exists on the branch | Read what happened: query the remote for the branch, query for an open pull request with that head. Record whatever exists. Complete the missing steps only; never republish an already-published commit and never open a second pull request |
| `finalizing`, and no commit exists | Abandon idempotently |
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
5. No dispatch path reaches provider invocation without a prepared workspace, asserted with `prepare` stubbed to fail.

**Publication and pull-request identity**

6. `finalize` publishes the branch and records commit, branch, and pull-request identity as one durable record written before lock release.
7. `finalize` run twice, and after a simulated crash between publication and lock release, yields exactly one pull request per task and branch.
8. A later `finalize` publishes a new commit SHA, updates the same pull request, records both SHAs in order, and never opens a second one.
9. With the remote unreachable, credentials absent, or pull-request creation unauthorized, `finalize` returns `blocked` with a typed class; no `ok` outcome is produced for a local-only commit and no alternative push target is attempted.
10. A crash after publication and before lock release leaves branch, commit, and pull-request identity readable by `reconcile`, which neither republishes nor reopens.

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
