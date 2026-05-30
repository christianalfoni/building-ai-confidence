import { NeonDatabaseService } from '../../../../src/services/server/DatabaseService.ts';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw createError({ statusCode: 500, message: 'DATABASE_URL is not configured' });

  const db = new NeonDatabaseService(dbUrl);
  const sessionId = getCookie(event, 'session');
  const user = sessionId ? await db.getUser(sessionId) : null;

  const body = await readBody(event) as { text?: unknown };
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) throw createError({ statusCode: 400, message: 'text is required' });

  return db.createTodo(user?.id ?? null, text);
});
