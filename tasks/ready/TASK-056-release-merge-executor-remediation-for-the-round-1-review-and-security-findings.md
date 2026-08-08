---
task_id: TASK-056
title: Release merge executor remediation for the round-1 review and security findings
status: ready
owner_role: devops
llm: claude
branch: agent/claude/devops/task-056
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-devops-task-056
write_scope:
  - scripts/release/integration-merge/**
resource_lock: release-merge-executor
dependencies:
  - task: TASK-053
    edge: gate_recorded
    satisfied: true
    satisfied_at: 7e78f1405e40e29034673944949c3851e466cf3c
    satisfied_by: ACT-029 consuming ingress entry seq 39, class gate_verdict_recorded
    satisfied_under: >-
      gate_recorded is satisfied by ANY verdict, including changes-required, which is why it is the
      correct edge for a remediation and why the lineage form of gate_passed is deliberately NOT used
      here - a passing verdict will never exist at round 1 of this lineage, so the lineage form would
      be permanently unsatisfiable and this record would never dispatch. That is the F-204
      distinction, applied for the third time in this graph after TASK-042 and TASK-046.
  - task: TASK-054
    edge: gate_recorded
    satisfied: true
    satisfied_at: 8b2da2f88d38872ded14bc18b739c6586ec47336
    satisfied_by: ACT-029 consuming ingress entry seq 40, class gate_verdict_recorded
    satisfied_under: >-
      The same reasoning applied to the security lineage. THIS IS THE FIRST RECORD IN THIS GRAPH TO
      HOLD TWO gate_recorded EDGES, because it is the first remediation answering two independent
      gates of one artifact. Both were satisfied by the same activation and neither is derived from
      the other; each was checked separately against its own report at its own source commit.
required_gates:
  - review
  - security
pre_merge_gates:
  - review
  - security
gate_tasks:
  - task: TASK-057
    gate: review
    round: 1
    verdict: pending
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-REVIEW
    lineage_round: 2
  - task: TASK-058
    gate: security
    round: 1
    verdict: pending
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 2
gate_status: >-
  OPEN on both relations, pending on both, and neither owner is dispatchable until this task
  publishes. This record joins the cohorts of LIN-RELEASE-EXECUTOR-REVIEW and
  LIN-RELEASE-EXECUTOR-SECURITY, each of which grows from one member to two with none removed, and
  each round 2 carries TWO relations - this record at its own round 1 and TASK-049 at its round 2.
  That is the shape LIN-INTEGRATION-AUTHORITY-REVIEW round 2 used and it is applied unchanged.
deferred_qa_gate: >-
  DEFERRED BY RULE, NOT OMITTED, AND NOT SILENTLY ABSENT. No qa entry appears in required_gates or
  pre_merge_gates and no qa gate task exists for this record, because invariant 8 permits a lineage
  round greater than 1 ONLY after the preceding round records a verdict, and LIN-RELEASE-EXECUTOR-QA
  round 1 - owned by TASK-055 over TASK-049 - has recorded NONE. TASK-055 was dispatched once and did
  not run; see its dispatch_observation. Declaring a qa gate here would either require creating
  LIN-RELEASE-EXECUTOR-QA round 2 in breach of invariant 8, or leave a required_gates entry with no
  named owner in breach of the gate-assignment property that every entry has one. THE OBLIGATION IS
  REAL AND IS RECORDED RATHER THAN DISCHARGED: the activation that consumes TASK-055's round-1
  verdict decides whether that lineage's cohort grows to include this record and creates the round
  that would judge it. Until then this record carries a stated deferral. This is the same treatment
  LIN-DECOMP-REVIEW round 9 has had since ACT-012, and the same reasoning the A-506 section records.
  NOTHING HERE PERMITS ACTIVATION: negativeCapabilityTestAttestation remains an immutable member of
  the approved MergeExecutorActivationRecord and remains unvalidated, so admit returns
  AuthorityNotActivated whatever this record's review and security gates eventually record.
parent_task: TASK-001
publication_class: runtime
supersedes: none
remediates:
  - report: reports/code-review/TASK-049-RELEASE-MERGE-EXECUTOR-REVIEW.md
    at_commit: 7e78f1405e40e29034673944949c3851e466cf3c
    recorded_by: TASK-053
    lineage: LIN-RELEASE-EXECUTOR-REVIEW
    lineage_round: 1
    findings: [F-053-01, F-053-02, F-053-03, F-053-04, F-053-05, F-053-06, F-053-07, F-053-08]
  - report: reports/security/TASK-049-RELEASE-MERGE-EXECUTOR-SECURITY.md
    at_commit: 8b2da2f88d38872ded14bc18b739c6586ec47336
    recorded_by: TASK-054
    lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 1
    findings: [F-054-01, F-054-02, F-054-03, F-054-04, F-054-05, F-054-06, F-054-07, F-054-08]
finding_ownership_note: >-
  ALL SIXTEEN FINDINGS NAME devops AS THE RESPONSIBLE OWNER, read one line at a time from the two
  reports rather than from either report's summary sentence. That is why there is ONE remediation
  record and not two. Two records would declare the IDENTICAL write scope
  scripts/release/integration-merge/**, which config/agents/settings.yaml forbids under
  allow_overlapping_write_scopes false, would contend on one lock, could not run in parallel, and
  would divide one module's admission path between two authors - which the findings-return path calls
  "as much a defect as folding two owners into one". The symmetry is deliberate: ACT-021 created TWO
  remediation tasks for TASK-041's four findings because they named TWO owner roles, and ACT-023
  created ONE for TASK-044's three because they named one. NO FINDING WAS MERGED, SPLIT, SOFTENED,
  DOWNGRADED, REASSIGNED, OR RESTATED BY THE ORCHESTRATOR. Several pairs describe the same code region
  from a review lens and a security lens - F-053-01 with F-054-01, F-053-02 with F-054-03, F-053-04
  with F-054-02, F-053-05 and F-053-06 with F-054-04, F-054-05, and F-054-06, and F-053-07 with
  F-054-08 - but NEITHER GATE OWNER DECLARED ANY OF THEM AN INHERITED VIEW OF THE OTHER, so each is
  its own obligation with its own required change and its own disposition. A remedy that satisfies
  one lens does not close the other's finding; only that lineage's own round 2 may.
blocking_security_note: >-
  SEVEN OF THE SIXTEEN BLOCK DELIVERY BY SEVERITY - F-054-01 through F-054-05 are Critical and
  F-054-06 and F-054-07 are High. Under AGENTS.md, README.md, and
  config/agents/settings.yaml security_blocking_severities, they block merge and release until
  resolved or FORMALLY ACCEPTED BY AN AUTHORIZED HUMAN. NO ACCEPTANCE EXISTS, none was sought, and
  this owner may not create, request, simulate, or rely on one. Resolution is the only path available
  to this task, and only TASK-058 may judge whether it succeeded.
governance_decision_context: >-
  HUMAN-004, approved at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68, artifact
  plans/decisions/HUMAN-004-autonomous-merge-authority.md. Read the decision at that commit and not
  from any transcription. Its eight prohibited capabilities and its finite three-member residual human
  exception set are unchanged by these findings, and TASK-054 assessed the module against them
  individually - two recorded met for the target source and six not met.
normative_architecture_source: >-
  The LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 approved source
  f148567d716c00d7a24783318c8d6d7031492e7b, approved at 78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 -
  principally docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md, COMPONENT-BOUNDARIES.md, and
  INTEGRATION-STRATEGY.md with ADR-0042, ADR-0043, and ADR-0044. Read at that exact identifier
  through Git object access, or from integration/autonomous-runtime, which carries a byte-identical
  docs tree since cf6333b10e628b3b61f3b7f8716b30923725067d. THAT CONTRACT IS APPROVED AND IS NOT
  REOPENED HERE. Several findings assert that the implementation diverges from it - F-053-01 cites
  the signed-payload and Ed25519 fixture requirements at POST-GATE-MERGE-EXECUTORS.md lines 129-135
  and 763, and F-053-05 cites the reread order at lines 470-475 - so the remedy is to make the code
  meet the contract, not to amend the contract. IF AND ONLY IF a remedy is genuinely inexpressible
  under the approved contract, return the exact minimum amendment text to the Orchestrator with the
  clause it cannot satisfy; do not author an architecture path and do not proceed on an assumption.
review_target_base: d63864bcb25fc8897b21c09f8f687e390f85808d
review_target_applicability: >-
  applicable, resolved, and DELIBERATELY NOT THIS RECORD'S OWN BRANCH POINT. Round 2 of both lineages
  carries relations for TASK-049 as well as for this record, so each round must see the COMPLETE
  release executor rather than only the latest correction to it - which means diffing this task's
  published head against TASK-049's own immutable branch point d63864bcb25fc8897b21c09f8f687e390f85808d,
  the base rounds 1 of both lineages used. The value was read with git merge-base
  agent/claude/devops/task-049 integration/autonomous-runtime and is independently the parent of
  TASK-049's first authored commit 012bdb8360a7a1b4e61b362d9302f731ad817078. It is NOT 1dd3b93e, NOT
  9fb2eb0c, NOT cf6333b1, NOT origin/main, and NOT this branch's own branch point. This is the same
  construction TASK-046 used with c95ce600.
branch_point_of: agent/claude/devops/task-049
scope_validation_base: git merge-base HEAD agent/claude/devops/task-049
scope_validation_applicability: >-
  applicable, declared as a reproducible expression because this task's branch does not exist yet.
  It is this task's own branch point and is unrelated to review_target_base above; findings F-403 and
  A-209 require the two to stay separate fields, and here they will hold genuinely different values.
scope_validation_note: >-
  BRANCH FROM agent/claude/devops/task-049, NOT from integration/autonomous-runtime. TASK-049 is NOT
  integrated and MUST NOT BE - pull request 30 is open with both pre-merge gates non-passing - so the
  module this task remediates exists only on that branch. Branching from it gives TRUE ANCESTRY over
  the artifact under remediation, which is the shape ADR-0041 requires of a cumulative unit and which
  TASK-042 and TASK-046 each achieved; it also means the review-diff base above and this branch point
  differ, which is exactly why the two fields are separate. Resolve the branch point inside the
  worktree with git merge-base HEAD agent/claude/devops/task-049 - it is expected to be
  9fb2eb0ca7c02101fd067452824e2612fda5cc0c, but RESOLVE IT RATHER THAN ASSUME IT and record the
  resolved value in the handoff. Never pass d63864bc, 1dd3b93e, cf6333b1, origin/main, or a
  review-diff base to -BaseRef. DO NOT MERGE integration/autonomous-runtime OR ANY OTHER BRANCH INTO
  THIS ONE to assemble the work.
integrable: false
integration_state: >-
  Nothing to integrate yet. When this task publishes, its pull request targets
  integration/autonomous-runtime and MUST NOT be merged until both pre_merge_gates entries close at a
  passing verdict. Merging it would additionally land TASK-049's content by ancestry, whose own two
  pre-merge relations are open - so the prohibition on merging pull request 30 extends to this
  task's pull request for as long as either round 2 is unrecorded.
blocked_reason: >-
  NOT BLOCKED. Created ready at ACT-029. Both declared edges - gate_recorded(TASK-053) at
  7e78f1405e40e29034673944949c3851e466cf3c and gate_recorded(TASK-054) at
  8b2da2f88d38872ded14bc18b739c6586ec47336 - were satisfied by the same activation that created this
  record, so it is dispatchable immediately. It declares NO integrated() edge and NO lineage-form
  gate_passed edge: TASK-049's approved-architecture prerequisite was discharged at ACT-026 and is a
  property of the module this task amends, not a fresh dependency of the amendment.
exit_condition: >-
  This task publishes an immutable commit on agent/claude/devops/task-056, pushes the branch to
  origin, and opens a pull request against integration/autonomous-runtime - all three, because
  publication_class is runtime and an unavailable remote is a blocked outcome rather than a
  local-only success. That publication satisfies review_ready(TASK-056), which is the only scheduling
  dependency TASK-057 and TASK-058 declare. IT SATISFIES NOTHING ELSE. It closes no gate, resolves no
  finding, produces no activation-record member, clears no external blocker, and makes neither this
  record nor TASK-049 integrable. A REMEDIATION IS NOT A RESOLUTION; only TASK-057 and TASK-058, each
  in its own lineage and its own execution context, may record that any of the sixteen findings is
  resolved.
---

# TASK-056: Release merge executor remediation for the round-1 review and security findings

## Objective

Remediate all sixteen findings that `LIN-RELEASE-EXECUTOR-REVIEW` round 1 and `LIN-RELEASE-EXECUTOR-SECURITY` round 1 recorded against TASK-049's release merge executor, inside `scripts/release/integration-merge/**` and nowhere else, so that every path by which the module's sole merge port can be reached is authenticated, bound, complete, and fail-closed. The module stays **dormant**: this task fixes how it refuses, and it must not make it capable of acting.

## Why this task exists, and why there is one of it

Two independent gates judged one artifact on the same day and both recorded `changes-required`. **Every one of the sixteen findings names `devops` as the responsible owner**, and the graph's routing rule is one remediation task per responsible owner, reusing that owner's original non-overlapping write scope. Two records would declare the identical scope, contend on one lock, and split one module's admission path between two authors — which the findings-return path names as a defect in its own right.

**One remediation record does not mean one verdict.** Two separate rounds in two separate lineages, in two separate execution contexts, judge this work: `LIN-RELEASE-EXECUTOR-REVIEW` round 2 at **TASK-057** and `LIN-RELEASE-EXECUTOR-SECURITY` round 2 at **TASK-058**. Each carries a relation for this record at its own round 1 and for TASK-049 at its round 2, and neither may disposition the other lineage's findings.

## What this task must read, and in what order

1. `reports/code-review/TASK-049-RELEASE-MERGE-EXECUTOR-REVIEW.md` at **`7e78f1405e40e29034673944949c3851e466cf3c`**, through Git object access.
2. `reports/security/TASK-049-RELEASE-MERGE-EXECUTOR-SECURITY.md` at **`8b2da2f88d38872ded14bc18b739c6586ec47336`**, through Git object access.
3. The approved contract at **`f148567d716c00d7a24783318c8d6d7031492e7b`**.
4. `plans/decisions/HUMAN-004-autonomous-merge-authority.md` at **`7dc07488a5b1cac8b1327ebd63bf747adbe03c68`**.

**Read each finding from its own report at its own source commit, never from this record, from `tasks/TASK-001-DEPENDENCY-GRAPH.md`, or from any other transcription.** The evidence, the file-and-line citations, the reproduced counterexamples, and the required-change text are authored only in those two artifacts, and this record deliberately reproduces none of them in full.

## Scope

- Fix **F-053-01** and **F-054-01** — attestation authentication. Verify the Ed25519 signature over the exact canonical payload against an activation-pinned trust root; fail closed on decode, key, and signature errors; bind and compare both exact App identities, installations, and complete permission maps against pinned expected identities; pin and verify the observer-principal set; validate online issuer and key revocation; and reject every permission outside the approved release identity set.
- Fix **F-053-02** and **F-054-03** — authority resolution. Reject more than one relation for any `(lineage, gate, lineageRound)`; validate every relation in the claimed complete set; require immutable verdict commits before evaluation; construct manifests and snapshots from authenticated immutable artifacts rather than caller objects; derive the required-check set and expected App sources from the pinned signed policy profile; and verify authorized-human acceptance provenance.
- Fix **F-053-03** — release-lineage completeness. Bind admission to an immutable complete ordered unit inventory and initial tree, derive verification from evidence rather than a caller-supplied `verified` boolean, and refuse any prefix or suffix omission, duplicate, or reordering after recomputation.
- Fix **F-053-04** and **F-054-02** — activation binding. Give every activation member an exact expected kind, gate, lineage, target commit, and independently verifiable producer binding; consume an authenticated immutable activation-record artifact and verify its own commit, path, digest, and issuer; bind the policy-profile artifact digest to the effective required digest; bind the concrete broker and port identity to the negative-capability attestation; and reject absent or executor-produced provenance for **every** member.
- Fix **F-053-05**, **F-054-04**, and **F-054-05** — execution boundary. Treat every durable terminal outcome as terminal, including `refused` and `human_exception_required`; recompute the supplied plan's idempotency key from its canonical fields and compare canonical bytes or a store-authenticated plan digest; and, after every delay and immediately before every mutation attempt, re-read and bind the exact base, head, and checks, re-run the gate and activation predicates, and obtain and cryptographically validate a fresh pre-mutation attestation and revocation result, refusing rather than retrying on any drift.
- Fix **F-053-06** and **F-054-06** — durable evidence. Persist each attempt atomically before its mutation and enforce the global budget across restarts; authenticate and authorize every store append; validate history identity and plan digest before treating a stored outcome as terminal; verify store-issued policy receipts; and prove the merged commit's reachability from and containment by the protected base before recording success.
- Fix **F-054-07** — production-action authorization. Require an immutable authorized-human record that binds the exact policy commit, release head OID, repository, action, scope, and decision artifact, and verify its provenance before admission. **Do not record a coupling of merge-to-`main` to any irreversible production action**; `HUMAN-004` states it is not one unless a later approved policy deliberately says so, and none does.
- Fix **F-053-07** and **F-054-08** — published-head evidence. Define and validate the exact remote ref and required resolved-base names and values; bind each required proof kind to a distinct successful command record and reproducible result digest; and require distinct authenticated producer and session identities for the author and control phases.
- Fix **F-053-08** — totality. Validate the complete runtime input shape before any dereference or digest computation, and add hostile `unknown`-input tests asserting exactly one typed result and no thrown exception.
- Add, for **every** fix, at least one test that fails against `9fb2eb0c` and passes here, constructed from the finding's own reproduced counterexample. **Do not delete or weaken an existing fixture to make a case pass.**
- Keep the eleven live control-plane and attestor fixtures **registered and unexecuted**. **They must never be stubbed, faked, simulated, or made to pass by any means**, and the count may rise if a fix adds a live obligation.
- Exclude: implementing TASK-048; authoring or editing `AGENTS.md`, `config/agents/settings.yaml`, `.agents/**`, `.github/**`, `.githooks/**`, `scripts/ci/**`, `scripts/quality/**`, `src/**`, `tests/**`, `tasks/**`, any `reports/**` path, or any architecture document; provisioning, configuring, or requesting any control-plane, credential, App, branch-protection, ruleset, attestor, or evidence-store change; performing, requesting, or simulating any merge; recording or relying on a formal acceptance of any security finding; and asserting that any activation prerequisite is satisfied.

## Acceptance criteria

- [ ] **Each of the sixteen findings receives its own explicitly identified remedy in the handoff**, by finding ID, naming the exact files and functions changed and the test that now covers it. A remedy for one lens does not discharge the other lens's finding, and no finding is answered by a summary that groups it with another.
- [ ] **F-053-01 and F-054-01**: a forged non-Ed25519 signature over an otherwise valid attestation returns a typed refusal, demonstrated by a test; a permission map augmented with Administration, Actions, Secrets, checks-write, or commit-status-write is rejected, demonstrated by a test.
- [ ] **F-053-02 and F-054-03**: a second relation at the same authoritative round, a `verdictCommit` naming a mutable ref, a caller-selected required-check set, and a fabricated snapshot each refuse, **each demonstrated for all seven release domains**, permutation-independently rather than in the observed array order.
- [ ] **F-053-03**: a digest-recomputed lineage missing its first content unit refuses.
- [ ] **F-053-04 and F-054-02**: an `implementationReview` substituted with a copy of `architectureReview`, an artifact carrying `producedByExecutor: true`, an artifact with omitted provenance, and a required-profile artifact whose digest differs from the effective required digest each return `AuthorityNotActivated`.
- [ ] **F-053-05, F-054-04, and F-054-05**: a preloaded terminal `refused` outcome makes zero merge calls; a plan altered in any field while retaining the admitted idempotency key is rejected; and a retry after a base change or an attestation expiry refuses instead of merging — each with the exact input and observed result recorded.
- [ ] **F-053-06 and F-054-06**: a forged terminal store record is rejected; the attempt count survives a fresh process; and a merged commit that is not reachable from the protected base is not recorded as success.
- [ ] **F-053-07, F-054-07, and F-054-08**: an unbound remote ref, an unbound resolved base, a same-producer two-phase bundle, and an unbound irreversible-action authorization each refuse.
- [ ] **F-053-08**: `admit` returns exactly one typed result and throws no exception for every hostile `unknown` input in an exhaustive table, including `null` and missing members at every declared boundary.
- [ ] `admit` remains **total** over its declared input domain, and the structural negative-capability surface is unchanged: exactly one merge port, no generic HTTP, no ref update, no `git push`, no `ALLOW_MAIN_PUSH`, no force, no hook bypass, no administrator override, no required-check mutation, no branch-protection or ruleset mutation, no gate mutation, no task-ownership mutation, and no lock-release mechanism. **A fix that widens this surface is a regression whatever it repairs.**
- [ ] The module still imports no runtime implementation module and no runtime contract root, proven by the static dependency test.
- [ ] With any activation-record member absent, unpinned, mutable, or executor-produced, `admit` still returns `AuthorityNotActivated`, and the module remains dormant.
- [ ] Every changed path is inside `scripts/release/integration-merge/**`, verified by enumerating the changed-path list. **`.github/workflows/**` is excluded even though the `devops` role is granted it**, per the narrowing TASK-043 established.
- [ ] The publication carries a complete two-phase `published-head-evidence/v2` bundle for the exact published head, with an absent GitHub check state recorded as an absence and never as a success.
- [ ] The handoff records the full test result as **declared / executed / passed / failed / unexecuted**, states which fixtures remain unexecuted and why, and **never reports an unexecuted obligation as passing**.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>` reports a valid result and its output is recorded in the handoff together with the resolved branch point.
- [ ] The handoff states explicitly that the executor is **dormant**, that no activation prerequisite was satisfied by this task, that no security finding was accepted, and that no merge was performed, requested, or simulated.

## Expected artifacts

- `scripts/release/integration-merge/` — the remediated release admission module and its nested tests under `scripts/release/integration-merge/tests/`. The entry point stays `scripts/release/integration-merge/index.ts`, which the approved `COMPONENT-BOUNDARIES.md` requires of every published module and which `MC-019` makes this task's ingress `source_path`.

## Write-scope isolation

`scripts/release/integration-merge/**` is **identical to TASK-049's**, because this task amends the module TASK-049 authored. That overlap is real and is serialized by the shared `resource_lock: release-merge-executor`, which this record and TASK-049 both declare — the same treatment `ci-toolchain` gives TASK-018 and TASK-043 on `scripts/ci/**`. It is disjoint from TASK-018's manifests, `scripts/quality/**`, and `.github/workflows/**`; from TASK-043's `scripts/ci/**`; from TASK-048's `src/orchestrator/integration/**`; and from every report path in this graph. **A configured write scope is a ceiling, not a permission**: the `devops` role is granted more and this record declares only this.

## Gate and remediation path

Two gates, two owner roles, two lineages, two execution contexts, and **this task's owner may perform neither**.

| Gate | Owner | Lineage | Round | Blocks integration |
|---|---|---|---|---|
| review | **TASK-057**, `reviewer` / `gpt` | `LIN-RELEASE-EXECUTOR-REVIEW` | 2 | yes |
| security | **TASK-058**, `security` / `gpt` | `LIN-RELEASE-EXECUTOR-SECURITY` | 2 | yes |

A QA obligation for this record is **deferred by invariant 8** rather than absent; see `deferred_qa_gate`. Findings return to the Orchestrator under TASK-013; a gate owner never implements the fix and this owner never records a verdict. Publishing this task's own artifact is the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence.** The author is `devops` / `claude`; both gates are `gpt`. Author and each gate owner are in different roles, different execution contexts, and different LLM families. This task **must not run in TASK-049's, TASK-053's, TASK-054's, TASK-055's, TASK-057's, or TASK-058's execution context**, nor in TASK-048's, TASK-050's, TASK-051's, or TASK-052's — the two executors implement one shared normative protocol, and a context that authored or judged one half is not independent of the other.

## Task-record lifecycle

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the `devops` role's configured write scope. The Orchestrator performs every transition under TASK-013.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-056 -Role devops -Llm claude`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-056 -Role devops -Llm claude` before editing. The `release-merge-executor` lock is free; TASK-049's execution is complete.
3. Branch from **`agent/claude/devops/task-049`**, resolve the branch point with `git merge-base HEAD agent/claude/devops/task-049`, and record the resolved value. Read the two reports and the approved contract at their exact identifiers.
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
5. Commit, push this task branch, and open a pull request against `integration/autonomous-runtime`. **Never push `main`, never merge anything, and never set `ALLOW_MAIN_PUSH`.**
6. Produce the two-phase published-head evidence bundle and attach it to the pull request.
7. Run `scripts/orchestration/release-task.ps1 -TaskId TASK-056 -Role devops -Llm claude`.

## Handoff

Maintained by the Orchestrator under TASK-013 from this owner's commit, pull request, and handoff.

- Commit or pull request:
- Verification:
- Known risks:
- **Created `ready` at `ACT-029`**, on ingress entries `seq` 39 and `seq` 40, both class `gate_verdict_recorded`. It is **dispatchable on creation** — both of its `gate_recorded` edges were satisfied by the same activation that created it, which is the shape TASK-042 and TASK-043 had at `ACT-021`.
- **What this record does not claim.** It resolves nothing yet. The sixteen findings are `open` and stay open until TASK-057 and TASK-058 each record a disposition in their own lineage. **Seven of them block delivery until resolved or formally accepted by an authorized human, and no acceptance exists.** TASK-049 stays non-integrable and pull request 30 stays unmergeable regardless of what this task publishes.
- Next owner: **this task**, `devops` / `claude`, `ready` and dispatchable, sole write scope `scripts/release/integration-merge/**`, holding `release-merge-executor`, branching from `agent/claude/devops/task-049` with the branch point resolved inside its own worktree.
