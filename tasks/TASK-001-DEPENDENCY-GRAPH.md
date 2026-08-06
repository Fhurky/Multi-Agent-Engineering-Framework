# TASK-001 Dependency Graph

Durable handoff note for the autonomous multi-agent runtime task graph. It records the dependency order, ownership, write-scope partition, edge semantics, gate scheduling classes, gate lineages, and the activation and event-ingress model. Individual task records remain the authoritative source for scope and acceptance criteria; this document is kept in agreement with them by TASK-013.

**Revision 11**, produced by TASK-013 activation `ACT-010`. **One** independent verdict drove it, and **no gate is closed by it**:

- **TASK-033 round 5 returned `changes-required` on the architecture lineage** at commit `3660cc2`, in `reports/code-review/TASK-032-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-4.md`, published `local-only` with no remote ref and no pull request. **One verdict, applied atomically to five relations** — `(TASK-032, review, r1)`, `(TASK-028, review, r2)`, `(TASK-024, review, r3)`, `(TASK-016, review, r4)`, `(TASK-002, review, r5)` — all of which stay **open together**. The open remediation set is **A-202** (High, `partially resolved`, fixture half only), **A-105** (Medium, `partially resolved`), and the new **A-401** and **A-402** (both High). **A-203, A-206, and A-301 are `resolved`.**
- **The inherited-view framing was tested and mostly did not hold.** Round 4 recorded A-004, A-101, A-102, and A-104 as views creating no duplicate obligation. Round 5 judged each individually: **A-102 closes** with A-206 and has no residue, while **A-004** and **A-101** are reassigned to A-402 and **A-104** to A-401. No separate remediation was created for any of the four.
- **The four open findings are routed to a new architect task, TASK-034**, and **TASK-035** is created for `LIN-ARCH-REVIEW` lineage round 6, whose cohort grows to six.
- **The architecture edge floor rises from `lineage_round: 5` to `6`, and every architecture-source clause moved with it in the same commit.** This is the **second** live exercise of the F-601 rule: `468b37b` becomes a fifth superseded authoring baseline and **no approved architecture source is claimed to exist**.
- **`MC-010`'s open question was answered.** The `fe0374c` content import at `468b37b` is judged **faithful** — zero deletions, zero unexpected divergence — and the ancestry does not reproduce the pull-request-15 conflict class. `MC-010` is unedited; the answer is recorded beside it.
- **`MC-011`** defines how an architecture fixture over `tasks/**` stays current, and requires that a record routing such an obligation state **no count of its own**. See "Why an architecture fixture over `tasks/**` goes stale" below.

Revision 10, produced by TASK-013 activation `ACT-009`, is retained below. **No verdict drove it and no gate was closed by it.** It consumed one `artifact_published` fact:

- **TASK-032 published the fourth architecture amendment** at commit `468b37b2649d031074eba64aca47f4561a0c41a3`, the head of `agent/gpt/architect/task-032`, with `publication: local-only` and no pull request. TASK-032 moves to `review` and **TASK-033 moves to `ready`** on the satisfied `review_ready(TASK-032)` edge. The cumulative architecture diff against `fe0374c`, restricted to `docs` and `diagrams`, is 17 paths, 545 insertions, and 98 deletions.
- **Nothing was judged.** `LIN-ARCH-REVIEW` round 5 has recorded no verdict. All five relations TASK-033 carries stay `pending` and open together, A-202, A-203, A-206, A-105, and A-301 all stay `pending` at round 5, the edge floor stays at `lineage_round: 5`, and TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 stay `blocked`. A publication is a readiness fact, not a gate.
- **`MC-010`** records that revision 9's own TASK-032 dispatch instruction contained a false ancestry claim. It asserted that `fd7ce90` contains `fe0374c`; it does not, because pull request 15 is still open, so **no branch point satisfying the instruction existed**. The owner reconstructed the baseline by content import instead, and `fe0374c` is **not** an ancestor of `468b37b`. See "The round-5 target reaches its base by content, not by ancestry" below.
- **No architecture was merged into any branch to assemble the review.** TASK-033's worktree is cut from the Orchestrator branch and reads the target through Git object access.

Revision 9, produced by TASK-013 activation `ACT-008`, is retained below. **One** independent verdict drove it, and **no gate was closed by it**:

- **TASK-029 round 4 returned `changes-required` on the architecture lineage** at commit `3df261fa`, in `reports/code-review/TASK-028-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-3.md`, published as pull request 18 and merged into `main` at `fd7ce907`. **One verdict, applied atomically to four relations** — `(TASK-028, review, r1)`, `(TASK-024, review, r2)`, `(TASK-016, review, r3)`, `(TASK-002, review, r4)` — all of which stay **open together**. The open remediation set is **A-202** (High, `not resolved`), **A-203** and **A-206** (High, `partially resolved`), **A-105** (Medium), and the new **A-301** (Low). A-201, A-204, A-205, A-207, A-208, A-002, A-003, and A-103 are recorded `resolved`, and **A-004, A-101, A-102, and A-104 are recorded as inherited views** that, in the reviewer's words, "do not create duplicate implementation obligations".
- **The five open findings are routed to a new architect task, TASK-032**, and **TASK-033** is created for `LIN-ARCH-REVIEW` lineage round 5. No inherited view was given a remediation task of its own.
- **The architecture edge floor rises from `lineage_round: 4` to `5`, and every architecture-source clause moved with it in the same commit.** This is the first live exercise of the rule finding **F-601** required: `fe0374c` becomes a fourth superseded authoring baseline and **no approved architecture source is claimed to exist**. Nine implementation tasks are one round further from dispatch, not nearer.
- **Six satisfied contract checks did not approve a contract.** TASK-029 recorded all six `HUMAN-002` Part B properties **satisfied** inside a `changes-required` verdict, stating that this "does not cure A-202". `HUMAN-002` remains approved and unimplemented, TASK-013's declared bootstrap dispatch contract still reads `interim-operator-authorized`, `ACT-008` ran under it, and F-401 is not claimed resolved.
- **`MC-009`** corrected two active passages that had asserted an independence property `HUMAN-003` falsified. See "Gate assignment" below and the `HUMAN-003` section.

The per-finding disposition register is in `tasks/TASK-013-ACTIVATION-LOG.md`, activation `ACT-008`. Activation `ACT-009` routed no finding, because it consumed a publication rather than a verdict.

Revision history: revision 2 was reviewed by TASK-014 rounds 1 and 2 (`changes-required`, F-001 … F-007 then F-101 … F-105); TASK-015 round 1 returned `changes-required` on the TASK-002 architecture (A-001 … A-004); human governance decision HUMAN-001 was recorded at `fb9f45c`; revision 3 was produced by `ACT-001` and reviewed by TASK-021 round 3 (`changes-required`, F-201 … F-205); revision 4 was produced by `ACT-002` and reviewed by TASK-022 round 4 (`changes-required`, F-301 … F-303); revision 5 was produced by `ACT-004` and reviewed by TASK-023 round 5 (`changes-required`, F-401 … F-403); revision 6 was produced by `ACT-005` and reviewed by TASK-027 round 6 (`changes-required`, F-501 … F-502); revision 7 was produced by `ACT-006` and reviewed by TASK-030 round 7 (`changes-required`, F-601 … F-603); revision 8 was produced by `ACT-007` and is under review by TASK-031 round 8. Activation `ACT-003` applied lifecycle updates only and was not a revision. Revisions 9 and 10, produced by `ACT-008` and `ACT-009`, are reviewed by the round that follows round 8; neither changes what round 8 reviews, which is the `ACT-007` effects commit `f14bdde` against base `443ff9b`.

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
| TASK-023 | `bootstrap` | `667d3b8` | `agent/gpt/reviewer/task-023` | `published` — present at `refs/heads/agent/gpt/reviewer/task-023` on `origin` and opened as pull request #8, after the reviewer's own report recorded `local-only` |
| TASK-024 | `bootstrap` | `c2ee3eb`, preceded on the same branch by the merge `6e5a9df` that brought `8d0c570` into the amendment's lineage, and followed by the publication-ancestry merge `ba2c742` | `agent/claude/architect/task-024` | `published` — present at `refs/heads/agent/claude/architect/task-024` on `origin` and opened as pull request #9 |
| TASK-025 | `bootstrap` | `aa38c7d2` | `agent/gpt/reviewer/task-025` | `published` — present at `refs/heads/agent/gpt/reviewer/task-025` on `origin` and opened as pull request #11, after the reviewer's own report recorded its lock as not yet released |
| TASK-027 | `bootstrap` | `710351fd` | `agent/gpt/reviewer/task-027` | `published` — present at `refs/heads/agent/gpt/reviewer/task-027` on `origin` and opened as pull request #12, after the reviewer's own report recorded that it performed no push, as directed |
| TASK-028 | `bootstrap` | `fe0374c` | `agent/gpt/architect/task-028` | `published` — present at `refs/heads/agent/gpt/architect/task-028` on `origin` and opened as pull request 15, which is open and `CONFLICTING` |
| TASK-029 | `bootstrap` | `3df261fa` | `agent/gpt/reviewer/task-029` | `published` — present at `refs/heads/agent/gpt/reviewer/task-029` on `origin`, opened as pull request 18 and merged into `main` at `fd7ce907`, after the reviewer's own report recorded `local-only` with the reason that public remote egress approval is pending |
| TASK-030 | `bootstrap` | `f36e6c06` | `agent/gpt/reviewer/task-030` | `published` — present at `refs/heads/agent/gpt/reviewer/task-030` on `origin`, opened as pull request 14 and merged into `main` at `52a6e5a` |
| TASK-032 | `bootstrap` | `468b37b`, the branch **head**; preceded on the same branch by `fa68a06`, which is authoring ancestry and not the published commit | `agent/gpt/architect/task-032` | `local-only` — no remote ref for this branch exists in this clone and no pull request was opened. The owner recorded "No pull request or remote publication is authorized." This satisfies `review_ready(TASK-032)` under rule 1 above, because its consumer TASK-033 is another bootstrap task reading the same Git common directory |
| TASK-033 | `bootstrap` | `3660cc2` | `agent/gpt/reviewer/task-033` | `local-only` — `git branch -a --contains 3660cc2` returns only that branch, with no remote tracking ref and no pull request. The owner recorded the reason as the user having reserved commit, push, and pull-request actions for the outer supervisor |

TASK-020's, TASK-022's, TASK-023's, TASK-025's, TASK-027's, and TASK-029's own reports each record their publication as pending or `local-only` at the moment of writing, because the push succeeded outside the reviewer's execution. TASK-013 transcribes both facts and does not overwrite any reviewer's statement. This is the same divergence TASK-021 produced and it is recorded the same way — **seven times now**, on nearly every reviewer record this graph has produced. That the exception has become the rule suggests the field is recording the execution's own knowledge rather than the repository's state; whether it should say so explicitly is routed to the next decomposition round rather than decided here.

**TASK-032 is the first record where the owner's statement and the durable state agree, and TASK-033 is the second.** Each recorded `local-only`, and no remote ref exists for either branch, because no push happened outside those executions either. That is recorded as an observation and not as a resolution: both instances arise from the same environment constraint rather than from a corrected field, and the routed question — whether the field should say that it records the execution's own knowledge — stays open for the next decomposition round. **What has actually changed is the phase, not the field.** Nothing has been merged since pull request 18, `origin/main` is still `fd7ce90`, and every artifact produced since is `local-only`, so there is currently no out-of-execution push to diverge from.

TASK-024's publication satisfied `review_ready(TASK-024)` and nothing else. That is now settled rather than pending: `LIN-ARCH-REVIEW` lineage round 3 recorded `changes-required` at `aa38c7d2`, so the amendment is not approved, is not integrable, and resolved no finding. The publication was authoring evidence and the verdict is the judgment; the graph never treated the first as the second, and the outcome confirms why that distinction matters.

`ba2c742` on `agent/claude/architect/task-024` is a merge of `origin/main` into the amendment branch for pull request #9 integration. The reviewer recorded it as publication ancestry only and reviewed `c2ee3eb`. Under the ingress source set it matches no class — it is not a merge on `integration/autonomous-runtime`, not a merge of that branch into `main`, and not the owner's named published commit — so it is not an ingress fact, for the same stated reason `6e5a9df` is not.

### Gate rounds and gate closure

`gate_for` declares that a task performs a named gate for a target. **`gate_for` is not a scheduling edge.** It points in the opposite direction from the scheduling edges and is evaluated only when TASK-013 decides whether a target's gate is closed. `gate_tasks` is the target's view of the same relation. `gate_for` and `gate_tasks` must agree pairwise, including on `round`, `gate_class`, `retrospective`, `gate_lineage`, and `lineage_round`.

A gate may be recorded more than once. Each pair carries a `round`, which **defaults to 1 when omitted**.

