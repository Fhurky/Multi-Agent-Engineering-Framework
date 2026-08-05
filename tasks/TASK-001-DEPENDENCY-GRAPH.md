# TASK-001 Dependency Graph

Durable handoff note for the autonomous multi-agent runtime task graph. It records the dependency order, ownership, write-scope partition, edge semantics, gate scheduling classes, gate lineages, and the activation and event-ingress model. Individual task records remain the authoritative source for scope and acceptance criteria; this document is kept in agreement with them by TASK-013.

**Revision 5**, produced by TASK-013 activation `ACT-004`. Two independent verdicts drove it, and neither is closed by it:

- **TASK-022 round 4** returned `changes-required` on this decomposition at commit `e8eb23d`, with findings F-301 (High), F-302 (High), and F-303 (Medium), in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md`.
- **TASK-020** returned `changes-required` at commit `4874a9d` on the TASK-016 architecture amendment, with findings A-101 … A-105, in `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md`. That single verdict applies atomically to `(TASK-016, review, round 1)` and `(TASK-002, review, round 2)`.

The per-finding disposition register is in `tasks/TASK-013-ACTIVATION-LOG.md`, activation `ACT-004`.

Revision history: revision 2 was reviewed by TASK-014 rounds 1 and 2 (`changes-required`, F-001 … F-007 then F-101 … F-105); TASK-015 round 1 returned `changes-required` on the TASK-002 architecture (A-001 … A-004); human governance decision HUMAN-001 was recorded at `fb9f45c`; revision 3 was produced by `ACT-001` and reviewed by TASK-021 round 3 (`changes-required`, F-201 … F-205); revision 4 was produced by `ACT-002` and reviewed by TASK-022 round 4. Activation `ACT-003` applied lifecycle updates only and was not a revision.

## Dependency edge semantics

Revision 2 used a single `implementation_published` edge that required the target to be **merged to `main`**. That was the root cause of F-101: a pre-merge review gate waits for merge while merge waits for the gate. Revision 3 split that edge into two typed conditions with distinct satisfying states and added a per-task declaration of which gates block integration. Revision 4 added publication classes and a gate-owner form of `gate_passed`. Revision 5 **withdraws the owner form** and replaces it with a lineage form, because F-302 showed the owner form cannot survive a superseding round.

| Edge | Written as | Satisfied when | Used for |
|---|---|---|---|
| `review_ready` | `{task: X, edge: review_ready}` | X has reached `review`, its record names an immutable `published_commit` on `published_branch`, and X's `publication_class` is satisfied under **Publication classes** below | The readiness edge for a gate task. It says nothing about merge |
| `integrated` | `{task: X, edge: integrated}` | X is `review_ready`, **every** gate named in X's `pre_merge_gates` is closed, and X's branch has been merged into `integration/autonomous-runtime` per the integration order | A compile-time or contract-consumption edge between implementations |
| `gate_passed` — target form | `{task: X, edge: gate_passed, gate: <name>, round: <n>}` where X declares `<name>` in its `required_gates` | X is `review_ready` and the gate relation `(X, <name>)` is **closed** under the gate-round rule, with the closing verdict at round ≥ `<n>` | An approved decision about **one named target** that downstream work builds on |
| `gate_passed` — lineage form | `{lineage: <LIN-id>, edge: gate_passed, gate: <name>, lineage_round: <n>}` where `<LIN-id>` is declared in the gate-lineage register | The lineage's **authoritative verdict** — the verdict recorded at its highest lineage round — is passing or formally accepted, and that lineage round is ≥ `<n>` | A downstream consumer that requires a *passing* upstream validation baseline which may be produced by a **successor** gate task in a later round |
| ~~`gate_passed` — owner form~~ | ~~`{task: G, edge: gate_passed, gate: <name>, round: <n>}` where G is a gate task~~ | **Withdrawn in revision 5.** Rejected at load time | Superseded by the lineage form. See F-302 below |
| `gate_recorded` | `{task: X, edge: gate_recorded}` | X, itself a gate task, has recorded its verdict, whatever that verdict is | One task needing another validator's recorded outcome, pass or fail — TASK-016 on TASK-015, TASK-024 on TASK-020 |
| `human_decision` | `{task: HUMAN-nnn, edge: human_decision}` | A human has recorded the named decision in a tracked commit on a non-agent branch | Work an agent is structurally forbidden to unblock |
| `terminal` | `{task: X, edge: terminal}` | X has reached `done` | Reserved. No task in this graph uses it; it exists so the scheduler can reject its misuse |

`round` and `lineage_round` default to 1 when omitted on a `gate_passed` edge.

`gate_recorded` and the lineage form of `gate_passed` differ in exactly one way, and the difference is what F-204 recorded: `gate_recorded` is satisfied by **any** verdict including `changes-required`; the lineage form is satisfied only by a **passing or formally accepted** verdict. A task whose stated prerequisite is a working upstream baseline must use the lineage form. A task that is the remediation *for* a failing verdict must use `gate_recorded`, because a passing verdict will never exist at that round.

### Why the owner form is withdrawn — F-302

Finding **F-302** constructed the deadlock the owner form makes unavoidable. `{task: TASK-011, edge: gate_passed, gate: qa, round: 1}` asks whether **TASK-011** recorded a passing verdict. The graph simultaneously requires that a `changes-required` verdict be superseded by a **new** gate task rather than by re-entering the old one, and that a recorded verdict be durable and never rewritten. So if TASK-011 records `changes-required` at round 1, remediation lands, and a successor QA task passes at round 2, TASK-011's own durable verdict stays `changes-required` forever. TASK-012 never dispatches, its performance gates never record, and TASK-005, TASK-006, and TASK-008 can never reach `done`.

Both of the reviewer's offered corrections were considered. Atomically retargeting the consumer's edge every time TASK-013 creates a new round was rejected: it makes a scheduling edge mutable, makes correctness depend on an activation performing an edit, and gives the graph no load-time check that the retarget happened. The durable cohort relation was adopted instead, as the **gate lineage** below. It names the relation rather than one of its rounds, so no edge has to change when a round is superseded, and the load-time check is a static property of the register.

### Publication classes

`review_ready` requires an immutable published commit. What else it requires depends on which class the producing task declares. Revision 3 stated the ordinary requirement in one place and a contradicting bootstrap allowance in another; that inconsistency was the residual half of F-101 and F-104. Revision 4 made the two classes explicit, disjoint, and separately named.

| `publication_class` | Applies to | Satisfying condition | Recorded as |
|---|---|---|---|
| `runtime` | Every task the runtime dispatches — TASK-003 … TASK-008, TASK-017, TASK-018, TASK-026 | Immutable published commit **and** the task branch pushed to the configured remote **and** an open or updated pull request for that branch | `publication: published`, with `published_remote_ref` and `pull_request` |
| `bootstrap` | The human-launched CLI sessions that build the runtime itself — TASK-001, TASK-002, TASK-013 activations, TASK-014, TASK-015, TASK-016, TASK-019 … TASK-025 | Immutable published commit readable from the shared Git common directory, **plus** remote publication and a pull request when the operator's environment permits one | `publication: published` when the remote step succeeded, or `publication: local-only` with `publication_reason` when it did not |

Three rules keep the two classes from contaminating each other:

1. A `bootstrap` task's `local-only` publication satisfies `review_ready` **for that task only**, and only because a bootstrap task's consumer is another bootstrap task reading the same Git common directory. It is a named, recorded limitation of the bootstrap phase.
2. A `local-only` publication **never** satisfies `review_ready` for a task whose `publication_class` is `runtime`. TASK-017 must return an explicit `blocked` outcome instead, and TASK-018's acceptance criteria require the publication outcome to be recorded rather than assumed.
3. The class is a declared field, not an inference. A task record that omits `publication_class` is rejected by the graph validator that TASK-005 owns.

| Task | `publication_class` | `published_commit` | `published_branch` | `publication` |
|---|---|---|---|---|
| TASK-001 | `bootstrap` | `657b83a`, superseded by the `ACT-001` commit `5febe3b` with follow-up `88dc554`, then by the `ACT-002` commit `f590749` with follow-up `4f8a1cc`, then by the `ACT-004` commit on the same branch | `agent/claude/orchestrator/task-013` | `published` — integrated at `e8edbcd` and merged to `main` at `c325275` through pull request #1; later revisions published on the same branch |
| TASK-002 | `bootstrap` | `9576fc9` | `agent/claude/architect/task-002` | `local-only` — the executing session was instructed not to push |
| TASK-014 | `bootstrap` | `abb85d9` | `agent/gpt/reviewer/task-014` | `local-only` — same reason |
| TASK-015 | `bootstrap` | `8632469` | `agent/gpt/reviewer/task-015` | `local-only` — same reason |
| TASK-016 | `bootstrap` | `8d0c570` | `agent/claude/architect/task-016` | `published` — pushed to `origin/agent/claude/architect/task-016` and opened as pull request #3 by the owner's own execution |
| TASK-020 | `bootstrap` | `4874a9d` | `agent/gpt/reviewer/task-020` | `published` — present at `refs/heads/agent/gpt/reviewer/task-020` on `origin` |
| TASK-021 | `bootstrap` | `adfb982` | `agent/gpt/reviewer/task-021` | `published` — pushed to `origin` and opened as pull request #2 after the reviewer's own session recorded `local-only` |
| TASK-022 | `bootstrap` | `e8eb23d` | `agent/gpt/reviewer/task-022` | `published` — present at `refs/heads/agent/gpt/reviewer/task-022` on `origin` |

TASK-020's and TASK-022's own reports each record their publication as pending at the moment of writing, because the push succeeded outside the reviewer's execution. TASK-013 transcribes both facts and does not overwrite either reviewer's statement. This is the same divergence TASK-021 produced and it is recorded the same way.

### Gate rounds and gate closure

`gate_for` declares that a task performs a named gate for a target. **`gate_for` is not a scheduling edge.** It points in the opposite direction from the scheduling edges and is evaluated only when TASK-013 decides whether a target's gate is closed. `gate_tasks` is the target's view of the same relation. `gate_for` and `gate_tasks` must agree pairwise, including on `round`, `gate_class`, `retrospective`, `gate_lineage`, and `lineage_round`.

A gate may be recorded more than once. Each pair carries a `round`, which **defaults to 1 when omitted**.

1. The status of a gate relation is the verdict recorded at its **highest** round.
2. A `changes-required` verdict at round *n* must name a `remediated_by` task or activation and a `revalidated_by` task. The gate stays open.
3. The gate is **closed** when the highest round records `approved`, `approved-with-findings` with every blocking finding resolved, or a formal acceptance recorded by an authorized human.
4. A verdict is durable. A later round never rewrites an earlier one; it supersedes it, and both stay recorded.
5. **One review produces exactly one verdict.** A gate task that carries more than one `gate_for` relation records that single verdict once and applies it **atomically** to every relation it carries: all of them close together or all of them stay open together. The application produces one durable gate-verdict fact per relation, so a target reads its own gate status from its own relation, but a split outcome is not representable. TASK-020 recorded one verdict yielding the two facts `(TASK-016, review, round 1)` and `(TASK-002, review, round 2)`; TASK-025 will record one verdict yielding three.
6. **Every pair belongs to exactly one gate lineage.** Supersession across rounds is a property of the lineage, not of any one gate task. See below.

This is what makes an independent verdict permanent instead of re-entrant. TASK-014's two verdicts, TASK-015's verdict, TASK-020's verdict, TASK-021's verdict, and TASK-022's verdict are final for the artifacts they reviewed; the corrected artifacts are reviewed by new tasks in new rounds.

## Gate lineages

A **gate lineage** is the durable relation between one gate name and one cohort of gated artifacts, held across every round and across every successive gate task that records a round of it. It is the correction F-302 required.

- A lineage has a stable ID, a gate name, a cohort, and an ordered succession of `lineage_round` values. Each lineage round is recorded by exactly one gate task.
- A lineage's **authoritative verdict** is the verdict at its highest recorded lineage round. Every earlier round stays durably recorded and is superseded, never rewritten — clause 4 above is unchanged and unweakened. The lineage adds a name for "which round is currently authoritative"; it removes nothing from history.
- A successor lineage round may be created only after the preceding round recorded a verdict, and only as a **new** gate task. A gate task is never re-entered.
- The cohort of a lineage may grow when a new artifact joins the same gate — as TASK-026 joins the runtime cohorts in this revision — but a cohort member is never removed, so an earlier round's coverage claim stays true of what it covered.
- Every `gate_for` and `gate_tasks` pair declares `gate_lineage` and `lineage_round` in its own frontmatter. The register below is the single normative statement of cohort membership and round succession; a pair whose declared lineage is absent from the register, or whose `lineage_round` collides with another task's round in the same lineage, is rejected at load time.

### Gate-lineage register

| Lineage | Gate | Cohort, in the order artifacts joined | Lineage rounds |
|---|---|---|---|
| `LIN-DECOMP-REVIEW` | review | TASK-001 | 1 → TASK-014 (TASK-001 r1); 2 → TASK-014 (r2); 3 → TASK-021 (r3); 4 → TASK-022 (r4); 5 → TASK-023 (r5) |
| `LIN-ARCH-REVIEW` | review | TASK-002 → TASK-016 → TASK-024 | 1 → TASK-015 (TASK-002 r1); 2 → TASK-020 (TASK-016 r1, TASK-002 r2); 3 → TASK-025 (TASK-024 r1, TASK-016 r2, TASK-002 r3) |
| `LIN-TOOLCHAIN-REVIEW` | review | TASK-018 | 1 → TASK-019 (TASK-018 r1) |
| `LIN-TOOLCHAIN-SECURITY` | security | TASK-018 | 1 → TASK-010 (TASK-018 r1) |
| `LIN-RUNTIME-REVIEW` | review | TASK-003 … TASK-008, TASK-017, TASK-026 | 1 → TASK-009 (r1 for each cohort member) |
| `LIN-RUNTIME-SECURITY` | security | TASK-003 … TASK-008, TASK-017, TASK-026 | 1 → TASK-010 (r1 for each cohort member) |
| `LIN-RUNTIME-QA` | qa | TASK-003 … TASK-008, TASK-017, TASK-026 | 1 → TASK-011 (r1 for each cohort member) |
| `LIN-RUNTIME-PERFORMANCE` | performance | TASK-005, TASK-006, TASK-008 | 1 → TASK-012 (r1 for each cohort member) |

`LIN-DECOMP-REVIEW` rounds 1 and 2 are both recorded by TASK-014. That is the one historical instance of a re-entrant gate task in this graph; it predates the rule and is retained rather than rewritten. Every lineage round created since — 3, 4, and 5 of `LIN-DECOMP-REVIEW`, and 2 and 3 of `LIN-ARCH-REVIEW` — is a distinct task.

`LIN-ARCH-REVIEW`'s lineage rounds and its per-target rounds differ, because its cohort grew: TASK-016 joined at lineage round 2 as the remediation for lineage round 1, and TASK-024 joins at lineage round 3 as the remediation for lineage round 2. A pair therefore carries both numbers, and each answers a different question — `round` is "how many times has *this artifact's* gate been recorded", `lineage_round` is "how many times has *this relation* been validated".

### Edges that use the lineage form

| Consumer | Edge | Why the lineage form and not the target form |
|---|---|---|
| TASK-012 | `{lineage: LIN-RUNTIME-QA, edge: gate_passed, gate: qa, lineage_round: 1}` | The prerequisite is a passing QA baseline for the runtime cohort, whoever records it. A successor QA task at lineage round 2 satisfies the edge without any edit. This is the F-302 correction |
| TASK-003 … TASK-008, TASK-017, TASK-018, TASK-026 | `{lineage: LIN-ARCH-REVIEW, edge: gate_passed, gate: review, lineage_round: 3}` | The prerequisite is an approved runtime architecture, which is now a succession of amendments rather than one document commit. Revision 4 retargeted this edge from TASK-002 to TASK-016 by hand; the lineage form removes the need to retarget it again when TASK-024 supersedes TASK-016. `lineage_round: 3` is the floor: the amendment carrying A-101 … A-105 must be the approved one, so a passing verdict at lineage round 1 or 2 does not satisfy it |

## Gate scheduling classes

Revision 3 asserted that "a gate owner must be schedulable when its target publishes, not several waves later" and named TASK-018's security gate as the single retrospective exception. F-203 recorded that both statements are false: TASK-009, TASK-010, and TASK-011 each wait for *every* runtime component before they can gate *any one* of them, and every assembly gate on TASK-003 … TASK-008, TASK-017, and TASK-026 closes after its target is already integrated. Revision 4 replaced the false claim with two independent, declared, machine-checkable properties.

Every `gate_for` / `gate_tasks` pair carries both:

| Property | Values | Meaning | How it is decided |
|---|---|---|---|
| `gate_class` | `point`, `aggregate` | Scheduling timeliness | `point` when the gate owner is dispatchable at the moment the artifact that this round reviews becomes `review_ready` — that is, when publication of the reviewed artifact is the last of the owner's dependencies to be satisfied. `aggregate` when the owner holds at least one further dependency that is satisfied later, so gating this target is deliberately batched with others |
| `retrospective` | `true`, `false` | Ordering against integration | `true` when the gate is **not** in the target's `pre_merge_gates`, so the target is integrated before this gate closes. `false` when the gate blocks integration |

**Where these values are normative.** F-303 recorded that three active record bodies restated a pair's `retrospective` value in prose and stated the opposite of the frontmatter. Revision 5 removes the duplication rather than only correcting the copies: **a pair's `gate_class` and `retrospective` are normative in the pair's own frontmatter and in the register below, and nowhere else.** A record body may name the register; it may not restate the value. The same rule applies to `gate_lineage` and `lineage_round`.

**Which artifact a round reviews.** At round 1 the reviewed artifact is the target itself, so the reference point is `review_ready(<target>)`. At round *n* > 1 the reviewed artifact is the **remediation** named by round *n* − 1's `remediated_by`, so the reference point is that remediation's publication. TASK-020 carried TASK-002's review gate at round 2 while depending on `review_ready(TASK-016)`, and TASK-016 *was* the remediation for round 1's verdict; TASK-025 carries TASK-002 round 3 and TASK-016 round 2 while depending on `review_ready(TASK-024)`, for the same reason. The same holds for TASK-014 round 2, TASK-021 round 3, TASK-022 round 4, and TASK-023 round 5, each of which reviews a TASK-001 remediation republished on the remediating branch.

The two properties are independent, and all three combinations that occur in this graph occur for different reasons:

- `point` and `retrospective: false` — TASK-019 on TASK-018 review, TASK-015 on TASK-002 review, TASK-020 on TASK-016 review and TASK-002 review, TASK-025 on TASK-024, TASK-016, and TASK-002 review. The gate blocks integration and its owner is dispatchable the moment the reviewed artifact publishes. This is the ideal case.
- `point` and `retrospective: true` — every round of TASK-001's own review gate, owned by TASK-014, TASK-021, TASK-022, and TASK-023.
- `aggregate` and `retrospective: true` — every runtime assembly gate, and TASK-012 with an additional cross-cohort wait on a passing QA baseline.

No gate in this graph is `aggregate` and `retrospective: false`, which would mean a pre-merge gate that batches — the combination that would actually stall integration.

**The rule, stated truthfully.** A gate owner is expected to be `point` unless the pair declares `gate_class: aggregate` and appears in the register below with a reason and a recorded risk. TASK-005's graph validator rejects, at load time, a pair whose computed class disagrees with its declared class, and a pair declared `aggregate` or `retrospective: true` that has no register entry.

### Aggregate and retrospective gate register

Every delayed gate in this graph, its reason, and its accepted risk. No pair outside this register may be `aggregate` or `retrospective`.

| Gate owner | Gate | Cohort it gates | Class | Retrospective | Reason the delay is accepted | Recorded risk |
|---|---|---|---|---|---|---|
| TASK-009 | review | TASK-003 … TASK-008, TASK-017, TASK-026 | aggregate | true | The runtime review is a cross-module correctness review: contract-root drift, workspace invocation on every dispatch path, ingress append-stability, and adapter completeness are only observable once every module exists. Reviewing TASK-003 alone at Wave 3 could not check any of them | TASK-003 and TASK-004 sit integrated on the integration branch from Wave 3 to Wave 8 with no independent review. A defect found at Wave 8 invalidates work in up to six downstream tasks. Mitigations: the contract change control rule freezes both contract roots during Waves 3 … 7, and every implementation task carries its own unit-test acceptance criteria |
| TASK-010 | security | TASK-003 … TASK-008, TASK-017, TASK-026 | aggregate | true | Threat modelling is performed against the assembled runtime. Credential flow, untrusted-input handling, lease integrity, ingress-fact authenticity, and push-protection integrity all cross module boundaries | Same exposure window as the review gate, with the additional consequence that a High or Critical finding at Wave 8 blocks delivery for the whole graph. Mitigation: the repository's baseline security CI workflow runs on every pull request in the meantime |
| TASK-010 | security | TASK-018 | aggregate | true | No code exists to threat-model before a toolchain exists, so the toolchain integrates at Wave 2 and is assessed at Wave 8 | The toolchain and its devDependency surface sit on the integration branch unassessed for six waves. Mitigations: ADR-0001's zero-third-party-runtime-dependency rule, the dependency inventory TASK-019 must produce as a pre-merge gate, and the baseline security CI workflow |
| TASK-011 | qa | TASK-003 … TASK-008, TASK-017, TASK-026 | aggregate | true | End-to-end lifecycle validation requires a startable runtime. Pause-resume equivalence, crash-recovery equivalence, and the activation ingress loop are not expressible against a single module | Same exposure window. A defect in an early module surfaces only after every later module was built on it |
| TASK-012 | performance | TASK-005, TASK-006, TASK-008 | aggregate | true | Throughput, checkpoint cost, and recovery time are properties of the assembled system, and this gate additionally waits on a passing QA baseline so it does not measure a system QA has already rejected | Runs one wave after every other gate. An optimization finding arrives after the code is integrated and reviewed, so remediation reopens an already-gated task |
| TASK-014, TASK-021, TASK-022, TASK-023 | review | TASK-001 rounds 1 … 5 | point | true | TASK-001 declares `pre_merge_gates: []`. The decomposition is a task-record artifact that every other owner and every subsequent reviewer must read from the integration branch, so each revision is integrated as soon as it is authored rather than held behind its own review gate. Holding it back would leave the graph that schedules every task readable only on one agent branch | The `ACT-001` revision reached `main` at `c325275` while round 3 was unrecorded, and rounds 3 and 4 then both returned `changes-required`. A defective decomposition can therefore be the graph of record for a whole round, and has been for two. Mitigations: the gate owner is `point`, so the delay is one review and not one wave; each round's target commit is immutable, so a later revision cannot rewrite what was reviewed; and TASK-001 cannot reach `done` until a round records a passing verdict, which is enforced separately from integration |
| TASK-019 | review | TASK-018 | point | false | — | — |
| TASK-015 | review | TASK-002 round 1 | point | false | — | — |
| TASK-020 | review | TASK-016 round 1, TASK-002 round 2 | point | false | — | — |
| TASK-025 | review | TASK-024 round 1, TASK-016 round 2, TASK-002 round 3 | point | false | — | — |

The alternative F-203 offered — splitting each aggregate gate into one gate task per target so every gate is `point` — is rejected here and the rejection is recorded rather than left implicit. Splitting TASK-009 into eight review tasks would produce eight reviewers that each cannot check the cross-module properties the gate exists for, would multiply the report write-scope partition by eight, and would still need a ninth aggregate reviewer for the properties that only exist at assembly. The batching is a real architectural property of the review, not a scheduling oversight; what was wrong in revision 3 was claiming it did not exist.

## No-deadlock invariant

The graph is valid only if all eight hold:

1. The directed graph over `review_ready`, `integrated`, `gate_passed`, `gate_recorded`, `terminal`, and `human_decision` edges is acyclic. A lineage-form `gate_passed` edge expands, for this purpose, to the gate tasks recording lineage rounds ≥ its `lineage_round`.
2. No task holding `gate_for: X` also holds a `gate_passed`, `integrated(X)`, or `terminal(X)` edge naming X or naming a lineage it itself records a round of. It may hold `review_ready(X)`, which is satisfiable while X is still in `review` and unmerged.
3. Every `gate_for` entry has a matching `gate_tasks` entry on the target and the reverse, agreeing on gate name, round, `gate_class`, `retrospective`, `gate_lineage`, and `lineage_round`.
4. For every task X, no gate task owning a gate in X's `pre_merge_gates` holds an `integrated(X)` edge. Otherwise merge would wait on a gate that waits on merge.
5. The relation induced by expanding each `integrated(X)` edge into `review_ready(X)` plus the edges of X's `pre_merge_gates` owners is itself acyclic.
6. Every `gate_passed` edge declares exactly one of `task` or `lineage`. With `task`, the named task must declare the gate in its `required_gates` — the target form. With `lineage`, the named lineage must appear in the gate-lineage register — the lineage form. The owner form is withdrawn: an edge naming a task that declares the gate only in a `gate_for` entry is rejected at load time with a message directing it to the lineage form.
7. Every `gate_for` / `gate_tasks` pair declares `gate_class` and `retrospective`; the declared `gate_class` equals the class computed from the owner's dependency set against the publication of the artifact that round reviews; the declared `retrospective` equals `gate ∉ target.pre_merge_gates`; and every pair declaring `gate_class: aggregate` or `retrospective: true` has an entry in the aggregate and retrospective gate register.
8. Every `gate_for` / `gate_tasks` pair declares a `gate_lineage` present in the gate-lineage register and a `lineage_round`. Within one lineage, the gate name is constant, every declared `lineage_round` maps to exactly one gate task, the set of declared rounds is `1 … k` with no gap, and every target named by a pair in the lineage is a member of that lineage's registered cohort. A lineage round greater than 1 exists only if the preceding round recorded a verdict.

TASK-005 owns enforcement: it implements ready-task selection over these edge types and rejects a graph violating any invariant at load time rather than deadlocking at run time.

**Verification of this graph against the invariant.**

- Invariants 1 and 5: the topological order `HUMAN-001, TASK-001, TASK-014, TASK-021, TASK-022, TASK-023, TASK-002, TASK-015, TASK-016, TASK-020, TASK-024, TASK-025, TASK-018, TASK-019, TASK-003, TASK-004, TASK-017, TASK-026, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013` places every task after all of its dependencies and after the pre-merge gate owners of every task it integrates. TASK-012's `gate_passed(LIN-RUNTIME-QA)` edge expands to TASK-011 and points backwards along this order, from position 26 to position 25. The architecture edge held by TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 expands to TASK-025 at position 12, ahead of every one of them. No cycle exists.
- Invariant 2: TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, TASK-019, TASK-020, TASK-021, TASK-022, TASK-023, and TASK-025 are the only tasks with `gate_for` entries. Every edge each of them holds to a task it gates is `review_ready`. TASK-012's only non-`review_ready` edge names `LIN-RUNTIME-QA`, of which TASK-012 records no round. TASK-025 records rounds of `LIN-ARCH-REVIEW` and holds no `gate_passed` edge at all.
- Invariant 3: checked pairwise across all 40 pairs in the gate assignment table and both registers.
- Invariant 4: the only non-empty `pre_merge_gates` are TASK-002 `review` (TASK-015 r1, TASK-020 r2, TASK-025 r3), TASK-016 `review` (TASK-020 r1, TASK-025 r2), TASK-024 `review` (TASK-025 r1), and TASK-018 `review` (TASK-019 r1). None of TASK-015, TASK-019, TASK-020, or TASK-025 holds an `integrated` edge to any of its targets.
- Invariant 6: no owner-form edge exists. The only lineage-form edges are TASK-012's on `LIN-RUNTIME-QA` and the architecture edge on `LIN-ARCH-REVIEW` held by nine tasks; both lineages are registered. No target-form `gate_passed` edge remains in the graph, so no edge can be ambiguous.
- Invariant 7: all 40 `gate_for` / `gate_tasks` pairs carry both properties and agree on both across the pair. Each declared `retrospective` was recomputed as `gate ∉ target.pre_merge_gates`: `false` for the seven pairs whose gate is a pre-merge gate — TASK-015 r1, TASK-020 r2, and TASK-025 r3 on TASK-002; TASK-020 r1 and TASK-025 r2 on TASK-016; TASK-025 r1 on TASK-024; TASK-019 r1 on TASK-018 — and `true` for the other 33, which are the 28 runtime and toolchain assembly gates plus the five rounds of TASK-001's own review gate, since TASK-001 declares `pre_merge_gates: []`. Each declared `gate_class` was recomputed against the publication of the artifact that round reviews: `point` for the twelve decomposition, architecture, and toolchain review rounds, `aggregate` for the 28 assembly gates.
- Invariant 8: eight lineages are registered. `LIN-DECOMP-REVIEW` declares rounds 1 … 5 with no gap, one task per round except the historical TASK-014 pair at rounds 1 and 2, which is recorded as the single pre-rule exception. `LIN-ARCH-REVIEW` declares rounds 1 … 3, one task each. The remaining six declare round 1 only. Every target named by a pair is a member of its lineage's registered cohort, and every lineage round greater than 1 follows a recorded verdict: `LIN-DECOMP-REVIEW` rounds 2 … 5 follow `changes-required` at `8ac0dbd`, `abb85d9`, `adfb982`, and `e8eb23d`; `LIN-ARCH-REVIEW` rounds 2 and 3 follow `changes-required` at `8632469` and `4874a9d`.

## Ownership and dependency order

| Task | Title | Owner role | LLM | Depends on | State |
|---|---|---|---|---|---|
| TASK-001 | Decompose the autonomous multi-agent runtime | orchestrator | claude | — | review |
| TASK-002 | Runtime architecture and ADRs | architect | claude | — | review |
| TASK-003 | Durable run state and checkpoints | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 3)`; TASK-018 `integrated` | blocked |
| TASK-004 | Provider adapters and agent workers | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 3)`; TASK-018 `integrated` | blocked |
| TASK-005 | Scheduling, leases, fencing, bounded concurrency | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 3)`; TASK-003, TASK-004, TASK-026 `integrated` | blocked |
| TASK-006 | Supervisor core and state machine | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 3)`; TASK-003, TASK-004, TASK-005, TASK-017 `integrated` | blocked |
| TASK-007 | Lifecycle control and one-input bootstrap | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 3)`; TASK-006 `integrated` | blocked |
| TASK-008 | Crash recovery, timeouts, idempotent retries | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 3)`; TASK-003, TASK-004, TASK-006, TASK-017 `integrated` | blocked |
| TASK-009 | Independent code review of the runtime | reviewer | gpt | TASK-003 … TASK-008, TASK-017, TASK-026 `review_ready` | blocked |
| TASK-010 | Security review of the runtime | security | gpt | TASK-003 … TASK-008, TASK-017, TASK-018, TASK-026 `review_ready` | blocked |
| TASK-011 | QA validation of the runtime | qa | gemini | TASK-003 … TASK-008, TASK-017, TASK-026 `review_ready` | blocked |
| TASK-012 | Performance validation of the runtime | performance | gemini | TASK-005, TASK-006, TASK-008, TASK-017 `review_ready`; `LIN-RUNTIME-QA` `gate_passed(qa, 1)` | blocked |
| TASK-013 | Task-record lifecycle transitions and gate closure | orchestrator | claude | — (event-triggered) | blocked, quiescent |
| TASK-014 | Independent review of this decomposition, rounds 1–2 | reviewer | gpt | TASK-001 `review_ready` | done |
| TASK-015 | Independent architecture review of TASK-002, round 1 | reviewer | gpt | TASK-002 `review_ready` | done |
| TASK-016 | Architecture amendment: runtime contracts and workspace lifecycle | architect | claude | TASK-015 `gate_recorded` | review, `changes-required` at round 1 |
| TASK-017 | Agent workspace lifecycle automation | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 3)`; TASK-003, TASK-018 `integrated` | blocked |
| TASK-018 | Runtime toolchain bootstrap | devops | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 3)` | blocked |
| TASK-019 | Independent review of the runtime toolchain | reviewer | gpt | TASK-018 `review_ready` | blocked |
| TASK-020 | Independent review of the architecture amendment | reviewer | gpt | TASK-016 `review_ready` | done, `changes-required` |
| TASK-021 | Independent re-review of the corrected decomposition, round 3 | reviewer | gpt | TASK-001 `review_ready` | done |
| TASK-022 | Independent re-review of the corrected decomposition, round 4 | reviewer | gpt | TASK-001 `review_ready` | done, `changes-required` |
| TASK-023 | Independent re-review of the corrected decomposition, round 5 | reviewer | gpt | TASK-001 `review_ready` | ready |
| TASK-024 | Second architecture amendment: ingress inbox and revision-5 scheduling vocabulary | architect | claude | TASK-020 `gate_recorded` | ready |
| TASK-025 | Independent review of the second architecture amendment | reviewer | gpt | TASK-024 `review_ready` | blocked |
| TASK-026 | Durable ingress inbox and activation cursor store | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 3)`; TASK-003, TASK-018 `integrated` | blocked |

