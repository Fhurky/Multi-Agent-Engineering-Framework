# Architecture

Entry point for the project's architecture documentation. Owned by the Solution Architect.

The repository is a provider-neutral multi-agent engineering framework. Its governance layer — roles, write scopes, worktrees, task locks, and quality gates — is defined in [`AGENTS.md`](../../AGENTS.md) and enforced by the PowerShell orchestration scripts. This document set covers the **autonomous runtime**: the executable supervisor that turns a single project input into a completed multi-agent run.

## Autonomous runtime

### Objective

One command starts a project. The supervisor bootstraps the initial Manager task from a single project brief, dispatches role-scoped work to LLM providers under bounded concurrency, persists every state change durably, and drives the run to a terminal state across pauses, provider failures, timeouts, and abrupt process termination — without an operator step in between and without duplicating completed work.

### Shape

```text
Operator ──► bin/ CLI ──► lifecycle ──► supervisor ──► scheduler ──► leases
                │             ▲             │              │           │
                │             │             │              └──► scheduler-owned ingress
                │             │             │                   signal, observer, delivery
                │             │             ├──► workspace ──► worktree, branch,
        control inbox ────────┘             │                  lock, publication, PR
     (pause / stop, durable)                │
                                            ├──► ingress collector ──► durable inbox
                                            │      (validate, deduplicate, append before selection)
                                            ├──► agent workers ──► provider adapters
                                            │                          │
                                            │                          └──► owned process tree
                                            │                               (job object / pgid)
                                            ├──► task integration executor ──► protected integration PR merge
                                            └──► durable state ──► run directory
                                                     ▲
                                          recovery ──┘

Release control plane ──► release merge executor ──► protected integration-to-main PR merge
```

Ten modules with no shared ownership. The eight implemented-task assignments remain; TASK-040 adds two separately owned executor roles whose implementation tasks do not yet exist:

| Module | Path | Sole owner |
|---|---|---|
| Durable state store | `src/orchestrator/state/` | TASK-003 |
| Provider adapters, agent workers, process trees | `src/agents/` | TASK-004 |
| Scheduler, lease manager, ingress observer | `src/orchestrator/scheduling/` | TASK-005 |
| Supervisor core | `src/orchestrator/supervisor/` | TASK-006 |
| Lifecycle control, live-run control, entry point | `src/orchestrator/lifecycle/`, `bin/` | TASK-007 |
| Recovery, timeouts, retries | `src/orchestrator/recovery/` | TASK-008 |
| Agent workspace lifecycle | `src/orchestrator/workspace/` | TASK-017 |
| Durable ingress inbox and its adapters | `src/orchestrator/ingress/` | TASK-026 |
| Post-gate task integration executor | `src/orchestrator/integration/` | `runtime` role; no implementation task exists and creation remains blocked behind a passing TASK-047 or later verdict |
| Integration release merge executor | `scripts/release/integration-merge/` | `devops` role; no implementation task exists and creation remains blocked behind a passing TASK-047 or later verdict |

### Load-bearing decisions

Everything else follows from thirty-one choices. The first six were authored under TASK-002; choices 7 through 10 under TASK-016; choices 11 and 12 under TASK-024; and choices 13 through 21 under TASK-028. TASK-032 refined choices 14, 15, and 18 through ADR-0032, ADR-0033, and ADR-0034; TASK-034 added choices 22 and 23 through ADR-0035 and ADR-0036. TASK-036 added choices 24 through 27 through ADR-0037 through ADR-0040 without changing module topology. TASK-038 adds choice 28 through ADR-0041. TASK-040 adds choice 29 through ADR-0042 under HUMAN-004. TASK-041 recorded `changes-required`; TASK-042 adds choice 30 through ADR-0043. TASK-044 recorded `changes-required`; TASK-046 adds choice 31 through ADR-0044 without reopening any prior met item. The approved baseline is the TASK-038 target reviewed by TASK-039 and integrated at `de3a8d6`; TASK-040/TASK-042/TASK-046 cumulatively amend it and record no approval. Only independent TASK-047 may decide the cumulative amendment.

1. **State is the fold of an append-only event journal.** A `RunRecord` is never authored directly; it is computed by replaying events through one pure transition function. Checkpoints are materialized folds written atomically, never a second source of truth. This is what makes crash recovery a replay rather than a repair.

2. **One pure, total transition function is the sole authority on legality.** No module writes a state field. Scheduling, recovery, lifecycle, and the workspace module build event envelopes; only the append path applies them. Determinism follows: the same ordered event sequence always yields the same final state.

3. **Leases are time-bounded and fenced by a monotonic token.** A fencing token is the `stateVersion` of the event that granted the lease, so tokens are globally ordered without a second counter. A superseded worker's late write is rejected by comparison, with no cooperation required from the worker. A second level, the writer epoch, fences whole processes after a crash.

4. **Provider specifics live behind one interface.** Adding a provider is a registry registration. A closed ten-member failure taxonomy replaces raw provider errors at the boundary, and the disposition mapping — retry, fail, or escalate — has exactly one definition. Unknown failures default to `fail`, because retrying an effect of unknown character is the only outcome that can cause real duplication.

5. **Effects are registered before they are performed.** An intent-then-commit ledger lets recovery decide from recorded fact whether to adopt a completed effect or re-execute it. The guarantee is stated honestly: exactly-once for ledger-registered idempotent effects, at-most-once with explicit human escalation otherwise.

6. **Pause, stop, and crash share one reconciliation path.** A drain that hits its deadline is indistinguishable from a crash with respect to in-flight work, so resume always goes through recovery. One path, one set of invariants, one equivalence claim.

7. **A journal batch is committed by a commit record, not by an fsync.** Append and fsync give durability, not transaction atomicity for an arbitrarily sized buffer. Each batch carries a `batchId`, and its final line is a commit record naming the event count and a digest over the batch's envelopes. Restore exposes every event of a committed batch or none of it. This is what makes bootstrap and recovery genuinely all-or-nothing.

8. **Recovery emits one decision per task, chosen so that it is legal by construction.** The outcome is determined from lease state, ledger state, and elapsed deadline **before** any event is built, and each decision expands to one proven-legal event sequence. No two decisions address the same task, so batch legality reduces to per-decision legality.

9. **Every process the runtime spawns is owned, and every tree is verifiably closed.** An invocation's identity is durable before the spawn; the child is placed into a Windows job object or a POSIX process group at creation; cancellation escalates within a bound; exit is verified rather than assumed; and the outcome is durable before the writer lock is released. Fencing protects run state from a superseded worker, and nothing but ownership protects a worktree from a detached agent.

10. **Dependencies are typed, and readiness is not the same as merge.** `review_ready`, `integrated`, `gate_passed`, `gate_recorded`, `human_decision`, and `terminal` have distinct satisfying conditions, gates declare which of them block integration, gate verdicts are append-only and supersede across rounds, named resource locks serialize scopes that cannot be made disjoint, and recurring work activates from a durable monotonic cursor with a quiescent waiting state. A graph violating any no-deadlock invariant is rejected at load rather than deadlocking at run time.

11. **Ingress facts are entries in a durable store, not positions in a scan.** An ingress entry's identity is a content hash over the fact; its position is a `seq` assigned once at append and never recomputed. Deduplication is identity-keyed, ordering is by source commit identifier and never by a clock, retention outlives the ref that carried the source, one commit yields at most one entry by class precedence, the consuming task's own commits are excluded, consumption state is the cursor and nothing else, and a model correction opens a new epoch rather than renumbering the old one. A count over a scan of mutable refs has none of these properties, which is why it is not the model.

12. **A side effect is unreachable before its intent is durable.** Process registration, workspace preparation, finalization, and abandonment are each split into a plan phase that produces the intent event and an execute phase that takes a receipt proving the intent durable. A receipt is issued only by the state store's append path, only after the batch commit record, and it carries evidence rather than authority. The module that performs the side effect still holds no write path, and the ordering is a signature rather than a comment.

13. **Ingress entries are immutable facts, and bootstrap authority is named.** `IngressEntry` carries no consumption field. `durable-bootstrap-append` and `interim-operator-authorized` are distinct required declarations; a closed append-principal union authorizes only the phase-appropriate runtime component and contains no recurring-task or activation principal.

14. **Committed task documents cross one lossless, exact projection boundary.** TASK-007 loads the exact UTF-8 source and recursively typed YAML mapping; TASK-005 owns the pure projection, exhaustive leaf audit, and semantic inverse. Every leaf is projected, derived-and-checked, or retained inertly at its original path. Defaults are explicit and reversible, and every task record enumerated from the immutable published target is the fixture. ADR-0032 supersedes ADR-0024's closed source shapes and incomplete losslessness claim; ADR-0036 supersedes only ADR-0032's fixed target and literal fixture totals.

15. **A task result effect has an event-level identity, a recovery uniqueness check, and one legal order.** `EffectIntentRecorded.isTaskResultEffect` is unique per `(taskId, attempt)`, follows the matching `WorkerResultRecorded`, and precedes effect execution, the matching `EffectCommitted`, and `WorkerSucceeded`. Recovery fails closed on duplicate flagged entries and adopts only from exactly one committed flagged result effect whose identity it carries; an unrelated committed effect is never success evidence. ADR-0033 is the sole authority for that lookup and reduction.

16. **A blocked drain is attachable and its unverified tree remains recovery work.** `RunResumeRequested` is legal from stale-writer `pausing` and `draining`; recovery selects an invocation whose latest closure is absent or has `verifiedExit:false`; completion reissues the retained pause or stop intent before admission.

17. **Publication and unlock are separate finalize phases.** `executeFinalize` returns publication identity with the task lock held. The supervisor appends `ArtifactPublished`; only `completeFinalize`, given the matching store-issued publication receipt, may release the lock.

18. **Durable receipts are nominal, identity-bearing, store-verifiable, and explicitly refused at side-effect boundaries.** The state contract root alone declares the brand. Each specialized receipt carries its event subject, and a verifier accepts only a proof retained for the current writer epoch. The independent agent root receives an opaque value and a narrowed read-only verifier, never a copied brand. Both worker begin and internal spawn return `RegistrationNotDurable` for missing, forged, stale-epoch, or mismatched proof before creating any group or process; ADR-0034 changes the result union without weakening ADR-0028's receipt model.

