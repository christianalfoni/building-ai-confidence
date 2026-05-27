# Agent Instructions

## Project structure

```
work/                         # One folder per branch — YYYY_MM_DD_<branch-name>/
  YYYY_MM_DD_<branch-name>/   # All work for that branch lives here
    PLAN.md                   # Approved implementation plan (see workflows/PLAN.md)
    screenshots/              # Screenshots for this branch, committed with the branch
scripts/                      # Bash scripts for deterministic context retrieval (run these instead of manual searches)
  list-recent-work            # Prints work folders from the last 7 days, newest first
  upsert-pr                   # Creates or updates the GitHub PR for the current branch
workflows/                    # Agent workflow instructions
  RESEARCH.md                 # How to investigate before planning
  PLAN.md                     # How to plan and get approval before coding
  IMPLEMENT.md                # How to execute an approved plan
  UX.md                       # How to define a user experience before planning
  UI.md                       # How to iterate on component appearance using stories and screenshots
  PR.md                       # How to branch, commit, and submit changes as a PR
src/
  assets/                     # Static assets (images, SVGs)
  desktop/                    # Desktop platform tree — loaded only on pointer:fine devices
    components/               # Desktop domain components: read state, call state methods, render UI
    ui-components/            # Desktop UI primitives — keyboard nav, hover states, dense layout
    App.tsx                   # Lazy entry point (default export) — imported by main.tsx
  mobile/                     # Mobile platform tree — loaded only on pointer:coarse devices
    components/               # Mobile domain components: read state, call state methods, render UI
    ui-components/            # Mobile UI primitives — large touch targets, gesture-friendly
    App.tsx                   # Lazy entry point (default export) — imported by main.tsx
  contexts/                   # React contexts and their typed hooks (e.g. AppContext + useApp)
  services/                   # Infrastructure layer: network, storage, SDKs — no domain knowledge. Classes (object oriented)
    index.ts                  # Defines the Services interface — the contract injected into state classes
  state/                      # Domain truth: data, computed values, and mutation methods. Classes (object oriented mutable state)
  index.css                   # Global styles, Tailwind import, and theme tokens
  main.tsx                    # Entry point — detects platform, lazy-loads desktop or mobile tree, wires services and state
public/                       # Files served as-is (favicon, icons)
DESIGN.md                     # Style guide, color tokens, component conventions
AGENT.md                      # This file — agent instructions
```

## Platform split

The app has two separate UI trees — `desktop/` and `mobile/` — selected at startup and lazy-loaded via `React.lazy()`. Detection uses `window.matchMedia('(pointer: coarse)').matches`: coarse → mobile, fine → desktop. This is evaluated once; there is no runtime switching.

Each platform folder is self-contained and has its own `components/` and `ui-components/`. There is no shared `ui-components/` layer — even generic primitives like `Button` or `Input` are platform-specific so they can diverge freely (touch targets, interaction patterns, layout density).

Shared infrastructure — `contexts/`, `state/`, `services/` — lives at the top level and is imported by both trees.

When building a new feature, implement it in the relevant platform folder(s). If the feature exists on both platforms, add it to both `desktop/components/` and `mobile/components/` separately.

## Layers

The four layers flow in one direction: `services → state → contexts → components → ui-components`.

- **services** — Know how to `get`, `post`, `subscribe`. No idea what a User or Cart is. Inject them into state classes via the `Services` interface defined in `services/index.ts`. Easy to swap (e.g. web → native) or replace with in-memory fakes in tests.
- **state** — Owns application truth. Use plain class fields (observable automatically by reactx), getters for derived values, and methods for all mutations. Never write to state directly from components.
- **contexts** — Each context file exports a `createContext` instance and a typed `use*` hook (e.g. `useApp()`). Components access state exclusively through these hooks, never through raw `useContext`.
- **components** — Live under `desktop/components/` or `mobile/components/`. Derive UI from state via the hooks in `contexts/`. They re-render only when the specific properties they read change. You need no selectors or subscription hooks.
- **ui-components** — Live under `desktop/ui-components/` or `mobile/ui-components/`. `<Tooltip>`, `<Input>`, `<Dropdown>` and similar generic building blocks with no knowledge of the app. The only place you should use `useState`.

## Scripts

Prefer scripts over manual `find`/`grep` for structured context retrieval — they encode naming conventions and produce consistent output.

| Script                       | When to use                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/list-recent-work`   | Before planning or implementing — check what has been worked on in the last 7 days to avoid duplicating or contradicting recent work.            |
| `scripts/upsert-pr`          | When submitting changes as a PR — creates the PR if none exists for the branch, updates it if one does.                                          |
| `scripts/screenshot`         | Take a screenshot of a component story: `./scripts/screenshot <platform/Component> <storyName>`. Saves into the current branch's work folder.    |

Run from the project root: `./scripts/list-recent-work`

## How to work

**Always establish the working branch before doing anything else.** Scripts like `./scripts/screenshot` derive the work folder from the current branch — running them on `main` creates a `work/YYYY_MM_DD_main/` folder, which is never correct.

At the start of every session:

1. Check which branch you are on:
   ```bash
   git branch --show-current
   ```
2. **If you are on a non-main branch:** assume this is the branch to continue working on. Proceed.
3. **If you are on `main`:** pull latest and create a new branch before doing anything else:
   ```bash
   git pull
   git checkout -b <descriptive-branch-name>
   ```

Never make changes, run scripts, or create files while on `main`.

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

### ui

Use when the user wants to refine the visual appearance of a component — layout, spacing, colour, or typography. Make a code change, take a screenshot with `./scripts/screenshot`, show it to the user, and iterate until they approve. See [`workflows/UI.md`](workflows/UI.md).

### pr

Use when the user wants to submit completed changes as a pull request. Branch, commit with a conventional prefix, and run the `upsert-pr` script to create or update the PR on GitHub. See [`workflows/PR.md`](workflows/PR.md).
