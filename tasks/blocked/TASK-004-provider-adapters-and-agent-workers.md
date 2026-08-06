---
task_id: TASK-004
title: Implement provider adapters and agent worker execution
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-004
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-004
write_scope:
  - src/agents/**
  - tests/unit/agents/**
dependencies:
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 8
  - task: TASK-018
    edge: integrated
required_gates:
  - review
  - security
  - qa
pre_merge_gates: []
gate_tasks:
  - task: TASK-009
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
  - task: TASK-010
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
  - task: TASK-011
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
parent_task: TASK-001
publication_class: runtime
normative_architecture_source: 9576fc9 as amended by 8d0c570, by c2ee3eb, by fe0374c, by 468b37b, by 6d145eb, by 970b081, and by the TASK-038 commit that TASK-039 approves. None of 9576fc9, 8d0c570, c2ee3eb, fe0374c, 468b37b, 6d145eb, and 970b081 is approved — LIN-ARCH-REVIEW recorded changes-required at rounds 1, 2, 3, 4, 5, 6, and 7, the round-7 verdict at 9bb75d9 — so each is a superseded authoring baseline to amend and never an approved source to build on. No approved architecture source exists yet: one comes into being only when LIN-ARCH-REVIEW records a passing or formally accepted authoritative verdict at lineage_round 8 or later, which TASK-039 owns. A record that cites any of the seven as approved is a finding, and a record that attributes an approval to a round that recorded changes-required is a finding.
blocked_reason: TASK-015 returned changes-required on the base architecture and TASK-020 returned changes-required on the first amendment, so the adapter interface is not approved and finding A-003 adds a process-tree ownership contract this task implements. No toolchain is integrated to compile or test against. LIN-ARCH-REVIEW has since recorded changes-required at round 5 on the TASK-032 amendment 468b37b at 3660cc2, at round 6 on the TASK-034 amendment 6d145eb at afed101, and at round 7 on the TASK-036 amendment 970b081 at 9bb75d9, so the authoritative round is 7 and it failed. Round 7 resolved A-501 through A-505, satisfied every inherited obligation, and met every declared acceptance criterion, and still blocked on one fresh High finding A-601 - the normative integration order replays a non-ancestral rejected predecessor immediately after the cumulative target and conflicts in 19 files. The remediation is TASK-038 and the revalidation is TASK-039 at round 8. This task is exactly as far from dispatch as it was before round 7.
exit_condition: The LIN-ARCH-REVIEW lineage records a passing or formally accepted authoritative verdict at lineage round 8 or higher, and TASK-018 is integrated into integration/autonomous-runtime with a compiling toolchain.
review_target_base: not applicable until this task publishes
review_target_applicability: not applicable yet. This task is gated but no artifact of it exists, so no round is pinned and there is no delta to diff. It becomes applicable when this task reaches review_ready; the Orchestrator records review_target_commit and review_target_base then, at the activation that consumes the publication, from the branch as published.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime at or after the commit where this task's dependencies merged, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-004: Implement provider adapters and agent worker execution

## Objective

Implement the provider-neutral agent worker execution path and working, non-interactive adapters for every LLM family configured in `config/agents/settings.yaml`, so the supervisor can actually start a `claude`, `gpt`, or `gemini` agent without embedding provider-specific behavior anywhere else in the runtime.

## Required provider families

The runtime is not startable unless all three configured families work. Each is a first-class deliverable of this task, not an example.

| Family | Assigned to roles in `config/agents/settings.yaml` |
|---|---|
| `claude` | architect, orchestrator, runtime, backend, database, devops |
| `gpt` | manager, reviewer, frontend, security |
| `gemini` | qa, performance, docs |

An adapter is "working" only when it can discover its executable, construct a non-interactive invocation, run it as a child process in the assignment's worktree, be cancelled, parse the process result into an `AdapterOutcome`, and report a credential-free diagnostic when it cannot run.

## Scope

- Implement the `ProviderAdapter` interface, `AdapterRegistry`, `SecretProvider`, `AgentInvocation`, `AdapterOutcome`, `AdapterFailure`, `FailureClass`, `DISPOSITION_BY_CLASS`, and `WorkerResult` exactly as declared in `docs/architecture/runtime/INTERFACE-CONTRACTS.md` **as amended by the approved TASK-016 commit**.
- Implement the `claude`, `gpt`, and `gemini` adapters, each covering:
  - **Command discovery** — resolve the provider's command-line executable from an explicit configuration override first, then `PATH`, on Windows and POSIX, and report a specific, actionable failure when it is absent instead of a generic error.
  - **Invocation construction** — build a fully non-interactive child-process invocation from `AgentInvocation`: argument vector, working directory set to `invocation.worktreePath`, environment, prompt or input file, and an output mode the adapter can parse. No adapter may depend on a terminal, an interactive prompt, or a human keystroke.
  - **Cancellation and timeout** — honor the `AbortSignal` passed to `invoke`, terminate the child process tree, and return a `timeout` classification within `invocation.timeoutMs` plus a fixed tolerance.
  - **Result parsing** — map the child process exit code, standard output, and standard error into a `succeeded` outcome carrying artifact paths, summary, result digest, and proposed tasks, or into a `failed` outcome carrying exactly one `FailureClass`.
  - **Credential-free diagnostics** — a `diagnose()` capability that reports whether the executable was found, its resolved path, its reported version, and whether the required credential variable names are present, using only variable names and never a credential value.
- Implement the provider-neutral `AgentWorker` that resolves the adapter by family, assembles the invocation from the role contract paths and the task record path, starts the abort timer, calls `invoke`, and normalizes the outcome into a `WorkerResult` carrying `runId`, `taskId`, `attempt`, `idempotencyKey`, `fencingToken`, and start and finish timestamps.
- Implement the closed ten-member failure taxonomy from `docs/architecture/runtime/PROVIDER-ADAPTERS.md` and its single `DISPOSITION_BY_CLASS` mapping, including `agent_reported_blocked` for an agent that correctly refuses to cross a role boundary.
- Implement message redaction so no credential-shaped value and no value returned by `SecretProvider` reaches a message, log, event, or record.
- Read credentials only through `SecretProvider`, backed by environment variables or an injected secret manager.
- Provide unit tests that run offline, make no network call, and read no real credential.
- Exclude scheduling, concurrency limits, lease management, durable state writes, retry orchestration, workspace and worktree creation, and lifecycle commands.

## Acceptance criteria

### Provider coverage

- [ ] `claude`, `gpt`, and `gemini` adapters are each registered and resolvable by family name, and `AdapterRegistry.families()` returns all three.
- [ ] Each of the three adapters implements command discovery, non-interactive invocation construction, cancellation, result parsing, and `diagnose()`.
- [ ] An unregistered family resolves to `null` and the worker returns `invalid_request` with code `UNKNOWN_PROVIDER_FAMILY`.
- [ ] Adding a fourth provider requires only a new adapter registration; no file under `src/orchestrator/**` changes. The reviewer verifies this by inspecting imports.

### Command discovery

- [ ] For each family, discovery checks an explicit configuration override before `PATH`, and the resolution order is asserted by a test.
- [ ] Discovery works with a Windows executable extension and with a POSIX extensionless executable; both are asserted with a fake filesystem or a temporary directory.
- [ ] A missing executable produces `invalid_request` with a stable English code that names the family and the command that was searched for, and never the contents of `PATH` entries that could carry a user name.

### Invocation construction

- [ ] Each adapter produces an argument vector that runs the provider fully non-interactively, and a test asserts the constructed vector for a fixed `AgentInvocation` without executing the provider.
- [ ] The child process working directory equals `invocation.worktreePath`.
- [ ] No credential value appears in the argument vector; credentials are passed only through the environment or an injected secret manager.
- [ ] Invocation construction is deterministic: the same `AgentInvocation` produces the same argument vector.

### Cancellation and timeout

- [ ] With a fake child process that never exits, `AgentWorker.execute` returns a `timeout` outcome within `invocation.timeoutMs` plus a fixed tolerance, asserted with a fake clock.
- [ ] Aborting the signal terminates the spawned child process tree; a test asserts that no orphan process handle remains registered.
- [ ] An adapter that ignores the abort signal still yields a `timeout` classification, because the worker's own timer produces it.

### Result parsing and classification

- [ ] Every synthetic exit code, malformed output, and thrown value in a documented failure table maps to exactly one `FailureClass`; the table is exhaustive over the ten classes.
- [ ] An unmatched failure classifies as `unknown` with disposition `fail`, and a test asserts this default.
- [ ] A response carrying both a rate-limit signal and a 5xx status classifies as `rate_limited`.
- [ ] An agent output that reports a blocking dependency, ambiguous ownership, or a required human decision classifies as `agent_reported_blocked` with disposition `escalate`.
- [ ] A successful outcome carries artifact paths, summary, result digest, and proposed tasks, and a `WorkerResult` carries `runId`, `taskId`, `attempt`, `idempotencyKey`, and `fencingToken`.

### Credential-free diagnostics

- [ ] `diagnose()` for each family reports executable found or not found, resolved path, reported version when obtainable, and the presence or absence of each required credential variable by name only.
- [ ] A test round-trips every `diagnose()` result, every `AdapterFailure`, and every `WorkerResult` and asserts that no value returned by a stubbed `SecretProvider` appears in any of them.
- [ ] A missing credential produces `authentication` whose message names only the variable name.

### Test discipline

- [ ] Every unit test in this task runs offline: no network call, no real provider executable, and no real credential. Provider processes are exercised through an injected process-spawn interface with fakes and, where a real child process is needed, a local script fixture rather than a provider binary.
- [ ] A separate, non-default, opt-in smoke check may invoke a real provider `diagnose()`; it is skipped unless explicitly enabled and never runs in CI by default.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Contract root `src/agents/contracts/` transcribed from `docs/architecture/runtime/INTERFACE-CONTRACTS.md`.
- Worker, registry, redactor, and the three provider adapters under `src/agents/`.
- Unit tests under `tests/unit/agents/`, including the exhaustive classification table and the constructed-invocation assertions.

## Dependency notes

- `gate_passed(TASK-016, review)` supplies the adapter interface, the closed error taxonomy, the timeout layering, the credential rules, and the A-003 process-tree ownership contract from `docs/architecture/runtime/PROVIDER-ADAPTERS.md` and `docs/architecture/runtime/INTERFACE-CONTRACTS.md` at commit `9576fc9` **as amended by the TASK-016 commit that TASK-020 approves**. The rejected baseline alone is not the normative source; A-003 adds the process-tree ownership and termination contract this task implements.
- `integrated(TASK-018)` supplies the toolchain required by ADR-0001.
- May execute in parallel with TASK-003; their write scopes do not overlap and neither contract root imports the other.
- **Consumed by TASK-005, TASK-006, TASK-008, and TASK-011.** Those tasks now carry an explicit `integrated(TASK-004)` edge; none of them may start or claim to validate this task's behavior before it is published.

## Contract root ownership

This task owns the contract root `src/agents/contracts/`. The same contract change control applies as to TASK-003: transcribe `docs/architecture/runtime/INTERFACE-CONTRACTS.md` **as amended by the approved TASK-016 commit**, never amend it locally, and route a wrong contract through the Orchestrator to the architect.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope, so the owner of this task must not move or edit this file. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to unblock TASK-005 and to route the change into TASK-009, TASK-010, and TASK-011
</content>