1. The status of a gate relation is the verdict recorded at its **highest** round.
2. A `changes-required` verdict at round *n* must name a `remediated_by` task or activation and a `revalidated_by` task. The gate stays open.
3. The gate is **closed** when the highest round records `approved`, `approved-with-findings` with every blocking finding resolved, or a formal acceptance recorded by an authorized human.
4. A verdict is durable. A later round never rewrites an earlier one; it supersedes it, and both stay recorded.
5. **One review produces exactly one verdict.** A gate task that carries more than one `gate_for` relation records that single verdict once and applies it **atomically** to every relation it carries: all of them close together or all of them stay open together. The application produces one durable gate-verdict fact per relation, so a target reads its own gate status from its own relation, but a split outcome is not representable. TASK-020 recorded one verdict yielding the two facts `(TASK-016, review, round 1)` and `(TASK-002, review, round 2)`; TASK-025 recorded one verdict at `aa38c7d2` yielding the three facts `(TASK-024, review, round 1)`, `(TASK-016, review, round 2)`, and `(TASK-002, review, round 3)`; **TASK-029 recorded one verdict at `3df261fa` yielding the four facts** `(TASK-028, review, round 1)`, `(TASK-024, review, round 2)`, `(TASK-016, review, round 3)`, and `(TASK-002, review, round 4)`, its report stating "No relation passes independently"; TASK-033 carries five relations and will record one verdict yielding five.
6. **Every pair belongs to exactly one gate lineage.** Supersession across rounds is a property of the lineage, not of any one gate task. See below.

This is what makes an independent verdict permanent instead of re-entrant. TASK-014's two verdicts, TASK-015's verdict, TASK-020's verdict, TASK-021's verdict, TASK-022's verdict, and TASK-023's verdict are final for the artifacts they reviewed; the corrected artifacts are reviewed by new tasks in new rounds.

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
| `LIN-DECOMP-REVIEW` | review | TASK-001 | 1 → TASK-014 (TASK-001 r1); 2 → TASK-014 (r2); 3 → TASK-021 (r3); 4 → TASK-022 (r4); 5 → TASK-023 (r5); 6 → TASK-027 (r6); 7 → TASK-030 (r7); 8 → TASK-031 (r8) |
| `LIN-ARCH-REVIEW` | review | TASK-002 → TASK-016 → TASK-024 → TASK-028 → TASK-032 → TASK-034 | 1 → TASK-015 (TASK-002 r1); 2 → TASK-020 (TASK-016 r1, TASK-002 r2); 3 → TASK-025 (TASK-024 r1, TASK-016 r2, TASK-002 r3); 4 → TASK-029 (TASK-028 r1, TASK-024 r2, TASK-016 r3, TASK-002 r4); 5 → TASK-033 (TASK-032 r1, TASK-028 r2, TASK-024 r3, TASK-016 r4, TASK-002 r5); 6 → TASK-035 (TASK-034 r1, TASK-032 r2, TASK-028 r3, TASK-024 r4, TASK-016 r5, TASK-002 r6) |
| `LIN-TOOLCHAIN-REVIEW` | review | TASK-018 | 1 → TASK-019 (TASK-018 r1) |
| `LIN-TOOLCHAIN-SECURITY` | security | TASK-018 | 1 → TASK-010 (TASK-018 r1) |
| `LIN-RUNTIME-REVIEW` | review | TASK-003 … TASK-008, TASK-017, TASK-026 | 1 → TASK-009 (r1 for each cohort member) |
| `LIN-RUNTIME-SECURITY` | security | TASK-003 … TASK-008, TASK-017, TASK-026 | 1 → TASK-010 (r1 for each cohort member) |
| `LIN-RUNTIME-QA` | qa | TASK-003 … TASK-008, TASK-017, TASK-026 | 1 → TASK-011 (r1 for each cohort member) |
| `LIN-RUNTIME-PERFORMANCE` | performance | TASK-005, TASK-006, TASK-008 | 1 → TASK-012 (r1 for each cohort member) |

`LIN-DECOMP-REVIEW` rounds 1 and 2 are both recorded by TASK-014. That is the one historical instance of a re-entrant gate task in this graph; it predates the rule and is retained rather than rewritten. Every lineage round created since — 3, 4, 5, 6, 7, and 8 of `LIN-DECOMP-REVIEW`, and 2, 3, 4, and 5 of `LIN-ARCH-REVIEW` — is a distinct task.

`LIN-ARCH-REVIEW`'s lineage rounds and its per-target rounds differ, because its cohort grows at every round: TASK-016 joined at lineage round 2 as the remediation for lineage round 1, TASK-024 at lineage round 3, TASK-028 at lineage round 4, and TASK-032 at lineage round 5. A pair therefore carries both numbers, and each answers a different question — `round` is "how many times has *this artifact's* gate been recorded", `lineage_round` is "how many times has *this relation* been validated". At lineage round 5 the cohort has five members, so TASK-033 carries five relations and applies one verdict to all of them. **No member is ever removed**, so each earlier round's coverage claim stays true of what it covered, and the growth is a recorded consequence of **four** consecutive failing rounds rather than a scope change.

**What that growth costs, stated rather than left as arithmetic.** Each failing round adds one cohort member, one gate task, one set of relations, and one `architecture-docs` lock holder. Round 1 carried one relation; round 5 carries five. Nothing in the model removes a member, so the per-round review burden grows monotonically with the number of failures, and a lineage that keeps failing keeps getting more expensive to validate. That is a real property of the model and not an artifact of bookkeeping. The alternative — retiring cohort members whose own findings are resolved — was not adopted, because a member's relation is what records that its gate is still open, and removing it would make a task integrable without a passing verdict.

### Edges that use the lineage form

| Consumer | Edge | Why the lineage form and not the target form |
|---|---|---|
| TASK-012 | `{lineage: LIN-RUNTIME-QA, edge: gate_passed, gate: qa, lineage_round: 1}` | The prerequisite is a passing QA baseline for the runtime cohort, whoever records it. A successor QA task at lineage round 2 satisfies the edge without any edit. This is the F-302 correction |
| TASK-003 … TASK-008, TASK-017, TASK-018, TASK-026 | `{lineage: LIN-ARCH-REVIEW, edge: gate_passed, gate: review, lineage_round: 5}` | The prerequisite is an approved runtime architecture, which is now a succession of amendments rather than one document commit. Revision 4 retargeted this edge from TASK-002 to TASK-016 by hand; the lineage form removes the need to retarget it again, and it has now survived three further supersessions with no edit to the edge's *target*. `lineage_round: 5` is the floor, raised from 4 by revision 9: round 4 recorded `changes-required` at `3df261fa` with A-202 `not resolved` and A-203 and A-206 `partially resolved`, so a passing verdict can no longer occur at round 4 and the amendment carrying those findings must be the approved one. Raising a floor is not retargeting — the edge still names the lineage, and only the minimum acceptable round moved, for the same reason it moved from 2 to 3 at revision 5 and from 3 to 4 at revision 7. **Under finding F-601 the floor never moves alone**: revision 9 moved it together with every `normative_architecture_source` clause, every `exit_condition`, TASK-026's body restatement, and the reconciliation section below, in one commit |

## Gate scheduling classes

Revision 3 asserted that "a gate owner must be schedulable when its target publishes, not several waves later" and named TASK-018's security gate as the single retrospective exception. F-203 recorded that both statements are false: TASK-009, TASK-010, and TASK-011 each wait for *every* runtime component before they can gate *any one* of them, and every assembly gate on TASK-003 … TASK-008, TASK-017, and TASK-026 closes after its target is already integrated. Revision 4 replaced the false claim with two independent, declared, machine-checkable properties.

Every `gate_for` / `gate_tasks` pair carries both:

| Property | Values | Meaning | How it is decided |
|---|---|---|---|
| `gate_class` | `point`, `aggregate` | Scheduling timeliness | `point` when the gate owner is dispatchable at the moment the artifact that this round reviews becomes `review_ready` — that is, when publication of the reviewed artifact is the last of the owner's dependencies to be satisfied. `aggregate` when the owner holds at least one further dependency that is satisfied later, so gating this target is deliberately batched with others |
| `retrospective` | `true`, `false` | Ordering against integration | `true` when the gate is **not** in the target's `pre_merge_gates`, so the target is integrated before this gate closes. `false` when the gate blocks integration |

**Where these values are normative.** F-303 recorded that three active record bodies restated a pair's `retrospective` value in prose and stated the opposite of the frontmatter. Revision 5 removes the duplication rather than only correcting the copies: **a pair's `gate_class` and `retrospective` are normative in the pair's own frontmatter and in the register below, and nowhere else.** A record body may name the register; it may not restate the value. The same rule applies to `gate_lineage` and `lineage_round`.

**Which artifact a round reviews.** At round 1 the reviewed artifact is the target itself, so the reference point is `review_ready(<target>)`. At round *n* > 1 the reviewed artifact is the **remediation** named by round *n* − 1's `remediated_by`, so the reference point is that remediation's publication. TASK-020 carried TASK-002's review gate at round 2 while depending on `review_ready(TASK-016)`, and TASK-016 *was* the remediation for round 1's verdict; TASK-025 carried TASK-002 round 3 and TASK-016 round 2 while depending on `review_ready(TASK-024)`; TASK-029 carried TASK-002 round 4, TASK-016 round 3, and TASK-024 round 2 while depending on `review_ready(TASK-028)`; TASK-033 carries TASK-002 round 5, TASK-016 round 4, TASK-024 round 3, and TASK-028 round 2 while depending on `review_ready(TASK-032)`, for the same reason. The same holds for TASK-014 round 2, TASK-021 round 3, TASK-022 round 4, TASK-023 round 5, TASK-027 round 6, TASK-030 round 7, and TASK-031 round 8, each of which reviews a TASK-001 remediation republished on the remediating branch.

The two properties are independent, and all three combinations that occur in this graph occur for different reasons:

- `point` and `retrospective: false` — TASK-019 on TASK-018 review, TASK-015 on TASK-002 review, TASK-020 on TASK-016 review and TASK-002 review, TASK-025 on TASK-024, TASK-016, and TASK-002 review, TASK-029 on TASK-028, TASK-024, TASK-016, and TASK-002 review, TASK-033 on TASK-032, TASK-028, TASK-024, TASK-016, and TASK-002 review. The gate blocks integration and its owner is dispatchable the moment the reviewed artifact publishes. This is the ideal case.
- `point` and `retrospective: true` — every round of TASK-001's own review gate, owned by TASK-014, TASK-021, TASK-022, TASK-023, TASK-027, TASK-030, and TASK-031.
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
| TASK-014, TASK-021, TASK-022, TASK-023, TASK-027, TASK-030, TASK-031 | review | TASK-001 rounds 1 … 8 | point | true | TASK-001 declares `pre_merge_gates: []`. The decomposition is a task-record artifact that every other owner and every subsequent reviewer must read from the integration branch, so each revision is integrated as soon as it is authored rather than held behind its own review gate. Holding it back would leave the graph that schedules every task readable only on one agent branch | The `ACT-001` revision reached `main` at `c325275` while round 3 was unrecorded, and rounds 3 through 7 then all returned `changes-required`. A defective decomposition can therefore be the graph of record for a whole round, and has been for five — the `ACT-006` revision reached `main` at `1fc5f53` through pull request 13 before round 7 recorded its verdict on it, which is the same exposure repeating rather than a new one. Mitigations: the gate owner is `point`, so the delay is one review and not one wave; each round's target commit is immutable, so a later revision cannot rewrite what was reviewed; and TASK-001 cannot reach `done` until a round records a passing verdict, which is enforced separately from integration |
| TASK-019 | review | TASK-018 | point | false | — | — |
| TASK-015 | review | TASK-002 round 1 | point | false | — | — |
| TASK-020 | review | TASK-016 round 1, TASK-002 round 2 | point | false | — | — |
| TASK-025 | review | TASK-024 round 1, TASK-016 round 2, TASK-002 round 3 | point | false | — | — |
| TASK-029 | review | TASK-028 round 1, TASK-024 round 2, TASK-016 round 3, TASK-002 round 4 | point | false | — | — |
| TASK-033 | review | TASK-032 round 1, TASK-028 round 2, TASK-024 round 3, TASK-016 round 4, TASK-002 round 5 | point | false | — | — |

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

