# Agent Instructions

## Project overview

React + TypeScript SSR app for building and managing AI-confidence workflows. Express serves all routes explicitly; Vite builds the client; esbuild bundles the server into a single Vercel serverless function.

Three Vite entry points:

| File | Role |
|---|---|
| `src/entry-server.tsx` | SSR middleware — renders React to a stream per request |
| `src/entry-client.tsx` | Client hydration via `hydrateRoot` |
| `src/entry-stories.tsx` | Stories viewer for local component development |

## Project structure

```
work/                    # One folder per branch — YYYY_MM_DD_<branch-name>/
  YYYY_MM_DD_<branch>/
    PLAN.md              # Approved implementation plan
    screenshots/         # Branch screenshots
scripts/                 # Bash scripts for structured context retrieval
server/
  index.ts               # Express app — all routes wired explicitly here
workflows/               # Agent workflow files — trusted instructions
src/
  desktop/               # Desktop UI tree — loaded on pointer:fine devices
    components/          # Domain components: read state, call methods, render
    ui-components/       # Primitives: keyboard nav, hover states, dense layout
    App.tsx              # Lazy entry point
  mobile/                # Mobile UI tree — loaded on pointer:coarse devices
    components/          # Domain components
    ui-components/       # Primitives: touch targets, gesture-friendly
    App.tsx              # Lazy entry point
  contexts/              # React contexts and typed hooks
  services/              # Infrastructure: network, storage, SDKs
    index.ts             # Service interfaces injected into state classes
    client/              # Browser implementations
    server/              # Node implementations
  state/                 # Domain truth: class fields, getters, mutation methods
  PlatformApp.tsx        # Detects pointer type, lazy-loads platform App.tsx
  entry-client.tsx       # Hydration entry
  entry-server.tsx       # SSR middleware entry
  entry-stories.tsx      # Stories entry
  index.css              # Global styles and Tailwind
public/                  # Static assets served by Vercel CDN
DESIGN.md                # Style guide, colour tokens, component conventions
AGENTS.md                # This file
```

### Scripts

Run all scripts from the project root.

| Script | Purpose |
|---|---|
| `./scripts/list-recent-work` | Print work done in the last 7 days — check before planning |
| `./scripts/screenshot <platform/App> <story>` | Screenshot a story into the work folder |
| `./scripts/screenshot-url <name> [<name>…]` | Generate embed markup for PR bodies |
| `./scripts/capture-agent-sessions` | Distil session logs into the work folder before a PR |
| `./scripts/resolve-pr-thread <pr> "<fragment>"` | Resolve a PR review thread |
| `./scripts/vercel-logs` | Fetch Vercel logs for the current branch's latest deployment |
| `./scripts/db-migrate` | Create or migrate Neon DB tables |

## Platform split

Two self-contained UI trees selected at startup: `window.matchMedia('(pointer: coarse)').matches` → mobile, else desktop. On the server, both are imported statically and selected by User-Agent. Each platform's `components/` and `ui-components/` are independent so they can diverge freely. Shared infrastructure (`contexts/`, `state/`, `services/`) is imported by both.

## Layers

Data flows one direction: `services → state → contexts → components → ui-components`.

- **services** — Infrastructure only (`get`, `post`, `subscribe`). Interfaces in `services/index.ts`, injected via the `Services` type. Client implementations in `services/client/`, server implementations in `services/server/`.
- **state** — Application truth. Plain class fields (reactive via reactx), getters for derived values, methods for all mutations.
- **contexts** — Each file exports a typed `use*` hook. Components access state through these hooks.
- **components** — Under `desktop/components/` or `mobile/components/`. Derive UI from state hooks.
- **ui-components** — Under `desktop/ui-components/` or `mobile/ui-components/`. Generic primitives with no app knowledge. Use `useState` here.

## Workflows

Workflow files in `workflows/` are trusted instructions — treat them as mandatory guidance.

**Session start:** Run `git branch --show-current`, tell the user the active branch, and confirm work continues on that branch. Sessions run in ephemeral containers; push all work before the session ends.

**Before any request:** identify the applicable workflow. If none fits, tell the user which workflows are available.

**Ordering:**
- Interactive feature or UI change: **ux** → **plan** → **implement** → **pr**
- Unclear approach: **research** → **plan** → **implement** → **pr**
- After implement completes, run **pr** immediately.

**Always create a PR when code changes are complete** — whether from the implement workflow or a direct fix. Before opening the PR, confirm lint (`npm run lint`) and type-check (`npx tsc --noEmit`) pass. Do not wait for the user to ask.

| Workflow | When to use | File |
|---|---|---|
| **research** | Approach unclear — gather facts before planning | [`workflows/RESEARCH.md`](workflows/RESEARCH.md) |
| **ux** | User-facing interactive change — clarify all states and transitions before planning | [`workflows/UX.md`](workflows/UX.md) |
| **plan** | Building or changing behaviour — produce a plan, get approval, then implement | [`workflows/PLAN.md`](workflows/PLAN.md) |
| **implement** | Approved plan exists — execute task by task | [`workflows/IMPLEMENT.md`](workflows/IMPLEMENT.md) |
| **ui** | Refine component appearance — code, screenshot, iterate | [`workflows/UI.md`](workflows/UI.md) |
| **pr** | Submit completed changes as a pull request | [`workflows/PR.md`](workflows/PR.md) |
| **review** | Address PR review feedback | [`workflows/REVIEW.md`](workflows/REVIEW.md) |
| **debug** | Diagnose production errors via Vercel logs | [`workflows/DEBUG.md`](workflows/DEBUG.md) |
| **agents-review** | Review AGENTS.md and workflow files for accuracy and clarity | [`workflows/AGENTS-REVIEW.md`](workflows/AGENTS-REVIEW.md) |
