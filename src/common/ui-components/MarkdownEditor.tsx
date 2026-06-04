// Controlled CodeMirror wrapper for the article body. This component is a stable,
// statically-importable React component with NO static `@codemirror/*` imports —
// the heavy editor code is pulled in via a dynamic import (markdownEditorLazy),
// so CodeMirror stays code-split and never runs during SSR. If the editor chunk
// was preloaded (signed-in authors), the view is created synchronously on mount
// with no loading flash; otherwise the host stays empty until the chunk loads.
import { useEffect, useLayoutEffect, useRef } from "react";
import type { EditorView } from "@codemirror/view"; // type-only — erased at build
import { getLoadedEditorModule, preloadMarkdownEditor } from "./markdownEditorLazy";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  uploadImage?: (file: File) => Promise<string>;
};

export default function MarkdownEditor({ value, onChange, placeholder, uploadImage }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  // The view is created once on mount; route uploads through a ref so it always
  // calls the latest callback without re-creating the editor.
  const uploadImageRef = useRef(uploadImage);
  useEffect(() => {
    uploadImageRef.current = uploadImage;
  }, [uploadImage]);

  // Create the editor view once the (possibly preloaded) chunk is available.
  useLayoutEffect(() => {
    let cancelled = false;
    const mount = (mod: NonNullable<ReturnType<typeof getLoadedEditorModule>>) => {
      if (cancelled || !host.current || viewRef.current) return;
      viewRef.current = mod.createEditorView({
        parent: host.current,
        doc: value,
        placeholder,
        onChange: (v) => onChangeRef.current(v),
        uploadImage: uploadImageRef.current
          ? (file: File) => uploadImageRef.current!(file)
          : undefined,
      });
    };
    const loaded = getLoadedEditorModule();
    if (loaded) mount(loaded);
    else preloadMarkdownEditor().then(mount);
    return () => {
      cancelled = true;
      viewRef.current?.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. switching drafts) without clobbering edits.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} className="cm-host" />;
}
