import { useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import type { DbPost } from '../../services';

const DEBOUNCE_MS = 800;

export function useBlogEditor() {
  const app = useApp();
  const post = app.dbPosts.find((p) => p.id === app.draftPostId);
  const bodyRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFields = useRef<Partial<Pick<DbPost, 'title' | 'body' | 'published'>>>({});

  const initialBody = useRef(post?.body ?? '');
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.textContent = initialBody.current;
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function scheduleSave(fields: Partial<Pick<DbPost, 'title' | 'body' | 'published'>>) {
    pendingFields.current = { ...pendingFields.current, ...fields };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      app.savePost(pendingFields.current);
      pendingFields.current = {};
    }, DEBOUNCE_MS);
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    app.setDraftTitle(e.target.value);
    scheduleSave({ title: e.target.value });
  }

  function handleBodyInput() {
    const body = bodyRef.current?.textContent ?? '';
    scheduleSave({ body });
  }

  function handlePublishToggle() {
    const next = !app.draftPublished;
    app.setDraftPublished(next);
    scheduleSave({ published: next });
  }

  return { app, post, bodyRef, handleTitleChange, handleBodyInput, handlePublishToggle };
}
