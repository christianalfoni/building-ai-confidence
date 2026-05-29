import { renderToReadableStream } from 'react-dom/server.edge';
import { StrictMode, Suspense } from 'react';
import { AppContext } from './contexts/AppContext.ts';
import { AppState } from './state/AppState.ts';
import type { Services } from './services/index.ts';
import { MemoryStorageService } from './services/server/StorageService.ts';
import { isMobileUA } from './utils.ts';

export default {
  async fetch(request: Request) {
    const services: Services = { storage: new MemoryStorageService() };
    const app = new AppState(services);

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

    return new Response(stream, {
      headers: { 'Content-Type': 'text/html;charset=utf-8' },
    });
  },
};
