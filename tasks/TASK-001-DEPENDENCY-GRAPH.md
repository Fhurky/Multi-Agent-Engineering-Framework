# TASK-001 Dependency Graph

Durable handoff note for the autonomous multi-agent runtime task graph. It records the dependency order, ownership, write-scope partition, edge semantics, gate scheduling classes, and the activation and event-ingress model. Individual task records remain the authoritative source for scope and acceptance criteria; this document is kept in agreement with them by TASK-013.

**Revision 4**, produced by TASK-013 activation `ACT-002`. Revision 3 was reviewed by TASK-021 round 3, which returned `changes-required` with findings F-201 through F-205 in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md`, and recorded F-101 and F-104 as only `partially resolved`. This revision applies every resulting correction and routes every finding. The per-finding disposition register is in `tasks/TASK-013-ACTIVATION-LOG.md`, activation `ACT-002`.

Revision history: revision 2 was reviewed by TASK-014 round 2 (`changes-required`, F-101 … F-105); TASK-015 round 1 returned `changes-required` on the TASK-002 architecture (A-001 … A-004); human governance decision HUMAN-001 was recorded at `fb9f45c`; revision 3 was produced by `ACT-001`.

## Dependency edge semantics

Revision 2 used a single `implementation_published` edge that required the target to be **merged to `main`**. That was the root cause of F-101: a pre-merge review gate waits for merge while merge waits for the gate. Revision 3 split that edge into two typed conditions with distinct satisfying states and added a per-task declaration of which gates block integration. Revision 4 adds the gate-owner form of `gate_passed` required by F-204 and the publication classes required by the residual half of F-101 and F-104.

| Edge | Written as | Satisfied when | Used for |
|---|---|---|---|
| `review_ready` | `{task: X, edge: review_ready}` | X has reached `review`, its record names an immutable `published_commit` on `published_branch`, and X's `publication_class` is satisfied under **Publication classes** below | The readiness edge for a gate task. It says nothing about merge |
| `integrated` | `{task: X, edge: integrated}` | X is `review_ready`, **every** gate named in X's `pre_merge_gates` has recorded a passing or formally accepted verdict, and X's branch has been merged into `integration/autonomous-runtime` per the integration order | A compile-time or contract-consumption edge between implementations |
| `gate_passed` — target form | `{task: X, edge: gate_passed, gate: <name>, round: <n>}` where X declares `<name>` in its `required_gates` | X is `review_ready` and the gate relation `(X, <name>)` is **closed** under the gate-round rule, with the closing verdict at round ≥ `<n>` | An approved decision that downstream work builds on — architecture before implementation |
| `gate_passed` — owner form | `{task: G, edge: gate_passed, gate: <name>, round: <n>}` where G declares `gate: <name>` in its `gate_for` | Gate task G has recorded a passing or formally accepted verdict for gate `<name>` at round ≥ `<n>`, for **every** target it gates under that gate name at that round | A downstream validator that requires a *passing* upstream validation baseline — TASK-012 on TASK-011's QA baseline |
| `gate_recorded` | `{task: X, edge: gate_recorded}` | X, itself a gate task, has recorded its verdict, whatever that verdict is | One task needing another validator's recorded outcome, pass or fail — TASK-016 on TASK-015 |
| `human_decision` | `{task: HUMAN-nnn, edge: human_decision}` | A human has recorded the named decision in a tracked commit on a non-agent branch | Work an agent is structurally forbidden to unblock |
| `terminal` | `{task: X, edge: terminal}` | X has reached `done` | Reserved. No task in this graph uses it; it exists so the scheduler can reject its misuse |

`round` defaults to 1 when omitted on a `gate_passed` edge.

`gate_recorded` and the owner form of `gate_passed` differ in exactly one way, and the difference is what F-204 recorded: `gate_recorded` is satisfied by **any** verdict including `changes-required`; the owner form of `gate_passed` is satisfied only by a **passing or formally accepted** verdict. A task whose stated prerequisite is a working upstream baseline must use the owner form. A task that is the remediation *for* a failing verdict must use `gate_recorded`, because a passing verdict will never exist at that round.

### Publication classes

`review_ready` requires an immutable published commit. What else it requires depends on which class the producing task declares. Revision 3 stated the ordinary requirement in one place and a contradicting bootstrap allowance in another; that inconsistency is the residual half of F-101 and F-104. Revision 4 makes the two classes explicit, disjoint, and separately named.

| `publication_class` | Applies to | Satisfying condition | Recorded as |
|---|---|---|---|
| `runtime` | Every task the runtime dispatches — TASK-003 … TASK-008, TASK-017, TASK-018 | Immutable published commit **and** the task branch pushed to the configured remote **and** an open or updated pull request for that branch | `publication: published`, with `published_remote_ref` and `pull_request` |
| `bootstrap` | The human-launched CLI sessions that build the runtime itself — TASK-001, TASK-002, TASK-013 activations, TASK-014, TASK-015, TASK-016, TASK-019 … TASK-022 | Immutable published commit readable from the shared Git common directory, **plus** remote publication and a pull request when the operator's environment permits one | `publication: published` when the remote step succeeded, or `publication: local-only` with `publication_reason` when it did not |

Three rules keep the two classes from contaminating each other:

1. A `bootstrap` task's `local-only` publication satisfies `review_ready` **for that task only**, and only because a bootstrap task's consumer is another bootstrap task reading the same Git common directory. It is a named, recorded limitation of the bootstrap phase.
2. A `local-only` publication **never** satisfies `review_ready` for a task whose `publication_class` is `runtime`. TASK-017 must return an explicit `blocked` outcome instead, and TASK-018's acceptance criteria require the publication outcome to be recorded rather than assumed.
3. The class is a declared field, not an inference. A task record that omits `publication_class` is rejected by the graph validator that TASK-005 owns.

| Task | `publication_class` | `published_commit` | `published_branch` | `publication` |
|---|---|---|---|---|
| TASK-001 | `bootstrap` | `657b83a`, superseded by the `ACT-001` commit `5febe3b` and its follow-up `88dc554` on `agent/claude/orchestrator/task-013` | `agent/claude/orchestrator/task-013` | `published` — integrated at `e8edbcd` and merged to `main` at `c325275` through pull request #1 |
| TASK-002 | `bootstrap` | `9576fc9` | `agent/claude/architect/task-002` | `local-only` — the executing session was instructed not to push |
| TASK-014 | `bootstrap` | `abb85d9` | `agent/gpt/reviewer/task-014` | `local-only` — same reason |
| TASK-015 | `bootstrap` | `8632469` | `agent/gpt/reviewer/task-015` | `local-only` — same reason |
| TASK-021 | `bootstrap` | `adfb982` | `agent/gpt/reviewer/task-021` | `published` — pushed to `origin` and opened as pull request #2 after the reviewer's own session recorded `local-only` |

TASK-021 is the first record in this graph whose publication was completed rather than deferred. Its own report still records `publication: local-only`, because the push succeeded outside the reviewer's execution. TASK-013 transcribes both facts and does not overwrite the reviewer's statement.

### Gate rounds and gate closure

`gate_for` declares that a task performs a named gate for a target. **`gate_for` is not a scheduling edge.** It points in the opposite direction from the scheduling edges and is evaluated only when TASK-013 decides whether a target's gate is closed. `gate_tasks` is the target's view of the same relation. `gate_for` and `gate_tasks` must agree pairwise, including on `round`.

A gate may be recorded more than once. Each pair carries a `round`, which **defaults to 1 when omitted**. Only a gate that has been recorded more than once needs an explicit round on both sides.

1. The status of a gate is the verdict recorded at its **highest** round.
2. A `changes-required` verdict at round *n* must name a `remediated_by` task or activation and a `revalidated_by` task. The gate stays open.
3. The gate is **closed** when the highest round records `approved`, `approved-with-findings` with every blocking finding resolved, or a formal acceptance recorded by an authorized human.
4. A verdict is durable. A later round never rewrites an earlier one; it supersedes it, and both stay recorded.
5. **One review produces exactly one verdict.** A gate task that carries more than one `gate_for` relation records that single verdict once and applies it **atomically** to every relation it carries: all of them close together or all of them stay open together. The application produces one durable gate-verdict fact per relation, so a target reads its own gate status from its own relation, but a split outcome across relations is not representable. TASK-020 is the only task in this graph with more than one relation; its single verdict yields the two facts `(TASK-016, review, round 1)` and `(TASK-002, review, round 2)`. This is the correction for F-205, which recorded three mutually inconsistent cardinality statements.

This is what makes an independent verdict permanent instead of re-entrant. TASK-014's two verdicts, TASK-015's verdict, and TASK-021's verdict are final for the artifacts they reviewed; the corrected artifacts are reviewed by new tasks in a new round.

### Gate-ready semantics, stated plainly

A task becomes **dispatchable** when every edge in its `dependencies` is satisfied. A task becomes **integrable** when it is `review_ready` and every gate in its `pre_merge_gates` is closed. A task becomes **done** when it is integrated and every gate in its `gate_tasks` is closed.

These are three conditions over two edge sets pointing in opposite directions. That separation is what makes the graph schedulable: TASK-019 becomes dispatchable when TASK-018 is `review_ready`, TASK-018 becomes integrable when TASK-019's verdict closes its review gate, and TASK-018 becomes done only after TASK-010's retrospective security verdict.

### Why `integrated` is gated by `pre_merge_gates` and not by all gates

Requiring every gate to pass before integration would reintroduce F-101 in a new place. TASK-005 consumes TASK-003 at compile time; TASK-009 reviews TASK-003 **and** TASK-005 together at Wave 7. If `integrated(TASK-003)` required TASK-009's verdict, then TASK-005 could not start until TASK-009 ran, and TASK-009 could not run until TASK-005 published. That is a cycle.

Each task therefore declares `pre_merge_gates`: the subset of its `required_gates` that must close before its branch may be integrated. The remainder are **assembly gates**, which run against the integration branch after merge and still block `done`.

| Task | `pre_merge_gates` | Assembly gates (block `done`, not merge) |
|---|---|---|
| TASK-002 | `review` | — |
| TASK-016 | `review` | — |
| TASK-018 | `review` | `security` |
| TASK-003 … TASK-008, TASK-017 | — | `review`, `security`, `qa`, `performance` where declared |

A task with an empty `pre_merge_gates` reaches `integrated` as soon as it is `review_ready` and merged in wave order. A task with a non-empty `pre_merge_gates` cannot be merged until those gates close, which is what makes TASK-019 and TASK-020 schedulable before their targets merge.

## Gate scheduling classes

Revision 3 asserted that "a gate owner must be schedulable when its target publishes, not several waves later" and named TASK-018's security gate as the single retrospective exception. F-203 recorded that both statements are false: TASK-009, TASK-010, and TASK-011 each wait for *every* runtime component before they can gate *any one* of them, and every assembly gate on TASK-003 … TASK-008 and TASK-017 closes after its target is already integrated. Revision 4 replaces the false claim with two independent, declared, machine-checkable properties.

Every `gate_for` / `gate_tasks` pair carries both:

| Property | Values | Meaning | How it is decided |
|---|---|---|---|
| `gate_class` | `point`, `aggregate` | Scheduling timeliness | `point` when the gate owner is dispatchable at the moment the artifact that this round reviews becomes `review_ready` — that is, when publication of the reviewed artifact is the last of the owner's dependencies to be satisfied. `aggregate` when the owner holds at least one further dependency that is satisfied later, so gating this target is deliberately batched with others |
| `retrospective` | `true`, `false` | Ordering against integration | `true` when the gate is **not** in the target's `pre_merge_gates`, so the target is integrated before this gate closes. `false` when the gate blocks integration |

**Which artifact a round reviews.** At round 1 the reviewed artifact is the target itself, so the reference point is `review_ready(<target>)`. At round *n* > 1 the reviewed artifact is the **remediation** named by round *n* − 1's `remediated_by`, so the reference point is that remediation's publication. This matters and is not a technicality: TASK-020 carries TASK-002's review gate at round 2 while depending on `review_ready(TASK-016)`, and TASK-016 *is* the remediation for round 1's verdict. TASK-020 is therefore dispatchable exactly when the artifact it reviews publishes, which is what `point` means. The same holds for TASK-014 round 2, TASK-021 round 3, and TASK-022 round 4, each of which reviews a TASK-001 remediation republished on the remediating branch.

The two are independent, and all three combinations that occur in this graph occur for different reasons:

- `point` and `retrospective: false` — TASK-019 on TASK-018 review, TASK-020 on TASK-016 review and TASK-002 review, TASK-015 on TASK-002 review. The gate blocks integration and its owner is dispatchable the moment the reviewed artifact publishes. This is the ideal case.
- `point` and `retrospective: true` — every round of TASK-001's own review gate, owned by TASK-014, TASK-021, and TASK-022. TASK-001 declares `pre_merge_gates: []`, so each revision of the decomposition is integrated while its review gate is still open; the `ACT-001` revision was merged to `main` at `c325275` with round 3 unrecorded. The reviewer is nevertheless dispatchable as soon as the revision publishes.
- `aggregate` and `retrospective: true` — every runtime assembly gate, and TASK-012 with an additional cross-cohort wait on a passing QA baseline.

No gate in this graph is `aggregate` and `retrospective: false`, which would mean a pre-merge gate that batches — the combination that would actually stall integration.

**The rule, stated truthfully.** A gate owner is expected to be `point` unless the pair declares `gate_class: aggregate` and appears in the register below with a reason and a recorded risk. TASK-005's graph validator rejects, at load time, a pair whose computed class disagrees with its declared class, and a pair declared `aggregate` or `retrospective: true` that has no register entry.

### Aggregate and retrospective gate register

Every delayed gate in this graph, its reason, and its accepted risk. No pair outside this register may be `aggregate` or `retrospective`.

| Gate owner | Gate | Cohort it gates | Class | Retrospective | Reason the delay is accepted | Recorded risk |
|---|---|---|---|---|---|---|
| TASK-009 | review | TASK-003 … TASK-008, TASK-017 | aggregate | true | The runtime review is a cross-module correctness review: contract-root drift, workspace invocation on every dispatch path, and adapter completeness are only observable once every module exists. Reviewing TASK-003 alone at Wave 3 could not check any of them | TASK-003 and TASK-004 sit integrated on the integration branch from Wave 3 to Wave 7 with no independent review. A defect found at Wave 7 invalidates work in up to five downstream tasks. Mitigations: the contract change control rule freezes both contract roots during Waves 3 … 6, and every implementation task carries its own unit-test acceptance criteria |
| TASK-010 | security | TASK-003 … TASK-008, TASK-017 | aggregate | true | Threat modelling is performed against the assembled runtime. Credential flow, untrusted-input handling, lease integrity, and push-protection integrity all cross module boundaries | Same exposure window as the review gate, with the additional consequence that a High or Critical finding at Wave 7 blocks delivery for the whole graph. Mitigation: the repository's baseline security CI workflow runs on every pull request in the meantime |
| TASK-010 | security | TASK-018 | aggregate | true | No code exists to threat-model before a toolchain exists, so the toolchain integrates at Wave 2 and is assessed at Wave 7 | The toolchain and its devDependency surface sit on the integration branch unassessed for five waves. Mitigations: ADR-0001's zero-third-party-runtime-dependency rule, the dependency inventory TASK-019 must produce as a pre-merge gate, and the baseline security CI workflow |
| TASK-011 | qa | TASK-003 … TASK-008, TASK-017 | aggregate | true | End-to-end lifecycle validation requires a startable runtime. Pause-resume equivalence, crash-recovery equivalence, and the activation ingress loop are not expressible against a single module | Same exposure window. A defect in an early module surfaces only after every later module was built on it |
| TASK-012 | performance | TASK-005, TASK-006, TASK-008 | aggregate | true | Throughput, checkpoint cost, and recovery time are properties of the assembled system, and this gate additionally waits on a passing QA baseline so it does not measure a system QA has already rejected | Runs one wave after every other gate. An optimization finding arrives after the code is integrated and reviewed, so remediation reopens an already-gated task |
| TASK-014, TASK-021, TASK-022 | review | TASK-001 rounds 1 … 4 | point | true | TASK-001 declares `pre_merge_gates: []`. The decomposition is a task-record artifact that every other owner and every subsequent reviewer must read from the integration branch, so each revision is integrated as soon as it is authored rather than held behind its own review gate. Holding it back would leave the graph that schedules every task readable only on one agent branch | The `ACT-001` revision reached `main` at `c325275` while round 3 was unrecorded, and round 3 then returned `changes-required`. A defective decomposition can therefore be the graph of record for a whole round. Mitigations: the gate owner is `point`, so the delay is one review and not one wave; each round's target commit is immutable, so a later revision cannot rewrite what was reviewed; and TASK-001 cannot reach `done` until a round records a passing verdict, which is enforced separately from integration |
| TASK-019 | review | TASK-018 | point | false | — | — |
| TASK-020 | review | TASK-016 round 1, TASK-002 round 2 | point | false | — | — |
| TASK-015 | review | TASK-002 round 1 | point | false | — | — |

The alternative F-203 offered — splitting each aggregate gate into one gate task per target so every gate is `point` — is rejected here and the rejection is recorded rather than left implicit. Splitting TASK-009 into seven review tasks would produce seven reviewers that each cannot check the cross-module properties the gate exists for, would multiply the report write-scope partition by seven, and would still need an eighth aggregate reviewer for the properties that only exist at assembly. The batching is a real architectural property of the review, not a scheduling oversight; what was wrong in revision 3 was claiming it did not exist.

## No-deadlock invariant

The graph is valid only if all seven hold:

1. The directed graph over `review_ready`, `integrated`, `gate_passed`, `gate_recorded`, `terminal`, and `human_decision` edges is acyclic.
2. No task holding `gate_for: X` also holds a `gate_passed(X)`, `integrated(X)`, or `terminal(X)` edge. It may hold `review_ready(X)`, which is satisfiable while X is still in `review` and unmerged.
3. Every `gate_for` entry has a matching `gate_tasks` entry on the target and the reverse, agreeing on gate name, round, `gate_class`, and `retrospective`.
4. For every task X, no gate task owning a gate in X's `pre_merge_gates` holds an `integrated(X)` edge. Otherwise merge would wait on a gate that waits on merge.
5. The relation induced by expanding each `integrated(X)` edge into `review_ready(X)` plus the edges of X's `pre_merge_gates` owners is itself acyclic.
6. Every `gate_passed(X, g, n)` edge resolves to exactly one form: either X declares `g` in `required_gates` (target form) or X declares `gate: g` in a `gate_for` entry (owner form). An edge for which both hold, or neither holds, is rejected at load time as ambiguous.
7. Every `gate_for` / `gate_tasks` pair declares `gate_class` and `retrospective`; the declared `gate_class` equals the class computed from the owner's dependency set against the publication of the artifact that round reviews; the declared `retrospective` equals `gate ∉ target.pre_merge_gates`; and every pair declaring `gate_class: aggregate` or `retrospective: true` has an entry in the aggregate and retrospective gate register.

TASK-005 owns enforcement: it implements ready-task selection over these edge types and rejects a graph violating any invariant at load time rather than deadlocking at run time.

**Verification of this graph against the invariant.**

- Invariant 1 and 5: the topological order `HUMAN-001, TASK-001, TASK-014, TASK-021, TASK-022, TASK-002, TASK-015, TASK-016, TASK-020, TASK-018, TASK-019, TASK-003, TASK-004, TASK-017, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013` places every task after all of its dependencies and after the pre-merge gate owners of every task it integrates. TASK-012's new `gate_passed(TASK-011, qa, 1)` edge points backwards along this order, from position 22 to position 21. No cycle exists.
- Invariant 2: TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, TASK-019, TASK-020, TASK-021, and TASK-022 are the only tasks with `gate_for` entries. Every edge each of them holds to a task it gates is `review_ready`. TASK-012's only non-`review_ready` edge is `gate_passed(TASK-011, qa, 1)`, and TASK-012 does not gate TASK-011. TASK-020 gates TASK-002 round 2 and holds no edge to TASK-002 at all.
- Invariant 3: checked pairwise in the gate assignment table and the register below.
- Invariant 4: the only non-empty `pre_merge_gates` are TASK-002 `review` (TASK-015 round 1, TASK-020 round 2), TASK-016 `review` (TASK-020 round 1), and TASK-018 `review` (TASK-019 round 1). None of TASK-015, TASK-019, or TASK-020 holds an `integrated` edge to its target.
- Invariant 6: exactly one `gate_passed` owner-form edge exists — TASK-012's on TASK-011. TASK-011 declares `required_gates: []` and declares `gate: qa` in seven `gate_for` entries, so the owner form resolves and the target form does not. Every other `gate_passed` edge names TASK-016, which declares `review` in `required_gates` and holds no `gate_for` entry, so the target form resolves and the owner form does not.
- Invariant 7: all 33 `gate_for` / `gate_tasks` pairs carry both properties and agree on both across the pair. Each declared `retrospective` was recomputed as `gate ∉ target.pre_merge_gates`: `false` for the four pairs whose gate is a pre-merge gate — TASK-015 round 1 and TASK-020 round 2 on TASK-002, TASK-020 round 1 on TASK-016, TASK-019 round 1 on TASK-018 — and `true` for the other 29, which are the 25 runtime and toolchain assembly gates plus the four rounds of TASK-001's own review gate, since TASK-001 declares `pre_merge_gates: []`. Each declared `gate_class` was recomputed against the publication of the artifact that round reviews: `point` for the eight decomposition, architecture, and toolchain review rounds, `aggregate` for the 25 assembly gates. Every `aggregate` or `retrospective: true` pair appears in the register above.

## Ownership and dependency order

| Task | Title | Owner role | LLM | Depends on | State |
|---|---|---|---|---|---|
| TASK-001 | Decompose the autonomous multi-agent runtime | orchestrator | claude | — | review |
| TASK-002 | Runtime architecture and ADRs | architect | claude | — | review |
| TASK-003 | Durable run state and checkpoints | runtime | claude | TASK-016 `gate_passed(review)`; TASK-018 `integrated` | blocked |
| TASK-004 | Provider adapters and agent workers | runtime | claude | TASK-016 `gate_passed(review)`; TASK-018 `integrated` | blocked |
| TASK-005 | Scheduling, leases, fencing, bounded concurrency | runtime | claude | TASK-016 `gate_passed(review)`; TASK-003, TASK-004 `integrated` | blocked |
| TASK-006 | Supervisor core and state machine | runtime | claude | TASK-016 `gate_passed(review)`; TASK-003, TASK-004, TASK-005, TASK-017 `integrated` | blocked |
| TASK-007 | Lifecycle control and one-input bootstrap | runtime | claude | TASK-016 `gate_passed(review)`; TASK-006 `integrated` | blocked |
| TASK-008 | Crash recovery, timeouts, idempotent retries | runtime | claude | TASK-016 `gate_passed(review)`; TASK-003, TASK-004, TASK-006, TASK-017 `integrated` | blocked |
| TASK-009 | Independent code review of the runtime | reviewer | gpt | TASK-003 … TASK-008, TASK-017 `review_ready` | blocked |
| TASK-010 | Security review of the runtime | security | gpt | TASK-003 … TASK-008, TASK-017, TASK-018 `review_ready` | blocked |
| TASK-011 | QA validation of the runtime | qa | gemini | TASK-003 … TASK-008, TASK-017 `review_ready` | blocked |
| TASK-012 | Performance validation of the runtime | performance | gemini | TASK-005, TASK-006, TASK-008, TASK-017 `review_ready`; TASK-011 `gate_passed(qa, 1)` | blocked |
| TASK-013 | Task-record lifecycle transitions and gate closure | orchestrator | claude | — (event-triggered) | blocked, quiescent |
| TASK-014 | Independent review of this decomposition, rounds 1–2 | reviewer | gpt | TASK-001 `review_ready` | done |
| TASK-015 | Independent architecture review of TASK-002, round 1 | reviewer | gpt | TASK-002 `review_ready` | done |
| TASK-016 | Architecture amendment: runtime contracts and workspace lifecycle | architect | claude | TASK-015 `gate_recorded` | ready |
| TASK-017 | Agent workspace lifecycle automation | runtime | claude | TASK-016 `gate_passed(review)`; TASK-003, TASK-018 `integrated` | blocked |
| TASK-018 | Runtime toolchain bootstrap | devops | claude | TASK-016 `gate_passed(review)` | blocked |
| TASK-019 | Independent review of the runtime toolchain | reviewer | gpt | TASK-018 `review_ready` | blocked |
| TASK-020 | Independent review of the architecture amendment | reviewer | gpt | TASK-016 `review_ready` | blocked |
| TASK-021 | Independent re-review of the corrected decomposition, round 3 | reviewer | gpt | TASK-001 `review_ready` | done |
| TASK-022 | Independent re-review of the corrected decomposition, round 4 | reviewer | gpt | TASK-001 `review_ready` | ready |

`HUMAN-001` is resolved. Commit `fb9f45c`, `chore: assign runtime toolchain ownership to devops`, adopted option A and added `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**` to `assignments.devops.write_scope`. No task carries a `human_decision` edge any longer.

## Gate assignment

Every `required_gates` entry has a named owner, every round is recorded, and every pair declares its scheduling class.

| Gated task | Gate | Owner and round | Verdict | `gate_class` | `retrospective` |
|---|---|---|---|---|---|
| TASK-001 | review | TASK-014 r1 | `changes-required` | point | true |
| TASK-001 | review | TASK-014 r2 | `changes-required` | point | true |
| TASK-001 | review | TASK-021 r3 | `changes-required` | point | true |
| TASK-001 | review | TASK-022 r4 | pending | point | true |
| TASK-002 | review | TASK-015 r1 | `changes-required` | point | false |
| TASK-002 | review | TASK-020 r2 | pending | point | false |
| TASK-003 | review / security / qa | TASK-009 / TASK-010 / TASK-011, r1 | pending | aggregate | true |
| TASK-004 | review / security / qa | TASK-009 / TASK-010 / TASK-011, r1 | pending | aggregate | true |
| TASK-005 | review / security / qa / performance | TASK-009 / TASK-010 / TASK-011 / TASK-012, r1 | pending | aggregate | true |
| TASK-006 | review / security / qa / performance | TASK-009 / TASK-010 / TASK-011 / TASK-012, r1 | pending | aggregate | true |
| TASK-007 | review / security / qa | TASK-009 / TASK-010 / TASK-011, r1 | pending | aggregate | true |
| TASK-008 | review / security / qa / performance | TASK-009 / TASK-010 / TASK-011 / TASK-012, r1 | pending | aggregate | true |
| TASK-016 | review | TASK-020 r1 | pending | point | false |
| TASK-017 | review / security / qa | TASK-009 / TASK-010 / TASK-011, r1 | pending | aggregate | true |
| TASK-018 | review | TASK-019 r1 | pending | point | false |
| TASK-018 | security | TASK-010 r1 | pending | aggregate | true |

Author and gate owner are always different roles, different execution contexts, and different LLM families. No task gates itself, and no remediation returns to the execution context that reviewed it.

Two properties of this table are deliberate and are stated without overclaiming:

1. **A pre-merge gate owner is always `point`, and no pre-merge gate is `aggregate`.** TASK-015, TASK-019, and TASK-020 are each dispatchable when the artifact they review publishes, so no gate that blocks integration ever waits several waves. That is the property the graph actually needs and can actually keep. It is narrower than revision 3's claim, which asserted timeliness for every gate owner and was false for TASK-009 through TASK-012.
2. **A superseding round is a new task, not a re-entrant one.** TASK-014, TASK-015, and TASK-021 recorded durable verdicts and are `done`. TASK-020 and TASK-022 perform the next rounds. This removes the F-102 defect at its source: a task no longer carries an undeclared per-round dependency, because each round is a task with its own dependency.

Assembly gates are `aggregate` and `retrospective`, and the register above records why for each and what it costs.

## Execution waves

```text
Wave 0   TASK-016 | TASK-022                 architecture amendment; decomposition re-review round 4
         TASK-013                            event-triggered, quiescent, not a wave member
