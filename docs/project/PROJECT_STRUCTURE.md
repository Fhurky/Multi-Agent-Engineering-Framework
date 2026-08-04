# Project Directory Guide

This document defines the responsibility boundaries of every directory in the project tree. Place new files in the most specific applicable directory, and avoid duplicating the same source of truth across agent or tool-specific directories.

For the canonical location of each major Markdown document, see [DOCUMENT_INDEX.md](DOCUMENT_INDEX.md).

## Agent organization

| Directory | Purpose |
|---|---|
| `.agents/` | Contains the canonical, technology- and provider-independent agent definitions. It is the primary source for roles, system prompts, checklists, and output templates. |
| `.agents/manager/` | Contains the Project Manager agent responsible for the roadmap, backlog, priorities, and task ownership. Production code is outside this role's responsibility. |
| `.agents/architect/` | Contains the Solution Architect agent responsible for architectural decisions, technical standards, and component boundaries. It establishes technical direction before feature implementation begins. |
| `.agents/orchestrator/` | Contains the coordination agent that routes work, tracks dependencies, and manages handoffs. It coordinates domain experts without taking ownership of their decisions. |
| `.agents/runtime/` | Contains the implementation agent responsible for runtime scheduling, worker lifecycle, provider adapters, execution leases, retries, and result aggregation. It implements approved orchestration architecture without owning task decomposition. |
| `.agents/reviewer/` | Contains the independent reviewer that evaluates work produced by other agents. It checks correctness, maintainability, and compliance with project standards. |
| `.agents/backend/` | Contains the Backend Engineer agent responsible for APIs, services, business rules, and server-side implementation. User interface work does not belong to this role. |
| `.agents/frontend/` | Contains the Frontend Engineer agent responsible for interfaces, accessibility, and client-side behavior. It does not own server-side business logic. |
| `.agents/database/` | Contains the Database Engineer agent responsible for data models, queries, migrations, and data integrity. It does not directly define API behavior. |
| `.agents/security/` | Contains the Security Engineer agent responsible for threat modeling, secret scanning, SAST, and security reviews. It may block delivery when high or critical findings remain unresolved. |
| `.agents/qa/` | Contains the QA Engineer agent responsible for test strategy, defect discovery, and acceptance validation. It does not own the production architecture. |
| `.agents/performance/` | Contains the Performance Engineer agent responsible for profiling, benchmarks, and bottleneck analysis. It evaluates optimizations using measurable evidence. |
| `.agents/devops/` | Contains the DevOps Engineer agent responsible for CI/CD, containers, environments, and deployment automation. It does not own application business rules. |
| `.agents/docs/` | Contains the Documentation Engineer agent responsible for usage, API, operations, and release documentation. It ensures that behavior and code changes are documented. |

## LLM and editor adapters

| Directory | Purpose |
|---|---|
| `.agents/rules/` | Contains Google Antigravity workspace rules using Antigravity's current project-level convention. These rules should reference the root governance and runtime settings instead of duplicating them. |
| `.claude/` | Contains Claude-specific project settings and adapters. Canonical role rules must remain under `.agents/`. |
| `.claude/agents/` | Contains provider-specific mappings that make the shared agent roles available to Claude. These definitions should extend shared contracts rather than duplicate them. |
| `.codex/` | Contains Codex-specific project settings, automation, and adapters. It must not become the source of truth for shared processes. |
| `.codex/skills/` | Contains reusable, project-specific Codex skill definitions. Each skill should have a narrow and explicit responsibility. |
| `.cursor/` | Contains project settings specific to the Cursor editor. These settings remain separate from application code and provider-independent rules. |
| `.cursor/rules/` | Contains file- or context-specific working rules for Cursor. The rules must not conflict with responsibilities defined under `.agents/`. |

## GitHub workflow

