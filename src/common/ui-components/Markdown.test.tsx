import { render } from "@testing-library/react";
import { Markdown } from "./Markdown";

describe("Markdown reader", () => {
  it("keeps the heading marker and colours the heading", () => {
    const { container } = render(<Markdown source="# Title" />);
    // The `#` marker stays visible (mirrors the editor).
    expect(container.textContent).toContain("#");
    expect(container.textContent).toContain("Title");
    const headingText = Array.from(container.querySelectorAll(".tok-heading"))
      .map((el) => el.textContent)
      .join("");
    expect(headingText).toContain("Title");
  });

  it("keeps the hyphen marker on list items", () => {
    const { container } = render(<Markdown source={"- first\n- second"} />);
    expect(container.textContent).toContain("- first");
    expect(container.textContent).toContain("- second");
  });

  it("hides the ``` fence lines but highlights the code", () => {
    const source = ["```js", "const x = 1;", "```"].join("\n");
    const { container } = render(<Markdown source={source} />);
    // Fence delimiter lines are not rendered.
    expect(container.textContent).not.toContain("```");
    // Code text remains, with language highlighting applied.
    expect(container.textContent).toContain("const x = 1;");
    const keyword = container.querySelector(".tok-keyword");
    expect(keyword?.textContent).toBe("const");
  });

  it("renders nothing for empty source", () => {
    const { container } = render(<Markdown source="" />);
    expect(container.firstChild).toBeNull();
  });
});
