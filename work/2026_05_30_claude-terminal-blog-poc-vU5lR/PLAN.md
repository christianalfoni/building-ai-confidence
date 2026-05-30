# Blog Service Pivot

## Summary

Replace the todo app with a terminal-themed blog service using the "modernDark" visual direction from the POC (images 2 and 4). Post content is hardcoded as one article for now — no database posts table needed. GitHub auth is preserved as-is. The work covers gutting all todo-specific code at every layer, rewriting theme tokens for the dark palette, and building the blog UI for both desktop and mobile.

## Considerations

**Static posts**: Posts live in `src/data/posts.ts` as plain TypeScript objects. No DB reads or API routes for posts. This keeps the surface area small while we find the right direction.

**Navigation via state**: `AppState` gets `selectedPostSlug: string | null` plus `selectPost()` and `goBack()` methods. Components read this and render either the list or the post. No router library introduced — one level of navigation doesn't need one.

**Clean break on todo code**: All todo state, DB methods, API routes, and UI are removed rather than left unused. This keeps the codebase honest about what the app actually does.

**Theme tokens**: The current light palette (`surface`, `crimson`, etc.) is replaced wholesale with dark terminal tokens. `DESIGN.md` is rewritten to match.

**Desktop vs mobile**: Desktop keeps the terminal window chrome (title bar, traffic-light dots, monospace font). Mobile uses the same dark palette and typography but without the chrome — full-screen, card-based, scrollable.

**`Button` ui-component kept**: Auth controls (sign-in link, sign-out) still need styled buttons. All other todo-era ui-components (Checkbox, Input, IconButton) are deleted.

## Tasks

### Cleanup
- [ ] Delete `server/routes/api/todos/index.ts` and `server/routes/api/todos/[id].ts`
- [ ] Delete `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`
- [ ] Delete `src/desktop/ui-components/Checkbox.tsx`, `Input.tsx`, `IconButton.tsx`
- [ ] Delete `src/mobile/ui-components/Checkbox.tsx`, `Input.tsx`, `IconButton.tsx`
- [ ] Delete `src/desktop/components/App.stories.tsx` (todo stories)
- [ ] Delete `src/mobile/components/App.stories.tsx` (todo stories)
- [ ] Delete `src/desktop/components/BlogTerminal.stories.tsx` (POC, replaced by proper stories)

### Theme & design
- [ ] Update `src/index.css` — replace light color tokens with dark terminal palette
- [ ] Update `DESIGN.md` — rewrite style guide for the terminal dark theme

### Data & state layer
- [ ] Add `src/data/posts.ts` — `Post` type + one hardcoded full article
- [ ] Simplify `src/services/index.ts` — remove `Todo` type and all todo methods from `DatabaseService`
- [ ] Simplify `src/services/server/DatabaseService.ts` — remove todo methods
- [ ] Simplify `src/services/client/DatabaseService.ts` — remove todo methods and `todos` from `InitialData`
- [ ] Rewrite `src/state/AppState.ts` — remove all todo logic; add `selectedPostSlug: string | null`, `selectPost(slug: string)`, `goBack()`
- [ ] Update `src/entry-server.tsx` — remove todo fetching, strip `todos` from `initialData`
- [ ] Update `src/entry-client.tsx` — remove `todos` from `InitialData` hydration
- [ ] Rewrite `src/state/AppState.test.ts` — test `selectPost` and `goBack`
- [ ] Update `src/test-utils.tsx` — adapt `createAppState` to new shape

### Desktop UI
- [ ] Create `src/desktop/ui-components/Tag.tsx` — small coloured tag chip
- [ ] Create `src/desktop/components/BlogList.tsx` — modernDark terminal post listing
- [ ] Create `src/desktop/components/BlogPost.tsx` — modernDark terminal post reader
- [ ] Rewrite `src/desktop/components/App.tsx` — terminal window chrome, renders BlogList or BlogPost
- [ ] Create `src/desktop/components/App.stories.tsx` — list view story and post view story

### Mobile UI
- [ ] Create `src/mobile/ui-components/Tag.tsx` — tag chip, larger touch target
- [ ] Create `src/mobile/components/BlogList.tsx` — dark card-based post list
- [ ] Create `src/mobile/components/BlogPost.tsx` — full-screen dark post reader
- [ ] Rewrite `src/mobile/components/App.tsx` — renders BlogList or BlogPost

## Report
