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
  },
};

function parseCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
