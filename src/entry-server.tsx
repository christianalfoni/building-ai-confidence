import { renderToReadableStream } from 'react-dom/server.edge';
import { StrictMode, Suspense } from 'react';
import { AppContext } from './contexts/AppContext.ts';
import { AppState } from './state/AppState.ts';
import type { Services } from './services/index.ts';
import { MemoryStorageService } from './services/server/StorageService.ts';
import { PlatformApp } from './PlatformApp.tsx';

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(_request: Request) {
    const services: Services = { storage: new MemoryStorageService() };
    const app = new AppState(services);

    const stream = await renderToReadableStream(
      <StrictMode>
        <AppContext value={app}>
          <Suspense fallback={null}>
            <PlatformApp />
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
