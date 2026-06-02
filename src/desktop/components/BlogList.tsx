import { useApp } from "../../contexts/AppContext";
import { Tag } from "../ui-components/Tag";
import { dbPostToPost } from "../../common/utils";

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
          <button
            className="group w-full text-left opacity-50 hover:opacity-100 transition-opacity"
            onClick={handleNewPost}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs text-dim w-4 text-right shrink-0">+</span>
              <span className="text-muted group-hover:text-mauve transition-colors italic">
                new post...
              </span>
            </div>
          </button>
        )}
        {allPosts.map((post, i) => (
          <a
            key={post.id}
            href={`/posts/${post.id}`}
            className="group cursor-pointer block"
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
              {post.draft && (
                <span className="text-xs px-1.5 py-0.5 rounded border border-dashed border-mauve/50 text-mauve/80 bg-mauve/5 font-mono">
                  draft
                </span>
              )}
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
          </a>
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
