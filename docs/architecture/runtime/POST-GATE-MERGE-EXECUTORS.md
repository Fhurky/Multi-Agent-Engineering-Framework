# Post-Gate Merge Executors

Normative contract for the two conditionally authorized merge executors. Authored under TASK-040 from HUMAN-004 at immutable commit `7dc07488a5b1cac8b1327ebd63bf747adbe03c68` and corrected cumulatively under TASK-042 for TASK-041 findings F-041-01, F-041-02, and F-041-04. Related decisions: [ADR-0042](../../adr/0042-conditionally-authorized-post-gate-merge-executors.md) as superseded in part by [ADR-0043](../../adr/0043-exact-merge-admission-policy-attestation-and-published-head-evidence.md).

This document authors a contract. It does not approve this amendment, implement either executor, activate either authority, close a gate, change GitHub policy, or create implementation or validation work. TASK-041 recorded `changes-required` at `ec533fb5bb0055675fb81f72057d5636f7867db3`; TASK-044 alone reviews this cumulative correction. Only a later passing independent verdict permits the Orchestrator to consider separately owned implementation work.

## TASK-042 correction register

| Finding | Exact correction | Activation effect |
|---|---|---|
| F-041-01 | `ExecutorGateAdmissibility` requires authoritative passing evidence; only an exact immutable authorized-human High/Critical accepted-security-risk record for the matching finding can represent the security exception. Generic formal acceptance returns `PreMergeGateNotPassing` and no plan | The executor-local constructor is safe immediately as a contract; activation also requires the returned tasks-owned predicate correction |
| F-041-02 | A separate repository-owner-controlled policy attestor signs a complete, fresh, plan-bound current-policy payload. Neither executor can observe or mutate policy. GitHub's incomplete read-only ruleset view is recorded as an unresolved control-plane dependency | Missing, partial, stale, revoked, or drifting policy evidence returns a typed refusal; activation remains fail-closed until the dependency exists |
| F-041-04 | Every target-dependent owner check is bound to one full published-head commit and rerun after the final authored commit; later content invalidates all earlier results | Remote/PR head equality and the actual presence or absence of GitHub checks are part of publication evidence |

## Two authorities, two modules

The authorities are intentionally not a single executor parameterized by a target ref.

| Executor kind | Owning module and source path | Tests | Sole owner role | Only permitted operation |
|---|---|---|---|---|
| `task_integration` | Runtime post-gate integration executor, `src/orchestrator/integration/` | `tests/unit/orchestrator/integration/` | `runtime`; implementation task does not exist and remains blocked behind TASK-044 | Squash-merge one admitted task pull request into the configured integration branch, currently `integration/autonomous-runtime` |
| `release_main` | DevOps release merge executor, `scripts/release/integration-merge/` | `scripts/release/integration-merge/tests/` | `devops`; implementation task does not exist and remains blocked behind TASK-044 | Merge one admitted pull request whose immutable head is the configured integration branch into `main` |

Both source and test paths are already within the named role's `write_scope` in `config/agents/settings.yaml`. No role reassignment or write-scope amendment is required. The runtime module imports existing read-only task and gate views from `src/orchestrator/state/contracts/`. The DevOps module is a self-contained release control-plane module and imports no runtime implementation or contract root. Each module owns its executor-specific admission, plan, evidence, GitHub port, and result types. They share this normative protocol, not implementation code.

The workspace module remains unable to merge. Its only push ref remains its derived task branch, and neither executor imports it or broadens that function. The Orchestrator, supervisor, scheduler, and ingress module receive no GitHub merge capability.

## Activation record

Conditional authority is represented by an immutable, externally issued record rather than by an environment boolean.

```ts
export interface MergeExecutorActivationRecord {
  executor: 'task_integration' | 'release_main';
  governanceDecisionCommit: '7dc07488a5b1cac8b1327ebd63bf747adbe03c68';
  architectureReview: ImmutablePassingGateRef;       // TASK-044 or a later superseding round
  implementationReview: ImmutablePassingGateRef;
  implementationSecurityReview: ImmutablePassingGateRef;
  negativeCapabilityTestAttestation: ImmutableArtifactRef;
  gateVocabularyCorrection: ImmutableArtifactRef;
  requiredGitHubPolicyProfile: ImmutableArtifactRef;
  requiredGitHubPolicyProfileDigest: Sha256Hex;
  policyAttestorTrustRoot: ImmutablePolicyAttestorTrustRootRef;
}
```

