# Multi-Agent Engineering Framework

> A provider-neutral repository scaffold for coordinating specialized AI agents through explicit ownership, handoffs, independent reviews, and quality gates.

## Overview

This repository defines an engineering operating model in which multiple LLM agents can work on the same project without sharing ambiguous responsibility. Each role owns a narrow part of delivery, communicates through versioned artifacts, and hands work to an independent reviewer before release.

This is an organizational framework and project scaffold, not an LLM runtime. It includes operational worktree isolation, atomic task locks, role write scopes, agent contracts, and repository validation; application code and technology-specific delivery configuration remain project-specific placeholders.

For a description of every directory, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## Core principles

- One active owner is accountable for each task.
- An agent never approves or reviews its own work.
- Canonical role definitions live under `.agents/`; provider-specific files only adapt them.
- User-visible interface text is Turkish; code, identifiers, filenames, configuration, tests, documentation, and engineering artifacts are English.
- Architecture, security, QA, performance, documentation, and release decisions produce traceable evidence.
- High or critical security findings block delivery until they are resolved or formally accepted.
- CI and required quality gates must pass before merge or release.
- Secrets, credentials, and sensitive production data are never stored in tracked project files.

## Roles

| Role | Owns | Does not own |
|---|---|---|
| Project Manager | Roadmap, backlog, priorities, task ownership | Production implementation |
| Solution Architect | Architecture, boundaries, standards, ADRs | Feature implementation |
| Orchestrator | Routing, dependencies, parallel work, handoffs | Domain decisions or self-approval |
| Backend Engineer | APIs, services, server-side business logic | Frontend implementation |
| Frontend Engineer | UI, accessibility, client-side behavior | Backend business logic |
| Database Engineer | Data models, migrations, integrity | API behavior |
| Independent Reviewer | Correctness, maintainability, standards compliance | Authoring the reviewed change |
| Security Engineer | Threat modeling, SAST, secrets, risk assessment | Product features |
| QA Engineer | Test strategy, acceptance validation, defect discovery | Architecture ownership |
| Performance Engineer | Profiling, benchmarks, optimization evidence | Feature prioritization |
| DevOps Engineer | CI/CD, containers, environments, deployment | Application business rules |
| Documentation Engineer | User, API, operations, and release documentation | Production implementation |

## Delivery workflow

The Orchestrator coordinates routing and handoffs throughout the workflow; it does not replace the accountable role at any stage.

```text
Idea
  |
  v
Project Manager
  |
  v
Solution Architect
  |
  v
Orchestrator assigns independent work
  |
  +--> Backend Engineer
  +--> Frontend Engineer
  +--> Database Engineer
  |
  v
Independent Code Review
  |
  v
Security Review
  |
  v
QA Validation
  |
  v
Performance Review
  |
  v
Documentation
  |
  v
DevOps / Release
```

## Getting started

1. Clone the repository.

   ```bash
   git clone https://github.com/Fhurky/Multi-Agent-Engineering-Framework.git
   cd Multi-Agent-Engineering-Framework
   ```

2. Assign a title and a simple LLM family name, such as `claude`, `gpt`, or `gemini`, to each enabled role in `config/agents/settings.yaml`.
3. Define the initial scope in `ROADMAP.md`, `ARCHITECTURE.md`, and the relevant files under `specs/`.
4. Create work from `templates/task.md`, place it in `tasks/backlog/`, and promote it only when dependencies and acceptance criteria are clear.
5. Use the isolated worktree workflow below for every agent task.
6. Replace application, container, scanner, and deployment placeholders only with technology-appropriate configuration.

## Concurrent CLI quick start

Run these commands from PowerShell. The primary clone coordinates work but is not an agent editing directory.

```powershell
# Create a Claude backend task worktree.
./scripts/orchestration/create-worktree.ps1 -TaskId TASK-123 -Role backend -Llm claude

# Move to the worktree path printed by the command, then claim the task.
./scripts/orchestration/claim-task.ps1 -TaskId TASK-123 -Role backend -Llm claude

# Start Claude from this worktree.
claude
```