- Invariants 1 and 5: the topological order `HUMAN-001, HUMAN-003, TASK-001, TASK-014, TASK-021, TASK-022, TASK-023, TASK-027, TASK-030, TASK-031, TASK-002, TASK-015, TASK-016, TASK-020, TASK-024, TASK-025, TASK-028, TASK-029, TASK-032, TASK-033, TASK-018, TASK-019, TASK-003, TASK-004, TASK-017, TASK-026, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013` places every task after all of its dependencies and after the pre-merge gate owners of every task it integrates. TASK-012's `gate_passed(LIN-RUNTIME-QA)` edge expands to TASK-011 and points backwards along this order, from position 34 to position 33. The architecture edge held by TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 expands, at `lineage_round: 5`, to TASK-033 at position 20, ahead of every one of them. TASK-032 holds only `gate_recorded(TASK-029)`, already satisfied at position 18; TASK-033 holds only `review_ready(TASK-032)`, pointing back to position 19. TASK-031 holds only `review_ready(TASK-001)`, already satisfied, and no task holds an edge to TASK-031. No cycle exists.
- Invariant 2: TASK-009, TASK-010, TASK-011, TASK-012, TASK-014, TASK-015, TASK-019, TASK-020, TASK-021, TASK-022, TASK-023, TASK-025, TASK-027, TASK-029, TASK-030, TASK-031, and TASK-033 are the only tasks with `gate_for` entries. Every edge each of them holds to a task it gates is `review_ready`. TASK-012's only non-`review_ready` edge names `LIN-RUNTIME-QA`, of which TASK-012 records no round. TASK-029 and TASK-033 each record a round of `LIN-ARCH-REVIEW` and hold no `gate_passed` edge at all; TASK-030 and TASK-031 each record a round of `LIN-DECOMP-REVIEW` and hold no `gate_passed` edge at all. **TASK-032 is not a gate task**: it holds `gate_recorded(TASK-029)`, which is not a `gate_passed` edge and is satisfied by any verdict, and it records no round of any lineage. None holds an edge naming a lineage it itself records a round of.
- Invariant 3: checked pairwise across all 52 pairs in the gate assignment table and both registers.
- Invariant 4: the only non-empty `pre_merge_gates` are TASK-002 `review` (TASK-015 r1, TASK-020 r2, TASK-025 r3, TASK-029 r4, TASK-033 r5), TASK-016 `review` (TASK-020 r1, TASK-025 r2, TASK-029 r3, TASK-033 r4), TASK-024 `review` (TASK-025 r1, TASK-029 r2, TASK-033 r3), TASK-028 `review` (TASK-029 r1, TASK-033 r2), TASK-032 `review` (TASK-033 r1), and TASK-018 `review` (TASK-019 r1). None of TASK-015, TASK-019, TASK-020, TASK-025, TASK-029, or TASK-033 holds an `integrated` edge to any of its targets.
- Invariant 6: no owner-form edge exists. The only lineage-form edges are TASK-012's on `LIN-RUNTIME-QA` and the architecture edge on `LIN-ARCH-REVIEW` held by nine tasks; both lineages are registered. No target-form `gate_passed` edge remains in the graph, so no edge can be ambiguous. Round 5 confirmed this mechanically in frontmatter; F-402 recorded that record **bodies** still described the withdrawn form, revision 6 removed most of those passages, and round 6 found the last two in TASK-016, which revision 7 strikes and quarantines.
- Invariant 7: all 52 `gate_for` / `gate_tasks` pairs carry both properties and agree on both across the pair. Each declared `retrospective` was recomputed as `gate ∉ target.pre_merge_gates`: `false` for the **fifteen** pairs whose gate is a pre-merge gate — TASK-015 r1, TASK-020 r2, TASK-025 r3, TASK-029 r4, and TASK-033 r5 on TASK-002; TASK-020 r1, TASK-025 r2, TASK-029 r3, and TASK-033 r4 on TASK-016; TASK-025 r1, TASK-029 r2, and TASK-033 r3 on TASK-024; TASK-029 r1 and TASK-033 r2 on TASK-028; TASK-033 r1 on TASK-032; TASK-019 r1 on TASK-018 — and `true` for the other **37**, which are the 28 runtime and toolchain assembly gates, the eight rounds of TASK-001's own review gate since TASK-001 declares `pre_merge_gates: []`, and the TASK-018 security gate. Each declared `gate_class` was recomputed against the publication of the artifact that round reviews: `point` for the **twenty-four** decomposition, architecture, and toolchain review rounds, `aggregate` for the 28 assembly gates. 15 + 37 = 52 and 24 + 28 = 52, so both partitions account for every pair.
- Invariant 8: eight lineages are registered. `LIN-DECOMP-REVIEW` declares rounds 1 … 8 with no gap, one task per round except the historical TASK-014 pair at rounds 1 and 2, which is recorded as the single pre-rule exception. `LIN-ARCH-REVIEW` declares rounds 1 … 5 with no gap, one task each. The remaining six declare round 1 only. Every target named by a pair is a member of its lineage's registered cohort — including TASK-032, which joins the `LIN-ARCH-REVIEW` cohort at round 5 — and every lineage round greater than 1 follows a recorded verdict: `LIN-DECOMP-REVIEW` rounds 2 … 8 follow `changes-required` at `8ac0dbd`, `abb85d9`, `adfb982`, `e8eb23d`, `667d3b8`, `710351fd`, and `f36e6c06`; `LIN-ARCH-REVIEW` rounds 2 … 5 follow `changes-required` at `8632469`, `4874a9d`, `aa38c7d2`, and `3df261fa`.

## Ownership and dependency order

| Task | Title | Owner role | LLM | Depends on | State |
|---|---|---|---|---|---|
| TASK-001 | Decompose the autonomous multi-agent runtime | orchestrator | claude | — | review |
| TASK-002 | Runtime architecture and ADRs | architect | claude | — | review, `changes-required` at rounds 1 … 4 |
| TASK-003 | Durable run state and checkpoints | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 5)`; TASK-018 `integrated` | blocked |
| TASK-004 | Provider adapters and agent workers | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 5)`; TASK-018 `integrated` | blocked |
| TASK-005 | Scheduling, leases, fencing, bounded concurrency | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 5)`; TASK-003, TASK-004, TASK-026 `integrated` | blocked |
| TASK-006 | Supervisor core and state machine | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 5)`; TASK-003, TASK-004, TASK-005, TASK-017 `integrated` | blocked |
| TASK-007 | Lifecycle control and one-input bootstrap | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 5)`; TASK-006 `integrated` | blocked |
| TASK-008 | Crash recovery, timeouts, idempotent retries | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 5)`; TASK-003, TASK-004, TASK-006, TASK-017 `integrated` | blocked |
| TASK-009 | Independent code review of the runtime | reviewer | gpt | TASK-003 … TASK-008, TASK-017, TASK-026 `review_ready` | blocked |
| TASK-010 | Security review of the runtime | security | gpt | TASK-003 … TASK-008, TASK-017, TASK-018, TASK-026 `review_ready` | blocked |
| TASK-011 | QA validation of the runtime | qa | gemini | TASK-003 … TASK-008, TASK-017, TASK-026 `review_ready` | blocked |
| TASK-012 | Performance validation of the runtime | performance | gemini | TASK-005, TASK-006, TASK-008, TASK-017 `review_ready`; `LIN-RUNTIME-QA` `gate_passed(qa, 1)` | blocked |
| TASK-013 | Task-record lifecycle transitions and gate closure | orchestrator | claude | — (event-triggered) | blocked, quiescent |
| TASK-014 | Independent review of this decomposition, rounds 1–2 | reviewer | gpt | TASK-001 `review_ready` | done |
| TASK-015 | Independent architecture review of TASK-002, round 1 | reviewer | gpt | TASK-002 `review_ready` | done |
| TASK-016 | Architecture amendment: runtime contracts and workspace lifecycle | architect | claude | TASK-015 `gate_recorded` | review, `changes-required` at rounds 1, 2, and 3 |
| TASK-017 | Agent workspace lifecycle automation | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 5)`; TASK-003, TASK-018 `integrated` | blocked |
| TASK-018 | Runtime toolchain bootstrap | devops | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 5)` | blocked |
| TASK-019 | Independent review of the runtime toolchain | reviewer | gpt | TASK-018 `review_ready` | blocked |
| TASK-020 | Independent review of the architecture amendment | reviewer | gpt | TASK-016 `review_ready` | done, `changes-required` |
| TASK-021 | Independent re-review of the corrected decomposition, round 3 | reviewer | gpt | TASK-001 `review_ready` | done |
| TASK-022 | Independent re-review of the corrected decomposition, round 4 | reviewer | gpt | TASK-001 `review_ready` | done, `changes-required` |
| TASK-023 | Independent re-review of the corrected decomposition, round 5 | reviewer | gpt | TASK-001 `review_ready` | done, `changes-required` |
| TASK-024 | Second architecture amendment: ingress inbox and revision-5 scheduling vocabulary | architect | claude | TASK-020 `gate_recorded` | review, `changes-required` at rounds 1 and 2 |
| TASK-025 | Independent review of the second architecture amendment | reviewer | gpt | TASK-024 `review_ready` | done, `changes-required` |
| TASK-026 | Durable ingress inbox and activation cursor store | runtime | claude | `LIN-ARCH-REVIEW` `gate_passed(review, 5)`; TASK-003, TASK-018 `integrated` | blocked |
| TASK-027 | Independent re-review of the corrected decomposition, round 6 | reviewer | gpt | TASK-001 `review_ready` | done, `changes-required` |
| TASK-028 | Third architecture amendment: round-3 blocking findings and the approved pre-dispatch observer | architect | gpt | TASK-025 `gate_recorded` | review, published at `fe0374c`, `changes-required` at round 1 |
| TASK-029 | Independent review of the third architecture amendment | reviewer | gpt | TASK-028 `review_ready` | done, `changes-required` |
| TASK-030 | Independent re-review of the corrected decomposition, round 7 | reviewer | gpt | TASK-001 `review_ready` | done, `changes-required` |
| TASK-031 | Independent re-review of the corrected decomposition, round 8 | reviewer | gpt | TASK-001 `review_ready` | ready |
| TASK-032 | Fourth architecture amendment: the round-4 blocking findings | architect | gpt | TASK-029 `gate_recorded` | review, published `local-only` at `468b37b`, `changes-required` at round 1 |
| TASK-033 | Independent review of the fourth architecture amendment | reviewer | gpt | TASK-032 `review_ready` | done, `changes-required` |
| TASK-034 | Fifth architecture amendment: the round-5 blocking findings | architect | gpt | TASK-033 `gate_recorded` | ready |
| TASK-035 | Independent review of the fifth architecture amendment | reviewer | gpt | TASK-034 `review_ready` | blocked |

### `HUMAN-003` — TASK-028 execution-provider reroute

On **2026-08-05** the user explicitly rerouted TASK-028 from `claude` to `gpt` after the managed control environment prohibited external transfer of repository, reviewer, and unpushed draft content to Claude. The stopped Claude process tree had no survivors; its matching session released the task lock normally; and its 43 uncommitted, in-scope paths remain a preserved draft with no commit or push. TASK-028 now branches from `human/reroute/task-028-gpt`; the GPT architect may import the draft as source material but owns the complete resulting delta. This decision changes assignment and provenance only. TASK-028's owner role, scope, dependencies, acceptance criteria, gates, and lineage are unchanged. TASK-029 remains a separate execution context and the TASK-028 author context is prohibited from executing it.

**Provenance, and what the Orchestrator did with it.** `HUMAN-003` is durable as commit **`0b413b7`** `chore: reroute TASK-028 architecture execution to gpt` on the non-agent branch `human/reroute/task-028-gpt`, merged into `main` at `443ff9b` through pull request 16. It changed `config/agents/settings.yaml` — `assignments.architect.llm` from `claude` to `gpt` — and four records under `tasks/**`: this graph, TASK-028, TASK-029, and TASK-001. It therefore has the same class of provenance `HUMAN-001` has at `fb9f45c`, and activation `ACT-007` consumed it as ingress entry **`seq` 13**, class `human_decision_recorded`. It is the second entry of that class in this ledger and the first since `seq` 1.

**The user authored the task-record effects directly, and that is recorded rather than smoothed over.** `tasks/**` is TASK-013's exclusive write scope among *agent* roles; a human acting on their own authority is not bound by an agent role's scope, and no agent may reverse or re-apply a human governance edit. `ACT-007` therefore **verified** those effects against the records, the settings file, and the branch, and **recorded** the decision. It did not re-apply them, did not extend the decision, and did not treat the reroute as authorizing anything beyond assignment and provenance.

**What the reroute costs, stated rather than absorbed — and the cost is not confined to one round.** TASK-028 and TASK-029 were both assigned to `gpt` at round 4, TASK-032 and TASK-033 at round 5, and **TASK-034 and TASK-035 at round 6**, because the architect assignment has not changed back. The repository's cross-family reviewer preference therefore no longer applies to `LIN-ARCH-REVIEW` at all while that assignment stands, rather than to a single round. The mandatory guarantee that remains is **execution-context separation**, which `config/agents/settings.yaml` requires unconditionally and which every affected record states explicitly. That is a narrower margin than the earlier rounds had, and it is recorded as a risk rather than presented as equivalent.

**Two records asserted the opposite, and `MC-009` corrected them.** TASK-029's body still read "the reviewer is `gpt` and the architect is `claude`", and the gate-assignment section above still claimed authors and gate owners are always in different LLM families. Both statements survived `HUMAN-003` and `ACT-007`; activation `ACT-008` found them while re-reading the closing record end to end. TASK-029's passage is struck and quarantined because that record is closing with a durable verdict; the graph's is rewritten because it is live normative prose. Neither correction changes a verdict, an edge, a gate, or a scope. **Nothing in this repository detects a same-family gate pair**, and whether a check, a required recorded control, or an accepted risk is the right answer is a governance question for the user, not an Orchestrator decision.

**`HUMAN-002` and `HUMAN-003` are unrelated decisions and neither implies the other.** `HUMAN-003` changes who executes TASK-028; it changes nothing about the pre-dispatch collector, the bootstrap dispatch contract, or F-401.