19. **TASK-005 alone delivers inbox entries to an activation.** `IngressObserver.deliver` reads the exact immutable range after `TaskActivated` is durable. The supervisor uses that one delivery for the consumption-row projection and `AgentInvocation.ingress`; the activation has no inbox capability.

20. **Recovery classification has one canonical input domain.** `ReconciliationInput` is the only decision-domain type and ADR-0030 is the only cardinality statement. Input construction reduces mixed ledgers before the pure classifier; no recovery branch reads an undeclared axis.

21. **HUMAN-002 is a pre-dispatch runtime control-plane protocol.** TASK-026 validates, deduplicates, and appends external facts through the ingress store; TASK-005 signals, observes, and delivers; TASK-006 composes those calls before selection. Interim operator authorization is bounded until TASK-026 and TASK-005 implement the path and TASK-009, TASK-010, and TASK-011 validate it.

22. **Recovery evidence crosses one complete public composition boundary.** `ReconciliationInputBuilder.build(task, evidence)` receives current writer epoch, exact current-attempt ledger entries, deadline, and the pending-result candidate explicitly. It derives all six fields, rejects mismatched evidence, and performs no hidden run read. Every exhaustive decision fixture enters through this boundary; ADR-0035 is the sole authority for composition.

23. **Every current task-tree fact is derived from the publication target.** Projection totals, relation pairs, enrichment totals, expanded graph proofs, architecture cohort, review round, and integration floor are enumerated from the immutable published Git tree. A target-scoped snapshot is evidence, never configuration for a later amendment. ADR-0036 is the sole authority for this currentness rule.

24. **Recovery completion has one complete evidence shape, and recovery legality is per decision block.** The final event and successful outcome share all five canonical evidence arrays. Each task has one decision block; the first event is legal from restored state, later events are sequentially legal inside the block, and complete blocks are independent. This makes the required timeout pair legal without an exception to a one-event rule.

25. **Ingress append and collection are total over append and deduplication.** Each normalized candidate has one explicit disposition. Collector success carries disposition, `factId`, and committed mark, so retry after an append-committed/signal-absent crash resumes signalling without fabricating an entry or reading the activation range. TASK-005 remains the sole activation-range reader.

26. **Nominal process-registration proof has one declaration authority.** The brand and `ProcessGroupRegistrationReceipt` exist only in the state root. The agent root accepts `unknown` and narrows it only through `AgentReceiptVerifier`; a declaration-aware cross-root fixture enforces the rule and sequences use the real state-side type name.

27. **Provider planning returns a typed classified result.** Unknown family resolution produces the exact `UNKNOWN_PROVIDER_FAMILY` failure before registration or spawn. Plan, begin, and complete have phase-accurate observables, while preparation failure remains at the upstream workspace/assignment boundary that can actually receive it.

28. **A cumulative architecture lineage is one content integration unit.** Only its latest target with authoritative integration-admissible gate evidence is squashed into the integration branch. One atomic evidence batch records that direct merge for the target and lineage subsumption for every predecessor, so their lifecycles close without replaying rejected blobs. Content import remains authoring provenance, never integration. ADR-0041 is the sole authority for this exception to ordinary per-task squash; ADR-0043 narrows only automated consumption of formal acceptance.

29. **Post-gate GitHub merge authority is split, conditional, and evidence-first.** A runtime module may squash only an admitted task PR into the integration branch; a separate DevOps module may merge only an admitted integration PR into `main`. Each requires immutable head/base identity, authoritative typed gates and security evidence, durable intent before the API effect, verified target-tree evidence, bounded reconciliation, a least-privilege non-bypass identity, and TASK-026/TASK-005 result ingress. The human exception union has exactly the three HUMAN-004 members. ADR-0042 is the sole authority for the two executor boundaries; [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md) is the normative contract.

30. **Automated gate admission, current-policy proof, and owner evidence are exact and fail closed.** Generic formal acceptance cannot construct a merge plan; only exact immutable authorized-human acceptance of matching High/Critical security findings can represent HUMAN-004's first exception. A separate human-controlled attestor signs the complete current branch/ruleset/bypass payload because neither executor can observe it under its least-privilege credential; absence of that dependency blocks activation. Every artifact owner reruns all target-dependent checks against the exact final published head, and any later content commit invalidates them. ADR-0043 owns these corrections.

31. **Policy-control classification and exact-head evidence each have one practicable construction path.** One ordered total classifier maps verified credential/repository-policy action to HUMAN-004's third exception, unknown cause to its unclassifiable candidate-third result, and action-excluded operational attestation failure to exactly one refusal; no input invokes two result constructors. Executors never observe policy and receive only exact-subject signed fresh attestations from separately controlled observer principals. Published-head evidence is one external bundle with an author post-commit/pre-publication phase and a control-session post-publication phase; admission remains closed until both bind the same exact SHA and prove no later content. ADR-0044 owns these corrections.

### TASK-046 correction register

TASK-044 recorded `changes-required` for the TASK-042 target at `6f7f0edb63615d7f143dd6c59750a5ea7db701fc`. TASK-046 changes only the three routed Architect findings. It preserves the exact security-only gate acceptance, API-only merge surface, durable intent/recovery/bounded retry, ADR-0041 order, protected paths, authorized ingress, HUMAN-002 separation, exactly three HUMAN-004 kinds, module ownership and topology, every round-8 closure, TASK-018/TASK-019 isolation, and the unprovisioned human-controlled dependencies.

