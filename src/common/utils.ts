import type { DbPost } from '../services';

export function dbPostToPost(p: DbPost) {
  return {
    id: p.id,
    slug: p.slug || p.id,
    title: p.title || 'Untitled',
    date: p.createdAt.slice(0, 10),
    tags: [] as string[],
    excerpt: p.body.slice(0, 120),
    body: p.body.split('\n\n').filter(Boolean),
    draft: !p.published,
  };
}
