# TASK-063 Security Revalidation of the Release Merge Executor, Round 4

## Identity

- Task ID: `TASK-063`
- Role: `security` (Security Engineer)
- LLM family: `gpt`
- Branch: `agent/gpt/security/task-063`
- Worktree: `C:/Users/furko/Desktop/multi-agent-worktrees/gpt-security-task-063`
- Branch point and scope-validation base: `d7994690b40a4a29218c46b9e0c7bd234a56ceff`
- Immutable review target: `19e75e996e8e116f74b4f8feb363ef13438a42b9`
- Target tree: `6563527f501739fc7e6eb9d26ba15588766dc96e`
- Immutable cumulative review base: `d63864bcb25fc8897b21c09f8f687e390f85808d`
- Remediation ancestry base: `126f2fa9939b8ac6db4764241952dafbda50e9f4`
- Reviewed publication: pull request 44, `agent/gpt/devops/task-062` into `integration/autonomous-runtime`
- Governance authority: HUMAN-004 at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`
- Normative architecture: `f148567d716c00d7a24783318c8d6d7031492e7b`, approved at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6`
- Prior Security reports: TASK-054 at `8b2da2f88d38872ded14bc18b739c6586ec47336`; TASK-058 at `0a44bb0f6a1405bf49fa536d1149f122f52e4bbb`; TASK-061 at `17cdf4f040f7b0e89ad51f9db40d67f7ae11a615`

The branch, isolated worktree, `security` / `gpt` assignment, installed hooks, and shared TASK-063 lock were verified before editing. The lock named the exact task, role, LLM, branch, and worktree, and its session `773a0d4b0a4c449d9d465a3288d83176` matched the ignored worktree token. The immutable target was reviewed through local Git objects and an exact detached worktree. It was not merged, cherry-picked, copied into this Security branch, activated, or invoked against a merge service. This review used only repository code, local Git objects, and committed offline unit-test fakes; it did not probe or modify any live credential, policy, branch protection, network service, or merge API.

## Outcome

**Verdict: `changes-required`.**

This is one indivisible verdict applied atomically to all four relations in `LIN-RELEASE-EXECUTOR-SECURITY` round 4:

| Relation | Round-4 result |
|---|---|
| `(TASK-062, security, round 1)` | **changes-required; relation remains open** |
| `(TASK-059, security, round 2)` | **changes-required; relation remains open** |
| `(TASK-056, security, round 3)` | **changes-required; relation remains open** |
| `(TASK-049, security, round 4)` | **changes-required; relation remains open** |

A split result is not recorded. The exact target **must not be integrated**, and an `implementationSecurityReview` activation member **must not be produced** from this result. Two fresh Critical findings, F-063-01 and F-063-02, block delivery. No risk acceptance exists, was requested, was manufactured, or is recorded by this task.

TASK-062 materially improved the local validation logic. The capability is nominal inside one loaded module instance, immutable-diff entries and pages receive strict canonical validation, and the effective branch-control profile is normalized and compared with the required profile. Those checks do not establish the claimed trust boundaries. A release-control caller can import the composition-root constructor and supply the authenticator that creates a recognized capability. Separately, admission accepts a locally fabricated, self-digested immutable-diff receipt without independently resolving the receipt or its `evidenceCommit`. The first defect makes the authority, identity, trust-root, and merge-port binding caller-constructible; the second permits a protected path to be omitted from an invented complete diff.

## Review boundary and threat model

The target is nine commits over the immutable cumulative base and four commits over the remediation ancestry base. The cumulative range changes 46 paths, all under `scripts/release/integration-merge/**`. The remediation range changes 21 paths in the same module with 1,860 additions, 92 deletions, and no deleted paths. Both merge bases equal their declared bases. The local remote-tracking ref `refs/remotes/origin/agent/gpt/devops/task-062` equals the exact target.

Protected assets are `main`, the exact integration base and release head, the complete immutable base-to-head diff, governance and enforcement paths, the seven release gates, blocking-security evidence and human acceptances, required-check identities, the activation record and members, required/effective policy profiles, attestor trust roots and issuer status, publication identities, durable intent/outcome history, and the terminal result.

