import { NeonDatabaseService } from '../../../src/services/server/DatabaseService.ts';

export default defineEventHandler(async (event) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const dbUrl = process.env.DATABASE_URL;
  if (!clientId || !clientSecret) throw createError({ statusCode: 500, message: 'GitHub OAuth env vars are not configured' });
  if (!dbUrl) throw createError({ statusCode: 500, message: 'DATABASE_URL is not configured' });

  const query = getQuery(event);
  const code = query.code as string;
  const state = query.state as string;

  if (!code) throw createError({ statusCode: 400, message: 'Missing code' });

  // Validate CSRF state
  const expectedState = getCookie(event, 'oauth_state');
  deleteCookie(event, 'oauth_state', { path: '/' });
  if (!state || !expectedState || state !== expectedState) {
    throw createError({ statusCode: 400, message: 'Invalid state parameter' });
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  if (!tokenRes.ok) {
    throw createError({ statusCode: 502, message: 'Failed to exchange GitHub OAuth code' });
  }
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    throw createError({ statusCode: 400, message: tokenData.error ?? 'No access token returned' });
  }

  // Fetch GitHub user
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'building-ai-confidence' },
  });
  if (!userRes.ok) {
    throw createError({ statusCode: 502, message: 'Failed to fetch GitHub user' });
  }
  const ghUser = await userRes.json() as { id: number; name: string | null; avatar_url: string; login: string };

  // Persist user + session
  const db = new NeonDatabaseService(dbUrl);
  const user = await db.upsertUser(ghUser.id, ghUser.login, ghUser.name ?? ghUser.login, ghUser.avatar_url);
  const sessionId = await db.createSession(user.id);

  setCookie(event, 'session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  setResponseStatus(event, 302);
  setHeader(event, 'location', '/');
  return null;
});
