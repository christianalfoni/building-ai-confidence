import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as stories from "./App.stories";

describe("App", () => {
  it("shows empty state when there are no todos", () => {
    const { element } = stories.empty();
    render(element);
    expect(screen.getByText("No todos yet — add one below.")).toBeInTheDocument();
  });

  it("adds a todo by typing and pressing Enter", async () => {
    const { element } = stories.empty();
    render(element);
    await userEvent.type(screen.getByPlaceholderText(/add a todo/i), "Buy milk{Enter}");
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });

  it("toggles a todo as complete", async () => {
    const { element, appState } = stories.withTodos();
    render(element);
    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(appState.todos[0].completed).toBe(true);
  });

  it("deletes a todo", async () => {
    const { element } = stories.withTodos();
    render(element);
    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
  });

  it("edits a todo inline", async () => {
    const { element } = stories.withTodos();
    render(element);
    await userEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    const editInput = screen.getByDisplayValue("Buy milk");
    await userEvent.clear(editInput);
    await userEvent.type(editInput, "Buy oat milk{Enter}");
    expect(screen.getByText("Buy oat milk")).toBeInTheDocument();
  });
});
