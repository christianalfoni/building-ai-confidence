import { createAppState } from "../test-utils";

describe("AppState", () => {
  it("starts with no todos", () => {
    const state = createAppState();
    expect(state.todos).toHaveLength(0);
  });

  it("adds a todo", () => {
    const state = createAppState();
    state.addTodo("Buy milk");
    expect(state.todos).toHaveLength(1);
    expect(state.todos[0].text).toBe("Buy milk");
    expect(state.todos[0].completed).toBe(false);
  });

  it("ignores empty or whitespace-only text in addTodo", () => {
    const state = createAppState();
    state.addTodo("");
    state.addTodo("   ");
    expect(state.todos).toHaveLength(0);
  });

  it("toggles a todo between complete and incomplete", () => {
    const state = createAppState();
    state.addTodo("Buy milk");
    const id = state.todos[0].id;
    state.toggleTodo(id);
    expect(state.todos[0].completed).toBe(true);
    state.toggleTodo(id);
    expect(state.todos[0].completed).toBe(false);
  });

  it("edits a todo's text", () => {
    const state = createAppState();
    state.addTodo("Buy milk");
    const id = state.todos[0].id;
    state.editTodo(id, "Buy oat milk");
    expect(state.todos[0].text).toBe("Buy oat milk");
  });

  it("ignores empty text in editTodo", () => {
    const state = createAppState();
    state.addTodo("Buy milk");
    const id = state.todos[0].id;
    state.editTodo(id, "");
    expect(state.todos[0].text).toBe("Buy milk");
  });

  it("deletes a todo", () => {
    const state = createAppState();
    state.addTodo("Buy milk");
    const id = state.todos[0].id;
    state.deleteTodo(id);
    expect(state.todos).toHaveLength(0);
  });

  it("sets and submits new todo text", () => {
    const state = createAppState();
    state.setNewTodoText("Buy oat milk");
    expect(state.newTodoText).toBe("Buy oat milk");
    state.submitNewTodo();
    expect(state.todos).toHaveLength(1);
    expect(state.todos[0].text).toBe("Buy oat milk");
    expect(state.newTodoText).toBe("");
  });

  it("submitNewTodo ignores empty text", () => {
    const state = createAppState();
    state.submitNewTodo();
    expect(state.todos).toHaveLength(0);
    expect(state.newTodoText).toBe("");
  });

  it("startEdit sets editingId and editText from the todo", () => {
    const state = createAppState();
    state.addTodo("Buy milk");
    const id = state.todos[0].id;
    state.startEdit(id);
    expect(state.editingId).toBe(id);
    expect(state.editText).toBe("Buy milk");
  });

  it("commitEdit saves the edit and clears editing state", () => {
    const state = createAppState();
    state.addTodo("Buy milk");
    const id = state.todos[0].id;
    state.startEdit(id);
    state.setEditText("Buy oat milk");
    state.commitEdit();
    expect(state.todos[0].text).toBe("Buy oat milk");
    expect(state.editingId).toBeNull();
    expect(state.editText).toBe("");
  });

  it("commitEdit does nothing when editText is empty", () => {
    const state = createAppState();
    state.addTodo("Buy milk");
    const id = state.todos[0].id;
    state.startEdit(id);
    state.setEditText("");
    state.commitEdit();
    expect(state.todos[0].text).toBe("Buy milk");
    expect(state.editingId).toBe(id);
  });

  it("cancelEdit clears editing state without saving", () => {
    const state = createAppState();
    state.addTodo("Buy milk");
    const id = state.todos[0].id;
    state.startEdit(id);
    state.setEditText("Buy oat milk");
    state.cancelEdit();
    expect(state.todos[0].text).toBe("Buy milk");
    expect(state.editingId).toBeNull();
    expect(state.editText).toBe("");
  });
});
