---
name: plan
description: Produce an approved implementation plan before writing any code. Creates a PLAN.md in the work/ folder and waits for explicit approval.
---

# Planning Workflow

Before writing any code, the agent must produce a plan and get it approved.

## Writing a plan

Each branch gets its own folder inside `work/`. Create the folder when starting a new branch:

```
work/YYYY_MM_DD_<branch-name>/
```

Example: `work/2026_05_21_user-auth-flow/`

Write the plan inside that folder as `PLAN.md`:

```
work/YYYY_MM_DD_<branch-name>/PLAN.md
```

Example: `work/2026_05_21_user-auth-flow/PLAN.md`

## Plan format

```md
# <Title>

## Summary
A short paragraph describing what this plan achieves and why.

## Considerations
A summary of the approaches considered, trade-offs evaluated, and the rationale
for the chosen approach. Include alternatives that were ruled out and why.

## Tasks
- [ ] Task one
- [ ] Task two
- [ ] Task three

## Report
```

## Rules

1. Create the `work/YYYY_MM_DD_<branch-name>/` folder and write `PLAN.md` first — do not write application code before the plan exists.
2. Present the plan to the user, include the local file path to `PLAN.md` (e.g. `work/YYYY_MM_DD_<branch-name>/PLAN.md`), and wait for explicit approval before starting tasks.
3. As tasks are completed, check them off in the plan file (`- [x]`).
4. If scope changes during implementation, update the plan before continuing.
5. When planning UI work, identify any generic, reusable pieces (buttons, inputs, modals, cards, tooltips, etc.) and create them as `ui-components/` entries rather than inlining them in domain components. Include these as explicit tasks in the plan.
6. If a `/ux` visual prototype already exists (components + `.stories.tsx` under `src/<platform>/`), plan to wire state, contexts, and services into those existing components rather than rebuilding them. Reference the spec's user stories and treat each story as acceptance criteria for a task.
