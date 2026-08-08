# TASK-061 Security Revalidation of the Release Merge Executor, Round 3

## Identity

- Task ID: `TASK-061`
- Role: `security` (Security Engineer)
- LLM family: `gpt`
- Branch: `agent/gpt/security/task-061`
- Worktree: `C:/Users/furko/Desktop/multi-agent-worktrees/gpt-security-task-061`
- Branch point and scope-validation base: `d7994690b40a4a29218c46b9e0c7bd234a56ceff`
- Immutable review target: `126f2fa9939b8ac6db4764241952dafbda50e9f4`
- Immutable cumulative review base: `d63864bcb25fc8897b21c09f8f687e390f85808d`
- Remediation ancestry base: `85f5d265c888f899332a99b15a7d9c8aa959be00`
- Target tree: `a753658ea3fc5bb3cb8729fb2628133180dfbb80`
- Reviewed publication: pull request 37, `agent/gpt/devops/task-059` into `integration/autonomous-runtime`
- Governance authority: HUMAN-004 at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`
- Normative architecture: `f148567d716c00d7a24783318c8d6d7031492e7b`, approved at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6`
- Prior security rounds: TASK-054 at `8b2da2f88d38872ded14bc18b739c6586ec47336`; TASK-058 at `0a44bb0f6a1405bf49fa536d1149f122f52e4bbb`

The branch, isolated worktree, `security` / `gpt` assignment, installed hooks, and shared TASK-061 lock were verified before editing. The shared lock names this exact task, role, LLM, branch, and worktree, and its session ID matches the ignored local token. The lock remains held for the controlling session.

The target was inspected through Git objects and an exact detached worktree. It was not merged, cherry-picked, copied into this branch, activated, or invoked against a merge service. This execution is separate from TASK-059 and TASK-060 and performs neither the Reviewer nor QA role.

## Outcome

**Verdict: `changes-required`.**

This is one indivisible verdict applied atomically to all three relations in `LIN-RELEASE-EXECUTOR-SECURITY` lineage round 3:

| Relation | Round-3 result |
|---|---|
| `(TASK-059, security, round 1)` | **changes-required; relation remains open** |
| `(TASK-056, security, round 2)` | **changes-required; relation remains open** |
| `(TASK-049, security, round 3)` | **changes-required; relation remains open** |

A split result is not recorded. The release merge executor **may not be integrated**, and the `implementationSecurityReview` activation member **may not be produced**. Three new Critical findings, F-061-01 through F-061-03, block delivery. No risk acceptance exists, was requested, was manufactured, or is recorded by this task.

TASK-059 materially improved the code: it added real source-resolution calls, literal permission checks, independently returned issuer status, authenticated publication-identity records, component-wise tuple sorting, control-character rejection, and a persistent retry-sequence start and absolute deadline. Those mechanisms fail at three trust-boundary points. Most importantly, the same caller-supplied `ReleaseAuthorityPort` identifies and authenticates itself and every object used to authorize admission. The protected-path guard still consumes an unbound path list, and the policy model still accepts Boolean completeness plus opaque rule strings without encoding or verifying the required branch controls. The recurring round-2 defect has moved into injected ports rather than being eliminated.

## Review boundary and threat model

The target is five commits over the immutable cumulative base and two commits over the remediation ancestry base. The cumulative range changes 42 paths, all under `scripts/release/integration-merge/**`; the remediation range changes 29 paths in the same scope. No cumulative or remediation path lies outside the module. A raw-byte scan of all 42 cumulative paths found zero NUL-bearing files. Standard Git reports text numstat for both previously binary-classified sources: `gate-admissibility.ts` is `464/0`, and `published-head-evidence.ts` is `801/0` against the cumulative base.

Protected assets are `main`, the exact integration head and tree, all seven aggregate release gates, blocking-security evidence and human acceptances, required-check identities, the activation record and members, the required policy profile, current policy evidence, published-head identities, durable intent and outcome history, and the terminal release result.

