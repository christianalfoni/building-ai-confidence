import type { SessionService, User } from '../index.ts';
import type { InitialData } from './DatabaseService.ts';

// Browser-side session service. Constructed already-loaded from the embedded
// initial data, so `preload()` is a no-op; `signOut` clears the server session.
export class BrowserSessionService implements SessionService {
  user: User | null;
  isPreview: boolean;

  constructor(initial: InitialData) {
    this.user = initial.user;
    this.isPreview = initial.isPreview;
  }

  async preload(): Promise<void> {}

  async signOut(): Promise<void> {
    await fetch('/auth/logout', { method: 'POST' });
  }
}
