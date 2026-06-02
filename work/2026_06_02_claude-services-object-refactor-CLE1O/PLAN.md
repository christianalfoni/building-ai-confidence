# Services object refactor: SessionService + NavigationService

## Summary

`AppState` is currently constructed with positional arguments
`(user, isPreview, dbPosts, db, route)`, which mixes infrastructure (the
`db` service) with raw data and with concerns that are really infrastructure
in disguise: the **user/session** (`signOut()` does `fetch('/auth/logout')`
then `window.location.href = '/'`) and the **route/navigation** (the route is
parsed and injected, and `deletePost`/`signOut` redirect via
`window.location.href`).

This plan introduces two new services — a `SessionService` (owns the user,
the preview flag, and sign-out) and a `NavigationService` (owns the route and
navigation/redirects) — alongside the existing `DatabaseService`, and changes
`AppState` to receive all three as a single `services` object. This follows
the project's `services → state` layering: infrastructure lives behind service
interfaces in `services/index.ts`, with browser implementations in
`services/client/` and Node implementations in `services/server/`.

## Considerations

**Single services object vs. positional args.** The whole point of the
request is to stop threading individual dependencies positionally. The new
constructor becomes `constructor(services: Services, init: { dbPosts? })`,
where `Services = { database, session, navigation }`. `user`, `isPreview` and
`route` are no longer constructor data — they are read from the session and
navigation services at construction time.

**Where `user`/`isPreview`/`route` live.** `user` and `isPreview` both drive
the auth/sign-in UI, so they belong together on `SessionService`. `route`
belongs on `NavigationService`. `AppState` copies the initial `view` /
`selectedPostId` / `user` / `isPreview` into reactive fields (as today) so
reactivity semantics are unchanged — `view` is still mutated by
`openEditor`/`closeEditor`.

**`database` stays nullable.** The server intentionally passes `null` for the
database because SSR is read-only, and `AppState`'s mutation methods guard on
`if (!this.database)`. Keeping `database: DatabaseService | null` in the
`Services` type preserves that behaviour with zero risk, rather than inventing
a server-side null-object database. Session and navigation are always present
(both client and server supply real implementations).

**Redirects move into navigation.** `signOut` becomes
`await session.signOut(); navigation.navigate('/')` and `deletePost` uses
`navigation.navigate('/')` instead of touching `window.location` directly.
This makes `AppState` fully testable with fake services — the `deletePost`
test no longer needs to monkey-patch `window.location`; it asserts on a fake
navigation spy instead.

**Server implementations throw on interactive methods.** `ServerSessionService`
and `ServerNavigationService` provide the user/route for SSR but throw from
`signOut()`/`navigate()`, mirroring the existing pattern where the client
`DatabaseService` throws from server-only methods. These are never called
during SSR.

## Tasks

- [ ] Add `SessionService` + `NavigationService` interfaces and a `Services`
      type (`{ database: DatabaseService | null; session: SessionService;
      navigation: NavigationService }`) to `src/services/index.ts`.
- [ ] Add browser implementations: `src/services/client/SessionService.ts`
      (`BrowserSessionService` — user/isPreview from `InitialData`, `signOut()`
      → `fetch('/auth/logout', { method: 'POST' })`) and
      `src/services/client/NavigationService.ts` (`BrowserNavigationService` —
      `route` from `parseRoute(window.location.pathname)`, `navigate(path)` →
      `window.location.href = path`).
- [ ] Add server implementations: `src/services/server/SessionService.ts`
      (`ServerSessionService(user, isPreview)`) and
      `src/services/server/NavigationService.ts`
      (`ServerNavigationService(route)`), both throwing from the interactive
      methods.
- [ ] Refactor `src/state/AppState.ts`: constructor `(services: Services,
      init: { dbPosts?: DbPost[] })`; read `user`/`isPreview` from
      `services.session`, `view`/`selectedPostId` from
      `services.navigation.route`; route `createPost`/`savePost`/`deletePost`
      through `services.database`; replace `window.location` usage in
      `deletePost`/`signOut` with `services.navigation.navigate('/')`.
- [ ] Update `src/entry-client.tsx` to construct the three browser services and
      pass `new AppState({ database, session, navigation }, { dbPosts })`.
- [ ] Update `src/entry-server.tsx` to construct the server services
      (`database: null`, `ServerSessionService`, `ServerNavigationService`) and
      pass them.
- [ ] Update `src/main.tsx` (standalone dev entry) to construct browser
      services for the new signature.
- [ ] Update `src/test-utils.tsx` with fake service factories and a flexible
      `createAppState(opts)` helper for stories/tests.
- [ ] Rewrite `src/state/AppState.test.ts` for the new constructor; replace the
      `window.location` stubbing in the `deletePost` tests with assertions on a
      fake navigation service.
- [ ] Run `./scripts/validate` (lint, type-check, tests) and fix any fallout.

## Report