The attacker and failure model includes a compromised or mistaken release-control caller, an arbitrary structurally compatible injected adapter, a forged or nonexistent immutable-artifact label, a caller-generated signing key, a malicious or buggy policy attestor, incomplete GitHub policy observation, a tampered evidence boundary, policy/base drift during retry, and an ambiguous mutation response. Every injected dependency introduced or relied on by the remediation was treated as a separate trust boundary rather than trusted because its TypeScript interface names it authenticated.

## New findings

### F-061-01 - Injected authority and merge-port identities remain self-authenticating labels

- Severity: **Critical**
- Responsible owner: **devops**
- Status: **open**

Evidence at `126f2fa9939b8ac6db4764241952dafbda50e9f4`:

- `contracts.ts:151-171` represents merge and authority identities as caller-readable strings and digests. `contracts.ts:241-268` defines `ReleaseAuthorityPort` as a structurally compatible caller-supplied object with no independent seal, verifier, or construction boundary.
- `activation.ts:435-451` authenticates the resolver only by canonical equality between `negativeCapabilityTestAttestation.attestedAuthorityPortIdentity` and `authority.identity`. The same resolver then authenticates the activation gates, activation record, issuer, artifacts, policy trust root, and its own negative-capability attestation at `activation.ts:508-520,565-608`. The purported independent attestation is therefore inside the resolver's own trust loop.
- `contracts.ts:1431-1445` accepts `mergePort` and `mergePortIdentity` as separate dependency fields. `execute.ts:435-443` compares the attested identity only with the separate label, then `execute.ts:1223-1224` invokes the unrelated `mergePort` object. No code binds that concrete function implementation to the compared identity.
- The committed test authority states that it "provisions no Git object, identity, credential, policy, control plane, or store" at `tests/helpers/fixtures.ts:1231-1234`, constructs its resolution map from the caller's input at `:1235-1318`, and is injected into the production `admit` function by `tests/helpers/admission.ts:11-18`. The committed `admission-success.test.ts:27-35` expects that caller-built boundary to return `admitted`.
- Executing the committed success and TASK-059 remediation fixtures at the exact target produced 20/20 passes, including **`the seven-domain release success fixture is admitted`**. The F-058-01 remediation tests cover only a null resolver and a resolver that returns `null` for one source (`task-059-remediation.test.ts:152-175`); they do not cover a structurally compatible resolver that returns a fully fabricated, internally consistent authority universe. Production code has no way to distinguish that object from the fixture.

Impact: a compromised release-control caller can provide matching identity labels, resolve its own fabricated activation record, passing gates, trust root, human principals, authority universe, revocation status, and execution identities, and pair the labels with an arbitrary merge-port implementation. The sole call site can then be reached without an independently authenticated authority source or a proven least-privilege broker. This preserves the core F-058-01/F-058-03/F-058-04 forgery shape and can also undermine F-058-02's trust root.

Required remediation: establish a composition root or nominal capability that the release-control caller cannot construct; authenticate the resolver and concrete merge client independently of the resolver being validated; bind the negative-capability evidence cryptographically to the actual callable implementation and broker instance; and add the exact round-2 combined counterexample with a malicious same-identity resolver and port. A resolver must not be allowed to authenticate the evidence that declares that resolver trustworthy.

**This Critical finding blocks delivery until resolved or formally accepted by an authorized human. TASK-061 records no acceptance and does not accept the risk.**

### F-061-02 - Protected-path admission trusts an unauthenticated caller-supplied path list

- Severity: **Critical**
- Responsible owner: **devops**
- Status: **open**

Evidence at `126f2fa9939b8ac6db4764241952dafbda50e9f4`:

- `contracts.ts:219-235` defines the authenticated admission universe but omits the pull-request changed-path set and any immutable diff artifact.
- `admission.ts:614-649` compares the caller's gates, findings, integration evidence, checks, and publication command IDs with the authority universe, but performs no comparison for `changedPaths`.
- `contracts.ts:1175-1193` places `changedPaths` in `ReleaseAdmissionFacts`, and `contracts.ts:1351-1365` obtains those facts only through the injected `ReleaseObservationPort`. That port has no identity in the negative-capability attestation and no authenticated changed-path receipt.
- `admission.ts:1280-1292` asks `findProtectedPathChanges` only about `input.changedPaths`. It never derives the set from the pinned PR head/base or verifies that the list is complete.
- The committed path tests at `tests/required-checks-and-paths.test.ts:157-169` prove only that a protected value is rejected when the caller includes it. No committed test proves that the input list equals the immutable PR diff.

