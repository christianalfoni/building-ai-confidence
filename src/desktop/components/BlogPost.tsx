import { useEffect, useRef } from "react";
import { useApp } from "../../contexts/AppContext";
import { Tag } from "../ui-components/Tag";
import { DeleteConfirm } from "../ui-components/DeleteConfirm";
import { Markdown } from "../../common/ui-components/Markdown";
import { dbPostToPost } from "../../common/utils";

export function BlogPost() {
  const app = useApp();
  const dbMatch = app.selectedPost;
  const deleteRef = useRef<HTMLSpanElement>(null);

  // The author can manage the post addressed by the current URL.
  const canManage = !!dbMatch && app.isAuthor && dbMatch.authorId === app.user?.id;
  const postId = dbMatch?.id;

  // Author keyboard shortcuts: `e` opens the editor, `d` arms the delete
  // confirmation — it clicks the same "delete" trigger a mouse would, so the
  // on-screen yes/no still gates the actual delete (one keypress never deletes).
  // The single-button check means a second `d` while the confirm is showing
  // can't accidentally fire "yes". Ignored while typing or with modifiers held.
  useEffect(() => {
    if (!canManage || !postId) return;
    const id = postId;
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }
      if (e.key === "e") {
        e.preventDefault();
        app.openEditor(id);
      } else if (e.key === "d") {
        e.preventDefault();
        const buttons = deleteRef.current?.querySelectorAll("button");
        if (buttons?.length === 1) buttons[0].click();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [app, canManage, postId]);

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
            <span ref={deleteRef}>
              <DeleteConfirm
                confirmMessage="delete this post?"
                onConfirm={() => app.deletePost(dbMatch.id)}
              />
            </span>
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