| Finding | Located resolution or returned dependency | Decision |
|---|---|---|
| F-044-01 | Ordered `classifyPolicyControl`, disjoint control-action/operational states, single-result precedence, and explicit overlap counterexamples with no plan, intent, or API call | [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md#one-policy-control-classifier-and-one-result-constructor), [ADR-0044](../adr/0044-single-policy-result-and-two-phase-published-head-evidence.md) |
| F-044-02 | Executor repository reads are only PR/check/head/base; separately controlled observer principals alone read branch protection, rulesets, bypass, check-source, and authorization policy | [runtime-components.md](../../diagrams/architecture/runtime-components.md#repository-access-paths), [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md#trusted-repository-policy-attestation-boundary-human-control-plane) |
| F-044-03 | Exact required command fields, separate author/control phases, three-ref no-later-content proof, admission refusals, and precise fixtures | [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md#exact-published-head-owner-evidence), [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md#exact-published-head-verification-obligation) |
| Human-controlled follow-up | RepositoryPolicyAttestor, GitHub controls, returned `AGENTS.md` text, and tasks-owned `gate_passed` narrowing remain unprovisioned and are returned, not authored | [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md#other-human-controlled-prerequisites) |

### TASK-042 correction register

TASK-041 recorded `changes-required` for TASK-040 at `ec533fb5bb0055675fb81f72057d5636f7867db3`. TASK-042 changes only the three routed Architect findings. It preserves both executors, separate owners and identities, total typed refusal, API merge rather than direct push, durable intent/recovery/bounded retry, ADR-0041 order, authorized ingress, HUMAN-002 separation, exactly three human exceptions, protected paths, module ownership, twelve-node/nineteen-edge acyclicity, two roots, every round-8 closed relation, and TASK-018/TASK-019 isolation.

| Finding | Located resolution or returned dependency | Decision |
|---|---|---|
| F-041-01 | Executor-local `ExecutorGateAdmissibility` rejects generic acceptance with `PreMergeGateNotPassing` and no plan; the matching tasks-owned `gate_passed` narrowing is returned verbatim and blocks activation until pinned | [ADR-0043](../adr/0043-exact-merge-admission-policy-attestation-and-published-head-evidence.md), [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md#exact-executor-gate-admissibility) |
| F-041-02 | Complete signed current-policy payload, exact repository/ref/PR/OID/App subject, one-minute freshness, digest/signature, monotonic generation, revocation, and drift refusal; GitHub's bypass-actor permission gap is returned as an unresolved human-controlled attestor dependency | [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md#trusted-current-policy-observation-boundary) |
| F-041-04 | General exact-published-head owner-verification obligation; later content invalidates all earlier target-dependent results; remote/PR head and GitHub-check presence are recorded exactly | [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md#exact-published-head-verification-obligation) |
| Human-controlled follow-up | Exact `AGENTS.md` amendment text and the tasks-owned gate predicate text are returned, not authored | [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md#exact-returned-agentsmd-amendment) |

### TASK-040 amendment register

HUMAN-004 is read directly at immutable commit `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`. It conditionally grants both merge effects and no other authority. This register authors their architecture and does not satisfy any activation condition, implement a component, approve itself, or alter an existing pull request.

| Decision boundary | Authored contract | Decision |
|---|---|---|
| Two separate owners and paths | Runtime `src/orchestrator/integration/`; DevOps `scripts/release/integration-merge/`; both already inside current role scopes | [ADR-0042](../adr/0042-conditionally-authorized-post-gate-merge-executors.md) |
| Typed admission/refusal and finite exception set | Pure total results over authoritative task/release records; exactly three detectable human exception kinds; unknown classification refuses | [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md) |
| Evidence, identity, retry, and recovery | Immutable head/base, canonical idempotency key, durable plan receipt before merge, exact result-tree verification, reconcile-before-retry, three-attempt/120-second bound | [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md#plan-durable-intent-execute-and-recovery) |
| Ingress and HUMAN-002 | TASK-026-owned result adapter appends; TASK-005 wakes ordinary scheduling; implementations remain `dormant-before-durable-merge-ingress` until that path exists | [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md#ingress-scheduling-and-human-002) |
| Human-controlled follow-up | Exact required `AGENTS.md`, GitHub protection/check, App, credential, and policy changes are returned, not edited | [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md#github-identity-and-human-controlled-policy) |

### TASK-038 amendment register

TASK-037 recorded `changes-required` for TASK-036 target `970b08125eaf6e5bfb7b24ec2a55238161b16eac` at review commit `9bb75d9705533e52e150cafb6fa87a382496c90c`. It recorded A-501 through A-505, every inherited obligation, and every TASK-036 acceptance criterion satisfied, then opened only A-601 in this architecture lineage. Those are independent-review facts; this register authors one integration-order remedy and records no verdict.

The task branch resolves from `b5d32c9f043ea9dc739dbf1748d84b86378049ef`. Because `970b081` is not its ancestor, its complete 59-file architecture scope was imported by content before amendment. Import commit `726f2850ba39dccba5f62b376399c2e755d640c2` is byte-identical to that baseline over all 59 paths with zero missing, extra, or divergent paths. The branch point, rejected baseline, import commit, authored amendment, and any later integration commit are distinct provenance facts.

| Finding | Contract amended | Authored remedy | Decision |
|---|---|---|---|
| A-601, High | [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md), [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), [STATE-MACHINE.md](runtime/STATE-MACHINE.md), and Sequence 9 | One latest passing cumulative target is the only content integration unit; exact atomic lineage-subsumption evidence closes predecessor lifecycles without replaying blobs; the complete-order fixture requires target-tree equality and retains the historical 19-conflict regression | [ADR-0041](../adr/0041-cumulative-architecture-lineage-integration-unit.md) |

### TASK-036 amendment register

TASK-035 recorded `changes-required` for the TASK-034 target `6d145eb81033986361aba6454d10f52e5773f950` at review commit `afed1012b5f6a6febe33a0a007234fbaba987a38`. It recorded A-202, A-105, A-401, and A-402 resolved, with A-004/A-101/A-104 residue closed, and opened A-501 through A-505. A-102, A-203, A-206, and A-301 were not regressed. Those are prior independent-review facts; this register authors remedies and records no verdict.

The task branch resolves from `080433b1d4ab53d5ee83a0a85895f6b0f04164e1`. Because `6d145eb` is not its ancestor, the complete 55-file architecture tree was imported by content first. Import commit `b894e7fc75ab5edd65949acf1be7e76d6bb7a448` records the 37-path import delta; staged-tree verification matched every scoped baseline path and blob, with zero missing or extra paths. The branch point, rejected review base, import commit, and authored amendment remain distinct provenance facts.

| Finding | Contract amended | Authored remedy | Decision |
|---|---|---|---|
| A-501, High | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), [STATE-MACHINE.md](runtime/STATE-MACHINE.md), [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md), state and sequence diagrams | One exact `RunRecoveryCompletedEvent` shares all five evidence arrays and their application semantics with successful `RecoveryOutcome`; exact-type fixtures reject mismatch | [ADR-0037](../adr/0037-recovery-completion-evidence-and-decision-block-legality.md) |
| A-502, High | [STATE-MACHINE.md](runtime/STATE-MACHINE.md), [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md), state and sequence diagrams | One decision block per task with sequential legality inside the fixed block; R4/R7 require `TaskTimedOut` then `RetryScheduled`; only complete blocks are permuted | [ADR-0037](../adr/0037-recovery-completion-evidence-and-decision-block-legality.md) |
| A-503, High | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), [LIFECYCLE-AND-BOOTSTRAP.md](runtime/LIFECYCLE-AND-BOOTSTRAP.md), [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md), component and sequence diagrams | Total append/deduplicate dispositions and a crash-retry fixture using identity plus committed mark, with no collector read and no second entry | [ADR-0038](../adr/0038-total-pre-dispatch-ingress-append-dispositions.md) |
| A-504, High | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), [WORKSPACE-LIFECYCLE.md](runtime/WORKSPACE-LIFECYCLE.md), [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md), component and sequence diagrams | One nominal state-root declaration, the real `ProcessGroupRegistrationReceipt` sequence name, and an `unknown` plus verifier crossing enforced by a declaration-aware fixture | [ADR-0039](../adr/0039-single-nominal-receipt-authority-and-cross-root-conformance.md) |
| A-505, High | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), [PROVIDER-ADAPTERS.md](runtime/PROVIDER-ADAPTERS.md), [WORKSPACE-LIFECYCLE.md](runtime/WORKSPACE-LIFECYCLE.md), sequence diagram | Typed `WorkerPlanResult`, classified unknown-family failure, exact plan/begin/complete observables, and upstream failed-workspace assertion | [ADR-0040](../adr/0040-typed-provider-planning-result-and-phase-observables.md) |

### TASK-034 amendment register

TASK-033 recorded `changes-required` for the TASK-032 target `468b37b2649d031074eba64aca47f4561a0c41a3`. TASK-034 authors the four remaining round-5 remediations. A-402 covers the independently actionable A-004 and A-101 residue; A-401 covers the A-104 residue. A-203, A-206, A-301, and the A-102 inherited view were individually closed at round 5 and are preservation obligations, not reopened scope. These rows state intended remediation, never self-review disposition; only TASK-035 may judge them.

The task branch resolves from `a0d6e77a93c3eaf50134568620c682089ff909ae`. Because `468b37b` is not its ancestor, the complete 53-file architecture tree was imported by content before amendment. Commit `e594e72` records the 35-path import delta; pre-amendment verification matched all 53 source blobs byte for byte with zero missing or extra scoped files. The branch point, rejected review base, and import commit are distinct provenance facts.

| Finding | Contract amended | Amended evidence | Decision |
|---|---|---|---|
| A-202 residual, High | Literal task-record, relation-document, and enrichment totals could drift from the publication tree | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) section 2c; [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md) target-tree fixture and graph proof | [ADR-0036](../adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md) supersedes ADR-0032's fixed target and literal fixture clauses |
| A-401, High | The reconciliation builder could not derive lease epoch or pending-result presence from its parameters | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) section 7; [STATE-MACHINE.md](runtime/STATE-MACHINE.md); [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md) | [ADR-0035](../adr/0035-explicit-reconciliation-evidence-composition-boundary.md) supersedes the incomplete ADR-0030/ADR-0033 composition clauses and covers A-104 residue |
| A-402, High | Integration and graph-currentness clauses stopped at TASK-028 and lineage round 4 | [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md); `validateGraph` in [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md); current graph proof in [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md) | [ADR-0036](../adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md) establishes target-derived currentness and covers A-004/A-101 residue |
| A-105 residual, Medium | Sequence 3 called the withdrawn opaque worker boundary | [runtime-sequences.md](../../diagrams/architecture/runtime-sequences.md) sequence 3 now shows `planInvocation`, supervisor registration append, proof-bearing `beginInvocation`, supervisor binding append, and `completeInvocation` | Contract-conformance correction; no new decision |

### TASK-032 amendment register

TASK-029 recorded `changes-required` for the TASK-028 publication at immutable target `fe0374c45aaa51e589525cee978c8ff244837163`. TASK-032 authored the five round-4 remediations below. A-004 and A-101 were framed as inherited views of A-202, A-102 as an inherited view of A-206, and A-104 as an inherited view of A-203. These rows preserve that authoring intent, not a disposition. TASK-033 subsequently recorded `changes-required`, validated the A-102 framing only, and routed the remaining inherited residue through TASK-034.

The task branch actually resolves from `7ff618b3268e9b9057da53a75874f0f7c5cdf6a4`, the current head of `agent/claude/orchestrator/task-013` at creation. That integration branch point and the immutable implementation-review target are intentionally distinct: the 32-path `fe0374c` architecture tree was imported unchanged first, then the TASK-032 authored delta was applied. Runtime resolution does not retarget the review fixture.

| Finding | Contract amended | Amended evidence | Decision |
|---|---|---|---|
| A-202 High | Closed source shapes and a projection without an exact inverse could not load or preserve the immutable task set | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) section 2c; [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md) committed-repository fixtures | [ADR-0032](../adr/0032-lossless-task-record-source-and-projection.md) supersedes the affected ADR-0024 clauses |
| A-203 High | Recovery could reduce an unrelated committed effect to success evidence and did not reject duplicate flagged effects | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) section 7; [STATE-MACHINE.md](runtime/STATE-MACHINE.md); [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md); [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md); sequences 2, 4, and 8 | [ADR-0033](../adr/0033-unique-committed-result-effect-recovery.md) supersedes the affected ADR-0025 and ADR-0030 clauses |
| A-206 High | `SpawnOwnedResult` omitted proof refusal although the boundary must reject invalid registration proof | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) section 6; [PROVIDER-ADAPTERS.md](runtime/PROVIDER-ADAPTERS.md); sequence 2 | [ADR-0034](../adr/0034-spawn-owned-registration-proof-refusal.md) supersedes the affected ADR-0028 result-union clause |
| A-105 Medium | Two sequence calls passed `(plan, publication, publicationReceipt)` to a two-argument finalize contract | Sequences 2 and 7 now call `completeFinalize(continuation, publicationReceipt)` | Contract-conformance correction; no new decision |
| A-301 Low | One authored component-boundary fragment pointed at a non-existent heading | [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md) now targets the exact TASK-024/TASK-028 responsibility heading | Link repair; no new decision |

### TASK-028 amendment register

TASK-025 recorded `changes-required` for the TASK-024 publication at commit `aa38c7d2`, including A-201 through A-208. TASK-028 supersedes the named contracts below and represents HUMAN-002, but does not decide that any finding is resolved. Only the independent TASK-029 execution may record that judgment and the lineage verdict.

| Finding or decision | Superseded contract | Amended evidence | Decision |
|---|---|---|---|
| A-201 | Mutable `IngressEntry.consumedBy`, string appender authority, and unnamed bootstrap behavior | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), lines 540 and 570; [LIFECYCLE-AND-BOOTSTRAP.md](runtime/LIFECYCLE-AND-BOOTSTRAP.md), line 114; sequence 8, line 351 | [ADR-0023](../adr/0023-immutable-ingress-entries-and-named-bootstrap-dispatch-contracts.md) |
| A-202 | A claim that snake_case task records load directly into camelCase runtime records | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), line 810; [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md), test obligation 15 | [ADR-0024](../adr/0024-task-record-projection-contract.md) |
| A-203 | A result-effect ledger field with no corresponding event payload or consistent sequence | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), lines 996 and 1091; sequence 2, line 50 | [ADR-0025](../adr/0025-result-effect-identity-in-the-event-union.md) |
| A-204 | Blocked-drain states with no attach transition and recovery selecting only absent closures | [STATE-MACHINE.md](runtime/STATE-MACHINE.md), line 96; [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md), line 95; state and sequence diagrams | [ADR-0026](../adr/0026-blocked-drain-attach-and-unverified-closure-recovery.md) |
| A-205 | One `executeFinalize` operation that could unlock before publication identity became durable | [WORKSPACE-LIFECYCLE.md](runtime/WORKSPACE-LIFECYCLE.md), line 143; [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), line 2029; sequences 2 and 7 | [ADR-0027](../adr/0027-finalize-split-around-the-publication-append.md) |
| A-206 | Structural receipts without required subjects or proof of store issuance | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), lines 1129 and 1626; [PROVIDER-ADAPTERS.md](runtime/PROVIDER-ADAPTERS.md) spawn handshake | [ADR-0028](../adr/0028-nominal-store-issued-durable-append-receipts.md) |
| A-207 | An activation reading `IngressInbox` directly because no owned delivery interface existed | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), lines 774 and 1494; [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md), lines 58–63; sequence 8, line 351 | [ADR-0029](../adr/0029-ingress-delivery-ownership.md) |
| A-208 | Four-input recovery prose beside a six-axis decision table and test | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), line 1769; [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md), line 79; [STATE-MACHINE.md](runtime/STATE-MACHINE.md), line 485 | [ADR-0030](../adr/0030-one-canonical-recovery-decision-input-domain.md) |
| HUMAN-002 | Interim operator authorization with no autonomous durable producer before selection | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), lines 728–790; [LIFECYCLE-AND-BOOTSTRAP.md](runtime/LIFECYCLE-AND-BOOTSTRAP.md), lines 114–128; component and sequence diagrams | [ADR-0031](../adr/0031-pre-dispatch-ingress-observer-and-collector.md) |

