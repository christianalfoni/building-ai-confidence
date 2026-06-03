import { renderToPipeableStream } from 'react-dom/server';
import { StrictMode, Suspense } from 'react';
import { Transform } from 'node:stream';
import type { Request, Response } from 'express';
import { AppContext } from './contexts/AppContext.ts';
import { AppState } from './state/AppState.ts';
import { NeonDatabase } from '../server/neon.ts';
import { ServerSessionService } from './services/server/SessionService.ts';
import { ServerDatabaseService } from './services/server/DatabaseService.ts';
import { ServerNavigationService } from './services/server/NavigationService.ts';
import { hiddenAuthorLogins, parseCookie } from '../server/utils.ts';
import { escapeJsonForScript, isMobileUA, parseRoute } from './utils.ts';
import type { InitialData } from './services/client/DatabaseService.ts';
import DesktopApp from './desktop/App.tsx';
import MobileApp from './mobile/App.tsx';
import { htmlTemplate } from './html-template.gen.ts';

export async function render(req: Request, res: Response, htmlOverride?: string) {
  const [htmlStart, htmlEnd] = (htmlOverride ?? htmlTemplate).split('<!--ssr-outlet-->');
  try {
    const dbUrl = process.env.DATABASE_URL;
    const db = dbUrl ? new NeonDatabase(dbUrl) : null;
    const isPreview = process.env.VERCEL_ENV === 'preview';

    const sessionId = parseCookie(req.headers.cookie ?? '', 'session');
    const session = new ServerSessionService(db, sessionId, isPreview);
    const database = new ServerDatabaseService(db, session, hiddenAuthorLogins());
    const navigation = new ServerNavigationService(parseRoute(req.path));

    // Resolve the user first so the database can filter the author's own
    // unpublished posts.
    await session.preload();
    await database.preload();

    const app = new AppState({ session, database, navigation });
    const initialData: InitialData = {
      dbEnabled: !!db,
      isPreview,
      user: session.user,
      posts: database.posts,
    };

    const isMobile = isMobileUA(req.headers['user-agent'] ?? '');
    const App = isMobile ? MobileApp : DesktopApp;

    // Tag <html> so the desktop tree renders at a larger base size (see index.css).
    // Match the opening <html> tag generically and append the class, so the
    // injection survives changes to the tag's attributes or whitespace.
    const htmlHead = isMobile
      ? htmlStart
      : htmlStart.replace(/<html\b([^>]*)>/, '<html$1 class="ui-desktop">');

    // Embed the hydration payload as an inert JSON script tag that is a sibling
    // of #root, not part of the React tree — so hydration never touches it and
    // the client reads it once without re-rendering it. Inserting it right
    // after the root's closing </div> (the first one in htmlEnd, since the
    // outlet sits inside #root) keeps it outside the hydrated container yet
    // before the deferred entry-client module script.
    const dataScript =
      `<script type="application/json" id="__initial_data__">` +
      `${escapeJsonForScript(JSON.stringify(initialData))}</script>`;
    const htmlTail = htmlEnd.replace('</div>', `</div>${dataScript}`);

    const appendEnd = new Transform({
      transform(chunk, _enc, cb) { cb(null, chunk); },
      flush(cb) { this.push(htmlTail); cb(); },
    });

    const { pipe } = renderToPipeableStream(
      <StrictMode>
        <AppContext value={app}>
          <Suspense fallback={null}>
            <App />
          </Suspense>
        </AppContext>
      </StrictMode>,
      {
        onShellReady() {
          res.statusCode = app.postNotFound ? 404 : 200;
          res.setHeader('Content-Type', 'text/html;charset=utf-8');
          res.write(htmlHead);
          pipe(appendEnd).pipe(res);
        },
        onShellError(err) {
          console.error('[SSR] shell error:', err);
          if (!res.headersSent) res.status(500).end('Internal server error');
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
