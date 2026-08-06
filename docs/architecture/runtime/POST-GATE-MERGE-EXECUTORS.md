# Post-Gate Merge Executors

Normative contract for the two conditionally authorized merge executors. Authored under TASK-040 from HUMAN-004 at immutable commit `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`. Related decision: [ADR-0042](../../adr/0042-conditionally-authorized-post-gate-merge-executors.md).

This document authors a contract. It does not approve this amendment, implement either executor, activate either authority, close a gate, or change GitHub policy. TASK-041 alone reviews this amendment. Only a passing TASK-041 verdict permits the Orchestrator to create the separately owned implementation and validation tasks.

## Two authorities, two modules

The authorities are intentionally not a single executor parameterized by a target ref.

| Executor kind | Owning module and source path | Tests | Sole owner role | Only permitted operation |
|---|---|---|---|---|
| `task_integration` | Runtime post-gate integration executor, `src/orchestrator/integration/` | `tests/unit/orchestrator/integration/` | `runtime`; implementation task does not exist and may be created only after TASK-041 passes | Squash-merge one admitted task pull request into the configured integration branch, currently `integration/autonomous-runtime` |
| `release_main` | DevOps release merge executor, `scripts/release/integration-merge/` | `scripts/release/integration-merge/tests/` | `devops`; implementation task does not exist and may be created only after TASK-041 passes | Merge one admitted pull request whose immutable head is the configured integration branch into `main` |

Both source and test paths are already within the named role's `write_scope` in `config/agents/settings.yaml`. No role reassignment or write-scope amendment is required. The runtime module imports existing read-only task and gate views from `src/orchestrator/state/contracts/`. The DevOps module is a self-contained release control-plane module and imports no runtime implementation or contract root. Each module owns its executor-specific admission, plan, evidence, GitHub port, and result types. They share this normative protocol, not implementation code.

The workspace module remains unable to merge. Its only push ref remains its derived task branch, and neither executor imports it or broadens that function. The Orchestrator, supervisor, scheduler, and ingress module receive no GitHub merge capability.

## Activation record

Conditional authority is represented by an immutable, externally issued record rather than by an environment boolean.

```ts
export interface MergeExecutorActivationRecord {
  executor: 'task_integration' | 'release_main';
  architectureDecisionCommit: '7dc07488a5b1cac8b1327ebd63bf747adbe03c68';
  architectureReview: ImmutablePassingGateRef;       // TASK-041 or a later superseding round
  implementationReview: ImmutablePassingGateRef;
  implementationSecurityReview: ImmutablePassingGateRef;
  negativeCapabilityTestAttestation: ImmutableArtifactRef;
  githubControlAttestation: ImmutableGitHubControlAttestation;
  policyDigest: Sha256Hex;
}
```

All four HUMAN-004 operational conditions must be present: independent architecture approval, independent implementation review and security validation, configured GitHub controls, and automated negative-capability evidence. A record produced by an executor itself, a mutable ref, a missing member, or an attestation whose digest does not match live policy returns `AuthorityNotActivated`. Merely landing implementation code never activates it.

## Immutable inputs

### Task-to-integration input

`TaskIntegrationAdmissionInput` is constructed from one immutable repository tree and one immutable GitHub observation. The target's own lossless task record is the sole source of its publication class, publication, branch, dependencies, `pre_merge_gates`, gate relations, security evidence links, integration-order position, and merge declaration. Values supplied by a command line or pull-request description are comparisons only and never override the record.

```ts
export interface TaskIntegrationAdmissionInput {
  activation: MergeExecutorActivationRecord;
  targetRecord: LosslessTaskRecordProjection;
  targetRecordCommit: GitOid;
  targetRecordPath: string;
  publication: ImmutablePublication;
  authoritativeGateSnapshot: ImmutableGateSnapshot;
  securitySnapshot: ImmutableSecuritySnapshot;
  orderSnapshot: ImmutableIntegrationOrderSnapshot;
  pullRequest: ImmutablePullRequestObservation;
  base: ImmutableRefObservation;
  changedPaths: readonly string[];
}

export interface TaskMergeDeclaration {
  executor: 'task_integration';
  sourceBranch: string;
  baseBranch: 'integration/autonomous-runtime';
  mergeMethod: 'squash';
  contentUnit: { kind: 'ordinary-task'; taskId: TaskId }
    | { kind: 'cumulative-lineage'; lineage: GateLineageId; targetTaskId: TaskId };
  order: IntegrationOrderKey;
}
```

