# Handoff Protocol

A handoff is complete only when the current owner records the task ID, completed scope, changed artifacts, branch and commit, verification evidence, unresolved risks, dependencies, and the next required role.

The receiving agent must verify its assignment and claim the task before modifying files. Findings from Reviewer, Security, QA, or Performance return to the responsible implementation owner; those roles report and revalidate but do not silently implement fixes.

Author and independent reviewer must use separate execution contexts. A task moves to done only after all required gates are recorded and blocking findings are resolved or formally accepted by an authorized human.
