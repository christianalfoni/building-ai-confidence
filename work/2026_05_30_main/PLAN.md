# Preview Test User Sign-In

## Summary

In Vercel preview deployments (PR environments), GitHub OAuth is awkward to test because the OAuth app callback URL must be registered in advance. To solve this, when `VERCEL_ENV=preview`, replace the "Sign in with GitHub" button with a "Sign in as test user" button that hits a dedicated server route. That route creates (or reuses) a hardcoded test user in the database and sets a real session cookie, so the rest of the auth flow behaves identically to production.

## Considerations

**Approach: server route + `VERCEL_ENV` check**
- A new `POST /auth/test-login` route upserts a hardcoded test user (fixed `githubId`, name, avatar) and creates a session, exactly like the OAuth callback does.
- The route is guarded: it refuses with 403 unless `VERCEL_ENV === 'preview'`. This means the route can be deployed to production safely — it simply won't work there.
- `VERCEL_ENV` is set automatically by Vercel; no manual env configuration needed for preview branches.
- The client needs to know whether to show the test-login button. We pass this via `InitialData` (already used for `dbEnabled` and `user`), adding an `isPreview` boolean that the server sets from `process.env.VERCEL_ENV === 'preview'`.

**Alternatives ruled out:**
- Checking `VERCEL_ENV` only on the client (via a public env var) — leaks environment info and requires Vite-time config.
- Skipping the real DB and returning a fake in-memory user — the rest of the app (todos, etc.) expects a real DB-backed user, so using the real `upsertUser`/`createSession` is cleaner.

## Tasks

- [x] Add `isPreview: boolean` to `InitialData` in `src/services/client/DatabaseService.ts`
- [x] Set `isPreview` in `src/entry-server.tsx` from `process.env.VERCEL_ENV === 'preview'`
- [x] Add `server/routes/auth/test-login.ts` — POST handler that upserts a hardcoded test user, creates a session, sets the cookie, and redirects to `/`; returns 403 if not preview env
- [x] Update `src/desktop/components/App.tsx` to show "Sign in as test user" button (posting to `/auth/test-login`) when `!app.user && app.isPreview`, and "Sign in with GitHub" otherwise
- [x] Update `src/mobile/components/App.tsx` with the same conditional sign-in button
- [x] Expose `isPreview` on `AppState` (read from `InitialData`, passed through constructor)

## Report
