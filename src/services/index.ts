export interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
}

export interface Services {
  storage: StorageService;
}
