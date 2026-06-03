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
  const codeBlock = new Map<number, { open: boolean; close: boolean }>();
  const hidden: Array<[number, number]> = [];
  tree.iterate({
    enter: (n) => {
      if (n.name !== "FencedCode") return;
      const first = lineIndexAt(lines, n.from);
      const last = lineIndexAt(lines, Math.max(n.from, n.to - 1));
      if (first === last) return; // single-line ``` — not a block yet
      for (let i = first; i <= last; i++) {
        codeBlock.set(i, { open: i === first, close: i === last });
      }
      // Hide the ``` markers and the language info — both live behind the box.
      const node = n.node;
      for (const mk of node.getChildren("CodeMark")) hidden.push([mk.from, mk.to]);
      const info = node.getChild("CodeInfo");
      if (info) hidden.push([info.from, info.to]);
    },
  });

  return (
    <div className="md-reader">
      {lines.map((line, i) => {
        const depth = listDepthAt(tree, line, source);
        const children = renderLine(line, source, spans, hidden);
        const block = codeBlock.get(i);
        const classes = [MD_LINE_CLASS];
        if (block) {
          classes.push("md-line-code");
          if (block.open) classes.push("md-line-code-open");
          if (block.close) classes.push("md-line-code-close");
        }
        return (
          <div
            key={i}
            className={classes.join(" ")}
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

// Render one line's text, slicing in the highlight spans that overlap it, while
// dropping any hidden ranges (the ``` fence marks) so they never show.
function renderLine(
  line: Line,
  source: string,
  spans: Span[],
  hidden: Array<[number, number]>,
): ReactNode[] {
  // Visible sub-ranges of the line = the line minus the hidden mark ranges.
  const cuts = hidden
    .filter(([f, t]) => t > line.from && f < line.to)
    .map(([f, t]): [number, number] => [Math.max(f, line.from), Math.min(t, line.to)])
    .sort((a, b) => a[0] - b[0]);
  const segments: Array<[number, number]> = [];
  let cursor = line.from;
  for (const [hf, ht] of cuts) {
    if (hf > cursor) segments.push([cursor, hf]);
    cursor = Math.max(cursor, ht);
  }
  if (cursor < line.to) segments.push([cursor, line.to]);

  const out: ReactNode[] = [];
  for (const [segFrom, segTo] of segments) {
    let pos = segFrom;
    for (const s of spans) {
      if (s.to <= segFrom) continue;
      if (s.from >= segTo) break;
      const from = Math.max(s.from, segFrom);
      const to = Math.min(s.to, segTo);
      if (from >= to) continue;
      if (from > pos) out.push(<Fragment key={`t${pos}`}>{source.slice(pos, from)}</Fragment>);
      out.push(
        <span key={`s${from}`} className={s.cls}>
          {source.slice(from, to)}
        </span>,
      );
      pos = to;
    }
    if (pos < segTo) out.push(<Fragment key={`t${pos}`}>{source.slice(pos, segTo)}</Fragment>);
  }
  return out;
}
