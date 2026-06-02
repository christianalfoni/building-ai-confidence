export const ALLOWED_LOGINS = ['christianalfoni', 'test'];

export function parseCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Author logins whose posts are hidden from everyone in the current environment.
// The `test` user only exists to exercise the preview test-login flow, so its
// posts must never surface on the live production deployment.
export function hiddenAuthorLogins(): string[] {
  return process.env.VERCEL_ENV === 'production' ? ['test'] : [];
}
