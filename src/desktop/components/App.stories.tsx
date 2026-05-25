import { AppContext } from "../../contexts/AppContext";
import { createAppState } from "../../test-utils";
import { App } from "./App";

export function empty() {
  const appState = createAppState();
  return {
    element: (
      <AppContext.Provider value={appState}>
        <App />
      </AppContext.Provider>
    ),
    appState,
  };
}

export function withTodos() {
  const appState = createAppState();
  appState.addTodo("Buy milk");
  appState.addTodo("Walk the dog");
  appState.addTodo("Read a book");
  return {
    element: (
      <AppContext.Provider value={appState}>
        <App />
      </AppContext.Provider>
    ),
    appState,
  };
}

export function withCompletedTodo() {
  const appState = createAppState();
  appState.addTodo("Buy milk");
  appState.addTodo("Walk the dog");
  appState.toggleTodo(appState.todos[0].id);
  return {
    element: (
      <AppContext.Provider value={appState}>
        <App />
      </AppContext.Provider>
    ),
    appState,
  };
}