All four HUMAN-004 operational conditions must be present: independent architecture approval, independent implementation review and security validation, configured GitHub controls, and automated negative-capability evidence. TASK-042 additionally makes the tasks-owned gate-vocabulary correction, immutable required-policy profile, and trusted attestor identity/schema/revocation trust root explicit activation members. The short-lived current attestation is an admission input, not an activation member. A record produced by an executor itself, a mutable ref, a missing member, an unpinned attestor, or a required-policy profile without an immutable digest returns `AuthorityNotActivated`. Merely landing implementation code never activates it.

## Trusted current-policy observation boundary

F-041-02 is resolved by separating the merge principal from the policy-observation principal. Neither executor App gains Administration, ruleset write, organization administration, bypass, generic Git, arbitrary HTTP, or policy-mutation capability. A third credential is not hidden inside either executor. Instead, a repository-owner-controlled `RepositoryPolicyAttestor` exists in the human-controlled policy plane and exposes one read-only application port: observe the exact declared subject and sign the complete canonical result. Its raw credential and signing key remain outside the repository and outside both executor processes.

The attestor is constructible as a broker over a closed, pinned set of policy-observer principals rather than as an executor permission. That set must include an identity with `Administration: read` for classic protection and an identity with GitHub-recognized write access to every repository, organization, or enterprise ruleset that can apply to the exact ref, because that is the access level GitHub requires to return each ruleset's bypass actors. One principal may satisfy several entries; every principal's stable actor ID, node ID, login or App slug, installation/account scope, permission map, and credential-scope digest is signed in the payload and pinned by the attestor trust root. Each observer credential is broker-confined to the enumerated policy GET operations and has no Contents write, Pull requests write, merge endpoint, generic Git, check/status write, deployment, secret, or executor-token capability. The observer set itself must be absent from every bypass/exemption set. If an applicable parent ruleset cannot be enumerated with complete actors through that boundary, the boundary is not provisioned and must report `PolicyObservationUnavailable`.

The boundary is deliberately explicit about GitHub's documented limit:

- GitHub's [Get branch protection](https://docs.github.com/en/rest/branches/branch-protection?apiVersion=2022-11-28#get-branch-protection) endpoint requires `Administration: read`.
- GitHub's [Get a repository ruleset](https://docs.github.com/en/rest/repos/rules?apiVersion=2022-11-28#get-a-repository-ruleset) endpoint can be called with `Metadata: read`, but GitHub states that `bypass_actors` is returned only when the caller has write access to the ruleset.
- GitHub's [Merge a pull request](https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#merge-a-pull-request) endpoint requires `Contents: write` and supports an exact expected head `sha`; that merge capability does not reveal either missing policy surface.

Therefore no acceptable read-only executor permission can prove the complete effective bypass set. `Metadata: read` plus an omitted property is incomplete, not an empty list. Activation depends on a separately provisioned, human-controlled attestor that can obtain the complete view using privileged policy-plane access while exposing only signed observations to the executors. This dependency is unresolved by TASK-042. Until it is provisioned and independently validated, both executors return `PolicyObservationUnavailable` and construct no plan. This external boundary is not an eleventh implementation module, does not belong to `runtime` or `devops`, and does not change the twelve-node/nineteen-edge import graph.

### Exact signed subject and payload

```ts
export interface TrustedCurrentPolicyAttestation {
  schema: 'github-current-policy-attestation/v1';
  issuer: {
    authorityId: string;
    keyId: string;
    publicKeyDigest: Sha256Hex;
    signatureAlgorithm: 'Ed25519';
    policyGeneration: number;
    observerPrincipalSetDigest: Sha256Hex;
  };
  subject: {
    githubHost: 'github.com';
    repository: {
      databaseId: number;
      nodeId: string;
      owner: string;
      name: string;
    };
    protectedRef: 'refs/heads/integration/autonomous-runtime' | 'refs/heads/main';
    executor: 'task_integration' | 'release_main';
    pullRequestNumber: number;
    headOid: GitOid;
    baseOid: GitOid;
    admissionContextNonce: Sha256Hex;
    admissionContextDigest: Sha256Hex;
    authorizationPhase: 'pre_intent' | 'pre_mutation';
    executorApps: readonly [ExecutorAppIdentity, ExecutorAppIdentity];
  };
  policy: CompleteGitHubPolicyPayload;
  observedAt: IsoTimestamp;
  issuedAt: IsoTimestamp;
  notBefore: IsoTimestamp;
  expiresAt: IsoTimestamp;
  sourceEvidenceDigest: Sha256Hex;
  policyDigest: Sha256Hex;
  effectivePolicyProfileDigest: Sha256Hex;
  canonicalPayloadDigest: Sha256Hex;
  signature: string;
}
```