Create a different task and worktree for Codex, then launch `codex` inside that returned path. The two agents may run simultaneously only when their task write scopes do not overlap.

Before either agent hands off:

```powershell
./scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree
./scripts/orchestration/release-task.ps1 -TaskId TASK-123 -Role backend -Llm claude
```

The lock is shared across all worktrees through Git's common directory. A second session cannot claim the same task, and CI rejects an agent branch that changes files outside its assigned role scope.

## Sources of truth

| Concern | Canonical location |
|---|---|
| Project-wide agent governance | `AGENTS.md` |
| LLM family and title assignments | `config/agents/settings.yaml` |
| Agent responsibilities and constraints | `.agents/<role>/` |
| Cross-agent routing and handoffs | `.agents/ROUTING.md`, `.agents/HANDOFF.md` |
| Tool-specific adapters | `CLAUDE.md`, `.claude/`, `.codex/`, `.cursor/`, `.agents/rules/` |
| Product and technical requirements | `specs/` |
| Plans and release scope | `plans/` |
| Current task state and ownership | `tasks/` |
| Production implementation | `src/` |
| Review and validation evidence | `reports/` |
| Durable technical documentation | `docs/` |

Provider-specific instructions may extend the canonical role contract but must not silently contradict it. When two instructions conflict, resolve and document the decision instead of maintaining divergent copies.

## LLM assignment settings

Users assign a simple LLM family name and display title in `config/agents/settings.yaml`. The file includes every canonical role and deliberately leaves `llm` null for project-specific selection; any model in the named family may claim the assignment.

```yaml
assignments:
  backend:
    title: Backend Engineer
    role_path: .agents/backend
    enabled: true
    llm: claude
    task_queue: tasks/ready
```

- The assignment key, such as `backend`, is the canonical role ID and determines the responsibility boundary.
- `title` may be changed by the user without changing the role's authority.
- `llm` uses one lowercase family name such as `claude`, `gpt`, or `gemini`; null means the role is unassigned and must not execute.
- When one LLM name is assigned to multiple roles, the active task must explicitly select one role.
- An author and independent reviewer must run in separate execution contexts. Prefer a different LLM name for the reviewer when available.
- Secrets and API credentials belong in environment variables or a secret manager, never in this file.

## Task lifecycle

```text
backlog --> ready --> in-progress --> review --> done
                         |
                         +--> blocked --> ready
```

Every task record should identify:

- A unique task ID and one active owner.
- Scope, dependencies, and acceptance criteria.
- The working branch and relevant artifacts.
- Required review and quality gates.
- Handoff notes and links to the final commit or pull request.

## Repository structure

```text
project/
|-- .agents/                 # Canonical agent contracts
|   |-- manager/
|   |-- architect/
|   |-- orchestrator/
|   |-- reviewer/
|   |-- backend/
|   |-- frontend/
|   |-- database/
|   |-- security/
|   |-- qa/
|   |-- performance/
|   |-- devops/
|   |-- docs/
|   `-- rules/                 # Google Antigravity workspace rules
|-- .claude/                 # Claude adapters
|-- .codex/                  # Codex adapters and skills
|-- .cursor/                 # Cursor rules
|-- .github/                 # Issues, reviews, ownership, workflows
|-- config/                  # LLM assignments and non-secret runtime configuration
|-- console/                 # Management console client and server
|-- docs/                    # Durable project documentation
|-- plans/                   # Backlog, sprint, and release plans
|-- prompts/                 # Reusable task and review prompts
|-- reports/                 # Review and release evidence
|-- schema/                  # Migrations and seed definitions
|-- scripts/                 # Setup, CI, quality, security, deploy
|-- specs/                   # Feature, API, database, security, test specs
|-- src/                     # Production implementation
|-- tasks/                   # State-based work records
|-- templates/               # Reusable process templates
`-- tests/                   # Unit, integration, and end-to-end tests
```

The condensed tree above shows responsibility boundaries rather than every directory. See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for the complete directory guide.

## Agent contract

Every role under `.agents/` contains the same four files:

