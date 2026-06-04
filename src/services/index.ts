import type { Route } from "../utils";

export type User = {
  id: string;
  githubId: number;
  githubLogin: string;
  name: string;
  avatarUrl: string;
};

export type DbPost = {
  id: string;
  authorId: string;
  slug: string;
  title: string;
  body: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

// The current user session. Implementations load the user differently — the
// browser from the embedded initial data, the server from the session cookie
// via the Neon gateway — but `AppState` consumes them identically.
export interface SessionService {
  readonly user: User | null;
  readonly isPreview: boolean;
  preload(): Promise<void>;
  signOut(): Promise<void>;
}

// The set of posts visible to the current user, plus the mutations the app can
// perform on them. The loaded `posts` snapshot is the source `AppState` seeds
// its reactive list from.
export interface DatabaseService {
  readonly posts: DbPost[];
  preload(): Promise<void>;
  createPost(authorId: string): Promise<DbPost>;
  updatePost(id: string, fields: Partial<Pick<DbPost, 'title' | 'body' | 'published' | 'slug'>>): Promise<DbPost>;
  deletePost(id: string): Promise<void>;
}

// The current route plus the means to navigate. On the server `navigate` is
// never called (SSR is read-only); in the browser it triggers a full-page load.
export interface NavigationService {
  readonly route: Route;
  navigate(path: string): void;
}

// Uploads media (currently PNG images) and returns the public URL to embed in a
// post. Browser-only in practice — SSR never uploads.
export interface MediaService {
  uploadImage(file: File): Promise<string>;
}

// The single object of infrastructure passed into `AppState`.
export type Services = {
  session: SessionService;
  database: DatabaseService;
  navigation: NavigationService;
  media: MediaService;
};
