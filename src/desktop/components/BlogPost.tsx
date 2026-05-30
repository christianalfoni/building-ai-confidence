import { useApp } from "../../contexts/AppContext";
import { Tag } from "../ui-components/Tag";
import { posts } from "../../data/posts";

export function BlogPost() {
  const app = useApp();
  const post = posts.find((p) => p.slug === app.selectedPostSlug);
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
          <span>·</span>
          <div className="flex gap-1">
            {post.tags.map((t) => (
              <Tag key={t} label={t} />
            ))}
          </div>
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
        <span className="text-dim">q to go back</span>
      </div>
    </div>
  );
}
