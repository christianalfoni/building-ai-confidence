import { NeonDatabaseService } from '../../../../src/services/server/DatabaseService.ts';

export default defineEventHandler(async (event) => {
  const db = new NeonDatabaseService(process.env.DATABASE_URL!);
  const sessionId = getCookie(event, 'session');
  const user = sessionId ? await db.getUser(sessionId) : null;
  const body = await readBody(event) as { text: string };
  return db.createTodo(user?.id ?? null, body.text);
});
