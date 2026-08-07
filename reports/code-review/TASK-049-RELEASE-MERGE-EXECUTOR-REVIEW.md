# TASK-053 Independent Review of the TASK-049 Release Merge Executor

## Review identity

- Role: Independent Reviewer (`reviewer` / `gpt`)
- Relation: `(TASK-049, review, round 1)`, `LIN-RELEASE-EXECUTOR-REVIEW` round 1
- Immutable target: `9fb2eb0ca7c02101fd067452824e2612fda5cc0c`
- Authored-delta base: `d63864bcb25fc8897b21c09f8f687e390f85808d`
- Review branch: `agent/gpt/reviewer/task-053`
- Review branch point: `1dd3b93e37a17e42c118c78c95515163783bdd45`
- Author context: `devops` / `claude`; reviewer context: `reviewer` / `gpt`

## Verdict

**changes-required**

TASK-049's module **may not be integrated**, and this review **may not produce the `implementationReview` activation member**. The implementation has multiple High-severity fail-open paths in policy attestation, aggregate-gate resolution, release-lineage evidence, activation, and retry/recovery behavior. The nominal test suite and the owner's published evidence are useful evidence, but they do not disprove the independently reproduced counterexamples below.

The 11 deliberately unexecuted live fixtures are not the reason for this verdict. Under the approved split of responsibility, those fixtures do not by themselves prevent review or integration of a correct dormant implementation; they remain a TASK-055 validation and activation prerequisite. The blocking reasons for this verdict are the implementation findings below.

## Findings

### F-053-01 — High — Policy attestations are not cryptographically authenticated

**Owner:** `devops`

**Evidence:** `scripts/release/integration-merge/policy-control.ts:224-257` compares issuer metadata and checks only that `signature` is a non-empty string. `scripts/release/integration-merge/contracts.ts:79-85` pins a public-key digest but supplies no verification key or verifier. The target's own fixture comment at `scripts/release/integration-merge/tests/helpers/fixtures.ts:7-10` states that the module never verifies the raw signature. This conflicts with the approved contract's signed-payload and Ed25519 fixture requirements (`docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md:129-135,763` at `f148567d716c00d7a24783318c8d6d7031492e7b`).

**Independent counterexample:** I changed only a valid attestation's `signature` to a different non-empty forged string. Because `attestationPayloadDigest` excludes the signature, admission returned `admitted`.

**Required change:** Verify the Ed25519 signature over the exact canonical payload using an activation-pinned trust root, fail closed on decode/key/signature errors, and add forged-signature and wrong-key tests for both authorization phases.

### F-053-02 — High — Aggregate authoritative-round resolution accepts ambiguous and mutable verdict evidence

**Owner:** `devops`

**Evidence:** `scripts/release/integration-merge/gate-admissibility.ts:42-80` deduplicates round numbers and selects the first matching relation with `find()`, so conflicting duplicate relations at the authoritative round are not rejected. `gate-admissibility.ts:193-213` returns a passing result without verifying that `relation.verdictCommit` is an immutable Git OID. `scripts/release/integration-merge/release-manifest.ts:186-239` then treats that selected relation as the result for each release domain.

**Independent counterexamples:**

1. I changed the authoritative review relation's `verdictCommit` to `refs/heads/mutable-review`, rebuilt the enclosing snapshot/attestation binding, and admission returned `admitted`.
2. I appended a second review relation at the same authoritative round with `verdictState: open` and `relationSetComplete: false`; admission selected the earlier passing relation and returned `admitted`.

The same generic resolver is used by all seven domains, so the defect applies to review, security, QA, performance, documentation, deployment, and rollback.

**Required change:** Reject more than one relation for any `(lineage, gate, lineageRound)`, validate every relation in the claimed complete set, require immutable verdict commits before evaluation, and add permutation-independent duplicate/conflict cases for all seven domains.

### F-053-03 — High — A suffix of the required release lineage is accepted as complete evidence

**Owner:** `devops`

**Evidence:** `scripts/release/integration-merge/release-lineage.ts:93-152` validates only the units supplied by the caller and accepts caller-provided `verified: true`. At `release-lineage.ts:201-225`, the first supplied content unit may name `null` or any immutable `previousResultTreeOid`; there is no binding to the required initial integration tree or expected ordered unit inventory. `scripts/release/integration-merge/contracts.ts:284-301` likewise carries no independently pinned expected unit set.

**Independent counterexample:** Starting from valid integration evidence, I removed the first required content unit, retained only the TASK-018 suffix, recomputed and pinned the evidence-set digest, and admission returned `admitted`.

