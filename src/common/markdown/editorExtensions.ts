// CodeMirror 6 extensions for the markdown editor. CLIENT-ONLY: this module
// imports `@codemirror/*` (which touch the DOM), so it is only reached through
// the dynamically-imported markdown/editorView module and never executes during
// SSR.
//
// The editor mirrors the SSR reader (src/common/ui-components/Markdown.tsx):
//   - same Lezer markdown grammar (via @codemirror/lang-markdown)
//   - same highlighter (markdownHighlighter) → same `tok-*` classes → same CSS
//   - structural markers (`#`, `-`) kept visible; multi-line fenced blocks render
//     as a rounded box with the ``` backticks and language hidden; fenced code
//     highlighted by language; list lines indented by nesting depth.
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type KeyBinding,
  ViewPlugin,
  type ViewUpdate,
  drawSelection,
  keymap,
} from "@codemirror/view";
import type { EditorState, Extension, Range } from "@codemirror/state";
import { history, historyKeymap, defaultKeymap } from "@codemirror/commands";
import {
  LanguageDescription,
  syntaxHighlighting,
  syntaxTree,
} from "@codemirror/language";
import { markdown, markdownLanguage, markdownKeymap } from "@codemirror/lang-markdown";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import type { SyntaxNode } from "@lezer/common";
import { markdownHighlighter } from "./highlight";
import { LIST_INDENT_REM } from "./tokens";

// Keep this set in sync with parse.ts (the reader's nested code parsers).
const codeLanguages = [
  LanguageDescription.of({
    name: "javascript",
    alias: ["js"],
    load: async () => javascript(),
  }),
  LanguageDescription.of({
    name: "jsx",
    load: async () => javascript({ jsx: true }),
  }),
  LanguageDescription.of({
    name: "typescript",
    alias: ["ts"],
    load: async () => javascript({ typescript: true }),
  }),
  LanguageDescription.of({
    name: "tsx",
    load: async () => javascript({ jsx: true, typescript: true }),
  }),
  LanguageDescription.of({
    name: "json",
    load: async () => json(),
  }),
];

function listDepthAt(node: SyntaxNode | null): number {
  let depth = 0;
  for (let n = node; n; n = n.parent) {
    if (n.name === "ListItem") depth++;
  }
  return depth;
}

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  const tree = syntaxTree(state);
  const ranges: Range<Decoration>[] = [];

  // Per fenced block, the line range it spans (fence lines included) so the whole
  // block renders as one box. The backtick marks are always hidden (no
  // cursor-reveal) — the box "covers them up"; the language stays as a label.
  const codeBlock = new Map<number, { open: boolean; close: boolean }>();
  tree.iterate({
    enter: (n) => {
      if (n.name !== "FencedCode") return;
      const fence = n.node;
      const first = state.doc.lineAt(fence.from).number;
      const last = state.doc.lineAt(Math.max(fence.from, fence.to - 1)).number;
      // A still-being-typed ``` is a single line — not a block yet. The block is
      // created once it spans multiple lines (i.e. after Enter).
      if (first === last) return;
      for (let ln = first; ln <= last; ln++) {
        codeBlock.set(ln, { open: ln === first, close: ln === last });
      }
      // Hide the ``` markers and the language info — both live "behind" the box.
      for (const mk of fence.getChildren("CodeMark")) {
        if (mk.to > mk.from) ranges.push(Decoration.replace({}).range(mk.from, mk.to));
      }
      const info = fence.getChild("CodeInfo");
      if (info && info.to > info.from) {
        ranges.push(Decoration.replace({}).range(info.from, info.to));
      }
    },
  });

  // Per-line decorations: code-block box (background + rounded ends) + list indent.
  for (let ln = 1; ln <= state.doc.lines; ln++) {
    const line = state.doc.line(ln);
    let firstNonWs = line.from;
    while (firstNonWs < line.to && /\s/.test(state.doc.sliceString(firstNonWs, firstNonWs + 1))) {
      firstNonWs++;
    }
    const depth = listDepthAt(tree.resolveInner(firstNonWs, 1));
    const block = codeBlock.get(ln);
    if (!block && depth === 0) continue;
    const classes: string[] = [];
    if (block) {
      classes.push("cm-md-code");
      if (block.open) classes.push("cm-md-code-open");
      if (block.close) classes.push("cm-md-code-close");
    }
    ranges.push(
      Decoration.line({
        class: classes.length ? classes.join(" ") : undefined,
        attributes:
          depth > 0 ? { style: `padding-left:${depth * LIST_INDENT_REM}rem` } : undefined,
      }).range(line.from),
    );
  }

  return Decoration.set(ranges, true);
}

const decorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

// Find the FencedCode node enclosing an offset, if any.
function enclosingFence(state: EditorState, pos: number): SyntaxNode | null {
  for (let n: SyntaxNode | null = syntaxTree(state).resolveInner(pos, 1); n; n = n.parent) {
    if (n.name === "FencedCode") return n;
  }
  return null;
}

// Typing ``` (optionally with a language) and pressing Enter auto-inserts the
// closing fence, dropping the cursor onto an empty code line between them.
const autoCloseFence: KeyBinding = {
  key: "Enter",
  run: (view) => {
    const { state } = view;
    const sel = state.selection.main;
    if (!sel.empty) return false;
    const line = state.doc.lineAt(sel.head);
    if (sel.head !== line.to) return false; // only at the end of the fence line
    const m = /^(\s*)(`{3,})([^\s`]*)\s*$/.exec(line.text);
    if (!m) return false;
    // Don't double-close a fence that already has its closing marker.
    const fence = enclosingFence(state, line.from);
    if (fence && fence.getChildren("CodeMark").length >= 2) return false;
    const fenceMark = m[2];
    view.dispatch({
      changes: { from: sel.head, insert: `\n\n${fenceMark}` },
      selection: { anchor: line.to + 1 },
      scrollIntoView: true,
    });
    return true;
  },
};

// Backspacing inside an empty fenced block removes the whole block (both fences)
// rather than leaving stray ``` markers behind.
const removeEmptyCodeBlock: KeyBinding = {
  key: "Backspace",
  run: (view) => {
    const { state } = view;
    const sel = state.selection.main;
    if (!sel.empty) return false;
    const fence = enclosingFence(state, sel.head);
    if (!fence) return false;
    const first = state.doc.lineAt(fence.from).number;
    const last = state.doc.lineAt(Math.max(fence.from, fence.to - 1)).number;
    if (first === last) return false; // a lone ``` being typed — not a block
    const codeText = fence.getChild("CodeText");
    const content = codeText ? state.doc.sliceString(codeText.from, codeText.to) : "";
    if (content.trim() !== "") return false; // only when the block is empty
    let from = fence.from;
    let to = fence.to;
    // Absorb one adjacent newline so removing the block doesn't leave a gap.
    if (to < state.doc.length && state.doc.sliceString(to, to + 1) === "\n") to += 1;
    else if (from > 0 && state.doc.sliceString(from - 1, from) === "\n") from -= 1;
    view.dispatch({
      changes: { from, to, insert: "" },
      selection: { anchor: from },
      scrollIntoView: true,
    });
    return true;
  },
};

export function editorExtensions(): Extension[] {
  return [
    markdown({ base: markdownLanguage, codeLanguages }),
    syntaxHighlighting(markdownHighlighter),
    history(),
    // Draw CodeMirror's own cursor/selection so the caret blinks and is styled
    // by our theme (the native contentEditable caret was effectively invisible).
    drawSelection(),
    decorationPlugin,
    EditorView.lineWrapping,
    // autoCloseFence / removeEmptyCodeBlock run before the default Enter/Backspace
    // bindings. markdownKeymap continues `- ` lists on Enter (keeps the hyphen).
    keymap.of([
      autoCloseFence,
      removeEmptyCodeBlock,
      ...markdownKeymap,
      ...defaultKeymap,
      ...historyKeymap,
    ]),
  ];
}