The attacker and failure model includes compromised or mistaken release-control application code, deep imports within the repository/package, a caller-supplied authenticator, arbitrary structurally compatible authority and merge objects, self-consistent but nonexistent Git object labels, incomplete diff pagination, omitted renames or deletions, weakened or non-applicable policy rules, redacted bypass actors, retry/base drift, ambiguous mutations, and a forged evidence universe. TypeScript interfaces, SHA-shaped strings, canonical self-digests, and private in-module WeakMaps are not treated as independent authentication by themselves.

## Fresh findings

### F-063-01 - Application code can mint the nominal executor capability through the public composition factory

- Severity: **Critical**
- Responsible owner: **devops**
- Status: **open**

Evidence at `19e75e996e8e116f74b4f8feb363ef13438a42b9`:

- `scripts/release/integration-merge/composition-capability.ts:93-154` publicly exports `createReleaseExecutorCompositionRoot` and accepts a caller-supplied `ReleasePortAuthenticator`. The caller's three callbacks supply both port identities and the composition binding.
- The factory checks field shape and repeatability, then writes the capability and caller-supplied concrete objects into the module-private WeakMap. `composition-capability.ts:160-171` consequently recognizes that minted object as nominally valid.
- Omitting the constructor from `index.ts` is not an authority boundary. Repository application code can import the source module by its direct path. `tests/static-dependency.test.ts:221-231` checks only the public entry-point dependency shape and does not enforce a runtime, package-export, loader, or deployment boundary against the direct import.
- An independent offline assertion imported the exact target module, supplied an authenticator returning well-shaped fixture identities and a binding, bound caller-created authority and merge objects, and passed the returned capability to production admission. `resolveReleaseExecutorCapability` accepted it and `admit(baseline, callerCapability)` returned `admitted`.

The WeakMap prevents a plain structural object from impersonating an already-issued capability, but it does not prevent untrusted application code from invoking the issuer. The caller can therefore place its own authority resolver and concrete merge implementation behind a capability production code treats as independently authenticated. This defeats the object-binding and trust-root claim and preserves the security consequence of F-061-01.

Required remediation: put composition and seal ownership in a separately controlled host/runtime boundary that release-control application code cannot import or call. The release-control module must receive only an externally issued nominal capability bound to independently provisioned concrete objects. Enforce that boundary through deployable package/module exports or an equivalent runtime authority mechanism, not source-file convention, and add a negative fixture that attempts the exact direct import plus caller-authenticator construction.

**This Critical finding blocks integration and release until remediated or formally accepted by an authorized human. TASK-063 does not accept the risk.**

### F-063-02 - Admission trusts a locally fabricated diff receipt without resolving immutable evidence

- Severity: **Critical**
- Responsible owner: **devops**
- Status: **open**

Evidence at `19e75e996e8e116f74b4f8feb363ef13438a42b9`:

- `scripts/release/integration-merge/contracts.ts:269-283` defines `AuthenticatedImmutableDiff` with base/head identifiers, entries, pages, canonical bytes, `evidenceCommit`, and an `evidenceDigest`. It contains no authenticated producer identity, signature, immutable artifact reference, or resolver-issued receipt.
- `scripts/release/integration-merge/immutable-diff.ts:188-199` recomputes canonical bytes and the receipt's self-digest, but it establishes only internal consistency. It does not dereference `evidenceCommit` or authenticate who produced the base-to-head comparison.
- `scripts/release/integration-merge/admission.ts:628-686` obtains the receipt from the enumerated authority universe and compares the caller facts with that same receipt. Unlike other immutable artifacts, the diff receipt is not passed to `resolveArtifact` or an independent immutable-diff resolver.
- `scripts/release/integration-merge/tests/helpers/fixtures.ts:128-184` can construct the complete purportedly authenticated receipt locally, including an OID-shaped `evidenceCommit` and self-digest.
- An independent offline assertion created a canonical, complete-looking diff containing only a safe path, set the observation's `changedPaths` to that invented subset, and admitted it through production code. The result was `admitted`. The receipt's alleged evidence commit `493d69c6138edddadd2bf577e4e46c10515886b5` is not a commit in the local repository: `git cat-file -e 493d69c6138edddadd2bf577e4e46c10515886b5^{commit}` failed.