**Required change:** Bind admission to an immutable complete ordered inventory and initial tree, derive verification from evidence rather than a caller boolean, and refuse any prefix/suffix omission, duplicate, or reordered unit after recomputation.

### F-053-04 — High — Activation members are not bound to their required identity or producer

**Owner:** `devops`

**Evidence:** `scripts/release/integration-merge/activation.ts:52-82` checks that a passing gate reference has some lineage, round, immutable verdict commit, passing state, and `producedByExecutor !== true`, but does not bind the member to its expected gate, lineage, target, or review identity. `activation.ts:85-108,179-200` checks artifact path/commit/digest only. The artifact shape at `scripts/release/integration-merge/contracts.ts:62-67` cannot express producer provenance.

**Independent counterexamples:** Replacing `implementationReview` with a copy of `architectureReview` still returned `activated`. Adding `producedByExecutor: true` to `negativeCapabilityTestAttestation` also returned `activated`.

**Required change:** Give every activation member an exact expected kind, gate/lineage, target commit, and independently verifiable producer/provenance binding, and reject executor-produced evidence for every member.

### F-053-05 — High — Terminal refusal and execution-time revalidation are not authoritative

**Owner:** `devops`

**Evidence:** `scripts/release/integration-merge/execute.ts:209-284` handles terminal `merged`, `recovered_merged`, `result_unverifiable`, and `outcome_unknown` states but falls through for terminal `refused` and `human_exception_required`. At `execute.ts:318-345`, the claimed fresh revalidation rereads only the PR, base, and checks; activation, published-head evidence, gate/security snapshots, integration evidence, protected paths, policy control, and irreversible-coupling state are reused from the caller's prior input. The approved order requires those inputs to be reread (`POST-GATE-MERGE-EXECUTORS.md:470-475` at the normative commit).

**Independent counterexample:** I preloaded a terminal `refused/PolicyAttestationInvalid` outcome for the plan's idempotency key. Execution ignored it, called the merge port once, and returned `merged`.

**Required change:** Treat every durable terminal outcome as terminal, define exact replay behavior for exception/refusal records, and obtain authoritative fresh versions of every mutable/control-plane admission input before any intent or mutation.

### F-053-06 — High — Retry authorization, durable attempt accounting, and result reconciliation are incomplete

**Owner:** `devops`

**Evidence:** `scripts/release/integration-merge/execute.ts:624-839` obtains policy authorization once before entering the retry loop, sleeps, and calls the mutation port again without reacquiring or revalidating authorization after the delay. `scripts/release/integration-merge/contracts.ts:927-943` exposes an `attempts` count on reads but no operation that durably records an attempt before the mutation; the provided store at `tests/helpers/fakes.ts:154-244` never increments it. Result verification at `execute.ts:132-159` checks the tree and the base ref's literal name, but does not prove that the merged commit is reachable from or contained by the protected base in the required order, contrary to `POST-GATE-MERGE-EXECUTORS.md:475-477`.

**Independent counterexample:** A first rate-limit response with `Retry-After: 50` seconds advanced the clock to the attestation's expiry. The executor then made a second mutation call and returned `merged` without a fresh policy authorization. A fresh process can also receive the unchanged stored attempt count.

**Required change:** Persist each attempt atomically before its mutation, enforce the global budget across restarts, reacquire and validate a fresh pre-mutation attestation after any wait, reconcile before every retry, and prove protected-base reachability/order before recording a successful result.

### F-053-07 — High — Published-head evidence accepts an unbound remote and unbound resolved-base labels

**Owner:** `devops`

**Evidence:** `scripts/release/integration-merge/published-head-evidence.ts:447-506` requires `remoteRef` only to be non-empty and requires proof command IDs only to exist. Its resolved-base check at `published-head-evidence.ts:409-415` establishes equality between the two phases but not equality to an executor-known semantic base. Admission at `scripts/release/integration-merge/admission.ts:398-440` binds target, source branch, PR number, and bundle digest, but not the remote-ref identity or resolved-base keys/values to the expected repository/ref/base.

**Independent counterexample:** I changed `control.noLaterContent.remoteRef` to an unrelated non-empty ref, recomputed the canonical bundle digest, repinned the manifest, and admission returned `admitted`.

**Required change:** Define and validate the exact remote ref and required resolved-base names/values, and semantically bind the proof commands and material arguments to those facts rather than accepting arbitrary present command IDs.

### F-053-08 — Medium — Admission is not total for hostile runtime input

**Owner:** `devops`

