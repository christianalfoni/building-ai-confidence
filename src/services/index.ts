export interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
}

export type User = {
  id: string;
  githubId: number;
  name: string;
  avatarUrl: string;
};

export interface DatabaseService {
  getUser(sessionId: string): Promise<User | null>;
  upsertUser(githubId: number, name: string, avatarUrl: string): Promise<User>;
  createSession(userId: string): Promise<string>;
  deleteSession(sessionId: string): Promise<void>;
}

export interface Services {
  storage: StorageService;
  db?: DatabaseService;
}
