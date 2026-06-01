// Author logins whose posts are hidden from everyone in the current environment.
// The `test` user only exists to exercise the preview test-login flow, so its
// posts must never surface on the live production deployment. Preview and dev
// keep them visible. Server-only: reads process.env, so it must not be imported
// by the client bundle.
export function hiddenAuthorLogins(): string[] {
  return process.env.VERCEL_ENV === 'production' ? ['test'] : [];
}
