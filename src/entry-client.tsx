import '@vitejs/plugin-react/preamble';
import { hydrateRoot } from 'react-dom/client';
import { StrictMode, Suspense } from 'react';
import './index.css';
import { AppContext } from './contexts/AppContext.ts';
import { reactive } from 'reactx';
import { AppState } from './state/AppState.ts';
import type { Services } from './services/index.ts';
import { LocalStorageService } from './services/client/StorageService.ts';
import { ApiDatabaseService, type InitialData } from './services/client/DatabaseService.ts';
import { PlatformApp } from './PlatformApp.tsx';

declare global {
  interface Window {
    __INITIAL_DATA__?: InitialData;
  }
}

const initialData: InitialData = window.__INITIAL_DATA__ ?? { dbEnabled: false, isPreview: false, user: null, todos: [] };

const services: Services = {
  storage: new LocalStorageService(),
  // Only wire up ApiDatabaseService when the server had DATABASE_URL configured.
  // Without this guard, mutations would hit /api/* routes that immediately 500.
  db: initialData.dbEnabled ? new ApiDatabaseService(initialData) : undefined,
};

const app = reactive(new AppState(services, initialData.user, initialData.todos, initialData.isPreview));

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <AppContext value={app}>
      <Suspense fallback={null}>
        <PlatformApp />
      </Suspense>
    </AppContext>
  </StrictMode>,
);
