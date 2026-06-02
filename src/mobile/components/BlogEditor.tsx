import { useBlogEditor } from "../../common/hooks/useBlogEditor";

export function BlogEditor() {
  const { app, post, bodyRef, handleTitleChange, handleBodyInput, handlePublishToggle } = useBlogEditor();

  if (!post) return null;

  return (
    <div className="px-4 py-6 space-y-4 font-mono text-sm">
      <input
        className="w-full text-xl font-bold text-teal leading-snug bg-transparent outline-none placeholder:text-teal/30"
        placeholder="Title..."
        value={app.draftTitle}
        onChange={handleTitleChange}
      />
      <div className="text-xs text-muted">{post.createdAt.slice(0, 10)}</div>
      <div className="border-t border-border" />
      <div
        ref={bodyRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleBodyInput}
        className="text-sm leading-relaxed text-subtext outline-none min-h-[300px] whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-dim"
        data-placeholder="Start writing..."
      />
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <button
          onClick={() => app.closeEditor()}
          className="text-xs text-muted font-mono"
        >
          ← cd ..
        </button>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-0.5 rounded border font-mono ${
              app.draftPublished
                ? "border-green/50 text-green bg-green/10"
                : "border-dashed border-mauve/50 text-mauve/80 bg-mauve/5"
            }`}
          >
            {app.draftPublished ? "live" : "draft"}
          </span>
          <button
            onClick={handlePublishToggle}
            className="text-xs text-dim font-mono active:text-muted underline underline-offset-2"
          >
            {app.draftPublished ? "unpublish" : "publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
