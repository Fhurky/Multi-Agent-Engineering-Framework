# AI Multi-Agent Software Company Template

> Reusable architecture for any software project.

## Purpose
This repository defines a role-based AI development workflow where specialized agents collaborate through Git and reviews instead of sharing responsibility.

## Core Principles
- Single responsibility per agent.
- No agent reviews its own work.
- All code passes security, QA and review before merge.
- Every decision is documented.

## Team

| Role | Responsibility | Never Does |
|---|---|---|
| Project Manager | Roadmap, backlog, priorities | Writes production code |
| Solution Architect | Architecture, standards | Implements features |
| Backend Engineer | APIs, business logic | Frontend/UI |
| Frontend Engineer | UI/UX implementation | Backend logic |
| Database Engineer | Schema, migrations | API logic |
| Security Engineer | OWASP, SAST, secrets | New features |
| QA Engineer | Tests, bug hunting | Architecture |
| Performance Engineer | Profiling, optimization | Feature requests |
| DevOps Engineer | CI/CD, Docker, deployment | Business logic |
| Documentation Engineer | README, API docs | Production code |

## Workflow

```text
Idea
 ↓
Project Manager
 ↓
Solution Architect
 ↓
Backend / Frontend / Database
 ↓
Code Review
 ↓
Security Review
 ↓
QA
 ↓
Performance
 ↓
Documentation
 ↓
DevOps
 ↓
Release
```

## Repository Structure

```text
project/
├── .agents/
│   ├── manager/
│   ├── architect/
│   ├── backend/
│   ├── frontend/
│   ├── database/
│   ├── security/
│   ├── qa/
│   ├── performance/
│   ├── devops/
│   └── docs/
├── docs/
├── src/
├── tests/
├── scripts/
└── .github/workflows/
```

## Deliverables
- ROADMAP.md
- SPRINT.md
- ARCHITECTURE.md
- REVIEW.md
- SECURITY_REPORT.md
- PERFORMANCE_REPORT.md
- BUG_REPORT.md
- RELEASE_NOTES.md

## Rules
1. One owner per task.
2. Reviews are mandatory.
3. Security blocks merge on High/Critical findings.
4. Documentation updated with every feature.
5. CI must pass before merge.

## Branch Strategy
- main
- develop
- feature/*
- bugfix/*
- hotfix/*
- release/*

## Commit Convention
- feat:
- fix:
- refactor:
- docs:
- test:
- perf:
- chore:
- security:

## Recommended Review Order
1. Code Review
2. Security
3. QA
4. Performance
5. Documentation
6. Release

## Agent Communication
Agents communicate only through:
- Git commits
- Pull requests
- Markdown reports
- Issue tracker

Never by editing each other's responsibilities.

## Extending
Create a new folder under `.agents/` with:
- ROLE.md
- SYSTEM_PROMPT.md
- CHECKLIST.md
- OUTPUT_TEMPLATE.md

This template is intentionally technology-agnostic and can be reused for web, mobile, AI, backend, desktop and embedded projects.
