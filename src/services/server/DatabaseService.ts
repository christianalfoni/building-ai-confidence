import { neon } from '@neondatabase/serverless';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import type { DatabaseService, DbPost, User } from '../index.ts';

export class NeonDatabaseService implements DatabaseService {
  private sql: NeonQueryFunction<false, false>;

  constructor(connectionString: string) {
    this.sql = neon(connectionString);
  }

  async getUser(sessionId: string): Promise<User | null> {
    const rows = await this.sql`
      SELECT u.id, u.github_id, u.github_login, u.name, u.avatar_url
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ${sessionId} AND s.expires_at > NOW()
    `;
    if (!rows[0]) return null;
    const r = rows[0];
    return { id: r.id, githubId: r.github_id, githubLogin: r.github_login, name: r.name, avatarUrl: r.avatar_url };
  }

  async upsertUser(githubId: number, githubLogin: string, name: string, avatarUrl: string): Promise<User> {
    const rows = await this.sql`
      INSERT INTO users (github_id, github_login, name, avatar_url)
      VALUES (${githubId}, ${githubLogin}, ${name}, ${avatarUrl})
      ON CONFLICT (github_id) DO UPDATE SET github_login = EXCLUDED.github_login, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
      RETURNING id, github_id, github_login, name, avatar_url
    `;
    const r = rows[0];
    return { id: r.id, githubId: r.github_id, githubLogin: r.github_login, name: r.name, avatarUrl: r.avatar_url };
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

  async getPosts(): Promise<DbPost[]> {
    const rows = await this.sql`
      SELECT id, author_id, slug, title, body, published, created_at, updated_at
      FROM posts
      ORDER BY created_at DESC
    `;
    return rows.map(toDbPost);
  }

  async createPost(authorId: string): Promise<DbPost> {
    const rows = await this.sql`
      INSERT INTO posts (author_id) VALUES (${authorId})
      RETURNING id, author_id, slug, title, body, published, created_at, updated_at
    `;
    return toDbPost(rows[0]);
  }

  async updatePost(id: string, fields: Partial<Pick<DbPost, 'title' | 'body' | 'published' | 'slug'>>): Promise<DbPost> {
    const slug = fields.slug ?? (fields.title ? slugify(fields.title) : undefined);
    const rows = await this.sql`
      UPDATE posts SET
        title      = COALESCE(${fields.title ?? null}, title),
        body       = COALESCE(${fields.body ?? null}, body),
        published  = COALESCE(${fields.published ?? null}, published),
        slug       = COALESCE(${slug ?? null}, slug),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, author_id, slug, title, body, published, created_at, updated_at
    `;
    return toDbPost(rows[0]);
  }
}

function toDbPost(r: Record<string, unknown>): DbPost {
  return {
    id: r.id as string,
    authorId: r.author_id as string,
    slug: r.slug as string,
    title: r.title as string,
    body: r.body as string,
    published: r.published as boolean,
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
