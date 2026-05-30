import { useEffect, useRef } from "react";
import { useApp } from "../../contexts/AppContext";
import type { DbPost } from "../../services";

const DEBOUNCE_MS = 800;

export function BlogEditor() {
  const app = useApp();
  const post = app.dbPosts.find((p) => p.id === app.draftPostId);
  const bodyRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialBody = useRef(post?.body ?? "");
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.textContent = initialBody.current;
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!post) return null;

  function scheduleSave(fields: Partial<Pick<DbPost, "title" | "body" | "published">>) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { app.savePost(fields); }, DEBOUNCE_MS);
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    app.setDraftTitle(e.target.value);
    scheduleSave({ title: e.target.value });
  }

  function handleBodyInput() {
    const body = bodyRef.current?.textContent ?? "";
    scheduleSave({ body });
  }

  function handlePublishToggle() {
    const next = !app.draftPublished;
    app.setDraftPublished(next);
    scheduleSave({ published: next });
  }

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
          onClick={() => app.goBack()}
          className="text-xs text-muted font-mono"
        >
          ← cd ..
        </button>
        <button
          onClick={handlePublishToggle}
          className={`text-xs px-3 py-1.5 rounded border font-mono transition-colors ${
            app.draftPublished
              ? "border-green text-green bg-green/10"
              : "border-border text-muted"
          }`}
        >
          {app.draftPublished ? "published" : "draft"}
        </button>
      </div>
    </div>
  );
}