Impact: an observation adapter or compromised caller can omit `AGENTS.md`, role contracts, workflow, hook, orchestration, settings, or other governance/enforcement paths from `changedPaths`. The exact same head can then pass the protected-path check and reach the release plan despite containing a HUMAN-004-prohibited governance or enforcement change.

Required remediation: resolve the complete changed-path set from an authenticated immutable Git/PR boundary keyed by the exact base and head OIDs; include its canonical bytes and digest in the authority universe and admission context; reject pagination, rename, deletion, or completeness ambiguity; and add a counterexample in which the supplied list omits a protected path present in the authenticated diff.

**This Critical finding blocks delivery until resolved or formally accepted by an authorized human. TASK-061 records no acceptance and does not accept the risk.**

### F-061-03 - The policy profile and validator do not encode or verify required branch-protection semantics

- Severity: **Critical**
- Responsible owner: **devops**
- Status: **open**

Evidence at `126f2fa9939b8ac6db4764241952dafbda50e9f4`:

- `contracts.ts:303-316` defines `RequiredGitHubPolicyProfile` with check contexts, release-gate floors, App identities, an observer-set digest, and merge methods. It has no required fields for pull-request-only updates, strict current-base enforcement, administrator enforcement, force-push/deletion prohibition, review requirements, or an empty effective bypass set.
- `contracts.ts:692-719` retains `classicProtectionComplete`, `rulesetEnumerationComplete`, and `effectiveControlEvaluationComplete` as Booleans. Policy conditions are `Record<string,string>` and rules are unparameterized strings at `contracts.ts:721-743`, so required GitHub rule parameters cannot be represented or evaluated.
- `policy-control.ts:523-530` compares the attestor-declared `effectivePolicyProfileDigest` directly with the pinned profile digest but does not derive that digest from a normalized effective-control evaluation. `policy-control.ts:539-655` checks the completeness Booleans and derives `effectiveRules` by treating every `active` source as effective; it does not evaluate source conditions against `refs/heads/main` or prove the HUMAN-004 control set.
- The committed success profile at `tests/helpers/fixtures.ts:277-287` omits all of those branch-control requirements. Its signed policy at `:1038-1080` contains only opaque `required_checks`, `pull_request`, and `signed_commits` rule strings plus the three completeness Booleans. Executing `admission-success.test.ts:27-35` at the exact target nevertheless returned `admitted`.

Impact: even with a genuinely signed attestation, a buggy or compromised attestor can label an incomplete or non-applicable policy view complete and copy the pinned digest into `effectivePolicyProfileDigest`. The executor cannot independently determine that `main` is pull-request-only, strict, administrator-enforced, non-force-pushable, non-deletable, and free of bypass actors. The current live repository has no branch protection or rulesets, making this missing semantic check directly relevant to activation safety.

Required remediation: make the immutable required profile encode every mandatory semantic control; represent full classic-protection and ruleset rule parameters and applicability; independently derive the normalized effective evaluation and its digest from the signed enumerated observations; compare it with the pinned profile; and add signed counterexamples for each missing, weakened, non-applicable, and permission-redacted control.

**This Critical finding blocks delivery until resolved or formally accepted by an authorized human. TASK-061 records no acceptance and does not accept the risk.**

## Prior security finding dispositions

No `F-053-*` or `F-057-*` finding is dispositioned here. Those identifiers belong to the independent Reviewer lineage. Their committed regression tests were executed only as defensive evidence for the Security scope.

### Round-2 findings