`executorApps` contains both App IDs, installation IDs, node IDs, and the complete granted repository-permission map so one executor cannot be hidden by observing only the active identity. The repository database/node identities and the full `refs/heads/...` value are authoritative; owner/name and a short branch name are comparisons only. The PR, immutable head/base OIDs, admission-context nonce/digest, and phase make the attestation single-subject and non-replayable.

`admissionContextDigest` is constructible before any attestation exists. It is SHA-256 over canonical JSON containing the executor, exact repository/PR/ref/head/base identities, merge method, expected tree, order key, gate and security snapshot digests, required-policy-profile digest, and `admissionContextNonce`. It excludes every attestation field, signature, idempotency key, and final `MergePlan` digest. The attestor signs only after independently recomputing that context from its closed request. This ordering prevents a circular plan/attestation hash dependency.

`CompleteGitHubPolicyPayload` is canonical JSON and contains all of the following, with no omitted or permission-redacted field:

1. The complete classic branch-protection response for the exact ref: strict required checks and their App IDs; pull-request review, last-push, conversation, signature, linear-history, force-push, deletion, creation, lock, fork-sync, and administrator-enforcement settings; push restrictions; dismissal restrictions; and pull-request bypass allowances.
2. Every active, evaluate, disabled, repository, organization, and enterprise ruleset returned with parent inclusion, each with stable ruleset ID and node ID, source type and source ID, target, enforcement, include/exclude conditions, version, every rule and parameter, and source-response digest. Applicability to the exact ref is computed from this complete set rather than from repository-local rules alone.
3. For every effective classic or ruleset layer, `bypassActorsComplete: true` and the complete normalized actor set. Every member carries stable actor ID, actor type, bypass mode, source policy ID, and source level. Empty means an explicitly observed empty array, never an omitted property.
4. Repository merge-method configuration, required-check publisher identities, both executor installation permission maps, administrator/bypass membership observations, API version, response ETags or version IDs when GitHub supplies them, and pagination proofs showing every page was consumed.
   The payload also contains the complete pinned policy-observer principal set and its permission/scope maps, and proves that its digest equals `issuer.observerPrincipalSetDigest`.
5. A normalized effective-control evaluation against the immutable required-policy profile. For every required protection it names the controlling classic/ruleset layer and proves pull-request-only updates, strict current-base checks, required-check names and App sources, administrator enforcement, force-push/deletion prohibition, configured merge methods, and the empty effective bypass set. The evaluation has a stable `effectivePolicyProfileDigest` that excludes observation timestamps and transport metadata while including every semantic control and actor identity.
6. An exact assertion that neither executor App identity occurs in any bypass/exemption set, is an administrator, or owns a policy-mutation permission. A single unknown actor, truncated page, redacted field, unsupported policy kind, or unrecognized response member makes the payload incomplete.

The attestor signs the canonical payload, not a caller-provided digest. `policyDigest` is SHA-256 over the complete canonical current observation, including source versions and actor enumeration. `effectivePolicyProfileDigest` is SHA-256 over only the normalized semantic control evaluation. `canonicalPayloadDigest` is SHA-256 over every attestation field other than `signature`. `policyGeneration` is a positive safe integer that strictly increases for every semantic policy, applicability, actor, observer-principal, permission, issuer, or trust-root change, including a change that later restores earlier bytes; a generation is never reused. Admission requires `effectivePolicyProfileDigest` to equal the activation record's `requiredGitHubPolicyProfileDigest`; pre-intent/pre-mutation drift checks compare both digests and the generation. This separation makes a stable required profile comparable without discarding exact live-source evidence. The activation record pins `authorityId`, `publicKeyDigest`, accepted schema, and revocation/status-channel identity. Key rotation or issuer replacement is HUMAN-004's third human exception and invalidates every prior attestation.

### Freshness, revocation, drift, and fail-closed execution

`observedAt <= issuedAt < expiresAt`, `notBefore <= issuedAt`, and the executor's trusted time must be within `[notBefore, expiresAt)`. `issuedAt - observedAt` and `expiresAt - observedAt` are each at most 60 seconds. The executor must have at least 15 seconds remaining when it begins the merge call. The attestor issues two independently signed current-generation authorizations: `pre_intent` before `recordIntent`, then `pre_mutation` immediately before the external merge mutation. They have distinct canonical attestation digests but must name the same policy digest, exact subject, admission-context nonce/digest, and non-revoked monotonic generation. The revocation/status channel is an online trusted input; inability to read it is `PolicyObservationUnavailable`, not permission to use cached evidence.

