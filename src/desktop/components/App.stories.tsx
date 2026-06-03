import { AppContext } from "../../contexts/AppContext";
import { createAppState } from "../../test-utils";
import type { DbPost, User } from "../../services";
import { App } from "./App";

const author: User = {
  id: "u1",
  githubId: 1,
  githubLogin: "christianalfoni",
  name: "Christian Alfoni",
  avatarUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='10' fill='%23cba6f7'/%3E%3C/svg%3E",
};

const post1: DbPost = {
  id: "p1",
  authorId: "u1",
  slug: "building-confidence-with-ai",
  title: "Building confidence with AI",
  body: "Trust is earned in drops and lost in buckets.\n\nThis post explores how.",
  published: true,
  createdAt: "2026-05-30T00:00:00.000Z",
  updatedAt: "2026-05-30T00:00:00.000Z",
};

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
  // Seed the route in the constructor — reactx forbids mutating the reactive
  // proxy directly from outside a class method.
  const appState = createAppState({
    posts: [post1],
    route: { view: "post", postId: "p1" },
  });
  return {
    element: (
      <AppContext.Provider value={appState}>
        <App />
      </AppContext.Provider>
    ),
    appState,
  };
}

// Author viewing their own draft: edit/delete sit at the top, the draft badge
// replaces the old read-time chip, and there's no "q to go back" footer.
export function postAsAuthor() {
  const appState = createAppState({
    user: author,
    posts: [{ ...post1, published: false }],
    route: { view: "post", postId: "p1" },
  });
  return {
    element: (
      <AppContext.Provider value={appState}>
        <App />
      </AppContext.Provider>
    ),
    appState,
  };
}

// Editor: draft/publish controls live at the top next to the prompt, the title
// is focused on mount, and Esc (or the footer button) leaves.
export function editor() {
  const appState = createAppState({ user: author, posts: [{ ...post1, published: false }] });
  appState.openEditor("p1");
  return {
    element: (
      <AppContext.Provider value={appState}>
        <App />
      </AppContext.Provider>
    ),
    appState,
  };
}
