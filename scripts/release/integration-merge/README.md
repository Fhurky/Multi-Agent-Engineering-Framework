# Integration release merge executor — module note

DevOps-owned release control-plane module. Authored under TASK-049, remediated under
TASK-056 against the round-1 findings, hardened under TASK-059 against the eight
round-2 findings, and remediated under TASK-062 against the three round-3 Security
findings. Its normative contract is
`docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md`,
`docs/architecture/runtime/COMPONENT-BOUNDARIES.md`,
`docs/architecture/runtime/INTEGRATION-STRATEGY.md`, and ADR-0042/0043/0044, read at
`f148567d716c00d7a24783318c8d6d7031492e7b`. Governance authority is HUMAN-004 at
`7dc07488a5b1cac8b1327ebd63bf747adbe03c68`. This file is a technical note about the
code in this directory; it does not restate or amend governance, and it records no gate
verdict.

## Dormancy

**This module is dormant and cannot act.** It ships under the
`dormant-before-durable-merge-ingress` contract. The activation record is invalid,
`admit` returns `AuthorityNotActivated`, and no merge side effect may occur. Landing
this source activates nothing: the `MergeExecutorActivationRecord` and every member
must resolve through the separately injected read-only `ReleaseAuthorityPort`, and this
module exposes no function that can construct, complete, sign, publish, or mutate one.
**TASK-062 resolves no finding and satisfies no activation prerequisite**; only the
separate TASK-063 Security execution context may disposition the round-3 findings.

## Layout

| File | Responsibility |
|---|---|
| `index.ts` | Published entry point; the only surface a caller may import |
| `contracts.ts` | Executor-local types, including the read-only authenticated authority boundary |
| `canonical-json.ts` | Canonical JSON, SHA-256, strict base64, and the one-property digest projection |
| `composition-capability.ts` | Private nominal capability root binding the authenticated resolver and concrete merge client |
| `immutable-diff.ts` | Exact base/head immutable diff normalization, completeness, and canonical digest verification |
| `activation.ts` | Immutable activation-record validation and member binding |
| `gate-admissibility.ts` | `ExecutorGateAdmissibility`, the authoritative-round rule, and snapshot digests |
| `release-manifest.ts` | `release-gates/v1` shape and the seven aggregate domains |
| `release-lineage.ts` | Integration evidence set, inventory coverage, fold, and ADR-0041 subsumption |
| `published-head-evidence.ts` | `published-head-evidence/v2` two-phase validation and semantic binding |
| `policy-control.ts` | `classifyPolicyControl`, Ed25519 verification, and attestation normalization |
| `required-checks.ts` | Exact-head required-check evaluation against the pinned profile |
| `protected-paths.ts` | Frozen governance/enforcement path set, no override variant |
| `remediation.ts` | Agent-owned remediation routing that creates no task |
| `retry.ts` | The approved `merge-retry/v1` bounded policy |
| `merge-port.ts` | The single pull-request merge port and its dormant default |
| `admission.ts` | The ordered, total, pure `admit` |
| `execute.ts` | Durable intent, the sole mutation, recovery, and verification |
| `run-tests.ps1` | PowerShell entry point for the test suite |
| `tests/` | Nested fixtures, including `round-1-remediation.test.ts` |
| `TASK-059-EVIDENCE.md` | Owner counterexample and regression evidence; not a gate verdict |
| `TASK-062-EVIDENCE.md` | Round-3 owner remediation and verification evidence; not a gate verdict |

## Round-1 finding verification matrix

Every one of the sixteen findings has its own row, its own code, and its own tests. Two
findings that describe the same code region from a review lens and a security lens are
listed separately and remedied separately: a remedy for one lens does not discharge the
other lens's finding.

The **counterexample at `9fb2eb0`** column records what the reviewers' own reproduced
counterexample returned against the rejected target, re-measured from a read-only copy
of `9fb2eb0ca7c02101fd067452824e2612fda5cc0c` while preparing this remediation. Nothing
in that measurement contacted GitHub or performed, requested, or simulated a merge; the
merge port used was the in-memory recording fake.

