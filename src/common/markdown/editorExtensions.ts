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
  WidgetType,
  drawSelection,
  keymap,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
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
import { IMAGE_LINE_RE, LIST_INDENT_REM, MD_IMAGE_CLASS } from "./tokens";

// A still-uploading image carries this sentinel as its URL so the decoration
// shows the raw markdown (not a broken <img>) until the real URL swaps in.
const UPLOAD_SENTINEL = "uploading:";

// Added to the image when the selection is on its line, so it reads as a
// selected unit (highlight ring) instead of revealing its markdown.
const IMAGE_SELECTED_CLASS = "cm-md-image-selected";

export type EditorOptions = {
  // Uploads a PNG and resolves to its public URL. Supplied by the app layer;
  // when absent (e.g. tests/SSR), drop/paste upload is disabled.
  uploadImage?: (file: File) => Promise<string>;
};

// Renders an image-only markdown line as a centered, non-clickable image. The
// line never reverts to raw text; when selected it gains a highlight ring, and
// Backspace removes the whole line (see imageLineAt / deleteImageLine).
class ImageWidget extends WidgetType {
  readonly url: string;
  readonly alt: string;
  readonly selected: boolean;
  constructor(url: string, alt: string, selected: boolean) {
    super();
    this.url = url;
    this.alt = alt;
    this.selected = selected;
  }
  eq(other: ImageWidget) {
    return other.url === this.url && other.alt === this.alt && other.selected === this.selected;
  }
  toDOM() {
    const img = document.createElement("img");
    img.src = this.url;
    img.alt = this.alt;
    img.className = this.selected ? `${MD_IMAGE_CLASS} ${IMAGE_SELECTED_CLASS}` : MD_IMAGE_CLASS;
    img.draggable = false;
    return img;
  }
}

// The line at `pos` when it is an image-only line that should behave as a single
// image unit: matches the image syntax, isn't a pending upload, and isn't inside
// a fenced code block (where ``` content must stay literal). Otherwise null.
export function imageLineAt(state: EditorState, pos: number) {
  const line = state.doc.lineAt(pos);
  const m = IMAGE_LINE_RE.exec(line.text);
  if (!m || m[2].startsWith(UPLOAD_SENTINEL)) return null;
  for (let n: SyntaxNode | null = syntaxTree(state).resolveInner(line.from, 1); n; n = n.parent) {
    if (n.name === "FencedCode") return null;
  }
  return line;
}

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

  // Image-only lines render as a centered <img> — always, so the image never
  // flips back to its markdown. When the selection is on the line the image
  // shows a highlight (selected unit); pending uploads and code-fence lines stay
  // as literal text.
  for (let ln = 1; ln <= state.doc.lines; ln++) {
    if (codeBlock.has(ln)) continue;
    const line = state.doc.line(ln);
    const m = IMAGE_LINE_RE.exec(line.text);
    if (!m) continue;
    const [, alt, url] = m;
    if (url.startsWith(UPLOAD_SENTINEL)) continue;
    const selected = state.selection.ranges.some((r) => r.from <= line.to && r.to >= line.from);
    ranges.push(
      Decoration.replace({ widget: new ImageWidget(url, alt, selected) }).range(line.from, line.to),
    );
  }

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

// When the caret moves *into* an image line, expand the selection to cover the
// whole line so the image reads as a selected unit. Expansion only happens
// strictly inside the line, leaving its two boundaries as places the cursor
// passes through — so arrowing past an image navigates naturally rather than
// trapping the cursor on it.
const imageSelection = EditorState.transactionFilter.of((tr) => {
  if (!tr.selection || tr.docChanged) return tr;
  const range = tr.newSelection.main;
  if (!range.empty) return tr;
  const line = imageLineAt(tr.state, range.head);
  if (!line || range.head <= line.from || range.head >= line.to) return tr;
  return [tr, { selection: { anchor: line.from, head: line.to } }];
});

// The doc range to remove when deleting an image line: the line plus one
// adjacent newline so no blank gap is left behind.
export function imageLineDeletion(state: EditorState): { from: number; to: number } | null {
  const line = imageLineAt(state, state.selection.main.head);
  if (!line) return null;
  let from = line.from;
  let to = line.to;
  if (to < state.doc.length && state.doc.sliceString(to, to + 1) === "\n") to += 1;
  else if (from > 0 && state.doc.sliceString(from - 1, from) === "\n") from -= 1;
  return { from, to };
}

// Backspace/Delete while the selection is on an image line removes the whole
// line (its markdown), which removes the image.
function makeDeleteImageLine(key: string): KeyBinding {
  return {
    key,
    run: (view) => {
      const del = imageLineDeletion(view.state);
      if (!del) return false;
      view.dispatch({
        changes: { from: del.from, to: del.to, insert: "" },
        selection: { anchor: del.from },
        scrollIntoView: true,
      });
      return true;
    },
  };
}

