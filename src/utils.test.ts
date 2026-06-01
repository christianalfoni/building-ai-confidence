import { parseRoute } from "./utils";

describe("parseRoute", () => {
  it("resolves / to the list view", () => {
    expect(parseRoute("/")).toEqual({ view: "list", postId: null });
  });

  it("resolves /posts and /posts/ to the list view", () => {
    expect(parseRoute("/posts")).toEqual({ view: "list", postId: null });
    expect(parseRoute("/posts/")).toEqual({ view: "list", postId: null });
  });

  it("resolves /posts/:id to the post view", () => {
    expect(parseRoute("/posts/abc123")).toEqual({ view: "post", postId: "abc123" });
  });

  it("ignores a trailing slash on a post route", () => {
    expect(parseRoute("/posts/abc123/")).toEqual({ view: "post", postId: "abc123" });
  });

  it("decodes percent-encoded ids", () => {
    expect(parseRoute("/posts/a%20b")).toEqual({ view: "post", postId: "a b" });
  });

  it("falls back to the raw segment for malformed encoding instead of throwing", () => {
    expect(parseRoute("/posts/%E0%A4%A")).toEqual({ view: "post", postId: "%E0%A4%A" });
  });
});
