import type { DatabaseService, User } from '../index.ts';

export type InitialData = {
  dbEnabled: boolean;
  isPreview: boolean;
  user: User | null;
};

export class ApiDatabaseService implements DatabaseService {
  private user: User | null;

  constructor(initial: InitialData) {
    this.user = initial.user;
  }

  async getUser(_sessionId: string): Promise<User | null> {
    return this.user;
  }

  async upsertUser(_githubId: number, _name: string, _avatarUrl: string): Promise<User> {
    throw new Error('upsertUser is server-only');
  }

  async createSession(_userId: string): Promise<string> {
    throw new Error('createSession is server-only');
  }

  async deleteSession(_sessionId: string): Promise<void> {
    throw new Error('deleteSession is server-only');
  }
}
