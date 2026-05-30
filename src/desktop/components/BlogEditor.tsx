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
  }, []);

  if (!post) return null;

  function scheduleSave(fields: Partial<Pick<DbPost, "title" | "body" | "published">>) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/posts/${post!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const updated = (await res.json()) as DbPost;
        app.updateDbPost(updated);
      }
    }, DEBOUNCE_MS);
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
      <div
        ref={bodyRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleBodyInput}
        className="text-sm leading-relaxed text-subtext outline-none min-h-[200px] whitespace-pre-wrap focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-dim"
        data-placeholder="Start writing..."
      />
      <div className="border-t border-border pt-3 flex items-center justify-between text-xs">
        <button
          onClick={() => app.goBack()}
          className="text-muted hover:text-text transition-colors cursor-pointer"
        >
          ← cd ..
        </button>
        <button
          onClick={handlePublishToggle}
          className={`px-3 py-1 rounded border transition-colors cursor-pointer ${
            app.draftPublished
              ? "border-green text-green bg-green/10 hover:bg-green/20"
              : "border-border text-muted hover:text-text hover:border-muted"
          }`}
        >
          {app.draftPublished ? "published" : "draft"}
        </button>
      </div>
    </div>
  );
}