### TASK-024 amendment register

TASK-020 returned `changes-required` on the TASK-016 amendment at commit `4874a9d`, recording findings A-101 through A-105 in `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md`. TASK-024 was the author response indexed below; TASK-025 later rejected that publication with A-201 through A-209. These rows are retained for traceability and are not a passing review judgment.

| Finding | What was superseded | Where | Decision |
|---|---|---|---|
| A-101 | Typed scheduling and activation compiled against the superseded graph: one undisambiguated `gate_passed` with no round, a singular `gateFor`, no `gate_class`, `retrospective`, `gate_lineage`, or `lineage_round`, a run-global `allowLocalOnlyPublication` in place of declared publication classes, a five-invariant validator, and an internal `activationEvents` queue in place of the three ingress surfaces | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) sections 2a and 2b, [STATE-MACHINE.md](runtime/STATE-MACHINE.md), [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md), [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md), [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md) | [ADR-0017](../adr/0017-durable-ingress-inbox-and-ingress-epochs.md), [ADR-0018](../adr/0018-publication-classes-and-gate-lineages.md), [ADR-0021](../adr/0021-durable-ingress-module-and-the-eight-module-map.md), all superseding parts of ADR-0015 and ADR-0011 |
| A-102 | `spawnOwned` required its caller to have appended `ProcessGroupRegistered` while `AgentWorker.execute` was one opaque call and workers hold no append path; the pause post-condition admitted a surviving `orphan_unresolved` descendant | [PROVIDER-ADAPTERS.md](runtime/PROVIDER-ADAPTERS.md), [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) section 6, [LIFECYCLE-AND-BOOTSTRAP.md](runtime/LIFECYCLE-AND-BOOTSTRAP.md), [STATE-MACHINE.md](runtime/STATE-MACHINE.md) | [ADR-0019](../adr/0019-durable-intent-receipts-for-side-effects.md) and [ADR-0022](../adr/0022-unqualified-drain-closure.md), superseding parts of ADR-0014 |
| A-103 | Workspace prepare, finalize, and abandon returned their intent events only after the operation, with no way to make an intent durable first; `abandoning` had no entering event | [WORKSPACE-LIFECYCLE.md](runtime/WORKSPACE-LIFECYCLE.md), [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) section 10, [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md) | [ADR-0019](../adr/0019-durable-intent-receipts-for-side-effects.md), superseding part of ADR-0011 |
| A-104 | The committed ledger entry retained only `resultDigest`, from which recovery could not build the `WorkerSucceeded` its own table required | [STATE-MACHINE.md](runtime/STATE-MACHINE.md) rows R0/R1/R1x, [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md), [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md), [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) section 10a | [ADR-0020](../adr/0020-durable-adoptable-results-for-recovery.md), superseding part of ADR-0013 |
| A-105 | The state diagram declared every event against a terminal task illegal while the state machine allows four; the component diagram declared the workspace reachable to the repository only through human-controlled scripts while the contract requires direct Git | [runtime-state-machine.md](../../diagrams/architecture/runtime-state-machine.md), [runtime-components.md](../../diagrams/architecture/runtime-components.md), [runtime-sequences.md](../../diagrams/architecture/runtime-sequences.md), [WORKSPACE-LIFECYCLE.md](runtime/WORKSPACE-LIFECYCLE.md) | [ADR-0019](../adr/0019-durable-intent-receipts-for-side-effects.md) records the repository access paths; the diagram corrections carry no separate decision |
| F-301, contract representation | No module owned the durable ingress inbox; the activation contract could not express one | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) section 2b, [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md), [STATE-MACHINE.md](runtime/STATE-MACHINE.md), [DURABLE-STATE-AND-CHECKPOINTS.md](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) | [ADR-0017](../adr/0017-durable-ingress-inbox-and-ingress-epochs.md), [ADR-0021](../adr/0021-durable-ingress-module-and-the-eight-module-map.md) |

### TASK-016 amendment register

TASK-015 round 1 returned `changes-required` on the TASK-002 architecture at commit `9576fc9`, recording findings A-001 through A-004 in `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`. TASK-016 was the first author response; TASK-020 rejected it. These rows preserve the proposed supersessions and do not self-approve them.

