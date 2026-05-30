import app from '../server/index.js';
import { render } from '../src/entry-server.js';

app.get('*', render);

export default app;
