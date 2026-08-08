# TASK-058 Security Revalidation of the Release Merge Executor, Round 2

## Identity

- Task ID: TASK-058
- Role: security
- LLM family: gpt
- Branch: `agent/gpt/security/task-058`
- Worktree: `C:/Users/furko/Desktop/multi-agent-worktrees/gpt-security-task-058`
- Report commit: this file's containing TASK-058 commit
- Scope-validation base: `754d66a0f73b6405e3a81101e8c24302581c2ebc`
- Review target base: `d63864bcb25fc8897b21c09f8f687e390f85808d`
- Remediation-only parent: `9fb2eb0ca7c02101fd067452824e2612fda5cc0c`
- Review target: `85f5d265c888f899332a99b15a7d9c8aa959be00`
- Review target tree: `bab81dd1ddd0b828bdee0080513ad4b92ce8e543`
- Prior security report: commit `8b2da2f88d38872ded14bc18b739c6586ec47336`, read with Git object access
- Normative sources: HUMAN-004 at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`; architecture and ADRs at `f148567d716c00d7a24783318c8d6d7031492e7b`; approving architecture review at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6`

## Outcome

- Verdict: **changes-required**.
- Atomic application: this one verdict applies to both `(TASK-056, security, round 1)` and `(TASK-049, security, round 2)`. A split outcome is not recorded.
- Integration decision: **integration is not allowed**.
- Activation decision: the `implementationSecurityReview` member **may not be produced**.
- Risk acceptance: none was found, requested, created, or relied upon. This task does not accept risk.
- Independence: TASK-056 was authored by `devops` / `claude`; this assessment was performed by `security` / `gpt` in a separate execution context and isolated worktree.

The remediation materially improves the executor: it performs real Ed25519 verification, rejects the original plan-substitution and retry-drift exploits, authenticates durable store receipts through verifier ports, proves merged-commit ancestry and `main` containment, binds production-action fields, and validates proof kinds in published-head evidence. It does not establish the upstream authority boundary. Caller-computable activation records, trust roots, policy profiles, manifests, gate/security/integration artifacts, and human-decision records remain sufficient to activate and admit the executor. The exact GitHub permission allowlist, independently trusted revocation result, and complete ruleset evidence are also not represented or enforced. These defects can reach the sole merge call and are release-blocking.

## Review boundary and independent threat model

The attacker and failure model includes a compromised or mistaken release-control caller, an injected observation or merge adapter, a forged or nonexistent immutable-artifact label, a caller-generated Ed25519 key pair, a revoked attestor key, an overprivileged GitHub App profile, incomplete or permission-redacted GitHub policy observations, a malicious evidence producer, a tampered durable store, policy/base drift during retry, and an ambiguous GitHub response.

Protected assets are `main`, the exact integration head and tree, all seven aggregate release gates, blocking-security evidence and human acceptances, the required-check universe and publishers, the activation record and every member, the policy profile and trust root, the two-phase published-head evidence, durable intent/authorization/attempt/outcome history, and the terminal `branch_integrated` evidence.

Git identities were re-derived rather than inherited:

- `git merge-base d63864bcb25fc8897b21c09f8f687e390f85808d 85f5d265c888f899332a99b15a7d9c8aa959be00` returned the stated base.
- The target has sole parent `9fb2eb0ca7c02101fd067452824e2612fda5cc0c`; the remediation-only range contains one commit.
- The cumulative review range contains three commits, changes all 39 module paths, and reports 39 files with 16,764 insertions and no deletions.
- The remediation-only range changes 26 paths. Standard Git reports 5,638 insertions and 641 deletions across the text-counted paths; `gate-admissibility.ts` is binary-classified because it contains literal NUL bytes.
- The complete target module contains 39 paths. Both cumulative and remediation path residue outside `scripts/release/integration-merge/**` are empty.

## Fresh findings

