import express from 'express';
import { render } from '../src/entry-server.tsx';
import { registerAuthRoutes } from './routes/auth.js';
import { registerApiRoutes } from './routes/api.js';

const app = express();
app.use(express.json());

registerAuthRoutes(app);
registerApiRoutes(app);

app.get('/{*path}', (req, res) => render(req, res));

export default app;