`mergeAdmission` is new task-record vocabulary. A task record without a complete `TaskMergeDeclaration` cannot use autonomous integration; omission is a typed refusal and does not infer fields from branch names. The Orchestrator owns later task-record population. This amendment does not edit a task record.

Admission derives, without prose substitutes:

1. `review_ready(target)` under the record's declared `publication_class`.
2. For every member of `target.pre_merge_gates`, the lineage form of `gate_passed` at the greatest authoritative contiguous round and the existing gate-closure rule. Owner-form gates are invalid. `changes-required`, an open relation, an incomplete atomic relation set, or a merely recorded non-passing verdict refuses.
3. No unresolved High or Critical finding in the immutable security snapshot applies to the target, unless an independently recorded formal human acceptance names that exact finding and immutable target. The executor cannot author that acceptance.
4. `publication.commit`, the PR head OID, and the declared head OID are equal; the declared source and base branches match the PR; the observed base OID equals the plan's base OID; and every identity is a full immutable OID.
5. The target is the next content integration unit under [INTEGRATION-STRATEGY.md](INTEGRATION-STRATEGY.md). An ordinary task respects dependency/wave order. A cumulative lineage preserves ADR-0041 exactly: only the latest authoritative passing target is content-merged and every predecessor is evidence-only `lineage-subsumed`.
6. The method is `squash`, the expected post-merge tree is computed from the pinned base and head, and the ADR-0041 cumulative case requires that tree to equal the published target tree.
7. The changed-path set contains no governance or enforcement path listed in project policy.

### Integration-to-main input and release-gate vocabulary

`ReleaseGateManifest` is new release vocabulary. It is a versioned immutable artifact, read from the release PR's head tree, whose digest is pinned in the plan. It does not create or pass a gate. It declares which already-recorded lineage-form aggregate gate evidence must be present.

```ts
export type ReleaseGateDomain =
  | 'review' | 'security' | 'qa' | 'performance'
  | 'documentation' | 'deployment' | 'rollback';

export interface ReleaseGateRequirement {
  domain: ReleaseGateDomain;
  lineage: GateLineageId;
  minimumRound: number;
  gateClass: 'aggregate';
}

export interface ReleaseGateManifest {
  schema: 'release-gates/v1';
  repositoryId: string;
  sourceBranch: 'integration/autonomous-runtime';
  sourceOid: GitOid;
  baseBranch: 'main';
  baseOid: GitOid;
  mergeMethod: 'merge';
  requirements: readonly ReleaseGateRequirement[];
  integrationEvidenceSetDigest: Sha256Hex;
  irreversibleProductionCoupling:
    | { coupled: false }
    | { coupled: true; policyCommit: GitOid; authorization: ImmutableHumanDecisionRef | null };
}
```

The manifest must contain exactly one requirement for each of the seven `ReleaseGateDomain` values. Each requirement is evaluated with the existing lineage form of `gate_passed`, the existing authoritative-round rule, and `gateClass: 'aggregate'`; the withdrawn owner form remains invalid. A missing domain, duplicate domain, point gate, open/incomplete relation set, stale round, or non-passing verdict refuses. This is an explicit vocabulary addition, not an interpretation of `pre_merge_gates` that the current graph never declared.

Release admission additionally requires:

1. The PR head branch is exactly `integration/autonomous-runtime`, its immutable head equals `sourceOid`, the base is exactly `main`, and its immutable base equals `baseOid`.
2. The integration evidence set proves every included task content unit in the current integration tree. Evidence may have been produced by the runtime executor, by the bounded legacy operator path, or by a mixture. Producer identity is immaterial; for every unit, the source OID, resulting tree OID, order key, merge method, gate snapshot, and direct or lineage-subsumed proof must be present and valid. A branch tip without the complete evidence set refuses.
3. Folding evidence in ascending `IntegrationOrderKey` yields `sourceOid`'s tree, no predecessor is missing, no unit appears twice, and ADR-0041's cumulative-unit rule is intact.
4. `main` is an ancestor of the integration head and the expected post-merge tree equals the integration head tree. The release method is the ordinary GitHub `merge` method; it preserves the assembled integration history and creates one release merge commit.
5. No unresolved High or Critical release finding exists except one with an exact formal human acceptance.
6. Every required GitHub check exists on the immutable head, has conclusion exactly `success`, and was produced by the configured GitHub App identity. `neutral`, `skipped`, `timed_out`, `cancelled`, missing, stale, or wrong-publisher results never pass.
7. `irreversibleProductionCoupling.coupled:false` means the main merge is not an irreversible production action. When a later approved policy sets `coupled:true`, admission requires a formal human authorization naming that policy commit and release OID. An absent or unclassifiable authorization produces the typed human exception result; it never turns main merge itself into an implicit exception.
8. The release diff contains no governance or enforcement change.

