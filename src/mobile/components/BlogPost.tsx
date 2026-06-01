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
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => app.goBack()}
          className="flex items-center gap-2 text-sm text-muted font-mono active:text-text"
        >
          ← back
        </button>
        {app.isAuthor && dbMatch && dbMatch.authorId === app.user?.id && (
          <button
            onClick={() => app.openEditor(dbMatch.id)}
            className="text-sm text-muted font-mono active:text-mauve"
          >
            edit
          </button>
        )}
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-teal font-mono leading-snug">{post.title}</h1>
        <div className="flex items-center gap-2 text-xs text-muted font-mono">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readTime} read</span>
        </div>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((t) => (
              <Tag key={t} label={t} />
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-border" />
      <div className="space-y-4">
        {post.body.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-subtext">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