Pagination, order, rename, deletion, blob-OID, canonical-byte, and digest checks protect the internal shape of the receipt they receive. They do not prove that the entries are the complete diff for the named real base/head pair. A malicious or faulty caller-sealed authority can construct a smaller internally valid universe and omit protected governance or enforcement paths. This leaves F-061-02 only partially resolved.

Required remediation: obtain the exact base-to-head diff from an independently authenticated immutable Git/PR source and bind it to a nominal, signed, or independently dereferenced receipt. Include the producer, exact artifact commit/path/bytes or equivalent immutable identity, base/head, canonical entry bytes, and completeness proof. Reject nonexistent or unresolved evidence and add negative fixtures for an omitted protected path, truncated pagination, renamed/deleted entries, base/head substitution, and a self-consistent receipt whose evidence object does not exist.

**This Critical finding blocks integration and release until remediated or formally accepted by an authorized human. TASK-063 does not accept the risk.**

## Round-3 finding dispositions

| Finding | Disposition | Exact-target result | Residue |
|---|---|---|---|
| F-061-01 | **not resolved** | A WeakMap-backed capability and repeated identity checks were added, but the exported factory accepts the caller's authenticator and seals the caller's objects. The independent construction counterexample returned `admitted`. | F-063-01 |
| F-061-02 | **partially resolved** | Entry shape, canonical order/bytes, pagination, rename, deletion, blob OIDs, digest, and base/head equality receive strict local checks. The receipt is still locally constructible and never independently resolved; the fabricated-diff counterexample returned `admitted`. | F-063-02 |
| F-061-03 | **partially resolved** | Typed branch controls and normalized effective-policy derivation now reject the committed missing, weakened, non-applicable, and redacted-control fixtures. End-to-end policy authority remains caller-constructible through F-063-01. | F-063-01 |

## Earlier Security finding dispositions

No `F-053-*` or `F-057-*` finding is dispositioned here. Those identifiers belong to the independent Reviewer lineage. Their tests were used only as defensive regression evidence.

### TASK-058 findings

| Finding | Disposition | Residue |
|---|---|---|
| F-058-01 | **partially resolved** - concrete artifact/member resolution exists, but the caller can mint a capability around its own resolver. | F-063-01 |
| F-058-02 | **partially resolved** - literal permission, Ed25519, source, status, and policy-control checks work locally, but the caller-sealed resolver still supplies the trust root, status, and policy universe. | F-063-01 |
| F-058-03 | **partially resolved** - universe equality is broader, but its authority is caller-sealed and its diff can be fabricated. | F-063-01 and F-063-02 |
| F-058-04 | **partially resolved** - execution identities are compared, but they originate from the caller-sealed authority. | F-063-01 |
| F-058-05 | **resolved; remains resolved** - durable sequence start and absolute deadline behavior remained covered by committed regressions. | None |

### TASK-054 findings

| Finding | Disposition | Residue |
|---|---|---|
| F-054-01 | **partially resolved** - activation values are validated, but their resolving authority remains constructible by the caller. | F-063-01 |
| F-054-02 | **partially resolved** - gate evidence receives validation, but the authority that authenticates it remains caller-sealed. | F-063-01 |
| F-054-03 | **partially resolved** - admission-universe equality exists, but the universe is caller-authorized and the protected-path diff is not independently authenticated. | F-063-01 and F-063-02 |
| F-054-04 | **resolved; remains resolved** - publication identity and required-check matching regressions remain passing. | None |
| F-054-05 | **resolved; remains resolved** - durable intent/outcome and terminal-result regressions remain passing. | None |
| F-054-06 | **resolved at the declared store boundary; remains resolved** - retry/idempotency logic is covered offline; live store and broker behavior remains deliberately unexecuted. | None in reviewed source |
| F-054-07 | **partially resolved** - policy evidence semantics improved, but the policy authority remains caller-sealed. | F-063-01 |
| F-054-08 | **partially resolved** - capability shape and binding improved, but issuance is exposed to the release-control caller. | F-063-01 |

