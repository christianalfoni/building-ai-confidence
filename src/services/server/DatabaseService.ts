import type { NeonDatabase } from '../../../server/neon.js';
import type { DatabaseService, DbPost, SessionService } from '../index.ts';

// Logins whose unpublished posts are visible to themselves. Mirrors the same
// constant the API routes use to gate edits.
const AUTHOR_LOGINS = ['christianalfoni', 'test'];

// Server-side database service. Loads the posts visible to the current user
// from the Neon gateway during `preload()`, then exposes them as a snapshot for
// `AppState` to seed from — the same shape the browser service hydrates into.
export class ServerDatabaseService implements DatabaseService {
  posts: DbPost[] = [];
  private db: NeonDatabase | null;
  private session: SessionService;
  private hideAuthorLogins: string[];

  constructor(db: NeonDatabase | null, session: SessionService, hideAuthorLogins: string[] = []) {
    this.db = db;
    this.session = session;
    this.hideAuthorLogins = hideAuthorLogins;
  }

  // Must run after `session.preload()` so the resolved user is available for
  // filtering the author's own unpublished posts.
  async preload(): Promise<void> {
    if (!this.db) {
      this.posts = [];
      return;
    }
    const all = await this.db.getPosts({ hideAuthorLogins: this.hideAuthorLogins });
    const user = this.session.user;
    this.posts = all.filter(
      (p) => p.published || (user != null && AUTHOR_LOGINS.includes(user.githubLogin) && p.authorId === user.id),
    );
  }

  async createPost(authorId: string): Promise<DbPost> {
    if (!this.db) throw new Error('Database is not available');
    return this.db.createPost(authorId);
  }

  async updatePost(id: string, fields: Partial<Pick<DbPost, 'title' | 'body' | 'published' | 'slug'>>): Promise<DbPost> {
    if (!this.db) throw new Error('Database is not available');
    return this.db.updatePost(id, fields);
  }

  async deletePost(id: string): Promise<void> {
    if (!this.db) throw new Error('Database is not available');
    await this.db.deletePost(id);
  }
}
