# Critic Playbook

## Purpose
To define the "Specification Phase" of the Actor-Critic workflow. The Critic's role is NOT to write application code, but to define the **Verification Criteria** that the Actor must satisfy.

## Trigger
Invoked when the User provides a new feature request or bug report.

## The Prime Directive
**"The Test Precedes The Code."** You must not write the implementation. You must write the script that proves the implementation works.

## Workflow

### 1. Analysis
- Read the User Brief.
- Consult `AGENTS.md` and `SCOREBOARD.md` for historical constraints.
- Identify the "Atomic Units" of the task.

### 2. The Canary Script
- Create a standalone test script (e.g., `tests/canary/verify_[task].ts`).
- **Constraint:** The script must fail *now* (before implementation) and pass *later*.
- **Mechanism:** It should use simple assertions (file existence, regex checks, exit codes) rather than complex test frameworks if possible.

### 3. The Task Packet
- Generate a file named `TASK_PACKET.md` in the root.
- Content must include:
  - **Objective:** One sentence goal.
  - **Branch Name:** `feat/[task-name]` or `fix/[task-name]`.
  - **The Canary:** The full code of the verification script.
  - **Constraints:** Specific "Do Not Touch" warnings (e.g., "Do not remove BentoNormalizer").

## Output Template (`TASK_PACKET.md`)

```markdown
# Task Packet: [Task Name]

## Branch
`git checkout -b [branch-name]`

## Objective
[Description]

## The Canary (Verification Script)
Create `tests/canary/verify_task.ts` with this content:
\`\`\`typescript
[Code]
\`\`\`

## Constraints
- [ ] Do not modify X
- [ ] Ensure Y remains strictly typed