| ID | Severity | Responsible owner | Summary |
|---|---|---|---|
| F-058-01 | Critical | devops | Configuration can still manufacture an activated authority because activation records, member producers, artifact commits, and the trust root are not authenticated or dereferenced. |
| F-058-02 | Critical | devops | The signed policy boundary does not enforce the approved permission allowlist, model complete ruleset source evidence, bind `policyDigest` to policy bytes, or obtain revocation from an independent trusted status authority. |
| F-058-03 | Critical | devops | Release manifests, snapshots, integration evidence, accepted-risk records, and production decisions remain caller-computable labels rather than authenticated immutable authority. |
| F-058-04 | Medium | devops | Published-head phase separation compares unauthenticated producer strings; PR 33's complete bundle was produced by one execution. |
| F-058-05 | Medium | devops | Literal NUL delimiters both hide an admission-source line diff and permit distinct accepted identifiers to collide in composite sort keys. |

### F-058-01 - Activation authority remains self-authenticating

Severity: **Critical**
Responsible owner: **devops**

Evidence:

- `scripts/release/integration-merge/activation.ts:109-135` validates producer labels and an OID-shaped authorization value, but it has no authorized-producer resolver or signature check.
- `activation.ts:138-220` validates gate and artifact member shape. `activation.ts:323-445` validates cross-field equality and distinct caller-provided strings.
- `activation.ts:447-465` accepts a caller-computable `selfDigest` as the activation record's own identity; it does not dereference `recordSource.commit:path`, compare Git object bytes, or authenticate the issuer.
- `admission.ts:424-484` consumes the syntactically activated record and caller-supplied profile bytes without an authenticated artifact resolver.
- An independent residual probe constructed the complete activation and admission input with a caller-generated Ed25519 key, self-digests, and OID-shaped nonexistent commits. `validateActivation` returned `activated` and `admit` returned `admitted`. Git object checks confirmed that all nine supplied commits were absent, including activation commit `3d530fc189e57481313b32a935c37a338051154b`, and that `85f5d265:docs/fixtures/merge-executor-activation-record.json` was absent.

Impact: a caller can create its own activation, key authority, policy profile, gate members, and injected-port identity and reach admission without any independently published activation artifact. Landing code is dormant by default, but configuration alone can activate it.

Required remediation: resolve the activation record from an authenticated immutable source; verify its real commit, path, bytes, digest, and authorized-human issuer; dereference every member and verify its exact kind, gate, lineage, target, round, producer, and authorization; bind the broker/port identity to an independently authenticated negative-capability attestation; reject nonexistent or unresolvable Git objects.

**This Critical finding blocks delivery until resolved or formally accepted by an authorized human. TASK-058 records no acceptance and does not accept the risk.**

### F-058-02 - Policy identity, completeness, and revocation are not independently authoritative

Severity: **Critical**
Responsible owner: **devops**

Evidence:

- `scripts/release/integration-merge/policy-control.ts:52-110` correctly hashes canonical bytes and performs real Ed25519 verification against supplied SPKI key material. `policy-control.ts:388-453` also binds repository, ref, PR, head, base, phase, and exact configured App records.
- The trust root used by that verification is itself accepted through F-058-01's unauthenticated activation record.
- `contracts.ts:587-611` represents classic protection, parent/repository ruleset enumeration, effective-control evaluation, bypass completeness, and pagination primarily as booleans. It carries no enumerated ruleset records, source levels/conditions/versions/rules, raw-response digests, or independently derived effective-control result from which those booleans can be verified.
- `policy-control.ts:455-475` checks that `policyDigest` and `sourceEvidenceDigest` look like digests and recomputes `canonicalPayloadDigest`, but never recomputes `policyDigest` from `attestation.policy` or binds `sourceEvidenceDigest` to observed source bytes.
- `policy-control.ts:559-626` accepts `issuerStatus` from inside the payload signed by the same key whose active/revoked state it asserts. A revoked or compromised key can sign a fresh statement that it is active; there is no separately authenticated online status response or independent resolver.
- `admission.ts:1140-1220` accepts any nonempty permission map whose values are `read`, `write`, or `admin`. It never requires exactly Contents read/write, Pull requests read, Checks read, Commit statuses read, and Metadata read or rejects every forbidden permission name/level. The target's admitted fixture at `tests/helpers/fixtures.ts:205-218` omits Commit statuses and Metadata entirely and is still the success fixture.

