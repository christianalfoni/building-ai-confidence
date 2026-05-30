import '@vitejs/plugin-react/preamble';
import { hydrateRoot } from 'react-dom/client';
import { StrictMode, Suspense } from 'react';
import './index.css';
import { AppContext } from './contexts/AppContext.ts';
import { reactive } from 'reactx';
import { AppState } from './state/AppState.ts';
import { ApiDatabaseService, type InitialData } from './services/client/DatabaseService.ts';
import { PlatformApp } from './PlatformApp.tsx';

const dataEl = document.getElementById('__initial_data__');
const initialData: InitialData = dataEl
  ? (JSON.parse(dataEl.textContent!) as InitialData)
  : { dbEnabled: false, isPreview: false, user: null, posts: [] };

const db = new ApiDatabaseService(initialData);
const app = reactive(new AppState(initialData.user, initialData.isPreview, initialData.posts, db));

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
