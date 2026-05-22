# Planning Workflow

Before writing any code, the agent must produce a plan and get it approved.

## Writing a plan

Plans live in the `plans/` folder at the project root. Name the file:

```
plans/DD_MM_YYYY_<title-in-kebab-case>.md
```

Example: `plans/21_05_2026_user-auth-flow.md`

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

1. Write the plan file first — do not write application code before the plan exists.
2. Present the plan to the user and wait for explicit approval before starting tasks.
3. As tasks are completed, check them off in the plan file (`- [x]`).
4. If scope changes during implementation, update the plan before continuing.
5. When planning UI work, identify any generic, reusable pieces (buttons, inputs, modals, cards, tooltips, etc.) and create them as `ui-components/` entries rather than inlining them in domain components. Include these as explicit tasks in the plan.
