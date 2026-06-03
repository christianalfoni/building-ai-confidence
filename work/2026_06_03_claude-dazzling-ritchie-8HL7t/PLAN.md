# Markdown editor (CodeMirror 6) + matching SSR reader

## Summary

Replace the article body editor (currently a bare `contentEditable` div) with a
CodeMirror 6 editor that keeps the text as literal Markdown but *decorates* it:
headers get a colour (the `#` stays), `- ` lists continue as hyphens and indent,
and ` ``` ` fenced blocks hide their backticks and highlight the code by language.

The published reader must look **identical** to the editor, including the raw
markers (`#`, `-` kept visible). To guarantee that without maintaining two
look-alike renderers, both sides share **one Lezer Markdown grammar** and **one
stylesheet**: the editor parses via `@codemirror/lang-markdown` (which wraps the
Lezer grammar) and the reader parses the same source with `@lezer/markdown`
standalone, walking the tree into React `<span>`s. Both emit the **same
`tok-*` highlight classes** (via `@lezer/highlight`'s `classHighlighter`), so a
single set of CSS rules styles editor and reader together.

CodeMirror is **client-only** and lazy-loaded so it never runs during SSR; the
reader is pure JS (`@lezer/*` only, no DOM) and fully server-rendered. Stored
data is unchanged — `DbPost.body` stays a Markdown string.

## Considerations

**Why not `react-markdown`/`marked`.** Those render Markdown to clean HTML and
*strip* the markers. The confirmed requirement is the opposite — the reader
mirrors the raw markers exactly. A renderer that drops `#`/`-` would have to be
fought to put them back, and we'd be chasing visual parity between two unrelated
renderers forever.

**The shared-grammar trick.** `@codemirror/lang-markdown` and `@lezer/markdown`
use the *same* Markdown grammar and the *same* highlight tags. If the editor uses
`syntaxHighlighting(classHighlighter)` and the reader uses
`highlightTree(tree, classHighlighter, …)`, both emit identical class names
(`tok-heading1`, `tok-monospace`, …). One CSS file then styles both → "look the
same" holds by construction, not by manual sync.

**SSR isolation.** `entry-server.tsx` statically imports both platform `App`
trees, which import `BlogEditor`. So `BlogEditor` must **not** statically import
any `@codemirror/*` module (those pull `@codemirror/view`, which touches the DOM
and `navigator`). The CM wrapper is loaded with `React.lazy(() => import(…))`, so
its code only enters the bundle/runtime in the browser when the editor view
opens. The reader module imports only `@lezer/*` (pure, SSR-safe) and never any
`@codemirror/*`.

**Three behaviours.**
1. *Header colour* — purely the shared `tok-heading*` CSS rule; `#` kept on both
   sides automatically.
2. *Hyphen lists* — editor binds Enter to `markdownKeymap`'s
   `insertNewlineContinueMarkup` (continues `- `, no bullet conversion exists to
   disable); a CM line decoration indents `ListItem` lines, and the reader adds
   the same indent class to list lines. Hyphen stays on both.
3. *Code blocks* — editor: a `ViewPlugin` walks the tree and `Decoration.replace`s
   the fence `CodeMark` nodes to hide the backticks (revealed when the cursor is
   on that line), and code is highlighted by language. Reader: fence marks get a
   hidden class and the code tokens get the same highlight classes; no
   cursor-reveal needed.

**Code-language grammars differ per side (intentionally).** The structure grammar
is shared, but highlighting *inside* fences needs a language parser. The editor
uses CodeMirror language packages (`@codemirror/lang-javascript`,
`@codemirror/lang-json`) via the `codeLanguages` option; the reader uses the raw
Lezer grammars (`@lezer/javascript`, `@lezer/json`) wired through
`@lezer/markdown`'s `parseCode` nesting (keeps the reader DOM-free). Both map to
the same highlight tags → same `tok-*` classes → same CSS. We start with
JS/TS/JSON and can grow the set later.

**`dbPostToPost` change.** Today it splits `body` into a `string[]` for the old
`<p>` rendering. The reader now takes the raw string, so `body` becomes the raw
string (excerpt slice is unaffected). The only consumer of the array form is
`BlogPost` (both platforms), which is rewritten here; `BlogList` uses `excerpt`,
not `body`.

**Editor/reader pixel parity.** The CM editor is configured to look like static
text: no gutters/line-numbers, transparent background, no active-line highlight,
and font family / size / line-height matched to the reader's container. Final
visual comparison via screenshots is deferred (user's call) — structure and
classes are wired so they *can* match.

**Versions (latest, June 2026):** `@codemirror/state@6.6.0`,
`@codemirror/view@6.43.0`, `@codemirror/language@6.12.3`,
`@codemirror/commands@6.10.3`, `@codemirror/lang-markdown@6.5.0`,
`@codemirror/lang-javascript@6.2.5`, `@codemirror/lang-json@6.0.2`,
`@lezer/markdown@1.6.4`, `@lezer/highlight@1.2.3`, plus `@lezer/javascript`,
`@lezer/json`. (`@codemirror/lang-markdown` repo was archived Apr 2026 but the
npm package is current and functional.)

## Tasks

### Dependencies
- [x] Add reader/runtime deps to `dependencies`: `@lezer/markdown`,
  `@lezer/highlight`, `@lezer/javascript`, `@lezer/json`.
- [x] Add editor deps to `dependencies`: `@codemirror/state`, `@codemirror/view`,
  `@codemirror/language`, `@codemirror/commands`, `@codemirror/lang-markdown`,
  `@codemirror/lang-javascript`, `@codemirror/lang-json`.

### Shared core (pure, SSR-safe — `src/common/markdown/`)
- [x] `parse.ts` — configure and export the `@lezer/markdown` parser, including
  `parseCode` nesting that maps fence info (`js`/`ts`/`tsx`/`json`) to
  `@lezer/javascript` / `@lezer/json`. No `@codemirror/*` imports.
- [x] `highlight.ts` — shared custom `tagHighlighter` (chosen over `classHighlighter`
  so we control mark/monospace classes) used by both editor and reader.
- [x] `tokens.ts` — shared constants (`LIST_INDENT_REM`, `MD_LINE_CLASS`) for the
  non-highlight decorations, used by both sides.

### Stylesheet (one source of truth — `src/index.css`)
- [x] Add markdown rules keyed on `tok-*` classes using existing theme tokens:
  headings → `mauve`, code tokens (keyword/string/number/comment), `monospace`,
  code-line background, list indent (inline style via shared constant), plus
  CodeMirror chrome (transparent bg, no outline, matched typography). Scoped so the
  same classes render the same in `.md-reader` and inside `.cm-content`.

### Reader (SSR — `src/common/ui-components/`)
- [x] `Markdown.tsx` — `({ source }: { source: string })`: parse with the shared
  parser, run `highlightTree(tree, markdownHighlighter, …)`, render line by line
  with styled `<span>`s; hide ``` fence lines, mark code lines, indent list lines
  by nesting depth. Pure (no `@codemirror/*`).
- [x] `Markdown.stories.tsx` — stories covering headers, hyphen lists, fenced
  TS/JSON/JS blocks, inline code, and mixed content (visual reference the editor
  must match).

### Editor (client-only — `src/common/markdown/` + `src/common/ui-components/`)
- [x] `editorExtensions.ts` — assemble CM extensions: `markdown({ base, codeLanguages })`,
  `markdownKeymap`, `syntaxHighlighting(markdownHighlighter)`, a `ViewPlugin` that
  (a) `Decoration.replace`s fence `CodeMark`/`CodeInfo` nodes except on the cursor
  line and (b) adds code-line background + list-indent line decorations. Minimal
  setup (no gutters/line-numbers; transparent bg/typography via CSS). Client-only.
- [x] `MarkdownEditor.tsx` — controlled wrapper: creates an `EditorView` inside
  `useEffect`, props `{ value, onChange, placeholder }`, syncs external value
  changes, destroys the view on unmount. Default export, lazy-imported.

### Wiring
- [x] `useBlogEditor.ts` — dropped `bodyRef`/`textContent`; exposes `body` (seeded
  from the draft) and `handleBodyChange(value)` that schedules the debounced save.
  Kept the 800ms debounce and pending-field batching.
- [x] `BlogEditor.tsx` (desktop + mobile) — replaced the `contentEditable` div with
  `<Suspense><LazyMarkdownEditor value={body} onChange={handleBodyChange} … /></Suspense>`,
  `LazyMarkdownEditor = lazy(() => import('…/MarkdownEditor'))`. Layout preserved.
- [x] `BlogPost.tsx` (desktop + mobile) — replaced the `post.body.map(<p>)` block
  with `<Markdown source={post.body} />`.
- [x] `utils.ts` — `dbPostToPost` `body` is now the raw string; `excerpt` and
  `BlogList` (uses `excerpt`, not `body`) unaffected.

### Verify
- [x] `./scripts/validate` (lint, type-check, tests) passes (27 tests, incl. new
  `Markdown.test.tsx`).
- [x] `npm run build` succeeds; the editor is a separate lazy chunk
  (`MarkdownEditor-*.js`, 321 kB). `@codemirror/*` IS inlined into the single-file
  server bundle (the SSR build has no code-splitting) but is wrapped in esbuild's
  lazy `__esm` initializer and only invoked via `React.lazy(() => import(...))` —
  so it never executes during SSR. The reader path is `@lezer/*`-only.
- [~] Manual interactive smoke (cursor-reveal of fences, Enter list continuation)
  deferred to the screenshot/visual pass; reader behaviour is covered by unit
  tests and the build.

## Report

Implemented the CodeMirror 6 editor + matching SSR reader, both driven by one
shared Lezer grammar and one stylesheet.

**What was built**
- Shared core (`src/common/markdown/`): `parse.ts` (standalone `@lezer/markdown`
  with `parseCode` nesting → JS/TS/TSX/JSON), `highlight.ts` (a custom
  `tagHighlighter` shared by both sides), `tokens.ts` (shared constants).
- Reader (`src/common/ui-components/Markdown.tsx`): pure, SSR-safe; renders raw
  markdown line by line keeping `#`/`-` visible, hides ``` fence lines, marks
  code lines, indents list lines by nesting depth, and applies the shared
  `tok-*` highlight classes. Covered by `Markdown.test.tsx` and
  `Markdown.stories.tsx` (4 stories).
- Editor (`src/common/markdown/editorExtensions.ts` +
  `src/common/ui-components/MarkdownEditor.tsx`): CM6 with `markdown({ base,
  codeLanguages })`, `syntaxHighlighting(markdownHighlighter)`, `markdownKeymap`
  (Enter continues `- ` hyphen lists), and a `ViewPlugin` that hides fence
  marks except on the cursor line and adds code-block / list-indent line
  decorations. Default export, lazy-imported (client-only).
- Stylesheet (`src/index.css`): one block of `tok-*` rules + CodeMirror chrome,
  styling reader and editor identically.
- Wiring: `useBlogEditor` now exposes `body` + `handleBodyChange` (controlled
  value, same 800 ms debounce); both `BlogEditor`s lazy-load `MarkdownEditor`
  behind `<Suspense>`; both `BlogPost`s render `<Markdown source={post.body} />`;
  `dbPostToPost.body` is now the raw markdown string.

**Deviations from the plan**
- Used a custom `tagHighlighter` instead of the library `classHighlighter`, to
  control the marker (`tok-mark`) and `tok-monospace` classes. Both sides still
  share the exact same highlighter instance.
- The plan's "no `@codemirror/*` in the server bundle" is literally not true: the
  single-file SSR build (no code-splitting) inlines it. The *intent* holds — it's
  wrapped in a lazy `__esm` init and only runs client-side via `React.lazy`, so it
  never executes during SSR (verified in the built bundle).

**Known follow-ups (visual polish, deferred to screenshots)**
- Editor shows an empty line where a hidden fence was (when the cursor is
  elsewhere); the reader drops the fence line entirely. Minor asymmetry.
- Heading markers render dim (`tok-mark` wins over `tok-heading` by source order);
  acceptable but tunable.

**Validation:** `./scripts/validate` — lint ✓, `tsc -b` ✓, tests ✓ (27 passed).
`npm run build` ✓ (editor split into its own lazy chunk).

**Post-review refinements**
- Visible blinking caret + styled selection via `drawSelection()` (the native
  contentEditable caret was invisible).
- Preload the CodeMirror chunk for signed-in users (`preloadMarkdownEditor`) so
  the first edit opens instantly.
- Code blocks: typing ` ``` ` + Enter auto-inserts the closing fence (cursor on an
  empty code line); backspacing an empty block removes both fences; selection is
  now visible inside code lines (editor code background made translucent so the
  selection layer shows through). Replaced the earlier ArrowDown escape hatch.
