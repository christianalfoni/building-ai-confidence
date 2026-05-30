import { useApp } from "../../contexts/AppContext";
import { Tag } from "../ui-components/Tag";
import { posts } from "../../data/posts";

export function BlogPost() {
  const app = useApp();
  const post = posts.find((p) => p.slug === app.selectedPostSlug);
  if (!post) return null;

  return (
    <div className="px-4 py-6 space-y-4">
      <button
        onClick={() => app.goBack()}
        className="flex items-center gap-2 text-sm text-muted font-mono active:text-text"
      >
        ← back
      </button>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-teal font-mono leading-snug">{post.title}</h1>
        <div className="flex items-center gap-2 text-xs text-muted font-mono">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readTime} read</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {post.tags.map((t) => (
            <Tag key={t} label={t} />
          ))}
        </div>
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
