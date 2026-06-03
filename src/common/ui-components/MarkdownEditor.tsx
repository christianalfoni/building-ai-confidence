// Controlled CodeMirror 6 wrapper for the article body. CLIENT-ONLY: it imports
// `@codemirror/*`, so it must be reached via `React.lazy(() => import(...))` and
// never rendered on the server. Default export so it can be lazily imported.
import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, placeholder as placeholderExt } from "@codemirror/view";
import { editorExtensions } from "../markdown/editorExtensions";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create the editor once.
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          ...editorExtensions(),
          placeholderExt(placeholder ?? ""),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. switching to a different draft) without
  // clobbering the user's in-progress edits.
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