## Total admission and refusal results

Each executor exposes a pure `admit` and a side-effecting `execute`. Neither accepts a flag that suppresses validation.

```ts
export type MergeAdmissionResult<P> =
  | { status: 'admitted'; plan: P }
  | { status: 'refused'; refusal: MergeRefusal }
  | { status: 'human_exception_required'; exception: HumanExceptionRecord };

export type MergeRefusalCode =
  | 'AuthorityNotActivated'
  | 'SourceRecordInvalid' | 'ReleaseManifestInvalid'
  | 'TargetNotReviewReady' | 'PreMergeGateOpen' | 'PreMergeGateNotPassing'
  | 'ReleaseGateDomainMissing' | 'ReleaseGateNotPassing'
  | 'SecurityEvidenceMissing'
  | 'PublicationMismatch' | 'SourceBranchMismatch' | 'BaseBranchMismatch'
  | 'HeadOidMismatch' | 'BaseOidMismatch' | 'MergeMethodMismatch'
  | 'IntegrationOrderViolation' | 'IntegrationEvidenceIncomplete'
  | 'ExpectedTreeMismatch' | 'ProtectedPathChange'
  | 'RequiredCheckMissing' | 'RequiredCheckNotSuccessful' | 'RequiredCheckPublisherMismatch'
  | 'IntentNotDurable' | 'IntentReceiptInvalid'
  | 'MergeConflict' | 'GitHubRejected' | 'OutcomeUnknown'
  | 'ResultUnverifiable' | 'RetryExhausted' | 'UnsupportedOperation';

export interface MergeRefusal {
  code: MergeRefusalCode;
  executor: 'task_integration' | 'release_main';
  idempotencyKey: Sha256Hex | null;
  immutableSubjects: readonly ImmutableArtifactRef[];
  evidenceRecord: MergeEvidenceRef;
  remediation: RemediationRequest | null;
}
```

Every closed-domain input maps to one member. A case outside the closed domain does not become `UnsupportedOperation`; it becomes the conservative `human_exception_required` result described below. Refusal and exception records are durable before control returns.

Known non-admission never calls GitHub. An unresolved applicable High/Critical finding maps to the first typed human exception, not to a routine refusal. A conflict, stale head or base, missing or non-successful check, integration-order violation, protected-path change, or unverifiable observation is non-retryable and produces a remediation request. Transient transport, rate-limit, or server failures are retryable only under the bounded policy. An ambiguous mutation response is reconciled before any retry and otherwise becomes `OutcomeUnknown`.

## Plan, durable intent, execute, and recovery

Both modules implement the same phase order locally; neither imports the other.

```ts
export interface MergePlan {
  schema: 'merge-plan/v1';
  executor: 'task_integration' | 'release_main';
  repositoryId: string;
  pullRequestNumber: number;
  sourceBranch: string;
  headOid: GitOid;
  baseBranch: 'integration/autonomous-runtime' | 'main';
  baseOid: GitOid;
  mergeMethod: 'squash' | 'merge';
  expectedTreeOid: GitOid;
  orderKey: string;
  gateSnapshotDigest: Sha256Hex;
  securitySnapshotDigest: Sha256Hex;
  policyDigest: Sha256Hex;
  idempotencyKey: Sha256Hex;
}

export interface MergeEvidenceStore {
  recordIntent(plan: MergePlan): Promise<DurableMergeIntentResult>;
  verifyIntent(receipt: unknown, plan: MergePlan): Promise<boolean>;
  recordOutcome(record: MergeOutcomeRecord): Promise<MergeEvidenceRef>;
  read(idempotencyKey: Sha256Hex): Promise<MergeEvidenceHistory>;
}
```

The idempotency key is SHA-256 over canonical JSON of `schema`, executor, repository ID, PR number, head OID, base branch, base OID, method, expected tree OID, order key, gate snapshot digest, security snapshot digest, and policy digest. The logical durable-store key is `merge-evidence/v1/<repository-id>/<executor>/<idempotency-key>`. The store is crash-safe, append-only, external to the Git repository, and compare-and-put by key. No token or secret is stored in it.