| Finding | Disposition | Reproduced result and exact-target evidence | Residue |
|---|---|---|---|
| F-058-01 | **partially resolved** | Null resolver and unresolvable activation record returned `AuthorityNotActivated`; real artifact/member calls exist at `activation.ts:508-608`. The committed combined success fixture still returned `admitted` with a caller-built resolver that provisions no real object or control plane, because resolver identity is only self-equal (`activation.ts:435-451`). | F-061-01 |
| F-058-02 | **partially resolved** | Missing `metadata`, added `administration`, truncated policy sources, and independently returned `revoked` status all refused in the executed TASK-059 fixtures. Literal permission confinement is at `policy-control.ts:299-337`, policy/source digest recomputation at `:510-522`, and issuer-status comparison at `:727-771`. The trust root/status resolver remains inside F-061-01's self-authenticating boundary, and required policy semantics remain absent under F-061-03. | F-061-01 and F-061-03 |
| F-058-03 | **partially resolved** | Narrowed gates and substituted producer returned `SourceRecordInvalid`; unresolvable production authorization returned one unclassifiable exception; unresolvable accepted risk returned `SecurityRiskAcceptanceInvalid`. The authority universe and resolution calls are present at `admission.ts:614-780,1030-1041,1099-1139`. The universe is supplied by F-061-01's self-authenticating resolver and omits the immutable changed-path universe under F-061-02. | F-061-01 and F-061-02 |
| F-058-04 | **partially resolved** | The one-process relabel fixture returned `SourceRecordInvalid`; authenticated phase equality/inequality checks are at `admission.ts:886-957`. Every authenticated execution identity is nevertheless returned by the same self-authenticating authority resolver. | F-061-01 |
| F-058-05 | **resolved** | The executed collision fixture rejected the control-bearing relation and produced the same digest in forward and reverse order. `canonical-json.ts:212-235` rejects controls and compares tuples component-wise; raw-byte inspection found zero NULs in all 42 cumulative paths, and both formerly binary sources have normal text numstat. | None |

The exact round-2 attack family was executed through committed tests, not reconstructed as new tooling. The success fixture constructs a real runtime-derived Ed25519 signature, caller-computed self-digests, OID-shaped activation/member labels, a signed active issuer claim, a caller-built authority universe, and a two-phase publication bundle; it returned `admitted`. The more focused TASK-059 tests then demonstrated that null or selectively failing resolvers refuse. The difference is the unresolved finding: a malicious resolver that returns consistent data is accepted because it is also the source of its own authentication.

### Carried round-1 findings

| Finding | Disposition | Re-derived exact-target result | Residue |
|---|---|---|---|
| F-054-01 | **partially resolved** | Real Ed25519, exact literal App permissions, policy/source digests, and status comparison work for the supplied boundaries. Independent trust-root/resolver authenticity and mandatory control semantics do not. | F-061-01 and F-061-03 |
| F-054-02 | **partially resolved** | Missing, malformed, executor-produced, and selectively unresolvable members remain dormant. A caller-built resolver can still authenticate a complete fabricated activation and can pair an arbitrary merge port with a matching separate identity label. | F-061-01 |
| F-054-03 | **partially resolved** | Digest-recomputed narrowed gates/checks/integration evidence refuse when the resolver reports the larger universe. That universe is self-authenticating and does not cover the immutable PR changed-path set. | F-061-01 and F-061-02 |
| F-054-04 | **resolved; remains resolved** | The executed original plan-substitution counterexample returned `IntentReceiptInvalid` with zero merge calls. Canonical plan equality and key recomputation remain at `execute.ts:260-277,396-432`. No regression found. | None |
| F-054-05 | **resolved; remains resolved** | The executed base-drift and expired-authorization counterexamples refused before a second merge call. Per-attempt revalidation and authorization remain at `execute.ts:1199-1224`; the authenticated absolute deadline is enforced at `:1046-1122,1129-1169`. No regression found. | None |
| F-054-06 | **resolved; remains resolved at the declared store/observation contract** | Forged terminal history, wrong-plan history, unreachable commit, wrong parent order, and unauthenticated policy receipt all refused in the executed original probes. Exact plan/history validation and reachability/parent checks remain at `execute.ts:161-214,731-758`. No logic regression was found; live store and server behavior remain unexecuted. | None |
| F-054-07 | **partially resolved** | Exact repository/policy/head/action/scope fields are enforced, and uncoupled `main` remains non-production. Human-decision authenticity is still returned by F-061-01's self-authenticating resolver. | F-061-01 |
| F-054-08 | **partially resolved** | Proof kinds and distinct phase identities are enforced for returned records, but the identity records all come from the self-authenticating authority resolver. | F-061-01 |

