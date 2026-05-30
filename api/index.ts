import app from '../server/index.js';
// @ts-ignore — pre-built SSR bundle; types declared in entry-server.tsx
import { render } from '../dist/server/entry-server.js';

app.get('*', render);

export default app;
