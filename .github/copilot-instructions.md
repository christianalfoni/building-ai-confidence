# Copilot PR Review Instructions

When reviewing a pull request, perform two distinct reviews.

---

## 1. Agent process review (only when a `work/` folder is present)

If the PR includes files under `work/YYYY_MM_DD_<branch-name>/`, review how well the agent executed the plan.

- Read `work/YYYY_MM_DD_<branch-name>/PLAN.md` to understand the approved plan: the goal, the task list, and any stated constraints or design decisions.
- Read each `work/YYYY_MM_DD_<branch-name>/<session-id>.md` file. These are distilled records of the agent's actual behaviour during the work session.
- Evaluate the agent's execution:
  - Did it follow the plan faithfully, or did it deviate? If it deviated, was the reason sound?
  - Did it complete all planned tasks, or skip or partially implement any?
  - Did it introduce scope beyond what the plan described?
  - Did it make good judgement calls when the plan was ambiguous?
  - Were there any signs of confusion, backtracking, or repeated mistakes?
- Summarise your findings as: **what went well**, **what could improve**, and any **patterns worth noting** for future planning or agent instructions.

---

## 2. Code review

Review the implementation changes independently of the plan.

- Evaluate correctness: does the code do what it claims?
- Check for edge cases, error conditions, and missing validation at system boundaries.
- Flag security issues (injection, XSS, unvalidated external input, exposed secrets).
- Assess clarity: are names, structure, and responsibilities obvious without comments?
- Note any abstraction that exceeds the task's actual requirements.
- Check that the change is consistent with the existing architecture and layer boundaries described in `AGENTS.md`.
