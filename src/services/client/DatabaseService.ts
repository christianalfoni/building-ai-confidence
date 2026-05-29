import type { DatabaseService, User, Todo } from '../index.ts';

export type InitialData = {
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
    const todo: Todo = await res.json();
    this.todos.push(todo);
    return todo;
  }

  async updateTodo(id: string, patch: Partial<Pick<Todo, 'text' | 'completed'>>): Promise<Todo> {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const updated: Todo = await res.json();
    const idx = this.todos.findIndex(t => t.id === id);
    if (idx !== -1) this.todos[idx] = updated;
    return updated;
  }

  async deleteTodo(id: string): Promise<void> {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    const idx = this.todos.findIndex(t => t.id === id);
    if (idx !== -1) this.todos.splice(idx, 1);
  }
}