**Evidence:** `scripts/release/integration-merge/admission.ts:111-140` dereferences `input.securitySnapshot.snapshotDigest` while computing the context before the security snapshot shape check at `admission.ts:446-471`. The repository has no TypeScript compiler gate, so annotations do not protect this runtime boundary.

**Independent counterexample:** Passing the otherwise valid scenario with `securitySnapshot: null` threw `TypeError: Cannot read properties of null (reading 'snapshotDigest')` instead of returning the typed `SecurityEvidenceMissing` refusal.

**Required change:** Validate the complete runtime input shape before any dereference or digest computation and add hostile `unknown`-input tests that assert exactly one typed result and no exception.

## Scope judgments

| Scope obligation | Judgment | Evidence and rationale |
|---|---|---|
| Changed paths stay within the authorized module | **met** | `git diff --name-only d63864b...9fb2eb0...` returned 38 paths, all under `scripts/release/integration-merge/**`; the diff is 12,034 insertions and 0 deletions. No governance, enforcement, settings, workflow, hook, CI, quality, report, task, or other source path changed. The merge base equals the declared review base, and the range contains two commits. |
| Exactly one aggregate requirement for every release domain, using authoritative admissibility and rejecting owner/generic forms | **not met** | Manifest-level count/class checks in `release-manifest.ts:32-173` behave nominally, but the authoritative resolver admits duplicate/conflicting same-round relations and mutable verdict commits (F-053-02). |
| Missing, duplicate, point, open/incomplete, stale, formal-acceptance, and non-passing cases produce no plan/intent/call | **not met** | My independent nominal matrix refused every listed manifest mutation with no plan and no execution. However, a duplicate same-round incomplete/open relation is admitted, so the required duplicate/incomplete closure property is false (F-053-02). |
| Sole exact immutable accepted blocking-security-risk exception | **met** | `gate-admissibility.ts:121-190,221-266` validates immutable record/decision/target/security-verdict identities and exact finding/round/lineage/scope matching. The exact record admits; all one-field near-misses in the rerun return `SecurityRiskAcceptanceInvalid`; a bare generic formal acceptance returns `PreMergeGateNotPassing`. This does not cure F-053-02's generic relation ambiguity. |
| Complete immutable release-lineage evidence for runtime/operator/mixed provenance | **not met** | Nominal duplicate/reorder/unverifiable cases refuse, but a digest-recomputed suffix with a missing predecessor is admitted (F-053-03). |
| Structural negative-capability table and exactly one exact-head PR merge port | **met** | `contracts.ts:945-980` exposes one mutation method; `merge-port.ts:32-49` enumerates only `mergeIntegrationPullRequestIntoMain` and constructs requests with plan head, literal `main`, and literal `merge`. The static suite and my source/import scan found no generic HTTP, ref update, push, force, hook bypass, admin override, check/policy/ruleset/gate/task/lock mutation. See the explicit second-path result below. |
| No executor policy-observation port; consume complete fresh plan-bound signed attestation only | **not met** | No observation/admin port or runtime credential dependency exists, and most subject/freshness checks are present, but the signature is not verified at all (F-053-01). |
| Durable receipt-backed intent, exact-once recovery, reconciliation, bounded retry, OutcomeUnknown | **not met** | Nominal crash/ambiguity fixtures pass, but durable terminal refusals can be replayed into mutation, retries reuse stale authorization, attempts are not durably recorded, and merged-result reachability is not checked (F-053-05 and F-053-06). |
| No runtime implementation/root import and not a generic Git helper | **met** | Production imports are local module files except `node:crypto`; the static dependency suite passed. No runtime implementation module, runtime contract root, child process, shell, generic Git, or generic HTTP dependency was found. |
| No irreversible production-action coupling | **met** | Manifest validation requires an immutable authorization if coupling is declared; the valid/default evidence is `coupled: false`. No deployment or production-action port, call, or side effect exists in the module. |
| No claim that activation prerequisites or external blockers are satisfied | **met** | `merge-port.ts:52-65` ships a dormant no-I/O port returning `unsupported`, and absent activation members fail closed nominally. The target does not claim that the control plane, live tests, or activation record currently exists. F-053-04 separately shows that a future activation record is insufficiently bound. |

## Seven-domain independent matrix

For each domain I independently constructed: missing requirement, duplicate requirement, point requirement, stale minimum round, open relation, incomplete relation set, generic formal acceptance without an authorized security-risk record, failed verdict, withdrawn owner form, and `gate_passed` alone. Each nominal case returned a refusal, constructed no plan, and therefore made zero durable-intent and merge-port calls. Codes are abbreviated only in this table: `RGDM` = `ReleaseGateDomainMissing`; `RMI` = `ReleaseManifestInvalid`; `RGNP` = `ReleaseGateNotPassing`; `PMGO` = `PreMergeGateOpen`; `PMGNP` = `PreMergeGateNotPassing`.

