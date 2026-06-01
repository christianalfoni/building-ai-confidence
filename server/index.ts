import express from 'express';
import { randomBytes } from 'node:crypto';
import { NeonDatabaseService } from '../src/services/server/DatabaseService.js';
import { hiddenAuthorLogins } from '../src/services/server/postVisibility.js';
import { render } from '../src/entry-server.tsx';

const ALLOWED_LOGINS = ['christianalfoni', 'test'];

const app = express();
app.use(express.json());

// ── Auth ──────────────────────────────────────────────────────────────────────

app.get('/auth/github', (_req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) { res.status(500).send('GITHUB_CLIENT_ID is not configured'); return; }

  const state = randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 10 * 60 * 1000, path: '/' });

  const redirectUri = `${process.env.APP_URL ?? 'http://localhost:5173'}/auth/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user&state=${state}`;
  res.redirect(302, url);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const dbUrl = process.env.DATABASE_URL;
    if (!clientId || !clientSecret) { res.status(500).send('GitHub OAuth env vars are not configured'); return; }
    if (!dbUrl) { res.status(500).send('DATABASE_URL is not configured'); return; }

    const { code, state } = req.query as Record<string, string>;
    if (!code) { res.status(400).send('Missing code'); return; }

    const expectedState = parseCookie(req.headers.cookie ?? '', 'oauth_state');
    res.clearCookie('oauth_state', { path: '/' });
    if (!state || !expectedState || state !== expectedState) { res.status(400).send('Invalid state parameter'); return; }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    if (!tokenRes.ok) { res.status(502).send('Failed to exchange GitHub OAuth code'); return; }
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) { res.status(400).send(tokenData.error ?? 'No access token returned'); return; }

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'building-ai-confidence' },
    });
    if (!userRes.ok) { res.status(502).send('Failed to fetch GitHub user'); return; }
    const ghUser = await userRes.json() as { id: number; name: string | null; avatar_url: string; login: string };

    const db = new NeonDatabaseService(dbUrl);
    const user = await db.upsertUser(ghUser.id, ghUser.login, ghUser.name ?? ghUser.login, ghUser.avatar_url);
    const sessionId = await db.createSession(user.id);

    res.cookie('session', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/' });
    res.redirect(302, '/');
  } catch (err) {
    console.error('[auth/callback]', err);
    res.status(500).send('Internal server error');
  }
});

app.post('/auth/logout', async (req, res) => {
  try {
    const sessionId = parseCookie(req.headers.cookie ?? '', 'session');
    if (sessionId && process.env.DATABASE_URL) {
      const db = new NeonDatabaseService(process.env.DATABASE_URL);
      await db.deleteSession(sessionId);
    }
    res.clearCookie('session', { path: '/' });
    res.redirect(302, '/');
  } catch (err) {
    console.error('[auth/logout]', err);
    res.status(500).send('Internal server error');
  }
});

app.post('/auth/test-login', async (_req, res) => {
  try {
    if (process.env.VERCEL_ENV !== 'preview') { res.status(403).send('Test login is only available in preview environments'); return; }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) { res.status(500).send('DATABASE_URL is not configured'); return; }

    const db = new NeonDatabaseService(dbUrl);
    const user = await db.upsertUser(0, 'test', 'Test User', 'https://avatars.githubusercontent.com/u/0');
    const sessionId = await db.createSession(user.id);

    res.cookie('session', sessionId, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/' });
    res.redirect(302, '/');
  } catch (err) {
    console.error('[auth/test-login]', err);
    res.status(500).send('Internal server error');
  }
});

// ── API ───────────────────────────────────────────────────────────────────────

app.get('/api/posts', async (req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) { res.status(500).json({ error: 'DATABASE_URL is not configured' }); return; }
    const db = new NeonDatabaseService(dbUrl);
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
    const db = new NeonDatabaseService(dbUrl);
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
    const db = new NeonDatabaseService(dbUrl);
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
    const db = new NeonDatabaseService(dbUrl);
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

app.get('/{*path}', (req, res) => render(req, res));

export default app;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
