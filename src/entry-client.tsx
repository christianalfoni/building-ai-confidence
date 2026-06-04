import '@vitejs/plugin-react/preamble';
import { hydrateRoot } from 'react-dom/client';
import { StrictMode, Suspense } from 'react';
import './index.css';
import { AppContext } from './contexts/AppContext.ts';
import { reactive } from 'reactx';
import { AppState } from './state/AppState.ts';
import { ApiDatabaseService, type InitialData } from './services/client/DatabaseService.ts';
import { BrowserSessionService } from './services/client/SessionService.ts';
import { BrowserNavigationService } from './services/client/NavigationService.ts';
import { ApiMediaService } from './services/client/MediaService.ts';
import { PlatformApp } from './PlatformApp.tsx';

const dataEl = document.getElementById('__initial_data__');
const initialData: InitialData = dataEl
  ? (JSON.parse(dataEl.textContent!) as InitialData)
  : { dbEnabled: false, isPreview: false, user: null, posts: [] };

// The browser services are constructed already-loaded from the embedded data,
// so hydration stays synchronous — no preload round-trip.
const session = new BrowserSessionService(initialData);
const database = new ApiDatabaseService(initialData);
const navigation = new BrowserNavigationService();
const media = new ApiMediaService();
const app = reactive(new AppState({ session, database, navigation, media }));

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