Any addition, removal, reordering with semantic effect, version change, actor change, required-check source change, permission change, issuer/key change, classic-protection change, ruleset applicability change, or unknown field is policy drift. Drift before mutation returns `PolicyDrift`, invalidates the plan and durable receipt, and requires fresh pure admission with a new idempotency key. Expiry returns `PolicyAttestationStale`; signature, subject, digest, completeness, or issuer mismatch returns `PolicyAttestationInvalid`; issuer/key revocation returns `PolicyAttestorRevoked`. None carries a `MergePlan` and none calls GitHub.

If a change is detected only after an ambiguous external response, recovery never treats the earlier attestation as current. It reconciles the exact PR/commit/tree under a fresh attestation. A merged result whose policy generation cannot be verified becomes `ResultUnverifiable`, publishes no ingress fact, and routes security plus responsible-owner remediation. No failure path asks a human to perform the routine merge.

## Immutable inputs

### Exact executor gate admissibility

`gate_passed` from `tasks/TASK-001-DEPENDENCY-GRAPH.md` is an input fact for graph/lifecycle compatibility; it is never sufficient to construct an executor plan. Each module independently derives this closed result from the complete authoritative relation set:

```ts
export type ExecutorGateAdmissibility =
  | {
      status: 'passing';
      gate: GateName;
      lineage: GateLineageId;
      lineageRound: number;
      authoritativeVerdictCommit: GitOid;
    }
  | {
      status: 'accepted_security_risk';
      gate: 'security';
      lineage: GateLineageId;
      lineageRound: number;
      authoritativeVerdictState: 'formally_accepted';
      authoritativeVerdictCommit: GitOid;
      acceptedRisks: readonly AcceptedBlockingSecurityRiskRecord[];
    }
  | {
      status: 'not_admissible';
      code: 'PreMergeGateOpen' | 'PreMergeGateNotPassing' | 'SecurityRiskAcceptanceInvalid';
    };

export interface AcceptedBlockingSecurityRiskRecord {
  schema: 'accepted-blocking-security-risk/v1';
  recordCommit: GitOid;
  acceptanceDecisionCommit: GitOid;
  acceptedBy: ImmutableAuthorizedHumanPrincipal;
  targetCommit: GitOid;
  securityLineage: GateLineageId;
  securityLineageRound: number;
  securityVerdictCommit: GitOid;
  findingId: string;
  findingSeverity: 'high' | 'critical';
  findingEvidenceDigest: Sha256Hex;
  acceptanceScopeDigest: Sha256Hex;
  acceptedAt: IsoTimestamp;
}
```

The `passing` member requires the authoritative verdict itself to be passing and every relation in its atomic set to be closed. The security alternative exists only for HUMAN-004's first exception: the authoritative security state is explicitly `formally_accepted`, and the input contains exactly one valid record for every matching unresolved blocking High/Critical finding and no record for anything else. Each record must be immutable, independently authored by an authorized human, and byte-for-byte bound to the same target, security lineage/round/verdict, finding ID/severity/evidence digest, and acceptance scope. The executor cannot author or broaden it.

`changes-required`, `failed`, `pending`, `open`, missing, partially closed, generic `formally_accepted`, and every formal acceptance for a non-security gate return `PreMergeGateNotPassing`. A Low/Medium record, an unmatched target/finding/digest/round, a mutable ref, a missing record, an extra record, or an acceptance that purports to waive another predicate returns `SecurityRiskAcceptanceInvalid`. These outcomes contain no plan. This exhaustive rule applies identically to task pre-merge gates and all seven release aggregate gates.

The correction belongs in both the executor and the tasks-owned graph vocabulary. Executor-local narrowing prevents an unsafe plan even before the graph is corrected. The broader task-graph wording still allows a generic formal acceptance to satisfy other consumers, so the following replacement is returned to the Orchestrator and is an activation prerequisite; TASK-042 does not edit `tasks/**`:

> The lineage form of `gate_passed` is satisfied only when the authoritative verdict at the highest complete lineage round is passing. The sole alternative is a security lineage whose authoritative state is formally accepted and whose complete relation set carries exact immutable authorized-human `accepted-blocking-security-risk/v1` records for every matching unresolved High or Critical finding, each bound to the same target commit, security verdict commit, lineage round, finding identity, severity, and evidence digest. Generic formal acceptance, acceptance of a non-security gate, an unmatched or partial risk record, and Low or Medium risk acceptance do not satisfy `gate_passed`.