| Directory | Purpose |
|---|---|
| `.github/` | Collects GitHub contribution, review, ownership, and automation configuration. Repository-management files belong here. |
| `.github/CONTRIBUTING.md` | Defines contribution expectations in GitHub's automatically discovered community-health location. |
| `.github/SECURITY.md` | Defines vulnerability reporting and security policy in GitHub's automatically discovered location. |
| `.github/SUPPORT.md` | Explains supported help channels in GitHub's automatically discovered location. |
| `.github/ISSUE_TEMPLATE/` | Contains issue templates for consistent bug, feature, and task reports. These templates standardize the acceptance information needed by agents. |
| `.github/workflows/` | Contains GitHub Actions workflows for CI, security scanning, and releases. Each workflow must contain valid YAML and the required secrets before it is enabled. |
| `.githooks/` | Contains tracked local Git hooks that prevent agent sessions from pushing directly to protected integration branches. Each clone activates them through the setup script. |

## Application and runtime

| Directory | Purpose |
|---|---|
| `src/` | Is the root of deployable production code. Tests, reports, and temporary output should not be written here. |
| `src/agents/` | Contains runtime agent adapters, executors, and supporting implementation. Markdown role contracts remain under `.agents/`. |
| `src/backend/` | Contains API endpoints, services, server-side business logic, and backend integrations. Frontend components do not belong here. |
| `src/frontend/` | Contains interface components, pages, and client-side state management. It remains separate from server-specific code. |
| `src/orchestrator/` | Contains runtime coordination such as agent selection, work scheduling, parallel execution, retries, and result aggregation. It implements orchestration rather than role instructions. |
| `src/shared/` | Contains types, helpers, and contracts used by multiple application components. Only genuinely shared code should be placed here. |
| `console/` | Is the root of the management console used to observe and operate the agent system. It acts as an interface layer separate from the application's primary business logic. |
| `console/client/` | Contains the browser or desktop client for the management console. Server endpoints are not defined here. |
| `console/server/` | Contains the console API, real-time events, and management services. Its boundary with the primary application backend should remain explicit. |
| `bin/` | Contains command-line entry points and thin wrapper scripts. Complex logic should be delegated to the appropriate module under `src/` or `scripts/`. |

## Configuration and data

| Directory | Purpose |
|---|---|
| `config/` | Is the shared root for non-secret application and agent configuration. Sensitive values must be stored in environment variables or a secret manager. |
| `config/agents/` | Contains the user-editable LLM family name, title, permission, and routing settings for every role. Role prose and responsibility boundaries belong under `.agents/<role>/` instead. |
| `config/environments/` | Contains non-sensitive settings that vary between development, test, staging, and production. Shared defaults and environment overrides should remain distinct. |
| `data/` | Is the controlled root for sample, test, and development data. Production user data and secret-bearing output must never be committed here. |
| `data/fixtures/` | Contains deterministic seed data used to establish repeatable test conditions. Fixtures should remain small and free of personal data. |
| `data/samples/` | Contains example inputs used by documentation, demonstrations, and local experiments. It must not become a copy of production data. |
| `schema/` | Is the root for data contracts, database structure, and schema evolution. Its contents should be versioned and reviewed alongside application code. |
| `schema/migrations/` | Contains ordered migrations that apply database changes in a traceable way. Published migrations should not be rewritten retroactively. |
| `schema/seeds/` | Contains seed data for local development and test environments. Production secrets and sensitive data do not belong here. |
| `localization/` | Is the root for translation resources and localization configuration. It supports managing user-facing text across supported languages. |
| `localization/locales/` | Contains translation catalogs for each language or region. Translation keys should remain consistent across locales. |

## Planning, tasks, and handoffs

