import type { Services } from "../services";

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

export class AppState {
  private services: Services;
  todos: Todo[] = [];

  constructor(services: Services) {
    this.services = services;
    this.todos = services.storage.get<Todo[]>("todos") ?? [];
  }

  private save() {
    this.services.storage.set("todos", this.todos);
  }

  addTodo(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.todos.push({ id: crypto.randomUUID(), text: trimmed, completed: false });
    this.save();
  }

  toggleTodo(id: string) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) todo.completed = !todo.completed;
    this.save();
  }

  editTodo(id: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const todo = this.todos.find(t => t.id === id);
    if (todo) todo.text = trimmed;
    this.save();
  }

  deleteTodo(id: string) {
    const index = this.todos.findIndex(t => t.id === id);
    if (index !== -1) this.todos.splice(index, 1);
    this.save();
  }
}