Impact: even if activation provenance were repaired, the module could authorize an overprivileged or under-specified executor profile, a signed but semantically incomplete ruleset observation, a caller-labelled policy digest, or a revoked signer's self-declared active status.

Required remediation: encode and enforce the literal permission allowlist and forbidden permissions independent of a supplied profile; authenticate the profile/trust root through F-058-01's required boundary; bind policy and source digests to canonical observed bytes; enumerate and validate every applicable classic/parent/repository ruleset and effective rule; and verify key/issuer status through an independently trusted online revocation response that the signing key cannot self-assert.

**This Critical finding blocks delivery until resolved or formally accepted by an authorized human. TASK-058 records no acceptance and does not accept the risk.**

### F-058-03 - Release and human authority artifacts remain caller-computable

Severity: **Critical**
Responsible owner: **devops**

Evidence:

- `scripts/release/integration-merge/admission.ts:135-178` treats OID-shaped commits, nonempty paths, SHA-shaped digests, and producer labels as provenance; it has no artifact resolver or authenticated producer boundary.
- `admission.ts:392-418` binds caller-supplied manifest bytes to a caller-supplied digest, not to bytes resolved from the named Git object.
- `admission.ts:543-633` recomputes gate, security, and integration digests over caller-supplied sets but does not resolve the named source commits/paths or independently enumerate their universe.
- `gate-admissibility.ts:109-145` validates relation syntax and an OID shape. Accepted-risk verification in `gate-admissibility.ts:259-324` validates fields and a caller-computable scope digest, but does not authenticate the decision artifact or human principal.
- `admission.ts:1227-1281` now binds a production authorization to exact repository, policy commit, release head, action, and scope. It still accepts a syntactically human principal and nonexistent decision/authorization commits without artifact dereference or human authentication.
- A residual probe supplied a fully self-consistent fabricated production decision with nonexistent decision commit `ee8023ecbbb70b8551eabf49c381f22fbd8a889d` and path `plans/decisions/HUMAN-00X.md`; admission returned `admitted`. The full fabricated valid scenario under F-058-01 likewise admitted nonexistent manifest, gate, security, integration, and profile artifact commits.

Impact: a caller can manufacture the evidence universe that says gates pass, no blocking finding exists or that a human accepted it, the integration lineage is complete, and a production action is authorized. Digest recomputation prevents inconsistent objects, not forged authority.

Required remediation: resolve every authority artifact from an authenticated immutable store or Git object boundary; verify commit/path/bytes/digest and authorized producer; independently enumerate the full gate, security, check, and integration-unit universe; authenticate human acceptance/production decisions; reject all unresolved or nonexistent artifact references.

**This Critical finding blocks delivery until resolved or formally accepted by an authorized human. TASK-058 records no acceptance and does not accept the risk.**

### F-058-04 - Two-phase producer identities are not authenticated

Severity: **Medium**
Responsible owner: **devops**

Evidence:

- `scripts/release/integration-merge/published-head-evidence.ts:110-143` requires only nonempty producer role and session strings.
- `published-head-evidence.ts:390-438` joins and compares those self-asserted strings; no signature, authenticated execution identity, or trusted producer registry is consulted.
- `published-head-evidence.ts:583-653` correctly requires the three exact heads, zero later commits, proof-kind records, and distinct declared phases, but the phase identity proof remains self-asserted.
- PR 33 comment `5225006265` explicitly states that author and control phases were produced by the same devops agent execution and that separation was temporal/functional rather than a separate credentialed principal. Independent reconstruction accepted the bundle as `complete` when two unauthenticated labels were supplied from one process.

Impact: one compromised producer can mint both phases, choose distinct session strings, recompute every self-digest, and satisfy the separation check.