| Finding | Severity | Required change | Code | Tests | Counterexample at `9fb2eb0` | Here |
|---|---|---|---|---|---|---|
| F-053-01 | High | Verify Ed25519 over the exact canonical payload against an activation-pinned trust root; fail closed on decode, key, and signature errors; forged-signature and wrong-key tests for both phases | `policy-control.ts` `verifyAttestationSignature`, `attestationSignedPayload`, `normalizePolicyAttestation`; `activation.ts` `validateTrustRoot`; `canonical-json.ts` `decodeBase64`, `sha256Bytes`, `canonicalBytes`; `contracts.ts` `ImmutablePolicyAttestorTrustRootRef` | `round-1-remediation.test.ts` F-053-01 ×7 | forged signature → `admitted` | `PolicyAttestationInvalid`, 0 merge calls |
| F-054-01 | Critical | Real Ed25519 against a pinned key; bind both exact App identities, installations, and complete permission maps; pin and verify the observer set; validate online issuer and key revocation; reject every permission outside the approved set | `policy-control.ts` `executorAppSetDigest`, `observerPrincipalSetDigest`, issuer-status checks; `contracts.ts` `RequiredGitHubPolicyProfile`, `AttestorIssuerStatus`, `PolicyObserverPrincipal`; `admission.ts` `releaseAttestationExpectations` | `round-1-remediation.test.ts` F-054-01 ×15 | overprivileged App permission map → `admitted` | `PolicyAttestationInvalid`, 0 merge calls |
| F-053-02 | High | Reject more than one relation for any `(lineage, gate, lineageRound)`; validate every relation in the claimed complete set; require immutable verdict commits; permutation-independent duplicate/conflict cases for all seven domains | `gate-admissibility.ts` `resolveAuthoritativeRound`, `relationDefect`; `release-manifest.ts` resolution mapping | `round-1-remediation.test.ts` F-053-02 ×22 (7 domains × 3 + 1) | mutable verdict ref → `admitted`; duplicate conflicting relation → `admitted` | `PreMergeGateNotPassing` / `PreMergeGateOpen`, order-independent |
| F-054-03 | Critical | Construct manifests and snapshots from authenticated immutable artifacts; bind every digest to canonical bytes and an authorized producer; reject duplicate or contradictory relations; derive the required-check set and expected App sources from the pinned signed profile; verify acceptance provenance | `admission.ts` `provenancedArtifactDefect`, snapshot digest recomputation, manifest-source binding, pinned-profile floor; `gate-admissibility.ts` `aggregateGateSnapshotDigest`, `releaseSecuritySnapshotDigest`; `required-checks.ts` pinned contexts | `round-1-remediation.test.ts` F-054-03 ×7 | caller-selected required-check set → `admitted` | `RequiredCheckMissing`; fabricated snapshot → `PolicyAttestationInvalid` |
| F-053-03 | High | Bind admission to an immutable complete ordered inventory and initial tree; derive verification from evidence rather than a caller boolean; refuse any prefix/suffix omission, duplicate, or reordering after recomputation | `contracts.ts` `ReleaseIntegrationInventoryEntry`, `ReleaseGateManifest.integrationUnitInventory`, `integrationInitialTreeOid`; `release-lineage.ts` inventory coverage and pinned initial tree; `release-manifest.ts` inventory shape | `round-1-remediation.test.ts` F-053-03 ×3; `release-lineage.test.ts` | digest-recomputed TASK-018 suffix → `admitted` | `IntegrationEvidenceIncomplete` |
| F-053-04 | High | Give every activation member an exact expected kind, gate, lineage, target, and independently verifiable producer binding; reject executor-produced evidence for every member | `activation.ts` `validatePassingGateRef`, `validateArtifactRef`, `producerDefect`, cross-member binding; `contracts.ts` `ImmutablePassingGateRef.member`/`targetCommit`, `ImmutableProvenancedArtifactRef` | `round-1-remediation.test.ts` F-053-04 ×2; `activation.test.ts` | substituted `implementationReview` → `activated`; executor-produced artifact → `activated` | `AuthorityNotActivated` |
| F-054-02 | Critical | Consume an authenticated immutable activation-record artifact and verify its own commit, path, digest, and issuer; dereference and verify every member; reject absent or executor-produced provenance; bind the profile artifact digest to the effective required digest; bind the concrete broker and port identity to the negative-capability attestation | `activation.ts` `recordSource` self-digest, `validateIssuer`, `validateMergePortBinding`, profile digest equality; `execute.ts` port-identity binding; `contracts.ts` `ImmutableMergePortIdentity` | `round-1-remediation.test.ts` F-054-02 ×7 | required-profile artifact digest ≠ effective digest → `activated` | `AuthorityNotActivated`; unbound port → `UnsupportedOperation`, 0 merge calls |
| F-053-05 | High | Treat every durable terminal outcome as terminal, including `refused` and `human_exception_required`; define exact replay behaviour; obtain authoritative fresh versions of every mutable and control-plane admission input before any intent or mutation | `execute.ts` terminal branches, `revalidateAuthoritatively`, `admissionInputFrom`; `contracts.ts` `ReleaseAdmissionFacts`, `ReleaseObservationPort.readReleaseAdmissionFacts` | `round-1-remediation.test.ts` F-053-05 ×2; `execute.test.ts` | terminal `refused` replay → `merged`, 1 merge call | terminal refusal replayed, 0 merge calls |
| F-054-04 | Critical | Recompute the supplied plan's idempotency key from its canonical fields and compare canonical bytes or a store-authenticated plan digest | `execute.ts` `planSelfDefect`, canonical-byte plan equality in `revalidateAuthoritatively` | `round-1-remediation.test.ts` F-054-04 ×2 (incl. all 13 pinned fields) | substituted plan reached the sole mutation, 1 merge call | `IntentReceiptInvalid`, 0 merge calls |
| F-054-05 | Critical | After every delay and immediately before every mutation attempt, re-read and bind the exact base, head, and checks, re-run the gate and activation predicates, obtain and cryptographically validate a fresh pre-mutation attestation and revocation result, and refuse rather than retry on drift | `execute.ts` per-attempt `revalidateAuthoritatively` and `authorizePreMutation`; `contracts.ts` `ReleaseAttestationRequestChannel`, `PreMutationAuthorizationRequest` | `round-1-remediation.test.ts` F-054-05 ×3 | 45-second retry outlived the authorization → `merged`, 2 merge calls | `PolicyAttestationStale` / `BaseOidMismatch`, 1 merge call |
| F-053-06 | High | Persist each attempt atomically before its mutation; enforce the global budget across restarts; reacquire and validate a fresh pre-mutation attestation after any wait; reconcile before every retry; prove protected-base reachability and order before recording success | `execute.ts` `recordAttempt` before each mutation, restart-safe budget seed, `verifyMergedResult` containment and parent order; `contracts.ts` `DurableAttemptReceipt`, `ReleaseBaseContainment` | `round-1-remediation.test.ts` F-053-06 ×3; `execute.test.ts` | spent budget across a restart → `merged`, 1 merge call | `RetryExhausted`, 0 merge calls |
| F-054-06 | High | Authenticate and authorize every store append; validate history identity and plan digest; verify store-issued policy receipts; prove merged-commit ancestry and containment on `main` | `execute.ts` `verifyHistory`, `terminalOutcomeDefect`, `verifyPolicyAuthorization`, containment checks; `contracts.ts` `DurableHistoryAuthenticity`, `MergeOutcomeRecord.planDigest` | `round-1-remediation.test.ts` F-054-06 ×5 | forged terminal record → `merged`, 0 merge calls, no reconciliation | `IntentReceiptInvalid`, 0 merge calls |
| F-054-07 | High | Require an immutable authorized-human record binding the exact policy commit, release head OID, repository, action, scope, and decision artifact, and verify its provenance before admission | `contracts.ts` `ImmutableHumanDecisionRef`; `admission.ts` `irreversibleAuthorizationDefect`, `expectedIrreversibleAuthorizationScopeDigest` | `round-1-remediation.test.ts` F-054-07 ×7 | unbound decision accepted for a coupled policy | one unclassifiable exception, 0 merge calls |
| F-053-07 | High | Define and validate the exact remote ref and required resolved-base names and values, and bind proof commands and material arguments to those facts | `published-head-evidence.ts` `bindPublishedHeadEvidence`, `validateProofKinds`, `NO_LATER_CONTENT_PROOF_KINDS`; `contracts.ts` `RELEASE_REMOTE_REF` | `round-1-remediation.test.ts` F-053-07 ×5 | unbound remote ref with a recomputed bundle digest → `admitted` | `PublishedHeadEvidenceMismatch` |
| F-054-08 | Medium | Require distinct authenticated producer identities for the phases, bind each required proof kind to a distinct successful command record and reproducible result digest, and verify the control producer is independent of the author producer | `published-head-evidence.ts` `validatePhaseProducers`, `validateProofKinds` | `round-1-remediation.test.ts` F-054-08 ×3 | a single producer could manufacture both phases | `PublishedHeadEvidenceMismatch` / `PublishedHeadEvidenceIncomplete` |
| F-053-08 | Medium | Validate the complete runtime input shape before any dereference or digest computation and add hostile `unknown`-input tests asserting exactly one typed result and no exception | `admission.ts` `validateSourceShape` (complete, guarded), the total `admit` wrapper, deferred `SecurityEvidenceMissing` scope | `round-1-remediation.test.ts` F-053-08 ×5 (198 hostile values over 22 declared boundaries, plus removal, unrepresentable values, and nested members) | `securitySnapshot: null` → `TypeError` | `SecurityEvidenceMissing`; exactly one typed member for every hostile value |