`HUMAN-001` is resolved. Commit `fb9f45c`, `chore: assign runtime toolchain ownership to devops`, adopted option A and added `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**` to `assignments.devops.write_scope`. No task carries a `human_decision` edge any longer.

## Gate assignment

Every `required_gates` entry has a named owner, every round is recorded, and every pair declares its scheduling class and its lineage.

| Gated task | Gate | Owner and round | Verdict | `gate_lineage` | `lineage_round` |
|---|---|---|---|---|---|
| TASK-001 | review | TASK-014 r1 | `changes-required` | `LIN-DECOMP-REVIEW` | 1 |
| TASK-001 | review | TASK-014 r2 | `changes-required` | `LIN-DECOMP-REVIEW` | 2 |
| TASK-001 | review | TASK-021 r3 | `changes-required` | `LIN-DECOMP-REVIEW` | 3 |
| TASK-001 | review | TASK-022 r4 | `changes-required` | `LIN-DECOMP-REVIEW` | 4 |
| TASK-001 | review | TASK-023 r5 | pending | `LIN-DECOMP-REVIEW` | 5 |
| TASK-002 | review | TASK-015 r1 | `changes-required` | `LIN-ARCH-REVIEW` | 1 |
| TASK-002 | review | TASK-020 r2 | `changes-required` | `LIN-ARCH-REVIEW` | 2 |
| TASK-002 | review | TASK-025 r3 | pending | `LIN-ARCH-REVIEW` | 3 |
| TASK-016 | review | TASK-020 r1 | `changes-required` | `LIN-ARCH-REVIEW` | 2 |
| TASK-016 | review | TASK-025 r2 | pending | `LIN-ARCH-REVIEW` | 3 |
| TASK-024 | review | TASK-025 r1 | pending | `LIN-ARCH-REVIEW` | 3 |
| TASK-003 | review / security / qa | TASK-009 / TASK-010 / TASK-011, r1 | pending | runtime lineages | 1 |
| TASK-004 | review / security / qa | TASK-009 / TASK-010 / TASK-011, r1 | pending | runtime lineages | 1 |
| TASK-005 | review / security / qa / performance | TASK-009 / TASK-010 / TASK-011 / TASK-012, r1 | pending | runtime lineages | 1 |
| TASK-006 | review / security / qa / performance | TASK-009 / TASK-010 / TASK-011 / TASK-012, r1 | pending | runtime lineages | 1 |
| TASK-007 | review / security / qa | TASK-009 / TASK-010 / TASK-011, r1 | pending | runtime lineages | 1 |
| TASK-008 | review / security / qa / performance | TASK-009 / TASK-010 / TASK-011 / TASK-012, r1 | pending | runtime lineages | 1 |
| TASK-017 | review / security / qa | TASK-009 / TASK-010 / TASK-011, r1 | pending | runtime lineages | 1 |
| TASK-026 | review / security / qa | TASK-009 / TASK-010 / TASK-011, r1 | pending | runtime lineages | 1 |
| TASK-018 | review | TASK-019 r1 | pending | `LIN-TOOLCHAIN-REVIEW` | 1 |
| TASK-018 | security | TASK-010 r1 | pending | `LIN-TOOLCHAIN-SECURITY` | 1 |