Required remediation: bind each phase to a distinct authenticated producer/session identity from independent execution evidence, and verify those credentials before accepting the bundle. Self-declared role/session strings are not an identity boundary.

### F-058-05 - Literal NUL delimiters create canonicalization and review hazards

Severity: **Medium**
Responsible owner: **devops**

Evidence:

- `scripts/release/integration-merge/gate-admissibility.ts:71-72,97-99` contains eight literal NUL bytes in composite sort keys; `published-head-evidence.ts:396` contains one.
- Byte inspection found gate-file offsets `2610,2623,2669,2736,2750,2797,3733,3803` and published-evidence offset `13093`. The first gate-file NUL is within Git's binary-detection window. Standard and `--text` `git diff --numstat` both report `-/-` for that security-critical file, and ordinary Git/PR line-diff review treats it as binary.
- The validation permits NUL inside `lineage`, `gate`, `findingId`, producer role, and session strings (`gate-admissibility.ts:109-145`; `published-head-evidence.ts:136-142`). An independent probe submitted two distinct relations with no validation defect whose joined sort keys were equal. Reversing their order changed `aggregateGateSnapshotDigest` from `c688fe16ac61b73a80456cf95f3417bea30ce7feed8574ed616231bbf62accc2` to `4a5277a564462fee821f3ca487a88638a52e364fd5c88d066a99c828f2826f2`.

Impact: the function described as an order-independent set digest is order-dependent for accepted hostile identifiers, enabling representation ambiguity. Binary classification also hides a security-sensitive admission-path line diff from normal review.

Required remediation: reject control characters in external identifiers and sort structured tuples component by component or use unambiguous length framing. Keep source text free of literal NUL bytes and add adversarial permutation tests.

## Round-1 finding dispositions and reproduced probes

All probes below were executed against `85f5d265c888f899332a99b15a7d9c8aa959be00`; none was inferred from the remediation diff. `F-053-*` findings were neither assessed nor dispositioned.

| Round-1 finding | Disposition | Reproduced result and target evidence | Residue |
|---|---|---|---|
| F-054-01 | **partially resolved** | A non-Ed25519 signature now returned `PolicyAttestationInvalid`; an App map augmented under the pinned fixture returned `PolicyAttestationInvalid`. Real verification is at `policy-control.ts:52-110,350-372`, and exact equality with the supplied expected Apps is at `:434-453`. However the admitted profile omits required permissions, arbitrary profile permission keys are accepted at `admission.ts:1140-1220`, completeness is boolean-only at `contracts.ts:587-611`, and status is self-signed at `policy-control.ts:559-626`. | F-058-01 and F-058-02 |
| F-054-02 | **partially resolved** | The executor-produced activation member returned `AuthorityNotActivated`; the profile artifact/effective-digest mismatch returned `AuthorityNotActivated` (`activation.ts:109-220,390-402`). A complete fabricated record with nonexistent commits nevertheless returned `activated`, then `admitted`, because `activation.ts:447-465` self-authenticates caller bytes. | F-058-01 |
| F-054-03 | **partially resolved** | The one-check probe returned `RequiredCheckMissing`; contradictory authoritative relations returned `PreMergeGateOpen`; the caller-recomputed truncated lineage returned `IntegrationEvidenceIncomplete`. Exact digest and ambiguity checks are at `admission.ts:496-633` and `gate-admissibility.ts:148-236`. The same sets are still accepted when all caller-controlled source labels and digests are recomputed consistently, with no authoritative resolver. | F-058-03 and F-058-05 |
| F-054-04 | **resolved** | Substituting `expectedTreeOid` while retaining the admitted idempotency key returned `IntentReceiptInvalid` with zero merge calls. The supplied plan digest and key are recomputed and compared at `execute.ts:84-145,280-300,880-908`. | None |
| F-054-05 | **resolved** | Changing the protected base before retry returned `BaseOidMismatch` after one merge call and made no second call. Letting the authorization expire returned `PolicyAttestationStale` after one call. Every attempt records first, revalidates, and reacquires authorization at `execute.ts:1074-1142`; retry head/base drift is refused at `:1320-1340`. | None |
| F-054-06 | **resolved** | A forged terminal store record returned `IntentReceiptInvalid` with zero merge calls. A merged result not reachable from `main` returned `ResultUnverifiable` after one call. Plan-bound receipt checks are at `execute.ts:280-300,880-938`; tree, parent, reachability, and containment checks are at `:157-227`. | None |
| F-054-07 | **partially resolved** | The old unbound decision returned an unclassifiable human exception; wrong head/policy/repository/scope variants refuse, while the exact bound case admits and an uncoupled merge records no irreversible-production coupling (`admission.ts:840-881,1227-1281`). A fabricated but self-consistent nonexistent human decision still admitted. | F-058-03 |
| F-054-08 | **partially resolved** | A fully resealed same-producer bundle returned `PublishedHeadEvidenceMismatch`; incomplete/wrong proof-kind bindings refuse (`published-head-evidence.ts:293-387,583-653`). A one-process bundle with different unauthenticated role/session labels returned `complete`, matching PR 33's same-execution disclosure. | F-058-04 and F-058-05 |

