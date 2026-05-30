import { neon } from '@neondatabase/serverless';
import type { DatabaseService, User, Todo } from '../index.ts';

export class NeonDatabaseService implements DatabaseService {
  private sql: ReturnType<typeof neon>;

  constructor(connectionString: string) {
    this.sql = neon(connectionString);
  }

  async getUser(sessionId: string): Promise<User | null> {
    const rows = await this.sql`
      SELECT u.id, u.github_id, u.name, u.avatar_url
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ${sessionId} AND s.expires_at > NOW()
    `;
    if (!rows[0]) return null;
    const r = rows[0];
    return { id: r.id, githubId: r.github_id, name: r.name, avatarUrl: r.avatar_url };
  }

  async upsertUser(githubId: number, name: string, avatarUrl: string): Promise<User> {
    const rows = await this.sql`
      INSERT INTO users (github_id, name, avatar_url)
      VALUES (${githubId}, ${name}, ${avatarUrl})
      ON CONFLICT (github_id) DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
      RETURNING id, github_id, name, avatar_url
    `;
    const r = rows[0];
    return { id: r.id, githubId: r.github_id, name: r.name, avatarUrl: r.avatar_url };
  }

  async createSession(userId: string): Promise<string> {
    const rows = await this.sql`
      INSERT INTO sessions (user_id, expires_at)
      VALUES (${userId}, NOW() + INTERVAL '30 days')
      RETURNING id
    `;
    return rows[0].id;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sql`DELETE FROM sessions WHERE id = ${sessionId}`;
  }

  async getTodos(userId: string | null): Promise<Todo[]> {
    const rows = userId
      ? await this.sql`SELECT id, user_id, text, completed FROM todos WHERE user_id = ${userId} OR user_id IS NULL ORDER BY created_at`
      : await this.sql`SELECT id, user_id, text, completed FROM todos WHERE user_id IS NULL ORDER BY created_at`;
    return rows.map(r => ({ id: r.id, userId: r.user_id, text: r.text, completed: r.completed }));
  }

  async createTodo(userId: string | null, text: string): Promise<Todo> {
    const rows = await this.sql`
      INSERT INTO todos (user_id, text) VALUES (${userId}, ${text}) RETURNING id, user_id, text, completed
    `;
    const r = rows[0];
    return { id: r.id, userId: r.user_id, text: r.text, completed: r.completed };
  }

  async updateTodo(id: string, patch: Partial<Pick<Todo, 'text' | 'completed'>>, callerUserId: string | null = null): Promise<Todo> {
    // Allow update if caller owns the todo or the todo is public (user_id IS NULL)
    const rows = await this.sql`
      UPDATE todos SET
        text = COALESCE(${patch.text ?? null}, text),
        completed = COALESCE(${patch.completed ?? null}, completed)
      WHERE id = ${id}
        AND (user_id = ${callerUserId} OR user_id IS NULL)
      RETURNING id, user_id, text, completed
    `;
    if (!rows[0]) throw new Error('Todo not found or permission denied');
    const r = rows[0];
    return { id: r.id, userId: r.user_id, text: r.text, completed: r.completed };
  }

  async deleteTodo(id: string, callerUserId: string | null = null): Promise<void> {
    // Allow delete if caller owns the todo or the todo is public (user_id IS NULL)
    const rows = await this.sql`
      DELETE FROM todos
      WHERE id = ${id}
        AND (user_id = ${callerUserId} OR user_id IS NULL)
      RETURNING id
    `;
    if (!rows[0]) throw new Error('Todo not found or permission denied');
  }
}
