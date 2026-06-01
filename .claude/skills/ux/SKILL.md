---
name: ux
description: Define the full user experience before any planning or implementation begins. Use when adding or changing anything a user interacts with.
---

# User Experience Workflow

Define the full user experience before any planning or implementation begins, and prove it with a working visual prototype. Use this when the user wants to create or change something they interact with — a form, a flow, a screen, a modal, or any interactive feature.

The deliverable of this workflow is twofold:

1. A **UX Specification** written as user stories in Given / When / Then form.
2. A **visual prototype** — the real components and `.stories.tsx` files, rendered with mock data and screenshotted so the user can see and evaluate every state before any behaviour is wired up.

The prototype components and stories are carried forward: `/plan` and `/implement` wire state, services, and behaviour into the very components built here rather than starting from scratch.

## When to use

- The user wants to add a new screen, form, or interactive flow.
- The user wants to change how an existing interaction works.
- The scope of what the user sees and does is not yet fully defined.

## Steps

1. Read the request and identify what is already specified versus what is open.
2. Ask clarifying questions in a single message, grouped by topic. Cover all of the areas below that are not already answered by the request. Do not ask about things that are obvious or already decided.
3. Once the user has answered, write the **UX Specification** (see format below) — every scenario as a Given / When / Then user story.
4. Build the **visual prototype**: create the real presentational components and a `.stories.tsx` file with one exported story per meaningful state, seeded with mock data/props (no live state, services, or behaviour). Screenshot each story.
5. Present the spec together with the screenshots. Iterate on both — copy, layout, states, transitions — until the user approves.
6. Tell the user to proceed with the `/plan` skill, which will wire state and behaviour into the components built here.

## Building the prototype

Follow the platform split and layering conventions in `CLAUDE.md` and `DESIGN.md`.

- **Where code goes.** Presentational components live under `src/desktop/ui-components/` or `src/mobile/ui-components/` (generic primitives) or `src/<platform>/components/` (domain components). Build for whichever platform(s) the feature targets — ask if unclear.
- **Stories location.** The stories loader resolves `<platform>/<Name>` to `src/<platform>/components/<Name>.stories.tsx`. **Every story file must live under `components/`**, even when the component it renders is a `ui-component`. Each story is a named export returning `{ element }`. See `src/desktop/components/DeleteConfirm.stories.tsx` for the shape.
- **Mock everything.** Seed each visual state directly via props (e.g. an `initialStatus` prop or a `Frame` wrapper), exactly as the existing stories do. Use `noop` handlers — `const noop = () => new Promise<void>(() => {});`. Do not import from `state/`, `contexts/`, or `services/`; do not call real network methods.
- **One story per state.** There should be a story for every row in the spec's States table — loading, empty, populated, each error, success, disabled — so the screenshots cover the whole experience.
- **Screenshot each story** into the work folder:
  ```
  ./scripts/screenshot <platform>/<Name> <storyName>
  ```
  e.g. `./scripts/screenshot desktop/DeleteConfirm idle`. The script prints the PNG path under `$WORK_FOLDER/screenshots/`.

## UX Specification format

```md
# UX Spec: <Feature name>

## Goal
One sentence: what the user is trying to accomplish.

## Entry point
What triggers the flow and any preconditions.

## User stories
Each scenario in Given / When / Then form. Cover the happy path, every branch,
and the failure modes.

- **<Scenario name>**
  - **Given** <the starting context / precondition>
  - **When** <the user action or event>
  - **Then** <the observable outcome the user sees>

(Repeat for each scenario — entry, each choice/branch, each error, success,
and edge cases below.)

## States
| State | Trigger | What the user sees | Story |
|---|---|---|---|
| Loading | ... | ... | `<platform>/<Name>` · `loading` |
| Empty | ... | ... | ... |
| Populated | ... | ... | ... |
| Error — <type> | ... | ... | ... |
| Success | ... | ... | ... |

## Prototype
Screenshots of each story, with the screenshot path beside each state.

## Out of scope
Anything explicitly excluded from this feature to prevent scope creep.
```

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

## Rules

- Write only presentational UI and stories during this workflow — no `state/`, `contexts/`, or `services/` wiring, and no plan files. Behaviour is `/plan`'s job.
- Every state in the spec must have a matching story and screenshot before you present.
- Do not guess at answers — if something is ambiguous, ask.
- Keep the spec precise enough that a developer reading it knows every state and transition without needing to ask follow-up questions.
- If an answer reveals a risky or complex edge case, flag it explicitly before moving on.