Wave 1   TASK-020                            gate the architecture amendment before it merges
Wave 2   TASK-018                            toolchain, needs the amended architecture approved
         TASK-019                            gate the toolchain before it merges
Wave 3   TASK-003 | TASK-004                 parallel, disjoint scopes, both need the toolchain integrated
Wave 4   TASK-005 | TASK-017                 parallel, disjoint scopes
Wave 5   TASK-006                            needs state, workers, scheduler, workspace
Wave 6   TASK-007 | TASK-008                 parallel, disjoint scopes
Wave 7   TASK-009 | TASK-010 | TASK-011      parallel, separate execution contexts; all three are aggregate gates
Wave 8   TASK-012                            needs a passing QA baseline, not merely a recorded one
```

TASK-013 is not a wave and is not claimed at wave boundaries on a timer. It is dispatched only when an unconsumed ingress fact exists; see the activation model below.

## TASK-013 activation and event-ingress model

Revision 3 gave TASK-013 a durable cursor, a quiescent state, and a closed event-type set, which removed F-104's infinite redispatch loop. F-201 then recorded that the replacement contained a wake-up deadlock and an impossible consumption representation:

- TASK-013 exclusively owns `tasks/**`, the event log lives under `tasks/`, and TASK-013 is dispatchable only when a new row exists in that log. No other task or component had a write-authorized operation that could create the row, so after TASK-021 recorded its verdict nothing could wake TASK-013.
- The log declared its rows immutable, declared an empty `consumed_by` the signal of dispatchability, and required TASK-005 to later set `consumed_by` exactly once. Setting the field edits an immutable row; not setting it means the dispatch signal never appears.

Revision 4 replaces the model. The correction is structural, not procedural: **the event producer is no longer TASK-013, and the dispatch signal is no longer a row in a file TASK-013 owns.**

### The three surfaces

| Surface | What it is | Who may write it | Who reads it |
|---|---|---|---|
| **Ingress fact** | A durable Git-observable fact that already exists because some owner did its own job inside its own write scope: a gate report published at an immutable commit, a branch merged into `integration/autonomous-runtime`, a governance commit on a non-agent branch, a remediation branch published | The producing owner, entirely within its configured write scope. **No write under `tasks/` is required or permitted to create one** | The ingress observer |
| **Ingress cursor** | `activation.last_consumed_event_seq` in TASK-013's frontmatter | TASK-013, in the same commit as the activation's effects | The ingress observer |
| **Ingress ledger** | The event table in `tasks/TASK-013-ACTIVATION-LOG.md` | TASK-013, append-only, one row per consumed fact, written **by the consuming activation** and never afterwards | Humans and reviewers, as durable provenance |

The ledger is a **record of consumption, not a queue**. A row is created already consumed and already stamped with its consuming activation, so no row is ever edited and `consumed_by` is never mutated. Consumption state lives in exactly one place — the cursor — which is what F-201 required.

### Ingress source set and the dispatch predicate

The **ingress source set** is the closed set of fact classes the observer scans. Each class names where the fact lives and which owner produces it.

| `event_type` | Ingress fact class | Produced by, inside its own scope |
|---|---|---|
| `gate_verdict_recorded` | A commit on a `gate_for` owner's branch that adds or amends that owner's report artifact and records a verdict | reviewer, security, qa, or performance role, writing only its own report path |
| `artifact_published` | A commit on an owner's task branch that the owner's own record names, together with its remote publication outcome | any implementation or validation owner |
| `branch_integrated` | A merge commit on `integration/autonomous-runtime`, or a merge of that branch into `main` | the operator or the runtime's integration step |
| `human_decision_recorded` | A commit on a non-agent branch recording a governance decision | a human |
| `dependency_unsatisfiable` | A commit on an owner's branch whose handoff records that a declared dependency cannot be satisfied | the blocked owner |
| `remediation_completed` | A commit on a remediation owner's branch publishing the fix for a routed finding | the remediation owner |

**Observation rule.** The observer enumerates every fact in the ingress source set reachable from `integration/autonomous-runtime` and from every live `agent/*` branch, orders them by committer timestamp and then by commit SHA to break ties, and assigns `ingress_seq` = the count. The ordering is total and deterministic, so two observers agree.

- **Dispatch condition:** `ingress_seq > activation.last_consumed_event_seq`.
- **Quiescent condition:** `ingress_seq == activation.last_consumed_event_seq`. TASK-013 then carries `activation.state: quiescent`, `status: blocked`, and lives in `tasks/blocked/`.
- **Invalid:** `activation.last_consumed_event_seq > ingress_seq` is rejected at load time. The cursor may never run ahead of the observed facts.

### Why the deadlock is gone

The producer and the consumer are now different roles writing different surfaces. TASK-021 published its report at `adfb982` on its own branch and it was opened as pull request #2 — an act entirely inside the reviewer's configured write scope, requiring no access to `tasks/**`. That publication *is* ingress fact seq 5. The observer sees `ingress_seq = 5 > cursor = 3` and TASK-013 becomes dispatchable. Nothing had to be typed into a file that only TASK-013 can write.

The same holds for every future round: TASK-022 publishing its round-4 report raises `ingress_seq` to 6 without editing any existing row, which is the property this model was required to preserve.

### Ownership of the observer

| Phase | Who evaluates the predicate and dispatches | Status |
|---|---|---|
| Runtime phase | The scheduler in `src/orchestrator/scheduling/`, owned by **TASK-005** | The durable design. TASK-005 owns the observer, the deterministic ordering, the cursor validation, and the one-commit effects-plus-cursor rule |
| Bootstrap phase | The human operator who launches each CLI session | The same operator-driven scheduler that dispatches **every** bootstrap task. TASK-013 is not polled specially; it is selected by the same mechanism that selects TASK-016, TASK-020, and TASK-022 |

The bootstrap substitution has a named exit: it ends when TASK-005 is integrated. It is a substitution of the *observer*, not of the *producer*, so it is not the deadlock F-201 recorded and it is not manual polling adopted as the final design.

### Exactly-once consumption

An activation consumes the contiguous range `(last_consumed_event_seq, ingress_seq]`. The effects of the activation, the ledger rows for the consumed range, and the cursor advance are written in **one commit**. If that commit does not land, the cursor is unchanged, no ledger row exists, and the same range is consumed again by the next activation, whose effects are identical because every transition this task performs is idempotent. There is no interleaving in which a fact is consumed twice with effect, and none in which a fact is skipped.

### Starvation bound

The scheduler must dispatch TASK-013 within a stated bounded number of scheduling rounds after `ingress_seq` increases, even under a saturated ready set, and must never dispatch it while it is quiescent.

### Where each obligation is implemented and independently validated

| Obligation | Implemented by | Independently validated by |
|---|---|---|
| Ingress observer, deterministic ordering, dispatch predicate, cursor monotonicity and upper bound | TASK-005 | TASK-009 `V9-A004-ACT`, TASK-011 `V11-A004-ACT` |
| One-commit effects-plus-cursor rule and crash replay | TASK-005 | TASK-011 `V11-A004-ACT` |
| Starvation bound under a saturated ready set | TASK-005 | TASK-009 `V9-A004-ACT`, TASK-011 `V11-A004-ACT` |
| End-to-end loop: gate report publication → ingress observation → TASK-013 dispatch → effects commit → cursor advance → quiescence | — | TASK-011 `V11-A004-ACT`, as an executable end-to-end test |
| Contract representation of the ingress source set, cursor, and quiescent state | TASK-016 scope item 4 | TASK-020 Part A, A-004 |

## Reconciliation with the TASK-002 architecture

The architecture at commit `9576fc9` on `agent/claude/architect/task-002` was the normative technical source. TASK-015 round 1 returned `changes-required` against it with findings A-001 through A-004, so **the approved architecture this graph builds on is `9576fc9` as amended by TASK-016 and approved by TASK-020**, and every architecture dependency edge names `gate_passed(TASK-016, review)` rather than `gate_passed(TASK-002, review)`. TASK-002's own review gate closes at round 2, when TASK-020's single verdict confirms the amendment resolves A-001 through A-004.

**Normative source rule.** F-202 recorded that TASK-003 still pinned the rejected baseline alone. Every implementation record now states its normative source in the same form: *the named documents at `9576fc9` **as amended by the TASK-016 commit that TASK-020 approves***. A record that cites `9576fc9` without the amendment clause is a finding. The rejected baseline is never the normative source on its own, because three of its seven acceptance criteria were judged `not met`.

**Module map.** Each of the six modules in `docs/architecture/runtime/COMPONENT-BOUNDARIES.md` maps to exactly the owner task this graph assigns, and the source paths match the write-scope partition below. The seventh module added by TASK-016 maps to TASK-017. A-003 requires TASK-016 to give live-run control and OS process-tree ownership an owning module and contract.

**Contract roots.** `src/orchestrator/state/contracts/` is owned by TASK-003 and `src/agents/contracts/` by TASK-004. Every other task imports from a contract root and never from a sibling implementation.

**Contract change control.** No implementation task may change a type, signature, field name, or string-literal union declared in `INTERFACE-CONTRACTS.md` during Waves 3 through 6, even inside its own write scope. A task that finds a contract wrong stops at the boundary and hands off to the Orchestrator, which routes an amendment to the architect under a task shaped like TASK-016. TASK-009 verifies it by diffing both contract roots against the document.

**Integration order.** `docs/architecture/runtime/INTEGRATION-STRATEGY.md` requires every task to branch from the integration branch at or after the commit where its dependencies merged, squash-merge one commit per task, and never push to `main`. The wave order above is that merge order. TASK-016 must reconcile that document with the `review_ready` / `integrated` / `pre_merge_gates` vocabulary, which is part of A-004.

**Ownership gaps the architecture raised.** Both are routed and both appear in the graph:

| Gap recorded in `INTEGRATION-STRATEGY.md` | Routed to | Status |
|---|---|---|
| No task owns the root toolchain manifests or `scripts/quality/**` | TASK-018 | Ownership resolved by HUMAN-001 at `fb9f45c`; now blocked only on `gate_passed(TASK-016)` |
| No module owns the agent workspace lifecycle that `AgentInvocation.worktreePath` presupposes | TASK-016 then TASK-017 | TASK-016 is `ready` and claimed |

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

Every scope is a subset of its role's configured scope in `config/agents/settings.yaml` at commit `fb9f45c`. TASK-018 no longer declares a `requested_write_scope_extension`: all four previously requested paths are inside the devops role's configured scope after HUMAN-001.

The seven reviewer-owned report files — TASK-009's two paths, TASK-014, TASK-015, TASK-019, TASK-020, TASK-021, and TASK-022 — are mutually path-disjoint by construction, so any of them may run concurrently.

### Overlaps that remain, and how they are serialized

Two pairs have genuinely identical scopes, because in each pair the second task exists to revise what the first produced. They declare a shared `resource_lock`.

| Lock | Held by | Why the overlap is real |
|---|---|---|
| `task-records` | TASK-001, TASK-013 | Both own `tasks/**`. TASK-013 exists to keep every task record current, which is by definition the surface TASK-001 created. |
| `architecture-docs` | TASK-002, TASK-016 | TASK-016 amends documents TASK-002 authored. |

Resource-lock semantics, which TASK-005 must enforce at admission alongside write-scope exclusion:

1. At most one task holding a given resource lock may be claimed at any time.
2. A lock is not a dependency. It constrains concurrency, not order.
3. The scheduler refuses admission of a task whose lock is held and returns it to the ready set rather than queueing behind it.
4. A resource lock is declared in the task record's `resource_lock` field and is machine-readable.

TASK-002's execution has released the `architecture-docs` lock, which is why TASK-016 could be claimed and is currently held by the TASK-016 execution.

## Task-record lifecycle ownership

**Every task-record mutation in this graph is performed by the `orchestrator` role and by nothing else.** TASK-013 owns it.

| Actor | May write | Must not write |
|---|---|---|
| Implementation owner (TASK-003 … TASK-008, TASK-017, TASK-018) | Its own source and test scope; the commit message; the pull request description | Any file under `tasks/` |
| Validating owner (TASK-009 … TASK-012, TASK-014, TASK-015, TASK-019 … TASK-022) | Its own report scope; the pull request description | Any file under `tasks/` |
| Architect (TASK-002, TASK-016) | Its architecture scope; the commit message; the pull request description | Any file under `tasks/` |
| Orchestrator (TASK-013) | Every task record, including `status`, lifecycle directory, Handoff sections, the activation log, and this graph | Any source, test, report, or architecture file |

Each owner records its handoff where its own scope allows, and TASK-013 transcribes it into the task record, naming the source. Every task record carries a "Task-record lifecycle" section stating this, and no record instructs its owner to move itself.

This ownership rule is what produced F-201, and the ingress model above is what makes it survivable: an owner wakes TASK-013 by doing its own job in its own scope, never by writing a task record.

## Required behavior coverage

Every row names an implementing task and at least one independent validating task, and — for every behavior the amendment added — the **exact acceptance criterion** in that validator's record that obliges the check. F-202 recorded that revision 3 claimed validation that no validator contract required; a row whose obligation column is empty for an amended behavior is a finding.

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
| Workspace lifecycle architecture | TASK-016 | TASK-020 | TASK-020 Part B module-map and contract criteria |
| Amended runtime contracts for A-001 … A-004 | TASK-016 | TASK-020 | TASK-020 Part A, A-001 … A-004 dispositions |

An implementing task's own unit tests never satisfy a row in the right-hand column. TASK-017's publication tests resolve the implementation half of F-105; the three `*-F105` obligations are what make the claim of independent validation true.

## Findings return path

```text
TASK-009 / TASK-010 / TASK-011 / TASK-012                        runtime findings
TASK-014 / TASK-015 / TASK-019 / TASK-020 / TASK-021 / TASK-022  decomposition, architecture, and toolchain findings
        |  the owner publishes its report inside its own write scope
        |  -> that publication is an ingress fact; no task record is written
        v
the ingress observer sees ingress_seq > cursor and dispatches TASK-013
        v
TASK-013 (orchestrator)
        |  creates one remediation task per responsible owner, or records the
        |  disposition when the responsible owner is the Orchestrator itself,
        |  performs the lifecycle transition, records the gate status,
        |  appends one ledger row per consumed fact, advances the cursor —
        |  all in one commit
        v
the named owner applies the fix on a new branch from the current integration branch
        |
        v
a new gate task in the next round revalidates and the gate closes
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