## Scope judgments

| Required security scope | Judgment | Evidence |
|---|---|---|
| Short-lived one-repository credential stays outside the executor; only an opaque, confined broker client is injected and authenticated | **not met** | No raw token or credential-loading path exists in target source, which is positive. The sole injected merge port is narrow (`contracts.ts:1157-1192`; `merge-port.ts:32-49`), but its identity is authorized through the forgeable activation boundary (`activation.ts:223-265,323-465`; F-058-01), and live credential isolation is unexecuted. |
| Exact release-App permission allowlist and no Administration/Actions/Environments/Deployments/Secrets/Issues/policy/check/status-write/bypass power | **not met** | `admission.ts:1140-1220` accepts arbitrary permission names and levels; the success fixture at `tests/helpers/fixtures.ts:205-218` omits Commit statuses and Metadata. F-058-02. |
| Canonical digest, real Ed25519, exact subject, freshness/margin, independent revocation, complete classic/parent/repository rulesets, and non-redacted bypass sets | **not met** | Canonical signature, exact subject, freshness, and `bypassActorsComplete === true` are implemented at `policy-control.ts:52-110,388-453,477-496,589-636`. Policy/source digests, detailed ruleset evidence, and independent revocation are absent at `:455-475,559-626` and `contracts.ts:587-611`. F-058-02. |
| Authenticated activation artifact and every member dereferenced/bound; configuration alone cannot activate | **not met** | Cross-field and provenance shape checks exist at `activation.ts:109-220,323-445`, but the record self-digest at `:447-465` and all OID-shaped references are caller-computable. The fabricated activation/admission probe succeeded. F-058-01. |
| Authoritative manifest/gate/security/check/acceptance/integration evidence and independently complete universes | **not met** | `admission.ts:392-633` recomputes supplied bytes but never resolves named artifacts; human decisions are syntactic at `:1227-1281`. F-058-03. |
| Immutable admitted plan and retry authorization cannot outlive exact base/checks/activation/policy | **met** | Canonical plan digest and key verification at `execute.ts:84-145,280-300,880-908`; complete fresh revalidation at `:342-451,939-1050`; per-attempt record and authorization at `:1074-1142`; drift refusal at `:1320-1340`. Both round-1 probes refused before a second call. |
| Durable intent/receipt/reconciliation resist tampering and replay; merged success is reachable from and contained by `main` | **met** | At the module boundary, authenticated store/verifier contracts are at `contracts.ts:1060-1150`; receipt/history validation at `execute.ts:280-300,880-938`; intent before mutation at `:939-1050`; ancestry and containment at `:157-227`; reconciliation before retry at `:899-938,1140-1338`. The target remains dormant, so no live store was exercised. |
| Exactly one path to `main`, only the exact-head PR merge API | **met** | Structurally, the operation list has only `mergeIntegrationPullRequestIntoMain` at `merge-port.ts:32-49`; the sole call is `execute.ts:1140-1142`. Static source scan found no second main path, generic HTTP, Git ref update, process spawn, or environment credential read. The authorization feeding this path is unsafe under F-058-01 through F-058-03. |
| Production-action authorization exact binding, while uncoupled `main` merge is not classified as irreversible production | **not met** | Exact repository/policy/head/action/scope binding and correct uncoupled behavior exist at `admission.ts:840-881,1227-1281`, but the decision artifact and human identity are not authenticated; the fabricated decision admitted. F-058-03. |
| Two-phase published-head evidence has distinct authenticated producer/session identities and proof-kind/command binding | **not met** | Proof kinds and exact facts are validated at `published-head-evidence.ts:293-387,583-653`; producer strings are only nonempty and compared at `:110-143,390-438`. F-058-04/F-058-05. |
| No committed secret, credential, private key, token, or production-sensitive value | **met** | `scripts/security/check-repository.ps1` passed at the exact target; manual target/range review found only generated ephemeral test keys and public SPKI fixtures, not committed private key material or credentials. This report contains no secret value. |
| Dormancy with any absent, mutable, unpinned, or executor-produced activation member causes no merge side effect | **met** | `activation.ts:323-385` refuses the stated defective members; `DormantReleaseMergePort` performs no I/O at `merge-port.ts:52-65`. The suite executed the per-member no-side-effect cases. A syntactically complete but unauthenticated record can still activate, which is separately not met under F-058-01. |

