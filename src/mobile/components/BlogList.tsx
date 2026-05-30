import { useApp } from "../../contexts/AppContext";
import { Tag } from "../ui-components/Tag";
import { posts } from "../../data/posts";

export function BlogList() {
  const app = useApp();
  return (
    <div className="space-y-4 px-4 py-6">
      <div className="font-mono">
        <div className="text-lg font-bold text-mauve mb-1">~/posts</div>
        <div className="text-xs text-muted">{posts.length} {posts.length === 1 ? "entry" : "entries"}</div>
      </div>
      <div className="border-t border-border" />
      <div className="space-y-3">
        {posts.map((post) => (
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
            <div className="text-xs text-muted font-mono mb-2">{post.date}</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {post.tags.map((t) => (
                <Tag key={t} label={t} />
              ))}
            </div>
            <div className="text-xs text-dim leading-relaxed line-clamp-2">{post.excerpt}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
