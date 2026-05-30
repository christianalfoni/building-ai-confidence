import { neon } from '@neondatabase/serverless';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import type { DatabaseService, User } from '../index.ts';

export class NeonDatabaseService implements DatabaseService {
  private sql: NeonQueryFunction<false, false>;

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
}
