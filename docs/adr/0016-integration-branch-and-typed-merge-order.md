# ADR-0016: Integration branch and typed merge order

- Status: Accepted; superseded in part by [ADR-0021](0021-durable-ingress-module-and-the-eight-module-map.md), which moves TASK-005 through TASK-008 one wave later after inserting TASK-026 at Wave 4, by [ADR-0041](0041-cumulative-architecture-lineage-integration-unit.md), which replaces per-task squash and merge-order semantics only for a cumulative amendment lineage, and by proposed [ADR-0042](0042-conditionally-authorized-post-gate-merge-executors.md) as corrected by [ADR-0043](0043-exact-merge-admission-policy-attestation-and-published-head-evidence.md), which replaces operator execution with two conditional executors under exact gate/policy admission. The integration branch, ordinary-task squash method, typed order, and contract change control procedure stand.
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-016
- Affects: every task that publishes a branch; the Orchestrator's routing; TASK-017's pull-request base
- Supersedes in part: [ADR-0010](0010-integration-and-branch-aggregation-strategy.md) — its "every task branches from `main`" rule, its "no long-lived integration branch" decision, and its merge-to-`main` integration order. ADR-0010's squash-per-task rule, its contract change control, and its rejection of branching from a sibling all stand.

## Context

ADR-0010 decided that every task branches from `main`, merges into `main` after its gates, and that no long-lived integration branch would exist. `tasks/TASK-001-DEPENDENCY-GRAPH.md` revision 3 defines `integrated` as a merge into `integration/autonomous-runtime`, states that every task branches from the integration branch, and records the branch as existing. The branch exists on the remote and in this clone.

That is a direct contradiction between the normative architecture and the committed task graph, and it is not cosmetic: `integrated` is one of the six typed edges the scheduler evaluates, and its satisfying condition names a specific branch. A runtime built on ADR-0010 would evaluate `integrated` against `main`, and the Orchestrator would be recording merges into a branch the runtime does not read.

Finding A-004 requires this document set to be reconciled with the graph's vocabulary. Reconciling the vocabulary while leaving the branch topology contradictory would resolve half a contradiction.

The three grounds on which ADR-0010 rejected an integration branch also deserve re-examination on their merits rather than being overridden by fiat, because two of them rested on a scheduling model that finding A-004 has since replaced.

## Decision

**`integration/autonomous-runtime` is the runtime's integration branch.** Every task branches from it, at or after the commit where its declared dependencies reached `integrated`, and merges back into it by pull request. `main` receives the runtime as one human-reviewed pull request when the work is whole.

**`integrated(X)` is satisfied by a merge into that branch**, together with `review_ready(X)` and the closure of every gate in X's `pre_merge_gates`.

**The merge order is the committed wave order**, with nine steps: TASK-016 and TASK-002 at Wave 0, TASK-018 at Wave 2, TASK-003 and TASK-004 at Wave 3, TASK-005 and TASK-017 at Wave 4, TASK-006 at Wave 5, TASK-007 and TASK-008 at Wave 6, and the integration branch into `main` last. TASK-017 is at Wave 4, paired with TASK-005; their scopes are disjoint and neither imports the other.

**Only TASK-016, TASK-002, and TASK-018 have a non-empty `pre_merge_gates`**, each `review`. Every other gate is an assembly gate that runs after merge and blocks only `done`.

**No agent pushes to or merges into `main`.** The tracked pre-push hook blocks the push, and the runtime's workspace module has no code path that can construct a push to any ref but its own task branch ([ADR-0011](0011-agent-workspace-lifecycle-module.md)).

**Contract immutability applies during Waves 3 through 6**, matching the committed wave numbering. ADR-0010 said Waves 2 through 5, which referred to a wave assignment that no longer exists.

**Squash-merge per task stands.** One commit per task on the integration branch keeps it bisectable at task granularity and lets TASK-013 name one commit per finding, which was ADR-0010's reasoning and is unaffected.

## Alternatives considered

**Keep merging to `main` and ask the Orchestrator to change the graph.** The architecture would stay as ADR-0010 wrote it. Rejected: the graph is committed, revision 3 was produced to remediate two review rounds, and the integration branch is already the recorded reality of this repository. Changing it would require re-deriving `integrated` across twenty task records to restore a decision whose own grounds no longer hold. It would also be the architect deciding a routing question the Orchestrator owns.

**Re-examining ADR-0010's three objections on their merits:**

| Objection | Assessment |
|---|---|
| "It adds a second merge for every task" | Inaccurate under this model. Each task merges once, into the integration branch. There is one additional merge for the whole runtime, not one per task |
| "It delays every review and security gate behind an extra hop" | Reversed by the typed-edge model. Gates are scheduled on `review_ready`, satisfied by a published commit on an unmerged branch. No gate waits on any merge, so the hop delays nothing. This objection was correct under the superseded model in which readiness meant merged, which is the same conflation finding F-101 recorded |
| "It provides no protection that per-wave merges into `main` with required CI checks do not already provide" | It provides one the earlier model could not. TASK-018's security gate is retrospective by recorded acceptance and runs at Wave 7. Under per-wave merges, `main` would carry a toolchain that no security gate had assessed for five waves. With an integration branch, `main` is never in that state |

**Adopt the integration branch but keep `main` as the base for pull requests.** It would make each task's pull request visible against the release branch. Rejected: a pull request whose base is `main` invites a merge to `main`, and the whole point is that no agent-authored branch reaches `main` except through the single integrated pull request. The base is the integration branch, and the workspace contract derives it from configuration rather than from agent output.

**Cut `release/*` from the last pre-runtime commit instead**, which was ADR-0010's own stated fallback for keeping `main` releasable. Rejected: it inverts the burden. The runtime would still land on `main` incrementally and the release branch would freeze an old state, so the protection applies to the release rather than to the integration. The integration branch protects the thing actually at risk.

**Merge commits instead of squash**, revisited since an integration branch makes history cheaper. Rejected for the reason ADR-0010 gave, which is unaffected: the integration branch would carry dozens of agent commits per task, and remediation routing would name ranges rather than commits. Task-level granularity is the unit the whole graph is organized around.

## Consequences

Positive:

- The architecture and the committed task graph agree on what `integrated` means, so the scheduler's edge evaluation and the Orchestrator's records refer to the same branch.
- `main` never holds a partially assembled runtime, and never holds a toolchain whose security gate has not yet run.
- The final integration is one human-reviewed pull request rather than a stream of agent merges into the default branch.
- TASK-017 has a defined pull-request base, which is what makes its idempotent pull-request contract implementable.

Negative:

- One more branch to keep current. A task whose dependencies merged after its worktree was created must rebase or merge from the integration branch, in its own worktree, by its own owner.
- The integration branch can drift from `main` if a human commit lands on `main` during the runtime's construction. HUMAN-001 at `fb9f45c` is exactly that case; it was merged forward, and the same must be done for any future one.
- A defect that reaches the integration branch is visible to every subsequent task before it is visible on `main`, so a bad merge affects more in-flight work than it would have under per-wave merges to `main`. The per-task review gate before each merge is the control.
- This is the second reversal of a TASK-002 decision in one amendment. That is a signal worth recording rather than hiding: the TASK-002 decisions were made before the task graph was corrected, and two of them encoded the pre-correction model. Both reversals are explicit, and neither edits the original record.
