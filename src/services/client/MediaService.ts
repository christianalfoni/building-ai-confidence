import type { MediaService } from '../index.ts';

// Browser-side media service. Posts the raw image bytes to /api/upload, which
// stores them in Vercel Blob and returns the public URL to embed in the post.
export class ApiMediaService implements MediaService {
  async uploadImage(file: File): Promise<string> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: file,
    });
    if (!res.ok) throw new Error('Failed to upload image');
    const { url } = (await res.json()) as { url: string };
    return url;
  }
}
