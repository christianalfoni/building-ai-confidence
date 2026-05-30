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

  const posts = await db.getPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) throw createError({ statusCode: 404, message: 'Not found' });
  if (post.authorId !== user.id) throw createError({ statusCode: 403, message: 'Forbidden' });

  const body = await readBody(event);
  const fields: { title?: string; body?: string; published?: boolean } = {};
  if (typeof body.title === 'string') fields.title = body.title;
  if (typeof body.body === 'string') fields.body = body.body;
  if (typeof body.published === 'boolean') fields.published = body.published;

  return db.updatePost(id, fields);
});
