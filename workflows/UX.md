# User Experience Workflow

Define the full user experience before any planning or implementation begins. Use this when the user wants to create or change something a user interacts with — a form, a flow, a screen, a modal, or any interactive feature.

## When to use

- The user wants to add a new screen, form, or interactive flow.
- The user wants to change how an existing interaction works.
- The scope of what the user sees and does is not yet fully defined.

## Steps

1. Read the request and identify what is already specified versus what is open.
2. Ask clarifying questions in a single message, grouped by topic. Cover all of the areas below that are not already answered by the request. Do not ask about things that are obvious or already decided.
3. Once the user has answered, produce a **UX Specification** (see format below).
4. Present the spec to the user and iterate until they approve it.
5. Tell the user to proceed with the **plan** workflow when they are ready to implement.

## Clarifying question areas

Ask only what is genuinely open. Skip any area that the user's request already answers.

**Trigger and entry**
- What action or event starts this flow? (e.g. clicking a button, navigating to a route, an async event arriving)
- Is there any prerequisite state or permission required to enter the flow?

**Scope and goal**
- What does the user want to accomplish by the end of the flow?
- Where does the flow end — same page, new page, modal closes, redirect?

**Steps and choices**
- Walk through each step: what does the user see, and what can they do?
- Are there branching paths depending on user choices or data?
- Are any actions irreversible? If so, does the user need to confirm?

**States the UI must represent**
- Loading: what triggers a loading state, and what does the UI show?
- Empty: what if there is no data yet?
- Populated: what does the normal, data-filled view look like?
- Error: what can go wrong, and how is each error communicated to the user?
- Success: how does the user know the action completed?
- Disabled / restricted: are any controls conditionally unavailable?

**Edge cases**
- What happens if the user navigates away mid-flow?
- What if the same action is triggered twice (e.g. double-submit)?
- What if the user's session expires during the flow?

## UX Specification format

```md
# UX Spec: <Feature name>

## Goal
One sentence: what the user is trying to accomplish.

## Entry point
What triggers the flow and any preconditions.

## Flow
A numbered, step-by-step description of what the user sees and does.
Include branches where the path diverges.

## States
| State | Trigger | What the user sees |
|---|---|---|
| Loading | ... | ... |
| Empty | ... | ... |
| Populated | ... | ... |
| Error — <type> | ... | ... |
| Success | ... | ... |

## Edge cases
A bullet list of edge cases and how each is handled.

## Out of scope
Anything explicitly excluded from this feature to prevent scope creep.
```

## Rules

- Do not write application code or create plan files during this workflow.
- Do not guess at answers — if something is ambiguous, ask.
- Keep the spec precise enough that a developer reading it knows every state and transition without needing to ask follow-up questions.
- If an answer reveals a risky or complex edge case, flag it explicitly before moving on.
