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
import { IMAGE_LINE_RE, LIST_INDENT_REM, MD_IMAGE_CLASS, MD_LINE_CLASS } from "../markdown/tokens";

type Span = { from: number; to: number; cls: string };
// An inline link `[text](url)`: `from`/`to` bound the whole token; `textFrom`/
// `textTo` bound just the visible link text; `url` is the destination. Rendered
// as a clean anchor (markers + URL hidden), showing only the link text.
type LinkSpan = { from: number; to: number; textFrom: number; textTo: number; url: string };

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
  // Mirrors the editor: the ``` lines are collapsed away (`fence`); only the code
  // content lines form the box, the first/last rounding its corners.
  const codeBlock = new Map<number, { fence: boolean; top: boolean; bottom: boolean }>();
  const hidden: Array<[number, number]> = [];
  // Inline links are woven into the text by renderLine as real anchors.
  const links: LinkSpan[] = [];
  tree.iterate({
    enter: (n) => {
      if (n.name === "Link") {
        const node = n.node;
        const marks = node.getChildren("LinkMark");
        const url = node.getChild("URL");
        // Only standard inline links `[text](url)`. Reference links (no URL
        // child) fall through and render as their raw text. The first two
        // LinkMarks are the `[` and `]` around the text.
        if (url && marks.length >= 2) {
          links.push({
            from: node.from,
            to: node.to,
            textFrom: marks[0].to,
            textTo: marks[1].from,
            url: source.slice(url.from, url.to),
          });
        }
        return;
      }
      if (n.name !== "FencedCode") return;
      const first = lineIndexAt(lines, n.from);
      const last = lineIndexAt(lines, Math.max(n.from, n.to - 1));
      if (first === last) return; // single-line ``` — not a block yet
      const top = first + 1;
      const bottom = last - 1;
      for (let i = first; i <= last; i++) {
        codeBlock.set(i, { fence: i === first || i === last, top: i === top, bottom: i === bottom });
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
        // A line that is solely a markdown image renders as a centered, non-
        // clickable block image — mirroring the editor's image widget. Lines
        // inside a fenced code block stay literal (code is code).
        const img = codeBlock.has(i)
          ? null
          : IMAGE_LINE_RE.exec(source.slice(line.from, line.to));
        if (img && !img[2].startsWith("uploading:")) {
          return (
            <div key={i} className={`${MD_LINE_CLASS} md-line-image`}>
              <img className={MD_IMAGE_CLASS} src={img[2]} alt={img[1]} draggable={false} />
            </div>
          );
        }
        const depth = listDepthAt(tree, line, source);
        const children = renderLine(line, source, spans, hidden, links);
        const block = codeBlock.get(i);
        const classes = [MD_LINE_CLASS];
        if (block?.fence) {
          classes.push("md-line-code-fence");
        } else if (block) {
          classes.push("md-line-code");
          if (block.top) classes.push("md-line-code-open");
          if (block.bottom) classes.push("md-line-code-close");
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

// Binary search for the line containing `offset` (lines are sorted by `from` and
// partition the source), so repeated lookups inside tree.iterate stay O(log n).
function lineIndexAt(lines: Line[], offset: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lines[mid].from <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
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

// Render a sub-range of source text, slicing in the highlight spans that overlap
// it while dropping any hidden ranges (the ``` fence marks) so they never show.
// The workhorse for both plain text and a link's inner text.
function renderRange(
  rangeFrom: number,
  rangeTo: number,
  source: string,
  spans: Span[],
  hidden: Array<[number, number]>,
): ReactNode[] {
  if (rangeFrom >= rangeTo) return [];
  // Visible sub-ranges = the range minus the hidden mark ranges.
  const cuts = hidden
    .filter(([f, t]) => t > rangeFrom && f < rangeTo)
    .map(([f, t]): [number, number] => [Math.max(f, rangeFrom), Math.min(t, rangeTo)])
    .sort((a, b) => a[0] - b[0]);
  const segments: Array<[number, number]> = [];
  let cursor = rangeFrom;
  for (const [hf, ht] of cuts) {
    if (hf > cursor) segments.push([cursor, hf]);
    cursor = Math.max(cursor, ht);
  }
  if (cursor < rangeTo) segments.push([cursor, rangeTo]);

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

// Render one line, weaving inline links into the highlighted text: each link
// becomes a real <a> showing only its link text (the `[`, `]` and `(url)` are
// dropped) that opens in a new tab. Non-link stretches render as plain
// highlighted text via renderRange.
function renderLine(
  line: Line,
  source: string,
  spans: Span[],
  hidden: Array<[number, number]>,
  links: LinkSpan[],
): ReactNode[] {
  const lineLinks = links
    .filter((l) => l.to > line.from && l.from < line.to)
    .sort((a, b) => a.from - b.from);

  const out: ReactNode[] = [];
  let cursor = line.from;
  for (const link of lineLinks) {
    if (link.from > cursor) {
      out.push(...renderRange(cursor, Math.min(link.from, line.to), source, spans, hidden));
    }
    const tFrom = Math.max(link.textFrom, line.from);
    const tTo = Math.min(link.textTo, line.to);
    const inner = renderRange(tFrom, tTo, source, spans, hidden);
    out.push(
      <a
        key={`l${link.from}`}
        className="md-link"
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {inner.length > 0 ? inner : source.slice(tFrom, tTo)}
      </a>,
    );
    cursor = Math.min(link.to, line.to);
  }
  if (cursor < line.to) {
    out.push(...renderRange(cursor, line.to, source, spans, hidden));
  }
  return out;
}
