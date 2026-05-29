import type { StorageService } from '../index.ts';

export class MemoryStorageService implements StorageService {
  #store = new Map<string, string>();

  get<T>(key: string): T | null {
    const item = this.#store.get(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    this.#store.set(key, JSON.stringify(value));
  }
}