F-054-04, F-054-05, and F-054-06 were re-derived rather than inherited. None regressed in the target logic. F-054-01, F-054-02, F-054-03, F-054-07, and F-054-08 remain partial because their assigned round-2 residues are not all closed.

## Required scope judgments

| Required security scope | Judgment | Exact-target evidence and independent result |
|---|---|---|
| Short-lived one-repository credential remains outside the executor; only an opaque confined broker client is injectable | **not met** | No raw token loader or generic client exists in target source, but the concrete merge port is not bound to its separately supplied identity (`contracts.ts:1431-1445`; `execute.ts:435-443,1223-1224`). F-061-01. |
| Literal release-App allowlist; no Administration, Actions, Environments, Deployments, Secrets, Issues, policy, check/status write, or bypass authority | **not met** | `policy-control.ts:299-337` correctly enforces the literal map for supplied records, and committed negative fixtures passed. The actual injected broker/client is not authenticated as that identity, and live permission/bypass fixtures are unexecuted. F-061-01. |
| Canonical attestation digest, real Ed25519, exact subject, freshness/margin, independent revocation, complete policy enumeration, and non-redacted bypass sets | **not met** | Cryptographic, subject, time, source-digest, enumeration, and returned-status checks exist at `policy-control.ts:78-113,379-833`. Resolver independence fails F-061-01, and required semantic controls/applicability fail F-061-03. |
| Activation record resolved from an authenticated immutable source; members dereferenced and bound; configuration alone cannot activate | **not met** | Resolution calls exist at `activation.ts:508-608`, but the resolver authenticates itself and its own negative-capability evidence. The committed caller-built success boundary returned `admitted`. F-061-01. |
| Manifests, snapshots, integration evidence, accepted risks, and production decisions are authenticated; the complete universe is independently enumerated | **not met** | The resolver compares most supplied sets at `admission.ts:614-780,1030-1041,1099-1139`. It is self-authenticating, and the authenticated universe omits the exact changed-path set. F-061-01/F-061-02. |
| Admitted plan is not substitutable; retry cannot outlive head/base/check/activation/policy or global deadline across restart | **met** | The original substitution, drift, expiry, and restart cases passed fail-closed. `execute.ts:260-277,342-460,1046-1224` binds canonical plan bytes, fresh admission, sequence start/deadline, and each attempt. |
| Durable intent/evidence resist tampering/replay; store receipts authenticate; merged success is reachable from and contained by `main` | **met for the target's declared port contract; live fixture unexecuted** | Executed store and result probes refused forged/mismatched evidence; `execute.ts:161-214,731-940,975-1126` preserves intent-before-mutation, history verification, reconciliation, containment, and parent order. No live evidence store exists. |
| Exactly one path to `main`, and it is the exact-head PR merge API | **not met as an end-to-end security property** | Static tests found one source call and no second source-level mutation path. However the actual callable object is not bound to the attested identity, so the code cannot prove that its implementation performs only the named API request. F-061-01. **No second source-level call site was found.** |
| Production-action authorization binds exact policy commit, head, repository, action, scope, authenticated decision/human; uncoupled merge stays non-production | **not met** | Exact fields and uncoupled behavior pass at `admission.ts:1081-1139,1495-1549`; decision/human authenticity remains inside F-061-01's self-authenticating resolver. |
| Two-phase published-head evidence uses distinct authenticated producers/sessions and distinct proof-command kinds | **not met** | Structural and returned-identity checks exist at `published-head-evidence.ts:353-469` and `admission.ts:886-957`; the same self-authenticating resolver produces every identity. F-061-01. |
| External identifiers reject controls; composite identities use component sorting or unambiguous framing; adversarial permutations are tested | **met** | `canonical-json.ts:212-235`, `gate-admissibility.ts:59-109`, and the executed F-058-05 fixture establish control rejection, tuple ordering, and permutation stability; zero NUL-bearing target paths were found. |
| No committed secret, credential, private key, token, or sensitive production value | **met** | Exact-target `scripts/security/check-repository.ps1` passed. Manual target review found runtime-derived offline fixture keys and public key material only; no committed secret value was found or copied into this report. |
| Dormancy with an absent, unpinned, mutable, or executor-produced member prevents a merge side effect | **met for the enumerated defective-member cases** | Dormancy and round-1 suites passed; `DormantReleaseMergePort` exposes no I/O. A complete caller-fabricated resolver can still cross activation under F-061-01, so this does not satisfy activation integrity. |

