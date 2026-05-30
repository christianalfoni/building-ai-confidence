export interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
}

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

export interface DatabaseService {
  getUser(sessionId: string): Promise<User | null>;
  upsertUser(githubId: number, githubLogin: string, name: string, avatarUrl: string): Promise<User>;
  createSession(userId: string): Promise<string>;
  deleteSession(sessionId: string): Promise<void>;
  getPosts(): Promise<DbPost[]>;
  createPost(authorId: string): Promise<DbPost>;
  updatePost(id: string, fields: Partial<Pick<DbPost, 'title' | 'body' | 'published' | 'slug'>>): Promise<DbPost>;
}

export interface Services {
  storage: StorageService;
  db?: DatabaseService;
}
