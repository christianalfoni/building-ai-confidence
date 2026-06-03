import { Suspense, lazy } from "react";
import { useBlogEditor } from "../../common/hooks/useBlogEditor";

// Client-only: keeps CodeMirror out of the SSR bundle.
const MarkdownEditor = lazy(() => import("../../common/ui-components/MarkdownEditor"));

export function BlogEditor() {
  const { app, post, body, handleTitleChange, handleBodyChange, handlePublishToggle } = useBlogEditor();

  if (!post) return null;

  return (
    <div className="space-y-4 font-mono text-sm">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="text-mauve">❯</span>
        <span>edit {post.id}.md</span>
      </div>
      <div className="rounded p-4 space-y-2 bg-surface border border-border">
        <input
          className="w-full text-xl font-bold text-teal leading-snug bg-transparent outline-none placeholder:text-teal/30"
          placeholder="Title..."
          value={app.draftTitle}
          onChange={handleTitleChange}
        />
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{post.createdAt.slice(0, 10)}</span>
        </div>
      </div>
      <div className="text-dim text-xs">{"─".repeat(60)}</div>
      <div className="text-sm leading-relaxed text-subtext min-h-[200px]">
        <Suspense fallback={<div className="text-dim">loading editor…</div>}>
          <MarkdownEditor
            value={body}
            onChange={handleBodyChange}
            placeholder="Start writing..."
          />
        </Suspense>
      </div>
      <div className="border-t border-border pt-3 flex items-center justify-between text-xs">
        <button
          onClick={() => app.closeEditor()}
          className="text-muted hover:text-text transition-colors cursor-pointer"
        >
          ← cd ..
        </button>
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded border font-mono text-xs ${
              app.draftPublished
                ? "border-green/50 text-green bg-green/10"
                : "border-dashed border-mauve/50 text-mauve/80 bg-mauve/5"
            }`}
          >
            {app.draftPublished ? "live" : "draft"}
          </span>
          <button
            onClick={handlePublishToggle}
            className="text-dim hover:text-muted transition-colors cursor-pointer underline underline-offset-2"
          >
            {app.draftPublished ? "unpublish" : "publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