## HUMAN-004 prohibited capabilities

1. **Author, approve, close, override, or formally accept a gate: not met.** No gate-write operation exists, but fabricated gate/security/accepted-risk artifacts are indistinguishable from authority at `admission.ts:543-633` and `gate-admissibility.ts:259-324` (F-058-03).
2. **Merge while declared pre-merge gates are open or failing: not met.** Explicit open/failing/ambiguous relations refuse, but the caller can manufacture the complete passing relation set and its source labels (F-058-01/F-058-03).
3. **Push directly to `main` or set `ALLOW_MAIN_PUSH`: met for target source.** `merge-port.ts:32-49` exposes only a PR merge request. Static analysis found no direct Git/ref/environment/process capability. The live server negative fixture is unexecuted.
4. **Force-push, bypass hooks or branch protection, use administrator override, or disable a required check: not met.** No explicit force/admin/policy operation exists, but the exact permission/policy controls are not enforceable, the ordinary merge is reachable through fabricated authority, and live bypass/direct/force checks are unexecuted (F-058-01 through F-058-03).
5. **Merge governance or enforcement changes under its own authority: not met.** `protected-paths.ts:10-32,45-71` has the correct fixed protected set, but changed paths and their immutable source universe enter through the unauthenticated release evidence boundary (F-058-03).
6. **Release another execution's lock or modify task ownership to make a merge admissible: met for target source.** The exposed module ports at `contracts.ts:1038-1320` and the only mutation operation at `merge-port.ts:32-49` contain no task or lock mutation.
7. **Use a mutable branch head where an immutable commit is required: not met.** Full OID shape and exact-head request binding exist (`merge-port.ts:40-49`; `published-head-evidence.ts:603-621`), but OID-shaped nonexistent activation and authority artifacts are accepted and producer identity is self-asserted (F-058-01/F-058-03/F-058-04).
8. **Treat a missing, skipped, timed-out, or cancelled check as passing: not met.** `required-checks.ts:65-113` correctly rejects these states for the declared pinned set, but an unauthenticated profile can define that set and the live failing-check fixture is unexecuted (F-058-01/F-058-02).

Because six of eight prohibitions are not met, this set cannot support a passing security verdict.

## Executor-reachable capability statement

