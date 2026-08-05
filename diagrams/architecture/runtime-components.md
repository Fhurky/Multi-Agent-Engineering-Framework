# Runtime Component Diagram

Source diagram for the autonomous runtime component decomposition. Produced under TASK-002, amended under TASK-016.

- Specification: [COMPONENT-BOUNDARIES.md](../../docs/architecture/runtime/COMPONENT-BOUNDARIES.md)
- Decisions: [ADR-0002](../../docs/adr/0002-runtime-component-boundaries-and-module-ownership.md), superseded in part by [ADR-0011](../../docs/adr/0011-agent-workspace-lifecycle-module.md); [ADR-0014](../../docs/adr/0014-live-run-control-and-process-tree-ownership.md)

Amended by TASK-016: the seventh module `workspace/` is added with TASK-017 as its owner; the control inbox is added as the live-run control transport owned by TASK-007; the owned process tree is added under TASK-004.

Each box names its owning task. No module has two owners. Arrows are permitted import or call directions; any edge not shown is a boundary violation.

```mermaid
flowchart TB
  operator([Operator])

  subgraph edge["Edge — TASK-007"]
    cli["bin/ CLI entry point"]
    lifecycle["lifecycle/<br/>bootstrap, live-run control,<br/>drain, pause, resume,<br/>signals, exit codes"]
  end

  subgraph core["Core"]
    supervisor["supervisor/ — TASK-006<br/>transition function, run loop,<br/>result aggregation, completion,<br/>control-request consumption"]
    scheduling["scheduling/ — TASK-005<br/>typed edges, gates, graph validation,<br/>limits, scope and resource-lock exclusion,<br/>activation, leases, fencing tokens"]
    recovery["recovery/ — TASK-008<br/>single-decision reconciliation,<br/>orphan fencing, watchdog,<br/>retry policy, effect ledger rules"]
  end

  subgraph ws["Workspace — TASK-017"]
    workspace["workspace/<br/>prepare, finalize, abandon, reconcile<br/>hooks, worktree, branch, lock,<br/>scope validation, publication, PR"]
  end

  subgraph durable["Durability — TASK-003"]
    store["state/<br/>journal with batch commit records,<br/>checkpoints, CAS append,<br/>restore, writer lock"]
    scontracts["state/contracts/<br/>records, states, events, journal lines,<br/>typed edges, gates, activation,<br/>StateStore, Scheduler, Retry, Recovery,<br/>RunController, ControlChannel,<br/>WorkspaceLifecycle"]
  end

  subgraph provider["Providers — TASK-004"]
    worker["agents/<br/>AgentWorker, adapter registry,<br/>invocation assembly, classification,<br/>process-tree ownership"]
    acontracts["agents/contracts/<br/>ProviderAdapter, AdapterOutcome,<br/>FailureClass, WorkerResult,<br/>ProcessTreeController"]
    claude["claude adapter"]
    gpt["gpt adapter"]
    gemini["gemini adapter"]
    tree[["Owned process tree<br/>Windows job object /<br/>POSIX process group"]]
  end

  runDir[("Run directory<br/>journal.ndjson, checkpoints/,<br/>control/, writer.lock,<br/>tasks/, artifacts/")]
  repo[("Repository<br/>worktrees, agent branches,<br/>task locks, remote, pull requests")]
  scripts[/"scripts/orchestration/*.ps1<br/>scripts/setup/install-git-hooks.ps1<br/>human-controlled, invoked never edited"/]

  operator --> cli
  operator -. "pause / stop request" .-> runDir
  cli --> lifecycle
  lifecycle --> supervisor
  lifecycle -- "control inbox" --> runDir
  supervisor --> scheduling
  supervisor --> workspace
  supervisor --> worker
  supervisor --> store
  recovery --> supervisor
  recovery --> workspace
  recovery --> store
  store --> runDir
  workspace --> scripts
  scripts --> repo

  worker --> claude
  worker --> gpt
  worker --> gemini
  worker --> tree
  lifecycle -- "drain: cancel tree" --> tree
  recovery -- "recover: fence or terminate" --> tree

  scheduling -.imports.-> scontracts
  supervisor -.imports.-> scontracts
  lifecycle -.imports.-> scontracts
  recovery -.imports.-> scontracts
  store -.imports.-> scontracts
  workspace -.imports.-> scontracts
  supervisor -.imports.-> acontracts
  scheduling -.imports.-> acontracts
  lifecycle -.imports.-> acontracts
  recovery -.imports.-> acontracts
  worker -.imports.-> acontracts
```

## Ownership legend

| Colour-free label | Owner task | Write scope |
|---|---|---|
| `state/`, `state/contracts/` | TASK-003 | `src/orchestrator/state/**` |
| `agents/`, `agents/contracts/`, adapters, process trees | TASK-004 | `src/agents/**` |
| `scheduling/` | TASK-005 | `src/orchestrator/scheduling/**` |
| `supervisor/` | TASK-006 | `src/orchestrator/supervisor/**` |
| `lifecycle/`, `bin/`, control inbox | TASK-007 | `src/orchestrator/lifecycle/**`, `bin/**` |
| `recovery/` | TASK-008 | `src/orchestrator/recovery/**` |
| `workspace/` | TASK-017 | `src/orchestrator/workspace/**` |

`scripts/orchestration/**` and `scripts/setup/install-git-hooks.ps1` are human-controlled and appear here as an invoked boundary. No module's write scope includes them.

## Invariants visible in this diagram

1. Only `supervisor` and `store` write durable state. `scheduling`, `recovery`, and `workspace` produce event envelopes and hand them to the supervisor's append path.
2. Nothing in `src/orchestrator/**` reaches a provider adapter. The only path is `supervisor -> worker -> adapter`.
3. Both contract roots are sinks. Neither imports the other, which is what makes TASK-003 and TASK-004 genuinely parallel.
4. `lifecycle` touches `supervisor`, the control inbox, and the two contract roots. It contains no scheduling, provider, retry, or workspace logic.
5. `workspace` is the only module that reaches the repository, and it reaches it only through the human-controlled scripts. It imports one contract root and no module.
6. `lifecycle` and `recovery` reach the process tree only through `ProcessTreeController`. TASK-004 owns the mechanism; neither of them holds an implementation.
7. Every arrow points from a higher level to a lower one — contract roots at level 0; `state`, `agents`, and `workspace` at level 1; `scheduling` at 2; `supervisor` at 3; `lifecycle` and `recovery` at 4 — so the module graph is acyclic.
