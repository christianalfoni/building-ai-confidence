# Blog Post Authoring

## Summary

Add the ability for authorized users (GitHub logins `christianalfoni` and `test`) to create and edit blog posts. Posts are stored in a new `posts` DB table. The existing hardcoded post in `src/data/posts.ts` stays as-is; DB posts are listed alongside it. The editor page is minimal: a styled `contenteditable` body and a plain `<input>` title, both debounce-saving to the DB. A publish toggle controls visibility to non-authors.

## Considerations

**Auth check location:** The "can author" check is a simple login comparison (`user.githubLogin === 'christianalfoni' || user.githubLogin === 'test'`). This lives in `AppState` as a getter so components stay clean. The `User` type needs a `githubLogin` field added (it currently only stores `githubId`, `name`, `avatarUrl`).

**Editor vs read view:** The spec says the editor should look like the reading view. This means title renders as a large heading-style `<input>` and body as a `contenteditable` div matching the post body typography, rather than a generic textarea. A "Publish" toggle sits in the footer bar where the "← cd .." back button normally lives.

**Routing:** The app currently uses in-state navigation (`selectedPostSlug`). We'll extend `AppState` with a `view` discriminant: `'list' | 'post' | 'editor'`. The editor also needs the current draft post's id/slug.

**DB posts vs hardcoded posts:** The list merges hardcoded posts (always shown) with DB posts filtered by: published=true OR current user is author. This way the author sees their drafts; visitors don't.

**Debounce:** 800ms debounce on title and body inputs, firing a `PATCH /api/posts/:id` request.

**New post creation:** Clicking the "+ new post" placeholder calls `POST /api/posts` which creates an empty draft row and returns its id. The client immediately navigates to the editor view with that id.

**Slug generation:** Derived from the title on save (server-side, slugified). If title is empty, slug defaults to the post id.

## Tasks

- [ ] Add `githubLogin` to the `User` type in `src/services/index.ts` and persist it in `NeonDatabaseService.upsertUser` + the `users` table schema
- [ ] Run `scripts/db-migrate` to apply schema changes (users table `github_login` column + new `posts` table)
- [ ] Extend `DatabaseService` interface with `getPosts`, `getPost`, `createPost`, `updatePost`
- [ ] Implement the new methods in `NeonDatabaseService` (server)
- [ ] Add `ApiDatabaseService` client stubs that call the new API routes
- [ ] Add Nitro routes: `POST /api/posts`, `PATCH /api/posts/:id`, `GET /api/posts`
- [ ] Extend `AppState`: add `isAuthor` getter, `view` discriminant (`'list' | 'post' | 'editor'`), `draftPostId`, `openEditor(id)`, `createPost()` action
- [ ] Update `entry-server.tsx` and `entry-client.tsx` to pass posts initial data through the hidden div
- [ ] Desktop `BlogList`: show "+ new post" entry at top when `app.isAuthor`; merge hardcoded + DB posts
- [ ] Desktop `BlogEditor`: title `<input>`, `contenteditable` body, publish toggle in footer, debounce saving
- [ ] Desktop `App.tsx`: render `BlogEditor` when `app.view === 'editor'`
- [ ] Mobile: mirror the same changes in `mobile/components/`

## Report
