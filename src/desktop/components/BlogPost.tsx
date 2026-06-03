import { useApp } from "../../contexts/AppContext";
import { Tag } from "../ui-components/Tag";
import { DeleteConfirm } from "../ui-components/DeleteConfirm";
import { Markdown } from "../../common/ui-components/Markdown";
import { dbPostToPost } from "../../common/utils";

export function BlogPost() {
  const app = useApp();
  const dbMatch = app.selectedPost;

  if (!dbMatch) {
    return (
      <div className="space-y-4 font-mono text-sm">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="text-mauve">❯</span>
          <span>cat {app.selectedPostId}.md</span>
        </div>
        <div className="rounded p-8 text-center space-y-3 bg-surface border border-border">
          <div className="text-5xl font-bold text-mauve">404</div>
          <div className="text-sm text-muted">no such post</div>
        </div>
        <div className="border-t border-border pt-3">
          <a
            href="/"
            className="text-muted hover:text-text transition-colors cursor-pointer"
          >
            ← cd ..
          </a>
        </div>
      </div>
    );
  }

  const post = dbPostToPost(dbMatch);

  return (
    <div className="space-y-4 font-mono text-sm">
      <div className="flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="text-mauve">❯</span>
          <span>cat {post.slug}.md</span>
        </div>
        {app.isAuthor && dbMatch && dbMatch.authorId === app.user?.id && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => app.openEditor(dbMatch.id)}
              className="text-muted hover:text-mauve transition-colors cursor-pointer"
            >
              edit
            </button>
            <DeleteConfirm
              confirmMessage="delete this post?"
              onConfirm={() => app.deletePost(dbMatch.id)}
            />
          </div>
        )}
      </div>
      <div className="rounded p-4 space-y-2 bg-surface border border-border">
        <div className="text-xl font-bold text-teal leading-snug">{post.title}</div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{post.date}</span>
          {post.draft && (
            <>
              <span>·</span>
              <span className="text-mauve">draft</span>
            </>
          )}
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
      <div className="text-sm leading-relaxed text-subtext">
        <Markdown source={post.body} />
      </div>
      <div className="border-t border-border pt-3 flex items-center text-xs">
        <a
          href="/"
          className="text-muted hover:text-text transition-colors cursor-pointer"
        >
          ← cd ..
        </a>
      </div>
    </div>
  );
}
