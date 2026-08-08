---
task_id: TASK-049
title: Integration-to-main release merge executor
status: review
owner_role: devops
llm: claude
branch: agent/claude/devops/task-049
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-devops-task-049
write_scope:
  - scripts/release/integration-merge/**
resource_lock: release-merge-executor
resource_lock_note: >-
  DECLARED AT ACT-029 AND NOTHING ELSE ABOUT THIS RECORD CHANGED BECAUSE OF IT. TASK-056 remediates
  this module and therefore declares the identical scope scripts/release/integration-merge/**;
  config/agents/settings.yaml sets allow_overlapping_write_scopes to false, so the overlap is
  serialized by a shared named lock rather than resolved by splitting a directory the two tasks
  genuinely share. This is exactly the treatment revision 22 applied when TASK-043 joined TASK-018 on
  scripts/ci/** under ci-toolchain. This task's execution is COMPLETE, so the lock constrains nothing
  already done; it serializes any TASK-049 remediation against a concurrent TASK-056. The superseded
  value was null, recorded at ACT-026 with the reason that no task in this graph declared
  scripts/release/**; that reason is spent because TASK-056 now does.
dependencies:
  - lineage: LIN-INTEGRATION-AUTHORITY-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 3
    satisfied: true
    satisfied_at: 78359ae2e3dc6e97fb3d60f0b847b84abed08fa6
    satisfied_by: ACT-026 consuming ingress entry seq 36, class gate_verdict_recorded
    satisfied_under: TASK-047 recorded approved at LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3, applied atomically to (TASK-046, review, round 1), (TASK-042, review, round 2), and (TASK-040, review, round 3). All three relations closed together.
  - task: TASK-046
    edge: integrated
    satisfied: true
    satisfied_at: cf6333b10e628b3b61f3b7f8716b30923725067d
    satisfied_by: ACT-027 consuming ingress entry seq 37, class branch_integrated
    satisfied_under: The operator merged pull request 28 into integration/autonomous-runtime at cf6333b10e628b3b61f3b7f8716b30923725067d, mergedAt 2026-08-07T21:06:06Z. All three clauses of the integrated edge were checked individually - review_ready(TASK-046) at f148567d, its single pre_merge_gates entry review closed at approved at 78359ae2, and the branch merged into the integration branch per the approved order. This is this task's ONLY scheduling dependency besides the already-satisfied lineage gate_passed edge, which is why this record becomes ready and TASK-048 does not. SATISFYING THIS EDGE SATISFIES NO ACTIVATION PREREQUISITE AND CLEARS NO EXTERNAL BLOCKER.
required_gates:
  - review
  - security
  - qa
pre_merge_gates:
  - review
  - security
gate_tasks:
  - task: TASK-053
    gate: review
    round: 1
    verdict: changes-required
    verdict_recorded_at: 7e78f1405e40e29034673944949c3851e466cf3c
    remediated_by: TASK-056
    revalidated_by: TASK-057
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-REVIEW
    lineage_round: 1
  - task: TASK-057
    gate: review
    round: 2
    verdict: changes-required
    verdict_recorded_at: df3dafa5203ad02ebba89419c77b6a44efafd91a
    remediated_by: TASK-059
    revalidated_by: TASK-060
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-REVIEW
    lineage_round: 2
  - task: TASK-060
    gate: review
    round: 3
    verdict: approved
    verdict_recorded_at: fa766a2401bcafa663f1eee32f4363325d145c5c
    relation_status: closed
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-REVIEW
    lineage_round: 3
  - task: TASK-054
    gate: security
    round: 1
    verdict: changes-required
    verdict_recorded_at: 8b2da2f88d38872ded14bc18b739c6586ec47336
    remediated_by: TASK-056
    revalidated_by: TASK-058
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 1
  - task: TASK-058
    gate: security
    round: 2
    verdict: changes-required
    verdict_recorded_at: 0a44bb0f6a1405bf49fa536d1149f122f52e4bbb
    remediated_by: TASK-059
    revalidated_by: TASK-061
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 2
  - task: TASK-061
    gate: security
    round: 3
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
    round: 4
    verdict: pending
    relation_status: open
    gate_class: point
    retrospective: false
    gate_lineage: LIN-RELEASE-EXECUTOR-SECURITY
    lineage_round: 4
  - task: TASK-055
    gate: qa
    round: 1
    verdict: pending
    relation_status: open
    gate_class: point
    retrospective: true
    gate_lineage: LIN-RELEASE-EXECUTOR-QA
    lineage_round: 1
gate_status: >-
  ACT-035 binds TASK-063 Security round 4 to exact TASK-062 target 19e75e99 and makes its owner
  ready; the relation remains open and pending. ACT-033 closed only the TASK-060 review round-3
  relation at approved with no findings and recorded TASK-061 Security round 3 as changes-required.
  Historical non-passing relations remain durable. QA round 1 remains
  pending. The latest Review verdict permits implementationReview, but the latest Security verdict
  forbids integration and implementationSecurityReview. No risk is accepted. This record remains
  NON-INTEGRABLE, PR 37 and PR 33 remain open and unmerged, and both MUST NOT be merged. The
  superseded ACT-032 value read - OPEN on all SEVEN relations at ACT-032 and NOT ONE OF THEM IS
  CLOSED. FOUR ROUNDS HAVE NOW RECORDED
  A VERDICT AND ALL FOUR ARE changes-required - TASK-053 over (review, round 1) at
  7e78f1405e40e29034673944949c3851e466cf3c, TASK-054 over (security, round 1) at
  8b2da2f88d38872ded14bc18b739c6586ec47336, TASK-057 over (review, round 2) at
  df3dafa5203ad02ebba89419c77b6a44efafd91a, and TASK-058 over (security, round 2) at
  0a44bb0f6a1405bf49fa536d1149f122f52e4bbb. Under gate-round rule 1 the status of a gate relation is
  the verdict at its HIGHEST round, and under rule 3 a gate closes only when that verdict is approved,
  approved-with-findings with every blocking finding resolved, or a formal acceptance recorded by an
  authorized human; NONE of the three applies to either gate. Each round-2 verdict was ONE verdict
  applied ATOMICALLY to two relations - this record's and TASK-056's - and both relations of each pair
  stay open together. All four verdicts are DURABLE and are superseded by round 3 rather than
  rewritten, which is rule 4. Two new pending round-3 relations were added, TASK-060 for review and
  TASK-061 for security, and both are OPEN and separately READY at the same immutable target
  126f2fa9939b8ac6db4764241952dafbda50e9f4 over the unchanged base
  d63864bcb25fc8897b21c09f8f687e390f85808d. NINE of the sixteen
  round-1 findings are now RESOLVED and SEVEN are partially resolved with their residues carried by
  eight fresh findings; F-054-04 and F-054-05 Critical and F-054-06 High are the first findings ever
  to leave this graph's blocking set. SEVEN FINDINGS STILL BLOCK DELIVERY AND NONE IS ACCEPTED. The qa
  relation at TASK-055 round 1 is UNCHANGED, still pending, and still bound to the OLDEST target
  9fb2eb0c; it is NOT retargeted and no QA successor was created, because invariant 8 forbids a
  LIN-RELEASE-EXECUTOR-QA round 2 before round 1 records a verdict. review and security are pre-merge
  gates and block integration; qa is retrospective and blocks activation rather than integration.
  integrable is FALSE and NO GATE WAS CLOSED AT ACT-032. The superseded ACT-031 value read - OPEN on
  all five relations at ACT-030 and NOT ONE OF THEM IS CLOSED, unchanged in substance from
  ACT-029. WHAT CHANGED IS ONLY THAT BOTH ROUND-2 OWNERS BECAME DISPATCHABLE: TASK-056 published its
  remediation at 85f5d265c888f899332a99b15a7d9c8aa959be00, so TASK-057 and TASK-058 moved from
  blocked to ready and each is now bound to that exact target over this record's own pre-lineage base
  d63864bcb25fc8897b21c09f8f687e390f85808d, which is why each round sees the complete executor rather
  than only the correction to it. NO VERDICT WAS RECORDED AT ACT-030, NO GATE CLOSED OR OPENED, AND
  NONE OF THE SIXTEEN FINDINGS IS RESOLVED - a remediation is the owner's claim that a fix exists and
  only rounds 2 may disposition it. The two round-1 verdicts stay durable and unrewritten. The qa
  relation at TASK-055 round 1 is UNCHANGED, still pending, and still bound to the OLDER target
  9fb2eb0c; it is NOT retargeted by TASK-056's publication and no QA successor was created, because
  invariant 8 forbids a LIN-RELEASE-EXECUTOR-QA round 2 before round 1 records a verdict. integrable
  is FALSE. The superseded ACT-029 value read - OPEN on all five relations at ACT-029, and NOT ONE OF
  THEM IS CLOSED. Two rounds recorded verdicts
  and both are changes-required - TASK-053 at 7e78f1405e40e29034673944949c3851e466cf3c over
  (review, round 1) and TASK-054 at 8b2da2f88d38872ded14bc18b739c6586ec47336 over (security, round
  1). Under gate-round rule 1 the status of a gate relation is the verdict at its HIGHEST round, and
  under rule 3 a gate closes only when that verdict is approved, approved-with-findings with every
  blocking finding resolved, or a formal acceptance recorded by an authorized human; NONE of the
  three applies to either. Both verdicts are DURABLE and are superseded by their lineage's round 2
  rather than rewritten, which is rule 4. Two new pending round-2 relations were added, TASK-057 for
  review and TASK-058 for security, and both are OPEN. The qa relation at TASK-055 round 1 is
  UNCHANGED and still pending: THAT ROUND DID NOT RUN, produced no verdict, and is neither passed nor
  failed - see TASK-055's dispatch_observation. review and security are pre-merge gates and block
  integration; qa is retrospective and blocks activation rather than integration. integrable is FALSE
  and NO gate was closed at ACT-029. The superseded ACT-028 value read - OPEN on all three relations,
  unchanged at ACT-028. No round of any of the three lineages has recorded a verdict; what changed is
  that all three owners are now dispatchable, because this task published.
integrable: false
remediation_state_round_2: >-
  RECORDED AT ACT-031, AND IT IS THE SECOND REMEDIATION CYCLE THIS RECORD'S ARTIFACT HAS ENTERED
  WITHOUT REACHING A PASSING GATE. TASK-056's remediation was judged by both round-2 gates and both
  recorded changes-required. NINE of the sixteen round-1 findings are RESOLVED - F-053-01, F-053-02,
  F-053-03, F-053-05, F-053-07, and F-053-08 by TASK-057, and F-054-04, F-054-05, and F-054-06 by
  TASK-058 - each by reproducing round 1's own counterexample against the new code rather than by
  reading the remediation diff. SEVEN are partially resolved with their residues assigned to named
  fresh findings: F-053-04 to F-057-01; F-053-06 to F-057-02; F-054-01 to F-058-01 and F-058-02;
  F-054-02 to F-058-01; F-054-03 to F-058-03 and F-058-05; F-054-07 to F-058-03; F-054-08 to F-058-04
  and F-058-05. EIGHT FRESH FINDINGS were recorded, all naming devops - F-057-01 and F-057-02 High,
  F-057-03 Medium, F-058-01, F-058-02, and F-058-03 CRITICAL, and F-058-04 and F-058-05 Medium - and
  they route to ONE new remediation record, TASK-059, which branches from agent/claude/devops/task-056
  so the second remediation also reaches this artifact by true ancestry. THIS RECORD'S OWN ARTIFACT
  9fb2eb0c IS STILL NOT RE-AUTHORED, NOT SUPERSEDED, AND NOT RETARGETED; it stays the immutable
  round-1 target of all three lineages forever, and TASK-055's pending qa round is still bound to it.
  THE BLOCKING SECURITY COUNT IS SEVEN AGAIN WITH THREE FINDINGS HAVING LEFT THE SET AND THREE FRESH
  CRITICAL ONES HAVING JOINED, AND NONE IS ACCEPTED.
remediation_state: >-
  RECORDED AT ACT-030. TASK-056 published the remediation of all sixteen findings at
  85f5d265c888f899332a99b15a7d9c8aa959be00 on agent/claude/devops/task-056, whose literal parent and
  branch point is THIS RECORD'S OWN PUBLISHED HEAD 9fb2eb0ca7c02101fd067452824e2612fda5cc0c - so the
  remediation reaches this artifact by TRUE ANCESTRY and the two form one cumulative unit under
  ADR-0041, which is why pull request 33 would land this record's content if it were merged and why
  the prohibition on merging pull request 30 extends to it. THIS RECORD'S OWN ARTIFACT 9fb2eb0c IS
  NOT RE-AUTHORED, NOT SUPERSEDED, AND NOT RETARGETED; it stays the immutable round-1 target of all
  three lineages forever, and TASK-055's pending qa round is still bound to it. NOTHING HERE IS A
  DISPOSITION: all sixteen findings stay open, the seven blocking security findings stay blocking and
  unaccepted, and only TASK-057 and TASK-058 may decide otherwise.
integration_state: >-
  NOT INTEGRATED AND NOT INTEGRABLE AT ACT-033. Review round 3 is closed at approved with no findings,
  but Security round 3 records changes-required and Security round 4 is open and pending. Pull request
  30 remains closed unmerged; cumulative PR 37 and ancestral PR 33 remain open, unmerged, and MUST NOT
  be merged while Security is open. The three fresh Critical findings are unresolved and unaccepted.
  QA round 1 remains pending on this record's immutable target and activation remains forbidden.
superseded_integration_state_act_031: >-
  NOT INTEGRATED AND NOT INTEGRABLE AT ACT-031, AND PULL REQUEST 30 IS NOW CLOSED UNMERGED. The
  user-authorized control session closed pull requests 15, 23, 26, 27, 29, 30, 31, and 32 as CLOSED
  and UNMERGED between 2026-08-08T08:45:42Z and 08:46:05Z, preserving every source branch and every
  exact commit; ACT-031 verified both halves of that independently - each closed pull request has
  mergedAt null, and every head branch still resolves locally AND on origin, with
  agent/claude/devops/task-049 still at 9fb2eb0ca7c02101fd067452824e2612fda5cc0c. NOTHING WAS MERGED
  AND NO BRANCH WAS DELETED. WHAT THIS CHANGES: this record's publication_class runtime requires an
  open or updated pull request, and it no longer has one, so the publication state is corrected on
  this record to say so. WHAT IT DOES NOT CHANGE: no verdict, no relation, no gate, no finding, and no
  integrability. This record was already non-integrable with both pre-merge gates open, and it is
  non-integrable now for exactly the same reason. The review_ready(TASK-049) edge was satisfied at
  ACT-028 and consumed then, and a satisfied edge is not re-evaluated retroactively; TASK-055's
  binding to 9fb2eb0c is immutable and unaffected; and TASK-056's true-ancestry relationship to this
  artifact is unaffected, which was checked rather than assumed. THE PROHIBITION ON MERGING IS
  THEREFORE MOOT FOR PULL REQUEST 30 RATHER THAN DISCHARGED - its gates are still open and its branch
  is still unintegrated - AND IT REMAINS FULLY IN FORCE FOR PULL REQUEST 33, whose two pre-merge gates
  now both record changes-required and which would land this record's content by ancestry. Whether a
  runtime-class publication whose pull request is later closed should be re-recorded as something
  other than published is routed to the next LIN-DECOMP-REVIEW round as an open question rather than
  settled here; see the ACT-031 section of the activation log. ACT-031 merged nothing, requested no
  merge, simulated none, and modified, closed, reopened, commented on, and approved no pull request.
  The superseded ACT-030 value read - NOT INTEGRATED, NOT INTEGRABLE, AND UNCHANGED AT ACT-030 - the
  remediation publication moved nothing here, and PULL REQUEST 33 IS NOW SUBJECT TO THE SAME
  PROHIBITION BY ANCESTRY. The
  superseded ACT-029 value read - NOT INTEGRATED, NOT INTEGRABLE, AND FURTHER FROM INTEGRABLE THAN AT ACT-028 RATHER THAN NEARER.
  Pull request 30 is OPEN at exact head 9fb2eb0ca7c02101fd067452824e2612fda5cc0c against
  integration/autonomous-runtime, MERGEABLE / CLEAN as GitHub computes it, and MUST NOT BE MERGED:
  both pre_merge_gates entries, review and security, now carry a recorded changes-required verdict
  and both relations stay OPEN. GitHub's mergeStateStatus is a statement about Git conflicts and
  branch policy, NOT about this graph's gates, and the two must never be conflated - the repository
  control plane is unprotected, so nothing outside this record would stop a merge, and this record is
  what forbids it. SEVEN BLOCKING SECURITY FINDINGS - five Critical and two High - ADDITIONALLY BLOCK
  DELIVERY UNTIL RESOLVED OR FORMALLY ACCEPTED BY AN AUTHORIZED HUMAN, and no acceptance of any kind
  exists. ACT-029 merged nothing, requested no merge, simulated none, and modified, closed, reopened,
  commented on, and approved no pull request. The superseded ACT-028 value read - NOT INTEGRATED and
  NOT INTEGRABLE. Pull request 30 is OPEN against integration/autonomous-runtime and MUST NOT be
  merged: both pre_merge_gates entries, review and security, are open with no verdict at any round.
parent_task: TASK-001
publication_class: runtime
published_commit: 9fb2eb0ca7c02101fd067452824e2612fda5cc0c
published_branch: agent/claude/devops/task-049
published_remote_ref: refs/heads/agent/claude/devops/task-049
pull_request: https://github.com/Fhurky/Multi-Agent-Engineering-Framework/pull/30
pull_request_state: >-
  CLOSED AND UNMERGED at 2026-08-08T08:45:59Z, by the user-authorized control session, read from the
  API at ACT-031 with mergedAt null. The pull-request LINK is retained rather than removed, because it
  is the durable provenance of how this artifact was published and of the exact-head check-run
  evidence recorded against it. THE SOURCE BRANCH WAS NOT DELETED: agent/claude/devops/task-049 still
  resolves to 9fb2eb0ca7c02101fd067452824e2612fda5cc0c locally and on origin, checked with git
  rev-parse and git ls-remote, and every commit the pull request carried is still reachable.
publication: published
publication_correction: >-
  RECORDED AT ACT-031 AS A CURRENT-STATE CORRECTION, NOT AS A RE-EVALUATION OF A CONSUMED EDGE. This
  record declares publication_class runtime, whose satisfying condition is an immutable published
  commit AND the branch on the configured remote AND an open or updated pull request. The first two
  conditions still hold exactly as recorded. THE THIRD NO LONGER DOES, because pull request 30 is
  closed. The publication field is left reading published rather than rewritten, and the reason is
  stated rather than assumed: publication records what the owner achieved at publication time, and
  review_ready(TASK-049) was satisfied at ACT-028 on all three conditions checked independently and
  CONSUMED THEN. A satisfied edge is not re-evaluated retroactively, TASK-053's, TASK-054's, and
  TASK-055's bindings to 9fb2eb0c are immutable, and TASK-056's true ancestry over this artifact is
  unaffected. NOTHING ABOUT THIS CHANGES A VERDICT, A RELATION, A GATE, A FINDING, OR INTEGRABILITY -
  this record was already non-integrable with both pre-merge gates open at changes-required, and it is
  non-integrable now for exactly the same reason. WHETHER THE MODEL NEEDS A FOURTH PUBLICATION-CLASSES
  CLAUSE FOR A WITHDRAWN PULL REQUEST IS ROUTED TO THE NEXT LIN-DECOMP-REVIEW ROUND as an explicit
  question rather than settled by the role that first met it; it is deliberately not a model
  correction, because no rule changed and no earlier claim was false when written, and it is
  deliberately not a finding, because authoring one is not the Orchestrator's authority.
publication_note: >-
  All three runtime-class conditions hold independently, verified at ACT-028 rather than inferred.
  Immutable published commit 9fb2eb0ca7c02101fd067452824e2612fda5cc0c; refs/heads/agent/claude/devops/task-049
  on origin resolves to the same object under git ls-remote and under the local remote-tracking ref;
  and pull request 30 is OPEN, not a draft, MERGEABLE with mergeStateStatus CLEAN, base
  integration/autonomous-runtime, headRefOid 9fb2eb0c, created 2026-08-07T22:21:29Z, changedFiles 38,
  additions 12034, deletions 0. Rule 2 could have blocked review_ready(TASK-049) and again did not
  have to; this is the third runtime-class publication in this graph, after TASK-018 and TASK-043.
authored_delta: >-
  38 paths, 12034 insertions, 0 deletions against the resolved branch point
  d63864bcb25fc8897b21c09f8f687e390f85808d, every path under scripts/release/integration-merge/**,
  residue empty by enumeration with ':!scripts/release/integration-merge' returning zero paths, and
  git diff --check exiting 0 over the range. The figures equal pull request 30's own changedFiles,
  additions, and deletions exactly.
authoring_ancestry: >-
  012bdb8360a7a1b4e61b362d9302f731ad817078 feat(TASK-049) is this branch's first authored commit over
  the branch point and is authoring ancestry rather than the published commit, under the same rule
  that excluded fa68a06, e594e72, b894e7f, 65d624d, d2c59969, and cf999eae. git rev-list --count
  d63864bc..9fb2eb0c returns 2, so the head-binding rule had two candidates rather than one. The head
  is bound because the owner's own pull request names 9fb2eb0c the "Final authored content head",
  because the published-head-evidence/v2 bundle's targetCommit is 9fb2eb0c and its author phase was
  rerun in full against that head after the later content commit, and because the pull request's
  headRefOid is 9fb2eb0c. It is NOT bound because the entry-point artifact differs there - blob
  84f2235946b72b35043292d87b6e8d941a3fada7 for scripts/release/integration-merge/index.ts is
  byte-identical at both commits, so content_hash is the same at either and only source_commit and
  therefore fact_id depend on the binding. That is the opposite of the ACT-009 case and is recorded
  rather than left implicit. 012bdb8 carries two passing check runs of its own, validate 93013010816
  and security 93013010461; they are recorded as facts about THAT commit and are never transferred.
published_head_evidence: >-
  published-head-evidence/v2, complete, two-phase, at pull request comment
  https://github.com/Fhurky/Multi-Agent-Engineering-Framework/pull/30#issuecomment-5222784899,
  created 2026-08-07T22:25:33Z by Fhurky. ACT-028 decoded and RECOMPUTED it rather than transcribing
  it. Deterministic gzip 3727 bytes, SHA-256
  8764b321a6e9cf5b32743a7db3d623b645bec4e4701803895059b2742f78dbda; canonical JSON 22960 bytes, no
  BOM, SHA-256 18ff4f727137a174449734f902073643da708e9a75f51a0d0d648413264cf7d2, and an independent
  re-serialization under the module's own canonical rules reproduced the file BYTE-FOR-BYTE.
  canonicalBundleDigest recomputed by omitting exactly that one top-level property returns
  c6a9e4a173ed7fe68e2c53b9eaa7d477549aff3138ef8937c9fe14859ed03a03, equal to the declared value;
  author.canonicalAuthorEvidenceDigest returns
  f0b2377e6cb9d95ddcec9b5c5c32714d89fac1dfbc37097bfdae77dba0246bcd, equal to the declared value, and
  control.authorEvidenceDigest binds THE SAME author digest, so the cross-phase binding holds. All
  15 command records - 8 author, 7 control - reproduce their own evidenceId, every headBefore and
  headAfter equals 9fb2eb0c, and every exitCode is 0. Both phases record resolvedBases
  integration/autonomous-runtime = d63864bc. NoLaterContentProof reports 0 commits after the target on
  the local branch, the remote branch, and the pull-request head, each re-derived here from Git and
  the GitHub API. THIS IS OWNER VERIFICATION AND IS NOT A GATE VERDICT; the bundle says so itself.
exact_head_check_evidence: >-
  GitHub created two check runs at the exact head 9fb2eb0ca7c02101fd067452824e2612fda5cc0c and both
  concluded success - security, id 93013249507, completed 2026-08-07T22:23:27Z, and validate, id
  93013249337, completed 2026-08-07T22:23:12Z; total_count 2, app github-actions. The legacy combined
  status surface returns state pending with ZERO contexts, and both surfaces were read. This is the
  ninth consecutive ingress fact whose source commit carries executed continuous integration, and it
  is recorded as a count of nine facts about nine commits. IT IS OWNER-SIDE VERIFICATION EVIDENCE
  ONLY. It is NOT an independent reviewer, security, or QA verdict, it closes no relation, and TASK-053,
  TASK-054, and TASK-055 must each judge it for themselves at this exact identifier.
governance_decision_context: >-
  HUMAN-004, approved at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68 on
  human/decision/human-004-autonomous-merge, artifact
  plans/decisions/HUMAN-004-autonomous-merge-authority.md. Read the decision at that commit and
  not from any transcription. It authorizes this executor conditionally, enumerates eight
  prohibited capabilities, and states that a merge to main is explicitly NOT an irreversible
  production action unless a later approved policy deliberately couples it to one.
normative_architecture_source: >-
  docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md,
  docs/architecture/runtime/COMPONENT-BOUNDARIES.md,
  docs/architecture/runtime/INTEGRATION-STRATEGY.md, docs/adr/0042-*.md, docs/adr/0043-*.md, and
  docs/adr/0044-single-policy-result-and-two-phase-published-head-evidence.md, all read at
  f148567d716c00d7a24783318c8d6d7031492e7b, the immutable TASK-046 publication that
  LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 approved at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6. Read through Git object access at that exact
  identifier, or from integration/autonomous-runtime once TASK-046 is integrated.
recorded_findings_against_this_target: >-
  SIXTEEN, all owner devops, all recorded at ACT-029 and ALL UNRESOLVED. TASK-053 recorded F-053-01
  through F-053-08 - seven High and one Medium - at 7e78f1405e40e29034673944949c3851e466cf3c.
  TASK-054 recorded F-054-01 through F-054-08 - FIVE CRITICAL, two High, and one Medium - at
  8b2da2f88d38872ded14bc18b739c6586ec47336. Read each from its own report at its own source commit
  through Git object access, NEVER from this field, from the dependency graph, or from any other
  record's transcription; the evidence, the counterexamples, and the required changes are authored
  only in those two artifacts. THEY ARE SIXTEEN SEPARATE FINDINGS AND NOT A SMALLER SET WITH
  DUPLICATES: several pairs describe the same code region from a review lens and a security lens -
  F-053-01 and F-054-01 on attestation authentication, F-053-02 and F-054-03 on relation ambiguity,
  F-053-04 and F-054-02 on activation binding, F-053-05 and F-053-06 against F-054-04, F-054-05, and
  F-054-06 on execution, retry, and durable evidence, and F-053-07 and F-054-08 on published-head
  evidence - but each carries its own ID, its own severity, its own evidence, and its own required
  change, and NEITHER GATE OWNER DECLARED ANY OF THEM AN INHERITED VIEW OF THE OTHER. Merging them
  would be this role authoring a judgment it has no authority to make; TASK-057 and TASK-058 each
  disposition their own lineage's eight and NEITHER may disposition the other's.
remediation_routing: >-
  ONE remediation record, TASK-056, owner devops / claude, write scope
  scripts/release/integration-merge/**, resource lock release-merge-executor. It carries ALL SIXTEEN
  findings. ONE record rather than two, and the reason is a rule rather than convenience: the graph
  requires one remediation task PER RESPONSIBLE OWNER, and all sixteen name devops. Two records would
  declare the IDENTICAL write scope, which allow_overlapping_write_scopes false forbids and which the
  findings-return path names as "as much a defect as folding two owners into one" - they would
  contend on one lock, could not run in parallel, and would have to divide one module's admission
  path between two authors. TASK-056 is judged by TWO separate rounds in TWO separate lineages by TWO
  separate execution contexts - TASK-057 for review and TASK-058 for security - so a single
  remediation record does NOT produce a single verdict, and the atomicity is in the remediation, not
  in the judgment.
activation_prerequisites: >-
  NONE OF THESE IS A SCHEDULING DEPENDENCY AND NONE IS SATISFIED BY LANDING CODE. The approved
  MergeExecutorActivationRecord requires, as immutable members - architectureReview, satisfied at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6; implementationReview, which TASK-053 alone may
  produce; implementationSecurityReview, which TASK-054 alone may produce;
  negativeCapabilityTestAttestation, which TASK-055 alone may validate; gateVocabularyCorrection,
  applied by ACT-026 to tasks/TASK-001-DEPENDENCY-GRAPH.md and to be pinned at that commit;
  requiredGitHubPolicyProfile with an immutable digest; and policyAttestorTrustRoot. Until every
  member exists and is pinned, admit returns AuthorityNotActivated and no merge side effect may
  occur. This task implements that closed behavior; it does not activate it.
external_blockers: >-
  Two, both human-controlled and neither performable from an agent/* branch. FIRST, the exact
  AGENTS.md amendment returned verbatim at
  docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md lines 577 through 604 at
  f148567d716c00d7a24783318c8d6d7031492e7b. SECOND, provisioning of the human-controlled control
  plane, including protection of main with pull-request-only updates, no force push or deletion,
  the seven required aggregate release checks pinned to their expected App sources, strict
  current-base enforcement, no bypass actors including administrators and both executor Apps, a
  repository merge-method configuration that permits an ordinary merge commit for the integration
  release pull request, the two least-privilege executor GitHub Apps and their token broker, the
  external evidence store, and the RepositoryPolicyAttestor with its pinned observer principal
  set, signing key, trust root, and revocation service. If a policy requires linear history on
  main, human governance must resolve that conflict against the selected release merge method
  before activation; an executor cannot change either. Round 3 read the live control plane and
  recorded no branch protection on main, no repository rulesets, and no provisioned attestor. This
  task must not provision, request, configure, or simulate any of it.
dormancy_contract: >-
  dormant-before-durable-merge-ingress, named normatively in
  docs/architecture/runtime/COMPONENT-BOUNDARIES.md at
  f148567d716c00d7a24783318c8d6d7031492e7b. Source may land before TASK-026 and TASK-005 complete
  only under this contract - the activation record is invalid, admit returns AuthorityNotActivated,
  and NO MERGE SIDE EFFECT MAY OCCUR. There is no operator-appended or post-merge interim
  substitute and none may be built.
review_target_base: d63864bcb25fc8897b21c09f8f687e390f85808d
review_target_applicability: >-
  APPLICABLE AND RESOLVED AT ACT-028, on the condition this field itself named. Three gate rounds are
  now pinned on this record - TASK-053 r1, TASK-054 r1, and TASK-055 r1 - so the question "what delta
  is under review" has an answer. The reviewed target is the immutable published head
  9fb2eb0ca7c02101fd067452824e2612fda5cc0c and the authored-delta base is
  d63864bcb25fc8897b21c09f8f687e390f85808d, resolved with git merge-base
  agent/claude/devops/task-049 integration/autonomous-runtime and equal to the value both phases of
  the owner's evidence bundle declare. Target and base are bound together and NEITHER IS EVER
  RETARGETED, under findings F-403 and A-209. The superseded value read - not applicable, per the
  applicability rule.
branch_point_of: integration/autonomous-runtime
scope_validation_base: d63864bcb25fc8897b21c09f8f687e390f85808d
scope_validation_applicability: >-
  applicable and RESOLVED at ACT-028 from the branch as published, rather than from what this record
  prescribed, under baseline rule 2 and finding A-209. It is this task's own immutable branch point
  and is unrelated to review_target_base above; findings F-403 and A-209 require the two to stay
  separate fields, and here they happen to hold the same value because the reviewed delta is exactly
  the authored delta - which is stated as a coincidence of this publication's shape rather than as a
  merger of the two questions.
scope_validation_note: >-
  RESOLVED. The owner branched from integration/autonomous-runtime and resolved the branch point
  inside its own worktree exactly as instructed; git merge-base agent/claude/devops/task-049
  integration/autonomous-runtime returns d63864bcb25fc8897b21c09f8f687e390f85808d, re-derived at
  ACT-028 rather than accepted from the handoff. The prescribed provenance and the branch's actual
  provenance AGREE, which is the case A-209 exists to detect when they do not. The record's earlier
  expectation of cf6333b was stated as an expectation and was correctly not assumed: the integration
  branch moved to d63864b - the ACT-027 task-state synchronization commit - between ACT-027 and this
  task's dispatch, and the note's own instruction to resolve rather than assume is what made that
  harmless. The owner's own acceptance run reported valid: True over 38 changed files against this
  base. The superseded ACT-027 note read - TASK-046 IS NOW INTEGRATED, so this instruction is
  executable. Branch from integration/autonomous-runtime, which resolves to
  cf6333b10e628b3b61f3b7f8716b30923725067d as read at ACT-027, then resolve the immutable branch
  point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that
  exact value to -BaseRef. Never pass origin/main, c325275, de3a8d6, f123c9a3, 49e3ff47, 8250f236,
  c95ce600, f148567d, or a review-diff base.
blocked_reason: >-
  NOT BLOCKED and no longer awaiting an owner. Cleared at ACT-027, discharged by publication at
  ACT-028. This record is in review because its artifact exists and its three gates are open. The
  superseded ACT-027 value read - NOT BLOCKED. Cleared at ACT-027. Every scheduling dependency this
  record declares is satisfied -
  the LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 3 gate_passed edge at
  78359ae2e3dc6e97fb3d60f0b847b84abed08fa6 since ACT-026, and integrated(TASK-046) at
  cf6333b10e628b3b61f3b7f8716b30923725067d since ACT-027. This task deliberately does NOT declare
  integrated(TASK-018): its module is a self-contained release control-plane module under
  scripts/release/**, it imports no runtime implementation and no contract root, and TASK-043
  established the precedent that a script-scoped devops task carries no toolchain edge. That
  narrower dependency set is the whole reason this record is ready while TASK-048, which declares
  three integrated() edges, is not. THE SUPERSEDED ACT-026 VALUE READ - One integrated() edge is
  unsatisfied. integrated(TASK-046) requires the operator to merge the approved
  integration-authority amendment into integration/autonomous-runtime; its gate closed at ACT-026
  and it is now integrable, but no merge has occurred and no Orchestrator activation may perform
  one. The lineage gate_passed edge IS satisfied.
readiness_qualification: >-
  PUBLISHED AS A DORMANT IMPLEMENTATION, JUDGED NON-INTEGRABLE BY TWO INDEPENDENT GATES AT ACT-029,
  AND STILL DORMANT - the qualification below is unchanged and the two verdicts make it sharper
  rather than softer. AT ACT-029 THE ARTIFACT WAS JUDGED AND FAILED, TWICE, IN TWO ROLES AND ONE LLM
  FAMILY, AND NEITHER VERDICT MOVED ANY ACTIVATION PREREQUISITE IN EITHER DIRECTION. review here now
  means exactly one thing - a dormant module exists at 9fb2eb0ca7c02101fd067452824e2612fda5cc0c, two
  of its three gates have judged it and required changes, and one has not run. Three of the five
  missing MergeExecutorActivationRecord members are UNCHANGED AND EXPLICITLY REFUSED rather than
  merely absent: TASK-053 states implementationReview MUST NOT BE PRODUCED, TASK-054 states
  implementationSecurityReview MUST NOT BE PRODUCED, and negativeCapabilityTestAttestation is
  unvalidated because TASK-055 has recorded no verdict. requiredGitHubPolicyProfile and
  policyAttestorTrustRoot still do not exist. THE SUPERSEDED ACT-028 VALUE READ - PUBLISHED AS A
  DORMANT IMPLEMENTATION ONLY, AND THAT QUALIFICATION IS STILL THE MOST IMPORTANT
  SENTENCE ON THIS RECORD. AT ACT-028 THE SOURCE LANDED AND THE AUTHORITY DID NOT. review here means
  exactly one thing - a dormant module exists at 9fb2eb0ca7c02101fd067452824e2612fda5cc0c and three
  independent gates may now judge it. It does not mean this executor may run, may be activated, may
  be merged, may be configured, may be credentialed, or may perform, attempt, or simulate any merge.
  NOT ONE ACTIVATION PREREQUISITE IS SATISFIED BY WRITING THE CODE, and the code itself is what
  enforces that - its own dormancy and activation fixtures assert that admit returns
  AuthorityNotActivated with any member absent. The five members that do not exist are unchanged by
  this publication: implementationReview, which TASK-053 alone may produce; implementationSecurityReview,
  which TASK-054 alone may produce; negativeCapabilityTestAttestation, which TASK-055 alone may
  validate; requiredGitHubPolicyProfile with its immutable digest; and policyAttestorTrustRoot. THE
  ELEVEN LIVE CONTROL-PLANE FIXTURES ARE DECLARED UNEXECUTED AND MUST NEVER BE STUBBED OR PROVISIONED
  TO MAKE THEM PASS. ACT-028 read no policy surface and provisioned, configured, requested, and
  simulated nothing. THE SUPERSEDED ACT-027 VALUE READ - READY AS A DORMANT IMPLEMENTATION ONLY, AND
  THAT QUALIFICATION IS THE MOST IMPORTANT SENTENCE ON
  THIS RECORD. ready here means exactly one thing - a scheduler may dispatch this task's owner to
  write source that CANNOT ACT. It does not mean this executor may run, may be activated, may be
  configured, may be credentialed, or may perform, attempt, or simulate any merge. NOT ONE
  ACTIVATION PREREQUISITE IS SATISFIED - the approved MergeExecutorActivationRecord still lacks
  implementationReview, which TASK-053 alone may produce; implementationSecurityReview, which
  TASK-054 alone may produce; negativeCapabilityTestAttestation, which TASK-055 alone may validate;
  requiredGitHubPolicyProfile with its immutable digest; and policyAttestorTrustRoot. Five of the
  seven immutable members do not exist. NOT ONE EXTERNAL CONTROL-PLANE BLOCKER IS CLEARED - the
  exact AGENTS.md amendment is unauthored and only a human may author it, main and
  integration/autonomous-runtime are both unprotected, the repository ruleset list is empty, no
  required checks are pinned to their expected App sources, no bypass-actor set is configured, the
  two least-privilege executor GitHub Apps and their token broker do not exist, the external
  evidence store does not exist, and no RepositoryPolicyAttestor with its pinned observer principal
  set, signing key, trust root, and revocation service is provisioned. Round 3 read the live
  control plane and recorded that state; ACT-027 read no policy surface and provisioned,
  configured, requested, and simulated nothing. UNDER dormancy_contract THE ACTIVATION RECORD IS
  INVALID, admit RETURNS AuthorityNotActivated, AND NO MERGE SIDE EFFECT MAY OCCUR. This record's
  own exit_condition said in advance that reaching ready never implies any of the above, and
  reaching it has not changed that.
exit_condition: >-
  Review is discharged by TASK-060's approved round-3 verdict. Security is not: TASK-061 recorded
  changes-required and TASK-063 must record a contract-valid passing round-4 verdict atomically over
  TASK-062 r1, TASK-059 r2, TASK-056 r3, and this record r4 before the cumulative implementation can
  become integrable. Only an operator integration of the then-approved cumulative unit can complete
  this record's integration lifecycle. Separately, activation still requires TASK-055's QA verdict,
  every immutable activation-record member, and the human-controlled prerequisites. PR 37 and PR 33
  remain unmerged and forbidden while Security is open; no risk acceptance exists.
superseded_exit_condition_act_029: >-
  UNCHANGED IN SUBSTANCE AT ACT-029 AND FARTHER AWAY IN FACT. Both pre_merge_gates entries have now
  been judged and BOTH RECORDED changes-required, so the first condition below is not merely
  unsatisfied but has been tested and failed once. It can now be satisfied only through the
  remediation TASK-056 and the round-2 verdicts of TASK-057 and TASK-058; this record's own artifact
  9fb2eb0c is immutable and is NEVER re-authored, and neither round 1 verdict is ever rewritten. The
  superseded ACT-028 value read - The scheduling exit condition was DISCHARGED at ACT-027 and this
  record's own work is now
  DISCHARGED at ACT-028 by publication at 9fb2eb0ca7c02101fd067452824e2612fda5cc0c. What remains is
  not this owner's. TWO SEPARATE CONDITIONS REMAIN AND NEITHER IS SATISFIED BY THIS OWNER. FIRST, for
  integration: both pre_merge_gates entries must close at a passing verdict - TASK-053 review and
  TASK-054 security - and only then may the operator merge pull request 30. SECOND, for activation:
  every one of the seven immutable MergeExecutorActivationRecord members must exist and be pinned,
  and the human-controlled control plane and the AGENTS.md amendment must be provisioned and
  authored by a human. Reaching review satisfies neither and implies neither. The superseded ACT-027
  value read - DISCHARGED at ACT-027. TASK-046 is integrated into integration/autonomous-runtime at
  cf6333b10e628b3b61f3b7f8716b30923725067d with every gate in its own pre_merge_gates closed, so
  this task is now ready and dispatchable AS A DORMANT IMPLEMENTATION under dormancy_contract
  above. It is NOT active, and reaching ready did not imply and does not imply that any activation
  prerequisite or external blocker is satisfied - see readiness_qualification, which enumerates the
  five missing activation-record members and the unprovisioned control plane individually.
---

# TASK-049: Integration-to-main release merge executor

## Objective

Implement the `devops`-owned release merge executor exactly as the approved architecture defines it: a release control-plane module that, given one immutable `release-gates/v1` manifest and one immutable GitHub observation, either constructs a single ordinary merge of one admitted pull request whose head is the configured integration branch into `main`, or returns exactly one typed non-admission result — and that can do nothing else.

## Why this task exists now, and why it is separate from TASK-048

`HUMAN-004` authorizes **two** merges with **two** owners. `LIN-INTEGRATION-AUTHORITY-REVIEW` round 3 recorded `approved` at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6` and stated that "HUMAN-004 requires two separately owned tasks: the task-to-integration executor belongs to `runtime`, and the integration-to-main release executor belongs to `devops`."

The approved architecture states why the split is structural rather than organizational: release admission has **seven aggregate gate domains**, a different immutable manifest, a different GitHub identity, and authority over a different protected base. It "is a release control-plane module, not runtime business logic and not a generic Git helper", and the two authorities "are intentionally not a single executor parameterized by a target ref."

**An approval is not an activation.** The same report records that "Current live repository policy is unprovisioned, so neither executor is constructible as active today", and that the current contract "correctly fails closed while they are absent."

## Scope

- Implement the module and its nested tests under `scripts/release/integration-merge/`. That path is already inside the `devops` role's configured `write_scope`; **no role reassignment and no write-scope amendment is required.**
- Implement `ReleaseGateManifest` handling: exactly one requirement for **each** of the seven `ReleaseGateDomain` values — review, security, QA, performance, documentation, deployment, and rollback. Each requirement is evaluated with `ExecutorGateAdmissibility`, the authoritative-round rule, and `gateClass: 'aggregate'`. A missing domain, duplicate domain, point gate, open or incomplete relation set, stale round, generic formal acceptance, or non-passing verdict **refuses**. The withdrawn owner form is invalid. `gate_passed` alone is never sufficient.
- Implement the sole security exception exactly: only a security-domain `accepted_security_risk` member carrying exact immutable authorized-human `accepted-blocking-security-risk/v1` records may represent HUMAN-004's first exception. Generic formal acceptance returns `PreMergeGateNotPassing`; a Low or Medium record, an unmatched target, finding, digest, or round, a mutable ref, a missing record, an extra record, or an acceptance purporting to waive another predicate returns `SecurityRiskAcceptanceInvalid`.
- Implement release-lineage evidence handling that accepts runtime, operator, or mixed provenance **only** when every content unit carries equivalent immutable evidence, and refuses any missing, duplicate, reordered, or unverifiable unit.
- Consume a complete, fresh, plan-bound, signed `TrustedCurrentPolicyAttestation` from the separate human-controlled policy plane. **This module owns no policy-observation port**, holds no Administration or ruleset access, and is not a bypass actor.
- Implement durable receipt-backed intent before the sole mutation, exact-once recovery, reconcile-before-retry, bounded retries, and agent-owned remediation routing that creates no task.
- Implement the negative-capability surface structurally: exactly **one** pull-request merge port against `main`, with the exact expected head SHA, and **no** generic HTTP, Git ref update, `git push` to `main`, `ALLOW_MAIN_PUSH`, force, hook bypass, administrator override, required-check mutation, branch-protection or ruleset mutation, gate mutation, task-ownership mutation, or lock-release mechanism.
- Keep merge to `main` **decoupled from any irreversible production action**, per HUMAN-004's own text, unless a later approved policy deliberately records the coupling and its human authorization rule. This task must not record such a coupling.
- Provide every applicable fixture from the approved "Required evidence and validation fixtures" list, including the release manifest success fixture covering all seven domains, the exhaustive refusal table, the live protected-branch test proving this identity can only merge the integration pull request into `main` and that direct and force pushes fail, the policy-attestation fixtures, and the published-head evidence fixtures.
- Produce the `published-head-evidence/v2` two-phase bundle for this task's own publication.
- Exclude: implementing the task integration executor, which is **TASK-048**; authoring or editing `AGENTS.md`, `config/agents/settings.yaml`, `.agents/**`, `.github/**`, `.githooks/**`, `scripts/ci/**`, `scripts/quality/**`, `src/**`, `tests/**`, `tasks/**`, or any architecture document; provisioning, configuring, or requesting any control-plane or credential change; performing, requesting, or simulating any merge; and asserting that any activation prerequisite is satisfied.

## Acceptance criteria

- [ ] Every changed path is inside `scripts/release/integration-merge/**`, verified by enumerating the changed-path list. **`.github/workflows/**` is excluded even though the `devops` role is granted it**, because `AGENTS.md` reserves the baseline CI and security workflows as human-controlled paths — the same narrowing TASK-043 recorded.
- [ ] `admit` is **total** over its declared input domain and returns exactly one result member for every input, demonstrated by an exhaustive table test.
- [ ] A manifest missing any one of the seven domains, or carrying a duplicate, a point gate, a stale round, or a generic formal acceptance, is proven to construct **no** plan, **no** durable intent, and **zero** merge API calls — one test per case.
- [ ] With any activation-record member absent, unpinned, mutable, or executor-produced, `admit` returns `AuthorityNotActivated`, with each case constructed individually.
- [ ] The structural surface exposes exactly one merge port and is proven to contain no second path to `main`, enumerated against the approved negative-capability table rather than sampled.
- [ ] The module imports no runtime implementation module and no runtime contract root, proven by a static dependency test.
- [ ] The publication carries a complete two-phase `published-head-evidence/v2` bundle for the exact published head, with an absent GitHub check state recorded as an absence and never as a success.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>` reports a valid result and its output is recorded in the handoff together with the resolved branch point.
- [ ] The handoff states explicitly that the executor is **dormant**, that no activation prerequisite was satisfied by this task, and that no merge was performed, requested, or simulated.

## Expected artifacts

- `scripts/release/integration-merge/` — the release admission module, its manifest resolver, its typed result union, its durable-intent store client, its narrow GitHub merge port, and its nested tests under `scripts/release/integration-merge/tests/`.

## Write-scope isolation

`scripts/release/integration-merge/**` is disjoint from TASK-018's manifests, `scripts/quality/**`, `scripts/ci/**`, and `.github/workflows/**`; from TASK-043's `scripts/ci/**`; and from TASK-048's `src/orchestrator/integration/**` and `tests/unit/orchestrator/integration/**`. **Revision 30 corrects the sentence that followed.** It read: *"No task in this graph declares `scripts/release/**`, so no resource lock is required or declared"* — true when written at `ACT-026` and false from the moment `ACT-029` created **TASK-056**, which declares the identical scope. The overlap is real and is serialized by the new shared lock **`release-merge-executor`**, held by this task and TASK-056, exactly as `ci-toolchain` serializes TASK-018 and TASK-043 on `scripts/ci/**`. This task still does **not** hold `ci-toolchain`, which serializes `scripts/ci/**` alone. **Declaring the lock changed nothing else about this record**, and this task's execution is complete, so it constrains nothing already done.

## Gate and remediation path

Three gates, three separate owner roles, three separate lineages, and three separate execution contexts. **This task's owner may not perform any of them.**

| Gate | Owner | Lineage | Blocks integration |
|---|---|---|---|
| review | **TASK-053**, `reviewer` / `gpt` | `LIN-RELEASE-EXECUTOR-REVIEW` | yes |
| security | **TASK-054**, `security` / `gpt` | `LIN-RELEASE-EXECUTOR-SECURITY` | yes |
| qa | **TASK-055**, `qa` / `gemini` | `LIN-RELEASE-EXECUTOR-QA` | no — see the register |

Findings return to the Orchestrator under TASK-013; a gate owner never implements the fix and this owner never records a verdict. Publishing this task's own artifact is the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence.** The author is `devops` / `claude`; the review and security gates are `gpt` and the QA gate is `gemini`. Author and every gate owner are in different roles, different execution contexts, **and different LLM families**. TASK-053, TASK-054, and TASK-055 must additionally not run in TASK-048's, TASK-050's, TASK-051's, or TASK-052's execution context, because both executors implement one shared normative protocol and a reviewer that authored or reviewed one half is not independent of the other.

## Task-record lifecycle

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the `devops` role's configured write scope. The Orchestrator performs every transition under TASK-013.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-049 -Role devops -Llm claude`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-049 -Role devops -Llm claude` before editing.
3. Read the approved contracts at their exact identifiers through Git object access, or from `integration/autonomous-runtime` once TASK-046 is integrated.
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved branch point>`.
5. Commit, push this task branch, and open a pull request against `integration/autonomous-runtime`. **Never push `main`, never merge anything, and never set `ALLOW_MAIN_PUSH`.**
6. Produce the two-phase published-head evidence bundle and attach it to the pull request.
7. Run `scripts/orchestration/release-task.ps1 -TaskId TASK-049 -Role devops -Llm claude`.

## Handoff

Maintained by the Orchestrator under TASK-013 from this owner's commit, pull request, and handoff.

- **Commit or pull request:** **`9fb2eb0ca7c02101fd067452824e2612fda5cc0c`** on `agent/claude/devops/task-049`, over resolved branch point **`d63864bcb25fc8897b21c09f8f687e390f85808d`**, preceded on the same branch by the authoring-ancestry commit `012bdb8360a7a1b4e61b362d9302f731ad817078`. Published at `refs/heads/agent/claude/devops/task-049` on `origin` and opened as **pull request 30**, `OPEN` / `MERGEABLE` / `CLEAN` against `integration/autonomous-runtime`, not a draft, `changedFiles` 38, `additions` 12034, `deletions` 0.
- **Verification, transcribed as this owner's claims and separated from what `ACT-028` re-derived.** *The owner recorded, in pull request 30:* release merge executor tests exit 0 with **416 declared, 405 executed and passing, 0 failing, 11 unexecuted**; `validate-write-scope.ps1 -IncludeWorkingTree -BaseRef d63864bc…` exit 0, `valid: True`, 38 changed files; `validate-framework.ps1` exit 0 for 13 roles; `test-orchestration.ps1` exit 0; `test-check-run-evidence.ps1` exit 0 with 82 assertions; `check-repository.ps1` exit 0; changed-path enumeration 38 paths with none outside `scripts/release/integration-merge/**`; `git diff --check` exit 0. *An independent control session reported* rerunning all repository validators plus `scripts/release/integration-merge/run-tests.ps1` and obtaining the same **416 / 405 / 0 / 11**. *`ACT-028` re-derived what it could without leaving its own scope:* the 38-path / 12034-insertion / 0-deletion delta and its empty residue from the committed tree; `git diff --check` exit 0 over the range; the resolved branch point from `git merge-base`; the remote ref from `git ls-remote`; the pull-request state from the API; the two exact-head check runs from the API; the whole evidence bundle recomputed from its own bytes; and **the test suite re-run read-only from an isolated `git archive` export of the module at `9fb2eb0c`, returning `tests 416, pass 405, fail 0, cancelled 0, skipped 0, todo 11`, exit 0** — reproducing the owner's and the control's figures exactly, in a directory outside every worktree, touching no tracked file.
- **Known risks, recorded and deliberately NOT authored as findings, because this role has no authority to make one.** **(1)** **Eleven declared fixtures did not execute.** They are the live protected-branch and attestor-boundary obligations of the approved evidence list, registered as `todo` in `tests/live-control-plane.blocked.test.ts` and unsatisfiable while the human-controlled control plane is absent. **An unexecuted obligation is not a passing one and is recorded here as unexecuted.** Whether the declared-versus-executed gap is acceptable, and on what terms, belongs to **TASK-055** and is stated so it is decided rather than discovered. **(2)** **No compiler exists in this repository**, so the module's TypeScript annotations are erased rather than statically checked; the owner states every typed invariant is additionally asserted at run time by the fixtures, and whether that substitution holds is **TASK-053**'s judgment. **(3)** **The module ships with no manifest and no dependency**, running on Node.js native type stripping, because TASK-018 owns the root manifests and is not integrated. **(4)** **The exact-head check runs are owner-side verification** and are not a gate result of any kind.
- **Created `blocked` at `ACT-026`**, on the `LIN-INTEGRATION-AUTHORITY-REVIEW` `lineage_round` 3 `approved` verdict at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6`. It is `blocked` rather than `ready` because `integrated(TASK-046)` is unsatisfied, and it must not be released until it is.
- **Transition at `ACT-027`: `blocked` → `ready`, on ingress entry `seq` 37, class `branch_integrated`.** The operator merged pull request 28 into `integration/autonomous-runtime` at **`cf6333b10e628b3b61f3b7f8716b30923725067d`**, satisfying `integrated(TASK-046)` — this record's **only** scheduling dependency besides the lineage `gate_passed` edge satisfied at `ACT-026`. All three clauses of the `integrated` edge were checked individually rather than granted on the strength of the merge existing. **`ACT-027` merged nothing and simulated nothing; it consumed the fact.**
- **THIS RECORD IS READY AS A DORMANT IMPLEMENTATION AND AS NOTHING ELSE.** No activation prerequisite is satisfied and no external control-plane blocker is cleared. **Five of the seven immutable `MergeExecutorActivationRecord` members do not exist** — `implementationReview` (TASK-053 alone), `implementationSecurityReview` (TASK-054 alone), `negativeCapabilityTestAttestation` (TASK-055 alone), `requiredGitHubPolicyProfile` with its digest, and `policyAttestorTrustRoot`. The `AGENTS.md` amendment is unauthored and only a human may author it. `main` and `integration/autonomous-runtime` are unprotected, the ruleset list is empty, and no `RepositoryPolicyAttestor` is provisioned. Under `dormancy_contract` the activation record is invalid, `admit` returns `AuthorityNotActivated`, and **no merge side effect may occur.** See `readiness_qualification`, which enumerates each one. **The owner must write source that cannot act, must not provision, request, configure, or simulate any control-plane state, and must not assert that any prerequisite is met.**
- **Why this record is `ready` and TASK-048 is not, stated because the same merge produced both outcomes.** This record declares one `integrated()` edge and TASK-048 declares three; the merge satisfied the one they share and neither of the other two. TASK-048 stays `blocked` on `integrated(TASK-018)` and `integrated(TASK-003)`.
- **Transition at `ACT-028`: `ready` → `review`, on ingress entry `seq` 38, class `artifact_published`.** `review_ready(TASK-049)` holds on all three `runtime`-class conditions **independently** — immutable published commit, branch on `origin`, open pull request — each checked separately rather than granted on the strength of the pull request existing, so the bootstrap allowance of publication-classes rule 1 was neither available nor needed and rule 2 could have blocked it and did not have to. **This publication released exactly three edges**, checked by enumeration over all 55 records: `review_ready(TASK-049)` is named by TASK-053, TASK-054, and TASK-055 and by nothing else, so those three moved `blocked` → `ready` together and no other record changed state.
- **PULL REQUEST 30 IS OPEN AND MUST NOT BE MERGED.** Both entries of this record's `pre_merge_gates` — `review` and `security` — are open with no verdict at any round of `LIN-RELEASE-EXECUTOR-REVIEW` or `LIN-RELEASE-EXECUTOR-SECURITY`. **`ACT-028` merged nothing, requested no merge, simulated none, and modified, closed, reopened, commented on, and approved no pull request.**
- **This record's `done` is two facts away and neither is this owner's.** `integrated(TASK-049)` requires both pre-merge gates closed **and** the branch merged by the operator. **A publication is not a verdict**, which is the distinction this graph has drawn since `ACT-003`, and neither the passing continuous integration at the exact head nor the complete evidence bundle nor the reproduced test figures is one. **`ACT-029` supplied the two verdicts that publication was not, and both are `changes-required`** — which is the same distinction landing in the direction the graph had not yet exercised on an implementation artifact.
- **Two verdicts recorded at `ACT-029`, on ingress entries `seq` 39 and `seq` 40, both `changes-required`, and this record does not move.** **TASK-053** recorded `LIN-RELEASE-EXECUTOR-REVIEW` round 1 at **`7e78f1405e40e29034673944949c3851e466cf3c`**, pull request 31, over the single relation `(TASK-049, review, r1)`, with **eight findings, seven High and one Medium, all `devops`-owned**, and states plainly that the module **may not be integrated** and that **`implementationReview` must not be produced**. **TASK-054** recorded `LIN-RELEASE-EXECUTOR-SECURITY` round 1 at **`8b2da2f88d38872ded14bc18b739c6586ec47336`**, pull request 32, over `(TASK-049, security, r1)`, with **eight findings, five Critical, two High, and one Medium, all `devops`-owned**, and states that the module **may not be integrated**, that **`implementationSecurityReview` must not be produced**, and that **the Critical and High findings block delivery until resolved or formally accepted by an authorized human, with no acceptance recorded.** **Both relations stay OPEN and this record stays in `review` at its own immutable published head**; the artifact is not re-authored and `9fb2eb0c` stays the round-1 target of both lineages forever.
- **`ACT-029` authored neither verdict, weakened neither, and merged neither.** It transcribed both from their own report artifacts read at their own source commits through Git object access, preserved every finding ID, severity, owner, evidence pointer, required change, and blocking semantic, resolved and dispositioned nothing, and **accepted no risk of any kind — which is not this role's authority in any case.**
- **The QA gate is unchanged and did not run.** `LIN-RELEASE-EXECUTOR-QA` round 1 has **no verdict**; TASK-055 was dispatched once and its assigned `gemini` CLI exited without authentication before reading or changing anything, producing no report, commit, verdict, or tracked change. **That is not QA evidence, it satisfies and closes no gate, and it is not an ingress fact of any class** — it is recorded as an operational observation on TASK-055 and nowhere else. TASK-055 stays `ready` and its verdict is still owed on this exact target.
- **PULL REQUEST 30 IS OPEN AND MUST NOT BE MERGED — and the reason is now stronger than at `ACT-028`.** At `ACT-028` both pre-merge gates were open with no verdict; at `ACT-029` both have been judged and **both required changes**, and seven blocking security findings stand unresolved and unaccepted. **`ACT-029` merged nothing, requested no merge, simulated none, and modified, closed, reopened, commented on, and approved no pull request.**
- Next owner: **three, in separate execution contexts, and none of them this owner.** **TASK-056** `devops` / `claude` remediates all sixteen findings under `scripts/release/integration-merge/**` with the `release-merge-executor` lock, branching from **this record's own published head `9fb2eb0c`** so the remediation is one true-ancestry cumulative unit; **TASK-057** `reviewer` / `gpt` records `LIN-RELEASE-EXECUTOR-REVIEW` round 2 over `(TASK-056, review, r1)` and `(TASK-049, review, r2)`; and **TASK-058** `security` / `gpt` records `LIN-RELEASE-EXECUTOR-SECURITY` round 2 over `(TASK-056, security, r1)` and `(TASK-049, security, r2)`. **TASK-055** is unchanged and still owes round 1 on this target. The superseded `ACT-028` statement read: **Next owner: three, in separate execution contexts, and none of them this owner.** **TASK-053** `reviewer` / `gpt` for `LIN-RELEASE-EXECUTOR-REVIEW` round 1, **TASK-054** `security` / `gpt` for `LIN-RELEASE-EXECUTOR-SECURITY` round 1, and **TASK-055** `qa` / `gemini` for `LIN-RELEASE-EXECUTOR-QA` round 1 — each `ready` at `ACT-028`, each bound to target `9fb2eb0ca7c02101fd067452824e2612fda5cc0c` over base `d63864bcb25fc8897b21c09f8f687e390f85808d`, each owning one disjoint report path, none holding a resource lock, and each forbidden from running in this owner's context or in either sibling gate's. The superseded `ACT-027` statement read: **Next owner: `devops` / `claude` for this task**, `ready` and dispatchable — which that owner has now completed.
- **Two more verdicts recorded at `ACT-031`, on ingress entries `seq` 42 and `seq` 43, both `changes-required`, and this record still does not move.** **TASK-058** recorded `LIN-RELEASE-EXECUTOR-SECURITY` round 2 at **`0a44bb0f6a1405bf49fa536d1149f122f52e4bbb`**, pull request 34, and **TASK-057** recorded `LIN-RELEASE-EXECUTOR-REVIEW` round 2 at **`df3dafa5203ad02ebba89419c77b6a44efafd91a`**, pull request 35. **Each applied ONE verdict atomically to TWO relations — TASK-056's round 1 and this record's round 2 — so four durable gate-verdict facts now exist and ALL FOUR RELATIONS STAY OPEN.** This record stays in `review`, stays `integrable: false`, and its own artifact `9fb2eb0c` is untouched.
- **Nine of the sixteen findings are RESOLVED and this record's gates are no closer to closing.** TASK-057 resolved F-053-01, F-053-02, F-053-03, F-053-05, F-053-07, and F-053-08; TASK-058 resolved F-054-04, F-054-05, and F-054-06 — **the first findings ever to leave this graph's blocking set.** Seven are `partially resolved` with residues assigned to eight fresh findings, three of which are **Critical**. **The blocking security count is seven again with different membership, and none is accepted.** `ACT-031` recorded no acceptance, sought none, and has no authority to record one.
- **`ACT-031` authored neither verdict and weakened neither.** It transcribed both from their own report artifacts read at their own source commits through Git object access, preserved every finding ID, severity, owner, evidence pointer, required change, residue assignment, and blocking semantic, dispositioned nothing itself, and collapsed no cross-lens pair — because neither gate owner declared any pair an inherited view of the other, and in the NUL-byte case the two rounds reached genuinely different findings from the same bytes.
- **PULL REQUEST 30 IS NOW CLOSED UNMERGED, and that is a state change rather than a discharge.** The user-authorized control session closed it at `2026-08-08T08:45:59Z` with `mergedAt` `null`, along with seven others, **preserving every source branch and exact commit** — verified independently at `ACT-031` rather than accepted. This record's gates are still open, its branch is still unintegrated, and its content is still not in `main` or in `integration/autonomous-runtime`. **The prohibition it carried is moot for pull request 30 and fully in force for pull request 33**, which would land this record's content by ancestry and whose own two gates now both record `changes-required`. **A pull-request state change is not an ingress fact of any class**, so nothing was appended and `ingress_seq` is unaffected; see `publication_correction` above and the `ACT-031` section of the activation log.
- Next owner: **TASK-059**, `devops` / `claude`, `ready` and dispatchable, remediating all eight fresh findings under `scripts/release/integration-merge/**` with the `release-merge-executor` lock, branching from `agent/claude/devops/task-056` — so the second remediation also reaches this record's artifact by **true ancestry**. **TASK-060** (`reviewer` / `gpt`) and **TASK-061** (`security` / `gpt`) are created `blocked` on `review_ready(TASK-059)`, each carrying **three** relations applied atomically, including this record's round 3, against the unchanged review base `d63864bc`. **No QA successor was created and TASK-055's round is not retargeted.**
- **ACT-032 publication routing.** TASK-059 published at `126f2fa9939b8ac6db4764241952dafbda50e9f4`; TASK-060 and TASK-061 are now separately `ready`, each over the immutable review base `d63864bcb25fc8897b21c09f8f687e390f85808d`, and each still carries this record's round-3 relation inside its own atomic three-relation cohort. This record remains in `review`, `integrable: false`, with every historical verdict and disposition unchanged. Pull requests 37 and 33 remain unmerged, and TASK-055 remains pinned to the older QA target `9fb2eb0ca7c02101fd067452824e2612fda5cc0c`.
- Next owners: **TASK-060** (`reviewer` / `gpt`) and **TASK-061** (`security` / `gpt`) in distinct execution contexts. Neither gate can satisfy the other, neither may reuse TASK-059's author context, and neither may merge or approve a pull request.
- **ACT-033 gate routing.** TASK-060 recorded `approved` with no findings and closed this record's Review round-3 relation. TASK-061 recorded `changes-required` and left this record's Security round-3 relation open. Its fresh Critical findings F-061-01 through F-061-03 are DevOps-owned, open, and unaccepted; they route together to TASK-062, followed by independent Security round 4 at TASK-063, which carries this record at round 4. This record remains `review` and `integrable: false`; QA round 1 remains unchanged.
- Next owners: **TASK-062** (`devops` / `claude`) for the one-module remediation and then **TASK-063** (`security` / `gpt`) in a separate execution context. Review remains closed and is not rerun. PR 37 and PR 33 remain open, unmerged, and forbidden while Security remains open.
- **ACT-035 publication routing.** TASK-062 published exact target `19e75e996e8e116f74b4f8feb363ef13438a42b9`; TASK-063 is now `ready` and carries this record's pending Security round-4 relation. No verdict or finding disposition changed. This record remains `review` and `integrable: false`; PRs 44, 37, and 33 remain open, unmerged, and forbidden.
- Next owner: **TASK-063**, `security` / `gpt`, in a separate execution context over the immutable four-member cohort. TASK-055 remains separately bound to the older QA target.
