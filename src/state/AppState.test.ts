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
});
