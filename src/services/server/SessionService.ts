import type { NeonDatabase } from '../../../server/neon.js';
import type { SessionService, User } from '../index.ts';

// Server-side session service. Resolves the current user from the session
// cookie via the Neon gateway during `preload()`. `signOut` is browser-only —
// it is never called during SSR.
export class ServerSessionService implements SessionService {
  user: User | null = null;
  isPreview: boolean;
  private db: NeonDatabase | null;
  private sessionId: string | null;

  constructor(db: NeonDatabase | null, sessionId: string | null, isPreview: boolean) {
    this.db = db;
    this.sessionId = sessionId;
    this.isPreview = isPreview;
  }

  async preload(): Promise<void> {
    this.user = this.db && this.sessionId ? await this.db.getUser(this.sessionId) : null;
  }

  async signOut(): Promise<void> {
    throw new Error('signOut is browser-only');
  }
}
