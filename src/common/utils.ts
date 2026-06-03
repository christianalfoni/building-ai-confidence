import type { DbPost } from '../services';

export function dbPostToPost(p: DbPost) {
  return {
    id: p.id,
    slug: p.slug || p.id,
    title: p.title || 'Untitled',
    date: p.createdAt.slice(0, 10),
    readTime: '?m',
    tags: [] as string[],
    excerpt: p.body.slice(0, 120),
    // Raw markdown — rendered by the shared <Markdown> reader, which keeps the
    // markers (`#`, `-`, …) visible to mirror the editor.
    body: p.body,
    draft: !p.published,
  };
}
