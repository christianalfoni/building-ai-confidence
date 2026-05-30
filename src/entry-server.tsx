import { renderToReadableStream } from 'react-dom/server.edge';
import { StrictMode, Suspense } from 'react';
import { AppContext } from './contexts/AppContext.ts';
import { AppState } from './state/AppState.ts';
import { NeonDatabaseService } from './services/server/DatabaseService.ts';
import { isMobileUA } from './utils.ts';
import type { InitialData } from './services/client/DatabaseService.ts';

const AUTHOR_LOGINS = ['christianalfoni', 'test'];

export default {
  async fetch(request: Request) {
    try {
      return await render(request);
    } catch (err) {
      console.error('[SSR] render error:', err);
      return new Response('', { status: 500, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
    }
  },
};

async function render(request: Request) {
    const dbUrl = process.env.DATABASE_URL;
    const db = dbUrl ? new NeonDatabaseService(dbUrl) : undefined;

    const cookie = request.headers.get('cookie') ?? '';
    const sessionId = parseCookie(cookie, 'session');
    const user = db && sessionId ? await db.getUser(sessionId) : null;

    const posts = db ? (await db.getPosts()).filter(
      (p) => p.published || (user && AUTHOR_LOGINS.includes(user.githubLogin) && p.authorId === user.id)
    ) : [];
    const initialData: InitialData = { dbEnabled: !!db, isPreview: process.env.VERCEL_ENV === 'preview', user, posts };
    const app = new AppState(user, initialData.isPreview, posts);

    const ua = request.headers.get('user-agent') ?? '';
    const App = isMobileUA(ua)
      ? (await import('./mobile/App.tsx')).default
      : (await import('./desktop/App.tsx')).default;

    const stream = await renderToReadableStream(
      <StrictMode>
        <>
          <div id="__initial_data__" style={{ display: 'none' }}>
            {JSON.stringify(initialData)}
          </div>
          <AppContext value={app}>
            <Suspense fallback={null}>
              <App />
            </Suspense>
          </AppContext>
        </>
      </StrictMode>,
    );

    await stream.allReady;

    return new Response(stream, {
      headers: { 'Content-Type': 'text/html;charset=utf-8' },
    });
}

function parseCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
