# TASK-059 owner evidence

This module-local artifact maps TASK-059 implementation and tests to the round-2
counterexamples. It is implementation-owner evidence only. It does not disposition a
finding, pass a gate, activate the executor, or replace independent TASK-060 Reviewer
and TASK-061 Security work.

## Round-2 finding matrix

| Finding | Reconstructed report counterexample | Code boundary | Test evidence | Observed result here |
|---|---|---|---|---|
| F-057-01 | Independently resealed activation members named an unrelated implementation lineage, target, or producer. The rejected target activated all three. | `activation.ts`: `validatePassingGateRef`, `producerDefect`, `validateActivation`; exact member lineage, round, architecture source, review source, target, and authenticated producer checks | `task-059-remediation.test.ts`: `F-057-01: unrelated lineage, target, and producer all remain dormant` | Each substitution returned `AuthorityNotActivated`; no merge port was available or called. |
| F-057-02 | A fresh process recovered one prior attempt from a timestamp-free history and the rejected target completed attempt two. | `contracts.ts`: authenticated `DurableRetrySequenceReceipt`; `execute.ts`: persist sequence before attempt one, authenticate start/deadline, and enforce the absolute deadline on recovery | `task-059-remediation.test.ts`: expired authenticated deadline and missing sequence-start cases | Expired sequence returned `RetryExhausted`, zero merge calls; recovered attempts without a sequence returned `IntentReceiptInvalid`, zero merge calls. |
| F-057-03 | The rejected target contained eight literal NUL bytes in `gate-admissibility.ts` and one in `published-head-evidence.ts`, causing binary classification and hiding the resolver diff. | `canonical-json.ts`: printable tuple comparison; `gate-admissibility.ts` and `published-head-evidence.ts`: no literal delimiters | `task-059-remediation.test.ts`: `F-057-03: production sources contain no literal NUL bytes`; cumulative-base `git diff --numstat` | Raw-byte reads found zero NUL bytes in both production sources. Against `d63864bc`, Git reports ordinary text numstat (`464/0` and `801/0`) rather than `-/-`. |
| F-058-01 | A caller-generated key, self-digests, producer labels, and nonexistent OID-shaped activation/member commits reached `activated` and then `admitted`. | `contracts.ts`: read-only `ReleaseAuthorityPort`; `activation.ts`: immutable record/member/artifact/trust-root/issuer resolution; `admission.ts`: production `admit` requires the separate resolver | `task-059-remediation.test.ts`: unresolvable activation record and resolver-absent caller configuration cases | Both returned `AuthorityNotActivated`; caller-computable configuration alone cannot activate. |
| F-058-02 | The rejected target accepted an under-specified permission profile, caller-labelled policy/source digests, boolean-only source completeness, and a signing key's self-declared active status. | `policy-control.ts`: `executorPermissionMapIsConfined`, enumerated/paginated source validation, independently derived effective rules/bypass actors, canonical policy/source digests, and independent `resolveIssuerStatus`; `activation.ts`: authenticated profile/trust root | `task-059-remediation.test.ts`: literal permission confinement, truncated source universe, independently revoked status | Missing `metadata` was rejected; added `administration` was rejected; truncated sources and independent revocation returned `PolicyAttestationInvalid`. |
| F-058-03 | Caller-computable manifest/snapshot/integration sets narrowed the claimed universe, and fabricated nonexistent production and accepted-risk decisions admitted. | `admission.ts`: `artifactAuthentic`, complete `enumerateAdmissionUniverse` comparison, authenticated producer equality, `resolveAcceptedRisk`, accepted-human resolution, and `resolveHumanDecision`; `gate-admissibility.ts`: authenticated decision facts consumed only after universe checks | `task-059-remediation.test.ts`: narrowed gate universe, substituted artifact producer, unresolvable production decision, and unresolvable accepted-risk decision cases | Narrowed/resealed relations and the substituted producer returned `SourceRecordInvalid`; the production decision returned one unclassifiable human exception; the accepted-risk decision returned `SecurityRiskAcceptanceInvalid`. None authorized a mutation. |
| F-058-04 | One process relabelled the author and control phases with different self-declared role/session strings and the rejected target accepted the bundle. | `contracts.ts`: authenticated publication execution identity; `admission.ts`: `authenticateExecutionEvidence`; `published-head-evidence.ts`: `validatePhaseProducers` requires distinct principals, sessions, instances, and evidence commits | `task-059-remediation.test.ts`: one-process relabelling case | The relabelled bundle returned `SourceRecordInvalid`; self-declaration cannot establish phase separation. |
| F-058-05 | Two distinct accepted relations produced equal NUL-joined sort keys; reversing them changed the rejected target's supposedly order-independent digest. External identifiers also admitted controls. | `canonical-json.ts`: `hasControlCharacters`, component-wise `compareStringTuples`; gate/security/publication/admission validators reject controls | `task-059-remediation.test.ts`: control-character and adversarial permutation case | The control-bearing relation was not admitted, and the exact old-key-collision pair produced the same digest in forward and reverse order. Production raw-byte scan also remained NUL-free. |