`recordIntent` either creates the exact plan or returns the already-recorded byte-identical plan. A collision with different bytes is a refusal. It returns an opaque, store-verifiable `DurableMergeIntentReceipt` only after the plan is durable. `execute` requires the receipt and exact plan. Missing, forged, wrong-key, stale-policy, or mismatched evidence returns `IntentReceiptInvalid` before any network mutation.

Execution order is fixed:

1. Re-read the PR, required checks, activation policy, and base ref. Require the same head OID and base OID as the plan. Re-run the protected-path and security checks.
2. Acquire the one durable executor lease for `(repositoryId, baseBranch)`. A lease serializes plans locally; GitHub branch protection remains the authoritative server-side serialization and cannot be bypassed.
3. Persist intent and verify the store-issued receipt.
4. Call the executor-specific narrow GitHub merge port once with the PR number, exact head OID, and fixed method. The port has no generic ref, push, force, admin, check-writing, gate-writing, task-writing, or lock-writing operation.
5. Re-read the PR, merged commit, and protected base. Verify the merged commit is reachable from the protected base, its tree equals `expectedTreeOid`, and the protected base now points to or contains that commit in the expected order. For a cumulative unit, verify the one direct plus ordered lineage-subsumed evidence batch before publication.
6. Persist the terminal outcome. Only then publish a merge-result artifact for the authorized ingress adapter.

### Ambiguous outcomes and idempotent recovery

After a crash or an ambiguous GitHub response, recovery first reads the evidence history and GitHub; it never blindly repeats the mutation.

| Observation | Recovery decision |
|---|---|
| No durable intent | Re-run pure admission; no external effect is possible |
| Intent and terminal outcome | Return the recorded outcome; no API mutation |
| Intent, PR reports merged, merged commit and tree match the plan | Adopt the external effect, append `recovered_merged`, and do not call merge |
| Intent, PR open, head/base/policy unchanged, authoritative read proves no merge | Retry only if the failure class and budget permit |
| Head/base/policy changed, PR conflicts or closed unmerged, evidence mismatches | Record refusal and route agent remediation; no retry |
| GitHub cannot establish whether the mutation occurred | Record `OutcomeUnknown`; retry only after a later authoritative read proves the PR is still open and unmerged |
| PR reports merged but commit/tree/order cannot be verified | Record `ResultUnverifiable`, block further execution for that key, and route security plus responsible-owner remediation |

`already merged` is success only when every immutable identity and the resulting tree match. A PR merged by an unknown actor without valid plan/evidence is not adopted into the release lineage.

## Bounded retry and remediation routing

The approved policy is `merge-retry/v1`: at most three total mutation attempts, including the first; deterministic exponential delays of 1, 4, and 16 seconds before eligible subsequent observations; a 120-second total wall-clock budget; and respect for a smaller server `Retry-After`. Only transport interruption, rate limiting, and GitHub 5xx responses are eligible. A conflict, 4xx policy rejection, stale immutable identity, missing check, changed policy, ambiguous state without reconciliation, or verification failure is never retried as a mutation.

Exhaustion records `RetryExhausted`. No result asks a human to perform a routine merge. Instead the executor publishes a durable `RemediationRequest` for the Orchestrator to consume and turn into a task; the executor cannot create or assign tasks itself.

| Condition | Responsible role carried by the request |
|---|---|
| Task branch conflict, stale publication, invalid task declaration, protected-path change | The immutable target record's `owner_role` |
| Missing or failed review/QA/performance/documentation evidence | The recorded owner of that gate relation |
| Open security finding or unverifiable security/result evidence | `security`; remediation code remains with the implementation owner |
| Integration evidence gap or runtime executor defect | `runtime` |
| Release manifest, release conflict, GitHub release control, deployment, or rollback defect | `devops` |

The request contains no proposed verdict and no authority change. Only the Orchestrator routes it under the ordinary task workflow.

## Human exception surface

The set is closed and has exactly three members.

```ts
export type HumanExceptionKind =
  | 'accept_blocking_high_or_critical_security_risk'
  | 'authorize_policy_required_irreversible_production_action'
  | 'change_credentials_or_repository_authorization_policy';

export type HumanExceptionRecord =
  | {
      status: 'human_exception_required';
      classification: 'detected';
      kind: HumanExceptionKind;
      executor: 'task_integration' | 'release_main';
      immutableSubjects: readonly ImmutableArtifactRef[];
      evidenceRecord: MergeEvidenceRef;
    }
  | {
      status: 'human_exception_required';
      classification: 'unclassifiable';
      kind: null;
      candidateKinds: readonly HumanExceptionKind[];
      executor: 'task_integration' | 'release_main';
      immutableSubjects: readonly ImmutableArtifactRef[];
      evidenceRecord: MergeEvidenceRef;
    };
```

