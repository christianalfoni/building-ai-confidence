/* eslint-disable react-refresh/only-export-components */
import { renderToReadableStream } from 'react-dom/server.edge';
import { StrictMode, Suspense } from 'react';
import { AppContext } from './contexts/AppContext.ts';
import { AppState } from './state/AppState.ts';
import type { Services } from './services/index.ts';
import { MemoryStorageService } from './services/server/StorageService.ts';
import { NeonDatabaseService } from './services/server/DatabaseService.ts';
import { isMobileUA } from './utils.ts';
import type { InitialData } from './services/client/DatabaseService.ts';
import { useRuntimeConfig } from 'nitro/runtime-config';

function safeJsonSerialize(data: unknown): string {
  // Escape characters that can break an inline <script> tag or cause XSS.
  // U+2028/2029 are line terminators that cannot appear in regex literals,
  // so they are expressed as unicode escape sequences in the RegExp constructor.
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(new RegExp(' ', 'g'), '\\u2028')
    .replace(new RegExp(' ', 'g'), '\\u2029');
}

export default {
  async fetch(request: Request) {
    const dbUrl = process.env.DATABASE_URL;
    const db = dbUrl ? new NeonDatabaseService(dbUrl) : undefined;

    const cookie = request.headers.get('cookie') ?? '';
    const sessionId = parseCookie(cookie, 'session');
    const user = db && sessionId ? await db.getUser(sessionId) : null;
    const todos = db ? await db.getTodos(user?.id ?? null) : [];

    const { vercelEnv } = useRuntimeConfig();
    const initialData: InitialData = { dbEnabled: !!db, isPreview: vercelEnv === 'preview', user, todos };
    const services: Services = { storage: new MemoryStorageService(), db };
    const app = new AppState(services, user, todos, initialData.isPreview);

    const ua = request.headers.get('user-agent') ?? '';
    const App = isMobileUA(ua)
      ? (await import('./mobile/App.tsx')).default
      : (await import('./desktop/App.tsx')).default;

    const stream = await renderToReadableStream(
      <StrictMode>
        <AppContext value={app}>
          <Suspense fallback={null}>
            <App />
          </Suspense>
        </AppContext>
      </StrictMode>,
    );

    await stream.allReady;

    const appHtml = await new Response(stream).text();
    const scriptTag = `<script>window.__INITIAL_DATA__ = ${safeJsonSerialize(initialData)}</script>`;

    return new Response(`${scriptTag}<div id="root">${appHtml}</div>`, {
      headers: { 'Content-Type': 'text/html;charset=utf-8' },
    });
  },
};

function parseCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
