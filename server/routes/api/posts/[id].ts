import { NeonDatabaseService } from '../../../../src/services/server/DatabaseService.ts';

const ALLOWED_LOGINS = ['christianalfoni', 'test'];

export default defineEventHandler(async (event) => {
  if (event.method !== 'PATCH') throw createError({ statusCode: 405, message: 'Method not allowed' });

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw createError({ statusCode: 500, message: 'DATABASE_URL is not configured' });

  const sessionId = getCookie(event, 'session');
  if (!sessionId) throw createError({ statusCode: 401, message: 'Unauthorized' });

  const db = new NeonDatabaseService(dbUrl);
  const user = await db.getUser(sessionId);
  if (!user || !ALLOWED_LOGINS.includes(user.githubLogin)) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }

  const id = getRouterParam(event, 'id')!;
  const body = await readBody(event);

  return db.updatePost(id, body);
});
