// Tests for the image-line editor behaviour: selection expands onto an image so
// it reads as a selected unit, the boundaries stay passable, code-fence images
// stay literal, and deletion removes the whole line.
import { EditorState } from "@codemirror/state";
import { editorExtensions, imageLineAt, imageLineDeletion } from "./editorExtensions";

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

  it("leaves the line boundaries passable (no expansion at start/end)", () => {
    const doc = `intro\n${img}\noutro`;
    const lineFrom = "intro\n".length;
    const lineTo = lineFrom + img.length;
    const atStart = EditorState.create({ doc, extensions: editorExtensions() }).update({
      selection: { anchor: lineFrom },
    });
    const atEnd = EditorState.create({ doc, extensions: editorExtensions() }).update({
      selection: { anchor: lineTo },
    });
    expect(atStart.state.selection.main.empty).toBe(true);
    expect(atEnd.state.selection.main.empty).toBe(true);
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
});