Detection is mechanical:

- An applicable unresolved High or Critical finding without an exact accepted-risk record detects the first member. The executor refuses; a human may create the independent acceptance, after which a new immutable input may be evaluated.
- A release manifest whose pinned deployment policy explicitly couples the merge to an irreversible production action detects the second. `coupled:false` does not. `main` merge alone is never evidence of this member.
- A missing, expired, overprivileged, or changed credential, ruleset, branch protection, required-check source, bypass list, or authorization policy detects the third. The executor does not repair policy or credentials.
- Any case that cannot be classified conclusively outside these three records `classification:'unclassifiable'`, `kind:null`, and the subset of the three possible `candidateKinds`, then refuses. `unclassifiable` is a result state, not a fourth exception kind; no fourth kind and no discretionary operator pause are representable.

A human decision may resolve the named exception, but it cannot waive unrelated admission predicates. Routine merging is not an exception.

## Structural negative capabilities

The implementation APIs make the eight HUMAN-004 prohibitions and the additional task refusal list unconstructible.

| Prohibited behavior | Structural control and required negative test |
|---|---|
| Author, approve, close, override, or formally accept a gate | Read-only gate snapshot types and credentials without Checks, Commit statuses, Issues, or Pull requests write. Compile/static scan proves no gate mutation port; API mock rejects any unlisted endpoint |
| Merge with an open/failing gate or non-success check | The only constructor for `MergePlan` is successful `admit`; `execute` requires its durable receipt and revalidates. Exhaustive fixture covers every non-passing conclusion and absence |
| Merge out of order or to another ref | Base branch and method are literal types per executor; PR/head/base/order are bound in the plan and receipt. Property tests mutate each field and require refusal before the API call |
| Push `main`, set `ALLOW_MAIN_PUSH`, pass `--no-verify`, bypass the pre-push hook, or force-push | Neither module spawns `git push` or any Git mutation command; the GitHub port exposes only `mergePullRequest(pr, sha, fixedMethod)`. The sanitized process environment rejects `ALLOW_MAIN_PUSH` if present. Static command/argument/endpoint allow-list tests prove no push, `--no-verify`, or force operation exists |
| Bypass branch protection/checks or use an administrator override | Separate GitHub App installations are absent from every bypass list, are not administrators, and use the ordinary merge endpoint. A policy-attestation mismatch refuses. Live policy tests prove a deliberately failing required check blocks each App |
| Write or merge governance or enforcement changes | Neither executor has a working-tree/filesystem writer. Admission compares the immutable PR diff to the protected-path set and has no override variant. Fixtures include every protected path class |
| Release a lock or rewrite ownership | Neither executor imports orchestration scripts or exposes filesystem/task-record mutation. Static dependency and process-command tests reject lock release, task mutation, and owner changes |
| Use mutable identity or treat missing/skipped/timed-out/cancelled as passing | OIDs are required in plan constructors; branch names are selectors only. The check union accepts exactly `success`; exhaustive tests prove every other and unknown value refuses |

The release executor's permission to merge into `main` does not collide with the direct-push prohibition. It invokes an ordinary protected pull-request merge through the GitHub API; it cannot construct a Git ref update, cannot spawn `git push`, and cannot set the human emergency variable. Branch rules and required checks decide the server-side merge. This distinction is mandatory in static, mock-API, and live protected-branch tests.

## GitHub identity and human-controlled policy

Each executor uses its own GitHub App installation identity with a short-lived installation token obtained at execution time and held outside the repository. Repository scope is limited to the one configured repository. The task executor has Contents read/write, Pull requests read, Checks read, Commit statuses read, and Metadata read. The release executor has the same set. No identity has Administration, Actions, Environments, Deployments, Secrets, Issues, or checks/status write permission, and neither App is a ruleset or branch-protection bypass actor. The narrow client allow-list permits reads needed for admission/reconciliation and the pull-request merge endpoint only.

The following later changes are human-controlled and required before activation; this task does not make them:

