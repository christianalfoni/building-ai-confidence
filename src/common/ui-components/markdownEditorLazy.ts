// Lazy loader for the client-only CodeMirror editor *logic* (not a component).
// The heavy `@codemirror/*` code lives in markdown/editorView; we dynamically
// import it so it is code-split out of the main client bundle and never executes
// during SSR (it's only ever invoked client-side). The resolved module is cached
// at module scope so a preloaded editor mounts with no delay.

type EditorModule = typeof import("../markdown/editorView");

let cached: EditorModule | null = null;
let pending: Promise<EditorModule> | null = null;

// Warm the editor chunk ahead of time (called when a signed-in author lands).
// Safe to call repeatedly.
export function preloadMarkdownEditor(): Promise<EditorModule> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = import("../markdown/editorView").then((mod) => {
      cached = mod;
      return mod;
    });
  }
  return pending;
}

// Synchronously returns the editor module if it has already been loaded.
export function getLoadedEditorModule(): EditorModule | null {
  return cached;
}