## HUMAN-004 prohibited capabilities - individual results

Each result was re-derived at the target. The round-2 two-of-eight ratio was not used as a baseline.

1. **Author, approve, close, override, or formally accept a gate: not met.** No gate-write API exists, but the self-authenticating resolver can present fabricated passing gates, accepted-risk decisions, and human principals as authoritative (F-061-01).
2. **Merge while declared pre-merge gates are open or failing: not met.** Explicit open/failing values refuse, but the same caller-supplied authority boundary determines the complete relation universe and its authenticated passing members (F-061-01).
3. **Push directly to `main` or set `ALLOW_MAIN_PUSH`: met for target source.** Static tests found no Git/ref/environment/process surface, direct push, emergency variable, or second source-level mutation call. The live server fixture is unexecuted.
4. **Force-push, bypass hooks or branch protection, use an administrator override, or disable a required check: not met.** No explicit operation exists, but concrete broker identity is unbound, the required policy does not encode the protection semantics, and current live protection is absent (F-061-01/F-061-03).
5. **Merge governance or enforcement changes under its own authority: not met.** The fixed protected-path matcher is correct, but the complete path list is neither independently derived nor included in the authenticated universe (F-061-02).
6. **Release another execution's lock or modify task ownership to make a merge admissible: met for target source.** Static analysis found no task, ownership, orchestration, filesystem-write, or lock-release operation.
7. **Use a mutable branch head where an immutable commit is required: not met.** OID syntax and exact-head fields are enforced, but the authority resolver can bless caller-derived OID-shaped references and authenticates itself (F-061-01).
8. **Treat a missing, skipped, timed-out, or cancelled check as passing: not met.** The local evaluator correctly rejects every named non-success state, but the trusted check/policy universe is supplied by the self-authenticating authority boundary and its profile omits required branch-control semantics (F-061-01/F-061-03).

Only prohibitions 3 and 6 are met for the target source. Six are not met. A partially satisfied prohibition set cannot support a passing security verdict.

## Executor-reachable capability statement

| Capability | Re-derived result at target |
|---|---|
| Obtain a raw credential | **No source-level path found.** No environment, filesystem-secret, token-returning, or generic network API exists. The live broker isolation property is unexecuted and the broker identity is not bound to the concrete object. |
| Construct an arbitrary request | **No constructor exists in module source, but the end-to-end property is not established.** A structurally compatible injected merge-port function can carry the compared identity label independently of its behavior (F-061-01). |
| Observe policy | **No direct policy-observation method exists in target source.** The module consumes signed policy facts. The signed semantic model is insufficient under F-061-03. |
| Mutate policy | **No source-level mutation operation found.** The live attestor/broker boundary is unexecuted, and F-061-01 prevents proof that the concrete injected implementation is confined. |
| Bypass branch protection | **The source has no explicit bypass endpoint, but protection is not established.** The profile cannot prove mandatory controls, the injected port is unbound, and read-only live queries found neither branch protected. |
| Replay or forge evidence | **Yes.** A caller-supplied authority resolver can authenticate its own activation, universe, humans, issuer status, and publication identities (F-061-01). |
| Cross approved scope | **Yes.** The caller can omit protected paths from the unauthenticated `changedPaths` list (F-061-02). |
| Reach `main` through a second path | **No second source-level call site was found.** There is exactly one invocation at `execute.ts:1223-1224`, but the module cannot prove that the injected implementation behind that method is the exact-head PR API and nothing else (F-061-01). |

