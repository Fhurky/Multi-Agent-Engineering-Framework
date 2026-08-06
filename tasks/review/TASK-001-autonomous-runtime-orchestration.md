---
task_id: TASK-001
title: Decompose the autonomous multi-agent runtime
status: review
owner_role: orchestrator
llm: claude
branch: agent/claude/orchestrator/task-001
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-orchestrator-task-001
write_scope:
  - tasks/**
resource_lock: task-records
dependencies: []
required_gates:
  - review
pre_merge_gates: []
gate_tasks:
  - task: TASK-014
    gate: review
    round: 1
    verdict: changes-required
    verdict_recorded_at: 8ac0dbd
    remediated_by: TASK-001 revision 2
    revalidated_by: TASK-014 round 2
    gate_class: point
    retrospective: true
    gate_lineage: LIN-DECOMP-REVIEW
    lineage_round: 1
  - task: TASK-014
    gate: review
    round: 2
    verdict: changes-required
    verdict_recorded_at: abb85d9
    remediated_by: TASK-013 activation ACT-001
    revalidated_by: TASK-021
    gate_class: point
    retrospective: true
    gate_lineage: LIN-DECOMP-REVIEW
    lineage_round: 2
  - task: TASK-021
    gate: review
    round: 3
    verdict: changes-required
    verdict_recorded_at: adfb982
    remediated_by: TASK-013 activation ACT-002
    revalidated_by: TASK-022
    gate_class: point
    retrospective: true
    gate_lineage: LIN-DECOMP-REVIEW
    lineage_round: 3
  - task: TASK-022
    gate: review
    round: 4
    verdict: changes-required
    verdict_recorded_at: e8eb23d
    remediated_by: TASK-013 activation ACT-004
    revalidated_by: TASK-023
    gate_class: point
    retrospective: true
    gate_lineage: LIN-DECOMP-REVIEW
    lineage_round: 4
  - task: TASK-023
    gate: review
    round: 5
    verdict: changes-required
    verdict_recorded_at: 667d3b8
    remediated_by: TASK-013 activation ACT-005
    revalidated_by: TASK-027
    gate_class: point
    retrospective: true
    gate_lineage: LIN-DECOMP-REVIEW
    lineage_round: 5
  - task: TASK-027
    gate: review
    round: 6
    verdict: changes-required
    verdict_recorded_at: 710351fd8f1afa2765ffac52078cfc7b8ddb3206
    remediated_by: TASK-013 activation ACT-006
    revalidated_by: TASK-030
    gate_class: point
    retrospective: true
    gate_lineage: LIN-DECOMP-REVIEW
    lineage_round: 6
  - task: TASK-030
    gate: review
    round: 7
    verdict: changes-required
    verdict_recorded_at: f36e6c06fdf192bdb2931752d043d342aec8bdee
    remediated_by: TASK-013 activation ACT-007
    revalidated_by: TASK-031
    gate_class: point
    retrospective: true
    gate_lineage: LIN-DECOMP-REVIEW
    lineage_round: 7
  - task: TASK-031
    gate: review
    round: 8
    verdict: pending
    gate_class: point
    retrospective: true
    gate_lineage: LIN-DECOMP-REVIEW
    lineage_round: 8
revision: 9
publication_class: bootstrap
published_commit: 657b83a
published_branch: agent/claude/orchestrator/task-013
publication: published
publication_reason: Revisions 3 through 9 are authored by TASK-013 activations on agent/claude/orchestrator/task-013. The ACT-001 revision was integrated at e8edbcd and merged to main at c325275 through pull request #1; the ACT-002, ACT-004, ACT-005, ACT-006, and ACT-007 revisions are published on the same branch with their own pull requests, the ACT-006 revision reached main at 1fc5f53 through pull request 13, and the ACT-007 revision reached main at 76e27ff through pull request 17. The ACT-008 revision is publication local-only, reason: public remote egress approval is pending.
review_target_branch: agent/claude/orchestrator/task-013
review_target_commit: f14bddef327ca04291b73b7eceb5b04c4d061577
review_target_base: 443ff9be91025b892b8fb4d764a6a49a8e811491
review_target_applicability: applicable, bound by the ACT-007 follow-up commit
review_target_note: Revision 8 was authored by TASK-013 activation ACT-007, because TASK-013 is the exclusive owner of every task-record mutation in this graph. The round 8 review target is the ACT-007 effects commit on agent/claude/orchestrator/task-013, recorded in tasks/TASK-013-ACTIVATION-LOG.md and in TASK-031's frontmatter by a single follow-up commit. The review-diff base is 443ff9b, this branch's immutable ACT-007 activation base, which contains e7bd748 - the head round 7 reviewed - so round 8 covers exactly the ACT-007 delta and nothing round 7 already judged. The superseded round 7 target was 83c1e03 with follow-up head e7bd748 against base 62d6f2d; round 6 reviewed 70162b0 with follow-up head 62d6f2d against 890b8e0; round 5 reviewed ac9c8f2 with follow-up head 890b8e0 against c325275; round 4 reviewed f590749 with follow-up 4f8a1cc against c325275; round 3 reviewed 5febe3b against 049158d. A review-diff base is never a scope-validation base; see findings F-403 and A-209 and the Task baselines section of tasks/TASK-001-DEPENDENCY-GRAPH.md.
branch_point_of: governance/autonomous-runtime-bootstrap
scope_validation_base: b52e2059bcbd307bfb46e79fccde279902fc4cf7
scope_validation_applicability: applicable and resolved for the closed original execution only
scope_validation_note: Resolved by activation ACT-006 from the repository rather than declared not applicable, which is what this record said before. The original TASK-001 execution ran on agent/claude/orchestrator/task-001, whose first authored commit a117f9b has parent b52e205, the head of governance/autonomous-runtime-bootstrap. That execution is closed and is not re-run, so this value is durable provenance rather than a live acceptance base. Revisions 3 through 7 are authored by TASK-013 activations on agent/claude/orchestrator/task-013 and are validated under TASK-013's own declared baseline, not this one. Passing this value to the validator today would attribute every later activation's delta to the closed execution and is not the acceptance command for any live task.
---

# TASK-001: Decompose the autonomous multi-agent runtime

## Objective

Create an executable dependency-ordered task graph for a single-command autonomous supervisor that can start, gracefully pause, checkpoint, resume, and complete multi-agent project runs.

## Scope

- Create a Solution Architect task for the runtime architecture and ADRs.
- Create blocked Runtime Engineer tasks for supervisor, durable state, provider adapters, scheduling, lifecycle control, workspace automation, and recovery.
- Create independent Reviewer, Security, QA, and Performance tasks with explicit dependencies, including an independent review of the architecture itself.
- Require deterministic task state transitions, bounded concurrency, leases, fencing tokens, idempotent retries, and durable checkpoints.
- Require the mandatory isolated-execution protocol — hooks, branch, worktree, lock, scope validation, handoff, release, crash-safe cleanup — to be performed by the runtime rather than by a human.
- Require working non-interactive adapters for every configured LLM family.
- Require a one-input project bootstrap that automatically creates the initial Manager task.
- Exclude architecture authorship, runtime implementation, independent approval, and release.

## Acceptance criteria

- [x] Every child task has one owner, one LLM family, explicit typed dependencies, acceptance criteria, gates, artifacts, branch, worktree, and a write scope that is either non-overlapping or serialized by a declared resource lock.
- [x] Architecture completes and passes an independent review gate before runtime implementation starts.
- [x] Runtime implementation tasks can proceed in parallel only when their write scopes do not overlap and they hold no common resource lock.
- [x] Review, Security, QA, and Performance run in separate execution contexts after their dependencies are ready, and gate readiness cannot deadlock against terminal completion.
- [x] Start, graceful drain, checkpoint, pause, resume, completion, timeout, crash recovery, and retry behavior are covered.
- [x] The mandatory worktree, branch, lock, validation, handoff, and release protocol is owned by an implementation task with crash-safe cleanup and acceptance tests.
- [x] Every task-record lifecycle transition is owned by a role whose configured write scope includes `tasks/**`.
- [x] The task graph includes an explicit path from implementation findings back to the responsible author.

These boxes record the author's own assessment. They are **not confirmed.** TASK-014 round 1, TASK-014 round 2, TASK-021 round 3, TASK-022 round 4, TASK-023 round 5, and TASK-027 round 6 have each recorded `changes-required` — six recorded rounds, all failing. They are confirmed only when a round of this decomposition's registered review lineage records a passing verdict. No Claude Orchestrator execution — including the TASK-013 activations that produced revisions 3, 4, 5, 6, and 7 — may close this review gate.

## Expected artifacts

- Architecture task records assigned to `architect` / `claude`.
- Runtime implementation task records assigned to `runtime` / `claude`.
- A delivery task record assigned to `devops` / `claude`.
- Independent validation task records assigned to their configured LLM families.
- Durable handoff notes identifying dependency order, edge semantics, and next owners.

## Produced task graph

Current as of revision 9, produced by TASK-013 activation `ACT-008`. `tasks/TASK-001-DEPENDENCY-GRAPH.md` is authoritative for edge types, publication classes, gate assignment, gate scheduling classes, gate lineages, resource locks, the write-scope partition, the activation and event-ingress model, the architecture reconciliation, the required-behavior coverage matrix, and the findings return path. The **State** column is a lifecycle snapshot only.

> **Correction — finding F-501, applied by activation `ACT-006` and re-verified by `ACT-007` and `ACT-008`.** At revision 6 this table said TASK-024 was `ready` and TASK-025 was `blocked`, while their own records, the graph, and the activation log all said `review` and `ready`. Round 7 recorded F-501 `resolved`. The table is regenerated from the records at every activation rather than edited in place, and every row's **State** column is compared with that record's `status` field and its lifecycle directory in both directions. The rows are in task-ID order so an omission is visible. This table remains a snapshot: where it and a record disagree, the record and the graph are authoritative, and the disagreement is a finding.

| Task | Owner role | LLM | Depends on | State |
|---|---|---|---|---|
| TASK-002 Runtime architecture and ADRs | architect | claude | — | review, `changes-required` at round 4 |
| TASK-003 Durable run state and checkpoints | runtime | claude | LIN-ARCH-REVIEW gate r5, TASK-018 integrated | blocked |
| TASK-004 Provider adapters and agent workers | runtime | claude | LIN-ARCH-REVIEW gate r5, TASK-018 integrated | blocked |
| TASK-005 Scheduling, leases, fencing, bounded concurrency | runtime | claude | LIN-ARCH-REVIEW gate r5, TASK-003, TASK-004, TASK-026 integrated | blocked |
| TASK-006 Supervisor core and state machine | runtime | claude | LIN-ARCH-REVIEW gate r5, TASK-003, TASK-004, TASK-005, TASK-017 integrated | blocked |
| TASK-007 Lifecycle control and one-input bootstrap | runtime | claude | LIN-ARCH-REVIEW gate r5, TASK-006 integrated | blocked |
| TASK-008 Crash recovery, timeouts, idempotent retries | runtime | claude | LIN-ARCH-REVIEW gate r5, TASK-003, TASK-004, TASK-006, TASK-017 integrated | blocked |
| TASK-009 Independent code review of the runtime | reviewer | gpt | TASK-003 … TASK-008, TASK-017, TASK-026 review_ready | blocked |
| TASK-010 Security review of the runtime | security | gpt | TASK-003 … TASK-008, TASK-017, TASK-018, TASK-026 review_ready | blocked |
| TASK-011 QA validation of the runtime | qa | gemini | TASK-003 … TASK-008, TASK-017, TASK-026 review_ready | blocked |
| TASK-012 Performance validation of the runtime | performance | gemini | TASK-005, TASK-006, TASK-008, TASK-017 review_ready, LIN-RUNTIME-QA gate_passed(qa, 1) | blocked |
| TASK-013 Task-record lifecycle transitions and gate closure | orchestrator | claude | — event-triggered | blocked, quiescent |
| TASK-014 Independent review of this decomposition, rounds 1–2 | reviewer | gpt | TASK-001 review_ready | done, `changes-required` |
| TASK-015 Independent architecture review of TASK-002, round 1 | reviewer | gpt | TASK-002 review_ready | done, `changes-required` |
| TASK-016 Architecture amendment: runtime contracts and workspace lifecycle | architect | claude | TASK-015 gate_recorded | review, published at `8d0c570`, `changes-required` at round 3 |
| TASK-017 Agent workspace lifecycle automation | runtime | claude | LIN-ARCH-REVIEW gate r5, TASK-003, TASK-018 integrated | blocked |
| TASK-018 Runtime toolchain bootstrap | devops | claude | LIN-ARCH-REVIEW gate r5 | blocked |
| TASK-019 Independent review of the runtime toolchain | reviewer | gpt | TASK-018 review_ready | blocked |
| TASK-020 Independent review of the architecture amendment | reviewer | gpt | TASK-016 review_ready | done, `changes-required` |
| TASK-021 Independent re-review of this decomposition, round 3 | reviewer | gpt | TASK-001 review_ready | done, `changes-required` |
| TASK-022 Independent re-review of this decomposition, round 4 | reviewer | gpt | TASK-001 review_ready | done, `changes-required` |
| TASK-023 Independent re-review of this decomposition, round 5 | reviewer | gpt | TASK-001 review_ready | done, `changes-required` |
| TASK-024 Second architecture amendment: ingress inbox and revision-5 vocabulary | architect | claude | TASK-020 gate_recorded | review, published at `c2ee3eb`, `changes-required` at round 2 |
| TASK-025 Independent review of the second architecture amendment | reviewer | gpt | TASK-024 review_ready | done, `changes-required` |
| TASK-026 Durable ingress inbox and activation cursor store | runtime | claude | LIN-ARCH-REVIEW gate r5, TASK-003, TASK-018 integrated | blocked |
| TASK-027 Independent re-review of this decomposition, round 6 | reviewer | gpt | TASK-001 review_ready | done, `changes-required` |
| TASK-028 Third architecture amendment: round-3 blocking findings and the approved pre-dispatch observer | architect | gpt | TASK-025 gate_recorded | review, published at `fe0374c`, `changes-required` at round 1 |
| TASK-029 Independent review of the third architecture amendment | reviewer | gpt | TASK-028 review_ready | done, `changes-required` |
| TASK-030 Independent re-review of this decomposition, round 7 | reviewer | gpt | TASK-001 review_ready | done, `changes-required` |
| TASK-031 Independent re-review of this decomposition, round 8 | reviewer | gpt | TASK-001 review_ready | ready |
| TASK-032 Fourth architecture amendment: the round-4 blocking findings | architect | gpt | TASK-029 gate_recorded | review, published local-only at 468b37b, changes-required at round 1 |
| TASK-033 Independent review of the fourth architecture amendment | reviewer | gpt | TASK-032 review_ready | done, changes-required |
| TASK-034 Fifth architecture amendment: the round-5 blocking findings | architect | gpt | TASK-033 gate_recorded | review, published local-only at 6d145eb, changes-required at round 1 |
| TASK-035 Independent review of the fifth architecture amendment | reviewer | gpt | TASK-034 review_ready | done, changes-required |
| TASK-036 Sixth architecture amendment: the round-6 blocking findings | architect | gpt | TASK-035 gate_recorded | review, published local-only at 970b081, changes-required at round 1 |
| TASK-037 Independent review of the sixth architecture amendment | reviewer | gpt | TASK-036 review_ready | done, changes-required |
| TASK-038 Seventh architecture amendment: the integration-order blocker | architect | gpt | TASK-037 gate_recorded | review, published local-only at 8ea5c32, unjudged |
| TASK-039 Independent review of the seventh architecture amendment | reviewer | gpt | TASK-038 review_ready | ready |

**Human-authorized provider reroute — `HUMAN-003`:** On 2026-08-05 the user reassigned TASK-028 from `claude` to `gpt` after managed policy blocked external transfer to Claude. The prior Claude process and lock are closed, its uncommitted draft is preserved as source material, and the GPT architect owns the complete final delta on `agent/gpt/architect/task-028`. Scope, dependencies, gates, and lineage are unchanged; TASK-029 must execute in a separate context. The decision is durable as commit **`0b413b7`** on the non-agent branch `human/reroute/task-028-gpt`, merged into `main` at `443ff9b` through pull request 16, and activation `ACT-007` consumed it as ingress entry **`seq` 13**, class `human_decision_recorded` — the second governance decision in this graph to have the provenance `HUMAN-001` has at `fb9f45c`, and the first since.

## Revision 9 — the TASK-029 round 4 architecture verdict

Revision 9 was applied by **TASK-013 activation `ACT-008`**, which consumed **one** ingress fact:

- **TASK-029 round 4** at commit `3df261fa`, `seq` 16 — `changes-required` on the architecture lineage, recorded in `reports/code-review/TASK-028-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-3.md`, published as pull request 18 and merged into `main` at `fd7ce907`.

The full per-finding disposition register, the lifecycle transition table, the gate closure register, and the verification record are in `tasks/TASK-013-ACTIVATION-LOG.md`, activation `ACT-008`. What follows is the summary; that log is authoritative.

**This revision changes nothing about this record's own review gate.** Round 7 recorded `changes-required` and round 8 stays pending with TASK-031, whose review target `f14bdde` and review-diff base `443ff9b` are unchanged. `3df261fa` falls outside round 8's delta, and revision 9 is reviewed by the round that follows it.

### One verdict, four relations, all open

TASK-029 recorded **exactly one** verdict and applied it atomically to the four `LIN-ARCH-REVIEW` round-4 relations it carried — `(TASK-028, review, r1)`, `(TASK-024, review, r2)`, `(TASK-016, review, r3)`, and `(TASK-002, review, r4)`. Its report states "No relation passes independently." Four durable gate-verdict facts were recorded and all four stay **open together**; a split outcome was not representable and none was recorded. This is the atomic-application rule of gate-round clause 5 exercised at its largest cardinality so far, and the cardinality grows again at round 5, where TASK-033 carries five.

### What round 4 resolved, and why that released nothing

Round 4 recorded **eight** findings `resolved` — A-201, A-204, A-205, A-207, A-208, and the long-open A-002, A-003, and A-103 — and left **five** open: **A-202** (High, `not resolved`), **A-203** and **A-206** (High, `partially resolved`), **A-105** (Medium), and the new **A-301** (Low). It is the first round of this lineage to close more than it left open.

It released nothing. A `changes-required` verdict blocks integration whatever its finding count, so TASK-003 through TASK-008, TASK-017, TASK-018, and TASK-026 stay `blocked` and the amendment stays non-integrable. The reduction changes the amount of remaining work, not the state of any gate, and revision 9 says so rather than presenting progress as movement.

**A-202 is the finding that holds the lineage.** The exact `TaskRecordDocumentSource` schema cannot load this repository's own committed task records: the sole committed activation block — TASK-013's — omits a required field and carries thirteen further nested keys the retained-key rule cannot absorb, and 24 of 92 committed gate-relation documents carry three undeclared keys. The fixture is `tasks/**`, which is outside the architect's write scope, so the schema must move to the records rather than the records to the schema.

### Four inherited views, and why they are not four more tasks

TASK-029 recorded **A-004, A-101, A-102, and A-104** as inherited views of the same projection, registration-proof, and result-adoption defects, and stated that they "do not create duplicate implementation obligations". `ACT-008` applied that as written: TASK-032 carries **five** scope items rather than nine, and each view closes with the finding it is a view of. TASK-033 judges each view explicitly on its own evidence rather than inheriting round 4's disposition, and is asked to report if the inherited-view framing itself omitted something. Manufacturing four extra remediation tasks would have contradicted the gate owner's own finding.

### Six satisfied checks did not approve a contract

TASK-029 assessed all six `HUMAN-002` Part B contract properties individually and recorded **every one satisfied**, with ADR-0031 and interface-contract line evidence — and returned `changes-required` anyway, stating that this "does not cure A-202". The `HUMAN-002` collector contract is therefore in the best state it has ever been in and is **still not approved**, because it rides in an amendment A-202 blocks.

That is a third variant of the overclaim finding F-401 originally recorded. First an approval was mistakable for an implementation; then a publication for an approval; now a satisfied subset of checks for the verdict that contains them. `bootstrap_dispatch_contract` still reads `interim-operator-authorized`, `ACT-008` ran under it, and F-401 is not claimed resolved.

### The floor and the source clause moved together — F-601's first live exercise

Finding F-601 required that a raised lineage floor never move without the architecture-source clause moving with it. Round 4's failure is the first event to exercise that rule. `ACT-008` raised the floor from `lineage_round: 4` to `5` and, in the same commit, moved every source statement: nine `normative_architecture_source` fields, nine `exit_condition` fields, nine dependency-edge floors, TASK-026's body restatement, TASK-028's own field, and the graph's reconciliation, normative-source-rule, lineage-edge, module-map, F-401-defect, and ownership-gap passages. `fe0374c` becomes a **fourth** superseded authoring baseline and **no approved architecture source is claimed to exist**.

The clause is deliberately not retargeted to "the TASK-032 commit that TASK-033 approves" on its own, which would reproduce the identical defect one round later if round 5 also fails.

### `MC-009` — two records asserted an independence property `HUMAN-003` had falsified

Re-reading TASK-029 end to end before closing it surfaced a sentence stating "the reviewer is `gpt` and the architect is `claude`". `HUMAN-003` had set the architect assignment to `gpt` at `0b413b7` before TASK-028 was authored, so round 4's author and reviewer were in the **same** family. The graph's gate-assignment section carried the same error as an unqualified blanket claim. Both survived the human's own edit and `ACT-007`.

TASK-029's passage is **struck and quarantined** under the F-402 pattern, because that record closes with a durable verdict; the graph's is rewritten, because it is live normative prose. Neither changes a verdict, an edge, a gate, or a scope, and neither claims round 4 was invalid — execution-context separation is the mandatory guarantee and it held. Nothing in the repository detects a same-family gate pair, and TASK-032 and TASK-033 are both `gpt` too. Whether that needs a check, a recorded control, or an accepted risk is routed to the user.

## Revision 8 — remediation of the TASK-030 round 7 review, and the TASK-028 publication

Revision 8 was applied by **TASK-013 activation `ACT-007`**, which consumed three ingress facts:

- **`HUMAN-003`** at commit `0b413b7`, `seq` 13 — the execution-provider reroute above. The user authored the reroute's task-record effects directly in that commit; `ACT-007` verified them against the records and the settings file and recorded the decision rather than re-applying or extending it.
- **TASK-030 round 7** at commit `f36e6c06`, `seq` 14 — `changes-required` on this decomposition, with fresh findings **F-601** (High), **F-602** (Medium), and **F-603** (Low), **all three Orchestrator-owned**. It recorded F-501, F-502, the Orchestrator-owned half of A-209, F-401's schema half, F-402, F-302, F-203, and F-204 `resolved`; F-403 **`not resolved`**; and F-401's bootstrap half plus the F-301, F-201, and F-104 residuals `partially resolved`.
- **TASK-028** at commit `fe0374c`, `seq` 15 — the third architecture amendment published to `origin` with pull request 15, satisfying `review_ready(TASK-028)`.

The full per-finding disposition register, the lifecycle transition table, the gate closure register, and the verification record are in `tasks/TASK-013-ACTIVATION-LOG.md`, activation `ACT-007`. What follows is the summary; that log is authoritative.

**No gate is closed by this revision, and no verdict was authored by the Orchestrator.** The round-7 verdict is durable and superseded by round 8. TASK-031 decides decomposition round 8; TASK-029 decides architecture lineage round 4. **No implementation task was released:** `gate_passed(LIN-ARCH-REVIEW, review, 4)` is unsatisfied, so TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 stay `blocked`.

### F-601 — nine consumers named a rejected amendment as the source TASK-025 approves

Round 7 recorded this **High**. The lineage floor had correctly risen to `lineage_round: 4`, but the nine consumer records and the graph's live reconciliation section still read *"as amended by `8d0c570` and by the TASK-024 commit that TASK-025 approves"* — and TASK-025 had recorded `changes-required` on `c2ee3eb` at `aa38c7d2`. A correct floor next to a stale source clause would have directed implementation at the rejected artifact if round 4 later passed.

The correction does not merely retarget the clause one round forward, which would reproduce the same defect if round 4 also fails. Every active architecture-source statement now says that **no approved architecture source exists at all**: rounds 1, 2, and 3 rejected `9576fc9`, `8d0c570`, and `c2ee3eb` respectively, each named baseline is a superseded authoring baseline, and an approved source comes into being only when `LIN-ARCH-REVIEW` records a passing or formally accepted authoritative verdict at `lineage_round` 4 or later. The normative-source rule now also states that **the floor and the source clause must move together**, which is the property F-601 found missing.

### F-602 — five resolved review baselines were abbreviated

Round 7 recorded this **Medium**. TASK-020, TASK-021, TASK-022, TASK-023, and TASK-024 declared `review_target_base` values of seven hex characters against a rule requiring a full 40-hex commit. Each now carries the full hash, read with `git rev-parse` rather than asserted, and each resolves to the same commit the abbreviation did. No verdict, review target, or scope-validation base changed. `ACT-007` also recorded, without acting on it, that several `review_target_commit` values remain abbreviated; extending the rule to a field the finding did not name is round 8's call, not the Orchestrator's, and the observation is stated rather than silently omitted.

### F-603 — the ACT-006 append-only evidence claim overstated its delta

Round 7 recorded this **Low**. `ACT-006` claimed its diff against `62d6f2d` contained only additions; `git diff --numstat` reports **203 additions and 3 deletions**. The ledger's actual append-only property holds — rows 1 … 10 and `MC-003` are byte-identical and rows 11 and 12 are genuine appends — but the stronger whole-file claim is false. The correction is recorded as `MC-008` in the activation log, and the `ACT-006` section is deliberately **not** edited: rewriting a closed activation's own account would edit history the log promises not to edit, which is the same reasoning `ACT-006` used when it reverted its own edits to the `ACT-004` and `ACT-005` sections. The trade — a correction a reader finds in the register rather than at the false sentence — is stated explicitly and routed to round 8 to judge.

## Revision 7 — remediation of the TASK-027 round 6 review and the TASK-025 round 3 architecture verdict

Revision 7 was applied by **TASK-013 activation `ACT-006`**, which consumed two independent `changes-required` verdicts:

- **TASK-027 round 6** at commit `710351fd` recorded `changes-required` on this decomposition, with fresh findings **F-501** (Medium) and **F-502** (Low). It recorded F-401's schema half `resolved`, its bootstrap-dispatch half `partially resolved`, F-402 `partially resolved`, F-403 **`not resolved`**, F-303 and F-203 `resolved`, and the F-301, F-302, F-201, F-204, and F-104 residuals `partially resolved`.
- **TASK-025** at commit `aa38c7d2` recorded one `changes-required` verdict applied atomically to `(TASK-024, review, r1)`, `(TASK-016, review, r2)`, and `(TASK-002, review, r3)`, with findings **A-201 … A-207** (High), **A-208** (Medium), and **A-209** (Medium, Orchestrator-owned).

The full per-finding disposition register, the lifecycle transition table, the gate closure register, and the verification record are in `tasks/TASK-013-ACTIVATION-LOG.md`, activation `ACT-006`. What follows is the summary; that log is authoritative.

**No gate is closed by this revision.** Both verdicts are durable and superseded, never rewritten. TASK-030 decides decomposition round 7; TASK-029 decides architecture lineage round 4.

### F-501 — this record's lifecycle and gate summary contradicted the authoritative graph

Four defects, each corrected against the records rather than reworded. The produced-task-graph table said TASK-024 was `ready` and TASK-025 was `blocked` when they were `review` and `ready`; the review-gate section said the gate had been recorded three times when five rounds had durable outcomes; the round table duplicated round 5, marked the duplicate pending, and omitted the open round; and the controlling statement named round 4 and activations 3 through 5 when round 5 and revision 6 were current. All four are corrected below and the table is regenerated in task-ID order so an omission is visible. The frontmatter and the activation log always kept the gate open, so no gate was closed accidentally by the inconsistency.

### F-502 — TASK-027's record overstated its own target diff

The record claimed the target diff contained all 27 task records; `git diff --name-only 890b8e0...70162b0` returns 21 logical paths and 19 task IDs. The target diff and the review scope are now stated as two separate sets in TASK-027's corrected record and in TASK-030's new one. Part B required a 27-record review independently of the diff, and the reviewer performed it and named the eight records outside the delta, so no artifact was omitted and the verdict is unaffected.

### A-209 — TASK-025's declared scope-validation base was not reproducible from its actual provenance

TASK-025's record prescribed creating its branch from `c2ee3eb` and resolving `git merge-base HEAD agent/claude/architect/task-024`. The branch was actually created from the head of `agent/claude/orchestrator/task-013` at `62d6f2d`, so the prescribed expression resolved to `890b8e0` and the acceptance command failed on 21 inherited `ACT-005` paths. The correction records the **actual** immutable branch point `62d6f2d`, verified with `git merge-base` and with `git diff --name-only 62d6f2d...aa38c7d2`, which returns exactly the reviewer's one file. The superseded prescription is retained in the record rather than silently replaced, and **the verdict is untouched**.

### F-403 — the baseline fields were declared on a rule but not applied to the records

Round 6 recorded this `not resolved`: 19 records lacked `review_target_base` and 21 lacked `scope_validation_base`. Revision 7 states an explicit **applicability rule** in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, section "Task baselines", and applies it to every record. Each record now declares one of three things for each field: a resolved 40-hex value read from the repository, a reproducible expression with its `branch_point_of` for a branch that does not exist yet, or **not applicable with a stated reason and a stated becomes-applicable condition**. The rule also corrects a defect the round-6 rule had: `git merge-base <branch> <branch_point_of>` stops returning the branch point once the branch is merged into that ref, so a recorded 40-hex value is the durable fact and the merge-base expression is only its derivation rule at branch-creation time. Every resolved value was verified with `git diff --name-only <base>...<head>` against the owner's declared scope, not asserted. The validator was not weakened and no role's write scope was widened.

### F-402 — the last active body describing the withdrawn owner form

Round 6 found the residue in TASK-016 at two locations: a prose passage calling the owner form live and an acceptance criterion requiring "both forms". Both are struck in place, dated, and marked as history under a quarantine banner at the head of that record. They are struck rather than deleted or reworded because TASK-016 is the authoring brief under which `8d0c570` was published and TASK-020 judged it; rewriting it would change what an independent reviewer was asked to check after they answered. TASK-020's verdict and its A-004 disposition are untouched.

### F-401 — `HUMAN-002` is approved, and the durable observer is routed rather than implemented

The **user approved `HUMAN-002` in the control session on 2026-08-05**, selecting a **Runtime-owned durable pre-dispatch ingress observer and collector**: it lives outside `tasks/**` in the runtime control plane, and before scheduler selection it validates and deduplicates an external source fact, appends the immutable inbox entry through the TASK-026 ingress store, and exposes or signals the new high-water mark to TASK-005 scheduling. TASK-013 consumes entries and records ledger rows and cursor effects and is prohibited from appending its own trigger.

The decision is transcribed verbatim in scope as model correction `MC-006`. Its **contract** is routed to **TASK-028**; its **implementation** to **TASK-026** for the collector and its append path and to **TASK-005** for the observer, predicate, and signal consumption; its **validation** to **TASK-009**, **TASK-010**, and **TASK-011**. **F-401 is still not claimed resolved.** An approval is not an implementation: `activation.bootstrap_dispatch_contract` still reads `interim-operator-authorized`, `ACT-006` itself ran under it, and its exit condition is now the implementation and validation of the approved observer rather than the absence of a decision.

### The TASK-025 architecture verdict

One verdict, three durable gate-verdict facts, all three left **open**. A-201 … A-208 are routed to the new architect-owned amendment **TASK-028**, and **TASK-029** carries `LIN-ARCH-REVIEW` lineage round 4 across four relations. The architecture edge floor held by TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 rises from `lineage_round: 3` to `4`, because the amendment carrying A-201 … A-208 must be the approved one. **No implementation task is released**, and no A-finding is resolved by any publication.

> **Quarantined history.** Every revision section below this line records what an earlier revision did and why. Statements in them describe the graph as it stood at that revision and are superseded by revision 7, by each pair's own frontmatter, and by the registers in `tasks/TASK-001-DEPENDENCY-GRAPH.md`. Where a superseded section names a `gate_class`, `retrospective`, `gate_lineage`, `lineage_round`, a lifecycle state, a round count, or a `gate_passed` form — including the F-303 narrative, which quotes the incorrect value it corrected, and the revision-4 narrative, which describes the since-withdrawn owner form — it is history, not a normative restatement. This is the correction findings F-402 and F-501 each required.

## Revision 6 — remediation of the TASK-023 round 5 review

Revision 6 was applied by **TASK-013 activation `ACT-005`**. TASK-023 round 5 returned `changes-required` at commit `667d3b8` with findings F-401, F-402, and F-403, and recorded F-301, F-302, F-303 and the F-201, F-203, F-204, and F-104 residuals as only `partially resolved`. The same activation also consumed TASK-024's publication of the second architecture amendment at `c2ee3eb`, which is authoring evidence and not a verdict. The full per-finding disposition register, the lifecycle transition table, the gate closure register, and the verification record are in `tasks/TASK-013-ACTIVATION-LOG.md`, activation `ACT-005`. What follows is the summary; that log is authoritative.

**No gate is closed by this revision.** Round 5's verdict is durable and superseded, never rewritten. TASK-027 decides round 6.

### F-401 — The inbox could not represent an unconsumed fact, and bootstrap dispatch was not what the model claimed

Two defects, corrected separately because they fail separately.

The **schema** defect: revision 5 declared one schema for the inbox entry and the ledger row and put `consumed_by` in it, while also requiring an entry to exist before consumption and consumption state to live only in the cursor. Revision 6 splits the schemas. An inbox entry now carries **no consumption field of any kind** and is byte-identical before and after the activation that consumes it; a ledger row is a separate record that references an entry by `seq` and `fact_id` and never writes back to it.

The **dispatch** defect: during bootstrap the consuming activation was both the first durable appender and the consumer, so no durable entry existed before dispatch and the formal predicate could not be what authorized it. Revision 6 stops claiming otherwise. Two disjoint contracts are named — `durable-bootstrap-append`, which requires an authorized durable append outside `tasks/**` before selection, and `interim-operator-authorized`, which is what is in force today and explicitly does **not** claim the durable predicate is operative. TASK-013 declares which one it runs under. The durable bootstrap inbox needs a path no agent role owns, so it is routed to the open human governance decision **HUMAN-002**; the contract half is routed to the next architecture amendment and judged by TASK-025 under its Part D; the store, observer, and validator halves are routed to TASK-026, TASK-005, TASK-009, TASK-010, and TASK-011.

**This finding is not claimed resolved.** `ACT-005` itself ran under the interim contract, and the record says so.

### F-402 — Active bodies contradicted the withdrawn edge form and the single-source rule

Every location round 5 named is corrected. TASK-012's body no longer describes or prints the withdrawn owner form; it names the lineage-form edge in its own frontmatter and the gate-lineage register. TASK-009, TASK-010, TASK-011, TASK-012, TASK-018, TASK-019, TASK-020, TASK-023, TASK-024, TASK-025, and TASK-026 no longer restate a pair's scheduling class, ordering against integration, lineage, or lineage round; each names the register instead. The frontmatter and the two registers remain the only normative values.

### F-403 — A review-diff base is not a scope-validation base

Every record now declares `review_target_base` and `scope_validation_base` as separate fields, with `branch_point_of` naming the branch a task branch was created from. The scope-validation base is the **immutable branch point of the task's own branch**, recorded as a 40-hex commit when the branch exists and as the reproducible expression `git merge-base HEAD <branch_point_of>` when it does not. TASK-023's and TASK-024's resolved branch points were read from the published branches rather than asserted. The validator was not weakened and no role's write scope was widened.

### TASK-024's publication

TASK-024 published the second architecture amendment at `c2ee3eb` with pull request #9. Its record moved to `review`, TASK-025 moved to `ready` on the satisfied `review_ready(TASK-024)` edge with its target bound immutably to `c2ee3eb`, and TASK-025's record gained a Part D for F-401 and an obligation to assess every acceptance criterion TASK-024 declares. **No architecture finding is resolved by that publication.** TASK-002's and TASK-016's review gates stay open, and every implementation consumer stays `blocked`.

## Revision 5 — remediation of the TASK-022 round 4 review

Revision 5 was applied by **TASK-013 activation `ACT-004`**. TASK-022 round 4 returned `changes-required` at commit `e8eb23d` with findings F-301, F-302, and F-303, and recorded F-201, F-203, F-204, and the F-104 residual as only `partially resolved`. The same activation also consumed TASK-020's `changes-required` verdict at `4874a9d`, which is why this revision creates an architecture remediation task as well. The full per-finding disposition register, the lifecycle transition table, the gate closure register, and the verification record are in `tasks/TASK-013-ACTIVATION-LOG.md`, activation `ACT-004`. What follows is the summary; that log is authoritative.

**No gate was closed by revision 5.** Round 4's verdict is durable and superseded, never rewritten. TASK-023 decided round 5 and returned `changes-required`.

### F-301 — The ingress count was not a monotonic, one-to-one consumption cursor

Revision 4 fixed the *producer* and left the *cursor* wrong. `ingress_seq` was the **count** of matching facts reachable from mutable refs, ordered by committer timestamp, so a backdated commit inserted below the cursor and the old tail replayed while the new fact was skipped; deleting a branch lowered the count below the cursor; a commit matching several classes had no rule; the ledger applied an unstated selection policy that made `ingress_seq = 5` irreproducible; and this task graph's own activation commits matched `remediation_completed`, so quiescence could never be demonstrated.

The observation rule is replaced, not patched. `ingress_seq` is now `max(seq)` over a durable append-only **ingress inbox** whose entries carry a `seq` assigned **once** at append, a `fact_id` content hash as identity, and a `content_hash` over the source artifact. Identity-keyed deduplication, class precedence yielding at most one entry per commit, batch ordering by source commit identifier rather than by clock, retention that outlives the producing ref, and explicit exclusion of the Orchestrator's own commits are all normative. Ingress epochs let the irreproducible epoch-1 rows be sealed as history rather than renumbered, so no existing ledger row is edited.

The store and its adapters are routed to new task **TASK-026** at `src/orchestrator/ingress/**`; the observer, predicate, cursor, and one-commit rule stay with **TASK-005**; the contract representation is **TASK-024**; and the six failure modes the finding named are tests `V11-F301-STORE` and `V11-F301-CLASS` on **TASK-011**, with the static half on **TASK-009** and fact authenticity on **TASK-010**.

### F-302 — A failed verdict permanently blocked a downstream consumer across a new-task round

The owner form of `gate_passed` bound an edge to one gate task. Because a `changes-required` verdict is durable and a superseding round must be a **new** task, TASK-012's edge on TASK-011 could never be satisfied once TASK-011 recorded `changes-required` — a constructed deadlock that also stalled TASK-005, TASK-006, and TASK-008 permanently.

The owner form is **withdrawn** and rejected at load time. It is replaced by the **lineage form**, which names a durable `(gate, cohort)` relation rather than one of its rounds and is satisfied when that lineage's authoritative verdict is passing at a lineage round at or above the edge's floor. Eight lineages are registered, every gate pair declares `gate_lineage` and `lineage_round`, and new invariant 8 makes lineage well-formedness machine-checkable. TASK-012's edge and the nine architecture edges are retyped, so neither has to be retargeted again when a round is superseded.

**Immutable gate history is not weakened.** Gate-round rule clause 4 is unchanged; every superseded verdict stays recorded with its round, its commit, and its `remediated_by` and `revalidated_by`. The lineage only names which round is currently authoritative.

### F-303 — Three active record bodies contradicted their own gate metadata

This record, TASK-021's, and TASK-022's each asserted `retrospective: false` for TASK-001's review gate while the frontmatter, the register, and the invariant-7 recomputation all said `true`, because TASK-001 declares `pre_merge_gates: []`.

All three are corrected **and** the duplication that produced them is removed. A pair's `gate_class`, `retrospective`, `gate_lineage`, and `lineage_round` are now normative in the pair's own frontmatter and in the aggregate and retrospective gate register, **and nowhere else**; a record body may name the register but may not restate the value.

### A-101 through A-105 — architecture findings

All five are routed to **TASK-024**, a new architect-owned amendment: the revision-5 scheduling and ingress vocabulary (A-101), a durable process-registration handshake before the worker-owned spawn (A-102), durable workspace intent before any side effect (A-103), a recoverable adopted worker result (A-104), and diagrams that agree with the normative contracts (A-105). **TASK-025** records `LIN-ARCH-REVIEW` lineage round 3 across three relations.

### What revision 5 did not do

No gate was closed. Two verdicts were *recorded* from two reports, both `changes-required`, so every relation they touch stays open. No verdict was authored by the Orchestrator. No architecture, source, report, or governance file was touched. TASK-023 and TASK-025 are new reviewer tasks in separate execution contexts, and neither reviews an artifact it authored or previously reviewed.

## Revision 4 — remediation of the TASK-021 round 3 review

Revision 4 was applied by **TASK-013 activation `ACT-002`**. TASK-021 round 3 returned `changes-required` at commit `adfb982` with findings F-201 through F-205, and recorded F-101 and F-104 as only `partially resolved`. The full per-finding disposition register, the lifecycle transition table, the gate closure register, and the verification record are in `tasks/TASK-013-ACTIVATION-LOG.md`, activation `ACT-002`. What follows is the summary; that log is authoritative.

**No gate is closed by this revision.** Round 3's verdict is durable and superseded, never rewritten. TASK-022 decides round 4.

### F-201 — TASK-013 had no event producer that could wake its quiescent activation

The dispatch signal was a row in a log that only TASK-013 may write, so after TASK-021 recorded its verdict nothing could wake TASK-013 and TASK-001's gate could never close. The same log declared its rows immutable while requiring TASK-005 to set `consumed_by` later, which is an edit.

The model is replaced, not patched. Three surfaces are now separate: the **ingress fact**, a durable Git-observable fact each owner creates by doing its own job inside its own write scope; the **cursor** in TASK-013's frontmatter; and the **consumption ledger**, written by the consuming activation, append-only, one row per consumed fact, never edited. Dispatch is `ingress_seq > cursor`, where `ingress_seq` is computed by an observer over a closed, deterministically ordered ingress source set — not read from a file TASK-013 owns. The producer is therefore no longer TASK-013, which is what removes the deadlock structurally. TASK-021's own publication of `adfb982` and pull request #2 is the ingress fact that woke this activation.

Observer implementation, deterministic ordering, cursor validation, and the one-commit rule are routed to **TASK-005**. The end-to-end publication → ingress → dispatch → effects → cursor → quiescence test is routed to **TASK-011** as `V11-A004-ACT`. Contract representation stays in **TASK-016** scope item 4 and is checked by **TASK-020**. In the bootstrap phase the observer is the human operator who launches each CLI session — the same operator-driven scheduler that dispatches every bootstrap task, with a named exit when TASK-005 integrates.

### F-202 — The amended-behavior coverage matrix was not backed by the validator contracts

The matrix claimed independent validation that no validator's acceptance criteria required. Eighteen tagged, explicitly named criteria with expected artifacts were added: **TASK-009** gained `V9-A001`, `V9-A002`, `V9-A004-EDGE`, `V9-A004-LOCK`, `V9-A004-ACT`, and `V9-F105`; **TASK-010** gained `V10-A003-CTL`, `V10-A003-TREE`, `V10-A004-LOCK`, `V10-F105`, and `V10-TOOLCHAIN`; **TASK-011** gained `V11-A001`, `V11-A002`, `V11-A003-CTL`, `V11-A003-TREE`, `V11-A004-EDGE`, `V11-A004-LOCK`, `V11-A004-ACT`, and `V11-F105`. The matrix now cites the exact obligation for every amended behavior, and states that an implementing task's own unit tests never satisfy the validation column.

The normative-source rule was added to the graph and applied to TASK-003 through TASK-008, TASK-017, and TASK-018: the normative architecture is `9576fc9` **as amended by the TASK-016 commit that TASK-020 approves**, never the rejected baseline alone.

### F-203 — Most gate owners are not schedulable when their target publishes

The claim that every gate owner is schedulable at its target's publication, and that TASK-018's security gate is the only retrospective case, were both false. Two independent declared properties replace them on every gate pair: `gate_class` (`point` or `aggregate`, computed from the owner's dependency set) and `retrospective` (true when the gate is not in the target's `pre_merge_gates`). New invariant 7 makes both machine-checkable, and every delayed gate has a register entry with its reason and its recorded risk. TASK-018 security is one of five register entries. The alternative of splitting each aggregate gate into per-target gates is rejected with its rationale recorded, because a per-target reviewer cannot check the cross-module properties the gate exists for.

The property the graph still keeps, and states, is narrower and true: **a pre-merge gate owner is always `point`.**

### F-204 — TASK-012 accepted any QA verdict although its exit condition required a passing baseline

`gate_passed` gained an owner form, `{task: G, edge: gate_passed, gate: <name>, round: <n>}`, satisfied only by a passing or formally accepted verdict from gate task G. New invariant 6 makes the target and owner forms unambiguously resolvable and rejects an ambiguous edge at load time. TASK-012's dependency changed from `gate_recorded(TASK-011)` to `gate_passed(TASK-011, qa, 1)`, and the frontmatter, graph edge table, ownership table, wave note, exit condition, and TASK-011's record were all brought into agreement. TASK-005's validator gained the invariant 6 obligation.

### F-205 — Gate-round records contradicted their own cardinality rules

TASK-001's round-1 `gate_tasks` entry gained `revalidated_by: TASK-014 round 2`, and TASK-014's and TASK-015's `gate_for` entries gained the matching `remediated_by` and `revalidated_by`. One cardinality model was chosen and stated in every place that describes it: **one review produces exactly one verdict, applied atomically to every gate relation the reviewer carries, yielding one durable gate-verdict fact per relation.** Gate-round rule clause 5 states it, and TASK-020's scope, acceptance criteria, and gate section were rewritten to match. The "records two verdicts" wording is gone.

### F-101 and F-104 residuals

TASK-019's review-target prose no longer says the toolchain merges to or is compared against `main`. The bootstrap publication contradiction is resolved by a declared `publication_class`: a `bootstrap` task's `local-only` publication satisfies `review_ready` for that task as a named recorded limitation and never satisfies `review_ready` for a `runtime`-class task, for which an unavailable remote is a `blocked` outcome. F-104's unexecutable half is resolved jointly with F-201.

### What revision 4 did not do

No gate was closed. No verdict was authored by the Orchestrator. No independent gate was marked passed. No architecture, source, report, or governance file was touched. TASK-022 is a new reviewer task in a separate execution context and reviews no artifact it authored.

## Revision 3 — remediation of the TASK-014 round 2 and TASK-015 round 1 reviews

Revision 3 was applied by **TASK-013 activation `ACT-001`**, not by a new TASK-001 execution. TASK-013 is the exclusive owner of every task-record mutation in this graph, which is the correction revision 2 made for finding F-007. The full per-finding disposition register, the lifecycle transition table, the gate closure register, and the verification record are in `tasks/TASK-013-ACTIVATION-LOG.md`. What follows is the summary; that log is authoritative.

Two independent verdicts drove this revision, and neither is closed by it:

- **TASK-014 round 2** returned `changes-required` at commit `abb85d9` with findings F-101 through F-105.
- **TASK-015 round 1** returned `changes-required` at commit `8632469` with findings A-001 through A-004.

### F-101 — Review-ready and merged-to-main were conflated

`implementation_published` required the target to be merged to `main`, but TASK-015 and TASK-019 must review before their targets merge. Gate waited for merge while merge waited for gate.

The edge is replaced by two typed conditions with distinct satisfying states: **`review_ready`**, an immutable published commit while the branch is unmerged, which is the readiness edge for a gate task; and **`integrated`**, which additionally requires every gate in the target's new **`pre_merge_gates`** declaration to be closed and the branch to be merged into the integration branch. A blanket "all gates before merge" rule would have reintroduced the cycle between TASK-003, TASK-005, and TASK-009; the graph states that derivation explicitly. Every frontmatter edge, exit condition, wave, and body reference across TASK-003 through TASK-021 was rewritten into the new vocabulary, and the no-deadlock invariant grew from three parts to five so that acyclicity is proven across scheduling, gate, and integration preconditions together.

### F-102 — TASK-015 round 2 had no TASK-016 scheduling dependency

Re-entrancy is removed as a mechanism. A recorded verdict is durable and is superseded, never rewritten, and **each superseding round is a new task with its own explicit dependency**. TASK-015's `rounds` block was deleted, its `gate_for` reduced to TASK-002 round 1, and its record moved to `done`. **TASK-020** now reviews the TASK-016 amendment with an explicit `review_ready(TASK-016)` dependency, and also carries TASK-002's review gate at round 2 because TASK-016 is the remediation for TASK-015's verdict. `gate_tasks` and `gate_for` gained a `round` field, defaulting to 1.

### F-103 — TASK-018 was stale after HUMAN-001 was applied

Commit `fb9f45c` resolved HUMAN-001 with option A. TASK-018's four requested paths moved into its declared `write_scope`, `requested_write_scope_extension` was deleted, the `human_decision(HUMAN-001)` edge was removed, the decision commit was recorded as evidence, and its `blocked_reason` and `exit_condition` were narrowed to the one legitimate remaining precondition — the architecture gate. No task in the graph carries a `human_decision` edge any longer.

### F-104 — Recurring TASK-013 had no quiescent activation state

TASK-013 gained a durable monotonic event log at `tasks/TASK-013-ACTIVATION-LOG.md`, a cursor `activation.last_consumed_event_seq`, a dispatch condition `max(event.seq) > cursor`, a `quiescent` state when they are equal, a closed six-member `event_type` set, an exactly-once consumption rule based on writing effects and cursor advance in one commit, and a starvation bound. Its record moved from `ready` to `blocked` with a `blocked_reason` and `exit_condition` naming the cursor. Implementation and six named tests — idle quiescence, exactly-once consumption, crash between dispatch and cursor advance, monotonic cursor, no starvation, and no continuous redispatch — are routed to **TASK-005**. Contract representation is routed to **TASK-016** scope item 4.

### F-105 — Workspace automation stopped before branch publication and PR creation

**TASK-017** gained branch publication, idempotent pull-request creation, durable branch/commit/pull-request identity persisted before lock release, and an explicit `blocked` outcome with a typed failure class when the remote or credentials are unavailable — each with a named test, including a push-refspec assertion that no path can target `main`. The graph's `review_ready` definition now names publication explicitly, and records the current bootstrap limitation honestly: every branch to date is `publication: local-only` because the executing sessions were instructed not to push.

### A-001 through A-004 — architecture findings

All four are routed to **TASK-016**, which was reframed from a workspace-lifecycle-only amendment into the single architecture amendment carrying crash-atomic journal batches (A-001), legal recovery transitions (A-002), live run control and OS process-tree ownership (A-003), typed gate, resource-lock, and recurring-event contracts (A-004), and the workspace lifecycle module. It remains one owner, one write scope, and one `architecture-docs` lock. Its dependency changed from `gate_passed(TASK-002)` — unsatisfiable, since TASK-015 returned `changes-required` — to `gate_recorded(TASK-015)`, which is satisfied, so TASK-016 is `ready`. Because the approved architecture is `9576fc9` as amended, the architecture-approval edge held by TASK-003 through TASK-008, TASK-017, and TASK-018 was retargeted to `gate_passed(TASK-016, review)`.

### What revision 3 did not do

No gate was closed. No verdict was authored by the Orchestrator. No independent gate was marked passed. No remediation routes work back to the execution context that reviewed it: TASK-020 and TASK-021 are new reviewer tasks, and neither reviews an artifact it authored or previously reviewed.

## Revision 2 — remediation of the TASK-014 round 1 review

Retained as history. TASK-014 round 2 reviewed this revision and returned `changes-required`; its round 1 dispositions are recorded in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`. Statements below describe the graph as it stood at revision 2 and are superseded where revisions 3 and 4 changed them. They are **not** current claims about the graph.

Three statements in this section are known to be false of the current graph and are named here so no reader mistakes them for live claims:

- The F-002 passage says every `required_gates` entry has an owner "schedulable when its target publishes, with one deliberate and stated exception: TASK-018's security gate". Finding **F-203** recorded that as false. Revision 4 replaced it with declared `gate_class` and `retrospective` properties on every gate pair and a register of six delayed gates; see `tasks/TASK-001-DEPENDENCY-GRAPH.md`, section "Gate scheduling classes".
- The F-002 passage describes the toolchain landing on `main`. It lands on `integration/autonomous-runtime`; `main` is reached only through a human-approved pull request.
- The F-002 passage calls TASK-015 re-entrant across two rounds. Finding **F-102** removed re-entrancy; TASK-015 is `done` with one durable verdict and TASK-020 carries round 2.

TASK-014 round 1 returned `changes-required` in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`, commit `8ac0dbd`. Every finding is addressed below. The dispositions are the author's claims; TASK-014 round 2 decides whether they hold.

### F-001 — High — Mandatory isolated worker lifecycle unassigned

Created **TASK-017**, owned by `runtime` / `claude`, scoped to `src/orchestrator/workspace/**` and `tests/unit/orchestrator/workspace/**`. It owns hook verification and installation, branch and worktree creation, task-lock claim, execution inside the worktree, write-scope validation before handoff, durable commit and handoff persistence, lock release on every terminal path, and crash-safe reconciliation of orphaned worktrees, branches, and locks. It invokes the existing human-controlled PowerShell orchestration scripts and is explicitly forbidden from modifying, wrapping around, or reimplementing them.

Because the TASK-002 module map has no owner for this responsibility, the architecture must be amended first. Created **TASK-016**, owned by `architect` / `claude`, to add the seventh module, its interface contract, its crash-safe cleanup specification, and ADR-0011. This routing follows the contract change control procedure in `docs/architecture/runtime/INTEGRATION-STRATEGY.md`. TASK-017 carries `gate_passed(TASK-016)`; TASK-006 and TASK-008 carry `implementation_published(TASK-017)`.

TASK-017 also carries explicit safety criteria: it cannot push to `main`, cannot set `ALLOW_MAIN_PUSH`, cannot force-release another session's lock, cannot write a governance path, and cannot derive a branch or path from agent output.

### F-002 — High — TASK-002's review gate had no owner

Created **TASK-015**, owned by `reviewer` / `gpt`, scoped to `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`. It reviews all 25 files of commit `9576fc9` against TASK-002's own acceptance criteria and records the verdict that satisfies `gate_passed(TASK-002)`. It is re-entrant: round 1 gates TASK-002, round 2 gates the TASK-016 amendment.

Applying the finding's general lesson rather than only its stated instance, the gate table in the dependency graph was then built for the whole graph and revealed a second instance of the same defect: TASK-018 merges at Wave 2 but its review gate would have been owned by TASK-009 at Wave 7, leaving an unreviewed toolchain on `main` while three tasks compiled against it. Created **TASK-019**, owned by `reviewer` / `gpt`, scoped to `reports/code-review/TASK-018-TOOLCHAIN-REVIEW.md`, dispatchable as soon as TASK-018 publishes. Every `required_gates` entry in the graph now has an owner that is schedulable when its target publishes, with one deliberate and stated exception: TASK-018's security gate is retrospective at TASK-010, because no code exists to threat-model before a toolchain exists.

### F-003 — High — Dependency and gate readiness formed an unschedulable cycle

Introduced a typed edge vocabulary — `gate_passed`, `implementation_published`, `gate_recorded`, `terminal`, `human_decision` — each with one satisfying condition, plus a separate `gate_for` / `gate_tasks` reverse relation that is explicitly **not** a scheduling edge. Dispatchability and doneness are now evaluated over two different edge sets pointing in opposite directions.

Stated the no-deadlock invariant in three parts, verified this graph against it with an explicit topological order, and assigned enforcement to **TASK-005**, whose scope and acceptance criteria now require ready-task selection over typed edges, load-time rejection of an invalid graph, and a no-deadlock test over the full TASK-001 graph. Every record's `dependencies` field was rewritten into the typed form and every `exit_condition` restated accordingly.

### F-004 — High — Consumers and QA could run before TASK-004 completed

Added the missing edges rather than introducing an integration milestone, because the dependency is a compile-time import of `src/agents/contracts/` in each case:

| Task | Added edge | Reason |
|---|---|---|
| TASK-005 | `implementation_published(TASK-004)` | Consumes the worker result and work assignment contract |
| TASK-006 | `implementation_published(TASK-004)` | Invokes agent workers |
| TASK-008 | `implementation_published(TASK-004)` | Retry policy is defined over `DISPOSITION_BY_CLASS` |
| TASK-011 | `implementation_published` on TASK-003, TASK-004, TASK-005, TASK-006 | Previously depended only on TASK-007 and TASK-008 and claimed the rest transitively, which never implied TASK-004 |

TASK-011's exit condition no longer infers dependencies from another task's dependency list, and its acceptance criteria now require coverage to be stated per named dependency. TASK-009, TASK-010, and TASK-011 additionally gained `implementation_published(TASK-017)`. The waves were re-derived from the new edges.

### F-005 — Medium — Declared write scopes overlapped despite the non-overlap invariant

One overlap eliminated by path: **TASK-009's scope was narrowed** from `reports/code-review/**` to `reports/code-review/REVIEW.md` and `reports/code-review/runtime/**`, making it disjoint from TASK-014's, TASK-015's, and TASK-019's single files. The four reviewer-owned tasks are now mutually path-disjoint by construction, and no sequencing assumption remains.

Two overlaps are real and are now honestly serialized rather than described as disjoint. TASK-001 and TASK-013 both own `tasks/**`; TASK-002 and TASK-016 both amend the architecture documents. Each pair declares a machine-readable `resource_lock` field — `task-records` and `architecture-docs` — with four stated semantics, and **TASK-005 must enforce resource-lock exclusion at admission alongside write-scope exclusion**. The dependency graph no longer claims that no two tasks share a scope; it states which two pairs do and what serializes them.

### F-006 — High — TASK-004 could pass without implementing the three configured providers

Rewrote TASK-004. It now names `claude`, `gpt`, and `gemini` as required deliverables with a table mapping each to the roles that depend on it, and defines adapter-level acceptance criteria in five groups: command discovery with an override-then-`PATH` resolution order across Windows and POSIX; deterministic non-interactive invocation construction with the worktree as working directory and no credential in the argument vector; cancellation that terminates the child process tree within the timeout bound; result parsing with an exhaustive classification table over the closed ten-member taxonomy; and a `diagnose()` capability reporting executable presence, resolved path, version, and credential variable names only.

Committed tests remain offline: provider processes are exercised through an injected process-spawn interface with fakes and local script fixtures. A real-provider smoke check is opt-in, non-default, and excluded from CI. TASK-009, TASK-010, and TASK-011 each gained a matching verification obligation, so an adapter set that satisfies only the registry abstraction is a finding rather than a pass.

### F-007 — High — Lifecycle-update instructions required out-of-scope task-record edits

Every instruction telling a non-Orchestrator role to move a task record or edit its `status` was removed, from both the graph's operational notes and TASK-014's operational steps. Every task record gained a "Task-record lifecycle" section stating that its `status` and directory are changed only by the Orchestrator, and that the owner records its handoff in its commit message, pull request description, and role report instead. Each record's Handoff section is now labelled as Orchestrator-maintained.

**TASK-013 was reworked** from a single-shot end-of-run task into the recurring owner of every task-record mutation, retitled accordingly, moved from `blocked` to `ready`, and given no scheduling dependencies — because its first transition, unblocking TASK-003 and TASK-004 after TASK-015 passes, happens before any implementation runs. It carries a trigger table and an acceptance criterion that `git log --follow` over `tasks/` shows only `agent/claude/orchestrator/*` branches for the whole run. The dependency graph states per-actor what may and may not be written.

### Reconciliation with Architect commit 9576fc9

Beyond the seven findings, the graph was reconciled with the completed TASK-002 architecture:

- The six-module map, its source paths, and its owner tasks were checked against the write-scope partition; they agree.
- The two contract roots and the contract change control rule were restated in TASK-003 and TASK-004, and TASK-009 must verify both roots against `INTERFACE-CONTRACTS.md` by diff.
- The architecture's integration and merge order became the wave order.
- Both ownership gaps the architect recorded but could not close are now nodes in the scheduling graph: the toolchain as **TASK-018** and the workspace lifecycle as **TASK-016** plus **TASK-017**.

### Item requiring a human decision — HUMAN-001

TASK-018 needs `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**`. None is inside the devops role's configured `write_scope`, and `config/agents/settings.yaml` is a human-controlled governance path that no agent branch may change. The task therefore declares only the paths devops may write today, lists the rest under `requested_write_scope_extension`, and carries a `human_decision(HUMAN-001)` edge with three options and a recommendation. **Wave 3 cannot start until a human records that decision.** The Orchestrator cannot resolve it without either editing a governance file from an agent branch or declaring a scope the validator rejects.

## Review gate

This task declares `required_gates: [review]`. The gate has recorded **seven** verdicts across seven rounds, every one of them `changes-required`, and round 8 is open. The gate therefore remains **open**.

The table below has exactly one row per round of `LIN-DECOMP-REVIEW`, in round order, with no duplicate and no omission — the defect finding **F-501** recorded was a duplicated round 5 marked pending in place of the open round. It is regenerated from this record's `gate_tasks` frontmatter, which is normative.

| Round | Owner | Artifact | Verdict | Commit |
|---|---|---|---|---|
| 1 | TASK-014, `reviewer` / `gpt` | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md` | `changes-required`, F-001 … F-007 | `8ac0dbd` |
| 2 | TASK-014, `reviewer` / `gpt` | same file, round 2 section | `changes-required`, F-101 … F-105 | `abb85d9` |
| 3 | TASK-021, `reviewer` / `gpt` | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md` | `changes-required`, F-201 … F-205 | `adfb982` |
| 4 | TASK-022, `reviewer` / `gpt` | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md` | `changes-required`, F-301 … F-303 | `e8eb23d` |
| 5 | TASK-023, `reviewer` / `gpt` | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-5.md` | `changes-required`, F-401 … F-403 | `667d3b8` |
| 6 | TASK-027, `reviewer` / `gpt` | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-6.md` | `changes-required`, F-501 … F-502 | `710351fd` |
| 7 | TASK-030, `reviewer` / `gpt` | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-7.md` | `changes-required`, F-601 … F-603 | `f36e6c06` |
| 8 | TASK-031, `reviewer` / `gpt` | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-8.md` | **pending** — the open round | — |

Under the gate-round rule in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, the gate's status is the verdict at its highest round, and an earlier verdict is superseded rather than rewritten. TASK-014 recorded both of its rounds and its record is `done`; TASK-021 recorded round 3, TASK-022 round 4, TASK-023 round 5, TASK-027 round 6, and TASK-030 round 7, and all five records are `done`. Each superseding round is a separate task rather than a re-entry, which is the correction applied to TASK-015 under finding F-102. Every round belongs to the same registered gate lineage; the gate-lineage register in `tasks/TASK-001-DEPENDENCY-GRAPH.md` is the normative statement of its rounds.

**Round 7 is the currently authoritative round**, and its verdict states plainly that **TASK-001 may not reach `done`**. It may not move to `tasks/done/` until a round of `LIN-DECOMP-REVIEW` records a passing authoritative verdict. No Claude Orchestrator execution may close that gate — including the TASK-013 activations that authored revisions 3 through 8.

The gate relation is recorded as `gate_for` on TASK-014, TASK-021, TASK-022, TASK-023, TASK-027, TASK-030, and TASK-031 and as `gate_tasks` on this record, with matching rounds. Each pair's `gate_class`, `retrospective`, `gate_lineage`, and `lineage_round` are declared in those frontmatter entries and summarized in the aggregate and retrospective gate register in `tasks/TASK-001-DEPENDENCY-GRAPH.md`; this body does not restate them, which is the correction findings **F-303** and **F-402** required. It is not a scheduling edge, which is why each round's owner is dispatchable while TASK-001 is still in `review`. The round 8 review target is the `ACT-007` effects commit on `agent/claude/orchestrator/task-013`, compared against review-diff base `443ff9b`; the superseded round 7 target was `83c1e03` with follow-up head `e7bd748` against `62d6f2d`, round 6 reviewed `70162b0` with follow-up head `62d6f2d` against `890b8e0`, round 5 reviewed `ac9c8f2` with follow-up head `890b8e0` against `c325275`, round 4 reviewed `f590749` with follow-up `4f8a1cc` against `c325275`, and round 3 reviewed `5febe3b` against `049158d`.

## Handoff

- Commit or pull request: recorded on branch `agent/claude/orchestrator/task-001`. No push and no merge were performed by this execution.
- Verification:
  - `scripts/orchestration/claim-task.ps1 -TaskId TASK-001 -Role orchestrator -Llm claude` succeeded and the lock was held for the whole edit.
  - `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef governance/autonomous-runtime-bootstrap` reported `valid = true` with every changed path inside `tasks/**`.
  - `scripts/ci/validate-framework.ps1` and `scripts/ci/test-orchestration.ps1` passed.
  - Each record was rechecked for a single owner, a single LLM family, a typed dependency list, acceptance criteria, gates, artifacts, branch, worktree, and a write scope that is a subset of its role's configured scope in `config/agents/settings.yaml`.
  - The 19-node graph was checked against the no-deadlock invariant by constructing a topological order and confirming that no gate task holds a `gate_passed` or `terminal` edge to a task it gates.
  - Every `gate_for` entry was checked against the corresponding `gate_tasks` entry. This check is what surfaced the unowned TASK-018 review gate, which is why TASK-019 exists.
  - Every declared write scope was compared pairwise; the only remaining overlaps are the two resource-lock pairs.
- Known risks, updated at revision 3:
  - ~~**TASK-018 blocks Wave 3 and only a human can unblock it.**~~ Resolved. HUMAN-001 was recorded at `fb9f45c` with option A. TASK-018 now blocks only on the architecture gate.
  - ~~TASK-016 amends an architecture that has not yet passed TASK-015.~~ Realized. TASK-015 round 1 returned `changes-required`, and TASK-016's scope did change: it was reframed to carry A-001 through A-004 as well as the workspace lifecycle module, and its dependency changed to `gate_recorded(TASK-015)`.
  - The two resource locks are declared in task records and specified in the dependency graph, but nothing enforces them today. `validate-write-scope.ps1` and `claim-task.ps1` enforce per-task scope and per-task-ID locking, not cross-task resource locks. Until TASK-005 implements admission-time enforcement, the locks depend on the Orchestrator not claiming both tasks of a pair at once. This is a smaller gap than revision 1's prose sequencing, but it is not zero, and the user may wish to route a separate task to extend the orchestration scripts — which are governance-controlled and cannot be changed from an agent branch.
  - The validation tasks depend on `gpt` and `gemini` assignments being available. If a family is unavailable, the affected gate must be reassigned by the user before its wave starts, since an author may not review their own change.
  - Runtime task write scopes name directories such as `src/orchestrator/workspace/` that do not exist yet; the owning task creates them.
  - TASK-014 recorded its round 2 dispositions on F-001 through F-007: five `resolved`, two `partially resolved`. TASK-021 recorded its round 3 dispositions on F-101 through F-105: three `resolved`, two `partially resolved`, both of which `ACT-002` closed out. The revision dispositions in this record are the author's claims and carry no gate authority. The same applies to revision 4's claims, which TASK-022 decides.
  - ~~Revisions 3 and 4 presume the shape of an amendment TASK-020 has not yet approved.~~ Realized. TASK-020 returned `changes-required` at `4874a9d` and judged A-004 `not resolved`, so the amendment does **not** yet represent the scheduling or ingress vocabulary. Revision 5 responds by retyping the architecture edge to the `LIN-ARCH-REVIEW` lineage, which no longer has to be retargeted per amendment, and by routing the contract representation to TASK-024. TASK-023 is asked to report whether any residual presumption remains.
  - ~~Two High architecture findings, A-102 and A-103, say that process registration and workspace intent cannot be made durable before their side effects. Until TASK-025 records a passing verdict, this graph's assumption that a crash leaves discoverable durable intent is unproven.~~ **Realized and widened at revision 7.** TASK-025 recorded `changes-required` at `aa38c7d2`, judging A-102 `not resolved` and A-103 `partially resolved`, and adding **seven** further High findings, A-201 … A-207. Seven High architecture defects now stand between this graph and any implementation wave. The exposure is no longer "unproven"; it is recorded, and it is routed to TASK-028.
  - **Nine of this graph's tasks depend on an architecture lineage that has never passed.** `LIN-ARCH-REVIEW` has recorded `changes-required` at every one of its **four** rounds. The edge floor rises to `lineage_round: 7` at revision 13, so TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 now wait on TASK-037, which waits on TASK-036. **`LIN-ARCH-REVIEW` has recorded `changes-required` at every one of its six rounds.** Round 6 is the first to resolve every finding routed to it — A-202, A-105, A-401, and A-402 all `resolved`, with the A-004, A-101, and A-104 residues closing — and it released nothing, because five fresh High findings, A-501 … A-505, opened from a target-wide re-read. **Round 6 also recorded A-506 against this record's own dependency graph**, an Orchestrator-owned staleness that revision 11 introduced by moving the architecture floor in the nine consumer records but not in the graph's typed-edge register, invariants, or ownership table. `ACT-012` remediated it; its independent review is a recorded obligation for `LIN-DECOMP-REVIEW` round 9, which cannot be created until round 8 reports. **`LIN-ARCH-REVIEW` has now recorded `changes-required` at every one of its five rounds**, and each failing round adds a wave of latency to every downstream task. Round 5 closed three of the five findings it was given — A-203, A-206, and A-301 — and closed the A-102 inherited view outright, which is the largest reduction any round of this lineage has produced. It released nothing, because a `changes-required` verdict blocks integration whatever its finding count, and two fresh High findings, A-401 and A-402, opened alongside. **The open set changed composition rather than shrinking**, and two of its four members are consistency defects between the architecture and this graph — a class `MC-011` records as structurally hard for an architect to avoid, because the architect cannot write `tasks/**` and the Orchestrator changes it at every activation.
  - The ingress inbox that makes TASK-013's cursor a position is specified and routed to TASK-026 and TASK-005 but is not executable yet, and the pre-dispatch observer `HUMAN-002` approved is routed to TASK-028, TASK-026, and TASK-005 but is neither implemented nor validated. Until then the operator performs both discovery and the dispatch decision. Identity, position, deduplication, and the cursor are durable and do not depend on that substitution, but **the exposure is not confined to liveness**: under `interim-operator-authorized` the dispatch predicate itself is not what authorized the dispatch, and finding F-401 recorded that the earlier liveness-only claim was false. That correction is why this risk is stated this way.
  - Epoch 1 of the consumption ledger is retained as history and is not reproducible under its own rule. That is recorded in `MC-003` rather than repaired by editing rows the log promises never to edit.
  - The baseline applicability rule added at revision 7 is checked only by the Orchestrator at each activation and by each review round. Nothing rejects a record that declares a field "not applicable" without a real reason until TASK-005's graph validator lands.
- Next owner: **reviewer / gpt for TASK-039**, `LIN-ARCH-REVIEW` round 8, `ready` and dispatchable now on the satisfied `review_ready(TASK-038)` edge at `8ea5c32`. It records **one** verdict applied atomically to **eight** relations and decides whether nine implementation tasks may leave `blocked`; it must judge A-601 by executing the full prescribed integration order itself. **Reviewer / gpt for TASK-031**, round 8 of this record's own review gate, remains `ready` and dispatchable in parallel, unchanged. **TASK-038 is `review`** at `8ea5c32`, unjudged and not integrable. **The A-506 review obligation is unchanged**; the unreviewed-effects backlog now spans `ACT-008` … `ACT-015`. The superseded `ACT-014` statement read: **architect / gpt for TASK-038**, the seventh architecture amendment, `ready` on the satisfied `gate_recorded(TASK-037)` edge at `9bb75d9`. It carries the single finding A-601 and holds the free `architecture-docs` lock as its eighth registered holder. **Reviewer / gpt for TASK-031**, round 8 of this record's own review gate, remains `ready` and dispatchable in parallel, unchanged. **Reviewer / gpt for TASK-039** performs `LIN-ARCH-REVIEW` round 8 over **eight** relations and is `blocked` until TASK-038 publishes. **The A-506 review obligation is unchanged**; round 7 explicitly declined to adjudicate it, and the unreviewed-effects backlog now spans `ACT-008` … `ACT-014`. The superseded `ACT-013` statement read: **reviewer / gpt for TASK-037**, `LIN-ARCH-REVIEW` round 7, `ready` on the satisfied `review_ready(TASK-036)` edge at `970b081`. It records **one** verdict applied atomically to **seven** relations and decides whether nine implementation tasks may leave `blocked`; it must judge A-501 … A-505, re-verify everything round 6 closed, and check import fidelity. **Reviewer / gpt for TASK-031**, round 8 of this record's own review gate, remains `ready` and dispatchable in parallel, unchanged. **TASK-036 is `review`** at `970b081`, unjudged and not integrable. **The A-506 review obligation is unchanged and still uncreatable** until round 8 records a verdict; the unreviewed-effects backlog now spans `ACT-008` … `ACT-013`. The superseded `ACT-012` statement read: **architect / gpt for TASK-036**, the sixth architecture amendment, `ready` on the satisfied `gate_recorded(TASK-035)` edge at `afed101`. It carries A-501 … A-505 and holds the free `architecture-docs` lock as its seventh registered holder. **Reviewer / gpt for TASK-031**, round 8 of this record's own review gate, remains `ready` and dispatchable in parallel, unchanged apart from one additive note recording that the A-506 correction falls outside its immutable target. **Reviewer / gpt for TASK-037** performs `LIN-ARCH-REVIEW` round 7 over **seven** relations and is `blocked` until TASK-036 publishes. **A pending coverage obligation stands**: the A-506 correction and the accumulated `ACT-008` … `ACT-012` effects need `LIN-DECOMP-REVIEW` round 9, which invariant 8 forbids creating until round 8 records a verdict. The superseded `ACT-011` statement read: **reviewer / gpt for TASK-035**, `LIN-ARCH-REVIEW` round 6, `ready` on the satisfied `review_ready(TASK-034)` edge at `6d145eb`. It records **one** verdict applied atomically to **six** relations and decides whether nine implementation tasks may leave `blocked`; it must judge import fidelity, since `468b37b` is again not an ancestor of the target, and whether TASK-034's target-derived fixtures satisfy A-202 and A-402. **Reviewer / gpt for TASK-031**, round 8 of this decomposition's review gate, remains `ready` and may run in parallel. **TASK-034 is `review`** at `6d145eb`, unjudged and not integrable; its lock is free. TASK-035 must run in an execution context separate from TASK-034's and from every earlier `LIN-ARCH-REVIEW` execution, including TASK-033's; both are `gpt`, so execution-context separation is the only independence guarantee remaining and no script enforces it. It reads the architecture target through Git object access from a worktree cut off this Orchestrator branch — **the unreviewed amendment is not merged anywhere**. The superseded `ACT-010` statement read: **architect / gpt for TASK-034**, the fifth architecture amendment, `ready` and dispatchable on the satisfied `gate_recorded(TASK-033)` edge at `3660cc2`. It carries A-202's fixture half, A-105's sequence half, the new A-401 and A-402, and the A-004 / A-101 / A-104 residue, and holds the free `architecture-docs` lock as its sixth registered holder. **Reviewer / gpt for TASK-031**, round 8 of this decomposition's review gate, remains `ready` and may run in parallel: its report path is disjoint from every other active scope and it holds no resource lock. **Reviewer / gpt for TASK-035** performs `LIN-ARCH-REVIEW` round 6 and is `blocked` until TASK-034 publishes; it records **one** verdict applied atomically to **six** relations and decides whether nine implementation tasks may leave `blocked`. TASK-034 and TASK-035 must run in execution contexts separate from each other and from every earlier `LIN-ARCH-REVIEW` execution, including TASK-033's; both are `gpt`, so execution-context separation is the only independence guarantee remaining and no script enforces it. TASK-035 reads the architecture target through Git object access from a worktree cut off this Orchestrator branch — **the unreviewed amendment is not merged anywhere to assemble the review** — and carries import fidelity as a standing obligation, because `468b37b` is unmerged and rejected so round 6 imports its baseline exactly as round 5 did.
</content>
