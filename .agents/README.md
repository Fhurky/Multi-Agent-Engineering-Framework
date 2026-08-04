# Canonical Agent Contracts

This directory is the provider-neutral source of truth for agent responsibilities. Tool adapters may reference these contracts but may not weaken or duplicate them.

Every execution selects exactly one enabled role from 'config/agents/settings.yaml', reads that role's four contract files, claims one task, and stays inside the assigned write scope. Cross-role work is split and handed back to the Orchestrator.

Shared files define routing, handoffs, communication, and completion rules. Runtime task locks are stored in the repository's shared Git common directory so separate worktrees see the same lock state.