## New trust boundaries, injected dependencies, and external calls

| Boundary introduced or relied on | Judgment | Assessment |
|---|---|---|
| `ReleaseAuthorityPort` | **not met** | Read-only shape is narrow, but identity and all returned authentication are circularly self-asserted. F-061-01. |
| Negative-capability attestation binding for authority and merge port | **not met** | Resolver validates its own attestation; merge client and identity are separate injected fields. F-061-01. |
| `ReleaseObservationPort` fresh admission reads | **not met for protected paths** | Head/base are cross-bound to signed policy inputs, but changed paths have no authenticated source or universe membership. F-061-02. |
| `RepositoryPolicyAttestor` request channel and online status | **not met end to end** | Ed25519 and returned status checks work, but trust root/status resolution depends on F-061-01 and semantic policy proof fails F-061-03. |
| Publication execution-identity resolver | **not met** | Distinct records are enforced after resolution, but one self-authenticating resolver supplies them all. F-061-01. |
| Durable evidence store retry-sequence state | **met for the declared port contract** | Start and absolute deadline are persisted before attempt one, read from authenticated history, and enforced across restart; exact committed fixtures passed. Live store behavior remains unexecuted. |
| Lease, clock, and delay injection | **met for source confinement** | These add no credential or mutation surface. Retry count and absolute deadline are independently enforced after each read. |
| Exact merge external call | **not met end to end** | One typed call site exists, but concrete port behavior is not authenticated as the attested broker capability. F-061-01. |

The remedies did not add a second explicit production mutation call, but they widened the trusted computing base with one authority resolver and additional store/status/execution-identity calls. The authority resolver is the decisive unsafe widening because it is also the verifier of its own authorization.

## Exact-head CI and read-only control-plane evidence

Read-only queries were made for the immutable target itself:

- Origin `refs/heads/agent/gpt/devops/task-059`, PR 37 head, and the bound target all equal `126f2fa9939b8ac6db4764241952dafbda50e9f4`.
- PR 37 is `OPEN`, non-draft, `MERGEABLE` / `CLEAN`, with base `integration/autonomous-runtime`. It was not modified, approved, closed, or merged.
- Check run `validate`, ID `93094494830`, GitHub Actions App ID `15368`, completed with `success` at the exact target.
- Check run `security`, ID `93094494756`, GitHub Actions App ID `15368`, completed with `success` at the exact target.
- `scripts/ci/assert-check-runs.ps1 -Commit 126f2fa9939b8ac6db4764241952dafbda50e9f4 -Repository Fhurky/Multi-Agent-Engineering-Framework -Json` returned `result: pass`, `code: OK`, total 2, required 2, matched 2, unmatched 0, exit 0.
- The legacy combined-status endpoint returned `pending`, `total_count: 0`, and no contexts. This empty rollup is **absence**, not success.
- Classic branch-protection queries returned HTTP 404 `Branch not protected` for both `main` and `integration/autonomous-runtime`.
- The repository ruleset query, including parents, returned count zero. Merge, squash, and rebase methods are enabled.

The two successful exact-head checks are valid continuous-integration evidence for this immutable target. They are owner-side workflow evidence, not a threat model and not a security verdict. The absent protection/ruleset state is an unresolved HUMAN-004 control-plane prerequisite. This task did not provision, request, configure, or simulate any App, credential, attestor, store, branch protection, ruleset, required check, bypass set, or policy.

## Executed and unexecuted fixtures

### Executed

