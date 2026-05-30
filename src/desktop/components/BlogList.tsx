import { useApp } from "../../contexts/AppContext";
import { Tag } from "../ui-components/Tag";
import { posts as hardcodedPosts, type Post } from "../../data/posts";
import type { DbPost } from "../../services";

function dbPostToPost(p: DbPost): Post {
  return {
    slug: p.slug || p.id,
    title: p.title || "Untitled",
    date: p.createdAt.slice(0, 10),
    readTime: "?m",
    tags: [],
    excerpt: p.body.slice(0, 120),
    body: p.body.split("\n\n").filter(Boolean),
  };
}

export function BlogList() {
  const app = useApp();

  const visibleDbPosts = app.dbPosts.filter(
    (p) => p.published || (app.isAuthor && p.authorId === app.user?.id)
  );
  const allPosts: Post[] = [
    ...visibleDbPosts.map(dbPostToPost),
    ...hardcodedPosts,
  ];

  async function handleNewPost() {
    const res = await fetch("/api/posts", { method: "POST" });
    if (!res.ok) return;
    const post = (await res.json()) as DbPost;
    app.updateDbPost(post);
    app.openEditor(post.id);
  }

  return (
    <div className="space-y-6 font-mono text-sm text-text">
      <div>
        <div className="text-lg font-bold text-mauve mb-1">~/posts</div>
        <div className="text-xs text-muted">
          {allPosts.length} {allPosts.length === 1 ? "entry" : "entries"} · sorted by date · newest first
        </div>
      </div>
      <div className="border-t border-border" />
      <div className="space-y-4">
        {app.isAuthor && (
          <div
            className="group cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
            onClick={handleNewPost}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs text-dim w-4 text-right shrink-0">+</span>
              <span className="text-muted group-hover:text-mauve transition-colors italic">
                new post...
              </span>
            </div>
          </div>
        )}
        {allPosts.map((post, i) => (
          <div
            key={post.slug}
            className="group cursor-pointer"
            onClick={() => app.selectPost(post.slug)}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs text-dim w-4 text-right shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-teal font-semibold group-hover:text-mauve transition-colors">
                {post.title}
              </span>
              <span className="ml-auto text-xs text-mauve bg-mauve/10 px-2 py-0.5 rounded shrink-0">
                {post.readTime} read
              </span>
            </div>
            <div className="flex items-center gap-2 ml-7">
              <span className="text-xs text-muted">{post.date}</span>
              {post.tags.length > 0 && (
                <>
                  <span className="text-dim">·</span>
                  <div className="flex gap-1">
                    {post.tags.map((t) => (
                      <Tag key={t} label={t} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="text-xs text-dim mt-1.5 ml-7 leading-relaxed line-clamp-1">
              {post.excerpt}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <span className="text-mauve">❯</span>
          <span className="inline-block w-2 h-4 bg-mauve/80 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
