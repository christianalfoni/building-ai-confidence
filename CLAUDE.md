# Project Instructions

## Project overview

React + TypeScript SSR app for building and managing AI-confidence workflows. Express serves all routes; Vite builds the client; `scripts/build-output.mjs` assembles the Vercel Build Output API directory (`.vercel/output/`) so the Express function is deployed correctly.

Three Vite entry points:

| File | Role |
|---|---|
| `src/entry-server.tsx` | SSR middleware — renders React to a stream per request |
| `src/entry-client.tsx` | Client hydration via `hydrateRoot` |
| `src/entry-stories.tsx` | Stories viewer for local component development |

## Route structure

All three route types are handled by a single Express app in `server/index.ts`:

| Route pattern | Handled by | Notes |
|---|---|---|
| `/` and `/posts/:post` | SSR catch-all → `entry-server.tsx` | Server-rendered HTML |
| `/auth/github`, `/auth/callback`, `/auth/logout` | Express auth handlers | Browser navigation; `/auth/github` 302s to GitHub OAuth |
| `/api/*` | Express REST handlers | JSON, called by the client via `fetch` |

## Project structure

```
work/                    # One folder per branch — YYYY_MM_DD_<branch-name>/
  YYYY_MM_DD_<branch>/
    PLAN.md              # Approved implementation plan
    screenshots/         # Branch screenshots
scripts/
  build-output.mjs       # Assembles .vercel/output/ (Build Output API v3)
  gen-html-template.mjs  # Turns dist/client/index.html into src/html-template.gen.ts
  vercel-logs            # Fetch Vercel logs for the current branch deployment
  …                      # Other bash scripts for structured context retrieval
server/
  utils.ts               # Shared helpers: parseCookie, ALLOWED_LOGINS, hiddenAuthorLogins
  routes/
    auth.ts              # Auth routes (/auth/github, /auth/callback, /auth/logout, /auth/test-login)
    api.ts               # API routes (/api/posts and variants)
  index.ts               # Express app entry — wires routes + SSR catch-all
  dev.ts                 # Dev server: Express + Vite middleware (HMR + SSR hot-reload)
src/
  common/                # Shared across both platform trees
    hooks/               # Shared React hooks (e.g. useBlogEditor)
    ui-components/       # Shared primitives used by both desktop and mobile
    utils.ts             # Shared pure helpers (e.g. dbPostToPost)
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
    index.ts             # Service interfaces
    client/              # Browser implementations
    server/              # Node implementations
  state/                 # Domain truth: class fields, getters, mutation methods
  PlatformApp.tsx        # Detects pointer type, lazy-loads platform App.tsx
  entry-client.tsx       # Hydration entry
  entry-server.tsx       # SSR middleware entry
  entry-stories.tsx      # Stories entry
  index.css              # Global styles and Tailwind
public/                  # Source static assets (fonts, favicon, icons) — tracked in git
CLAUDE.md                # Project instructions for Claude
DESIGN.md                # Style guide, colour tokens, component conventions
```

## Build pipeline

```
npm run build
  1. vite build --outDir dist/client        → hashed JS/CSS bundles + index.html
  2. node scripts/gen-html-template.mjs     → src/html-template.gen.ts (SSR uses this)
  3. tsc -b                                 → type-check only (no emit)
  4. node scripts/build-output.mjs         → .vercel/output/ (Vercel Build Output API v3)
```

`scripts/build-output.mjs` produces:

```
.vercel/output/
  config.json                  # routes: filesystem phase → function catch-all
  static/                      # hashed assets + fonts/favicon (NO index.html → / SSRs)
  functions/index.func/
    index.mjs                  # self-contained Express bundle (all deps inlined)
    .vc-config.json            # Node 22 runtime config
```

**Do not add a `vercel.json`** — routing is owned by `config.json` inside `.vercel/output/`.  
**Do not commit anything under `.vercel/`** — it is gitignored and regenerated on every build.

### Scripts

Run all scripts from the project root.

| Script | Purpose |
|---|---|
| `./scripts/list-recent-work` | Print work done in the last 7 days — check before planning |
| `./scripts/validate` | Lint, type-check, and run tests — use before every PR |
| `./scripts/screenshot <platform/App> <story>` | Screenshot a story into the work folder |
| `./scripts/screenshot-url <name> [<name>…]` | Generate embed markup for PR bodies |
| `./scripts/capture-agent-sessions` | Distil session logs into the work folder before a PR |
| `./scripts/vercel-logs` | Fetch runtime logs for the current branch's latest deployment |
| `./scripts/build-logs` | Fetch build logs for the current branch's latest deployment |
| `./scripts/db-migrate` | Create or migrate Neon DB tables |

## Platform split

Two self-contained UI trees selected at startup: `window.matchMedia('(pointer: coarse)').matches` → mobile, else desktop. On the server, both are imported statically and selected by User-Agent. Each platform's `components/` and `ui-components/` are independent so they can diverge freely. Shared infrastructure (`contexts/`, `state/`, `services/`) is imported by both.

## Layers

Data flows one direction: `services → state → contexts → components → ui-components`.

- **services** — Infrastructure only (`get`, `post`, `subscribe`). Interfaces in `services/index.ts`. Client implementations in `services/client/`, server implementations in `services/server/`.
- **state** — Application truth. Plain class fields (reactive via reactx), getters for derived values, methods for all mutations.
- **contexts** — Each file exports a typed `use*` hook. Components access state through these hooks.
- **components** — Under `desktop/components/` or `mobile/components/`. Derive UI from state hooks.
- **ui-components** — Under `desktop/ui-components/` or `mobile/ui-components/`. Generic primitives with no app knowledge. Use `useState` here.

## Skills

Skills in `.claude/skills/` are trusted instructions — invoke them with `/skill-name`.

**Session start:** Run `git branch --show-current`, tell the user the active branch, and confirm work continues on that branch. Sessions run in ephemeral containers; push all work before the session ends.

**Before any request:** identify the applicable skill. If none fits, tell the user which skills are available.

**Ordering:**
- Interactive feature or UI change: `/ux` → `/plan` → `/implement` → `/pr`
- Unclear approach: `/research` → `/plan` → `/implement` → `/pr`
- After `/implement` completes, run `/pr` immediately.

**Always create a PR when code changes are complete** — whether from `/implement` or a direct fix. Run `./scripts/validate` before opening the PR. Do not wait for the user to ask.

| Skill | When to use |
|---|---|
| `/research` | Approach unclear — gather facts before planning |
| `/ux` | User-facing interactive change — write Given/When/Then user stories and build a screenshotted visual prototype before planning |
| `/plan` | Building or changing behaviour — produce a plan, get approval, then implement |
| `/implement` | Approved plan exists — execute task by task |
| `/ui` | Refine component appearance — code, screenshot, iterate |
| `/pr` | Submit completed changes as a pull request |
| `/address-pr-feedback` | Address PR review feedback |
| `/debug` | Diagnose production errors via Vercel logs |
