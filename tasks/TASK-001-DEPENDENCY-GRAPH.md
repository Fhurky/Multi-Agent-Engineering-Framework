# TASK-001 Dependency Graph

Durable handoff note produced by the Orchestrator under TASK-001. It records the dependency order, ownership, and write-scope partition of the autonomous multi-agent runtime task graph. Individual task records remain the authoritative source for scope and acceptance criteria.

## Ownership and dependency order

| Task | Title | Owner role | LLM | Depends on | Initial state |
|---|---|---|---|---|---|
| TASK-002 | Runtime architecture and ADRs | architect | claude | — | ready |
| TASK-003 | Durable run state and checkpoints | runtime | claude | TASK-002 | blocked |
| TASK-004 | Provider adapters and agent workers | runtime | claude | TASK-002 | blocked |
| TASK-005 | Scheduling, leases, fencing, bounded concurrency | runtime | claude | TASK-002, TASK-003 | blocked |
| TASK-006 | Supervisor core and state machine | runtime | claude | TASK-002, TASK-003, TASK-005 | blocked |
| TASK-007 | Lifecycle control and one-input bootstrap | runtime | claude | TASK-002, TASK-006 | blocked |
| TASK-008 | Crash recovery, timeouts, idempotent retries | runtime | claude | TASK-002, TASK-003, TASK-006 | blocked |
| TASK-009 | Independent code review | reviewer | gpt | TASK-003 … TASK-008 | blocked |
| TASK-010 | Security review | security | gpt | TASK-003 … TASK-008 | blocked |
| TASK-011 | QA validation | qa | gemini | TASK-007, TASK-008 | blocked |
| TASK-012 | Performance validation | performance | gemini | TASK-005, TASK-006, TASK-008, TASK-011 | blocked |
| TASK-013 | Remediation routing and gate closure | orchestrator | claude | TASK-009 … TASK-012 | blocked |

## Execution waves

```text
Wave 1  TASK-002                          architecture, no parallel peer
Wave 2  TASK-003 | TASK-004               parallel, disjoint write scopes
Wave 3  TASK-005                          needs durable state
Wave 4  TASK-006                          needs durable state and scheduler
Wave 5  TASK-007 | TASK-008               parallel, disjoint write scopes
Wave 6  TASK-009 | TASK-010 | TASK-011    parallel, separate execution contexts
Wave 7  TASK-012                          needs a passing QA baseline
Wave 8  TASK-013                          routes findings back to authors
```

## Write-scope partition

No two tasks in the graph share a write scope, so any two tasks whose dependencies are satisfied may run concurrently.

| Task | Write scope |
|---|---|
| TASK-002 | `docs/architecture/**`, `docs/adr/**`, `diagrams/architecture/**` |
| TASK-003 | `src/orchestrator/state/**`, `tests/unit/orchestrator/state/**` |
| TASK-004 | `src/agents/**`, `tests/unit/agents/**` |
| TASK-005 | `src/orchestrator/scheduling/**`, `tests/unit/orchestrator/scheduling/**` |
| TASK-006 | `src/orchestrator/supervisor/**`, `tests/unit/orchestrator/supervisor/**` |
| TASK-007 | `src/orchestrator/lifecycle/**`, `bin/**`, `tests/unit/orchestrator/lifecycle/**` |
| TASK-008 | `src/orchestrator/recovery/**`, `tests/unit/orchestrator/recovery/**` |
| TASK-009 | `reports/code-review/**` |
| TASK-010 | `reports/security/**`, `specs/security/**` |
| TASK-011 | `reports/qa/**`, `tests/integration/**`, `tests/e2e/**`, `tests/fixtures/**` |
| TASK-012 | `reports/performance/**`, `tests/performance/**` |
| TASK-013 | `tasks/**` |

Each task's scope is a subset of its role's configured write scope in `config/agents/settings.yaml`. TASK-013 shares `tasks/**` with TASK-001 and must not be claimed while another task holding `tasks/**` is active.

## Required behavior coverage

| Required behavior | Implemented by | Validated by |
|---|---|---|
| Start | TASK-007 | TASK-011 |
| Graceful drain | TASK-007 | TASK-011 |
| Checkpoint | TASK-003 | TASK-011, TASK-012 |
| Pause | TASK-007 | TASK-011 |
| Resume | TASK-003, TASK-007 | TASK-011 |
| Completion | TASK-006, TASK-007 | TASK-011 |
| Timeout | TASK-004, TASK-005, TASK-008 | TASK-011 |
| Crash recovery | TASK-008 | TASK-011, TASK-012 |
| Retry | TASK-004, TASK-008 | TASK-011 |
| Deterministic state transitions | TASK-006 | TASK-009, TASK-011 |
| Bounded concurrency | TASK-005 | TASK-011, TASK-012 |
| Leases and fencing tokens | TASK-005 | TASK-009, TASK-010 |
| Idempotent retries | TASK-008 | TASK-009, TASK-011 |
| Durable checkpoints | TASK-003 | TASK-010, TASK-011 |
| One-input project bootstrap | TASK-007 | TASK-011 |

## Findings return path

```text
TASK-009 / TASK-010 / TASK-011 / TASK-012
        |  finding names the responsible child task ID and owner role
        v
TASK-013 (orchestrator)
        |  creates one remediation task per responsible implementation owner
        v
TASK-003 … TASK-008 owner applies the fix
        |
        v
the originating validating role revalidates and the gate closes
```

Validating roles report and revalidate; they never implement the fix. High and critical security findings block delivery until they are resolved or formally accepted by an authorized human.

## Operational notes for each next owner

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId <id> -Role <role> -Llm <llm>`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1` before editing.
3. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree`.
4. Commit, push the agent branch, open a pull request, record the handoff in the task record, then run `scripts/orchestration/release-task.ps1`.
5. Move the task record to the matching lifecycle directory and update its `status` field in the same change.