## Round-1 non-regression matrix

The nine findings below were the round-1 findings reported resolved at the rejected
TASK-056 head. Their original reconstruction tests were rerun unchanged in purpose
against TASK-059. All results remained fail-closed.

| Finding | Preserved code boundary | Regression tests and observed result |
|---|---|---|
| F-053-01 | `policy-control.ts` real Ed25519 verification and exact canonical payload/trust-root binding | Eight `F-053-01` cases in `round-1-remediation.test.ts`: forged, malformed, wrong-length, wrong-key, unpinned-key, and pre-mutation forgeries returned `PolicyAttestationInvalid` or `AuthorityNotActivated`; pre-mutation variants made zero merge calls. |
| F-053-02 | `gate-admissibility.ts` whole-set validation and authoritative-round ambiguity handling | Twenty-two `F-053-02` cases: duplicate conflicts across all seven domains refused permutation-independently; mutable verdicts and malformed relations refused. |
| F-053-03 | `release-manifest.ts` inventory/initial-tree binding and `release-lineage.ts` complete continuous lineage verification | Three direct `F-053-03` cases plus lineage tests: digest-recomputed suffix returned `IntegrationEvidenceIncomplete`; wrong initial tree and caller `verified` substitution refused. |
| F-053-05 | `execute.ts` authenticated terminal replay and authoritative fresh revalidation | Two direct `F-053-05` cases plus execution tests: durable refusal and human-exception outcomes replayed with zero merge calls. |
| F-053-07 | `published-head-evidence.ts` exact remote/ref/base/proof binding | Five `F-053-07` cases: unbound remote/ref/base/proof and missing proof kind returned typed publication-evidence refusals. |
| F-053-08 | `admission.ts` guarded shape admission and total typed-result wrapper | Five `F-053-08` groups: null security input, all hostile boundary values, missing boundaries, unrepresentable canonical values, and hostile nested members returned exactly one typed result without throwing. |
| F-054-04 | `execute.ts` canonical plan bytes, plan digest, and idempotency-key recomputation | Two `F-054-04` cases: substituted plan returned `IntentReceiptInvalid`, zero merge calls; all pinned plan fields affected the recomputed key. |
| F-054-05 | `execute.ts` revalidation and fresh authorization before each mutation attempt | Three `F-054-05` cases: base drift and expired authorization refused before a second call; each attempt acquired a new authorization. |
| F-054-06 | `execute.ts` authenticated history/terminal evidence and merged-result ancestry, parent-order, and containment checks | Five `F-054-06` cases: forged or mismatched store records and unauthenticated authorization refused; unreachable or wrong-parent merged commits returned `ResultUnverifiable`. |

## Trust and dependency boundaries added by TASK-059

- `ReleaseAuthorityPort` is a separately injected, read-only resolver. It authenticates
  immutable Git/store artifacts, passing gate members, trust roots, authorized humans,
  the complete admission universe, online issuer status, human decisions, and
  accepted-risk records, and publication execution identities. It exposes no mutation
  operation.
- The authority resolver identity is bound by the authenticated negative-capability
  attestation alongside the one exact merge-port identity.
- `DurableMergeEvidenceStore` persists and authenticates the retry-sequence start and
  absolute deadline before the first mutation attempt.
- Test fixtures implement only offline deterministic models of these contracts. They
  provision no control plane, credential, activation member, ruleset, branch
  protection, attestor, evidence store, or human decision.

## Capability and dormancy statement

The production mutation surface remains the single typed
`mergeIntegrationPullRequestIntoMain` operation for literal `main`, exact PR head, and
literal `merge`. The new authority surface is read-only. There is no generic HTTP, Git
ref update, push, force, bypass, administrator override, policy/ruleset/check/gate/task/
lock mutation, credential access, or deployment operation. With the external authority
absent, `admit` returns `AuthorityNotActivated` and the merge-call count is zero. The
eleven live control-plane/attestor fixtures remain registered and truthfully
unexecuted.
