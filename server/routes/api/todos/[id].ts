import { NeonDatabaseService } from '../../../../src/services/server/DatabaseService.ts';

export default defineEventHandler(async (event) => {
  const db = new NeonDatabaseService(process.env.DATABASE_URL!);
  const id = getRouterParam(event, 'id')!;

  if (event.method === 'DELETE') {
    await db.deleteTodo(id);
    return null;
  }

  const body = await readBody(event) as { text?: string; completed?: boolean };
  return db.updateTodo(id, body);
});
