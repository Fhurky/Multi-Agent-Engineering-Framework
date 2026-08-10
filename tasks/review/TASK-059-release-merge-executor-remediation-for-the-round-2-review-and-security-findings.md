---
task_id: TASK-059
title: Release merge executor remediation for the round-2 review and security findings
status: review
owner_role: devops
llm: gpt
branch: agent/gpt/devops/task-059
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-devops-task-059
write_scope:
  - scripts/release/integration-merge/**
resource_lock: release-merge-executor
dependencies:
  - task: TASK-057
    edge: gate_recorded
    satisfied: true
    satisfied_at: df3dafa5203ad02ebba89419c77b6a44efafd91a
    satisfied_by: ACT-031 consuming ingress entry seq 43, class gate_verdict_recorded
    satisfied_under: >-
      gate_recorded is satisfied by ANY verdict, including changes-required, which is why it is the
      correct edge for a remediation and why the lineage form of gate_passed is deliberately NOT used
      here - a passing verdict does not exist at round 2 of this lineage, so the lineage form would be
      unsatisfiable and this record would never dispatch. That is the F-204 distinction, applied for
      the fourth time in this graph after TASK-042, TASK-046, and TASK-056.
  - task: TASK-058
    edge: gate_recorded
    satisfied: true
    satisfied_at: 0a44bb0f6a1405bf49fa536d1149f122f52e4bbb
    satisfied_by: ACT-031 consuming ingress entry seq 42, class gate_verdict_recorded
    satisfied_under: >-
      The same reasoning applied to the security lineage. This is the second record in this graph to
      hold two gate_recorded edges, after TASK-056, and for the same reason: it is a remediation
      answering two independent gates of one artifact. Both were satisfied by the same activation and
      NEITHER IS DERIVED FROM THE OTHER; each was checked separately against its own report at its own
      source commit, read through Git object access.
required_gates:
  - review
  - security
pre_merge_gates:
  - review
  - security
gate_tasks:
  - task: TASK-060
    gate: review
    round: 1
    verdict: approved
    verdict_recorded_at: fa766a2401bcafa663f1eee32f4363325d145c5c
    relation_status: closed
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-REVIEW
    lineage_round: 3
  - task: TASK-061
    gate: security
    round: 1
    verdict: changes-required
    verdict_recorded_at: 17cdf4f040f7b0e89ad51f9db40d67f7ae11a615
    remediated_by: TASK-062
    revalidated_by: TASK-063
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 3
  - task: TASK-063
    gate: security
    round: 2
    verdict: changes-required
    verdict_recorded_at: 7e610fabd663779724a94deec0046981e997f298
    remediated_by: TASK-064
    revalidated_by: TASK-065
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 4
  - task: TASK-065
    gate: security
    round: 3
    verdict: pending
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 5
gate_status: >-
  ACT-036 records TASK-063 changes-required and leaves this record's round-2 Security relation open.
  ACT-037 binds TASK-065 Security round 5 to exact TASK-064 target 610716a and makes its owner ready;
  this record's round-3 relation remains open and pending. Review remains approved/closed; Security
  remains blocking. F-063-01 and F-063-02 are Critical, DevOps-owned, open, and unaccepted. This
  record remains NON-INTEGRABLE; PRs 48, 44, 37, and 33 remain open and MUST NOT be merged. The
  superseded ACT-032 value read - OPEN on both relations and
  pending on both at ACT-032. BOTH OWNERS ARE READY after this task's
  runtime-class publication independently satisfied each review_ready edge. TASK-060 and TASK-061
  remain separate roles and mandatory separate execution contexts; neither gate is satisfied by
  publication, CI, owner testing, the other gate, or this Orchestrator activation. This record joins the
  cohorts of LIN-RELEASE-EXECUTOR-REVIEW and LIN-RELEASE-EXECUTOR-SECURITY, each of which grows from
  two members to THREE with none removed, and each round 3 carries THREE relations - this record at
  its own round 1, TASK-056 at its round 2, and TASK-049 at its round 3. That is the shape
  LIN-INTEGRATION-AUTHORITY-REVIEW round 3 used and it is applied unchanged. THE COST OF THAT GROWTH
  IS STATED RATHER THAN LEFT AS ARITHMETIC: each failing round adds one cohort member, one gate task
  per lineage, one relation per lineage, and one release-merge-executor lock holder, and nothing
  removes any of them.
deferred_qa_gate: >-
  DEFERRED BY RULE, NOT OMITTED, AND NOT SILENTLY ABSENT - identical in substance to TASK-056's
  deferral and unchanged by anything that happened at ACT-031. No qa entry appears in required_gates
  or pre_merge_gates and no qa gate task exists for this record, because invariant 8 permits a lineage
  round greater than 1 ONLY after the preceding round records a verdict, and LIN-RELEASE-EXECUTOR-QA
  round 1 - owned by TASK-055 over TASK-049 at the target 9fb2eb0c - has recorded NONE. TASK-055 was
  dispatched once and did not run; its provider still has no configured authentication, and ACT-031
  configured, requested, and inferred none. Declaring a qa gate here would either require creating
  LIN-RELEASE-EXECUTOR-QA round 2 in breach of invariant 8, or leave a required_gates entry with no
  named owner in breach of the gate-assignment property that every entry has one. THE OBLIGATION IS
  REAL AND IS RECORDED RATHER THAN DISCHARGED: the activation that consumes TASK-055's round-1 verdict
  decides whether that lineage's cohort grows to include this record and TASK-056 and creates the
  round that would judge them. NOTHING HERE PERMITS ACTIVATION: negativeCapabilityTestAttestation
  remains an immutable member of the approved MergeExecutorActivationRecord and remains unvalidated,
  so admit returns AuthorityNotActivated whatever this record's review and security gates eventually
  record.
parent_task: TASK-001
publication_class: runtime
supersedes: none
remediates:
  - report: reports/code-review/TASK-056-RELEASE-MERGE-EXECUTOR-REVIEW-ROUND-2.md
    at_commit: df3dafa5203ad02ebba89419c77b6a44efafd91a
    recorded_by: TASK-057
    lineage: LIN-RELEASE-EXECUTOR-REVIEW
    lineage_round: 2
    findings: [F-057-01, F-057-02, F-057-03]
  - report: reports/security/TASK-056-RELEASE-MERGE-EXECUTOR-SECURITY-ROUND-2.md
    at_commit: 0a44bb0f6a1405bf49fa536d1149f122f52e4bbb
    recorded_by: TASK-058
    lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 2
    findings: [F-058-01, F-058-02, F-058-03, F-058-04, F-058-05]
carried_partial_round_1_findings:
  - finding: F-053-04
    severity: High
    disposition: partially resolved by TASK-057 at df3dafa5203ad02ebba89419c77b6a44efafd91a
    residue_carried_by: [F-057-01]
  - finding: F-053-06
    severity: High
    disposition: partially resolved by TASK-057 at df3dafa5203ad02ebba89419c77b6a44efafd91a
    residue_carried_by: [F-057-02]
  - finding: F-054-01
    severity: Critical
    disposition: partially resolved by TASK-058 at 0a44bb0f6a1405bf49fa536d1149f122f52e4bbb
    residue_carried_by: [F-058-01, F-058-02]
  - finding: F-054-02
    severity: Critical
    disposition: partially resolved by TASK-058 at 0a44bb0f6a1405bf49fa536d1149f122f52e4bbb
    residue_carried_by: [F-058-01]
  - finding: F-054-03
    severity: Critical
    disposition: partially resolved by TASK-058 at 0a44bb0f6a1405bf49fa536d1149f122f52e4bbb
    residue_carried_by: [F-058-03, F-058-05]
  - finding: F-054-07
    severity: High
    disposition: partially resolved by TASK-058 at 0a44bb0f6a1405bf49fa536d1149f122f52e4bbb
    residue_carried_by: [F-058-03]
  - finding: F-054-08
    severity: Medium
    disposition: partially resolved by TASK-058 at 0a44bb0f6a1405bf49fa536d1149f122f52e4bbb
    residue_carried_by: [F-058-04, F-058-05]
carried_partial_findings_note: >-
  THESE SEVEN ROUND-1 FINDINGS ARE STILL OPEN AND THEY GET NO REMEDIATION TASK OF THEIR OWN, which is
  a rule rather than an oversight. A partially resolved finding whose residue the partially-resolving
  round has already assigned to a NAMED new finding travels with that new finding; creating a second
  remediation record for the residue is the scope error ACT-008 and ACT-010 each declined for A-004,
  A-101, A-102, and A-104 and that ACT-023 recorded for F-041-02 and F-041-04. Resolving the fresh
  finding is what allows the round-3 gate owner to move its parent from partially resolved to
  resolved, as LIN-INTEGRATION-AUTHORITY-REVIEW round 3 did for F-041-02 and F-041-04. THE LINKS ARE
  RECORDED HERE SO THE CHAIN IS TRACEABLE IN BOTH DIRECTIONS AND SO NO PARTIAL FINDING CAN BE LOST
  BETWEEN ROUNDS. FOUR OF THE SEVEN ARE STILL BLOCKING BY SEVERITY - F-054-01, F-054-02, and F-054-03
  Critical and F-054-07 High.
resolved_round_1_findings_note: >-
  NINE OF THE SIXTEEN ROUND-1 FINDINGS ARE RESOLVED AND THIS TASK MUST NOT REGRESS ANY OF THEM.
  TASK-057 resolved F-053-01, F-053-02, F-053-03, F-053-05, F-053-07, and F-053-08; TASK-058 resolved
  F-054-04, F-054-05, and F-054-06 - the first three findings ever to leave this graph's blocking set.
  Each was resolved by an executed counterexample at the previous target, and a remedy for a fresh
  finding that reopens any of the nine is a regression whatever it repairs. Both round-3 gate owners
  will re-derive them rather than inherit them.
finding_ownership_note: >-
  ALL EIGHT FRESH FINDINGS NAME devops AS THE RESPONSIBLE OWNER, read one line at a time from the two
  reports at their own source commits rather than from either report's summary sentence. That is why
  there is ONE remediation record and not two. Two records would declare the IDENTICAL write scope
  scripts/release/integration-merge/**, which config/agents/settings.yaml forbids under
  allow_overlapping_write_scopes false, would contend on the one release-merge-executor lock, could
  not run in parallel, and would divide one module's admission path between two authors - which the
  findings-return path calls "as much a defect as folding two owners into one". The rule is symmetric:
  ACT-021 created TWO remediation tasks for TASK-041's four findings because they named TWO owner
  roles, ACT-023 created ONE for TASK-044's three because they named one, ACT-029 created ONE for
  sixteen across two reports, and ACT-031 creates ONE for eight across two reports. NO FINDING WAS
  MERGED, SPLIT, SOFTENED, DOWNGRADED, REASSIGNED, OR RESTATED BY THE ORCHESTRATOR. Two pairs describe
  the same code region through a review lens and a security lens - F-057-01 with F-058-01, and F-057-03
  with F-058-05 - but NEITHER GATE OWNER DECLARED EITHER PAIR AN INHERITED VIEW OF THE OTHER, and the
  two rounds in fact reached DIFFERENT findings from the same bytes: TASK-057 records the NUL bytes as
  a reviewability defect, and TASK-058 records that PLUS a canonicalization hazard in which two
  distinct accepted relations collide in a composite sort key and change aggregateGateSnapshotDigest
  under permutation. Each stays its own obligation with its own required remedy and its own
  disposition; a remedy that satisfies one lens does not close the other's finding, and only that
  lineage's own round 3 may.
blocking_security_note: >-
  SEVEN FINDINGS IN THIS GRAPH BLOCK DELIVERY BY SEVERITY AND THE MEMBERSHIP IS NOT WHAT IT WAS.
  THREE ARE FRESH AND CRITICAL - F-058-01, F-058-02, and F-058-03. FOUR ARE CARRIED PARTIALS -
  F-054-01, F-054-02, and F-054-03 Critical and F-054-07 High. Under AGENTS.md, README.md, and
  config/agents/settings.yaml security_blocking_severities, they block merge and release until
  resolved or FORMALLY ACCEPTED BY AN AUTHORIZED HUMAN. NO ACCEPTANCE EXISTS ANYWHERE IN THIS
  REPOSITORY, none was sought, and this owner may not create, request, simulate, or rely on one.
  Resolution is the only path available to this task, and only TASK-061 may judge whether it
  succeeded. TWO High REVIEW findings additionally block integration - F-057-01 and F-057-02 - and
  those have NO formal-acceptance path of any kind; they close only when TASK-060 records a passing
  verdict.
authority_boundary: >-
  THIS TASK MAY NOT weaken, amend, reinterpret, or work around the approved architecture; bypass,
  soften, defer, or self-satisfy any gate; accept, request, or manufacture a risk acceptance of any
  kind; provision, configure, request, or simulate any control-plane, credential, GitHub App,
  branch-protection, ruleset, attestor, or evidence-store state; author or edit any governance or
  enforcement path; delete, stub, weaken, or skip any existing fixture; edit any task record, report,
  architecture document, workflow, hook, or settings file; approve, merge, close, reopen, or comment
  on any pull request; or produce any MergeExecutorActivationRecord member. IT MAY NOT MERGE PULL
  REQUEST 33, whose two pre-merge gates both record changes-required and which would additionally land
  TASK-049's content by ancestry. THE RELEASE EXECUTOR REMAINS DORMANT throughout and after this task:
  admit returns AuthorityNotActivated while any activation-record member is absent, and no merge side
  effect may occur.
governance_decision_context: >-
  HUMAN-004, approved at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68, artifact
  plans/decisions/HUMAN-004-autonomous-merge-authority.md. Read the decision at that commit and not
  from any transcription. Its eight prohibited capabilities and its finite three-member residual human
  exception set are unchanged by these findings. TASK-058 assessed the module against them
  individually and recorded TWO met for the target source and SIX not met, concluding that "because
  six of eight prohibitions are not met, this set cannot support a passing security verdict". Round 1
  recorded the same two-versus-six split; the ratio is unchanged and the report does not present that
  as a result.
normative_architecture_source: >-
  The LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 approved source
  f148567d716c00d7a24783318c8d6d7031492e7b, approved at 78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 -
  principally docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md, COMPONENT-BOUNDARIES.md, and
  INTEGRATION-STRATEGY.md with ADR-0042, ADR-0043, and ADR-0044. Read at that exact identifier through
  Git object access, or from integration/autonomous-runtime, which carries a byte-identical docs tree
  since cf6333b10e628b3b61f3b7f8716b30923725067d. THAT CONTRACT IS APPROVED AND IS NOT REOPENED HERE.
  Several findings assert that the implementation still diverges from it - F-058-02 cites the exact
  release-App permission allowlist and the complete ruleset and revocation requirements, and F-058-01
  cites the authenticated activation-artifact boundary - so THE REMEDY IS TO MAKE THE CODE MEET THE
  CONTRACT, NOT TO AMEND THE CONTRACT. IF AND ONLY IF a remedy is genuinely inexpressible under the
  approved contract, return the exact minimum amendment text to the Orchestrator with the clause it
  cannot satisfy; do not author an architecture path and do not proceed on an assumption. TASK-058's
  own handoff states that "any necessary normative contract change must be routed to the Architect".
review_target_base: d63864bcb25fc8897b21c09f8f687e390f85808d
review_target_applicability: >-
  applicable, resolved, and DELIBERATELY NOT THIS RECORD'S OWN BRANCH POINT. Round 3 of both lineages
  carries relations for TASK-049 and TASK-056 as well as for this record, so each round must see the
  COMPLETE release executor rather than only the latest correction to it - which means diffing this
  task's published head against TASK-049's own immutable branch point
  d63864bcb25fc8897b21c09f8f687e390f85808d, the base rounds 1 and rounds 2 of both lineages used. THE
  BASE IS IMMUTABLE ACROSS ROUNDS BY DESIGN: it was read with git merge-base agent/claude/devops/task-049
  integration/autonomous-runtime and is independently the parent of TASK-049's first authored commit
  012bdb8360a7a1b4e61b362d9302f731ad817078, and holding it fixed is what makes each round's capability
  statement and negative-capability comparison commensurable with the last. It is NOT 85f5d265, NOT
  9fb2eb0c, NOT 754d66a0, NOT cf6333b1, NOT origin/main, and NOT this branch's own branch point. This
  is the same construction TASK-046 used with c95ce600 and TASK-056 reused.
review_target_commit: 126f2fa9939b8ac6db4764241952dafbda50e9f4
review_target_commit_note: >-
  BOUND by ACT-032 to the immutable final owner target after independently proving that the local
  branch, origin tracking ref, git ls-remote result, pull-request head, and clean final worktree all
  equal this exact 40-hex commit. The two-commit authored range contains
  0d1e87c85e74e233db39b35547a4a8cb1092340c and this target; the head is the owner-published final
  content and pull-request head, never a moving ref.
branch_point_of: agent/claude/devops/task-056
scope_validation_base: 85f5d265c888f899332a99b15a7d9c8aa959be00
scope_validation_applicability: >-
  applicable and RESOLVED at publication. This task's branch point is
  85f5d265c888f899332a99b15a7d9c8aa959be00, independently reproduced by merge-base and literal
  parentage. It is unrelated to review_target_base above; the two values differ by design.
scope_validation_note: >-
  BRANCH FROM agent/claude/devops/task-056, NOT from integration/autonomous-runtime and NOT from
  agent/claude/devops/task-049. TASK-056 is NOT integrated and MUST NOT BE - pull request 33 is open
  with both pre-merge gates recording changes-required - so the module this task remediates exists
  only on that branch, at its head. Branching from it gives TRUE ANCESTRY over the artifact under
  remediation, which is the shape ADR-0041 requires of a cumulative unit and which TASK-042, TASK-046,
  and TASK-056 each achieved; it also means the review-diff base above and this branch point differ,
  which is exactly why the two fields are separate. Resolve the branch point inside the worktree with
  git merge-base HEAD agent/claude/devops/task-056 and pass that exact value to -BaseRef. Never pass
  d63864bc, 9fb2eb0c, 754d66a0, cf6333b1, origin/main, or a review-diff base. DO NOT MERGE
  integration/autonomous-runtime OR ANY OTHER BRANCH INTO THIS ONE to assemble the work. NOTE THAT
  agent/claude/devops/task-049's pull request 30 WAS CLOSED UNMERGED BY THE CONTROL SESSION AT
  ACT-031; the branch and every commit on it survive and TASK-056's ancestry over it is unaffected,
  which was verified rather than assumed.
observed_test_baseline: >-
  RECORDED AS THE STARTING STATE, NOT AS A TARGET AND NOT AS A RESULT THIS TASK MAY INHERIT.
  scripts/release/integration-merge/run-tests.ps1 at 85f5d265 returns exit 0 with tests 522, suites 0,
  pass 511, fail 0, cancelled 0, skipped 0, TODO 11. ELEVEN CASES ARE UNEXECUTED AND NONE IS PASSING:
  tests/live-control-plane.blocked.test.ts is blob 9f10172c6b8a7e458a44a6f807105e58ce057af5 at both
  9fb2eb0c and 85f5d265, and TASK-058 confirmed with read-only queries that the control plane those
  fixtures need is still absent - classic branch protection returns HTTP 404 Branch not protected for
  both main and integration/autonomous-runtime, and the ruleset list returns count zero. THEY MUST
  REMAIN REGISTERED AND UNEXECUTED. Do not stub, fake, weaken, delete, or provision them, and do not
  record an unexecuted case as passing. A GROWING PASSING COUNT IS NOT A GATE OUTCOME: the suite grew
  from 416 to 522 between rounds 1 and 2 and the verdict was changes-required both times.
published_commit: 126f2fa9939b8ac6db4764241952dafbda50e9f4
published_branch: agent/gpt/devops/task-059
published_remote_ref: refs/heads/agent/gpt/devops/task-059
pull_request: https://github.com/Fhurky/Multi-Agent-Engineering-Framework/pull/37
publication: published
publication_note: >-
  Runtime-class publication independently satisfied all three required conditions at ACT-032: the
  immutable commit, exact branch on origin, and open non-draft pull request against
  integration/autonomous-runtime with headRefOid equal to the commit. PR 37 remains unmerged.
authored_delta: >-
  29 paths, all under scripts/release/integration-merge/**, from
  85f5d265c888f899332a99b15a7d9c8aa959be00 to the exact target; zero residue and zero deleted paths.
cumulative_review_delta: >-
  42 paths, all under scripts/release/integration-merge/**, from immutable review base
  d63864bcb25fc8897b21c09f8f687e390f85808d to the exact target; zero residue and zero deleted paths.
integrable: false
integrability_note: >-
  Review is closed at approved by TASK-060 with no findings. Security is not: TASK-061 recorded
  changes-required, its three Critical findings remain open and unaccepted, and TASK-063 round 4 is
  pending after TASK-062. The required pre-merge gate set is therefore not satisfied. Publication,
  owner tests, controller reproduction, exact-head CI, and the Review verdict cannot substitute for
  Security. PR 37 and ancestral PR 33 remain unmerged and MUST NOT be merged.
publication_evidence:
  activation: ACT-032
  ingress_seq: 44
  ingress_class: artifact_published
  fact_id: 26750b1ba67c22937a52a4a3629e729967e82e4cda057a01e4bfbfb365924e59
  source_path: scripts/release/integration-merge/index.ts
  source_bytes: 6639
  content_hash: 016b3ac277b514da53583336359142e6e2695009d69ac2446053b2eac309ad8f
  first_implementation_commit: 0d1e87c85e74e233db39b35547a4a8cb1092340c
  target_commit: 126f2fa9939b8ac6db4764241952dafbda50e9f4
  ancestry_base: 85f5d265c888f899332a99b15a7d9c8aa959be00
  review_base: d63864bcb25fc8897b21c09f8f687e390f85808d
  pull_request: 37
  pull_request_state: OPEN, non-draft, MERGEABLE / CLEAN, unmerged
  exact_head_checks:
    - CI / validate, check-run 93094494830, success
    - Security / security, check-run 93094494756, success
  check_assertion: pass / OK; total 2, required 2, matched 2, unmatched 0
  authored_delta: 29 paths, all under scripts/release/integration-merge/**
  cumulative_review_delta: 42 paths, all under scripts/release/integration-merge/**
  raw_byte_scan: 42 files scanned; 0 NUL-bearing files
  live_fixture_blob: 9f10172c6b8a7e458a44a6f807105e58ce057af5, unchanged from the ancestry base
  module_suite: 537 declared, 526 passed, 0 failed, 0 skipped, 11 explicitly unexecuted live fixtures
  lock_release: normal, matching owner session 7197b80da19e4ef98b322cfbb771b3b3; TASK-059 and release-merge-executor locks free
---

# TASK-059: Release merge executor remediation for the round-2 review and security findings

## Human-authorized execution-provider reroute

The durable human decision at `dbac01ea4f7ec9adf85768e607f4ed894befe669`, merged at `29b12ccc0e7a27edb0d5b5a1fe804e4386373724`, rerouted this execution from `claude` to `gpt` after two provider-limit refusals stopped before tracked edits. ACT-032 records it as `HUMAN-005` without changing scope, dependencies, findings, gates, lineages, authority, or dormancy. The GPT author retained true ancestry from the unchanged TASK-056 head.

## Objective

Remediate all eight findings recorded by `LIN-RELEASE-EXECUTOR-REVIEW` round 2 and `LIN-RELEASE-EXECUTOR-SECURITY` round 2 against the release merge executor, inside `scripts/release/integration-merge/**` and nowhere else, without weakening the approved architecture, without regressing any of the nine findings rounds 2 resolved, and without changing the module's dormancy.

## What this task is, and what it is not

**It is an owner's remediation, and a remediation is not a resolution.** Publishing a fix is this owner's claim that the findings are answered. **Only `LIN-RELEASE-EXECUTOR-REVIEW` round 3 at TASK-060 and `LIN-RELEASE-EXECUTOR-SECURITY` round 3 at TASK-061 may record that any finding is `resolved`**, each in its own lineage and its own execution context, and **neither may disposition the other's findings**. That distinction has now cost this module two full rounds and it is stated here before the work starts rather than after it.

**It is the second remediation of this module and the pattern of the first is worth reading.** TASK-056 answered sixteen findings; rounds 2 resolved nine of them and recorded eight fresh ones, three of which are Critical. **The fresh Critical findings are not the old Critical findings restated** — F-058-01, F-058-02, and F-058-03 each name a boundary the remediation built *correctly* and then *accepted from the caller*: real Ed25519 verification against a key the caller supplies, exact digest recomputation over bytes the caller supplies, exact field binding on artifacts the caller names but nobody dereferences. **The recurring shape is authentication of the source, not correctness of the computation**, and a remedy that improves the computation again without resolving the source will produce a third round of the same finding.

**It does not activate anything.** The executor remains **dormant** throughout: `implementationReview` and `implementationSecurityReview` were explicitly refused by rounds 2 as they were by rounds 1, `negativeCapabilityTestAttestation`, `requiredGitHubPolicyProfile`, and `policyAttestorTrustRoot` do not exist, the `AGENTS.md` amendment is unauthored and only a human may author it, and the control plane is unprovisioned. `admit` returns `AuthorityNotActivated` and no merge side effect may occur.

## Required remedies

Each remedy below is **quoted from the report that recorded the finding**, at that report's own source commit, and is not paraphrased. Read the full finding — its evidence, its independently constructed counterexample, and its stated consequence — at the source commit before implementing.

### From `LIN-RELEASE-EXECUTOR-REVIEW` round 2, TASK-057 at `df3dafa5203ad02ebba89419c77b6a44efafd91a`

| Finding | Severity | Location the report names | Required remediation, as recorded |
|---|---|---|---|
| **F-057-01** | **High** | `activation.ts:138-183,326-465` | "Bind every activation slot to its exact approved kind, gate lineage, round/subject target, and trusted producer authorization. Authenticate the externally issued activation record or its producer binding rather than accepting self-digested bearer assertions." |
| **F-057-02** | **High** | `execute.ts:1058-1084,1243-1249,1277-1281`; `contracts.ts:1124-1154` | "Persist an authenticated retry-sequence start or absolute deadline before the first attempt and use it, together with the attempt count, in every recovered retry decision." |
| **F-057-03** | Medium | `gate-admissibility.ts:71-72,97-98`; `published-head-evidence.ts:396` | "Use a source-safe printable or escaped representation that preserves unambiguous composite keys without embedding literal NUL bytes, then confirm normal text classification and line-diff rendering." |

### From `LIN-RELEASE-EXECUTOR-SECURITY` round 2, TASK-058 at `0a44bb0f6a1405bf49fa536d1149f122f52e4bbb`

| Finding | Severity | Location the report names | Required remediation, as recorded |
|---|---|---|---|
| **F-058-01** | **CRITICAL** | `activation.ts:109-135,138-220,323-445,447-465`; `admission.ts:424-484` | "resolve the activation record from an authenticated immutable source; verify its real commit, path, bytes, digest, and authorized-human issuer; dereference every member and verify its exact kind, gate, lineage, target, round, producer, and authorization; bind the broker/port identity to an independently authenticated negative-capability attestation; reject nonexistent or unresolvable Git objects." |
| **F-058-02** | **CRITICAL** | `policy-control.ts:52-110,388-453,455-475,559-626`; `contracts.ts:587-611`; `admission.ts:1140-1220` | "encode and enforce the literal permission allowlist and forbidden permissions independent of a supplied profile; authenticate the profile/trust root through F-058-01's required boundary; bind policy and source digests to canonical observed bytes; enumerate and validate every applicable classic/parent/repository ruleset and effective rule; and verify key/issuer status through an independently trusted online revocation response that the signing key cannot self-assert." |
| **F-058-03** | **CRITICAL** | `admission.ts:135-178,392-418,543-633,1227-1281`; `gate-admissibility.ts:109-145,259-324` | "resolve every authority artifact from an authenticated immutable store or Git object boundary; verify commit/path/bytes/digest and authorized producer; independently enumerate the full gate, security, check, and integration-unit universe; authenticate human acceptance/production decisions; reject all unresolved or nonexistent artifact references." |
| **F-058-04** | Medium | `published-head-evidence.ts:110-143,390-438,583-653` | "bind each phase to a distinct authenticated producer/session identity from independent execution evidence, and verify those credentials before accepting the bundle. Self-declared role/session strings are not an identity boundary." |
| **F-058-05** | Medium | `gate-admissibility.ts:71-72,97-99,109-145`; `published-head-evidence.ts:136-142,396` | "reject control characters in external identifiers and sort structured tuples component by component or use unambiguous length framing. Keep source text free of literal NUL bytes and add adversarial permutation tests." |

**The three Critical findings each carry the report's own blocking statement**: *"This Critical finding blocks delivery until resolved or formally accepted by an authorized human. TASK-058 records no acceptance and does not accept the risk."* **No acceptance exists anywhere in this repository and this task may not create, request, simulate, or rely on one.**

**F-057-03 and F-058-05 concern the same bytes and are not the same obligation.** F-057-03 requires that the file stop being binary-classified so its diff is reviewable. F-058-05 requires **additionally** that control characters be rejected in external identifiers and that composite keys be built by component-wise sorting or unambiguous length framing, with adversarial permutation tests — because TASK-058 demonstrated that two *validly accepted* relations can produce equal joined sort keys and that reversing their order changes `aggregateGateSnapshotDigest`. **Removing the NUL bytes alone satisfies F-057-03 and does not satisfy F-058-05.**

**F-057-01 and F-058-01 concern the same boundary and are not the same obligation either.** F-057-01 requires exact-identity binding of each activation slot to its approved kind, lineage, subject target, and producer authorization. F-058-01 requires **additionally** that the activation record itself be resolved and authenticated from an immutable source, that nonexistent Git objects be rejected, and that the broker and port identity be bound to an independently authenticated negative-capability attestation. **Satisfying the review lens does not close the security finding.**

## Scope

- Implement every required remedy above inside `scripts/release/integration-merge/**`, with tests for each, and nowhere else.
- **Reconstruct each round-2 counterexample against your own new code and record what it returns**, for all eight findings — the four `validateActivation` substitution probes, the recovered-retry harness that admitted attempt 2 from a timestamp-free history, the fabricated activation and admission scenario with nine nonexistent commits, the fabricated production decision at a nonexistent commit, the self-signed `issuerStatus`, the one-process two-phase bundle, the colliding composite sort key with its digest reversal, and the raw-byte NUL scan. A test that passes is not the same fact as a counterexample that now refuses.
- **Do not regress any of the nine resolved findings.** Re-run the `F-053-*` and `F-054-*` reconstructions and record their results; a remedy that reopens a resolved finding is a regression whatever it repairs.
- **Do not widen the structural negative-capability surface.** Exactly one merge port against `main` with the exact expected head SHA, and no generic HTTP, ref update, `git push`, `ALLOW_MAIN_PUSH`, force, hook bypass, administrator override, required-check mutation, branch-protection or ruleset mutation, gate mutation, task-ownership mutation, or lock-release mechanism. **A new authentication path, a new port, a new injected dependency, or a new trust root is itself a subject of the next security round** — TASK-058's record says so directly.
- Keep `admit` total over its declared input domain, returning exactly one typed result member for every input, including every hostile value at every declared boundary.
- Keep the module free of any policy-observation port, and keep policy entering only as a complete, fresh, plan-bound, signed attestation from the separate human-controlled plane.
- Keep the module importing no runtime implementation module and no runtime contract root, and keep it from becoming a generic Git helper.
- Keep the module **dormant**: with any activation-record member absent, unpinned, mutable, or executor-produced, `admit` returns `AuthorityNotActivated` and no merge side effect occurs, each case constructible individually.
- Keep the eleven live control-plane and attestor fixtures **registered and unexecuted**. Do not stub, fake, weaken, delete, or provision them.
- Publish under `publication_class: runtime`: an immutable commit, the branch pushed to `origin`, and an open non-draft pull request against `integration/autonomous-runtime`. **Do not merge it and do not merge pull request 33.**
- Exclude: amending the architecture; editing any task record, report, governance, enforcement, settings, workflow, hook, `scripts/ci/**`, `scripts/quality/**`, or other source path; provisioning, requesting, configuring, or simulating control-plane state; producing any activation-record member; recording, requesting, or relying on a risk acceptance; dispositioning any finding; approving, merging, closing, reopening, or commenting on any pull request; and creating any task.

## Acceptance criteria

- [ ] Each of F-057-01, F-057-02, F-057-03, F-058-01, F-058-02, F-058-03, F-058-04, and F-058-05 has an implemented remedy that satisfies the quoted required remediation, with the file and line of the change recorded.
- [ ] Each round-2 counterexample is reconstructed against the new code and its new observed result is recorded, including every probe the two reports executed.
- [ ] The `F-053-*` and `F-054-*` reconstructions covering the nine resolved findings are re-run and recorded, and none regressed.
- [ ] The structural negative-capability surface is unchanged or narrower, checked item by item against the approved table, and every new dependency or trust boundary introduced by a remedy is named explicitly in the handoff.
- [ ] `admit` remains total, and the complete hostile-boundary matrix passes.
- [ ] The module remains dormant with each absent, unpinned, mutable, and executor-produced member case constructed individually.
- [ ] No existing fixture is deleted or weakened, no live control-plane fixture is stubbed, faked, or provisioned, and every unexecuted fixture is recorded as unexecuted and never as passing.
- [ ] No path outside `scripts/release/integration-merge/**` is modified, and `git diff --check` exits 0 against both the branch point and the review-target base.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>` reports a valid result, and the resolved branch point is recorded in the handoff.
- [ ] The branch is pushed to `origin` and a non-draft pull request is opened against `integration/autonomous-runtime`, with the exact-head check-run evidence recorded at the commit identifier rather than at a branch name, and no empty rollup treated as a success.
- [ ] Nothing is merged, no gate is self-satisfied, no risk is accepted, no activation-record member is produced, and no control-plane state is provisioned, requested, configured, or simulated.

## Expected artifacts

- `scripts/release/integration-merge/` — the remediated module, its tests, and its fixtures.

## Write-scope isolation

This task's scope is identical to TASK-049's and TASK-056's by design, because it remediates the same module. **They are serialized by the `release-merge-executor` resource lock rather than made disjoint**, which is what that lock exists for. It is disjoint from `scripts/ci/**` (TASK-018, TASK-043), from `src/orchestrator/integration/**` (TASK-048), and from every report and task path in this graph. **Exactly one task holding `release-merge-executor` may be claimed at a time.** TASK-049 and TASK-056 are both in `review` and neither is active, so the lock is free.

## Gate and remediation path

This task's fix is judged by `LIN-RELEASE-EXECUTOR-REVIEW` round 3 at **TASK-060** and `LIN-RELEASE-EXECUTOR-SECURITY` round 3 at **TASK-061**, each carrying **three** relations applied atomically — this record at its round 1, TASK-056 at its round 2, and TASK-049 at its round 3. **Both cohorts grow from two members to three with none removed.** TASK-049, TASK-056, and this record become integrable only when **both** lineages close at a passing verdict.

**Independence.** This author is `devops` / `gpt`; both gate owners are also assigned to `gpt`, but remain different roles in mandatory separate execution contexts. **This task must not run in TASK-057's, TASK-058's, TASK-060's, TASK-061's, TASK-055's, TASK-049's, TASK-053's, or TASK-054's execution context, and TASK-060 and TASK-061 may not reuse each other's context.** Publishing this module is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

## Task-record lifecycle

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the DevOps role's configured write scope. The Orchestrator performs every transition under TASK-013.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-059 -Role devops -Llm gpt -BaseRef agent/claude/devops/task-056`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-059 -Role devops -Llm gpt` before editing. This claims the `release-merge-executor` lock.
3. Branch from `agent/claude/devops/task-056` and resolve the branch point with `git merge-base HEAD agent/claude/devops/task-056`. **Do not merge any other branch into this one.**
4. Read both round-2 reports at their own source commits through Git object access, and read the approved architecture at `f148567d716c00d7a24783318c8d6d7031492e7b`.
5. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
6. Commit, push the branch, open a pull request against `integration/autonomous-runtime`, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-059 -Role devops -Llm gpt`. **Never push `main`, never merge anything, and never merge pull request 33.**

## Handoff

Maintained by the Orchestrator under TASK-013 from this owner's commit, pull request, and recorded verification.

- Commit and pull request: `126f2fa9939b8ac6db4764241952dafbda50e9f4`, pull request 37.
- Verification: see `publication_evidence`; all recorded owner and controller checks passed, with 11 live fixtures explicitly unexecuted.
- Known risks: all round-3 findings await independent disposition; both gates remain open, PRs 37 and 33 remain unmerged, and the executor remains dormant.
- **Created `ready` at `ACT-031`**, on the two satisfied `gate_recorded` edges at `df3dafa5203ad02ebba89419c77b6a44efafd91a` and `0a44bb0f6a1405bf49fa536d1149f122f52e4bbb`, as the single `devops`-owned remediation of all eight fresh findings recorded by `LIN-RELEASE-EXECUTOR-REVIEW` round 2 and `LIN-RELEASE-EXECUTOR-SECURITY` round 2.
- **What creating this record does NOT mean.** It resolves no finding, closes no gate, and produces no activation-record member. **Fifteen findings are open across the two lineages** — the eight fresh ones this record carries and the seven partial round-1 ones whose residues the fresh findings carry — **and seven of them block delivery until resolved or formally accepted by an authorized human, with none accepted.** The Orchestrator recorded no acceptance, sought none, and has no authority to record one.
- **Moved `ready` → `review` at ACT-032** on ingress `seq` 44, class `artifact_published`, exact target `126f2fa9939b8ac6db4764241952dafbda50e9f4`, fact `26750b1ba67c22937a52a4a3629e729967e82e4cda057a01e4bfbfb365924e59`. The runtime publication conditions were checked independently: immutable commit, exact origin branch, and open non-draft pull request 37 with an exact matching head. PR 37 remains unmerged.
- **Owner claims, not dispositions.** `scripts/release/integration-merge/TASK-059-EVIDENCE.md` claims remedies and counterexample refusals for F-057-01 through F-057-03 and F-058-01 through F-058-05 and no regression in the nine previously resolved round-1 findings. Only TASK-060 and TASK-061 may judge those claims. The owner added `ReleaseAuthorityPort` for authenticated immutable artifacts, complete universes, issuer/revocation status, human decisions, accepted risks, and publication identities; bound its identity with the sole merge port in the negative-capability attestation; and added authenticated persistent retry-sequence start / absolute-deadline state. The executor remains dormant with one typed merge port.
- **Verification transcribed and independently reproduced.** Owner and controller both returned `537 declared / 526 passed / 0 failed / 0 skipped / 11 explicitly unexecuted`. Controller checks also passed assignment and 29-path scope, 13-role framework validation, orchestration, 82 check-run-evidence assertions, repository security, diff checks against both bases, the 42-file raw-byte scan, exact-head CI assertion, clean/equal refs and worktree, and unchanged live-fixture blob. No empty status rollup was treated as success.
- **No authority effect.** Publication and passing CI resolve no finding, close no gate, approve no change, and activate no executor. No merge, external control-plane action, credential action, policy mutation, risk acceptance, activation, or simulation occurred. Pull requests 37 and 33 remain open and unmerged.
- Next owners: **TASK-060**, `reviewer` / `gpt`, and **TASK-061**, `security` / `gpt`, now separately `ready`, each bound to target `126f2fa9939b8ac6db4764241952dafbda50e9f4` over review base `d63864bcb25fc8897b21c09f8f687e390f85808d`, each carrying its own atomic three-relation cohort. This task's owner execution is complete and both owner locks are free.
- **ACT-033 gate routing.** TASK-060 recorded `approved` with no findings and closed this record's Review round-1 relation. TASK-061 recorded `changes-required`, left this record's Security round-1 relation open, and returned F-061-01 through F-061-03, all Critical, DevOps-owned, open, and unaccepted. Those findings route together to TASK-062, then independent Security round 4 at TASK-063, where this record carries relation round 2.
- Next owners: **TASK-062** (`devops` / `claude`) and then **TASK-063** (`security` / `gpt`). Review remains closed and no Reviewer successor exists. This record stays `review` and `integrable: false`; PR 37 and PR 33 remain open, unmerged, and forbidden while Security is open.
- **ACT-035 publication routing.** TASK-062 published exact target `19e75e996e8e116f74b4f8feb363ef13438a42b9`; TASK-063 is now `ready` and carries this record's pending Security round-2 relation. No verdict or finding disposition changed. This record remains `review` and `integrable: false`; PRs 44, 37, and 33 remain open, unmerged, and forbidden.
- Next owner: **TASK-063**, `security` / `gpt`, in a separate execution context. Review remains closed and no Reviewer successor exists.
- **ACT-036 Security routing.** TASK-063 recorded `changes-required` at `7e610fabd663779724a94deec0046981e997f298`; this record's round-2 relation remains open and TASK-065 adds its pending round-3 relation. Both fresh Critical findings route to TASK-064. This record remains `review` and non-integrable.
- Next owners: **TASK-064**, `devops` / `gpt`, then **TASK-065**, `security` / `gpt`. Review remains closed and no Reviewer successor exists.
- **ACT-037 publication routing.** TASK-064 published exact target `610716aabc9a6cdf455fe45c32c88eeb20caa588`; TASK-065 is now `ready` and carries this record's pending Security round-3 relation. No verdict or finding disposition changed. This record remains `review` and `integrable: false`; PRs 48, 44, 37, and 33 remain open, unmerged, and forbidden.
- Next owner: **TASK-065**, `security` / `gpt`, in a separate execution context. Review remains closed and no Reviewer successor exists.
