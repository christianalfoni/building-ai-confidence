// Tests for the image-line editor behaviour: selection expands onto an image so
// it reads as a selected unit, the boundaries stay passable, code-fence images
// stay literal, and deletion removes the whole line.
import { EditorState } from "@codemirror/state";
import {
  editorExtensions,
  getFenceLines,
  imageLineAt,
  imageLineDeletion,
  selectedImageLeavePos,
  skipFence,
} from "./editorExtensions";
import { createEditorView } from "./editorView";

function stateWith(doc: string, head: number): EditorState {
  return EditorState.create({
    doc,
    selection: { anchor: head },
    extensions: editorExtensions(),
  });
}

describe("image line editor behaviour", () => {
  const img = "![cat](https://blob.test/cat.png)";

  it("expands the selection to the whole line when the caret moves inside an image", () => {
    const doc = `intro\n${img}\noutro`;
    const lineFrom = "intro\n".length;
    const inside = lineFrom + 3; // strictly inside the image markdown
    const state = EditorState.create({ doc, extensions: editorExtensions() });
    const tr = state.update({ selection: { anchor: inside } });
    expect(tr.state.selection.main.from).toBe(lineFrom);
    expect(tr.state.selection.main.to).toBe(lineFrom + img.length);
  });

  it("selects the whole image even at the line boundaries (no caret rest)", () => {
    const doc = `intro\n${img}\noutro`;
    const lineFrom = "intro\n".length;
    const lineTo = lineFrom + img.length;
    const atStart = EditorState.create({ doc, extensions: editorExtensions() }).update({
      selection: { anchor: lineFrom },
    });
    const atEnd = EditorState.create({ doc, extensions: editorExtensions() }).update({
      selection: { anchor: lineTo },
    });
    expect(atStart.state.selection.main).toMatchObject({ from: lineFrom, to: lineTo });
    expect(atEnd.state.selection.main).toMatchObject({ from: lineFrom, to: lineTo });
  });

  it("leaves a selected image to the neighbouring line on arrow press", () => {
    const doc = `intro\n${img}\noutro`;
    const lineFrom = "intro\n".length;
    const lineTo = lineFrom + img.length;
    const state = EditorState.create({
      doc,
      selection: { anchor: lineFrom, head: lineTo },
      extensions: editorExtensions(),
    });
    // forward → start of "outro"; backward → end of "intro".
    expect(selectedImageLeavePos(state, true)).toBe(lineTo + 1);
    expect(selectedImageLeavePos(state, false)).toBe("intro".length);
  });

  it("does not treat a collapsed caret as a leavable image selection", () => {
    const doc = `intro\n${img}\noutro`;
    const state = stateWith(doc, 0);
    expect(selectedImageLeavePos(state, true)).toBeNull();
  });

  it("treats an image-only line as an image unit", () => {
    const doc = `${img}\nmore`;
    const state = stateWith(doc, 2);
    expect(imageLineAt(state, 2)).not.toBeNull();
  });

  it("does not treat an image inside a fenced code block as an image", () => {
    const doc = "```\n" + img + "\n```";
    const posInFence = 4 + 2; // within the image line inside the fence
    const state = stateWith(doc, posInFence);
    expect(imageLineAt(state, posInFence)).toBeNull();
  });

  it("deletes the whole image line plus a newline", () => {
    const doc = `intro\n${img}\noutro`;
    const lineFrom = "intro\n".length;
    const state = stateWith(doc, lineFrom + 3);
    const del = imageLineDeletion(state);
    expect(del).toEqual({ from: lineFrom, to: lineFrom + img.length + 1 });
  });

  it("ignores a pending-upload placeholder line", () => {
    const doc = "![cat](uploading:abc-123)";
    const state = stateWith(doc, 3);
    expect(imageLineAt(state, 3)).toBeNull();
  });

  it("mounts an image widget in a real editor view (line + replace decorations)", () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const view = createEditorView({ parent, doc: `hi\n${img}\nbye`, onChange: () => {} });
    const el = parent.querySelector("img.md-image");
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute("src", "https://blob.test/cat.png");
    expect(parent.querySelector(".cm-md-image-line")).not.toBeNull();
    view.destroy();
    parent.remove();
  });
});

describe("fenced code block fence lines", () => {
  // above / ``` / code / ``` / below
  const doc = "above\n```\ncode\n```\nbelow";

  it("identifies the opening and closing ``` lines", () => {
    const state = EditorState.create({ doc, extensions: editorExtensions() });
    expect([...getFenceLines(state)].sort((a, b) => a - b)).toEqual([2, 4]);
  });

  it("renders only the code content as the box, with the fences collapsed", () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const view = createEditorView({ parent, doc, onChange: () => {} });
    // Two fence lines collapsed; the single content line rounds both corners.
    expect(parent.querySelectorAll(".cm-md-code-fence").length).toBe(2);
    const open = parent.querySelector(".cm-md-code-open");
    expect(open).not.toBeNull();
    expect(open).toHaveClass("cm-md-code-close");
    expect(open?.textContent).toContain("code");
    view.destroy();
    parent.remove();
  });

  it("skips the fence line when arrowing into and out of the block", () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const view = createEditorView({ parent, doc, onChange: () => {} });
    const codeFrom = view.state.doc.line(3).from;
    const belowFrom = view.state.doc.line(5).from;

    // From the line above, ArrowDown skips the opening ``` onto the code line.
    view.dispatch({ selection: { anchor: view.state.doc.line(1).from } });
    expect(skipFence(view, 1, false)).toBe(true);
    expect(view.state.selection.main.head).toBe(codeFrom);

    // From the code line, ArrowDown skips the closing ``` onto the line below.
    expect(skipFence(view, 1, false)).toBe(true);
    expect(view.state.selection.main.head).toBe(belowFrom);

    view.destroy();
    parent.remove();
  });

  it("does not intercept arrows when no fence is adjacent", () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const view = createEditorView({ parent, doc, onChange: () => {} });
    view.dispatch({ selection: { anchor: view.state.doc.line(5).from } });
    expect(skipFence(view, 1, false)).toBe(false); // nothing below "below"
    view.destroy();
    parent.remove();
  });
});
