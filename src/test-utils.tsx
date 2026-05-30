import { reactive } from "reactx";
import { AppState } from "./state/AppState";

export function createAppState(): AppState {
  return reactive(new AppState());
}
