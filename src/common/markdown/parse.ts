// Shared Markdown parser used by BOTH the CodeMirror editor and the SSR reader.
// The editor wraps this same Lezer grammar via `@codemirror/lang-markdown`; here
// we configure the standalone `@lezer/markdown` parser with nested code parsing
// so fenced blocks are highlighted by language.
//
// Pure: imports only `@lezer/*` grammars (no DOM / no `@codemirror/view`), so it
// is safe to run during SSR.
import type { Parser } from "@lezer/common";
import { parser as baseMarkdownParser, parseCode } from "@lezer/markdown";
import { parser as jsParser } from "@lezer/javascript";
import { parser as jsonParser } from "@lezer/json";

// Map the info string after the opening ``` to a language parser. Keep this list
// in sync with the editor's `codeLanguages` (editorExtensions.ts) so both sides
// highlight the same set of languages.
function codeParser(info: string): Parser | null {
  const lang = info.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  switch (lang) {
    case "js":
    case "javascript":
      return jsParser;
    case "jsx":
      return jsParser.configure({ dialect: "jsx" });
    case "ts":
    case "typescript":
      return jsParser.configure({ dialect: "ts" });
    case "tsx":
      return jsParser.configure({ dialect: "jsx ts" });
    case "json":
      return jsonParser;
    default:
      return null;
  }
}

export const markdownParser = baseMarkdownParser.configure([
  parseCode({ codeParser }),
]);