| Domain | Missing | Duplicate requirement | Point | Stale | Open / incomplete | Generic formal / failed | Owner form | `gate_passed` alone | Domain result |
|---|---|---|---|---|---|---|---|---|---|
| review | RGDM | RMI | RMI | RGNP | PMGO / PMGO | PMGNP / PMGNP | RGNP | PMGO | **not met** — F-053-02 admits a conflicting duplicate same-round relation and mutable verdict ref |
| security | RGDM | RMI | RMI | RGNP | PMGO / PMGO | PMGNP / PMGNP | RGNP | PMGO | **not met** — same shared resolver defect; the exact accepted-risk subpredicate itself is met |
| qa | RGDM | RMI | RMI | RGNP | PMGO / PMGO | PMGNP / PMGNP | RGNP | PMGO | **not met** — same shared resolver defect |
| performance | RGDM | RMI | RMI | RGNP | PMGO / PMGO | PMGNP / PMGNP | RGNP | PMGO | **not met** — same shared resolver defect |
| documentation | RGDM | RMI | RMI | RGNP | PMGO / PMGO | PMGNP / PMGNP | RGNP | PMGO | **not met** — same shared resolver defect |
| deployment | RGDM | RMI | RMI | RGNP | PMGO / PMGO | PMGNP / PMGNP | RGNP | PMGO | **not met** — same shared resolver defect |
| rollback | RGDM | RMI | RMI | RGNP | PMGO / PMGO | PMGNP / PMGNP | RGNP | PMGO | **not met** — same shared resolver defect |

## Second-path counterexample result

I found **no second mutation path** by which this module can reach `main` other than the exact-head pull-request merge port under server-side branch rules and required checks. The actual operation surface is the one-element list `['mergeIntegrationPullRequestIntoMain']` at `scripts/release/integration-merge/merge-port.ts:32-34`, and the request builder fixes the exact plan head, `main`, and ordinary merge at `merge-port.ts:40-49`. `scripts/release/integration-merge/contracts.ts:945-951` describes it as the “one and only external mutation,” and the code surface matches that statement.

I attempted the required implementation-level second-path construction by tracing all production imports, exported dependency interfaces, external calls, command/environment strings, and mutation-like methods. The only non-local production import is `node:crypto`; there is no HTTP client, generic endpoint, ref writer, shell/process runner, Git helper, push/force/admin/check/policy/ruleset/gate/task/lock writer, credential reader, or alternate merge operation.

This narrow surface does **not** make the implementation approvable: F-053-01 through F-053-07 show ways to reach that sole port with authority evidence that the approved protocol requires the executor to reject. In other words, no alternate API exists, but admission to the sole API is not fail-closed.

## Continuous-integration evidence for the immutable target

I queried check runs for `9fb2eb0ca7c02101fd067452824e2612fda5cc0c` directly on 2026-08-08. Exactly two GitHub Actions check runs exist and both are bound to that exact head:

| Check | Check-run ID | App ID | Conclusion | Completed UTC |
|---|---:|---:|---|---|
| `validate` | `93013249337` | `15368` | `success` | `2026-08-07T22:23:12Z` |
| `security` | `93013249507` | `15368` | `success` | `2026-08-07T22:23:27Z` |

The legacy commit-status rollup reported `pending` with an empty `statuses` array. I treat that empty rollup as **absence**, not as a passing check. The two successful check runs above are the actual exact-head CI evidence. Earlier checks on `012bdb8360a7a1b4e61b362d9302f731ad817078` were not used as evidence for this target.

PR 30 was independently observed open, not draft, based on `integration/autonomous-runtime`, with head `9fb2eb0ca7c02101fd067452824e2612fda5cc0c`; the remote task branch also resolved to that exact commit. These are publication facts, not this verdict.

## Published-head-evidence/v2 assessment

I decoded the owner's PR 30 evidence comment (`5222784899`) and recomputed both canonical phase digests and the final bundle digest independently:

