import type { MediaService } from '../index.ts';

// Server-side media service. Uploads are browser-only — SSR is read-only and
// never uploads, so this is a stub that throws if ever called.
export class ServerMediaService implements MediaService {
  async uploadImage(_file: File): Promise<string> {
    throw new Error('uploadImage is browser-only');
  }
}
