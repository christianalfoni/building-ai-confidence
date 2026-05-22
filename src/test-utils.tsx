import { type ReactElement } from "react";
import { render } from "@testing-library/react";
import { reactive } from "reactx";
import { AppContext } from "./contexts/AppContext";
import { AppState } from "./state/AppState";
import type { Services, StorageService } from "./services";

function createFakeStorage(): StorageService {
  const store = new Map<string, string>();
  return {
    get: <T>(key: string): T | null => {
      const val = store.get(key);
      return val !== undefined ? (JSON.parse(val) as T) : null;
    },
    set: <T>(key: string, value: T): void => {
      store.set(key, JSON.stringify(value));
    },
  };
}

export function createAppState(services: Partial<Services> = {}): AppState {
  const defaults: Services = { storage: createFakeStorage() };
  return reactive(new AppState({ ...defaults, ...services }));
}

export function renderWithApp(ui: ReactElement, appState: AppState) {
  return render(
    <AppContext.Provider value={appState}>{ui}</AppContext.Provider>
  );
}
