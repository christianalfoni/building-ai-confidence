export function isMobileUA(ua: string): boolean {
  return /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

export type Route = { view: 'list' | 'post'; postId: string | null };

// Maps a URL pathname to a route. `/posts/:id` selects a post; `/`, `/posts`,
// and `/posts/` (no id) all resolve to the list. Shared by the SSR and client
// entries so both derive the same view from the same URL.
export function parseRoute(pathname: string): Route {
  const match = pathname.match(/^\/posts\/([^/]+)\/?$/);
  if (match) return { view: 'post', postId: safeDecode(match[1]) };
  return { view: 'list', postId: null };
}

// decodeURIComponent throws on malformed percent-encoding (e.g. `%E0%A4%A`).
// The segment is user-controlled, so fall back to the raw value — it simply
// won't match any post id and resolves to the in-page 404.
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function invariant<T>(
  value: T,
  error: string,
): asserts value is NonNullable<T> {
  if (!value) {
    throw new Error(error);
  }
}