| Directory | Purpose |
|---|---|
| `plans/` | Stores the history of work plans, sprints, and release plans derived from the roadmap. It focuses on scope, sequence, and dependencies rather than implementation detail. |
| `plans/backlog/` | Contains plannable work groups that have not yet entered a sprint or release. Prioritization belongs to the Project Manager. |
| `plans/sprints/` | Contains current and historical sprint plans, goals, and capacity decisions. Each sprint should define a measurable outcome. |
| `plans/releases/` | Defines release scope, dependencies, risks, and publishing order. Each plan should link to its related release reports. |
| `tasks/` | Is the state-based root for atomic work records handed between agents. Each task must have one active owner and explicit acceptance criteria. |
| `tasks/backlog/` | Contains tasks that have not yet been prioritized or refined. They must satisfy the ready criteria before work begins. |
| `tasks/ready/` | Contains tasks with resolved dependencies and complete acceptance criteria. Work in this directory is ready to be assigned to an agent. |
| `tasks/in-progress/` | Contains tasks currently owned and executed by an agent. Each task should record its owner, branch, and current progress. |
| `tasks/review/` | Contains completed implementations awaiting independent review. An author may not approve their own work. |
| `tasks/blocked/` | Contains tasks that cannot progress because of an external dependency, decision, or technical obstacle. The reason and exit condition must be recorded. |
| `tasks/done/` | Archives tasks that have passed acceptance criteria, reviews, and required checks. The outcome and related commit or pull request should remain traceable. |
| `templates/` | Contains reusable Markdown templates for tasks, features, ADRs, handoffs, reviews, and releases. Templates prevent required process information from being omitted. |

## Prompts, checklists, and quality reports

| Directory | Purpose |
|---|---|
| `prompts/` | Is the root for provider-independent prompt fragments reused by specific work types. Persistent role definitions belong under `.agents/`. |
| `prompts/shared/` | Contains common instruction blocks used by multiple roles or tasks. It reduces prompt duplication and long-term drift. |
| `prompts/tasks/` | Contains prompt templates for work types such as analysis, implementation, migration, and bug fixing. These prompts must not expand role permissions. |
| `prompts/reviews/` | Contains evaluation prompts for code, security, QA, and performance reviews. It supports consistent finding formats across reviewers. |
| `checklist/` | Collects mandatory checks for setup, development, review, security, and release stages. Unlike role checklists, it standardizes process stages. |
| `reports/` | Is the root for historical and release-specific evidence produced by the review pipeline. Root-level summary deliverables may link to detailed reports stored here. |
| `reports/code-review/` | Contains independent code review findings and their resolution status. Each finding should include severity and a traceable code location. |
| `reports/security/` | Contains security scans, threat assessments, and risk acceptance records. Sensitive scanner output and secret values must not be committed. |
| `reports/qa/` | Contains test execution results, defect summaries, and acceptance evidence. Store durable summaries rather than large generated artifacts. |
| `reports/performance/` | Contains benchmarks, profiles, and optimization comparisons. Each result should record its environment, data set, and measurement method. |
| `reports/release/` | Contains release readiness, verification, rollback, and post-release observation results. Every report should identify a specific release. |

## Technical documentation and design

| Directory | Purpose |
|---|---|
| `docs/` | Is the primary root for durable user, developer, and operations documentation. It should reflect current system behavior and change alongside the code. |
| `docs/project/` | Contains repository-wide reference material such as the document index, directory guide, governance summary, and changelog. |
| `docs/releases/` | Contains durable release notes organized separately from operational release evidence under `reports/release/`. |
| `docs/adr/` | Contains Architecture Decision Records describing important decisions, alternatives, and rationale. Superseded decisions should be replaced by a new record rather than deleted. |
| `docs/api/` | Documents API contracts, examples, authentication, and error behavior. Generated reference material may be separated from human-oriented guides. |
| `docs/architecture/` | Contains the architecture summary and detailed documentation about components, data flows, boundaries, and technical principles. `docs/architecture/ARCHITECTURE.md` is its entry point. |
| `docs/guides/` | Contains step-by-step setup, development, and usage guides. Each guide should identify its audience and prerequisites. |
| `docs/runbooks/` | Contains operational, incident-response, rollback, and recovery procedures. Commands and verification steps should be explicit and actionable. |
| `diagrams/` | Is the root for diagrams that support written documentation, preferably in versionable source formats. Generated images should remain paired with editable sources. |
| `diagrams/architecture/` | Contains system-context, container, component, and deployment diagrams. Each diagram should link to the relevant ADR or architecture document. |
| `diagrams/workflows/` | Contains process diagrams for agent handoffs, task states, CI/CD, and review order. Diagrams must be updated when the underlying process changes. |
| `mockups/` | Contains early interface drafts for the application or management console. Mockups are not the sole source of truth for final product behavior. |
| `resources/` | Is the root for supporting material used in documentation, examples, and development. Licensing and source attribution must be preserved. |
| `resources/assets/` | Contains logos, icons, images, and other static design assets. It is a source library independent of the application's build-specific asset location. |
| `resources/references/` | Contains external standards, research notes, and references supporting project decisions. Prefer source links over copies of copyrighted material. |

