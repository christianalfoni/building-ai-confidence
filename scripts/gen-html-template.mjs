import { existsSync, readFileSync, writeFileSync } from 'fs';

// Emits src/html-template.gen.ts, the HTML shell the SSR server splits on
// `<!--ssr-outlet-->`.
//
// Prefer the built client HTML (dist/client/index.html), which Vite has
// rewritten with hashed <script>/<link> asset tags for production. When dist/
// hasn't been built yet — e.g. a fresh container at session start, before
// `npm run build` — fall back to the source index.html so the generated module
// always exists for type-checking, tests, and lint. A real build regenerates
// this file from dist with the correct production asset references.
const builtPath = 'dist/client/index.html';
const sourcePath = 'index.html';
const path = existsSync(builtPath) ? builtPath : sourcePath;

const html = readFileSync(path, 'utf-8');
const escaped = JSON.stringify(html);
writeFileSync('src/html-template.gen.ts', `export const htmlTemplate = ${escaped};\n`);
console.log(`Generated src/html-template.gen.ts from ${path}`);
