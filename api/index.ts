import app from '../server/index.ts';
import { render } from '../src/entry-server.tsx';

// SSR catch-all — must be added here (after the build, entry-server is a
// compiled module; the import works in both dev/ts-node and production)
app.get('*', render);

export default app;
