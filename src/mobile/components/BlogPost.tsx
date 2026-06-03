import { useApp } from "../../contexts/AppContext";
import { Tag } from "../ui-components/Tag";
import { DeleteConfirm } from "../ui-components/DeleteConfirm";
import { dbPostToPost } from "../../common/utils";

export function BlogPost() {
  const app = useApp();
  const dbMatch = app.selectedPost;

  if (!dbMatch) {
    return (
      <div className="px-4 py-6 space-y-4">
        <a
          href="/"
          className="flex items-center gap-2 text-sm text-muted font-mono active:text-text"
        >
          ← back
        </a>
        <div className="rounded-lg p-8 text-center space-y-3 bg-surface border border-border">
          <div className="text-5xl font-bold text-mauve font-mono">404</div>
          <div className="text-sm text-muted font-mono">no such post</div>
        </div>
      </div>
    );
  }

  const post = dbPostToPost(dbMatch);

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2 text-sm text-muted font-mono active:text-text"
        >
          ← back
        </a>
        {app.isAuthor && dbMatch && dbMatch.authorId === app.user?.id && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => app.openEditor(dbMatch.id)}
              className="text-sm text-muted font-mono active:text-mauve"
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
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-teal font-mono leading-snug">{post.title}</h1>
        <div className="flex items-center gap-2 text-xs text-muted font-mono">
          <span>{post.date}</span>
          {post.draft && (
            <>
              <span>·</span>
              <span className="px-1.5 py-0.5 rounded border border-dashed border-mauve/50 text-mauve/80 bg-mauve/5">
                draft
              </span>
            </>
          )}
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
