# ADR-0043: Exact Merge Admission, Trusted Policy Attestation, and Published-Head Evidence

- Status: TASK-044 recorded changes-required; superseded in part by proposed [ADR-0044](0044-single-policy-result-and-two-phase-published-head-evidence.md); independent TASK-047 review pending
- Date: 2026-08-07
- Decision owner: Solution Architect
- Governance authority: HUMAN-004 at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`
- Remediates: F-041-01, F-041-02, and F-041-04 from independent TASK-041 at `ec533fb5bb0055675fb81f72057d5636f7867db3`
- Supersedes in part: [ADR-0042](0042-conditionally-authorized-post-gate-merge-executors.md) for gate admissibility, live policy observation, and activation evidence
- Narrows: [ADR-0041](0041-cumulative-architecture-lineage-integration-unit.md) only where an automated executor consumes a formally accepted verdict; its content-unit order, exact-tree rule, and direct/subsumed evidence transaction remain unchanged

## Context

TASK-041 recorded `changes-required` for the cumulative TASK-040 target. Three defects belong to architecture. First, the executor reused the task graph's lineage `gate_passed` predicate, whose generic “passing or formally accepted” rule can admit a non-passing review, QA, or other independent verdict. HUMAN-004 permits formal acceptance only for an unresolved blocking High or Critical security risk.

Second, the executor was required to compare its policy digest with live GitHub controls and prove that neither executor App was a bypass actor, but its credential deliberately lacked the permissions needed to observe that complete state. GitHub documents Administration-read as necessary for classic branch protection, while a repository ruleset response omits `bypass_actors` unless the caller has write access to the ruleset. A Metadata-read response is therefore not a complete policy observation.

Third, owner verification was recorded for an earlier authored commit rather than for the published branch head. A later content commit invalidated the path and link counts without invalidating the handoff text. This is a general provenance defect, not a TASK-040-only reporting mistake.

## Decision

### Gate admissibility is executor-local and stricter than generic graph satisfaction

The only constructor of either `MergePlan` evaluates `ExecutorGateAdmissibility`; it does not consume `gate_passed` as a sufficient Boolean. Every authoritative independent verdict must be `passing`. The sole alternative admissible state is a security relation whose authoritative state is `formally_accepted` and whose evidence contains one immutable authorized-human accepted-risk record for every matching unresolved High or Critical security finding. Each record binds the exact finding identity and evidence digest, target commit, security relation, lineage round, acceptance decision commit, and accepting principal. It discharges only that finding.

A formal acceptance of review, QA, performance, documentation, deployment, rollback, or an unbound security result is inadmissible. So is a generic acceptance label, a record for another finding or target, a Low or Medium risk acceptance, a stale round, a mutable ref, or a partial set. Each returns `PreMergeGateNotPassing` or `SecurityRiskAcceptanceInvalid`; neither result carries a plan and neither calls GitHub.

The task graph's broader `gate_passed` definition is also wrong for this authority surface, but `tasks/**` is outside Architect scope. Its exact narrowing is returned to the Orchestrator. Until the tasks-owned source records that narrowing in an immutable commit and the activation record pins it, both executors remain `AuthorityNotActivated` even though their local predicate is safe.

### Current policy is supplied by a separate signed control-plane boundary

Neither executor receives Administration, ruleset write, bypass, generic HTTP, generic Git, or policy-mutation capability. A repository-owner-controlled `RepositoryPolicyAttestor`, external to both executor modules, is the only acceptable source of `TrustedCurrentPolicyAttestation`. The signed canonical payload binds the GitHub host, repository database and node identities, owner/name, exact protected ref, pull request, head/base OIDs, both executor App and installation identities, every applicable classic branch-protection field, every applicable repository or inherited ruleset and version, all required-check source identities, and the complete bypass/exemption actor set with stable actor IDs, types, and modes.

The attestor brokers a closed, trust-root-pinned set of policy-observer principals: Administration-read for classic protection and GitHub-recognized write access to every applicable repository, organization, or enterprise ruleset solely because GitHub requires that level to disclose bypass actors. Their stable identities, permission/scope maps, and set digest are signed in every payload. The broker exposes only enumerated policy reads and signing; the observer principals have no Contents-write or merge port and are absent from every bypass set. If any inherited layer or actor list cannot be read completely, the attestor is unprovisioned for that subject and fails closed.

The attestor identity and signing-key digest are pinned in activation. Before an attestation exists, the executor constructs a canonical admission-context nonce and digest over exact merge, evidence, and required-policy inputs; attestation-derived fields are excluded, so no circular plan hash exists. The attestor independently recomputes that context. Separate `pre_intent` and `pre_mutation` attestations bind it to the same non-revoked policy generation, are observed and issued within one minute, and expire no more than one minute after observation. Missing pagination, omitted actors, an unknown policy field, an unreachable revocation channel, signature failure, expiry, subject mismatch, issuer revocation, or any policy-generation/digest drift refuses and invalidates the plan. A later observation requires fresh admission and a new idempotency key.

GitHub does not currently expose a complete ruleset bypass-actor set to an acceptable read-only executor permission. The required attestor is therefore a truthful, unresolved human-controlled control-plane dependency. Its privileged observation credential and signing key remain outside the repository and are never exposed to either executor; its executor-facing port can only observe and sign the exact closed payload. If that dependency is not provisioned and independently validated, activation fails with `PolicyObservationUnavailable`. A partial Metadata-read observation can never be relabeled complete.

This external boundary is not an eleventh implementation module and adds no runtime import edge. It is a HUMAN-004 credential/repository-policy control-plane dependency. The ten module rows, twelve topology nodes, nineteen import edges, five-level witness, and exactly two independent contract roots remain the target-tree topology.

### Owner evidence is bound to the exact published head

Every artifact owner designates one final authored commit and reruns every declared target-dependent check with `HEAD` equal to that full commit. The durable handoff and pull-request body record the full commit, command and inputs, resolved base, result, and any derived counts. No later content commit may be presented under that evidence. If content changes, every target-dependent check is stale and must be rerun against the new head before publication or handoff.

After push, the owner proves that the remote branch and pull-request head equal the verified commit and records GitHub checks as they actually exist for that head. An empty check rollup is recorded as absent, never successful. External metadata updates that do not change the Git tree do not invalidate the evidence. The author reports verification and never converts it into an independent gate verdict.

The enforcement wording belongs in human-controlled `AGENTS.md`, so this amendment returns exact text without editing governance.

## Alternatives considered

### Reuse `gate_passed` and inspect acceptance only in the security snapshot

Rejected. The plan would already have admitted a generic formally accepted gate. Read-only evidence prevents self-authorship but does not make the wrong acceptance kind safe to consume.

### Give each executor Administration or ruleset-write permission

Rejected. It would make complete observation easier by giving the mutation principal the same policy capability HUMAN-004 withholds. It also would not preserve the separation between task merge, release merge, and repository governance.

### Treat Metadata-read ruleset responses as complete when `bypass_actors` is absent

Rejected. GitHub documents that omission as permission-dependent. Absence of the property is not proof of an empty bypass set.

### Trust a long-lived human-issued policy digest

Rejected. A digest without exact subject, freshness, signature, current generation, revocation, and drift behavior proves only historical configuration.

### Let the final content commit record its own verification results

Rejected. Committing the results changes the head those results describe and recreates F-041-04. Final target-dependent evidence belongs in the external pull-request/handoff record unless another content commit is followed by a complete rerun.

## Consequences

- Generic formal acceptance cannot construct an executor plan. The only exception is exact, immutable, target-bound acceptance of matching High/Critical security findings.
- The safe executor contract no longer depends on the broader graph predicate, while the tasks-owned graph correction remains explicit and activation-blocking rather than concealed.
- The two executor credentials remain least-privilege merge identities. A separate human-controlled policy observer/attestor is required because GitHub's documented read boundary cannot return complete bypass actors.
- Policy observation becomes cryptographically attributable, plan-bound, fresh, revocable, and fail-closed under drift or incompleteness.
- Every artifact owner's evidence names the exact final head it verified; later content invalidates earlier evidence mechanically.
- HUMAN-004's exactly three exception kinds, HUMAN-002 separation, API-merge-only surface, durable intent and recovery, ADR-0041 order, closed lineages, task/toolchain isolation, module ownership, and acyclicity remain unchanged.
- This ADR is Architect-authored and records no verdict. TASK-044 alone decides the cumulative TASK-040/TASK-042 amendment.
