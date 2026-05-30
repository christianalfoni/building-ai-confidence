import type { DatabaseService, DbPost, User } from "../services";

const AUTHOR_LOGINS = ['christianalfoni', 'test'];

export type AppView = 'list' | 'post' | 'editor';

export class AppState {
  user: User | null;
  isPreview: boolean;
  view: AppView = 'list';
  selectedPostSlug: string | null = null;
  draftPostId: string | null = null;
  draftTitle: string = "";
  draftPublished: boolean = false;
  dbPosts: DbPost[] = [];
  private db: DatabaseService | null;

  constructor(user: User | null = null, isPreview = false, dbPosts: DbPost[] = [], db: DatabaseService | null = null) {
    this.user = user;
    this.isPreview = isPreview;
    this.dbPosts = dbPosts;
    this.db = db;
  }

  get isAuthor(): boolean {
    return !!this.user && AUTHOR_LOGINS.includes(this.user.githubLogin);
  }

  selectPost(slug: string) {
    this.selectedPostSlug = slug;
    this.view = 'post';
  }

  setDraftTitle(title: string) {
    this.draftTitle = title;
  }

  setDraftPublished(published: boolean) {
    this.draftPublished = published;
  }

  openEditor(postId: string) {
    const post = this.dbPosts.find((p) => p.id === postId);
    this.draftPostId = postId;
    this.draftTitle = post?.title ?? "";
    this.draftPublished = post?.published ?? false;
    this.view = 'editor';
  }

  goBack() {
    this.selectedPostSlug = null;
    this.draftPostId = null;
    this.view = 'list';
  }

  updateDbPost(post: DbPost) {
    const idx = this.dbPosts.findIndex((p) => p.id === post.id);
    if (idx >= 0) {
      this.dbPosts[idx] = post;
    } else {
      this.dbPosts.unshift(post);
    }
  }

  async createPost() {
    if (!this.db || !this.user) return;
    const post = await this.db.createPost(this.user.id);
    this.updateDbPost(post);
    this.openEditor(post.id);
  }

  async savePost(fields: Partial<Pick<DbPost, 'title' | 'body' | 'published'>>) {
    if (!this.db || !this.draftPostId) return;
    const post = await this.db.updatePost(this.draftPostId, fields);
    this.updateDbPost(post);
  }

  signOut() {
    fetch('/auth/logout', { method: 'POST' }).then(() => {
      window.location.href = '/';
    });
  }
}
