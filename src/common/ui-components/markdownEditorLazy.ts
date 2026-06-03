import { lazy } from "react";

// Single source of truth for the client-only CodeMirror editor import. The lazy
// component and the preloader share the same dynamic import so warming the chunk
// (when a signed-in author lands) means the editor opens instantly later.
const importMarkdownEditor = () => import("./MarkdownEditor");

export const LazyMarkdownEditor = lazy(importMarkdownEditor);

export function preloadMarkdownEditor() {
  void importMarkdownEditor();
}
