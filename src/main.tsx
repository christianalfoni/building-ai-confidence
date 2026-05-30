import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppContext } from "./contexts/AppContext.ts";
import { reactive } from "reactx";
import { AppState } from "./state/AppState.ts";
import { PlatformApp } from "./PlatformApp.tsx";

const app = reactive(new AppState());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppContext value={app}>
      <Suspense fallback={null}>
        <PlatformApp />
      </Suspense>
    </AppContext>
  </StrictMode>,
);
