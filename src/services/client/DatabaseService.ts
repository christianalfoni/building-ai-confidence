import type { DatabaseService, DbPost, User } from '../index.ts';

export type InitialData = {
  dbEnabled: boolean;
  isPreview: boolean;
  user: User | null;
  posts: DbPost[];
};

export class ApiDatabaseService implements DatabaseService {
  private user: User | null;
  private posts: DbPost[];

  constructor(initial: InitialData) {
    this.user = initial.user;
    this.posts = initial.posts;
  }

  async getUser(_sessionId: string): Promise<User | null> {
    return this.user;
  }

  async upsertUser(_githubId: number, _githubLogin: string, _name: string, _avatarUrl: string): Promise<User> {
    throw new Error('upsertUser is server-only');
  }

  async createSession(_userId: string): Promise<string> {
    throw new Error('createSession is server-only');
  }

  async deleteSession(_sessionId: string): Promise<void> {
    throw new Error('deleteSession is server-only');
  }

  async getPosts(): Promise<DbPost[]> {
    return this.posts;
  }

  async createPost(_authorId: string): Promise<DbPost> {
    const res = await fetch('/api/posts', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to create post');
    return res.json() as Promise<DbPost>;
  }

  async updatePost(id: string, fields: Partial<Pick<DbPost, 'title' | 'body' | 'published' | 'slug'>>): Promise<DbPost> {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error('Failed to update post');
    return res.json() as Promise<DbPost>;
  }
}
