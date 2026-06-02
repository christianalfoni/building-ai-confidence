# Services object refactor: preloaded session + database services

## Summary

`AppState` is constructed with positional args `(user, isPreview, dbPosts,
db, route)`. The server (`entry-server.tsx`) manually resolves the user and
posts from Neon, filters them, and passes plain data plus `db: null` into
`AppState`. The client (`entry-client.tsx`) reads the same data from the
embedded `__initial_data__` JSON and passes a live `ApiDatabaseService`.

This plan makes the two paths symmetric. `AppState` receives a single
`services` object — `{ session, database, navigation }` — and reads
everything (`user`, `isPreview`, `posts`, `route`) from those services. The
server builds **real** session and database services that talk to Neon via a
`preload()` step; the client builds the same-shaped services already hydrated
from the embedded JSON. The React render path is then identical on both sides —
"the app renders with a session and database service with state intact, it was
just loaded differently."

## Considerations

**The Neon gateway is server plumbing, not a service.** `NeonDatabaseService`
is the raw SQL gateway (`upsertUser`, `createSession`, `deleteSession`,
`getUser`, posts CRUD) and is used only on the server — by the auth/API route
handlers and by SSR. It does not belong in the shared `src/services/` tree
(which `state` imports on both client and server). It moves to
**`server/neon.ts`**, renamed `NeonDatabase`, as a plain concrete class (no
`implements DatabaseService`). The route handlers import it from there; the
route layer is otherwise untouched.

**App-facing services wrap an injected gateway.** The server-side
`SessionService`/`DatabaseService` implementations receive a `NeonDatabase`
instance (or `null`) from the composition root (`entry-server.tsx`) rather than
constructing one, so `src/services/server/` depends on the gateway only as a
type. As a result the app-facing `DatabaseService` interface that `AppState`
consumes shrinks to what the app actually needs — a loaded `posts` snapshot, a
`preload()`, and the three mutations (`createPost`, `updatePost`,
`deletePost`). The raw user/session/getPost methods stay on the `NeonDatabase`
gateway only.

**`preload()` is the loading seam.** Both `SessionService` and
`DatabaseService` expose `preload(): Promise<void>`. The server implementations
query Neon (session resolves the user from the cookie; database loads the
visible/filtered posts using the resolved user). The client implementations are
constructed already-loaded from `InitialData`, so their `preload()` is a no-op —
the client hydrates synchronously and never awaits. This is what makes the data
"loaded differently" while consumed identically.

**Load order on the server.** `session.preload()` runs first (resolves the
user); `database.preload()` runs next and uses `session.user` to filter
unpublished posts (current SSR behaviour). The server database service holds a
reference to the session service for this.

**`AppState` constructor collapses to `(services)`.** `user`/`isPreview` come
from `session`, `posts` from `database`, `route` from `navigation`. `AppState`
still copies `posts` into its own reactive `dbPosts` array (copied, not
aliased, so its optimistic `updateDbPost`/`splice` mutations don't reach into
the service). `view` remains a mutable reactive field seeded from the route.

**Redirects move to navigation.** `signOut()` becomes `await
session.signOut(); navigation.navigate('/')`; `deletePost` ends with
`navigation.navigate('/')` instead of touching `window.location`. Server
implementations of `signOut`/`navigate` throw (browser-only), mirroring how the
client gateway throws on server-only methods; they are never called during SSR.
This also lets the `deletePost` test assert on a fake navigation spy instead of
monkey-patching `window.location`.

**`main.tsx` is dead code** — not referenced by `index.html` or any import
(the SSR entries replaced it). It will be removed rather than carried forward
under the new signature.

## Tasks

- [ ] Reshape `src/services/index.ts`: repurpose `DatabaseService` to the
      app-facing shape (`readonly posts`, `preload()`, `createPost`,
      `updatePost`, `deletePost`); add `SessionService` (`readonly user`,
      `readonly isPreview`, `preload()`, `signOut()`), `NavigationService`
      (`readonly route`, `navigate(path)`), and a `Services` type
      (`{ session; database; navigation }`).
- [ ] Move the Neon gateway out of the services tree: create `server/neon.ts`
      exporting `NeonDatabase` (the existing SQL class, sans
      `implements DatabaseService`, signatures unchanged), delete the gateway
      from `src/services/server/DatabaseService.ts`, and update the imports in
      `server/routes/auth.ts` and `server/routes/api.ts` to
      `../neon.js` / `NeonDatabase`.
- [ ] Server services in `src/services/server/`: `ServerDatabaseService`
      (constructed with an injected `NeonDatabase | null` + the session +
      `hideAuthorLogins`; `preload()` loads & filters posts; mutations delegate
      to the gateway) and `ServerSessionService` (injected `NeonDatabase | null`
      + session cookie + `isPreview`; `preload()` resolves the user; `signOut()`
      throws).
- [ ] Add `src/services/server/NavigationService.ts` —
      `ServerNavigationService(route)`, `navigate()` throws.
- [ ] Client services in `src/services/client/`: reshape `ApiDatabaseService`
      to the new interface (constructor takes `InitialData` → `posts`,
      `preload()` no-op, fetch-based mutations; drop the server-only methods);
      add `BrowserSessionService` (`user`/`isPreview` from `InitialData`,
      `preload()` no-op, `signOut()` → POST `/auth/logout`) and
      `BrowserNavigationService` (`route` from
      `parseRoute(window.location.pathname)`, `navigate` →
      `window.location.href`).
- [ ] Refactor `src/state/AppState.ts`: constructor `(services: Services)`;
      seed `user`/`isPreview` from `session`, `dbPosts` (copied) from
      `database`, `view`/`selectedPostId` from `navigation.route`; route the
      mutations through `services.database`; replace `window.location` usage in
      `deletePost`/`signOut` with `services.navigation.navigate('/')`.
- [ ] Update `src/entry-server.tsx`: build the `NeonDatabase` gateway (or
      `null`) from `server/neon.ts`, inject it into the three server services,
      `await session.preload()` then `await database.preload()`, construct
      `AppState({ ... })`, and build the embedded `InitialData` from
      `session.user` / `database.posts`.
- [ ] Update `src/entry-client.tsx`: construct the three browser services from
      `InitialData` and pass `AppState({ session, database, navigation })`
      (synchronous hydration, no await).
- [ ] Remove the unused `src/main.tsx`.
- [ ] Update `src/test-utils.tsx` with fake session/database/navigation
      services and a flexible `createAppState(opts)` helper.
- [ ] Rewrite `src/state/AppState.test.ts` for the `services`-object
      constructor; assert on a fake navigation service in the `deletePost`
      tests instead of stubbing `window.location`.
- [ ] Run `./scripts/validate` (lint, type-check, tests) and fix any fallout.

## Report