Until the immutable tasks-owned source contains that rule and activation pins its commit in `gateVocabularyCorrection`, both executors return `AuthorityNotActivated` even when every other activation member exists.

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
2. For every member of `target.pre_merge_gates`, successful `ExecutorGateAdmissibility` at the greatest authoritative contiguous round and the existing gate-closure rule. `gate_passed` alone is not plan evidence. Owner-form gates are invalid. `changes-required`, an open relation, an incomplete atomic relation set, a generic formal acceptance, or any non-passing non-security verdict returns `PreMergeGateNotPassing` and no plan.
3. No unresolved High or Critical finding in the immutable security snapshot applies to the target unless `accepted_security_risk` contains the exact immutable accepted-risk record for that matching finding and target. The record discharges only the named finding and cannot waive a non-security verdict, another gate, policy evidence, checks, identity, order, or any other admission predicate.
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

The manifest must contain exactly one requirement for each of the seven `ReleaseGateDomain` values. Each requirement is evaluated with `ExecutorGateAdmissibility`, the existing authoritative-round rule, and `gateClass: 'aggregate'`; the withdrawn owner form remains invalid. `gate_passed` alone is never sufficient. A missing domain, duplicate domain, point gate, open/incomplete relation set, stale round, generic formal acceptance, or non-passing verdict refuses. Only a security-domain `accepted_security_risk` member may represent HUMAN-004's exact risk exception. This is an explicit vocabulary addition, not an interpretation of `pre_merge_gates` that the current graph never declared.

Release admission additionally requires:

1. The PR head branch is exactly `integration/autonomous-runtime`, its immutable head equals `sourceOid`, the base is exactly `main`, and its immutable base equals `baseOid`.
2. The integration evidence set proves every included task content unit in the current integration tree. Evidence may have been produced by the runtime executor, by the bounded legacy operator path, or by a mixture. Producer identity is immaterial; for every unit, the source OID, resulting tree OID, order key, merge method, gate snapshot, and direct or lineage-subsumed proof must be present and valid. A branch tip without the complete evidence set refuses.
3. Folding evidence in ascending `IntegrationOrderKey` yields `sourceOid`'s tree, no predecessor is missing, no unit appears twice, and ADR-0041's cumulative-unit rule is intact.
4. `main` is an ancestor of the integration head and the expected post-merge tree equals the integration head tree. The release method is the ordinary GitHub `merge` method; it preserves the assembled integration history and creates one release merge commit.
5. No unresolved High or Critical release finding exists except one with an exact `accepted-blocking-security-risk/v1` record admitted through the security-domain rule above.
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
  | 'SecurityRiskAcceptanceInvalid'
  | 'ReleaseGateDomainMissing' | 'ReleaseGateNotPassing'
  | 'SecurityEvidenceMissing'
  | 'PolicyObservationUnavailable' | 'PolicyAttestationInvalid'
  | 'PolicyAttestationStale' | 'PolicyDrift' | 'PolicyAttestorRevoked'
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

Known non-admission never calls GitHub. A non-passing or generically accepted independent verdict is `PreMergeGateNotPassing`; invalid or unmatched accepted-risk evidence is `SecurityRiskAcceptanceInvalid`. An unresolved applicable High/Critical finding with no acceptance maps to the first typed human exception, not to a routine refusal. A missing/incomplete attestor is `PolicyObservationUnavailable`; signature/subject/completeness failure, expiry, drift, and revocation use their exact policy codes and carry no plan. A conflict, stale head or base, missing or non-successful check, integration-order violation, protected-path change, or unverifiable observation is non-retryable and produces a remediation request. Transient transport, rate-limit, or server failures are retryable only under the bounded policy. An ambiguous mutation response is reconciled before any retry and otherwise becomes `OutcomeUnknown`.

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
  requiredPolicyProfileDigest: Sha256Hex;
  policyDigest: Sha256Hex;
  effectivePolicyProfileDigest: Sha256Hex;
  preIntentPolicyAttestationDigest: Sha256Hex;
  policyGeneration: number;
  policyAdmissionContextNonce: Sha256Hex;
  policyAdmissionContextDigest: Sha256Hex;
  idempotencyKey: Sha256Hex;
}