### The round-5 target reaches its base by content, not by ancestry

This is the durable consequence of model correction **`MC-010`**, recorded at activation `ACT-009`. It is stated here because it changes what a provenance check on this lineage means, and a reader who assumes the earlier rounds' shape will check the wrong thing.

**What revision 9 asserted.** TASK-032's `integration_ancestry_warning` instructed its owner to "Branch this task from a commit that already contains `8d0c570`, `c2ee3eb`, and `fe0374c`" and stated that "The head of `agent/claude/orchestrator/task-013` at `ACT-008` is `fd7ce90`, which contains all three."

**What is true.** `fd7ce90` does **not** contain `fe0374c`. Pull request 15 — TASK-028's — is still open, so `fe0374c` has never reached `main`; `git branch -a --contains fe0374c` returns only `agent/gpt/architect/task-028` and its remote tracking ref. No commit on `main`, on the Orchestrator branch, or reachable from either contained `fe0374c` when TASK-032 was dispatched. **No branch point satisfying the instruction existed**, so the instruction was unsatisfiable rather than merely inconvenient. The error is the Orchestrator's: revision 9 recorded correctly and repeatedly that TASK-028 was not integrable and that pull request 15 was `CONFLICTING`, then wrote an instruction presupposing the opposite without reading the ancestry it asserted.

**What the owner did.** It branched from `7ff618b` as directed and reconstructed the `fe0374c` baseline by **content import**, disclosing it in its own handoff as "the recorded 32-path import plus authored delta". That is an accurate description of a workaround this graph made necessary, and it is not a finding against the architect.

**The measured shape, read from the repository at `ACT-009`:**

| Relation | Value |
|---|---|
| `fe0374c` is an ancestor of `468b37b` | **false** |
| `8d0c570`, `c2ee3eb`, `9576fc9` are ancestors of `468b37b` | true |
| Paths differing between `fe0374c` and the branch point `7ff618b`, restricted to `docs` and `diagrams` | 32 |
| Architecture documents present at `fe0374c` and absent at `468b37b` | **0** |
| Authored delta against `7ff618b` | 35 paths, 1944 insertions, 312 deletions, two commits |
| Cumulative architecture diff against `fe0374c`, `docs` and `diagrams` only | 17 paths, 545 insertions, 98 deletions |
| Ancestry difference | ADR-0023 … ADR-0031, nine files authored by TASK-028 |

**Why it matters, and what round 5 concluded.** Every earlier round in this lineage reviewed a target whose base was in its history, so a diff against the base was a statement about *changes*. At round 5 it is a statement about *differences between two trees that share no such relationship*, and a content import can drop, alter, or partially revert an earlier amendment in a way an ancestry-based merge cannot. The Orchestrator verified only that no architecture document present at the base is absent at the target, and routed the fidelity judgment to TASK-033 with its own acceptance criterion rather than asserting it.

**TASK-033 answered it: the import is faithful.** A Git tree and blob comparison found 47 Markdown architecture files at `fe0374c` and 50 at the target — all 47 base paths present, 33 byte-identical, 14 differing only inside the declared amendment set, three added, **zero deletions and zero unexpected divergent paths** — with the four older amended ADRs changing only their forward `Status` line. The reviewer additionally found that this ancestry does **not** reproduce the pull-request-15 conflict class: local `main` and `origin/main` are both ancestors of `468b37b` and a read-only `merge-tree --trivial-merge` against each produced zero conflict markers.

**The clean result cured nothing, and the mechanism is now permanent rather than exceptional.** The report states in terms that A-202, A-105, A-401, and A-402 concern the semantics of the intended changes or current-target consistency, not accidental import corruption. And because `468b37b` is itself unmerged and rejected, **TASK-034 faces the same situation again**: no commit exists that both contains `468b37b` and carries the current task records, so round 6 imports too. TASK-034's record states that as a measured fact with the reason, rather than asserting an ancestry it has not read — which is the discipline `MC-010` exists to enforce. TASK-035 carries import fidelity as a **standing** obligation, and round 5's clean result is explicitly not evidence about round 6's import.

The nine ADRs ADR-0023 … ADR-0031 appear as **additions** in the authored delta and are TASK-028's work. Attributing them to TASK-032 would be finding A-209's error in a new direction, and TASK-032's record carries all three provenance sets separately so the mistake is not available by accident.

**Routed rather than settled.** Finding F-602 required that every `review_target_base` value be read from the repository rather than asserted. `ACT-008` showed that the same discipline is not applied to ancestry claims written into instruction prose. Whether it should be — a rule that would bind this role — is a question for the next `LIN-DECOMP-REVIEW` round, not for the role that made the error.

`HUMAN-001` is resolved. Commit `fb9f45c`, `chore: assign runtime toolchain ownership to devops`, adopted option A and added `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**` to `assignments.devops.write_scope`.

### `HUMAN-002` — approved, and what the approval does and does not do

**`HUMAN-002` is approved.** The user approved it in the control session on **2026-08-05**. The selected option is a **Runtime-owned durable pre-dispatch ingress observer and collector**:

- It is **outside `tasks/**`** and runs in the **runtime control plane**.
- **Before scheduler selection**, it validates and deduplicates an external source fact, then **appends the immutable inbox entry through the TASK-026 ingress store**.
- It then **exposes or signals the new high-water mark to TASK-005 scheduling**.
- **TASK-013 / Orchestrator consumes entries and records ledger rows and cursor effects, and is prohibited from appending its own trigger.**
- **Interim operator authorization may remain only until the durable observer is implemented and validated. It is not the final autonomous contract.**

The decision is transcribed verbatim in `tasks/TASK-013-ACTIVATION-LOG.md` as model correction `MC-006`. This graph represents it; it did not author it and does not extend it.

**What the approval settles.** It answers the question F-401's second half asked — *who may append, and where* — and it answers it without granting the Orchestrator an append path, so the F-201 self-trigger stays structurally excluded. The prohibition on the recurring task appending its own trigger is now an explicit clause of the approved decision rather than an inference from a write scope.

**What the approval does not settle.** It creates no capability. The collector is not implemented, so nothing is appended before dispatch, `ingress_seq` does not rise from it, and the durable predicate is still not what authorizes a dispatch. TASK-013's `activation.bootstrap_dispatch_contract` therefore still reads `interim-operator-authorized`, and **F-401 is not claimed resolved by this approval**. What changed is the exit condition: it was "a human must decide", and it is now "the approved collector must be built and independently validated".

**The decision has no durable governance commit.** `HUMAN-001` was recorded as a tracked commit on a non-agent branch, `fb9f45c`, which is what made it an ingress fact of class `human_decision_recorded`. `HUMAN-002` was given in the control session, so its only durable form is this Orchestrator's transcription inside `tasks/**`. It is therefore **not an ingress fact**, it raised no `ingress_seq`, and it has no inbox entry. That is recorded here rather than glossed, and a governance commit giving it the same provenance `HUMAN-001` has remains available to the user; no agent role can author one.

**No task carries a `human_decision` edge**, including on `HUMAN-002`: adding one to TASK-013 would give an event-triggered task a scheduling dependency, and adding one to any other task would block work that does not depend on it. The routing is in the requirements table below and in the ownership-gaps table.

## Gate assignment

Every `required_gates` entry has a named owner, every round is recorded, and every pair declares its scheduling class and its lineage.

| Gated task | Gate | Owner and round | Verdict | `gate_lineage` | `lineage_round` |
|---|---|---|---|---|---|
| TASK-001 | review | TASK-014 r1 | `changes-required` | `LIN-DECOMP-REVIEW` | 1 |
| TASK-001 | review | TASK-014 r2 | `changes-required` | `LIN-DECOMP-REVIEW` | 2 |
| TASK-001 | review | TASK-021 r3 | `changes-required` | `LIN-DECOMP-REVIEW` | 3 |
| TASK-001 | review | TASK-022 r4 | `changes-required` | `LIN-DECOMP-REVIEW` | 4 |
| TASK-001 | review | TASK-023 r5 | `changes-required` | `LIN-DECOMP-REVIEW` | 5 |
| TASK-001 | review | TASK-027 r6 | `changes-required` | `LIN-DECOMP-REVIEW` | 6 |
| TASK-001 | review | TASK-030 r7 | `changes-required` | `LIN-DECOMP-REVIEW` | 7 |
| TASK-001 | review | TASK-031 r8 | pending | `LIN-DECOMP-REVIEW` | 8 |
| TASK-002 | review | TASK-015 r1 | `changes-required` | `LIN-ARCH-REVIEW` | 1 |
| TASK-002 | review | TASK-020 r2 | `changes-required` | `LIN-ARCH-REVIEW` | 2 |
| TASK-002 | review | TASK-025 r3 | `changes-required` | `LIN-ARCH-REVIEW` | 3 |
| TASK-002 | review | TASK-029 r4 | `changes-required` | `LIN-ARCH-REVIEW` | 4 |
| TASK-002 | review | TASK-033 r5 | `changes-required` | `LIN-ARCH-REVIEW` | 5 |
| TASK-002 | review | TASK-035 r6 | pending | `LIN-ARCH-REVIEW` | 6 |
| TASK-016 | review | TASK-020 r1 | `changes-required` | `LIN-ARCH-REVIEW` | 2 |
| TASK-016 | review | TASK-025 r2 | `changes-required` | `LIN-ARCH-REVIEW` | 3 |
| TASK-016 | review | TASK-029 r3 | `changes-required` | `LIN-ARCH-REVIEW` | 4 |
| TASK-016 | review | TASK-033 r4 | `changes-required` | `LIN-ARCH-REVIEW` | 5 |
| TASK-016 | review | TASK-035 r5 | pending | `LIN-ARCH-REVIEW` | 6 |
| TASK-024 | review | TASK-025 r1 | `changes-required` | `LIN-ARCH-REVIEW` | 3 |
| TASK-024 | review | TASK-029 r2 | `changes-required` | `LIN-ARCH-REVIEW` | 4 |
| TASK-024 | review | TASK-033 r3 | `changes-required` | `LIN-ARCH-REVIEW` | 5 |
| TASK-024 | review | TASK-035 r4 | pending | `LIN-ARCH-REVIEW` | 6 |
| TASK-028 | review | TASK-029 r1 | `changes-required` | `LIN-ARCH-REVIEW` | 4 |
| TASK-028 | review | TASK-033 r2 | `changes-required` | `LIN-ARCH-REVIEW` | 5 |
| TASK-028 | review | TASK-035 r3 | pending | `LIN-ARCH-REVIEW` | 6 |
| TASK-032 | review | TASK-033 r1 | `changes-required` | `LIN-ARCH-REVIEW` | 5 |
| TASK-032 | review | TASK-035 r2 | pending | `LIN-ARCH-REVIEW` | 6 |
| TASK-034 | review | TASK-035 r1 | pending | `LIN-ARCH-REVIEW` | 6 |
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

**Fifty-eight** `gate_for` / `gate_tasks` pairs are declared, stated by enumeration so the total can be recomputed rather than trusted: 8 on TASK-001, 6 on TASK-002, 5 on TASK-016, 4 on TASK-024, 3 on TASK-028, 2 on TASK-032, 1 on TASK-034, 3 each on TASK-003, TASK-004, TASK-007, TASK-017, and TASK-026, 4 each on TASK-005, TASK-006, and TASK-008, and 2 on TASK-018 — that is 8 + 6 + 5 + 4 + 3 + 2 + 1 + 15 + 12 + 2. Revision 7 added five: one decomposition round and the four relations TASK-029 carried. Revision 8 added exactly one, the `LIN-DECOMP-REVIEW` round-8 relation TASK-031 carries. Revision 9 added **five**, the `LIN-ARCH-REVIEW` round-5 relations TASK-033 carries. Revision 10 added none, because activation `ACT-009` created no task and no relation. **Revision 11 adds six**, the `LIN-ARCH-REVIEW` round-6 relations TASK-035 carries, and enriches the five round-5 relations with their recorded verdict. The round-6 cohort is the largest this graph has declared, which is a direct measure of how many times this lineage has been amended without passing. Each pair's `gate_class`, `retrospective`, `gate_lineage`, and `lineage_round` are declared in the pair's own frontmatter and summarized in the registers above; they are not restated here or in any record body.

Author and gate owner are always **different roles** and always run in **different execution contexts**. No task gates itself, and no remediation returns to the execution context that reviewed it.

**Different LLM families is a preference, not a guarantee, and it does not currently hold for `LIN-ARCH-REVIEW`.** Revision 8 and earlier stated the family separation as though it were unconditional. `HUMAN-003` falsified that at `0b413b7` by setting `assignments.architect.llm` to `gpt`: TASK-028 and TASK-029 were both `gpt` at round 4, TASK-032 and TASK-033 were both `gpt` at round 5, and TASK-034 and TASK-035 are both `gpt` at round 6 — three consecutive rounds. `config/agents/settings.yaml` declares `prefer_different_llm` under `review` and `require_separate_execution` beside it; only the second is mandatory. Model correction **`MC-009`** at activation `ACT-008` corrected this passage and the matching sentence in TASK-029's body, which had asserted that the architect was `claude`. No script detects a same-family gate pair; whether one should exist is a governance question routed to the user.

