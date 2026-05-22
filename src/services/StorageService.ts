import type { StorageService } from "./index";

export class LocalStorageService implements StorageService {
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (item === null) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
