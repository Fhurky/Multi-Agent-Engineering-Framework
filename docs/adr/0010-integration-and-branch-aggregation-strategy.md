# ADR-0010: Integration and branch aggregation strategy for the runtime task graph

- Status: Accepted; superseded in part by [ADR-0016](0016-integration-branch-and-typed-merge-order.md) and [ADR-0041](0041-cumulative-architecture-lineage-integration-unit.md), which narrows squash-per-task for a cumulative amendment lineage only
- Date: 2026-08-04
- Deciders: Solution Architect under TASK-002
- Affects: TASK-003 … TASK-008; routing implications for the Orchestrator
- Superseded in part: "every task branches from `main`", the rejection of a long-lived integration branch, the merge-to-`main` integration order, and the Wave 2 through Wave 5 numbering are replaced by ADR-0016, which adopts `integration/autonomous-runtime` as the committed task graph defines it. Squash-per-task, contract change control, and the rejection of branching from a sibling all stand. The toolchain ownership gap this record routed to the Orchestrator was resolved by human decision HUMAN-001 at commit `fb9f45c`; TASK-018 owns it.

## Context

Six implementation tasks build one runtime across four waves, each in an isolated worktree on its own `agent/claude/runtime/task-00N` branch, each with its own review, security, and QA gates. Direct pushes to `main` are blocked and every branch integrates by pull request.

The write-scope partition means no two branches touch the same file, so textual merge conflicts are structurally impossible. The real risk is **semantic drift**: two branches that each compile can still disagree about a contract, and that disagreement surfaces only at integration, after several tasks have already built on it.

There is also an unowned surface. The runtime needs `package.json`, `tsconfig.json`, and a test runner configuration, and no task in the TASK-001 graph has those paths in its write scope.

## Decision

**Every task branches from `main`**, never from a sibling, and only at or after the commit where its declared dependencies merged. Wave 3 worktrees are created after TASK-003 lands, Wave 4 after TASK-005, Wave 5 after TASK-006.

**Integration follows wave order**, because dependency edges are compile-time edges. Within a wave, the two parallel tasks merge in either order with no coordination.

**Squash merge, one commit per task on `main`**, prefixed `feat:` and naming the task ID, so `main` is bisectable at task granularity and TASK-013 can name one commit per finding.

**No long-lived integration branch.** The fallback, if `main` must stay releasable while the runtime lands, is to cut `release/*` from the last pre-runtime commit rather than to hold the runtime on a side branch.

**Contract change control is the drift control.** During Waves 2 through 5, no implementation task may change any type, signature, field name, or string-literal union defined in [INTERFACE-CONTRACTS.md](../architecture/runtime/INTERFACE-CONTRACTS.md), even inside its own write scope. A task that believes a contract is wrong stops at the boundary, records the partial result, and hands off to the Orchestrator, which routes an amendment to the architect in a separate execution context; the amendment is then re-routed as a remediation task to every merged consumer.

This rule matters because the contract roots live inside TASK-003's and TASK-004's write scopes, so those two tasks physically *can* change them. Unilateral change would leave downstream branches compiled against a different shape, and the drift would surface four tasks later. The rule converts a silent integration failure into an explicit handoff.

**Toolchain ownership is routed to the Orchestrator, not resolved here.** The recommendation is one small **devops**-owned task, scoped to the root toolchain manifests and `scripts/quality/**`, sequenced between TASK-002's review gate and the creation of the Wave 2 worktrees. The parameters it must satisfy are in [ADR-0001](0001-runtime-platform-and-language.md).

## Alternatives considered

**A long-lived `integration/runtime` branch.** Keeps `main` untouched until the runtime is whole. Rejected: it adds a second merge per task, delays every review and security gate behind an extra hop, and provides no protection that per-wave merges into `main` with required CI checks do not already provide. It would also make TASK-013's remediation routing name integration-branch commits that never appear on `main`.

**Branch each task from its dependency's branch.** Removes the wait for a dependency to merge and would let Wave 3 start earlier. Rejected: it inherits unreviewed work, so a finding against TASK-003 would already be built upon by TASK-005 before TASK-003's review gate ran, which makes the gate advisory rather than blocking.

**Merge commits instead of squash.** Preserves each task's internal history. Rejected: `main` would carry dozens of agent commits per task and remediation routing would have to name ranges rather than commits. Task-level granularity is the unit the whole graph is organized around.

**Extend TASK-003's write scope to cover the root manifests.** Solves the toolchain gap with no new task. Rejected: it gives one implementation task authority over a repository-wide surface, couples every later task to TASK-003's toolchain choices without a separate review, and puts CI configuration behind a review gate scoped to a state store.

**Let each task vendor its own minimal toolchain inside its scope.** Rejected: six incompatible configurations, and nothing would compile as a whole.

**Allow contract changes inside the owning task's scope.** The natural reading of "one owner per module". Rejected for the reason above: ownership of the file is not ownership of the agreement it encodes, and five other tasks are counting on that agreement.

## Consequences

Positive:

- Textual conflicts are impossible by construction, and semantic drift has one explicit control with one escalation path.
- Every task lands on `main` only after its own review, security, and QA gates, so no task builds on unreviewed work.
- `main` stays bisectable at task granularity, which is what TASK-013's findings routing needs.
- The toolchain gap is surfaced before Wave 2 rather than discovered by the first agent whose scope validation fails.

Negative:

- Wave boundaries are hard synchronization points. A delayed review on TASK-003 blocks TASK-005, which blocks TASK-006, which blocks two more tasks. Total wall-clock time is dominated by review latency, not by implementation.
- The contract-change procedure is expensive: an amendment costs an architect task plus a remediation task per merged consumer. That cost is the point — it is what makes contract quality worth investing in during TASK-002 — but a contract error found in Wave 5 is genuinely costly.
- Squash merging discards each task's intermediate commits, so the detail of how an agent reached its result lives only in the pull request.
- The strategy depends on an Orchestrator routing decision (the toolchain task) that TASK-002 cannot make, so Wave 2 cannot start on this ADR alone.
