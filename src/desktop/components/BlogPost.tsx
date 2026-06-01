import { useApp } from "../../contexts/AppContext";
import { Tag } from "../ui-components/Tag";
import type { Post } from "../../data/posts";
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
    draft: !p.published,
  };
}

export function BlogPost() {
  const app = useApp();
  const dbMatch = app.dbPosts.find(
    (p) => (p.slug || p.id) === app.selectedPostSlug
  );
  const post = dbMatch ? dbPostToPost(dbMatch) : null;
  if (!post) return null;

  return (
    <div className="space-y-4 font-mono text-sm">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="text-mauve">❯</span>
        <span>cat {post.slug}.md</span>
      </div>
      <div className="rounded p-4 space-y-2 bg-surface border border-border">
        <div className="text-xl font-bold text-teal leading-snug">{post.title}</div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readTime} read</span>
          {post.tags.length > 0 && (
            <>
              <span>·</span>
              <div className="flex gap-1">
                {post.tags.map((t) => (
                  <Tag key={t} label={t} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="text-dim text-xs">{"─".repeat(60)}</div>
      <div className="space-y-3">
        {post.body.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-subtext">
            {p}
          </p>
        ))}
      </div>
      <div className="border-t border-border pt-3 flex items-center justify-between text-xs">
        <button
          onClick={() => app.goBack()}
          className="text-muted hover:text-text transition-colors cursor-pointer"
        >
          ← cd ..
        </button>
        <div className="flex items-center gap-4">
          {app.isAuthor && dbMatch && (
            <button
              onClick={() => app.openEditor(dbMatch.id)}
              className="text-muted hover:text-mauve transition-colors cursor-pointer"
            >
              edit
            </button>
          )}
          <span className="text-dim">q to go back</span>
        </div>
      </div>
    </div>
  );
}
