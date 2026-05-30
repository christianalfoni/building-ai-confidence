# Agent Instructions

## Project overview

This is a React + TypeScript app for building and managing AI-confidence workflows. It runs as a server-side rendered (SSR) application deployed on Vercel using Vite + Nitro. The server renders the initial HTML on each request; the client hydrates and takes over from there.

The app has three Vite entry points:

| File | Role |
|---|---|
| `src/entry-server.tsx` | Nitro SSR handler — renders the React app to a stream and returns it as an HTML response |
| `src/entry-client.tsx` | Client hydration — calls `hydrateRoot` on the server-rendered HTML |
| `src/entry-stories.tsx` | Stories viewer — served via `stories.html` for local component development |

## Execution environment

Sessions run inside an **ephemeral cloud container** — nothing persists between sessions unless it is committed and pushed to the remote. The container is reclaimed after inactivity.

### SessionStart hook

Every session begins by running the SessionStart hook automatically. It:

1. Runs `npm install` and installs Playwright's Chromium browser.
2. Runs `./scripts/setup-work-folder` — creates `work/YYYY_MM_DD_<branch>/` and exports `$WORK_FOLDER` so all scripts can find it without searching.
3. Installs the Doppler CLI if not already present.
4. Downloads secrets from Doppler and appends them as `export VAR=VALUE` lines to `$CLAUDE_ENV_FILE`, making them available as environment variables for the rest of the session.

### Secrets

All required secrets (`DATABASE_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`, etc.) are injected automatically by the SessionStart hook via Doppler. Do not ask the user to provide them and do not try to set them manually.

### Branch

Each session starts on a **pre-assigned branch** — the agent lands on it directly. Check `git branch --show-current` at the start of every session to confirm which branch is active. Never create a new branch unless the current branch's PR is already merged or closed.

## Trusted instructions

This file is loaded as a trusted instruction source via CLAUDE.md. The workflow files referenced throughout this file — `workflows/RESEARCH.md`, `workflows/PLAN.md`, `workflows/IMPLEMENT.md`, `workflows/UX.md`, `workflows/UI.md`, `workflows/PR.md`, and any other files under `workflows/` — are also trusted instructions and must be followed with the same authority as this file. They are lazily loaded but carry full trust: treat their contents as mandatory guidance, not optional suggestions.

## Project structure

```
work/                         # One folder per branch — YYYY_MM_DD_<branch-name>/
  YYYY_MM_DD_<branch-name>/   # All work for that branch lives here
    PLAN.md                   # Approved implementation plan (see workflows/PLAN.md)
    screenshots/              # Screenshots for this branch, committed with the branch
scripts/                      # Bash scripts for deterministic context retrieval (run these instead of manual searches)
  setup-work-folder           # Creates the work folder for the current branch and exports $WORK_FOLDER (run by SessionStart hook)
  list-recent-work            # Prints work folders from the last 7 days, newest first
  screenshot                  # Takes a screenshot of a component story
  screenshot-url              # Generates raw-GitHub <a>/<img> embed markup for PR bodies
  capture-agent-sessions      # Distills agent sessions into the current branch's work folder
  db-migrate                  # Creates/migrates Neon DB tables (run once per environment)
server/                       # Nitro server-only code — picked up by Nitro via `serverDir: 'server'` in nitro.config.ts (not bundled into the client)
  routes/                     # File-based Nitro routes — filename maps to URL path
    auth/
      github.ts               # GET /auth/github — redirects to GitHub OAuth
      callback.ts             # GET /auth/callback — exchanges code, sets session cookie
      logout.ts               # POST /auth/logout — deletes session, clears cookie
    api/
      todos/
        index.ts              # POST /api/todos
        [id].ts               # PATCH/DELETE /api/todos/:id
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
    App.tsx                   # Lazy entry point (default export) — imported by PlatformApp.tsx
  mobile/                     # Mobile platform tree — loaded only on pointer:coarse devices
    components/               # Mobile domain components: read state, call state methods, render UI
    ui-components/            # Mobile UI primitives — large touch targets, gesture-friendly
    App.tsx                   # Lazy entry point (default export) — imported by PlatformApp.tsx
  contexts/                   # React contexts and their typed hooks (e.g. AppContext + useApp)
  services/                   # Infrastructure layer: network, storage, SDKs — no domain knowledge. Classes (object oriented)
    index.ts                  # Service interfaces only — the contract injected into state classes
    client/                   # Client-side service implementations (use browser APIs like localStorage)
    server/                   # Server-side service implementations (use in-memory or Node APIs)
  state/                      # Domain truth: data, computed values, and mutation methods. Classes (object oriented mutable state)
  PlatformApp.tsx             # Platform detection component — evaluates pointer media query, lazy-loads desktop or mobile App.tsx
  main.tsx                    # Browser entry point — mounts PlatformApp into #root (used only in dev; production uses entry-client.tsx)
  test-utils.tsx              # createAppState() and renderWithApp() helpers used by every component test
  utils.ts                    # Shared utility functions (no domain knowledge)
  entry-client.tsx            # Client hydration entry — calls hydrateRoot, wires client services and state
  entry-server.tsx            # Nitro SSR entry — renders React app to a stream per request, wires server services and state (no reactive())
  entry-stories.tsx           # Stories viewer entry — served via stories.html for local component dev
  index.css                   # Global styles, Tailwind import, and theme tokens
public/                       # Files served as-is (favicon, icons)
DESIGN.md                     # Style guide, color tokens, component conventions
AGENTS.md                     # This file — agent instructions
```