| Capability | Re-derived result at target |
|---|---|
| Obtain a raw credential | **No source-level path found.** The module has no environment, token, filesystem-secret, generic network, or credential-returning API. Active broker isolation is not proven because its attested identity is accepted through F-058-01 and the live fixture is unexecuted. |
| Construct an arbitrary request | **No.** The only mutation request constructor fixes `main`, exact head, PR number, merge method, and idempotency key at `merge-port.ts:40-49`. No generic HTTP client is imported. |
| Observe policy | **No direct executor policy-observation port.** Policy enters as a signed input through `policy-control.ts`; the observation completeness and source authority are insufficient under F-058-02. |
| Mutate policy | **No source-level mutation operation.** No Administration, ruleset, branch-protection, check/status-write, or attestation-issuance port exists. Live enforcement remains unexecuted. |
| Bypass branch protection | **No explicit bypass endpoint or flag.** However software admission can be bypassed with forged authority and the live repository currently has no branch protection/ruleset on the queried refs, so the HUMAN-004 prohibition is not established. |
| Replay or forge evidence | **Yes.** Activation, release-source, human-decision, and producer identities remain caller-computable (F-058-01, F-058-03, F-058-04). Durable store receipts themselves resisted the reproduced replay probes. |
| Cross approved scope | **Yes.** A caller can select the unauthenticated manifest/snapshot/integration/path universe and make it self-consistent (F-058-03), even though the final transport request remains fixed to `main`. |
| Reach `main` through a second path | **No second source-level path found.** The only call is `execute.ts:1140-1142` through the exact-head PR merge port. That sole path is nevertheless reachable under forged authorization. |

## PR 33 published-head evidence and continuous integration

The `published-head-evidence/v2` comment was read from PR 33 comment ID `5225006265` and independently decoded without importing the target serializer.

- The Base64 payload was 5,480 characters; gzip bytes were 4,109 bytes with SHA-256 `3f99787fb1c7861532aa67e53fe0643249f76b5ca597db36eab6a601feadab6c`; JSON bytes were 26,334 bytes with SHA-256 `817bc4af743c12cfa64329e7e714fdf9133aa5222b779136fd02f53cf5d4ffb5`.
- Independent canonical serialization matched the raw JSON bytes.
- Declared, independently recomputed, and control-bound author digest all equal `31047b59bbb849fcdf0c3a9430b032e772bd786b1004814f0c2a3744f8ffb9bf`.
- Declared and independently recomputed bundle digest both equal `625270fe5c07e0408c76511ae59b760f11c4ffcb16b929ead2d008062dfbdd95`.
- All 15 command evidence IDs recomputed exactly. Local, remote, and PR heads equal the target and all three after-target counts are zero. The two exact-head checks are present and successful.
- Declared producer identities are `devops|task-056-author-pre-publication` and `devops-control|task-056-control-post-publication`. The comment discloses that both phases came from the same devops agent execution. The structure is complete, but security independence is not authenticated (F-058-04).

Read-only live queries at assessment time returned:

- PR 33: `OPEN`, not draft, base `integration/autonomous-runtime`, head branch `agent/claude/devops/task-056`, exact head `85f5d265c888f899332a99b15a7d9c8aa959be00`, `MERGEABLE` / `CLEAN`.
- `git ls-remote origin refs/heads/agent/claude/devops/task-056`: exact target.
- Exact-head check runs: `security`, run ID `93071521383`, GitHub Actions App ID `15368`, completed/success at `2026-08-08T06:49:59Z`; `validate`, run ID `93071521297`, same App, completed/success at `2026-08-08T06:50:05Z`.
- Legacy combined status: `pending`, `total_count: 0`, no contexts. No success was inferred from this empty rollup.
- Classic branch protection for both `main` and `integration/autonomous-runtime`: HTTP 404, `Branch not protected`.
- Repository rulesets including parents: HTTP 200 with count zero.
- Repository merge methods: merge, squash, and rebase all enabled.

The exact-head workflow runs are valid CI evidence for the target, but they are owner-side checks, not this threat model and not proof of live control-plane confinement.

## Executed and unexecuted fixtures

