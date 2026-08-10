# TASK-065 Security Revalidation of the Release Merge Executor, Round 5

## Identity

- Task ID: `TASK-065`
- Role: `security` (Security Engineer)
- LLM family: `gpt`
- Branch: `agent/gpt/security/task-065`
- Worktree: `C:/Users/furko/Desktop/multi-agent-worktrees/gpt-security-task-065`
- Branch point and scope-validation base: `6e92459621cdb7e45839d53fa5ba8d5d59113f83`
- Immutable review target: `610716aabc9a6cdf455fe45c32c88eeb20caa588`
- Target tree: `c83b0639f417b9fecee4c874f9ebbfdf38c3b4db`
- Immutable cumulative review base: `d63864bcb25fc8897b21c09f8f687e390f85808d`
- Remediation ancestry base and target parent: `19e75e996e8e116f74b4f8feb363ef13438a42b9`
- Reviewed publication: pull request 48, `agent/gpt/devops/task-064` into `integration/autonomous-runtime`
- Governance authority: HUMAN-004 at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`
- Normative architecture: `f148567d716c00d7a24783318c8d6d7031492e7b`, approved at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6`
- Prior Security reports: TASK-054 at `8b2da2f88d38872ded14bc18b739c6586ec47336`; TASK-058 at `0a44bb0f6a1405bf49fa536d1149f122f52e4bbb`; TASK-061 at `17cdf4f040f7b0e89ad51f9db40d67f7ae11a615`; TASK-063 at `7e610fabd663779724a94deec0046981e997f298`

The exact ready task was read at `ebc996492947880b90937c5491b4779c74313a28`. The branch, isolated worktree, `security` / `gpt` assignment, installed hooks, and shared TASK-065 lock were verified before editing. The lock session is `f35982f44cff40cba2cd343e2ee54f86` and matches the ignored worktree token.

The immutable target was assessed through local Git objects and an exact detached worktree. It was not merged, cherry-picked, copied into this Security branch, activated, or invoked against a live merge service. The assessment used committed source, offline tests and fakes, package manifests, and two minimal local assertions against the exact target. No credential, policy, branch protection, ruleset, activation member, merge API, or live control plane was accessed or modified.

## Outcome

**Verdict: `changes-required`.**

This is one indivisible verdict applied atomically to all five relations in `LIN-RELEASE-EXECUTOR-SECURITY` lineage round 5:

| Relation | Round-5 result |
|---|---|
| `(TASK-064, security, round 1)` | **changes-required; relation remains open** |
| `(TASK-062, security, round 2)` | **changes-required; relation remains open** |
| `(TASK-059, security, round 3)` | **changes-required; relation remains open** |
| `(TASK-056, security, round 4)` | **changes-required; relation remains open** |
| `(TASK-049, security, round 5)` | **changes-required; relation remains open** |

A split result is not recorded. The exact target **must not be integrated**, and an `implementationSecurityReview` activation member **must not be produced**. Fresh Critical finding F-065-01 blocks delivery. No risk acceptance exists, was requested, was manufactured, or is recorded by this task.

TASK-064 adds a real immutable-diff resolution call and strict source/object/content checks. Those checks reject substitutions when the resolver is independently trusted. The claimed issuer boundary is still absent: the application package ships `capability-registry.ts`, and that file publicly exports the host-only seal. A release-control caller can import that shipped file directly, seal caller-selected authority and merge objects into the same module-private `WeakMap`, and obtain a capability that production admission recognizes. The exact-target counterexample returned `admitted`. The same caller-controlled authority can return an internally valid immutable-diff resolution backed by a nonexistent Git commit; a second exact-target counterexample also returned `admitted`. Package metadata therefore changes the preferred import path, not the authority boundary required by the approved contract.

## Review boundary and threat model

The target is ten commits over the immutable cumulative base and one remediation commit over TASK-062. The cumulative range changes 52 paths with 21,355 insertions; the remediation range changes 19 paths with 746 insertions and 258 deletions. Every path is under `scripts/release/integration-merge/**`, both merge bases equal their declared bases, the target has the declared sole parent, and the exact detached target is clean. A raw-byte scan found zero NUL-bearing cumulative paths.