Forty `gate_for` / `gate_tasks` pairs are declared: 5 on TASK-001, 3 on TASK-002, 2 on TASK-016, 1 on TASK-024, 3 each on TASK-003, TASK-004, TASK-007, TASK-017, and TASK-026, 4 each on TASK-005, TASK-006, and TASK-008, and 2 on TASK-018. Each pair's `gate_class` and `retrospective` are declared in the pair's own frontmatter and summarized in the aggregate and retrospective gate register; they are not restated here or in any record body.

Author and gate owner are always different roles, different execution contexts, and different LLM families. No task gates itself, and no remediation returns to the execution context that reviewed it.

Two properties of this table are deliberate and are stated without overclaiming:

1. **A pre-merge gate owner is always `point`, and no pre-merge gate is `aggregate`.** TASK-015, TASK-019, TASK-020, and TASK-025 are each dispatchable when the artifact they review publishes, so no gate that blocks integration ever waits several waves.
2. **A superseding round is a new task, not a re-entrant one, and the relation that survives supersession is the lineage.** TASK-014, TASK-015, TASK-020, TASK-021, and TASK-022 recorded durable verdicts and are `done`. TASK-023 and TASK-025 perform the next rounds.

## Execution waves

```text
Wave 0   TASK-024 | TASK-023                 second architecture amendment; decomposition re-review round 5
         TASK-013                            event-triggered, quiescent, not a wave member
Wave 1   TASK-025                            gate the second amendment before it merges
Wave 2   TASK-018                            toolchain, needs the amended architecture approved
         TASK-019                            gate the toolchain before it merges
Wave 3   TASK-003 | TASK-004                 parallel, disjoint scopes, both need the toolchain integrated
Wave 4   TASK-017 | TASK-026                 parallel, disjoint scopes, both consume the durable state store
Wave 5   TASK-005                            needs state, workers, and the ingress inbox
Wave 6   TASK-006                            needs state, workers, scheduler, workspace
Wave 7   TASK-007 | TASK-008                 parallel, disjoint scopes
Wave 8   TASK-009 | TASK-010 | TASK-011      parallel, separate execution contexts; all three are aggregate gates
Wave 9   TASK-012                            needs a passing QA baseline, not merely a recorded one
```

