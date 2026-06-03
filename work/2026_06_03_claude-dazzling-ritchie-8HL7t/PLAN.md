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
- [ ] Add reader/runtime deps to `dependencies`: `@lezer/markdown`,
  `@lezer/highlight`, `@lezer/javascript`, `@lezer/json`.
- [ ] Add editor deps to `dependencies`: `@codemirror/state`, `@codemirror/view`,
  `@codemirror/language`, `@codemirror/commands`, `@codemirror/lang-markdown`,
  `@codemirror/lang-javascript`, `@codemirror/lang-json`.

### Shared core (pure, SSR-safe — `src/common/markdown/`)
- [ ] `parse.ts` — configure and export the `@lezer/markdown` parser, including
  `parseCode` nesting that maps fence info (`js`/`ts`/`tsx`/`json`) to
  `@lezer/javascript` / `@lezer/json`. No `@codemirror/*` imports.
- [ ] `highlight.ts` — re-export `classHighlighter` and any small shared helpers
  so editor and reader provably use the same highlighter.
- [ ] `tokens.ts` (or constants) — shared class names for the non-highlight
  decorations: hidden-fence class and list-indent class, used by both sides.

### Stylesheet (one source of truth — `src/index.css`)
- [ ] Add markdown rules keyed on `tok-*` classes using existing theme tokens:
  headings → `mauve`/colour scale, code tokens (keyword/string/number/comment),
  inline-code/`monospace`, plus the hidden-fence class (`display:none`) and the
  list-indent class (`padding-left`). Scope so the same classes render the same in
  the reader container and inside `.cm-content`.

### Reader (SSR — `src/common/ui-components/`)
- [ ] `Markdown.tsx` — `({ source }: { source: string })`: parse with the shared
  parser, run `highlightTree(tree, classHighlighter, …)`, build a React element
  tree of styled `<span>`s line by line; hide fence marks, add indent class to
  list lines. Pure (no `@codemirror/*`).
- [ ] `Markdown.stories.tsx` — stories covering headers, hyphen lists, a fenced
  JS/TS/JSON block, inline code, and mixed content (acts as the visual reference
  the editor must match).

### Editor (client-only — `src/common/markdown/` + `src/common/ui-components/`)
- [ ] `editorExtensions.ts` — assemble CM extensions: `markdown({ codeLanguages })`,
  `markdownKeymap`, `syntaxHighlighting(classHighlighter)`, a `ViewPlugin` that
  (a) `Decoration.replace`s fence `CodeMark` nodes except on the cursor line and
  (b) adds the list-indent line decoration, plus a minimal theme (no gutters,
  transparent bg, matched typography). Imports `@codemirror/*` (client only).
- [ ] `MarkdownEditor.tsx` — controlled wrapper: creates an `EditorView` inside
  `useEffect`, props `{ value, onChange, placeholder }`, syncs external value
  changes, destroys the view on unmount. Imports `@codemirror/*` (client only);
  this is the module that gets lazy-imported.

### Wiring
- [ ] `useBlogEditor.ts` — drop `bodyRef`/`textContent` and the
  `textContent`-setting `useEffect`; expose `body` (initial value) and
  `handleBodyChange(value: string)` that schedules the debounced save. Keep the
  800ms debounce and pending-field batching.
- [ ] `BlogEditor.tsx` (desktop + mobile) — replace the `contentEditable` div with
  `<Suspense fallback={…}><LazyMarkdownEditor value={body} onChange={handleBodyChange} placeholder="Start writing..." /></Suspense>`,
  where `LazyMarkdownEditor = React.lazy(() => import('…/MarkdownEditor'))`.
  Preserve surrounding layout/classes.
- [ ] `BlogPost.tsx` (desktop + mobile) — replace the `post.body.map(<p>)` block
  with `<Markdown source={dbMatch.body} />`.
- [ ] `utils.ts` — change `dbPostToPost` `body` from `string[]` to the raw string;
  confirm `excerpt` and `BlogList` are unaffected.

### Verify
- [ ] `./scripts/validate` (lint, type-check, tests) passes.
- [ ] `npm run build` succeeds and SSR output contains **no** `@codemirror/*` in
  the server function bundle (reader is `@lezer/*`-only); confirm the editor chunk
  is split out (lazy).
- [ ] Manual smoke (dev): editor shows coloured headers with `#` kept, Enter
  continues `- ` hyphens with indent, ` ```js ` + Enter hides backticks and
  highlights code; reader view of the same post matches.

## Report