Protected assets are `main`, the exact integration base and release head, the complete immutable base-to-head diff, governance and enforcement paths, the seven release gates, blocking-security evidence and human acceptances, required-check identities, activation members, policy and issuer trust roots, durable intent/outcome history, and the terminal result.

The attacker and failure model includes compromised or mistaken release-control application code, direct imports of files shipped in its deployable package, caller-selected authority and merge objects, a resolver that authenticates its own evidence, nonexistent Git object labels, incomplete diffs, omitted renames or deletions, policy/base drift, ambiguous mutations, and forged evidence universes. A package export map, TypeScript interface, SHA-shaped value, frozen object, or module-private `WeakMap` is not an independent authority boundary when the same shipped package exposes the function that writes the registry.

## Fresh finding

### F-065-01 - The application package ships the host-only capability seal

- Severity: **Critical**
- Responsible owner: **devops**
- Status: **open**

Evidence at `610716aabc9a6cdf455fe45c32c88eeb20caa588`:

- `scripts/release/integration-merge/package.json:9-13` includes `capability-registry.ts` in the application package's deployable file list.
- `scripts/release/integration-merge/capability-registry.ts:35-82` owns the shared `WeakMap` and publicly exports both `sealExternallyProvisionedReleaseExecutorCapability` and the resolver. The seal has no host principal, loader, process, package-instance, or caller-authentication check.
- `scripts/release/integration-merge/runtime-host/index.ts:10-16` imports that registry and the application contracts through parent-directory source paths. An independent `npm pack --dry-run --json` showed that the application artifact contains the registry, while the alleged runtime-host artifact contains only `index.ts` and `package.json`; its referenced parent files are not part of that standalone artifact. The host is therefore neither the sole physical owner of the seal nor an independently deployable issuer as packaged.
- `scripts/release/integration-merge/tests/task-064-remediation.test.ts:57-81` checks only the consumer facade and a structural object. `tests/static-dependency.test.ts:223-260` forbids application imports of `runtime-host` and the old constructor names, but does not forbid or attempt a direct import of the shipped registry seal. All six focused owner tests pass while the direct-registry counterexample succeeds.
- A minimal offline exact-target assertion imported the shipped registry from release-control application code, supplied caller-selected authority and merge objects, called the exported seal, and passed the result to the production resolver and admission function. The capability was minted and recognized, and admission returned `admitted`.
- A second exact-target assertion used that same exported seal with a caller-selected resolver that returned a canonical immutable-diff resolution whose claimed evidence commit was `3fd5ba64fd9ae635726e34a29673d4bf2dd64c7b`. Production admission returned `admitted`; `git cat-file -e <commit>^{commit}` returned 128 because the object does not exist.

Impact: application code can mint the authority that is supposed to authenticate its activation universe, trust roots, policy evidence, merge-port identity, and immutable diff. The new diff object checks establish internal consistency only after accepting a resolution from that caller-minted authority. A faulty or compromised caller can therefore authorize its own merge object and present a fabricated complete-looking subset diff that omits a protected path. This preserves the security consequences of F-063-01 and F-063-02 and can reach the sole integration-to-`main` mutation path when the surrounding caller-created evidence is self-consistent.

Required remediation: move the registry owner, seal, and privileged object construction into a boundary that is not shipped or directly importable by release-control application code. The application artifact must contain only a consumer/verifier surface and must not contain any callable registry writer. The host artifact must be independently buildable and deployable with explicit dependencies and a non-forgeable host-to-application capability channel; if process isolation is used, authority resolution must remain on the trusted side rather than relying on an in-process object that application code can recreate. Add a packaged-artifact negative fixture for the exact direct registry import and require the independently trusted immutable source to reject nonexistent Git objects and incomplete base-to-head diffs.

**This Critical finding blocks integration and release until remediated or formally accepted by an authorized human. TASK-065 records no acceptance and does not accept the risk.**

## TASK-063 finding dispositions

| Finding | Disposition | Exact-target result | Residue |
|---|---|---|---|
| F-063-01 | **not resolved** | The old caller-authenticator factory is gone from the facade, but the application artifact ships a public seal that writes the same nominal registry. The direct-import assertion minted a recognized capability and production admission returned `admitted`. | F-065-01 |
| F-063-02 | **partially resolved** | `admission.ts:685-696` now calls `resolveImmutableDiff`, and `immutable-diff.ts:47-81,172-254` binds source, producer, repository, base/head, canonical bytes, pages, entries, renames, and deletions. Honest-boundary substitution fixtures refuse. A caller can still mint the authority supplying that resolution; the nonexistent-evidence assertion returned `admitted`. | F-065-01 |

