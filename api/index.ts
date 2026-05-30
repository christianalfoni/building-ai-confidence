import app from '../server/index.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — pre-built SSR bundle has no type declarations
import { render } from '../dist/server/entry-server.js';

app.get('*', render);

export default app;