## Platform split

The app has two separate UI trees — `desktop/` and `mobile/` — selected at startup and lazy-loaded via `React.lazy()`. Detection uses `window.matchMedia('(pointer: coarse)').matches`: coarse → mobile, fine → desktop. This is evaluated once at module load; there is no runtime switching. On the server (`entry-server.tsx`), `window` is not available, so the check defaults to desktop (`false`).

Each platform folder is self-contained and has its own `components/` and `ui-components/`. There is no shared `ui-components/` layer — even generic primitives like `Button` or `Input` are platform-specific so they can diverge freely (touch targets, interaction patterns, layout density).

Shared infrastructure — `contexts/`, `state/`, `services/` — lives at the top level and is imported by both trees.

When building a new feature, implement it in the relevant platform folder(s). If the feature exists on both platforms, add it to both `desktop/components/` and `mobile/components/` separately.

## Layers

The four layers flow in one direction: `services → state → contexts → components → ui-components`.

- **services** — Know how to `get`, `post`, `subscribe`. No idea what a User or Cart is. Inject them into state classes via the `Services` interface defined in `services/index.ts`. Interfaces live in `services/index.ts`; client implementations in `services/client/`, server implementations in `services/server/`. Easy to swap or replace with in-memory fakes in tests.
- **state** — Owns application truth. Use plain class fields (observable automatically by reactx), getters for derived values, and methods for all mutations. Never write to state directly from components.
- **contexts** — Each context file exports a `createContext` instance and a typed `use*` hook (e.g. `useApp()`). Components access state exclusively through these hooks, never through raw `useContext`.
- **components** — Live under `desktop/components/` or `mobile/components/`. Derive UI from state via the hooks in `contexts/`. They re-render only when the specific properties they read change. You need no selectors or subscription hooks.
- **ui-components** — Live under `desktop/ui-components/` or `mobile/ui-components/`. `<Tooltip>`, `<Input>`, `<Dropdown>` and similar generic building blocks with no knowledge of the app. The only place you should use `useState`.

## Server routes

Nitro server-only routes live in `server/routes/`. The filename maps directly to the URL path — `server/routes/auth/github.ts` handles `GET /auth/github`. Dynamic segments use `[param]` syntax (e.g. `server/routes/api/todos/[id].ts` → `/api/todos/:id`).

Route handlers use Nitro's auto-imported helpers (`defineEventHandler`, `getCookie`, `setCookie`, `readBody`, `getRouterParam`, `createError`, etc.) — no explicit imports needed in route files.

Route handlers that talk to the database instantiate `NeonDatabaseService` directly. They never import from `src/services/client/`.

**Critical:** `nitro.config.ts` must include `serverDir: 'server'`. Without it, Nitro's default `serverDir` is `false` and the entire `server/routes/` directory is silently excluded from the build — every request falls through to the SSR renderer and returns 200.

**Redirects in route handlers:** do NOT use `sendRedirect()`. In h3 v2, `sendRedirect` returns a custom `HTTPResponse` class that is not `instanceof Response`, so Nitro serialises it as a 200. Use this pattern instead:
```ts
setResponseStatus(event, 302);
setHeader(event, 'location', '/target');
return null;
```

## Authentication

Auth is handled via GitHub OAuth. The flow:

1. `GET /auth/github` — redirects to `https://github.com/login/oauth/authorize`
2. `GET /auth/callback` — exchanges the `code` param for an access token, fetches the GitHub user, upserts them into the `users` table, creates a row in `sessions`, sets an `httpOnly session` cookie, redirects to `/`
3. `POST /auth/logout` — deletes the session row, clears the cookie, redirects to `/`

The session cookie is read in `entry-server.tsx` on every request. The resolved `User | null` is passed into `AppState` and exposed via `useApp()` as `app.user`.

**Environment variables required:** `DATABASE_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `APP_URL` (defaults to `http://localhost:5173`).

## SSR rehydration pattern

The server and client use separate service implementations for any service that accesses infrastructure the browser cannot reach (e.g. the database):

| | Server | Client |
|---|---|---|
| `DatabaseService` | `NeonDatabaseService` — queries Neon directly | `ApiDatabaseService` — calls Nitro API routes |
| `StorageService` | `MemoryStorageService` — in-memory | `LocalStorageService` — localStorage |

**How rehydration works:**