## Earlier Security finding dispositions

No `F-053-*` or `F-057-*` finding is dispositioned here. Those identifiers belong to the independent Reviewer lineage. Their committed tests were used only as defensive regression evidence.

### TASK-061 findings

| Finding | Disposition | Residue |
|---|---|---|
| F-061-01 | **not resolved** - object binding remains caller-constructible through the shipped registry seal. | F-065-01 |
| F-061-02 | **partially resolved** - immutable diff source and content checks are comprehensive for an independent resolver, but the resolver can be installed by the application caller. | F-065-01 |
| F-061-03 | **partially resolved** - required branch semantics and effective-profile derivation remain covered by passing regressions, but their authority root can be installed by the same caller. | F-065-01 |

### TASK-058 findings

| Finding | Disposition | Residue |
|---|---|---|
| F-058-01 | **partially resolved** - concrete artifact/member resolution exists, but application code can mint the recognized resolver capability. | F-065-01 |
| F-058-02 | **partially resolved** - literal permissions, Ed25519, source completeness, status, and branch controls work for supplied records; the authority/trust-root boundary remains caller-mintable. | F-065-01 |
| F-058-03 | **partially resolved** - admission-universe equality and immutable-diff checks exist, but their authenticating resolver can be supplied and sealed by the caller. | F-065-01 |
| F-058-04 | **partially resolved** - distinct execution identities are checked after resolution, but the resolver supplying them is caller-mintable. | F-065-01 |
| F-058-05 | **resolved; remains resolved** - control rejection, component-wise ordering, permutation stability, durable sequence start, and absolute deadline regressions remain passing. | None |

### TASK-054 findings

| Finding | Disposition | Residue |
|---|---|---|
| F-054-01 | **partially resolved** - cryptographic and policy validation works locally; the trust root and resolver can still be installed by application code. | F-065-01 |
| F-054-02 | **partially resolved** - activation members are dereferenced and bound, but the authority that authenticates them is caller-mintable. | F-065-01 |
| F-054-03 | **partially resolved** - gate, security, integration, check, and diff universes are compared, but the authority declaring the universe remains caller-mintable. | F-065-01 |
| F-054-04 | **resolved; remains resolved** - canonical plan equality, digest, and idempotency regressions remain passing. | None |
| F-054-05 | **resolved; remains resolved** - per-attempt revalidation, absolute deadline, and base/policy drift regressions remain passing. | None |
| F-054-06 | **resolved at the declared store boundary; remains resolved** - durable history, receipt, ancestry, containment, and reconciliation regressions remain passing; live store behavior remains unexecuted. | None in reviewed source |
| F-054-07 | **partially resolved** - production-action fields are exactly bound, but the authority authenticating the human decision remains caller-mintable. | F-065-01 |
| F-054-08 | **partially resolved** - proof kinds and distinct phase identities are enforced for returned records, but their authenticated identities come from a caller-mintable resolver. | F-065-01 |

## Required security scope judgments

