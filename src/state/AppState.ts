import type { Services } from "../services";

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

export class AppState {
  private services: Services;
  todos: Todo[] = [];
  newTodoText = "";
  editingId: string | null = null;
  editText = "";

  constructor(services: Services) {
    this.services = services;
    this.todos = services.storage.get<Todo[]>("todos") ?? [];
  }

  private save() {
    this.services.storage.set("todos", this.todos);
  }

  setNewTodoText(text: string) {
    this.newTodoText = text;
  }

  submitNewTodo() {
    this.addTodo(this.newTodoText);
    this.newTodoText = "";
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

  startEdit(id: string) {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;
    this.editingId = id;
    this.editText = todo.text;
  }

  setEditText(text: string) {
    this.editText = text;
  }

  commitEdit() {
    if (!this.editingId || !this.editText.trim()) return;
    this.editTodo(this.editingId, this.editText);
    this.editingId = null;
    this.editText = "";
  }

  cancelEdit() {
    this.editingId = null;
    this.editText = "";
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