### What the matrix does not claim

It records which code and which tests answer each finding. It is **owner evidence, not a
gate verdict**: no row states that a finding is resolved. Seven of the sixteen findings
are Critical or High and block delivery until resolved or formally accepted by an
authorized human; **no acceptance exists, none was sought, and this owner may not create,
request, simulate, or rely on one.**

## Language and toolchain

The approved architecture places this path in the ten-module map, binds it to the
`index.ts` entry-point rule, and expresses its whole contract in TypeScript
discriminated unions whose totality ADR-0001 records PowerShell cannot express. The
tests use `node:test` with `node:assert/strict`, which ADR-0001 selects precisely so a
module can be covered with zero third-party dependencies.

The repository has no root `package.json` or `tsconfig.json` — TASK-018 owns those and
is not integrated — and this task's write scope is `scripts/release/integration-merge/**`
only. The module therefore relies on Node.js native TypeScript type stripping and runs
with no manifest, no build step, and no dependency:

```powershell
./scripts/release/integration-merge/run-tests.ps1
```

Node.js 22.18 or newer is required. `run-tests.ps1` adds `--experimental-strip-types`
for the 22.6–22.17 and 23.0–23.5 ranges where the feature exists but is flagged.

Because there is no compiler in the repository, the type annotations are erased rather
than checked at run time. Every invariant the types express is additionally asserted at
run time by the fixtures.

