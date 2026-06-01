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
  appState.dbPosts = [
    {
      id: "p1",
      authorId: "u1",
      slug: "building-confidence-with-ai",
      title: "Building confidence with AI",
      body: "Trust is earned in drops and lost in buckets.\n\nThis post explores how.",
      published: true,
      createdAt: "2026-05-30T00:00:00.000Z",
      updatedAt: "2026-05-30T00:00:00.000Z",
    },
  ];
  appState.view = "post";
  appState.selectedPostId = "p1";
  return {
    element: (
      <AppContext.Provider value={appState}>
        <App />
      </AppContext.Provider>
    ),
    appState,
  };
}