- `scripts/release/integration-merge/run-tests.ps1` at exact detached HEAD `126f2fa...`, Node `v26.4.0`: exit 0; 537 declared, 526 executed and passed, 0 failed, 0 cancelled, 0 skipped, and 11 TODO/unexecuted.
- Exact committed TASK-059 remediation plus admission-success files: 20/20 passed. This run included each F-058 focused case and the caller-built success scenario that returned `admitted`.
- Exact committed static-dependency, negative-capability, dormancy, and round-1 remediation files: 158/158 passed, 0 failed/skipped/TODO. Their negative results were independently judged rather than treated as automatic dispositions.
- `scripts/ci/validate-framework.ps1`: passed for 13 roles.
- `scripts/ci/test-orchestration.ps1`: passed.
- `scripts/ci/test-check-run-evidence.ps1`: passed, 82 assertions; its expected invalid-input diagnostics remained fail-closed.
- `scripts/security/check-repository.ps1`: passed.
- `git diff --check` against both the cumulative base and remediation ancestry base: exit 0.

No executed fixture performed, requested, or simulated a merge. Test merge ports were offline recording fakes only.

### Unexecuted - not passing

The following 11 fixtures remain registered as `todo` at `tests/live-control-plane.blocked.test.ts:53-140`. They were **not executed and are not passing evidence**:

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

Read-only live queries confirmed why the protected-branch fixtures cannot execute: neither protected branch nor a ruleset currently exists. No unexecuted item is counted in the 526 passing total.

## Verification

| Command or method | Result |
|---|---|
| Branch/assignment/worktree/lock/token/hooks verification | Passed: exact `agent/gpt/security/task-061`; `security` / `gpt`; isolated worktree; `.githooks`; shared and local lock tokens match. |
| `git merge-base HEAD integration/autonomous-runtime` | Exact branch point `d7994690b40a4a29218c46b9e0c7bd234a56ceff`. |
| Target ancestry, tree, path, stat, residue, NUL, and diff checks | Passed: target/base exact; 42 cumulative and 29 remediation paths, zero out-of-scope paths; zero NUL-bearing paths; both diffs whitespace-clean. |
| HUMAN-004, normative architecture/ADRs/approval, and both prior security reports | Read directly through `git show <exact-commit>:<path>` at the identifiers in Identity. |
| Exact detached-target module tests | Passed with the executed/unexecuted figures above; security conclusions were independently assessed. |
| Static capability/import review | One source-level merge call; no generic HTTP/Git/ref/process/environment/credential/policy/gate/task/lock/filesystem/deployment operation in module source. End-to-end boundary defects are F-061-01 through F-061-03. |
| Read-only origin/PR/check/status/protection/ruleset/repository queries | Exact-head and control-plane results recorded above; no empty status treated as passing and no state changed. |
| `scripts/orchestration/validate-write-scope.ps1 -Role security -Llm gpt -BranchName agent/gpt/security/task-061 -IncludeWorkingTree -BaseRef d7994690b40a4a29218c46b9e0c7bd234a56ceff` | Passed: `valid: True`; exactly one changed file, this declared security report. |

## Artifacts, risks, and handoff

- Changed artifact: `reports/security/TASK-059-RELEASE-MERGE-EXECUTOR-SECURITY-ROUND-3.md` only.
- Findings: F-061-01, F-061-02, and F-061-03, all Critical and owned by `devops`.
- Unresolved blockers: the three new findings; five partial round-1 findings; F-058-01 through F-058-04 remain partial. F-058-05 and F-054-04 through F-054-06 are resolved as recorded above.
- No risk acceptance is recorded. The security gate remains open for all three atomic relations.
- Work explicitly outside this role: no production/test/task/governance/reviewer/QA artifact was edited; no credential, App, attestor, store, branch protection, ruleset, policy, or required check was provisioned; no PR was approved or merged; no remediation was implemented.
- Required next owner: Orchestrator under TASK-013 to route F-061-01 through F-061-03 to the `devops` implementation owner. Any necessary normative contract amendment must be routed separately to the Architect. A new independent Security round must revalidate remediation.
- Task lock released: **no**. TASK-061 remains held for the controlling session as instructed.
