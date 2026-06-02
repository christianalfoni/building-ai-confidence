import type { DatabaseService, DbPost, User } from '../index.ts';

// The SSR → client hydration payload, embedded as JSON in the rendered HTML and
// read back by the browser services so they start already-loaded.
export type InitialData = {
  dbEnabled: boolean;
  isPreview: boolean;
  user: User | null;
  posts: DbPost[];
};

// Browser-side database service. Constructed already-loaded from the embedded
// initial data, so `preload()` is a no-op; mutations go over the REST API.
export class ApiDatabaseService implements DatabaseService {
  posts: DbPost[];

  constructor(initial: InitialData) {
    this.posts = initial.posts;
  }

  async preload(): Promise<void> {}

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

  async deletePost(id: string): Promise<void> {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    // A 404 means the post is already gone — the end state is identical, so
    // treat it as success rather than surfacing an error to the user.
    if (!res.ok && res.status !== 404) throw new Error('Failed to delete post');
  }
}
