# TASK-062 owner evidence

This module-local artifact maps the TASK-062 implementation and malicious fixtures to
the three Critical round-3 Security findings. It is implementation-owner evidence only.
It does not disposition a finding, pass a gate, activate the executor, accept risk,
approve or merge a pull request, or replace the independent TASK-063 Security review.

## Identity

- Task: `TASK-062`
- Role and LLM family: `devops` / `gpt`
- Branch: `agent/gpt/devops/task-062`
- Immutable remediation base: `126f2fa9939b8ac6db4764241952dafbda50e9f4`
- Code milestones: `48ac54d`, `440bcf8`, and `a2e374a`
- Declared and actual write scope: `scripts/release/integration-merge/**`

The publication head, origin ref, non-draft pull request, and exact-head check runs are
recorded in the pull-request control record because a tracked file cannot include the
OID of the commit that contains itself.

## Round-3 finding matrix

| Finding | Reconstructed malicious input | Code boundary | Committed test evidence | Owner-observed result |
|---|---|---|---|---|
| F-061-01 | A structurally compatible authority resolver and merge port use the same asserted identities and return an internally consistent fabricated authority universe. A second case forges the public capability shape. | `composition-capability.ts` privately seals exact resolver and merge-client object references after independent authenticators bind them to the actual callable broker; `activation.ts` binds negative-capability evidence to that seal; `admission.ts` and `execute.ts` accept only the nominal capability. | `task-062-remediation.test.ts`: same-identity malicious resolver/port, structural capability forgery, and exact callable-object resolution; prior activation, dormancy, execution, and negative-capability suites. | Both caller-constructible forms are rejected before admission or mutation. Only a private composition-root capability resolves to the exact independently authenticated objects. |
| F-061-02 | The caller path list omits a protected file that is present in the exact pull-request diff. Additional cases truncate pages, substitute canonical bytes, mismatch base/head, and make rename/deletion semantics ambiguous. | `immutable-diff.ts` authenticates the exact base/head, ordered pages, entries, canonical bytes and digest, evidence commit, and complete added/modified/deleted/renamed path universe; `admission.ts` derives protected paths and pins the diff digest into context, plan, and idempotency. | `task-062-remediation.test.ts`: omitted protected path, protected-path derivation, incomplete pagination, base/head mismatch, canonical-byte substitution, rename/deletion completeness, and ambiguity. | Every incomplete, substituted, mismatched, or ambiguous input refuses before intent or merge mutation. The protected path found only in the authenticated diff returns `ProtectedPathChange`. |
| F-061-03 | A signed attestor payload copies the pinned profile digest while omitting or weakening a mandatory control, targeting a non-applicable ref, redacting policy/bypass information, or carrying a bypass actor. | `contracts.ts` represents every HUMAN-004 control and full typed rule parameters; `policy-control.ts` validates exact enumerated source shapes and applicability, independently derives a normalized effective profile, and compares its canonical digest with both the immutable profile and attestation; `admission.ts` rejects incomplete or weakened required profiles. | `task-062-remediation.test.ts`: every missing rule family, every weakened control and required-check context, non-applicable source, permission redaction, and effective bypass actor, all re-signed after mutation. | Every malicious signed variant returns `PolicyAttestationInvalid`. A copied digest cannot authenticate a different derived policy. |

## Authenticated boundaries

- The nominal `ReleaseExecutorCompositionCapability` is stored in a private `WeakMap`;
  the public module surface exposes no constructor or sealer. Independent composition
  authenticators return bindings for the exact resolver and exact merge-client object,
  and the seal includes the actual callable broker binding.
- `AuthenticatedAdmissionUniverse` includes one immutable complete diff for the exact
  release base/head. Its canonical bytes, digest, page proofs, rename/deletion
  semantics, evidence commit, and derived path universe are validated independently of
  the caller's compatibility path list.
- `RequiredGitHubPolicyProfile.branchControls` encodes pull-request-only updates,
  strict current base, administrator enforcement, force-push/deletion prohibition,
  review count and review parameters, conversation resolution, signed commits, the
  required non-linear merge shape, and an empty effective bypass set.
- Enumerated classic protection and repository/organization/enterprise ruleset records
  carry typed conditions, full rule parameters, bypass completeness, pagination, source
  digests, and explicit unknown/redacted fields. Applicability and the effective profile
  are derived inside the executor from signed observations.

## Verification

Executed from the isolated task worktree on Node `v26.4.0`:

```text
./scripts/release/integration-merge/run-tests.ps1
548 declared; 537 executed and passed; 0 failed; 11 TODO/unexecuted
```

The eleven TODOs are the pre-existing live protected-branch and attestor fixtures. They
remain truthfully unexecuted because the human-controlled control plane is absent; no
fixture was provisioned, faked, passed, requested, or simulated. The wrapper confirmed
that the executor remained dormant and no merge was performed, requested, or simulated.

The following final owner gates are required before publication and are recorded in the
pull-request control record and handoff with their exact results:

- repository security scan;
- cumulative `git diff --check` from the immutable remediation base;
- write-scope validation with the effective runtime assignment settings;
- exact local/origin/pull-request head equality and exact-head continuous-integration
  checks.

## Risks and handoff

- F-061-01, F-061-02, and F-061-03 remain Critical and blocking until TASK-063 records
  an independent passing Security verdict. This artifact claims no disposition.
- The live control plane remains absent, branch policy is not provisioned, and the
  executor remains dormant. TASK-062 neither changes nor activates policy, credentials,
  branch protection, rulesets, checks, evidence stores, or a merge broker.
- No Reviewer relation is reopened and no QA relation is created by this task.
- Required next owner: TASK-063, `security`, in a separate execution context.