const deleteImageLineBack = makeDeleteImageLine("Backspace");
const deleteImageLineForward = makeDeleteImageLine("Delete");

// The PNG files in a drop/paste payload (we only support PNG).
function pngFiles(data: DataTransfer | null): File[] {
  if (!data) return [];
  return Array.from(data.files).filter((f) => f.type === "image/png");
}

// Alt text from a filename: drop the extension and strip characters that would
// break the markdown image token or the image-line regex (brackets, parens,
// newlines). Collapses whitespace; may end up empty, which is a valid alt.
function altFromFile(file: File): string {
  return file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[[\]()\r\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Inserts an image on its own line at `pos`, uploads it, then swaps the pending
// placeholder URL for the real one (or removes the line if the upload fails).
function insertImageUpload(
  view: EditorView,
  file: File,
  pos: number,
  uploadImage: (file: File) => Promise<string>,
) {
  const alt = altFromFile(file);
  const nonce = crypto.randomUUID();
  const pendingUrl = `${UPLOAD_SENTINEL}${nonce}`;
  const token = `![${alt}](${pendingUrl})`;

  // Force the image onto its own line.
  const line = view.state.doc.lineAt(pos);
  const prefix = pos === line.from ? "" : "\n";
  const suffix = pos === line.to ? "" : "\n";
  const insert = `${prefix}${token}${suffix}`;
  const tokenFrom = pos + prefix.length;

  view.dispatch({
    changes: { from: pos, insert },
    selection: { anchor: tokenFrom + token.length },
    scrollIntoView: true,
  });

  // Locate the pending URL (unique per upload) in the possibly-mutated doc.
  // Tracking just the URL — not the whole token — survives the author editing the
  // alt text while the upload is in flight.
  const findPendingUrl = () => {
    const idx = view.state.doc.toString().indexOf(pendingUrl);
    return idx === -1 ? null : idx;
  };

  uploadImage(file)
    .then((url) => {
      const idx = findPendingUrl();
      if (idx === null) return; // author deleted the placeholder — nothing to do
      // Replace only the URL, preserving any alt-text edits made meanwhile.
      view.dispatch({ changes: { from: idx, to: idx + pendingUrl.length, insert: url } });
    })
    .catch((err) => {
      console.error("[image upload]", err);
      const idx = findPendingUrl();
      if (idx === null) return;
      // Remove the whole placeholder line plus one adjacent newline so no blank
      // line lingers.
      const line = view.state.doc.lineAt(idx);
      let from = line.from;
      let to = line.to;
      if (to < view.state.doc.length && view.state.doc.sliceString(to, to + 1) === "\n") to += 1;
      else if (from > 0 && view.state.doc.sliceString(from - 1, from) === "\n") from -= 1;
      view.dispatch({ changes: { from, to, insert: "" } });
    });
}

// Drag-drop and paste of a PNG: upload it and insert the image at the drop point
// (drop) or the caret (paste). Only the first PNG in a payload is handled.
function imageDropPaste(uploadImage: (file: File) => Promise<string>): Extension {
  return EditorView.domEventHandlers({
    drop(event, view) {
      const [file] = pngFiles(event.dataTransfer);
      if (!file) return false;
      event.preventDefault();
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY }) ?? view.state.selection.main.head;
      insertImageUpload(view, file, pos, uploadImage);
      return true;
    },
    paste(event, view) {
      const [file] = pngFiles(event.clipboardData);
      if (!file) return false;
      event.preventDefault();
      insertImageUpload(view, file, view.state.selection.main.head, uploadImage);
      return true;
    },
  });
}

export function editorExtensions(opts: EditorOptions = {}): Extension[] {
  return [
    markdown({ base: markdownLanguage, codeLanguages }),
    syntaxHighlighting(markdownHighlighter),
    history(),
    // Draw CodeMirror's own cursor/selection so the caret blinks and is styled
    // by our theme (the native contentEditable caret was effectively invisible).
    drawSelection(),
    decorationPlugin,
    imageSelection,
    EditorView.lineWrapping,
    ...(opts.uploadImage ? [imageDropPaste(opts.uploadImage)] : []),
    // deleteImageLine* and autoCloseFence / removeEmptyCodeBlock run before the
    // default Enter/Backspace bindings. markdownKeymap continues `- ` lists on
    // Enter (keeps the hyphen).
    keymap.of([
      deleteImageLineBack,
      deleteImageLineForward,
      autoCloseFence,
      removeEmptyCodeBlock,
      ...markdownKeymap,
      ...defaultKeymap,
      ...historyKeymap,
    ]),
  ];
}
