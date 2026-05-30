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

export type Todo = {
  id: string;
  userId: string | null;
  text: string;
  completed: boolean;
};

export interface DatabaseService {
  getUser(sessionId: string): Promise<User | null>;
  upsertUser(githubId: number, name: string, avatarUrl: string): Promise<User>;
  createSession(userId: string): Promise<string>;
  deleteSession(sessionId: string): Promise<void>;
  getTodos(userId: string | null): Promise<Todo[]>;
  createTodo(userId: string | null, text: string): Promise<Todo>;
  updateTodo(id: string, patch: Partial<Pick<Todo, 'text' | 'completed'>>, callerUserId?: string | null): Promise<Todo>;
  deleteTodo(id: string, callerUserId?: string | null): Promise<void>;
}

export interface Services {
  storage: StorageService;
  db?: DatabaseService;
}