## Specifications and tests

| Directory | Purpose |
|---|---|
| `specs/` | Is the root for specifications that define behavior, scope, and acceptance criteria before implementation. Documents should explain what must be built independently of solution code. |
| `specs/features/` | Contains user- or product-facing feature behavior and acceptance scenarios. Each feature should be traceable to tasks and tests. |
| `specs/api/` | Contains endpoint, request, response, error, and compatibility contracts. It provides a shared agreement between the backend and its consumers. |
| `specs/database/` | Contains data models, integrity rules, migration requirements, and retention policies. The Database Engineer should update it before schema changes. |
| `specs/security/` | Contains authentication, authorization, data protection, and threat-mitigation requirements. Security tests should trace back to these requirements. |
| `specs/testing/` | Defines test levels, environments, data strategy, and quality thresholds. It is the shared contract for QA execution. |
| `tests/` | Is the main root for automated tests and supporting test material. Its structure should remain reasonably traceable to production code. |
| `tests/unit/` | Contains fast tests for isolated functions, classes, or modules. External dependencies such as networks and real databases should not be used. |
| `tests/integration/` | Contains tests that verify contracts between components or external-service adapters. Required dependencies must be controlled and reproducible. |
| `tests/e2e/` | Contains tests for critical user-visible flows across the complete system. Keep this suite focused on a limited number of stable, high-value scenarios. |
| `tests/fixtures/` | Contains fixed files, payloads, and expected results used directly by test code. `data/fixtures/` holds broader sample data, while this directory is test-suite specific. |

## Automation and delivery

| Directory | Purpose |
|---|---|
| `scripts/` | Is the root for reusable development, validation, and delivery automation. Scripts should run non-interactively and return meaningful exit codes on failure. |
| `scripts/orchestration/` | Contains provider-neutral worktree creation, assignment validation, shared task locking, and role write-scope enforcement. Every concurrent CLI session uses these commands before and after task execution. |
| `scripts/setup/` | Contains scripts that prepare new development or CI environments. Setup operations should be safe to run more than once. |
| `scripts/development/` | Contains local server, data refresh, and daily development helpers. It remains separate from production deployment automation. |
| `scripts/ci/` | Contains CI-provider-independent validation and build commands. Workflows under `.github/workflows/` should call these scripts where practical. |
| `scripts/quality/` | Contains linting, formatting, type checking, and related code-quality automation. It helps keep local and CI behavior consistent. |
| `scripts/security/` | Contains secret, dependency, container, and static security scan automation. It may transform findings into suitable output for `reports/security/`. |
| `scripts/deploy/` | Contains deployment and rollback automation for target environments. Safe defaults and explicit target verification are required. |
| `scripts/release/` | Contains versioning, packaging, changelog, and publishing automation. It should run only after the release plan and CI gates pass. |

## Local and generated directories

| Directory | Purpose |
|---|---|
| `.git/` | Is generated by Git to store local repository metadata such as commits, branches, remotes, and the index. It must not be edited manually or included in a commit. |
| `node_modules/` | Is generated by the Node.js package manager to hold local dependencies. It is not part of the source structure and must not be committed. |