Revision 5 inserts TASK-026 at Wave 4 and moves the scheduler and everything after it one wave later, because the scheduler's ingress observer now reads a durable inbox that TASK-026 owns. TASK-013 is not a wave and is not claimed at wave boundaries on a timer. It is dispatched only when an unconsumed ingress fact exists; see the activation model below.

## TASK-013 activation and event-ingress model

Revision 3 gave TASK-013 a durable cursor, a quiescent state, and a closed event-type set, which removed F-104's infinite redispatch loop. F-201 recorded that the replacement contained a wake-up deadlock and an impossible consumption representation, and revision 4 replaced the producer and the dispatch signal. F-301 then recorded that revision 4's **observation rule** was still not a cursor:

- The rule enumerated every matching fact reachable from `integration/autonomous-runtime` and every live `agent/*` branch, sorted by committer timestamp and SHA, and took `ingress_seq` as the **count**. A count over a scan of mutable refs is not a position.
- Publishing a backdated commit inserts a fact *before* the cursor, so consuming `(cursor, count]` replays the old tail and skips the new fact.
- Deleting a live branch reduces the count below the cursor, which the model itself declares invalid.
- One commit could match several event classes with no stated rule, and the ledger applied an unstated selection policy — `e8edbcd` and `c325275` were folded into one row, the reachable round-1 verdict `8ac0dbd` was absent, and one of `a2aad47` / `adfb982` was chosen with no recorded rule. `ingress_seq = 5` was therefore not reproducible.
- TASK-013's own effects commit matched `remediation_completed` as written, so every activation would expose a new fact and quiescence could never be demonstrated.

