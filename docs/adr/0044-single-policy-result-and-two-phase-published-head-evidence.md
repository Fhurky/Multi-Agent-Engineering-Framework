# ADR-0044: Single Policy Result and Two-Phase Published-Head Evidence

- Status: Proposed under TASK-046; independent TASK-047 review pending
- Date: 2026-08-07
- Decision owner: Solution Architect
- Governance authority: HUMAN-004 at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`
- Remediates: F-044-01, F-044-02, and F-044-03 from independent TASK-044 at `6f7f0edb63615d7f143dd6c59750a5ea7db701fc`
- Supersedes in part: [ADR-0043](0043-exact-merge-admission-policy-attestation-and-published-head-evidence.md) for policy-control result classification, executor repository-read wording, and published-head evidence construction
- Preserves: [ADR-0042](0042-conditionally-authorized-post-gate-merge-executors.md)'s two executors, owners, API-only mutations, evidence order, retry/recovery, ingress ownership, and exactly three HUMAN-004 exception kinds

## Context

TASK-044 recorded `changes-required` for the cumulative TASK-040/TASK-042 integration-authority amendment. The contract declared `MergeAdmissionResult` closed and mutually exclusive, but the same policy-control state could select two members. A missing observer credential could make the attestor unavailable, while missing credentials were also HUMAN-004's third exception. A changed ruleset was both policy drift and the third exception. Separate prose constructors therefore could not produce one deterministic durable result.

The component diagram also gave each executor identity a direct policy-read responsibility while the normative boundary prohibited a policy-observation port. The two descriptions assigned the same security-sensitive access to different principals.

Finally, the published-head evidence contract required remote, pull-request, check-run, working-directory, timing, and exit-code facts without distinguishing when those facts can exist. An author can run exact-head local checks only after the final commit, while remote head, pull-request head, no-later-content, and exact-head checks can be established only after publication. Treating both as one pre-publication record made the strict obligation impracticable and caused the owner's own evidence to omit required fields.

## Decision

### Policy-control classification has one ordered constructor

All raw activation, broker, observer, status-channel, and attestation facts are normalized once into `PolicyControlFacts`. Its `action` member is exactly one of `detected`, `excluded`, or `unknown`; contradictory evidence normalizes to `unknown`. Its observation member is a closed discriminated union of current-valid, operationally unavailable, present-invalid, or present-valid-but-stale.

The final admission selector returns at the first applicable stage. Invalid source shape and non-policy activation failures precede policy classification. `classifyPolicyControl` then applies this total order:

1. A verified credential, issuer/key, permission, branch-protection, ruleset, required-check-source, bypass-set, authorization-policy, or provisioning action produces one detected `change_credentials_or_repository_authorization_policy` exception.
2. A cause that cannot conclusively exclude such an action produces one unclassifiable exception whose candidate set contains the third HUMAN-004 kind.
3. Only when control action is authoritatively excluded can the observation map to usable, `PolicyObservationUnavailable`, `PolicyAttestationInvalid`, or `PolicyAttestationStale`.

Verified ruleset drift and verified issuer/key revocation are therefore control-plane actions, not competing refusal results. Known absent attestor or observer-credential provisioning is the third exception once non-policy activation prerequisites are valid. A transient operational outage is a refusal only when control-plane action is excluded. Every non-usable result has no plan, no durable merge intent, and no GitHub call. If more than one HUMAN-004 condition exists, the fixed admission-phase order returns one result; a new immutable evaluation after remediation may expose another.

### Executors never own policy observation

The task integration and release executor identities can read only immutable pull-request, check, head, and base state and can call only their executor-specific exact-head merge endpoint. Neither identity has Administration, ruleset, bypass, policy-read, policy-write, or arbitrary HTTP authority.

Only separately controlled policy-observer principals reach classic branch protection, applicable repository/organization/enterprise rulesets, required-check sources, and complete bypass/exemption state. The human-controlled `RepositoryPolicyAttestor` binds those observations to the exact repository, ref, pull request, head, base, executor identities, admission context, and phase, then provides the executor only a signed fresh payload after revocation and drift checks. Observer principals have no Contents-write or merge port.

The attestor, credentials, branch protection, rulesets, and executor Apps remain unprovisioned human-controlled dependencies. This decision neither creates a repository module nor claims current constructibility.

### Published-head evidence is one bundle with two phases

`published-head-evidence/v2` is an external immutable bundle keyed by one full target commit. Its author phase is produced after the final content commit and before publication. Every declared target-dependent command records the target SHA, branch, absolute working directory, start/end UTC, executable and arguments, material arguments, resolved bases, head before/after, expected and actual integer exit codes, and actual result or reproducible derivation.

Every self-identifying digest has one explicit non-recursive projection under the repository canonical JSON rules. Command `evidenceId` hashes the complete command record with only `evidenceId` omitted; `canonicalAuthorEvidenceDigest` hashes the complete author record with only `canonicalAuthorEvidenceDigest` omitted; and `canonicalBundleDigest` hashes the complete bundle with only `canonicalBundleDigest` omitted. The named property is absent rather than `null`, empty, or placeholder-valued, every other property remains, and verification independently repeats the same projection before exact lowercase hexadecimal comparison.

Its control phase is produced only after the exact target is pushed and the pull request exists or is updated. A separate control session verifies the author digest, records equivalent command evidence for its publication queries, proves local branch, remote branch, and pull-request head all equal the target with zero later commits, and records the exact target's GitHub checks as present-successful, present-nonpassing, or absent.

Admission requires both phases against the same target, branch, bases, declared check set, and author digest. Missing fields or a missing phase produce `PublishedHeadEvidenceIncomplete`; a target/ref/base/digest/no-later-content mismatch produces `PublishedHeadEvidenceMismatch`; an unexpected command exit produces `PublishedHeadVerificationFailed`. Check absence may be truthfully recorded in a structurally complete bundle but still fails the separate required-check predicate. Any later content commit invalidates both phases.

This split permits TASK-046 to provide only real author-phase evidence after its final commit. The later control session publishes that exact commit and supplies only facts it actually observes. Until then, the complete bundle does not exist and admission remains closed.

## Alternatives considered

### Keep refusal and exception predicates separate and document an informal priority

Rejected. Separate constructors can still both match the same raw state, and prose priority cannot make an implementation's result type total. One normalizer and one ordered constructor make overlap unrepresentable at the final boundary.

### Map every attestor failure to the third human exception

Rejected. A pre-authentication transport outage, authenticated rate limit, upstream server failure, stale attestation, or malformed payload can be operational without requiring a credential or repository-policy action. HUMAN-004 does not turn routine operational remediation into a human exception.

### Map every missing or changed policy symptom to a refusal

Rejected. Granting, rotating, or revoking credentials and changing repository governance, branch protection, or authorization policy are explicitly HUMAN-004's third exception. Hiding a verified control-plane action behind `PolicyObservationUnavailable` or `PolicyDrift` would drop authority the human decision reserved.

### Let executor identities read policy directly

Rejected. GitHub requires policy-plane permissions that would widen the mutation principals and contradict the separately controlled attestor boundary. The executors need signed results, not observer credentials.

### Require the author to provide remote and check-run evidence before publication

Rejected. Those facts do not exist before the final commit is pushed and a pull request targets it. Requiring them creates an impossible self-reference and encourages fabricated or stale evidence.

### Commit the complete evidence bundle into the target branch

Rejected. Committing evidence changes the head it describes. External pull-request and task-handoff records can bind the exact immutable target without creating a later content commit.

## Consequences

- Every policy-control input produces exactly one usable state, typed refusal, or HUMAN-004 exception result under an explicit total order.
- HUMAN-004's exactly three exception kinds remain detectable; unclassifiable is a result state and not a fourth kind.
- Executor identities have no policy-observation port and no Administration, ruleset, or bypass authority. Policy reads remain with separately controlled observer principals.
- Exact-head evidence remains strict while becoming practicable: author and control facts are captured when they can actually exist, and admission is closed until both phases are complete.
- Command, author, and complete-bundle digests each omit exactly their own top-level digest property during canonical hashing, so construction and independent verification are non-recursive and deterministic.
- The RepositoryPolicyAttestor, GitHub policy, credentials, returned `AGENTS.md` text, and tasks-owned `gate_passed` narrowing remain unprovisioned or unapplied human/Orchestrator dependencies.
- No executor implementation or validation task is created. TASK-047 alone may record the next cumulative review verdict, and only a passing verdict permits the Orchestrator to consider separately owned implementation work.
- This ADR is Architect-authored and records no review, security, QA, performance, or release approval.
