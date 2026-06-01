# Post navigation via URL (`/` and `/posts/:id`)

## Summary
Give the posts list and individual posts real, server-rendered URLs:

- `/` → posts list (SSR)
- `/posts/:id` → a single post by its **database id** (SSR)

Navigation between them is a **full browser navigation** (real `<a href>`, the
server re-renders). Direct loads and refreshes of `/posts/:id` are SSR'd. A
missing or non-visible post renders the post page with a large in-page
**"404 — not found"** and the server responds with HTTP 404. The editor (new /
edit) stays an in-memory view layered on the current URL — it gets no route.

Slug-based URLs, slug history, and any rework of the editing experience are
explicitly deferred to a later PR.

## Considerations

**Identifier in the URL.** We use the post `id`, not the slug. The slug is
regenerated from the title on every edit (`slugify(title)`), so slug-based URLs
would silently break on title changes and need slug history to stay stable.
That's deferred; `id` is stable and unambiguous.

**Navigation mechanism.** Full page reloads, not client-side SPA transitions.
This keeps the change small and leans on the existing SSR path: the catch-all
`app.get('/{*path}')` in `server/index.ts` already routes every non-`/api`,
non-`/auth` GET into `render()`, so `/posts/:id` already reaches SSR — we only
need `render()` to *vary by URL*. List rows and the post "back" control become
real anchors; no history/popstate handling required.

**Single source of route truth.** A shared `parseRoute(pathname)` helper
(in `src/utils.ts`) maps a path to `{ view, postId }`. Both `entry-server`
(`req.path`) and `entry-client` (`window.location.pathname`) call it, so the
SSR and hydration trees derive the same view from the same embedded `posts`
data — no hydration mismatch. `/posts` / `/posts/` with no id resolve to the
list.

**Not-found.** `AppState` exposes a `selectedPost` getter (find by
`selectedPostId`) and a `postNotFound` getter (`view === 'post' && selectedPostId
&& !selectedPost`). `BlogPost` renders the 404 block when `postNotFound`;
`entry-server` reads the same condition to set `res.statusCode = 404` in
`onShellReady`. Because the visible-post filter already runs before `posts` is
embedded, another author's draft is simply absent from `posts` and naturally
yields a 404 for non-authors — no extra auth logic in the view.

**Two "back" actions diverge.** Post-page back becomes a link to `/` (full
reload to the list). Editor back must *not* reload — it returns to the base view
of the current URL in-memory. So `goBack()` is replaced by `closeEditor()`,
which sets `view` to `'post'` when `selectedPostId` is set, else `'list'`.
`selectPost()` is removed (navigation is now an anchor).

**Reusable UI.** The two "back" anchors and the 404 block are small and
platform-specific (desktop dense vs mobile touch styling differs), so they stay
inline in each platform's `BlogPost`/editor rather than becoming shared
`ui-components` — extracting them would fight the existing per-platform styling.

## Tasks

- [ ] Add `parseRoute(pathname): { view: 'list' | 'post'; postId: string | null }` to `src/utils.ts` (matches `/posts/:id`; `/`, `/posts`, `/posts/` → list).
- [ ] `AppState`: replace `selectedPostSlug` with `selectedPostId`; accept an initial route in the constructor; init `view`/`selectedPostId` from it; add `selectedPost` and `postNotFound` getters; remove `selectPost`; replace `goBack()` with `closeEditor()` (returns to post or list based on `selectedPostId`).
- [ ] `entry-server.tsx`: parse the route from `req.path`, construct `AppState` with it, and set `res.statusCode = 404` in `onShellReady` when the route is a post that isn't in the visible `posts`.
- [ ] `entry-client.tsx`: parse the route from `window.location.pathname` and pass it to `AppState`.
- [ ] Desktop `BlogList`: render each row as `<a href={`/posts/${id}`}>` (carry `id` through `dbPostToPost`); keep the "new post…" button calling `createPost()`.
- [ ] Desktop `BlogPost`: match by `selectedPostId`; render the in-page 404 block when `postNotFound`; turn "cd .." into a link to `/`; keep "edit" → `openEditor`.
- [ ] Desktop `App.tsx`: derive the title-bar text from the selected post (id/title) instead of `selectedPostSlug`.
- [ ] Desktop `BlogEditor`: change "cd .." from `goBack()` to `closeEditor()`.
- [ ] Mobile `BlogList`, `BlogPost`, `BlogEditor`: mirror the desktop changes (anchors, `selectedPostId`, in-page 404, `closeEditor`).
- [ ] Update `AppState.test.ts` for the renamed field/methods; add tests for route-driven init and the `selectedPost` / `postNotFound` getters.
- [ ] Run `npm run lint` and `npx tsc --noEmit`; verify SSR for `/`, `/posts/:id`, and an unknown id (expect 404) via the dev server.

## Report
```
```
