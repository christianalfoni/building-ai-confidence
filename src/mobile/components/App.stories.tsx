import { AppContext } from "../../contexts/AppContext";
import { createAppState } from "../../test-utils";
import { App } from "./App";

export function list() {
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

export function post() {
  const appState = createAppState();
  appState.selectPost("building-confidence-with-ai");
  return {
    element: (
      <AppContext.Provider value={appState}>
        <App />
      </AppContext.Provider>
    ),
    appState,
  };
}
