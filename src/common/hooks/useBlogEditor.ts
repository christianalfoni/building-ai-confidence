import { useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import type { DbPost } from '../../services';

const DEBOUNCE_MS = 800;

export function useBlogEditor() {
  const app = useApp();
  const post = app.dbPosts.find((p) => p.id === app.draftPostId);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFields = useRef<Partial<Pick<DbPost, 'title' | 'body' | 'published'>>>({});

  // Persist any debounced-but-not-yet-saved edits immediately. Must run before
  // closeEditor() nulls draftPostId — otherwise savePost no-ops and edits made
  // within the last DEBOUNCE_MS window are lost.
  function flushPendingSave() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (Object.keys(pendingFields.current).length > 0) {
      app.savePost(pendingFields.current);
      pendingFields.current = {};
    }
  }

  // The single exit point for the editor: flush first so leaving never drops
  // recent edits, then close.
  function closeEditor() {
    flushPendingSave();
    app.closeEditor();
  }

  // Keep the keydown handler pointing at the latest close logic without
  // re-subscribing the listener on every render.
  const closeRef = useRef(closeEditor);
  useEffect(() => {
    closeRef.current = closeEditor;
  });

  const initialBody = useRef(post?.body ?? '');
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.textContent = initialBody.current;
    }
    // Drop the cursor straight into the title so writing can begin immediately.
    titleRef.current?.focus();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Esc leaves the editor — the terminal-native way out, no mouse required.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeRef.current();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
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

  return { app, post, bodyRef, titleRef, closeEditor, handleTitleChange, handleBodyInput, handlePublishToggle };
}