Two properties of this table are deliberate and are stated without overclaiming:

1. **A pre-merge gate owner is always `point`, and no pre-merge gate is `aggregate`.** TASK-015, TASK-019, TASK-020, TASK-025, TASK-029, TASK-033, and TASK-035 are each dispatchable when the artifact they review publishes, so no gate that blocks integration ever waits several waves.
2. **A superseding round is a new task, not a re-entrant one, and the relation that survives supersession is the lineage.** TASK-014, TASK-015, TASK-020, TASK-021, TASK-022, TASK-023, TASK-025, TASK-027, TASK-029, TASK-030, and TASK-033 recorded durable verdicts and are `done`. TASK-031 performs decomposition round 8 and TASK-035 performs architecture round 6.

## Execution waves

```text
Wave 0   TASK-031                            decomposition re-review round 8, ready now
         TASK-013                            event-triggered, quiescent, not a wave member
Wave 1   TASK-034                            fifth architecture amendment, ready now
         TASK-035                            gate the fifth amendment before it merges, blocked until TASK-034 publishes
         TASK-032                            fourth architecture amendment, changes-required at round 5, not integrable
         TASK-028                            third architecture amendment, changes-required at round 4, not integrable
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

Revision 5 inserted TASK-026 at Wave 4 and moved the scheduler and everything after it one wave later, because the scheduler's ingress observer now reads a durable inbox that TASK-026 owns. Revision 7 changed only Wave 0 and Wave 1 membership: TASK-025 and TASK-027 recorded their verdicts and left, TASK-030 replaced TASK-027 at Wave 0, and TASK-028 and TASK-029 replaced TASK-025 at Wave 1. Revision 8 changed the same two. **Revision 9 changed only Wave 1**: TASK-029 recorded its verdict and left, and TASK-032 and TASK-033 joined, with TASK-032 the dispatchable half. Revision 10 changed no wave membership: it moved the dispatchable half of Wave 1 from TASK-032 to TASK-033. **Revision 11 changes only Wave 1**: TASK-033 recorded its verdict and left, and TASK-034 and TASK-035 join, with **TASK-034 the dispatchable half**. TASK-031 is unchanged at Wave 0 and remains dispatchable in parallel. **Wave 1 is now in its fifth attempt** — amend, gate, fail, amend again, five times over — and every later wave has moved with it each time. Round 5 is the first round to close a majority of what it was given: three of five findings `resolved` and one inherited view closed clean. It released nothing, because a `changes-required` verdict blocks integration whatever its finding count, and two new High findings opened alongside. That is the cost the aggregate register records for the architecture lineage, and it is stated rather than absorbed silently into the wave numbering. TASK-013 is not a wave and is not claimed at wave boundaries on a timer. It is dispatched only when an unconsumed ingress fact exists; see the activation model below.

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
| **Ingress inbox** | A durable, append-only state store of ingress **entries**. Each entry has a stable monotonic `seq` assigned once at append, a `fact_id` content hash that is its identity, and a `content_hash` over the source artifact. It carries **no consumption state**. It is not a Git ref scan, not a commit count, and not a file under `tasks/` | The ingress adapters in the runtime phase, and the authorized bootstrap appender in the bootstrap phase, on behalf of the producing owners. **No write under `tasks/` is required or permitted to append one, and no TASK-013 activation may append one** | The ingress observer |
| **Ingress cursor** | `activation.last_consumed_event_seq` in TASK-013's frontmatter | TASK-013, in the same commit as the activation's effects | The ingress observer |
| **Consumption ledger** | The event table in `tasks/TASK-013-ACTIVATION-LOG.md` | TASK-013, append-only, one row per consumed entry, written **by the consuming activation** and never afterwards | Humans and reviewers, as durable provenance |

The ledger is a **record of consumption, not a queue and not the inbox**. A row is created already consumed and already stamped with its consuming activation, so no row is ever edited and `consumed_by` is never mutated. The row is a *separate record that references an entry*; it is not the entry and it never writes back to it. Consumption state lives in exactly one place — the cursor — which is what F-201 required and what F-401 recorded revision 5 had not achieved.

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

### Entry schema and ledger-row schema — two schemas, not one

Finding **F-401** recorded that revision 5 declared one schema for both surfaces and put `consumed_by` in it. That is incoherent: an entry must exist *before* consumption in order to raise `ingress_seq` above the cursor, so at append time no consumer exists and the field can only be mutated later, duplicated outside the cursor, predicted, or left false. Every option violates a stated rule. Revision 6 **splits the two schemas** and removes `consumed_by` from the inbox entirely.

**Inbox entry — immutable from the moment it is appended.**

| Field | Meaning |
|---|---|
| `seq` | A stable monotonic integer, assigned **once** at append time and never recomputed. It is not a count of anything outside the inbox |
| `epoch` | The ingress epoch that assigned this `seq` |
| `fact_id` | SHA-256 over the canonical identity tuple below. This is the entry's identity and the deduplication key |
| `content_hash` | SHA-256 over the bytes of the source artifact at the source commit |
| `event_type` | The single class the fact resolves to after class precedence |
| `producer_task`, `producer_role` | The owner that produced the fact inside its own write scope |
| `source_commit`, `source_path` | Provenance. They identify where the fact came from; they never determine its position |
| `appended_by` | The adapter or the authorized bootstrap appender that appended the entry. Never a TASK-013 activation |

**An inbox entry has no `consumed_by` field and no consumption state of any kind.** Nothing about an entry changes when it is consumed. An entry is byte-identical before and after the activation that consumes it, so "immutable append-only store" is true of the artifact and not only of the prose.

**Consumption-ledger row — a separate record, written already consumed.**

| Field | Meaning |
|---|---|
| `seq`, `epoch`, `fact_id`, `content_hash`, `event_type`, `producer_task`, `producer_role`, `source_commit`, `source_path` | Copied verbatim from the inbox entry the row records. The row **references** the entry by `seq` and `fact_id`; it does not replace it and is not part of it |
| `consumed_by` | The activation that consumed the referenced entry. Stamped at row creation, never mutated, and never written back to the entry |

Consumption state lives in exactly one place: the cursor. `consumed_by` on a ledger row is provenance about which activation consumed a range, not a flag that makes an entry consumed. A reader determines whether entry *n* is consumed by comparing *n* with `activation.last_consumed_event_seq`, never by reading a field on the entry or on a row.

**`source_path` for a multi-file publication.** For `artifact_published`, `source_path` is the producing task's **declared entry-point artifact** — the first path in that task's "Expected artifacts" list. This makes `content_hash` and therefore `fact_id` deterministic for a commit that touches many files, without introducing an ordering or aggregation rule.

**`source_path` and `producer_task` for a governance decision.** A `human_decision_recorded` fact has no producing task, so two fields of the schema had no defined value for it. Model correction `MC-007` closes that gap rather than leaving each activation to improvise:

- `source_path` is **`config/agents/settings.yaml`**, the runtime assignment source of truth this repository declares, whenever the decision changes it. A governance decision that changes a different governance artefact names that artefact instead, and a decision that changes none is **not** an ingress fact, because it has no durable content to hash — which is exactly why `HUMAN-002` has no entry.
- `producer_task` carries the **decision identifier** — `HUMAN-001`, `HUMAN-003` — in the position the canonical identity tuple reserves for `producer_task`. The tuple's shape and hashing rule are unchanged; only the domain of that one field widens, from task IDs alone to task IDs and decision IDs, which are disjoint by construction.
- `producer_role` is `human`.

This makes `fact_id` and `content_hash` reproducible for a governance commit by the same procedure as for any other class, and it was applied to `seq` 13.

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

### Who appends, who dispatches, and what the bootstrap contract actually is

Revision 5 said the consumption ledger was "the durable record of the inbox until TASK-026 exists". Finding **F-401** recorded what that means operationally: during bootstrap the consuming activation is *both* the first durable appender and the consumer, so before dispatch no durable entry exists, `ingress_seq` equals the cursor, and the formal predicate `ingress_seq > last_consumed_event_seq` **cannot** be what authorized the dispatch. Revision 5's claim that discovery affects only liveness therefore did not hold in the bootstrap phase. Revision 6 stops making that claim and states two disjoint, separately named dispatch contracts.

| Phase | Who appends, before dispatch | Who evaluates the predicate and dispatches | Status |
|---|---|---|---|
| **Runtime phase** | The ingress adapters over the durable inbox, owned by **TASK-026** | The ingress observer in `src/orchestrator/scheduling/`, owned by **TASK-005**, evaluating `ingress_seq > last_consumed_event_seq` | The durable design |
| **Bootstrap phase, corrected** — `durable-bootstrap-append` | The **Runtime-owned durable pre-dispatch ingress observer and collector** that `HUMAN-002` approved on 2026-08-05. It lives **outside `tasks/**`** in the **runtime control plane**, and before TASK-013 is selected it validates and deduplicates an external source fact and appends the immutable inbox entry **through the TASK-026 ingress store** — never a TASK-013 activation, and never any agent writing its own trigger | The same predicate, evaluated against the new high-water mark the collector **exposes or signals to TASK-005 scheduling** | **Approved and specified; not yet operative.** The contract is routed to TASK-028, the collector to TASK-026, the signal consumption to TASK-005, and the validation to TASK-009, TASK-010, and TASK-011 — see below. Revision 6 named the appender as the human operator or an operator-run tool; `HUMAN-002` chose a runtime-owned component instead, and this row records the approved option rather than the superseded proposal |
| **Bootstrap phase, interim** — `interim-operator-authorized` | Nothing is appended before dispatch. The operator selects TASK-013 directly on the strength of a published producer commit | The human operator, on their own authority | **In force today.** Named, bounded, and declared a limitation rather than presented as the durable predicate |

**TASK-013 declares which contract it is running under**, in `activation.bootstrap_dispatch_contract`. While that field is `interim-operator-authorized`, the graph makes no claim that the durable inbox predicate authorized the dispatch. This is the honest statement F-401 asked for, and it replaces the claim that the substitution was confined to liveness.

What the corrected `durable-bootstrap-append` contract requires, and where each part is routed:

| Requirement | Owner | Status |
|---|---|---|
| **The decision itself**: who may append, where, and under what authority | human governance decision **HUMAN-002** | **Approved** on 2026-08-05, in the control session. A Runtime-owned durable pre-dispatch ingress observer and collector, outside `tasks/**`, in the runtime control plane. Transcribed as `MC-006`. It has no durable governance commit; unlike `HUMAN-001` at `fb9f45c` it is not an ingress fact and raised no `ingress_seq` |
| The **contract representation** of the approved collector, the split entry / ledger-row schemas, the removal of `consumed_by` from the inbox entry, and the two named bootstrap dispatch contracts | **TASK-028**, as scope item 9 and part of A-201 | Routed. `TASK-025` judged the published TASK-024 amendment at `c2ee3eb` and found four of six Part D checks **not satisfied**: `consumedBy` remains at `docs/architecture/runtime/INTERFACE-CONTRACTS.md:551`, neither contract is named, `appendedBy` permits "adapter or activation", and ADR-0017 still claims discovery affects only liveness. **TASK-029** decides TASK-028 |
| The **collector**: validation, deduplication, the append through the store, and the high-water-mark signal, with the store and adapters carrying no `consumed_by` on an entry and enforcing the authorized-appender check | **TASK-026** | Routed. Implemented inside `src/orchestrator/ingress/**` unless the approved TASK-028 contract places it elsewhere, in which case the placement returns to the Orchestrator for a write-scope correction before dispatch |
| Consumption of the collector's signal, the observer, the predicate, cursor validation, the one-commit rule, and rejection of a dispatch whose declared contract is not satisfied. **This module does not append** | **TASK-005** | Routed |
| Any CI tooling that reads or writes the durable inbox | **TASK-018** | Routed, and unchanged by the decision |
| End-to-end proof that a durable entry exists **before** dispatch, that no entry is mutated by consumption, and that the collector's append precedes scheduler selection | **TASK-011** `V11-F401-PREDISPATCH`, with the static half and the module-boundary check **TASK-009** `V9-F401-SCHEMA` and appender authority **TASK-010** `V10-F401-AUTH` | Routed |

What is unchanged and remains true under both contracts:

- **Identity and position are durable.** An entry's `fact_id` is a function of the fact, never of when it was discovered, and its `seq` is assigned once at append. A late-discovered fact appends at the next free `seq`.
- **The cursor never reads a ref.** It is `max(seq)` over durable entries. Branch deletion, force-push, rebase, and clock skew cannot change it.
- **Exactly-once consumption is preserved by the one-commit rule**, independently of which contract authorized the dispatch.

What is no longer claimed: that during bootstrap the durable predicate is operative, and that discovery affects only liveness. Under `interim-operator-authorized` it affects dispatch validity, and that is recorded as an open High finding rather than as a resolved one.

**And what an approved `HUMAN-002` still does not claim.** The decision names the appender and fixes its ownership, its location, and its ordering. It builds nothing. Until the collector exists and TASK-009, TASK-010, and TASK-011 have validated it, no entry is appended before dispatch, `bootstrap_dispatch_contract` stays `interim-operator-authorized`, and **F-401 is not resolved**. `ACT-006` itself ran under the interim contract, with the approval already recorded. A reader who treats the approval as the capability reproduces the exact overclaim F-401 identified, one level up.

### Starvation bound

The scheduler must dispatch TASK-013 within a stated bounded number of scheduling rounds after `ingress_seq` increases, even under a saturated ready set, and must never dispatch it while it is quiescent.

### Where each obligation is implemented and independently validated

| Obligation | Implemented by | Independently validated by |
|---|---|---|
| Durable append-only inbox, one-time `seq` assignment, `fact_id` and `content_hash` computation, identity-keyed deduplication, retention independent of refs, crash-safe append | TASK-026 | TASK-009 `V9-F301-STORE`, TASK-011 `V11-F301-STORE` |
| Ingress adapters, class precedence, self-exclusion, batch order by source commit identifier, epoch handling | TASK-026 | TASK-009 `V9-F301-CLASS`, TASK-011 `V11-F301-CLASS` |
| Inbox entry carries no consumption state; the ledger row is a separate referencing record; an entry is byte-identical before and after consumption | TASK-026 | TASK-009 `V9-F401-SCHEMA`, TASK-011 `V11-F401-PREDISPATCH` |
| A durable entry exists **before** dispatch under the declared bootstrap dispatch contract, and a dispatch whose declared contract is unsatisfied is rejected | TASK-005 | TASK-011 `V11-F401-PREDISPATCH` |
| Only an authorized appender may append; a commit authored by a TASK-013 activation and an unauthorized appender are both rejected | TASK-026 | TASK-010 `V10-F401-AUTH` |
| Ingress observer, dispatch predicate, cursor monotonicity and upper bound | TASK-005 | TASK-009 `V9-A004-ACT`, TASK-011 `V11-A004-ACT` |
| One-commit effects-plus-cursor rule and crash replay | TASK-005 | TASK-011 `V11-A004-ACT` |
| Starvation bound under a saturated ready set | TASK-005 | TASK-009 `V9-A004-ACT`, TASK-011 `V11-A004-ACT` |
| Lineage-form edge resolution, withdrawal of the owner form, invariant 8 | TASK-005 | TASK-009 `V9-F302-LINEAGE`, TASK-011 `V11-F302-LINEAGE` |
| End-to-end loop: gate report publication → **durable pre-dispatch append** → observation → dispatch → effects commit → cursor advance → quiescence | — | TASK-011 `V11-A004-ACT` and `V11-F401-PREDISPATCH`, as executable end-to-end tests |
| Contract representation of the inbox, the epochs, and the revision-5 scheduling vocabulary | TASK-024, published at `c2ee3eb` and judged `changes-required` at `aa38c7d2` | TASK-025, recorded |
| Contract representation of the split entry / ledger-row schemas, the absence of `consumed_by` on an inbox entry, the two named bootstrap dispatch contracts, and the approved `HUMAN-002` collector | **TASK-028** | **TASK-029** |
| The `HUMAN-002` collector: pre-dispatch validation, deduplication, append through the store, and the high-water-mark signal | TASK-026, with the signal consumed by TASK-005 | TASK-009 `V9-F401-SCHEMA`, TASK-010 `V10-F401-AUTH`, TASK-011 `V11-F401-PREDISPATCH` |

The six failure modes F-301 named are each a required test: backdated publication, one commit matching several classes, deletion of the producing ref, discovery of an unseen historical fact, publication of the activation's own effects, and crash replay between dispatch and cursor advance. They are assigned to `V11-F301-STORE` and `V11-F301-CLASS`, with the static half assigned to `V9-F301-STORE` and `V9-F301-CLASS`. The two failure modes F-401 named — dispatch with no durable pre-dispatch entry, and an entry whose own consumption mutates it — are assigned to `V11-F401-PREDISPATCH`, with the static schema half assigned to `V9-F401-SCHEMA` and appender authenticity to `V10-F401-AUTH`.

## Reconciliation with the TASK-002 architecture

The architecture at commit `9576fc9` on `agent/claude/architect/task-002` was the normative technical source. TASK-015 round 1 returned `changes-required` with A-001 … A-004; TASK-016 amended it at `8d0c570`; TASK-020 returned `changes-required` at `4874a9d` with A-101 … A-105, judging A-001 `resolved`, A-002 and A-003 `partially resolved`, and A-004 `not resolved`; TASK-024 amended it at `c2ee3eb`; TASK-025 returned `changes-required` at `aa38c7d2` with A-201 … A-209; TASK-028 amended it at `fe0374c`; **TASK-029 returned `changes-required` at `3df261fa`** with the new finding A-301, judging **A-202 and A-004 `not resolved`**, **A-203, A-206, A-105, A-101, A-102, and A-104 `partially resolved`**, and A-201, A-204, A-205, A-207, A-208, A-002, A-003, and A-103 `resolved`. **TASK-032 must now author the next amendment, and TASK-033 judges it.**

**Round 4 is the first round that resolved more than it left open, and it still released nothing.** Eight findings closed and five remain — A-202, A-203, A-206, A-105, and A-301 — of which three are High. A `changes-required` verdict blocks integration whatever its finding count, so the reduction changes the amount of remaining work and not the state of any gate. TASK-029 additionally recorded that **A-004, A-101, A-102, and A-104 are inherited views** of the same projection, registration-proof, and result-adoption defects and "do not create duplicate implementation obligations", so TASK-032 carries five scope items rather than nine.

**No approved architecture source exists.** Every round of this lineage has returned `changes-required`: round 1 rejected `9576fc9`, round 2 rejected `8d0c570`, round 3 rejected `c2ee3eb`, round 4 rejected `fe0374c`, and round 5 rejected `468b37b`. **The architecture this graph will build on is `9576fc9` as amended by `8d0c570`, by `c2ee3eb`, by `fe0374c`, by `468b37b`, and further amended by the TASK-034 commit that TASK-035 approves** — and it comes into being only when `LIN-ARCH-REVIEW` records a passing or formally accepted authoritative verdict at `lineage_round` 6 or later. Until then the graph names a *target*, not an approved source. Every architecture dependency edge names the lineage `LIN-ARCH-REVIEW` at `lineage_round: 5` rather than any single task, so no further retarget is required if a sixth round becomes necessary — only the floor moves, and under F-601 it never moves without the source clause moving in the same commit.

**Normative source rule.** F-202 recorded that TASK-003 still pinned the rejected baseline alone; **F-601 then recorded that the nine consumers named the round-3 amendment as one TASK-025 approves, when TASK-025 had rejected it.** Every implementation record now states its normative source in the same corrected form: *the named documents at `9576fc9` **as amended by `8d0c570`, by `c2ee3eb`, by `fe0374c`, by `468b37b`, and by the TASK-034 commit that TASK-035 approves***, together with the explicit statement that none of the five named baselines is approved. A record that cites a baseline without the amendment clause is a finding; a record that names `8d0c570`, `c2ee3eb`, `fe0374c`, or `468b37b` as approved is a finding; and a record that attributes an approval to a round that recorded `changes-required` is a finding. No superseded baseline and no ungated amendment is ever the normative source on its own. **A raised lineage floor is not by itself sufficient** — F-601 recorded that the floor was mechanically correct at round 4 while the source clause still pointed at the rejected round-3 artifact, so the floor and the source clause must be moved together.

**Revision 9 is the first live exercise of that rule.** Round 4's failure raised the floor from 4 to 5, and activation `ACT-008` moved every source statement in the same commit: nine `normative_architecture_source` fields, nine `exit_condition` fields, nine dependency-edge floors, TASK-026's body restatement, TASK-028's own field, and this section together with the normative-source, lineage-edge, module-map, F-401-defect, and ownership-gap passages. A search for `lineage_round: 4` over the live records returns nothing outside closed activation history and TASK-031's immutable round-8 instructions. The clause is deliberately **not** retargeted to "the TASK-032 commit that TASK-033 approves" *alone*, which would reproduce the identical defect one round later if round 5 also fails; it is stated together with the assertion that no approved source exists at all.

**Revision 11 is the second live exercise, and it discharges exactly the commitment revision 10 made.** Revision 10 stated that if round 5 recorded `changes-required`, the consuming activation would add `468b37b` to the enumeration and raise the floor to 6 **in one commit**. Round 5 did, and `ACT-010` did: the floor rose from `lineage_round: 5` to `6` on nine dependency edges while nine `normative_architecture_source` fields, nine `blocked_reason` fields, nine `exit_condition` fields, TASK-026's body restatement, and this section all moved in the same commit. `468b37b` is now a fifth superseded authoring baseline. The clause is again deliberately **not** retargeted to "the TASK-034 commit that TASK-035 approves" alone, and it is stated together with the assertion that no approved source exists at all.

**Revision 10 left all nine consumer clauses untouched, and that omission was deliberate rather than an oversight.** TASK-032's commit now exists and is identified — `468b37b` — so a reader may reasonably ask why the clause "the TASK-032 commit that TASK-033 approves" was not replaced with the hash. It was not, for three reasons, and the F-601 rule is satisfied by leaving it alone rather than violated by it. First, **the floor did not move**: round 5 recorded nothing, so `lineage_round: 5` is unchanged on all nine edges, and the rule binds the floor and the source clause to move *together* — moving one alone in either direction is what F-601 prohibits. Second, the clause is **conditional on approval**, and substituting the hash would convert "the commit that TASK-033 approves" into "this commit", which asserts the approval the clause exists to withhold. Third, `468b37b` is **not yet a superseded authoring baseline**; `9576fc9`, `8d0c570`, `c2ee3eb`, and `fe0374c` each entered the enumeration at the moment a round rejected them, and `468b37b` enters it only if round 5 does the same. Recording it there now would misstate its status as settled when it is the artifact under judgment. If round 5 records `changes-required`, the activation that consumes that verdict adds `468b37b` to the enumeration and raises the floor to 6 in one commit, as `ACT-008` did for `fe0374c`. If round 5 passes, the clause resolves instead, and the same commit does both.

**The F-401 contract defect is now judged, and the judgment is more interesting than a pass or a fail.** `c2ee3eb` declared `consumedBy: ActivationId | null` on the inbox entry and repeated the single-schema model; TASK-025 recorded four of six Part D checks `not satisfied` at `aa38c7d2`. TASK-028 remediated it at `fe0374c`, and **TASK-029 recorded all six `HUMAN-002` contract checks `satisfied` at `3df261fa`** — the immutable-entry schema, both named dispatch contracts, the closed append-principal union, the runtime-owned pre-dispatch collector, its ordering before scheduler selection, and the bounded interim authorization. **And the same verdict is `changes-required`**, because A-202 is `not resolved`, with the reviewer stating in terms that the satisfied checks "does not cure A-202".

So the contract carrying six satisfied F-401 properties is **not approved**, and F-401 is **not claimed resolved by architecture**. A reader who lifts the six satisfied checks out of the verdict that contains them would conclude otherwise. That is a third variant of the same overclaim F-401 itself recorded — first an approval read as an implementation, then a publication read as an approval, now a satisfied subset read as the verdict — and the graph names it rather than leaving the arithmetic to the reader. The remediation is routed to TASK-032 and the judgment to TASK-033.

**Revision 10 added the fourth variant, which is the quietest of the four.** TASK-032 published an amended contract representation at `468b37b`, and its owner reported all six `HUMAN-002` checks passing again. That is a *re*-publication after a rejection, and it reads like progress. It is not: an unjudged contract is further from operative than a rejected one is from approved, because the rejected one at least names its defects. **The chain advanced zero links at `ACT-009`.**

**Revision 11 records the judgment, and it is the sharpest instance yet of the distinction.** TASK-033 re-assessed all six properties **independently** and recorded **all six satisfied** — the second consecutive round to do so, and this time in a tree reached by content import rather than by ancestry, which is a stronger result than round 4's. The verdict is still `changes-required`, and the report states the conclusion "is independent of, and does not cure, A-202, A-401, or A-402". So the contract carrying six independently verified F-401 properties is **not approved**, for the second round running, and the blockers are in entirely different parts of the amendment. **The chain has now advanced zero links across three consecutive publications.** A reader who lifts the six satisfied checks out of the verdict containing them would conclude the collector contract is approved twice over; it is not, and `bootstrap_dispatch_contract` still reads `interim-operator-authorized`.

### Why an architecture fixture over `tasks/**` goes stale, and what `MC-011` requires

This is the durable statement of model correction **`MC-011`**, recorded at activation `ACT-010`. It explains a defect that has now cost two rounds and that no architect could have avoided by care alone.

**The structural problem.** The architecture must state counts, cardinalities, and a current-graph proof over the committed task records — A-202's surviving half and the whole of A-402 are failures to do so correctly. But `tasks/**` is the Orchestrator's exclusive write scope among agent roles, it changes at **every** activation, and the architect can neither write it nor stop it moving. A fixture that is exactly right when an amendment is authored is stale as soon as the next activation lands.

**How it actually failed.** TASK-029 told TASK-032 to "recount both against the target tree rather than inheriting the numbers", and `ACT-009` repeated the instruction on TASK-033's record. TASK-032 nevertheless carried round 4's numbers — 30 records, 92 relation documents, 24 enriched — into an amendment whose own tree held 33, 104, and 34. **Two instructions to recount produced two inherited counts**, so the instruction was not the fix.

**What `MC-011` requires**, in three parts:

1. Every count, cardinality, and graph proof over `tasks/**` is derived by **enumeration over the amendment's own published target tree at publication time**, and inherited from no report, no earlier amendment, and no task record.
2. **A task record that routes such an obligation states no count of its own.** TASK-034's record deliberately contains none. Naming the expected value is how the stale number propagates — an architect that sees a number in its own instructions copies it, which is the likeliest reading of round 5, and the Orchestrator would then have supplied the stale value itself.
3. Where the contract permits, a **derivation rule is preferred over a literal count**, because a rule does not go stale when the Orchestrator performs an activation.

**What is routed rather than decided.** Whether the architecture should embed live counts over `tasks/**` at all — or should name the register as the source of truth and assert only invariants — is a question about what the architecture must *contain*. That is not the Orchestrator's to answer, and it goes to the next `LIN-DECOMP-REVIEW` round. Note also that an independent projection at round 5 found the committed records themselves acyclic and schedulable with 33 tasks, 52 pairs, and 137 expanded prerequisite edges: **the graph is sound and the architecture's description of it is stale**, which is why A-402 is a currentness defect against the architect and not a defect in this document.

**Module map.** Each of the six modules in `docs/architecture/runtime/COMPONENT-BOUNDARIES.md` maps to exactly the owner task this graph assigns, and the source paths match the write-scope partition below. The seventh module added by TASK-016 maps to TASK-017. The **eighth** module, the durable ingress inbox, maps to TASK-026. **TASK-029 checked the eight-module claim independently at `3df261fa` and confirmed it**: 8 module rows, 8 distinct module names, 8 distinct owner tasks, 8 distinct source paths, 10 dependency nodes, 17 allowed import edges, no cycle, two contract roots with no edge between them. That is a checked property rather than an accepted claim, and it is one of the things round 4 recorded `resolved` under A-207. It does not make the amendment approved: the same verdict is `changes-required`. TASK-032 must preserve the map, and **TASK-033 re-checks it** rather than inheriting round 4's result.

**Contract roots.** `src/orchestrator/state/contracts/` is owned by TASK-003 and `src/agents/contracts/` by TASK-004. Every other task imports from a contract root and never from a sibling implementation.

**Contract change control.** No implementation task may change a type, signature, field name, or string-literal union declared in `INTERFACE-CONTRACTS.md` during Waves 3 through 7, even inside its own write scope. A task that finds a contract wrong stops at the boundary and hands off to the Orchestrator, which routes an amendment to the architect under a task shaped like TASK-016 and TASK-024. TASK-009 verifies it by diffing both contract roots against the document.

**Integration order.** `docs/architecture/runtime/INTEGRATION-STRATEGY.md` requires every task to branch from the integration branch at or after the commit where its dependencies merged, squash-merge one commit per task, and never push to `main`. The wave order above is that merge order. TASK-020's A-101 records that the document still compiles against the revision-3 vocabulary; reconciling it with revision 5 is TASK-024's obligation.

**Ownership gaps.** All three are routed and all three appear in the graph:

| Gap | Routed to | Status |
|---|---|---|
| No task owns the root toolchain manifests or `scripts/quality/**` | TASK-018 | Ownership resolved by HUMAN-001 at `fb9f45c`; now blocked only on the architecture gate |
| No module owns the agent workspace lifecycle that `AgentInvocation.worktreePath` presupposes | TASK-016, then TASK-024, then TASK-028, then TASK-032, then TASK-017 | TASK-016 published `WORKSPACE-LIFECYCLE.md` and ADR-0011 at `8d0c570`; TASK-020 judged the ownership documented but not implementation-ready through A-102 and A-103. TASK-024's remediation at `c2ee3eb` was judged `changes-required` at `aa38c7d2`. TASK-028's remediation at `fe0374c` was judged `changes-required` at `3df261fa`, and round 4 **narrowed the gap precisely**: **A-103 and A-205 are `resolved`** — prepare, finalize, and abandon have plan/intent/execute phases and publication identity is durably recorded before the lock is released — while **A-206 stays `partially resolved`**, because `spawnOwned` promises a `RegistrationNotDurable` refusal its result type cannot express. A-102's process-registration half rides on that one defect. Routed to **TASK-032** scope item 3; **TASK-033 decides** |
| No module owns the durable ingress inbox the activation model requires | TASK-024, then TASK-028, then TASK-032, then TASK-026 | Opened by F-301. TASK-024 published a module and contract at `c2ee3eb`; TASK-025 judged four of six Part D checks not satisfied. TASK-028 published its remediation at `fe0374c`, and **TASK-029 recorded all six checks satisfied at `3df261fa` — inside a `changes-required` verdict.** The ingress contract itself is therefore in the best state it has ever been in and is **still not approved**, because A-202 blocks the amendment that carries it. TASK-026 implements it once an approved contract exists, which now means after `LIN-ARCH-REVIEW` round 5 or later |
| **No authorized producer can append a durable ingress entry before TASK-013 is selected during bootstrap** | **HUMAN-002** decided it; **TASK-032** for the contract, **TASK-026** for the collector, **TASK-005** for the signal, TASK-018 for any CI tooling | **Decided, contract published, contract judged and rejected, still open as a capability.** Opened by F-401. `HUMAN-002` was approved on 2026-08-05 and assigns the append to a Runtime-owned durable pre-dispatch collector outside `tasks/**`, so the ownership gap has an owner and a shape — and an Orchestrator-authored append is still excluded, which is what keeps F-201's self-trigger closed. TASK-028 published a contract representation at `fe0374c` including ADR-0023 and ADR-0031, and **TASK-029 recorded all six `HUMAN-002` contract checks satisfied at `3df261fa` while returning `changes-required` overall.** The contract representation is therefore judged adequate on its own six properties and **not approved**, because it rides in an amendment A-202 blocks. The gap itself remains until the collector is implemented and independently validated; TASK-013 runs under the declared `interim-operator-authorized` dispatch contract until then — `ACT-008` ran under it — which the graph names as a limitation rather than presenting as the durable predicate |

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
| TASK-027 | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-6.md` | — |
| TASK-028 | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/runtime/**`, `docs/adr/**`, `diagrams/architecture/**` | `architecture-docs` |
| TASK-029 | `reports/code-review/TASK-028-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-3.md` | — |
| TASK-030 | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-7.md` | — |
| TASK-031 | `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-8.md` | — |
| TASK-032 | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/runtime/**`, `docs/adr/**`, `diagrams/architecture/**` | `architecture-docs` |
| TASK-033 | `reports/code-review/TASK-032-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-4.md` | — |
| TASK-034 | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/runtime/**`, `docs/adr/**`, `diagrams/architecture/**` | `architecture-docs` |
| TASK-035 | `reports/code-review/TASK-034-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-5.md` | — |

Every scope is a subset of its role's configured scope in `config/agents/settings.yaml`. **The configured scope changed at `0b413b7`**, where `HUMAN-003` set `assignments.architect.llm` to `gpt`; that commit changes an assignment, not a `write_scope`, so every scope in this table remains a subset of the same configured role scopes it was checked against at `fb9f45c`, and TASK-028's declared `llm` now agrees with the settings file where before it would not have. TASK-026's paths are inside the runtime role's configured `src/orchestrator/**` and `tests/unit/orchestrator/**`, and are disjoint from TASK-003's `state/`, TASK-005's `scheduling/`, TASK-006's `supervisor/`, TASK-007's `lifecycle/`, TASK-008's `recovery/`, and TASK-017's `workspace/`.

The fifteen reviewer-owned report files — TASK-009's two paths, TASK-014, TASK-015, TASK-019, TASK-020, TASK-021, TASK-022, TASK-023, TASK-025, TASK-027, TASK-029, TASK-030, TASK-031, TASK-033, and TASK-035 — are mutually path-disjoint by construction, so any of them may run concurrently.

**TASK-032 introduces no new overlap.** Its scope is disjoint from every non-architecture task's scope: no path it may write is inside any reviewer, security, QA, performance, runtime, devops, or orchestrator task's scope. It is identical to TASK-002's, TASK-016's, TASK-024's, and TASK-028's, because an amendment necessarily edits the documents the previous amendment authored, and that is the overlap the `architecture-docs` lock already exists to serialize. The lock's holder set grows from four to five; the number of distinct overlapping *scopes* stays one. TASK-033's report path is new and disjoint from every other scope in the graph.

### Overlaps that remain, and how they are serialized

Four tasks share the `architecture-docs` scope and two share `task-records`, because in each case a later task exists to revise what an earlier one produced. They declare a shared `resource_lock`.

| Lock | Held by | Why the overlap is real |
|---|---|---|
| `task-records` | TASK-001, TASK-013 | Both own `tasks/**`. TASK-013 exists to keep every task record current, which is by definition the surface TASK-001 created |
| `architecture-docs` | TASK-002, TASK-016, TASK-024, TASK-028, TASK-032, TASK-034 | TASK-016 amends documents TASK-002 authored, and TASK-024, TASK-028, TASK-032, and TASK-034 amend the same documents again. Each new failing architecture round adds one holder; nothing in the model removes one. The holder count is therefore a running tally of how many times this lineage has been amended |

Resource-lock semantics, which TASK-005 must enforce at admission alongside write-scope exclusion:

1. At most one task holding a given resource lock may be claimed at any time.
2. A lock is not a dependency. It constrains concurrency, not order.
3. The scheduler refuses admission of a task whose lock is held and returns it to the ready set rather than queueing behind it.
4. A resource lock is declared in the task record's `resource_lock` field and is machine-readable.

At revision 11, `architecture-docs` is **free**: the TASK-032 execution released it, and neither TASK-033 nor TASK-035 declares a lock. `task-records` is held by the TASK-013 activation that is running; TASK-001 is not claimed. TASK-031 and TASK-035 hold no lock, so TASK-031 and TASK-034 are dispatchable in parallel and neither can collide with the other. The lock has **six** registered holders — TASK-002, TASK-016, TASK-024, TASK-028, TASK-032, and TASK-034 — and revision 11 adds exactly one, TASK-034, which is not yet claimed. The holder count still only ever grows: TASK-032 completing its authoring did not remove it, which is what makes the count a tally of amendments attempted rather than a measure of contention now.

**Every per-task lock except the Orchestrator's own is free at revision 11, and the one statement that says otherwise is time-scoped rather than current.** TASK-033's own report states `Task lock released: no; explicitly reserved for the outer supervisor`, which was accurate at the end of the reviewer's execution, before its report was committed. Release then happened: after commit `3660cc2` the outer supervisor ran the official `release-task.ps1` for TASK-033 and it returned `released: True` for the reviewer / `gpt` session. `ACT-010` began after that and **read the shared Git common lock directory directly rather than inferring it** — it contains exactly one entry, `task-013.json`, and no `task-033.json`. Both facts are recorded and the owner's statement is not overwritten. The reviewer did not release its own lock and is not recorded as having done so, and force-releasing another execution's lock remains prohibited without a human verifying the owning session is stale.

## Task-record lifecycle ownership

**Every task-record mutation in this graph is performed by the `orchestrator` role and by nothing else.** TASK-013 owns it.

| Actor | May write | Must not write |
|---|---|---|
| Implementation owner (TASK-003 … TASK-008, TASK-017, TASK-018, TASK-026) | Its own source and test scope; the commit message; the pull request description | Any file under `tasks/` |
| Validating owner (TASK-009 … TASK-012, TASK-014, TASK-015, TASK-019 … TASK-023, TASK-025, TASK-027, TASK-029, TASK-030, TASK-031, TASK-033, TASK-035) | Its own report scope; the pull request description | Any file under `tasks/` |
| **A human acting on their own authority** | Anything, including files under `tasks/` and `config/` | — |
| Architect (TASK-002, TASK-016, TASK-024, TASK-028, TASK-032, TASK-034) | Its architecture scope; the commit message; the pull request description | Any file under `tasks/` |
| Orchestrator (TASK-013) | Every task record, including `status`, lifecycle directory, Handoff sections, the activation log, and this graph | Any source, test, report, or architecture file |

Each owner records its handoff where its own scope allows, and TASK-013 transcribes it into the task record, naming the source. Every task record carries a "Task-record lifecycle" section stating this, and no record instructs its owner to move itself.

**The human row is not an exception carved out for convenience; it is a statement of what the rule actually constrains.** The exclusivity above binds *agent roles*. A human governance decision may write any path, and `HUMAN-003` at `0b413b7` did write four records under `tasks/**` directly. No agent may reverse, re-apply, or override such an edit: TASK-013 **verifies** it against the records and **records** it as an ingress fact of class `human_decision_recorded`, which is what activation `ACT-007` did at `seq` 13. The acceptance criterion that a `git log --follow` over `tasks/` shows only `agent/claude/orchestrator/*` branches is therefore restated precisely — it holds for every *agent-authored* commit, and a human governance branch is a recorded, named exception rather than a violation.

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
| Inbox entry carries no consumption state; ledger row is a separate referencing record; entry byte-identical before and after consumption (F-401) | TASK-026 | TASK-009, TASK-011 | **TASK-009 `V9-F401-SCHEMA`**; **TASK-011 `V11-F401-PREDISPATCH`** |
| A durable entry exists before dispatch under the declared bootstrap dispatch contract, and an unsatisfied contract rejects the dispatch (F-401) | TASK-005 | TASK-011 | **TASK-011 `V11-F401-PREDISPATCH`** |
| Only an authorized appender may append an ingress entry; a recurring-task-authored commit and an unauthorized appender are both rejected (F-401) | TASK-026 | TASK-010 | **TASK-010 `V10-F401-AUTH`** |
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
| Workspace lifecycle architecture | TASK-016, TASK-024, TASK-028, TASK-032 | TASK-033 | TASK-033 Part D module-map and contract criteria. TASK-029 recorded A-103 and A-205 `resolved` and A-206 `partially resolved` at round 4 |
| Amended runtime contracts for A-001 … A-004, A-101 … A-105, A-201 … A-208, and A-301 | TASK-016, TASK-024, TASK-028, TASK-032 | TASK-033 | TASK-033 Part A dispositions, plus Part B on the four inherited views. TASK-029 recorded eight of these `resolved` at round 4 and left A-202, A-203, A-206, A-105, and A-301 open |
| Contract representation of the split ingress schemas and the named bootstrap dispatch contracts (F-401) | TASK-028, then TASK-032 | TASK-033 | TASK-033 Part C criteria, as a **regression re-check**. TASK-025 recorded four of six checks `not satisfied` on the TASK-024 attempt; TASK-029 recorded **six of six satisfied** on the TASK-028 attempt, inside a `changes-required` verdict. A previously satisfied property that a later amendment weakens is a new finding |
| Contract representation of the approved `HUMAN-002` runtime-owned pre-dispatch ingress observer and collector | TASK-028, then TASK-032 | TASK-033 | **TASK-033 Part C**, the same six checks re-assessed individually for regression. TASK-029 recorded all six satisfied at `3df261fa` and stated that this does not cure A-202, so the contract carrying them is judged and **not approved** |
| The collector itself: pre-dispatch validation, deduplication, append through the ingress store, and the high-water-mark signal to scheduling (`HUMAN-002`, F-401) | TASK-026, with the signal consumed by TASK-005 | TASK-009, TASK-010, TASK-011 | **TASK-009 `V9-F401-SCHEMA`** for the module boundary and the no-append assertion; **TASK-010 `V10-F401-AUTH`** for the collector as an authorization principal; **TASK-011 `V11-F401-PREDISPATCH`** for the end-to-end pre-dispatch ordering |

An implementing task's own unit tests never satisfy a row in the right-hand column.

**Tag tally, stated by enumeration rather than by assertion.** TASK-022 recorded that revision 4's prose called the tagged set "eighteen" while the matrix contained **19**. That tally error was corrected in revision 5 and the count is given per validator so it can be recomputed from the records rather than trusted. Round 5 confirmed all 26 revision-5 tags present in the records they are cited from:

| Validator | Tags declared before revision 5 | Tags added by revision 5 | Tags added by revision 6 | Total |
|---|---|---|---|---|
| TASK-009 | `V9-A001`, `V9-A002`, `V9-A004-EDGE`, `V9-A004-LOCK`, `V9-A004-ACT`, `V9-F105` — 6 | `V9-F301-STORE`, `V9-F301-CLASS`, `V9-F302-LINEAGE` — 3 | `V9-F401-SCHEMA` — 1 | 10 |
| TASK-010 | `V10-A003-CTL`, `V10-A003-TREE`, `V10-A004-LOCK`, `V10-F105`, `V10-TOOLCHAIN` — 5 | `V10-F301-AUTH` — 1 | `V10-F401-AUTH` — 1 | 7 |
| TASK-011 | `V11-A001`, `V11-A002`, `V11-A003-CTL`, `V11-A003-TREE`, `V11-A004-EDGE`, `V11-A004-LOCK`, `V11-A004-ACT`, `V11-F105` — 8 | `V11-F301-STORE`, `V11-F301-CLASS`, `V11-F302-LINEAGE` — 3 | `V11-F401-PREDISPATCH` — 1 | 12 |
| **Total** | **19** | **7** | **3** | **29** |

Each tag must exist as a named acceptance criterion and expected artifact in the record it is cited from.

## Task baselines — two separately named bases

Finding **F-403** recorded that TASK-023's prescribed acceptance command, `validate-write-scope.ps1 -IncludeWorkingTree -BaseRef c325275`, **cannot pass** on the branch the task actually runs on. The validator diffs `<BaseRef>...HEAD`, and TASK-023's branch is rooted at `890b8e0`, which descends from `c325275` through the `ACT-003` and `ACT-004` effects. The command therefore attributed 28 inherited `tasks/**` paths — authored by the Orchestrator, not by the reviewer — to the reviewer role and rejected them. The same defect was present in TASK-024's step 4, and its owner had to substitute `-BaseRef 890b8e0` by hand to complete its handoff.

The cause is that one value was being used for two different questions. Revision 6 separates them, and **every task record declares both**:

| Field | Question it answers | Used by |
|---|---|---|
| `review_target_base` | *What delta is under review?* The semantic base a reviewer diffs the target against. It may be far behind the branch point, and it may name a commit on another branch | The reviewer, reading the target. **Never** passed to the write-scope validator |
| `scope_validation_base` | *What did this branch's owner author?* The **immutable branch point** of the task's own branch — the commit the branch was created from | `validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <scope_validation_base>`, which is the acceptance command |

Three rules make `scope_validation_base` reproducible rather than a hand-chosen hash:

1. **When the branch exists**, `scope_validation_base` is recorded as a full 40-hex commit. It is **derived**, at branch-creation time, as `git merge-base <task branch> <branch_point_of>`, where `branch_point_of` names the branch the task branch was created from and is declared alongside it. Once recorded, the 40-hex value — not the expression — is the durable fact, and it is **verified by running the acceptance command**, which must attribute only the owner's own paths. Revision 7 makes that distinction explicit because the derivation expires: once a task branch is merged into `<branch_point_of>`, `git merge-base` returns the branch head rather than the branch point, so re-deriving TASK-016's or TASK-021's base from `main` today would silently return the wrong answer.
2. **When the branch does not exist yet** — the case for every task this graph creates before it is dispatched — the record declares `branch_point_of` and the reproducible expression `git merge-base HEAD <branch_point_of>`, to be evaluated inside the task's own worktree. The Orchestrator records the resolved 40-hex value at the next activation, **from the branch as published rather than from what the record prescribed**. Finding **A-209** recorded what happens otherwise: TASK-025's record prescribed a provenance its execution did not follow, so the prescribed expression resolved to a commit that was not its branch point and the acceptance command failed on 21 inherited paths. A task is never asked to guess a hash that does not exist yet, and a record that prescribed one provenance while the branch has another is corrected to the branch's actual provenance, with the superseded prescription retained.
3. **`c325275` is never a scope-validation base for a branch that inherits TASK-013 activation commits**, and no branch point is inferred from `origin/main`, from the integration branch, or from a review-diff base. Weakening the validator, widening a role's write scope, or passing `-BaseRef` a commit that is not the branch point are each a finding rather than a workaround.

A merge commit on the task's own branch that imports another owner's published artifact — as `6e5a9df` imported `8d0c570` into the TASK-024 lineage — does not change the branch point. It appears inside the authored delta, and the imported paths must therefore already be inside the task's own write scope, or the merge is itself a scope violation.

**When the branch point is not the acceptance base.** A branch may inherit a commit its owner did not author, from a role that is not its own. TASK-014 is the one instance: the human governance commit `fb9f45c` landed on `agent/gpt/reviewer/task-014` between its two rounds and changed `config/agents/settings.yaml`, a path no agent role may write. Validating from that branch's true branch point `321c0c3` attributes a human-authored governance change to the reviewer. Such a record declares **both** values — `scope_validation_base` for the branch point and `scope_validation_acceptance_base` for the commit from which the acceptance command reproduces — with the reason they differ. Neither is a review-diff base, and the exception is recorded rather than resolved by choosing whichever value looks better.

### Applicability — when a baseline field is required, and when it genuinely is not

Finding **F-403** was recorded `not resolved` at round 6 because revision 6 stated the rule and applied it to four records: 19 of 27 records had no `review_target_base` and 21 had no `scope_validation_base`. Revision 7 applies it to every record, and states the applicability rule that decides what each record must declare. **Every record declares both fields**, and each carries exactly one of three value forms:

| Form | When it applies | What is recorded |
|---|---|---|
| **Resolved** | The value is knowable today from the repository | A full 40-hex commit, read with `git merge-base`, `git rev-parse`, or the parent of the branch's first authored commit, and cross-checked with `git diff --name-only <base>...<head>` against the owner's declared scope. Never asserted from prose |
| **Reproducible expression** | The value is well-defined but not yet knowable, because the branch or the artifact does not exist | `branch_point_of` plus the exact command that resolves it inside the task's own worktree. The Orchestrator pins the resolved value at the activation that consumes the publication |
| **Not applicable** | The *question the field asks* has no answer for this record | The literal reason, plus the condition under which the field becomes applicable. A field is never marked not applicable merely because the value is unknown — that is the second form |

The two fields ask different questions, so they have different applicability:

- **`scope_validation_base`** asks *what did this branch's owner author?* It is applicable to **every record**, because every record declares a `branch`. No record in this graph declares it not applicable. A record whose execution is closed — TASK-001's original run, TASK-002, TASK-014, TASK-015, TASK-020 … TASK-023, TASK-025, TASK-027 — records the resolved value as **durable provenance**, and states explicitly where that value is no longer the live acceptance base for anything.
- **`review_target_base`** asks *what delta is under review?* It is applicable to a record that performs a gate round, and to a record that has a review target pinned on it. It is **not applicable** to a record that has neither — a gated task whose artifact does not exist yet has no delta to diff, and recording a base for it would be an invention. TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 are in that class today and each states the condition under which it leaves it. TASK-013 is the one permanent case: it declares no gate and carries no `gate_for` entry, so the question has no answer for it at all.

Two further honest cases are recorded rather than papered over. A gate task whose cohort has not published — TASK-009 … TASK-012, TASK-019 — declares `review_target_base` **per gated relation**, because an aggregate gate over eight targets has eight bases and not one. And TASK-014 declares `review_target_base: not recorded by the original execution`: its rounds are closed, its verdicts are durable, and reconstructing a base after the fact would misrepresent what the reviewer diffed. An omission that cannot be honestly filled is recorded as an omission.

**Every prescribed acceptance command is reproducible.** Each resolved `scope_validation_base` in this graph was checked with `git diff --name-only <base>...<head>` and returns only paths inside the owner's declared write scope — one report file for each reviewer branch, 25 architecture files for TASK-002, 29 for TASK-016, 35 for TASK-024. The single exception is TASK-014, handled above by the second declared base. The validator itself is unchanged and no role's write scope was widened, which finding F-403 explicitly required.

## Findings return path

```text
TASK-009 / TASK-010 / TASK-011 / TASK-012                                   runtime findings
TASK-014 / TASK-015 / TASK-019 … TASK-023, TASK-025, TASK-027, TASK-029 … TASK-031, TASK-033   decomposition, architecture, and toolchain findings
        |  the owner publishes its report inside its own write scope
        |  -> an authorized appender appends one entry keyed by its fact_id, before
        |     dispatch, outside tasks/**; no task record is written
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
3. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <scope_validation_base>`, using the value your record declares — the **immutable branch point of your own branch**, never a review-diff base and never `origin/main` by default. If your record declares the reproducible expression rather than a hash, resolve it first with `git merge-base HEAD <branch_point_of>` and record the resolved value in your handoff. See "Task baselines" above.
4. Commit on the task branch. Push the task branch and open or update a pull request; never push `main`. If publication is unavailable and your `publication_class` is `bootstrap`, record `publication: local-only` with the reason so the Orchestrator can transcribe it accurately. If your `publication_class` is `runtime`, an unavailable remote is a `blocked` outcome, not a `local-only` success.
5. Run `scripts/orchestration/release-task.ps1`.
6. Record the handoff where your own write scope allows — the commit message, the pull request description, and your role's report artifact. **Do not move your task record and do not edit its `status` field.** The Orchestrator performs every task-record transition under TASK-013. Publishing your own artifact is how you wake it; you never write to `tasks/`.

Steps 1 through 5 are what TASK-017 automates for runtime-dispatched work, including step 4's publication and pull-request outcome. They remain the manual procedure for the human-launched CLI sessions that build the runtime itself.
