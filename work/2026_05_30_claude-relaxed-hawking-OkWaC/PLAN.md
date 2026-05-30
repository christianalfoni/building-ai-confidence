# Blog Post Authoring + Nitro → Express Migration

## Summary

Add the ability for authorized users (GitHub logins `christianalfoni` and `test`) to create and edit blog posts. Posts are stored in a new `posts` DB table. The existing hardcoded post in `src/data/posts.ts` stays as-is; DB posts are listed alongside it. The editor page is minimal: a styled `contenteditable` body and a plain `<input>` title, both debounce-saving to the DB. A publish toggle controls visibility to non-authors.

Additionally, migrate the server from Nitro to a plain Express app to eliminate the file-based routing magic, auto-import footguns, and broken redirect behaviour discovered during implementation.

## Considerations

**Auth check location:** The "can author" check is a simple login comparison (`user.githubLogin === 'christianalfoni' || user.githubLogin === 'test'`). This lives in `AppState` as a getter so components stay clean. The `User` type needs a `githubLogin` field added (it currently only stores `githubId`, `name`, `avatarUrl`).

**Editor vs read view:** The spec says the editor should look like the reading view. This means title renders as a large heading-style `<input>` and body as a `contenteditable` div matching the post body typography, rather than a generic textarea. A "Publish" toggle sits in the footer bar where the "← cd .." back button normally lives.

**Routing:** The app currently uses in-state navigation (`selectedPostSlug`). We'll extend `AppState` with a `view` discriminant: `'list' | 'post' | 'editor'`. The editor also needs the current draft post's id/slug.

**DB posts vs hardcoded posts:** The list merges hardcoded posts (always shown) with DB posts filtered by: published=true OR current user is author. This way the author sees their drafts; visitors don't.

**Debounce:** 800ms debounce on title and body inputs, firing a `PATCH /api/posts/:id` request.

**New post creation:** Clicking the "+ new post" placeholder calls `POST /api/posts` which creates an empty draft row and returns its id. The client immediately navigates to the editor view with that id.

**Slug generation:** Derived from the title on save (server-side, slugified). If title is empty, slug defaults to the post id.

**Express migration rationale:** Nitro caused three separate production bugs — `serverDir` defaulting to `false` (all routes silently dropped), `sendRedirect` returning a non-standard class that serialises as 200, and `useRuntimeConfig()` not picking up `VERCEL_ENV`. Plain Express puts all routes in one file with no magic: `app.post('/auth/test-login', ...)` is explicit and debuggable.

**Express on Vercel:** Vercel supports a Node.js serverless function as a catch-all. We export the Express app from `api/index.ts` and add a `vercel.json` that rewrites all traffic to it. Static assets (Vite client build) go to `public/` and are served by Vercel's CDN before the function is reached — so the function only handles API routes and SSR.

**SSR in Express:** `entry-server.tsx` currently exports a Nitro-style `{ fetch(request) }` handler. We'll change it to export a plain `render(req, res)` Express middleware that uses `renderToPipeableStream` (Node.js streams) instead of `renderToReadableStream` (Web streams). This avoids stream conversion hacks.

**Build:** Remove the `nitro()` Vite plugin. The build becomes: `vite build` (client → `dist/client/`) + `vite build --ssr src/entry-server.tsx` (server bundle → `dist/server/`). A `vercel-build` script copies `dist/client/` to `public/` so Vercel serves it as static. The Vercel function in `api/index.ts` imports the SSR bundle at runtime.

## Tasks

- [x] Add `githubLogin` to the `User` type in `src/services/index.ts` and persist it in `NeonDatabaseService.upsertUser` + the `users` table schema
- [x] Run `scripts/db-migrate` to apply schema changes (users table `github_login` column + new `posts` table)
- [x] Extend `DatabaseService` interface with `getPosts`, `getPost`, `createPost`, `updatePost`
- [x] Implement the new methods in `NeonDatabaseService` (server)
- [x] Add `ApiDatabaseService` client stubs that call the new API routes
- [x] Extend `AppState`: add `isAuthor` getter, `view` discriminant (`'list' | 'post' | 'editor'`), `draftPostId`, `openEditor(id)`, `createPost()` action
- [x] Update `entry-server.tsx` and `entry-client.tsx` to pass posts initial data through the hidden div
- [x] Desktop `BlogList`: show "+ new post" entry at top when `app.isAuthor`; merge hardcoded + DB posts
- [x] Desktop `BlogEditor`: title `<input>`, `contenteditable` body, publish toggle in footer, debounce saving
- [x] Desktop `App.tsx`: render `BlogEditor` when `app.view === 'editor'`
- [x] Mobile: mirror the same changes in `mobile/components/`
- [ ] Install Express (`express`, `@types/express`); remove `nitro` from dependencies
- [ ] Remove `nitro.config.ts` and the `nitro()` plugin from `vite.config.ts`
- [ ] Rewrite `src/entry-server.tsx` to export an Express middleware using `renderToPipeableStream`
- [ ] Create `server/index.ts` — Express app with all routes wired explicitly (auth, API, SSR catch-all)
- [ ] Create `api/index.ts` — Vercel function entry that imports and exports the Express app
- [ ] Add `vercel.json` — rewrite all traffic to `/api/index`
- [ ] Update `vite.config.ts` — remove Nitro plugin, add SSR build entry for `src/entry-server.tsx`
- [ ] Update `package.json` build scripts — client build + SSR build + copy to `public/`
- [ ] Delete `server/routes/` directory (all routes now in `server/index.ts`)
- [ ] Verify local build and smoke-test SSR + auth routes

## Report
