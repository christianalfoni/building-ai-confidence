import type { Application } from 'express';
import { NeonDatabase } from '../neon.js';
import { parseCookie, ALLOWED_LOGINS, hiddenAuthorLogins } from '../utils.js';

export function registerApiRoutes(app: Application) {
  app.get('/api/posts', async (req, res) => {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) { res.status(500).json({ error: 'DATABASE_URL is not configured' }); return; }
      const db = new NeonDatabase(dbUrl);
      const sessionId = parseCookie(req.headers.cookie ?? '', 'session');
      const user = sessionId ? await db.getUser(sessionId) : null;
      const all = await db.getPosts({ hideAuthorLogins: hiddenAuthorLogins() });
      res.json(all.filter((p) => p.published || (user && ALLOWED_LOGINS.includes(user.githubLogin) && p.authorId === user.id)));
    } catch (err) {
      console.error('[GET /api/posts]', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/posts', async (req, res) => {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) { res.status(500).json({ error: 'DATABASE_URL is not configured' }); return; }
      const sessionId = parseCookie(req.headers.cookie ?? '', 'session');
      if (!sessionId) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const db = new NeonDatabase(dbUrl);
      const user = await db.getUser(sessionId);
      if (!user || !ALLOWED_LOGINS.includes(user.githubLogin)) { res.status(403).json({ error: 'Forbidden' }); return; }
      res.json(await db.createPost(user.id));
    } catch (err) {
      console.error('[POST /api/posts]', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/posts/:id', async (req, res) => {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) { res.status(500).json({ error: 'DATABASE_URL is not configured' }); return; }
      const sessionId = parseCookie(req.headers.cookie ?? '', 'session');
      if (!sessionId) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const db = new NeonDatabase(dbUrl);
      const user = await db.getUser(sessionId);
      if (!user || !ALLOWED_LOGINS.includes(user.githubLogin)) { res.status(403).json({ error: 'Forbidden' }); return; }

      const { id } = req.params;
      const post = await db.getPost(id);
      if (!post) { res.status(404).json({ error: 'Not found' }); return; }
      if (post.authorId !== user.id) { res.status(403).json({ error: 'Forbidden' }); return; }

      const fields: { title?: string; body?: string; published?: boolean } = {};
      if (typeof req.body.title === 'string') fields.title = req.body.title;
      if (typeof req.body.body === 'string') fields.body = req.body.body;
      if (typeof req.body.published === 'boolean') fields.published = req.body.published;

      res.json(await db.updatePost(id, fields));
    } catch (err) {
      console.error('[PATCH /api/posts/:id]', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/posts/:id', async (req, res) => {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) { res.status(500).json({ error: 'DATABASE_URL is not configured' }); return; }
      const sessionId = parseCookie(req.headers.cookie ?? '', 'session');
      if (!sessionId) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const db = new NeonDatabase(dbUrl);
      const user = await db.getUser(sessionId);
      if (!user || !ALLOWED_LOGINS.includes(user.githubLogin)) { res.status(403).json({ error: 'Forbidden' }); return; }

      const { id } = req.params;
      const post = await db.getPost(id);
      if (!post) { res.status(404).json({ error: 'Not found' }); return; }
      if (post.authorId !== user.id) { res.status(403).json({ error: 'Forbidden' }); return; }

      await db.deletePost(id);
      res.status(204).end();
    } catch (err) {
      console.error('[DELETE /api/posts/:id]', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