- Encoded payload: 4,972 base64 characters; gzip: 3,727 bytes; gzip SHA-256 `8764b321a6e9cf5b32743a7db3d623b645bec4e4701803895059b2742f78dbda`.
- Canonical JSON: 22,960 bytes without BOM; SHA-256 `18ff4f727137a174449734f902073643da708e9a75f51a0d0d648413264cf7d2`.
- Author phase: 8 command records; recomputed digest `f0b2377e6cb9d95ddcec9b5c5c32714d89fac1dfbc37097bfdae77dba0246bcd`, matching the declared and control-pinned value.
- Control phase: 7 command records; recomputed final bundle digest `c6a9e4a173ed7fe68e2c53b9eaa7d477549aff3138ef8937c9fe14859ed03a03`, matching the declaration.
- All 15 command IDs recomputed exactly; all required fields were present; every recorded head before/after was the target; every exit code matched; author and control phases were distinct; declared checks and resolved bases matched across phases.
- The no-later-content proof named the exact local, remote, and PR heads with zero commits after target, and its exact-head check facts matched the live GitHub query above.

The published owner bundle is therefore internally complete and digest-consistent for the target. It remains owner evidence, not a verdict. F-053-07 is a separate implementation-contract finding: the validator can accept a newly recomputed bundle whose remote/base semantics are not bound to the expected identities.

## Deliberately unexecuted live fixtures

The exact-target test run reported **416 total, 405 pass, 0 fail, 11 todo**. The 11 todos are six live protected-branch cases and five live attestor-boundary cases. They were registered but not executed because the human-controlled Apps, branch policies, observer credentials, signing/revocation service, and attestor boundary are intentionally absent.

My judgment is:

- They are **not passing tests** and must never be represented as 416 executed successes.
- They **do not alone block TASK-053 approval or integration of a correct dormant module**, because TASK-055 expressly owns the live retrospective validation and the target correctly makes no claim that the external control plane exists.
- They **do block activation**, production use, and production of the `negativeCapabilityTestAttestation` member until TASK-055 executes and validates them against the real control plane.
- This report is nevertheless `changes-required` because the executed implementation has the independent blocking findings above.

## Verification evidence

| Check | Result |
|---|---|
| `scripts/orchestration/validate-assignment.ps1 -Role reviewer -Llm gpt` | Passed: assignment valid for `reviewer` / `gpt`. |
| Immutable topology and diff inspection | Passed: base is the merge base; two target commits; 38 authorized paths; 12,034 insertions; 0 deletions. |
| `scripts/release/integration-merge/run-tests.ps1` from an isolated archive of the target | Exit 0 on Node `v26.4.0`: 416 total, 405 pass, 0 fail, 11 todo. |
| Reviewer seven-domain negative matrix | All nominal cases refused with no plan; F-053-02 counterexamples admitted. |
| Reviewer hostile/bypass counterexamples | Reproduced: forged signature admitted; mutable verdict admitted; duplicate incomplete relation admitted; missing lineage predecessor admitted; wrong remote evidence admitted; null security snapshot threw; terminal refusal replay merged; expired-authorization retry merged. |
| Reviewer activation counterexamples | Reproduced: substituted architecture gate accepted as implementation review; executor-produced artifact accepted. |
| `scripts/ci/validate-framework.ps1` | Passed for 13 roles. |
| `scripts/ci/test-orchestration.ps1` | Passed. |
| `scripts/ci/test-check-run-evidence.ps1` | Passed: 82 assertions; expected negative diagnostic cases were emitted. |
| `scripts/security/check-repository.ps1` | Passed. |
| `git diff --check d63864bcb25fc8897b21c09f8f687e390f85808d 9fb2eb0ca7c02101fd067452824e2612fda5cc0c` | Passed with no output. |
| `scripts/orchestration/validate-write-scope.ps1 -Role reviewer -Llm gpt -BranchName agent/gpt/reviewer/task-053 -IncludeWorkingTree -BaseRef 1dd3b93e37a17e42c118c78c95515163783bdd45` | Passed: `valid: True`, exact branch/role/LLM, `changed_files: 1`. |
| Final `git diff --check` | Passed with no output. |

## Review decision and handoff

- Verdict: **changes-required** for `(TASK-049, review, round 1)`.
- Integration: **not permitted** by this review.
- `implementationReview` activation member: **must not be produced**.
- Changed artifact: only `reports/code-review/TASK-049-RELEASE-MERGE-EXECUTOR-REVIEW.md`.
- Required next owner: Orchestrator under TASK-013 to route findings to `devops`; this reviewer must not implement remediation.
- Independent gates still remain with TASK-054 (`security`) and TASK-055 (`qa`); this report neither performs nor predicts either gate.
- Remaining risk: even after code remediation, the 11 live fixtures and every activation prerequisite remain outstanding until their separately owned evidence exists.
