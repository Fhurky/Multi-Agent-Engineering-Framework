# ADR-0027: Workspace finalize is split around the publication append

- Status: Accepted
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-028
- Affects: TASK-017 implements the three-phase finalize; TASK-006 drives it and appends between the phases; TASK-003 declares the contract and issues the publication receipt; TASK-008 reconciles a workspace interrupted between the phases
- Supersedes in part: [ADR-0019](0019-durable-intent-receipts-for-side-effects.md) — one clause: its finalize shape, in which `executeFinalize` was a single call whose successful result reported `lockReleased: true`. The publication append that must precede the lock release had no seam to occur in, so the ordering the workspace contract requires could not be implemented through the interface that was supposed to enforce it. ADR-0019's other decisions stand unchanged: the plan/execute split for prepare and abandon, the three-phase worker handshake, the receipt-as-evidence rule, `WorkspaceAbandonIntended` entering `abandoning`, and the rule that the module appends nothing.

## Context

Finding **A-205** in `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md`, rated High, recorded that workspace finalize cannot durably record publication identity before releasing the task lock.

The workspace contract at `docs/architecture/runtime/WORKSPACE-LIFECYCLE.md:118-135` orders finalize as six steps, of which step 5 persists branch, commit, and pull-request identity as one `ArtifactPublished` record **through the state store**, and step 6 releases the lock. `AGENTS.md` requires the same order, and the reason is stated there and here: a crash between the two must leave the handoff readable and the lock held, because the reverse leaves a released lock and no record of what was published.

The interface at `docs/architecture/runtime/INTERFACE-CONTRACTS.md:1719-1729` and `:1799-1830` cannot express it. `executeFinalize` is one call. Its `ok` result declares `lockReleased: true`, so the lock is already gone when it returns. The module is forbidden to append — that is ADR-0019's rule and it is the right rule — so `ArtifactPublished` can only be persisted by the supervisor **after** `executeFinalize` returns, which is after the lock was released. Sequence 7 in `diagrams/architecture/runtime-sequences.md:288-316` drew the correct order, with the module releasing the lock after a supervisor append, and the interface had no continuation or completion method through which that second half could happen.

The result is that a required invariant was asserted beside an interface that made its violation the only implementable behavior. That is the same shape as A-102 and A-103 — a document requiring an ordering that the seam does not exist for — at a third boundary.

## Decision

**Finalize is three phases, and the publication append is between the second and the third.**

```text
1. supervisor:  plan = ws.planFinalize(handle, request)          pure; no script, no git
2. supervisor:  append(plan.intentEvent)                         WorkspaceFinalizeIntended, durable
3. supervisor:  receipt = the append path's WorkspaceIntentReceipt
4. supervisor:  published = await ws.executeFinalize(plan, receipt)
                validate scope, commit, push, look-up-then-create-or-update the PR.
                THE LOCK IS STILL HELD. published.lockReleased is false, always.
5. supervisor:  append(published.publicationEvent)               ArtifactPublished, durable
6. supervisor:  pubReceipt = the append path's ArtifactPublicationReceipt
7. supervisor:  done = await ws.completeFinalize(published.continuation, pubReceipt)
                release-task.ps1, never -Force. done.lockReleased is true.
8. supervisor:  append(done.completionEvent)                     WorkspaceFinalized, durable
```

**`completeFinalize` is the only method in the module that releases a task lock, and it is not callable without an `ArtifactPublicationReceipt`.** The receipt is issued by `StateStore.append` and by nothing else, only after the batch commit record naming `ArtifactPublished` is durable, and it carries the `workspaceId` and the `publishedCommit` it attests. There is no overload without it and no other method that releases. The publication-before-unlock invariant is therefore a signature, exactly as ADR-0019 made the intent-before-side-effect invariant a signature.

**`WorkspaceFinalizePublishResult` reports `lockReleased: false` unconditionally**, including on `blocked` and `failed`. The type makes the intermediate state legible: after step 4 the commit exists, the branch may be published, and the lock is held. That is the state `reconcile` already knows how to resolve, and it is the state the contract always described.

