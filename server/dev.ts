import express from 'express';
import { createServer as createViteServer } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { registerAuthRoutes } from './routes/auth.js';
import { registerApiRoutes } from './routes/api.js';

// The single authored HTML shell. Dev reads it from disk and runs it through
// vite.transformIndexHtml (rewriting /src/* to dev-server URLs); the production
// build rewrites the same file into dist/client/index.html, which the gen
// script inlines as src/html-template.gen.ts. One source, two consumers.
const indexHtmlPath = resolve(import.meta.dirname, '..', 'index.html');

const app = express();
app.use(express.json());

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom',
});

app.use(vite.middlewares);

registerAuthRoutes(app);
registerApiRoutes(app);

app.get('/{*path}', async (req, res) => {
  try {
    const template = readFileSync(indexHtmlPath, 'utf-8');
    const rawHtml = await vite.transformIndexHtml(req.originalUrl, template);

    const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
    await render(req, res, rawHtml);
  } catch (err) {
    if (err instanceof Error) vite.ssrFixStacktrace(err);
    console.error('[dev-ssr]', err);
    res.status(500).end('Internal server error');
  }
});

const port = parseInt(process.env.PORT ?? '5173', 10);
app.listen(port, () => console.log(`dev server running at http://localhost:${port}`));
