# Neon Database + GitHub Auth

## Summary

Add persistent storage via Neon (serverless Postgres) and user identity via GitHub OAuth. Users sign in with GitHub; their identity maps to a `user_id` foreign key on all user-owned data. Some data is user-private (filtered by `user_id`), other data is public (no filter). Sessions are stored in a `sessions` table in Neon and carried by an opaque UUID session cookie (httpOnly, not signed — the UUID is the secret).

The current `StorageService` (localStorage / in-memory) is replaced by a `DatabaseService` that talks to Neon. The `AppState` is extended to hold the authenticated user and expose sign-in/sign-out. Two new Nitro server routes handle the OAuth flow.

## Considerations

**Auth approach:** Auth.js was ruled out — it has no Nitro adapter and is built around Next.js conventions. Neon Auth (Stack Auth) was ruled out — it adds a third-party SDK for a flow that's simple to own. Manual GitHub OAuth (~50 lines across two routes) gives full control with no extra dependencies.

**Session storage:** Sessions table in Neon rather than JWT cookies — easier to invalidate, no secret-rotation complexity, trivially auditable.

**Database client:** `@neondatabase/serverless` — the official Neon driver, edge-compatible, works in Nitro's edge runtime. No ORM; raw SQL keeps the dependency surface small.

**StorageService vs DatabaseService:** The existing `StorageService` interface only handles key/value blobs and is not expressive enough for relational queries. We introduce a `DatabaseService` that exposes typed query methods alongside the existing `StorageService`. Both remain in `services/index.ts`.

**Rehydration pattern:** Mirrors the existing server/client service split. The server `NeonDatabaseService` queries Neon directly and populates `AppState`; `entry-server.tsx` then serializes that initial state into the HTML as `window.__INITIAL_DATA__`. On the client, `ApiDatabaseService` is initialized with that payload (no extra round-trip on first load) and for all subsequent reads/writes calls Nitro API routes, which proxy to Neon on the server. Neon credentials never reach the browser.

## Tasks

### Infrastructure
- [x] Install `@neondatabase/serverless` package
- [x] Add `DATABASE_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `APP_URL` to `.env` (document in `.env.example`). `SESSION_SECRET` was omitted — sessions use an opaque UUID stored server-side, no signing required.
- [x] Add `DatabaseService` interface to `src/services/index.ts` with typed query methods (alongside existing `StorageService`)
- [x] Create `NeonDatabaseService` in `src/services/server/DatabaseService.ts` — queries Neon directly
- [x] Create `ApiDatabaseService` in `src/services/client/DatabaseService.ts` — calls Nitro API routes; initialized from `window.__INITIAL_DATA__`
- [x] Serialize `AppState` initial data into `window.__INITIAL_DATA__` in `entry-server.tsx`
- [x] Create Nitro API routes that mirror each `DatabaseService` method (used by `ApiDatabaseService`)
- [x] Create DB schema: `users` (id, github_id, name, avatar_url, created_at) and `sessions` (id, user_id, created_at, expires_at) tables — as a `scripts/db-migrate` script using raw SQL

### Auth routes (Nitro server routes)
- [x] Add `GET /auth/github` route — builds the GitHub OAuth redirect URL and responds with a redirect
- [x] Add `GET /auth/callback` route — exchanges the code for a GitHub token, fetches the GitHub user, upserts into `users`, creates a `sessions` row, sets a `session` cookie, redirects to `/`
- [x] Add `POST /auth/logout` route — deletes the session row, clears the cookie, redirects to `/`

### Session resolution in SSR
- [x] Read and validate the `session` cookie in `entry-server.tsx`, look up the session in Neon, attach the resolved `user` (or `null`) to the request context passed into `AppState`

### State & context
- [x] Extend `Services` to include `DatabaseService` (optional — only present on server)
- [x] Add `user: User | null` field to `AppState` (set from constructor, not reactive-mutated)
- [x] Add `signOut()` method to `AppState` that posts to `/auth/logout` and clears local user state
- [x] Expose `user` through `AppContext` / `useApp()`

### UI
- [x] Add a sign-in button (desktop + mobile) that links to `/auth/github` when `user` is null
- [x] Add a user avatar + sign-out button (desktop + mobile) when `user` is non-null

## Report

All tasks completed. Key decisions and deviations:

- `Todo` type moved from `AppState.ts` to `services/index.ts` so it is shared between server and client service layers; re-exported from `AppState.ts` for backwards compatibility.
- All mutating `AppState` methods (`addTodo`, `toggleTodo`, `editTodo`, `commitEdit`, `submitNewTodo`, `deleteTodo`) were made `async` to support the DB path; tests updated accordingly.
- ESLint config extended with `argsIgnorePattern: "^_"` to support the standard `_`-prefix convention for intentionally unused interface-conformance parameters.
- `entry-server.tsx` gets a file-level `react-refresh` disable comment since it's a server entry point, not a hot-reloadable component module.
- The "close timed out" Vitest warning is pre-existing and unrelated to these changes.

Lint: ✅ 0 errors  
Tests: ✅ 13/13 passed