| File | Required content |
|---|---|
| `ROLE.md` | Mission, owned decisions, non-goals, and collaboration boundaries |
| `SYSTEM_PROMPT.md` | Operational instructions, constraints, escalation rules, and required behavior |
| `CHECKLIST.md` | Preconditions, execution checks, review gates, and definition of done |
| `OUTPUT_TEMPLATE.md` | The structure and evidence required in the agent's final handoff |

To add a role:

1. Create `.agents/<role>/` with all four contract files.
2. Give the role one clear responsibility that does not overlap an existing owner.
3. Define who reviews its output and which quality gates apply.
4. Update routing, handoff, communication, and definition-of-done documents.
5. Add a provider adapter only when that provider requires one.

## Standard deliverables

| Deliverable | Primary owner |
|---|---|
| `ROADMAP.md` | Project Manager |
| `SPRINT.md` | Project Manager |
| `ARCHITECTURE.md` | Solution Architect |
| `REVIEW.md` | Independent Reviewer |
| `SECURITY_REPORT.md` | Security Engineer |
| `PERFORMANCE_REPORT.md` | Performance Engineer |
| `BUG_REPORT.md` | QA Engineer |
| `RELEASE_NOTES.md` | Documentation Engineer with DevOps input |

Root-level deliverables provide the current summary. Detailed and historical evidence belongs in the matching subdirectory under `reports/`, `plans/`, or `docs/`.

## Quality gates and definition of done

Recommended review order:

1. Independent code review.
2. Security review.
3. QA validation.
4. Performance review when relevant.
5. Documentation review.
6. Release readiness and CI verification.

A task is done only when:

- Its acceptance criteria are satisfied.
- Required tests and CI checks pass.
- No unresolved blocking review or security findings remain.
- Architecture and documentation changes are recorded.
- Reports and handoff evidence link to the implemented change.
- The appropriate reviewer, not the author, records approval.

## Agent communication

Agents communicate through durable, reviewable artifacts:

- Git commits and branches.
- Pull requests and review comments.
- Task records and handoff documents.
- Markdown reports and Architecture Decision Records.
- The issue tracker.

Agents must not resolve ownership conflicts by editing another role's responsibility in isolation. Changes to responsibility boundaries require an explicit architectural or governance decision.

## Git workflow

Suggested branches:

- `main`
- `agent/<llm>/<role>/<task-id>`
- `release/*` for human-controlled release integration when needed

Suggested commit prefixes:

- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `test:`
- `perf:`
- `chore:`
- `security:`

Teams may simplify the branch model, but protected branches must retain independent review and required status checks.

## Agent tool adapters

- **Codex-compatible agents:** use root `AGENTS.md` as the canonical project instruction file.
- **Claude Code:** uses `CLAUDE.md`, which imports `AGENTS.md`, the LLM assignments, and project documentation.
- **Google Antigravity:** uses `.agents/rules/project-governance.md` as a workspace rule. Configure it as **Always On** in Antigravity so it loads the canonical governance and assignment files for every task.

Tool adapters must reference shared governance instead of maintaining divergent copies. An LLM name assignment selects who performs a role; it never changes what that role is allowed to do.

## Tooling placeholders

The repository includes active baseline GitHub workflows and project-specific placeholders such as `Dockerfile`, `docker-compose.yml`, `.gitleaks.toml`, `.markdownlint.json`, `.pre-commit-config.yaml`, `.semgrepignore`, and `.mcp.example.json`.

- Keep the baseline CI and security workflows active; extend them with technology-specific tests and scanners.
- Do not enable an empty scanner configuration.
- Never place tokens or credentials in `.mcp.example.json`, tracked environment files, reports, or test data.
- Populate `.env.example` with variable names and safe examples only.
- Choose tools that match the target technology instead of enabling every placeholder by default.

## Scope and licensing

This framework is intentionally technology-agnostic and can be adapted to web, mobile, AI, backend, desktop, and embedded projects. No license has been selected yet; add an appropriate `LICENSE` before distributing or accepting external contributions.
