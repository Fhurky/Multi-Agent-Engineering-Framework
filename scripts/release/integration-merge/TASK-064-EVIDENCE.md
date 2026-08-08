# TASK-064 owner evidence

This module-local artifact maps the TASK-063 round-4 Security findings to the TASK-064
implementation and offline defensive counterexamples. It is DevOps owner evidence only:
it records no Security verdict, risk acceptance, activation, merge, policy mutation, or
control-plane provisioning. TASK-065 alone may disposition the findings in a separate
execution context against the immutable published target.

## Identity and boundary

- Task: `TASK-064`
- Role / LLM family: `devops` / `gpt`
- Branch: `agent/gpt/devops/task-064`
- True ancestry base: `19e75e996e8e116f74b4f8feb363ef13438a42b9`
- Normative architecture: `f148567d716c00d7a24783318c8d6d7031492e7b`
- Governance authority: HUMAN-004 at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`
- Security source: TASK-063 at `7e610fabd663779724a94deec0046981e997f298`
- Authored scope: `scripts/release/integration-merge/**` only

The executor remains dormant. The host/runtime, policy observer, attestor, credentials,
GitHub policy, live merge broker, and live immutable-object resolver are not provisioned
or invoked by this task.

## Finding matrix

| Finding | Reproduced counterexample | Remediation boundary | Offline evidence |
|---|---|---|---|
| F-063-01 | Directly import the application capability facade, attach caller authority/merge/authenticator objects to a frozen structural capability, and submit it to production admission. | `composition-capability.ts` is consumer-only; the application package exports only `index.ts`, excludes `runtime-host/` from its deployable file allowlist, and contains no caller-authenticator composition API. The separately deployable `runtime-host/` package owns composition and one-shot issuance from an independently provisioned record. | `task-064-remediation.test.ts` proves the direct facade has no issuer and the structural object resolves to no capability; `static-dependency.test.ts` proves package/export separation and forbids application imports of the host. |
| F-063-02 | Supply a canonical, self-consistent local subset diff with an OID-shaped but nonexistent evidence object while omitting a protected path. Also substitute producer/artifact/base/head identity or truncate/ambiguate the entry universe. | `AuthenticatedAdmissionUniverse` carries only `ImmutableDiffArtifactRef`. The bound authority must independently `resolveImmutableDiff`; validation binds repository/base/head, exact commit/path, canonical object bytes/digest, non-executor producer and authorization, and a non-recursive artifact-identity digest before validating complete pages and entries. The caller-local receipt is not read. | `task-064-remediation.test.ts` rejects caller-local subsets, unresolved/nonexistent objects, source/producer/base/head substitutions, truncated pagination, and ambiguous rename/deletion transitions. Prior TASK-062 protected-path and completeness fixtures remain passing. |

## Defensive invariants preserved

- Activation still requires every immutable member and independently authenticated
  authority binding; landing code does not activate the executor.
- Admission remains total and fail-closed before intent or merge mutation.
- Policy-control classification, branch semantics, required checks, gate/security
  admissibility, protected paths, exact head/base/tree/order, and publication evidence
  remain unchanged except for consuming the independently resolved diff source digest.
- Durable intent, authenticated receipts/history, executor lease, absolute deadline,
  bounded retry, reconciliation-before-retry, ambiguous-result handling, and terminal
  evidence remain covered by the complete suite.
- The only merge port still has one literal integration-to-`main` operation. No generic
  Git/HTTP/process/environment/policy/task/lock capability was added.
- The eleven live HUMAN-004 control-plane fixtures remain explicitly TODO/unexecuted;
  none was stubbed, simulated, provisioned, or reported as passing.

## Verification contract

The final published head must rerun and externally record:

1. `node --test scripts/release/integration-merge/tests/task-064-remediation.test.ts`
2. `./scripts/release/integration-merge/run-tests.ps1`
3. `./scripts/ci/validate-framework.ps1`
4. `./scripts/orchestration/test-orchestration.ps1`
5. `./scripts/security/check-repository.ps1`
6. `git diff --check 19e75e996e8e116f74b4f8feb363ef13438a42b9..HEAD`
7. `./scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef 19e75e996e8e116f74b4f8feb363ef13438a42b9 -SettingsPath <effective-settings>`
8. Exact merge-base, origin branch, non-draft pull request, and exact-head CI checks.

The immutable final commit, origin ref, pull request, CI run identities, clean worktree,
and normal task/resource-lock release belong in the external publication/handoff record
because committing those observations would change the head they describe.

## Residuals and handoff

- F-063-01 and F-063-02 remain Critical and unaccepted until TASK-065 records a passing
  independent Security verdict. This owner does not claim either is resolved.
- The human-controlled runtime host, immutable-object source, credential broker,
  policy observer/attestor, GitHub controls, and live persistence/merge services remain
  unprovisioned. Their eleven committed live fixtures remain intentionally unexecuted.
- Required next owner: TASK-013 binds the immutable publication, then TASK-065
  (`security` / `gpt`) independently performs Security lineage round 5.