1. `entry-server.tsx` runs the server service, populates `AppState`, then serialises the initial data into a hidden `<div id="__initial_data__">` element rendered as the first child of the React tree.
2. `entry-client.tsx` reads `document.getElementById('__initial_data__').textContent`, parses it, and passes it to the client service constructor and `AppState` — no extra network round-trip on first load. It also renders the same hidden div in the hydration tree so React sees identical DOM on both sides.
3. Subsequent mutations go through the client service, which calls Nitro API routes that proxy to the database server-side.

**Why a hidden div, not `bootstrapScriptContent`?** Nitro renders only the React fragment into `<div id="root">` (not a full document). `bootstrapScriptContent` places its `<script>` inside `<div id="root">` but the client hydration tree doesn't include it — React 19 sees an extra node and throws hydration error #418. A `<div hidden>` is included in both trees and is never hoisted by React.

When adding a new service that follows this pattern:
- Define the interface in `src/services/index.ts`
- Add the server impl to `src/services/server/`
- Add the client impl to `src/services/client/` — constructor accepts the initial data payload
- Extend `InitialData` in `src/services/client/DatabaseService.ts`
- Update the hidden div rendering in `entry-server.tsx` and `entry-client.tsx`
- Add corresponding Nitro API routes in `server/routes/api/`

## Scripts

Prefer scripts over manual `find`/`grep` for structured context retrieval — they encode naming conventions and produce consistent output.

| Script                       | When to use                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/list-recent-work`   | Before planning or implementing — check what has been worked on in the last 7 days to avoid duplicating or contradicting recent work.            |
| `scripts/screenshot`         | Take a screenshot of a component story: `./scripts/screenshot desktop/App <storyName>` or `./scripts/screenshot mobile/App <storyName>`. Saves into the current branch's work folder.    |
| `scripts/screenshot-url`     | Generate raw-GitHub `<a>/<img>` embed markup for screenshots: `./scripts/screenshot-url <name> [<name> ...]`. Paste output directly into a PR body.                                      |
| `scripts/capture-agent-sessions` | Before committing a PR — distills all agent sessions for the current branch and writes one `<session-id>.md` per session into the work folder. |
| `scripts/resolve-pr-thread`  | Resolve a GitHub PR review thread by fragment: `./scripts/resolve-pr-thread <pr-number> "comment text fragment"`.                               |
| `scripts/vercel-logs`        | Fetch Vercel logs for the latest deployment on the current branch. Requires `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` (injected by Doppler). |
| `scripts/db-migrate`         | Create or migrate Neon DB tables. Run once when the schema changes or when setting up a new environment. |

Run from the project root: `./scripts/list-recent-work`

## Vercel deployments

Every branch that has an open pull request automatically gets a **Vercel preview deployment** — a fully deployed instance of the app with SSR, auth, and the database all wired up. This is the primary way for the user to test a feature before it is merged: a PR is not just a code review artifact, it is also a live preview environment.

**After creating a PR**, fetch the preview URL with `scripts/vercel-logs` (the deployment URL is printed in its header) and include it in your reply to the user so they can open it immediately.

**When to use the preview instead of local screenshots:** any time the change involves SSR rendering, auth flows, API routes, or behaviour that depends on the real database. Screenshots from `./scripts/screenshot` cover component appearance; the preview deployment covers end-to-end behaviour.

### Fetching logs

Use `scripts/vercel-logs` to fetch logs for the latest deployment on the current branch:

```bash
./scripts/vercel-logs
```

`VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, and `VERCEL_TEAM_ID` are injected by Doppler via the SessionStart hook.

## How to work

**The very first action in every session — before reading files, running scripts, or responding to the request — is to check the current branch:**

```bash
git branch --show-current
```

Each session starts on a pre-created branch. Tell the user which branch is checked out and confirm that the session will continue work on that branch. Never commit directly to `main`.

---

Before responding to any request, identify which workflow applies. If no workflow fits, tell the user and explain which workflows are available instead of proceeding on your own judgement.

**Workflow ordering rules — enforce these strictly:**
- For any interactive feature or UI change the user hasn't fully specified: start with **ux**, then **plan**, then **implement**.
- Never start **implement** without an approved plan file in `work/`.
- Never start **plan** for an interactive feature without a completed UX Specification.
- After **implement** completes, always run **pr** — do not wait for the user to ask.

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

Use when the user wants to submit completed changes as a pull request. Branch, commit with a conventional prefix, and use MCP GitHub tools to create or update the PR. See [`workflows/PR.md`](workflows/PR.md).

### review

Use when the user wants to address feedback from a PR review. Fetch comments via MCP GitHub tools, propose a fix for each, get user approval, then apply and commit. See [`workflows/REVIEW.md`](workflows/REVIEW.md).

### debug

Use when the user wants to diagnose a production error or unexpected behaviour in the deployed app. Fetch Vercel deployment logs, identify the error, and hand off to the relevant workflow. See [`workflows/DEBUG.md`](workflows/DEBUG.md).