| Required scope | Judgment | Exact-target assessment |
|---|---|---|
| Short-lived one-repository credential remains outside the executor; only a confined concrete merge capability is injectable | **not established end to end** | No raw token loader or generic network client exists, but the application can seal an arbitrary merge object behind a recognized capability (F-065-01). |
| Literal release-App allowlist and no Administration, Actions, Environments, Deployments, Secrets, Issues, policy, check/status write, or bypass authority | **not established end to end** | Literal permission and branch-control fixtures pass. The concrete authority and merge objects behind those identity records are caller-mintable, and live permission/bypass fixtures are unexecuted. |
| Canonical attestation digest, Ed25519, exact subject, freshness/margin, independent revocation, complete policy enumeration, and non-redacted bypass sets | **not established end to end** | All local validation regressions pass, but the authority supplying the trust root, issuer status, and policy universe can be installed through F-065-01. |
| Activation record resolved from an authenticated immutable source; members dereferenced and bound; configuration alone cannot activate | **not established** | Resolution and binding checks exist, but the exact direct-import assertion constructed the recognized authority capability and reached `admitted`. |
| Manifests, snapshots, integration evidence, accepted risks, production decisions, and exact diff are independently authenticated | **not established** | Resolver calls and equality checks exist. The application can mint that resolver, and the nonexistent immutable-diff object was admitted. |
| Plan substitution, retry drift, global deadline, durable intent/evidence, reconciliation, and terminal result | **met for the declared offline port/store contracts** | The complete suite and prior focused regressions pass. Live store and merge-service behavior remains unexecuted. |
| Exactly one source-level path to `main`, using the exact-head PR merge operation | **one source call; end-to-end confinement not established** | `execute.ts:1263` is the sole production invocation. No generic Git/HTTP/process/ref mutation surface was found. F-065-01 still permits an arbitrary callable object behind the recognized merge capability. |
| External identifiers and composite identities are unambiguous | **met** | Control rejection and permutation regressions pass; zero NUL-bearing cumulative files were found. |
| No committed secret, credential, private key, token, or sensitive production value | **met** | The exact-target repository security check passed; no secret value was copied into this report. |
| Dormancy prevents side effects when activation is absent or defective | **met for committed dormant cases** | Dormancy and activation suites pass. A complete caller-minted authority crosses the nominal boundary under F-065-01, so dormancy does not establish activation authenticity. |

## HUMAN-004 prohibited capabilities - individual results

1. **Author, approve, close, override, or formally accept a gate: not established end to end.** No gate-write API exists, but a caller-minted authority can authenticate a fabricated passing gate and accepted-risk universe (F-065-01).
2. **Merge with open or failing declared gates: not established end to end.** Explicit open/failing values refuse, but the authenticating authority and complete relation universe can be installed by the application caller (F-065-01).
3. **Push directly to `main` or set `ALLOW_MAIN_PUSH`: met in reviewed source.** Static analysis found no Git/ref/environment/process path or emergency-variable use. The live server fixture is unexecuted.
4. **Force-push, bypass hooks or branch protection, use administrator override, or disable a required check: not established end to end.** Local controls refuse negative values, but the concrete merge/authority objects are caller-mintable and the live control plane is unexecuted (F-065-01).
5. **Merge governance or enforcement changes: not established.** The protected-path matcher is correct, but a caller-minted authority admitted a nonexistent, caller-authenticated immutable-diff object (F-065-01).
6. **Release another execution's lock or modify task ownership: met in reviewed source.** No task, ownership, orchestration, filesystem-write, or lock-release operation exists in the executor module.
7. **Use a mutable branch head where an immutable commit is required: not established end to end.** OID equality and syntax are enforced, but the evidence authority can be installed by the caller (F-065-01).
8. **Treat missing, skipped, timed-out, cancelled, neutral, or stale checks as passing: not established end to end.** The local evaluator rejects every named state, but the authenticated check/policy universe is supplied by the caller-mintable authority (F-065-01).

Only prohibitions 3 and 6 are established at the reviewed source boundary. A partially established prohibition set cannot support a passing Security verdict.

## Executor-reachable capability statement

| Capability | Re-derived result at target |
|---|---|
| Obtain a raw credential | No source-level path found. Live broker isolation remains unexecuted. |
| Construct an arbitrary request or merge object | **Yes at the application composition boundary.** The shipped registry seal accepts caller-selected concrete objects and makes the resulting capability nominally recognized (F-065-01). |
| Observe or mutate policy | No explicit application policy-mutation method exists. A caller-selected authority can fabricate the policy observations that software treats as authenticated (F-065-01). |
| Bypass branch protection | No explicit bypass endpoint exists. End-to-end protection is not established because the concrete merge object is caller-mintable and live controls are unexecuted. |
| Replay or forge evidence | **Yes.** The caller can mint the authority that resolves activation, policy, human, execution, and immutable-diff evidence (F-065-01). |
| Cross approved scope | **Yes in the defensive caller-authority model.** The nonexistent immutable-diff source was admitted, so no independent complete base-to-head path universe is established. |
| Reach `main` through a second source-level call | No second call site was found. The sole call remains unsafe because the concrete object behind it can be caller-sealed. |

## Exact target, publication, and provenance evidence

