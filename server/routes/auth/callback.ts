import { NeonDatabaseService } from '../../../src/services/server/DatabaseService.ts';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code as string;
  if (!code) throw createError({ statusCode: 400, message: 'Missing code' });

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const { access_token } = await tokenRes.json() as { access_token: string };

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'building-ai-confidence' },
  });
  const ghUser = await userRes.json() as { id: number; name: string; avatar_url: string; login: string };

  const db = new NeonDatabaseService(process.env.DATABASE_URL!);
  const user = await db.upsertUser(ghUser.id, ghUser.name ?? ghUser.login, ghUser.avatar_url);
  const sessionId = await db.createSession(user.id);

  setCookie(event, 'session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return sendRedirect(event, '/');
});