Revision 5 replaces the observation rule. **The cursor is no longer derived from anything observable outside the inbox.**

### The three surfaces

| Surface | What it is | Who may write it | Who reads it |
|---|---|---|---|
| **Ingress inbox** | A durable, append-only state store of ingress **entries**. Each entry has a stable monotonic `seq` assigned once at append, a `fact_id` content hash that is its identity, and a `content_hash` over the source artifact. It is not a Git ref scan, not a commit count, and not a file under `tasks/` | The ingress adapters, on behalf of the producing owners. **No write under `tasks/` is required or permitted to append one** | The ingress observer |
| **Ingress cursor** | `activation.last_consumed_event_seq` in TASK-013's frontmatter | TASK-013, in the same commit as the activation's effects | The ingress observer |
| **Consumption ledger** | The event table in `tasks/TASK-013-ACTIVATION-LOG.md` | TASK-013, append-only, one row per consumed entry, written **by the consuming activation** and never afterwards | Humans and reviewers, as durable provenance |

The ledger is a **record of consumption, not a queue and not the inbox**. A row is created already consumed and already stamped with its consuming activation, so no row is ever edited and `consumed_by` is never mutated. Consumption state lives in exactly one place — the cursor — which is what F-201 required.

### Ingress fact classes

The **ingress source set** is the closed set of fact classes an adapter recognizes. Each class names where the fact lives and which owner produces it.

| `event_type` | Ingress fact class | Produced by, inside its own scope |
|---|---|---|
| `human_decision_recorded` | A commit on a non-agent branch recording a governance decision | a human |
| `branch_integrated` | A merge commit on `integration/autonomous-runtime`, or a merge of that branch into `main` | the operator or the runtime's integration step |
| `gate_verdict_recorded` | A commit on a `gate_for` owner's branch that adds or amends that owner's report artifact and records a verdict | reviewer, security, qa, or performance role, writing only its own report path |
| `remediation_completed` | A commit on a remediation owner's branch publishing the fix for a routed finding | the remediation owner |
| `dependency_unsatisfiable` | A commit on an owner's branch whose handoff records that a declared dependency cannot be satisfied | the blocked owner |
| `artifact_published` | A commit on an owner's task branch that the owner's own record names, together with its remote publication outcome | any implementation or validation owner |

The order of this table is normative: it is the **class precedence order**, highest first.

### Entry schema

| Field | Meaning |
|---|---|
| `seq` | A stable monotonic integer, assigned **once** at append time and never recomputed. It is not a count of anything outside the inbox |
| `epoch` | The ingress epoch that assigned this `seq` |
| `fact_id` | SHA-256 over the canonical identity tuple below. This is the entry's identity and the deduplication key |
| `content_hash` | SHA-256 over the bytes of the source artifact at the source commit |
| `event_type` | The single class the fact resolves to after class precedence |
| `producer_task`, `producer_role` | The owner that produced the fact inside its own write scope |
| `source_commit`, `source_path` | Provenance. They identify where the fact came from; they never determine its position |
| `appended_by` | The adapter or activation that appended the entry |
| `consumed_by` | The activation that consumed it. Written once, never mutated |

The canonical identity tuple is UTF-8 with LF separators and a trailing newline, hashed with SHA-256 and rendered lowercase hexadecimal:

```text
epoch=<n>
event_type=<event_type>
producer_task=<TASK-nnn>
source_commit=<40-hex commit id>
source_path=<repository-relative path>
content_hash=<64-hex>
```

