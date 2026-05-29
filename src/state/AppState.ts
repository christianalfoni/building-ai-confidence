import type { Services, User } from "../services";
import type { Todo } from "../services";

export type { Todo };

export class AppState {
  private services: Services;
  todos: Todo[] = [];
  newTodoText = "";
  editingId: string | null = null;
  editText = "";
  user: User | null;

  constructor(services: Services, user: User | null = null, todos: Todo[] = []) {
    this.services = services;
    this.user = user;
    if (services.db) {
      this.todos = todos;
    } else {
      this.todos = services.storage.get<Todo[]>("todos") ?? [];
    }
  }

  private save() {
    if (!this.services.db) {
      this.services.storage.set("todos", this.todos);
    }
  }

  setNewTodoText(text: string) {
    this.newTodoText = text;
  }

  async submitNewTodo() {
    await this.addTodo(this.newTodoText);
    this.newTodoText = "";
  }

  async addTodo(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (this.services.db) {
      const todo = await this.services.db.createTodo(this.user?.id ?? null, trimmed);
      this.todos.push(todo);
    } else {
      this.todos.push({ id: crypto.randomUUID(), userId: null, text: trimmed, completed: false });
      this.save();
    }
  }

  async toggleTodo(id: string) {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;
    if (this.services.db) {
      const updated = await this.services.db.updateTodo(id, { completed: !todo.completed });
      Object.assign(todo, updated);
    } else {
      todo.completed = !todo.completed;
      this.save();
    }
  }

  startEdit(id: string) {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;
    this.editingId = id;
    this.editText = todo.text;
  }

  setEditText(text: string) {
    this.editText = text;
  }

  async commitEdit() {
    if (!this.editingId || !this.editText.trim()) return;
    await this.editTodo(this.editingId, this.editText);
    this.editingId = null;
    this.editText = "";
  }

  cancelEdit() {
    this.editingId = null;
    this.editText = "";
  }

  async editTodo(id: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;
    if (this.services.db) {
      const updated = await this.services.db.updateTodo(id, { text: trimmed });
      Object.assign(todo, updated);
    } else {
      todo.text = trimmed;
      this.save();
    }
  }

  async deleteTodo(id: string) {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) return;
    if (this.services.db) {
      await this.services.db.deleteTodo(id);
      this.todos.splice(index, 1);
    } else {
      this.todos.splice(index, 1);
      this.save();
    }
  }

  signOut() {
    fetch('/auth/logout', { method: 'POST' }).then(() => {
      window.location.href = '/';
    });
  }
}
