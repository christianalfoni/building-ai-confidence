// Assembles the Vercel Build Output API (v3) into .vercel/output/.
//
// Layout produced:
//   .vercel/output/
//     config.json                       routing: static first, everything else → /index
//     static/                           client assets (NO index.html, so / is server-rendered)
//     functions/index.func/
//       index.mjs                       self-contained Express bundle (all deps inlined)
//       .vc-config.json                 Node runtime config
//
// Prerequisites (run by `npm run build` before this script):
//   1. vite build --outDir dist/client      → client assets + index.html
//   2. node scripts/gen-html-template.mjs    → src/html-template.gen.ts (consumed by the SSR function)

import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '.vercel/output';
const STATIC = join(OUT, 'static');
const FUNC = join(OUT, 'functions', 'index.func');

// Fresh output dir.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(STATIC, { recursive: true });
mkdirSync(FUNC, { recursive: true });

// Static assets: copy everything Vite emitted EXCEPT index.html. Leaving index.html
// out means `/` falls through the filesystem phase to the SSR function.
for (const entry of readdirSync('dist/client')) {
  if (entry === 'index.html') continue;
  cpSync(join('dist/client', entry), join(STATIC, entry), { recursive: true });
}

// SSR + API + auth function. Bundle ALL dependencies (no --packages=external): a
// Build Output function only ships what lives inside its .func directory, so the
// bundle must be self-contained.
await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  jsx: 'automatic',
  outfile: join(FUNC, 'index.mjs'),
  logLevel: 'info',
  // Express and other CommonJS deps call require() for Node built-ins. In an ESM
  // bundle that throws ("Dynamic require not supported"), so re-create require,
  // __filename and __dirname at the top of the bundle.
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __pathDirname } from 'node:path';",
      'const require = __createRequire(import.meta.url);',
      'const __filename = __fileURLToPath(import.meta.url);',
      'const __dirname = __pathDirname(__filename);',
    ].join('\n'),
  },
});

writeFileSync(
  join(FUNC, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      supportsResponseStreaming: true,
    },
    null,
    2,
  ) + '\n',
);

writeFileSync(
  join(OUT, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Serve real files in static/ (assets, fonts, favicon, …) first.
        { handle: 'filesystem' },
        // Everything else — /, /posts/:post, /auth/*, /api/* — hits the Express function.
        { src: '/(.*)', dest: '/index' },
      ],
    },
    null,
    2,
  ) + '\n',
);

console.log('Build Output assembled at .vercel/output/');
