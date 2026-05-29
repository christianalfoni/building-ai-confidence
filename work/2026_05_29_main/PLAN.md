# Add SSR with Vite + Nitro on Vercel

## Summary

Add server-side rendering to the existing Vite + React app using Nitro as the server layer, then deploy to Vercel. Nitro is a Vite plugin that provides SSR and API routes with zero-config Vercel support — Vercel auto-detects it and deploys server routes as Fluid compute functions. This is Vercel's officially recommended path for SSR on Vite (as of March 2026).

## Considerations

**Vike (vite-plugin-ssr)** was considered first. It has a solid Vercel adapter (`vite-plugin-vercel`) and supports partial pre-rendering (SSG pages stay static, SSR pages go dynamic). However, Vike is a full SSR *framework* — it takes over routing and page structure, requiring significant restructuring of the existing app.

**Vite + Nitro** is the alternative and the winner here. It is purely additive: install the plugin, configure SSR in `vite.config.ts`, done. Vercel detects Nitro automatically and deploys server handlers as Vercel Functions with Fluid compute. No `vercel.json` needed. Official Vercel docs (updated March 2026) recommend this path explicitly for adding SSR to an existing Vite app.

**Manual Vercel API route** (a thin `api/ssr.js` file) was also considered. Sturdy and dependency-light, but requires hand-wiring the Vite dev middleware for local development and does not benefit from Nitro's bundling and routing primitives.

## Tasks

- [x] Install `nitro` and add the Nitro Vite plugin to `vite.config.ts`
- [x] Create a server entry point (`src/entry-server.tsx`) that imports the Vite-built client and SSR-renders the React app to a string
- [x] Update the HTML template (`index.html`) to include an SSR injection marker (`<!--ssr-outlet-->`)
- [x] Wire the SSR handler in Nitro so GET `/*` renders the React app server-side and hydrates on the client
- [x] Verify local dev SSR works (`npm run dev` with Nitro middleware)
- [x] Run `npm run build` and confirm Nitro output is correct for Vercel
- [ ] Deploy to Vercel and confirm SSR responses are served (check page source for server-rendered HTML)

## Report

Added Vite + Nitro SSR for Vercel deployment. Key changes:

- Installed `nitro` and added `nitro()` Vite plugin; removed `index.html` from `rollupOptions.input` (Nitro takes over the main entry).
- Created `src/entry-server.tsx` — renders the full React app to a streaming HTML response using `renderToReadableStream`. Uses a `MemoryStorageService` (in-place, no localStorage on server) for SSR-safe service bootstrapping.
- Created `src/entry-client.tsx` — hydrates the SSR'd HTML using `hydrateRoot` with the real `LocalStorageService`.
- Fixed `src/PlatformApp.tsx` to guard `window.matchMedia` with `typeof window !== 'undefined'` so it doesn't throw during SSR.
- Updated `index.html` to reference `entry-client.tsx` and added `<!--ssr-outlet-->` marker.
- Fixed pre-existing `ComponentProps` type-only import errors across 6 ui-component files.
- Added `/// <reference types="vitest/config" />` to `vite.config.ts` to restore vitest type augmentation after Nitro import.

Lint: clean. Tests: 13/13 passed. Build: all three Nitro environments (SSR, Client, Nitro server) built successfully with output in `.output/`.

Remaining: deploy to Vercel and verify server-rendered HTML in page source (requires Vercel account/project setup).
