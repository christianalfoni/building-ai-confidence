import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import type { DbPost } from '../../services';

const DEBOUNCE_MS = 800;

export function useBlogEditor() {
  const app = useApp();
  const post = app.dbPosts.find((p) => p.id === app.draftPostId);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFields = useRef<Partial<Pick<DbPost, 'title' | 'body' | 'published'>>>({});

  // The CodeMirror editor is controlled by this value. Seeded once from the
  // draft; onChange keeps it in sync and schedules the debounced save.
  const [body, setBody] = useState(post?.body ?? '');

  useEffect(() => {
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

  function handleBodyChange(value: string) {
    setBody(value);
    scheduleSave({ body: value });
  }

  function handlePublishToggle() {
    const next = !app.draftPublished;
    app.setDraftPublished(next);
    scheduleSave({ published: next });
  }

  return { app, post, body, handleTitleChange, handleBodyChange, handlePublishToggle };
}
