import type { DatabaseService, User, Todo } from '../index.ts';

export type InitialData = {
  dbEnabled: boolean;
  isPreview: boolean;
  user: User | null;
  todos: Todo[];
};

export class ApiDatabaseService implements DatabaseService {
  private user: User | null;
  private todos: Todo[];

  constructor(initial: InitialData) {
    this.user = initial.user;
    this.todos = initial.todos;
  }

  async getUser(_sessionId: string): Promise<User | null> {
    return this.user;
  }

  async upsertUser(_githubId: number, _name: string, _avatarUrl: string): Promise<User> {
    throw new Error('upsertUser is server-only');
  }

  async createSession(_userId: string): Promise<string> {
    throw new Error('createSession is server-only');
  }

  async deleteSession(_sessionId: string): Promise<void> {
    throw new Error('deleteSession is server-only');
  }

  async getTodos(_userId: string | null): Promise<Todo[]> {
    return this.todos;
  }

  async createTodo(userId: string | null, text: string): Promise<Todo> {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text }),
    });
    if (!res.ok) throw new Error(`Failed to create todo: ${res.status}`);
    return res.json();
  }

  async updateTodo(id: string, patch: Partial<Pick<Todo, 'text' | 'completed'>>): Promise<Todo> {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`Failed to update todo: ${res.status}`);
    return res.json();
  }

  async deleteTodo(id: string): Promise<void> {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete todo: ${res.status}`);
  }
}
