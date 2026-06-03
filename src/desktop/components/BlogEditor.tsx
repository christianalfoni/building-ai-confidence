import { useBlogEditor } from "../../common/hooks/useBlogEditor";
import MarkdownEditor from "../../common/ui-components/MarkdownEditor";

export function BlogEditor() {
  const { app, post, body, titleRef, closeEditor, handleTitleChange, handleBodyChange, handlePublishToggle } = useBlogEditor();

  if (!post) return null;

  return (
    <div className="space-y-4 font-mono text-sm">
      <div className="flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="text-mauve">❯</span>
          <span>edit {post.id}.md</span>
        </div>
        <button
          onClick={handlePublishToggle}
          className="text-dim hover:text-muted transition-colors cursor-pointer underline underline-offset-2"
        >
          {app.draftPublished ? "unpublish" : "publish"}
        </button>
      </div>
      <div className="rounded p-4 space-y-2 bg-surface border border-border">
        <input
          ref={titleRef}
          className="w-full text-xl font-bold text-teal leading-snug bg-transparent outline-none placeholder:text-teal/30"
          placeholder="Title..."
          value={app.draftTitle}
          onChange={handleTitleChange}
        />
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{post.createdAt.slice(0, 10)}</span>
          {!app.draftPublished && (
            <>
              <span>·</span>
              <span className="text-mauve">draft</span>
            </>
          )}
        </div>
      </div>
      <div className="text-dim text-xs">{"─".repeat(60)}</div>
      <div className="text-sm leading-relaxed text-subtext min-h-[200px]">
        <MarkdownEditor value={body} onChange={handleBodyChange} placeholder="Start writing..." />
      </div>
      <div className="border-t border-border pt-3 flex items-center text-xs">
        <button
          onClick={closeEditor}
          className="text-muted hover:text-text transition-colors cursor-pointer"
        >
          esc
        </button>
      </div>
    </div>
  );
}
