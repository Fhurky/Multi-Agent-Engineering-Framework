# HUMAN-004: Autonomous Merge Authority

- Decision ID: `HUMAN-004`
- Status: approved
- Decision date: 2026-08-06
- Decision owner: repository owner
- Applies to: routine pull-request integration and release-branch promotion

## Decision

Routine GitHub merging must require zero human intervention after this decision is implemented and validated. The repository owner authorizes two narrowly scoped automation components:

1. A runtime-owned post-gate integration executor may squash-merge an approved task pull request into the configured integration branch, currently `integration/autonomous-runtime`.
2. A DevOps-owned release merge executor may merge the approved integration pull request into `main` after every declared aggregate gate and release-readiness check passes.

This authority is conditional. It becomes operational only after the architecture amendment is independently approved, the implementation is independently reviewed and security-validated, the required GitHub controls are configured, and the automated checks demonstrate that the executors cannot bypass their admission predicates.

## Required normal flow

For task branches, the runtime-owned executor must:

1. Read the authoritative task record and immutable publication facts.
2. Confirm that every declared pre-merge gate is closed with an authoritative passing verdict.
3. Confirm that no unresolved blocking High or Critical security finding applies to the target.
4. Confirm the target branch, base branch, head commit, integration order, and merge method exactly match the approved contracts.
5. Persist merge intent before performing the external side effect.
6. Squash-merge the pull request through the GitHub API without bypassing branch protection.
7. Verify the resulting tree and record the durable `branch_integrated` ingress fact.
8. Let the ordinary scheduler advance lifecycle state and dispatch newly ready work.

For the integration-to-`main` promotion, the DevOps-owned executor must apply the same fail-closed pattern and additionally confirm all aggregate review, security, QA, performance, documentation, deployment, and rollback requirements declared for the release are complete.

## Conflict and failure handling

A merge conflict, stale head, missing check, ambiguous state, API failure, or unverifiable result must not create a routine human merge request. The executor must fail closed, preserve evidence, and route a remediation task to the responsible agent role. It may retry only according to the approved bounded retry policy. It must never guess, force a merge, or silently discard a conflicting change.

## Residual human exception set

Routine merges are not human exceptions. Human intervention is reserved for this finite set:

- Formal acceptance of an unresolved blocking High or Critical security risk.
- Authorization of an irreversible production action when deployment policy explicitly requires it. A merge to `main` is not itself such an action unless a later approved policy deliberately couples it to an irreversible production change.
- Granting, rotating, or revoking credentials and changing repository governance, branch-protection, or authorization policy. These are control-plane authority changes, not ordinary project execution.

When a case cannot be classified conclusively as outside this set, automation must refuse it and emit a typed exception record. It must not broaden its own authority.

## Prohibited capabilities

Neither executor may:

- Author, approve, close, override, or formally accept a gate on work it merges.
- Merge a pull request whose declared pre-merge gates are open or failing.
- Push directly to `main` or set `ALLOW_MAIN_PUSH`.
- Force-push, bypass hooks or branch protection, use an administrator override, or disable a required check.
- Merge governance or enforcement changes under its own authority.
- Release another execution's lock or modify task ownership to make a merge admissible.
- Use a mutable branch head where the contract requires an immutable commit.
- Treat a missing, skipped, timed-out, or cancelled check as passing.

## Credentials and GitHub controls

Automation must use a least-privilege repository credential, preferably a GitHub App installation token with short lifetime and auditable identity. Credentials must remain outside the repository. Branch protection and required checks remain authoritative; automation receives merge permission but no bypass permission. Idempotency keys and durable intent/result records must prevent duplicate side effects after retries or restarts.

## Governance and architecture changes authorized by this decision

The following changes are authorized, subject to their normal independent gates:

- Amend `AGENTS.md` so the mandatory protocol permits the two named executors to perform their narrowly scoped post-gate merges while preserving the prohibition on direct pushes and gate self-approval.
- Amend the runtime architecture, ADRs, diagrams, and integration strategy to define admission predicates, refusal results, durable evidence, recovery, and ownership for both executors.
- Add implementation tasks owned separately by `runtime` and `devops` after the architecture amendment passes independent review.
- Add independent reviewer, security, QA, and failure-injection validation tasks for the implementation.
- Configure GitHub branch protection, required checks, auto-merge or merge API permissions, and least-privilege application credentials as required by the approved implementation.

No role reassignment is required by this decision. `config/agents/settings.yaml` changes only if an approved architecture later demonstrates that a declared write scope must change; such a change remains human-controlled.

## Sequencing

1. TASK-013 records this commit as a `human_decision_recorded` ingress fact and moves TASK-040 to `ready`.
2. TASK-040 authors the architecture amendment and must cover task-to-integration and integration-to-`main` automation.
3. TASK-041 independently reviews that amendment.
4. Only a passing TASK-041 verdict permits the Orchestrator to create implementation and validation tasks.
5. Existing pull requests continue to obey their current gates until the new capability is implemented and approved. This decision does not retroactively authorize a gate bypass.

## Expected outcome

After implementation, normal project operation requires the user to provide the project and policy boundaries once. Agents create, review, validate, merge, record, and schedule subsequent work without asking the user to click GitHub merge buttons. Humans are contacted only for the finite exception set above.
