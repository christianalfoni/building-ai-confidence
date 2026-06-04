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

  it("hides the ``` markers and language, but highlights the code", () => {
    const source = ["```js", "const x = 1;", "```"].join("\n");
    const { container } = render(<Markdown source={source} />);
    // The ``` markers and the language label live behind the box, not shown.
    expect(container.textContent).not.toContain("```");
    expect(container.textContent).not.toContain("js");
    // Code text remains, with language highlighting applied.
    expect(container.textContent).toContain("const x = 1;");
    const keyword = container.querySelector(".tok-keyword");
    expect(keyword?.textContent).toBe("const");
    // The block is boxed (open + close rows present).
    expect(container.querySelector(".md-line-code-open")).not.toBeNull();
    expect(container.querySelector(".md-line-code-close")).not.toBeNull();
  });

  it("renders nothing for empty source", () => {
    const { container } = render(<Markdown source="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders an image-only line as a centered md-image", () => {
    const { container } = render(<Markdown source="![cat](https://blob.test/cat.png)" />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveClass("md-image");
    expect(img).toHaveAttribute("src", "https://blob.test/cat.png");
    expect(img).toHaveAttribute("alt", "cat");
  });

  it("leaves an image inside a fenced code block as literal text", () => {
    const source = "```\n![cat](https://blob.test/cat.png)\n```";
    const { container } = render(<Markdown source={source} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("![cat](https://blob.test/cat.png)");
  });

  it("does not render a still-uploading placeholder as an image", () => {
    const { container } = render(<Markdown source="![cat](uploading:abc-123)" />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders an inline link as a clean anchor that opens in a new tab", () => {
    const { container } = render(
      <Markdown source="see [the docs](https://example.com/docs) now" />,
    );
    const a = container.querySelector("a");
    expect(a).not.toBeNull();
    expect(a).toHaveAttribute("href", "https://example.com/docs");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
    // Only the link text shows — the markers and URL are hidden.
    expect(a?.textContent).toBe("the docs");
    expect(container.textContent).toContain("see ");
    expect(container.textContent).toContain(" now");
    expect(container.textContent).not.toContain("https://example.com/docs");
    expect(container.textContent).not.toContain("](");
  });

  it("leaves a link inside a fenced code block as literal text", () => {
    const source = "```\n[the docs](https://example.com)\n```";
    const { container } = render(<Markdown source={source} />);
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("[the docs](https://example.com)");
  });
});
