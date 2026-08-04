# Multi-Agent Engineering Framework

> A provider-neutral repository scaffold for coordinating specialized AI agents through explicit ownership, handoffs, independent reviews, and quality gates.

## Overview

This repository defines an engineering operating model in which multiple LLM agents can work on the same project without sharing ambiguous responsibility. Each role owns a narrow part of delivery, communicates through versioned artifacts, and hands work to an independent reviewer before release.

This is an organizational framework and project scaffold, not a ready-to-run multi-agent runtime. Most configuration, workflow, role, and report files are intentionally empty placeholders and must be completed for the target project before automation is enabled.

For a description of every directory, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## Core principles

- One active owner is accountable for each task.
- An agent never approves or reviews its own work.
- Canonical role definitions live under `.agents/`; provider-specific files only adapt them.
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

1. Clone the repository and create a project branch.

   ```bash
   git clone https://github.com/Fhurky/Multi-Agent-Engineering-Framework.git
   cd Multi-Agent-Engineering-Framework
   git switch -c develop
   ```

2. Complete the shared coordination files under `.agents/`, then define each enabled role's four contract files.
3. Define the initial scope in `ROADMAP.md`, `ARCHITECTURE.md`, and the relevant files under `specs/`.
4. Create work from `templates/task.md`, place it in `tasks/backlog/`, and promote it only when its dependencies and acceptance criteria are clear.
5. Configure only the LLM adapters required by the project under `.claude/`, `.codex/`, or `.cursor/`.
6. Replace empty CI, security, container, and tooling placeholders with valid project-specific configuration before enabling automation.

## Sources of truth

| Concern | Canonical location |
|---|---|
| Agent responsibilities and constraints | `.agents/<role>/` |
| Cross-agent routing and handoffs | `.agents/ROUTING.md`, `.agents/HANDOFF.md` |
| Provider-specific adapters | `.claude/`, `.codex/`, `.cursor/` |
| Product and technical requirements | `specs/` |
| Plans and release scope | `plans/` |
| Current task state and ownership | `tasks/` |
| Production implementation | `src/` |
| Review and validation evidence | `reports/` |
| Durable technical documentation | `docs/` |

Provider-specific instructions may extend the canonical role contract but must not silently contradict it. When two instructions conflict, resolve and document the decision instead of maintaining divergent copies.

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
|   `-- docs/
|-- .claude/                 # Claude adapters
|-- .codex/                  # Codex adapters and skills
|-- .cursor/                 # Cursor rules
|-- .github/                 # Issues, reviews, ownership, workflows
|-- config/                  # Non-secret runtime configuration
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
- `develop`
- `feature/*`
- `bugfix/*`
- `hotfix/*`
- `release/*`

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

## Tooling placeholders

The repository includes empty placeholders for future project-specific configuration, including GitHub workflows, `Dockerfile`, `docker-compose.yml`, `.gitleaks.toml`, `.markdownlint.json`, `.pre-commit-config.yaml`, `.semgrepignore`, and `.mcp.example.json`.

- Do not enable an empty workflow or scanner configuration.
- Never place tokens or credentials in `.mcp.example.json`, tracked environment files, reports, or test data.
- Populate `.env.example` with variable names and safe examples only.
- Choose tools that match the target technology instead of enabling every placeholder by default.

## Scope and licensing

This framework is intentionally technology-agnostic and can be adapted to web, mobile, AI, backend, desktop, and embedded projects. No license has been selected yet; add an appropriate `LICENSE` before distributing or accepting external contributions.
