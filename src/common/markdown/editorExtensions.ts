// CodeMirror 6 extensions for the markdown editor. CLIENT-ONLY: this module
// imports `@codemirror/*` (which touch the DOM), so it must only ever be loaded
// in the browser — it is reached via the lazy-imported MarkdownEditor component,
// never statically from an SSR-rendered tree.
//
// The editor mirrors the SSR reader (src/common/ui-components/Markdown.tsx):
//   - same Lezer markdown grammar (via @codemirror/lang-markdown)
//   - same highlighter (markdownHighlighter) → same `tok-*` classes → same CSS
//   - markers (`#`, `-`) kept visible; ``` fence marks hidden unless the cursor
//     is on that line; fenced code highlighted by language and given a block bg;
//     list lines indented by nesting depth.
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
import type { Extension, Range } from "@codemirror/state";
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

  // Lines that currently hold a cursor — fence marks on these stay visible so
  // they can be edited.
  const cursorLines = new Set<number>();
  for (const r of state.selection.ranges) {
    cursorLines.add(state.doc.lineAt(r.head).number);
  }

  const codeLines = new Set<number>();
  tree.iterate({
    enter: (n) => {
      if (n.name === "CodeText") {
        const a = state.doc.lineAt(n.from).number;
        const b = state.doc.lineAt(n.to).number;
        for (let ln = a; ln <= b; ln++) codeLines.add(ln);
      }
      if (n.name === "CodeMark" || n.name === "CodeInfo") {
        const ln = state.doc.lineAt(n.from).number;
        if (!cursorLines.has(ln) && n.to > n.from) {
          ranges.push(Decoration.replace({}).range(n.from, n.to));
        }
      }
    },
  });

  // Per-line decorations: code-block background + list indentation.
  for (let ln = 1; ln <= state.doc.lines; ln++) {
    const line = state.doc.line(ln);
    let firstNonWs = line.from;
    while (firstNonWs < line.to && /\s/.test(state.doc.sliceString(firstNonWs, firstNonWs + 1))) {
      firstNonWs++;
    }
    const depth = listDepthAt(tree.resolveInner(firstNonWs, 1));
    const isCode = codeLines.has(ln);
    if (!isCode && depth === 0) continue;
    ranges.push(
      Decoration.line({
        class: isCode ? "cm-md-code" : undefined,
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

// Pressing ArrowDown at the very end of the document appends a fresh line and
// moves into it — the escape hatch for getting out of a trailing code block.
const exitDownAtDocEnd: KeyBinding = {
  key: "ArrowDown",
  run: (view) => {
    const { state } = view;
    const sel = state.selection.main;
    if (!sel.empty || sel.head !== state.doc.length) return false;
    view.dispatch({
      changes: { from: state.doc.length, insert: "\n" },
      selection: { anchor: state.doc.length + 1 },
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
    // exitDownAtDocEnd first so it wins over the default ArrowDown binding.
    // markdownKeymap continues `- ` lists on Enter (keeps the hyphen).
    keymap.of([exitDownAtDocEnd, ...markdownKeymap, ...defaultKeymap, ...historyKeymap]),
  ];
}
