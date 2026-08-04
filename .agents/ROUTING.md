# Routing Rules

The Orchestrator routes each task to exactly one role and records the role, LLM family, branch, worktree, write scope, dependencies, and required gates in the task record.

## Routing table

| Work type | Owner |
|---|---|
| Scope, priority, roadmap, backlog | manager |
| Architecture, boundaries, ADRs | architect |
| Task decomposition, dependencies, handoffs | orchestrator |
| APIs and server-side logic | backend |
| User interface and client behavior | frontend |
| Schema, migrations, and data integrity | database |
| Independent code findings | reviewer |
| Security requirements and findings | security |
| Integration, E2E, and acceptance validation | qa |
| Benchmarks and performance findings | performance |
| CI, delivery, deployment, rollback | devops |
| Durable user, API, operations, and release docs | docs |

Requests spanning roles must become separate task records. No agent may expand its role, edit another owner's artifact, combine author and reviewer duties, or continue when its assignment is null or mismatched.