export interface MergeEvidenceStore {
  recordIntent(plan: MergePlan): Promise<DurableMergeIntentResult>;
  verifyIntent(receipt: unknown, plan: MergePlan): Promise<boolean>;
  recordPolicyAuthorization(
    idempotencyKey: Sha256Hex,
    attestation: TrustedCurrentPolicyAttestation
  ): Promise<DurablePolicyAuthorizationReceipt>;
  recordOutcome(record: MergeOutcomeRecord): Promise<MergeEvidenceRef>;
  read(idempotencyKey: Sha256Hex): Promise<MergeEvidenceHistory>;
}
```

The idempotency key is SHA-256 over canonical JSON of `schema`, executor, repository ID, PR number, head OID, base branch, base OID, method, expected tree OID, order key, gate snapshot digest, security snapshot digest, required-policy-profile digest, current complete-policy digest, effective-policy-profile digest, pre-intent attestation digest, policy generation, and admission-context nonce/digest. The logical durable-store key is `merge-evidence/v1/<repository-id>/<executor>/<idempotency-key>`. The store is crash-safe, append-only, external to the Git repository, and compare-and-put by key. No token or secret is stored in it.

`recordIntent` either creates the exact plan or returns the already-recorded byte-identical plan. A collision with different bytes is a refusal. It returns an opaque, store-verifiable `DurableMergeIntentReceipt` only after the plan is durable. `execute` requires the receipt and exact plan. Missing, forged, wrong-key, stale-policy, or mismatched evidence returns `IntentReceiptInvalid` before any network mutation.

Execution order is fixed:

1. Re-read the PR, required checks, activation record, and base ref. Require the same head OID and base OID as the plan. Re-run protected-path, `ExecutorGateAdmissibility`, and security checks. Verify the plan's `pre_intent` attestation, current revocation state, exact pre-attestation context, and equality of the signed effective-policy-profile digest with the required-policy-profile digest.
2. Acquire the one durable executor lease for `(repositoryId, baseBranch)`. A lease serializes plans locally; GitHub branch protection remains the authoritative server-side serialization and cannot be bypassed.
3. Persist intent and verify the store-issued receipt.
4. Obtain the independently signed `pre_mutation` authorization immediately before mutation. It must carry a different canonical attestation digest and the same admission-context nonce/digest, complete-policy digest, effective-policy-profile digest, generation, repository/ref/PR/head/base subject, and both App identities; its effective digest must still equal the required-profile digest; it must remain unexpired with at least 15 seconds left and show neither App in any complete bypass set. Persist it through `recordPolicyAuthorization` and verify the store-issued receipt before the call. Drift or an unavailable/revoked attestor invalidates the durable plan and refuses. Then call the executor-specific narrow GitHub merge port once with the PR number, exact head OID, and fixed method. The port has no generic ref, push, force, admin, policy-read, policy-write, check-writing, gate-writing, task-writing, or lock-writing operation.
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
| Merge with an open/failing/generically accepted gate or non-success check | The only constructor for `MergePlan` is successful `admit`; `ExecutorGateAdmissibility` accepts an authoritative passing verdict or the exact matching High/Critical security-risk record and nothing else; `execute` requires its durable receipt and revalidates. Exhaustive fixtures cover every verdict/acceptance/check state and require no plan/API call |
| Merge out of order or to another ref | Base branch and method are literal types per executor; PR/head/base/order are bound in the plan and receipt. Property tests mutate each field and require refusal before the API call |
| Push `main`, set `ALLOW_MAIN_PUSH`, pass `--no-verify`, bypass the pre-push hook, or force-push | Neither module spawns `git push` or any Git mutation command; the GitHub port exposes only `mergePullRequest(pr, sha, fixedMethod)`. The sanitized process environment rejects `ALLOW_MAIN_PUSH` if present. Static command/argument/endpoint allow-list tests prove no push, `--no-verify`, or force operation exists |
| Bypass branch protection/checks or use an administrator override | Separate GitHub App installations are absent from every bypass list, are not administrators, and use the ordinary merge endpoint. The separate trusted attestor signs the complete effective policy and both App identities; the executor receives no observation or mutation credential. Missing actors, signature/freshness/revocation failure, or drift refuses. Live policy tests prove a deliberately failing required check blocks each App |
| Write or merge governance or enforcement changes | Neither executor has a working-tree/filesystem writer. Admission compares the immutable PR diff to the protected-path set and has no override variant. Fixtures include every protected path class |
| Release a lock or rewrite ownership | Neither executor imports orchestration scripts or exposes filesystem/task-record mutation. Static dependency and process-command tests reject lock release, task mutation, and owner changes |
| Use mutable identity or treat missing/skipped/timed-out/cancelled as passing | OIDs are required in plan constructors; branch names are selectors only. The check union accepts exactly `success`; exhaustive tests prove every other and unknown value refuses |

The release executor's permission to merge into `main` does not collide with the direct-push prohibition. It invokes an ordinary protected pull-request merge through the GitHub API; it cannot construct a Git ref update, cannot spawn `git push`, and cannot set the human emergency variable. Branch rules and required checks decide the server-side merge. This distinction is mandatory in static, mock-API, and live protected-branch tests.

## GitHub identity and human-controlled policy

Each executor uses its own GitHub App installation identity with a short-lived installation token obtained at execution time and held outside the repository. Repository scope is limited to the one configured repository. The task executor has Contents read/write, Pull requests read, Checks read, Commit statuses read, and Metadata read. The release executor has the same set. GitHub's merge endpoint needs Contents write, so software confinement is also required: a credential broker retains the raw token and injects an opaque client capability that can perform only the admission/reconciliation reads and exact pull-request merge request. The executor cannot obtain or log the token or construct an arbitrary HTTP request. Neither executor identity has Administration, Actions, Environments, Deployments, Secrets, Issues, policy observation/mutation, or checks/status write permission, and neither App is a ruleset or branch-protection bypass actor.

The separate `RepositoryPolicyAttestor` is human-controlled. Because GitHub requires write access to expose complete ruleset bypass actors, its isolated policy-observer principals may hold policy-plane access beyond read-only. They are exact, signed members of the observer set; none has Contents write or a merge port, none is an executor credential, and none is delegated through the merge broker. The broker application exposes only the closed policy-observation operations and signing path, with no policy mutation operation. Provisioning, rotation, revocation, and any acceptance of that residual control-plane risk stay within HUMAN-004's third exception.

### Exact returned `AGENTS.md` amendment

The following text is returned for a human-controlled governance change. TASK-042 does not edit `AGENTS.md`:

```markdown
### Conditional post-gate merge executors

