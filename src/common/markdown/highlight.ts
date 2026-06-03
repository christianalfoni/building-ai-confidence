// Shared syntax highlighter used by BOTH the CodeMirror editor and the SSR
// reader. Because both sides feed the same `@lezer` syntax tree through the
// SAME highlighter, they emit identical `tok-*` class names — so a single set
// of CSS rules (in src/index.css) styles the editor and the reader the same.
//
// Pure: imports only `@lezer/highlight`, no DOM / no `@codemirror/view`, so it
// is safe to run during SSR.
import { tagHighlighter, tags } from "@lezer/highlight";

export const markdownHighlighter = tagHighlighter([
  // --- Markdown structure ---
  { tag: tags.heading, class: "tok-heading" },
  { tag: tags.processingInstruction, class: "tok-mark" }, // # - ``` etc.
  { tag: tags.monospace, class: "tok-monospace" }, // inline code + code text
  { tag: tags.emphasis, class: "tok-emphasis" },
  { tag: tags.strong, class: "tok-strong" },
  { tag: tags.link, class: "tok-link" },
  { tag: tags.url, class: "tok-url" },
  { tag: tags.list, class: "tok-list" },
  { tag: tags.quote, class: "tok-quote" },
  { tag: tags.labelName, class: "tok-labelName" },

  // --- Code tokens (from the nested JS/TS/JSON grammars) ---
  { tag: tags.keyword, class: "tok-keyword" },
  { tag: tags.string, class: "tok-string" },
  {
    tag: [tags.regexp, tags.escape, tags.special(tags.string)],
    class: "tok-string2",
  },
  { tag: tags.number, class: "tok-number" },
  { tag: tags.bool, class: "tok-bool" },
  { tag: tags.atom, class: "tok-atom" },
  { tag: tags.comment, class: "tok-comment" },
  { tag: tags.operator, class: "tok-operator" },
  { tag: tags.punctuation, class: "tok-punctuation" },
  { tag: tags.propertyName, class: "tok-propertyName" },
  { tag: tags.variableName, class: "tok-variableName" },
  {
    tag: tags.definition(tags.variableName),
    class: "tok-variableName tok-definition",
  },
  { tag: tags.typeName, class: "tok-typeName" },
  { tag: tags.className, class: "tok-className" },
  { tag: tags.literal, class: "tok-literal" },
]);
