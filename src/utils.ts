export function isMobileUA(ua: string): boolean {
  return /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

export type Route = { view: 'list' | 'post'; postId: string | null };

// Maps a URL pathname to a route. `/posts/:id` selects a post; `/`, `/posts`,
// and `/posts/` (no id) all resolve to the list. Shared by the SSR and client
// entries so both derive the same view from the same URL.
export function parseRoute(pathname: string): Route {
  const match = pathname.match(/^\/posts\/([^/]+)\/?$/);
  if (match) return { view: 'post', postId: decodeURIComponent(match[1]) };
  return { view: 'list', postId: null };
}

export function invariant<T>(
  value: T,
  error: string,
): asserts value is NonNullable<T> {
  if (!value) {
    throw new Error(error);
  }
}
