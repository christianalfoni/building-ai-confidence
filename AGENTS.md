# Agent Instructions

## Project structure

```
plans/                        # Approved implementation plans (see workflows/PLAN.md)
scripts/                      # Bash scripts for deterministic context retrieval (run these instead of manual searches)
  list-recent-plans           # Prints plans from the last 7 days, newest first
  upsert-pr                   # Creates or updates the GitHub PR for the current branch
workflows/                    # Agent workflow instructions
  RESEARCH.md                 # How to investigate before planning
  PLAN.md                     # How to plan and get approval before coding
  IMPLEMENT.md                # How to execute an approved plan
  UX.md                       # How to define a user experience before planning
  PR.md                       # How to branch, commit, and submit changes as a PR
src/
  assets/                     # Static assets (images, SVGs)
  components/                 # Domain components: read state, call state methods, render UI. React components (functional)
  contexts/                   # React contexts and their typed hooks (e.g. AppContext + useApp)
  services/                   # Infrastructure layer: network, storage, SDKs — no domain knowledge. Classes (object oriented)
    index.ts                  # Defines the Services interface — the contract injected into state classes
  state/                      # Domain truth: data, computed values, and mutation methods. Classes (object oriented mutable state)
  ui-components/              # Generic, reusable UI primitives — no app knowledge, may use useState (functional)
  index.css                   # Global styles, Tailwind import, and theme tokens
  main.tsx                    # Entry point — wires services, state, and root component
public/                       # Files served as-is (favicon, icons)
DESIGN.md                     # Style guide, color tokens, component conventions
AGENT.md                      # This file — agent instructions
```

The four layers flow in one direction: `services → state → components → ui-components`.

- **services** — Know how to `get`, `post`, `subscribe`. No idea what a User or Cart is. Inject them into state classes via the `Services` interface defined in `services/index.ts`. Easy to swap (e.g. web → native) or replace with in-memory fakes in tests.
- **state** — Owns application truth. Use plain class fields (observable automatically by reactx), getters for derived values, and methods for all mutations. Never write to state directly from components.
- **contexts** — Each context file exports a `createContext` instance and a typed `use*` hook (e.g. `useApp()`). Components access state exclusively through these hooks, never through raw `useContext`.
- **components** — Derive UI from state via the hooks in `contexts/`. They re-render only when the specific properties they read change. You need no selectors or subscription hooks.
- **ui-components** — `<Tooltip>`, `<Input>`, `<Dropdown>` and similar generic building blocks with no knowledge of the app. The only place you should use `useState`.

## Scripts

Prefer scripts over manual `find`/`grep` for structured context retrieval — they encode naming conventions and produce consistent output.

| Script                      | When to use                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/list-recent-plans` | Before planning or implementing — check what has been worked on in the last 7 days to avoid duplicating or contradicting recent work. |
| `scripts/upsert-pr`         | When submitting changes as a PR — creates the PR if none exists for the branch, updates it if one does.                               |

Run from the project root: `./scripts/list-recent-plans`

## How to work

At the start of every session, check whether the conversation is continuing work on an existing branch. If it is not — i.e. the session is starting fresh with no prior branch context — switch to `main` and pull the latest:

```bash
git checkout main && git pull
```

Before responding to any request, identify which workflow applies. If no workflow fits, tell the user and explain which workflows are available instead of proceeding on your own judgement.

## Workflows

### research

Use when the right approach is unclear and facts need to be gathered first — reading source files, consulting package docs, or searching the web. Produces a findings report and a recommendation, then hands off to the plan workflow. See [`workflows/RESEARCH.md`](workflows/RESEARCH.md).

### plan

Use when the user wants to build something new, change existing behaviour, or explore an approach. You produce a structured plan and get it approved before any code is written. See [`workflows/PLAN.md`](workflows/PLAN.md).

### ux

Use when the user wants to create or change something a user interacts with — a screen, form, flow, modal, or any interactive feature. Ask clarifying questions to fully define all states, transitions, and error cases before any planning begins. Produces a UX Specification that feeds into the plan workflow. See [`workflows/UX.md`](workflows/UX.md).

### implement

Use when an approved plan exists and the user wants to execute it. You work through the task list, checking off each item as it is completed. See [`workflows/IMPLEMENT.md`](workflows/IMPLEMENT.md).

### pr

Use when the user wants to submit completed changes as a pull request. Branch, commit with a conventional prefix, and run the `upsert-pr` script to create or update the PR on GitHub. See [`workflows/PR.md`](workflows/PR.md).
