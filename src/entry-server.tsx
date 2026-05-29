import { renderToReadableStream } from 'react-dom/server.edge';
import { StrictMode, Suspense } from 'react';
import { AppContext } from './contexts/AppContext.ts';
import { AppState } from './state/AppState.ts';
import type { Services } from './services/index.ts';
import { MemoryStorageService } from './services/server/StorageService.ts';
import { PlatformApp } from './PlatformApp.tsx';

// @ts-expect-error — Nitro virtual module types
import clientAssets from './entry-client?assets=client';
// @ts-expect-error — Nitro virtual module types
import serverAssets from './entry-server?assets=ssr';

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(_request: Request) {
    const services: Services = { storage: new MemoryStorageService() };
    const app = new AppState(services);
    const assets = clientAssets.merge(serverAssets);

    const stream = await renderToReadableStream(
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>ai-driven</title>
          {assets.css.map((attr: Record<string, string>) => (
            <link key={attr.href} rel="stylesheet" {...attr} />
          ))}
          {assets.js.map((attr: Record<string, string>) => (
            <link key={attr.href} rel="modulepreload" {...attr} />
          ))}
          <script type="module" src={assets.entry} />
        </head>
        <body>
          <div id="root">
            <StrictMode>
              <AppContext value={app}>
                <Suspense fallback={null}>
                  <PlatformApp />
                </Suspense>
              </AppContext>
            </StrictMode>
          </div>
        </body>
      </html>,
    );

    return new Response(stream, {
      headers: { 'Content-Type': 'text/html;charset=utf-8' },
    });
  },
};