Relative import specifiers name `.ts` files rather than the `.js` specifiers ADR-0001
binds to TASK-003 through TASK-008, because type stripping resolves the real file and
performs no output rewriting. If the repository later gains the TASK-018 toolchain, this
is the one convention to revisit.

## Structural properties the tests enforce

- Exactly one merge port with exactly one operation, one call site, literal `main` and
  `merge` types, and a request constructor that derives every field from an admitted plan.
- No generic HTTP, socket, process spawn, `git`, `gh`, ref update, force, `--no-verify`,
  `ALLOW_MAIN_PUSH`, environment access, administrator override, branch-protection,
  ruleset, bypass, required-check, gate, task-record, lock-release, filesystem-write, or
  deployment capability anywhere in the module source.
- No policy-mutation or generic policy-observation port. Complete policy observation
  belongs to the separate human-controlled `RepositoryPolicyAttestor`; the executor
  consumes a signed attestation plus independently resolved authenticated source and
  revocation evidence. The attestor request channel added for the per-attempt
  `pre_mutation` authorization carries exactly one operation, supplies a closed subject,
  and can neither observe nor mutate policy.
- Admission and execution consume one non-caller-constructible nominal capability. Its
  private composition root binds independently authenticated authority and merge-client
  objects to the exact callable instances; labels or structurally compatible objects do
  not confer authority.
- Protected-path evaluation consumes the canonical path universe derived from a complete
  authenticated immutable diff keyed by the exact base and head. Pagination gaps,
  omissions, ambiguous renames/deletions, or canonical-byte substitutions fail closed.
- Branch controls are typed and parameterized. The executor independently derives the
  normalized effective policy for `refs/heads/main` from signed applicable sources and
  compares its digest with the immutable required profile; Boolean completeness and a
  copied profile digest cannot substitute for the controls.
- No import of a runtime implementation module or either runtime contract root, and no
  third-party dependency at all. The only non-local production import is `node:crypto`.

**The remediation widened no capability.** Every change either rejects an input the
module previously accepted or adds a read-only observation the approved execution order
already required.

## Unexecuted obligations

`tests/live-control-plane.blocked.test.ts` registers the eleven live protected-branch
and attestor-boundary fixtures the approved list requires. They are reported as `todo`
and are deliberately unsatisfiable: the human-controlled control plane is absent, and
provisioning it is a HUMAN-004 third-exception action outside this role. They must never
be stubbed or provisioned to make them pass. TASK-055 owns their validation. The count
remains **eleven**: this remediation added no new live obligation. The read-only
authority boundary must independently authenticate issuer/key status and enumerated
policy sources; the offline fixture models that contract without provisioning or
simulating the absent live control plane.

## Fixture material

No secret, token, credential, private key, or sensitive production value exists in this
module or its fixtures. The fixtures now perform real Ed25519 signing, so a signing key
must exist while the suite runs: it is **derived at run time** from a public, non-secret
label through SHA-256, is never written to disk, committed, logged, or transmitted, and
authenticates nothing outside this offline suite. The real attestor's signing key lives
in the human-controlled policy plane, outside this repository and outside every executor
process.
