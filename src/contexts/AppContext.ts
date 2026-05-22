import { createContext, useContext } from "react";
import { AppState } from "../state/AppState";
import { invariant } from "../utils";

export const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const appState = useContext(AppContext);

  invariant(appState, "No AppState available");

  return appState;
}