- Cumulative merge base: `d63864bcb25fc8897b21c09f8f687e390f85808d`; ten commits; 52 paths; all within `scripts/release/integration-merge/**`.
- Remediation merge base and parent: `19e75e996e8e116f74b4f8feb363ef13438a42b9`; one commit; 19 paths; all within the same module.
- Local `refs/remotes/origin/agent/gpt/devops/task-064` and read-only `git ls-remote` both equal the immutable target.
- Pull request 48 is open, non-draft, mergeable/clean, based on `integration/autonomous-runtime`, and has exact head `610716aabc9a6cdf455fe45c32c88eeb20caa588`.
- Exact-head check run `validate`, ID `93439659714`, and check run `security`, ID `93439659618`, are completed with conclusion `success`; `assert-check-runs.ps1` returned `pass`, two required contexts matched, zero unmatched.

These publication and CI facts are evidence for the immutable target. They are not a Security verdict and do not cure F-065-01.

## Executed and unexecuted fixtures

### Executed

- Focused `task-064-remediation.test.ts`: 6/6 passed, 0 failed/TODO.
- Full integration-merge runner: 556 declared; 545 executed and passed; 0 failed, skipped, or cancelled; 11 TODO/unexecuted; exit 0.
- The full runner includes TASK-054, TASK-058, TASK-061, and TASK-063 regression families, activation/dormancy, policy, gate, protected-path, immutable-diff, durable store, retry, recovery, and static dependency checks.
- Independent direct-registry assertion: capability minted and recognized; production admission returned `admitted`.
- Independent caller-resolver assertion: nonexistent immutable-diff object accepted; production admission returned `admitted`; Git object lookup exited 128.
- `validate-framework.ps1`: passed for 13 roles.
- `test-orchestration.ps1`: passed.
- `test-check-run-evidence.ps1`: passed, 82 assertions; expected invalid-input diagnostics remained fail-closed.
- `check-repository.ps1`: passed.
- Cumulative and remediation `git diff --check`: passed.
- Application and runtime-host `npm pack --dry-run --json`: completed and exposed the packaging facts recorded in F-065-01.

No executed fixture performed, requested, or simulated a live merge.

### Unexecuted - not passing evidence

The following 11 committed fixtures remain `todo` and were not executed:

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

No unexecuted fixture is counted in the 545 passing total. This task did not provision, fake, or access the human-controlled control plane.

## Verification

| Command or method | Result |
|---|---|
| Branch/assignment/worktree/hooks/lock/token verification | Passed: exact `agent/gpt/security/task-065`; `security` / `gpt`; isolated fixed-base worktree; TASK-065 lock and local token match. |
| Immutable task, HUMAN-004, architecture/ADRs/approval, and all four Security reports | Read directly through `git show <exact-commit>:<path>` at the identifiers in Identity. |
| Target ancestry, tree, parent, path, stat, NUL, and whitespace checks | Passed with the exact counts above; zero out-of-module paths and zero NUL-bearing paths. |
| Exact detached-target focused and full test suites | Owner fixtures passed; the independently tested registry/diff boundary failed conformance as F-065-01. |
| Static source and package-boundary review | One production merge call; no generic Git/HTTP/process/environment/task/lock mutation surface; application artifact ships the seal; host artifact omits its imported parent files. |
| Read-only origin/PR/exact-head check queries | Exact target, open non-draft PR 48, and two successful required contexts confirmed; no remote state changed. |
| Framework, orchestration, check-evidence, repository-security, and diff checks | Passed with results recorded above. |

## Artifacts, risks, and handoff

- Changed artifact: `reports/security/TASK-064-RELEASE-MERGE-EXECUTOR-SECURITY-ROUND-5.md` only.
- Fresh finding: F-065-01, Critical, owner `devops`, status open.
- Unresolved blocker: the application package can invoke the registry seal and authenticate caller-selected authority, merge, and immutable-diff implementations.
- Atomic consequence: all five Security relations remain open; integration and `implementationSecurityReview` production are prohibited.
- No risk acceptance is recorded.
- Work explicitly outside this role: no implementation, test, task, governance, Reviewer/QA artifact, credential, policy, activation, control-plane, or merge change was made; no PR was approved or merged.
- Required next owner: TASK-013 Orchestrator to consume this atomic verdict, preserve all five open relations, and route F-065-01 to `devops`. A new independent Security round must revalidate a new immutable remediation target.
- Task lock release: recorded externally after durable report publication and exact-head CI; no content commit may be added merely to record that later fact.