`scripts/release/integration-merge/run-tests.ps1` executed at the exact target with Node `v26.4.0`: 522 tests, 511 passing, zero failing, zero cancelled, zero skipped, and 11 TODO/unexecuted. Exit code was zero. The runner's final diagnostic labels the TODO details as failing tests, but the TAP totals and source identify them as TODO; none is recorded as passing.

The following 11 fixtures at `tests/live-control-plane.blocked.test.ts:53-140` remain **unexecuted and never passing**:

1. `live-protected-branch/failing-check-blocks`
2. `live-protected-branch/no-bypass`
3. `live-protected-branch/release-scope`
4. `live-protected-branch/task-scope`
5. `live-protected-branch/direct-push-fails`
6. `live-protected-branch/force-push-fails`
7. `live-attestor/credential-isolation`
8. `live-attestor/no-administration-endpoint`
9. `live-attestor/no-policy-mutation`
10. `live-attestor/no-revocation-suppression`
11. `live-attestor/attestor-cannot-merge`

The read-only GitHub observations above truthfully confirm that the required protected-branch/ruleset control plane is absent. No credential, App, protection, ruleset, attestor, evidence store, or policy state was provisioned, requested, configured, or simulated.

## Verification

| Command or method | Result |
|---|---|
| `./scripts/orchestration/validate-assignment.ps1 -Role security -Llm gpt` | Passed; assignment valid for `security` / `gpt`. |
| `git merge-base HEAD integration/autonomous-runtime` | `754d66a0f73b6405e3a81101e8c24302581c2ebc`. |
| Git object identity, ancestry, tree, path, `diff --stat`, `diff --numstat`, and residue checks for base/parent/target | Passed; immutable identifiers and counts recorded above; no out-of-module target residue. |
| Prior report and all normative sources via `git show <exact-commit>:<path>` | Read at the exact identifiers in Identity. |
| Independent Node/TypeScript probes for F-054-01 through F-054-08 and the residual activation, authority, producer, and NUL cases | Results recorded in the disposition and finding sections. No live side effect was used. |
| `./scripts/release/integration-merge/run-tests.ps1` at the exact target | Exit 0; 522 tests, 511 pass, 11 TODO/unexecuted, zero fail/cancelled/skipped. No merge was performed, requested, or simulated. |
| `./scripts/ci/validate-framework.ps1` at the exact target | Passed for 13 roles. |
| `./scripts/ci/test-orchestration.ps1` at the exact target | Passed. |
| `./scripts/ci/test-check-run-evidence.ps1` at the exact target | Passed, 82 assertions; expected invalid-input diagnostics remained fail-closed. |
| `./scripts/security/check-repository.ps1` at the exact target | Passed. |
| `git diff --check d63864b... 85f5d265...` and `git diff --check 9fb2eb0c... 85f5d265...` | Both exited 0. |
| Static capability/import review of all 39 module paths | Found one merge method/call, no second main path, no generic HTTP/Git-ref/process/environment credential capability. |
| Read-only `gh pr view`, exact-head check-runs/status, branch-protection, ruleset, repository-method, PR-comment, and `git ls-remote` queries | Results recorded above; no empty rollup treated as success and no state changed. |
| `./scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef 754d66a0f73b6405e3a81101e8c24302581c2ebc` | Passed: `valid: True`; only this report is in task scope. |

## Risks and handoff

- Unresolved blockers: F-058-01, F-058-02, and F-058-03 are Critical and block delivery. F-058-04 and F-058-05 are Medium residue that must also be remediated or explicitly dispositioned by a later independent security round.
- Work explicitly outside this role: no implementation, task, governance, review/QA report, credential, policy, control-plane, PR approval, PR merge, or risk-acceptance action was performed.
- Required next owner: Orchestrator under TASK-013 to route the findings to the `devops` implementation owner. Any necessary normative contract change must be routed to the Architect. A new independent Security round must validate remediation.
- Task lock released: **no**; TASK-058 remains held for the controlling session as instructed.
