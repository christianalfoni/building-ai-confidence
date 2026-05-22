# Research Workflow

Investigate an open question before committing to a plan. Use this when the right approach is unclear — the codebase needs to be understood, external documentation consulted, or tradeoffs evaluated before it makes sense to write a plan.

## When to use

- The user wants to understand how something works before deciding what to build.
- The right approach depends on facts that aren't yet known (e.g. how a library works, what an API supports, what the current code does).
- The user asks an exploratory question: "how should we…", "what's the best way to…", "is it possible to…".

## Steps

1. Clarify the research question with the user if it is ambiguous.
2. Gather information — read relevant source files, search the web, inspect package documentation, run commands to observe behaviour.
3. Summarise findings in a short report:
   - What was learned.
   - The recommended approach and why.
   - Alternatives considered and why they were ruled out.
   - Any open questions or risks.
4. Present the report to the user and ask whether to proceed to the **plan** workflow.

## Rules

- Do not write application code during research. Reading and running read-only commands is fine.
- Keep the report concise — enough detail to justify a plan, not a full design document.
- If research reveals the task is not feasible or not necessary, say so clearly.
