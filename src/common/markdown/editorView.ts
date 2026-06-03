// CLIENT-ONLY CodeMirror view factory. This module pulls in all the heavy
// `@codemirror/*` code, so it is only ever reached through a dynamic import
// (see markdownEditorLazy.ts) and never loads on the server or in the main
// bundle.
import { EditorState } from "@codemirror/state";
import { EditorView, placeholder as placeholderExt } from "@codemirror/view";
import { editorExtensions } from "./editorExtensions";

export function createEditorView(opts: {
  parent: HTMLElement;
  doc: string;
  placeholder?: string;
  onChange: (value: string) => void;
}): EditorView {
  return new EditorView({
    parent: opts.parent,
    state: EditorState.create({
      doc: opts.doc,
      extensions: [
        ...editorExtensions(),
        placeholderExt(opts.placeholder ?? ""),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) opts.onChange(u.state.doc.toString());
        }),
      ],
    }),
  });
}
