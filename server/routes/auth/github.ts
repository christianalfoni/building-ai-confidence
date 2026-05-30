import { randomBytes } from 'node:crypto';

export default defineEventHandler((event) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) throw createError({ statusCode: 500, message: 'GITHUB_CLIENT_ID is not configured' });

  const state = randomBytes(16).toString('hex');
  setCookie(event, 'oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  const redirectUri = `${process.env.APP_URL ?? 'http://localhost:5173'}/auth/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user&state=${state}`;
  return sendRedirect(event, url);
});