### Rules

1. **Identity-keyed append.** An entry is appended only if its `fact_id` is not already present. Re-observing the same fact is a no-op, so appending is idempotent and a fact can never be counted twice.
2. **Append-stable positions.** `seq` is assigned in append order and never changes. A fact discovered late — a backdated commit, a branch published after the fact, a historical commit nobody had scanned — receives the **next free `seq`**. Nothing is ever inserted before an existing entry, so `ingress_seq = max(seq)` is non-decreasing for the life of the run. This is the property a count could not have.
3. **Batch order.** Facts appended in one batch are ordered by ascending `source_commit` identifier — a total order that is independent of refs, of branch existence, and of clocks. **Committer timestamps are never used for ordering**, and a timestamp is not recorded as an ordering input.
4. **Reference independence and retention.** An entry outlives the ref that carried its source commit. Deleting, rewriting, or garbage-collecting a branch cannot remove an entry and therefore cannot lower `ingress_seq`. `content_hash` lets a later reader detect that the artifact at `source_path` has been rewritten since the entry was appended, and that detection is a finding rather than a silent renumbering.
5. **Class precedence — one commit, at most one entry.** A commit matching several classes produces exactly one entry, typed by the highest-precedence class in the table above. Distinct commits are distinct facts even when they express one logical step: the merges `e8edbcd` and `c325275` are two facts, not one row.
6. **Self-exclusion, stated explicitly.** A commit authored by a TASK-013 activation on `agent/claude/orchestrator/task-013` is **never** an ingress fact under any class. TASK-013 is a consumer, not a producer. This is the rule F-301 correctly recorded as unstated; it is now normative, so an activation's own effects commit cannot raise `ingress_seq` and quiescence after an activation is demonstrable rather than assumed.
7. **The cursor.** `ingress_seq = max(seq)` over the inbox, or 0 when it is empty. **Dispatchable:** `ingress_seq > activation.last_consumed_event_seq`. **Quiescent:** they are equal. **Invalid:** `last_consumed_event_seq > ingress_seq` is rejected at load time.
8. **Exactly-once consumption.** An activation consumes the contiguous range `(last_consumed_event_seq, ingress_seq]`. The effects, the ledger rows for the consumed range, and the cursor advance are written in **one commit**. If that commit does not land, the cursor is unchanged, no ledger row exists, and the same range is consumed again by the next activation, whose effects are identical because every transition this task performs is idempotent.

### Ingress epochs

A new epoch is declared only by a numbered model correction in `tasks/TASK-013-ACTIVATION-LOG.md`. An epoch declares a `seq_base` equal to the previous epoch's high-water mark, and its first entry takes `seq_base + 1`, so the cursor is monotonic across the boundary and never runs ahead of the observed facts. **Entries from a previous epoch are never re-derived, renumbered, reclassified, or edited.**

| Epoch | Model | Entries | Status |
|---|---|---|---|
| 1 | Revision 3 and 4: scan reachable refs, order by committer timestamp then SHA, `ingress_seq` = the count | `seq` 1 … 6 | **Sealed** by `MC-002` at activation `ACT-004`. Its entries are retained as durable provenance. Under the epoch-1 rule its own high-water mark is **not reproducible**, for exactly the reasons F-301 gave; that irreproducibility is the reason the epoch boundary exists and it is recorded rather than papered over |
| 2 | The rules above | `seq_base = 6`; entries from `seq` 7 | **Active** |

### Who observes, and why bootstrap discovery is not the cursor

| Phase | Who appends | Who evaluates the predicate and dispatches | Status |
|---|---|---|---|
| Runtime phase | The ingress adapters over the durable inbox, owned by **TASK-026** | The scheduler in `src/orchestrator/scheduling/`, owned by **TASK-005** | The durable design |
| Bootstrap phase | The activation records each appended entry's full identity — `seq`, `epoch`, `fact_id`, `content_hash`, `event_type`, producer, and source — in the consumption ledger, which is the durable record of the inbox until TASK-026 exists | The human operator who launches each CLI session | The same operator-driven scheduler that dispatches every bootstrap task, with a named exit: it ends when TASK-026 and TASK-005 are integrated |

The bootstrap substitution replaces **discovery**, not identity, position, or the cursor. That distinction is what F-301 required and it is load-bearing:

- **Correctness does not depend on discovery.** An undiscovered fact keeps its identity. Whenever it is discovered it is appended at the next free `seq` and consumed exactly once. It can be late; it cannot be skipped, duplicated, or inserted before the cursor.
- **The cursor never reads a ref.** It is `max(seq)` over durable entries. Branch deletion, force-push, rebase, and clock skew cannot change it.
- **Liveness is the bounded gap.** In the bootstrap phase, whether a published fact is noticed promptly depends on the operator, exactly as it does for every other bootstrap task. The exit is named and the obligation is routed.

### Starvation bound

The scheduler must dispatch TASK-013 within a stated bounded number of scheduling rounds after `ingress_seq` increases, even under a saturated ready set, and must never dispatch it while it is quiescent.

### Where each obligation is implemented and independently validated

| Obligation | Implemented by | Independently validated by |
|---|---|---|
| Durable append-only inbox, one-time `seq` assignment, `fact_id` and `content_hash` computation, identity-keyed deduplication, retention independent of refs, crash-safe append | TASK-026 | TASK-009 `V9-F301-STORE`, TASK-011 `V11-F301-STORE` |
| Ingress adapters, class precedence, self-exclusion, batch order by source commit identifier, epoch handling | TASK-026 | TASK-009 `V9-F301-CLASS`, TASK-011 `V11-F301-CLASS` |
| Ingress observer, dispatch predicate, cursor monotonicity and upper bound | TASK-005 | TASK-009 `V9-A004-ACT`, TASK-011 `V11-A004-ACT` |
| One-commit effects-plus-cursor rule and crash replay | TASK-005 | TASK-011 `V11-A004-ACT` |
| Starvation bound under a saturated ready set | TASK-005 | TASK-009 `V9-A004-ACT`, TASK-011 `V11-A004-ACT` |
| Lineage-form edge resolution, withdrawal of the owner form, invariant 8 | TASK-005 | TASK-009 `V9-F302-LINEAGE`, TASK-011 `V11-F302-LINEAGE` |
| End-to-end loop: gate report publication → append → observation → dispatch → effects commit → cursor advance → quiescence | — | TASK-011 `V11-A004-ACT`, as an executable end-to-end test |
| Contract representation of the inbox, the epochs, and the revision-5 scheduling vocabulary | TASK-024 | TASK-025 |

The six failure modes F-301 named are each a required test: backdated publication, one commit matching several classes, deletion of the producing ref, discovery of an unseen historical fact, publication of the activation's own effects, and crash replay between dispatch and cursor advance. They are assigned to `V11-F301-STORE` and `V11-F301-CLASS`, with the static half assigned to `V9-F301-STORE` and `V9-F301-CLASS`.

## Reconciliation with the TASK-002 architecture

The architecture at commit `9576fc9` on `agent/claude/architect/task-002` was the normative technical source. TASK-015 round 1 returned `changes-required` with A-001 … A-004; TASK-016 amended it at `8d0c570`; TASK-020 returned `changes-required` at `4874a9d` with A-101 … A-105, judging A-001 `resolved`, A-002 and A-003 `partially resolved`, and A-004 `not resolved`.

**The approved architecture this graph builds on is therefore `9576fc9` as amended by `8d0c570` and further amended by the TASK-024 commit that TASK-025 approves.** Every architecture dependency edge names the lineage `LIN-ARCH-REVIEW` at `lineage_round: 3` rather than any single task, so no further retarget is required if a fourth round becomes necessary.

**Normative source rule.** F-202 recorded that TASK-003 still pinned the rejected baseline alone. Every implementation record states its normative source in the same form: *the named documents at `9576fc9` **as amended by `8d0c570` and by the TASK-024 commit that TASK-025 approves***. A record that cites a baseline without the amendment clause is a finding. No superseded baseline is ever the normative source on its own.

**Module map.** Each of the six modules in `docs/architecture/runtime/COMPONENT-BOUNDARIES.md` maps to exactly the owner task this graph assigns, and the source paths match the write-scope partition below. The seventh module added by TASK-016 maps to TASK-017. The **eighth** module, the durable ingress inbox, maps to TASK-026 and must be added by TASK-024; TASK-025 checks that it was.

**Contract roots.** `src/orchestrator/state/contracts/` is owned by TASK-003 and `src/agents/contracts/` by TASK-004. Every other task imports from a contract root and never from a sibling implementation.

**Contract change control.** No implementation task may change a type, signature, field name, or string-literal union declared in `INTERFACE-CONTRACTS.md` during Waves 3 through 7, even inside its own write scope. A task that finds a contract wrong stops at the boundary and hands off to the Orchestrator, which routes an amendment to the architect under a task shaped like TASK-016 and TASK-024. TASK-009 verifies it by diffing both contract roots against the document.

