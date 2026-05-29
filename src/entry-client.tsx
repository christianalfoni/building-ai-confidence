import '@vitejs/plugin-react/preamble';
import { hydrateRoot } from 'react-dom/client';
import { StrictMode, Suspense } from 'react';
import './index.css';
import { AppContext } from './contexts/AppContext.ts';
import { reactive } from 'reactx';
import { AppState } from './state/AppState.ts';
import type { Services } from './services/index.ts';
import { LocalStorageService } from './services/client/StorageService.ts';
import { PlatformApp } from './PlatformApp.tsx';

const services: Services = {
  storage: new LocalStorageService(),
};

const app = reactive(new AppState(services));

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
