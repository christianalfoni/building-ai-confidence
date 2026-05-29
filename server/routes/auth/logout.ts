import { NeonDatabaseService } from '../../../src/services/server/DatabaseService.ts';

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'session');
  if (sessionId && process.env.DATABASE_URL) {
    const db = new NeonDatabaseService(process.env.DATABASE_URL);
    await db.deleteSession(sessionId);
  }
  deleteCookie(event, 'session', { path: '/' });
  return sendRedirect(event, '/');
});