**Integration order.** `docs/architecture/runtime/INTEGRATION-STRATEGY.md` requires every task to branch from the integration branch at or after the commit where its dependencies merged, squash-merge one commit per task, and never push to `main`. The wave order above is that merge order. TASK-020's A-101 records that the document still compiles against the revision-3 vocabulary; reconciling it with revision 5 is TASK-024's obligation.

**Ownership gaps.** All three are routed and all three appear in the graph:

| Gap | Routed to | Status |
|---|---|---|
| No task owns the root toolchain manifests or `scripts/quality/**` | TASK-018 | Ownership resolved by HUMAN-001 at `fb9f45c`; now blocked only on the architecture gate |
| No module owns the agent workspace lifecycle that `AgentInvocation.worktreePath` presupposes | TASK-016 then TASK-017 | TASK-016 published `WORKSPACE-LIFECYCLE.md` and ADR-0011 at `8d0c570`. TASK-020 judged the module ownership documented but not implementation-ready: A-102 and A-103 record that registration and workspace intent cannot be made durable before their side effects. Reopened in TASK-024 |
| No module owns the durable ingress inbox the activation model requires | TASK-024 then TASK-026 | Opened by F-301. TASK-024 must add the module and its contract; TASK-026 implements it |

## Write-scope partition

Two tasks may run concurrently only when their write scopes are disjoint **and** they do not hold the same resource lock.

