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
    try {
      await db.deleteTodo(id, user?.id ?? null);
    } catch {
      throw createError({ statusCode: 404, message: 'Todo not found or permission denied' });
    }
    return null;
  }

  // PATCH — validate body fields before touching the DB
  const raw = await readBody(event) as Record<string, unknown>;
  const patch: { text?: string; completed?: boolean } = {};
  if ('text' in raw) {
    if (typeof raw.text !== 'string' || !raw.text.trim()) {
      throw createError({ statusCode: 400, message: 'text must be a non-empty string' });
    }
    patch.text = raw.text.trim();
  }
  if ('completed' in raw) {
    if (typeof raw.completed !== 'boolean') {
      throw createError({ statusCode: 400, message: 'completed must be a boolean' });
    }
    patch.completed = raw.completed;
  }

  try {
    return await db.updateTodo(id, patch, user?.id ?? null);
  } catch {
    throw createError({ statusCode: 404, message: 'Todo not found or permission denied' });
  }
});