**A `blocked` or `failed` publication does not reach `completeFinalize`.** When step 4 returns a non-`ok` outcome, the supervisor appends the outcome's events and the workspace stays in `finalizing` with the lock held. There is no path that releases a lock without a durable publication record, because the only method that releases requires a receipt for one.

**`reconcile` is unchanged in substance and gains one case it can now distinguish.** A workspace in `finalizing` with a commit on the branch and a durable `ArtifactPublished` was interrupted between steps 6 and 8; `reconcile` completes the release under the same session-token rules and never force-releases. A workspace in `finalizing` with a commit and **no** durable `ArtifactPublished` was interrupted at or before step 5; `reconcile` reads what the remote holds and completes the missing steps only, exactly as ADR-0011 decided.

## Alternatives considered

**Give the workspace module a callback it may invoke to append `ArtifactPublished` mid-call.** One method, correct order, no continuation type. Rejected: a callback that appends is an append capability with a different name. It would give TASK-017 a path to durable state, which is the rule ADR-0019 and [COMPONENT-BOUNDARIES.md](../architecture/runtime/COMPONENT-BOUNDARIES.md) both rest on, and it would put the single-writer property behind a convention about how the callback is used. The finding asked for a contract that "preserves single-writer ownership"; a callback does not.

**Have `executeFinalize` return before publishing and let the supervisor push.** Then the supervisor holds the publication and the ordering is trivially its own. Rejected: it moves `git push` and the pull-request API into TASK-006, which puts the repository-writing operations outside the only module that is allowed to write the repository and outside the structural prohibitions — the single push-constructing function, the allow-listed environment, the absent `--no-verify` — that make pushing `main` unavailable rather than forbidden. The prohibitions are worth more than the simplification.

**Keep one call and assert the ordering in tests only.** Cheapest. Rejected: it is what the reviewed commit did. A-205 exists because an asserted ordering that the interface cannot produce is not an ordering, and a test can only assert what the implementation can do.

**Release the lock inside `executeFinalize` but make `ArtifactPublished` durable first by having the module append it through an injected `StateStore`.** It is the most direct reading of "the module must persist it first". Rejected for the same reason as the callback, and additionally because it would make the workspace module a second writer of run state, which breaks the single-authority rule that recovery's determinism depends on.

**Split into two phases rather than three, folding the intent append into `planFinalize`.** Fewer methods. Rejected: it would undo ADR-0019's correction for finalize alone, leaving prepare and abandon on a different shape. One mechanism at three boundaries is the property the split-phase protocol has; two mechanisms is not.

## Consequences

Positive:

- The publication-before-unlock invariant is implementable through the documented interface, and unimplementable to violate: the release method does not exist without proof of the publication.
- The intermediate state — committed, published, lock held — has a type, so the crash window between publication and release is a documented state rather than an inferred one, and `reconcile` can tell the two interruption points apart from the journal alone.
- `AGENTS.md`'s ordering requirement and the runtime's interface now say the same thing, so a reviewer checking the handoff protocol against the code is checking one claim rather than reconciling two.
- Both affected sequences — dispatch and finalize — are redrawn against an interface that can perform every step they show.

Negative:

- The workspace interface grows from six methods to seven, and finalize is the only operation with three phases where prepare and abandon have two. The asymmetry is real and is a consequence of finalize being the only operation whose side effect produces an identity another module must make durable before the operation completes.
- The supervisor's finalize path now performs two appends and two module calls where it performed one of each, so there are two more crash points to test. Each of them leaves a state `reconcile` resolves, which is the point, but the matrix is larger.
- A continuation object crosses the boundary between step 4 and step 7 and must survive nothing worse than a process-local await. It is not durable, and it does not need to be — a crash before step 7 leaves the workspace in `finalizing` with a durable publication, which `reconcile` completes — but an implementer might reasonably expect it to be, and the contract says explicitly that it is not.