## Policy-control revalidation

The exact target now represents every required HUMAN-004 branch semantic in `RequiredBranchControlProfile`: pull-request-only updates, strict current-base checking, administrator enforcement, force-push prohibition, deletion prohibition, approving-review count, stale-review dismissal, code-owner review, last-push approval, conversation resolution, signed commits, the required linear-history value, and an empty effective bypass set.

`policy-control.ts` derives a normalized effective profile from typed classic-protection and ruleset observations before comparing the effective-policy digest with the activation-pinned requirement. The focused TASK-062 fixtures reject each missing or weakened review/check/administrator/force-push/deletion/conversation/signature/linear-history semantic, non-applicable rule conditions, redacted bypass observations, and a present bypass actor. All 11 focused fixtures passed. This resolves the local semantic and digest derivation portion of F-061-03. It does not authenticate the authority object that supplies the policy evidence or trust root, so policy admission remains blocked by F-063-01.

## HUMAN-004 prohibition decision table

| # | Prohibition | Result | Basis |
|---|---|---|---|
| 1 | Executor cannot author, approve, or accept its own release gates or risk | **not established** | Caller-sealed authority can manufacture the gate, principal, and accepted-risk universe (F-063-01). |
| 2 | Executor cannot merge with open or failing gates | **not established end-to-end** | Explicit negative values are rejected, but the authority that authenticates the complete gate universe is caller-constructible (F-063-01). |
| 3 | Executor cannot direct-push or use `ALLOW_MAIN_PUSH` | **met in reviewed source** | No generic Git/ref/env/process capability or direct-push path exists in the module; the live protected-branch fixture remains unexecuted. |
| 4 | Executor cannot force, bypass, administer, or disable required controls | **not established end-to-end** | Typed controls reject negative offline fixtures, but the capability/authority root remains callable by application code; live controls are unexecuted (F-063-01). |
| 5 | Executor cannot release governance/enforcement changes | **not established** | A locally fabricated complete-looking diff can omit a protected path (F-063-02). |
| 6 | Executor cannot mutate locks or task ownership | **met in reviewed source** | No task/lock mutation dependency or operation exists in the executor module. |
| 7 | Executor cannot authorize or merge a mutable/unbound head | **not established end-to-end** | OID equality and syntax are checked, but the evidence universe and diff proof can be caller-sealed or nonexistent (F-063-01, F-063-02). |
| 8 | Executor cannot treat missing, skipped, timed-out, cancelled, neutral, or stale checks as passing | **not established end-to-end** | Local evaluator rejects non-success states, but its authenticated check universe is supplied by caller-constructible authority (F-063-01). |

Only prohibitions 3 and 6 are met by the reviewed source boundary. Six prohibitions are not established for an executor reachable through the claimed deployment composition.

## Executor-reachable capabilities and trust boundaries

| Capability or boundary | Decision |
|---|---|
| Raw credential access | No source-level path exists. Credential isolation at the live broker boundary was not executed. |
| Generic Git, HTTP, ref, environment, process, task, lock, or policy-administration operation | No such port exists in the reviewed module. |
| Arbitrary merge request construction | The merge port has one narrow operation, but F-063-01 lets application code seal an arbitrary concrete implementation behind a recognized capability; confinement is therefore not established end-to-end. |
| Policy observation or mutation | No direct policy-mutation port exists. The authority can supply fabricated observations because its composition authority is not independent (F-063-01). |
| Evidence forgery | Reachable: the caller can mint the recognized authority capability and locally build an accepted self-digested diff receipt (F-063-01, F-063-02). |
| Cross-scope release | Reachable in the defensive counterexample model by omitting a protected path from a fabricated diff (F-063-02). |
| Second explicit merge path | None found. The source exposes one merge operation and keeps the executable path dormant until activation/admission/execute. This does not cure the untrusted concrete port sealed by F-063-01. |
| Retry and durable evidence | Offline state-machine regressions pass for sequence, absolute deadline, ambiguity, durable intent, outcome, and terminal result. External durability/atomicity remains an unexecuted deployment fixture. |

