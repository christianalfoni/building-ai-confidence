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

const dataEl = document.getElementById('__initial_data__');
const initialData: InitialData = dataEl
  ? (JSON.parse(dataEl.textContent!) as InitialData)
  : { dbEnabled: false, isPreview: false, user: null };

const services: Services = {
  storage: new LocalStorageService(),
  db: initialData.dbEnabled ? new ApiDatabaseService(initialData) : undefined,
};

const app = reactive(new AppState(services, initialData.user, initialData.isPreview));

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <>
      <div id="__initial_data__" style={{ display: 'none' }}>
        {JSON.stringify(initialData)}
      </div>
      <AppContext value={app}>
        <Suspense fallback={null}>
          <PlatformApp />
        </Suspense>
      </AppContext>
    </>
  </StrictMode>,
);
