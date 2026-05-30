import { NeonDatabaseService } from '../../../../src/services/server/DatabaseService.ts';

const ALLOWED_LOGINS = ['christianalfoni', 'test'];

export default defineEventHandler(async (event) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw createError({ statusCode: 500, message: 'DATABASE_URL is not configured' });

  const db = new NeonDatabaseService(dbUrl);

  if (event.method === 'GET') {
    const sessionId = getCookie(event, 'session');
    const user = sessionId ? await db.getUser(sessionId) : null;
    const all = await db.getPosts();
    return all.filter(
      (p) => p.published || (user && ALLOWED_LOGINS.includes(user.githubLogin) && p.authorId === user.id)
    );
  }

  if (event.method === 'POST') {
    const sessionId = getCookie(event, 'session');
    if (!sessionId) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const user = await db.getUser(sessionId);
    if (!user || !ALLOWED_LOGINS.includes(user.githubLogin)) {
      throw createError({ statusCode: 403, message: 'Forbidden' });
    }

    return db.createPost(user.id);
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' });
});
