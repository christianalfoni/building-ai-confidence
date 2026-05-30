import { renderToPipeableStream } from 'react-dom/server';
import { StrictMode, Suspense } from 'react';
import type { Request, Response } from 'express';
import { AppContext } from './contexts/AppContext.ts';
import { AppState } from './state/AppState.ts';
import { NeonDatabaseService } from './services/server/DatabaseService.ts';
import { isMobileUA } from './utils.ts';
import type { InitialData } from './services/client/DatabaseService.ts';
import DesktopApp from './desktop/App.tsx';
import MobileApp from './mobile/App.tsx';

const AUTHOR_LOGINS = ['christianalfoni', 'test'];

export async function render(req: Request, res: Response) {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const db = dbUrl ? new NeonDatabaseService(dbUrl) : undefined;

    const sessionId = parseCookie(req.headers.cookie ?? '', 'session');
    const user = db && sessionId ? await db.getUser(sessionId) : null;

    const posts = db ? (await db.getPosts()).filter(
      (p) => p.published || (user && AUTHOR_LOGINS.includes(user.githubLogin) && p.authorId === user.id)
    ) : [];
    const initialData: InitialData = { dbEnabled: !!db, isPreview: process.env.VERCEL_ENV === 'preview', user, posts };
    const app = new AppState(user, initialData.isPreview, posts);

    const App = isMobileUA(req.headers['user-agent'] ?? '') ? MobileApp : DesktopApp;

    res.setHeader('Content-Type', 'text/html;charset=utf-8');

    const { pipe } = renderToPipeableStream(
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
      {
        onShellReady() {
          pipe(res);
        },
        onError(err) {
          console.error('[SSR] render error:', err);
        },
      }
    );
  } catch (err) {
    console.error('[SSR] render error:', err);
    res.status(500).end();
  }
}

function parseCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