Agent task sessions continue to push only their own `agent/<llm>/<role>/<task-id>` branch and open a pull request. No agent session, Orchestrator, supervisor, scheduler, generic script, or workflow may merge by implication. Only these two named components may perform a post-gate GitHub merge after every activation and admission condition in the independently approved architecture is satisfied:

1. The runtime-owned post-gate task integration executor may squash-merge one exact-head admitted task pull request into the configured integration branch.
2. The DevOps-owned release merge executor may merge one exact-head admitted integration pull request into `main` after the complete declared aggregate release-gate set passes.

Each component uses its own short-lived, one-repository GitHub App identity and an executor-specific pull-request merge port. Neither component may possess or invoke generic Git, direct ref update, `git push` to `main`, `ALLOW_MAIN_PUSH`, force, hook bypass, administrator override, branch-protection or ruleset bypass, policy observation or mutation, check/status mutation, gate mutation, governance/enforcement merge, task/owner mutation, or lock-release capability. The workspace module remains task-branch-only.

Admission requires immutable source/base/head identity and exact merge method/order; authoritative passing independent gates, except only an exact immutable authorized-human acceptance of each matching unresolved High or Critical security finding; no other generic formal acceptance; complete successful required checks; a complete fresh signed policy attestation from the separate human-controlled policy plane proving current controls and the complete bypass-actor set; and no governance or enforcement path. Missing, non-passing, partial, stale, revoked, drifting, ambiguous, conflicting, or unverifiable evidence refuses before any plan or merge call.

Durable intent and its store-issued receipt precede the only external mutation. Recovery reconciles before retry, retries are bounded, and a verified result reaches scheduling only through the TASK-026 authorized result adapter, TASK-005 signal/observation/delivery, and the ordinary supervisor transition. Neither executor appends its own trigger or creates remediation tasks. Responsible-agent remediation replaces routine human merge requests.

Human intervention remains limited to exactly: (1) formal acceptance of an unresolved blocking High or Critical security risk; (2) authorization of an irreversible production action when an approved deployment policy explicitly requires it, with merge to `main` not itself such an action; and (3) granting, rotating, or revoking credentials or changing repository governance, branch-protection, or authorization policy. An unclassifiable case is refused with a typed exception record and creates no fourth kind.

### Exact published-head owner verification

Before handoff, every artifact owner must designate the full final authored commit and rerun every declared check whose inputs or results depend on repository content, paths, refs, diffs, topology, links, counts, or policy with `HEAD` equal to that commit. The handoff and pull-request body must record the full commit, each command and material input including its resolved base, and the actual result. After push, the owner must prove the remote branch and pull-request head equal that commit and record GitHub checks as present and successful, present and non-passing, or absent; absence is never success.

