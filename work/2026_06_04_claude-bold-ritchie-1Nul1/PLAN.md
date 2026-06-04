# PNG image support for blog posts

## Summary

Let authors add PNG images to a post by **dragging a file onto the editor** or
**pasting one from the clipboard**. The image is uploaded to **Vercel Blob**, and
standard markdown image syntax `![alt](url)` is inserted into the post body at the
drop/paste position. Both the CodeMirror editor and the SSR Markdown reader render
an image-only line as a **centered block image with vertical margins, not clickable**
(`pointer-events:none`). The post body stays plain markdown — no schema change.

## Considerations

### Persistence: Vercel Blob (chosen)
- The app deploys via the Vercel Build Output API and `build-output.mjs` bundles all
  server deps into one function, so `@vercel/blob` works without extra config.
  `@vercel/blob@2.4.0` is already present transitively; we promote it to a direct
  dependency.
- The only secret is `BLOB_READ_WRITE_TOKEN` (server-only, lives in the upload route,
  never shipped to the client). Provisioned in Doppler for prod/preview; added to
  `.env.example` for local dev.
- Rejected: base64-in-body (bloats the `TEXT` column and every SSR HTML payload),
  Neon `BYTEA` (Postgres is a poor blob store + needs a serving endpoint), S3/Cloudinary
  (more credentials than needed when Blob is native).

### Body format: standard markdown, no schema change
- Images are stored inline in `posts.body` as `![filename](blobUrl)`. No DB migration,
  no new columns. `dbPostToPost` keeps passing `body` through unchanged.

### Rendering: image-only line → centered block
- Per the agreed UX ("Centered block"), an image renders as its own centered block. The
  rule both sides share: **a line whose entire content is a single image** renders as a
  centered `<img>`; anything else renders as today. Drop/paste therefore always places the
  image markdown on its own line.
- Reader (`Markdown.tsx`): detect image-only lines via the existing Lezer tree and emit a
  centered `<img>` instead of the text spans.
- Editor (`editorExtensions.ts`): a `Decoration.replace` widget swaps the image-markdown
  text for a rendered `<img>` on image-only lines — **except when the caret is on that
  line**, where the raw `![alt](url)` is shown so it can be edited/deleted. Decorations
  already rebuild on `selectionSet`, so reveal-on-cursor is free.
- Shared class name (`MD_IMAGE_CLASS`) lives in `markdown/tokens.ts` so editor and reader
  styles stay in lockstep, matching the existing `MD_LINE_CLASS`/`LIST_INDENT_REM` pattern.

### Upload wiring: a new `MediaService`
- Image upload is infrastructure but isn't a post mutation, so it gets its own small
  service rather than being bolted onto `DatabaseService` (keeps the layering honest).
  Client impl `POST`s the file to `/api/upload`; server impl throws (SSR never uploads).
- `AppState.uploadImage(file)` delegates to the service. The bound method threads down:
  `useBlogEditor` → `BlogEditor`/mobile `BlogEditor` → `MarkdownEditor` prop →
  `createEditorView` opts → `editorExtensions` drop/paste handlers (the CodeMirror layer
  isn't React, so the callback must be passed in explicitly).

### Async insertion
- On drop/paste we immediately insert a placeholder `![filename](uploading…)` at the
  position, then replace the `uploading…` URL with the real Blob URL when the request
  resolves (located by a unique nonce in the placeholder). On failure the placeholder line
  is removed and the error logged. The editor decoration treats a placeholder src as plain
  text (no broken-image render). The debounced save persists the final URL.

### Validation & limits
- Server: require `Content-Type: image/png`, sniff the PNG magic bytes
  (`89 50 4E 47 0D 0A 1A 0A`), cap size (~5 MB via `express.raw` limit). Same auth as the
  other write routes (session cookie + `ALLOWED_LOGINS` + author check). Non-PNG files in
  the editor are ignored client-side before any request.
- No `BLOB_READ_WRITE_TOKEN` (e.g. local dev): the route returns 500 "not configured" and
  the editor drops the placeholder + logs — writing text still works.

## Tasks

### Persistence (server)
- [ ] Add `@vercel/blob` to `package.json` dependencies; add `BLOB_READ_WRITE_TOKEN=` to `.env.example`.
- [ ] Add `POST /api/upload` in `server/routes/api.ts`: `express.raw({ type: 'image/png', limit: '5mb' })`, auth (session + `ALLOWED_LOGINS`), PNG magic-byte check, `put('posts/<uuid>.png', buf, { access: 'public', contentType: 'image/png', token })`, respond `{ url }`. 415/400 on bad input, 500 when token missing.

### Services / state wiring
- [ ] Add `MediaService { uploadImage(file: File): Promise<string> }` to `src/services/index.ts` and include it in `Services`.
- [ ] Client impl `src/services/client/MediaService.ts`: `fetch('/api/upload', { method:'POST', headers:{'Content-Type':'image/png'}, body:file })` → returns `url`.
- [ ] Server impl `src/services/server/MediaService.ts`: `uploadImage` throws (SSR never uploads).
- [ ] Construct `media` in `entry-client.tsx` and `entry-server.tsx`; pass into `AppState`.
- [ ] Add `AppState.uploadImage(file)` delegating to `services.media.uploadImage`.

### Editor (CodeMirror)
- [ ] `MD_IMAGE_CLASS` constant in `src/common/markdown/tokens.ts`.
- [ ] Thread an `uploadImage` callback through `MarkdownEditor` prop → `createEditorView` opts → `editorExtensions(opts)`.
- [ ] Add `EditorView.domEventHandlers` for `drop` (use `posAtCoords`) and `paste`: filter to `image/png`, insert placeholder on its own line at the position, upload, swap in the URL (or remove on failure).
- [ ] Extend `buildDecorations` to replace image-only lines with a centered, non-clickable `<img>` widget, suppressed when the caret is on that line and for `uploading…` placeholders.
- [ ] Pass `app.uploadImage` from `useBlogEditor` into both `desktop/components/BlogEditor.tsx` and `mobile/components/BlogEditor.tsx`.

### Reader
- [ ] In `src/common/ui-components/Markdown.tsx`, render image-only lines as a centered `<img>` (using the Lezer `Image` node) instead of text spans.

### Styles
- [ ] Add `.md-image` rules in `src/index.css`: `display:block; margin: <space> auto; max-width:100%; pointer-events:none;` plus `draggable=false`, shared by editor widget and reader.

### Verify
- [ ] `./scripts/validate` (lint, type-check, tests) passes.
- [ ] Manual: drag a PNG and paste a PNG in the editor → centered image renders; reader shows the same; caret-on-line reveals the markdown; non-PNG ignored.

## Report
