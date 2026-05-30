import { NeonDatabaseService } from '../../../../src/services/server/DatabaseService.ts';

export default defineEventHandler(async (event) => {
  if (event.method !== 'PATCH' && event.method !== 'DELETE') {
    throw createError({ statusCode: 405, message: 'Method not allowed' });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw createError({ statusCode: 500, message: 'DATABASE_URL is not configured' });

  const db = new NeonDatabaseService(dbUrl);
  const sessionId = getCookie(event, 'session');
  const user = sessionId ? await db.getUser(sessionId) : null;
  const id = getRouterParam(event, 'id')!;

  if (event.method === 'DELETE') {
    await db.deleteTodo(id, user?.id ?? null);
    return null;
  }

  const body = await readBody(event) as { text?: string; completed?: boolean };
  return db.updateTodo(id, body, user?.id ?? null);
});
