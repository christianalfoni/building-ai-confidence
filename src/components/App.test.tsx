import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAppState, renderWithApp } from "../test-utils";
import { App } from "./App";

describe("App", () => {
  it("shows empty state when there are no todos", () => {
    const appState = createAppState();
    renderWithApp(<App />, appState);
    expect(screen.getByText("No todos yet")).toBeInTheDocument();
  });

  it("adds a todo by typing and pressing Enter", async () => {
    const appState = createAppState();
    renderWithApp(<App />, appState);
    await userEvent.type(screen.getByPlaceholderText(/add a todo/i), "Buy milk{Enter}");
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });

  it("toggles a todo as complete", async () => {
    const appState = createAppState();
    appState.addTodo("Buy milk");
    renderWithApp(<App />, appState);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(appState.todos[0].completed).toBe(true);
  });

  it("deletes a todo", async () => {
    const appState = createAppState();
    appState.addTodo("Buy milk");
    renderWithApp(<App />, appState);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
  });

  it("edits a todo inline", async () => {
    const appState = createAppState();
    appState.addTodo("Buy milk");
    renderWithApp(<App />, appState);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const editInput = screen.getByDisplayValue("Buy milk");
    await userEvent.clear(editInput);
    await userEvent.type(editInput, "Buy oat milk{Enter}");
    expect(screen.getByText("Buy oat milk")).toBeInTheDocument();
  });
});
