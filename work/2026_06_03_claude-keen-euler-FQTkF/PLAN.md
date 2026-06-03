# Move SSR initial-data payload out of the React tree

## Summary
Today the SSR → client handoff payload is rendered as a hidden
`<div id="__initial_data__">` **inside** `#root`, so it's part of the React
tree. Because React owns that node, the client must reproduce it byte-for-byte
during hydration — which is the sole reason `entry-client.tsx` re-renders the
div and re-`JSON.stringify`s the data. This refactor moves the payload **out**
of the React tree into a `<script type="application/json" id="__initial_data__">`
tag written directly to the HTML stream as a sibling of `#root`. React never
sees it, so the redundant client-side div and re-stringify are deleted, and no
hydration mismatch is possible. The client keeps reading the payload exactly
once (`.textContent` + `JSON.parse`) before hydration.

## Considerations

**Chosen: JSON `<script>` tag as a sibling of `#root`.**
`type="application/json"` is inert — the browser neither executes nor renders
it — and because it lives outside `#root`, React's hydration never touches it.
This is the conventional pattern (e.g. Next.js `__NEXT_DATA__`).

**Injection point.** `entry-server.render()` already splits the template on
`<!--ssr-outlet-->` into `htmlStart` / `htmlEnd`, streaming the React shell
between them. Prepending the data script to `htmlEnd` places it right after the
closing `</div>` of `#root` and before the deferred `entry-client` module
script — outside root, and present in the DOM before the client runs. This
covers **both** the production path (`html-template.gen.ts`) and the dev path
(`vite.transformIndexHtml` of `index.html`), since both call the same
`render()`. No new template marker is required, so `index.html` and the
generated template stay untouched.

**Escaping.** Today the JSX text node auto-escapes `<`/`>`/`&`, so the hidden
div is accidentally XSS-safe. Writing the script tag as a raw string into the
stream loses that, so a post body containing `</script>` could break out. A
tiny helper escapes the JSON string: `<` → `\u003c` (defeats `</script>`),
plus `\u2028` / `\u2029` (valid in JSON but not in JS string literals / some
legacy parsers). This makes the handoff strictly more robust than today.

**Alternative ruled out: `window.__INITIAL_DATA__ = {…}` inline script.**
Slightly cheaper to read (no `getElementById`/`JSON.parse`), but it executes
JS, pollutes `window`, and still needs the same escaping. The inert JSON tag is
cleaner and keeps the client read path identical to today.

## Tasks
- [x] Add an `escapeJsonForScript(json: string)` helper (escapes `<`, `\u2028`,
  `\u2029`) — colocate near the InitialData type / a server util so both the
  type and serialization concerns stay together.
- [x] In `entry-server.tsx`: remove the `<div id="__initial_data__">` from the
  rendered React tree; build the `<script type="application/json"
  id="__initial_data__">` string from the escaped payload and prepend it to
  `htmlEnd` before streaming.
- [x] In `entry-client.tsx`: delete the `<div id="__initial_data__">` from the
  hydrated tree (and the now-redundant fragment wrapper if it's only there for
  the div); keep the `getElementById` + `JSON.parse` read.
- [x] Update the `InitialData` doc comment in `services/client/DatabaseService.ts`
  to say "embedded as a JSON script tag" rather than "JSON in the rendered HTML".
- [x] `./scripts/validate` (lint, type-check, tests) passes.
- [x] Manually verify via the dev server: SSR HTML contains the script tag
  outside `#root`, the page hydrates with no console mismatch warning, and posts
  render from the embedded data.

## Report

Moved the SSR → client handoff payload out of the React tree.

**Changes**
- `src/utils.ts` — added `escapeJsonForScript()` (escapes `<` → `\u003c`,
  plus `\u2028` / `\u2029`), a pure SSR/entry helper alongside `parseRoute`
  /`isMobileUA` so the server entry takes no runtime dependency on a
  browser-layer module.
- `src/services/client/DatabaseService.ts` — updated the `InitialData` doc
  comment to "JSON `<script>` tag".
- `src/entry-server.tsx` — removed the hidden `<div id="__initial_data__">` (and
  its fragment wrapper) from the rendered tree; the payload is now an inert
  `<script type="application/json" id="__initial_data__">` inserted **after**
  the root's closing `</div>` via `htmlEnd.replace('</div>', …)`, so it's a
  sibling of `#root`, outside the hydrated container, before the client module
  script. Covers both prod and dev paths (both call `render()`).
- `src/entry-client.tsx` — deleted the redundant data div + re-`JSON.stringify`
  and the fragment wrapper; the client still reads `.textContent` + `JSON.parse`
  exactly once before hydration.

**Deviation from plan.** The plan said to *prepend* the script to `htmlEnd`.
That was wrong: `htmlEnd` begins with the root's closing `</div>` (the outlet
sits *inside* `#root`), so prepending placed the script inside the container —
which would cause a hydration mismatch. Corrected to insert *after* the first
`</div>` so the script is a true sibling of `#root`.

**Outcomes.** `./scripts/validate` passes — eslint clean, `tsc -b` clean, 23/23
tests pass. (Lint also caught a real bug: U+2028/U+2029 are ECMAScript line
terminators and can't appear literally in a regex literal; switched the patterns
to use `\u2028` / `\u2029` escapes.) Headless (Playwright) verification against
the dev server confirms: the JSON script tag renders outside `#root` as a
sibling, the page hydrates with **no** mismatch warnings and no console errors.