The architecture requires the composition root, immutable source, status/policy authority, and merge broker to be independent of the release-control caller. At the exact target, the first three collapse into values or objects the caller can construct, and the diff receipt has no independent resolver at all. Nominal TypeScript types and frozen objects do not repair that deployment-authority collapse.

## Exact target, publication, and provenance evidence

The target review used the immutable commit and tree listed above. The exact detached target remained clean. Local ancestry and path checks confirmed:

- Cumulative merge base: `d63864bcb25fc8897b21c09f8f687e390f85808d`; 9 commits; 46 paths; all within `scripts/release/integration-merge/**`.
- Remediation merge base: `126f2fa9939b8ac6db4764241952dafbda50e9f4`; 4 commits; 21 paths; all within the same module; no deleted paths.
- Remediation commits: `48ac54d` (composition capability), `440bcf8` (immutable diff), `a2e374a` (policy derivation), and `19e75e9` (evidence documentation).
- The locally available immutable ACT-035 publication record reports PR 44 open, non-draft, mergeable/clean, based on `integration/autonomous-runtime`, with exact head `19e75e996e8e116f74b4f8feb363ef13438a42b9`; exact-head `validate` check 93134943882 and `security` check 93134943987 succeeded; no legacy status contexts existed. TASK-063 intentionally did not refresh or mutate that live PR state under its offline-review constraint.
- The local `origin/agent/gpt/devops/task-062` tracking ref equals the target. This is provenance evidence, not permission to merge it.

## Verification

Executed against the exact detached target using committed offline code, tests, fakes, and local Git objects:

| Check | Result |
|---|---|
| Focused `task-062-remediation.test.ts` | **11/11 passed** |
| Independent capability-factory assertion | **reproduced** - caller-supplied authenticator minted a recognized capability and admission returned `admitted` |
| Independent locally fabricated diff assertion | **reproduced** - internally canonical subset diff returned `admitted`; alleged evidence commit was absent from local Git objects |
| Full integration-merge test runner | **548 declared; 537 passed; 0 failed; 0 skipped/cancelled; 11 TODO/unexecuted; exit 0** |
| `task-059-remediation.test.ts` | **15/15 passed** |
| `round-1-remediation.test.ts` | **104/104 passed** |
| Static dependency, negative-capability, and dormancy suites | **54/54 passed** |
| `validate-framework.ps1` | **passed; 13 roles validated** |
| `test-orchestration.ps1` | **passed** |
| `test-check-run-evidence.ps1` | **passed; 82 assertions, expected negative diagnostics only** |
| `check-repository.ps1` | **passed** |
| Git whitespace checks for cumulative and remediation ranges | **passed** |

The full runner's diagnostic text labels the TODO set as fixtures requiring execution, but its TAP result contains zero failures and exits successfully. Passing unit tests do not override the two independently reproduced trust-boundary counterexamples.

The following 11 deployment fixtures were explicitly not executed: failing-check blocking; no bypass; release scope; task scope; direct-push rejection; force-push rejection; credential isolation; no administration endpoint; no policy mutation; no revocation suppression; and attestor-cannot-merge. No live branch protection, ruleset, credential broker, attestor, persistence service, or merge service was accessed. No merge was performed, requested, simulated, approved, or activated.

## Artifacts

- Changed file: `reports/security/TASK-062-RELEASE-MERGE-EXECUTOR-SECURITY-ROUND-4.md`
- Fresh findings: F-063-01 and F-063-02, both Critical, owner `devops`, status open
- Decision: atomic `changes-required`; integration and `implementationSecurityReview` production prohibited

## Risks and handoff

- Unresolved blockers: caller-accessible capability issuance (F-063-01) and unauthenticated immutable-diff provenance/completeness (F-063-02).
- Work explicitly outside this role: remediation code; governance or task mutation; Reviewer/QA approval; risk acceptance; activation; merge; credential/policy/control-plane changes; live deployment fixtures.
- Required next owner: `orchestrator`, to route both Critical remediation findings to `devops`, preserve the four open Security relations, and schedule a new independent Security round only after a new immutable implementation target is published.
- Task lock released: recorded after durable publication.
