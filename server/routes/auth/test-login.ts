import { NeonDatabaseService } from '../../../src/services/server/DatabaseService.ts';
import { useRuntimeConfig } from 'nitro/runtime-config';

const TEST_USER = {
  githubId: 0,
  githubLogin: 'test',
  name: 'Test User',
  avatarUrl: 'https://avatars.githubusercontent.com/u/0',
};

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' });
  }

  const { vercelEnv } = useRuntimeConfig();
  if (vercelEnv !== 'preview') {
    throw createError({ statusCode: 403, message: 'Test login is only available in preview environments' });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw createError({ statusCode: 500, message: 'DATABASE_URL is not configured' });

  const db = new NeonDatabaseService(dbUrl);
  const user = await db.upsertUser(TEST_USER.githubId, TEST_USER.githubLogin, TEST_USER.name, TEST_USER.avatarUrl);
  const sessionId = await db.createSession(user.id);

  setCookie(event, 'session', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  setResponseStatus(event, 302);
  setHeader(event, 'location', '/');
  return null;
});
