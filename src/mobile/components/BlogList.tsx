import { useApp } from "../../contexts/AppContext";
import { Tag } from "../ui-components/Tag";
import type { DbPost } from "../../services";

function dbPostToPost(p: DbPost) {
  return {
    slug: p.slug || p.id,
    title: p.title || "Untitled",
    date: p.createdAt.slice(0, 10),
    readTime: "?m",
    tags: [],
    excerpt: p.body.slice(0, 120),
    body: p.body.split("\n\n").filter(Boolean),
    draft: !p.published,
  };
}

export function BlogList() {
  const app = useApp();

  const visibleDbPosts = app.dbPosts.filter(
    (p) => p.published || (app.isAuthor && p.authorId === app.user?.id)
  );
  const allPosts = visibleDbPosts.map(dbPostToPost).sort((a, b) => b.date.localeCompare(a.date));

  function handleNewPost() {
    app.createPost();
  }

  return (
    <div className="space-y-4 px-4 py-6">
      <div className="font-mono">
        <div className="text-lg font-bold text-mauve mb-1">~/posts</div>
        <div className="text-xs text-muted">{allPosts.length} {allPosts.length === 1 ? "entry" : "entries"}</div>
      </div>
      <div className="border-t border-border" />
      <div className="space-y-3">
        {app.isAuthor && (
          <button
            className="w-full text-left rounded-lg p-4 bg-surface border border-dashed border-border active:opacity-70 opacity-60"
            onClick={handleNewPost}
          >
            <span className="font-mono text-muted italic text-sm">+ new post...</span>
          </button>
        )}
        {allPosts.map((post) => (
          <button
            key={post.slug}
            className="w-full text-left rounded-lg p-4 bg-surface border border-border active:opacity-70"
            onClick={() => app.selectPost(post.slug)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-mono font-semibold text-teal leading-snug">{post.title}</span>
              <span className="text-xs text-mauve bg-mauve/10 px-2 py-0.5 rounded shrink-0 font-mono">
                {post.readTime}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted font-mono">{post.date}</span>
              {post.draft && (
                <span className="text-xs px-1.5 py-0.5 rounded border border-dashed border-mauve/50 text-mauve/80 bg-mauve/5 font-mono">
                  draft
                </span>
              )}
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {post.tags.map((t) => (
                  <Tag key={t} label={t} />
                ))}
              </div>
            )}
            <div className="text-xs text-dim leading-relaxed line-clamp-2">{post.excerpt}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