| Finding or gap | What was superseded | Where | Decision |
|---|---|---|---|
| A-001 | A multi-event append was claimed all-or-nothing on the strength of one fsync; restore retained a valid prefix of an uncommitted batch | [DURABLE-STATE-AND-CHECKPOINTS.md](runtime/DURABLE-STATE-AND-CHECKPOINTS.md), reconciled in STATE-MACHINE, LIFECYCLE-AND-BOOTSTRAP, CRASH-RECOVERY, and this document | [ADR-0012](../adr/0012-crash-atomic-journal-batches-with-commit-records.md) supersedes part of ADR-0004 |
| A-002 | Recovery emitted `LeaseExpired` and then `WorkerSucceeded`, `TaskBlocked`, or `TaskTimedOut` for the same task in one batch, which the transition table rejects | [STATE-MACHINE.md](runtime/STATE-MACHINE.md), [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md), [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md), diagrams | [ADR-0013](../adr/0013-single-decision-recovery-reconciliation.md) supersedes part of ADR-0009 |
| A-003 | Live-run control was undefined and no module owned the OS process tree | [LIFECYCLE-AND-BOOTSTRAP.md](runtime/LIFECYCLE-AND-BOOTSTRAP.md), [PROVIDER-ADAPTERS.md](runtime/PROVIDER-ADAPTERS.md), [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md), [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) | [ADR-0014](../adr/0014-live-run-control-and-process-tree-ownership.md) supersedes part of ADR-0009 |
| A-004 | Dependencies were task identifiers satisfied only by `succeeded`, which cannot express the committed task graph | [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), [STATE-MACHINE.md](runtime/STATE-MACHINE.md), [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md), [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md) | [ADR-0015](../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| Module gap, F-105 | `AgentInvocation` presupposed a worktree and a branch that no module created; nothing owned publication or pull-request identity | [WORKSPACE-LIFECYCLE.md](runtime/WORKSPACE-LIFECYCLE.md), [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md), [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) | [ADR-0011](../adr/0011-agent-workspace-lifecycle-module.md) supersedes part of ADR-0002 |
| Branch topology | "Every task branches from `main`" and "no long-lived integration branch" contradicted the committed task graph | [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md) | [ADR-0016](../adr/0016-integration-branch-and-typed-merge-order.md) supersedes part of ADR-0010 |

### Guarantees

| Guarantee | Established by |
|---|---|
| One project input starts a complete run with no second operator step | [Lifecycle and bootstrap](runtime/LIFECYCLE-AND-BOOTSTRAP.md) |
| Every state transition is deterministic, and replay is reproducible | [State machine](runtime/STATE-MACHINE.md) |
| An interrupted write never becomes readable as valid state | [Durable state and checkpoints](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) |
| Restore exposes every event of a committed batch, or none of it | [Durable state and checkpoints](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) |
| Concurrent conflicting writes are rejected, never merged | [Durable state and checkpoints](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) |
| Concurrency limits, write-scope exclusion, and resource locks are never exceeded | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| A superseded worker cannot overwrite a newer attempt | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| An abandoned task returns to the ready set exactly once | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| A graph that cannot be scheduled is rejected at load, not discovered as a hang | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| Every committed task record loads, every source leaf is accounted for, and the exact parsed mapping is recoverable by the projection inverse | [Interface contracts](runtime/INTERFACE-CONTRACTS.md), [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| An ingress fact is consumed exactly once, and idle work never redispatches | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md), [State machine](runtime/STATE-MACHINE.md) |
| An ingress position is stable, a late fact is never skipped, and a deleted branch never lowers the mark | [State machine](runtime/STATE-MACHINE.md), [Interface contracts](runtime/INTERFACE-CONTRACTS.md) |
| A recurring activation cannot append its own trigger, and collection precedes scheduler selection | [Lifecycle and bootstrap](runtime/LIFECYCLE-AND-BOOTSTRAP.md), [Interface contracts](runtime/INTERFACE-CONTRACTS.md) |
| The exact immutable ingress range is delivered by one owner and carried read-only into the invocation | [Component boundaries](runtime/COMPONENT-BOUNDARIES.md), [Interface contracts](runtime/INTERFACE-CONTRACTS.md) |
| A recorded gate verdict is durable and can only be superseded, never rewritten | [State machine](runtime/STATE-MACHINE.md) |
| A consumer of a validated baseline never needs retargeting when a round is superseded | [State machine](runtime/STATE-MACHINE.md), [Integration strategy](runtime/INTEGRATION-STRATEGY.md) |
| No process, worktree, branch, lock, or publication side effect occurs before its intent is durable | [Provider adapters](runtime/PROVIDER-ADAPTERS.md), [Workspace lifecycle](runtime/WORKSPACE-LIFECYCLE.md) |
| Missing, forged, stale-epoch, or mismatched process-registration proof returns `RegistrationNotDurable` at both worker and internal spawn boundaries before any group or process exists | [Provider adapters](runtime/PROVIDER-ADAPTERS.md), [Interface contracts](runtime/INTERFACE-CONTRACTS.md) |
| The nominal process-registration receipt is declared once and crosses the independent agent root only as `unknown` plus a verifier | [Component boundaries](runtime/COMPONENT-BOUNDARIES.md), [Interface contracts](runtime/INTERFACE-CONTRACTS.md) |
| Unknown provider-family planning is a typed classified failure before registration or spawn | [Provider adapters](runtime/PROVIDER-ADAPTERS.md), [Interface contracts](runtime/INTERFACE-CONTRACTS.md) |
| Recovery can reconstruct a committed result in full, including its task proposals | [State machine](runtime/STATE-MACHINE.md), [Crash recovery](runtime/CRASH-RECOVERY.md) |
| `WorkerSucceeded` is authorized only by exactly one committed flagged result effect in the legal uninterrupted or recovered order; duplicate flags fail closed and unrelated commits are inert | [State machine](runtime/STATE-MACHINE.md), [Crash recovery](runtime/CRASH-RECOVERY.md), [Retries, timeouts, and idempotency](runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md) |
| `pause` and `stop` never return a paused run while an unmanaged descendant survives | [Lifecycle and bootstrap](runtime/LIFECYCLE-AND-BOOTSTRAP.md), [Provider adapters](runtime/PROVIDER-ADAPTERS.md) |
| Retries are classified, bounded, and reproducible | [Retries, timeouts, and idempotency](runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md) |
| A task in flight at crash time completes once or retries once, never both | [Crash recovery](runtime/CRASH-RECOVERY.md) |
| Every recovery batch contains one sequentially legal decision block per task and ends with complete durable recovery evidence | [Crash recovery](runtime/CRASH-RECOVERY.md), [State machine](runtime/STATE-MACHINE.md) |
| Pre-dispatch collection survives an append-committed/signal-absent crash without a duplicate entry or a second activation-range reader | [Interface contracts](runtime/INTERFACE-CONTRACTS.md), [Lifecycle and bootstrap](runtime/LIFECYCLE-AND-BOOTSTRAP.md) |
| An interrupted run reaches the same terminal state as an uninterrupted one | [Crash recovery](runtime/CRASH-RECOVERY.md) |
| No provider process outlives the command that started it, unrecorded | [Provider adapters](runtime/PROVIDER-ADAPTERS.md), [Lifecycle and bootstrap](runtime/LIFECYCLE-AND-BOOTSTRAP.md) |
| Every dispatched task runs in its own worktree, on its own branch, behind its own lock | [Workspace lifecycle](runtime/WORKSPACE-LIFECYCLE.md) |
| Publication identity is durable and verified before the task lock is released | [Workspace lifecycle](runtime/WORKSPACE-LIFECYCLE.md), [Integration strategy](runtime/INTEGRATION-STRATEGY.md) |
| The runtime cannot push `main`, bypass the pre-push hook, or write a governance path | [Workspace lifecycle](runtime/WORKSPACE-LIFECYCLE.md) |
| A merge executor cannot perform a GitHub mutation before immutable typed admission and a durable plan receipt, and cannot blindly repeat an ambiguous mutation | [Post-gate merge executors](runtime/POST-GATE-MERGE-EXECUTORS.md) |
| The runtime task executor cannot target `main`; the DevOps release executor can merge a protected PR into `main` but cannot push it, set `ALLOW_MAIN_PUSH`, or bypass policy | [Post-gate merge executors](runtime/POST-GATE-MERGE-EXECUTORS.md#structural-negative-capabilities) |
| A verified merge wakes ordinary scheduling only through the TASK-026 result adapter and TASK-005 observation; neither executor can append its own trigger | [Post-gate merge executors](runtime/POST-GATE-MERGE-EXECUTORS.md#ingress-scheduling-and-human-002) |
| Generic formal acceptance cannot construct a plan; only an exact matching immutable High/Critical security-risk record can represent the permitted exception | [Post-gate merge executors](runtime/POST-GATE-MERGE-EXECUTORS.md#exact-executor-gate-admissibility) |
| Current branch controls and complete bypass actors come only from a fresh signed separate control-plane attestation; executors own no policy-read port, and one total classifier maps every non-usable state to one result | [Post-gate merge executors](runtime/POST-GATE-MERGE-EXECUTORS.md#one-policy-control-classifier-and-one-result-constructor) |
| Owner verification has separate author and control phases bound to one exact final commit; no-later-content proof is mandatory and later content invalidates both phases | [Integration strategy](runtime/INTEGRATION-STRATEGY.md#exact-published-head-verification-obligation) |
| No credential is ever persisted, logged, checkpointed, or emitted | [Provider adapters](runtime/PROVIDER-ADAPTERS.md) |

### Quality attributes

| Attribute | Position |
|---|---|
| Correctness under interruption | Highest priority. Every other attribute yields to it. |
| Determinism | Required, not merely desirable: replay, seeded backoff, and total dispatch ordering are what make the equivalence claims testable. |
| Observability | Every state change is a durable, diffable, canonical-JSON event. Run events carry primitives only, so no payload can leak through them. |
| Testability | Every boundary is an injected interface, so each module is unit-testable with fakes before its dependencies exist. |
| Throughput | Deliberately traded away. Bounded concurrency and write-scope exclusion cap parallelism; agent invocations dominate wall-clock time, so scheduler overhead is irrelevant. |
| Distribution | Explicitly out of scope. A run has one writer process. The writer epoch is the seam a future multi-process design would extend. |

### Document set

Detailed specifications, all normative:

| Document | Covers |
|---|---|
| [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md) | Module map, contract roots, allowed dependency directions, cross-cutting rules |
| [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) | Every type and signature crossing a module boundary |
| [STATE-MACHINE.md](runtime/STATE-MACHINE.md) | Run and task states, transition tables, illegal transitions, dynamic admission |
| [DURABLE-STATE-AND-CHECKPOINTS.md](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) | Journal, atomic checkpoints, restore, monotonicity, writer lock |
| [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md) | Lease lifecycle, fencing, admission gates, deterministic ordering |
| [PROVIDER-ADAPTERS.md](runtime/PROVIDER-ADAPTERS.md) | Adapter interface, failure taxonomy, timeout layering, credential handling |
| [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md) | Idempotency keys, effect ledger, backoff, exhaustion, timeout layers |
| [LIFECYCLE-AND-BOOTSTRAP.md](runtime/LIFECYCLE-AND-BOOTSTRAP.md) | One-input bootstrap, command surface, live-run control protocol, drain, pause and resume, exit codes |
| [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md) | Failure model, recovery phases, twenty-three post-crash invariants, accepted risks |
| [WORKSPACE-LIFECYCLE.md](runtime/WORKSPACE-LIFECYCLE.md) | Workspace handle, split-phase prepare/finalize/abandon and reconcile, script delegation and direct repository access paths, publication classes and pull-request identity, structural prohibitions |
| [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md) | Branch topology, integration order, contract change control |
| [POST-GATE-MERGE-EXECUTORS.md](runtime/POST-GATE-MERGE-EXECUTORS.md) | Conditional task and release merge authority, exact gate admissibility, trusted current-policy attestation, typed refusal, durable evidence, recovery, credentials, ingress, human exceptions, and returned governance text |

The ingress inbox contract is section 2b of [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md); the model it implements is normative in [STATE-MACHINE.md](runtime/STATE-MACHINE.md#ingress-model-for-event-triggered-recurring-work); its module boundary is in [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md#durable-ingress-inbox-task-026); and its on-disk shape is in [DURABLE-STATE-AND-CHECKPOINTS.md](runtime/DURABLE-STATE-AND-CHECKPOINTS.md#run-directory-layout).

Decisions: [`docs/adr/`](../adr/README.md), ADR-0001 through ADR-0044.

Diagrams: [components](../../diagrams/architecture/runtime-components.md), [state machines](../../diagrams/architecture/runtime-state-machine.md), [sequences](../../diagrams/architecture/runtime-sequences.md).

### Constraints on implementation tasks

1. [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) is normative. During Waves 3 through 7, no implementation task changes a contract, even inside its own write scope. A contract believed to be wrong is escalated to the Orchestrator for an architect amendment.
2. Every module receives `Clock`, `SeededRandom`, and `SecretProvider` by injection. No module reads wall-clock time, unseeded randomness, or an environment variable directly.
3. No credential, token, or provider secret is written to state, checkpoints, journals, logs, run events, or test fixtures.
4. Operator-visible command-line text is Turkish. Identifiers, options, error codes, log lines, event names, and all source content are English.
5. Every published module entry point is `index.ts`. Deep imports into another module's internals are a boundary violation.
6. No module writes a human-controlled governance path, and no module reimplements the orchestration scripts. The workspace module invokes them; nothing else touches a worktree, a task branch, or a task lock.
7. Every process a module spawns runs inside an owned job object or process group, and has a durable outcome before the writer lock is released.
8. No module performs a process, worktree, branch, lock, commit, or publication side effect before the intent for it is durable. Receipts are identity-bearing, nominal, and store-verifiable. Publication is durably appended before `completeFinalize` may release a task lock.
9. No implementation task may leave `blocked` until `LIN-ARCH-REVIEW` satisfies the target-derived current floor. The tasks-owned graph currently spells that as passing or formally accepted; TASK-042 returns the exact security-only narrowing and does not edit `tasks/**`. The complete authoring chain is `9576fc9`, amended by `8d0c570`, `c2ee3eb`, `fe0374c45aaa51e589525cee978c8ff244837163`, rejected TASK-032 target `468b37b2649d031074eba64aca47f4561a0c41a3`, rejected TASK-034 target `6d145eb81033986361aba6454d10f52e5773f950`, rejected TASK-036 target `970b08125eaf6e5bfb7b24ec2a55238161b16eac`, and the TASK-038 final branch-head commit named in its execution handoff. Enumeration of this publication target derives the current floor and owner; this amendment's snapshot is lineage round 8 owned by TASK-039, and later targets recompute rather than copy it. Branch points and content-import commits are provenance, not replacement review or integration targets. No commit in the chain is called approved on publication alone.
10. Neither merge executor may become operational unless its immutable activation record proves every HUMAN-004 condition, pins the tasks-owned gate-vocabulary correction, carries a complete fresh signed current-policy attestation, carries a complete two-phase exact-head evidence bundle, and proves the durable merge-result ingress path exists. Presence of code, a token, a partial Metadata-read policy view, author-only evidence, or a passing pull-request check is not activation.
11. Every artifact owner's target-dependent evidence binds one exact full final authored commit. The author phase records complete command evidence after that commit; the separate control phase proves local/remote/PR equality and no later content after publication. A later content commit invalidates both phases; exact check absence remains absence and owner evidence never becomes a gate verdict.

### Known gaps requiring Orchestrator routing

The original runtime ownership gaps are closed. The two newly assigned executor modules remain proposed implementation work and stay blocked behind a passing independent TASK-047 or later verdict. The separately controlled policy attestor and tasks-owned predicate correction are returned activation dependencies; this section names boundaries without creating a task or claiming a capability exists.

| Gap | Resolution |
|---|---|
| No task owned the root toolchain manifests or `scripts/quality/**` | Human governance decision HUMAN-001 at commit `fb9f45c` added them to the devops role's write scope; TASK-018 owns the toolchain and is gated by TASK-019 |
| No module owned the agent workspace lifecycle that `AgentInvocation.worktreePath` presupposes | The TASK-016 amendment added the seventh module; TASK-017 owns it. TASK-024 makes its prepare, finalize, and abandon intents durable before their side effects |
| No module owned the durable ingress inbox or HUMAN-002 pre-dispatch producer | The ingress module assigns inbox, validation, collection, authorization, and append to TASK-026; signal, observation, and delivery to TASK-005; TASK-006 only composes them |
| No module owned post-gate task integration | TASK-040 assigns `src/orchestrator/integration/` to `runtime`; TASK-042/TASK-046 narrow its admission and policy boundary. No implementation task exists, and TASK-047 owns the next verdict |
| No module owned protected integration-to-main release merge | TASK-040 assigns `scripts/release/integration-merge/` to `devops`; TASK-042/TASK-046 apply the same exact gate/policy/evidence correction. No implementation task exists, and TASK-047 owns the next verdict |
| Neither executor can completely observe current bypass actors under its acceptable permission set | TASK-042 returns a separately provisioned repository-owner-controlled `RepositoryPolicyAttestor`; TASK-046 keeps it external and unprovisioned and defines one fail-closed result classifier. It remains outside the implementation map and adds no executor policy-read authority |
| HUMAN-004 result ingress is not implemented | TASK-026 owns the merge-result adapter and TASK-005 owns signal/observation. Until implemented and validated, both executors are dormant and refuse every merge |

### TASK-032 Architect output

This is retained historical author evidence for the rejected `468b37b` baseline. TASK-033 subsequently recorded `changes-required`; its task-tree fixture totals and pending-review language are superseded by TASK-034 and must not be read as current or as approval.

#### Identity

- Task ID: TASK-032
- Role: architect
- LLM family: gpt
- Branch: `agent/gpt/architect/task-032`
- Worktree: `C:\Users\furko\Desktop\multi-agent-worktrees\gpt-architect-task-032`
- Commit or pull request: local-only commit on this branch; its exact hash is reported in the execution handoff. No pull request or remote publication is authorized.

#### Outcome

TASK-032 is a fourth architecture amendment for the five active round-4 findings. It defines an exact lossless task-record boundary, exact unique committed-result recovery evidence, explicit spawn proof refusal, the two finalize-call corrections, and the component-link repair. It preserves the eight-module map, ten-node acyclic dependency graph, exactly two independent contract roots, HUMAN-002's six properties, all structural prohibitions, and the immutable review target. This artifact is architecture authoring, not review approval; TASK-033 owns the independent verdict.

#### Artifacts

- Changed or produced files: the runtime architecture entry point and focused runtime contracts; runtime sequence diagrams; ADR-0032 through ADR-0034; forward-only Status references in ADR-0024, ADR-0025, ADR-0028, and ADR-0030; and the ADR index/supersession map.
- Decisions or findings: ADR-0032 is the sole exact source/projection authority for A-202; ADR-0033 is the sole exact committed-result recovery authority for A-203; ADR-0034 is the sole spawn-refusal authority for A-206. A-105 and A-301 are contract/link corrections and add no duplicate decision.

#### Verification

- Commands or review method: assignment, framework, orchestration, write-scope, repository-local Markdown link/fragment, ADR numbering/supersession/completeness, module/dependency/root, immutable-target projection fixtures, result-effect order/uniqueness, spawn refusal/receipt strength, finalize signature, secret scan, diff integrity, and three-set provenance checks.
- Results and evidence: The TASK-032 author reported its checks as passing, but TASK-033 rejected the publication. In particular, its literal task-record, relation-document, and enriched-document values did not describe its own target; ADR-0036 supersedes those fixture clauses with target-tree derivation. Its other evidence remains historical only and is revalidated independently for TASK-034.

#### Risks and handoff

- Unresolved risks or blockers: the amendment had no self-approval authority, and TASK-033 recorded `changes-required`. Implementation remains blocked behind the next independent lineage verdict. The branch point differs from the immutable review target, so later integration must preserve the recorded content import plus authored delta.
- Work explicitly left outside this role: implementation, review disposition, task-record mutation, configuration, scripts, hooks, workflows, governance, remote publication, and pull-request operations.
- Required next role: completed historically by independent Reviewer TASK-033; its `changes-required` verdict routed TASK-034.
- Task lock released: yes — release occurs after the local commit and committed-state validation; the final execution handoff records the release result.

### TASK-034 Architect output

#### Identity

- Task ID: TASK-034
- Role: architect
- LLM family: gpt
- Branch: `agent/gpt/architect/task-034`
- Worktree: `C:\Users\furko\Desktop\multi-agent-worktrees\gpt-architect-task-034`
- Scope-validation base: `a0d6e77a93c3eaf50134568620c682089ff909ae`, resolved by `git merge-base HEAD agent/claude/orchestrator/task-013`
- Commit or pull request: baseline import commit `e594e72`; the final local branch-head commit is named in the execution handoff so the Orchestrator can bind the immutable review target. Publication is local-only: the task explicitly prohibits push, pull-request creation, merge, and other external publication, and no explicit egress approval exists for this new work.

#### Outcome

TASK-034 is the fifth Architect-authored amendment in `LIN-ARCH-REVIEW`. It makes current-tree fixtures and graph/integration facts target-derived, makes the six-field reconciliation input constructible through one explicit public boundary, and replaces Sequence 3's withdrawn worker call. It authors no gate verdict, claims no approval, and leaves every disposition to independent Reviewer TASK-035.

- **A-202 residual:** [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) lines 1007–1018 and [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md) lines 251–273 enumerate the published target and derive task, relation, enrichment, pairing, and graph facts instead of configuring earlier literals. ADR-0036 supersedes the fixed-target/literal clauses while preserving ADR-0032's repaired recursive schema, exact raw/body retention, leaf audit, projection, inverse, and split ownership.
- **A-401 / A-104 residue:** [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) lines 1929–1998 declares `ReconciliationBuildEvidence` and the complete pure builder; [STATE-MACHINE.md](runtime/STATE-MACHINE.md) line 560 requires every canonical point to cross it; [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md) lines 78–95 declares the coordinator's exact evidence sources. ADR-0035 supersedes the incomplete ADR-0030/ADR-0033 composition clauses without changing the canonical domain or result-effect reduction.
- **A-402 / A-004 and A-101 residue:** [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md) lines 7–15 and 102–132 names the superseded round-4 clauses and derives cohort, review chain, and floor from the target lineage register; [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) lines 1469–1477 makes `validateGraph` target-current; [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md) lines 251–273 proves this target's expanded graph.
- **A-105 residual:** [runtime-sequences.md](../../diagrams/architecture/runtime-sequences.md) lines 168–178 shows `planInvocation`, the supervisor's durable registration append, proof-bearing `beginInvocation`, supervisor binding append, and `completeInvocation`. No sequence calls the withdrawn opaque worker boundary; both existing two-argument `completeFinalize` calls remain correct.

TASK-033's individual dispositions for A-203, A-206, A-301, and A-102 are preserved and none is reopened: unique committed-result evidence/order remains in both required sequences, proof refusal remains in both worker/spawn result unions, the repaired component link still resolves, and blocked-drain/process ownership remains unchanged. This statement reports regression checks, not a new review judgment.

#### Artifacts

- Amended entry point: `docs/architecture/ARCHITECTURE.md`.
- Amended runtime contracts: `CRASH-RECOVERY.md`, `INTEGRATION-STRATEGY.md`, `INTERFACE-CONTRACTS.md`, `LEASES-AND-SCHEDULING.md`, and `STATE-MACHINE.md`.
- Amended diagram: `diagrams/architecture/runtime-sequences.md`.
- New decisions: ADR-0035 and ADR-0036.
- Forward-only decision metadata and index: ADR-0030, ADR-0032, ADR-0033, ADR-0034, and `docs/adr/README.md`. Existing decision bodies were not silently rewritten; ADR-0032's historical literals remain only in its explicitly superseded body.

#### Verification

- Repository checks: `validate-assignment.ps1 -Role architect -Llm gpt` returned `valid: True`; `validate-framework.ps1` passed for 13 roles; `test-orchestration.ps1` passed; `validate-write-scope.ps1 -IncludeWorkingTree -BaseRef a0d6e77a93c3eaf50134568620c682089ff909ae` returned `valid: True` for 37 authored-delta paths.
- Target-tree enumeration: 35 task records; 116 relation documents split 58 `gate_tasks` / 58 `gate_for`; 58 exact pairs; 44 fully enriched and zero partially enriched documents; zero pair mismatch and zero duplicate; 153 expanded prerequisite edges; deterministic Kahn traversal consumed 35/35 nodes. `LIN-ARCH-REVIEW` derives six cohort artifacts and six uniquely owned contiguous rounds, with TASK-035 owning the target-current round.
- Repository-local Markdown: 52 architecture/ADR/diagram files, 741 relative links, including 64 heading fragments, with zero failures.
- ADRs and contracts: 36 unique contiguous ADR numbers through ADR-0036; 36/36 contain Context, Decision, Alternatives considered, and Consequences; all three new supersession rows resolve without a contradictory pair. The recovery boundary carries current writer epoch and the pending-result candidate explicitly, and every canonical point is required to enter the decider through the public builder.
- Module topology: eight modules, eight unique owners and declared source paths; ten dependency nodes, 17 allowed edges, acyclic by the declared level witness, with exactly two independent roots (`state/contracts` and `agents/contracts`).
- Preservation: Sequence 3 has zero withdrawn calls and the plan/register/begin/bind/complete order; two of two `completeFinalize` calls match; two of two result sequences retain `WorkerResultRecorded` → flagged intent → commit → success order; all six HUMAN-002 Part B properties and all five structural prohibitions remain present.
- Baseline fidelity: all 53 files from rejected baseline `468b37b` remain present; 41 remain byte-identical, 12 differ only as declared amendment paths, two new ADRs are added, zero files are deleted, and zero unexpected divergences exist.
- Three distinct path sets: authored delta from the resolved branch point is 37 paths; cumulative architecture amendment against rejected base `468b37b` is 14 paths; the separately committed import set from `a0d6e77` to `e594e72` is 35 paths. These sets are deliberately not conflated.
- Diff and safety checks: the complete authored and cumulative diffs were inspected; `git diff --check` passed; no out-of-scope path, credential-like assignment, Turkish engineering text, weakened prohibition, or unexpected baseline divergence was found.

#### Risks and handoff

- Unresolved risks or blockers: this amendment has no self-approval authority. No approved architecture source exists unless TASK-035 records a passing or formally accepted verdict at the target-derived lineage floor. The same-family architect/reviewer assignment remains an independence risk mitigated only by the mandatory separate execution context.
- Limitations: no runtime implementation exists in this scope to compile or execute; projection and graph obligations were reproduced directly from the committed task records and normative algorithms. Remote and pull-request state were not queried or changed.
- Work explicitly left outside this role: implementation, review disposition, task-record lifecycle mutation, reports, governance, configuration, scripts, hooks, workflows, remote publication, pull requests, and merge operations.
- Required next role: independent Reviewer / gpt under TASK-035, in a fresh execution context, reviewing the immutable final branch-head commit against `468b37b` and recording one verdict over six relations.
- Publication: `local-only` — external egress was explicitly excluded from this task execution.
- Task lock released: deferred to the official post-commit `release-task.ps1` call; the final execution handoff records its result.

### TASK-036 Architect output

#### Identity

- Task ID: TASK-036
- Role: architect
- LLM family: gpt
- Branch: `agent/gpt/architect/task-036`
- Worktree: `C:\Users\furko\Desktop\multi-agent-worktrees\gpt-architect-task-036`
- Scope-validation base: `080433b1d4ab53d5ee83a0a85895f6b0f04164e1`, the resolved branch point against `agent/claude/orchestrator/task-013`
- Rejected review-diff base: `6d145eb81033986361aba6454d10f52e5773f950`; this commit is not an approved architecture source
- Commits: content-faithful baseline import `b894e7fc75ab5edd65949acf1be7e76d6bb7a448`; substantive amendment `65d624d`; the final evidence commit is the local branch head named in the execution handoff
- Publication: `local-only` because TASK-036 requires no external egress and explicitly excludes push, pull-request creation, and merge

#### Outcome

TASK-036 is the sixth Architect-authored amendment in `LIN-ARCH-REVIEW`. It authors contract remedies for A-501 through A-505 and records no review verdict. It does not call any finding resolved or any architecture source approved; independent Reviewer TASK-037 alone owns that judgment.

- **A-501:** [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), [STATE-MACHINE.md](runtime/STATE-MACHINE.md), and [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md) now use one exact `RunRecoveryCompletedEvent` and one shared five-array `RecoveryCompletionEvidence` shape, with canonical ordering, application semantics, exact-type fixtures, and byte-identical successful outcome evidence. ADR-0037 records the decision.
- **A-502:** the state machine, crash contract, and state/sequence diagrams now define one decision block per task, sequential legality inside each fixed block, no block interleaving, and block-only order permutations. R4/R7 require the legal `TaskTimedOut` then `RetryScheduled` sequence. ADR-0037 records the supersession.
- **A-503:** [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md), [LIFECYCLE-AND-BOOTSTRAP.md](runtime/LIFECYCLE-AND-BOOTSTRAP.md), component boundaries, and Sequence 8 now represent both `appended` and `deduplicated` success. The append-committed/signal-absent fixture resumes from the same identity and committed mark without a second entry, fabricated `seq`, or collector read; TASK-005 remains the sole activation-range reader. ADR-0038 records the result-shape supersession without changing HUMAN-002.
- **A-504:** [WORKSPACE-LIFECYCLE.md](runtime/WORKSPACE-LIFECYCLE.md), component boundaries, interface contracts, and Sequences 2/3 now agree on one state-root `ProcessGroupRegistrationReceipt` declaration. The independent agent root receives `unknown` and narrows only through `AgentReceiptVerifier`; a declaration-aware cross-root fixture enforces the rule. ADR-0039 extends the existing nominal-receipt decision.
- **A-505:** [PROVIDER-ADAPTERS.md](runtime/PROVIDER-ADAPTERS.md), interface contracts, the workspace fixture, and Sequences 2/3 now use typed `WorkerPlanResult`. Unknown family is the exact classified failure before registration or spawn; the observable table contains only plan, begin, and complete, while preparation refusal remains at the upstream boundary that can represent it. ADR-0040 records the supersession.

Round-6 closures are preserved as prior independent-review facts, not re-judged here. A-202/A-402 target-tree derivation is current; the A-401/A-104 public evidence builder remains complete; Sequence 3 has no withdrawn worker call; A-203 result ordering remains in Sequences 2 and 8; both A-206 proof-refusal unions remain; the A-301 link/fragment property remains clean; and blocked-drain/closure behavior for A-102 remains unchanged.

The authored HUMAN-002 contract contains all six required properties:

1. TASK-026 owns the runtime-control-plane collector outside `tasks/**`.
2. Validation, append, signal, and observation precede scheduler selection and fail closed.
3. External facts are validated and identity-deduplicated before durable append.
4. TASK-026 appends through its store while TASK-005 alone signals, observes, and reads; both append dispositions are representable across the crash window.
5. The recurring activation consumes immutable delivery and has neither an append capability nor a self-trigger path.
6. Interim authorization expires only after TASK-026/TASK-005 implementation and passing TASK-009/TASK-010/TASK-011 validation.

This is Architect verification of the authored representation, not TASK-037's independent property judgment.

#### Artifacts

- Entry point: `docs/architecture/ARCHITECTURE.md`.
- Amended runtime contracts: `COMPONENT-BOUNDARIES.md`, `CRASH-RECOVERY.md`, `INTEGRATION-STRATEGY.md`, `INTERFACE-CONTRACTS.md`, `LEASES-AND-SCHEDULING.md`, `LIFECYCLE-AND-BOOTSTRAP.md`, `PROVIDER-ADAPTERS.md`, `STATE-MACHINE.md`, and `WORKSPACE-LIFECYCLE.md`.
- Amended diagrams: all three files under `diagrams/architecture/`.
- New decisions: ADR-0037 through ADR-0040.
- Forward-only decision metadata and index: ADR-0013, ADR-0019, ADR-0031, ADR-0035, ADR-0036, and `docs/adr/README.md`.

#### Verification

- Repository controls: Architect/gpt assignment valid; framework validation passed for 13 roles; orchestration unit checks passed; repository security checks passed; write-scope validation against `080433b1d4ab53d5ee83a0a85895f6b0f04164e1` returned valid for 41 authored-delta paths.
- Target-tree enumeration: 39 tracked task Markdown files yielded 37 task records plus two support documents; 130 relation documents formed 65 exact pairs; 56 documents were fully enriched and zero partially enriched; zero pair or side mismatches occurred. Expansion yielded 170 unique prerequisite edges and deterministic Kahn traversal consumed 37/37 nodes. `LIN-ARCH-REVIEW` derived seven cohort artifacts, seven contiguous uniquely owned rounds, and TASK-037 as round-7 owner.
- Markdown: 56 architecture/ADR/diagram files contained 812 relative links, including 64 heading fragments; zero link or fragment failures occurred.
- ADRs: 40 unique contiguous numbers through ADR-0040; 40/40 contain Context, Decision, Alternatives considered, and Consequences; every ADR link target resolves and the four new supersession rows preserve distinct decision authority.
- Contracts: all 52 runtime-event members remain; the one recovery-completion member carries the exact five-field evidence shape; both ingress and collector success unions have two dispositions; nominal declaration counts are state root 1/1 and agent root 0/0; both agent side-effect receipt parameters are `unknown`; the provider table has exactly the plan/begin/complete phase rows and no `execute` row.
- Topology: eight module rows, eight owners, eight declared source-path assignments (nine concrete prefixes because lifecycle owns two), ten dependency nodes, 17 allowed edges, an acyclic reduction consuming all nodes, and two independent contract roots with no root-to-root edge.
- Provenance and import fidelity: rejected baseline `6d145eb` is not an ancestor of the branch point. All 55 baseline paths were copied into import commit `b894e7f`; its scoped tree is byte-identical to the baseline with zero missing/extra paths. At the amendment commit, 36 baseline paths remain byte-identical, 19 are declared amendment paths, four new ADRs exist, and zero baseline files are deleted or missing.
- Three distinct sets: authored delta from the branch point is 41 paths; cumulative architecture amendment against `6d145eb` is 23 paths; separately committed import set from `080433b` to `b894e7f` is 37 paths. These are not conflated.
- Preservation and safety: the full authored and cumulative diffs were inspected; all six HUMAN-002 properties and all five structural prohibitions remain represented; no out-of-scope path, credential-like assignment, Turkish engineering text, mojibake addition, weakened prohibition, deletion, unexpected baseline divergence, or whitespace error was found.

#### Risks and handoff

- This amendment has no self-approval authority. No approved architecture source exists unless TASK-037 records a passing or formally accepted verdict at the target-derived lineage floor.
- Architect and Reviewer are both assigned to the gpt family; mandatory fresh execution-context separation is the available independence control and is not enforced by a script.
- No runtime implementation exists in this scope to compile or execute. Contract, graph, topology, provenance, and document checks are static/repository-derived.
- Remote state was not queried or changed. Push, pull-request creation, merge, task-record mutation, review reporting, and implementation remain out of scope.
- Required next owner: independent Reviewer / gpt under TASK-037, reviewing the immutable final local branch head against `6d145eb` and recording one verdict over seven relations.
- Official lock release is a post-commit operational step; the execution handoff records the result.

### TASK-038 Architect output

#### Identity and outcome

- Task ID: TASK-038
- Role and family: architect / gpt
- Branch: `agent/gpt/architect/task-038`
- Scope-validation base: `b5d32c9f043ea9dc739dbf1748d84b86378049ef`
- Rejected review-diff base: `970b08125eaf6e5bfb7b24ec2a55238161b16eac`; it is an authoring baseline, not approved architecture
- Commits: content-faithful baseline import `726f2850ba39dccba5f62b376399c2e755d640c2`; substantive A-601 amendment `ce2ecfc`; the final evidence commit is the local branch head named in the execution handoff
- Publication: `local-only`; TASK-038 explicitly excludes push, pull-request creation, merge, and other external-state changes

TASK-038 adopts one of A-601's two permitted outcomes: integrate only the latest cumulative architecture target after its authoritative passing or formally accepted verdict. ADR-0041 rejects ancestry-preserving or no-content predecessor steps because content-import history has no permissible shared ancestry and the steps would add state without changing content. The latest target is one content integration unit; one squash supplies its content, and one atomic direct/subsumed evidence batch closes every predecessor lifecycle without another Git operation.

This is an Architect-authored amendment, not a passing review judgment. It claims no finding resolved and does not release any consumer. TASK-039 alone decides A-601 and records one round-8 verdict over the target-derived eight-relation cohort.

#### Artifacts and scope justification

- `docs/architecture/runtime/INTEGRATION-STRATEGY.md`, lines 7–20 and 126–170: replaces the conflicting predecessor replay with the one-target procedure, reconciles content import, per-unit squash, lifecycle closure, and the full runtime order.
- `docs/architecture/runtime/INTERFACE-CONTRACTS.md`, lines 3–7, 519–542, 1212, and 1266: gives the existing `IntegrationRecord` and `BranchIntegrated` member the direct/subsumed evidence needed to make predecessor lifecycle closure representable; the event union does not grow.
- `docs/architecture/runtime/STATE-MACHINE.md`, lines 3–7, 253, 274–287, 387, and 606–610: defines exact guards, atomic batch legality, `integrated(X)` satisfaction, terminal completion, and TASK-005/TASK-006 test obligations.
- `docs/architecture/runtime/fixtures/verify-integration-order.ps1`, lines 1–124: runs the complete one-step architecture content order, asserts exact target-tree equality, and retains the rejected target/predecessor 19-conflict regression.
- `diagrams/architecture/runtime-sequences.md`, lines 3, 45–48, and 483–510: Sequence 9 makes the one merge and no-content predecessor closure visible while leaving Sequences 1 through 8 intact.
- `docs/adr/0041-cumulative-architecture-lineage-integration-unit.md`, lines 1–65: records the integration-unit decision, both rejected alternatives, consequences, and controls.
- `docs/adr/0010-integration-and-branch-aggregation-strategy.md`, `0016-integration-branch-and-typed-merge-order.md`, `0018-publication-classes-and-gate-lineages.md`, and `0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md`: forward-only status metadata names exactly what ADR-0041 supersedes or extends; their decision bodies are unchanged.
- `docs/adr/0037-recovery-completion-evidence-and-decision-block-legality.md`, `0038-total-pre-dispatch-ingress-append-dispositions.md`, `0039-single-nominal-receipt-authority-and-cross-root-conformance.md`, and `0040-typed-provider-planning-result-and-phase-observables.md`: status-only metadata preserves TASK-037's individual A-501 through A-505 and HUMAN-002 closure facts; no decision semantics changed.
- `docs/adr/README.md`: indexes ADR-0041, reconciles the supersession map, and records round-7 provenance without calling the new amendment approved.
- `docs/architecture/ARCHITECTURE.md`: remains the complete publication entry point, adds choice 28, provenance, validation evidence, and this handoff.

#### Verification snapshot

- Integration order: the fixture over the substantive target reports one content step, zero conflicts, equal result/target tree `8fbf7e62b12ec36ea3d4ea9db544d6fe804de700`, legacy second-step exit 1, and the exact 19-conflict set. The final local head is re-run after this evidence commit and its result belongs in the execution handoff.
- Target-alone merge trees: `main`, `origin/main`, `integration/autonomous-runtime`, `origin/integration/autonomous-runtime`, the resolved branch point, and the Orchestrator head each produced zero conflicts and the same substantive target tree.
- Target-tree enumeration: 41 tracked task Markdown files yielded 39 task records and two support documents; 146 relation documents formed 73 exact forward/reverse pairs with zero mismatches or duplicate sides; 70 documents were fully enriched and zero partially enriched. Expansion yielded 188 unique prerequisite edges with no unknown node, and deterministic Kahn traversal consumed 39/39 nodes. `LIN-ARCH-REVIEW` derived eight cohort members, eight contiguous uniquely owned rounds, and TASK-039 as current owner.
- Markdown: 57 architecture/ADR/diagram Markdown files contained 834 relative links, including 64 heading fragments; zero link or fragment failures occurred.
- ADRs: 41 unique contiguous numbers through ADR-0041; all 164 required Context/Decision/Alternatives/Consequences sections exist; all four earlier integration authorities carry the required forward reference and the supersession map has no competing authority.
- Topology: eight module rows, eight owners, eight source-path assignments and nine concrete prefixes; ten dependency nodes, 17 allowed edges, an acyclic 10/10 traversal, two independent contract roots, and zero root-to-root edge.
- Preserved contracts: the event union remains 52 members; recovery completion retains exactly its five evidence fields; ingress append and collector success each retain both dispositions; the nominal receipt and brand each have one declaration; agent-side receipt inputs remain `unknown`; provider observables remain exactly plan, begin, and complete with no `execute` row. Seven preservation-sensitive runtime/diagram files are byte-identical to `970b081`; focused diffs in interface, state, and sequence documents change only integration evidence.
- Provenance: import commit `726f285` contains all 59 rejected-baseline paths byte-identically with zero missing, extra, or divergent paths. At the final amendment tree, 45 baseline paths remain byte-identical, 14 differ only in the declared amendment/status set, ADR-0041 and the fixture are the two additions, and no baseline path is deleted or unexpectedly divergent.
- Three distinct sets: the authored delta from the branch point is 46 paths; the cumulative architecture diff against `970b081` is 16 paths; the separately committed import delta from the branch point to `726f285` is 41 paths. They are not treated as ancestry, approval, or one another.
- Repository controls: assignment validation passed for architect/gpt; framework validation passed for 13 roles; orchestration unit checks and repository security checks passed; write-scope validation against the resolved branch point accepted all 46 authored-delta paths. Both branch-point and cumulative diffs pass whitespace checks; additions contain zero Turkish UI characters, mojibake markers, or credential-like assignments.

A-501 through A-505 and every inherited round-7 obligation remain closed as prior Reviewer facts, not re-judged here. The authored HUMAN-002 representation still has all six required properties: TASK-026 owns pre-dispatch collection and append; validation/append/signal/observation precede selection and fail closed; external facts are identity-deduplicated; TASK-005 alone signals, observes, and reads activation ranges while both append dispositions remain constructible; activations receive immutable delivery with no append or self-trigger capability; and interim authorization ends only after the named implementation and validation tasks complete. The five structural prohibitions remain unchanged because their normative sources are byte-identical to the rejected baseline.

#### Risks and handoff

- The runtime modules do not yet exist, so typed batch/application obligations are architecture-level contracts plus static and Git fixtures rather than compiled implementation tests.
- The complete-order fixture is intentionally anchored to the recorded 19-path historical regression. A future Git message-format change may require parser maintenance without changing the underlying rule.
- Architect and Reviewer share the gpt family; a fresh TASK-039 execution context is the mandatory independence boundary and no repository script enforces it.
- Remote state was neither queried nor changed. No push, pull request, merge, task-record mutation, or verdict was performed.
- Required next owner: independent Reviewer / gpt under TASK-039, reviewing the immutable final local branch head against `970b081` and recording one verdict over eight relations.
- Official lock release is a post-commit operational step; the execution handoff records its result.

## Application architecture

Not yet defined. The repository's application layers — `src/backend/`, `src/frontend/`, `console/`, and `schema/` — remain placeholders until a target project supplies scope. Their architecture will be recorded here and under `docs/architecture/` when a Project Manager task defines it.
