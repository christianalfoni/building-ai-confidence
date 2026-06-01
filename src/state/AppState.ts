import type { DatabaseService, DbPost, User } from "../services";
import type { Route } from "../utils";

const AUTHOR_LOGINS = ['christianalfoni', 'test'];

export type AppView = 'list' | 'post' | 'editor';

export class AppState {
  user: User | null;
  isPreview: boolean;
  view: AppView = 'list';
  selectedPostId: string | null = null;
  draftPostId: string | null = null;
  draftTitle: string = "";
  draftPublished: boolean = false;
  dbPosts: DbPost[] = [];
  private db: DatabaseService | null;

  constructor(
    user: User | null = null,
    isPreview = false,
    dbPosts: DbPost[] = [],
    db: DatabaseService | null = null,
    route: Route = { view: 'list', postId: null },
  ) {
    this.user = user;
    this.isPreview = isPreview;
    this.dbPosts = dbPosts;
    this.db = db;
    this.view = route.view;
    this.selectedPostId = route.postId;
  }

  get isAuthor(): boolean {
    return !!this.user && AUTHOR_LOGINS.includes(this.user.githubLogin);
  }

  // The post addressed by the current URL, if it exists in the visible set.
  get selectedPost(): DbPost | null {
    if (!this.selectedPostId) return null;
    return this.dbPosts.find((p) => p.id === this.selectedPostId) ?? null;
  }

  // True when we're on a post URL but no matching post is visible — drives the
  // in-page 404 in the view and the HTTP 404 status on the server.
  get postNotFound(): boolean {
    return this.view === 'post' && !!this.selectedPostId && !this.selectedPost;
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

  // Closes the in-memory editor, returning to the base view of the current URL
  // (the post on /posts/:id, the list on /). Does not change the URL.
  closeEditor() {
    this.draftPostId = null;
    this.view = this.selectedPostId ? 'post' : 'list';
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