1. Amend `AGENTS.md` so its no-agent-merge rule has only two named, conditional component exceptions: the runtime executor for admitted task PRs into the configured integration branch and the DevOps executor for admitted integration PRs into `main`. Preserve task-branch-only agent pushes, the direct-`main` push prohibition, the ban on `ALLOW_MAIN_PUSH`, force operations, hook or policy bypass, self-gating, governance/enforcement merges, lock/ownership manipulation, and the three-member HUMAN-004 exception set. Require immutable identities, durable plan/execute evidence, authorized ingress append, bounded retry, agent remediation, separate identities, and all activation conditions above. Do not authorize an agent, Orchestrator, generic script, or workflow by implication.
2. Protect `integration/autonomous-runtime` and `main` with pull-request-only updates, no force-push or deletion, required checks pinned to their expected App sources, strict current-base enforcement, and no bypass actors, including administrators and both executor Apps. Configure repository merge methods so task PRs can squash and the integration release PR can use an ordinary merge commit. Require the seven aggregate release checks on `main`. If a policy requires linear history on `main`, human governance must resolve the conflict with the selected release merge method before activation; an executor cannot change either.
3. Install and configure the two least-privilege Apps, their token broker, the external evidence store, and control attestations. Do not store credentials in Git, and do not grant either App ruleset, branch-protection, required-check, deployment, or secret administration.
4. Keep main merge decoupled from irreversible production action unless a later approved policy deliberately records the coupling and human authorization rule.

GitHub policy is authoritative. A repository setting that does not match the activation attestation is a refusal, not an executor repair opportunity.

## Ingress, scheduling, and HUMAN-002

After a verified terminal outcome, the executor writes a content-addressed merge-result artifact to its own durable evidence namespace. It does not append an ingress entry. TASK-026 owns a `merge_result_adapter` extension to the closed append-principal union. That adapter validates the evidence-store digest, immutable OIDs, executor identity, and terminal result, then appends exactly one `branch_integrated` candidate through `IngressInbox`; deduplication uses the existing fact identity. The principal is neither the executor, Orchestrator, supervisor, scheduler, nor recurring task.

TASK-005 receives the resulting high-water mark through `IngressHighWaterSignal`, observes it before selection, delivers the immutable range, and the ordinary supervisor/state transition records `BranchIntegrated`. Only that ordinary activation evaluates newly satisfied `integrated(...)` edges and dispatches newly ready work. An executor has no scheduler, inbox, journal, or self-trigger capability.

HUMAN-002 and HUMAN-004 are independent authorities:

- HUMAN-002 authorizes the runtime-owned pre-dispatch collector/observer protocol. It does not authorize a GitHub merge.
- HUMAN-004 authorizes the two conditional merge effects. It does not implement an ingress store, collector, signal, observer, or result adapter.

Source code for either executor may land before TASK-026/TASK-005 complete only under the named `dormant-before-durable-merge-ingress` contract. Under that contract the activation record is invalid, `admit` returns `AuthorityNotActivated`, and **no merge side effect may occur**. There is no operator-appended or post-merge interim substitute: performing a merge without the durable result adapter could leave an unobservable side effect and is therefore prohibited. The existing `interim-operator-authorized` bootstrap contract remains bounded to TASK-013 dispatch and is not reused or widened.

## Required evidence and validation fixtures

Both implementation tasks must provide, and independent review/security/QA must validate:

1. Exact success fixtures for one ordinary task, one ADR-0041 cumulative lineage, and one release manifest containing all seven aggregate domains.
2. An exhaustive admission table proving every refusal and all three exception classifications produce no merge API call.
3. Immutable head/base race tests, including a base change between initial planning and execute, and a required-check source mismatch.
4. Conflict, 4xx, 5xx, rate-limit, timeout, dropped response, crash-before-call, crash-after-call-before-result, and result-tree-mismatch failure injection.
5. Idempotency tests proving one mutation across process restart and ambiguous response, and proving `OutcomeUnknown` prevents a blind second call.
6. Static dependency, command, environment, permission, and endpoint allow-list tests for every negative capability in the table above.
7. Live protected-branch tests with both App identities: failing checks block; neither App bypasses; task integration can only squash into integration; release can only merge the integration PR into `main`; direct and force pushes fail.
8. Result-adapter deduplication, append-committed/signal-absent recovery, scheduler wake-up, exact `BranchIntegrated` projection, and no self-trigger path.
9. Release lineage fixtures accepting runtime/operator/mixed provenance only when every content unit has equivalent immutable evidence, and refusing any missing, duplicate, reordered, or unverifiable unit.

No executor is operational until those results are immutable members of its activation record.
