# Delete posts & hide test-user posts in production

## Summary
Two related changes to post handling:

1. **Delete posts.** An author can permanently delete one of their own posts from
   the post view. The `delete` action sits next to `edit`, swaps to an inline
   `delete this post?` `yes`/`no` confirm, then issues `DELETE /api/posts/:id`,
   removes the post locally, and navigates home. Server enforces the same
   ownership guard the `PATCH` route uses.

2. **Hide test-user posts in production.** On the live production deployment
   (`VERCEL_ENV === 'production'`), every post authored by the `test` user is
   hidden from everyone — both in the SSR-rendered list and the
   `GET /api/posts` response. Preview deployments are unaffected so the
   test-login flow keeps working.

## Considerations

### Where the test-user filter lives
The two read sites (`src/entry-server.tsx` SSR and `GET /api/posts` in
`server/index.ts`) both call `db.getPosts()` and then apply the same
`published || own-draft` visibility filter. To avoid duplicating the
"which logins are hidden in this environment" decision, the test-login
knowledge is split cleanly:

- **DB layer stays generic.** `getPosts` gains an optional
  `{ hideAuthorLogins?: string[] }`. It joins `users` and excludes posts whose
  author login is in the list. With an empty list (the default) it returns
  everything, so existing callers (`PATCH`/`DELETE` ownership lookups) are
  unaffected. No `test`/env knowledge in the DB layer.
- **Env decision shared in one helper.** A new server-only helper
  `hiddenAuthorLogins()` returns `['test']` when
  `process.env.VERCEL_ENV === 'production'`, else `[]`. Both read sites call
  `db.getPosts({ hideAuthorLogins: hiddenAuthorLogins() })`. The `'production'`
  string and `'test'` login live in exactly one place.

Alternative ruled out: filtering in app code after fetch. Rejected because
`DbPost` carries only `authorId`, not the author login, so app-side filtering
would need a second query to resolve the test user's id. A SQL join is simpler
and keeps the filter authoritative at the source.

Helper placement: `src/services/server/postVisibility.ts` — both call sites
already import from `services/server/`, and it reads `process.env`, so it must
stay off the client bundle (not in the shared `utils.ts`, which the client
imports).

### Inline confirm as a reusable ui-component
The delete/confirm/deleting/error interaction holds local UI state, so per the
layering rules it belongs in `ui-components/` (which own `useState`), not in the
domain `BlogPost`. Desktop and mobile keep independent ui-component trees with
different styling, so each gets its own `DeleteConfirm` primitive. It is
app-agnostic: props are `confirmMessage` and `onConfirm: () => Promise<void>`;
it renders the `delete` button, the `yes`/`no` confirm row, the `deleting…`
disabled state, and the `delete failed — try again` error state. `BlogPost`
passes `() => app.deletePost(id)`.

### Navigation after delete
`AppState.deletePost` mirrors `signOut()` and navigates with
`window.location.href = '/'`, giving a fresh SSR render of the list without the
deleted post. It still splices the post out of `dbPosts` (matching the in-place
mutation style of `updateDbPost`) before navigating. It throws on failure so the
`DeleteConfirm` component can show the error state; a `404` is swallowed in the
client service and treated as success (end state is identical).

No DB migration: the `posts` row is hard-deleted via `DELETE FROM posts`,
matching the existing `deleteSession` pattern.

## Tasks
- [ ] `src/services/index.ts`: add `deletePost(id: string): Promise<void>` to the `DatabaseService` interface.
- [ ] `src/services/server/DatabaseService.ts`: add `deletePost` (`DELETE FROM posts WHERE id = ${id}`); change `getPosts` to accept `{ hideAuthorLogins?: string[] }`, join `users`, and exclude posts whose author login is in the list (`u.github_login <> ALL(${hide}::text[])`, empty list = return all).
- [ ] `src/services/server/postVisibility.ts`: new server-only helper `hiddenAuthorLogins()` returning `['test']` when `VERCEL_ENV === 'production'`, else `[]`.
- [ ] `src/services/client/DatabaseService.ts`: implement `deletePost` calling `DELETE /api/posts/:id`; treat `404` as success, throw on other non-ok responses.
- [ ] `server/index.ts`: add `DELETE /api/posts/:id` mirroring the `PATCH` auth + ownership guard, calling `db.deletePost`; in `GET /api/posts` pass `{ hideAuthorLogins: hiddenAuthorLogins() }` to `getPosts`.
- [ ] `src/entry-server.tsx`: pass `{ hideAuthorLogins: hiddenAuthorLogins() }` to `getPosts` in the SSR render path (remove the now-redundant local `AUTHOR_LOGINS` only if unused afterwards — it is still used for the draft-visibility filter, so keep it).
- [ ] `src/state/AppState.ts`: add `async deletePost(id)` — calls `db.deletePost`, splices the post from `dbPosts`, then `window.location.href = '/'`; throws on failure.
- [ ] `src/desktop/ui-components/DeleteConfirm.tsx`: new primitive with `idle → confirm → deleting → error` states, props `{ confirmMessage, onConfirm }`, terminal-styled, red accent on `yes`.
- [ ] `src/mobile/ui-components/DeleteConfirm.tsx`: mobile-styled equivalent (touch targets, card-friendly).
- [ ] `src/desktop/components/BlogPost.tsx`: render `DeleteConfirm` next to `edit` in the footer action row, gated by `app.isAuthor && dbMatch.authorId === app.user?.id`.
- [ ] `src/mobile/components/BlogPost.tsx`: render `DeleteConfirm` next to `edit`, same gate.
- [ ] Add stories for `DeleteConfirm` (desktop + mobile) covering idle/confirm/deleting/error so it can be screenshotted via `./scripts/screenshot`.
- [ ] Verify: `npm run lint` and `npx tsc --noEmit` pass.

## Report
```
