import { renderToReadableStream } from 'react-dom/server.edge';
import { StrictMode, Suspense } from 'react';
import { AppContext } from './contexts/AppContext.ts';
import { reactive } from 'reactx';
import { AppState } from './state/AppState.ts';
import type { Services, StorageService } from './services/index.ts';
import { PlatformApp } from './PlatformApp.tsx';

// @ts-expect-error — Nitro virtual module types
import clientAssets from './entry-client?assets=client';
// @ts-expect-error — Nitro virtual module types
import serverAssets from './entry-server?assets=ssr';

class MemoryStorageService implements StorageService {
  #store = new Map<string, string>();
  get<T>(key: string): T | null {
    const item = this.#store.get(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }
  set<T>(key: string, value: T): void {
    this.#store.set(key, JSON.stringify(value));
  }
}

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(_request: Request) {
    const services: Services = { storage: new MemoryStorageService() };
    const app = reactive(new AppState(services));
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
