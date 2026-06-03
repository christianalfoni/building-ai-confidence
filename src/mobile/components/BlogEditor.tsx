import { useBlogEditor } from "../../common/hooks/useBlogEditor";

export function BlogEditor() {
  const { app, post, bodyRef, titleRef, closeEditor, handleTitleChange, handleBodyInput, handlePublishToggle } = useBlogEditor();

  if (!post) return null;

  return (
    <div className="px-4 py-6 space-y-4 font-mono text-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={closeEditor}
          className="text-sm text-muted font-mono active:text-text"
        >
          ← back
        </button>
        <button
          onClick={handlePublishToggle}
          className="text-xs text-dim font-mono active:text-muted underline underline-offset-2"
        >
          {app.draftPublished ? "unpublish" : "publish"}
        </button>
      </div>
      <input
        ref={titleRef}
        className="w-full text-xl font-bold text-teal leading-snug bg-transparent outline-none placeholder:text-teal/30"
        placeholder="Title..."
        value={app.draftTitle}
        onChange={handleTitleChange}
      />
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>{post.createdAt.slice(0, 10)}</span>
        {!app.draftPublished && (
          <>
            <span>·</span>
            <span className="text-mauve">draft</span>
          </>
        )}
      </div>
      <div className="border-t border-border" />
      <div
        ref={bodyRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleBodyInput}
        className="text-sm leading-relaxed text-subtext outline-none min-h-[300px] whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-dim"
        data-placeholder="Start writing..."
      />
    </div>
  );
}
