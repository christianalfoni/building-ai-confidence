// SSR-safe Markdown reader. Renders the raw markdown *with its markers kept*
// (so `# Heading` keeps the `#`, `- item` keeps the hyphen), mirroring exactly
// what the CodeMirror editor shows. It parses with the shared Lezer grammar and
// colours tokens via the shared highlighter, so the read view and the edit view
// look identical.
//
// Pure: imports only `@lezer/*` (no `@codemirror/view`), safe during SSR.
import { Fragment, type ReactNode } from "react";
import type { SyntaxNode, Tree } from "@lezer/common";
import { highlightTree } from "@lezer/highlight";
import { markdownParser } from "../markdown/parse";
import { markdownHighlighter } from "../markdown/highlight";
import { LIST_INDENT_REM, MD_LINE_CLASS } from "../markdown/tokens";

type Span = { from: number; to: number; cls: string };

export function Markdown({ source }: { source: string }) {
  if (!source) return null;

  const tree = markdownParser.parse(source);

  // 1. Collect highlight ranges (leaf-level, sorted, non-overlapping).
  const spans: Span[] = [];
  highlightTree(tree, markdownHighlighter, (from, to, cls) => {
    spans.push({ from, to, cls });
  });

  // 2. Find code-fence delimiter lines so we can hide the ``` markers, and find
  //    list nesting depth per offset for indentation.
  const lines = splitLines(source);
  const fenceLineSet = new Set<number>();
  const codeLineSet = new Set<number>();
  tree.iterate({
    enter: (n) => {
      if (n.name === "CodeMark") fenceLineSet.add(lineIndexAt(lines, n.from));
      if (n.name === "CodeText") {
        for (let i = lineIndexAt(lines, n.from); i <= lineIndexAt(lines, n.to); i++) {
          codeLineSet.add(i);
        }
      }
    },
  });

  return (
    <div className="md-reader">
      {lines.map((line, i) => {
        if (fenceLineSet.has(i)) return null; // hide ``` fence lines

        const depth = listDepthAt(tree, line, source);
        const children = renderLine(line, source, spans);
        const className = codeLineSet.has(i) ? `${MD_LINE_CLASS} md-line-code` : MD_LINE_CLASS;
        return (
          <div
            key={i}
            className={className}
            style={depth > 0 ? { paddingLeft: `${depth * LIST_INDENT_REM}rem` } : undefined}
          >
            {children.length > 0 ? children : " "}
          </div>
        );
      })}
    </div>
  );
}

type Line = { from: number; to: number };

function splitLines(source: string): Line[] {
  const out: Line[] = [];
  let from = 0;
  for (let i = 0; i <= source.length; i++) {
    if (i === source.length || source[i] === "\n") {
      out.push({ from, to: i });
      from = i + 1;
    }
  }
  return out;
}

function lineIndexAt(lines: Line[], offset: number): number {
  for (let i = 0; i < lines.length; i++) {
    if (offset >= lines[i].from && offset <= lines[i].to) return i;
  }
  return lines.length - 1;
}

// Number of ListItem ancestors at the line's first non-whitespace character.
function listDepthAt(tree: Tree, line: Line, source: string): number {
  let offset = line.from;
  while (offset < line.to && /\s/.test(source[offset])) offset++;
  let depth = 0;
  let n: SyntaxNode | null = tree.resolveInner(offset, 1);
  for (; n; n = n.parent) {
    if (n.name === "ListItem") depth++;
  }
  return depth;
}

// Render one line's text, slicing in the highlight spans that overlap it.
function renderLine(line: Line, source: string, spans: Span[]): ReactNode[] {
  const out: ReactNode[] = [];
  let pos = line.from;
  for (const s of spans) {
    if (s.to <= line.from) continue;
    if (s.from >= line.to) break;
    const from = Math.max(s.from, line.from);
    const to = Math.min(s.to, line.to);
    if (from >= to) continue;
    if (from > pos) out.push(<Fragment key={`t${pos}`}>{source.slice(pos, from)}</Fragment>);
    out.push(
      <span key={`s${from}`} className={s.cls}>
        {source.slice(from, to)}
      </span>,
    );
    pos = to;
  }
  if (pos < line.to) out.push(<Fragment key={`t${pos}`}>{source.slice(pos, line.to)}</Fragment>);
  return out;
}