Any later content commit invalidates all earlier target-dependent owner evidence and requires the complete declared set to be rerun against the new head. External pull-request or handoff metadata that does not change the Git tree does not invalidate it. Owner verification is evidence, not an independent gate verdict, and an owner may not approve their own work.
```

### Other human-controlled prerequisites

1. Protect `integration/autonomous-runtime` and `main` with pull-request-only updates, no force-push or deletion, required checks pinned to their expected App sources, strict current-base enforcement, and no bypass actors, including administrators and both executor Apps. Configure repository merge methods so task PRs can squash and the integration release PR can use an ordinary merge commit. Require the seven aggregate release checks on `main`. If a policy requires linear history on `main`, human governance must resolve the conflict with the selected release merge method before activation; an executor cannot change either.
2. Install and configure the two least-privilege executor Apps, their token broker, the external evidence store, the separately controlled policy attestor, its signing/revocation service, and control attestations. Do not store credentials in Git, and do not grant either executor App ruleset, branch-protection, required-check, deployment, or secret administration.
3. Apply the returned tasks-owned `gate_passed` narrowing verbatim and pin that immutable correction in activation. Do not interpret an executor-local fix as permission to leave the broader shared predicate ambiguous.
4. Keep main merge decoupled from irreversible production action unless a later approved policy deliberately records the coupling and human authorization rule.

GitHub policy is authoritative. A repository setting that does not match the complete current signed attestation is a refusal, not an executor repair opportunity. A partial observation never satisfies activation.

## Exact published-head owner evidence

F-041-04 generalizes to every artifact owner. One verification record is admissible only for one exact full Git commit. It contains `targetCommit`, `branch`, resolved scope/diff bases, command, material arguments, working directory, start/end time, exit code, and the command's actual result or derived enumeration. A check is target-dependent when repository content, tree identity, ref identity, changed paths, diff base, link/ADR set, topology, graph, policy, remote head, pull-request head, or GitHub check set can affect its result.

The owner first creates the final authored content commit. With `HEAD` equal to that commit, the owner reruns the complete declared target-dependent set and records the full commit on every result. No later content commit may reuse those results. If content changes, even only an evidence paragraph, every earlier target-dependent result becomes stale and the complete set is repeated. External PR-body or handoff metadata may be updated afterward because it does not change the Git tree.

Publication evidence additionally proves the remote branch OID and pull-request head OID equal `targetCommit`. The exact GitHub check-rollup state for that OID is recorded as `present_successful`, `present_nonpassing`, or `absent`; an empty array, zero check runs, or zero statuses is `absent`. This evidence never supplies or substitutes for an independent review/security/QA/performance verdict.

TASK-042 applies this rule to itself: its final handoff and cumulative pull-request body are written only after the final authored commit and carry all repeated target-dependent results against that exact commit. No content commit follows those runs.

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
2. An exhaustive admission table proving every refusal and all three exception classifications produce no merge API call. Its required F-041-01 fixture supplies an authoritative `changes-required` review verdict plus a generic formal acceptance and asserts `PreMergeGateNotPassing`, no `MergePlan`, no durable intent, and zero merge API calls. Parallel fixtures cover every non-security gate and a security acceptance whose target, finding, severity, evidence digest, verdict, or round differs by one field. Only the exact matching High/Critical security record is admissible.
3. Immutable head/base race tests, including a base change between initial planning and execute, and a required-check source mismatch.
4. Conflict, 4xx, 5xx, rate-limit, timeout, dropped response, crash-before-call, crash-after-call-before-result, and result-tree-mismatch failure injection.
5. Idempotency tests proving one mutation across process restart and ambiguous response, and proving `OutcomeUnknown` prevents a blind second call.
6. Static dependency, command, environment, permission, and endpoint allow-list tests for every negative capability in the table above.
7. Live protected-branch tests with both App identities: failing checks block; neither App bypasses; task integration can only squash into integration; release can only merge the integration PR into `main`; direct and force pushes fail.
8. Result-adapter deduplication, append-committed/signal-absent recovery, scheduler wake-up, exact `BranchIntegrated` projection, and no self-trigger path.
9. Release lineage fixtures accepting runtime/operator/mixed provenance only when every content unit has equivalent immutable evidence, and refusing any missing, duplicate, reordered, or unverifiable unit.
10. Policy-attestation fixtures covering exact repository/ref/PR/head/base/App subjects, canonical digest and Ed25519 signature, full parent/repository ruleset enumeration, explicit empty and non-empty bypass sets, pagination, 60-second freshness, 15-second execution margin, key/issuer revocation, and every semantic drift field. Missing or permission-redacted `bypass_actors` must be `PolicyObservationUnavailable`, never an empty set.
11. A live attestor boundary test proving neither executor process or opaque merge client can obtain the observer credential, invoke Administration/ruleset endpoints, mutate policy, issue an attestation, or suppress revocation; the attestor port cannot call a merge endpoint.
12. Published-head evidence fixtures that add a final content commit after a passing check set and assert the earlier evidence is stale, then rerun every declared target-dependent check and bind the replacement record to the new full head. An empty GitHub check rollup is represented as absent.

No executor is operational until those results are immutable members of its activation record.
