import { raw, type Application } from 'express';
import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { NeonDatabase } from '../neon.js';
import { parseCookie, ALLOWED_LOGINS, hiddenAuthorLogins } from '../utils.js';

// PNG signature: the first 8 bytes of every PNG file.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

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

  // Upload a PNG and return its public Blob URL. The body is the raw image bytes
  // (Content-Type: image/png); `raw()` is mounted on this route only, so the
  // app-wide express.json() never touches it. Same auth as the other write routes.
  app.post('/api/upload', raw({ type: 'image/png', limit: '5mb' }), async (req, res) => {
    try {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) { res.status(500).json({ error: 'Blob storage is not configured' }); return; }
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) { res.status(500).json({ error: 'DATABASE_URL is not configured' }); return; }
      const sessionId = parseCookie(req.headers.cookie ?? '', 'session');
      if (!sessionId) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const db = new NeonDatabase(dbUrl);
      const user = await db.getUser(sessionId);
      if (!user || !ALLOWED_LOGINS.includes(user.githubLogin)) { res.status(403).json({ error: 'Forbidden' }); return; }

      const buf = req.body;
      if (!Buffer.isBuffer(buf) || buf.length === 0) { res.status(400).json({ error: 'Empty body' }); return; }
      if (buf.length < PNG_MAGIC.length || !buf.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
        res.status(415).json({ error: 'Only PNG images are supported' });
        return;
      }

      const { url } = await put(`posts/${randomUUID()}.png`, buf, {
        access: 'public',
        contentType: 'image/png',
        token,
      });
      res.json({ url });
    } catch (err) {
      console.error('[POST /api/upload]', err);
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