| Task | Write scope | Resource lock |
|---|---|---|
| TASK-001 | `tasks/**` | `task-records` |
| TASK-002 | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/**`, `docs/adr/**`, `diagrams/architecture/**` | `architecture-docs` |
| TASK-003 | `src/orchestrator/state/**`, `tests/unit/orchestrator/state/**` | — |
| TASK-004 | `src/agents/**`, `tests/unit/agents/**` | — |
| TASK-005 | `src/orchestrator/scheduling/**`, `tests/unit/orchestrator/scheduling/**` | — |
| TASK-006 | `src/orchestrator/supervisor/**`, `tests/unit/orchestrator/supervisor/**` | — |
| TASK-007 | `src/orchestrator/lifecycle/**`, `bin/**`, `tests/unit/orchestrator/lifecycle/**` | — |
| TASK-008 | `src/orchestrator/recovery/**`, `tests/unit/orchestrator/recovery/**` | — |
| TASK-009 | `reports/code-review/REVIEW.md`, `reports/code-review/runtime/**` | — |
| TASK-010 | `reports/security/**`, `specs/security/**` | — |
| TASK-011 | `reports/qa/**`, `tests/integration/**`, `tests/e2e/**`, `tests/fixtures/**` | — |
| TASK-012 | `reports/performance/**`, `tests/performance/**` | — |
| TASK-013 | `tasks/**` | `task-records` |
| TASK-014 | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md` | — |
| TASK-015 | `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md` | — |
| TASK-016 | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/runtime/**`, `docs/adr/**`, `diagrams/architecture/**` | `architecture-docs` |
| TASK-017 | `src/orchestrator/workspace/**`, `tests/unit/orchestrator/workspace/**` | — |
| TASK-018 | `package.json`, `package-lock.json`, `tsconfig.json`, `scripts/quality/**`, `scripts/ci/**`, `.github/workflows/**` | — |
| TASK-019 | `reports/code-review/TASK-018-TOOLCHAIN-REVIEW.md` | — |
| TASK-020 | `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md` | — |
| TASK-021 | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md` | — |
| TASK-022 | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md` | — |
| TASK-023 | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-5.md` | — |
| TASK-024 | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/runtime/**`, `docs/adr/**`, `diagrams/architecture/**` | `architecture-docs` |
| TASK-025 | `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md` | — |
| TASK-026 | `src/orchestrator/ingress/**`, `tests/unit/orchestrator/ingress/**` | — |

Every scope is a subset of its role's configured scope in `config/agents/settings.yaml` at commit `fb9f45c`. TASK-026's paths are inside the runtime role's configured `src/orchestrator/**` and `tests/unit/orchestrator/**`, and are disjoint from TASK-003's `state/`, TASK-005's `scheduling/`, TASK-006's `supervisor/`, TASK-007's `lifecycle/`, TASK-008's `recovery/`, and TASK-017's `workspace/`.

The nine reviewer-owned report files — TASK-009's two paths, TASK-014, TASK-015, TASK-019, TASK-020, TASK-021, TASK-022, TASK-023, and TASK-025 — are mutually path-disjoint by construction, so any of them may run concurrently.

### Overlaps that remain, and how they are serialized

Three tasks share the `architecture-docs` scope and two share `task-records`, because in each case a later task exists to revise what an earlier one produced. They declare a shared `resource_lock`.

| Lock | Held by | Why the overlap is real |
|---|---|---|
| `task-records` | TASK-001, TASK-013 | Both own `tasks/**`. TASK-013 exists to keep every task record current, which is by definition the surface TASK-001 created |
| `architecture-docs` | TASK-002, TASK-016, TASK-024 | TASK-016 amends documents TASK-002 authored, and TASK-024 amends the same documents again |

Resource-lock semantics, which TASK-005 must enforce at admission alongside write-scope exclusion:

1. At most one task holding a given resource lock may be claimed at any time.
2. A lock is not a dependency. It constrains concurrency, not order.
3. The scheduler refuses admission of a task whose lock is held and returns it to the ready set rather than queueing behind it.
4. A resource lock is declared in the task record's `resource_lock` field and is machine-readable.

TASK-002's and TASK-016's executions both released `architecture-docs`, so it is free and TASK-024 may be claimed. `task-records` is held by the TASK-013 activation that is running; TASK-001 is not claimed.

## Task-record lifecycle ownership

**Every task-record mutation in this graph is performed by the `orchestrator` role and by nothing else.** TASK-013 owns it.

| Actor | May write | Must not write |
|---|---|---|
| Implementation owner (TASK-003 … TASK-008, TASK-017, TASK-018, TASK-026) | Its own source and test scope; the commit message; the pull request description | Any file under `tasks/` |
| Validating owner (TASK-009 … TASK-012, TASK-014, TASK-015, TASK-019 … TASK-023, TASK-025) | Its own report scope; the pull request description | Any file under `tasks/` |
| Architect (TASK-002, TASK-016, TASK-024) | Its architecture scope; the commit message; the pull request description | Any file under `tasks/` |
| Orchestrator (TASK-013) | Every task record, including `status`, lifecycle directory, Handoff sections, the activation log, and this graph | Any source, test, report, or architecture file |

Each owner records its handoff where its own scope allows, and TASK-013 transcribes it into the task record, naming the source. Every task record carries a "Task-record lifecycle" section stating this, and no record instructs its owner to move itself.

This ownership rule is what produced F-201, and the ingress model above is what makes it survivable: an owner wakes TASK-013 by doing its own job in its own scope, never by writing a task record.

## Required behavior coverage

Every row names an implementing task and at least one independent validating task, and — for every behavior an amendment or a finding added — the **exact acceptance criterion** in that validator's record that obliges the check. F-202 recorded that revision 3 claimed validation that no validator contract required; a row whose obligation column is empty for an amended behavior is a finding.

| Required behavior | Implemented by | Validated by | Independent validation obligation |
|---|---|---|---|
| Start | TASK-007 | TASK-011 | TASK-011 lifecycle behavior criterion |
| Graceful drain | TASK-007 | TASK-011 | TASK-011 lifecycle behavior criterion |
| Checkpoint | TASK-003 | TASK-011, TASK-012 | TASK-011 lifecycle behavior criterion; TASK-012 checkpoint cost |
| Pause | TASK-007 | TASK-011 | TASK-011 lifecycle behavior criterion |
| Resume | TASK-003, TASK-007 | TASK-011 | TASK-011 pause-resume equivalence |
| Completion | TASK-006, TASK-007 | TASK-011 | TASK-011 lifecycle behavior criterion |
| Timeout | TASK-004, TASK-005, TASK-008 | TASK-011 | TASK-011 lifecycle behavior criterion |
| Crash recovery | TASK-008, TASK-017 | TASK-011, TASK-012 | TASK-011 crash-recovery equivalence; TASK-012 recovery time |
| Retry | TASK-004, TASK-008 | TASK-011 | TASK-011 lifecycle behavior criterion |
| Deterministic state transitions | TASK-006 | TASK-009, TASK-011 | TASK-009 state-machine contract check; TASK-011 lifecycle behavior criterion |
| Bounded concurrency | TASK-005 | TASK-011, TASK-012 | TASK-011 concurrency-limit assertion; TASK-012 dispatch throughput |
| Leases and fencing tokens | TASK-005 | TASK-009, TASK-010 | TASK-009 lease and fencing contract check; TASK-010 lease integrity assessment |
| Idempotent retries | TASK-008 | TASK-009, TASK-011 | TASK-009 idempotency contract check; TASK-011 lifecycle behavior criterion |
| Durable checkpoints | TASK-003 | TASK-010, TASK-011 | TASK-010 secret-in-state assessment; TASK-011 lifecycle behavior criterion |
| One-input project bootstrap | TASK-007 | TASK-011 | TASK-011 bootstrap validation |
| Crash-atomic journal batches and partial-write boundaries (A-001) | TASK-003 | TASK-009, TASK-011 | **TASK-009 `V9-A001`**; **TASK-011 `V11-A001`** |
| Legal recovery transitions: lease, ledger, deadline matrix (A-002) | TASK-006, TASK-008 | TASK-009, TASK-011 | **TASK-009 `V9-A002`**; **TASK-011 `V11-A002`** |
| Live run control protocol (A-003) | TASK-007 | TASK-010, TASK-011 | **TASK-010 `V10-A003-CTL`**; **TASK-011 `V11-A003-CTL`** |
| OS process-tree ownership, child and grandchild termination (A-003) | TASK-004, TASK-007, TASK-008 | TASK-010, TASK-011 | **TASK-010 `V10-A003-TREE`**; **TASK-011 `V11-A003-TREE`** |
| Typed dependency and gate readiness, no-deadlock (A-004) | TASK-005 | TASK-009, TASK-011 | **TASK-009 `V9-A004-EDGE`**; **TASK-011 `V11-A004-EDGE`** |
| Named resource-lock admission (A-004) | TASK-005 | TASK-009, TASK-010, TASK-011 | **TASK-009 `V9-A004-LOCK`**; **TASK-010 `V10-A004-LOCK`**; **TASK-011 `V11-A004-LOCK`** |
| Recurring event ingress, activation, quiescence, exactly-once, no starvation (A-004, F-104, F-201) | TASK-005 | TASK-009, TASK-011 | **TASK-009 `V9-A004-ACT`**; **TASK-011 `V11-A004-ACT`** |
| Durable append-only ingress inbox: one-time `seq`, `fact_id`, `content_hash`, identity-keyed dedup, ref-independent retention, crash-safe append (F-301) | TASK-026 | TASK-009, TASK-011 | **TASK-009 `V9-F301-STORE`**; **TASK-011 `V11-F301-STORE`** |
| Ingress class precedence, self-exclusion, batch order, epoch handling (F-301) | TASK-026 | TASK-009, TASK-010, TASK-011 | **TASK-009 `V9-F301-CLASS`**; **TASK-010 `V10-F301-AUTH`**; **TASK-011 `V11-F301-CLASS`** |
| Lineage-form gate edges, withdrawal of the owner form, invariant 8 (F-302) | TASK-005 | TASK-009, TASK-011 | **TASK-009 `V9-F302-LINEAGE`**; **TASK-011 `V11-F302-LINEAGE`** |
| Working `claude`, `gpt`, and `gemini` adapters | TASK-004 | TASK-009, TASK-010, TASK-011 | TASK-009 adapter completeness check; TASK-010 adapter credential assessment; TASK-011 adapter surface validation |
| Provider command discovery and diagnostics | TASK-004 | TASK-010, TASK-011 | TASK-010 adapter credential assessment; TASK-011 adapter surface validation |
| Automated hook verification and installation | TASK-017 | TASK-010, TASK-011 | TASK-010 workspace integrity assessment; TASK-011 workspace lifecycle validation |
| Automated branch and worktree creation | TASK-017 | TASK-009, TASK-010, TASK-011 | TASK-009 workspace invocation check; TASK-010 workspace integrity assessment; TASK-011 workspace lifecycle validation |
| Automated task-lock claim and release | TASK-017 | TASK-010, TASK-011 | TASK-010 workspace integrity assessment; TASK-011 workspace lifecycle validation |
| Automated write-scope validation before handoff | TASK-017 | TASK-009, TASK-010, TASK-011 | TASK-009 workspace invocation check; TASK-010 workspace integrity assessment; TASK-011 workspace lifecycle validation |
| Durable commit and handoff persistence | TASK-017 | TASK-011 | TASK-011 workspace lifecycle validation |
| Task-branch publication, idempotent pull-request creation, explicit blocked remote outcome (F-105) | TASK-017 | TASK-009, TASK-010, TASK-011 | **TASK-009 `V9-F105`**; **TASK-010 `V10-F105`**; **TASK-011 `V11-F105`** |
| Crash-safe workspace cleanup and reconciliation | TASK-017, TASK-008 | TASK-011, TASK-012 | TASK-011 workspace lifecycle validation; TASK-012 workspace cost measurement |
| Compiling, testable toolchain | TASK-018 | TASK-019, TASK-010 | TASK-019 ADR-0001 parameter judgments and dependency inventory; **TASK-010 `V10-TOOLCHAIN`** |
| Workspace lifecycle architecture | TASK-016, TASK-024 | TASK-025 | TASK-025 Part B module-map and contract criteria |
| Amended runtime contracts for A-001 … A-004 and A-101 … A-105 | TASK-016, TASK-024 | TASK-025 | TASK-025 Part A dispositions |

An implementing task's own unit tests never satisfy a row in the right-hand column.

**Tag tally, stated by enumeration rather than by assertion.** TASK-022 recorded that revision 4's prose called the tagged set "eighteen" while the matrix contained **19**. That tally error is corrected here and the count is given per validator so it can be recomputed from the records rather than trusted:

| Validator | Tags declared before revision 5 | Tags added by revision 5 | Total |
|---|---|---|---|
| TASK-009 | `V9-A001`, `V9-A002`, `V9-A004-EDGE`, `V9-A004-LOCK`, `V9-A004-ACT`, `V9-F105` — 6 | `V9-F301-STORE`, `V9-F301-CLASS`, `V9-F302-LINEAGE` — 3 | 9 |
| TASK-010 | `V10-A003-CTL`, `V10-A003-TREE`, `V10-A004-LOCK`, `V10-F105`, `V10-TOOLCHAIN` — 5 | `V10-F301-AUTH` — 1 | 6 |
| TASK-011 | `V11-A001`, `V11-A002`, `V11-A003-CTL`, `V11-A003-TREE`, `V11-A004-EDGE`, `V11-A004-LOCK`, `V11-A004-ACT`, `V11-F105` — 8 | `V11-F301-STORE`, `V11-F301-CLASS`, `V11-F302-LINEAGE` — 3 | 11 |
| **Total** | **19** | **7** | **26** |

Each tag must exist as a named acceptance criterion and expected artifact in the record it is cited from.

## Findings return path

```text
TASK-009 / TASK-010 / TASK-011 / TASK-012                                   runtime findings
TASK-014 / TASK-015 / TASK-019 … TASK-023, TASK-025                          decomposition, architecture, and toolchain findings
        |  the owner publishes its report inside its own write scope
        |  -> an ingress adapter appends one entry keyed by its fact_id; no task record is written
        v
the ingress observer sees ingress_seq > cursor and dispatches TASK-013
        v
TASK-013 (orchestrator)
        |  creates one remediation task per responsible owner, or records the
        |  disposition when the responsible owner is the Orchestrator itself,
        |  performs the lifecycle transition, records the gate status,
        |  appends one ledger row per consumed entry, advances the cursor —
        |  all in one commit
        v
the named owner applies the fix on a new branch from the current integration branch
        |
        v
a new gate task records the next round of the same lineage and the gate closes
```

Validating roles report and revalidate; they never implement the fix. A validating role never revalidates in the execution context that produced the change. High and critical security findings block delivery until they are resolved or formally accepted by an authorized human. Remediation branches follow the same write-scope partition and the same contract change control as the original.

## Operational notes for each next owner

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId <id> -Role <role> -Llm <llm>`. Reuse an existing worktree when the task already has one.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1` before editing.
3. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree`.
4. Commit on the task branch. Push the task branch and open or update a pull request; never push `main`. If publication is unavailable and your `publication_class` is `bootstrap`, record `publication: local-only` with the reason so the Orchestrator can transcribe it accurately. If your `publication_class` is `runtime`, an unavailable remote is a `blocked` outcome, not a `local-only` success.
5. Run `scripts/orchestration/release-task.ps1`.
6. Record the handoff where your own write scope allows — the commit message, the pull request description, and your role's report artifact. **Do not move your task record and do not edit its `status` field.** The Orchestrator performs every task-record transition under TASK-013. Publishing your own artifact is how you wake it; you never write to `tasks/`.

Steps 1 through 5 are what TASK-017 automates for runtime-dispatched work, including step 4's publication and pull-request outcome. They remain the manual procedure for the human-launched CLI sessions that build the runtime itself.
